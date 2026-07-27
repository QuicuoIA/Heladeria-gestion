// ============================================================
// ARCHIVO: backend/routes/dashboardRoutes.js
// ============================================================

const express = require('express');
const router = express.Router();
const { verificarToken, verifyRol } = require('../middlewares/authMiddleware');
const {
  getSaboresVendidos,
  getTotalMensual,
  getResumenHoy,
  getVentasPorCategoria
} = require('../controllers/dashboardController');

// Solo dueño y encargado pueden acceder al dashboard
const soloAdmin = [verificarToken, verifyRol('dueno', 'encargado')];

router.get('/sabores-vendidos',     ...soloAdmin, getSaboresVendidos);
router.get('/total-mensual',        ...soloAdmin, getTotalMensual);
router.get('/resumen-hoy',          ...soloAdmin, getResumenHoy);
router.get('/ventas-por-categoria', ...soloAdmin, getVentasPorCategoria);

module.exports = router;
