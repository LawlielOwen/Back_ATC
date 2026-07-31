import {Router} from 'express';
import {ValeController} from "../Controller/ValesController";
const router = Router();

router.get('/vales', ValeController.getVales);
router.get('/vales/count', ValeController.getEstadisticas);
router.get('/vales/buscar', ValeController.consultarVal);
router.get('/vales/pedidos/disponibles-vale', ValeController.pedidosDisponiblesVale);
router.post('/vales', ValeController.solicitarVale);
router.put('/vales/aceptar', ValeController.aceptaVale);
router.put('/vales/rechazar', ValeController.rechazaVale);
router.get('/vales/:id', ValeController.getValePorId);


export default router;
