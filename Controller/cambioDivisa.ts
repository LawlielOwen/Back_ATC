import axios from 'axios';
import { Request, Response } from 'express';
import dotenv from "dotenv";

dotenv.config();
export class CambioDivisaController {
    
    static async obtenerTipoCambio(req: Request, res: Response) {
        try {
            const token = process.env.KEY_TOKEN_BANXICO;
        
            const url = `https://www.banxico.org.mx/SieAPIRest/service/v1/series/SF43718/datos/oportuno`;

            const response = await axios.get(url, {
                headers: { 'Bmx-Token': token }
            });

            const tipoCambio = response.data.bmx.series[0].datos[0].dato;

            return res.status(200).json({ tipo_cambio: parseFloat(tipoCambio) });
        } catch (error) {
            console.error('Error al consultar Banxico:', error);
            return res.status(500).json({ error: 'No se pudo obtener el tipo de cambio' });
        }
    }
    
}