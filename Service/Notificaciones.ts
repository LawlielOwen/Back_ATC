import pool from '../Config/db';
import { notificaciones } from '../Model/notificaciones';

export class NotificacionService {
    static async obtenerNotificacionesPorUsuario(id_asesor: number, leidas: boolean = false) {
        const leida_filtro = leidas ? 1 : 0;

        const [rows]: any = await pool.query(
            'SELECT * FROM verNotificaciones WHERE id_asesor = ? AND leida = ? LIMIT 20',
            [id_asesor, leida_filtro]
        );
        return rows;
    }
    static async marcarNotificacionesLeidas(id_asesor: number) {
        await pool.query(
            'UPDATE notificaciones SET leida = 1 WHERE id_asesor = ? AND leida = 0',
            [id_asesor]
        );
    }
}