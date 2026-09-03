import { Router } from 'express';
import { MarcaController } from "../Controller/MarcaController";
const router = Router();

router.get('/marcas/activas', MarcaController.getMarcasActivas);

router.get('/marcas', MarcaController.getMarcasConConteos);

router.post('/marcas', MarcaController.agregarMarca);
router.put('/marcas/:id', MarcaController.modificarMarca);
router.patch('/marcas/:id/eliminar', MarcaController.eliminarMarca);
router.patch('/marcas/:id/activar', MarcaController.activarMarca);

export default router;