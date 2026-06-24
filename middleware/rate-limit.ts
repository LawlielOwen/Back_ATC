import rateLimit from 'express-rate-limit';

// 1. Límite Global Estándar (Para operaciones normales CRUD)
export const standardLimiter = rateLimit({
    windowMs: 10 * 60 * 1000, // 10 minutos
    max: 2000, // Lo subimos a 2000 pensando en múltiples usuarios bajo la misma IP de oficina
    message: "Se han realizado demasiadas solicitudes, por favor intente de nuevo más tarde.",
    standardHeaders: true,
    legacyHeaders: false,
});

// 2. Límite Ultra Estricto para Autenticación (Previene ataques de fuerza bruta)
export const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 15, // Solo 15 intentos de login por IP cada 15 minutos
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