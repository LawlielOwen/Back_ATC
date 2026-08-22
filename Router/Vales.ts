import { Router } from 'express';
import { ValeController } from "../Controller/ValesController";
const router = Router();

router.get('/vales', ValeController.getVales);
router.get('/vales/count', ValeController.getEstadisticas);
router.get('/vales/buscar', ValeController.consultarVal);
router.get('/vales/pedidos/disponibles-vale', ValeController.pedidosDisponiblesVale);

router.get('/vales/visitas/disponibles-vale/:id_tecnico', ValeController.visitasDisponiblesVale);
router.post('/vales/demo', ValeController.solicitarValeDemo);
router.put('/vales/demo/aceptar', ValeController.aceptaValeDemo);

router.post('/vales', ValeController.solicitarVale);
router.put('/vales/aceptar', ValeController.aceptaVale);
router.put('/vales/rechazar', ValeController.rechazaVale);

router.get('/vales/:id', ValeController.getValePorId);

export default router;