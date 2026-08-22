import pool from '../Config/db';

export class ProyectoService {

    // 1. Consultar proyectos con filtros y paginación
    static async buscarProyectos(
        busqueda: string | null, 
        estatus: number | null, 
        id_tecnico: number, 
        rol: string, 
        pagina: number = 1, 
        limite: number = 10
    ) {
        const offset = (pagina - 1) * limite;
        
        const [rows]: any = await pool.query('CALL sp_buscar_proyectos_soporte(?, ?, ?, ?, ?, ?)', [
            busqueda,
            estatus,
            id_tecnico,
            rol,
            limite,
            offset
        ]);

        const proyectos = rows[0];
        const total = rows[1][0].total;

        return {
            proyectos: proyectos,
            total: total,
            paginas: Math.ceil(total / limite),
            paginaActual: pagina
        };
    }

   static async altaProyecto(data: {
        nombre_proyecto: string,
        descripcion: string,
        id_tecnico: number,
        id_cliente: number | null,
        empresa_no_registrada: string | null,
        materiales: any[] 
    }) {
        const materialesFormateados = data.materiales && data.materiales.length > 0 
            ? data.materiales.map(m => ({
                id_producto: m.id_producto || null,
                cantidad: Number(m.cantidad) || 1,
                nombre_modelo: m.nombre_producto || m.nombre_modelo || null, 
                marca: m.marca || null
            }))
            : [];

        const jsonMateriales = materialesFormateados.length > 0 
            ? JSON.stringify(materialesFormateados) 
            : null;

        const [result]: any = await pool.query('CALL sp_alta_proyecto_soporte(?, ?, ?, ?, ?, ?)', [
            data.nombre_proyecto,
            data.descripcion,
            data.id_tecnico,
            data.id_cliente,
            data.empresa_no_registrada,
            jsonMateriales
        ]);
        
        return result[0]; 
    }

    static async registrarAvance(
        id_proyecto: number, 
        comentarios: string, 
        nuevo_estatus: number | null = null,
        se_cotizo: number | null = null,
        id_usuario: number | null = null,
        tipo_evento: string = 'comentario'
    ) {
        const [result]: any = await pool.query('CALL sp_registrar_avance_proyecto(?, ?, ?, ?, ?, ?)', [
            id_proyecto,
            comentarios,
            nuevo_estatus,
            se_cotizo,
            id_usuario,
            tipo_evento
        ]);
        
        return result[0]; 
    }

    static async modificarProyecto(id_proyecto: number, data: {
        nombre_proyecto: string,
        descripcion: string,
        id_tecnico: number,
        id_cliente: number | null,
        empresa_no_registrada: string | null,
        materiales: any[] 
    }) {
        const materialesFormateados = data.materiales && data.materiales.length > 0 
            ? data.materiales.map((m: any) => ({
                id_producto: m.id_producto || null,
                cantidad: Number(m.cantidad) || 1,
                nombre_modelo: m.nombre_producto || null,
                marca: m.marca || null,
                codigo: m.codigo || null
            }))
            : [];

        const jsonMateriales = materialesFormateados.length > 0 
            ? JSON.stringify(materialesFormateados) 
            : null;

        const [result]: any = await pool.query('CALL sp_modificar_proyecto_soporte(?, ?, ?, ?, ?, ?, ?)', [
            id_proyecto,
            data.nombre_proyecto,
            data.descripcion,
            data.id_tecnico,
            data.id_cliente,
            data.empresa_no_registrada,
            jsonMateriales
        ]);
        
        return result[0]; 
    }
    static async contarProyectosMes(id_tecnico: number, rol: string) {
        const [rows]: any = await pool.query('CALL sp_contar_proyectos_mes(?, ?)', [
            id_tecnico,
            rol
        ]);
        return rows[0][0]; 
    }
    static async obtenerMateriales(id_proyecto: number) {
        const [rows]: any = await pool.query(
            'SELECT * FROM verMaterialesProyecto WHERE id_proyecto = ?', 
            [id_proyecto]
        );
        return rows; 
    }
    static async finalizarProyecto(id_proyecto: number) {
        const [result]: any = await pool.query('CALL sp_finalizar_proyecto_soporte(?)', [id_proyecto]);
        return result[0]; 
    }

    static async obtenerBitacora(id_proyecto: number) {
        const [rows]: any = await pool.query(
            'SELECT * FROM verBitacoraProyecto WHERE id_proyecto = ?',
            [id_proyecto]
        );
        return rows;
    }
}