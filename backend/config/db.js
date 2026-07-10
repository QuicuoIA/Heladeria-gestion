// config/db.js
const mysql2 = require('mysql2/promise');
require('dotenv').config();

const pool = mysql2.createPool({
  host:             process.env.DB_HOST     || 'localhost',
  port:             process.env.DB_PORT     || 3306,
  user:             process.env.DB_USER     || 'root',
  password:         process.env.DB_PASSWORD || '',
  database:         process.env.DB_NAME     || 'neveria',
  waitForConnections: true,
  connectionLimit:  10,
  queueLimit:       0,
});

async function testConnection() {
  try {
    const conn = await pool.getConnection();
    console.log('Conexión a MySQL (neveria) exitosa');
    conn.release();
  } catch (err) {
    console.error('Error conectando a MySQL:', err.message);
    process.exit(1);
  }
}

module.exports = { pool, testConnection };
