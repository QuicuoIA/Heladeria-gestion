// controllers/dashboardController.js
// HU4.1 — Dashboard de administrador
// Semana 4 — Consultas con JOIN, GROUP BY, SUM()

const { pool } = require('../config/db');

/**
 * GET /api/dashboard/sabores-vendidos
 * HU4.4 — Ranking de productos más vendidos (últimos 7 días)
 * Aplica: JOIN productos+categorias+ventas, GROUP BY, SUM(), ORDER BY
 */
async function getSaboresVendidos(req, res) {
  const dias = parseInt(req.query.dias) || 7;

  try {
    const [rows] = await pool.query(`
      SELECT
        p.id_producto,
        p.nombre,
        p.tamanio,
        c.nombre                    AS categoria,
        SUM(v.cantidad)             AS total_piezas,
        SUM(v.subtotal)             AS total_dinero,
        COUNT(v.id_venta)           AS num_ventas
      FROM ventas v
      JOIN productos  p ON p.id_producto  = v.id_producto
      JOIN categorias c ON c.id_categoria = p.id_categoria
      WHERE v.anulada = 0
        AND v.fecha_venta >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
      GROUP BY p.id_producto, p.nombre, p.tamanio, c.nombre
      ORDER BY total_piezas DESC
      LIMIT 10
    `, [dias]);

    return res.status(200).json({
      success: true,
      periodo_dias: dias,
      sabores: rows.map(r => ({
        ...r,
        total_dinero: parseFloat(r.total_dinero),
      })),
    });

  } catch (err) {
    console.error('Error en getSaboresVendidos:', err);
    return res.status(500).json({ success: false, mensaje: 'Error al obtener sabores vendidos.' });
  }
}

/**
 * GET /api/dashboard/total-mensual
 * HU4.1/HU4.3 — Total vendido agrupado por día del mes actual
 * Aplica: GROUP BY DATE(), SUM(), COUNT()
 */
async function getTotalMensual(req, res) {
  // Permite consultar mes/año específico: ?mes=6&anio=2025
  const mes  = parseInt(req.query.mes)  || new Date().getMonth() + 1;
  const anio = parseInt(req.query.anio) || new Date().getFullYear();

  try {
    const [rows] = await pool.query(`
      SELECT
        DATE(v.fecha_venta)         AS dia,
        COUNT(v.id_venta)           AS num_ventas,
        SUM(v.subtotal)             AS total_dia,
        SUM(CASE WHEN v.metodo_pago = 'efectivo'       THEN v.subtotal ELSE 0 END) AS efectivo,
        SUM(CASE WHEN v.metodo_pago = 'transferencia'  THEN v.subtotal ELSE 0 END) AS transferencia
      FROM ventas v
      WHERE v.anulada = 0
        AND MONTH(v.fecha_venta) = ?
        AND YEAR(v.fecha_venta)  = ?
      GROUP BY DATE(v.fecha_venta)
      ORDER BY dia ASC
    `, [mes, anio]);

    const total_mes = rows.reduce((acc, r) => acc + parseFloat(r.total_dia), 0);

    return res.status(200).json({
      success: true,
      mes,
      anio,
      total_mes:  parseFloat(total_mes.toFixed(2)),
      dias: rows.map(r => ({
        ...r,
        total_dia:     parseFloat(r.total_dia),
        efectivo:      parseFloat(r.efectivo),
        transferencia: parseFloat(r.transferencia),
      })),
    });

  } catch (err) {
    console.error('Error en getTotalMensual:', err);
    return res.status(500).json({ success: false, mensaje: 'Error al obtener total mensual.' });
  }
}

/**
 * GET /api/dashboard/resumen-hoy
 * HU4.1 — Resumen general del día para el dashboard
 */
async function getResumenHoy(req, res) {
  try {
    const [[resumen]] = await pool.query(`
      SELECT
        COUNT(v.id_venta)                                           AS num_ventas,
        COALESCE(SUM(v.subtotal), 0)                               AS total_dia,
        COALESCE(SUM(CASE WHEN v.metodo_pago = 'efectivo'      THEN v.subtotal ELSE 0 END), 0) AS efectivo,
        COALESCE(SUM(CASE WHEN v.metodo_pago = 'transferencia' THEN v.subtotal ELSE 0 END), 0) AS transferencia
      FROM ventas v
      WHERE v.anulada = 0
        AND DATE(v.fecha_venta) = CURDATE()
    `);

    const [[alertas]] = await pool.query(`
      SELECT COUNT(*) AS productos_bajo_stock
      FROM inventario
      WHERE cantidad_actual <= cantidad_minima
    `);

    return res.status(200).json({
      success: true,
      hoy: {
        num_ventas:          resumen.num_ventas,
        total_dia:           parseFloat(resumen.total_dia),
        efectivo:            parseFloat(resumen.efectivo),
        transferencia:       parseFloat(resumen.transferencia),
        productos_bajo_stock: alertas.productos_bajo_stock,
      },
    });

  } catch (err) {
    console.error('Error en getResumenHoy:', err);
    return res.status(500).json({ success: false, mensaje: 'Error al obtener resumen del día.' });
  }
}

/**
 * GET /api/dashboard/ventas-por-categoria
 * HU4.5 — Desglose de ventas por categoría
 */
async function getVentasPorCategoria(req, res) {
  const dias = parseInt(req.query.dias) || 7;

  try {
    const [rows] = await pool.query(`
      SELECT
        c.id_categoria,
        c.nombre                  AS categoria,
        SUM(v.cantidad)           AS total_piezas,
        SUM(v.subtotal)           AS total_dinero,
        COUNT(v.id_venta)         AS num_ventas
      FROM ventas v
      JOIN productos  p ON p.id_producto  = v.id_producto
      JOIN categorias c ON c.id_categoria = p.id_categoria
      WHERE v.anulada = 0
        AND v.fecha_venta >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
      GROUP BY c.id_categoria, c.nombre
      ORDER BY total_dinero DESC
    `, [dias]);

    return res.status(200).json({
      success: true,
      periodo_dias: dias,
      categorias: rows.map(r => ({
        ...r,
        total_dinero: parseFloat(r.total_dinero),
      })),
    });

  } catch (err) {
    console.error('Error en getVentasPorCategoria:', err);
    return res.status(500).json({ success: false, mensaje: 'Error al obtener ventas por categoría.' });
  }
}

module.exports = {
  getSaboresVendidos,
  getTotalMensual,
  getResumenHoy,
  getVentasPorCategoria,
};
