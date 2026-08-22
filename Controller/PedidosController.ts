import { Request, Response } from 'express';
import { PedidoService } from "../Service/Pedidos";
import fs from 'fs';
import path from 'path'; 
export class PedidoController {

static async buscarYFiltrar(req: Request, res: Response) {
    try {
        const busqueda = (req.query.busqueda as string) || '';
        const estatus = req.query.estatus ? parseInt(req.query.estatus as string) : -1;
        
        const fechaInicio = (req.query.fechaInicio as string) || null;
        const fechaFin = (req.query.fechaFin as string) || null;
        
        const idAsesor = req.query.id_asesor ? parseInt(req.query.id_asesor as string) : null;
        
        const pagina = parseInt(req.query.pagina as string) || 1;
        const limite = parseInt(req.query.limite as string) || 10;

        const result = await PedidoService.buscarYFiltrar(
            busqueda, 
            estatus, 
            fechaInicio, 
            fechaFin, 
            idAsesor,          
            pagina, 
            limite
        );

        return res.status(200).json(result);
    } catch (error: any) {
        console.error('Error en buscarYFiltrar pedidos:', error);
        return res.status(500).json({ error: 'Error interno del servidor al obtener los pedidos.' });
    }
}

    static async obtenerDetalles(req: Request, res: Response) {
        try {
            const id_pedido = parseInt(req.params.id as string);
            if (isNaN(id_pedido)) {
                return res.status(400).json({ error: 'El ID del pedido no es válido.' });
            }

            const detalles = await PedidoService.obtenerDetallesPorId(id_pedido);
            return res.status(200).json(detalles);
        } catch (error: any) {
            console.error('Error en obtenerDetalles:', error);
            return res.status(500).json({ error: 'Error interno al cargar los detalles del pedido.' });
        }
    }

 // 3. Subir Factura Física
static async subirFactura(req: Request, res: Response) {
        try {
            const id_pedido = parseInt(req.params.id as string);

            if (!req.file) {
                return res.status(400).json({ error: 'No se ha detectado ningún archivo de factura para subir.' });
            }

            if (isNaN(id_pedido)) {
                fs.unlinkSync(req.file.path); 
                return res.status(400).json({ error: 'El ID del pedido no es válido.' });
            }

            const nombre_factura = req.file.originalname; 
 
            const factura_ruta = `uploads/recibos/${req.file.filename}`; 

            const { mensaje, ruta_anterior } = await PedidoService.subirFactura(id_pedido, nombre_factura, factura_ruta);

            if (ruta_anterior && ruta_anterior !== '') {

                const rutaAbsolutaAnterior = path.join(process.cwd(), ruta_anterior);
                
                if (fs.existsSync(rutaAbsolutaAnterior)) {
                    fs.unlinkSync(rutaAbsolutaAnterior);
                }
            }

            return res.status(200).json({ mensaje, ruta: factura_ruta });

        } catch (error: any) {
            console.error('Error en subirFactura:', error);

            if (req.file && fs.existsSync(req.file.path)) {
                fs.unlinkSync(req.file.path);
            }

            if (error.message && error.message.includes('FORMATO_INVALIDO')) {
                return res.status(400).json({ error: 'Solo se permite subir archivos PDF.' });
            }
            if (error.message === 'File too large') {
                 return res.status(400).json({ error: 'El archivo es demasiado grande. El máximo es 5MB.' });
            }

            if (error.message && error.message.startsWith('Error:')) {
                return res.status(400).json({ error: error.message.replace('Error: ', '') });
            }

            return res.status(500).json({ error: 'Error interno del servidor al procesar la factura.' });
        }
    }

    // 4. Cancelar Pedido
    static async cancelarPedido(req: Request, res: Response) {
        try {
            const id_pedido = parseInt(req.params.id as string);
            if (isNaN(id_pedido)) {
                return res.status(400).json({ error: 'El ID del pedido no es válido.' });
            }

            const mensaje = await PedidoService.cancelarPedido(id_pedido);
            return res.status(200).json({ mensaje });

        } catch (error: any) {
            console.error('Error en cancelarPedido:', error);

            if (error.message && error.message.startsWith('Error:')) {
                return res.status(400).json({ error: error.message.replace('Error: ', '') });
            }

            return res.status(500).json({ error: 'Error interno del servidor al cancelar el pedido.' });
        }
    }

    // 5. Aceptar Pedido (Validando Stock)
    static async aceptarPedido(req: Request, res: Response) {
        try {
            const id_pedido = parseInt(req.params.id as string);
            if (isNaN(id_pedido)) {
                return res.status(400).json({ error: 'El ID del pedido no es válido.' });
            }

            const mensaje = await PedidoService.aceptarPedido(id_pedido);
            return res.status(200).json({ mensaje });

        } catch (error: any) {
            console.error('Error en aceptarPedido:', error);

            if (error.message && error.message.startsWith('Error:')) {
                return res.status(400).json({ error: error.message.replace('Error: ', '') });
            }

            return res.status(500).json({ error: 'Error interno del servidor al aceptar el pedido.' });
        }
    }
    static async contarPedidos(req: Request, res: Response) {
        try {
            const estadisticas = await PedidoService.contarPedidos();
            return res.status(200).json(estadisticas);
        } catch (error: any) {
            console.error('Error en contarPedidos:', error);
            return res.status(500).json({ error: 'Error interno al obtener los contadores de pedidos.' });
        }
    }
    static async pagarConCredito(req: Request, res: Response) {
        try {
            const id_pedido = parseInt(req.params.id as string);

            if (isNaN(id_pedido)) {
                return res.status(400).json({ error: 'Se requiere un ID de pedido válido.' });
            }

            const mensaje = await PedidoService.pagarPedidoConCredito(id_pedido);

            const mensajeMinusculas = mensaje.toLowerCase();
            if (
                mensajeMinusculas.includes('error') || 
                mensajeMinusculas.includes('insuficiente') || 
                mensajeMinusculas.includes('no tiene') ||
                mensajeMinusculas.includes('procesado anteriormente')
            ) {
                return res.status(400).json({ error: mensaje });
            }

            return res.status(200).json({ mensaje: mensaje });

        } catch (error: any) {
            console.error('Error en el controlador al pagar pedido con crédito:', error);
            return res.status(500).json({ error: 'Error interno del servidor al procesar el pago con crédito.' });
        }
    }
}