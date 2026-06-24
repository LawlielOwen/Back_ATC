import pool from '../Config/db';
import {Cliente} from '../Model/Cliente';
export class ClienteService {

static async obtenerClientes(pagina: number = 1, limite: number = 6) {
    const offset = (pagina - 1) * limite;

    const queryDatos = 'select * from verClientes limit ? offset ?';
    const [rows]: any = await pool.query(queryDatos, [limite, offset]);
    const [totalRows]: any = await pool.query('SELECT COUNT(*) as total FROM verClientes');
    const total = totalRows[0].total;
    return{
        clientes: rows,
        total: total,
        paginas: Math.ceil(total / limite),
        paginaActual: pagina
    }
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
    // 1. Extraemos los nuevos campos
    const {
      Nombre, RFC, Razon_social, Regimen_fiscal, Direccion, 
      contacto_principal, correo_contacto, CP, 
      nombre_constancia, ruta_constancia, id_asesor, asesor_tipo
    } = cliente;
        
    // 2. Pasamos los 12 parámetros en el orden exacto del SP
    const [rows]: any = await pool.query(
      'call sp_agregar_cliente(?,?,?,?,?,?,?,?,?,?,?,?)', 
      [
        Nombre, RFC, Razon_social, Regimen_fiscal, Direccion, 
        contacto_principal, correo_contacto, CP, 
        nombre_constancia, ruta_constancia, id_asesor, asesor_tipo
      ]
    );
    return rows;
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
}