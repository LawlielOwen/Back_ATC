// middleware/upload.ts
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { Request } from 'express';

const recibosDir = path.join(process.cwd(), 'uploads/CSF');

if (!fs.existsSync(recibosDir)) {
    fs.mkdirSync(recibosDir, { recursive: true });
}

// 2. Configuración de almacenamiento
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, recibosDir); 
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, 'CSF-' + uniqueSuffix + ext);
    }
});

const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    if (file.mimetype === 'application/pdf') {
        cb(null, true); 
    } else {
        cb(new Error('FORMATO_INVALIDO: Solo se permiten archivos PDF reales.') as any, false);
    }
};

export const uploadRecibo = multer({ 
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024 
    }
});