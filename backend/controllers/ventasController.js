// controllers/ventasController.js
// Semana 4 — Refactorización: eliminación de code smells
// - Variables declaradas con const/let (no var)
// - Sin funciones duplicadas
// - Validaciones extraídas a helpers
// - Auditoría integrada en anularVenta (HU Seguridad)
// HU2.1 · HU2.3 · HU2.5 · HU2.6 · HU3.2 · HU3.6

const { pool }      = require('../config/db');
const auditoria     = require('../services/auditoriaService');

// ── Helper: validar body de crearVenta ───────────────────────
function validarBodyVenta(body) {
  const { id_producto, cantidad = 1, metodo_pago = 'efectivo' } = body;
  if (!id_producto || !Number.isInteger(Number(id_producto))) {
    return 'id_producto debe ser un entero válido.';
  }
  if (!Number.isInteger(Number(cantidad)) || Number(cantidad) < 1) {
    return 'cantidad debe ser un entero mayor a 0.';
  }
  if (!['efectivo', 'transferencia'].includes(metodo_pago)) {
    return 'metodo_pago inválido. Usar: efectivo | transferencia';
  }
  return null; // sin errores
}

// ── Helper: obtener producto activo con stock ─────────────────
async function obtenerProductoConStock(conn, id_producto, cantidad) {
  const [[producto]] = await conn.query(
    'SELECT id_producto, nombre, precio FROM productos WHERE id_producto = ? AND activo = 1',
    [id_producto]
  );
  if (!producto) return { error: 'Producto no encontrado o inactivo.' };

  const [[inv]] = await conn.query(
    'SELECT cantidad_actual, cantidad_minima FROM inventario WHERE id_producto = ?',
    [id_producto]
  );
  if (!inv || inv.cantidad_actual < cantidad) {
    return { error: `Stock insuficiente. Disponible: ${inv?.cantidad_actual ?? 0}` };
  }
  return { producto, inv };
}

/**
 * POST /api/ventas — HU2.1
 */
async function crearVenta(req, res) {
  const error = validarBodyVenta(req.body);
  if (error) return res.status(400).json({ success: false, mensaje: error });

  const { id_producto, cantidad = 1, metodo_pago = 'efectivo' } = req.body;
  const id_usuario = req.usuario.id_usuario;

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const resultado = await obtenerProductoConStock(conn, Number(id_producto), Number(cantidad));
    if (resultado.error) {
      await conn.rollback();
      return res.status(400).json({ success: false, mensaje: resultado.error });
    }

    const { producto, inv } = resultado;
    const precio_venta = parseFloat(producto.precio);
    const subtotal     = precio_venta * Number(cantidad);

    // INSERT venta
    const [resVenta] = await conn.query(
      `INSERT INTO ventas (id_usuario, id_producto, cantidad, precio_venta, subtotal, metodo_pago)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [id_usuario, id_producto, cantidad, precio_venta, subtotal, metodo_pago]
    );
    const id_venta = resVenta.insertId;

    // HU3.2 — Descuento automático de inventario
    await conn.query(
      'UPDATE inventario SET cantidad_actual = cantidad_actual - ? WHERE id_producto = ?',
      [cantidad, id_producto]
    );

    // HU3.6 — Movimiento en bitácora
    await conn.query(
      `INSERT INTO movimientos_inventario (id_producto, id_usuario, tipo, cantidad, id_venta)
       VALUES (?, ?, 'venta', ?, ?)`,
      [id_producto, id_usuario, cantidad, id_venta]
    );

    await conn.commit();

    const stock_restante = inv.cantidad_actual - Number(cantidad);

    return res.status(201).json({
      success:         true,
      mensaje:         'Venta registrada correctamente.',
      id_venta,
      producto:        producto.nombre,
      cantidad:        Number(cantidad),
      precio_venta,
      subtotal,
      metodo_pago,
      stock_restante,
      alerta_stock:    stock_restante <= inv.cantidad_minima,
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
 * DELETE /api/ventas/:id/anular — HU2.5
 * Con log de auditoría (Semana 4)
 */
async function anularVenta(req, res) {
  const id_venta   = Number(req.params.id);
  const id_usuario = req.usuario.id_usuario;
  const ip_origen  = req.ip;

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

    // Marcar como anulada
    await conn.query(
      'UPDATE ventas SET anulada = 1, anulada_en = NOW() WHERE id_venta = ?',
      [id_venta]
    );

    // Devolver stock
    await conn.query(
      'UPDATE inventario SET cantidad_actual = cantidad_actual + ? WHERE id_producto = ?',
      [venta.cantidad, venta.id_producto]
    );

    // Movimiento ajuste_alta
    await conn.query(
      `INSERT INTO movimientos_inventario (id_producto, id_usuario, tipo, cantidad, nota, id_venta)
       VALUES (?, ?, 'ajuste_alta', ?, 'Anulación de venta', ?)`,
      [venta.id_producto, id_usuario, venta.cantidad, id_venta]
    );

    await conn.commit();

    // Auditoría silenciosa (Semana 4)
    await auditoria.registrar({
      id_usuario,
      tabla:       'ventas',
      accion:      'DELETE',
      id_registro: id_venta,
      detalle:     venta,
      ip_origen,
    });

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
 * GET /api/ventas/hoy — HU2.6
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
        p.nombre   AS producto,
        p.tamanio,
        u.nombre   AS cajero
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
      success:    true,
      total_dia:  parseFloat(total_dia.toFixed(2)),
      num_ventas: ventas.filter(v => !v.anulada).length,
      ventas,
    });

  } catch (err) {
    console.error('Error en getVentasHoy:', err);
    return res.status(500).json({ success: false, mensaje: 'Error al obtener ventas del día.' });
  }
}

module.exports = { crearVenta, anularVenta, getVentasHoy };
