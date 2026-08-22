import {Router} from 'express';
import {VisitaController} from "../Controller/VisitaController";
const router = Router();

router.get('/visitas', VisitaController.consultarVisitas);
router.post('/visitas', VisitaController.crearVisita);
router.get('/visitas/:id', VisitaController.obtenerVisitaPorId);
router.get('/visitas/:id/detalles', VisitaController.obtenerDetallesVisita);
router.put('/visitas/:id', VisitaController.completarVisita);
router.delete('/visitas/:id', VisitaController.cancelarVisita);

export default router;

