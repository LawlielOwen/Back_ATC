import {Router} from 'express';
import {ProductoController} from "../Controller/ProductoController"
const router = Router();

router.get('/productos',ProductoController.getProductos);
router.get('/productos/count',ProductoController.contarProductos);
router.get('/productos/buscar',ProductoController.buscaryfiltrarProductos);
router.get('/productos/codigo/:codigo', ProductoController.buscarProductoPorCodigo);
router.post('/productos/entrada', ProductoController.registrarEntradaProducto)
router.post('/productos',ProductoController.agregarProducto);
router.get('/productos/:id',ProductoController.getProductoPorId);
router.delete('/productos/:id',ProductoController.eliminarProducto);
router.put('/productos/:id',ProductoController.actualizarProducto);
router.put('/productos/:id/activar',ProductoController.activarProducto);

export default router;

