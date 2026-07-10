// routes/catalogo.js
const express = require('express');
const router  = express.Router();
const { getCatalogo, getCategorias } = require('../controllers/catalogoController');
const { verifyToken } = require('../middleware/auth');

// GET /api/catalogo              — HU1.1 productos activos por categoría
router.get('/',           verifyToken, getCatalogo);

// GET /api/catalogo/categorias   — HU1.5 listado de categorías
router.get('/categorias', verifyToken, getCategorias);

module.exports = router;
