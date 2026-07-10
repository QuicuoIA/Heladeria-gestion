// routes/resumen.js
// Semana 5 — HU2.7 Resumen + WhatsApp
const express = require('express');
const router  = express.Router();
const { getResumenDia } = require('../controllers/resumenController');
const { verifyToken, verifyRol } = require('../middleware/auth');

// GET /api/resumen/dia   ?fecha=2025-06-15
// Solo dueno y encargado
router.get('/dia', verifyToken, verifyRol('dueno', 'encargado'), getResumenDia);

module.exports = router;
