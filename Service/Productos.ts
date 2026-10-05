import pool from '../Config/db';
import { Productos } from '../Model/Productos'

export class ProductoService {
static async agregarProducto(p: Productos) {
    const {
        Nombre,
        Descripcion,
        ExtraDescripcion,
        Precio,
        Codigo_numeral,
        Codigo_japon,
        id_estanteria,
        id_caja,
        Stock,
        Apartado,
        id_marca
    } = p;

    try {
        const [rows]: any = await pool.query(
            'CALL sp_agregar_producto(?,?,?,?,?,?,?,?,?,?,?)',
            [
                Nombre,
                Descripcion,
                ExtraDescripcion || null,
                Precio,
                Codigo_numeral,
                Codigo_japon,
                id_estanteria,
                id_caja,
                Stock || 0,
                Apartado || 0,
                id_marca
            ]
        );

        return rows;

    } catch (error: any) {

        if (
            error.sqlMessage &&
            error.sqlMessage.includes('Error:')
        ) {
            throw new Error(error.sqlMessage);
        }

        throw new Error(
            'Error al registrar el producto en la base de datos.'
        );
    }
}
   static async modificarProducto(
    id: number,
    p: Productos
) {
    const {
        Nombre,
        Descripcion,
        ExtraDescripcion,
        Precio,
        Codigo_numeral,
        Codigo_japon,
        id_estanteria,
        id_caja,
        Stock,
        Apartado,
        id_marca
    } = p;

    try {
        const [rows]: any = await pool.query(
            'CALL sp_modificar_producto(?,?,?,?,?,?,?,?,?,?,?,?)',
            [
                id,
                Nombre,
                Descripcion,
                ExtraDescripcion || null,
                Precio,
                Codigo_numeral,
                Codigo_japon,
                id_estanteria,
                id_caja,
                Stock || 0,
                Apartado || 0,
                id_marca
            ]
        );

        return rows;

    } catch (error: any) {

        if (
            error.sqlMessage &&
            error.sqlMessage.includes('Error:')
        ) {
            throw new Error(error.sqlMessage);
        }

        throw new Error(
            'Error al modificar el producto en la base de datos.'
        );
    }
}
    static async obtenerProductos(pagina: number = 1, limite: number = 6) {
        const offset = (pagina - 1) * limite;

        const queryDatos = 'select * from verProductos limit ? offset ?';
        const [rows]: any = await pool.query(queryDatos, [limite, offset]);
        const [totalRows]: any = await pool.query('SELECT COUNT(*) as total FROM verProductos');
        const total = totalRows[0].total;
        return {
            productos: rows,
            total: total,
            paginas: Math.ceil(total / limite),
            paginaActual: pagina
        }
    }
static async obtenerProductoPorId(id: number) {
    const [rows]: any = await pool.query('SELECT * FROM verProductos WHERE id = ?', [id]);
    if (!rows || rows.length === 0) return null;

    const producto = rows[0];

    const [reservasRows]: any = await pool.query(`
        SELECT 
            IFNULL(SUM(CASE WHEN id_pedido IS NOT NULL THEN cantidad_reservada ELSE 0 END), 0) AS asignado,
            IFNULL(SUM(CASE WHEN id_pedido IS NULL THEN cantidad_reservada ELSE 0 END), 0) AS no_asignado
        FROM reservas_stock
        WHERE id_producto = ? AND estatus = 'activa'
    `, [id]);

    const asignado = Number(reservasRows[0].asignado) || 0;
    const noAsignado = Number(reservasRows[0].no_asignado) || 0;
    const totalApartado = asignado + noAsignado;

    return { 
        ...producto, 
        Apartado: totalApartado, 
        ApartadoComprometido: asignado, 
        ApartadoLibre: noAsignado 
    };
}
 
    static async eliminarProducto(id: number) {
        const [rows]: any = await pool.query('call sp_eliminar_producto(?)', [id]);
        return rows;
    }
    static async buscaryfiltrarProducto(busqueda: string | null, estatus: number | null, marca: number | null,
        pagina: number = 1, limite: number = 7) {
        const offset = (pagina - 1) * limite;
        const [rows]: any = await pool.query('CALL sp_buscar_productos(?, ?, ?, ?, ?)', [
            busqueda,
            estatus,
            marca,
            limite,
            offset
        ]);
        const productos = rows[0];
        const total = rows[1][0].total;
        return {
            productos: productos,
            total: total,
            paginas: Math.ceil(total / limite),
            paginaActual: pagina
        };
    }
    static async activarProducto(id: number) {
        const [rows]: any = await pool.query('call sp_activar_producto(?)', [id]);
        return rows;
    }
    static async countProductosStock() {
        const [rows]: any = await pool.query('SELECT COUNT(*) AS total_stock FROM verProductos WHERE Estatus = 1;');
        return rows[0];
    }
  
