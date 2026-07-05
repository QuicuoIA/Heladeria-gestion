-- ============================================================
-- MIGRACIÓN: Logs de Auditoría en Base de Datos
-- ARCHIVO:   migrations/002_auditoria.sql
-- SEMANA:    4 — HU Seguridad de Datos
-- AUTOR:     Cristian Eduardo Flores Medina
-- ============================================================

USE neveria;

-- Tabla de auditoría: registra automáticamente acciones sensibles
CREATE TABLE IF NOT EXISTS auditoria (
  id_auditoria  INT           NOT NULL AUTO_INCREMENT,
  id_usuario    INT           DEFAULT NULL
                COMMENT 'NULL si la acción fue del sistema',
  tabla         VARCHAR(60)   NOT NULL
                COMMENT 'Tabla afectada: productos, ventas, usuarios, etc.',
  accion        ENUM('DELETE','INSERT','UPDATE','CORTE_CAJA') NOT NULL,
  id_registro   INT           DEFAULT NULL
                COMMENT 'id del registro afectado en la tabla origen',
  detalle       JSON          DEFAULT NULL
                COMMENT 'Snapshot del registro antes de la acción',
  ip_origen     VARCHAR(45)   DEFAULT NULL,
  fecha         DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id_auditoria),
  INDEX idx_auditoria_usuario (id_usuario),
  INDEX idx_auditoria_tabla   (tabla),
  INDEX idx_auditoria_fecha   (fecha),
  CONSTRAINT fk_auditoria_usuario
    FOREIGN KEY (id_usuario) REFERENCES usuarios (id_usuario)
    ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB
  COMMENT='Log de auditoría — acciones sensibles del sistema';

-- ────────────────────────────────────────────────────────────
-- TRIGGER: registra automáticamente cuando se desactiva
-- un producto (activo = 0). Equivale a "eliminación lógica".
-- ────────────────────────────────────────────────────────────
DROP TRIGGER IF EXISTS trg_auditoria_producto_desactivado;

DELIMITER $$

CREATE TRIGGER trg_auditoria_producto_desactivado
AFTER UPDATE ON productos
FOR EACH ROW
BEGIN
  -- Solo dispara cuando cambia activo de 1 → 0
  IF OLD.activo = 1 AND NEW.activo = 0 THEN
    INSERT INTO auditoria (tabla, accion, id_registro, detalle)
    VALUES (
      'productos',
      'DELETE',
      OLD.id_producto,
      JSON_OBJECT(
        'id_producto',  OLD.id_producto,
        'nombre',       OLD.nombre,
        'precio',       OLD.precio,
        'id_categoria', OLD.id_categoria
      )
    );
  END IF;
END$$

DELIMITER ;
