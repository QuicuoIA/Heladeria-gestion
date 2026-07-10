// seeders/seed.js
// Ejecutar: npm run seed
// Inserta categorías, productos, inventario y usuarios con PIN hasheado (bcrypt)

const bcrypt = require('bcryptjs');
const { pool } = require('../config/db');
const fs      = require('fs');
const path    = require('path');
require('dotenv').config();

async function runSeed() {
  const conn = await pool.getConnection();
  try {
    console.log('\n🌱 Iniciando Seeder — Nevería\n');

    // ── 1. Ejecutar neveria_seeder.sql (categorías, productos, inventario) ──
    const sqlFile = path.join(__dirname, '../../database/neveria_seeder.sql');
    if (fs.existsSync(sqlFile)) {
      const sql = fs.readFileSync(sqlFile, 'utf8');
      // Ejecutar sentencia por sentencia (separadas por ;)
      const statements = sql
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--') && !s.startsWith('USE'));
      for (const stmt of statements) {
        await conn.query(stmt);
      }
      console.log('✅ neveria_seeder.sql ejecutado (categorías, productos, inventario)');
    }

    // ── 2. Insertar usuarios con PIN hasheado ───────────────────────────────
    await conn.query('DELETE FROM usuarios');

    const usuarios = [
      { nombre: 'Dueño Principal', pin: '0000', rol: 'dueno'      },
      { nombre: 'Encargada Turno', pin: '1111', rol: 'encargado'  },
      { nombre: 'Empleado Caja',   pin: '2222', rol: 'empleado'   },
    ];

    for (const u of usuarios) {
      const pin_hash = await bcrypt.hash(u.pin, 10);
      await conn.query(
        'INSERT INTO usuarios (nombre, pin_hash, rol) VALUES (?, ?, ?)',
        [u.nombre, pin_hash, u.rol]
      );
    }

    console.log(`✅ ${usuarios.length} usuarios insertados con PIN hasheado (bcrypt)`);
    console.log('\n  📌 PINs de prueba:');
    usuarios.forEach(u =>
      console.log(`     ${u.nombre.padEnd(20)} PIN: ${u.pin}  rol: ${u.rol}`)
    );

    // ── 3. Resumen ───────────────────────────────────────────────────────────
    const [[{ total_productos }]] = await conn.query('SELECT COUNT(*) AS total_productos FROM productos');
    const [[{ total_categorias }]] = await conn.query('SELECT COUNT(*) AS total_categorias FROM categorias');

    console.log(`\n✅ Seeder completado`);
    console.log(`   Categorías: ${total_categorias}`);
    console.log(`   Productos:  ${total_productos}`);
    console.log('\n─────────────────────────────────────────');
    console.log('  POST /api/auth/login  → { "pin": "0000" }');
    console.log('  GET  /api/catalogo');
    console.log('─────────────────────────────────────────\n');

  } catch (err) {
    console.error('❌ Error en seeder:', err.message);
    throw err;
  } finally {
    conn.release();
    process.exit(0);
  }
}

runSeed();
