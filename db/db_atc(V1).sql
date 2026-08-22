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
    Rol ENUM('Almacen', 'Cotizador', 'Administrador','Asesor','Soporte Tecnico'),
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
    Nombre VARCHAR(100),              -- Aquí va el Modelo (ej. KQ2H06/01AS)
    Descripcion VARCHAR(250),         -- Aquí va el texto (ej. CONECTOR 6 MM RECTO)
    ExtraDescripcion TEXT,
    Precio DECIMAL(10,2),
    Codigo_numeral VARCHAR(10),
    Codigo_japon VARCHAR(45),
    Estanteria VARCHAR(10),
    Caja ENUM('A','B','C','D'),
    Stock INT,
    Apartado INT,
    Estatus TINYINT,
    id_marca INT,
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
    correo_contacto VARCHAR(300),
    CP VARCHAR(10),
    nombre_constancia VARCHAR(255), 
    ruta_constancia TEXT,
    fecha_constancia DATETIME NULL,
    Estatus TINYINT,
    fecha_registro DATE,
    tiene_credito TINYINT(1) DEFAULT 0,  
    limite_credito DECIMAL(12,2) DEFAULT 0.00 
);

CREATE TABLE cliente_asesor (
    id_cliente INT,
    id_asesor INT,
    asesor_tipo ENUM('Asesor propio','Asignado por la sucursal'),
    marcas_asignadas VARCHAR(255) NULL, -- Ej: "Marca A, Marca B"
    PRIMARY KEY (id_cliente, id_asesor),
    FOREIGN KEY (id_cliente) REFERENCES clientes(id) ON DELETE CASCADE,
    FOREIGN KEY (id_asesor) REFERENCES asesores(id) ON DELETE CASCADE
);


-- 7. Tabla movimientos (Depende de Productos)





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
    FOREIGN KEY (id_cliente) REFERENCES clientes(id));



CREATE TABLE stock_demo (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre_modelo VARCHAR(150) NOT NULL,    -- Nombre o Modelo del equipo
    descripcion VARCHAR(250),
    numero_serie VARCHAR(100),              -- Número de serie si aplica
    id_marca INT,                           -- Relación con marca_proveedor
    stock INT DEFAULT 0,                    -- Cantidad disponible de este demo
    estatus TINYINT DEFAULT 1,              -- Ej: 1 (En almacén), 2 (En demostración)
    FOREIGN KEY (id_marca) REFERENCES marca_proveedor(id)
);

-- Tabla de Registro: Visitas de Demostración
CREATE TABLE visitas_demostracion (
    id INT AUTO_INCREMENT PRIMARY KEY,
    fecha_visita DATE NOT NULL,             -- Fecha en la que se realizó la visita
    id_tecnico INT NOT NULL,                -- Usuario (Soporte Técnico) que registra
    id_asesor INT NOT NULL,                 -- Vendedor al que acompañó
    id_cliente INT NULL,                    -- ID del cliente si ya existe en tu BD
    empresa_no_registrada VARCHAR(150),     -- Texto libre si la empresa aún no está dada de alta
    resumen_actividades TEXT,               -- Descripción de lo que se hizo
    estatus TINYINT,   -- Estatus general de la visita
    FOREIGN KEY (id_tecnico) REFERENCES asesores(id),
    FOREIGN KEY (id_asesor) REFERENCES asesores(id),
    FOREIGN KEY (id_cliente) REFERENCES clientes(id)
);

-- Tabla Relacional: Demos llevados en la visita
CREATE TABLE detalle_visita_demos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    id_visita INT NOT NULL,                 -- Referencia a la visita
    id_demo INT NOT NULL,                   -- Referencia al producto demo
    cantidad INT DEFAULT 1,                 -- Por si llevan más de una pieza del mismo modelo
    estatus_retorno VARCHAR(50),            -- Ej: 'Regresó a oficina', 'Se quedó a prueba'
    FOREIGN KEY (id_visita) REFERENCES visitas_demostracion(id) ON DELETE CASCADE,
    FOREIGN KEY (id_demo) REFERENCES stock_demo(id)
);

