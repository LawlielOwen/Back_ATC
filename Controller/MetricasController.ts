import { Request, Response } from "express";
import { MetricaService } from '../Service/metricas';

export class MetricaController {
    
    private static obtenerIdFiltro(req: Request): number | null {
        const usuario = (req as any).usuario;
        
        if (usuario && usuario.Rol === 'Asesor') {
            return usuario.id;
        }
      
        return null; 
    }

 // 1. Productos más vendidos (Top 5)
static async getProductosTop(req: Request, res: Response) {
    try {
        const idAsesorFiltro = MetricaController.obtenerIdFiltro(req);
        const meses = req.query.meses ? Number(req.query.meses) : 3;
        const data = await MetricaService.obtenerProductosTop(idAsesorFiltro, meses);
        res.status(200).json(data);
    } catch (error) {
        console.error('Error en getProductosTop:', error);
        res.status(500).json({ error: 'Error al obtener los productos más vendidos' });
    }
}

// 2. Productos menos vendidos (Bottom 5)
static async getProductosMenosVendidos(req: Request, res: Response) {
    try {
        const idAsesorFiltro = MetricaController.obtenerIdFiltro(req);
        const meses = req.query.meses ? Number(req.query.meses) : 3;
        const data = await MetricaService.obtenerProductosMenosVendidos(idAsesorFiltro, meses);
        res.status(200).json(data);
    } catch (error) {
        console.error('Error en getProductosMenosVendidos:', error);
        res.status(500).json({ error: 'Error al obtener los productos menos vendidos' });
    }
}

    // 3. Tasa de conversión (Cotizado vs Vendido)
    static async getConversion(req: Request, res: Response) {
        try {
            const idAsesorFiltro = MetricaController.obtenerIdFiltro(req);
            const moneda = (req.query.moneda as string) || 'GLOBAL';
            const idCliente = req.query.id_cliente ? Number(req.query.id_cliente) : null; 
            
            const data = await MetricaService.getTasaConversion(moneda, idCliente, idAsesorFiltro);
            res.status(200).json(data);
        } catch (error) {
            console.error('Error:', error);
            res.status(500).json({ error: 'Error al obtener la conversión' });
        }
    }

    // 4. Productos Estrella
    static async getProductosEstrella(req: Request, res: Response) {
        try {
            const idAsesorFiltro = MetricaController.obtenerIdFiltro(req);
            const idCliente = req.query.id_cliente ? Number(req.query.id_cliente) : null;
            
            const data = await MetricaService.obtenerProductosEstrella(idCliente, idAsesorFiltro);
            res.status(200).json(data);
        } catch (error) {
            console.error('Error en getProductosEstrella:', error);
            res.status(500).json({ error: 'Error al obtener los productos estrella' });
        }
    }

    // 5. Tendencia de Cotizaciones
    static async getTendenciaCotizaciones(req: Request, res: Response) {
        try {
            const idAsesorFiltro = MetricaController.obtenerIdFiltro(req);
            const moneda = (req.query.moneda as string) || 'GLOBAL';
            const fechaInicio = (req.query.fecha_inicio as string) || null;
            const fechaFin = (req.query.fecha_fin as string) || null;
            
            const data = await MetricaService.obtenerTendenciaCotizaciones(moneda, fechaInicio, fechaFin, idAsesorFiltro);
            res.status(200).json(data);
        } catch (error) {
            console.error('Error en getTendenciaCotizaciones:', error);
            res.status(500).json({ error: 'Error al obtener la tendencia de cotizaciones' });
        }
    }

    // 6. Estadísticas Generales del Mes (KPIs Globales)
    static async getEstadisticasGenerales(req: Request, res: Response) {
        try {
            const idAsesorFiltro = MetricaController.obtenerIdFiltro(req);
            const data = await MetricaService.obtenerEstadisticasGenerales(idAsesorFiltro);
            res.status(200).json(data);
        } catch (error) {
            console.error('Error en getEstadisticasGenerales:', error);
            res.status(500).json({ error: 'Error al obtener las estadísticas generales del mes' });
        }
    }
}