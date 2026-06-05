import { Request, Response } from "express";
import {AsesorService} from '../Service/asesor';

export class AsesorController {
    static async getAsesores(req: Request, res: Response){
        try{
            const result = await AsesorService.obtenerAsesores();
            res.status(200).json(result);
        } catch(error: any){
            console.error(error);
            res.status(500).json({ error: 'Error interno en el servidor'});
        }
    }
    static async getAsesoresROL(req: Request, res: Response) {
  try {
    const rol = req.query.rol as string;
    const asesores = await AsesorService.obtenerAsesoresRol(rol);
    res.json(asesores);
  } catch (error) {
    res.status(500).json({ message: 'Error en el servidor' });
  }
}
}