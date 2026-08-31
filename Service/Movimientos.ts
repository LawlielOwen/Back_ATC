import pool from '../Config/db';
import { Movimiento } from '../Model/Movimientos';

export class MovimientoService {
    static async obtenerMov(pagina: number = 1, limite: number = 10) {
        const offset = (pagina - 1) * limite;
        const queryDatos = 'select * from verMovimientos limit ? offset ?';
        const [rows]: any = await pool.query(queryDatos, [limite, offset]);
        const [totalRows]: any = await pool.query('SELECT COUNT(*) as total FROM verMovimientos');
        const total = totalRows[0].total;
        return {
            movimientos: rows,
            total: total,
            paginas: Math.ceil(total / limite),
            paginaActual: pagina
        }

    }
    static async registrarSalidaProducto(codigo: string, cantidad: number, destino: string, id_asesor: number | null,
         id_cliente: number | null, clienteNoRegistrado: string | null) {
        const [rows]: any = await pool.query('CALL sp_registrar_salida_producto(?, ?, ?, ?, ?, ?)', [
            codigo,
            cantidad,
            destino,
            id_asesor,
            id_cliente,
            clienteNoRegistrado
        ]);
        return rows;
    }
    static async estadisticaMensual() {
        const query = `CALL  sp_estadisticas_mes_actual()`;
        const [rows]: any = await pool.query(query);
        return rows[0];
    }
    static async consultarMov(busqueda: string | null, tipo: string | null, destino: string | null,
        fechaInicio: string | null, fechaFin: string | null, pagina: number = 1, limite: number = 10) {
        const offset = (pagina - 1) * limite;
        const [rows]: any = await pool.query('CALL sp_consultar_movimientos(?, ?, ?, ?, ?, ?, ?)', [
            busqueda,
            tipo,
            destino,
            fechaInicio,
            fechaFin,
            limite,
            offset
        ]);
        const movi = rows[0];
        const total = rows[1][0].total;
        return {
            movi: movi,
            total: total,
            paginas: Math.ceil(total / limite),
            paginaActual: pagina
        };
    }
     static async obtenerMovPorId(id: number) {
        const [rows]: any = await pool.query('select * from verMovimientos where id_movimiento = ?', [id]);
        return rows[0];
    }
} 