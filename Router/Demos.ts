import {Router} from 'express';
import {DemoController} from "../Controller/DemoController";
const router = Router();
router.get('/demos/buscar', DemoController.buscarDemoParaVisita);
router.get('/demos', DemoController.consultarDemos);
router.post('/demos', DemoController.agregarDemo);
router.post('/demos/entrada', DemoController.registrarEntrada);
router.put('/demos/:id', DemoController.modificarDemo);
router.delete('/demos/:id', DemoController.eliminarDemo);
router.put('/demos/:id/activar',DemoController.activarDemo);

export default router;