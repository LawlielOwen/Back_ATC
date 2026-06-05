
import rateLimit from 'express-rate-limit';

export const limiter = rateLimit({
    windowMs: 10 * 60 * 1000, // 15 minutos
    max: 100, // Limita a 100 solicitudes por ventana
    message: "Se han realizado demasiadas solicitudes,porfavor intente de nuevo más tarde.",
    standardHeaders:true,
    legacyHeaders:false,
});
