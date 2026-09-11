import pool from '../Config/db';

export class ValeService {
    static async obtenerVal(pagina: number = 1, limite: number = 10) {
        const offset = (pagina - 1) * limite;
        const [rows]: any = await pool.query('select * from verVales limit ? offset ?', [limite, offset]);
        const [totalRows]: any = await pool.query('SELECT COUNT(*) as total FROM verVales');
        const total = totalRows[0].total;
        return { vales: rows, total, paginas: Math.ceil(total / limite), paginaActual: pagina };
    }
    static async solicitarVale(id_asesor: number, id_cliente: number, id_pedido: number, productos: any[]) {
        const [rows]: any = await pool.query('CALL sp_crear_solicitud_vale(?, ?, ?, ?)',
            [id_asesor, id_cliente, id_pedido, JSON.stringify(productos)]);
        return rows;
    }
    static async aceptarVale(id_vale: number, comentario: string) {
        const [rows]: any = await pool.query('CALL sp_autorizar_vale(?, ?)', [id_vale, comentario ?? '']);
        return rows;
    }
    static async rechazarVale(id_vale: number, comentario: string) {
        const [rows]: any = await pool.query('CALL sp_rechazar_vale(?, ?)', [id_vale, comentario]);
        return rows;
    }
    static async consultarVale(id_asesor: number | null, busqueda: string | null, estatus: number | null,
        fechaInicio: string | null, fechaFin: string | null, pagina: number = 1, limite: number = 10) {
        const [rows]: any = await pool.query('CALL sp_consultar_vales(?, ?, ?, ?, ?, ?, ?)',
            [id_asesor, busqueda, estatus, fechaInicio, fechaFin, pagina, limite]);
        const vales = rows[0];
        const total = rows[1][0].total;
        return { vales, total, paginas: Math.ceil(total / limite), paginaActual: pagina };
    }
    static async contarVales(id_asesor: number, rol: string) {
        const [rows]: any = await pool.query('CALL sp_contar_vales_estatus(?, ?)', [id_asesor, rol]);
        return rows[0];
    }
    static async obtenerValPorId(id: number) {
        const [rows]: any = await pool.query('select * from verVales where id_vale = ?', [id]);
        return rows[0];
    }
    static async obtenerDetallesVale(id: number) {
        const [rows]: any = await pool.query('CALL sp_obtener_productos_vale(?)', [id]);
        return rows[0];
    }
    static async pedidosDisponiblesVale(id_asesor: number, rol: string) {
        const [rows]: any = await pool.query('CALL sp_pedidos_disponibles_para_vale(?, ?)', [id_asesor, rol]);
        return rows[0];
    }
    static async cotizacionesDisponiblesVale(idSolicitante: number) {
        const [rows]: any = await pool.query('CALL sp_cotizaciones_disponibles_para_vale(?)', [idSolicitante]);
        return rows[0];
    }
    static async productosCotizacionVale(idCotizacion: number, idSolicitante: number) {
        const [rows]: any = await pool.query('CALL sp_productos_cotizacion_para_vale(?, ?)', [idCotizacion, idSolicitante]);
        return rows[0];
    }
    static async solicitarValeDesdeCotizacion(idCotizacion: number, idSolicitante: number) {
        const [rows]: any = await pool.query('CALL sp_crear_solicitud_vale_cotizacion(?, ?)', [idCotizacion, idSolicitante]);
        return rows[0][0];
    }
    static async solicitarValeDemo(id_asesor: number, id_cliente: number | null,
        empresa_no_registrada: string | null, id_visita: number, productos: any[]) {
        const [rows]: any = await pool.query('CALL sp_crear_solicitud_vale_demo(?, ?, ?, ?, ?)',
            [id_asesor, id_cliente || null, empresa_no_registrada || null, id_visita, JSON.stringify(productos)]);
        return rows;
    }
    static async aceptarValeDemo(id_vale: number, comentario: string) {
        const [rows]: any = await pool.query('CALL sp_autorizar_vale_demo(?, ?)', [id_vale, comentario || '']);
        return rows;
    }
    static async visitasDisponiblesVale(id_tecnico: number) {
        const [rows]: any = await pool.query('CALL sp_visitas_disponibles_para_vale(?)', [id_tecnico]);
        return rows[0];
    }
}