    static async buscarProductoPorCodigo(termino: string) {
    const [rows]: any = await pool.query('CALL sp_buscar_producto_por_codigo(?)', [termino]);
    return rows[0];
    }
   static async registrarEntradaProducto(
    codigo: string,
    cantidad: number,
    destino: string,
    id_asesor: number,
    requestId: string
) {
    const [rows]: any = await pool.query(
        'CALL sp_registrar_entrada_producto(?, ?, ?, ?, ?)',
        [
            codigo,
            cantidad,
            destino,
            id_asesor,
            requestId
        ]
    );

    return rows;
}
    static async obtenerEstanterias() {
    const [rows]: any = await pool.query(`
        SELECT
            id,
            codigo,
            descripcion
        FROM estanterias
        WHERE estatus = 1
        ORDER BY CAST(codigo AS UNSIGNED), codigo
    `);

    return rows;
}

static async obtenerCajas() {
    const [rows]: any = await pool.query(`
        SELECT
            id,
            codigo,
            descripcion
        FROM cajas
        WHERE estatus = 1
        ORDER BY codigo
    `);

    return rows;
}
static async agregarEstanteria(
    codigo: string,
    descripcion: string | null
): Promise<string> {

    const connection = await pool.getConnection();

    try {
        await connection.query(
            'CALL sp_agregar_estanteria(?, ?, @p_mensaje)',
            [
                codigo.trim(),
                descripcion?.trim() || null
            ]
        );

        const [rows]: any = await connection.query(
            'SELECT @p_mensaje AS mensaje'
        );

        return rows[0]?.mensaje;

    } finally {
        connection.release();
    }
}

static async desactivarEstanteria(
    idEstanteria: number
): Promise<string> {

    const connection = await pool.getConnection();

    try {
        await connection.query(
            'CALL sp_desactivar_estanteria(?, @p_mensaje)',
            [idEstanteria]
        );

        const [rows]: any = await connection.query(
            'SELECT @p_mensaje AS mensaje'
        );

        return rows[0]?.mensaje;

    } finally {
        connection.release();
    }
}

static async agregarCaja(
    codigo: string,
    descripcion: string | null
): Promise<string> {

    const connection = await pool.getConnection();

    try {
        await connection.query(
            'CALL sp_agregar_caja(?, ?, @p_mensaje)',
            [
                codigo.trim().toUpperCase(),
                descripcion?.trim() || null
            ]
        );

        const [rows]: any = await connection.query(
            'SELECT @p_mensaje AS mensaje'
        );

        return rows[0]?.mensaje;

    } finally {
        connection.release();
    }
}

static async desactivarCaja(
    idCaja: number
): Promise<string> {

    const connection = await pool.getConnection();

    try {
        await connection.query(
            'CALL sp_desactivar_caja(?, @p_mensaje)',
            [idCaja]
        );

        const [rows]: any = await connection.query(
            'SELECT @p_mensaje AS mensaje'
        );

        return rows[0]?.mensaje;

    } finally {
        connection.release();
    }
}
static async consultarUbicaciones(
    tipo: string,
    estatus: string,
    pagina: number,
    limite: number
) {
    try {
        const [rows]: any = await pool.query(
            'CALL sp_consultar_ubicaciones(?, ?, ?, ?)',
            [
                tipo,
                estatus,
                pagina,
                limite
            ]
        );

        const ubicaciones = rows[0] || [];
        const paginacion = rows[1]?.[0] || {
            total: 0,
            pagina,
            limite,
            total_paginas: 0
        };

        return {
            ubicaciones,
            paginacion
        };

    } catch (error: any) {

        if (
            error.sqlMessage &&
            error.sqlMessage.includes('Error:')
        ) {
            throw new Error(error.sqlMessage);
        }

        throw new Error(
            'Error al consultar las ubicaciones.'
        );
    }
}
}