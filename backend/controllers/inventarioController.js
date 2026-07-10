// controllers/inventarioController.js
// HU3.5 — Alertas de stock bajo
// Semana 5

const { pool } = require('../config/db');

/**
 * GET /api/inventario/alertas
 * HU3.5 — Devuelve productos cuyo stock está por debajo
 * de su cantidad_minima (alerta de stock bajo).
 */
async function getAlertasStock(req, res) {
  try {
    const [productos] = await pool.query(`
      SELECT
        i.id_inventario,
        i.cantidad_actual,
        i.cantidad_minima,
        (i.cantidad_minima - i.cantidad_actual) AS faltante,
        p.id_producto,
        p.nombre,
        p.tamanio,
        c.nombre  AS categoria
      FROM inventario i
      JOIN productos  p ON p.id_producto  = i.id_producto
      JOIN categorias c ON c.id_categoria = p.id_categoria
      WHERE i.cantidad_actual <= i.cantidad_minima
        AND p.activo = 1
      ORDER BY faltante DESC, c.nombre ASC, p.nombre ASC
    `);

    return res.status(200).json({
      success:        true,
      total_alertas:  productos.length,
      productos,
    });

  } catch (err) {
    console.error('Error en getAlertasStock:', err);
    return res.status(500).json({ success: false, mensaje: 'Error al obtener alertas de stock.' });
  }
}

/**
 * GET /api/inventario
 * HU3.1 — Stock completo de todos los productos activos
 */
async function getInventario(req, res) {
  try {
    const [productos] = await pool.query(`
      SELECT
        i.id_inventario,
        i.cantidad_actual,
        i.cantidad_minima,
        p.id_producto,
        p.nombre,
        p.tamanio,
        c.nombre  AS categoria,
        (i.cantidad_actual <= i.cantidad_minima) AS alerta
      FROM inventario i
      JOIN productos  p ON p.id_producto  = i.id_producto
      JOIN categorias c ON c.id_categoria = p.id_categoria
      WHERE p.activo = 1
      ORDER BY c.nombre ASC, p.nombre ASC
    `);

    return res.status(200).json({
      success:   true,
      inventario: productos,
    });

  } catch (err) {
    console.error('Error en getInventario:', err);
    return res.status(500).json({ success: false, mensaje: 'Error al obtener inventario.' });
  }
}

module.exports = { getAlertasStock, getInventario };
