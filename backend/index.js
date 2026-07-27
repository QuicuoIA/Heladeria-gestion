const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const logger = require('./config/logger');
const pool = require('./config/database');
const responseTimeMiddleware = require('./middlewares/responseTime');

// ── Rutas ────────────────────────────────────────────────────
const authRoutes       = require('./routes/authRoutes');
const ventasRoutes     = require('./routes/ventasRoutes');
const dashboardRoutes  = require('./routes/dashboardRoutes');
const inventarioRoutes = require('./routes/inventarioRoutes');
const resumenRoutes    = require('./routes/resumenRoutes');
const reportesRoutes   = require('./routes/reportesRoutes');

const app = express();

// 1. Ocultar cabeceras y proteger de ataques XSS
app.use(helmet());

// 2. Limitar peticiones (Evitar fuerza bruta en el Login)
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 100, // Limita a 100 peticiones por IP cada 15 min
    message: "⚠️ Demasiadas peticiones desde esta IP, por favor intenta más tarde."
});
app.use(limiter);

// Middleware básico
const corsOptions = {
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
};
app.use(cors(corsOptions)); // Habilita peticiones solo desde orígenes permitidos
app.use(express.json()); // Permite recibir JSON en el body

// ── Middleware básico ────────────────────────────────────────
app.use(cors());
app.use(express.json());

// Morgan → archivo de acceso
const accessLogStream = fs.createWriteStream(
  path.join(logsDir, 'access.log'),
  { flags: 'a' }
);
app.use(morgan('combined', { stream: accessLogStream }));

// Medir tiempo de respuesta y loguear peticiones lentas
app.use(responseTimeMiddleware);

// ── Rutas de la API ──────────────────────────────────────────
app.use('/api/auth',       authRoutes);
app.use('/api/ventas',     ventasRoutes);
app.use('/api/dashboard',  dashboardRoutes);
app.use('/api/inventario', inventarioRoutes);
app.use('/api/resumen',    resumenRoutes);
app.use('/api/reportes',   reportesRoutes);

// ── Error handler global ─────────────────────────────────────
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  logger.error(`[ErrorHandler] ${req.method} ${req.originalUrl} — ${err.message}`);
  if (!res.headersSent) {
    res.status(500).json({ success: false, mensaje: 'Error interno del servidor.' });
  }
});

// ── Errores no capturados ────────────────────────────────────
process.on('uncaughtException', (err) => {
  logger.error(`[UncaughtException] ${err.message}\n${err.stack}`);
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  const msg = reason instanceof Error ? reason.message : String(reason);
  logger.error(`[UnhandledRejection] ${msg}`);
});

// ── Probar conexión a BD y levantar servidor ─────────────────
const PORT = process.env.PORT || 3000;

const iniciarServidor = async () => {
  try {
    const [rows] = await pool.execute('SELECT 1');
    if (rows) {
      logger.info('✅  Conexión a MySQL establecida correctamente.');
    }
  } catch (err) {
    logger.error(`❌  No se pudo conectar a MySQL: ${err.message}`);
  }

  app.listen(PORT, () => {
    logger.info(`🚀  Backend de la nevería corriendo en el puerto ${PORT}`);
  });
};

iniciarServidor();