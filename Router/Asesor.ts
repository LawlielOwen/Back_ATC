import {Router} from 'express';
import {AsesorController} from "../Controller/AsesorController"
const router = Router();

router.get('/asesores', AsesorController.getAsesores);
router.post('/asesores/registro', AsesorController.registroAsesor);
router.get('/asesores/count', AsesorController.countAsesoresActivos);
router.get('/asesores/rol', AsesorController.getAsesoresROL);
router.get('/asesores/buscar', AsesorController.buscarAsesores);
router.post('/asesores', AsesorController.addAsesor);
router.put('/asesores/:id', AsesorController.updateAsesor);
router.delete('/asesores/:id', AsesorController.deleteAsesor);

export default router;