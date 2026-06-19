import pool from '../Config/db';

export class ProveedorService {
    static async registrarPedido(id_asesor: number, id_proveedor: number, destino: string,
        fecha: string, productos: any[]) {
        const productosString = JSON.stringify(productos);
        const [rows]: any = await pool.query('CALL sp_crear_pedido_proveedor(?, ?, ?, ?, ?)', [
            id_asesor,
            id_proveedor,
            destino,
            fecha,
            productosString
        ]);
        return rows;
    }
    static async recibirPedido(id_pedido: number, id_asesor: number) {
        const [rows]: any = await pool.query('CALL sp_recibir_pedido_completo(?, ?)', [
            id_pedido,
            id_asesor
        ]);
        return rows;
    }
    static async recibirPedidoIncidencia( id_pedido: number, id_asesor: number, productos: any[]) {
        const productosString = JSON.stringify(productos);
        const [rows]: any = await pool.query('CALL sp_recibir_pedido_incidencias(?, ?, ?)', [
            id_pedido,
            id_asesor,
            productosString
        ]);
        return rows;
    }
    static async consultarPedidos(busqueda: string | null,id_proveedor:number | null, estatus: number | null,
         fechaInicio: string | null, fechaFin: string | null,
          pagina: number = 1, limite: number = 10) {
               const [rows]: any = await pool.query('CALL  sp_consultar_pedidos(?, ?, ?, ?, ?, ?, ?)', [
                busqueda,
                id_proveedor,
                estatus,
                fechaInicio,
                fechaFin,
                pagina,
                limite
            ]);
        const ped = rows[0];
        const total = rows[1][0].total;

        return {
            pedidos: ped,
            total: total,
            paginas: Math.ceil(total / limite),
            paginaActual: pagina
        };
    }
    static async consultarDetallesPedido(id_pedido: number) {
        const [rows]: any = await pool.query(
            'SELECT * FROM verDetallesPedidos WHERE id_pedido = ?',
            [id_pedido]
        );
        
        return rows; 
    }
    static async obtenerEstadisticasPedidos(anio: number | null = null) {
        const anioConsulta = anio || new Date().getFullYear(); 

        const [rows]: any = await pool.query('CALL sp_contar_estatus_pedidos(?)', [anioConsulta]);
        
        return rows[0]; 
    }
    static async consultarIncidentePedido(id_pedido: number) {
        const [rows]: any = await pool.query(
            'SELECT * FROM verIncidentes WHERE id_pedido = ?',
            [id_pedido]
        );
        
        return rows; 
    }
    static async consultarProducto(codigo: string, id_proveedor: number | null = null) {
    const codigoLimpio = codigo.trim(); 
    const [rows]: any = await pool.query('call sp_buscar_producto_para_pedido(?, ?)', [codigoLimpio, id_proveedor]);
    return rows[0];
}
}
