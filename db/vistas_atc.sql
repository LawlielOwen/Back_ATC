CREATE OR REPLACE VIEW verClientes AS 
SELECT 
    c.id, 
    c.Nombre, 
    c.RFC, 
    c.Razon_social, 
    c.Regimen_fiscal, 
    c.Direccion, 
    c.contacto_principal, 
    c.correo_contacto,
    c.CP, 
    c.nombre_constancia, 
    c.ruta_constancia, 
    c.fecha_constancia,
    c.Estatus, 
    c.fecha_registro,
    c.tiene_credito, 
    c.limite_credito,
    GROUP_CONCAT(DISTINCT a.id SEPARATOR ',') AS ids_asesores,
    GROUP_CONCAT(DISTINCT TRIM(CONCAT_WS(' ', a.Nombre, a.app, a.apm)) SEPARATOR ', ') AS Nombres_asesores,
    GROUP_CONCAT(DISTINCT ca.marcas_asignadas SEPARATOR ' | ') AS Marcas_asignadas_todas
FROM clientes c
LEFT JOIN cliente_asesor ca ON c.id = ca.id_cliente
LEFT JOIN asesores a ON ca.id_asesor = a.id
GROUP BY c.id
ORDER BY c.id DESC;

CREATE OR REPLACE VIEW verAsesores AS
SELECT 
    a.id,
    a.Nombre,      -- Agregamos el nombre separado
    a.app,         -- Agregamos apellido paterno
    a.apm,         -- Agregamos apellido materno
    CONCAT_WS(' ', a.Nombre, a.app, a.apm) AS Nombre_completo,
    a.telefono,
    a.usuario,
    a.Estatus,
    a.Rol,
    a.Fecha_nacimiento,
    a.Fecha_contratacion,
    a.Correo 
FROM asesores AS a;

CREATE OR REPLACE VIEW verProductos AS
SELECT 
    p.id,
    p.Nombre,
    p.Descripcion,
    p.ExtraDescripcion, 
    p.Precio,
    p.Codigo_numeral,
    p.Codigo_japon,
    p.Estanteria,
    p.Caja,
    p.Stock,
    p.Apartado,
    p.Estatus,
    p.id_marca,
    m.Nombre AS Marca
FROM productos p
LEFT JOIN marca_proveedor m ON p.id_marca = m.id 
ORDER BY p.id DESC;



CREATE OR REPLACE VIEW verMovimientos AS
SELECT 
    m.id AS id_movimiento,
    m.tipo_movimiento,
    m.destino,
    m.cantidad,
    m.fecha,
    
    -- Identificadores (Puede venir uno u otro)
    m.id_producto,
    m.id_demo,
    
    -- Unificamos el Nombre (Producto normal o Equipo Demo)
    COALESCE(p.Nombre, sd.nombre_modelo) AS nombre_producto,
    
    -- Códigos
    p.Codigo_japon,
    -- Si no hay código numeral, mostramos el número de serie del demo
    COALESCE(p.Codigo_numeral, sd.numero_serie) AS Codigo_numeral,
    
    -- La marca unificada aparecerá aquí gracias al LEFT JOIN modificado
    pm.Nombre AS marca_producto,
    
    -- Datos del Asesor / Técnico
    m.id_asesor,
    CONCAT(a.Nombre, ' ', a.app, ' ', a.apm) AS nombre_asesor,
    
    -- Datos del Cliente / Empresa Destino
    m.id_cliente,
    COALESCE(c.Nombre, m.empresa_no_registrada) AS nombre_cliente
    
FROM movimientos m
-- Cambiamos a LEFT JOIN para que no se excluyan los movimientos que no tienen id_producto (Demos)
LEFT JOIN productos p ON m.id_producto = p.id
-- Agregamos la tabla de demos
LEFT JOIN stock_demo sd ON m.id_demo = sd.id

-- ¡LA MAGIA AQUÍ! 
-- Une la tabla de marcas tomando el id_marca del producto, y si es nulo, toma el id_marca del demo.
LEFT JOIN marca_proveedor pm ON pm.id = COALESCE(p.id_marca, sd.id_marca)

LEFT JOIN asesores a ON m.id_asesor = a.id
LEFT JOIN clientes c ON m.id_cliente = c.id
ORDER BY m.fecha DESC;

CREATE OR REPLACE VIEW verVales AS
SELECT 
    v.id AS id_vale,
    CONCAT(
        'S-', 
        YEAR(v.fecha), 
        '-', 
        IF(v.consecutivo_anual < 10000, LPAD(v.consecutivo_anual, 4, '0'), v.consecutivo_anual)
    ) AS folio_vale, 
    p.orden_compra,
    v.fecha,
    v.estatus,
    v.comentario,
    v.id_asesor,
    CONCAT(a.Nombre, ' ', a.app, ' ', a.apm) AS nombre_asesor,
    v.id_cliente,
    -- MAGIA AQUÍ: Si el cliente es NULL, usa la empresa no registrada
    COALESCE(c.Nombre, v.empresa_no_registrada) AS nombre_cliente,
    v.tipo_vale
