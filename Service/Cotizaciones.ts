import pool from '../Config/db';
import { CotizacionCompleta, Cotizacion } from '../Model/Cotizacion';

export class CotizacionService {
    static async obtenerCotizaciones(pagina: number = 1, limite: number = 10) {
        const offset = (pagina - 1) * limite;
        const [rows]: any = await pool.query('CALL sp_cotizaciones_mes_actual(?, ?)', [limite, offset]);
        const cotizacionesMes = rows[0];
        const queryCount = `
            SELECT COUNT(*) as total 
            FROM verCot 
            WHERE MONTH(fecha) = MONTH(CURRENT_DATE()) 
              AND YEAR(fecha) = YEAR(CURRENT_DATE())
        `;
        const [totalRows]: any = await pool.query(queryCount);
        const total = totalRows[0].total;
        return {
            cot: cotizacionesMes,
            total: total,
            paginas: Math.ceil(total / limite),
            paginaActual: pagina
        };
    }
    static async guardarCotizacion(c: CotizacionCompleta): Promise<number> {
        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();
            await connection.query('CALL sp_guardar_cotizacion(?, ?, ?, ?, ?, ?, ?, @nuevo_id)', [
                c.extra_descripcion || null,
                c.id_cliente || null,
                c.nombre_prospecto || null,
                c.tipo_cambio,
                c.subtotal,
                c.iva,
                c.total
            ]);
            const [rows]: any = await connection.query('SELECT @nuevo_id AS id_cotizacion');
            const idCotizacion = rows[0].id_cotizacion;
            if (c.detalles && c.detalles.length > 0) {
                for (const item of c.detalles) {
                    await connection.query(
                        `INSERT INTO detalles_cotizacion 
                        (id_producto, id_cotizacion, cantidad_producto, precio_unitario_cotizado) 
                        VALUES (?, ?, ?, ?)`,
                        [item.id_producto, idCotizacion, item.cantidad_producto, item.precio_unitario_cotizado]
                    );
                }
            }

            await connection.commit();
            return idCotizacion;

        } catch (error: any) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }
    static async modificarCotizacion(id: number, c: CotizacionCompleta) {
        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();
            await connection.query('CALL sp_modificar_cotizacion(?, ?, ?, ?, ?, ?, ?, ?)', [
                id,
                c.extra_descripcion || null,
                c.id_cliente || null,
                c.nombre_prospecto || null,
                c.tipo_cambio,
                c.subtotal,
                c.iva,
                c.total
            ]);
            await connection.query('DELETE FROM detalles_cotizacion WHERE id_cotizacion = ?', [id]);
            if (c.detalles && c.detalles.length > 0) {
                for (const item of c.detalles) {
                    await connection.query(
                        `INSERT INTO detalles_cotizacion 
                        (id_producto, id_cotizacion, cantidad_producto, precio_unitario_cotizado) 
                        VALUES (?, ?, ?, ?)`,
                        [item.id_producto, id, item.cantidad_producto, item.precio_unitario_cotizado]
                    );
                }
            }
            await connection.commit();
            return { mensaje: 'Cotización actualizada correctamente' };

        } catch (error: any) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }
    static async cancelarCotizacion(id: number) {
        const [rows]: any = await pool.query('call CancelarCot(?)', [id]);
        return rows;
    }
    static async cotizacionesMensuales() {
        const query = `
            SELECT 
                COALESCE(SUM(CASE WHEN Estatus = 0 THEN 1 ELSE 0 END), 0) AS canceladas,
                COALESCE(SUM(CASE WHEN Estatus = 1 THEN 1 ELSE 0 END), 0) AS pendientes,
                COALESCE(SUM(CASE WHEN Estatus = 2 THEN 1 ELSE 0 END), 0) AS aceptadas,
                COUNT(*) AS total_mes
            FROM cotizaciones
            WHERE MONTH(fecha) = MONTH(CURRENT_DATE()) 
              AND YEAR(fecha) = YEAR(CURRENT_DATE());
        `;

        const [rows]: any = await pool.query(query);
        return rows[0];
    }
    static async obtenerCotizacionId(id: number) {
        const query = 'SELECT * FROM verDetallesCot WHERE id_cotizacion = ?';
        const [rows]: any = await pool.query(query, [id]);
        return rows;
    }
    static async BuscaryFiltrar( busqueda: string , estatus: number = -1,
        fecha: string | null = null, ordenTotal: string = '', pagina: number = 1, limite: number = 10) {
        const offset = (pagina - 1) * limite;
        const [rows]: any = await pool.query('CALL sp_buscar_filtrar_cotizaciones(?, ?, ?, ?, ?, ?)', [
            busqueda,
            estatus,
            fecha,
            ordenTotal,
            limite,
            offset
        ]);
        const cot = rows[0];
        const total = rows[1][0].total;
        return {
            cot: cot,
            total: total,
            paginas: Math.ceil(total / limite),
            paginaActual: pagina
        };
    }
    static async convertirAPedido(idCotizacion: number, idAsesor: number, fechaLimite: string) {
        const connection = await pool.getConnection();
        try {
            await connection.query(
                'CALL sp_convertir_cotizacion_pedido(?, ?, ?, @nuevo_pedido, @mensaje_res)',
                [idCotizacion, idAsesor, fechaLimite]
            );

            const [rows]: any = await connection.query('SELECT @nuevo_pedido AS id_pedido, @mensaje_res AS mensaje');
            const resultado = rows[0];
            if (resultado.id_pedido === -1) {
                throw new Error(resultado.mensaje);
            }

            return {
                id_pedido: resultado.id_pedido,
                mensaje: resultado.mensaje
            };

        } catch (error: any) {
            throw error;
        } finally {
            connection.release();
        }
    }
}