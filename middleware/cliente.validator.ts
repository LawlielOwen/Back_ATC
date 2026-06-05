import { body } from 'express-validator';

export const reglasValidacionCliente = [
    body('Nombre')
        .trim()
        .escape()
        .notEmpty().withMessage('El nombre es obligatorio')
        .isString().withMessage('El nombre debe ser texto'),
        
    body('RFC')
        .trim()
        .toUpperCase()
        .notEmpty().withMessage('El RFC es obligatorio')
        .isLength({ min: 12, max: 13 }).withMessage('El RFC debe tener entre 12 y 13 caracteres'),
        
    body('correo')
        .trim()
        .isEmail().withMessage('Debe ser un correo válido')
        .normalizeEmail(),

    body('id_asesor')
        .optional() 
        .isInt().withMessage('El ID del asesor debe ser un número entero')
];