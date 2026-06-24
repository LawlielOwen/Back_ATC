import { Request, Response } from "express";
import { MetricaService } from '../Service/metricas';

export class MetricaController {
    
    // 1. Productos más vendidos (Top 5)
    static async getProductosTop(req: Request, res: Response) {
        try {
            const data = await MetricaService.obtenerProductosTop();
            res.status(200).json(data);
        } catch (error) {
            console.error('Error en getProductosTop:', error);
            res.status(500).json({ error: 'Error al obtener los productos más vendidos' });
        }
    }

    // 2. Productos menos vendidos (Bottom 5)
    static async getProductosMenosVendidos(req: Request, res: Response) {
        try {
            const data = await MetricaService.obtenerProductosMenosVendidos();
            res.status(200).json(data);
        } catch (error) {
            console.error('Error en getProductosMenosVendidos:', error);
            res.status(500).json({ error: 'Error al obtener los productos menos vendidos' });
        }
    }

    // 3. Tasa de conversión (Cotizado vs Vendido)
  static async getConversion(req: Request, res: Response) {
        try {
            const moneda = (req.query.moneda as string) || 'GLOBAL';
            const idCliente = req.query.id_cliente ? Number(req.query.id_cliente) : null; // Atrapamos el cliente
            
            const data = await MetricaService.getTasaConversion(moneda, idCliente);
            res.status(200).json(data);
        } catch (error) {
            console.error('Error:', error);
            res.status(500).json({ error: 'Error al obtener la conversión' });
        }
    }

   static async getProductosEstrella(req: Request, res: Response) {
        try {
            // Atrapamos el id_cliente de la URL si es que existe
            const idCliente = req.query.id_cliente ? Number(req.query.id_cliente) : null;
            
            // Se lo enviamos al servicio
            const data = await MetricaService.obtenerProductosEstrella(idCliente);
            
            res.status(200).json(data);
        } catch (error) {
            console.error('Error en getProductosEstrella:', error);
            res.status(500).json({ error: 'Error al obtener los productos estrella' });
        }
    }

static async getTendenciaCotizaciones(req: Request, res: Response) {
        try {
            const moneda = (req.query.moneda as string) || 'GLOBAL';
            const fechaInicio = (req.query.fecha_inicio as string) || null;
            const fechaFin = (req.query.fecha_fin as string) || null;
            
            const data = await MetricaService.obtenerTendenciaCotizaciones(moneda, fechaInicio, fechaFin);
            
            res.status(200).json(data);
        } catch (error) {
            console.error('Error en getTendenciaCotizaciones:', error);
            res.status(500).json({ error: 'Error al obtener la tendencia de cotizaciones' });
        }
    }
    // 6. Estadísticas Generales del Mes (KPIs Globales)
    static async getEstadisticasGenerales(req: Request, res: Response) {
        try {
            const data = await MetricaService.obtenerEstadisticasGenerales();
            res.status(200).json(data);
        } catch (error) {
            console.error('Error en getEstadisticasGenerales:', error);
            res.status(500).json({ error: 'Error al obtener las estadísticas generales del mes' });
        }
    }
}