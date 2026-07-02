// routes/auth.js
const express = require('express');
const router  = express.Router();
const { login } = require('../controllers/authController');

// POST /api/auth/login  — HU5.1
router.post('/login', login);

module.exports = router;
