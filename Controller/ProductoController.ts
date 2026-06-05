import { Request, Response } from "express";
import { ProductoService } from "../Service/Productos";

export class ProductoController {
    static async getProductos(req: Request, res: Response) {
        try {
            const pagina = parseInt(req.query.pagina as string) || 1;
            const limite = parseInt(req.query.limite as string) || 7;
            const result = await ProductoService.obtenerProductos(pagina, limite);
            res.status(200).json(result);
        } catch (error: any) {
            console.error(error);
            res.status(500).json({ error: 'Error interno del servidor' });
        }
    }
    static async getProductoPorId(req: Request, res: Response) {
        try {
            const id = parseInt(req.params.id as string);
            const result = await ProductoService.obtenerProductoPorId(id);
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
    static async agregarProducto(req: any, res: Response) {
        try {
            const producto = req.body;
            const result = await ProductoService.agregarProducto(producto);
            res.status(201).json(result);
        } catch (error: any) {
            console.error(error);
            res.status(500).json({ error: 'Error interno del servidor' });
        }
    }
    static async actualizarProducto(req: Request, res: Response) {
        try {
            const id = parseInt(req.params.id as string);
            const producto = req.body;
            const result = await ProductoService.modificarProducto(id, producto);
            res.status(200).json(result);
        } catch (error: any) {
            console.error(error);
            res.status(500).json({ error: 'Error interno del servidor' });
        }
    }
    static async eliminarProducto(req: Request, res: Response) {
        const id = parseInt(req.params.id as string);
        try {
            const result = await ProductoService.eliminarProducto(id);
            res.status(200).json(result);
        } catch (error: any) {
            console.error(error);
            res.status(500).json({ error: 'Error interno del servidor' });
        }
    }
    static async activarProducto(req: Request, res: Response) {
        const id = parseInt(req.params.id as string);
        try {
            const result = await ProductoService.activarProducto(id);
            res.status(200).json(result);
        } catch (error: any) {
            console.error(error);
            res.status(500).json({ error: 'Error interno del servidor' });
        }
    }
    static async buscaryfiltrarProductos(req: Request, res: Response) {
        try {
            const busqueda = req.query.busqueda as string || null;
            const estatus = req.query.estatus ? parseInt(req.query.estatus as string) : null;
            const marca = req.query.marca ? parseInt(req.query.marca as string) : null;
            const pagina = parseInt(req.query.pagina as string) || 1;
            const limite = parseInt(req.query.limite as string) || 9;
            const result = await ProductoService.buscaryfiltrarProducto(busqueda, estatus, marca, pagina, limite);
            res.status(200).json(result);
        } catch (error: any) {
            console.error(error);
            res.status(500).json({ error: 'Error interno del servidor' });
        }
    }
      static async contarProductos(req: any, res: Response) {
        try {
            const result = await ProductoService.countProductosStock();
            if (result) {
                res.status(200).json(result);
            } else {
                res.status(404).json({ error: 'Productos no encontrados' });
            }
        } catch (error: any) {
            console.error(error);
            res.status(500).json({ error: 'Error interno del servidor' });
        }
    }
    static async buscarProductoPorCodigo(req: Request, res: Response) {
        try {
            const codigo = req.params.codigo as string;
            const result = await ProductoService.buscarProductoPorCodigo(codigo);
        
            if (result) {
                res.status(200).json(result);
            } else {
                res.status(404).json({ error: 'Producto no encontrado con el código proporcionado' });
            }
        } catch (error: any) {
            console.error(error);
            res.status(500).json({ error: 'Error interno del servidor' });
        }
    }
static async registrarEntradaProducto(req: Request, res: Response) {
        try {
            const { codigo, cantidad, destino,id_asesor } = req.body;
            if (!codigo || !cantidad || cantidad <= 0 || !destino) {
                return res.status(400).json({ error: 'Código, cantidad (mayor a 0) y destino son obligatorios' });
            }
            const destinoNormalizado = destino.toLowerCase() === 'pedido' ? 'Pedido' : 'Almacen';
            const result = await ProductoService.registrarEntradaProducto(codigo, parseInt(cantidad), destinoNormalizado,parseInt(id_asesor));
            
            res.status(200).json(result);
        } catch (error: any) {
            console.error(error);
            res.status(500).json({ error: 'Error interno del servidor' });
        }
    }
}