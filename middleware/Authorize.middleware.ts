import { Request, Response, NextFunction } from 'express';


export function verificarRol(...rolesPermitidos: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const rolUsuario = req.usuario?.Rol;

    if (!rolUsuario || !rolesPermitidos.includes(rolUsuario)) {
      return res.status(403).json({ error: 'No tienes permisos para realizar esta acción.' });
    }

    next();
  };
}