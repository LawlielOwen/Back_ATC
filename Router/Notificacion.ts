import { Router } from 'express';
import { NotificacionController } from '../Controller/NotificacionController';

const router = Router();
router.put('/notificaciones/leer-todas/:id', NotificacionController.marcarLeidas);
router.get('/notificaciones/:id', NotificacionController.getNotificaciones);

export default router;