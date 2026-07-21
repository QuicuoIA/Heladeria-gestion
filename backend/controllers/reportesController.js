// ============================================================
// ARCHIVO: backend/controllers/reportesController.js
// DESCRIPCIÓN: Exportación de reportes en Excel (exceljs) y
//              PDF (pdfkit).
// ============================================================

const pool = require('../config/database');
const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');

// ── GET /api/reportes/excel?mes&anio ────────────────────────
const exportarExcel = async (req, res) => {
  try {
    const hoy = new Date();
    const mes = parseInt(req.query.mes) || hoy.getMonth() + 1;
    const anio = parseInt(req.query.anio) || hoy.getFullYear();

    const fechaInicio = `${anio}-${String(mes).padStart(2, '0')}-01`;
    const fechaFin = new Date(anio, mes, 1);
    const fechaFinStr = `${fechaFin.getFullYear()}-${String(fechaFin.getMonth() + 1).padStart(2, '0')}-01`;

    const [rows] = await pool.execute(
      `SELECT
         DATE(fecha_venta)                                                          AS dia,
         COUNT(id_venta)                                                            AS num_ventas,
         COALESCE(SUM(subtotal), 0)                                                AS total_dia,
         COALESCE(SUM(CASE WHEN metodo_pago = 'efectivo'      THEN subtotal ELSE 0 END), 0) AS efectivo,
         COALESCE(SUM(CASE WHEN metodo_pago = 'transferencia' THEN subtotal ELSE 0 END), 0) AS transferencia
       FROM ventas
       WHERE anulada = 0
         AND fecha_venta >= ?
         AND fecha_venta  < ?
       GROUP BY DATE(fecha_venta)
       ORDER BY dia ASC`,
      [fechaInicio, fechaFinStr]
    );

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'QuicuoIA — Nevería';
    workbook.created = new Date();

    const sheet = workbook.addWorksheet('Reporte Mensual');

    // Definir columnas
    sheet.columns = [
      { header: 'Dia',           key: 'dia',          width: 15 },
      { header: 'Num Ventas',    key: 'num_ventas',   width: 14 },
      { header: 'Total Dia',     key: 'total_dia',    width: 14 },
      { header: 'Efectivo',      key: 'efectivo',     width: 14 },
      { header: 'Transferencia', key: 'transferencia', width: 16 }
    ];

    // Estilos de encabezado
    sheet.getRow(1).eachCell(cell => {
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF2E75B6' }
      };
      cell.alignment = { horizontal: 'center' };
    });

    // Agregar datos
    rows.forEach(r => {
      sheet.addRow({
        dia: r.dia,
        num_ventas: r.num_ventas,
        total_dia: parseFloat(r.total_dia),
        efectivo: parseFloat(r.efectivo),
        transferencia: parseFloat(r.transferencia)
      });
    });

    // Fila de totales
    const totalRow = sheet.addRow({
      dia: 'TOTAL',
      num_ventas: rows.reduce((a, r) => a + Number(r.num_ventas), 0),
      total_dia: rows.reduce((a, r) => a + parseFloat(r.total_dia), 0),
      efectivo: rows.reduce((a, r) => a + parseFloat(r.efectivo), 0),
      transferencia: rows.reduce((a, r) => a + parseFloat(r.transferencia), 0)
    });
    totalRow.font = { bold: true };

    const mesStr = String(mes).padStart(2, '0');
    const filename = `reporte_${anio}_${mesStr}.xlsx`;

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=${filename}`);

    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    console.error('[ReportesController.exportarExcel]', err);
    if (!res.headersSent) {
      res.status(500).json({ success: false, mensaje: 'Error al generar el Excel.' });
    }
  }
};

// ── GET /api/reportes/pdf?fecha=YYYY-MM-DD ──────────────────
const exportarPDF = async (req, res) => {
  try {
    const fecha = req.query.fecha || new Date().toISOString().slice(0, 10);

    // Totales del día
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

    // Top 5 productos
    const [top5] = await pool.execute(
      `SELECT
         p.nombre,
         p.tamanio,
         SUM(v.cantidad)  AS total_piezas,
         SUM(v.subtotal)  AS total_dinero
       FROM ventas v
       JOIN productos p ON p.id_producto = v.id_producto
       WHERE v.anulada = 0
         AND DATE(v.fecha_venta) = ?
       GROUP BY p.id_producto, p.nombre, p.tamanio
       ORDER BY total_piezas DESC
       LIMIT 5`,
      [fecha]
    );

    const filename = `reporte_${fecha}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=${filename}`);

    const doc = new PDFDocument({ margin: 50 });
    doc.pipe(res);

    // Título centrado
    doc.fontSize(20).font('Helvetica-Bold')
       .text(`🍦 Reporte Nevería — ${fecha}`, { align: 'center' });
    doc.moveDown();

    // Línea separadora
    doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke();
    doc.moveDown(0.5);

    // Totales del día
    doc.fontSize(13).font('Helvetica-Bold').text('Totales del día');
    doc.fontSize(11).font('Helvetica');
    doc.text(`Ventas realizadas : ${totales.num_ventas}`);
    doc.text(`Total del día     : $${parseFloat(totales.total_dia).toFixed(2)}`);
    doc.text(`Efectivo          : $${parseFloat(totales.efectivo).toFixed(2)}`);
    doc.text(`Transferencia     : $${parseFloat(totales.transferencia).toFixed(2)}`);
    doc.moveDown();

    // Top 5 productos
    if (top5.length > 0) {
      doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke();
      doc.moveDown(0.5);
      doc.fontSize(13).font('Helvetica-Bold').text('Top 5 Productos');
      doc.fontSize(11).font('Helvetica');

      top5.forEach((p, i) => {
        const nombre = p.tamanio ? `${p.nombre} (${p.tamanio})` : p.nombre;
        doc.text(
          `${i + 1}. ${nombre} — ${p.total_piezas} pzs — $${parseFloat(p.total_dinero).toFixed(2)}`
        );
      });
    }

    doc.moveDown();
    doc.fontSize(9).fillColor('grey')
       .text(`Generado por QuicuoIA el ${new Date().toLocaleString('es-MX')}`, { align: 'right' });

    doc.end();
  } catch (err) {
    console.error('[ReportesController.exportarPDF]', err);
    if (!res.headersSent) {
      res.status(500).json({ success: false, mensaje: 'Error al generar el PDF.' });
    }
  }
};

module.exports = { exportarExcel, exportarPDF };
