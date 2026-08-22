DELIMITER $$

CREATE PROCEDURE login_asesor(
    IN usuario_p VARCHAR(100)
)
BEGIN
    SELECT 
        id, 
        Nombre,
        app,
        apm,
        telefono,
        usuario, 
        contra,  
        Rol,
        Estatus,
        Correo
    FROM asesores
    WHERE usuario = usuario_p AND Estatus = 1
    LIMIT 1;
END $$

DELIMITER ;

DELIMITER $$
CREATE PROCEDURE sp_agregar_cliente(
    IN nombre_c VARCHAR(100),
    IN rfc_c VARCHAR(13),
    IN razon_c VARCHAR(80),
    IN regimen_c VARCHAR(45),
    IN direccion_c TEXT,
    IN contacto_c VARCHAR(150),
    IN correo_c VARCHAR(300),
    IN cp_c VARCHAR(10),
    IN nombreCon_c VARCHAR(255),
    IN rutaCon_c TEXT,
    IN tiene_credito_c TINYINT,       -- NUEVO: 0 = No, 1 = Sí
    IN limite_credito_c DECIMAL(12,2),-- NUEVO: Límite de crédito
    IN asesor_c INT,
    IN asesor_tipo_c ENUM('Asesor propio', 'Asignado por la sucursal'),
    IN marcas_c VARCHAR(255)          -- NUEVO: Marcas asignadas
)
BEGIN
    DECLARE v_id_cliente INT;

    -- 1. Insertar datos en la tabla principal (ya no lleva id_asesor)
    INSERT INTO clientes (
        Nombre, RFC, Razon_social, Regimen_Fiscal, Direccion,
        contacto_principal, correo_contacto, CP, nombre_constancia,
        ruta_constancia, fecha_constancia, Estatus,
        fecha_registro, tiene_credito, limite_credito
    ) VALUES (
        nombre_c, rfc_c, razon_c, regimen_c, direccion_c,
        contacto_c, correo_c, cp_c, nombreCon_c, rutaCon_c,
        IF(rutaCon_c IS NULL OR rutaCon_c = '', NULL, NOW()),
        1, CURDATE(), tiene_credito_c, limite_credito_c
    );

    -- 2. Capturar el ID del cliente recién creado
    SET v_id_cliente = LAST_INSERT_ID();

    -- 3. Crear la relación en la tabla intermedia
    IF asesor_c IS NOT NULL AND asesor_c > 0 THEN
        INSERT INTO cliente_asesor (id_cliente, id_asesor, asesor_tipo, marcas_asignadas)
        VALUES (v_id_cliente, asesor_c, asesor_tipo_c, marcas_c);
    END IF;

    SELECT v_id_cliente AS id;  
END $$
DELIMITER ;

DELIMITER $$
CREATE PROCEDURE sp_modificar_cliente(
    IN id_c INT,              
    IN nombre_c VARCHAR(100),
    IN rfc_c VARCHAR(13),
    IN razon_c VARCHAR(80),
    IN regimen_c VARCHAR(45),
    IN direccion_c TEXT,
    IN contacto_c VARCHAR(150),
    IN correo_c VARCHAR(300),
    IN cp_c VARCHAR(10),
    IN nombreCon_c VARCHAR(255), 
    IN rutaCon_c TEXT,
    IN tiene_credito_c TINYINT,       -- NUEVO
    IN limite_credito_c DECIMAL(12,2),-- NUEVO
    IN asesor_c INT,
    IN asesor_tipo_c ENUM('Asesor propio', 'Asignado por la sucursal'),
    IN marcas_c VARCHAR(255)          -- NUEVO
)
BEGIN
    -- 1. Actualizar los datos base del cliente
    UPDATE clientes 
    SET 
        Nombre = nombre_c,
        RFC = rfc_c,
        Razon_social = razon_c,
        Regimen_Fiscal = regimen_c,
        Direccion = direccion_c,
        contacto_principal = contacto_c,
        correo_contacto = correo_c,       
        CP = cp_c,
        nombre_constancia = nombreCon_c,
        ruta_constancia = rutaCon_c,
        fecha_constancia = IF(rutaCon_c IS NULL OR rutaCon_c = '', NULL, NOW()),
        tiene_credito = tiene_credito_c,
        limite_credito = limite_credito_c
    WHERE id = id_c;

    -- 2. Actualizar o insertar la relación con el asesor enviado
    IF asesor_c IS NOT NULL AND asesor_c > 0 THEN
        -- Si la relación (id_cliente, id_asesor) ya existe, actualiza el tipo y las marcas. 
        -- Si no existe, la crea. Así evitamos duplicados o borrar a un segundo asesor.
        INSERT INTO cliente_asesor (id_cliente, id_asesor, asesor_tipo, marcas_asignadas)
        VALUES (id_c, asesor_c, asesor_tipo_c, marcas_c)
        ON DUPLICATE KEY UPDATE 
            asesor_tipo = VALUES(asesor_tipo),
            marcas_asignadas = VALUES(marcas_asignadas);
    END IF;
END $$
DELIMITER ;

DELIMITER $$

CREATE PROCEDURE sp_eliminar_cliente(
    IN id_c INT          
)
BEGIN
 update clientes set Estatus = 0
 where id = id_c;
END $$

DELIMITER ;

DELIMITER $$

CREATE PROCEDURE sp_activar_cliente(
    IN id_c INT          
)
BEGIN
 update clientes set Estatus = 1
 where id = id_c;
END $$

DELIMITER ;

DELIMITER //

CREATE PROCEDURE sp_buscar_clientes(
    IN p_busqueda VARCHAR(100),
    IN p_estatus INT,
    IN p_limite INT,
    IN p_offset INT
)
BEGIN
    SELECT * FROM verClientes
    WHERE 
        (p_busqueda IS NULL OR p_busqueda = '' OR Nombre LIKE CONCAT('%', p_busqueda, '%') OR RFC LIKE CONCAT('%', p_busqueda, '%'))
        AND 
        (p_estatus IS NULL OR Estatus = p_estatus)
    ORDER BY id DESC
    LIMIT p_limite OFFSET p_offset;
    SELECT COUNT(*) as total
    FROM verClientes
    WHERE 
        (p_busqueda IS NULL OR p_busqueda = '' OR Nombre LIKE CONCAT('%', p_busqueda, '%') OR RFC LIKE CONCAT('%', p_busqueda, '%'))
        AND 
        (p_estatus IS NULL OR Estatus = p_estatus);
END //

DELIMITER ;

DELIMITER $$

CREATE PROCEDURE sp_agregar_producto(
    IN p_nombre VARCHAR(100),
    IN p_descripcion VARCHAR(250),
    IN p_extra_descripcion TEXT,
    IN p_precio DECIMAL(10,2),
    IN p_codigo_numeral VARCHAR(10),
    IN p_codigo_japon VARCHAR(45),
    -- Se eliminó p_modelo
    IN p_estanteria ENUM('01','02','03','04','05','06','07','08'),
    IN p_caja ENUM('A','B','C','D'),
    IN p_stock INT,
    IN p_apartado INT,
    -- Se eliminó p_origen
    IN p_id_marca INT
)
BEGIN
    INSERT INTO productos (
        Nombre, 
        Descripcion, 
        ExtraDescripcion, 
        Precio, 
        Codigo_numeral, 
        Codigo_japon, 
        Estanteria, 
        Caja,
        Stock, 
        Apartado, 
        Estatus, 
        id_marca
    ) 
    VALUES (
        p_nombre, 
        p_descripcion, 
        p_extra_descripcion, 
        p_precio, 
        p_codigo_numeral, 
        p_codigo_japon, 
        p_estanteria, 
        p_caja,
        p_stock, 
        p_apartado, 
        IF(p_stock > 0, 1, 2),
        p_id_marca
    );
END $$

DELIMITER ;

DELIMITER $$

CREATE PROCEDURE sp_modificar_producto(
    IN p_id INT,
    IN p_nombre VARCHAR(100),
    IN p_descripcion VARCHAR(250),
    IN p_extra_descripcion TEXT,
    IN p_precio DECIMAL(10,2),
    IN p_codigo_numeral VARCHAR(10),
    IN p_codigo_japon VARCHAR(45),
    -- Se eliminó p_modelo
    IN p_estanteria ENUM('01','02','03','04','05','06','07','08'),
    IN p_caja ENUM('A','B','C','D'),
    IN p_stock INT,
    IN p_apartado INT,
    -- Se eliminó p_origen
    IN p_id_marca INT
)
BEGIN
    UPDATE productos 
    SET 
        Nombre = p_nombre,
        Descripcion = p_descripcion,
        ExtraDescripcion = p_extra_descripcion, 
        Precio = p_precio,
        Codigo_numeral = p_codigo_numeral,
        Codigo_japon = p_codigo_japon,
        Estanteria = p_estanteria,
        Caja = p_caja,
        Stock = p_stock,
        Apartado = p_apartado, 
        Estatus = IF(p_stock > 0, 1, 2), 
        id_marca = p_id_marca
    WHERE id = p_id;
END $$

DELIMITER ;
DELIMITER $$

CREATE PROCEDURE sp_eliminar_producto(
    IN p_id INT
)
BEGIN
    UPDATE productos 
    SET Estatus = 0
    WHERE id = p_id;
END $$

DELIMITER ;

DELIMITER $$

CREATE PROCEDURE sp_activar_producto(
    IN p_id INT
)
BEGIN
    UPDATE productos 
    SET Estatus = 1
    WHERE id = p_id;
END $$

DELIMITER ;cotizaciones


DELIMITER $$

CREATE PROCEDURE sp_buscar_productos(
    IN p_busqueda VARCHAR(100),
    IN p_estatus TINYINT,
    IN p_marca INT,
    IN p_limite INT,
    IN p_offset INT
)
BEGIN
    -- 1er SELECT: Trae los registros para la tabla (con Límite y Offset)
    SELECT * FROM verProductos
    WHERE 
        (p_busqueda IS NULL OR p_busqueda = '' 
         OR Nombre LIKE CONCAT('%', p_busqueda, '%') 
         OR Codigo_numeral LIKE CONCAT('%', p_busqueda, '%') 
         OR Codigo_japon LIKE CONCAT('%', p_busqueda, '%'))
        AND 
        (p_estatus IS NULL OR Estatus = p_estatus)
        AND 
        (p_marca IS NULL OR id_marca = p_marca)
    ORDER BY id DESC
    LIMIT p_limite OFFSET p_offset;

    -- 2do SELECT: Trae el total real de filas encontradas (Sin límite)
    SELECT COUNT(*) as total
    FROM verProductos
    WHERE 
        (p_busqueda IS NULL OR p_busqueda = '' 
         OR Nombre LIKE CONCAT('%', p_busqueda, '%') 
         OR Codigo_numeral LIKE CONCAT('%', p_busqueda, '%') 
         OR Codigo_japon LIKE CONCAT('%', p_busqueda, '%'))
        AND 
        (p_estatus IS NULL OR Estatus = p_estatus)
        AND 
        (p_marca IS NULL OR id_marca = p_marca);
END $$

DELIMITER ;

DELIMITER $$

CREATE PROCEDURE sp_registrar_entrada_producto(
    IN p_codigo VARCHAR(45),
    IN p_cantidad INT,
    IN p_destino VARCHAR(20),
    IN p_id_a INT
)
BEGIN
    DECLARE v_id_producto INT;
    DECLARE v_estatus_actual TINYINT;
    
    DECLARE EXIT HANDLER FOR SQLEXCEPTION 
    BEGIN
        ROLLBACK;
        SELECT 'Error: No se pudo registrar el movimiento' AS mensaje;
    END;

    SELECT id, Estatus 
    INTO v_id_producto, v_estatus_actual
    FROM productos
    WHERE Codigo_numeral = p_codigo OR Codigo_japon = p_codigo
    LIMIT 1;

    IF v_id_producto IS NOT NULL THEN
        START TRANSACTION;
    
        INSERT INTO movimientos (id_producto, id_asesor, tipo_movimiento, fecha, cantidad, destino)
        VALUES (v_id_producto, p_id_a, 'Entrada', NOW(), p_cantidad, p_destino);
        
        -- CONDICIÓN DE DESTINO PARA LA ENTRADA
        IF p_destino = 'Pedido' THEN
            -- Suma directamente al apartado (asumimos IFNULL por si el campo estaba vacío/nulo)
            UPDATE productos 
            SET Apartado = IFNULL(Apartado, 0) + p_cantidad
            WHERE id = v_id_producto;
        ELSE
            -- Suma al stock normal y reactiva el estatus si estaba agotado
            UPDATE productos 
            SET 
                Stock = IFNULL(Stock, 0) + p_cantidad,
                Estatus = IF(Estatus = 2 AND p_cantidad > 0, 1, Estatus)
            WHERE id = v_id_producto;
        END IF;
        
        COMMIT;
        SELECT 'Éxito: Entrada registrada y existencias actualizadas' AS mensaje;
    ELSE
        SELECT 'Error: No se encontró ningún producto con ese código' AS mensaje;
    END IF;

END $$

DELIMITER ;

DELIMITER $$
CREATE PROCEDURE sp_buscar_producto_por_codigo(
    IN p_termino VARCHAR(100)
)
BEGIN
    SELECT 
        p.id, 
        p.Nombre, 
        p.Descripcion, -- Agregado para dar más contexto en las sugerencias
        p.Codigo_numeral, 
        p.Codigo_japon, 
        p.Stock, 
        p.Estatus,
        p.Estanteria,
        m.Nombre AS Marca
    FROM productos p
    LEFT JOIN marca_proveedor m ON p.id_marca = m.id
    WHERE p.Nombre LIKE CONCAT('%', p_termino, '%')
       OR p.Codigo_numeral LIKE CONCAT('%', p_termino, '%')
       OR p.Codigo_japon LIKE CONCAT('%', p_termino, '%')
    ORDER BY 
        -- Pequeño truco: Da prioridad a los productos que "empiecen" con lo que el usuario escribe
        CASE 
            WHEN p.Nombre LIKE CONCAT(p_termino, '%') THEN 1
            ELSE 2
        END, 
        p.Nombre ASC
    LIMIT 10;
END $$

DELIMITER ;

DELIMITER $$

CREATE PROCEDURE sp_registrar_salida_producto(
    IN p_codigo VARCHAR(45),
    IN p_cantidad INT,
    IN p_destino VARCHAR(20),
    IN p_id_a INT,
    IN p_id_cliente INT 
)
BEGIN
    DECLARE v_id_producto INT;
    DECLARE v_estatus_actual TINYINT;
    DECLARE v_stock_actual INT;
    DECLARE v_apartado_actual INT;
    
    DECLARE EXIT HANDLER FOR SQLEXCEPTION 
    BEGIN
        ROLLBACK;
        SELECT 'Error: No se pudo registrar la salida' AS mensaje;
    END;

    -- Obtenemos el stock libre y el apartado actual
    SELECT id, Estatus, IFNULL(Stock, 0), IFNULL(Apartado, 0)
    INTO v_id_producto, v_estatus_actual, v_stock_actual, v_apartado_actual
    FROM productos
    WHERE Codigo_numeral = p_codigo OR Codigo_japon = p_codigo
    LIMIT 1;

    IF v_id_producto IS NOT NULL THEN
        
        -- VALIDACIÓN Y ACTUALIZACIÓN DEPENDIENDO DEL DESTINO
        IF p_destino = 'Pedido' THEN
            
            -- Si va para pedido, revisamos si hay suficiente APARTADO
            IF v_apartado_actual >= p_cantidad THEN
                START TRANSACTION;
                
                INSERT INTO movimientos (id_producto, id_asesor, id_cliente, tipo_movimiento, fecha, cantidad, destino)
                VALUES (v_id_producto, p_id_a, p_id_cliente, 'Salida', NOW(), p_cantidad, p_destino);
                
                -- Restamos del apartado
                UPDATE productos 
                SET Apartado = Apartado - p_cantidad
                WHERE id = v_id_producto;
                
                COMMIT;
                SELECT 'Éxito: Salida de pedido registrada y restada del apartado' AS mensaje;
            ELSE
                SELECT 'Error: No hay suficientes productos en apartado para esta salida' AS mensaje;
            END IF;
            
        ELSE
            
            -- Si NO es para pedido, revisamos si hay suficiente STOCK normal
            IF v_stock_actual >= p_cantidad THEN
                START TRANSACTION;
                
                INSERT INTO movimientos (id_producto, id_asesor, id_cliente, tipo_movimiento, fecha, cantidad, destino)
                VALUES (v_id_producto, p_id_a, p_id_cliente, 'Salida', NOW(), p_cantidad, p_destino);
                
                -- Restamos del stock normal y actualizamos el estatus
                UPDATE productos 
                SET 
                    Stock = Stock - p_cantidad,
                    Estatus = IF((Stock - p_cantidad) <= 0, 2, Estatus) 
                WHERE id = v_id_producto;
                
                COMMIT;
                SELECT 'Éxito: Salida registrada y stock restado correctamente' AS mensaje;
            ELSE
                SELECT 'Error: Stock insuficiente en almacén para realizar la salida' AS mensaje;
            END IF;
            
        END IF;
        
    ELSE
        SELECT 'Error: No se encontró ningún producto con ese código' AS mensaje;
    END IF;

END $$

DELIMITER ;

DELIMITER $$
CREATE PROCEDURE sp_consultar_movimientos(
    IN p_termino VARCHAR(100),     
    IN p_tipo_movimiento VARCHAR(20),
    IN p_destino VARCHAR(20),       
    IN p_fecha_inicio DATE,         
    IN p_fecha_fin DATE,           
    IN p_limit INT,                 
    IN p_offset INT                 
)
BEGIN

    -- =================================================================
    -- CONSULTA 1: Obtener los registros paginados
    -- =================================================================
    SELECT 
        id_movimiento,
        tipo_movimiento,
        destino,
        cantidad,
        fecha,
        id_producto,
        nombre_producto,
        Codigo_japon,
        Codigo_numeral,
        -- Se eliminó modelo_producto
        marca_producto,
        id_asesor,
        nombre_asesor,
        id_cliente,
        nombre_cliente
    FROM verMovimientos
    WHERE 
        (p_termino IS NULL OR p_termino = '' OR 
         nombre_producto LIKE CONCAT('%', p_termino, '%') OR 
         Codigo_japon LIKE CONCAT('%', p_termino, '%') OR 
         Codigo_numeral LIKE CONCAT('%', p_termino, '%') OR 
         nombre_asesor LIKE CONCAT('%', p_termino, '%'))
        AND (p_tipo_movimiento IS NULL OR p_tipo_movimiento = '' OR tipo_movimiento = p_tipo_movimiento)
        AND (p_destino IS NULL OR p_destino = '' OR destino = p_destino)
        
        -- AJUSTE DE ZONA HORARIA (-6 HORAS)
       AND (p_fecha_inicio IS NULL OR fecha >= p_fecha_inicio)
        AND (p_fecha_fin IS NULL OR fecha < DATE_ADD(p_fecha_fin, INTERVAL 1 DAY))
    ORDER BY fecha DESC
    LIMIT p_limit OFFSET p_offset;

    -- =================================================================
    -- CONSULTA 2: Obtener el TOTAL exacto para la paginación (Esto será rows[1])
    -- =================================================================
    SELECT COUNT(*) AS total
    FROM verMovimientos
    WHERE 
        (p_termino IS NULL OR p_termino = '' OR 
         nombre_producto LIKE CONCAT('%', p_termino, '%') OR 
         Codigo_japon LIKE CONCAT('%', p_termino, '%') OR 
         Codigo_numeral LIKE CONCAT('%', p_termino, '%') OR 
         nombre_asesor LIKE CONCAT('%', p_termino, '%'))
        AND (p_tipo_movimiento IS NULL OR p_tipo_movimiento = '' OR tipo_movimiento = p_tipo_movimiento)
        AND (p_destino IS NULL OR p_destino = '' OR destino = p_destino)
        
        -- AJUSTE DE ZONA HORARIA (-6 HORAS)
      AND (p_fecha_inicio IS NULL OR fecha >= p_fecha_inicio)
        AND (p_fecha_fin IS NULL OR fecha < DATE_ADD(p_fecha_fin, INTERVAL 1 DAY));

