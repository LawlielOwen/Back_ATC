import { Request, Response } from "express";
import { MovimientoService } from '../Service/Movimientos';

export class MovimientoController {
    static async getMovimientos(req: Request, res: Response) {
        try {
            const pagina = parseInt(req.query.pagina as string) || 1;
            const limite = parseInt(req.query.limite as string) || 10;
            const result = await MovimientoService.obtenerMov(pagina, limite);
            res.status(200).json(result);
        } catch (error: any) {
            console.error(error);
            res.status(500).json({ error: 'Error interno del servidor' });
        }
    }
    static async registrarSalida(req: Request, res: Response) {
        try {
            const { codigo, cantidad, destino, id_asesor, id_cliente } = req.body;
            if (!codigo || !cantidad || cantidad <= 0 || !destino) {
                return res.status(400).json({ error: 'Código, cantidad (mayor a 0) y destino son obligatorios' });
            }
            const destinoNormalizado = destino.toLowerCase() === 'pedido' ? 'Pedido' : 'Almacen';
            const result = await MovimientoService.registrarSalidaProducto(codigo, parseInt(cantidad), destinoNormalizado, parseInt(id_asesor), parseInt(id_cliente));

            res.status(200).json(result);
        } catch (error: any) {
            console.error(error);
            res.status(500).json({ error: 'Error interno del servidor' });
        }
    }
    static async getMensuales(req: Request, res: Response) {
        try {
            const result = await MovimientoService.estadisticaMensual();
            if (result) {
                res.status(200).json(result);
            } else {
                res.status(404).json({ error: 'Movimientos no encontrados' });
            }
        } catch (error: any) {
            console.error(error);
            res.status(500).json({ error: 'Error interno del servidor' });
        }
    }
    static async consultarMov(req: Request, res: Response) {
        try {
            const busqueda = req.query.busqueda as string || null;
            const tipo = req.query.tipo as string || null;
            const destino = req.query.destino as string || null;
            const fechaInicio = req.query.fechaInicio as string || null;
            const fechaFin = req.query.fechaFin as string || null;
            const pagina = parseInt(req.query.pagina as string) || 1;
            const limite = parseInt(req.query.limite as string) || 10;
            const result = await MovimientoService.consultarMov(busqueda, tipo, destino, fechaInicio, fechaFin, pagina, limite);
            res.status(200).json(result);
        } catch (error: any) {
            console.error(error);
            res.status(500).json({ error: 'Error interno del servidor' });
        }
    }
    static async getMovPorId(req: Request, res: Response) {
        try {
            const id = parseInt(req.params.id as string);
            const result = await MovimientoService.obtenerMovPorId(id);
            if (result) {
                res.status(200).json(result);
            } else {
                res.status(404).json({ error: 'Movimiento no encontrado' });
            }
        } catch (error: any) {
            console.error(error);
            res.status(500).json({ error: 'Error interno del servidor' });
        }
    }
}