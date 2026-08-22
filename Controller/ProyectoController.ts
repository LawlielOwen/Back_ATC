import { Request, Response } from 'express';
import { ProyectoService } from '../Service/Proyectos';

const TIPOS_EVENTO_VALIDOS = ['cambio_estatus', 'modificacion_material', 'comentario'];

export class ProyectoController {  
    // 1. Consultar proyectos (Tabla principal)
    static async buscarProyectos(req: Request, res: Response) {
        try {
            const busqueda = req.query.busqueda ? String(req.query.busqueda) : null;
            const estatus = req.query.estatus ? Number(req.query.estatus) : null;
            const pagina = req.query.pagina ? Number(req.query.pagina) : 1;
            const limite = req.query.limite ? Number(req.query.limite) : 10;

            const rol = (req as any).user?.rol || String(req.query.rol || '');
            const rawId = (req as any).user?.id || req.query.id_tecnico;
            const id_tecnico = rawId ? Number(rawId) : 0;
            if (rol !== 'Administrador' && (isNaN(id_tecnico) || id_tecnico === 0)) {
                return res.status(400).json({ error: 'No se pudo identificar al usuario (ID de técnico faltante).' });
            }

            const resultado = await ProyectoService.buscarProyectos(
                busqueda, 
                estatus, 
                id_tecnico, 
                rol, 
                pagina, 
                limite
            );

            return res.status(200).json(resultado);
            
        } catch (error: any) {
            console.error('Error al buscar los proyectos:', error);
            return res.status(500).json({ error: 'Error interno del servidor al obtener los proyectos.' });
        }
    }

    // 5. Obtener métrica de proyectos del mes
    static async contarProyectosMes(req: Request, res: Response) {
        try {
            const rol = (req as any).user?.rol || String(req.query.rol || '');
            
            const rawId = (req as any).user?.id || req.query.id_tecnico;
            const id_tecnico = rawId ? Number(rawId) : 0;

            if (rol !== 'Administrador' && (isNaN(id_tecnico) || id_tecnico === 0)) {
                return res.status(400).json({ error: 'No se pudo identificar al usuario.' });
            }

            const resultado = await ProyectoService.contarProyectosMes(id_tecnico, rol);

            return res.status(200).json(resultado);
            
        } catch (error: any) {
            console.error('Error al contar los proyectos del mes:', error);
            return res.status(500).json({ error: 'Error interno al obtener las métricas mensuales.' });
        }
    }

    // 2. Dar de alta un nuevo proyecto
 static async altaProyecto(req: Request, res: Response) {
        try {
            const { nombre_proyecto, descripcion, id_tecnico, id_cliente, empresa_no_registrada, materiales } = req.body;

            if (!nombre_proyecto || !nombre_proyecto.trim()) {
                return res.status(400).json({ error: 'El nombre del proyecto es obligatorio.' });
            }
            if (!descripcion || !descripcion.trim()) {
                return res.status(400).json({ error: 'La descripción del proyecto es obligatoria.' });
            }
            if (!id_tecnico || isNaN(Number(id_tecnico))) {
                return res.status(400).json({ error: 'El ID del técnico es obligatorio.' });
            }

            if (materiales && Array.isArray(materiales)) {
                const tieneManualesInvalidos = materiales.some(m => 
                    !m.id_producto && (!m.nombre_producto || String(m.nombre_producto).trim() === '')
                );
                
                if (tieneManualesInvalidos) {
                    return res.status(400).json({ error: 'Todos los materiales agregados manualmente deben tener al menos una descripción.' });
                }
            }

            const resultado = await ProyectoService.altaProyecto({
                nombre_proyecto: nombre_proyecto.trim(),
                descripcion: descripcion.trim(),
                id_tecnico: Number(id_tecnico),
                id_cliente: id_cliente ? Number(id_cliente) : null,
                empresa_no_registrada: empresa_no_registrada ? empresa_no_registrada.trim() : null,
                materiales: materiales || []
            });

            const mensajeSP = (resultado[0] && resultado[0].mensaje) ? resultado[0].mensaje : '';
            if (mensajeSP.startsWith('Error')) {
                return res.status(400).json({ error: mensajeSP });
            }

            return res.status(201).json({ 
                mensaje: 'Proyecto registrado exitosamente', 
                resultado 
            });

        } catch (error: any) {
            console.error('Error al registrar el proyecto:', error);
            return res.status(500).json({ error: 'Error interno del servidor al registrar el proyecto.' });
        }
    }

