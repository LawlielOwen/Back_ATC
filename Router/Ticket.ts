import { Router } from 'express';
import { TicketController } from '../Controller/TicketController';
import { verificarRol } from '../middleware/Authorize.middleware';


const router = Router();

router.get('/tickets', TicketController.buscarTickets);
router.get('/tickets/anual', TicketController.contarTicketsAnual);

router.post('/tickets', verificarRol('Administrador', 'Asesor'), TicketController.crearTicket);
router.patch('/tickets/:id/estatus', verificarRol('Administrador', 'Asesor'), TicketController.cambiarEstatus);
router.patch('/tickets/:id/cerrar', verificarRol('Administrador', 'Asesor'), TicketController.cerrarTicket);

router.put('/tickets/:id', verificarRol('Administrador'), TicketController.modificarTicket);

export default router;