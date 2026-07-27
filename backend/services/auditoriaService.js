// ============================================================
// ARCHIVO: backend/services/auditoriaService.js
// DESCRIPCIÓN: Servicio de auditoría — registra acciones en la
//              tabla auditoria. Nunca lanza errores (silencioso).
// ============================================================

const pool = require('../config/database');

/**
 * Registra una entrada de auditoría en la BD.
 * @param {object} opts
 * @param {number|null} opts.id_usuario   - ID del usuario que realizó la acción
 * @param {string}      opts.tabla        - Nombre de la tabla afectada
 * @param {string}      opts.accion       - Tipo de acción: DELETE | INSERT | UPDATE | CORTE_CAJA
 * @param {number|null} opts.id_registro  - ID del registro afectado
 * @param {object|null} opts.detalle      - Detalle adicional (se guarda como JSON)
 * @param {string|null} opts.ip_origen    - IP del cliente
 */
const registrar = async ({
  id_usuario = null,
  tabla,
  accion,
  id_registro = null,
  detalle = null,
  ip_origen = null
} = {}) => {
  try {
    const detalleJSON = detalle !== null ? JSON.stringify(detalle) : null;

    await pool.execute(
      `INSERT INTO auditoria
         (id_usuario, tabla, accion, id_registro, detalle, ip_origen)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [id_usuario, tabla, accion, id_registro, detalleJSON, ip_origen]
    );
  } catch (err) {
    // Silencioso: la auditoría nunca debe interrumpir el flujo principal
    console.error('[AuditoriaService] Error al registrar:', err.message);
  }
};

module.exports = { registrar };
