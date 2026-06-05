import {Marcas} from "../Model/Marcas";
import pool from '../Config/db';
export class MarcaService{
       static async obtenerMarcas(){
        const rows: any = await pool.query('select * from marca_proveedor');
        return rows[0];
    }
}