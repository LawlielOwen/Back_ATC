import pool from '../Config/db';
import {Cliente} from '../Model/Cliente';
export class ClienteService {

static async obtenerClientes(pagina: number = 1, limite: number = 6, idAsesorFiltro: number = 0) {
    const offset = (pagina - 1) * limite;

    let queryDatos = 'SELECT * FROM verClientes';
    let queryCount = 'SELECT COUNT(*) as total FROM verClientes';
    
    const paramsDatos: any[] = [];
    const paramsCount: any[] = [];

    if (idAsesorFiltro > 0) {
        queryDatos += ' WHERE id_asesor = ?';
        queryCount += ' WHERE id_asesor = ?';
        paramsDatos.push(idAsesorFiltro);
        paramsCount.push(idAsesorFiltro);
    }

    queryDatos += ' LIMIT ? OFFSET ?';
    paramsDatos.push(limite, offset);

    const [rows]: any = await pool.query(queryDatos, paramsDatos);
    const [totalRows]: any = await pool.query(queryCount, paramsCount);
    
    const total = totalRows[0].total;
    
    return {
        clientes: rows,
        total: total,
        paginas: Math.ceil(total / limite),
        paginaActual: pagina
    };
}
static async obtenerClientePorId(id: number) {
    const [rows]: any = await pool.query('select * from verClientes where id = ?', [id]);
    return rows[0];
}

static async eliminarCliente(id: number) {
    const [rows]: any = await pool.query('call sp_eliminar_cliente(?)', [id]);
    return rows;
}
static async buscaryfiltrarClientes(busqueda: string | null, estatus: number | null, pagina: number = 1, limite: number = 6) {
    const offset = (pagina - 1) * limite;
const [rows]: any = await pool.query('CALL sp_buscar_clientes(?, ?, ?, ?)', [
        busqueda, 
        estatus, 
        limite, 
        offset
    ]);
    const clientes = rows[0];
    const total = rows[1][0].total;
    return {
        clientes: clientes,
        total: total,
        paginas: Math.ceil(total / limite),
        paginaActual: pagina
    };
}
static async activarCliente(id: number){
    const [rows]: any = await pool.query('call sp_activar_cliente(?)', [id]);
    return rows;
}
static async countClientesActivos(){
    const [rows]: any = await pool.query('SELECT COUNT(*) AS total_activos FROM verClientes WHERE Estatus = 1;');
    return rows[0];
}
static async agregarCliente(cliente: Cliente | any) {
    const {
      Nombre, RFC, Razon_social, Regimen_fiscal, Direccion, 
      contacto_principal, correo_contacto, CP, 
      nombre_constancia, ruta_constancia, id_asesor, asesor_tipo
    } = cliente;
        
    const [resultSets]: any = await pool.query(
      'call sp_agregar_cliente(?,?,?,?,?,?,?,?,?,?,?,?)', 
      [
        Nombre, RFC, Razon_social, Regimen_fiscal, Direccion, 
        contacto_principal, correo_contacto, CP, 
        nombre_constancia, ruta_constancia, id_asesor, asesor_tipo
      ]
    );

    const nuevoId = resultSets[0][0].id;

    return { id: nuevoId, mensaje: 'Cliente agregado correctamente' };
  }

  static async actualizarCliente(id: number, cliente: Cliente | any) {
    // 1. Extraemos los nuevos campos
    const {
      Nombre, RFC, Razon_social, Regimen_fiscal, Direccion, 
      contacto_principal, correo_contacto, CP, 
      nombre_constancia, ruta_constancia, id_asesor, asesor_tipo
    } = cliente;
    
    // 2. Pasamos los 13 parámetros (incluyendo el ID al inicio) en el orden exacto del SP
    const [rows]: any = await pool.query(
      'call sp_modificar_cliente(?,?,?,?,?,?,?,?,?,?,?,?,?)', 
      [
        id, Nombre, RFC, Razon_social, Regimen_fiscal, Direccion, 
        contacto_principal, correo_contacto, CP, 
        nombre_constancia, ruta_constancia, id_asesor, asesor_tipo
      ]
    );
    return rows;
  }
  static async subirCSF(id_cliente: number, nombre_constancia: string, ruta_constancia: string) {
        const connection = await pool.getConnection();
        try {
            await connection.query('CALL sp_subir_csf_cliente(?, ?, ?, @p_mensaje, @p_ruta_anterior)', [
                id_cliente, 
                nombre_constancia, 
                ruta_constancia
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
}