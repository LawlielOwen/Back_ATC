import pool from '../Config/db'; // Asegúrate de que este sea tu pool de conexiones (ej. mysql2/promise)

export class TicketService {
    
    static async crearTicket(datos: any) {
        const connection = await pool.getConnection();
        try {
            const { id_asesor, id_cliente, nombre_prospecto, url_ticket, comentarios } = datos;
            
            await connection.query(
                `CALL sp_crear_ticket(?, ?, ?, ?, ?, @p_id_ticket, @p_mensaje)`,
                [id_asesor, id_cliente || null, nombre_prospecto || null, url_ticket || null, comentarios || null]
            );

            const [result]: any = await connection.query('SELECT @p_id_ticket AS id_ticket, @p_mensaje AS mensaje');
            
            return {
                id_ticket: result[0].id_ticket,
                mensaje: result[0].mensaje
            };
        } finally {
            connection.release();
        }
    }


    static async modificarTicket(id_ticket: number, datos: any) {
        const connection = await pool.getConnection();
        try {
            const { 
                id_asesor, id_cliente, nombre_prospecto, url_ticket, 
                estatus, venta_exitosa, cliente_registrado, comentarios 
            } = datos;

            await connection.query(
                `CALL sp_modificar_ticket(?, ?, ?, ?, ?, ?, ?, ?, ?, @p_mensaje)`,
                [
                    id_ticket, id_asesor, id_cliente || null, nombre_prospecto || null, 
                    url_ticket || null, estatus, venta_exitosa ?? null, 
                    cliente_registrado ?? 0, comentarios || null
                ]
            );

            const [result]: any = await connection.query('SELECT @p_mensaje AS mensaje');
            return { mensaje: result[0].mensaje };
        } finally {
            connection.release();
        }
    }


    static async cambiarEstatus(id_ticket: number, nuevo_estatus: number) {
        const connection = await pool.getConnection();
        try {
            await connection.query(
                `CALL sp_cambiar_estatus_ticket(?, ?, @p_mensaje)`,
                [id_ticket, nuevo_estatus]
            );

            const [result]: any = await connection.query('SELECT @p_mensaje AS mensaje');
            
            if (result[0].mensaje.includes('Error')) {
                throw new Error(result[0].mensaje);
            }
            return { mensaje: result[0].mensaje };
        } finally {
            connection.release();
        }
    }


    static async cerrarTicket(id_ticket: number, datosCierre: any) {
        const connection = await pool.getConnection();
        try {
            const { venta_exitosa, cliente_registrado, nuevo_id_cliente } = datosCierre;

            await connection.query(
                `CALL sp_cerrar_ticket(?, ?, ?, ?, @p_mensaje)`,
                [id_ticket, venta_exitosa, cliente_registrado, nuevo_id_cliente || null]
            );

            const [result]: any = await connection.query('SELECT @p_mensaje AS mensaje');
            
            if (result[0].mensaje.includes('Error')) {
                throw new Error(result[0].mensaje);
            }
            return { mensaje: result[0].mensaje };
        } finally {
            connection.release();
        }
    }

    static async buscarTickets(busqueda: string, estatus: number, idAsesor: number, pagina: number, limite: number) {
    const connection = await pool.getConnection();
    try {
        const [rows]: any = await connection.query(
            `CALL sp_buscar_tickets(?, ?, ?, ?, ?, @p_total_registros)`,
            [busqueda || null, estatus || 0, idAsesor || 0, pagina || 1, limite || 10]
        );

        const [outParams]: any = await connection.query('SELECT @p_total_registros AS total');

        return {
            tickets: rows[0],
            total: outParams[0].total
        };
    } finally {
        connection.release();
    }
}
    static async contarTicketsAnual() {
        const connection = await pool.getConnection();
        try {
            await connection.query(`CALL sp_contar_tickets_anual(@p_total_anual)`);
            const [result]: any = await connection.query('SELECT @p_total_anual AS total_anual');
            
            return { total: result[0].total_anual };
        } finally {
            connection.release();
        }
    }
}