CREATE TABLE proyectos_soporte (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre_proyecto VARCHAR(150) NOT NULL,
    descripcion TEXT NOT NULL,
    
    -- Relación con el técnico (asesor) que lo atiende
    id_tecnico INT NOT NULL,
    
    -- Cliente destino (Registrado o eventual)
    id_cliente INT NULL,
    empresa_no_registrada VARCHAR(150) NULL,
    
    -- Tiempos de resolución
    fecha_alta DATETIME DEFAULT CURRENT_TIMESTAMP,
    fecha_termino DATETIME NULL,
    
    -- Métricas de desempeño comercial
    se_cotizo TINYINT DEFAULT 0 COMMENT '0: No, 1: Sí',
    
    -- Control de flujo
    estatus TINYINT DEFAULT 1 COMMENT '1: Activo, 2: Completado, 0: Cancelado',
    
    -- Llaves foráneas (Ajusta el nombre de tus tablas si es diferente)
    FOREIGN KEY (id_tecnico) REFERENCES asesores(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    FOREIGN KEY (id_cliente) REFERENCES clientes(id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE materiales_proyecto (
    id INT AUTO_INCREMENT PRIMARY KEY,
    id_proyecto INT NOT NULL,
    id_producto INT NOT NULL,
     nombre_modelo VARCHAR(150) NULL,
     marca VARCHAR(100) NULL,
     codigo varchar(200) null,
    cantidad INT NOT NULL DEFAULT 1,
    
    FOREIGN KEY (id_proyecto) REFERENCES proyectos_soporte(id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (id_producto) REFERENCES productos(id) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


CREATE TABLE bitacora_avances (
    id INT AUTO_INCREMENT PRIMARY KEY,
    id_proyecto INT NOT NULL,
     estatus_anterior TINYINT NULL,
    estatus_nuevo    TINYINT NULL,
    id_usuario       INT NULL,
    tipo_evento      VARCHAR(30) NOT NULL DEFAULT 'comentario',
    fecha_registro DATETIME DEFAULT CURRENT_TIMESTAMP,
    comentarios TEXT NOT NULL,
    
    FOREIGN KEY (id_proyecto) REFERENCES proyectos_soporte(id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_bitacora_asesor
        FOREIGN KEY (id_usuario) REFERENCES asesores(id)
        ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

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
    
    -- NUEVAS COLUMNAS PARA EL MÓDULO DE PROYECTOS
    id_proyecto INT NULL COMMENT 'Enlace al proyecto de soporte (si aplica)',
    num_revision INT DEFAULT 0 COMMENT 'Contador de modificaciones hechas por el cliente',
    
    -- LLAVES FORÁNEAS
    FOREIGN KEY (id_cliente) REFERENCES clientes(id),
    FOREIGN KEY (id_asesor) REFERENCES asesores(id),
    FOREIGN KEY (id_proyecto) REFERENCES proyectos_soporte(id) ON DELETE SET NULL ON UPDATE CASCADE
);
-- 8. Tabla detalles_cotizacion (Depende de Productos y Cotizaciones)
CREATE TABLE detalles_cotizacion (
    id INT AUTO_INCREMENT PRIMARY KEY,
    id_cotizacion INT,
    
    -- REFERENCIA AL CATÁLOGO (Opcional si es un producto manual)
    id_producto INT NULL, 
    
    -- CAMPOS COMODÍN PARA PRODUCTOS FUERA DEL SISTEMA
    codigo_manual VARCHAR(100) NULL, 
    descripcion_manual VARCHAR(250) NULL, 
    extra_descripcion_manual TEXT NULL, 
    
    -- DATOS DE LA PARTIDA
    cantidad_producto INT,
    origen VARCHAR(150),
    tiempo_entrega VARCHAR(100),
    
    -- PRECIOS Y COSTOS EXTRA
    precio_unitario_cotizado DECIMAL(10,2),
    costo_flete DECIMAL(10,2) DEFAULT 0.00,
    tipo_flete ENUM('PORCENTAJE', 'FIJO') NULL,   -- COLUMNA AGREGADA
    valor_flete DECIMAL(10,2) DEFAULT 0.00,       -- COLUMNA AGREGADA
    moneda_flete ENUM('MXN','USD') NOT NULL DEFAULT 'MXN',
    
    -- LLAVES FORÁNEAS
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

-- 5. Tabla Vales_salida (Depende de Asesores y Clientes)
CREATE TABLE vales_salida (
    id INT AUTO_INCREMENT PRIMARY KEY,
    consecutivo_anual INT NOT NULL,
    id_asesor INT NOT NULL,
    id_cliente INT NULL,            -- Permitimos NULL en caso de que visiten una empresa no registrada
    empresa_no_registrada VARCHAR(550) NULL,
    id_pedido INT NULL,             -- NULL si el vale es para una demostración
    id_visita INT NULL,             -- NULL si el vale es para una venta normal
    tipo_vale ENUM('Venta', 'Demostracion') DEFAULT 'Venta',
    fecha DATETIME NOT NULL,
    comentario VARCHAR(255) NULL,
    alerta_enviada TINYINT DEFAULT 0,
    estatus TINYINT DEFAULT 0,
    FOREIGN KEY (id_asesor) REFERENCES asesores(id),
    FOREIGN KEY (id_cliente) REFERENCES clientes(id),
    FOREIGN KEY (id_pedido) REFERENCES pedidos(id),
    FOREIGN KEY (id_visita) REFERENCES visitas_demostracion(id)
);
-- 6. Tabla detalles_vale (Depende de Productos y Vales_salida)
CREATE TABLE detalles_vale (
    id INT AUTO_INCREMENT PRIMARY KEY,
    id_vale INT NOT NULL,
    id_producto INT NULL,           -- NULL si se están sacando equipos demo
    id_demo INT NULL,               -- NULL si se están sacando productos de venta
    piezas INT NOT NULL,
    FOREIGN KEY (id_vale) REFERENCES vales_salida(id) ON DELETE CASCADE,
    FOREIGN KEY (id_producto) REFERENCES productos(id),
    FOREIGN KEY (id_demo) REFERENCES stock_demo(id)
);

CREATE TABLE movimientos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    id_producto INT NULL,           -- NULL cuando se mueva un demo
    id_demo INT NULL,               -- NULL cuando se mueva un producto normal
    id_asesor INT NOT NULL,         
    id_cliente INT NULL,            
    empresa_no_registrada VARCHAR(250) NULL,
    tipo_movimiento ENUM('Entrada', 'Salida', 'Ajuste') NOT NULL, 
    fecha DATETIME NOT NULL,
    cantidad INT NOT NULL,
    destino ENUM('Almacen', 'Pedido', 'Demostracion') NOT NULL,
    FOREIGN KEY (id_producto) REFERENCES productos(id),
    FOREIGN KEY (id_demo) REFERENCES stock_demo(id),
    FOREIGN KEY (id_asesor) REFERENCES asesores(id),
    FOREIGN KEY (id_cliente) REFERENCES clientes(id)
);

CREATE TABLE detalles_pedido (
    id INT AUTO_INCREMENT PRIMARY KEY,
    id_pedido INT NOT NULL,
    
    -- REFERENCIA AL CATÁLOGO (Ahora es Opcional/NULL)
    id_producto INT NULL,
    
    -- CAMPOS COMODÍN PARA PRODUCTOS FUERA DEL SISTEMA
    codigo_manual VARCHAR(100) NULL,
    descripcion_manual VARCHAR(250) NULL,
    extra_descripcion_manual TEXT NULL,
    
    -- CANTIDADES
    cantidad INT NOT NULL,
    cantidad_surtida INT NOT NULL DEFAULT 0,
    
    -- COSTOS
    precio_unitario DECIMAL(10,2) NOT NULL,
    costo_flete DECIMAL(10,2) DEFAULT 0.00,
    
    estatus_surtido TINYINT DEFAULT 0, -- 0: Pendiente, 1: Surtido/Descontado
    
    FOREIGN KEY (id_pedido) REFERENCES pedidos(id),
    FOREIGN KEY (id_producto) REFERENCES productos(id)
);