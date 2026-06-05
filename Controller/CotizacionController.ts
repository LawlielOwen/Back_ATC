import { Request, Response } from 'express';
import { CotizacionService } from "../Service/Cotizaciones";

export class CotizacionController {
    static async obtenerCots(req: Request, res: Response) {
        try {
            const pagina = parseInt(req.query.pagina as string) || 1;
            const limite = parseInt(req.query.limite as string) || 10;
            const result = await CotizacionService.obtenerCotizaciones(pagina, limite);
            res.status(200).json(result);
        } catch (error: any) {
            console.error(error);
            res.status(500).json({ error: 'Error interno del servidor' });
        }
    }
    static async crearCotizacion(req: Request, res: Response) {
        try {
            const cotizacionData = req.body;
            if (!cotizacionData.detalles || cotizacionData.detalles.length === 0) {
                return res.status(400).json({ error: 'La cotización debe tener al menos un producto' });
            }
            const idNuevaCotizacion = await CotizacionService.guardarCotizacion(cotizacionData);
            res.status(200).json({
                mensaje: 'Cotización guardada con éxito',
                id_cotizacion: idNuevaCotizacion
            });

        } catch (error: any) {
            console.error('Error al crear la cotización:', error);
            res.status(500).json({ error: 'Error interno del servidor al guardar la cotización' });
        }
    }
    static async modificarCotizacion(req: Request, res: Response) {
        try {
            const idCotizacion = parseInt(req.params.id as string);
            const cotizacionData = req.body;
            if (!idCotizacion || isNaN(idCotizacion)) {
                return res.status(400).json({ error: 'ID de cotización inválido o no proporcionado' });
            }
            if (!cotizacionData.detalles || cotizacionData.detalles.length === 0) {
                return res.status(400).json({ error: 'La cotización debe tener al menos un producto' });
            }
            const resultado = await CotizacionService.modificarCotizacion(idCotizacion, cotizacionData);
            res.status(200).json(resultado);

        } catch (error: any) {
            console.error('Error al modificar la cotización:', error);
            res.status(500).json({ error: 'Error interno del servidor al modificar la cotización' });
        }
    }
    static async convertirCotizacion(req: Request, res: Response) {
        try {
            const idCotizacion = parseInt(req.params.id as string);
            const { id_asesor, fecha_limite } = req.body;
            if (!idCotizacion || isNaN(idCotizacion)) {
                return res.status(400).json({ error: 'ID de cotización inválido o no proporcionado' });
            }

            if (!id_asesor || !fecha_limite) {
                return res.status(400).json({ error: 'Faltan datos obligatorios: id_asesor, fecha_actual o fecha_limite' });
            }
            const resultado = await CotizacionService.convertirAPedido(
                idCotizacion,
                parseInt(id_asesor),
                fecha_limite
            );
            res.status(200).json(resultado);

        } catch (error: any) {
            console.error('Error al convertir cotización:', error);
            if (error.message && error.message.startsWith('Error:')) {
                return res.status(400).json({ error: error.message });
            }
            res.status(500).json({ error: 'Error interno del servidor al convertir la cotización' });
        }
    }
    static async cancelarCot(req: Request, res: Response) {
        const id = parseInt(req.params.id as string);
        try {
            const result = await CotizacionService.cancelarCotizacion(id);
            res.status(200).json(result);
        } catch (error: any) {
            console.error(error);
            res.status(500).json({ error: 'Error interno del servidor' });
        }
    }
    static async obtenerCotId(req: Request, res: Response){
         try {
            const id = parseInt(req.params.id as string);
            const result = await CotizacionService.obtenerCotizacionId(id);
            if (result) {
                res.status(200).json(result);
            } else {
                res.status(404).json({ error: 'Cotizacion no encontrada' });
            }
        } catch (error: any) {
            console.error(error);
            res.status(500).json({ error: 'Error interno del servidor' });
        }
    }
     static async contarCot(req: any, res: Response) {
        try {
            const result = await CotizacionService.cotizacionesMensuales();
            if (result) {
                res.status(200).json(result);
            } else {
                res.status(404).json({ error: 'Cotizaciones no encontradas' });
            }
        } catch (error: any) {
            console.error(error);
            res.status(500).json({ error: 'Error interno del servidor' });
        }
    }
  static async buscaryfiltrar(req: Request, res: Response) {
        try {
            const busqueda = (req.query.busqueda as string) || ''; 
            const estatus = req.query.estatus ? parseInt(req.query.estatus as string) : -1;         
            const fecha =  (req.query.fecha as string) || null;
            const ordenTotal = (req.query.ordenTotal as string) || '';            
            const pagina = parseInt(req.query.pagina as string) || 1;
            const limite = parseInt(req.query.limite as string) || 9;          
            const result = await CotizacionService.BuscaryFiltrar(busqueda, estatus, fecha, ordenTotal, pagina, limite);
            res.status(200).json(result);         
        } catch (error: any) {
            console.error(error);
            res.status(500).json({ error: 'Error interno del servidor' });
        }
    }
}