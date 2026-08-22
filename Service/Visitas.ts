import pool from '../Config/db';

export class VisitaDemoService {

  static async consultarVisitas(busqueda: string | null, estatus: number | null, id_tecnico: number | null, pagina: number = 1, limite: number = 10) {
        const offset = (pagina - 1) * limite;
        
        const [rows]: any = await pool.query('CALL sp_buscar_visitas_demo(?, ?, ?, ?, ?)', [
            busqueda || null,
            estatus !== null ? estatus : null,
            id_tecnico || null,
            limite,
            offset
        ]);
        const visitas = rows[0] || [];
        const total = (rows[1] && rows[1][0] && rows[1][0].total !== undefined) ? rows[1][0].total : visitas.length;

        return {
            visitas: visitas,
            total: total,
            paginas: Math.ceil(total / limite) || 1,
            paginaActual: pagina
        };
    }

    // Obtener una visita específica por ID
    static async obtenerVisitaPorId(id: number) {
        const [rows]: any = await pool.query('SELECT * FROM verVisitasDemostracion WHERE id_visita = ?', [id]);
        return rows[0];
    }

    // Obtener los productos demo asociados a una visita
    static async obtenerDetallesVisita(id_visita: number) {
        const [rows]: any = await pool.query('SELECT * FROM verDetallesVisitaDemo WHERE id_visita = ?', [id_visita]);
        return rows;
    }

    // Crear la visita (El "Antes": programa la visita y los demos que se lleva)
    static async crearVisita(data: { fecha_visita: string, id_tecnico: number, id_asesor: number, id_cliente: number | null, empresa_no_registrada: string | null, demos: any[] }) {
        const jsonDemos = JSON.stringify(data.demos);
        
        const [result]: any = await pool.query('CALL sp_crear_visita_demo(?, ?, ?, ?, ?, ?)', [
            data.fecha_visita,
            data.id_tecnico,
            data.id_asesor,
            data.id_cliente,
            data.empresa_no_registrada,
            jsonDemos
        ]);
        
        return result[0][0];
    }

    static async completarVisita(id_visita: number, resumen_actividades: string, retornos: any[]) {
        const jsonRetornos = JSON.stringify(retornos);

        const [result]: any = await pool.query('CALL sp_completar_visita_demo(?, ?, ?)', [
            id_visita,
            resumen_actividades,
            jsonRetornos
        ]);

        return result[0];
    }

    static async cancelarVisita(id_visita: number) {
        const [result]: any = await pool.query('CALL sp_cancelar_visita_demo(?)', [id_visita]);
        return result[0];
    }
}