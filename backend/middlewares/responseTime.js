// ============================================================
// ARCHIVO: backend/middlewares/responseTime.js
// DESCRIPCIÓN: Middleware que mide el tiempo de respuesta y
//              loguea las peticiones lentas (> 300ms)
// ============================================================

const logger = require('../config/logger');

const responseTimeMiddleware = (req, res, next) => {
  const start = Date.now();

  res.on('finish', () => {
    const ms = Date.now() - start;
    if (ms > 300) {
      logger.error(`SLOW: ${req.method} ${req.originalUrl} — ${ms}ms`);
    }
  });

  next();
};

module.exports = responseTimeMiddleware;
