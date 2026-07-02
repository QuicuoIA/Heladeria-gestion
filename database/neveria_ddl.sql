-- ============================================================
-- PROYECTO: Sistema de Gestión - Nevería
-- ARCHIVO:  neveria_ddl.sql
-- AUTOR:    Cristian Eduardo Flores Medina
-- MÓDULOS:  1-Catálogo, 2-POS, 3-Inventario, 4-Reportes, 5-Usuarios
-- ============================================================

CREATE DATABASE IF NOT EXISTS neveria
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE neveria;

-- ============================================================
-- MÓDULO 5 — USUARIOS
-- HU5.1 PIN · HU5.2 Roles · HU5.3 Crear · HU5.4 Editar
-- HU5.5 Cambiar PIN · HU5.6 Activar/Desactivar · HU5.7 Sesión
-- ============================================================
CREATE TABLE IF NOT EXISTS usuarios (
  id_usuario     INT           NOT NULL AUTO_INCREMENT,
  nombre         VARCHAR(100)  NOT NULL,
  pin_hash       VARCHAR(255)  NOT NULL
                 COMMENT 'HU5.1 — bcrypt del PIN de 4 dígitos',
  rol            ENUM('dueno','encargado','empleado') NOT NULL DEFAULT 'empleado'
                 COMMENT 'HU5.2 — dueno=total, encargado=ventas+inv+rep, empleado=solo ventas',
  activo         TINYINT(1)    NOT NULL DEFAULT 1
                 COMMENT 'HU5.6 — 0=desactivado sin borrar',
  creado_en      DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  actualizado_en DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP
                               ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id_usuario)
) ENGINE=InnoDB
  COMMENT='Usuarios del sistema — Módulo 5';

-- ============================================================
-- MÓDULO 1 — CATÁLOGO
-- HU1.1 Ver productos · HU1.2 Editar · HU1.3 Agregar
-- HU1.4 Activar/Desactivar · HU1.5 Filtrar por categoría
-- Categorías fijas: Vasos, Barquillos, Canastas, Aguas, Envases
-- ============================================================
CREATE TABLE IF NOT EXISTS categorias (
  id_categoria INT         NOT NULL AUTO_INCREMENT,
  nombre       VARCHAR(80) NOT NULL,
  PRIMARY KEY (id_categoria),
  UNIQUE KEY uq_categoria_nombre (nombre)
) ENGINE=InnoDB
  COMMENT='Categorías del catálogo — HU1.5';

CREATE TABLE IF NOT EXISTS productos (
  id_producto  INT            NOT NULL AUTO_INCREMENT,
  id_categoria INT            NOT NULL,
  nombre       VARCHAR(120)   NOT NULL
               COMMENT 'HU1.2 — Editable desde pantalla',
  tamanio      VARCHAR(60)    DEFAULT NULL
               COMMENT 'HU1.1 — Ej: Chico, Mediano, Grande, 500ml',
  precio       DECIMAL(10,2)  NOT NULL
               COMMENT 'HU1.2 — Editable desde pantalla',
  activo       TINYINT(1)     NOT NULL DEFAULT 1
               COMMENT 'HU1.4 — 0=oculto en POS, no se borra',
  creado_en    DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  actualizado_en DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP
                              ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id_producto),
  CONSTRAINT fk_prod_categoria
    FOREIGN KEY (id_categoria) REFERENCES categorias (id_categoria)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  INDEX idx_prod_categoria (id_categoria),
  INDEX idx_prod_activo    (activo)
) ENGINE=InnoDB
  COMMENT='Catálogo de productos — Módulo 1';

-- ============================================================
-- MÓDULO 3 — INVENTARIO
-- HU3.1 Conteo por pieza · HU3.2 Descuento automático
-- HU3.3 Entradas · HU3.4 Ajustes · HU3.5 Alerta stock bajo
-- HU3.6 Historial de movimientos
-- ============================================================
CREATE TABLE IF NOT EXISTS inventario (
  id_inventario        INT           NOT NULL AUTO_INCREMENT,
  id_producto          INT           NOT NULL,
  cantidad_actual      INT           NOT NULL DEFAULT 0
                       COMMENT 'HU3.1 — Existencias actuales en piezas',
  cantidad_minima      INT           NOT NULL DEFAULT 10
                       COMMENT 'HU3.5 — Alerta visual cuando cantidad_actual <= este valor',
  actualizado_en       DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP
                                     ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id_inventario),
  UNIQUE KEY uq_inv_producto (id_producto),
  CONSTRAINT fk_inv_producto
    FOREIGN KEY (id_producto) REFERENCES productos (id_producto)
    ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB
  COMMENT='Stock por producto — Módulo 3';

CREATE TABLE IF NOT EXISTS movimientos_inventario (
  id_movimiento   INT            NOT NULL AUTO_INCREMENT,
  id_producto     INT            NOT NULL,
  id_usuario      INT            NOT NULL,
  tipo            ENUM('venta','entrada','ajuste_baja','ajuste_alta')
                  NOT NULL
                  COMMENT 'HU3.2 venta | HU3.3 entrada | HU3.4 ajuste_baja/ajuste_alta',
  cantidad        INT            NOT NULL
                  COMMENT 'Siempre positivo; el tipo indica si suma o resta',
  nota            VARCHAR(255)   DEFAULT NULL
                  COMMENT 'HU3.3/HU3.4 — Nota opcional en entradas y ajustes',
  fecha           DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  id_venta        INT            DEFAULT NULL
                  COMMENT 'FK a ventas — solo cuando tipo=venta',
  PRIMARY KEY (id_movimiento),
  CONSTRAINT fk_mov_producto
    FOREIGN KEY (id_producto) REFERENCES productos (id_producto)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_mov_usuario
    FOREIGN KEY (id_usuario) REFERENCES usuarios (id_usuario)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  INDEX idx_mov_producto (id_producto),
  INDEX idx_mov_fecha    (fecha)
) ENGINE=InnoDB
  COMMENT='Bitácora de movimientos de inventario — Módulo 3';

