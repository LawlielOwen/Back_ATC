import {Router} from 'express';
import {CotizacionController} from "../Controller/CotizacionController"
const router = Router();

router.get('/cotizaciones', CotizacionController.obtenerCots);
router.get('/cotizaciones/mensual', CotizacionController.contarCot);
router.get('/cotizaciones/buscar', CotizacionController.buscaryfiltrar);
router.post('/cotizaciones', CotizacionController.crearCotizacion);
router.post('/cotizaciones/:id/convertir', CotizacionController.convertirCotizacion);
router.get('/cotizaciones/:id', CotizacionController.obtenerCotId);
router.put('/cotizaciones', CotizacionController.modificarCotizacion);
router.delete('/cotizaciones', CotizacionController.cancelarCot);
export default router;
