import { Router } from 'express';
import multer from 'multer';
import { ClienteController } from '../Controller/ClienteController';
import fs from 'fs';
import path from 'path';
const router = Router();

// Ajusta los '../' según tu estructura
const csfDir = path.join(process.cwd(), 'uploads/CSF');

if (!fs.existsSync(csfDir)) {
    fs.mkdirSync(csfDir, { recursive: true });
}

// 2. Configuración de almacenamiento en Disco
const storageDisk = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, csfDir); 
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, 'csf-' + uniqueSuffix + ext); 
  }
});

const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    if (file.mimetype === 'application/pdf') {
        cb(null, true);
    } else {
        cb(new Error('FORMATO_INVALIDO: Solo se permiten archivos PDF para la CSF.') as any, false);
    }
};

const limits = { fileSize: 5 * 1024 * 1024 }; // 5 MB

// 5. Instancias de Multer Blindadas
const uploadDisk = multer({ storage: storageDisk, fileFilter: fileFilter, limits: limits });
const uploadMemory = multer({ storage: multer.memoryStorage(), fileFilter: fileFilter, limits: limits });

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