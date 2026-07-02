-- ============================================================
-- PROYECTO: Sistema de Gestión - Nevería
-- ARCHIVO:  neveria_seeder.sql  (Datos semilla)
-- AUTOR:    Cristian Eduardo Flores Medina
-- EJECUTAR: después de neveria_ddl.sql
-- ============================================================

USE neveria;
SET FOREIGN_KEY_CHECKS = 0;

-- ============================================================
-- USUARIOS  (HU5.1 — HU5.6)
-- Roles: dueno / encargado / empleado
-- PINs de ejemplo (en producción generar con bcrypt en backend):
--   Diego  → PIN: 1234
--   María  → PIN: 5678
--   Luis   → PIN: 9012
-- ============================================================
INSERT INTO usuarios (nombre, pin_hash, rol, activo) VALUES
('Diego (Dueño)',
 '$2b$10$K.A8LkIZB/6hZJ7c9kDyEOYAUHQq7P6Rte3F/xNZG1MgCWK5GQmVG',
 'dueno', 1),
('María (Encargada)',
 '$2b$10$N2RtPpOuFdVb3eLjKXn/9uNJ8T4z5MQoD1Gv7Y6Wk0qBHm3ClsPai',
 'encargado', 1),
('Luis (Empleado)',
 '$2b$10$XqT7VW9aLM3HnBkYpR2s1OJcEf6DuZ0vXN8gP5Kl4Ai1Cm3QtbWrH',
 'empleado', 1);

-- ============================================================
-- CATEGORÍAS  (HU1.5 — las 5 categorías del negocio)
-- ============================================================
INSERT INTO categorias (nombre) VALUES
('Vasos'),
('Barquillos'),
('Canastas'),
('Aguas'),
('Envases');

-- ============================================================
-- PRODUCTOS  (HU1.1 — catálogo real de la nevería)
-- ============================================================
INSERT INTO productos (id_categoria, nombre, tamanio, precio, activo) VALUES
-- Vasos (id_categoria = 1)
(1, 'Vaso de nieve',     'Chico',   18.00, 1),
(1, 'Vaso de nieve',     'Mediano',  25.00, 1),
(1, 'Vaso de nieve',     'Grande',   35.00, 1),
(1, 'Vaso con fruta',    'Chico',   22.00, 1),
(1, 'Vaso con fruta',    'Grande',   38.00, 1),
-- Barquillos (id_categoria = 2)
(2, 'Barquillo sencillo','Una bola', 18.00, 1),
(2, 'Barquillo doble',   'Dos bolas',30.00, 1),
(2, 'Barquillo triple',  'Tres bolas',42.00, 1),
(2, 'Barquillo con cajeta','Una bola',22.00, 1),
-- Canastas (id_categoria = 3)
(3, 'Canasta mediana',   'Mediana',  45.00, 1),
(3, 'Canasta grande',    'Grande',   65.00, 1),
(3, 'Canasta familiar',  'Familiar', 90.00, 1),
-- Aguas (id_categoria = 4)
(4, 'Agua de jamaica',   '500 ml',   20.00, 1),
(4, 'Agua de horchata',  '500 ml',   20.00, 1),
(4, 'Agua de limón',     '500 ml',   18.00, 1),
(4, 'Agua de tamarindo', '500 ml',   20.00, 1),
(4, 'Agua de pepino',    '500 ml',   20.00, 1),
-- Envases (id_categoria = 5)
(5, 'Medio litro nieve', '500 ml',   55.00, 1),
(5, 'Un litro de nieve', '1 litro',  95.00, 1),
(5, 'Dos litros de nieve','2 litros',170.00, 1),
(5, 'Nieve para regalo', '1 litro', 110.00, 1),
-- Producto desactivado de ejemplo (HU1.4)
(1, 'Vaso especial temporada', 'Mediano', 30.00, 0);

-- ============================================================
-- INVENTARIO  (HU3.1 — stock inicial en piezas)
-- cantidad_minima = 10 por defecto (HU3.5 — alerta)
-- ============================================================
INSERT INTO inventario (id_producto, cantidad_actual, cantidad_minima) VALUES
(1,  45, 10),   -- Vaso chico
(2,  38, 10),   -- Vaso mediano
(3,  30, 10),   -- Vaso grande
(4,  20, 10),   -- Vaso con fruta chico
(5,  15, 10),   -- Vaso con fruta grande
(6,  60, 15),   -- Barquillo sencillo
(7,  40, 10),   -- Barquillo doble
(8,  25, 10),   -- Barquillo triple
(9,  20, 10),   -- Barquillo cajeta
(10, 18, 8),    -- Canasta mediana
(11, 12, 5),    -- Canasta grande
(12,  8, 3),    -- Canasta familiar  ← ya está en alerta (8 <= 10 default, pero su mínimo es 3)
(13, 30, 10),   -- Agua jamaica
(14, 28, 10),   -- Agua horchata
(15, 35, 10),   -- Agua limón
(16, 22, 10),   -- Agua tamarindo
(17, 20, 10),   -- Agua pepino
(18, 10, 5),    -- Medio litro nieve  ← en alerta (10 <= 10)
(19,  6, 3),    -- Un litro nieve
(20,  4, 2),    -- Dos litros nieve
(21,  3, 2),    -- Nieve regalo
(22,  0, 5);    -- Vaso especial (desactivado)

