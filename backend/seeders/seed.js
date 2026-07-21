const bcrypt = require('bcryptjs');
const pool = require('../config/database');
require('dotenv').config();

async function runSeed() {
    try {
        console.log('🌱 Insertando usuarios...');

        const usuarios = [
            { nombre: 'Diego (Dueño)', pin: '000000', rol: 'dueno' },
            { nombre: 'María (Encargada)', pin: '111111', rol: 'encargado' },
            { nombre: 'Luis (Empleado)', pin: '222222', rol: 'empleado' },
        ];

        for (const u of usuarios) {
            const pin_hash = await bcrypt.hash(u.pin, 10);
            await pool.query(
                'INSERT INTO usuarios (nombre, pin_hash, rol, activo) VALUES (?, ?, ?, 1)',
                [u.nombre, pin_hash, u.rol]
            );
            console.log(`✅ ${u.nombre} — PIN: ${u.pin}`);
        }

        console.log('\n🎉 Listo. Usa estos PINs para entrar:');
        console.log('   000000 → Dueño');
        console.log('   111111 → Encargada');
        console.log('   222222 → Empleado');

    } catch (err) {
        console.error('❌ Error:', err.message);
    } finally {
        process.exit(0);
    }
}

runSeed();