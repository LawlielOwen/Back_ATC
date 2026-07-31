import { Request, Response } from "express";
import { TicketService } from "../Service/ticket";

export class TicketController {
    

    static async crearTicket(req: Request, res: Response) {
        try {
        
            if (!req.body.id_asesor) {
                return res.status(400).json({ error: 'El ID del asesor es obligatorio para asignar el ticket.' });
            }

            const resultado = await TicketService.crearTicket(req.body);
            res.status(201).json(resultado);
        } catch (error: any) {
            console.error('Error al crear ticket:', error);
            res.status(500).json({ error: 'Error interno del servidor al crear el ticket.' });
        }
    }


    static async modificarTicket(req: Request, res: Response) {
        try {
            const idTicket = parseInt(req.params.id as string);
            
            if (isNaN(idTicket)) {
                return res.status(400).json({ error: 'ID de ticket inválido.' });
            }

            const resultado = await TicketService.modificarTicket(idTicket, req.body);
            res.status(200).json(resultado);
        } catch (error: any) {
            console.error('Error al modificar ticket:', error);
            if (error.message && error.message.startsWith('Error:')) {
                return res.status(400).json({ error: error.message });
            }
            res.status(500).json({ error: 'Error interno al modificar el ticket.' });
        }
    }

    static async cambiarEstatus(req: Request, res: Response) {
        try {
            const idTicket = parseInt(req.params.id as string);
            const { nuevo_estatus } = req.body;

            if (isNaN(idTicket) || !nuevo_estatus) {
                return res.status(400).json({ error: 'ID de ticket y el nuevo estatus son obligatorios.' });
            }

            const resultado = await TicketService.cambiarEstatus(idTicket, nuevo_estatus);
            res.status(200).json(resultado);
        } catch (error: any) {
            console.error('Error al cambiar estatus del ticket:', error);
            if (error.message && error.message.startsWith('Error:')) {
                return res.status(400).json({ error: error.message });
            }
            res.status(500).json({ error: 'Error interno al cambiar el estatus.' });
        }
    }

 
    static async cerrarTicket(req: Request, res: Response) {
        try {
            const idTicket = parseInt(req.params.id as string);
            
            const { venta_exitosa, cliente_registrado } = req.body;

            if (isNaN(idTicket) || venta_exitosa === undefined || cliente_registrado === undefined) {
                return res.status(400).json({ error: 'Faltan datos obligatorios para cerrar el ticket (Venta y Registro).' });
            }

            const resultado = await TicketService.cerrarTicket(idTicket, req.body);
            res.status(200).json(resultado);
        } catch (error: any) {
            console.error('Error al cerrar el ticket:', error);
            if (error.message && error.message.startsWith('Error:')) {
                return res.status(400).json({ error: error.message });
            }
            res.status(500).json({ error: 'Error interno al cerrar el ticket.' });
        }
    }

   static async buscarTickets(req: Request, res: Response) {
  try {
        const { busqueda, estatus, idAsesor, pagina, limite } = req.query;

        // 2. Los convertimos al tipo correcto, asegurándonos de atrapar idAsesor
        const textoBusqueda = busqueda as string || '';
        const estatusNum = parseInt(estatus as string) || 0;
        
        // ESTA ES LA LÍNEA CRÍTICA: Si no lo lees aquí, el SP recibe 0
        const idAsesorNum = parseInt(idAsesor as string) || 0; 
        
        const paginaNum = parseInt(pagina as string) || 1;
        const limiteNum = parseInt(limite as string) || 10;

        // 3. Se lo pasamos a tu servicio
        const resultado = await TicketService.buscarTickets(
            textoBusqueda, 
            estatusNum, 
            idAsesorNum,
            paginaNum, 
            limiteNum
        );

        res.status(200).json(resultado);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al buscar tickets' });
    }
}
    static async contarTicketsAnual(req: Request, res: Response) {
        try {
            const resultado = await TicketService.contarTicketsAnual();
            res.status(200).json(resultado);
        } catch (error: any) {
            console.error('Error al contar los tickets anuales:', error);
            res.status(500).json({ error: 'Error interno al obtener el conteo de tickets anuales.' });
        }
    }
}