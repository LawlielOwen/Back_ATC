import { Request, Response } from 'express';
import { VisitaDemoService } from '../Service/Visitas';

export class VisitaController {

    // 1. Consultar y filtrar visitas (con paginación y opción de filtrar por técnico)
    static async consultarVisitas(req: Request, res: Response) {
        try {
            const busqueda = req.query.busqueda ? String(req.query.busqueda) : null;
            const estatus = req.query.estatus !== undefined ? Number(req.query.estatus) : null;
            const id_tecnico = req.query.id_tecnico ? Number(req.query.id_tecnico) : null;
            const pagina = req.query.pagina ? Number(req.query.pagina) : 1;
            const limite = req.query.limite ? Number(req.query.limite) : 10;

            const resultado = await VisitaDemoService.consultarVisitas(busqueda, estatus, id_tecnico, pagina, limite);
            return res.status(200).json(resultado);
        } catch (error: any) {
            console.error('Error al consultar visitas:', error);
            return res.status(500).json({ error: 'Error interno del servidor al consultar las visitas.' });
        }
    }

    // 2. Obtener una visita específica por su ID (Datos generales)
    static async obtenerVisitaPorId(req: Request, res: Response) {
        try {
            const id = Number(req.params.id);

            if (isNaN(id)) {
                return res.status(400).json({ error: 'Se requiere un ID de visita válido.' });
            }

            const visita = await VisitaDemoService.obtenerVisitaPorId(id);

            if (!visita) {
                return res.status(404).json({ error: 'La visita especificada no existe.' });
            }

            return res.status(200).json(visita);
        } catch (error: any) {
            console.error('Error al obtener la visita:', error);
            return res.status(500).json({ error: 'Error interno del servidor al obtener la visita.' });
        }
    }

    // 3. Obtener los productos demo asociados a una visita
    static async obtenerDetallesVisita(req: Request, res: Response) {
        try {
            const id = Number(req.params.id);

            if (isNaN(id)) {
                return res.status(400).json({ error: 'Se requiere un ID de visita válido.' });
            }

            const detalles = await VisitaDemoService.obtenerDetallesVisita(id);
            return res.status(200).json(detalles);
        } catch (error: any) {
            console.error('Error al obtener los detalles de la visita:', error);
            return res.status(500).json({ error: 'Error interno del servidor al obtener los detalles.' });
        }
    }

    // 4. Crear/Programar la visita (El "Antes": fecha, técnico, asesor, cliente y demos)
    static async crearVisita(req: Request, res: Response) {
        try {
            const { fecha_visita, id_tecnico, id_asesor, id_cliente, empresa_no_registrada, demos } = req.body;

            if (!fecha_visita || !id_tecnico || !id_asesor) {
                return res.status(400).json({ error: 'Faltan datos obligatorios (fecha_visita, id_tecnico, id_asesor).' });
            }

            if (!demos || !Array.isArray(demos) || demos.length === 0) {
                return res.status(400).json({ error: 'Debe incluir al menos un producto demo para la visita.' });
            }

            const resultado = await VisitaDemoService.crearVisita({
                fecha_visita,
                id_tecnico: Number(id_tecnico),
                id_asesor: Number(id_asesor),
                id_cliente: id_cliente ? Number(id_cliente) : null,
                empresa_no_registrada: empresa_no_registrada || null,
                demos
            });

            return res.status(201).json({
                mensaje: 'Visita programada exitosamente',
                ...resultado
            });
        } catch (error: any) {
            console.error('Error al crear la visita:', error);
            return res.status(500).json({ error: 'Error interno del servidor al programar la visita.' });
        }
    }

    // 5. Completar la visita (El "Después": resumen de actividades y estatus de retorno de los equipos)
    static async completarVisita(req: Request, res: Response) {
        try {
            const id_visita = Number(req.params.id);
            const { resumen_actividades, retornos } = req.body;

            if (isNaN(id_visita)) {
                return res.status(400).json({ error: 'Se requiere un ID de visita válido.' });
            }

            if (!resumen_actividades) {
                return res.status(400).json({ error: 'El resumen de actividades es obligatorio para completar la visita.' });
            }

            const resultado = await VisitaDemoService.completarVisita(
                id_visita, 
                resumen_actividades, 
                retornos || []
            );

            return res.status(200).json({
                mensaje: 'Visita completada correctamente',
                resultado
            });
        } catch (error: any) {
            console.error('Error al completar la visita:', error);
            return res.status(500).json({ error: 'Error interno del servidor al completar la visita.' });
        }
    }

    // 6. Cancelar una visita
    static async cancelarVisita(req: Request, res: Response) {
        try {
            const id = Number(req.params.id);

            if (isNaN(id)) {
                return res.status(400).json({ error: 'Se requiere un ID de visita válido.' });
            }

            const resultado = await VisitaDemoService.cancelarVisita(id);
            return res.status(200).json({
                mensaje: 'Visita cancelada correctamente',
                resultado
            });
        } catch (error: any) {
            console.error('Error al cancelar la visita:', error);
            return res.status(500).json({ error: 'Error interno del servidor al cancelar la visita.' });
        }
    }
}