FROM vales_salida v
INNER JOIN asesores a ON v.id_asesor = a.id
LEFT JOIN clientes c ON v.id_cliente = c.id
LEFT JOIN pedidos p ON v.id_pedido = p.id;

CREATE OR REPLACE VIEW verPedidosGeneral AS
SELECT 
    p.id AS id_pedido,
    p.id_proveedor AS id_proveedor, -- <-- CORREGIDO
    p.id_asesor,
    p.fecha_solicitud,
    p.fecha_estimada,
    p.Estatus,
    p.alerta_enviada,
    prov.Nombre AS nombre_proveedor, 
    CONCAT(a.Nombre, ' ', a.app, ' ', a.apm) AS nombre_asesor,        
    COUNT(dp.id_producto) AS total_modelos_diferentes,
    SUM(dp.cantidad) AS total_piezas
FROM pedidos_proveedores p
LEFT JOIN marca_proveedor prov ON p.id_proveedor = prov.id
LEFT JOIN asesores a ON p.id_asesor = a.id
LEFT JOIN detalles_pedido_proveedor dp ON p.id = dp.id_pedido
GROUP BY 
    p.id, p.id_proveedor, p.id_asesor, p.fecha_solicitud, p.fecha_estimada, 
    p.Estatus, p.alerta_enviada, prov.Nombre, a.nombre, a.app, a.apm;
    
CREATE OR REPLACE VIEW verDetallesPedidos AS
SELECT 
    dp.id_pedido,
    dp.cantidad,
    dp.destino,
    prod.id AS id_producto,
    prod.Nombre AS nombre_producto,
    prod.Codigo_japon,
    prod.Codigo_numeral,
    m.Nombre AS marca_producto
FROM detalles_pedido_proveedor dp
INNER JOIN productos prod ON dp.id_producto = prod.id
LEFT JOIN marca_proveedor m ON prod.id_marca = m.id;

CREATE OR REPLACE VIEW verIncidentes AS
SELECT 
    i.id AS id_incidente,
    i.id_pedido,
    i.cantidad_afectada,
    i.Descripcion,
    i.Tipo,
    i.Fecha_incidente,
    CONCAT(a.Nombre, ' ', a.app, ' ', a.apm) AS nombre_asesor,
    p.Nombre AS nombre_producto,
    p.Codigo_japon,
    p.Codigo_numeral,
    mp.Nombre AS nombre_proveedor
FROM incidentes i
LEFT JOIN asesores a ON i.id_asesor = a.id
LEFT JOIN productos p ON i.id_producto = p.id
LEFT JOIN marca_proveedor mp ON i.id_proveedor = mp.id;

CREATE OR REPLACE VIEW verCot AS 
SELECT 
    c.id, 
    c.num_cotizacion,
    c.id_asesor,
    CONCAT(a.Nombre, ' ', a.app, ' ', a.apm) AS nombre_asesor, -- Obtenemos el nombre del creador
    c.fecha, 
    c.Estatus, 
    c.id_cliente,
    COALESCE(cl.Nombre, c.nombre_prospecto) AS nombre_cliente_final,
    cl.RFC AS rfc_cliente,
    
    c.contacto,         -- NUEVO
    c.ciudad_destino,   -- NUEVO
    c.moneda,           -- NUEVO
    c.vigencia_dias,    -- NUEVO
    c.tipo_cambio, 
    
    c.subtotal, 
    c.iva, 
    c.total, 
    COUNT(dc.id_producto) AS total_tipos_productos,
    SUM(dc.cantidad_producto) AS total_piezas
FROM cotizaciones c
LEFT JOIN clientes cl ON c.id_cliente = cl.id
LEFT JOIN asesores a ON c.id_asesor = a.id  -- Nuevo Join para el asesor
LEFT JOIN detalles_cotizacion dc ON c.id = dc.id_cotizacion
GROUP BY 
    c.id, 
    c.num_cotizacion,
    c.id_asesor,
    a.Nombre, a.app, a.apm,
    c.fecha, 
    c.Estatus, 
    c.id_cliente, 
    cl.Nombre, 
    c.nombre_prospecto, 
    cl.RFC, 
    c.contacto,
    c.ciudad_destino,
    c.moneda,
    c.vigencia_dias,
    c.tipo_cambio, 
    c.subtotal, 
    c.iva, 
    c.total
ORDER BY id DESC;

