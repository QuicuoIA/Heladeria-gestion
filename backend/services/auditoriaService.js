// services/auditoriaService.js
// Semana 4 — Logs de Auditoría en Base de Datos
// Registra silenciosamente acciones sensibles en la tabla auditoria

const { pool } = require('../config/db');

/**
 * Registra una acción de auditoría en la BD.
 * Se llama desde los controladores después de acciones sensibles.
 *
 * @param {object} opts
 * @param {number|null} opts.id_usuario  - ID del usuario que realizó la acción
 * @param {string}      opts.tabla       - Tabla afectada
 * @param {string}      opts.accion      - 'DELETE'|'INSERT'|'UPDATE'|'CORTE_CAJA'
 * @param {number|null} opts.id_registro - ID del registro afectado
 * @param {object|null} opts.detalle     - Snapshot del dato (se guarda como JSON)
 * @param {string|null} opts.ip_origen   - IP del cliente
 */
async function registrar({ id_usuario = null, tabla, accion, id_registro = null, detalle = null, ip_origen = null }) {
  try {
    await pool.query(
      `INSERT INTO auditoria (id_usuario, tabla, accion, id_registro, detalle, ip_origen)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        id_usuario,
        tabla,
        accion,
        id_registro,
        detalle ? JSON.stringify(detalle) : null,
        ip_origen,
      ]
    );
  } catch (err) {
    // Silencioso — nunca debe interrumpir el flujo principal
    console.error('[Auditoría] Error al registrar log:', err.message);
  }
}

module.exports = { registrar };
