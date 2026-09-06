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

        if (!cotizacionData.id_asesor) {
            return res.status(400).json({ error: 'El ID del asesor es obligatorio para generar la cotización.' });
        }

        if (!cotizacionData.detalles || cotizacionData.detalles.length === 0) {
            return res.status(400).json({ error: 'La cotización debe tener al menos un producto.' });
        }

        const resultado = await CotizacionService.guardarCotizacion(cotizacionData);

        res.status(200).json({
            mensaje: 'Cotización guardada con éxito',
            id_cotizacion: resultado.id,
            num_cotizacion: resultado.num_cotizacion
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
            const { orden_compra } = req.body;

            if (!idCotizacion || isNaN(idCotizacion)) {
                return res.status(400).json({ error: 'ID de cotización inválido o no proporcionado' });
            }
            if (!orden_compra || typeof orden_compra !== 'string') {
                return res.status(400).json({ error: 'El número de orden de compra es obligatorio y debe ser una cadena de texto' });
            }

            const usuario = req.usuario;
            const esCotizadorOAdmin = usuario?.Rol === 'Cotizador' || usuario?.Rol === 'Administrador';

            if (!esCotizadorOAdmin) {
                const cotizacionActual: any = await CotizacionService.obtenerCotizacionId(idCotizacion);
                if (!cotizacionActual) {
                    return res.status(404).json({ error: 'Cotización no encontrada' });
                }
                if (cotizacionActual.id_asesor !== usuario?.id) {
                    return res.status(403).json({ error: 'No tienes permiso para aceptar esta cotización.' });
                }
            }

            const resultado = await CotizacionService.convertirAPedido(idCotizacion, orden_compra);
            
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
            const usuario = req.usuario;
            const esCotizadorOAdmin = usuario?.Rol === 'Cotizador' || usuario?.Rol === 'Administrador';

            if (!esCotizadorOAdmin) {
                const cotizacionActual: any = await CotizacionService.obtenerCotizacionId(id);
                if (!cotizacionActual) {
                    return res.status(404).json({ error: 'Cotización no encontrada' });
                }
                if (cotizacionActual.id_asesor !== usuario?.id) {
                    return res.status(403).json({ error: 'No tienes permiso para cancelar esta cotización.' });
                }
            }

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
            
            const fechaInicio = (req.query.fechaInicio as string) || null;
            const fechaFin = (req.query.fechaFin as string) || null;
            
            const ordenTotal = (req.query.ordenTotal as string) || null;            
            const pagina = parseInt(req.query.pagina as string) || 1;
            const limite = parseInt(req.query.limite as string) || 9;

            const idAsesor = req.usuario?.id as number;
            const rol = req.usuario?.Rol as string;
            
            const result = await CotizacionService.BuscaryFiltrar(
                busqueda, 
                estatus, 
                fechaInicio, 
                fechaFin, 
                ordenTotal, 
                pagina, 
                limite,
                idAsesor,
                rol
            );
            
            res.status(200).json(result);         
        } catch (error: any) {
            console.error(error);
            res.status(500).json({ error: 'Error interno del servidor' });
        }
    }
    static async consultarProductoParaCotizacion(req: Request, res: Response) {
        try {
            const busqueda = req.query.busqueda as string;   
            if (!busqueda) {
                return res.status(400).json({ error: 'El término de búsqueda es obligatorio' });
            }      
            const id_proveedor = req.query.proveedor ? parseInt(req.query.proveedor as string) : null;   
            const resultados = await CotizacionService.buscarProductos(busqueda, id_proveedor);
            res.status(200).json({ 
                productos: resultados 
            });
            
        } catch (error: any) {
            console.error('Error al buscar productos para cotizar:', error);
            res.status(500).json({ error: 'Error interno del servidor al buscar el producto' });
        }
    }
   static async descargarPDF(req: Request, res: Response) {
    try {
        const idCotizacion: any = req.params.id;
        
        const pdfBuffer = await CotizacionService.generarPDFCotizacion(idCotizacion);

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="Cotizacion_${idCotizacion}.pdf"`);
        res.setHeader('Content-Length', pdfBuffer.length);

        res.end(pdfBuffer);
    } catch (error: any) {
        console.error('Error generando PDF:', error);
        res.status(500).json({ error: 'Error al generar el documento PDF' });
    }
}
static async vincularCliente(req: any, res: any) {
        try {
            const id_cotizacion = parseInt(req.params.id);
            const { id_cliente } = req.body; 

            if (isNaN(id_cotizacion)) {
                return res.status(400).json({ error: 'El ID de la cotización no es válido.' });
            }

            if (!id_cliente || isNaN(parseInt(id_cliente))) {
                return res.status(400).json({ error: 'Se requiere un ID de cliente válido para vincular.' });
            }

            const result = await CotizacionService.vincularCliente(id_cotizacion, parseInt(id_cliente));
            return res.status(200).json(result);

        } catch (error: any) {
            console.error('Error al vincular cliente a la cotización:', error);
            return res.status(500).json({ error: 'Error interno del servidor al vincular el cliente.' });
        }
    }
    
}