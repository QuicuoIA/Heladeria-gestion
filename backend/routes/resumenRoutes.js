// ============================================================
// ARCHIVO: backend/routes/resumenRoutes.js
// ============================================================

const express = require('express');
const router = express.Router();
const { verificarToken, verifyRol } = require('../middlewares/authMiddleware');
const { getResumenDia } = require('../controllers/resumenController');

router.get('/dia', verificarToken, verifyRol('dueno', 'encargado'), getResumenDia);

module.exports = router;