END $$

DELIMITER ;

DELIMITER $$

CREATE PROCEDURE sp_estadisticas_mes_actual()
BEGIN
    DECLARE v_entradas INT DEFAULT 0;
    DECLARE v_salidas INT DEFAULT 0;
    DECLARE v_vales INT DEFAULT 0;
    DECLARE v_total_registros INT DEFAULT 0; -- Nueva variable para el total
    DECLARE v_neto INT DEFAULT 0;

    -- 1. Contar Entradas
    SELECT COUNT(*) INTO v_entradas
    FROM movimientos
    WHERE tipo_movimiento = 'Entrada'
      AND MONTH(fecha) = MONTH(CURRENT_DATE())
      AND YEAR(fecha) = YEAR(CURRENT_DATE());

    -- 2. Contar Salidas
    SELECT COUNT(*) INTO v_salidas
    FROM movimientos
    WHERE tipo_movimiento = 'Salida'
      AND MONTH(fecha) = MONTH(CURRENT_DATE())
      AND YEAR(fecha) = YEAR(CURRENT_DATE());

    -- 3. Contar Vales
    SELECT COUNT(*) INTO v_vales
    FROM vales_salida
    WHERE MONTH(fecha) = MONTH(CURRENT_DATE())
      AND YEAR(fecha) = YEAR(CURRENT_DATE());

    -- 4. Cálculos finales
    SET v_total_registros = v_entradas + v_salidas; -- Sumamos todo para tener el total general
    SET v_neto = v_entradas - v_salidas;

    -- 5. Devolvemos los datos
    SELECT 
        v_total_registros AS registros_mes, -- Enviamos el nuevo dato al frontend
        v_entradas AS entradas_mes,
        v_salidas AS salidas_mes,
        v_vales AS vales_mes,
        v_neto AS neto_mes;
        
END $$

DELIMITER ;

DELIMITER $$

CREATE PROCEDURE sp_crear_solicitud_vale(
    IN p_id_asesor INT,
    IN p_id_cliente INT,
    IN p_id_pedido INT,           -- NUEVO PARÁMETRO
    IN p_productos_json JSON 
)
BEGIN
    DECLARE v_id_vale INT;
    DECLARE v_anio_actual INT;
    DECLARE v_nuevo_consecutivo INT;
    DECLARE v_folio_visual VARCHAR(20);
    
    DECLARE EXIT HANDLER FOR SQLEXCEPTION 
    BEGIN
        ROLLBACK;
        SELECT 'Error: No se pudo crear la solicitud del vale' AS mensaje;
    END;

    START TRANSACTION;
    
    -- 1. Lógica del Consecutivo Anual
    SET v_anio_actual = YEAR(NOW());
    
    SELECT COALESCE(MAX(consecutivo_anual), 0) + 1 
    INTO v_nuevo_consecutivo 
    FROM vales_salida 
    WHERE YEAR(fecha) = v_anio_actual;

    -- 2. Insertamos en Vales_salida (Ya sin orden_compra ni num_factura, agregando id_pedido)
    INSERT INTO vales_salida (
        consecutivo_anual, id_asesor, id_cliente, id_pedido, fecha, alerta_enviada, estatus
    )
    VALUES (
        v_nuevo_consecutivo, p_id_asesor, p_id_cliente, p_id_pedido, NOW(), 0, 0
    );
    
    SET v_id_vale = LAST_INSERT_ID();

    -- 3. Generamos el folio visual 
    SET v_folio_visual = CONCAT('S-', v_anio_actual, '-', IF(v_nuevo_consecutivo < 10000, LPAD(v_nuevo_consecutivo, 4, '0'), v_nuevo_consecutivo));

    -- 4. Procesamos el JSON e insertamos los detalles
    INSERT INTO detalles_vale (id_vale, id_producto, piezas)
    SELECT v_id_vale, id_producto, piezas
    FROM JSON_TABLE(
        p_productos_json,
        '$[*]' COLUMNS (
            id_producto INT PATH '$.id_producto',
            piezas INT PATH '$.piezas'
        )
    ) AS tabla_json;
    
    -- 5. Insertar notificación
    INSERT INTO notificaciones (fecha, tipo_notificacion, id_asesor, mensaje, leida)
    SELECT 
        NOW(), 
        'Nueva Solicitud', 
        id, 
        CONCAT('El asesor ha solicitado el Vale ', v_folio_visual, '. Requiere autorización.'), 
        0
    FROM asesores 
    WHERE Rol IN ('Administrador', 'Almacen');
    
    COMMIT;
    
    SELECT 'Éxito: Solicitud creada correctamente' AS mensaje, v_id_vale AS id_nuevo_vale, v_folio_visual AS folio_generado;

END $$

DELIMITER ;

DELIMITER $$

CREATE PROCEDURE sp_autorizar_vale(
    IN p_id_vale INT,
    IN p_comentario VARCHAR(255)
)
sp_main: BEGIN
    DECLARE v_done INT DEFAULT FALSE;
    DECLARE v_id_producto INT;
    DECLARE v_piezas INT;
    DECLARE v_id_asesor INT;
    DECLARE v_id_cliente INT;
    DECLARE v_estatus_actual INT;
    DECLARE v_apartado_actual INT; 
    DECLARE v_nombre_producto VARCHAR(150); 
    
    DECLARE cur_detalles CURSOR FOR 
        SELECT id_producto, piezas FROM detalles_vale WHERE id_vale = p_id_vale;
        
    DECLARE CONTINUE HANDLER FOR NOT FOUND SET v_done = TRUE;

    DECLARE EXIT HANDLER FOR SQLEXCEPTION 
    BEGIN
        ROLLBACK;
        SELECT 'Error: Ocurrió un fallo en la base de datos al autorizar el vale' AS mensaje;
    END;

    START TRANSACTION;
    
    SELECT Estatus INTO v_estatus_actual FROM vales_salida WHERE id = p_id_vale LIMIT 1;
    
    IF v_estatus_actual = 0 THEN 
        
        SELECT id_asesor, id_cliente INTO v_id_asesor, v_id_cliente 
        FROM vales_salida 
        WHERE id = p_id_vale LIMIT 1;

        UPDATE vales_salida 
        SET estatus = 1, comentario = p_comentario
        WHERE id = p_id_vale;

        OPEN cur_detalles;
        read_loop: LOOP
            FETCH cur_detalles INTO v_id_producto, v_piezas;
            
            IF v_done THEN
                LEAVE read_loop;
            END IF;

            -- =========================================================
            -- MAGIA AQUÍ: Solo validamos y descontamos si el producto existe
            -- =========================================================
            IF v_id_producto IS NOT NULL THEN
            
                -- 1. Consultamos las existencias en el Apartado
                SELECT IFNULL(Apartado, 0), Nombre INTO v_apartado_actual, v_nombre_producto 
                FROM productos WHERE id = v_id_producto FOR UPDATE;

                -- 2. Validamos contra el Apartado
                IF v_piezas > v_apartado_actual THEN
                    ROLLBACK; 
                    CLOSE cur_detalles; 
                    
                    SELECT CONCAT('Error: Apartado insuficiente. El producto "', v_nombre_producto, '" solo tiene ', v_apartado_actual, ' piezas en reserva.') AS mensaje;
                    
                    LEAVE sp_main; 
                END IF;
                
                -- 3. Registramos el movimiento (Opcional, si tu BD permite FK nulas podrías sacarlo del IF)
                INSERT INTO movimientos (id_producto, id_asesor, id_cliente, tipo_movimiento, fecha, cantidad, destino)
                VALUES (v_id_producto, v_id_asesor, v_id_cliente, 'Salida', NOW(), v_piezas, 'Pedido');

                -- 4. Descontamos directamente de la columna Apartado
                UPDATE productos 
                SET Apartado = Apartado - v_piezas
                WHERE id = v_id_producto;
                
            END IF;
            -- (Si v_id_producto ES NULL, es un producto manual, no hace nada y el loop continúa)

        END LOOP;
        CLOSE cur_detalles;
        
        INSERT INTO notificaciones (fecha, tipo_notificacion, id_asesor, mensaje, leida)
        VALUES (NOW(), 'Vale Autorizado', v_id_asesor, 'Tu vale de salida ha sido autorizado y el material ha sido descontado.', 0);
        
        COMMIT;
        
        SELECT 'Éxito: Vale autorizado, existencias de apartado descontadas e historial actualizado' AS mensaje;

    ELSE
        ROLLBACK;
        SELECT 'Error: Este vale ya fue procesado anteriormente' AS mensaje;
        
    END IF;

END $$

DELIMITER ;

DELIMITER $$

CREATE PROCEDURE sp_rechazar_vale(
    IN p_id_vale INT,
    IN p_comentario VARCHAR(255)
)
BEGIN
    DECLARE v_id_asesor INT;
    DECLARE v_estatus_actual INT;

     DECLARE EXIT HANDLER FOR SQLEXCEPTION 
    BEGIN
     ROLLBACK;
    SELECT 'Error: No se pudo rechazar el vale' AS mensaje;
     END;

    START TRANSACTION;
    SELECT Estatus INTO v_estatus_actual FROM vales_salida WHERE id = p_id_vale LIMIT 1;
    
    IF v_estatus_actual = 0 THEN 
        UPDATE vales_salida 
        SET estatus = 2, comentario = p_comentario
        WHERE id = p_id_vale;
        
        SELECT id_asesor INTO v_id_asesor FROM vales_salida WHERE id = p_id_vale LIMIT 1;
        
        INSERT INTO notificaciones (fecha, tipo_notificacion, id_asesor, mensaje, leida)
        VALUES (NOW(), 'Vale Rechazado', v_id_asesor, CONCAT('Tu solicitud para tu vale de salida a sido rechazado'), 0);
        
        COMMIT;
        SELECT 'Éxito: Vale rechazado correctamente' AS mensaje;
        
    ELSE
        ROLLBACK;
        SELECT 'Error: Este vale ya fue procesado anteriormente' AS mensaje;
    END IF;
END $$

DELIMITER ;

DELIMITER $$
CREATE PROCEDURE sp_contar_vales_estatus(
    IN p_id_asesor INT,
    IN p_rol VARCHAR(50)
)
BEGIN
    IF p_rol IN ('Administrador', 'Almacen') THEN
        SELECT 
            COUNT(CASE WHEN Estatus = 0 THEN 1 END) AS pendientes,
            COUNT(CASE WHEN Estatus = 1 THEN 1 END) AS aceptados,
            COUNT(CASE WHEN Estatus = 2 THEN 1 END) AS rechazados,
            COUNT(*) AS total
        FROM vales_salida
        WHERE MONTH(fecha) = MONTH(CURRENT_DATE())
          AND YEAR(fecha) = YEAR(CURRENT_DATE());
    ELSE
        SELECT 
            COUNT(CASE WHEN Estatus = 0 THEN 1 END) AS pendientes,
            COUNT(CASE WHEN Estatus = 1 THEN 1 END) AS aceptados,
            COUNT(CASE WHEN Estatus = 2 THEN 1 END) AS rechazados,
            COUNT(*) AS total
        FROM vales_salida
        WHERE id_asesor = p_id_asesor
          AND MONTH(fecha) = MONTH(CURRENT_DATE())
          AND YEAR(fecha) = YEAR(CURRENT_DATE());
    END IF;
END $$
DELIMITER ;


DELIMITER $$

CREATE PROCEDURE sp_obtener_productos_vale(
    IN p_id_vale INT
)
BEGIN
    SELECT 
        dv.id_producto,
        dv.id_demo,
        dv.piezas,
        
        -- Si es producto toma el Cod_numeral, si es demo toma el numero_serie
        COALESCE(p.Codigo_numeral, sd.numero_serie) AS Codigo_numeral,
        
        -- Los demos no tienen código japón, se irá como NULL y Angular pondrá '-'
        p.Codigo_japon,
        
        -- Nombre descriptivo del producto o modelo del equipo demo
        COALESCE(p.Descripcion, sd.nombre_modelo) AS nombre_producto, 
        
        -- Modelo corto
        COALESCE(p.Nombre, sd.nombre_modelo) AS modelo_producto       
        
    FROM detalles_vale dv
    LEFT JOIN productos p ON dv.id_producto = p.id
    LEFT JOIN stock_demo sd ON dv.id_demo = sd.id
    WHERE dv.id_vale = p_id_vale;
END $$

DELIMITER ;

DELIMITER $$
CREATE PROCEDURE sp_consultar_vales(
    IN p_id_asesor INT,
    IN p_busqueda VARCHAR(150),
    IN p_estatus INT,
    IN p_fecha_inicio DATE,
    IN p_fecha_fin DATE,
    IN p_pagina INT,
    IN p_limite INT
)
BEGIN
    DECLARE v_offset INT;

    -- Validaciones de seguridad para la paginación
    IF p_pagina IS NULL OR p_pagina < 1 THEN
        SET p_pagina = 1;
    END IF;

    IF p_limite IS NULL OR p_limite < 1 THEN
        SET p_limite = 10;
    END IF;

    -- Calcular desde qué registro va a traer los datos
    SET v_offset = (p_pagina - 1) * p_limite;

    -- ==========================================================
    -- 1. CONSULTA PRINCIPAL (Lista de vales)
    -- ==========================================================
    SELECT 
        id_vale,
        folio_vale,
        fecha,
        estatus,
        comentario,
        id_asesor,
        nombre_asesor,
        id_cliente,
        nombre_cliente,
        orden_compra,
        tipo_vale -- <-- ¡AQUÍ ESTÁ LA MAGIA QUE FALTABA!
    FROM verVales
    WHERE 
        (p_id_asesor IS NULL OR id_asesor = p_id_asesor)
        
        -- Filtro de texto (Asesor, Cliente o Folio) -> Se quitó orden_compra
        AND (p_busqueda IS NULL OR p_busqueda = '' 
            OR nombre_asesor LIKE CONCAT('%', p_busqueda, '%') 
            OR nombre_cliente LIKE CONCAT('%', p_busqueda, '%')
            OR folio_vale LIKE CONCAT('%', p_busqueda, '%')
        )
        -- Filtro por Estatus exacto
        AND (p_estatus IS NULL OR estatus = p_estatus)
        -- Filtro de Rango de Fechas (Con ajuste de Zona Horaria)
       AND (p_fecha_inicio IS NULL OR fecha >= p_fecha_inicio)
        AND (p_fecha_fin IS NULL OR fecha < DATE_ADD(p_fecha_fin, INTERVAL 1 DAY))
    ORDER BY fecha DESC
    LIMIT p_limite OFFSET v_offset;

    -- ==========================================================
    -- 2. CONSULTA DE TOTALES (Para la Paginación de Angular)
    -- ==========================================================
    SELECT COUNT(*) AS total
    FROM verVales
    WHERE 
        (p_id_asesor IS NULL OR id_asesor = p_id_asesor)
        
        AND (p_busqueda IS NULL OR p_busqueda = '' 
            OR nombre_asesor LIKE CONCAT('%', p_busqueda, '%') 
            OR nombre_cliente LIKE CONCAT('%', p_busqueda, '%')
            OR folio_vale LIKE CONCAT('%', p_busqueda, '%')
        )
        AND (p_estatus IS NULL OR estatus = p_estatus)
        -- Filtro de Fechas homologado con zona horaria
       AND (p_fecha_inicio IS NULL OR fecha >= p_fecha_inicio)
        AND (p_fecha_fin IS NULL OR fecha < DATE_ADD(p_fecha_fin, INTERVAL 1 DAY));

END $$

DELIMITER ;
DELIMITER $$
CREATE PROCEDURE sp_consultar_pedidos(
    IN p_busqueda VARCHAR(150),
    IN p_id_proveedor INT,
    IN p_estatus INT, 
    IN p_fecha_inicio DATE,
    IN p_fecha_fin DATE,
    IN p_pagina INT,
    IN p_limite INT
)
BEGIN
    DECLARE v_offset INT;
    IF p_pagina IS NULL OR p_pagina < 1 THEN
        SET p_pagina = 1;
    END IF;
    IF p_limite IS NULL OR p_limite < 1 THEN
        SET p_limite = 10;
    END IF;
    SET v_offset = (p_pagina - 1) * p_limite;

    -- ==========================================================
    -- 1. CONSULTA PRINCIPAL
    -- ==========================================================
    SELECT 
        id_pedido,
        id_proveedor,
        id_asesor,
        fecha_solicitud,
        fecha_estimada,
        Estatus,
        alerta_enviada,
        nombre_proveedor,
        nombre_asesor,
        total_modelos_diferentes,
        total_piezas
    FROM verPedidosGeneral
    WHERE 
        (p_id_proveedor IS NULL OR id_proveedor = p_id_proveedor)
        AND (p_estatus IS NULL OR Estatus = p_estatus)
        AND (p_fecha_inicio IS NULL OR fecha_solicitud >= p_fecha_inicio)
        AND (p_fecha_fin IS NULL OR fecha_solicitud < DATE_ADD(p_fecha_fin, INTERVAL 1 DAY))
        AND (p_busqueda IS NULL OR p_busqueda = '' 
            OR nombre_asesor LIKE CONCAT('%', p_busqueda, '%') 
            OR nombre_proveedor LIKE CONCAT('%', p_busqueda, '%')
            OR id_pedido LIKE CONCAT('%', p_busqueda, '%')
        )
    ORDER BY fecha_solicitud DESC
    LIMIT p_limite OFFSET v_offset;

    -- ==========================================================
    -- 2. CONSULTA DE TOTALES (Para paginación)
    -- ==========================================================
    SELECT COUNT(*) AS total
    FROM verPedidosGeneral
    WHERE 
        (p_id_proveedor IS NULL OR id_proveedor = p_id_proveedor)
        AND (p_estatus IS NULL OR Estatus = p_estatus)
        AND (p_fecha_inicio IS NULL OR fecha_solicitud >= p_fecha_inicio)
        AND (p_fecha_fin IS NULL OR fecha_solicitud < DATE_ADD(p_fecha_fin, INTERVAL 1 DAY))
        AND (p_busqueda IS NULL OR p_busqueda = '' 
            OR nombre_asesor LIKE CONCAT('%', p_busqueda, '%') 
            OR nombre_proveedor LIKE CONCAT('%', p_busqueda, '%')
            OR id_pedido LIKE CONCAT('%', p_busqueda, '%')
        );
