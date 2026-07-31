create  or replace view verClientes as 
select c.id,c.Nombre,c.RFC,c.Razon_social,c.Regimen_fiscal,c.Direccion,c.contacto_principal,c.correo_contacto,
c.CP,c.nombre_constancia,c.ruta_constancia,c.fecha_constancia,
c.id_asesor,c.Estatus,c.fecha_registro,c.asesor_tipo,concat_ws(' ',a.Nombre,a.app,a.apm) as Nombre_asesor
from clientes as c inner join asesores as a on c.id_asesor = a.id
order by id desc;

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
    p.Modelo,
    p.Estanteria,
    p.Caja,
    p.Stock,
    p.Apartado,
    p.origen,
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
    p.id AS id_producto,
    p.Nombre AS nombre_producto,
    p.Codigo_japon,
    p.Codigo_numeral,
    p.Modelo AS modelo_producto,
    pm.Nombre AS marca_producto,
    m.id_asesor,
    CONCAT(a.Nombre, ' ', a.app, ' ', a.apm) AS nombre_asesor,
    m.id_cliente,
    c.Nombre as nombre_cliente
FROM movimientos m
INNER JOIN productos p ON m.id_producto = p.id
LEFT JOIN marca_proveedor pm ON p.id_marca = pm.id
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
    c.Nombre AS nombre_cliente
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
    prod.Modelo AS modelo_producto,
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
    p.Modelo AS modelo_producto,
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
    p.Codigo_japon,
    p.Codigo_numeral,
    p.Nombre AS nombre_producto,
    p.Modelo AS modelo_producto,
    pm.Nombre AS marca_producto,
    dc.cantidad_producto,
    dc.origen,                 -- <-- AQUI SE CAMBIÓ (Antes era extra_descripcion)
    dc.tiempo_entrega,         
    dc.precio_unitario_cotizado,
    (dc.cantidad_producto * dc.precio_unitario_cotizado) AS subtotal_partida
FROM detalles_cotizacion dc
INNER JOIN productos p ON dc.id_producto = p.id
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
    dp.cantidad,
    dp.precio_unitario,
    (dp.cantidad * dp.precio_unitario) AS importe,
    dp.estatus_surtido,
    
    -- Datos del Producto
    p.Codigo_numeral,
    p.Codigo_japon,
    p.Nombre AS nombre_producto,
    p.modelo,
    
    -- Traemos la moneda desde la cotización original
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
