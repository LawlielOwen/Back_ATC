import { Request, Response } from "express";
import { ProveedorService } from "../Service/Proveedor";

export class ProveedorController {

    static async registrarPedido(req: Request, res: Response) {
    try {
        const { id_asesor, id_proveedor, fecha, productos } = req.body;

        const productosValidos = Array.isArray(productos) && productos.every((p: any) =>
            p.id_producto && p.cantidad > 0 && ['Almacen', 'Pedido'].includes(p.destino)
        );

        if (!id_asesor || !id_proveedor || !fecha || !productos || productos.length === 0 || !productosValidos) {
            return res.status(400).json({ 
                error: 'Todos los campos son obligatorios y cada producto debe incluir id_producto, cantidad y destino (Almacen o Pedido)' 
            });
        }

        const result = await ProveedorService.registrarPedido(id_asesor, id_proveedor, fecha, productos);
        res.status(200).json(result[0])
    } catch (error: any) {
        console.error('Error en registrarPedido:', error);
        res.status(500).json({ error: 'Error interno del servidor al registrar el pedido' });
    }
}

    static async recibirPedido(req: Request, res: Response) {
        try {
            const { id_pedido, id_asesor } = req.body;

            if (!id_pedido || !id_asesor) {
                return res.status(400).json({ error: 'El ID del pedido y del asesor son obligatorios' });
            }

            const result = await ProveedorService.recibirPedido(id_pedido, id_asesor);
            res.status(200).json(result[0]);
        } catch (error: any) {
            console.error('Error en recibirPedido:', error);
            res.status(500).json({ error: 'Error interno del servidor al procesar la recepción' });
        }
    }

    static async recibirPedidoIncidencia(req: Request, res: Response) {
        try {
            const { id_pedido, id_asesor, productos } = req.body;

            if (!id_pedido || !id_asesor || !productos || productos.length === 0) {
                return res.status(400).json({ error: 'Faltan datos obligatorios o la lista de productos está vacía' });
            }

            const result = await ProveedorService.recibirPedidoIncidencia(id_pedido, id_asesor, productos);
            res.status(200).json(result[0]);
        } catch (error: any) {
            console.error('Error en recibirPedidoIncidencia:', error);
            res.status(500).json({ error: 'Error interno del servidor al registrar las incidencias' });
        }
    }

    static async consultarPedidos(req: Request, res: Response) {
        try {
            const busqueda = req.query.busqueda as string || null;
            const id_proveedor = req.query.id_proveedor ? parseInt(req.query.id_proveedor as string) : null;
            const estatus = req.query.estatus !== undefined && req.query.estatus !== '' ? parseInt(req.query.estatus as string) : null;
            const fechaInicio = req.query.fechaInicio as string || null;
            const fechaFin = req.query.fechaFin as string || null;
            const pagina = parseInt(req.query.pagina as string) || 1;
            const limite = parseInt(req.query.limite as string) || 10;

            const result = await ProveedorService.consultarPedidos(busqueda, id_proveedor, estatus, fechaInicio, fechaFin, pagina, limite);
            res.status(200).json(result);
        } catch (error: any) {
            console.error('Error en consultarPedidos:', error);
            res.status(500).json({ error: 'Error interno del servidor al consultar los pedidos' });
        }
    }

    static async consultarDetallesPedido(req: Request, res: Response) {
        try {
            const id_pedido = parseInt(req.params.id as string);

            if (isNaN(id_pedido)) {
                return res.status(400).json({ error: 'ID de pedido inválido' });
            }

            const detalles = await ProveedorService.consultarDetallesPedido(id_pedido);
            res.status(200).json({ productos: detalles });
        } catch (error: any) {
            console.error('Error en consultarDetallesPedido:', error);
            res.status(500).json({ error: 'Error interno del servidor al obtener los detalles del pedido' });
        }
    }
    static async getEstadisticasPedidos(req: Request, res: Response) {
        try {
            const anio = req.query.anio ? parseInt(req.query.anio as string) : null;
            const result = await ProveedorService.obtenerEstadisticasPedidos(anio);
            res.status(200).json(result); 

        } catch (error: any) {
            console.error('Error en getEstadisticasPedidos:', error);
            res.status(500).json({ error: 'Error interno del servidor al obtener las estadísticas' });
        }
    }
    static async consultarDetallesIncidente(req: Request, res: Response) {
        try {
            const id_pedido = parseInt(req.params.id as string);

            if (isNaN(id_pedido)) {
                return res.status(400).json({ error: 'ID de pedido inválido' });
            }

            const detalles = await ProveedorService.consultarIncidentePedido(id_pedido);
            res.status(200).json({ productos: detalles });
        } catch (error: any) {
            console.error('Error en ', error);
            res.status(500).json({ error: 'Error interno del servidor al obtener los detalles del incidente' });
        }
    }
     static async consultarProducto(req: Request, res: Response) {
        try {
            const codigo = req.query.codigo as string;
            if (!codigo) {
                return res.status(400).json({ error: 'El código del producto es obligatorio' });
            }
            const id_proveedor = req.query.proveedor ? parseInt(req.query.proveedor as string) : null;
            const result = await ProveedorService.consultarProducto(codigo, id_proveedor);
            if (result) {
                res.status(200).json(result);
            } else {
                res.status(404).json({ error: 'Producto no encontrado' });
            }
        } catch (error: any) {
            console.error(error);
            res.status(500).json({ error: 'Error interno del servidor' });
        }
    }
    
}