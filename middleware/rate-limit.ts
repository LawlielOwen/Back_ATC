import rateLimit from 'express-rate-limit';

// 1. Límite Global Estándar
export const standardLimiter = rateLimit({
    windowMs: 10 * 60 * 1000, 
    max: 2000,
    message: "Se han realizado demasiadas solicitudes, por favor intente de nuevo más tarde.",
    standardHeaders: true,
    legacyHeaders: false,
});

// 2. Límite Ultra Estricto para Autenticación 
export const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 200, 
    message: "Demasiados intentos de inicio de sesión, cuenta bloqueada temporalmente.",
    standardHeaders: true,
    legacyHeaders: false,
});

export const searchLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, 
    max: 400,
    message: "Velocidad de consulta excedida. Espera un momento.",
    standardHeaders: true,
    legacyHeaders: false,
});