END $$
DELIMITER ;

DELIMITER $$

CREATE PROCEDURE sp_crear_pedido_proveedor(
    IN p_id_asesor INT,
    IN p_id_proveedor INT,
    IN p_fecha_estimada DATE, 
    IN p_productos_json JSON   
)
BEGIN
    DECLARE v_id_pedido INT;

    DECLARE EXIT HANDLER FOR SQLEXCEPTION 
    BEGIN
        ROLLBACK;
        SELECT 'Error: No se pudo registrar el pedido al proveedor' AS mensaje;
    END;

    START TRANSACTION;

    INSERT INTO pedidos_proveedores (
        fecha_solicitud, fecha_estimada, Estatus, id_asesor, id_proveedor, alerta_enviada
    ) 
    VALUES (
        NOW(), p_fecha_estimada, 0, p_id_asesor, p_id_proveedor, 0
    );

    SET v_id_pedido = LAST_INSERT_ID();

    INSERT INTO detalles_pedido_proveedor (
        id_pedido, id_producto, destino, cantidad
    )
    SELECT 
        v_id_pedido, 
        id_producto, 
        destino,       
        cantidad
    FROM JSON_TABLE(
        p_productos_json,
        '$[*]' COLUMNS (
            id_producto INT PATH '$.id_producto',
            destino VARCHAR(20) PATH '$.destino',
            cantidad INT PATH '$.cantidad'
        )
    ) AS tabla_json;

    COMMIT;

    SELECT 'Éxito: Pedido al proveedor registrado correctamente' AS mensaje;

END $$

DELIMITER ;

DELIMITER $$

CREATE PROCEDURE sp_recibir_pedido_completo(
    IN p_id_pedido INT,
    IN p_id_asesor INT 
)
BEGIN
    DECLARE v_estatus_actual INT;

    DECLARE EXIT HANDLER FOR SQLEXCEPTION 
    BEGIN
        ROLLBACK;
        SELECT 'Error: Ocurrió un fallo en la base de datos al recibir el pedido' AS mensaje;
    END;

    START TRANSACTION;

    -- 1. Verificamos el estatus actual del pedido
    SELECT Estatus INTO v_estatus_actual 
    FROM pedidos_proveedores 
    WHERE id = p_id_pedido LIMIT 1;

    IF v_estatus_actual = 0 THEN 
        
        -- Marcamos el pedido como Recibido
        UPDATE pedidos_proveedores 
        SET Estatus = 1 
        WHERE id = p_id_pedido;

        -- =================================================================
        -- 2A. Actualizar APARTADO (Solo para productos con destino 'Pedido')
        -- =================================================================
        UPDATE productos p
        INNER JOIN (
            SELECT id_producto, SUM(cantidad) AS cant_total 
            FROM detalles_pedido_proveedor 
            WHERE id_pedido = p_id_pedido AND destino = 'Pedido'
            GROUP BY id_producto
        ) dp ON p.id = dp.id_producto
        SET p.Apartado = IFNULL(p.Apartado, 0) + dp.cant_total;

        -- =================================================================
        -- 2B. Actualizar STOCK LIBRE (Solo productos con destino 'Almacen')
        -- =================================================================
        UPDATE productos p
        INNER JOIN (
            SELECT id_producto, SUM(cantidad) AS cant_total 
            FROM detalles_pedido_proveedor 
            WHERE id_pedido = p_id_pedido AND destino = 'Almacen'
            GROUP BY id_producto
        ) dp ON p.id = dp.id_producto
        SET 
            p.Stock = IFNULL(p.Stock, 0) + dp.cant_total,
            p.Estatus = IF(IFNULL(p.Stock, 0) + dp.cant_total > 0, 1, p.Estatus);

        -- =================================================================
        -- 3. Registrar Historial de Movimientos (Toma el destino directo del detalle)
        -- =================================================================
        INSERT INTO movimientos (id_producto, id_asesor, tipo_movimiento, fecha, cantidad, destino)
        SELECT 
            id_producto, 
            p_id_asesor, 
            'Entrada', 
            NOW(), 
            cantidad, 
            destino -- Ahora el movimiento sabrá exactamente a dónde fue
        FROM detalles_pedido_proveedor
        WHERE id_pedido = p_id_pedido;
        
        COMMIT;
        
        SELECT 'Éxito: Pedido recibido, stock y apartados actualizados correctamente' AS mensaje;

    ELSE
        ROLLBACK;
        SELECT 'Error: Este pedido ya fue procesado anteriormente' AS mensaje;
    END IF;

END $$

DELIMITER ;

DELIMITER $$

CREATE PROCEDURE sp_recibir_pedido_incidencias(
    IN p_id_pedido INT,
    IN p_id_asesor INT,
    IN p_recepcion_json JSON
)
BEGIN
    DECLARE v_estatus_actual INT;
    DECLARE v_id_proveedor INT;

    DECLARE EXIT HANDLER FOR SQLEXCEPTION 
    BEGIN
        ROLLBACK;
        SELECT 'Error: Ocurrió un fallo en la base de datos al registrar la recepción y las incidencias' AS mensaje;
    END;

    START TRANSACTION;

    SELECT Estatus, id_proveedor INTO v_estatus_actual, v_id_proveedor 
    FROM pedidos_proveedores 
    WHERE id = p_id_pedido LIMIT 1;
    
    IF v_estatus_actual = 0 THEN 

        UPDATE pedidos_proveedores 
        SET Estatus = 2 
        WHERE id = p_id_pedido;

        -- =================================================================
        -- 1A. Actualizar APARTADO (Solo piezas buenas con destino 'Pedido')
        -- =================================================================
        UPDATE productos p
        INNER JOIN JSON_TABLE(
            p_recepcion_json,
            '$[*]' COLUMNS (
                id_producto INT PATH '$.id_producto',
                cantidad_buena INT PATH '$.cantidad_buena'
            )
        ) AS json_data ON p.id = json_data.id_producto
        INNER JOIN detalles_pedido_proveedor dp 
            ON dp.id_pedido = p_id_pedido AND dp.id_producto = json_data.id_producto
        SET p.Apartado = IFNULL(p.Apartado, 0) + json_data.cantidad_buena
        WHERE json_data.cantidad_buena > 0 AND dp.destino = 'Pedido';

        -- =================================================================
        -- 1B. Actualizar STOCK LIBRE (Solo piezas buenas con destino 'Almacen')
        -- =================================================================
        UPDATE productos p
        INNER JOIN JSON_TABLE(
            p_recepcion_json,
            '$[*]' COLUMNS (
                id_producto INT PATH '$.id_producto',
                cantidad_buena INT PATH '$.cantidad_buena'
            )
        ) AS json_data ON p.id = json_data.id_producto
        INNER JOIN detalles_pedido_proveedor dp 
            ON dp.id_pedido = p_id_pedido AND dp.id_producto = json_data.id_producto
        SET 
            p.Stock = IFNULL(p.Stock, 0) + json_data.cantidad_buena,
            p.Estatus = IF(IFNULL(p.Stock, 0) + json_data.cantidad_buena > 0, 1, p.Estatus)
        WHERE json_data.cantidad_buena > 0 AND dp.destino = 'Almacen';
        
        -- =================================================================
        -- 2. Insertar Movimientos (Tomando el destino de los detalles)
        -- =================================================================
        INSERT INTO movimientos (id_producto, id_asesor, tipo_movimiento, fecha, cantidad, destino)
        SELECT 
            json_data.id_producto, 
            p_id_asesor, 
            'Entrada', 
            NOW(), 
            json_data.cantidad_buena, 
            dp.destino -- Extraemos el destino real
        FROM JSON_TABLE(
            p_recepcion_json,
            '$[*]' COLUMNS (
                id_producto INT PATH '$.id_producto',
                cantidad_buena INT PATH '$.cantidad_buena'
            )
        ) AS json_data
        INNER JOIN detalles_pedido_proveedor dp 
            ON dp.id_pedido = p_id_pedido AND dp.id_producto = json_data.id_producto
        WHERE json_data.cantidad_buena > 0;
        
        -- =================================================================
        -- 3. Insertar Incidentes
        -- =================================================================
        INSERT INTO incidentes (
            id_pedido, 
            id_producto, 
            id_proveedor, 
            id_asesor, 
            Tipo, 
            cantidad_afectada, 
            Descripcion, 
            Fecha_incidente
        )
        SELECT 
            p_id_pedido,
            id_producto,
            v_id_proveedor,  
            p_id_asesor,
            Tipo,
            cantidad_afectada,
            Descripcion,
            NOW()
        FROM JSON_TABLE(
            p_recepcion_json,
            '$[*]' COLUMNS (
                id_producto INT PATH '$.id_producto',
                Tipo VARCHAR(50) PATH '$.Tipo',
                cantidad_afectada INT PATH '$.cantidad_afectada',
                Descripcion VARCHAR(300) PATH '$.Descripcion'
            )
        ) AS json_data
        WHERE cantidad_afectada > 0 AND Tipo IS NOT NULL; 
        
        COMMIT;
        
        SELECT 'Éxito: Recepción completada. Las piezas buenas se sumaron al stock o apartado correspondiente y los incidentes fueron registrados.' AS mensaje;

    ELSE
        ROLLBACK;
        SELECT 'Error: Este pedido ya fue procesado anteriormente' AS mensaje;
    END IF;

END $$

DELIMITER ;

DELIMITER $$

CREATE  PROCEDURE sp_verificar_alertas_pedidos()
BEGIN
    -- Declaramos una variable para saber si hubo cambios y avisar a WebSockets
    DECLARE v_alertas_generadas INT DEFAULT 0;

    -- 1. Insertamos la notificación para el ASESOR que lo pidió
    INSERT INTO notificaciones (fecha, tipo_notificacion, id_asesor, mensaje, leida)
    SELECT 
        NOW(), 
        'Llegada Próxima', 
        id_asesor, 
        CONCAT('El pedido PP-', id, ' está programado para llegar en 7 días.'), 
        0
    FROM pedidos_proveedores
    WHERE Estatus = 0 -- Solo pedidos pendientes
      AND alerta_enviada = 0 -- Que no se haya avisado antes
      AND DATEDIFF(fecha_estimada, CURDATE()) = 7; -- Exactamente a 7 días de hoy

    SET v_alertas_generadas = ROW_COUNT();
    UPDATE pedidos_proveedores
    SET alerta_enviada = 1
    WHERE Estatus = 0 
      AND alerta_enviada = 0 
      AND DATEDIFF(fecha_estimada, CURDATE()) = 7;
    SELECT v_alertas_generadas AS alertas_nuevas;

END $$

DELIMITER ;

DELIMITER $$

CREATE  PROCEDURE sp_contar_estatus_pedidos(
    IN p_anio INT -- Ejemplo: 2026. Si mandas NULL, contará todo el histórico desde el inicio de los tiempos.
)
BEGIN
    SELECT 
        -- 1. PENDIENTES: Siempre cuenta todos los pendientes, ignorando el año (Regla de oro)
        COALESCE(SUM(CASE WHEN Estatus = 0 THEN 1 ELSE 0 END), 0) AS pendientes,
        
        COALESCE(SUM(CASE WHEN Estatus = 1 AND (p_anio IS NULL OR YEAR(fecha_solicitud) = p_anio) THEN 1 ELSE 0 END), 0) AS recibidos,
                COALESCE(SUM(CASE WHEN Estatus = 2 AND (p_anio IS NULL OR YEAR(fecha_solicitud) = p_anio) THEN 1 ELSE 0 END), 0) AS con_incidencia,
                COALESCE(SUM(CASE WHEN p_anio IS NULL OR YEAR(fecha_solicitud) = p_anio THEN 1 ELSE 0 END), 0) AS total_anual
    FROM pedidos_proveedores;
    
END $$

DELIMITER ;

DELIMITER $$

CREATE PROCEDURE sp_buscar_producto_para_pedido(
    IN p_busqueda VARCHAR(300),
    IN p_id_proveedor INT
)
BEGIN
    SELECT 
        id, 
        Codigo_japon, 
        Codigo_numeral, 
        Nombre, 
        Descripcion,
        Precio,
        Stock,
        Estatus 
    FROM productos 
    WHERE (
           Codigo_japon LIKE CONCAT('%', p_busqueda, '%') 
        OR Codigo_numeral LIKE CONCAT('%', p_busqueda, '%')
        OR Nombre LIKE CONCAT('%', p_busqueda, '%')
        OR Descripcion LIKE CONCAT('%', p_busqueda, '%') -- ¡AQUÍ ESTÁ LA MAGIA!
    )
      AND Estatus IN (1, 2) 
      AND (p_id_proveedor IS NULL OR id_marca = p_id_proveedor) 

    ORDER BY 
        CASE 
            WHEN Codigo_japon = p_busqueda OR Codigo_numeral = p_busqueda OR Nombre = p_busqueda THEN 1
            WHEN Nombre LIKE CONCAT(p_busqueda, '%') THEN 2
            WHEN Descripcion LIKE CONCAT(p_busqueda, '%') THEN 3 -- Prioridad si empieza con la descripción
            WHEN Codigo_japon LIKE CONCAT(p_busqueda, '%') THEN 4
            WHEN Nombre LIKE CONCAT('% ', p_busqueda, '%') OR Descripcion LIKE CONCAT('% ', p_busqueda, '%') THEN 5 
            ELSE 6 
        END ASC,
        LENGTH(Nombre) ASC, 
        Nombre ASC

    LIMIT 15;
END $$

DELIMITER ;

DELIMITER $$

CREATE PROCEDURE sp_guardar_cotizacion(
    IN p_id_asesor INT,
    IN p_id_cliente INT,
    IN p_nombre_prospecto VARCHAR(150),
    IN p_contacto VARCHAR(150),
    IN p_ciudad_destino VARCHAR(100),
    IN p_moneda VARCHAR(20),
    IN p_tipo_cambio DECIMAL(10,4),
    IN p_vigencia_dias INT,
    IN p_subtotal DECIMAL(10,2),
    IN p_iva DECIMAL(10,2),
    IN p_total DECIMAL(10,2),
    OUT p_id_cotizacion INT
)
BEGIN
    DECLARE v_anio INT;
    DECLARE v_siguiente_folio INT;
    DECLARE v_num_cotizacion VARCHAR(20);
    DECLARE v_iniciales VARCHAR(5); -- NUEVO: Para guardar las iniciales del asesor
    
    -- ==========================================================
    -- 1. Obtener las iniciales del asesor (Nombre + Apellido Paterno)
    -- ==========================================================
    SELECT UPPER(CONCAT(LEFT(TRIM(Nombre), 1), LEFT(TRIM(app), 1)))
    INTO v_iniciales
    FROM asesores
    WHERE id = p_id_asesor;

    -- Seguro por si el asesor no tiene apellido registrado o hay un error
    IF v_iniciales IS NULL OR v_iniciales = '' THEN
        SET v_iniciales = 'XX';
    END IF;

    -- ==========================================================
    -- 2. Calcular el consecutivo anual
    -- ==========================================================
    SET v_anio = YEAR(NOW());
    
    -- SUBSTRING_INDEX extrae el número después del guion ('-') sin importar las iniciales
    SELECT IFNULL(MAX(CAST(SUBSTRING_INDEX(num_cotizacion, '-', -1) AS UNSIGNED)), 0) + 1 
    INTO v_siguiente_folio 
    FROM cotizaciones 
    WHERE YEAR(fecha) = v_anio;
    
    -- ==========================================================
    -- 3. Armamos el folio dinámico (Ej: JP-001)
    -- ==========================================================
    SET v_num_cotizacion = CONCAT(v_iniciales, '-', 
        IF(v_siguiente_folio < 1000, LPAD(v_siguiente_folio, 3, '0'), v_siguiente_folio)
    );

    -- ==========================================================
    -- 4. Insertar la cotización
    -- ==========================================================
    INSERT INTO cotizaciones (
        num_cotizacion, id_asesor, Estatus, id_cliente, nombre_prospecto, 
        contacto, ciudad_destino, tipo_cambio, moneda, fecha, vigencia_dias, 
        subtotal, iva, total
    ) 
    VALUES (
        v_num_cotizacion, p_id_asesor, 1, p_id_cliente, p_nombre_prospecto, 
        p_contacto, p_ciudad_destino, p_tipo_cambio, p_moneda, NOW(), p_vigencia_dias, 
        p_subtotal, p_iva, p_total
    );
    
    SET p_id_cotizacion = LAST_INSERT_ID();

END $$

DELIMITER ;

DELIMITER $$
CREATE PROCEDURE sp_modificar_cotizacion(
    IN p_id_cotizacion INT,
    IN p_id_cliente INT,
    IN p_nombre_prospecto VARCHAR(150),
    IN p_contacto VARCHAR(150),
    IN p_ciudad_destino VARCHAR(100),
    IN p_moneda VARCHAR(20),
    IN p_tipo_cambio DECIMAL(10,4),
    IN p_vigencia_dias INT,
    IN p_subtotal DECIMAL(10,2),
    IN p_iva DECIMAL(10,2),
    IN p_total DECIMAL(10,2)
)
BEGIN
    DECLARE v_id_proyecto INT;

    -- 1. Verificamos si esta cotización está enlazada a un proyecto
    SELECT id_proyecto INTO v_id_proyecto 
    FROM cotizaciones 
    WHERE id = p_id_cotizacion;

    -- 2. Actualizamos la cotización y sumamos 1 al contador de revisiones
    UPDATE cotizaciones 
    SET 
        id_cliente = p_id_cliente,
        nombre_prospecto = p_nombre_prospecto,
        contacto = p_contacto,
        ciudad_destino = p_ciudad_destino,
        moneda = p_moneda,
        tipo_cambio = p_tipo_cambio,
        vigencia_dias = p_vigencia_dias,
        subtotal = p_subtotal,
        iva = p_iva,
        total = p_total,
        num_revision = num_revision + 1 
    WHERE id = p_id_cotizacion;

    -- 3. Si pertenece a un proyecto, actualizamos su estatus a 3 (En Modificación)
    IF v_id_proyecto IS NOT NULL THEN
        UPDATE proyectos_soporte 
        SET estatus = 3
        WHERE id = v_id_proyecto;
    END IF;
END $$

DELIMITER ;

DELIMITER $$
CREATE PROCEDURE CancelarCot(
in id_c int)
begin 
UPDATE cotizaciones
SET 
   Estatus = 0
   WHERE id = id_c;
   END $$

DELIMITER ;



DELIMITER $$