CREATE OR REPLACE VIEW verDetallesCot AS
SELECT 
    dc.id AS id_detalle,
    dc.id_cotizacion,
    dc.id_producto,
    
    COALESCE(p.Codigo_numeral, dc.codigo_manual) AS codigo_producto,
    p.Nombre AS modelo_producto, 
    COALESCE(p.Descripcion, dc.descripcion_manual) AS nombre_producto,
    COALESCE(p.ExtraDescripcion, dc.extra_descripcion_manual) AS extra_descripcion,
    
    pm.Nombre AS marca_producto,
    dc.cantidad_producto,
    dc.origen,                 
    dc.tiempo_entrega,         
    dc.precio_unitario_cotizado,
    dc.tipo_flete,
    dc.valor_flete,
    dc.moneda_flete,
    dc.costo_flete,
    ((dc.cantidad_producto * dc.precio_unitario_cotizado) + dc.costo_flete) AS subtotal_partida
    
FROM detalles_cotizacion dc
LEFT JOIN productos p ON dc.id_producto = p.id
LEFT JOIN marca_proveedor pm ON p.id_marca = pm.id;

CREATE OR REPLACE VIEW verNotificaciones AS
SELECT 
    n.id,
    n.fecha,
    n.tipo_notificacion,
    n.id_asesor,
    n.mensaje,
    n.leida
    -- Puedes agregar JOINs aquí si necesitas el nombre del asesor, por ejemplo:
    -- , a.nombre as nombre_asesor 
FROM notificaciones n
-- LEFT JOIN asesores a ON n.id_asesor = a.id
ORDER BY n.fecha DESC;

CREATE OR REPLACE VIEW verPedidos AS
SELECT 
    p.id,
    p.id_cotizacion,
    p.orden_compra,
    p.fecha AS fecha_pedido,
    p.fecha_limite,
    p.Estatus,
    p.nombre_factura,
    p.factura_ruta,
    p.fecha_factura,
    p.alerta_enviada,
    
    -- Datos del Cliente
    p.id_cliente,
    c.Nombre AS nombre_cliente,
    c.Razon_social,
    c.RFC,
    c.contacto_principal,
    c.correo_contacto,
    p.id_asesor,
    TRIM(CONCAT(a.Nombre, ' ', a.app, ' ', IFNULL(a.apm, ''))) AS nombre_asesor

FROM pedidos p
LEFT JOIN clientes c ON p.id_cliente = c.id
LEFT JOIN asesores a ON p.id_asesor = a.id
ORDER BY p.id DESC;

CREATE OR REPLACE VIEW verDetallesPedido AS
SELECT 
    dp.id AS id_detalle,
    dp.id_pedido,
    dp.id_producto,
    
    COALESCE(p.Codigo_numeral, dp.codigo_manual) AS codigo_producto,     
    COALESCE(p.Descripcion, dp.descripcion_manual) AS nombre_producto, 
    COALESCE(p.ExtraDescripcion, dp.extra_descripcion_manual) AS extra_descripcion,
    
    p.Codigo_japon,
    
    dp.cantidad,
    dp.cantidad_surtida,
    dp.precio_unitario,
    dp.costo_flete,
    
    -- =======================================================
    -- NUEVO CÁLCULO: (Precio * Cantidad) + Flete
    -- =======================================================
    ((dp.cantidad * dp.precio_unitario) + dp.costo_flete) AS importe,
    
    dp.estatus_surtido,
    c.moneda,
    c.tipo_cambio
    
FROM detalles_pedido dp
LEFT JOIN productos p ON dp.id_producto = p.id
LEFT JOIN pedidos ped ON dp.id_pedido = ped.id
LEFT JOIN cotizaciones c ON ped.id_cotizacion = c.id
ORDER BY dp.id ASC;

CREATE OR REPLACE VIEW vw_tickets AS
SELECT 
    t.id AS id_ticket,
    t.url_ticket,
    
    -- Datos del Asesor
    t.id_asesor,
    CONCAT_WS(' ', a.Nombre, a.app, a.apm) AS nombre_asesor,
    
    -- Datos del Cliente / Prospecto
    t.id_cliente,
    c.Nombre AS nombre_cliente_oficial,
    t.nombre_prospecto,
    -- Columna de apoyo: Devuelve el nombre del cliente si existe, si no, devuelve el prospecto
    IFNULL(c.Nombre, t.nombre_prospecto) AS cliente_final,
    
    -- Banderas y Estatus (Crudos, para que Angular los interprete)
    t.estatus,
    t.venta_exitosa,
    t.cliente_registrado,
    
    -- Datos complementarios
    t.comentarios,
    t.fecha_alta,
    t.fecha_cierre

FROM tickets t
INNER JOIN asesores a ON t.id_asesor = a.id
LEFT JOIN clientes c ON t.id_cliente = c.id;

