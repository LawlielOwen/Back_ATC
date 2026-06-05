import {Router} from 'express';
import {MarcaController} from "../Controller/MarcaController"
const router = Router();

router.get('/marcas', MarcaController.getMarcas);

export default router;