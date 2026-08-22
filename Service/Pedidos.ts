import pool from '../Config/db';
import { Pedido, DetallePedido, PedidoResponse } from '../Model/pedidos';

export class PedidoService {

static async buscarYFiltrar(
    busqueda: string, 
    estatus: number = -1, 
    fechaInicio: string | null, 
    fechaFin: string | null, 
    idAsesor: number | null,    
    pagina: number = 1, 
    limite: number = 10
): Promise<PedidoResponse> {
    
    const offset = (pagina - 1) * limite;

    const [rows]: any = await pool.query('CALL sp_buscar_filtrar_pedidos(?, ?, ?, ?, ?, ?, ?)', [
        busqueda,
        estatus,
        fechaInicio,
        fechaFin,
        idAsesor,                
        limite,
        offset
    ]);

    const pedidos: Pedido[] = rows[0];
    const total: number = rows[1] ? rows[1][0].total : 0;

    return {
        pedidos: pedidos,
        total: total,
        paginas: Math.ceil(total / limite),
        paginaActual: pagina
    };
}

    static async obtenerDetallesPorId(id_pedido: number): Promise<DetallePedido[]> {
        const [detalles]: any = await pool.query(`
            SELECT * FROM verDetallesPedido 
            WHERE id_pedido = ?
        `, [id_pedido]);
        
        return detalles;
    }

   static async subirFactura(id_pedido: number, nombre_factura: string, factura_ruta: string) {
        const connection = await pool.getConnection();
        try {
            await connection.query('CALL sp_subir_factura_pedido(?, ?, ?, @p_mensaje, @p_ruta_anterior)', [
                id_pedido, 
                nombre_factura, 
                factura_ruta
            ]);

            const [results]: any = await connection.query('SELECT @p_mensaje AS mensaje, @p_ruta_anterior AS ruta_anterior');
            
            const mensaje = results[0].mensaje;
            const ruta_anterior = results[0].ruta_anterior;

            if (mensaje && mensaje.startsWith('Error:')) {
                throw new Error(mensaje);
            }

            return { mensaje, ruta_anterior };
        } finally {
            connection.release();
        }
    }

    static async cancelarPedido(id_pedido: number): Promise<string> {
        const connection = await pool.getConnection();
        try {
            await connection.query('CALL sp_cancelar_pedido(?, @mensaje)', [id_pedido]);
            
            const [[{ mensaje }]]: any = await connection.query('SELECT @mensaje AS mensaje');

            if (mensaje && mensaje.startsWith('Error:')) {
                throw new Error(mensaje);
            }

            return mensaje;
        } finally {
            connection.release();
        }
    }

    // 5. Aceptar Pedido (Validando Stock y Factura)
    static async aceptarPedido(id_pedido: number): Promise<string> {
        const connection = await pool.getConnection();
        try {
            await connection.query('CALL sp_aceptar_pedido_validacion(?, @mensaje)', [id_pedido]);
            
            const [[{ mensaje }]]: any = await connection.query('SELECT @mensaje AS mensaje');

            if (mensaje && mensaje.startsWith('Error:')) {
                throw new Error(mensaje);
            }

            return mensaje;
        } finally {
            connection.release();
        }
    }
    // 6. Estadísticas / Contadores de Pedidos
    static async contarPedidos(): Promise<any> {
        const query = `
            SELECT 
                -- Contadores por estatus
                CAST(SUM(CASE WHEN Estatus = 1 THEN 1 ELSE 0 END) AS UNSIGNED) AS pendientes,
                CAST(SUM(CASE WHEN Estatus = 0 THEN 1 ELSE 0 END) AS UNSIGNED) AS cancelados,
                CAST(SUM(CASE WHEN Estatus = 2 THEN 1 ELSE 0 END) AS UNSIGNED) AS pagados,
                
                -- Contador total del mes actual (independientemente del estatus)
                CAST(SUM(CASE WHEN MONTH(fecha) = MONTH(CURRENT_DATE()) 
                              AND YEAR(fecha) = YEAR(CURRENT_DATE()) 
                         THEN 1 ELSE 0 END) AS UNSIGNED) AS total_mes
            FROM pedidos;
        `;

        const [rows]: any = await pool.query(query);

        return {
            pendientes: rows[0].pendientes || 0,
            cancelados: rows[0].cancelados || 0,
            pagados: rows[0].pagados || 0,
            total_mes: rows[0].total_mes || 0
        };
    }
    static async pagarPedidoConCredito(id_pedido: number): Promise<string> {
        await pool.query('CALL sp_pagar_pedido_con_credito(?, @mensaje)', [id_pedido]);

        const [rows]: any = await pool.query('SELECT @mensaje AS mensaje');
        
        return rows[0].mensaje;
    }
}