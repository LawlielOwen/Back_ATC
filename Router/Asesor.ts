import { Router } from 'express';
import { AsesorController } from '../Controller/AsesorController';
import { verificarToken } from '../middleware/Auth.middleware ';
import { verificarRol } from '../middleware/Authorize.middleware';

const router = Router();


router.post('/asesores/registro', AsesorController.registroAsesor);


router.use(verificarToken);

router.get('/asesores', AsesorController.getAsesores);
router.get('/asesores/rol', AsesorController.getAsesoresROL);

router.get('/asesores/buscar', verificarRol('Administrador'), AsesorController.buscarAsesores);
router.get('/asesores/count', verificarRol('Administrador'), AsesorController.countAsesoresActivos);
router.post('/asesores', verificarRol('Administrador'), AsesorController.addAsesor);
router.put('/asesores/:id', verificarRol('Administrador'), AsesorController.updateAsesor);
router.delete('/asesores/:id', verificarRol('Administrador'), AsesorController.deleteAsesor);
router.put('/asesores/:id/consecutivo', verificarToken, AsesorController.actualizarConsecutivo);
router.get('/asesores/:id/verificar-folio', verificarToken, AsesorController.verificarFolio);
export default router;