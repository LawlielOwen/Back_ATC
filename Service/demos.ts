import pool from '../Config/db';

export class DemoService {

    // Consultar y filtrar con paginación
    static async consultarDemos(busqueda: string | null, estatus: number | null, marca: number | null, pagina: number = 1, limite: number = 10) {
        const offset = (pagina - 1) * limite;
        
        const [rows]: any = await pool.query('CALL sp_buscar_demos(?, ?, ?, ?, ?)', [
            busqueda,
            estatus,
            marca,
            limite,
            offset
        ]);

        const demos = rows[0];
        const total = rows[1][0].total;

        return {
            demos: demos,
            total: total,
            paginas: Math.ceil(total / limite),
            paginaActual: pagina
        };
    }

    // Agregar nuevo demo
    static async agregarDemo(data: { nombre_modelo: string, descripcion: string, numero_serie: string, id_marca: number, stock: number }) {
        const [result]: any = await pool.query('CALL sp_agregar_demo(?, ?, ?, ?, ?)', [
            data.nombre_modelo,
            data.descripcion,
            data.numero_serie,
            data.id_marca,
            data.stock
        ]);
        return result[0];
    }

    // Modificar demo existente
    static async modificarDemo(id: number, data: { nombre_modelo: string, descripcion: string, numero_serie: string, id_marca: number, stock: number }) {
        const [result]: any = await pool.query('CALL sp_modificar_demo(?, ?, ?, ?, ?, ?)', [
            id,
            data.nombre_modelo,
            data.descripcion,
            data.numero_serie,
            data.id_marca,
            data.stock
        ]);
        return result[0];
    }

    // Dar de baja (Estatus 0)
    static async eliminarDemo(id: number) {
        const [result]: any = await pool.query('CALL sp_eliminar_demo(?)', [id]);
        return result[0];
    }

    // Reactivar demo
    static async activarDemo(id: number) {
        const [result]: any = await pool.query('CALL sp_activar_demo(?)', [id]);
        return result[0];
    }
    static async buscarDemoParaVisita(busqueda: string, id_marca: number | null = null) {
        const [rows]: any = await pool.query('CALL sp_buscar_demo_para_visita(?, ?)', [
            busqueda,
            id_marca
        ]);
        
        return rows[0]; 
    }
    // Registrar nueva entrada de stock para un demo
    static async registrarEntrada(codigo: string, cantidad: number, id_asesor: number) {
        const [result]: any = await pool.query('CALL sp_registrar_entrada_demo(?, ?, ?)', [
            codigo,
            cantidad,
            id_asesor
        ]);
        
        return result[0];
    }
}