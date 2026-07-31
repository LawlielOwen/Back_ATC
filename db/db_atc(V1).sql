-- Crear la base de datos
CREATE DATABASE IF NOT EXISTS db_atc;
USE db_atc;

-- 1. Tabla Asesores (Sin dependencias previas)
CREATE TABLE asesores (
    id INT AUTO_INCREMENT PRIMARY KEY,
    Nombre VARCHAR(200),
    app VARCHAR(80),
    apm VARCHAR(80),
    telefono VARCHAR(14),
    usuario VARCHAR(100),
    contra VARCHAR(255),
    Estatus TINYINT,
    Rol ENUM('Almacen', 'Cotizador', 'Administrador','Asesor'),
	Fecha_nacimiento date,
    Fecha_contratacion date,
    Correo varchar(100)
);

INSERT INTO asesores (Nombre, app, apm, telefono, usuario, contra, Estatus, Rol, Fecha_nacimiento, Fecha_contratacion, Correo)
VALUE ('Morgan','Gutierrez','Moreno','4776732450','hola','$2b$10$UMBZGc8iQWfNSnmsce3H4OhEcaRrV6/ajDie/9VtmQsNl1/n9XLRy',1,'Administrador',
'2005-06-10','2025-12-02','mgmoreno@atc.com');

CREATE TABLE marca_proveedor(
id INT AUTO_INCREMENT primary KEY,
Nombre VARCHAR(100));

INSERT INTO `marca_proveedor` VALUES 
(1, 'SMC'),
(2, 'OMRON'),
(3, 'PATLITE'),
(4, 'WAGO'),
(5, 'RWV'),
(6, 'KLINGSPOR'),
(7, 'KING TONY'),
(8, 'Mighty Seven (m7)'),
(9, 'Fuji Electric'),
(10, 'Sumitomo Drive Technologies'),
(11, 'Wenglor'),
(12, 'PHOENIX CONTACT'),
(13, 'PILZ'),
(14, 'EUCHNER'),
(15, 'CONTRINEX');

-- 2. Tabla Productos (Sin dependencias previas)
CREATE TABLE productos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    Nombre VARCHAR(100),
    Descripcion VARCHAR(250),
    ExtraDescripcion text,
    Precio DECIMAL(10,2),
    Codigo_numeral VARCHAR(10),
    Codigo_japon VARCHAR(45),
    Modelo VARCHAR(45),
    Estanteria VARCHAR(10),
    Caja enum('A','B','C','D'),
    Stock INT,
    Apartado INT,
    origen varchar (200),
    Estatus TINYINT,
    id_marca int,
    FOREIGN KEY (id_marca) REFERENCES marca_proveedor(id)
);

-- 3. Tabla Clientes (Depende de Asesores)
CREATE TABLE clientes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    Nombre VARCHAR(100),
    RFC VARCHAR(13),
    Razon_social VARCHAR(80),
    Regimen_Fiscal VARCHAR(45),
    Direccion TEXT,
    contacto_principal VARCHAR(15), 
    correo_contacto VARCHAR(300),    -- NUEVO: Correo del contacto
    CP VARCHAR(10),
    nombre_constancia VARCHAR(255), 
    ruta_constancia TEXT,
    fecha_constancia DATETIME NULL,
    id_asesor INT,
    Estatus TINYINT,
    fecha_registro DATE,
    asesor_tipo ENUM('Asesor propio','Asignado por la sucursal'),
    FOREIGN KEY (id_asesor) REFERENCES asesores(id)
);

