// ============================================================
// ARCHIVO: backend/controllers/dashboardController.js
// DESCRIPCIÓN: Controlador del dashboard — métricas y reportes
//              de ventas para dueño y encargado.
// ============================================================

const pool = require('../config/database');

// ── GET /api/dashboard/sabores-vendidos?dias=7 ──────────────
const getSaboresVendidos = async (req, res) => {
  try {
    const dias = parseInt(req.query.dias) || 7;

    const [rows] = await pool.execute(
      `SELECT
         p.id_producto,
         p.nombre,
         p.tamanio,
         c.nombre            AS categoria,
         SUM(v.cantidad)     AS total_piezas,
         SUM(v.subtotal)     AS total_dinero,
         COUNT(v.id_venta)   AS num_ventas
       FROM ventas v
       JOIN productos  p ON p.id_producto  = v.id_producto
       JOIN categorias c ON c.id_categoria = p.id_categoria
       WHERE v.anulada = 0
         AND v.fecha_venta >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
       GROUP BY p.id_producto, p.nombre, p.tamanio, c.nombre
       ORDER BY total_piezas DESC
       LIMIT 10`,
      [dias]
    );

    return res.status(200).json({ success: true, dias, sabores: rows });
  } catch (err) {
    console.error('[DashboardController.getSaboresVendidos]', err);
    return res.status(500).json({ success: false, mensaje: 'Error al obtener sabores vendidos.' });
  }
};

// ── GET /api/dashboard/total-mensual?mes&anio ───────────────
const getTotalMensual = async (req, res) => {
  try {
    const hoy = new Date();
    const mes = parseInt(req.query.mes) || hoy.getMonth() + 1;
    const anio = parseInt(req.query.anio) || hoy.getFullYear();

    // Usar rango de fechas para aprovechar índices
    const fechaInicio = `${anio}-${String(mes).padStart(2, '0')}-01`;
    const fechaFin = new Date(anio, mes, 1); // primer día del mes siguiente
    const fechaFinStr = `${fechaFin.getFullYear()}-${String(fechaFin.getMonth() + 1).padStart(2, '0')}-01`;

    const [rows] = await pool.execute(
      `SELECT
         DATE(fecha_venta)                                                  AS dia,
         COUNT(id_venta)                                                    AS num_ventas,
         SUM(subtotal)                                                      AS total_dia,
         SUM(CASE WHEN metodo_pago = 'efectivo'      THEN subtotal ELSE 0 END) AS efectivo,
         SUM(CASE WHEN metodo_pago = 'transferencia' THEN subtotal ELSE 0 END) AS transferencia
       FROM ventas
       WHERE anulada = 0
         AND fecha_venta >= ?
         AND fecha_venta  < ?
       GROUP BY DATE(fecha_venta)
       ORDER BY dia ASC`,
      [fechaInicio, fechaFinStr]
    );

    return res.status(200).json({ success: true, mes, anio, dias: rows });
  } catch (err) {
    console.error('[DashboardController.getTotalMensual]', err);
    return res.status(500).json({ success: false, mensaje: 'Error al obtener el total mensual.' });
  }
};

// ── GET /api/dashboard/resumen-hoy ──────────────────────────
const getResumenHoy = async (req, res) => {
  try {
    // Totales del día
    const [[totales]] = await pool.execute(
      `SELECT
         COUNT(id_venta)                                                        AS num_ventas,
         COALESCE(SUM(subtotal), 0)                                            AS total_dia,
         COALESCE(SUM(CASE WHEN metodo_pago = 'efectivo'      THEN subtotal ELSE 0 END), 0) AS efectivo,
         COALESCE(SUM(CASE WHEN metodo_pago = 'transferencia' THEN subtotal ELSE 0 END), 0) AS transferencia
       FROM ventas
       WHERE anulada = 0
         AND DATE(fecha_venta) = CURDATE()`
    );

    // Productos bajo stock mínimo
    const [[{ productos_bajo_stock }]] = await pool.execute(
      `SELECT COUNT(*) AS productos_bajo_stock
       FROM inventario i
       JOIN productos p ON p.id_producto = i.id_producto
       WHERE i.cantidad_actual <= i.cantidad_minima
         AND p.activo = 1`
    );

    return res.status(200).json({
      success: true,
      resumen: {
        num_ventas: totales.num_ventas,
        total_dia: parseFloat(totales.total_dia),
        efectivo: parseFloat(totales.efectivo),
        transferencia: parseFloat(totales.transferencia),
        productos_bajo_stock
      }
    });
  } catch (err) {
    console.error('[DashboardController.getResumenHoy]', err);
    return res.status(500).json({ success: false, mensaje: 'Error al obtener el resumen del día.' });
  }
};

// ── GET /api/dashboard/ventas-por-categoria?dias=7 ──────────
const getVentasPorCategoria = async (req, res) => {
  try {
    const dias = parseInt(req.query.dias) || 7;

    const [rows] = await pool.execute(
      `SELECT
         c.id_categoria,
         c.nombre            AS categoria,
         SUM(v.cantidad)     AS total_piezas,
         SUM(v.subtotal)     AS total_dinero,
         COUNT(v.id_venta)   AS num_ventas
       FROM ventas v
       JOIN productos  p ON p.id_producto  = v.id_producto
       JOIN categorias c ON c.id_categoria = p.id_categoria
       WHERE v.anulada = 0
         AND v.fecha_venta >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
       GROUP BY c.id_categoria, c.nombre
       ORDER BY total_dinero DESC`,
      [dias]
    );

    return res.status(200).json({ success: true, dias, categorias: rows });
  } catch (err) {
    console.error('[DashboardController.getVentasPorCategoria]', err);
    return res.status(500).json({ success: false, mensaje: 'Error al obtener ventas por categoría.' });
  }
};

module.exports = {
  getSaboresVendidos,
  getTotalMensual,
  getResumenHoy,
  getVentasPorCategoria
};
