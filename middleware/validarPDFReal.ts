import { Request, Response, NextFunction } from 'express';
import fs from 'fs';

const FIRMA_PDF = '%PDF-';

export function validarPDFReal(req: Request, res: Response, next: NextFunction) {
    if (!req.file) {
        return next();
    }

    try {
        const encabezado = req.file.path
            ? fs.readFileSync(req.file.path).subarray(0, 5)   
            : req.file.buffer.subarray(0, 5);                 

        const firma = encabezado.toString('ascii');

        if (firma !== FIRMA_PDF) {
            if (req.file.path && fs.existsSync(req.file.path)) {
                fs.unlinkSync(req.file.path); 
            }
            return res.status(400).json({ error: 'El archivo no es un PDF válido (falló la verificación de contenido).' });
        }

        next();
    } catch (error) {
        console.error('Error validando PDF:', error);
        return res.status(500).json({ error: 'No se pudo validar el archivo.' });
    }
}