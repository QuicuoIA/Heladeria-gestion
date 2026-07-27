// ============================================================
// ARCHIVO: backend/routes/reportesRoutes.js
// ============================================================

const express = require('express');
const router = express.Router();
const { verificarToken, verifyRol } = require('../middlewares/authMiddleware');
const { exportarExcel, exportarPDF } = require('../controllers/reportesController');

const soloAdmin = [verificarToken, verifyRol('dueno', 'encargado')];

router.get('/excel', ...soloAdmin, exportarExcel);
router.get('/pdf',   ...soloAdmin, exportarPDF);

module.exports = router;
