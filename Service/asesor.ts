import {Asesor} from "../Model/asesor";
import pool from '../Config/db';

export class AsesorService{

    static async obtenerAsesores(){
        const rows: any = await pool.query('select * from verAsesores');
        return rows[0];
    }
    static async obtenerAsesoresRol(Rol?: string) {
  let query = 'SELECT * FROM verAsesores';
  let params: any[] = [];

  if (Rol) {
    query += ' WHERE rol = ?';
    params.push(Rol);
  }

  const rows: any = await pool.query(query, params);
  return rows[0];
}
}