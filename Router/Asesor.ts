import {Router} from 'express';
import {AsesorController} from "../Controller/AsesorController"
const router = Router();

router.get('/asesores', AsesorController.getAsesores);
router.get('/asesores/rol', AsesorController.getAsesoresROL);


export default router;