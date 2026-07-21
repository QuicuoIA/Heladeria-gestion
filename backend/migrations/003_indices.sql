-- ============================================================
-- MIGRACIÓN: 003_indices.sql
-- DESCRIPCIÓN: Índices de rendimiento para consultas frecuentes
-- ============================================================

USE neveria;

-- Índice compuesto: fecha_venta + anulada (filtros más comunes en reportes)
ALTER TABLE ventas
  ADD INDEX IF NOT EXISTS idx_ventas_fecha_anulada (fecha_venta, anulada);

-- Índice compuesto: id_producto + fecha_venta (ranking de productos por período)
ALTER TABLE ventas
  ADD INDEX IF NOT EXISTS idx_ventas_producto_fecha (id_producto, fecha_venta);

-- Índice compuesto: id_producto + cantidad_actual (alertas de stock bajo)
ALTER TABLE inventario
  ADD INDEX IF NOT EXISTS idx_inv_producto_stock (id_producto, cantidad_actual);

-- Índice compuesto: fecha + tipo (historial de movimientos filtrado por tipo)
ALTER TABLE movimientos_inventario
  ADD INDEX IF NOT EXISTS idx_mov_fecha_tipo (fecha, tipo);
