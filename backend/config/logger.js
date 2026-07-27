// ============================================================
// ARCHIVO: backend/config/logger.js
// DESCRIPCIÓN: Logger centralizado con Winston
// ============================================================

const winston = require('winston');
const fs = require('fs');
const path = require('path');

// Crear carpeta logs/ si no existe
const logsDir = path.join(__dirname, '..', 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

const { combine, timestamp, printf, colorize } = winston.format;

const logFormat = printf(({ level, message, timestamp: ts }) => {
  return `[${ts}] ${level.toUpperCase()}: ${message}`;
});

const logger = winston.createLogger({
  format: combine(
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    logFormat
  ),
  transports: [
    new winston.transports.File({
      filename: path.join(logsDir, 'error.log'),
      level: 'error'
    }),
    new winston.transports.File({
      filename: path.join(logsDir, 'combined.log'),
      level: 'info'
    }),
    new winston.transports.Console({
      silent: process.env.NODE_ENV === 'production',
      format: combine(
        colorize(),
        timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        logFormat
      )
    })
  ]
});

module.exports = logger;
