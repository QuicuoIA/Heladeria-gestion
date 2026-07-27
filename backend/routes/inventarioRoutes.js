// ============================================================
// ARCHIVO: backend/routes/inventarioRoutes.js
// ============================================================

const express = require('express');
const router = express.Router();
const { verificarToken, verifyRol } = require('../middlewares/authMiddleware');
const { getInventario, getAlertasStock } = require('../controllers/inventarioController');

router.get('/',        verificarToken, getInventario);
router.get('/alertas', verificarToken, verifyRol('dueno', 'encargado'), getAlertasStock);

module.exports = router;
