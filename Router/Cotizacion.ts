import {Router} from 'express';
import {CotizacionController} from "../Controller/CotizacionController"
import { CambioDivisaController } from '../Controller/cambioDivisa';
import { verificarToken } from '../middleware/Auth.middleware '; 

const router = Router();
router.get('/tipo-cambio', CambioDivisaController.obtenerTipoCambio);
router.get('/cotizaciones/mensual', CotizacionController.contarCot);
router.get('/cotizaciones/productos', CotizacionController.consultarProductoParaCotizacion);
router.get('/cotizaciones', CotizacionController.buscaryfiltrar);
router.post('/cotizaciones', CotizacionController.crearCotizacion);
router.post('/cotizaciones/:id/convertir', CotizacionController.convertirCotizacion);
router.put('/cotizaciones/:id/vincular-cliente', CotizacionController.vincularCliente);
router.get('/cotizaciones/:id', CotizacionController.obtenerCotId);
router.put('/cotizaciones/:id', CotizacionController.modificarCotizacion);
router.delete('/cotizaciones/:id', CotizacionController.cancelarCot);
router.get('/cotizaciones/:id/pdf', CotizacionController.descargarPDF);
export default router;