-- ============================================================
-- MÓDULO 2 — PUNTO DE VENTA
-- HU2.1 Registrar venta · HU2.2 Modal confirmación
-- HU2.3 Método de pago · HU2.4 Contador del día
-- HU2.5 Deshacer última venta · HU2.6 Historial del día
-- HU2.7 Compartir por WhatsApp
-- ============================================================
CREATE TABLE IF NOT EXISTS ventas (
  id_venta      INT            NOT NULL AUTO_INCREMENT,
  id_usuario    INT            NOT NULL
                COMMENT 'HU2.1 — Cajero que registró la venta',
  id_producto   INT            NOT NULL
                COMMENT 'HU2.1 — Producto vendido',
  cantidad      INT            NOT NULL DEFAULT 1,
  precio_venta  DECIMAL(10,2)  NOT NULL
                COMMENT 'Precio capturado al momento de la venta',
  subtotal      DECIMAL(10,2)  NOT NULL
                COMMENT 'cantidad × precio_venta',
  metodo_pago   ENUM('efectivo','transferencia') NOT NULL DEFAULT 'efectivo'
                COMMENT 'HU2.3 — Solo dos métodos',
  anulada       TINYINT(1)     NOT NULL DEFAULT 0
                COMMENT 'HU2.5 — 1=venta deshecha, no se borra físicamente',
  anulada_en    DATETIME       DEFAULT NULL
                COMMENT 'HU2.5 — Timestamp del deshacer',
  fecha_venta   DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id_venta),
  CONSTRAINT fk_venta_usuario
    FOREIGN KEY (id_usuario) REFERENCES usuarios (id_usuario)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_venta_producto
    FOREIGN KEY (id_producto) REFERENCES productos (id_producto)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  INDEX idx_venta_fecha    (fecha_venta),
  INDEX idx_venta_usuario  (id_usuario),
  INDEX idx_venta_producto (id_producto),
  INDEX idx_venta_anulada  (anulada)
) ENGINE=InnoDB
  COMMENT='Registro de ventas — Módulo 2';

-- FK diferida para movimientos_inventario → ventas (evita dependencia circular)
ALTER TABLE movimientos_inventario
  ADD CONSTRAINT fk_mov_venta
    FOREIGN KEY (id_venta) REFERENCES ventas (id_venta)
    ON UPDATE CASCADE ON DELETE SET NULL;

-- ============================================================
-- MÓDULO 4 — REPORTES (vistas de apoyo, sin tablas extra)
-- HU4.1 Resumen semana · HU4.2 Semanas anteriores
-- HU4.3 Total por día + gráfica · HU4.4 Ranking productos
-- HU4.5 Desglose por categoría · HU4.6 Compartir WhatsApp
-- Todos los reportes se calculan desde ventas + productos + categorias
-- ============================================================

-- Vista: total vendido por día (HU4.1, HU4.2, HU4.3)
CREATE OR REPLACE VIEW v_ventas_por_dia AS
  SELECT
    DATE(fecha_venta)          AS dia,
    COUNT(*)                   AS num_ventas,
    SUM(subtotal)              AS total_dia
  FROM ventas
  WHERE anulada = 0
  GROUP BY DATE(fecha_venta);

-- Vista: contador de ventas por producto en el día (HU2.4)
CREATE OR REPLACE VIEW v_contador_dia AS
  SELECT
    p.id_producto,
    p.nombre,
    c.nombre                   AS categoria,
    COUNT(v.id_venta)          AS veces_vendido,
    SUM(v.subtotal)            AS dinero_generado
  FROM ventas v
  JOIN productos p ON p.id_producto = v.id_producto
  JOIN categorias c ON c.id_categoria = p.id_categoria
  WHERE v.anulada = 0
    AND DATE(v.fecha_venta) = CURDATE()
  GROUP BY p.id_producto, p.nombre, c.nombre;

-- Vista: ranking de productos (HU4.4) — últimos 7 días por defecto
CREATE OR REPLACE VIEW v_ranking_productos AS
  SELECT
    p.id_producto,
    p.nombre,
    c.nombre                   AS categoria,
    SUM(v.cantidad)            AS total_piezas,
    SUM(v.subtotal)            AS total_dinero
  FROM ventas v
  JOIN productos p ON p.id_producto = v.id_producto
  JOIN categorias c ON c.id_categoria = p.id_categoria
  WHERE v.anulada = 0
    AND v.fecha_venta >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
  GROUP BY p.id_producto, p.nombre, c.nombre
  ORDER BY total_piezas DESC;

-- Vista: desglose por categoría (HU4.5)
CREATE OR REPLACE VIEW v_ventas_por_categoria AS
  SELECT
    c.id_categoria,
    c.nombre                   AS categoria,
    SUM(v.cantidad)            AS total_piezas,
    SUM(v.subtotal)            AS total_dinero
  FROM ventas v
  JOIN productos p ON p.id_producto = v.id_producto
  JOIN categorias c ON c.id_categoria = p.id_categoria
  WHERE v.anulada = 0
    AND v.fecha_venta >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
  GROUP BY c.id_categoria, c.nombre
  ORDER BY total_dinero DESC;