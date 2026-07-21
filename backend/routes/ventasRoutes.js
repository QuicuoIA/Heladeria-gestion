// ============================================================
// ARCHIVO: backend/routes/ventasRoutes.js
// ============================================================

const express = require('express');
const router = express.Router();
const { verificarToken, verifyRol } = require('../middlewares/authMiddleware');
const { crearVenta, anularVenta, getVentasHoy } = require('../controllers/ventasController');

router.post('/', verificarToken, crearVenta);
router.delete('/:id/anular', verificarToken, anularVenta);
router.get('/hoy', verificarToken, getVentasHoy);

module.exports = router;
