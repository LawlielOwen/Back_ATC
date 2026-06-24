import { Asesor } from "../Model/asesor";
import pool from '../Config/db';
import bcrypt from 'bcrypt';
export class AsesorService {

  static async obtenerAsesores() {
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
  static async agregarAsesor(asesor: Asesor | any) {
    const connection = await pool.getConnection();
    try {
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(asesor.contra, saltRounds);
      await connection.query(
        `CALL sp_agregar_asesor(?, ?, ?, ?, ?, ?, ?, ?, ?, @p_mensaje)`,
        [
          asesor.Nombre,
          asesor.app,
          asesor.apm,
          asesor.telefono,
          hashedPassword,
          asesor.Rol,
          asesor.Fecha_nacimiento,
          asesor.Fecha_contratacion,
          asesor.Correo
        ]
      );

      const [results]: any = await connection.query('SELECT @p_mensaje AS mensaje');
      const mensaje = results[0].mensaje;

      if (mensaje && mensaje.startsWith('Error:')) {
        throw new Error(mensaje);
      }

      return { mensaje };
    } finally {
      connection.release();
    }
  }
  static async modificarAsesor(id: number, asesor: Asesor | any) {
    const connection = await pool.getConnection();
    try {
      await connection.query(
        `CALL sp_modificar_asesor(?, ?, ?, ?, ?, ?, ?, ?, ?, @p_mensaje)`,
        [
          id,
          asesor.Nombre,
          asesor.app,
          asesor.apm,
          asesor.telefono,
          asesor.Rol,
          asesor.Fecha_nacimiento,
          asesor.Fecha_contratacion,
          asesor.Correo
        ]
      );

      const [results]: any = await connection.query('SELECT @p_mensaje AS mensaje');
      const mensaje = results[0].mensaje;

      if (mensaje && mensaje.startsWith('Error:')) {
        throw new Error(mensaje);
      }

      return { mensaje };
    } finally {
      connection.release();
    }
  }

  static async eliminarAsesor(id: number) {
    const connection = await pool.getConnection();
    try {
      // Llamamos al SP de eliminación pasando solo el ID
      await connection.query(
        `CALL sp_eliminar_asesor(?, @p_mensaje)`,
        [id]
      );

      // Recuperamos el mensaje de salida
      const [results]: any = await connection.query('SELECT @p_mensaje AS mensaje');
      const mensaje = results[0].mensaje;

      if (mensaje && mensaje.startsWith('Error:')) {
        throw new Error(mensaje);
      }

      return { mensaje };
    } finally {
      connection.release();
    }
  }
  static async buscarAsesores(busqueda: string = '', estatus: number = -1, limite: number = 10, offset: number = 0) {
    const connection = await pool.getConnection();
    try {
      const [results]: any = await connection.query(
        `CALL sp_buscar_asesores(?, ?, ?, ?)`,
        [busqueda, estatus, limite, offset]
      );

      const asesores = results[0];
      const total_registros = results[1][0].total_registros;

      return {
        a: asesores,
        total: total_registros
      };
    } finally {
      connection.release();
    }
  }
  static async cantidadAsesoresActivos() {
    const [rows]: any = await pool.query('SELECT COUNT(*) AS total FROM asesores WHERE Estatus = 1');

    return rows[0].total;
  }
  static async registroAsesor(asesor: Asesor | any) {
    const connection = await pool.getConnection();
    try {
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(asesor.Contra, saltRounds);
      await connection.query(
        `CALL sp_registro(?, ?, ?, ?, ?, ?, ?, @p_mensaje)`,
        [
          asesor.Nombre,
          asesor.app,
          asesor.apm,
          asesor.Telefono,
          hashedPassword,
          asesor.Fecha_nacimiento,
          asesor.Correo
        ]
      );

      const [results]: any = await connection.query('SELECT @p_mensaje AS mensaje');
      const mensaje = results[0].mensaje;

      if (mensaje && mensaje.startsWith('Error:')) {
        throw new Error(mensaje);
      }

      return { mensaje };
    } finally {
      connection.release();
    }
  }
}