CREATE PROCEDURE sp_buscar_filtrar_cotizaciones(
    IN p_busqueda VARCHAR(150),
    IN p_estatus INT,
    IN p_fecha_inicio DATE,
    IN p_fecha_fin DATE,
    IN p_orden_total VARCHAR(4),
    IN p_limite INT,
    IN p_offset INT
)
BEGIN
    -- ====================================================================
    -- CONSULTA 1: Registros de la página
    -- ====================================================================
    SELECT *
    FROM verCot
    WHERE 
        (p_busqueda IS NULL OR p_busqueda = '' OR 
         num_cotizacion LIKE CONCAT('%', p_busqueda, '%') OR 
         nombre_cliente_final LIKE CONCAT('%', p_busqueda, '%'))
        AND (p_estatus = -1 OR Estatus = p_estatus)
        AND (p_fecha_inicio IS NULL OR DATE(fecha) >= p_fecha_inicio)
        AND (p_fecha_fin IS NULL OR DATE(fecha) <= p_fecha_fin)
        
    ORDER BY 
        CASE WHEN p_orden_total = 'DESC' THEN total END DESC,
        CASE WHEN p_orden_total = 'ASC' THEN total END ASC,
        id DESC
        
    LIMIT p_limite OFFSET p_offset;

    -- ====================================================================
    -- CONSULTA 2: Total para la paginación
    -- ====================================================================
    SELECT COUNT(*) AS total
    FROM verCot
    WHERE 
        (p_busqueda IS NULL OR p_busqueda = '' OR 
         num_cotizacion LIKE CONCAT('%', p_busqueda, '%') OR 
         nombre_cliente_final LIKE CONCAT('%', p_busqueda, '%'))
        AND (p_estatus = -1 OR Estatus = p_estatus)
        AND (p_fecha_inicio IS NULL OR DATE(fecha) >= p_fecha_inicio)
        AND (p_fecha_fin IS NULL OR DATE(fecha) <= p_fecha_fin);

END $$

DELIMITER ;
DELIMITER $$

CREATE PROCEDURE sp_cotizaciones_mes_actual(
    IN p_limite INT,
    IN p_offset INT
)
BEGIN
    SELECT * FROM verCot
    WHERE MONTH(fecha) = MONTH(CURRENT_DATE()) 
      AND YEAR(fecha) = YEAR(CURRENT_DATE())
    ORDER BY id DESC
    LIMIT p_limite OFFSET p_offset;
END $$

DELIMITER ;

DELIMITER $$
CREATE PROCEDURE sp_buscar_producto_para_cotizacion(
    IN p_busqueda VARCHAR(300),
    IN p_id_proveedor INT      
)
BEGIN
    SELECT 
        id, 
        Codigo_japon, 
        Codigo_numeral, 
        Nombre, 
        Descripcion,
        ExtraDescripcion,
        Precio,       
        Stock,
        -- Se eliminó 'origen' porque ya no existe en el catálogo maestro
        Estatus 
    FROM productos 
    WHERE (
           Codigo_japon LIKE CONCAT('%', p_busqueda, '%') 
        OR Codigo_numeral LIKE CONCAT('%', p_busqueda, '%')
        OR Nombre LIKE CONCAT('%', p_busqueda, '%')
        OR Descripcion LIKE CONCAT('%', p_busqueda, '%') -- Ahora busca también por la descripción
    )
      AND Estatus IN (1, 2) 
      AND (p_id_proveedor IS NULL OR id_marca = p_id_proveedor) 
      
    -- ========================================================
    -- MAGIA DE RELEVANCIA: Ordenamos del más exacto al menos exacto
    -- ========================================================
    ORDER BY 
        CASE 
            -- Nivel 1: Coincidencia EXACTA del código o modelo
            WHEN Codigo_japon = p_busqueda OR Codigo_numeral = p_busqueda OR Nombre = p_busqueda THEN 1
            
            -- Nivel 2: El modelo EMPIEZA con lo que buscó
            WHEN Nombre LIKE CONCAT(p_busqueda, '%') THEN 2
            
            -- Nivel 3: El nombre descriptivo EMPIEZA con lo que buscó (Ej: "To" -> "Torreta")
            WHEN Descripcion LIKE CONCAT(p_busqueda, '%') THEN 3
            
            -- Nivel 4: El código Japón EMPIEZA con lo que buscó
            WHEN Codigo_japon LIKE CONCAT(p_busqueda, '%') THEN 4
            
            -- Nivel 5: Es el inicio de una palabra dentro del texto
            WHEN Nombre LIKE CONCAT('% ', p_busqueda, '%') OR Descripcion LIKE CONCAT('% ', p_busqueda, '%') THEN 5
            
            -- Nivel 6: Lo contiene en medio de la palabra. Se van al final.
            ELSE 6 
        END ASC,
        
        -- Criterio de desempate: Orden alfabético y los más cortos primero
        LENGTH(Nombre) ASC, 
        Nombre ASC
        
    LIMIT 15;
END $$

DELIMITER ;

DELIMITER $$
CREATE PROCEDURE sp_convertir_cotizacion_pedido(
    IN p_id_cotizacion INT,
    IN p_orden_compra VARCHAR(100),
    OUT p_id_pedido INT,
    OUT p_mensaje VARCHAR(255)
)
BEGIN
    DECLARE v_id_cliente INT;
    DECLARE v_estatus_cotizacion INT;
    DECLARE v_id_asesor INT;
    DECLARE v_vigencia_dias INT;
    DECLARE v_fecha_cotizacion DATE;
    DECLARE v_fecha_limite_calculada DATE;
    
    -- VARIABLES PARA MONEDA
    DECLARE v_moneda VARCHAR(50);
    DECLARE v_tipo_cambio DECIMAL(10,4);
    
    -- NUEVA VARIABLE PARA EL PROYECTO
    DECLARE v_id_proyecto INT;

    -- Obtenemos TODO lo necesario de la cotización, incluyendo el id_proyecto
    SELECT id_cliente, Estatus, id_asesor, vigencia_dias, fecha, moneda, tipo_cambio, id_proyecto
    INTO v_id_cliente, v_estatus_cotizacion, v_id_asesor, v_vigencia_dias, v_fecha_cotizacion, v_moneda, v_tipo_cambio, v_id_proyecto
    FROM cotizaciones
    WHERE id = p_id_cotizacion;

    IF v_id_cliente IS NULL THEN
        SET p_mensaje = 'Error: No se puede generar un pedido a un prospecto. Registre oficialmente al cliente primero.';
        SET p_id_pedido = -1;
        
    ELSEIF v_estatus_cotizacion = 2 THEN
        SET p_mensaje = 'Error: Esta cotización ya fue convertida a pedido anteriormente o ya fue aceptada.';
        SET p_id_pedido = -1;
        
    ELSE
        START TRANSACTION;
        
        SET v_fecha_limite_calculada = DATE_ADD(v_fecha_cotizacion, INTERVAL v_vigencia_dias DAY);

        UPDATE cotizaciones 
        SET Estatus = 2 
        WHERE id = p_id_cotizacion;

        -- 1. Insertamos el pedido (Encabezado)
        INSERT INTO pedidos (
            id_cliente, id_asesor, id_cotizacion, fecha, fecha_limite, 
            Estatus, alerta_enviada, orden_compra 
        ) VALUES (
            v_id_cliente, v_id_asesor, p_id_cotizacion, CURDATE(), v_fecha_limite_calculada, 
            1, 0, p_orden_compra 
        );
        
        SET p_id_pedido = LAST_INSERT_ID();
        
        -- 2. TRASPASO DE PARTIDAS
        INSERT INTO detalles_pedido (
            id_pedido, id_producto, codigo_manual, descripcion_manual, extra_descripcion_manual, 
            cantidad, precio_unitario, costo_flete, estatus_surtido
        )
        SELECT 
            p_id_pedido, id_producto, codigo_manual, descripcion_manual, extra_descripcion_manual, 
            cantidad_producto, 
            IF(v_moneda = 'USD' AND v_tipo_cambio > 0, precio_unitario_cotizado / v_tipo_cambio, precio_unitario_cotizado),
            IF(v_moneda = 'USD' AND v_tipo_cambio > 0, costo_flete / v_tipo_cambio, costo_flete),
            0 
        FROM detalles_cotizacion
        WHERE id_cotizacion = p_id_cotizacion;
        
        -- =========================================================
        -- 3. MAGIA PARA EL MÓDULO DE PROYECTOS (ESTATUS 4 Y BITÁCORA)
        -- =========================================================
        IF v_id_proyecto IS NOT NULL THEN
            -- Actualizamos el proyecto a Estatus 4 (En Ejecución / Instalación)
            UPDATE proyectos_soporte 
            SET estatus = 4 
            WHERE id = v_id_proyecto;
            
            -- Insertamos el registro automático en la bitácora
            INSERT INTO bitacora_avances (id_proyecto, fecha_registro, comentarios)
            VALUES (
                v_id_proyecto, 
                NOW(), 
                CONCAT('Sistema: Cotización aceptada y convertida a pedido (OC: ', IFNULL(p_orden_compra, 'N/A'), '). El proyecto pasa a fase de Ejecución / Instalación.')
            );
        END IF;

        SET p_mensaje = 'Éxito: Cotización convertida a pedido correctamente, incluyendo productos manuales.';

        COMMIT;
    END IF;

END $$

DELIMITER ;

DELIMITER $$
CREATE PROCEDURE sp_buscar_filtrar_pedidos(
    IN p_busqueda VARCHAR(150),
    IN p_estatus INT,
    IN p_fecha_inicio DATE,
    IN p_fecha_fin DATE,
    IN p_id_asesor INT,          
    IN p_limite INT,
    IN p_offset INT
)
BEGIN
    -- CONSULTA 1: Registros paginados
    SELECT *
    FROM verPedidos
    WHERE 
        (p_busqueda IS NULL OR p_busqueda = '' OR 
         nombre_cliente LIKE CONCAT('%', p_busqueda, '%') OR 
         Razon_social LIKE CONCAT('%', p_busqueda, '%') OR
         id LIKE CONCAT('%', p_busqueda, '%'))
        
        -- LA MAGIA ESTÁ AQUÍ: Evaluamos nuestro estado virtual '99'
        AND (
            p_estatus = -1 
            OR (p_estatus = 99 AND Estatus IN (1, 3)) 
            OR Estatus = p_estatus
        )
        
        AND (p_fecha_inicio IS NULL OR DATE(fecha_pedido) >= p_fecha_inicio)
        AND (p_fecha_fin IS NULL OR DATE(fecha_pedido) <= p_fecha_fin)
        AND (p_id_asesor IS NULL OR id_asesor = p_id_asesor)   
        
    ORDER BY id DESC
        
    LIMIT p_limite OFFSET p_offset;

    -- CONSULTA 2: Total para la paginación
    SELECT COUNT(*) AS total
    FROM verPedidos
    WHERE 
        (p_busqueda IS NULL OR p_busqueda = '' OR 
         nombre_cliente LIKE CONCAT('%', p_busqueda, '%') OR 
         Razon_social LIKE CONCAT('%', p_busqueda, '%') OR
         id LIKE CONCAT('%', p_busqueda, '%'))
         
        -- REPLICAMOS LA REGLA EN EL COUNT
        AND (
            p_estatus = -1 
            OR (p_estatus = 99 AND Estatus IN (1, 3)) 
            OR Estatus = p_estatus
        )
        
        AND (p_fecha_inicio IS NULL OR DATE(fecha_pedido) >= p_fecha_inicio)
        AND (p_fecha_fin IS NULL OR DATE(fecha_pedido) <= p_fecha_fin)
        AND (p_id_asesor IS NULL OR id_asesor = p_id_asesor);  
END $$
DELIMITER ;

DELIMITER $$
CREATE PROCEDURE sp_cancelar_pedido(
    IN p_id_pedido INT,
    OUT p_mensaje VARCHAR(255)
)
sp_main: BEGIN
    -- 1. ZONA DE DECLARACIONES
    DECLARE v_estatus_actual INT;
    DECLARE v_id_cotizacion INT;
    DECLARE v_done INT DEFAULT FALSE;
    
    DECLARE v_id_producto INT;
    DECLARE v_cantidad_surtida INT;

    -- Cursor para recorrer SOLO los productos que sí alcanzaron a tener stock apartado
    DECLARE cur_detalles CURSOR FOR 
        SELECT id_producto, cantidad_surtida 
        FROM detalles_pedido 
        WHERE id_pedido = p_id_pedido AND cantidad_surtida > 0;
        
    DECLARE CONTINUE HANDLER FOR NOT FOUND SET v_done = TRUE;

    -- 2. VALIDACIONES INICIALES
    SELECT Estatus, id_cotizacion 
    INTO v_estatus_actual, v_id_cotizacion
    FROM pedidos
    WHERE id = p_id_pedido;

    IF v_estatus_actual IS NULL THEN
        SET p_mensaje = 'Error: El pedido especificado no existe.';
        LEAVE sp_main;
    END IF;

    IF v_estatus_actual = 0 THEN
        SET p_mensaje = 'Error: Este pedido ya se encuentra cancelado.';
        LEAVE sp_main;
    END IF;


    IF v_estatus_actual = 2 THEN
        SET p_mensaje = 'Error: No se puede cancelar un pedido que ya salió del almacén.';
        LEAVE sp_main;
     END IF;

    START TRANSACTION;
    
    -- 3. REGRESAR EL STOCK APARTADO AL STOCK LIBRE
    OPEN cur_detalles;
    read_loop: LOOP
        FETCH cur_detalles INTO v_id_producto, v_cantidad_surtida;
        
        IF v_done THEN
            LEAVE read_loop;
        END IF;

        -- Sumamos al Stock libre y le restamos a los apartados
        UPDATE productos
        SET Stock = Stock + v_cantidad_surtida,
            Apartado = Apartado - v_cantidad_surtida
        WHERE id = v_id_producto;

        -- Limpiamos la cantidad surtida en el detalle del pedido por seguridad
        UPDATE detalles_pedido
        SET cantidad_surtida = 0
        WHERE id_pedido = p_id_pedido AND id_producto = v_id_producto;

    END LOOP;
    CLOSE cur_detalles;

    -- 4. ACTUALIZAR CABECERAS (Pedido y Cotización)
    UPDATE pedidos
    SET Estatus = 0 
    WHERE id = p_id_pedido;

    -- Liberamos la cotización regresándola a estatus "Pendiente" (1)
    IF v_id_cotizacion IS NOT NULL THEN
        UPDATE cotizaciones 
        SET Estatus = 1 
        WHERE id = v_id_cotizacion;
    END IF;

    SET p_mensaje = 'Éxito: El pedido ha sido cancelado y las piezas apartadas regresaron al inventario libre.';
    
    COMMIT;

END $$
DELIMITER ;

DELIMITER $$
CREATE PROCEDURE sp_aceptar_pedido_validacion(
    IN p_id_pedido INT,
    OUT p_mensaje VARCHAR(255)
)
sp_main: BEGIN
    DECLARE v_estatus INT;
    DECLARE v_done INT DEFAULT FALSE;
    DECLARE v_pedidos_incompletos INT DEFAULT 0;
    
    DECLARE v_id_producto INT;
    DECLARE v_cantidad_pedida INT;
    DECLARE v_cantidad_ya_surtida INT;
    DECLARE v_stock_libre INT;
    DECLARE v_cantidad_a_apartar INT DEFAULT 0;
    DECLARE v_falta_surtir INT;

    DECLARE cur_detalles CURSOR FOR 
        SELECT id_producto, cantidad, cantidad_surtida 
        FROM detalles_pedido 
        WHERE id_pedido = p_id_pedido;
        
    DECLARE CONTINUE HANDLER FOR NOT FOUND SET v_done = TRUE;

    SELECT Estatus INTO v_estatus 
    FROM pedidos WHERE id = p_id_pedido;

    IF v_estatus IS NULL THEN
        SET p_mensaje = 'El pedido especificado no existe.';
        LEAVE sp_main;
    END IF;

    -- Solo tiene sentido reintentar si estaba Incompleto (3)
    IF v_estatus <> 3 THEN
        SET p_mensaje = 'Este pedido no requiere reintento de apartado de stock.';
        LEAVE sp_main;
    END IF;

    OPEN cur_detalles;
    read_loop: LOOP
        FETCH cur_detalles INTO v_id_producto, v_cantidad_pedida, v_cantidad_ya_surtida;
        IF v_done THEN
            LEAVE read_loop;
        END IF;

        SELECT Stock INTO v_stock_libre 
        FROM productos WHERE id = v_id_producto;

        SET v_falta_surtir = v_cantidad_pedida - v_cantidad_ya_surtida;
        SET v_cantidad_a_apartar = 0;

        IF v_falta_surtir > 0 AND v_stock_libre > 0 THEN
            IF v_stock_libre >= v_falta_surtir THEN
                SET v_cantidad_a_apartar = v_falta_surtir;
            ELSE
                SET v_cantidad_a_apartar = v_stock_libre;
            END IF;

            UPDATE productos 
            SET Stock = Stock - v_cantidad_a_apartar,
                Apartado = Apartado + v_cantidad_a_apartar
            WHERE id = v_id_producto;

            UPDATE detalles_pedido 
            SET cantidad_surtida = cantidad_surtida + v_cantidad_a_apartar 
            WHERE id_pedido = p_id_pedido AND id_producto = v_id_producto;
        END IF;
        
        IF (v_cantidad_ya_surtida + v_cantidad_a_apartar) < v_cantidad_pedida THEN
            SET v_pedidos_incompletos = 1;
        END IF;

    END LOOP;
    CLOSE cur_detalles;

    -- NUEVO: ahora sí actualizamos el estatus real del pedido según el resultado
    UPDATE pedidos
    SET Estatus = IF(v_pedidos_incompletos = 1, 3, 2)
    WHERE id = p_id_pedido;

    IF v_pedidos_incompletos = 1 THEN
        SET p_mensaje = 'Se apartó el stock disponible, pero el pedido AÚN sigue incompleto.';
    ELSE
        SET p_mensaje = '¡El pedido ya cuenta con el 100% del stock apartado y está listo para entrega!';
    END IF;

END $$
DELIMITER ;

DELIMITER $$

CREATE PROCEDURE sp_subir_factura_pedido(
    IN p_id_pedido INT,
    IN p_nombre_factura VARCHAR(100),
    IN p_factura_ruta TEXT,
    OUT p_mensaje VARCHAR(255),
    OUT p_ruta_anterior TEXT 
)
sp_main: BEGIN
    -- 1. ZONA DE DECLARACIONES (Todas arriba)
    DECLARE v_estatus_actual INT;
    DECLARE v_done INT DEFAULT FALSE;
    DECLARE v_pedidos_incompletos INT DEFAULT 0;
    
    DECLARE v_id_producto INT;
    DECLARE v_cantidad_pedida INT;
    DECLARE v_cantidad_ya_surtida INT;
    DECLARE v_stock_libre INT;
    DECLARE v_cantidad_a_apartar INT;
    DECLARE v_falta_surtir INT; -- CORRECCIÓN: Declarada hasta arriba

    -- Cursores y Handlers
    DECLARE cur_detalles CURSOR FOR 
        SELECT id_producto, cantidad, cantidad_surtida 
        FROM detalles_pedido WHERE id_pedido = p_id_pedido;
        
    DECLARE CONTINUE HANDLER FOR NOT FOUND SET v_done = TRUE;

    -- 2. ZONA LÓGICA
    SELECT Estatus, factura_ruta INTO v_estatus_actual, p_ruta_anterior 
    FROM pedidos WHERE id = p_id_pedido;

    IF v_estatus_actual IS NULL THEN
        SET p_mensaje = 'Error: El pedido especificado no existe.';
        LEAVE sp_main;
    END IF;

    -- Solo apartamos stock si el pedido era nuevo (Estatus 1)
    IF v_estatus_actual = 1 THEN
        OPEN cur_detalles;
        read_loop: LOOP
            FETCH cur_detalles INTO v_id_producto, v_cantidad_pedida, v_cantidad_ya_surtida;
            IF v_done THEN LEAVE read_loop; END IF;

            SELECT Stock INTO v_stock_libre FROM productos WHERE id = v_id_producto;
            
            SET v_falta_surtir = v_cantidad_pedida - v_cantidad_ya_surtida;

            IF v_falta_surtir > 0 AND v_stock_libre > 0 THEN
                IF v_stock_libre >= v_falta_surtir THEN
                    SET v_cantidad_a_apartar = v_falta_surtir;
                ELSE
                    SET v_cantidad_a_apartar = v_stock_libre;
                END IF;

                UPDATE productos 
                SET Stock = Stock - v_cantidad_a_apartar,
                    Apartado = Apartado + v_cantidad_a_apartar
                WHERE id = v_id_producto;

                UPDATE detalles_pedido 
                SET cantidad_surtida = cantidad_surtida + v_cantidad_a_apartar 
                WHERE id_pedido = p_id_pedido AND id_producto = v_id_producto;
            END IF;

            IF (v_cantidad_ya_surtida + v_cantidad_a_apartar) < v_cantidad_pedida THEN
                SET v_pedidos_incompletos = 1;
            END IF;

        END LOOP;
        CLOSE cur_detalles;
    END IF;

    -- 3. Actualizar Pedido
  UPDATE pedidos