-- 4. Tabla Cotizaciones (Depende de Clientes)
CREATE TABLE cotizaciones (
    id INT AUTO_INCREMENT PRIMARY KEY,
    num_cotizacion VARCHAR(20),
    id_asesor INT,                   -- NUEVO: Para saber exactamente quién hizo la cotización
    Estatus INT,
    id_cliente INT NULL,
    nombre_prospecto VARCHAR(150),
    contacto VARCHAR(150),           -- NUEVO: Persona a la que va dirigida (Ej. Luis Imperial)
    ciudad_destino VARCHAR(100),     -- NUEVO: Ciudad que aparece en el PDF (Ej. LEON GTO)
    tipo_cambio DECIMAL(10,4),
    moneda VARCHAR(20) DEFAULT 'MONEDA NACIONAL', -- NUEVO: Para especificar MXN o USD
    fecha DATE,
    vigencia_dias INT DEFAULT 15,    -- NUEVO: Días de validez del documento
    ruta_cotizacion TEXT,
    subtotal DECIMAL(10,2),
    iva DECIMAL(10,2),
    total DECIMAL(10,2),
    FOREIGN KEY (id_cliente) REFERENCES clientes(id),
    FOREIGN KEY (id_asesor) REFERENCES asesores(id) -- NUEVO: Relación con el asesor creador
);


-- 7. Tabla movimientos (Depende de Productos)

CREATE TABLE movimientos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    id_producto INT,
    id_asesor INT, -- Aseguramos que el asesor que registró el movimiento exista
    id_cliente INT NULL, -- Permite NULL porque las entradas o mermas no llevan cliente
    tipo_movimiento ENUM('Entrada', 'Salida', 'Ajuste'), 
    fecha DATETIME,
    cantidad INT,
    destino ENUM('Almacen', 'Pedido'),
    FOREIGN KEY (id_producto) REFERENCES productos(id),
    FOREIGN KEY (id_asesor) REFERENCES asesores(id),
    FOREIGN KEY (id_cliente) REFERENCES clientes(id)
);

-- 8. Tabla detalles_cotizacion (Depende de Productos y Cotizaciones)
CREATE TABLE detalles_cotizacion (
    id INT AUTO_INCREMENT PRIMARY KEY,
    id_producto INT,
    id_cotizacion INT,
    cantidad_producto INT,
    origen VARCHAR(150),  -- MOVIDO AQUÍ: Texto extra para este producto específico
    tiempo_entrega VARCHAR(100),     -- NUEVO: Ej. "1-2 DIAS SPV" o "INMEDIATO"
    precio_unitario_cotizado DECIMAL(10,2),
    FOREIGN KEY (id_producto) REFERENCES productos(id),
    FOREIGN KEY (id_cotizacion) REFERENCES cotizaciones(id)
);

-- 9. Tabla Pedidos (Depende de Clientes, Asesores y Cotizaciones)
CREATE TABLE pedidos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    id_cliente INT,
    id_asesor INT,
    orden_compra VARCHAR(100),
    nombre_factura VARCHAR(100),
    factura_ruta TEXT,
    fecha_factura DATETIME,
    fecha DATE,
    fecha_limite DATE,
    Estatus INT,
    id_cotizacion INT,
    alerta_enviada TINYINT,
    FOREIGN KEY (id_cliente) REFERENCES clientes(id),
    FOREIGN KEY (id_asesor) REFERENCES asesores(id),
    FOREIGN KEY (id_cotizacion) REFERENCES cotizaciones(id)
);

-- 10. Tabla pedidos_proveedores (Depende de Asesores y Productos)
CREATE TABLE pedidos_proveedores (
    id INT AUTO_INCREMENT PRIMARY KEY,
    fecha_solicitud DATE,
    fecha_estimada DATE,
    Estatus TINYINT,
    id_asesor INT,
    id_proveedor int,
    alerta_enviada TINYINT,
    FOREIGN KEY (id_asesor) REFERENCES asesores(id),
    FOREIGN KEY (id_proveedor) REFERENCES marca_proveedor(id)
);

-- 11. Tabla Notificaciones (Depende de Asesores)
CREATE TABLE notificaciones (
    id INT AUTO_INCREMENT PRIMARY KEY,
    fecha DATETIME,
    tipo_notificacion VARCHAR(50),
    id_asesor INT,
    mensaje TEXT,
    leida TINYINT,
    FOREIGN KEY (id_asesor) REFERENCES asesores(id)
);

