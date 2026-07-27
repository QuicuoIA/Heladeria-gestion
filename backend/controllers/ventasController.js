// ============================================================
// ARCHIVO: backend/controllers/ventasController.js
// DESCRIPCIÓN: Controlador de ventas — crear, anular y consultar
//              ventas del día.
// REGLAS: precio_venta siempre de BD, transacciones con rollback.
// ============================================================

const pool = require('../config/database');
const auditoriaService = require('../services/auditoriaService');

// ── Helper interno de validación ────────────────────────────
const validarBodyVenta = ({ id_producto, cantidad, metodo_pago }) => {
  const errores = [];

  if (!id_producto || !Number.isInteger(Number(id_producto)) || Number(id_producto) <= 0) {
    errores.push('id_producto debe ser un entero positivo.');
  }
  if (!cantidad || !Number.isInteger(Number(cantidad)) || Number(cantidad) <= 0) {
    errores.push('cantidad debe ser un entero positivo.');
  }
  if (!metodo_pago || !['efectivo', 'transferencia'].includes(metodo_pago)) {
    errores.push('metodo_pago debe ser "efectivo" o "transferencia".');
  }

  return errores;
};

// ── POST /api/ventas ─────────────────────────────────────────
const crearVenta = async (req, res) => {
  const { id_producto, cantidad, metodo_pago } = req.body;
  const id_usuario = req.usuario.id_usuario;

  // Validación de body
  const errores = validarBodyVenta({ id_producto, cantidad, metodo_pago });
  if (errores.length > 0) {
    return res.status(400).json({ success: false, mensaje: errores.join(' ') });
  }

  const cantidadNum = Number(cantidad);
  const id_productoNum = Number(id_producto);

  let conn;
  try {
    conn = await pool.getConnection();
    await conn.beginTransaction();

    // 1. Obtener precio desde BD (nunca del cliente)
    const [productos] = await conn.execute(
      `SELECT id_producto, nombre, tamanio, precio, activo
       FROM productos WHERE id_producto = ? LIMIT 1`,
      [id_productoNum]
    );

    if (productos.length === 0) {
      await conn.rollback();
      return res.status(404).json({ success: false, mensaje: 'Producto no encontrado.' });
    }

    const producto = productos[0];

    if (!producto.activo) {
      await conn.rollback();
      return res.status(400).json({ success: false, mensaje: 'El producto está inactivo.' });
    }

    const precio_venta = parseFloat(producto.precio);
    const subtotal = precio_venta * cantidadNum;

    // 2. Validar stock en inventario
    const [invRows] = await conn.execute(
      `SELECT id_inventario, cantidad_actual, cantidad_minima
       FROM inventario WHERE id_producto = ? LIMIT 1`,
      [id_productoNum]
    );

    if (invRows.length === 0) {
      await conn.rollback();
      return res.status(400).json({ success: false, mensaje: 'El producto no tiene registro de inventario.' });
    }

    const inv = invRows[0];
    if (inv.cantidad_actual < cantidadNum) {
      await conn.rollback();
      return res.status(400).json({
        success: false,
        mensaje: `Stock insuficiente. Disponible: ${inv.cantidad_actual} piezas.`
      });
    }

    // 3. INSERT en ventas
    const [resultVenta] = await conn.execute(
      `INSERT INTO ventas (id_usuario, id_producto, cantidad, precio_venta, subtotal, metodo_pago)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [id_usuario, id_productoNum, cantidadNum, precio_venta, subtotal, metodo_pago]
    );
    const id_venta = resultVenta.insertId;

    // 4. Descontar inventario
    const nuevoStock = inv.cantidad_actual - cantidadNum;
    await conn.execute(
      `UPDATE inventario SET cantidad_actual = ? WHERE id_producto = ?`,
      [nuevoStock, id_productoNum]
    );

    // 5. Registrar movimiento de inventario tipo 'venta'
    await conn.execute(
      `INSERT INTO movimientos_inventario
         (id_producto, id_usuario, tipo, cantidad, nota, id_venta)
       VALUES (?, ?, 'venta', ?, 'Venta registrada en POS', ?)`,
      [id_productoNum, id_usuario, cantidadNum, id_venta]
    );

    await conn.commit();

    const alerta_stock = nuevoStock <= inv.cantidad_minima;

    return res.status(201).json({
      success: true,
      mensaje: 'Venta registrada correctamente.',
      datos: {
        id_venta,
        producto: `${producto.nombre}${producto.tamanio ? ' — ' + producto.tamanio : ''}`,
        cantidad: cantidadNum,
        precio_venta,
        subtotal,
        metodo_pago,
        stock_restante: nuevoStock,
        alerta_stock
      }
    });
  } catch (err) {
    if (conn) await conn.rollback();
    console.error('[VentasController.crearVenta]', err);
    return res.status(500).json({ success: false, mensaje: 'Error interno al registrar la venta.' });
  } finally {
    if (conn) conn.release();
  }
};

// ── DELETE /api/ventas/:id/anular ────────────────────────────
const anularVenta = async (req, res) => {
  const id_venta = Number(req.params.id);
  const id_usuario = req.usuario.id_usuario;
  const ip_origen = req.ip || req.connection.remoteAddress || null;

  if (!Number.isInteger(id_venta) || id_venta <= 0) {
    return res.status(400).json({ success: false, mensaje: 'ID de venta inválido.' });
  }

  let conn;
  try {
    conn = await pool.getConnection();
    await conn.beginTransaction();

    // 1. Obtener la venta
    const [ventas] = await conn.execute(
      `SELECT id_venta, id_producto, id_usuario, cantidad, precio_venta, subtotal, anulada
       FROM ventas WHERE id_venta = ? LIMIT 1`,
      [id_venta]
    );

    if (ventas.length === 0) {
      await conn.rollback();
      return res.status(404).json({ success: false, mensaje: 'Venta no encontrada.' });
    }

    const venta = ventas[0];

    if (venta.anulada) {
      await conn.rollback();
      return res.status(400).json({ success: false, mensaje: 'La venta ya fue anulada.' });
    }

    // 2. Soft delete
    await conn.execute(
      `UPDATE ventas SET anulada = 1, anulada_en = NOW() WHERE id_venta = ?`,
      [id_venta]
    );

    // 3. Devolver stock
    await conn.execute(
      `UPDATE inventario
       SET cantidad_actual = cantidad_actual + ?
       WHERE id_producto = ?`,
      [venta.cantidad, venta.id_producto]
    );

    // 4. Movimiento de inventario tipo 'ajuste_alta'
    await conn.execute(
      `INSERT INTO movimientos_inventario
         (id_producto, id_usuario, tipo, cantidad, nota, id_venta)
       VALUES (?, ?, 'ajuste_alta', ?, 'Anulación de venta', ?)`,
      [venta.id_producto, id_usuario, venta.cantidad, id_venta]
    );

    await conn.commit();

    // Auditoría (después del commit, silenciosa)
    auditoriaService.registrar({
      id_usuario,
      tabla: 'ventas',
      accion: 'DELETE',
      id_registro: id_venta,
      detalle: { id_producto: venta.id_producto, cantidad: venta.cantidad, subtotal: venta.subtotal },
      ip_origen
    });

    return res.status(200).json({
      success: true,
      mensaje: 'Venta anulada correctamente.',
      id_venta
    });
  } catch (err) {
    if (conn) await conn.rollback();
    console.error('[VentasController.anularVenta]', err);
    return res.status(500).json({ success: false, mensaje: 'Error interno al anular la venta.' });
  } finally {
    if (conn) conn.release();
  }
};

// ── GET /api/ventas/hoy ──────────────────────────────────────
const getVentasHoy = async (req, res) => {
  try {
    const [ventas] = await pool.execute(
      `SELECT
         v.id_venta,
         v.cantidad,
         v.precio_venta,
         v.subtotal,
         v.metodo_pago,
         v.anulada,
         v.fecha_venta,
         p.nombre AS producto,
         p.tamanio,
         u.nombre AS cajero
       FROM ventas v
       JOIN productos  p ON p.id_producto = v.id_producto
       JOIN usuarios   u ON u.id_usuario  = v.id_usuario
       WHERE DATE(v.fecha_venta) = CURDATE()
       ORDER BY v.fecha_venta DESC`
    );

    const total_dia = ventas
      .filter(v => !v.anulada)
      .reduce((acc, v) => acc + parseFloat(v.subtotal), 0);

    return res.status(200).json({
      success: true,
      total_dia: parseFloat(total_dia.toFixed(2)),
      num_ventas: ventas.filter(v => !v.anulada).length,
      ventas
    });
  } catch (err) {
    console.error('[VentasController.getVentasHoy]', err);
    return res.status(500).json({ success: false, mensaje: 'Error interno al obtener las ventas.' });
  }
};

module.exports = { crearVenta, anularVenta, getVentasHoy };
