import { Router } from 'express';
import { PedidoController } from '../Controller/PedidosController'; 
import { uploadRecibo } from '../middleware/multerRecibos'; 

const router = Router();

router.get('/pedido', PedidoController.buscarYFiltrar);
router.get('/pedido/estadisticas', PedidoController.contarPedidos);
router.get('/pedido/:id', PedidoController.obtenerDetalles);


router.post('/pedido/:id/factura', uploadRecibo.single('factura'), PedidoController.subirFactura);

router.post('/pedido/:id/aceptar', PedidoController.aceptarPedido);

router.post('/pedido/:id/cancelar', PedidoController.cancelarPedido);
router.post('/pedido/:id/pagar-credito', PedidoController.pagarConCredito);
export default router;