CREATE OR REPLACE VIEW verStockDemos AS
SELECT 
    sd.id AS id_demo,
    sd.nombre_modelo,
    sd.descripcion,
    sd.numero_serie,
    sd.stock,
    sd.estatus,
    
    -- Datos de la marca
    sd.id_marca,
    mp.Nombre AS marca_proveedor
    
FROM stock_demo sd
LEFT JOIN marca_proveedor mp ON sd.id_marca = mp.id
ORDER BY sd.id DESC;

CREATE OR REPLACE VIEW verVisitasDemostracion AS
SELECT 
    vd.id AS id_visita,
    vd.fecha_visita,
    vd.resumen_actividades,
    vd.estatus,
    
    -- Datos del Técnico de Soporte (Quien registra)
    vd.id_tecnico,
    TRIM(CONCAT(t.Nombre, ' ', t.app, ' ', IFNULL(t.apm, ''))) AS nombre_tecnico,
    
    -- Datos del Asesor de Ventas (Acompañado)
    vd.id_asesor,
    TRIM(CONCAT(a.Nombre, ' ', a.app, ' ', IFNULL(a.apm, ''))) AS nombre_asesor,
    
    -- Datos del Cliente / Empresa
    vd.id_cliente,
    c.Nombre AS nombre_cliente_oficial,
    vd.empresa_no_registrada,
    
    -- Columna de apoyo para Angular: Devuelve el cliente oficial o el texto libre
    COALESCE(c.Nombre, vd.empresa_no_registrada) AS empresa_destino
    
FROM visitas_demostracion vd
LEFT JOIN asesores t ON vd.id_tecnico = t.id
LEFT JOIN asesores a ON vd.id_asesor = a.id
LEFT JOIN clientes c ON vd.id_cliente = c.id
ORDER BY vd.fecha_visita DESC;

CREATE OR REPLACE VIEW verDetallesVisitaDemo AS
SELECT 
    dvd.id AS id_detalle,
    dvd.id_visita,
    dvd.id_demo,
    dvd.cantidad,
    dvd.estatus_retorno,
    
    -- Información del producto demo prestado
    sd.nombre_modelo,
    sd.descripcion,
    sd.numero_serie,
    mp.Nombre AS marca_proveedor
    
FROM detalle_visita_demos dvd
LEFT JOIN stock_demo sd ON dvd.id_demo = sd.id
LEFT JOIN marca_proveedor mp ON sd.id_marca = mp.id
ORDER BY dvd.id ASC;

CREATE OR REPLACE VIEW verProyectosSoporte AS
SELECT 
    ps.id AS id_proyecto,
    ps.nombre_proyecto,
    ps.descripcion,
    ps.fecha_alta,
    ps.fecha_termino,
    ps.se_cotizo,
    ps.estatus,
    
    -- Datos del Asesor / Técnico responsable
    ps.id_tecnico,
    CONCAT(a.Nombre, ' ', a.app, ' ', a.apm) AS nombre_tecnico,
    
    -- Datos de la Empresa (Registrada o No Registrada)
    ps.id_cliente,
    COALESCE(c.Nombre, ps.empresa_no_registrada) AS empresa_destino
    
FROM proyectos_soporte ps
INNER JOIN asesores a ON ps.id_tecnico = a.id
LEFT JOIN clientes c ON ps.id_cliente = c.id;

CREATE OR REPLACE VIEW verMaterialesProyecto AS
SELECT 
    mp.id AS id_detalle,
    mp.id_proyecto,
    mp.cantidad,
    mp.id_producto,
    COALESCE(p.Nombre, mp.nombre_modelo) AS nombre_producto,
    p.Codigo_japon,
    p.Codigo_numeral,
    mp.codigo AS codigo_manual, -- <--- NUEVO: Sacamos el código de la partida manual
    COALESCE(m.Nombre, mp.marca) AS marca_producto
FROM materiales_proyecto mp
LEFT JOIN productos p ON mp.id_producto = p.id
LEFT JOIN marca_proveedor m ON p.id_marca = m.id;


-- ==========================================================
-- 3. VISTA DE LA BITÁCORA (Para ver los reportes semanales)
-- ==========================================================
CREATE OR REPLACE VIEW verBitacoraProyecto AS
SELECT
    ba.id AS id_bitacora,
    ba.id_proyecto,
    ba.fecha_registro,
    ba.estatus_anterior,
    ba.estatus_nuevo,
    ba.id_usuario,
    a.Nombre AS nombre_asesor,
    ba.tipo_evento,
    ba.comentarios
FROM bitacora_avances ba
LEFT JOIN asesores a ON a.id = ba.id_usuario
ORDER BY ba.fecha_registro DESC;

