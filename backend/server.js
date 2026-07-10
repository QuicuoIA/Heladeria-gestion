// server.js — actualizado Semanas 4 y 5
const express = require('express');
const cors    = require('cors');
require('dotenv').config();

const { testConnection } = require('./config/db');
const authRoutes       = require('./routes/auth');
const catalogoRoutes   = require('./routes/catalogo');
const ventasRoutes     = require('./routes/ventas');
const dashboardRoutes  = require('./routes/dashboard');   // Semana 4
const resumenRoutes    = require('./routes/resumen');     // Semana 5
const inventarioRoutes = require('./routes/inventario');  // Semana 5

const app  = express();
app.disable('x-powered-by');
const PORT = process.env.PORT || 3001;

app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true,
}));
app.use(express.json());

// ── Rutas ─────────────────────────────────────────────────────
app.use('/api/auth',       authRoutes);
app.use('/api/catalogo',   catalogoRoutes);
app.use('/api/ventas',     ventasRoutes);
app.use('/api/dashboard',  dashboardRoutes);   // Semana 4
app.use('/api/resumen',    resumenRoutes);     // Semana 5
app.use('/api/inventario', inventarioRoutes);  // Semana 5

app.get('/api/health', (_req, res) =>
  res.json({ status: 'OK', proyecto: 'Nevería QuicuoIA', timestamp: new Date() })
);

app.use((_req, res) =>
  res.status(404).json({ success: false, mensaje: 'Ruta no encontrada.' })
);

async function start() {
  await testConnection();
  app.listen(PORT, () => {
    console.log(`\n🚀 Servidor corriendo en http://localhost:${PORT}`);
    console.log('─'.repeat(50));
    console.log('  Semana 2-3:');
    console.log('  POST   /api/auth/login');
    console.log('  GET    /api/catalogo');
    console.log('  POST   /api/ventas');
    console.log('  DELETE /api/ventas/:id/anular');
    console.log('  GET    /api/ventas/hoy');
    console.log('  Semana 4:');
    console.log('  GET    /api/dashboard/sabores-vendidos');
    console.log('  GET    /api/dashboard/total-mensual');
    console.log('  GET    /api/dashboard/resumen-hoy');
    console.log('  GET    /api/dashboard/ventas-por-categoria');
    console.log('  Semana 5:');
    console.log('  GET    /api/resumen/dia');
    console.log('  GET    /api/inventario');
    console.log('  GET    /api/inventario/alertas');
    console.log('─'.repeat(50) + '\n');
  });
}

start();
