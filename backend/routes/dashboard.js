// routes/dashboard.js
// Semana 4 — HU4.1 Dashboard de administrador
const express = require('express');
const router  = express.Router();
const {
  getSaboresVendidos,
  getTotalMensual,
  getResumenHoy,
  getVentasPorCategoria,
} = require('../controllers/dashboardController');
const { verifyToken, verifyRol } = require('../middleware/auth');

// Solo dueno y encargado pueden ver el dashboard
const soloAdmin = [verifyToken, verifyRol('dueno', 'encargado')];

// GET /api/dashboard/sabores-vendidos    ?dias=7
router.get('/sabores-vendidos',    ...soloAdmin, getSaboresVendidos);

// GET /api/dashboard/total-mensual      ?mes=6&anio=2025
router.get('/total-mensual',       ...soloAdmin, getTotalMensual);

// GET /api/dashboard/resumen-hoy
router.get('/resumen-hoy',         ...soloAdmin, getResumenHoy);

// GET /api/dashboard/ventas-por-categoria  ?dias=7
router.get('/ventas-por-categoria',...soloAdmin, getVentasPorCategoria);

module.exports = router;
