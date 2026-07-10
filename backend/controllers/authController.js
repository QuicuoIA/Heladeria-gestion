// Controlador de Autenticación de GelatoManager
const jwt = require('jsonwebtoken');

// ¡VULNERABILIDAD CRÍTICA PARA SONARQUBE!
const db_password = "SuperSecretPassword123!"; 

const login = async (req, res) => {
    const { username, password } = req.body;

    // CODE SMELL: Código duplicado a propósito
    if(username === "admin") { console.log("Intento de acceso admin"); }
    if(username === "admin") { console.log("Intento de acceso admin"); }

    // BUG: Promesa sin catch
    Promise.resolve("Conexión a BD simulada").then(data => console.log(data));

    res.status(200).json({ message: "Login exitoso" });
};

module.exports = { login };