import pool from '../Config/db';
import { ValeSalida } from '../Model/Vales_salida';

export class ValeService {
    static async obtenerVal(pagina: number = 1, limite: number = 10) {
        const offset = (pagina - 1) * limite;
        const queryDatos = 'select * from verVales limit ? offset ?';
        const [rows]: any = await pool.query(queryDatos, [limite, offset]);
        const [totalRows]: any = await pool.query('SELECT COUNT(*) as total FROM verVales');
        const total = totalRows[0].total;
        return {
            vales: rows,
            total: total,
            paginas: Math.ceil(total / limite),
            paginaActual: pagina
        }

    }
    static async soliciarVale(id_asesor: number, id_cliente: number, orden_compra: string, num_factura: string, productos: any[]) {
        const productosString = JSON.stringify(productos);
        const [rows]: any = await pool.query('CALL sp_crear_solicitud_vale(?, ?, ?, ?, ?)', [
            id_asesor,
            id_cliente,
            orden_compra,
            num_factura,
            productosString
        ]);
        return rows;
    }
    static async aceptarVale(id_vale: number, comentario: string) {
        const [rows]: any = await pool.query('CALL sp_autorizar_vale(?, ?)', [
            id_vale,
            comentario
        ]);
        return rows;
    }
    static async rechazarVale(id_vale: number, comentario: string) {
        const [rows]: any = await pool.query('CALL sp_rechazar_vale(?, ?)', [
            id_vale,
            comentario
        ]);
        return rows;
    }
    static async consultarVale(id_asesor: number | null, busqueda: string | null, estatus: number | null, fechaInicio: string | null, fechaFin: string | null, pagina: number = 1, limite: number = 10) {
        const [rows]: any = await pool.query('CALL sp_consultar_vales(?, ?, ?, ?, ?, ?, ?)', [
            id_asesor,
            busqueda,
            estatus,
            fechaInicio,
            fechaFin,
            pagina,
            limite
        ]);

        const val = rows[0];
        const total = rows[1][0].total;

        return {
            vales: val,
            total: total,
            paginas: Math.ceil(total / limite),
            paginaActual: pagina
        };
    }
 static async contarVales(id_asesor: number, rol: string) {
        const query = `CALL sp_contar_vales_estatus(?, ?)`;
        const [rows]: any = await pool.query(query, [id_asesor, rol]);
        return rows[0]; 
    }
    static async obtenerValPorId(id: number) {
        const [rows]: any = await pool.query('select * from verVales where id_vale = ?', [id]);
        return rows[0];
    }
static async consultarProducto(codigo: string) {
        const codigoLimpio = codigo.trim(); 
        const [rows]: any = await pool.query('call sp_buscar_producto_para_vale(?)', [codigoLimpio]);
        return rows[0];
    }
    static async obtenerDetallesVale(id: number) {
        const [rows]: any = await pool.query('CALL sp_obtener_productos_vale(?)', [id]);
        return rows[0];
    }
}