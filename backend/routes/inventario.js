// routes/inventario.js
// Semana 5 — HU3.1 Inventario · HU3.5 Alertas de stock
const express = require('express');
const router  = express.Router();
const { getAlertasStock, getInventario } = require('../controllers/inventarioController');
const { verifyToken, verifyRol } = require('../middleware/auth');

// GET /api/inventario           — todos los roles autenticados
router.get('/',        verifyToken, getInventario);

// GET /api/inventario/alertas   — dueno y encargado
router.get('/alertas', verifyToken, verifyRol('dueno', 'encargado'), getAlertasStock);

module.exports = router;