    // 3. Modificar proyecto (Datos principales y materiales)
    static async modificarProyecto(req: Request, res: Response) {
        try {
            const id_proyecto = Number(req.params.id);
            const { nombre_proyecto, descripcion, id_cliente, empresa_no_registrada, materiales, id_tecnico } = req.body;

            if (isNaN(id_proyecto)) {
                return res.status(400).json({ error: 'Se requiere un ID de proyecto válido.' });
            }
            if (!nombre_proyecto || !nombre_proyecto.trim()) {
                return res.status(400).json({ error: 'El nombre del proyecto no puede estar vacío.' });
            }
            if (!descripcion || !descripcion.trim()) {
                return res.status(400).json({ error: 'La descripción no puede estar vacía.' });
            }

            const resultado = await ProyectoService.modificarProyecto(id_proyecto, {
                nombre_proyecto: nombre_proyecto.trim(),
                descripcion: descripcion.trim(),
                id_tecnico: Number(id_tecnico),
                id_cliente: id_cliente ? Number(id_cliente) : null,
                empresa_no_registrada: empresa_no_registrada ? empresa_no_registrada.trim() : null,
                materiales: materiales || []
            });

            const mensajeSP = (resultado[0] && resultado[0].mensaje) ? resultado[0].mensaje : '';
            if (mensajeSP.startsWith('Error')) {
                return res.status(400).json({ error: mensajeSP });
            }

            return res.status(200).json({ 
                mensaje: 'Proyecto modificado exitosamente', 
                resultado 
            });

        } catch (error: any) {
            console.error('Error al modificar el proyecto:', error);
            return res.status(500).json({ error: 'Error interno del servidor al modificar el proyecto.' });
        }
    }

    // 4. Registrar avance en la bitácora
    static async registrarAvance(req: Request, res: Response) {
        try {
            const id_proyecto = Number(req.params.id);
            const { comentarios, nuevo_estatus, se_cotizo, tipo_evento } = req.body;

            if (isNaN(id_proyecto)) {
                return res.status(400).json({ error: 'Se requiere un ID de proyecto válido.' });
            }
            if (!comentarios || !comentarios.trim()) {
                return res.status(400).json({ error: 'Los comentarios son obligatorios para registrar un avance.' });
            }

            const id_usuario = (req as any).usuario?.id ? Number((req as any).usuario.id) : null;
            if (!id_usuario) {
                return res.status(401).json({ error: 'No se pudo identificar al asesor que registra el avance.' });
            }

       
            let tipoEventoFinal = tipo_evento ? String(tipo_evento) : (nuevo_estatus ? 'cambio_estatus' : 'comentario');
            if (!TIPOS_EVENTO_VALIDOS.includes(tipoEventoFinal)) {
                return res.status(400).json({ error: `tipo_evento inválido. Debe ser uno de: ${TIPOS_EVENTO_VALIDOS.join(', ')}` });
            }

            const resultado = await ProyectoService.registrarAvance(
                id_proyecto, 
                comentarios.trim(), 
                nuevo_estatus ? Number(nuevo_estatus) : null,
                se_cotizo ? Number(se_cotizo) : null,
                id_usuario,
                tipoEventoFinal
            );

            const mensajeSP = (resultado[0] && resultado[0].mensaje) ? resultado[0].mensaje : '';
            if (mensajeSP.startsWith('Error')) {
                return res.status(400).json({ error: mensajeSP });
            }

            return res.status(200).json({ 
                mensaje: 'Avance registrado correctamente en la bitácora', 
                resultado 
            });

        } catch (error: any) {
            console.error('Error al registrar avance:', error);
            return res.status(500).json({ error: 'Error interno del servidor al registrar el avance.' });
        }
    }
static async obtenerMateriales(req: Request, res: Response) {
        try {
            const id_proyecto = Number(req.params.id);
            if (isNaN(id_proyecto)) return res.status(400).json({ error: 'ID inválido' });

            const materiales = await ProyectoService.obtenerMateriales(id_proyecto);
            return res.status(200).json(materiales);
        } catch (error: any) {
            console.error('Error al obtener materiales:', error);
            return res.status(500).json({ error: 'Error interno al obtener materiales.' });
        }
    }
    static async finalizarProyecto(req: Request, res: Response) {
        try {
            const id_proyecto = Number(req.params.id);

            if (isNaN(id_proyecto)) {
                return res.status(400).json({ error: 'ID de proyecto inválido' });
            }

            const resultado = await ProyectoService.finalizarProyecto(id_proyecto);

            const mensajeSP = (resultado[0] && resultado[0].mensaje) ? resultado[0].mensaje : '';
            if (mensajeSP.startsWith('Error')) {
                return res.status(400).json({ error: mensajeSP });
            }

            return res.status(200).json({ mensaje: 'Proyecto finalizado correctamente', resultado });

        } catch (error: any) {
            console.error('Error al finalizar proyecto:', error);
            return res.status(500).json({ error: 'Error interno del servidor al finalizar el proyecto.' });
        }
    }
    static async obtenerBitacora(req: Request, res: Response) {
        try {
            const id_proyecto = Number(req.params.id);
            if (isNaN(id_proyecto)) return res.status(400).json({ error: 'ID inválido' });

            const bitacora = await ProyectoService.obtenerBitacora(id_proyecto);
            return res.status(200).json(bitacora);
        } catch (error: any) {
            console.error('Error al obtener bitácora:', error);
            return res.status(500).json({ error: 'Error interno al obtener bitácora.' });
        }
    }
}