// controllers/authController.js
// HU5.1 — Autenticación por PIN + JWT
const bcrypt = require('bcryptjs');
const jwt    = require('jsonwebtoken');
const { pool } = require('../config/db');

/**
 * POST /api/auth/login
 * Body: { pin: "1234" }
 *
 * 1. Busca todos los usuarios activos
 * 2. Compara el PIN con bcrypt
 * 3. Si coincide → genera JWT con { id_usuario, nombre, rol }
 * 4. Si no        → 401 Acceso denegado
 */
async function login(req, res) {
  const { pin } = req.body;

  if (!pin || typeof pin !== 'string' || pin.trim() === '') {
    return res.status(400).json({ success: false, mensaje: 'El PIN es requerido.' });
  }

  try {
    const [usuarios] = await pool.query(
      `SELECT id_usuario, nombre, pin_hash, rol
       FROM usuarios
       WHERE activo = 1`
    );

    let autenticado = null;
    for (const u of usuarios) {
      if (await bcrypt.compare(pin.trim(), u.pin_hash)) {
        autenticado = u;
        break;
      }
    }

    if (!autenticado) {
      return res.status(401).json({ success: false, mensaje: 'Acceso denegado. PIN incorrecto.' });
    }

    // Generar JWT — válido 8 horas (jornada laboral)
    const token = jwt.sign(
      { id_usuario: autenticado.id_usuario, nombre: autenticado.nombre, rol: autenticado.rol },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );

    return res.status(200).json({
      success: true,
      mensaje: 'Acceso permitido.',
      token,
      usuario: {
        id_usuario: autenticado.id_usuario,
        nombre:     autenticado.nombre,
        rol:        autenticado.rol,
      },
    });

  } catch (err) {
    console.error('Error en login:', err);
    return res.status(500).json({ success: false, mensaje: 'Error interno del servidor.' });
  }
}

module.exports = { login };
