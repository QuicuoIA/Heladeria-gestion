// controllers/resumenController.js
// HU2.7 — Resumen diario + enlace WhatsApp para admin
// Semana 5

const { pool } = require('../config/db');

/**
 * GET /api/resumen/dia
 * Calcula el total vendido en el día y genera el mensaje
 * listo para enviar por WhatsApp al administrador.
 *
 * Query param opcional: ?fecha=2025-06-15 (default: hoy)
 */
async function getResumenDia(req, res) {
  const fecha = req.query.fecha || new Date().toISOString().split('T')[0];

  try {
    // Total del día por método de pago
    const [[totales]] = await pool.query(`
      SELECT
        COUNT(id_venta)                                                        AS num_ventas,
        COALESCE(SUM(subtotal), 0)                                             AS total_dia,
        COALESCE(SUM(CASE WHEN metodo_pago = 'efectivo'      THEN subtotal ELSE 0 END), 0) AS efectivo,
        COALESCE(SUM(CASE WHEN metodo_pago = 'transferencia' THEN subtotal ELSE 0 END), 0) AS transferencia
      FROM ventas
      WHERE anulada = 0
        AND DATE(fecha_venta) = ?
    `, [fecha]);

    // Top 5 productos del día
    const [topProductos] = await pool.query(`
      SELECT
        p.nombre,
        p.tamanio,
        SUM(v.cantidad)  AS piezas,
        SUM(v.subtotal)  AS subtotal
      FROM ventas v
      JOIN productos p ON p.id_producto = v.id_producto
      WHERE v.anulada = 0
        AND DATE(v.fecha_venta) = ?
      GROUP BY p.id_producto, p.nombre, p.tamanio
      ORDER BY piezas DESC
      LIMIT 5
    `, [fecha]);

    const total_dia     = parseFloat(totales.total_dia);
    const efectivo      = parseFloat(totales.efectivo);
    const transferencia = parseFloat(totales.transferencia);

    // Construir mensaje para WhatsApp
    const fechaFormato = new Date(fecha + 'T12:00:00').toLocaleDateString('es-MX', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    });

    let mensaje = `🍦 *Resumen Nevería — ${fechaFormato}*\n\n`;
    mensaje += `📊 *Ventas del día:* ${totales.num_ventas}\n`;
    mensaje += `💰 *Total:* $${total_dia.toFixed(2)}\n`;
    mensaje += `   💵 Efectivo: $${efectivo.toFixed(2)}\n`;
    mensaje += `   📲 Transferencia: $${transferencia.toFixed(2)}\n`;

    if (topProductos.length > 0) {
      mensaje += `\n🏆 *Más vendidos:*\n`;
      topProductos.forEach((p, i) => {
        const nombre = p.tamanio ? `${p.nombre} ${p.tamanio}` : p.nombre;
        mensaje += `  ${i + 1}. ${nombre} — ${p.piezas} pz ($${parseFloat(p.subtotal).toFixed(2)})\n`;
      });
    }

    mensaje += `\n_Generado automáticamente por QuicuoIA_ ✅`;

    // Número del admin desde .env (el Tech Lead lo configura)
    const numeroAdmin = process.env.WHATSAPP_ADMIN || '';
    const mensajeCodificado = encodeURIComponent(mensaje);
    const whatsappUrl = numeroAdmin
      ? `https://wa.me/${numeroAdmin}?text=${mensajeCodificado}`
      : `https://wa.me/?text=${mensajeCodificado}`;

    return res.status(200).json({
      success: true,
      fecha,
      resumen: {
        num_ventas:  totales.num_ventas,
        total_dia,
        efectivo,
        transferencia,
        top_productos: topProductos.map(p => ({
          ...p,
          subtotal: parseFloat(p.subtotal),
        })),
      },
      whatsapp: {
        mensaje,
        url: whatsappUrl,
      },
    });

  } catch (err) {
    console.error('Error en getResumenDia:', err);
    return res.status(500).json({ success: false, mensaje: 'Error al generar resumen del día.' });
  }
}

module.exports = { getResumenDia };
