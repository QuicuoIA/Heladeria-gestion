const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const express = require('express');
const cors = require('cors');
require('dotenv').config();

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

// Aquí irían las rutas...
// app.use('/api/auth', require('./routes/authRoutes'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Backend de la nevería corriendo en el puerto ${PORT}`);
});