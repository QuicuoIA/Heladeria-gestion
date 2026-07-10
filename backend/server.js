// server.js
const express = require('express');
const cors    = require('cors');
require('dotenv').config();

const { testConnection } = require('./config/db');
const authRoutes     = require('./routes/auth');
const catalogoRoutes = require('./routes/catalogo');
const ventasRoutes   = require('./routes/ventas');

const app  = express();
const PORT = process.env.PORT || 3001;

// ── Middlewares globales ──────────────────────────────────────
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true,
}));
app.use(express.json());

// ── Rutas ─────────────────────────────────────────────────────
app.use('/api/auth',     authRoutes);
app.use('/api/catalogo', catalogoRoutes);
app.use('/api/ventas',   ventasRoutes);

// Health check
app.get('/api/health', (_req, res) =>
  res.json({ status: 'OK', proyecto: 'Nevería QuicuoIA', timestamp: new Date() })
);

// 404
app.use((_req, res) =>
  res.status(404).json({ success: false, mensaje: 'Ruta no encontrada.' })
);

// ── Arrancar ──────────────────────────────────────────────────
async function start() {
  await testConnection();
  app.listen(PORT, () => {
    console.log(`\n Servidor corriendo en http://localhost:${PORT}`);
    console.log('─'.repeat(45));
    console.log(`  POST   /api/auth/login`);
    console.log(`  GET    /api/catalogo`);
    console.log(`  GET    /api/catalogo/categorias`);
    console.log(`  POST   /api/ventas`);
    console.log(`  DELETE /api/ventas/:id/anular`);
    console.log(`  GET    /api/ventas/hoy`);
    console.log('─'.repeat(45) + '\n');
  });
}

start();