SET 
    nombre_factura = p_nombre_factura,
    factura_ruta = p_factura_ruta,
    fecha_factura = NOW(),
    Estatus = CASE
                WHEN v_estatus_actual <> 1 THEN v_estatus_actual   -- si no estaba Pendiente, no lo tocamos
                WHEN v_pedidos_incompletos = 1 THEN 3              -- faltó stock -> Incompleto
                ELSE 2                                              -- se apartó el 100% -> Completado
              END
WHERE id = p_id_pedido;

    -- 4. Definir mensaje
    IF v_pedidos_incompletos = 1 THEN
        SET p_mensaje = 'Factura subida. Pedido incompleto (Falta stock de algunos productos).';
    ELSE
        SET p_mensaje = 'Factura subida y pedido aceptado con stock completo.';
    END IF;

END $$
DELIMITER ;
DELIMITER $$
CREATE PROCEDURE sp_agregar_asesor(
    IN p_Nombre VARCHAR(200),
    IN p_app VARCHAR(80),
    IN p_apm VARCHAR(80),
    IN p_telefono VARCHAR(14),
    IN p_contra VARCHAR(255),
    IN p_Rol ENUM('Almacen', 'Cotizador', 'Administrador', 'Asesor', 'Soporte Tecnico'),
    IN p_Fecha_nacimiento DATE,
    IN p_Fecha_contratacion DATE,
    IN p_Correo VARCHAR(100),
    OUT p_mensaje VARCHAR(255)
)
BEGIN
    DECLARE v_usuario VARCHAR(100);

    -- Regla de negocio: Generar usuario a partir del correo (todo antes del @)
    SET v_usuario = SUBSTRING_INDEX(p_Correo, '@', 1);

    -- Insertamos el registro forzando el Estatus = 1
    INSERT INTO asesores (
        Nombre, 
        app, 
        apm, 
        telefono, 
        usuario, 
        contra, 
        Estatus, 
        Rol, 
        Fecha_nacimiento, 
        Fecha_contratacion, 
        Correo
    ) VALUES (
        p_Nombre, 
        p_app, 
        p_apm, 
        p_telefono, 
        v_usuario, 
        p_contra, 
        1, 
        p_Rol, 
        p_Fecha_nacimiento, 
        p_Fecha_contratacion, 
        p_Correo
    );

    SET p_mensaje = 'Éxito: Asesor registrado correctamente.';

END $$

DELIMITER ;

DELIMITER $$
CREATE PROCEDURE sp_modificar_asesor(
    IN p_id INT,
    IN p_Nombre VARCHAR(200),
    IN p_app VARCHAR(80),
    IN p_apm VARCHAR(80),
    IN p_telefono VARCHAR(14),
    IN p_Rol ENUM('Almacen', 'Cotizador', 'Administrador', 'Asesor', 'Soporte Tecnico'),
    IN p_Fecha_nacimiento DATE,
    IN p_Fecha_contratacion DATE,
    IN p_Correo VARCHAR(100),
    OUT p_mensaje VARCHAR(255)
)
BEGIN
    DECLARE v_usuario VARCHAR(100);
    DECLARE v_existe INT;

    -- Verificamos que el asesor exista
    SELECT COUNT(*) INTO v_existe FROM asesores WHERE id = p_id;

    IF v_existe = 0 THEN
        SET p_mensaje = 'Error: El asesor especificado no existe.';
    ELSE
        -- Volvemos a generar el usuario en caso de que el correo haya cambiado
        SET v_usuario = SUBSTRING_INDEX(p_Correo, '@', 1);

        UPDATE asesores 
        SET 
            Nombre = p_Nombre,
            app = p_app,
            apm = p_apm,
            telefono = p_telefono,
            usuario = v_usuario,
            Rol = p_Rol,
            Fecha_nacimiento = p_Fecha_nacimiento,
            Fecha_contratacion = p_Fecha_contratacion,
            Correo = p_Correo
        WHERE id = p_id;

        SET p_mensaje = 'Asesor modificado correctamente.';
    END IF;

END $$

DELIMITER ;
DELIMITER $$

DROP PROCEDURE IF EXISTS sp_eliminar_asesor $$

CREATE PROCEDURE sp_eliminar_asesor(
    IN p_id INT,
    OUT p_mensaje VARCHAR(255)
)
BEGIN
    DECLARE v_existe INT;

    SELECT COUNT(*) INTO v_existe FROM asesores WHERE id = p_id;

    IF v_existe = 0 THEN
        SET p_mensaje = 'Error: El asesor especificado no existe.';
    ELSE
        UPDATE asesores 
        SET Estatus = 0 
        WHERE id = p_id;

        SET p_mensaje = 'Asesor dado de baja correctamente.';
    END IF;

END $$

DELIMITER ;

DELIMITER $$

CREATE PROCEDURE sp_buscar_asesores(
    IN p_busqueda VARCHAR(255),
    IN p_estatus INT,
    IN p_limite INT,
    IN p_offset INT
)
BEGIN
    -- 1. Devolvemos los registros filtrados
    SELECT 
        id,
        Nombre,             -- ¡NUEVO!
        app,                -- ¡NUEVO!
        apm,                -- ¡NUEVO!
        Nombre_completo,
        telefono,
        usuario,
        Estatus,
        Rol,
        Fecha_nacimiento,
        Fecha_contratacion,
        Correo
    FROM verAsesores
    WHERE 
        (p_busqueda = '' OR Nombre_completo LIKE CONCAT('%', p_busqueda, '%'))
        AND (p_estatus = -1 OR Estatus = p_estatus)
    ORDER BY id DESC
    LIMIT p_limite OFFSET p_offset;

    -- 2. Devolvemos el TOTAL
    SELECT COUNT(*) AS total_registros
    FROM verAsesores
    WHERE 
        (p_busqueda = '' OR Nombre_completo LIKE CONCAT('%', p_busqueda, '%'))
        AND (p_estatus = -1 OR Estatus = p_estatus);

END $$

DELIMITER ;

DELIMITER $$
CREATE PROCEDURE sp_dashboard_productos_top(
    IN p_id_asesor INT,
    IN p_meses INT
)
BEGIN
    DECLARE v_fecha_inicio DATE;

    IF p_meses IS NULL OR p_meses <= 0 THEN
        SET p_meses = 3;
    END IF;

    SET v_fecha_inicio = DATE_SUB(DATE_FORMAT(CURRENT_DATE(), '%Y-%m-01'), INTERVAL (p_meses - 1) MONTH);

    SELECT 
        pr.Nombre, 
        COALESCE(ventas.total_piezas, 0) AS total_piezas
    FROM productos pr
    LEFT JOIN (
        SELECT 
            dp.id_producto,
            SUM(dp.cantidad) AS total_piezas
        FROM detalles_pedido dp
        INNER JOIN pedidos p ON dp.id_pedido = p.id
        WHERE p.fecha >= v_fecha_inicio
          AND p.Estatus = 2
          AND (p_id_asesor IS NULL OR p_id_asesor = 0 OR p.id_asesor = p_id_asesor)
        GROUP BY dp.id_producto
    ) ventas ON ventas.id_producto = pr.id
    ORDER BY total_piezas DESC
    LIMIT 5;
END $$
DELIMITER ;

DELIMITER $$
CREATE PROCEDURE sp_productos_menos_vendidos(
    IN p_id_asesor INT,
    IN p_meses INT
)
BEGIN
    DECLARE v_fecha_inicio DATE;

    IF p_meses IS NULL OR p_meses <= 0 THEN
        SET p_meses = 3;
    END IF;

    SET v_fecha_inicio = DATE_SUB(DATE_FORMAT(CURRENT_DATE(), '%Y-%m-01'), INTERVAL (p_meses - 1) MONTH);

    SELECT 
        pr.Nombre, 
        COALESCE(ventas.total_piezas, 0) AS total_piezas
    FROM productos pr
    LEFT JOIN (
        SELECT 
            dp.id_producto,
            SUM(dp.cantidad) AS total_piezas
        FROM detalles_pedido dp
        INNER JOIN pedidos p ON dp.id_pedido = p.id
        WHERE p.fecha >= v_fecha_inicio
          AND p.Estatus = 2
          AND (p_id_asesor IS NULL OR p_id_asesor = 0 OR p.id_asesor = p_id_asesor)
        GROUP BY dp.id_producto
    ) ventas ON ventas.id_producto = pr.id
    ORDER BY total_piezas ASC
    LIMIT 5;
END $$
DELIMITER ;

DELIMITER $$

CREATE PROCEDURE sp_tasa_conversion(
    IN p_filtro_moneda VARCHAR(20), 
    IN p_id_cliente INT,
    IN p_id_asesor INT
)
BEGIN
    IF p_filtro_moneda IS NULL OR p_filtro_moneda = '' THEN
        SET p_filtro_moneda = 'GLOBAL';
    END IF;

    SELECT 
        c.Nombre AS Cliente,
        COALESCE(cot.total_cotizado, 0) AS Cotizado,
        COALESCE(ped.total_vendido, 0) AS Vendido
    FROM clientes c
    LEFT JOIN (
        SELECT 
            id_cliente, 
            SUM(
                CASE 
                    WHEN p_filtro_moneda = 'GLOBAL' THEN
                        CASE WHEN moneda = 'USD' THEN total * tipo_cambio ELSE total END
                    ELSE total 
                END
            ) AS total_cotizado
        FROM cotizaciones
        WHERE MONTH(fecha) = MONTH(CURRENT_DATE()) 
          AND YEAR(fecha) = YEAR(CURRENT_DATE())
          AND (p_id_asesor IS NULL OR p_id_asesor = 0 OR id_asesor = p_id_asesor) 
          AND (p_filtro_moneda = 'GLOBAL' 
               OR (p_filtro_moneda = 'MXN' AND moneda = 'MONEDA NACIONAL')
               OR (p_filtro_moneda = 'USD' AND moneda = 'USD'))
        GROUP BY id_cliente
    ) cot ON c.id = cot.id_cliente
    LEFT JOIN (
        SELECT 
            p.id_cliente, 
            SUM(
                dp.cantidad * dp.precio_unitario *
                CASE 
                    WHEN p_filtro_moneda = 'GLOBAL' AND c_orig.moneda = 'USD' 
                        THEN c_orig.tipo_cambio 
                    ELSE 1 
                END
            ) * 1.16 AS total_vendido
        FROM pedidos p
        INNER JOIN cotizaciones c_orig ON p.id_cotizacion = c_orig.id
        INNER JOIN detalles_pedido dp ON dp.id_pedido = p.id
        WHERE MONTH(c_orig.fecha) = MONTH(CURRENT_DATE())   
          AND YEAR(c_orig.fecha) = YEAR(CURRENT_DATE())
          AND p.Estatus = 2
          AND (p_id_asesor IS NULL OR p_id_asesor = 0 OR p.id_asesor = p_id_asesor) 
          AND (p_filtro_moneda = 'GLOBAL' 
               OR (p_filtro_moneda = 'MXN' AND c_orig.moneda = 'MONEDA NACIONAL')
               OR (p_filtro_moneda = 'USD' AND c_orig.moneda = 'USD'))
        GROUP BY p.id_cliente
    ) ped ON c.id = ped.id_cliente

    WHERE (cot.total_cotizado > 0 OR ped.total_vendido > 0)
      AND (p_id_cliente IS NULL OR c.id = p_id_cliente)
      -- ¡AQUÍ ESTÁ LA MAGIA! Buscamos en la nueva tabla intermedia
      AND (p_id_asesor IS NULL OR p_id_asesor = 0 OR EXISTS (
          SELECT 1 FROM cliente_asesor ca 
          WHERE ca.id_cliente = c.id AND ca.id_asesor = p_id_asesor
      )) 
    ORDER BY Cotizado DESC;
END $$
DELIMITER ;

DELIMITER $$
CREATE PROCEDURE sp_productos_estrella(
    IN p_id_cliente INT, 
    IN p_id_asesor INT
)
BEGIN
    IF p_id_cliente IS NOT NULL THEN
        SELECT 
            c.Nombre AS Cliente,
            pr.Nombre AS Producto_Estrella,
            SUM(dp.cantidad) AS Cantidad_Comprada
        FROM pedidos p
        INNER JOIN clientes c ON p.id_cliente = c.id
        INNER JOIN detalles_pedido dp ON p.id = dp.id_pedido
        INNER JOIN productos pr ON dp.id_producto = pr.id
        WHERE p.id_cliente = p_id_cliente 
          -- CORRECCIÓN: Acepta 0 para mostrar todos
          AND (p_id_asesor IS NULL OR p_id_asesor = 0 OR p.id_asesor = p_id_asesor) 
        GROUP BY c.Nombre, pr.id, pr.Nombre
        ORDER BY Cantidad_Comprada DESC;
        
    ELSE
        WITH VentasPorCliente AS (
            SELECT 
                c.Nombre AS Cliente,
                pr.Nombre AS Producto_Estrella,
                SUM(dp.cantidad) AS Cantidad_Comprada,
                ROW_NUMBER() OVER(PARTITION BY p.id_cliente ORDER BY SUM(dp.cantidad) DESC) as ranking
            FROM pedidos p
            INNER JOIN clientes c ON p.id_cliente = c.id
            INNER JOIN detalles_pedido dp ON p.id = dp.id_pedido
            INNER JOIN productos pr ON dp.id_producto = pr.id
            -- CORRECCIÓN: Acepta 0 para mostrar todos
            WHERE (p_id_asesor IS NULL OR p_id_asesor = 0 OR p.id_asesor = p_id_asesor) 
            GROUP BY p.id_cliente, c.Nombre, pr.id, pr.Nombre
        )
        SELECT Cliente, Producto_Estrella, Cantidad_Comprada
        FROM VentasPorCliente
        WHERE ranking = 1 
        ORDER BY Cantidad_Comprada DESC;
    END IF;
END $$
DELIMITER ;

DELIMITER $$
CREATE PROCEDURE sp_tendencia_cotizaciones(
    IN p_filtro_moneda VARCHAR(20),
    IN p_fecha_inicio VARCHAR(10),
    IN p_fecha_fin VARCHAR(10),
    IN p_id_asesor INT
)
BEGIN
    DECLARE v_fecha_inicio DATE;
    DECLARE v_fecha_fin DATE;

    IF p_filtro_moneda IS NULL OR p_filtro_moneda = '' THEN
        SET p_filtro_moneda = 'GLOBAL';
    END IF;

    -- Normalizamos siempre al día 1 del mes de inicio y al último día del mes de fin
    IF p_fecha_inicio IS NULL OR p_fecha_inicio = '' THEN
        SET v_fecha_inicio = DATE_FORMAT(DATE_SUB(CURRENT_DATE(), INTERVAL 2 MONTH), '%Y-%m-01');
    ELSE
        SET v_fecha_inicio = DATE_FORMAT(STR_TO_DATE(p_fecha_inicio, '%Y-%m-%d'), '%Y-%m-01');
    END IF;

    IF p_fecha_fin IS NULL OR p_fecha_fin = '' THEN
        SET v_fecha_fin = LAST_DAY(CURRENT_DATE());
    ELSE
        SET v_fecha_fin = LAST_DAY(STR_TO_DATE(p_fecha_fin, '%Y-%m-%d'));
    END IF;

    WITH RECURSIVE meses AS (
        SELECT v_fecha_inicio AS mes_inicio
        UNION ALL
        SELECT DATE_ADD(mes_inicio, INTERVAL 1 MONTH)
        FROM meses
        WHERE DATE_ADD(mes_inicio, INTERVAL 1 MONTH) <= v_fecha_fin
    )
    SELECT 
        DATE_FORMAT(m.mes_inicio, '%Y-%m') AS Mes,
        COALESCE(cot.Monto_Cotizado, 0) AS Monto_Cotizado,
        COALESCE(cot.Numero_Cotizaciones, 0) AS Numero_Cotizaciones
    FROM meses m
    LEFT JOIN (
        SELECT 
            DATE_FORMAT(fecha, '%Y-%m-01') AS mes_inicio,
            SUM(
                CASE 
                    WHEN p_filtro_moneda = 'GLOBAL' THEN
                        CASE WHEN moneda = 'USD' THEN total * tipo_cambio ELSE total END
                    ELSE total 
                END
            ) AS Monto_Cotizado,
            COUNT(id) AS Numero_Cotizaciones
        FROM cotizaciones
        WHERE fecha BETWEEN v_fecha_inicio AND v_fecha_fin
          AND (p_filtro_moneda = 'GLOBAL' 
               OR (p_filtro_moneda = 'MXN' AND moneda = 'MONEDA NACIONAL')
               OR (p_filtro_moneda = 'USD' AND moneda = 'USD'))
          AND (p_id_asesor IS NULL OR p_id_asesor = 0 OR id_asesor = p_id_asesor)
        GROUP BY DATE_FORMAT(fecha, '%Y-%m-01')
    ) cot ON cot.mes_inicio = m.mes_inicio
    ORDER BY m.mes_inicio ASC;
END $$
DELIMITER ;

DELIMITER $$

