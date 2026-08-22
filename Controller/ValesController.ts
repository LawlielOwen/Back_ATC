import { Request, Response } from "express";
import { ValeService } from "../Service/Vales";
import { io } from '../server'
export class ValeController {
    static async getVales(req: Request, res: Response) {
        try {
            const pagina = parseInt(req.query.pagina as string) || 1;
            const limite = parseInt(req.query.limite as string) || 10;
            const result = await ValeService.obtenerVal(pagina, limite);
            res.status(200).json(result);
        } catch (error: any) {
            console.error(error);
            res.status(500).json({ error: 'Error interno del servidor' });
        }
    }
  static async getEstadisticas(req: Request, res: Response) {
        try {
            const id_asesor = req.query.id ? parseInt(req.query.id as string) : 0;
            const rol = req.query.rol ? req.query.rol as string : '';

            const result = await ValeService.contarVales(id_asesor, rol);
            
            if (result && result.length > 0) {
                res.status(200).json(result[0]); 
            } else {
                res.status(404).json({ error: 'Vales no encontrados' });
            }
        } catch (error: any) {
            console.error(error);
            res.status(500).json({ error: 'Error interno del servidor' });
        }
    }
static async solicitarVale(req: any, res: any) {
        try {
            const { id_asesor, id_cliente, id_pedido, productos } = req.body;
            
            if (!id_asesor || !id_cliente || !id_pedido || !productos) {
                return res.status(400).json({ error: 'Los campos de asesor, cliente, pedido y productos son obligatorios' });
            }
            
            const result = await ValeService.solicitarVale(id_asesor, id_cliente, id_pedido, productos);
            
            io.to('rol_Almacen').to('rol_Administrador').emit('nueva_notificacion', {
                titulo: 'Nueva Solicitud',
                mensaje: 'Se ha generado una nueva solicitud de vale de salida.'
            });
            io.to('rol_Almacen').to('rol_Administrador').emit('actualizar_tabla_vales');
            
            return res.status(200).json(result);
            
        } catch (error: any) {
            console.error(error);
            return res.status(500).json({ error: 'Error interno del servidor al crear el vale' });
        }
    }
    static async aceptaVale(req: Request, res: Response) {
        try {
            const { id, comentarios, id_asesor } = req.body; 
            if (!id) {
                return res.status(400).json({ error: 'El ID del vale es obligatorio' });
            }
            
            const result = await ValeService.aceptarVale(id, comentarios);
            
            if (id_asesor) {
                io.to(`usuario_${id_asesor}`).emit('nueva_notificacion', {
                    titulo: 'Vale Aceptado',
                    mensaje: `Tu vale VS-${id} ha sido autorizado.`
                });
                io.to(`usuario_${id_asesor}`).emit('actualizar_tabla_vales');
            }
           io.to('rol_Almacen').to('rol_Administrador').emit('actualizar_tabla_vales');
            res.status(200).json(result);

        } catch (error: any) {
            console.error(error);
            res.status(500).json({ error: 'Error interno del servidor' });
        }
    }

    static async rechazaVale(req: Request, res: Response) {
        try {
            const { id, comentarios, id_asesor } = req.body; 
            if (!id) {
                return res.status(400).json({ error: 'El ID del vale es obligatorio' });
            }
            
            const result = await ValeService.rechazarVale(id, comentarios);
            
            if (id_asesor) {
                io.to(`usuario_${id_asesor}`).emit('nueva_notificacion', {
                    titulo: 'Vale Rechazado',
                    mensaje: `Tu vale VS-${id} ha sido rechazado.`
                });
                io.to(`usuario_${id_asesor}`).emit('actualizar_tabla_vales');
            }
            io.to('rol_Almacen').to('rol_Administrador').emit('actualizar_tabla_vales');
            res.status(200).json(result);
        } catch (error: any) {
            console.error(error);
            res.status(500).json({ error: 'Error interno del servidor' });
        }
    }
  
