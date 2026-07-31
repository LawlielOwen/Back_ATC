ALTER TABLE productos ADD INDEX idx_codigos (Codigo_numeral, Codigo_japon, Modelo);

ALTER TABLE productos ADD INDEX idx_nombre (Nombre);
-- 1. Búsqueda rápida por número exacto de cotización
ALTER TABLE cotizaciones ADD INDEX idx_num_cotizacion (num_cotizacion);

-- 2. Búsqueda rápida por el nombre del prospecto (cuando no están registrados)
ALTER TABLE cotizaciones ADD INDEX idx_nombre_prospecto (nombre_prospecto);

-- 3. Índice Compuesto para reportes y filtros del listado

ALTER TABLE cotizaciones ADD INDEX idx_fecha_estatus (fecha, Estatus);


ALTER TABLE cotizaciones ADD INDEX idx_id_cliente (id_cliente);
ALTER TABLE detalles_cotizacion ADD INDEX idx_cotizacion_id (id_cotizacion);

-- Optimiza el ORDER BY nativo de tu vista y las búsquedas por rango de fechas
ALTER TABLE movimientos ADD INDEX idx_movimientos_fecha (fecha);

-- Optimiza los filtros combinados (ej. "Mostrar solo Entradas ordenadas por fecha")
ALTER TABLE movimientos ADD INDEX idx_movimientos_tipo_fecha (tipo_movimiento, fecha);

-- Para el INNER JOIN con la tabla Productos
ALTER TABLE movimientos ADD INDEX idx_mov_id_producto (id_producto);

-- Para el LEFT JOIN con la tabla Asesores
ALTER TABLE movimientos ADD INDEX idx_mov_id_asesor (id_asesor);

-- Para el LEFT JOIN que hace la tabla Productos con las marcas
ALTER TABLE productos ADD INDEX idx_prod_id_marca (id_marca);

CREATE INDEX idx_notif_asesor_leida_fecha 
ON notificaciones (id_asesor, leida, fecha);

-- crom job
-- Índices para llaves foráneas (Aceleran las relaciones y consultas por usuario/cliente)
CREATE INDEX idx_vales_asesor ON vales_salida(id_asesor);
CREATE INDEX idx_vales_cliente ON vales_salida(id_cliente);

-- Índices para filtros de búsqueda en la UI
CREATE INDEX idx_vales_estatus ON vales_salida(estatus);
CREATE INDEX idx_vales_fecha ON vales_salida(fecha);

-- Índices para llaves foráneas
CREATE INDEX idx_pedidos_asesor ON pedidos_proveedores(id_asesor);
CREATE INDEX idx_pedidos_proveedor ON pedidos_proveedores(id_proveedor);

-- Índice compuesto específico para optimizar el Cron Job de notificaciones
-- (Busca Estatus = 0, alerta_enviada = 0 y una fecha_estimada específica)

-- Índices para los filtros de la tabla en Angular
