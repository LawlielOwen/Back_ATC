import { Router } from 'express';
import { ProyectoController } from '../Controller/ProyectoController';

const router = Router();

router.get('/proyectos', ProyectoController.buscarProyectos);
router.post('/proyectos', ProyectoController.altaProyecto);
router.get('/proyectos/metricas/mes', ProyectoController.contarProyectosMes);
router.put('/proyectos/:id', ProyectoController.modificarProyecto);
router.post('/proyectos/:id/avances', ProyectoController.registrarAvance);
router.get('/proyectos/:id/materiales', ProyectoController.obtenerMateriales);
router.put('/proyectos/:id/finalizar', ProyectoController.finalizarProyecto);
router.get('/proyectos/:id/bitacora', ProyectoController.obtenerBitacora);
export default router;