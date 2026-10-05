import {Router} from 'express';
import {ProductoController} from "../Controller/ProductoController"
const router = Router();

router.get('/productos',ProductoController.getProductos);
router.get('/productos/count',ProductoController.contarProductos);
router.get('/productos/buscar',ProductoController.buscaryfiltrarProductos);

router.get('/productos/codigo', ProductoController.buscarProductoPorCodigo);
router.get('/productos/ubicaciones/estanterias',ProductoController.obtenerEstanterias);
router.get('/productos/ubicaciones/cajas',ProductoController.obtenerCajas);
router.get('/productos/ubicaciones/admin',ProductoController.consultarUbicaciones);
router.post('/productos/ubicaciones/estanterias',ProductoController.agregarEstanteria);
router.delete('/productos/ubicaciones/estanterias/:id',ProductoController.desactivarEstanteria);
router.post('/productos/ubicaciones/cajas',ProductoController.agregarCaja);
router.delete('/productos/ubicaciones/cajas/:id',ProductoController.desactivarCaja);
router.post('/productos/entrada', ProductoController.registrarEntradaProducto)
router.post('/productos',ProductoController.agregarProducto);
router.get('/productos/:id',ProductoController.getProductoPorId);
router.delete('/productos/:id',ProductoController.eliminarProducto);
router.put('/productos/:id',ProductoController.actualizarProducto);
router.put('/productos/:id/activar',ProductoController.activarProducto);

export default router;