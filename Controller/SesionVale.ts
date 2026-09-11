import { Request } from 'express';


export function obtenerIdSesionVale(req: Request): number | null {
    const usuario = (req as Request & { user?: { id?: number | string } }).user;
    const id = Number(usuario?.id);
    return Number.isSafeInteger(id) && id > 0 ? id : null;
}