CREATE PROCEDURE sp_estadisticas_generales_mes(IN p_id_asesor INT)
BEGIN
    SELECT 
        COALESCE(cot.cantidad_cotizaciones, 0) AS total_cotizaciones_mes,
        COALESCE(ped.cantidad_pedidos, 0) AS total_pedidos_mes,
        COALESCE(cot.cotizado_mxn_puro, 0) AS cotizado_mxn_puro,
        COALESCE(cot.cotizado_usd_puro, 0) AS cotizado_usd_puro,
        COALESCE(cot.cotizado_global_pesos, 0) AS cotizado_global_pesos,
        COALESCE(ped.vendido_global_pesos, 0) AS vendido_global_pesos
    FROM 
    (
        SELECT 
            COUNT(id) AS cantidad_cotizaciones,
            SUM(CASE WHEN moneda = 'MONEDA NACIONAL' THEN total ELSE 0 END) AS cotizado_mxn_puro,
            SUM(CASE WHEN moneda = 'USD' THEN total ELSE 0 END) AS cotizado_usd_puro,
            SUM(
                CASE 
                    WHEN moneda = 'USD' THEN total * tipo_cambio 
                    ELSE total 
                END
            ) AS cotizado_global_pesos
        FROM cotizaciones
        WHERE MONTH(fecha) = MONTH(CURRENT_DATE()) 
          AND YEAR(fecha) = YEAR(CURRENT_DATE())
          AND (p_id_asesor IS NULL OR id_asesor = p_id_asesor) -- FILTRO DE ROL
    ) cot
    CROSS JOIN 
    (
        SELECT 
            COUNT(DISTINCT p.id) AS cantidad_pedidos,
            SUM(dp.cantidad * dp.precio_unitario) * 1.16 AS vendido_global_pesos
        FROM pedidos p
        INNER JOIN detalles_pedido dp ON p.id = dp.id_pedido
        WHERE MONTH(p.fecha) = MONTH(CURRENT_DATE()) 
          AND YEAR(p.fecha) = YEAR(CURRENT_DATE())
          AND (p_id_asesor IS NULL OR p.id_asesor = p_id_asesor) -- FILTRO DE ROL
    ) ped;
END $$
DELIMITER ;

DELIMITER $$

CREATE PROCEDURE sp_registro(
    IN p_Nombre VARCHAR(200),
    IN p_app  VARCHAR(100),
    IN p_apm  VARCHAR(100),
    IN p_telefono VARCHAR(14),
    IN p_contra VARCHAR(255),
    IN p_Fecha_nacimiento DATE,
    IN p_Correo VARCHAR(100),
    OUT p_mensaje varchar(100)
)
BEGIN 
    DECLARE v_usuario VARCHAR(100);
    
    SET v_usuario = SUBSTRING_INDEX(p_Correo, '@', 1);
    
    INSERT INTO asesores (
        Nombre, 
        app, 
        apm, 
        telefono, 
        usuario, 
        contra, 
        Estatus, 
        Fecha_nacimiento, 
        Correo
    ) VALUES (
        p_Nombre, 
        p_app, 
        p_apm, 
        p_telefono, 
        v_usuario, 
        p_contra, 
        1, 
        p_Fecha_nacimiento, 
        p_Correo
    );

   
    SET p_mensaje = CONCAT('Registro exitoso, tu usuario asignado es ', v_usuario);
    
END $$

DELIMITER ;

DELIMITER $$

CREATE PROCEDURE sp_subir_csf_cliente(
    IN p_id_cliente INT,
    IN p_nombre_constancia VARCHAR(255),
    IN p_ruta_constancia TEXT,
    OUT p_mensaje VARCHAR(255),
    OUT p_ruta_anterior TEXT
)
sp_main: BEGIN
    DECLARE v_existe INT DEFAULT 0;

    -- 1. Validar SOLO si el cliente existe (Evitamos el error de GROUP BY)
    SELECT COUNT(*) INTO v_existe 
    FROM clientes WHERE id = p_id_cliente;

    IF v_existe = 0 THEN
        SET p_mensaje = 'Error: El cliente especificado no existe.';
        LEAVE sp_main;
    END IF;

    -- 2. Recuperar la CSF anterior ahora que sabemos que sí existe
    SELECT ruta_constancia INTO p_ruta_anterior 
    FROM clientes WHERE id = p_id_cliente;

    -- 3. Actualizar el registro del cliente
    UPDATE clientes
    SET 
        nombre_constancia = p_nombre_constancia,
        ruta_constancia = p_ruta_constancia,
        fecha_constancia = NOW()
    WHERE id = p_id_cliente;

    -- 4. Mensaje de éxito
    SET p_mensaje = 'Éxito: Constancia subida.';

END $$

DELIMITER ;
DELIMITER $$
CREATE PROCEDURE sp_buscar_tickets(
    IN p_busqueda VARCHAR(150),
    IN p_estatus TINYINT,
    IN p_id_asesor INT,
    IN p_pagina INT,
    IN p_limite INT,
    OUT p_total_registros INT
)
BEGIN
    DECLARE v_offset INT;

    IF p_pagina IS NULL OR p_pagina < 1 THEN
        SET p_pagina = 1;
    END IF;
    IF p_limite IS NULL OR p_limite < 1 THEN
        SET p_limite = 10;
    END IF;

    SET v_offset = (p_pagina - 1) * p_limite;

    SELECT COUNT(*) INTO p_total_registros
    FROM vw_tickets
    WHERE
        (p_estatus IS NULL OR p_estatus = 0 OR estatus = p_estatus)
        AND (p_id_asesor IS NULL OR p_id_asesor = 0 OR id_asesor = p_id_asesor)
        AND (
            p_busqueda IS NULL OR p_busqueda = '' OR
            nombre_asesor LIKE CONCAT('%', p_busqueda, '%') OR
            cliente_final LIKE CONCAT('%', p_busqueda, '%')
        );

    SELECT
        id_ticket, url_ticket, id_asesor, nombre_asesor, id_cliente,
        nombre_cliente_oficial, nombre_prospecto, cliente_final, estatus,
        venta_exitosa, cliente_registrado, comentarios, fecha_alta, fecha_cierre
    FROM vw_tickets
    WHERE
        (p_estatus IS NULL OR p_estatus = 0 OR estatus = p_estatus)
        AND (p_id_asesor IS NULL OR p_id_asesor = 0 OR id_asesor = p_id_asesor)
        AND (
            p_busqueda IS NULL OR p_busqueda = '' OR
            nombre_asesor LIKE CONCAT('%', p_busqueda, '%') OR
            cliente_final LIKE CONCAT('%', p_busqueda, '%')
        )
    ORDER BY fecha_alta DESC
    LIMIT p_limite OFFSET v_offset;

END $$
DELIMITER ;

DELIMITER $$
CREATE PROCEDURE sp_crear_ticket(
    IN p_id_asesor INT,
    IN p_id_cliente INT,
    IN p_nombre_prospecto VARCHAR(150),
    IN p_url_ticket TEXT,
    IN p_comentarios TEXT,
    OUT p_id_ticket INT,
    OUT p_mensaje VARCHAR(255)
)
BEGIN
    -- Insertamos el nuevo ticket
    -- Estatus se va por default con 1 (Asignado)
    INSERT INTO tickets (
        id_asesor, 
        id_cliente, 
        nombre_prospecto, 
        url_ticket,
        estatus,
        comentarios, 
        fecha_alta
    ) VALUES (
        p_id_asesor, 
        p_id_cliente, 
        p_nombre_prospecto, 
        p_url_ticket,
        1, 
        p_comentarios, 
        NOW() -- Se registra automáticamente la fecha actual
    );

    -- Devolvemos el ID del ticket recién creado por si ocupas mostrarlo en Angular
    SET p_id_ticket = LAST_INSERT_ID();
    SET p_mensaje = 'Ticket asignado y creado correctamente.';
    
END $$
DELIMITER ;

DELIMITER $$
CREATE PROCEDURE sp_modificar_ticket(
    IN p_id_ticket INT,
    IN p_id_asesor INT,
    IN p_id_cliente INT,
    IN p_nombre_prospecto VARCHAR(150),
    IN p_url_ticket TEXT,
    IN p_comentarios TEXT,
    OUT p_mensaje VARCHAR(255)
)
BEGIN
    DECLARE v_existe INT;

    -- Validamos que el ticket exista
    SELECT COUNT(*) INTO v_existe 
    FROM tickets 
    WHERE id = p_id_ticket;

    IF v_existe = 0 THEN
        SET p_mensaje = 'Error: El ticket especificado no existe.';
    ELSE
        -- Actualizamos SOLO la información general
        UPDATE tickets
        SET
            id_asesor = p_id_asesor,
            id_cliente = p_id_cliente,
            nombre_prospecto = p_nombre_prospecto,
            url_ticket = p_url_ticket,
            comentarios = p_comentarios
        WHERE id = p_id_ticket;

        SET p_mensaje = 'Información del ticket actualizada correctamente.';
    END IF;
    
END $$
DELIMITER ;

DELIMITER $$
CREATE PROCEDURE sp_cambiar_estatus_ticket(
    IN p_id_ticket INT,
    IN p_nuevo_estatus TINYINT,
    OUT p_mensaje VARCHAR(255)
)
BEGIN
    DECLARE v_existe INT;
    
    SELECT COUNT(*) INTO v_existe FROM tickets WHERE id = p_id_ticket;
    
    IF v_existe = 0 THEN
        SET p_mensaje = 'Error: El ticket no existe.';
    ELSE
        UPDATE tickets
        SET estatus = p_nuevo_estatus
        WHERE id = p_id_ticket;
        
        SET p_mensaje = 'Estatus del ticket actualizado correctamente.';
    END IF;
    
END $$
DELIMITER ;

DELIMITER $$
CREATE PROCEDURE sp_cerrar_ticket(
    IN p_id_ticket INT,
    IN p_venta_exitosa TINYINT,
    IN p_cliente_registrado TINYINT,
    IN p_nuevo_id_cliente INT, 
    OUT p_mensaje VARCHAR(255)
)
BEGIN
    DECLARE v_existe INT;
    
    SELECT COUNT(*) INTO v_existe FROM tickets WHERE id = p_id_ticket;
    
    IF v_existe = 0 THEN
        SET p_mensaje = 'Error: El ticket no existe.';
    ELSE
        UPDATE tickets
        SET 
            estatus = 4,
            venta_exitosa = p_venta_exitosa,
            cliente_registrado = p_cliente_registrado,
            id_cliente = IF(p_nuevo_id_cliente IS NOT NULL AND p_nuevo_id_cliente > 0, p_nuevo_id_cliente, id_cliente),
            fecha_cierre = NOW()
        WHERE id = p_id_ticket;
        
        SET p_mensaje = 'Ticket cerrado exitosamente y métricas registradas.';
    END IF;
    
END $$
DELIMITER ;

DELIMITER $$
CREATE PROCEDURE sp_contar_tickets_anual(
    OUT p_total_anual INT
)
BEGIN

    SELECT COUNT(*) INTO p_total_anual
    FROM tickets
    WHERE YEAR(fecha_alta) = YEAR(CURDATE());
    
END $$
DELIMITER ;

DELIMITER $$

CREATE PROCEDURE sp_pagar_pedido_con_credito(
    IN p_id_pedido INT,
    OUT p_mensaje VARCHAR(255)
)
sp_main: BEGIN
    -- 1. ZONA DE DECLARACIONES
    DECLARE v_id_cliente INT;
    DECLARE v_id_cotizacion INT;
    DECLARE v_estatus_actual INT;
    DECLARE v_moneda VARCHAR(10);              -- NUEVO: moneda del pedido/cotizacion
    DECLARE v_tiene_credito TINYINT(1);
    DECLARE v_limite_credito DECIMAL(12,2);
    DECLARE v_total_pedido DECIMAL(12,2);

    -- Variables para el Stock
    DECLARE v_done INT DEFAULT FALSE;
    DECLARE v_pedidos_incompletos INT DEFAULT 0;
    DECLARE v_id_producto INT;
    DECLARE v_cantidad_pedida INT;
    DECLARE v_cantidad_ya_surtida INT;
    DECLARE v_stock_libre INT;
    DECLARE v_cantidad_a_apartar INT DEFAULT 0; -- FIX: default 0 (antes sin inicializar)
    DECLARE v_falta_surtir INT;

    -- Cursores y Manejadores de Errores
    DECLARE cur_detalles CURSOR FOR
        SELECT id_producto, cantidad, cantidad_surtida
        FROM detalles_pedido WHERE id_pedido = p_id_pedido;

    DECLARE CONTINUE HANDLER FOR NOT FOUND SET v_done = TRUE;

    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        SET p_mensaje = 'Error interno: Se canceló la operación y no se descontó el crédito.';
    END;

    -- 2. VALIDACIONES INICIALES (fuera de transacción, solo para respuesta rápida al usuario)
    SELECT id_cliente, id_cotizacion, Estatus
    INTO v_id_cliente, v_id_cotizacion, v_estatus_actual
    FROM pedidos WHERE id = p_id_pedido;

    IF v_estatus_actual IS NULL THEN
        SET p_mensaje = 'Error: El pedido especificado no existe.';
        LEAVE sp_main;
    END IF;

    IF v_estatus_actual <> 1 THEN
        SET p_mensaje = 'Este pedido ya fue procesado anteriormente.';
        LEAVE sp_main;
    END IF;

    -- Traemos moneda y total desde la cotización vinculada
    -- NOTA: ajustar el nombre de columna si tu tabla cotizaciones usa otro nombre (ej. tipo_moneda)
    SELECT total, moneda INTO v_total_pedido, v_moneda
    FROM cotizaciones WHERE id = v_id_cotizacion;

    -- 3. VALIDACIÓN DE MONEDA (Opción 1: crédito solo disponible en MXN)
    IF v_moneda IS NULL OR v_moneda <> 'MXN' THEN
        SET p_mensaje = 'El pago con línea de crédito solo está disponible para pedidos en MXN. Este pedido está en otra moneda; utiliza el flujo de subir recibo de pago.';
        LEAVE sp_main;
    END IF;

    -- Pre-check de crédito (para dar feedback rápido; el check real y definitivo
    -- ocurre más abajo, ya con el registro bloqueado dentro de la transacción)
    SELECT tiene_credito, limite_credito INTO v_tiene_credito, v_limite_credito
    FROM clientes WHERE id = v_id_cliente;

    IF v_tiene_credito = 0 OR v_tiene_credito IS NULL THEN
        SET p_mensaje = 'El cliente no tiene una línea de crédito autorizada.';
        LEAVE sp_main;
    END IF;

    IF v_limite_credito < v_total_pedido THEN
        SET p_mensaje = CONCAT('Crédito insuficiente. Saldo: $', v_limite_credito, ' | Total a pagar: $', v_total_pedido);
        LEAVE sp_main;
    END IF;

    -- ==========================================
    -- INICIA LA TRANSACCIÓN SEGURA
    -- ==========================================
    START TRANSACTION;

    -- 4. RE-VALIDAR Y DESCONTAR EL CRÉDITO, CON BLOQUEO DE FILA
    -- FIX: FOR UPDATE evita que dos cobros simultáneos al mismo cliente
    -- sobregiren el límite (ambos pasarían el pre-check con el saldo viejo).
    SELECT limite_credito INTO v_limite_credito
    FROM clientes WHERE id = v_id_cliente FOR UPDATE;

    IF v_limite_credito < v_total_pedido THEN
        ROLLBACK;
        SET p_mensaje = CONCAT('Crédito insuficiente. Saldo: $', v_limite_credito, ' | Total a pagar: $', v_total_pedido);
        LEAVE sp_main;
    END IF;

    UPDATE clientes
    SET limite_credito = limite_credito - v_total_pedido
    WHERE id = v_id_cliente;

    -- 5. APARTADO DE STOCK AUTOMÁTICO
    OPEN cur_detalles;
    read_loop: LOOP
        FETCH cur_detalles INTO v_id_producto, v_cantidad_pedida, v_cantidad_ya_surtida;
        IF v_done THEN LEAVE read_loop; END IF;

        SET v_cantidad_a_apartar = 0;  -- FIX: reset en cada iteración (antes arrastraba el valor previo)

        -- FIX: FOR UPDATE evita condición de carrera sobre el stock del producto
        SELECT Stock INTO v_stock_libre FROM productos WHERE id = v_id_producto FOR UPDATE;
        SET v_falta_surtir = v_cantidad_pedida - v_cantidad_ya_surtida;

        IF v_falta_surtir > 0 AND v_stock_libre > 0 THEN
            IF v_stock_libre >= v_falta_surtir THEN
                SET v_cantidad_a_apartar = v_falta_surtir;
            ELSE
                SET v_cantidad_a_apartar = v_stock_libre;
            END IF;

            UPDATE productos
            SET Stock = Stock - v_cantidad_a_apartar,
                Apartado = Apartado + v_cantidad_a_apartar
            WHERE id = v_id_producto;

            UPDATE detalles_pedido
            SET cantidad_surtida = cantidad_surtida + v_cantidad_a_apartar
            WHERE id_pedido = p_id_pedido AND id_producto = v_id_producto;
        END IF;

        IF (v_cantidad_ya_surtida + v_cantidad_a_apartar) < v_cantidad_pedida THEN
            SET v_pedidos_incompletos = 1;
        END IF;
    END LOOP;
    CLOSE cur_detalles;

    -- 6. ACTUALIZAR EL PEDIDO
    UPDATE pedidos
    SET
        nombre_factura = 'PAGO CON CRÉDITO',
        factura_ruta = 'SISTEMA_INTERNO',
        fecha_factura = NOW(),
        Estatus = IF(v_pedidos_incompletos = 1, 3, 2) -- 3 Incompleto, 2 Completado
    WHERE id = p_id_pedido;

    COMMIT;

    -- 7. MENSAJE FINAL
    IF v_pedidos_incompletos = 1 THEN
        SET p_mensaje = 'Cobro exitoso. Pedido incompleto (Falta stock de algunos productos).';
    ELSE
        SET p_mensaje = 'Cobro exitoso y pedido aceptado con stock completo.';
    END IF;

END $$
DELIMITER ;

DELIMITER $$
CREATE PROCEDURE sp_agregar_demo(
    IN p_nombre_modelo VARCHAR(150),
    IN p_descripcion VARCHAR(250),
    IN p_numero_serie VARCHAR(100),
    IN p_id_marca INT,
    IN p_stock INT
)
BEGIN
    INSERT INTO stock_demo (
        nombre_modelo, 
        descripcion, 
        numero_serie, 
        id_marca, 
        stock, 
        estatus
    ) 
    VALUES (
        p_nombre_modelo, 
        p_descripcion, 
        p_numero_serie, 
        p_id_marca, 
        p_stock, 
        IF(p_stock > 0, 1, 2) -- Asigna 1 si hay stock, 2 si no hay
    );
END $$

DELIMITER ;

DELIMITER $$
CREATE PROCEDURE sp_modificar_demo(
    IN p_id INT,
    IN p_nombre_modelo VARCHAR(150),
    IN p_descripcion VARCHAR(250),
    IN p_numero_serie VARCHAR(100),
    IN p_id_marca INT,
    IN p_stock INT
)
BEGIN
    UPDATE stock_demo 
    SET 
        nombre_modelo = p_nombre_modelo,
        descripcion = p_descripcion,
        numero_serie = p_numero_serie, 
        id_marca = p_id_marca,
        stock = p_stock,
        estatus = IF(p_stock > 0, 1, 2) -- Recalcula el estatus según el nuevo stock
    WHERE id = p_id;
END $$

DELIMITER ;

DELIMITER $$
CREATE PROCEDURE sp_eliminar_demo(
    IN p_id INT
)
BEGIN
    UPDATE stock_demo 
    SET estatus = 0
    WHERE id = p_id;
END $$

DELIMITER ;

DELIMITER $$
CREATE PROCEDURE sp_activar_demo(
    IN p_id INT
)
BEGIN
    -- Al reactivar, evalúa si tiene stock para ponerlo en 1 o en 2
    UPDATE stock_demo 
    SET estatus = IF(stock > 0, 1, 2)
    WHERE id = p_id;
END $$

DELIMITER ;

