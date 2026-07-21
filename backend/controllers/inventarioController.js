// ============================================================
// ARCHIVO: backend/controllers/inventarioController.js
// DESCRIPCIÓN: Controlador de inventario — stock general y alertas
// ============================================================

const pool = require('../config/database');

// ── GET /api/inventario ──────────────────────────────────────
const getInventario = async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT
         i.id_inventario,
         i.id_producto,
         p.nombre,
         p.tamanio,
         c.nombre            AS categoria,
         i.cantidad_actual,
         i.cantidad_minima,
         i.actualizado_en,
         (i.cantidad_actual <= i.cantidad_minima) AS alerta
       FROM inventario i
       JOIN productos  p ON p.id_producto  = i.id_producto
       JOIN categorias c ON c.id_categoria = p.id_categoria
       WHERE p.activo = 1
       ORDER BY c.nombre ASC, p.nombre ASC`
    );

    return res.status(200).json({ success: true, inventario: rows });
  } catch (err) {
    console.error('[InventarioController.getInventario]', err);
    return res.status(500).json({ success: false, mensaje: 'Error al obtener el inventario.' });
  }
};

// ── GET /api/inventario/alertas ──────────────────────────────
const getAlertasStock = async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT
         i.id_inventario,
         i.id_producto,
         p.nombre,
         p.tamanio,
         c.nombre                                    AS categoria,
         i.cantidad_actual,
         i.cantidad_minima,
         (i.cantidad_minima - i.cantidad_actual)     AS faltante,
         i.actualizado_en
       FROM inventario i
       JOIN productos  p ON p.id_producto  = i.id_producto
       JOIN categorias c ON c.id_categoria = p.id_categoria
       WHERE i.cantidad_actual <= i.cantidad_minima
         AND p.activo = 1
       ORDER BY faltante DESC`
    );

    return res.status(200).json({ success: true, alertas: rows });
  } catch (err) {
    console.error('[InventarioController.getAlertasStock]', err);
    return res.status(500).json({ success: false, mensaje: 'Error al obtener las alertas de stock.' });
  }
};

module.exports = { getInventario, getAlertasStock };
