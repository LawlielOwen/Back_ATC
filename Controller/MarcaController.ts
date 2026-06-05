import { Request, Response } from "express";
import {MarcaService} from '../Service/Marcas';

export class MarcaController{
    static async getMarcas(req: Request, res: Response){
        try{
            const result = await MarcaService.obtenerMarcas();
            res.status(200).json(result);
        } catch(error: any){
            console.error(error);
            res.status(500).json({ error: 'Error interno en el servidor'});
        }
    }
}