    static async consultarVal(req: Request, res: Response) {
        try {
            const id_asesor = req.query.id_asesor ? parseInt(req.query.id_asesor as string) : null;
            const busqueda = req.query.busqueda as string || null;
            const estatus = req.query.estatus ? parseInt(req.query.estatus as string) : null;
            const fechaInicio = req.query.fechaInicio as string || null;
            const fechaFin = req.query.fechaFin as string || null;
            const pagina = parseInt(req.query.pagina as string) || 1;
            const limite = parseInt(req.query.limite as string) || 10;
            const result = await ValeService.consultarVale(id_asesor, busqueda, estatus, fechaInicio, fechaFin, pagina, limite);
            res.status(200).json(result);
        } catch (error: any) {
            console.error(error);
            res.status(500).json({ error: 'Error interno del servidor' });
        }
    }
static async pedidosDisponiblesVale(req: any, res: any) {
    try {
        const id_asesor = parseInt(req.query.id_asesor);
        
        const rol = req.query.rol ? String(req.query.rol).toLowerCase().trim() : '';

        if (isNaN(id_asesor)) {
            return res.status(400).json({ error: 'Se requiere un id_asesor válido.' });
        }
        
        const pedidos = await ValeService.pedidosDisponiblesVale(id_asesor, rol);
        
        return res.status(200).json(pedidos);
    } catch (error: any) {
        console.error('Error al listar pedidos disponibles para vale:', error);
        return res.status(500).json({ error: 'Error interno del servidor.' });
    }
}
    static async getValePorId(req: Request, res: Response) {
        try {
            const id = parseInt(req.params.id as string);
            if (isNaN(id)) {
                return res.status(400).json({ error: 'ID de vale inválido' });
            }
            
            const productos = await ValeService.obtenerDetallesVale(id);
            res.status(200).json({ productos });
        } catch (error: any) {
            console.error(error);
            res.status(500).json({ error: 'Error interno del servidor' });
        }
    }

   static async solicitarValeDemo(req: any, res: any) {
        try {
            const { id_asesor, id_cliente, empresa_no_registrada, id_visita, productos } = req.body;
            
            if (!id_asesor || !id_visita || !productos) {
                return res.status(400).json({ error: 'El asesor, la visita y los equipos son obligatorios' });
            }
            
            const result = await ValeService.solicitarValeDemo(id_asesor, id_cliente, empresa_no_registrada, id_visita, productos);
            
            io.to('rol_Almacen').to('rol_Administrador').emit('nueva_notificacion', {
                titulo: 'Nueva Solicitud Demo',
                mensaje: 'Se ha generado una nueva solicitud de vale para demostración.'
            });
            io.to('rol_Almacen').to('rol_Administrador').emit('actualizar_tabla_vales');
            
            return res.status(200).json(result);
            
        } catch (error: any) {
            console.error('Error al solicitar vale demo:', error);
            return res.status(500).json({ error: 'Error interno del servidor al crear el vale de demostración' });
        }
    }

  static async aceptaValeDemo(req: Request, res: Response) {
        try {
            const { id, comentarios, id_asesor } = req.body;
            
            if (!id) {
                return res.status(400).json({ error: 'El ID del vale es obligatorio' });
            }
            
            const result: any = await ValeService.aceptarValeDemo(id, comentarios);
            const mensaje = (result[0] && result[0][0]) ? result[0][0].mensaje : (result.mensaje || '');

            if (typeof mensaje === 'string' && mensaje.startsWith('Error')) {
                return res.status(400).json({ error: mensaje });
            }
            
            if (id_asesor) {
                io.to(`usuario_${id_asesor}`).emit('nueva_notificacion', {
                    titulo: 'Vale Demo Autorizado',
                    mensaje: `Tu vale para demostración VS-${id} ha sido autorizado y los equipos apartados.`
                });
                io.to(`usuario_${id_asesor}`).emit('actualizar_tabla_vales');
            }
            io.to('rol_Almacen').to('rol_Administrador').emit('actualizar_tabla_vales');
            
            res.status(200).json({ mensaje: mensaje, data: result });

        } catch (error: any) {
            console.error('Error al aceptar vale demo:', error);
            res.status(500).json({ error: 'Error interno del servidor al autorizar el vale demo' });
        }
    }
    static async visitasDisponiblesVale(req: any, res: any) {
        try {
            const { id_tecnico } = req.params;

            if (!id_tecnico) {
                return res.status(400).json({ error: 'El ID del técnico es obligatorio' });
            }

            const result = await ValeService.visitasDisponiblesVale(Number(id_tecnico));
            
            return res.status(200).json(result);

        } catch (error: any) {
            console.error('Error al obtener visitas disponibles para vale demo:', error);
            return res.status(500).json({ error: 'Error interno del servidor al cargar las visitas' });
        }
    }
}