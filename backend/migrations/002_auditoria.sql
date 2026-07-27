-- ============================================================
-- MIGRACIÓN: 002_auditoria.sql
-- DESCRIPCIÓN: Tabla de auditoría y trigger de producto desactivado
-- ============================================================

USE neveria;

CREATE TABLE IF NOT EXISTS auditoria (
  id_auditoria INT          NOT NULL AUTO_INCREMENT,
  id_usuario   INT          DEFAULT NULL,
  tabla        VARCHAR(60)  NOT NULL,
  accion       ENUM('DELETE','INSERT','UPDATE','CORTE_CAJA') NOT NULL,
  id_registro  INT          DEFAULT NULL,
  detalle      JSON         DEFAULT NULL,
  ip_origen    VARCHAR(45)  DEFAULT NULL,
  fecha        DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id_auditoria),
  INDEX idx_auditoria_usuario (id_usuario),
  INDEX idx_auditoria_tabla   (tabla),
  INDEX idx_auditoria_fecha   (fecha),
  CONSTRAINT fk_auditoria_usuario
    FOREIGN KEY (id_usuario)
    REFERENCES usuarios (id_usuario)
    ON UPDATE CASCADE
    ON DELETE SET NULL
) ENGINE=InnoDB
  COMMENT='Tabla de auditoría — acciones críticas del sistema';

-- ============================================================
-- TRIGGER: Registrar cuando un producto es desactivado
-- ============================================================

DROP TRIGGER IF EXISTS trg_auditoria_producto_desactivado;

DELIMITER $$

CREATE TRIGGER trg_auditoria_producto_desactivado
AFTER UPDATE ON productos
FOR EACH ROW
BEGIN
  IF OLD.activo = 1 AND NEW.activo = 0 THEN
    INSERT INTO auditoria (tabla, accion, id_registro, detalle)
    VALUES (
      'productos',
      'DELETE',
      OLD.id_producto,
      JSON_OBJECT(
        'nombre',       OLD.nombre,
        'precio',       OLD.precio,
        'id_categoria', OLD.id_categoria
      )
    );
  END IF;
END$$

DELIMITER ;
