import { Request, Response } from 'express';
import { NotificacionService } from '../Service/Notificaciones';

export class NotificacionController {

    static async getNotificaciones(req: Request, res: Response) {
        try {
            const id_asesor = parseInt(req.params.id as string);

            const leidas = req.query.leidas === 'true';

            if (isNaN(id_asesor)) {
                return res.status(400).json({ error: 'ID de asesor inválido' });
            }
            const notificaciones = await NotificacionService.obtenerNotificacionesPorUsuario(id_asesor, leidas);

            res.status(200).json({ notificaciones });

        } catch (error: any) {
            console.error('Error al obtener notificaciones:', error);
            res.status(500).json({ error: 'Error interno del servidor' });
        }
    }
    static async marcarLeidas(req: Request, res: Response) {
        try {
            const id_asesor = parseInt(req.params.id as string);
            if (isNaN(id_asesor)) return res.status(400).json({ error: 'ID inválido' });

            await NotificacionService.marcarNotificacionesLeidas(id_asesor);

            res.status(200).json({ mensaje: 'Notificaciones actualizadas' });
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Error interno' });
        }
    }
}