DELIMITER $$
CREATE PROCEDURE sp_crear_visita_demo(
    IN p_fecha_visita DATE,
    IN p_id_tecnico INT,
    IN p_id_asesor INT,
    IN p_id_cliente INT,
    IN p_empresa_no_registrada VARCHAR(150),
    IN p_json_demos JSON -- Recibe un arreglo: [{"id_demo": 1, "cantidad": 2}]
)
BEGIN
    DECLARE v_id_visita INT;
    DECLARE i INT DEFAULT 0;
    DECLARE json_len INT;
    DECLARE v_id_demo INT;
    DECLARE v_cantidad INT;

    -- 1. Insertar la visita general (Inicia en estatus 1 = Programada)
    INSERT INTO visitas_demostracion (
        fecha_visita, 
        id_tecnico, 
        id_asesor, 
        id_cliente, 
        empresa_no_registrada, 
        resumen_actividades, 
        estatus
    ) 
    VALUES (
        p_fecha_visita, 
        p_id_tecnico, 
        p_id_asesor, 
        p_id_cliente, 
        p_empresa_no_registrada, 
        NULL, -- El resumen se llena después
        1
    );

    -- Obtener el ID de la visita recién creada
    SET v_id_visita = LAST_INSERT_ID();

    -- 2. Recorrer el JSON e insertar los detalles (Los demos)
    IF p_json_demos IS NOT NULL THEN
        SET json_len = JSON_LENGTH(p_json_demos);
        WHILE i < json_len DO
            SET v_id_demo = JSON_UNQUOTE(JSON_EXTRACT(p_json_demos, CONCAT('$[', i, '].id_demo')));
            SET v_cantidad = JSON_UNQUOTE(JSON_EXTRACT(p_json_demos, CONCAT('$[', i, '].cantidad')));

            INSERT INTO detalle_visita_demos (id_visita, id_demo, cantidad, estatus_retorno)
            VALUES (v_id_visita, v_id_demo, v_cantidad, 'En demostración');

            SET i = i + 1;
        END WHILE;
    END IF;

    -- Devolvemos el ID por si Angular lo necesita para redirigir
    SELECT v_id_visita AS id_visita, 'Visita programada exitosamente' AS mensaje;
END $$

DELIMITER ;

DELIMITER $$
CREATE PROCEDURE sp_cancelar_visita_demo(
    IN p_id_visita INT
)
BEGIN
    UPDATE visitas_demostracion 
    SET estatus = 0
    WHERE id = p_id_visita;
    
    SELECT 'Visita cancelada' AS mensaje;
END $$

DELIMITER ;

DELIMITER $$
CREATE PROCEDURE sp_buscar_visitas_demo(
    IN p_busqueda VARCHAR(150),
    IN p_estatus TINYINT,
    IN p_id_tecnico INT,
    IN p_limite INT,
    IN p_offset INT
)
BEGIN
    -- 1. Traer los registros paginados
    SELECT * FROM verVisitasDemostracion
    WHERE 
        (p_busqueda IS NULL OR p_busqueda = '' 
         OR empresa_destino LIKE CONCAT('%', p_busqueda, '%'))
        AND 
        (p_estatus IS NULL OR p_estatus = -1 OR estatus = p_estatus)
        AND 
        (p_id_tecnico IS NULL OR id_tecnico = p_id_tecnico)
    ORDER BY fecha_visita DESC, id_visita DESC
    LIMIT p_limite OFFSET p_offset;

    -- 2. Traer el conteo total para la paginación en Angular
    SELECT COUNT(*) as total
    FROM verVisitasDemostracion
    WHERE 
        (p_busqueda IS NULL OR p_busqueda = '' 
         OR empresa_destino LIKE CONCAT('%', p_busqueda, '%'))
        AND 
        (p_estatus IS NULL OR p_estatus = -1 OR estatus = p_estatus)
        AND 
        (p_id_tecnico IS NULL OR id_tecnico = p_id_tecnico);
END $$

DELIMITER ;

DELIMITER $$
CREATE PROCEDURE sp_completar_visita_demo(
    IN p_id_visita INT,
    IN p_resumen_actividades TEXT,
    IN p_json_retornos JSON -- Ej: [{"id_detalle": 1, "estatus_retorno": "Regresó a oficina"}]
)
sp_main: BEGIN
    DECLARE i INT DEFAULT 0;
    DECLARE json_len INT;
    DECLARE v_id_detalle INT;
    DECLARE v_estatus_retorno VARCHAR(50);
    
    -- Variables para manejar el inventario y el historial
    DECLARE v_id_demo INT;
    DECLARE v_cantidad INT;
    DECLARE v_id_tecnico INT;
    DECLARE v_id_cliente INT;
    DECLARE v_empresa_no_registrada VARCHAR(150);

    -- Manejador de errores para evitar que se guarden datos a medias
    DECLARE EXIT HANDLER FOR SQLEXCEPTION 
    BEGIN
        GET DIAGNOSTICS CONDITION 1 @sqlstate = RETURNED_SQLSTATE, @errno = MYSQL_ERRNO, @text = MESSAGE_TEXT;
        ROLLBACK;
        SELECT CONCAT('Error BD (', @errno, '): ', @text) AS mensaje;
    END;

    START TRANSACTION;

    -- 1. Obtenemos los datos de la visita para poder registrar el movimiento del historial
    SELECT id_tecnico, id_cliente, empresa_no_registrada 
    INTO v_id_tecnico, v_id_cliente, v_empresa_no_registrada
    FROM visitas_demostracion WHERE id = p_id_visita LIMIT 1;

    -- 2. Actualizar la visita a Completada (2) y guardar el reporte
    UPDATE visitas_demostracion 
    SET 
        resumen_actividades = p_resumen_actividades,
        estatus = 2 
    WHERE id = p_id_visita;

    -- 3. Recorrer el JSON para actualizar el destino y el inventario de cada equipo
    IF p_json_retornos IS NOT NULL THEN
        SET json_len = JSON_LENGTH(p_json_retornos);
       WHILE i < json_len DO
        
            -- Extraemos el ID, el estatus final Y LA CANTIDAD ESPECÍFICA
            SET v_id_detalle = JSON_UNQUOTE(JSON_EXTRACT(p_json_retornos, CONCAT('$[', i, '].id_detalle')));
            SET v_estatus_retorno = JSON_UNQUOTE(JSON_EXTRACT(p_json_retornos, CONCAT('$[', i, '].estatus_retorno')));
            SET v_cantidad = JSON_UNQUOTE(JSON_EXTRACT(p_json_retornos, CONCAT('$[', i, '].cantidad')));

            -- Identificamos qué demo es
            SELECT id_demo INTO v_id_demo FROM detalle_visita_demos WHERE id = v_id_detalle;

            -- Si el JSON no mandó una cantidad, asumimos que se le aplica al total de piezas de esa fila
            IF v_cantidad IS NULL OR v_cantidad = 'null' THEN
                SELECT cantidad INTO v_cantidad FROM detalle_visita_demos WHERE id = v_id_detalle;
            END IF;

            -- Actualizamos el estatus del detalle (Si hay varios, se quedará con el último leído, lo cual es aceptable para la tabla relacional)
            UPDATE detalle_visita_demos 
            SET estatus_retorno = v_estatus_retorno
            WHERE id = v_id_detalle AND id_visita = p_id_visita;

            -- =============================================================
            -- LÓGICA DE INVENTARIO USANDO LA CANTIDAD PARCIAL (v_cantidad)
            -- =============================================================
            CASE v_estatus_retorno
            
                WHEN 'Regresó a oficina' THEN
                    -- A) Regresamos SOLO la cantidad parcial al stock
                    UPDATE stock_demo 
                    SET stock = stock + v_cantidad, estatus = 1 
                    WHERE id = v_id_demo;
                    
                    -- B) Registramos el movimiento por la cantidad exacta
                    INSERT INTO movimientos (
                        id_producto, id_demo, id_asesor, id_cliente, empresa_no_registrada, 
                        tipo_movimiento, fecha, cantidad, destino
                    ) VALUES (
                        NULL, v_id_demo, v_id_tecnico, v_id_cliente, v_empresa_no_registrada, 
                        'Entrada', NOW(), v_cantidad, 'Almacen'
                    );
                    
                WHEN 'Cliente lo compró' THEN
                    -- Para que el equipo no quede bloqueado del todo si fue parcial,
                    -- solo lo marcamos inactivo SI su stock llega a 0.
                    UPDATE stock_demo SET estatus = IF(stock > 0, estatus, 0) WHERE id = v_id_demo;
                    
                WHEN 'Dañado / En reparación' THEN
                    -- Misma lógica, no bloqueamos todo el modelo si aún hay stock sano
                    UPDATE stock_demo SET estatus = IF(stock > 0, estatus, 0) WHERE id = v_id_demo;
                    
                WHEN 'Se quedó a prueba' THEN
                    -- Se mantiene en estatus 2
                    UPDATE stock_demo SET estatus = 2 WHERE id = v_id_demo;
                    
                ELSE
                    BEGIN END; 
            END CASE;

            SET i = i + 1;
        END WHILE;
    END IF;
    
    COMMIT;
    
    SELECT 'Éxito: Visita completada, inventarios y movimientos actualizados correctamente' AS mensaje;
    
END $$

DELIMITER ;

DELIMITER $$
CREATE PROCEDURE sp_crear_solicitud_vale_demo(
    IN p_id_asesor INT,
    IN p_id_cliente INT,           
    IN p_empresa_no_registrada VARCHAR(150), -- <-- NUEVO PARÁMETRO
    IN p_id_visita INT,            
    IN p_demos_json JSON           
)
BEGIN
    DECLARE v_id_vale INT;
    DECLARE v_anio_actual INT;
    DECLARE v_nuevo_consecutivo INT;
    DECLARE v_folio_visual VARCHAR(20);
    
    DECLARE EXIT HANDLER FOR SQLEXCEPTION 
    BEGIN
        ROLLBACK;
        SELECT 'Error: No se pudo crear la solicitud del vale para demostración' AS mensaje;
    END;

    START TRANSACTION;
    
    SET v_anio_actual = YEAR(NOW());
    
    SELECT COALESCE(MAX(consecutivo_anual), 0) + 1 
    INTO v_nuevo_consecutivo 
    FROM vales_salida 
    WHERE YEAR(fecha) = v_anio_actual;

    -- Insertamos guardando el ID del cliente (si existe) o el nombre en texto
    INSERT INTO vales_salida (
        consecutivo_anual, id_asesor, id_cliente, empresa_no_registrada, id_pedido, id_visita, tipo_vale, fecha, alerta_enviada, estatus
    )
    VALUES (
        v_nuevo_consecutivo, p_id_asesor, p_id_cliente, p_empresa_no_registrada, NULL, p_id_visita, 'Demostracion', NOW(), 0, 0
    );
    
    SET v_id_vale = LAST_INSERT_ID();

    SET v_folio_visual = CONCAT('S-', v_anio_actual, '-', IF(v_nuevo_consecutivo < 10000, LPAD(v_nuevo_consecutivo, 4, '0'), v_nuevo_consecutivo));

    INSERT INTO detalles_vale (id_vale, id_producto, id_demo, piezas)
    SELECT v_id_vale, NULL, id_demo, piezas
    FROM JSON_TABLE(
        p_demos_json,
        '$[*]' COLUMNS (
            id_demo INT PATH '$.id_demo',
            piezas INT PATH '$.piezas'
        )
    ) AS tabla_json;
    
    INSERT INTO notificaciones (fecha, tipo_notificacion, id_asesor, mensaje, leida)
    SELECT 
        NOW(), 
        'Nueva Solicitud Demo', 
        id, 
        CONCAT('Soporte Técnico ha solicitado el Vale ', v_folio_visual, ' para una Demostración. Requiere autorización.'), 
        0
    FROM asesores 
    WHERE Rol IN ('Administrador', 'Almacen');
    
    COMMIT;
    
    SELECT 'Éxito: Solicitud de demostración creada correctamente' AS mensaje, v_id_vale AS id_nuevo_vale, v_folio_visual AS folio_generado;

END $$

DELIMITER ;

DELIMITER $$
CREATE PROCEDURE sp_autorizar_vale_demo(
    IN p_id_vale INT,
    IN p_comentario VARCHAR(255)
)
sp_main: BEGIN
    DECLARE v_done INT DEFAULT FALSE;
    DECLARE v_id_demo INT;
    DECLARE v_piezas INT;
    DECLARE v_id_asesor INT;
    DECLARE v_id_cliente INT;
    DECLARE v_empresa_no_registrada VARCHAR(150); 
    DECLARE v_estatus_actual INT;
    DECLARE v_stock_actual INT; 
    DECLARE v_nombre_demo VARCHAR(150); 
    
    DECLARE cur_detalles CURSOR FOR 
        SELECT id_demo, piezas FROM detalles_vale WHERE id_vale = p_id_vale;
        
    DECLARE CONTINUE HANDLER FOR NOT FOUND SET v_done = TRUE;

    -- MANEJADOR DE ERRORES MEJORADO
    DECLARE EXIT HANDLER FOR SQLEXCEPTION 
    BEGIN
        -- Esto capturará el error real de MySQL si algo falla
        GET DIAGNOSTICS CONDITION 1 @sqlstate = RETURNED_SQLSTATE, @errno = MYSQL_ERRNO, @text = MESSAGE_TEXT;
        ROLLBACK;
        SELECT CONCAT('Error BD (', @errno, '): ', @text) AS mensaje;
    END;

    START TRANSACTION;
    
    -- Consultamos estatus, asesor, cliente Y el nombre de la empresa sin registro
    SELECT Estatus, id_asesor, id_cliente, empresa_no_registrada 
    INTO v_estatus_actual, v_id_asesor, v_id_cliente, v_empresa_no_registrada 
    FROM vales_salida WHERE id = p_id_vale LIMIT 1;
    
    IF v_estatus_actual = 0 THEN 

        UPDATE vales_salida 
        SET estatus = 1, comentario = p_comentario
        WHERE id = p_id_vale;

        OPEN cur_detalles;
        read_loop: LOOP
            FETCH cur_detalles INTO v_id_demo, v_piezas;
            
            IF v_done THEN
                LEAVE read_loop;
            END IF;

            -- Validamos si el producto demo existe
            IF v_id_demo IS NOT NULL THEN
            
                -- 1. Consultamos el stock actual del equipo demo
                SELECT IFNULL(stock, 0), nombre_modelo INTO v_stock_actual, v_nombre_demo 
                FROM stock_demo WHERE id = v_id_demo FOR UPDATE;

                -- 2. Validamos que haya stock suficiente para prestar
                IF v_piezas > v_stock_actual THEN
                    ROLLBACK; 
                    CLOSE cur_detalles; 
                    SELECT CONCAT('Error: Stock insuficiente. El equipo demo "', v_nombre_demo, '" solo tiene ', v_stock_actual, ' piezas disponibles.') AS mensaje;
                    LEAVE sp_main; 
                END IF;
                
                -- 3. Registramos el movimiento INCLUYENDO empresa_no_registrada
                INSERT INTO movimientos (
                    id_producto, id_demo, id_asesor, id_cliente, empresa_no_registrada, 
                    tipo_movimiento, fecha, cantidad, destino
                )
                VALUES (
                    NULL, v_id_demo, v_id_asesor, v_id_cliente, v_empresa_no_registrada, 
                    'Salida', NOW(), v_piezas, 'Demostracion'
                );

                -- 4. Descontamos el stock y ajustamos el estatus
                UPDATE stock_demo 
                SET 
                    stock = stock - v_piezas,
                    estatus = IF((stock - v_piezas) > 0, 1, 2)
                WHERE id = v_id_demo;
                
            END IF;

        END LOOP;
        CLOSE cur_detalles;
        
        -- CORRECCIÓN: Se cambió el 0 por v_id_asesor
        INSERT INTO notificaciones (fecha, tipo_notificacion, id_asesor, mensaje, leida)
        VALUES (NOW(), 'Vale Aceptado', v_id_asesor, 'Tu vale de salida para demostración ha sido autorizado y los equipos descontados.', 0);
        
        COMMIT;
        
        SELECT 'Éxito: Vale de demostración autorizado, equipos descontados e historial actualizado' AS mensaje;

    ELSE
        ROLLBACK;
        SELECT 'Error: Este vale ya fue procesado anteriormente' AS mensaje;
        
    END IF;

END $$

DELIMITER ;

DELIMITER $$
CREATE PROCEDURE sp_buscar_demos(
    IN p_busqueda VARCHAR(100),
    IN p_estatus TINYINT,
    IN p_marca INT,
    IN p_limite INT,
    IN p_offset INT
)
BEGIN
    -- 1er SELECT: Trae los registros para la tabla (con Límite y Offset)
    SELECT * FROM verStockDemos
    WHERE 
        (p_busqueda IS NULL OR p_busqueda = '' 
         OR nombre_modelo LIKE CONCAT('%', p_busqueda, '%') 
         OR numero_serie LIKE CONCAT('%', p_busqueda, '%'))
        AND 
        (p_estatus IS NULL OR p_estatus = -1 OR estatus = p_estatus)
        AND 
        (p_marca IS NULL OR p_marca = 0 OR id_marca = p_marca)
    ORDER BY id_demo DESC
    LIMIT p_limite OFFSET p_offset;

    -- 2do SELECT: Trae el total real de filas encontradas (Sin límite)
    SELECT COUNT(*) as total
    FROM verStockDemos
    WHERE 
        (p_busqueda IS NULL OR p_busqueda = '' 
         OR nombre_modelo LIKE CONCAT('%', p_busqueda, '%') 
         OR numero_serie LIKE CONCAT('%', p_busqueda, '%'))
        AND 
        (p_estatus IS NULL OR p_estatus = -1 OR estatus = p_estatus)
        AND 
        (p_marca IS NULL OR p_marca = 0 OR id_marca = p_marca);
END $$

DELIMITER ;

DELIMITER $$
CREATE PROCEDURE sp_buscar_demo_para_visita(
    IN p_busqueda VARCHAR(300),
    IN p_id_marca INT -- Opcional, por si en el futuro quieres filtrar el buscador por marca
)
BEGIN
    SELECT 
        sd.id AS id_demo, 
        sd.nombre_modelo, 
        sd.descripcion, 
        sd.numero_serie, 
        sd.stock, 
        sd.estatus,
        sd.id_marca,
        mp.Nombre AS nombre_marca -- <-- AQUÍ EXTRAEMOS EL NOMBRE DE LA MARCA
    FROM stock_demo sd
    -- Agregamos la unión con la tabla de marcas
    LEFT JOIN marca_proveedor mp ON sd.id_marca = mp.id
    WHERE (
           sd.nombre_modelo LIKE CONCAT('%', p_busqueda, '%') 
        OR sd.numero_serie LIKE CONCAT('%', p_busqueda, '%')
        OR sd.descripcion LIKE CONCAT('%', p_busqueda, '%')
    )
      -- Solo traemos Demos Activos (1) o En Demostración (2)
      AND sd.estatus IN (1, 2) 
      AND (p_id_marca IS NULL OR sd.id_marca = p_id_marca) 

    ORDER BY 
        CASE 
            -- 1. Coincidencia exacta (Prioridad máxima)
            WHEN sd.nombre_modelo = p_busqueda OR sd.numero_serie = p_busqueda THEN 1
            -- 2. Empieza exactamente con lo que el usuario escribe
            WHEN sd.nombre_modelo LIKE CONCAT(p_busqueda, '%') THEN 2
            WHEN sd.numero_serie LIKE CONCAT(p_busqueda, '%') THEN 3
            WHEN sd.descripcion LIKE CONCAT(p_busqueda, '%') THEN 4
            -- 3. La palabra está dentro del texto, después de un espacio
            WHEN sd.nombre_modelo LIKE CONCAT('% ', p_busqueda, '%') OR sd.descripcion LIKE CONCAT('% ', p_busqueda, '%') THEN 5 
            -- 4. Cualquier otra coincidencia parcial
            ELSE 6 
        END ASC,
        LENGTH(sd.nombre_modelo) ASC, 
        sd.nombre_modelo ASC

    LIMIT 15;
