import {Router} from 'express';
import {MovimientoController} from "../Controller/MovimientosController";
const router = Router();

router.get('/movimientos', MovimientoController.getMovimientos);
router.get('/movimientos/count', MovimientoController.getMensuales);
router.get('/movimientos/buscar', MovimientoController.consultarMov);
router.post('/movimientos/salida', MovimientoController.registrarSalida);
router.get('/movimientos/:id', MovimientoController.getMovPorId);

export default router;

