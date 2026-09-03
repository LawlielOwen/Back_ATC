import { Marcas } from "../Model/Marcas";
import pool from '../Config/db';

export class MarcaService {

    static async obtenerMarcasActivas(busqueda: string | null = null): Promise<Marcas[]> {
        const rows: any = await pool.query('CALL sp_listar_marcas_activas(?)', [busqueda]);
        return rows[0][0];
    }

  
    static async obtenerMarcasConConteos(
        busqueda: string | null,
        estatus: number | null,   
        limite: number,
        offset: number
    ) {
        const rows: any = await pool.query(
            'CALL sp_marcas_con_conteos(?, ?, ?, ?)',
            [busqueda, estatus, limite, offset]
        );
        return {
            marcas: rows[0][0],       
            total: rows[0][1][0].total 
        };
    }

    static async agregarMarca(nombre: string): Promise<string> {
        await pool.query('CALL sp_agregar_marca(?, @mensaje)', [nombre]);
        const [result]: any = await pool.query('SELECT @mensaje AS mensaje');
        return result[0].mensaje;
    }

    static async modificarMarca(id: number, nombre: string): Promise<string> {
        await pool.query('CALL sp_modificar_marca(?, ?, @mensaje)', [id, nombre]);
        const [result]: any = await pool.query('SELECT @mensaje AS mensaje');
        return result[0].mensaje;
    }

    static async eliminarMarca(id: number): Promise<string> {
        await pool.query('CALL sp_eliminar_marca(?, @mensaje)', [id]);
        const [result]: any = await pool.query('SELECT @mensaje AS mensaje');
        return result[0].mensaje;
    }

    static async activarMarca(id: number): Promise<string> {
        await pool.query('CALL sp_activar_marca(?, @mensaje)', [id]);
        const [result]: any = await pool.query('SELECT @mensaje AS mensaje');
        return result[0].mensaje;
    }
}