END $$

DELIMITER ;

DELIMITER $$
CREATE PROCEDURE sp_pedidos_disponibles_para_vale(
    IN p_id_asesor INT,
    IN p_rol VARCHAR(50)
)
BEGIN
    SELECT 
        p.id,
        p.id_cliente,
        c.Nombre AS nombre_cliente,
        p.orden_compra,
        p.fecha,
        p.id_cotizacion
    FROM pedidos p
    INNER JOIN clientes c ON c.id = p.id_cliente
    WHERE (p.id_asesor = p_id_asesor OR p_rol = 'Administrador' OR p_rol = 'Almacen')
      AND p.Estatus = 2  -- (Asumiendo que 2 es el estatus de pedido listo/aprobado)
      
      -- EL FILTRO QUE EVITA DUPLICADOS
      AND NOT EXISTS (
          SELECT 1 FROM vales_salida v 
          WHERE v.id_pedido = p.id 
            AND v.estatus IN (0, 1) -- Bloquea si hay vale Pendiente(0) o Aceptado(1)
      )
    ORDER BY p.fecha DESC;
END $$


DELIMITER $$

CREATE PROCEDURE sp_visitas_disponibles_para_vale(
    IN p_id_tecnico INT
)
BEGIN
    SELECT 
        v.id AS id_visita,
        v.fecha_visita,
        v.id_cliente,
        v.empresa_no_registrada,
        COALESCE(c.Nombre, v.empresa_no_registrada) AS empresa_destino
    FROM visitas_demostracion v
    LEFT JOIN clientes c ON v.id_cliente = c.id
    WHERE v.id_tecnico = p_id_tecnico
      AND v.estatus = 1 -- 1 = Visita Programada/Activa
      
      -- EL FILTRO QUE EVITA DUPLICADOS
      AND NOT EXISTS (
          SELECT 1 FROM vales_salida vs 
          WHERE vs.id_visita = v.id 
            AND vs.estatus IN (0, 1)
      )
    ORDER BY v.fecha_visita ASC;
END $$

DELIMITER ;

DELIMITER $$
CREATE PROCEDURE sp_registrar_entrada_demo(
    IN p_codigo VARCHAR(150),
    IN p_cantidad INT,
    IN p_id_asesor INT
)
BEGIN
    DECLARE v_id_demo INT;
    DECLARE v_estatus_actual TINYINT;
    
    -- Manejador de errores para revertir cambios si algo falla
    DECLARE EXIT HANDLER FOR SQLEXCEPTION 
    BEGIN
        ROLLBACK;
        SELECT 'Error: No se pudo registrar el movimiento del equipo demo' AS mensaje;
    END;

    -- Buscar el equipo demo por número de serie o nombre de modelo
    SELECT id, estatus 
    INTO v_id_demo, v_estatus_actual
    FROM stock_demo
    WHERE numero_serie = p_codigo OR nombre_modelo = p_codigo
    LIMIT 1;

    IF v_id_demo IS NOT NULL THEN
        START TRANSACTION;
    
        -- 1. Registrar el movimiento en el historial
        -- Se deja id_producto en NULL y se asigna el v_id_demo. El destino siempre es 'Almacen'.
        INSERT INTO movimientos (
            id_producto, id_demo, id_asesor, 
            tipo_movimiento, fecha, cantidad, destino
        )
        VALUES (
            NULL, v_id_demo, p_id_asesor, 
            'Entrada', NOW(), p_cantidad, 'Almacen'
        );
        
        -- 2. Sumar el stock y actualizar el estatus
        -- Si llega stock nuevo a la oficina, el estatus pasa a 1 (Disponible/Activo)
        UPDATE stock_demo 
        SET 
            stock = IFNULL(stock, 0) + p_cantidad,
            estatus = 1
        WHERE id = v_id_demo;
        
        COMMIT;
        SELECT 'Éxito: Entrada de demo registrada y existencias actualizadas' AS mensaje;
    ELSE
        SELECT 'Error: No se encontró ningún equipo demo con ese número de serie o modelo' AS mensaje;
    END IF;

END $$

DELIMITER ;

DELIMITER $$
CREATE PROCEDURE sp_buscar_proyectos_soporte(
    IN p_busqueda VARCHAR(150),
    IN p_estatus TINYINT,
    IN p_id_tecnico INT,
    IN p_rol VARCHAR(50),
    IN p_limite INT,
    IN p_offset INT
)
BEGIN
    -- 1. Traer los registros paginados
    SELECT * FROM verProyectosSoporte
    WHERE 
        (p_busqueda IS NULL OR p_busqueda = '' 
         OR nombre_proyecto LIKE CONCAT('%', p_busqueda, '%')
         OR empresa_destino LIKE CONCAT('%', p_busqueda, '%'))
        AND 
        (p_estatus IS NULL OR p_estatus = -1 OR estatus = p_estatus)
        AND 
        (p_rol = 'Administrador' OR id_tecnico = p_id_tecnico)
    ORDER BY fecha_alta DESC
    LIMIT p_limite OFFSET p_offset;

    -- 2. Traer el conteo total para la paginación en Angular
    SELECT COUNT(*) AS total FROM verProyectosSoporte
    WHERE 
        (p_busqueda IS NULL OR p_busqueda = '' 
         OR nombre_proyecto LIKE CONCAT('%', p_busqueda, '%')
         OR empresa_destino LIKE CONCAT('%', p_busqueda, '%'))
        AND 
        (p_estatus IS NULL OR p_estatus = -1 OR estatus = p_estatus)
        AND 
        (p_rol = 'Administrador' OR id_tecnico = p_id_tecnico);
END $$

DELIMITER ;


DELIMITER $$
CREATE PROCEDURE sp_registrar_avance_proyecto(
    IN p_id_proyecto INT,
    IN p_comentarios TEXT,
    IN p_nuevo_estatus TINYINT,
    IN p_se_cotizo TINYINT,
    IN p_id_usuario INT,
    IN p_tipo_evento VARCHAR(30)
)
BEGIN
    DECLARE v_estatus_anterior TINYINT;
    DECLARE v_se_cotizo_actual TINYINT;
    DECLARE v_se_cotizo_final TINYINT;
 
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        SELECT 'Error: No se pudo registrar el avance' AS mensaje;
    END;
 
    START TRANSACTION;
 
    -- Estado actual del proyecto ANTES de aplicar el cambio
    SELECT estatus, se_cotizo
        INTO v_estatus_anterior, v_se_cotizo_actual
        FROM proyectos_soporte
        WHERE id = p_id_proyecto
        FOR UPDATE;
 
    -- se_cotizo nunca retrocede de 1 a 0
    SET v_se_cotizo_final = GREATEST(IFNULL(v_se_cotizo_actual, 0), IFNULL(p_se_cotizo, 0));
 
    INSERT INTO bitacora_avances
        (id_proyecto, fecha_registro, estatus_anterior, estatus_nuevo, id_usuario, tipo_evento, comentarios)
    VALUES
        (p_id_proyecto, NOW(), v_estatus_anterior, p_nuevo_estatus, p_id_usuario, p_tipo_evento, p_comentarios);
 
    IF p_nuevo_estatus IS NOT NULL THEN
        IF p_nuevo_estatus = 6 THEN
            UPDATE proyectos_soporte
                SET estatus = p_nuevo_estatus, se_cotizo = v_se_cotizo_final, fecha_termino = NOW()
                WHERE id = p_id_proyecto;
        ELSE
            UPDATE proyectos_soporte
                SET estatus = p_nuevo_estatus, se_cotizo = v_se_cotizo_final
                WHERE id = p_id_proyecto;
        END IF;
    END IF;
 
    COMMIT;
    SELECT 'Avance registrado correctamente' AS mensaje;
END $$
DELIMITER ;


DELIMITER $$

CREATE PROCEDURE sp_contar_proyectos_mes(
    IN p_id_tecnico INT,
    IN p_rol VARCHAR(50)
)
BEGIN
    SELECT COUNT(*) AS total_mes
    FROM proyectos_soporte
    WHERE MONTH(fecha_alta) = MONTH(CURRENT_DATE())
      AND YEAR(fecha_alta) = YEAR(CURRENT_DATE())
      AND (p_rol = 'Administrador' OR id_tecnico = p_id_tecnico)
      -- Opcional: Si solo quieres contar los que no estén cancelados, descomenta la siguiente línea:
      -- AND estatus != 0
      ;
END $$

DELIMITER ;

DELIMITER $$
CREATE PROCEDURE sp_modificar_proyecto_soporte(
    IN p_id_proyecto INT,
    IN p_nombre_proyecto VARCHAR(150),
    IN p_descripcion TEXT,
    IN p_id_tecnico INT, 
    IN p_id_cliente INT,
    IN p_empresa_no_registrada VARCHAR(150),
    IN p_json_materiales JSON
)
BEGIN
    DECLARE i INT DEFAULT 0;
    DECLARE json_len INT;
    
    -- ¡EL CAMBIO CLAVE! Lo declaramos como VARCHAR para que no choque con la palabra "null"
    DECLARE v_id_producto VARCHAR(50); 
    DECLARE v_cantidad INT;
    DECLARE v_nombre_modelo VARCHAR(150);
    DECLARE v_marca VARCHAR(100);
    DECLARE v_codigo VARCHAR(200);

    DECLARE EXIT HANDLER FOR SQLEXCEPTION 
    BEGIN
        ROLLBACK;
        SELECT 'Error: No se pudo modificar el proyecto' AS mensaje;
    END;

    START TRANSACTION;

    UPDATE proyectos_soporte 
    SET nombre_proyecto = p_nombre_proyecto,
        descripcion = p_descripcion,
        id_tecnico = p_id_tecnico, 
        id_cliente = p_id_cliente,
        empresa_no_registrada = p_empresa_no_registrada
    WHERE id = p_id_proyecto;

    IF p_json_materiales IS NOT NULL THEN
        DELETE FROM materiales_proyecto WHERE id_proyecto = p_id_proyecto;
        
        SET json_len = JSON_LENGTH(p_json_materiales);
        
        WHILE i < json_len DO
            SET v_id_producto = JSON_UNQUOTE(JSON_EXTRACT(p_json_materiales, CONCAT('$[', i, '].id_producto')));
            SET v_cantidad = JSON_UNQUOTE(JSON_EXTRACT(p_json_materiales, CONCAT('$[', i, '].cantidad')));
            SET v_nombre_modelo = JSON_UNQUOTE(JSON_EXTRACT(p_json_materiales, CONCAT('$[', i, '].nombre_modelo')));
            SET v_marca = JSON_UNQUOTE(JSON_EXTRACT(p_json_materiales, CONCAT('$[', i, '].marca')));
            SET v_codigo = JSON_UNQUOTE(JSON_EXTRACT(p_json_materiales, CONCAT('$[', i, '].codigo'))); 

            -- Aquí convertimos el texto "null" en un nulo real de base de datos
            IF v_id_producto = 'null' OR v_id_producto = '' THEN SET v_id_producto = NULL; END IF;

            IF v_cantidad > 0 AND (v_id_producto IS NOT NULL OR v_nombre_modelo IS NOT NULL) THEN
                INSERT INTO materiales_proyecto (id_proyecto, id_producto, nombre_modelo, marca, codigo, cantidad)
                VALUES (p_id_proyecto, v_id_producto, v_nombre_modelo, v_marca, v_codigo, v_cantidad);
            END IF;

            SET i = i + 1;
        END WHILE;
    END IF;

    COMMIT;
    SELECT 'Proyecto modificado exitosamente' AS mensaje;
END $$

DELIMITER ;
DELIMITER $$
CREATE PROCEDURE sp_alta_proyecto_soporte(
    IN p_nombre_proyecto VARCHAR(150),
    IN p_descripcion TEXT,
    IN p_id_tecnico INT,
    IN p_id_cliente INT,
    IN p_empresa_no_registrada VARCHAR(150),
    IN p_json_materiales JSON 
)
BEGIN
    DECLARE v_id_proyecto INT;
    DECLARE i INT DEFAULT 0;
    DECLARE json_len INT;
    
    -- ¡EL CAMBIO CLAVE!
    DECLARE v_id_producto VARCHAR(50); 
    DECLARE v_cantidad INT;
    DECLARE v_nombre_modelo VARCHAR(150);
    DECLARE v_marca VARCHAR(100);
    DECLARE v_codigo VARCHAR(200);

    DECLARE EXIT HANDLER FOR SQLEXCEPTION 
    BEGIN
        ROLLBACK;
        SELECT 'Error: No se pudo registrar el proyecto' AS mensaje;
    END;

    START TRANSACTION;

    INSERT INTO proyectos_soporte (
        nombre_proyecto, descripcion, id_tecnico, id_cliente, 
        empresa_no_registrada, fecha_alta, estatus
    ) VALUES (
        p_nombre_proyecto, p_descripcion, p_id_tecnico, p_id_cliente, 
        p_empresa_no_registrada, NOW(), 1
    );

    SET v_id_proyecto = LAST_INSERT_ID();

    IF p_json_materiales IS NOT NULL THEN
        SET json_len = JSON_LENGTH(p_json_materiales);
        
        WHILE i < json_len DO
            SET v_id_producto = JSON_UNQUOTE(JSON_EXTRACT(p_json_materiales, CONCAT('$[', i, '].id_producto')));
            SET v_cantidad = JSON_UNQUOTE(JSON_EXTRACT(p_json_materiales, CONCAT('$[', i, '].cantidad')));
            SET v_nombre_modelo = JSON_UNQUOTE(JSON_EXTRACT(p_json_materiales, CONCAT('$[', i, '].nombre_modelo')));
            SET v_marca = JSON_UNQUOTE(JSON_EXTRACT(p_json_materiales, CONCAT('$[', i, '].marca')));
            SET v_codigo = JSON_UNQUOTE(JSON_EXTRACT(p_json_materiales, CONCAT('$[', i, '].codigo')));

            IF v_id_producto = 'null' OR v_id_producto = '' THEN SET v_id_producto = NULL; END IF;

            IF v_cantidad > 0 AND (v_id_producto IS NOT NULL OR v_nombre_modelo IS NOT NULL) THEN
                INSERT INTO materiales_proyecto (id_proyecto, id_producto, nombre_modelo, marca, codigo, cantidad)
                VALUES (v_id_proyecto, v_id_producto, v_nombre_modelo, v_marca, v_codigo, v_cantidad);
            END IF;

            SET i = i + 1;
        END WHILE;
    END IF;

    COMMIT;
    SELECT 'Proyecto registrado exitosamente' AS mensaje;
END $$
DELIMITER ;

DELIMITER $$
CREATE PROCEDURE sp_finalizar_proyecto_soporte(
    IN p_id_proyecto INT
)
BEGIN
    DECLARE v_estatus_anterior TINYINT;
 
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        SELECT 'Error: No se pudo finalizar el proyecto' AS mensaje;
    END;
 
    START TRANSACTION;
 
    SELECT estatus INTO v_estatus_anterior
        FROM proyectos_soporte
        WHERE id = p_id_proyecto
        FOR UPDATE;
 
    UPDATE proyectos_soporte
        SET estatus = 0, fecha_termino = NOW()
        WHERE id = p_id_proyecto;
 
    INSERT INTO bitacora_avances
        (id_proyecto, fecha_registro, estatus_anterior, estatus_nuevo, id_usuario, tipo_evento, comentarios)
    VALUES
        (p_id_proyecto, NOW(), v_estatus_anterior, 0, NULL, 'sistema',
         'El proyecto fue finalizado/cancelado manualmente desde los detalles del proyecto.');
 
    COMMIT;
    SELECT 'Proyecto finalizado exitosamente' AS mensaje;
END $$
DELIMITER ;

DELIMITER $$

CREATE PROCEDURE sp_asignar_credito_cliente(
    IN p_id_cliente INT,
    IN p_tiene_credito TINYINT(1),
    IN p_limite_credito DECIMAL(12,2),
    OUT p_mensaje VARCHAR(255)
)
sp_main: BEGIN
    DECLARE v_existe INT;
    DECLARE v_limite_final DECIMAL(12,2);

    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        SET p_mensaje = 'Error interno: no se pudo actualizar la línea de crédito.';
    END;

    -- 1. VALIDAR QUE EL CLIENTE EXISTA
    SELECT COUNT(*) INTO v_existe FROM clientes WHERE id = p_id_cliente;

    IF v_existe = 0 THEN
        SET p_mensaje = 'Error: El cliente especificado no existe.';
        LEAVE sp_main;
    END IF;

    -- 2. VALIDACIONES DE NEGOCIO
    IF p_tiene_credito IS NULL THEN
        SET p_mensaje = 'Error: Debe indicar si el cliente tiene crédito autorizado (tiene_credito).';
        LEAVE sp_main;
    END IF;

    IF p_tiene_credito NOT IN (0, 1) THEN
        SET p_mensaje = 'Error: El valor de tiene_credito debe ser 0 o 1.';
        LEAVE sp_main;
    END IF;

    IF p_tiene_credito = 1 AND (p_limite_credito IS NULL OR p_limite_credito <= 0) THEN
        SET p_mensaje = 'Error: Debe capturar un límite de crédito mayor a $0 para autorizar crédito.';
        LEAVE sp_main;
    END IF;

    IF p_limite_credito IS NOT NULL AND p_limite_credito < 0 THEN
        SET p_mensaje = 'Error: El límite de crédito no puede ser negativo.';
        LEAVE sp_main;
    END IF;

    -- 3. SI SE DESACTIVA EL CRÉDITO, EL LÍMITE/SALDO SE FUERZA A 0
    -- (evita dejar un saldo "fantasma" disponible en un cliente sin crédito autorizado)
    IF p_tiene_credito = 0 THEN
        SET v_limite_final = 0;
    ELSE
        SET v_limite_final = p_limite_credito;
    END IF;

    -- 4. ACTUALIZAR
    START TRANSACTION;

    UPDATE clientes
    SET tiene_credito = p_tiene_credito,
        limite_credito = v_limite_final
    WHERE id = p_id_cliente;

    COMMIT;

    -- 5. MENSAJE FINAL
    IF p_tiene_credito = 1 THEN
        SET p_mensaje = CONCAT('Línea de crédito autorizada correctamente. Límite: $', v_limite_final);
    ELSE
        SET p_mensaje = 'Línea de crédito desactivada para el cliente.';
    END IF;

END $$
DELIMITER ;
 