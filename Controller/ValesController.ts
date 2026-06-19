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
            // 1. Atrapamos el ID y el Rol desde la URL
            const id_asesor = req.query.id ? parseInt(req.query.id as string) : 0;
            const rol = req.query.rol ? req.query.rol as string : '';

            // 2. Se los pasamos a tu Servicio
            const result = await ValeService.contarVales(id_asesor, rol);
            
            if (result && result.length > 0) {
                // result[0] nos da el objeto limpio {pendientes: 2, aceptados: 5...}
                res.status(200).json(result[0]); 
            } else {
                res.status(404).json({ error: 'Vales no encontrados' });
            }
        } catch (error: any) {
            console.error(error);
            res.status(500).json({ error: 'Error interno del servidor' });
        }
    }
static async solicitarVale(req: Request, res: Response) {
        try {
            const { id_asesor, id_cliente, orden_compra, num_factura, productos } = req.body;
            if (!id_asesor || !id_cliente || !orden_compra || !productos) {
                return res.status(400).json({ error: 'Los campos son obligatorios' });
            }
            
            // 1. Guardar en Base de Datos
            const result = await ValeService.soliciarVale(id_asesor, id_cliente, orden_compra, num_factura, productos);
            
            // 2. WEBSOCKET: Avisar a los de Almacén y Administradores
            io.to('rol_Almacen').to('rol_Administrador').emit('nueva_notificacion', {
                titulo: 'Nueva Solicitud',
                mensaje: 'Se ha generado una nueva solicitud de vale de salida.'
            });
           io.to('rol_Almacen').to('rol_Administrador').emit('actualizar_tabla_vales');
            // 3. Responder al Asesor
            res.status(200).json(result);
        } catch (error: any) {
            console.error(error);
            res.status(500).json({ error: 'Error interno del servidor' });
        }
    }

    static async aceptaVale(req: Request, res: Response) {
        try {
            const { id, comentarios, id_asesor } = req.body; // <-- Pide el id_asesor desde Angular
            if (!id) {
                return res.status(400).json({ error: 'El ID del vale es obligatorio' });
            }
            
            // 1. Guardar en Base de Datos
            const result = await ValeService.aceptarVale(id, comentarios);
            
            // 2. WEBSOCKET: Avisar específicamente al Asesor que lo pidió
            if (id_asesor) {
                io.to(`usuario_${id_asesor}`).emit('nueva_notificacion', {
                    titulo: 'Vale Aceptado',
                    mensaje: `Tu vale VS-${id} ha sido autorizado.`
                });
                io.to(`usuario_${id_asesor}`).emit('actualizar_tabla_vales');
            }
           io.to('rol_Almacen').to('rol_Administrador').emit('actualizar_tabla_vales');
            // 3. Responder al Almacén
            res.status(200).json(result);

        } catch (error: any) {
            console.error(error);
            res.status(500).json({ error: 'Error interno del servidor' });
        }
    }

    static async rechazaVale(req: Request, res: Response) {
        try {
            const { id, comentarios, id_asesor } = req.body; // <-- Pide el id_asesor desde Angular
            if (!id) {
                return res.status(400).json({ error: 'El ID del vale es obligatorio' });
            }
            
            // 1. Guardar en Base de Datos
            const result = await ValeService.rechazarVale(id, comentarios);
            
            // 2. WEBSOCKET: Avisar específicamente al Asesor
            if (id_asesor) {
                io.to(`usuario_${id_asesor}`).emit('nueva_notificacion', {
                    titulo: 'Vale Rechazado',
                    mensaje: `Tu vale VS-${id} ha sido rechazado.`
                });
                io.to(`usuario_${id_asesor}`).emit('actualizar_tabla_vales');
            }
            io.to('rol_Almacen').to('rol_Administrador').emit('actualizar_tabla_vales');
            // 3. Responder al Almacén
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
    static async consultarProducto(req: Request, res: Response) {
        try {
            const codigo = req.query.codigo as string;
            if (!codigo) {
                return res.status(400).json({ error: 'El código del producto es obligatorio' });
            }
            const id_proveedor = req.query.proveedor ? parseInt(req.query.proveedor as string) : null;
            const result = await ValeService.consultarProducto(codigo, id_proveedor);
            if (result) {
                res.status(200).json(result);
            } else {
                res.status(404).json({ error: 'Producto no encontrado' });
            }
        } catch (error: any) {
            console.error(error);
            res.status(500).json({ error: 'Error interno del servidor' });
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
}