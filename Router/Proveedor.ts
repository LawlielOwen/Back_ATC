import { Router } from 'express';
import { ProveedorController } from '../Controller/ProveedorController'; // Asegúrate de que la ruta coincida con tu carpeta

const router = Router();


router.get('/pedidos', ProveedorController.consultarPedidos);
router.get('/pedidos/estadisticas', ProveedorController.getEstadisticasPedidos);
router.get('/pedidos/producto', ProveedorController.consultarProducto);
router.get('/pedidos/:id', ProveedorController.consultarDetallesPedido);
router.get('/pedidos/incidentes/:id', ProveedorController.consultarDetallesIncidente);
router.post('/pedidos', ProveedorController.registrarPedido);
router.put('/pedidos/recibir', ProveedorController.recibirPedido);
router.put('/pedidos/incidencia', ProveedorController.recibirPedidoIncidencia);

export default router;