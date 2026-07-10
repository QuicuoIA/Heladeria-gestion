// controllers/ventasController.js
// HU2.1 — Registrar venta | HU2.3 — Método de pago
// HU3.2 — Descuento automático de inventario
// HU2.5 — Deshacer última venta
const { pool } = require('../config/db');

/**
 * POST /api/ventas
 * HU2.1 — Registrar una venta de UN producto (modelo de la BD: 1 fila = 1 producto)
 *
 * Body: {
 *   id_producto:  number,
 *   cantidad:     number,
 *   metodo_pago:  'efectivo' | 'transferencia'   (HU2.3)
 * }
 *
 * Flujo transaccional:
 *  1. Validar que el producto existe y está activo
 *  2. Validar stock suficiente (inventario)
 *  3. Tomar el precio_venta desde la BD (nunca del cliente)
 *  4. INSERT ventas
 *  5. UPDATE inventario  → HU3.2 descuento automático
 *  6. INSERT movimientos_inventario tipo='venta'  → HU3.6 historial
 *  7. COMMIT — todo o nada
 */
async function crearVenta(req, res) {
  const { id_producto, cantidad = 1, metodo_pago = 'efectivo' } = req.body;
  const id_usuario = req.usuario.id_usuario; // viene del JWT

  // Validaciones básicas
  if (!id_producto || !Number.isInteger(Number(id_producto))) {
    return res.status(400).json({ success: false, mensaje: 'id_producto requerido.' });
  }
  if (cantidad < 1 || !Number.isInteger(Number(cantidad))) {
    return res.status(400).json({ success: false, mensaje: 'cantidad debe ser entero >= 1.' });
  }
  if (!['efectivo', 'transferencia'].includes(metodo_pago)) {
    return res.status(400).json({ success: false, mensaje: 'metodo_pago inválido.' });
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // 1. Obtener producto activo con precio oficial
    const [[producto]] = await conn.query(
      `SELECT id_producto, nombre, precio
       FROM productos
       WHERE id_producto = ? AND activo = 1`,
      [id_producto]
    );
    if (!producto) {
      await conn.rollback();
      return res.status(404).json({ success: false, mensaje: 'Producto no encontrado o inactivo.' });
    }

    // 2. Validar stock (HU3.1)
    const [[inv]] = await conn.query(
      'SELECT cantidad_actual FROM inventario WHERE id_producto = ?',
      [id_producto]
    );
    if (!inv || inv.cantidad_actual < cantidad) {
      await conn.rollback();
      return res.status(400).json({
        success: false,
        mensaje: `Stock insuficiente. Disponible: ${inv?.cantidad_actual ?? 0}`,
      });
    }

    // 3. Calcular subtotal con precio de BD
    const precio_venta = parseFloat(producto.precio);
    const subtotal     = precio_venta * cantidad;

    // 4. Insertar venta
    const [resVenta] = await conn.query(
      `INSERT INTO ventas (id_usuario, id_producto, cantidad, precio_venta, subtotal, metodo_pago)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [id_usuario, id_producto, cantidad, precio_venta, subtotal, metodo_pago]
    );
    const id_venta = resVenta.insertId;

    // 5. HU3.2 — Descontar inventario automáticamente
    await conn.query(
      'UPDATE inventario SET cantidad_actual = cantidad_actual - ? WHERE id_producto = ?',
      [cantidad, id_producto]
    );

    // 6. HU3.6 — Registrar movimiento en bitácora
    await conn.query(
      `INSERT INTO movimientos_inventario (id_producto, id_usuario, tipo, cantidad, id_venta)
       VALUES (?, ?, 'venta', ?, ?)`,
      [id_producto, id_usuario, cantidad, id_venta]
    );

    await conn.commit();

    // Leer stock actualizado para la respuesta
    const [[invActualizado]] = await conn.query(
      'SELECT cantidad_actual, cantidad_minima FROM inventario WHERE id_producto = ?',
      [id_producto]
    );

    return res.status(201).json({
      success:      true,
      mensaje:      'Venta registrada correctamente.',
      id_venta,
      producto:     producto.nombre,
      cantidad,
      precio_venta,
      subtotal,
      metodo_pago,
      stock_restante:  invActualizado.cantidad_actual,
      alerta_stock:    invActualizado.cantidad_actual <= invActualizado.cantidad_minima, // HU3.5
    });

  } catch (err) {
    await conn.rollback();
    console.error('Error en crearVenta:', err);
    return res.status(500).json({ success: false, mensaje: 'Error al registrar la venta.' });
  } finally {
    conn.release();
  }
}

/**
 * DELETE /api/ventas/:id/anular
 * HU2.5 — Deshacer última venta (soft delete + devolver stock)
 */
async function anularVenta(req, res) {
  const id_venta   = Number(req.params.id);
  const id_usuario = req.usuario.id_usuario;

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [[venta]] = await conn.query(
      'SELECT * FROM ventas WHERE id_venta = ? AND anulada = 0',
      [id_venta]
    );
    if (!venta) {
      await conn.rollback();
      return res.status(404).json({ success: false, mensaje: 'Venta no encontrada o ya anulada.' });
    }

    // Marcar como anulada (HU2.5 — no se borra físicamente)
    await conn.query(
      'UPDATE ventas SET anulada = 1, anulada_en = NOW() WHERE id_venta = ?',
      [id_venta]
    );

    // Devolver stock
    await conn.query(
      'UPDATE inventario SET cantidad_actual = cantidad_actual + ? WHERE id_producto = ?',
      [venta.cantidad, venta.id_producto]
    );

    // Registrar movimiento de ajuste
    await conn.query(
      `INSERT INTO movimientos_inventario (id_producto, id_usuario, tipo, cantidad, nota, id_venta)
       VALUES (?, ?, 'ajuste_alta', ?, 'Anulación de venta', ?)`,
      [venta.id_producto, id_usuario, venta.cantidad, id_venta]
    );

    await conn.commit();

    return res.status(200).json({
      success: true,
      mensaje: `Venta #${id_venta} anulada. Stock restaurado.`,
    });

  } catch (err) {
    await conn.rollback();
    console.error('Error en anularVenta:', err);
    return res.status(500).json({ success: false, mensaje: 'Error al anular la venta.' });
  } finally {
    conn.release();
  }
}

/**
 * GET /api/ventas/hoy
 * HU2.6 — Historial de ventas del día actual
 */
async function getVentasHoy(req, res) {
  try {
    const [ventas] = await pool.query(`
      SELECT
        v.id_venta,
        v.cantidad,
        v.precio_venta,
        v.subtotal,
        v.metodo_pago,
        v.anulada,
        v.fecha_venta,
        p.nombre      AS producto,
        p.tamanio,
        u.nombre      AS cajero
      FROM ventas v
      JOIN productos p ON p.id_producto = v.id_producto
      JOIN usuarios  u ON u.id_usuario  = v.id_usuario
      WHERE DATE(v.fecha_venta) = CURDATE()
      ORDER BY v.fecha_venta DESC
    `);

    const total_dia = ventas
      .filter(v => !v.anulada)
      .reduce((acc, v) => acc + parseFloat(v.subtotal), 0);

    return res.status(200).json({
      success: true,
      total_dia:    parseFloat(total_dia.toFixed(2)),
      num_ventas:   ventas.filter(v => !v.anulada).length,
      ventas,
    });

  } catch (err) {
    console.error('Error en getVentasHoy:', err);
    return res.status(500).json({ success: false, mensaje: 'Error al obtener ventas del día.' });
  }
}

module.exports = { crearVenta, anularVenta, getVentasHoy };