CREATE TABLE incidentes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    id_pedido INT,               -- NUEVO: Para saber de qué orden viene
    id_producto INT,
    id_proveedor INT,
    id_asesor INT,
    Tipo varchar(100),
    cantidad_afectada INT,       -- NUEVO: Para saber cuántas piezas fallaron
    Descripcion VARCHAR(300),
    Fecha_incidente DATETIME,
	FOREIGN KEY (id_pedido) REFERENCES pedidos_proveedores(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    FOREIGN KEY (id_producto) REFERENCES productos(id),
    FOREIGN KEY (id_proveedor) REFERENCES marca_proveedor(id),
    FOREIGN KEY (id_asesor) REFERENCES asesores(id)
);

CREATE TABLE detalles_pedido_proveedor (
    id INT AUTO_INCREMENT PRIMARY KEY,
    id_pedido INT NOT NULL,
    id_producto INT NOT NULL,
    destino ENUM('Almacen', 'Pedido'),
    cantidad INT NOT NULL,
    FOREIGN KEY (id_pedido) REFERENCES pedidos_proveedores(id),
    FOREIGN KEY (id_producto) REFERENCES productos(id) -- Ajusta el nombre de tu tabla de productos
);

CREATE TABLE detalles_pedido (
    id INT AUTO_INCREMENT PRIMARY KEY,
    id_pedido INT NOT NULL,
    id_producto INT NOT NULL,
    cantidad INT NOT NULL,
    cantidad_surtida INT NOT NULL,
    precio_unitario DECIMAL(10,2) NOT NULL,
    estatus_surtido TINYINT DEFAULT 0, -- 0: Pendiente, 1: Surtido/Descontado
    FOREIGN KEY (id_pedido) REFERENCES pedidos(id),
    FOREIGN KEY (id_producto) REFERENCES productos(id)
);

-- 5. Tabla Vales_salida (Depende de Asesores y Clientes)
CREATE TABLE vales_salida (
    id INT AUTO_INCREMENT PRIMARY KEY,
	consecutivo_anual INT,
    id_asesor INT,
    id_cliente INT,
    id_pedido INT,
    fecha DATETIME,
    comentario VARCHAR(255) NULL,
    FOREIGN KEY (id_asesor) REFERENCES asesores(id),
    FOREIGN KEY (id_cliente) REFERENCES clientes(id),
    FOREIGN KEY (id_pedido) REFERENCES pedidos(id),
    alerta_enviada tinyint,
    estatus tinyint
);

-- 6. Tabla detalles_vale (Depende de Productos y Vales_salida)
CREATE TABLE detalles_vale (
    id INT AUTO_INCREMENT PRIMARY KEY,
    id_producto INT,
    id_vale INT,
    piezas INT,
    FOREIGN KEY (id_producto) REFERENCES productos(id),
    FOREIGN KEY (id_vale) REFERENCES vales_salida(id)
);

-- 12. Tabla Tickets (Depende de Asesores y Clientes)
CREATE TABLE tickets (
    id INT AUTO_INCREMENT PRIMARY KEY,
    id_asesor INT NOT NULL,
    id_cliente INT NULL,                     -- NULL si es un prospecto nuevo, lleno si ya es cliente
    nombre_prospecto VARCHAR(150),           -- Para saber a quién atender si aún no tiene id_cliente
    url_ticket TEXT,                 -- Enlace o referencia del ticket
    estatus TINYINT DEFAULT 1,               -- 1: Asignado, 2: Contactado, 3: Cotizado, 4: Cerrado
    venta_exitosa TINYINT NULL,              -- 1: Sí se cerró la venta, 0: No se cerró (NULL mientras esté abierto)
    cliente_registrado TINYINT DEFAULT 0,    -- 1: Sí se dio de alta en el sistema gracias a este ticket, 0: No
    
    -- Datos complementarios
    comentarios TEXT,                        -- Notas generales del asesor o gerente
    fecha_alta DATETIME DEFAULT CURRENT_TIMESTAMP, 
    fecha_cierre DATETIME NULL,

    FOREIGN KEY (id_asesor) REFERENCES asesores(id),
    FOREIGN KEY (id_cliente) REFERENCES clientes(id)
);