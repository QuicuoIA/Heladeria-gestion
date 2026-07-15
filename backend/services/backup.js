const cron = require('node-cron');
const fs = require('fs');

// Se ejecuta todos los días a las 23:59 PM
cron.schedule('* * * * *', () => {
    const fecha = new Date().toISOString().split('T')[0];
    console.log(`[${fecha}] Iniciando respaldo de la base de datos de la Heladería...`);

    // Aquí iría el comando real de mysqldump o pg_dump
    const backupData = "Simulación de datos exportados de la DB...";

    fs.writeFile(`backup-${fecha}.sql`, backupData, (err) => {
        if (err) throw err;
        console.log(`✅ Respaldo 'backup-${fecha}.sql' generado y guardado exitosamente.`);
    });
});

console.log("⏳ Servicio de respaldos automáticos iniciado.");