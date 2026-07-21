// ============================================================
// ARCHIVO: backend/controllers/authController.js
// DESCRIPCIÓN: Autenticación por PIN con bcrypt + JWT
// ============================================================

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/database');

/**
 * POST /api/auth/login
 * Body: { pin: string }
 *
 * Itera todos los usuarios activos comparando el PIN con bcrypt.
 * El JWT se firma con payload plano (id_usuario, nombre, rol en raíz)
 * para que authMiddleware.js pueda leer req.usuario.rol directamente.
 */
const login = async (req, res) => {
  const { pin } = req.body;

  if (!pin || typeof pin !== 'string' || pin.trim() === '') {
    return res.status(400).json({ success: false, mensaje: 'El PIN es requerido.' });
  }

  try {
    // Obtener todos los usuarios activos para comparar con bcrypt
    const [usuarios] = await pool.execute(
      `SELECT id_usuario, nombre, pin_hash, rol
       FROM usuarios
       WHERE activo = 1`
    );

    if (usuarios.length === 0) {
      return res.status(401).json({ success: false, mensaje: 'PIN incorrecto.' });
    }

    // Iterar y comparar con bcrypt
    let usuarioEncontrado = null;
    for (const u of usuarios) {
      const coincide = await bcrypt.compare(pin, u.pin_hash);
      if (coincide) {
        usuarioEncontrado = u;
        break;
      }
    }

    if (!usuarioEncontrado) {
      return res.status(401).json({ success: false, mensaje: 'PIN incorrecto.' });
    }

    // Firmar JWT con payload plano en el nivel raíz
    // authMiddleware.js hace: req.usuario = jwt.verify(token, secret)
    // → req.usuario.id_usuario, req.usuario.nombre, req.usuario.rol
    const token = jwt.sign(
      {
        id_usuario: usuarioEncontrado.id_usuario,
        nombre:     usuarioEncontrado.nombre,
        rol:        usuarioEncontrado.rol
      },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );

    return res.status(200).json({
      success: true,
      mensaje: 'Acceso permitido.',
      token,
      usuario: {
        id_usuario: usuarioEncontrado.id_usuario,
        nombre:     usuarioEncontrado.nombre,
        rol:        usuarioEncontrado.rol
      }
    });
  } catch (err) {
    console.error('[AuthController.login]', err);
    return res.status(500).json({ success: false, mensaje: 'Error interno del servidor.' });
  }
};

module.exports = { login };