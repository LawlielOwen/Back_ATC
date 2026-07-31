import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET as string;


export interface UsuarioAutenticado {
  id: number;
  Nombre: string;
  app: string;
  apm: string;
  telefono: string;
  usuario: string;
  Rol: string;
  Correo: string;
}

declare global {
  namespace Express {
    interface Request {
      usuario?: UsuarioAutenticado;
    }
  }
}


export function verificarToken(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No se proporcionó un token de autenticación.' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const payload = jwt.verify(token, JWT_SECRET) as UsuarioAutenticado;
    req.usuario = payload;
    next();
  } catch (error) {
    console.error('Token inválido o expirado:', error);
    return res.status(401).json({ error: 'Token inválido o expirado.' });
  }
}