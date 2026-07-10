const jwt = require('jsonwebtoken');

const verificarToken = (req, res, next) => {
    // Leer el token de los headers
    const token = req.header('Authorization');

    // Si no hay token, denegar acceso
    if (!token) {
        return res.status(401).json({ msg: 'No hay token, permiso denegado' });
    }

    try {
        // Si el token viene como "Bearer <token>", lo limpia
        const tokenLimpio = token.replace('Bearer ', '');

        // Verificar el token con la clave secreta
        const cifrado = jwt.verify(tokenLimpio, process.env.JWT_SECRET);

        // Extraer el usuario del token y pasarlo a la petición
        req.usuario = cifrado.usuario;
        next(); // Bien, que pase a la siguiente ruta
    } catch {
        res.status(401).json({ msg: 'Token no válido' });
    }
};

module.exports = verificarToken;