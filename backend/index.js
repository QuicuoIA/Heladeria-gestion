const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middleware básico
app.use(cors()); // Habilita peticiones de cualquier origen
app.use(express.json()); // Permite recibir JSON en el body

// Aquí irían las rutas...
// app.use('/api/auth', require('./routes/authRoutes'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Backend de la nevería corriendo en el puerto ${PORT}`);
});