-- ============================================================
-- VENTAS DE EJEMPLO (últimos 3 días, solo ventas activas)
-- ============================================================
INSERT INTO ventas
  (id_usuario, id_producto, cantidad, precio_venta, subtotal, metodo_pago, anulada, fecha_venta)
VALUES
-- Hace 2 días
(2, 6, 1, 18.00, 18.00, 'efectivo',      0, NOW() - INTERVAL 2 DAY + INTERVAL '10:05' HOUR_MINUTE),
(2, 1, 1, 18.00, 18.00, 'efectivo',      0, NOW() - INTERVAL 2 DAY + INTERVAL '10:12' HOUR_MINUTE),
(2,13, 1, 20.00, 20.00, 'efectivo',      0, NOW() - INTERVAL 2 DAY + INTERVAL '10:12' HOUR_MINUTE),
(2, 7, 1, 30.00, 30.00, 'transferencia', 0, NOW() - INTERVAL 2 DAY + INTERVAL '11:30' HOUR_MINUTE),
(2, 2, 2, 25.00, 50.00, 'efectivo',      0, NOW() - INTERVAL 2 DAY + INTERVAL '13:00' HOUR_MINUTE),
(3, 6, 1, 18.00, 18.00, 'efectivo',      0, NOW() - INTERVAL 2 DAY + INTERVAL '16:45' HOUR_MINUTE),
-- Ayer
(2, 8, 1, 42.00, 42.00, 'efectivo',      0, NOW() - INTERVAL 1 DAY + INTERVAL '09:20' HOUR_MINUTE),
(3, 6, 2, 18.00, 36.00, 'efectivo',      0, NOW() - INTERVAL 1 DAY + INTERVAL '10:05' HOUR_MINUTE),
(2,19, 1, 95.00, 95.00, 'transferencia', 0, NOW() - INTERVAL 1 DAY + INTERVAL '11:00' HOUR_MINUTE),
(2, 4, 1, 22.00, 22.00, 'efectivo',      0, NOW() - INTERVAL 1 DAY + INTERVAL '12:30' HOUR_MINUTE),
(3, 7, 1, 30.00, 30.00, 'efectivo',      0, NOW() - INTERVAL 1 DAY + INTERVAL '15:00' HOUR_MINUTE),
-- Ejemplo venta anulada (HU2.5)
(2, 3, 1, 35.00, 35.00, 'efectivo',      1, NOW() - INTERVAL 1 DAY + INTERVAL '17:00' HOUR_MINUTE),
-- Hoy
(2, 6, 1, 18.00, 18.00, 'efectivo',      0, NOW() - INTERVAL '02:10' HOUR_MINUTE),
(2, 1, 1, 18.00, 18.00, 'transferencia', 0, NOW() - INTERVAL '01:45' HOUR_MINUTE),
(3,14, 1, 20.00, 20.00, 'efectivo',      0, NOW() - INTERVAL '01:00' HOUR_MINUTE),
(3, 9, 1, 22.00, 22.00, 'efectivo',      0, NOW() - INTERVAL '00:30' HOUR_MINUTE);

-- ============================================================
-- MOVIMIENTOS DE INVENTARIO (HU3.2 — entradas iniciales)
-- ============================================================
INSERT INTO movimientos_inventario
  (id_producto, id_usuario, tipo, cantidad, nota, id_venta)
VALUES
-- Entradas iniciales (HU3.3)
(1,  1, 'entrada', 50, 'Stock inicial apertura', NULL),
(2,  1, 'entrada', 40, 'Stock inicial apertura', NULL),
(6,  1, 'entrada', 65, 'Stock inicial apertura', NULL),
(13, 1, 'entrada', 35, 'Compra Jamaica 35 bolsas', NULL),
(19, 1, 'entrada', 8,  'Pedido envases 1L', NULL),
-- Ventas (HU3.2 — descuento automático al registrar venta)
(6,  2, 'venta',   1,  NULL, 1),
(1,  2, 'venta',   1,  NULL, 2),
(13, 2, 'venta',   1,  NULL, 3),
(7,  2, 'venta',   1,  NULL, 4),
(2,  2, 'venta',   2,  NULL, 5),
-- Ajuste a la baja (HU3.4 — merma)
(12, 1, 'ajuste_baja', 2, 'Canastas dañadas por humedad', NULL);

SET FOREIGN_KEY_CHECKS = 1;

-- ============================================================
-- VERIFICACIÓN FINAL
-- ============================================================
SELECT 'usuarios'                AS tabla, COUNT(*) AS filas FROM usuarios
UNION ALL SELECT 'categorias',   COUNT(*) FROM categorias
UNION ALL SELECT 'productos',    COUNT(*) FROM productos
UNION ALL SELECT 'inventario',   COUNT(*) FROM inventario
UNION ALL SELECT 'ventas',       COUNT(*) FROM ventas
UNION ALL SELECT 'movimientos',  COUNT(*) FROM movimientos_inventario;

-- Verificar productos en alerta de stock (HU3.5)
SELECT p.nombre, i.cantidad_actual, i.cantidad_minima,
       '⚠ Stock bajo' AS alerta
FROM inventario i
JOIN productos p ON p.id_producto = i.id_producto
WHERE i.cantidad_actual <= i.cantidad_minima
ORDER BY i.cantidad_actual;`