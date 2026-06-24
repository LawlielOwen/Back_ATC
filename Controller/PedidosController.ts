import { Request, Response } from 'express';
import { PedidoService } from "../Service/Pedidos"; // Asegúrate de que la ruta sea correcta
import fs from 'fs'; // Asegúrate de importar fs
import path from 'path'; 
export class PedidoController {

    // 1. Buscar, Filtrar y Paginar
 static async buscarYFiltrar(req: Request, res: Response) {
        try {
            const busqueda = (req.query.busqueda as string) || '';
            const estatus = req.query.estatus ? parseInt(req.query.estatus as string) : -1;
            
            // Extraemos las dos fechas
            const fechaInicio = (req.query.fechaInicio as string) || null;
            const fechaFin = (req.query.fechaFin as string) || null;
            
            const pagina = parseInt(req.query.pagina as string) || 1;
            const limite = parseInt(req.query.limite as string) || 10;

            const result = await PedidoService.buscarYFiltrar(
                busqueda, 
                estatus, 
                fechaInicio, 
                fechaFin, 
                pagina, 
                limite
            );

            return res.status(200).json(result);
        } catch (error: any) {
            console.error('Error en buscarYFiltrar pedidos:', error);
            return res.status(500).json({ error: 'Error interno del servidor al obtener los pedidos.' });
        }
    }

    // 2. Obtener Detalles del Pedido
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

            // 1. Validamos que Multer haya procesado el archivo
            if (!req.file) {
                return res.status(400).json({ error: 'No se ha detectado ningún archivo de factura para subir.' });
            }

            if (isNaN(id_pedido)) {
                // Borramos el archivo recién subido si el ID es inválido
                fs.unlinkSync(req.file.path); 
                return res.status(400).json({ error: 'El ID del pedido no es válido.' });
            }

            // 2. Extraemos los datos
            const nombre_factura = req.file.originalname; 
            const factura_ruta = req.file.path; // Multer ya nos da la ruta exacta

            // 3. Guardamos en DB y recuperamos la ruta vieja
            const { mensaje, ruta_anterior } = await PedidoService.subirFactura(id_pedido, nombre_factura, factura_ruta);

            // 4. SI EXISTE UNA FACTURA ANTERIOR, LA BORRAMOS DEL SERVIDOR
            if (ruta_anterior && ruta_anterior !== '') {
                const rutaAbsolutaAnterior = path.resolve(ruta_anterior);
                
                // Verificamos si el archivo viejo realmente existe antes de intentar borrarlo
                if (fs.existsSync(rutaAbsolutaAnterior)) {
                    fs.unlinkSync(rutaAbsolutaAnterior); // Esto lo elimina físicamente
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

            // Aquí atrapará si no hay stock o si falta la factura
            if (error.message && error.message.startsWith('Error:')) {
                return res.status(400).json({ error: error.message.replace('Error: ', '') });
            }

            return res.status(500).json({ error: 'Error interno del servidor al aceptar el pedido.' });
        }
    }
    // 6. Obtener Contadores / Estadísticas
    static async contarPedidos(req: Request, res: Response) {
        try {
            const estadisticas = await PedidoService.contarPedidos();
            return res.status(200).json(estadisticas);
        } catch (error: any) {
            console.error('Error en contarPedidos:', error);
            return res.status(500).json({ error: 'Error interno al obtener los contadores de pedidos.' });
        }
    }
}