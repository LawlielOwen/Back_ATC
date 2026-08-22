import pool from '../Config/db';
import { Productos } from '../Model/Productos'

export class ProductoService {
static async agregarProducto(p: Productos) {
        const { 
            Nombre, Descripcion, ExtraDescripcion, Precio, Codigo_numeral, 
            Codigo_japon, Estanteria, Caja, Stock, Apartado, id_marca 
        } = p;

        const [rows]: any = await pool.query('call sp_agregar_producto(?,?,?,?,?,?,?,?,?,?,?)', [
            Nombre, 
            Descripcion, 
            ExtraDescripcion || null, 
            Precio, 
            Codigo_numeral, 
            Codigo_japon, 
            Estanteria, 
            Caja, 
            Stock || 0, 
            Apartado || 0, 
            id_marca 
        ]);
        return rows;
    }

    static async modificarProducto(id: Number, p: Productos) {
        const { 
            Nombre, Descripcion, ExtraDescripcion, Precio, Codigo_numeral, 
            Codigo_japon, Estanteria, Caja, Stock, Apartado, id_marca 
        } = p;

        const [rows]: any = await pool.query('call sp_modificar_producto(?,?,?,?,?,?,?,?,?,?,?,?)', [
            id, 
            Nombre, 
            Descripcion, 
            ExtraDescripcion || null, 
            Precio, 
            Codigo_numeral, 
            Codigo_japon, 
            Estanteria, 
            Caja, 
            Stock || 0, 
            Apartado || 0, 
            id_marca
        ]);
        return rows;
    }
    static async obtenerProductos(pagina: number = 1, limite: number = 6) {
        const offset = (pagina - 1) * limite;

        const queryDatos = 'select * from verProductos limit ? offset ?';
        const [rows]: any = await pool.query(queryDatos, [limite, offset]);
        const [totalRows]: any = await pool.query('SELECT COUNT(*) as total FROM verProductos');
        const total = totalRows[0].total;
        return {
            productos: rows,
            total: total,
            paginas: Math.ceil(total / limite),
            paginaActual: pagina
        }
    }
    static async obtenerProductoPorId(id: number) {
        const [rows]: any = await pool.query('select * from verProductos where id = ?', [id]);
        return rows[0];
    }
 
    static async eliminarProducto(id: number) {
        const [rows]: any = await pool.query('call sp_eliminar_producto(?)', [id]);
        return rows;
    }
    static async buscaryfiltrarProducto(busqueda: string | null, estatus: number | null, marca: number | null,
        pagina: number = 1, limite: number = 7) {
        const offset = (pagina - 1) * limite;
        const [rows]: any = await pool.query('CALL sp_buscar_productos(?, ?, ?, ?, ?)', [
            busqueda,
            estatus,
            marca,
            limite,
            offset
        ]);
        const productos = rows[0];
        const total = rows[1][0].total;
        return {
            productos: productos,
            total: total,
            paginas: Math.ceil(total / limite),
            paginaActual: pagina
        };
    }
    static async activarProducto(id: number) {
        const [rows]: any = await pool.query('call sp_activar_producto(?)', [id]);
        return rows;
    }
    static async countProductosStock() {
        const [rows]: any = await pool.query('SELECT COUNT(*) AS total_stock FROM verProductos WHERE Estatus = 1;');
        return rows[0];
    }
  
    static async buscarProductoPorCodigo(termino: string) {
    const [rows]: any = await pool.query('CALL sp_buscar_producto_por_codigo(?)', [termino]);
    return rows[0];
    }
   static async registrarEntradaProducto(codigo: string, cantidad: number, destino: string, id_asesor: number) {
        const [rows]: any = await pool.query('CALL sp_registrar_entrada_producto(?, ?, ?, ?)', [
            codigo,
            cantidad,
            destino,
            id_asesor
        ]);
        return rows;
    }
}