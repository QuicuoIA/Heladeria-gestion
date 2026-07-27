// ============================================================
// ARCHIVO: backend/middlewares/authMiddleware.js
// DESCRIPCIÓN: Middleware de autenticación JWT y verificación de roles
// ============================================================

const jwt = require('jsonwebtoken');

const verificarToken = (req, res, next) => {
  // Leer el token de los headers
  const token = req.header('Authorization');

  // Si no hay token, denegar acceso
  if (!token) {
    return res.status(401).json({ success: false, mensaje: 'No hay token, permiso denegado' });
  }

  try {
    // Si el token viene como "Bearer <token>", lo limpia
    const tokenLimpio = token.replace('Bearer ', '');

    // Verificar el token con la clave secreta
    const cifrado = jwt.verify(tokenLimpio, process.env.JWT_SECRET);

    // Extraer el usuario del token y pasarlo a la petición
    req.usuario = cifrado; next(); // Todo bien, que pase a la siguiente ruta
  } catch (error) {
    res.status(401).json({ success: false, mensaje: 'Token no válido' });
  }
};

// ============================================================
// verifyRol — Verifica que el usuario tenga uno de los roles
//             permitidos. Se usa como middleware encadenado.
// ============================================================
const verifyRol = (...roles) => {
  return (req, res, next) => {
    if (!req.usuario || !roles.includes(req.usuario.rol)) {
      const rolesStr = roles.join(' o ');
      return res.status(403).json({
        success: false,
        mensaje: `Acceso denegado. Se requiere rol: ${rolesStr}.`,
        tu_rol: req.usuario ? req.usuario.rol : null
      });
    }
    next();
  };
};

module.exports = { verificarToken, verifyRol };