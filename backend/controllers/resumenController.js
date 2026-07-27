// ============================================================
// ARCHIVO: backend/controllers/resumenController.js
// DESCRIPCIÓN: Controlador de resumen del día con enlace WhatsApp
// ============================================================

const pool = require('../config/database');

// ── GET /api/resumen/dia?fecha=YYYY-MM-DD ────────────────────
const getResumenDia = async (req, res) => {
  try {
    const fecha = req.query.fecha || new Date().toISOString().slice(0, 10);

    // Validar formato de fecha
    if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
      return res.status(400).json({ success: false, mensaje: 'Formato de fecha inválido. Use YYYY-MM-DD.' });
    }

    // Totales del día con COALESCE para evitar NULL
    const [[totales]] = await pool.execute(
      `SELECT
         COALESCE(COUNT(id_venta), 0)                                               AS num_ventas,
         COALESCE(SUM(subtotal), 0)                                                 AS total_dia,
         COALESCE(SUM(CASE WHEN metodo_pago = 'efectivo'      THEN subtotal ELSE 0 END), 0) AS efectivo,
         COALESCE(SUM(CASE WHEN metodo_pago = 'transferencia' THEN subtotal ELSE 0 END), 0) AS transferencia
       FROM ventas
       WHERE anulada = 0
         AND DATE(fecha_venta) = ?`,
      [fecha]
    );

    // Top 5 productos del día
    const [top5] = await pool.execute(
      `SELECT
         p.nombre,
         p.tamanio,
         SUM(v.cantidad)   AS total_piezas,
         SUM(v.subtotal)   AS total_dinero
       FROM ventas v
       JOIN productos p ON p.id_producto = v.id_producto
       WHERE v.anulada = 0
         AND DATE(v.fecha_venta) = ?
       GROUP BY p.id_producto, p.nombre, p.tamanio
       ORDER BY total_piezas DESC
       LIMIT 5`,
      [fecha]
    );

    // Construir mensaje WhatsApp con emojis
    const totalFmt = parseFloat(totales.total_dia).toFixed(2);
    const efectivoFmt = parseFloat(totales.efectivo).toFixed(2);
    const transferenciaFmt = parseFloat(totales.transferencia).toFixed(2);

    let mensaje = `🍦 *Resumen Nevería — ${fecha}*\n\n`;
    mensaje += `📦 Ventas: ${totales.num_ventas}\n`;
    mensaje += `💰 Total: $${totalFmt}\n`;
    mensaje += `💵 Efectivo: $${efectivoFmt}\n`;
    mensaje += `📲 Transferencia: $${transferenciaFmt}\n\n`;

    if (top5.length > 0) {
      mensaje += `🏆 *Top productos:*\n`;
      top5.forEach((p, i) => {
        const nombre = p.tamanio ? `${p.nombre} (${p.tamanio})` : p.nombre;
        mensaje += `${i + 1}. ${nombre} — ${p.total_piezas} pzs ($${parseFloat(p.total_dinero).toFixed(2)})\n`;
      });
    }

    const adminPhone = process.env.WHATSAPP_ADMIN || '';
    const baseUrl = adminPhone ? `https://wa.me/${adminPhone}` : 'https://wa.me/';
    const whatsappUrl = `${baseUrl}?text=${encodeURIComponent(mensaje)}`;

    return res.status(200).json({
      success: true,
      fecha,
      resumen: {
        num_ventas: totales.num_ventas,
        total_dia: parseFloat(totales.total_dia),
        efectivo: parseFloat(totales.efectivo),
        transferencia: parseFloat(totales.transferencia)
      },
      top5,
      whatsapp_url: whatsappUrl
    });
  } catch (err) {
    console.error('[ResumenController.getResumenDia]', err);
    return res.status(500).json({ success: false, mensaje: 'Error al obtener el resumen del día.' });
  }
};

module.exports = { getResumenDia };
