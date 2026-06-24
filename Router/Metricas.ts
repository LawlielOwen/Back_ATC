import { Router } from 'express';
import { MetricaController } from '../Controller/MetricasController';

const router = Router();

router.get('/metricas/top-productos', MetricaController.getProductosTop);
router.get('/metricas/bottom-productos', MetricaController.getProductosMenosVendidos);
router.get('/metricas/tasa-conversion', MetricaController.getConversion);
router.get('/metricas/productos-estrella', MetricaController.getProductosEstrella);
router.get('/metricas/tendencia-cotizaciones', MetricaController.getTendenciaCotizaciones);
router.get('/metricas/estadisticas-generales', MetricaController.getEstadisticasGenerales);
export default router;