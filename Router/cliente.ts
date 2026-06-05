import { Router } from 'express';
import multer from 'multer';
import { ClienteController } from '../Controller/ClienteController';

const router = Router();

const storageDisk = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/CSF/"); 
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});
const uploadDisk = multer({ storage: storageDisk });

const uploadMemory = multer({ storage: multer.memoryStorage() });

router.get('/clientes', ClienteController.getClientes);
router.get('/clientes/count', ClienteController.contarClientes);
router.get('/clientes/buscar', ClienteController.buscaryfiltrarClientes); 
router.get('/clientes/:id', ClienteController.getClientePorId);
router.post('/clientes/procesar-csf', uploadMemory.single('archivo'), ClienteController.procesarCSF);
router.post('/clientes', uploadDisk.single('archivo'), ClienteController.agregarCliente);
router.put('/clientes/:id', ClienteController.actualizarCliente);
router.delete('/clientes/:id', ClienteController.eliminarCliente);
router.put('/clientes/:id/activar', ClienteController.activarCliente);
export default router;