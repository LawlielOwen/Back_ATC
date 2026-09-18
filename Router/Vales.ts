import { Router } from 'express';
import { ValeController } from '../Controller/ValesController';

const router = Router();

router.get('/vales', ValeController.getVales);
router.get('/vales/count', ValeController.getEstadisticas);
router.get('/vales/buscar', ValeController.consultarVal);
router.get('/vales/pedidos/disponibles-vale', ValeController.pedidosDisponiblesVale);
router.get('/vales/folios-asesores', ValeController.listarFoliosAsesores);
router.get('/vales/folios-asesores/:idAsesor', ValeController.obtenerFolioAsesor);
router.put('/vales/folios-asesores/:idAsesor',  ValeController.actualizarFolioAsesor);
router.get('/vales/verificar-folio', ValeController.verificarFolioVale);
router.get('/vales/cotizaciones/disponibles-vale', ValeController.cotizacionesDisponiblesVale);
router.get('/vales/cotizaciones/:id_cotizacion/productos', ValeController.productosCotizacionVale);
router.post('/vales/cotizaciones', ValeController.solicitarValeDesdeCotizacion);

router.get('/vales/visitas/disponibles-vale/:id_tecnico', ValeController.visitasDisponiblesVale);
router.post('/vales/demo', ValeController.solicitarValeDemo);
router.put('/vales/demo/aceptar', ValeController.aceptaValeDemo);
router.post('/vales', ValeController.solicitarVale);
router.post('/vales/aceptar', ValeController.aceptaVale);
router.put('/vales/rechazar', ValeController.rechazaVale);
router.get('/vales/:id', ValeController.getValePorId);
router.get('/vales/:id/pdf', ValeController.descargarPDF);
export default router;