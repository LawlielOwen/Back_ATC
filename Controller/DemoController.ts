import { Request, Response } from 'express';
import { DemoService } from '../Service/demos';

export class DemoController {

    // 1. Consultar y filtrar con paginación
    static async consultarDemos(req: Request, res: Response) {
        try {
            const busqueda = req.query.busqueda ? String(req.query.busqueda) : null;
            const estatus = req.query.estatus !== undefined ? Number(req.query.estatus) : null;
            const marca = req.query.marca !== undefined ? Number(req.query.marca) : null;
            const pagina = req.query.pagina ? Number(req.query.pagina) : 1;
            const limite = req.query.limite ? Number(req.query.limite) : 10;

            const resultado = await DemoService.consultarDemos(busqueda, estatus, marca, pagina, limite);
            return res.status(200).json(resultado);
        } catch (error: any) {
            console.error('Error al consultar demos:', error);
            return res.status(500).json({ error: 'Error interno del servidor al consultar los demos.' });
        }
    }

    // 2. Agregar un nuevo equipo demo
    static async agregarDemo(req: Request, res: Response) {
        try {
            const { nombre_modelo, descripcion, numero_serie, id_marca, stock } = req.body;

            if (!nombre_modelo) {
                return res.status(400).json({ error: 'El nombre o modelo del demo es obligatorio.' });
            }

            const resultado = await DemoService.agregarDemo({
                nombre_modelo,
                descripcion,
                numero_serie,
                id_marca: Number(id_marca),
                stock: Number(stock) || 0
            });

            return res.status(201).json({ 
                mensaje: 'Demo agregado exitosamente', 
                resultado 
            });
        } catch (error: any) {
            console.error('Error al agregar demo:', error);
            return res.status(500).json({ error: 'Error interno del servidor al agregar el demo.' });
        }
    }

    // 3. Modificar un demo existente
    static async modificarDemo(req: Request, res: Response) {
        try {
            const id = Number(req.params.id);
            const { nombre_modelo, descripcion, numero_serie, id_marca, stock } = req.body;

            if (isNaN(id)) {
                return res.status(400).json({ error: 'Se requiere un ID de demo válido.' });
            }

            const resultado = await DemoService.modificarDemo(id, {
                nombre_modelo,
                descripcion,
                numero_serie,
                id_marca: Number(id_marca),
                stock: Number(stock) || 0
            });

            return res.status(200).json({ 
                mensaje: 'Demo actualizado exitosamente', 
                resultado 
            });
        } catch (error: any) {
            console.error('Error al modificar demo:', error);
            return res.status(500).json({ error: 'Error interno del servidor al modificar el demo.' });
        }
    }

    // 4. Dar de baja un demo (Estatus 0)
    static async eliminarDemo(req: Request, res: Response) {
        try {
            const id = Number(req.params.id);

            if (isNaN(id)) {
                return res.status(400).json({ error: 'Se requiere un ID de demo válido.' });
            }

            const resultado = await DemoService.eliminarDemo(id);
            return res.status(200).json({ 
                mensaje: 'Demo dado de baja correctamente', 
                resultado 
            });
        } catch (error: any) {
            console.error('Error al eliminar demo:', error);
            return res.status(500).json({ error: 'Error interno del servidor al dar de baja el demo.' });
        }
    }

    // 5. Reactivar un demo
    static async activarDemo(req: Request, res: Response) {
        try {
            const id = Number(req.params.id);

            if (isNaN(id)) {
                return res.status(400).json({ error: 'Se requiere un ID de demo válido.' });
            }

            const resultado = await DemoService.activarDemo(id);
            return res.status(200).json({ 
                mensaje: 'Demo activado correctamente', 
                resultado 
            });
        } catch (error: any) {
            console.error('Error al activar demo:', error);
            return res.status(500).json({ error: 'Error interno del servidor al activar el demo.' });
        }
    }
    // Buscar demos para autocompletado en el modal de visitas
    static async buscarDemoParaVisita(req: Request, res: Response) {
        try {
            const busqueda = req.query.busqueda ? String(req.query.busqueda) : '';
            const id_marca = req.query.id_marca ? Number(req.query.id_marca) : null; 

            if (!busqueda.trim()) {
                return res.status(200).json([]);
            }

            const resultados = await DemoService.buscarDemoParaVisita(busqueda, id_marca);
            return res.status(200).json(resultados);
            
        } catch (error: any) {
            console.error('Error al buscar demos para la visita:', error);
            return res.status(500).json({ error: 'Error interno del servidor al buscar equipos demo.' });
        }
    }
    // Registrar entrada de stock (Suma de inventario a demos)
    static async registrarEntrada(req: Request, res: Response) {
        try {
            const { codigo, cantidad, id_asesor } = req.body;

            if (!codigo || codigo.trim() === '') {
                return res.status(400).json({ error: 'El código (número de serie o modelo) es obligatorio.' });
            }

            if (!cantidad || isNaN(cantidad) || cantidad <= 0) {
                return res.status(400).json({ error: 'La cantidad debe ser un número mayor a cero.' });
            }

            if (!id_asesor || isNaN(id_asesor)) {
                return res.status(400).json({ error: 'El ID del asesor responsable es obligatorio.' });
            }

            const resultado = await DemoService.registrarEntrada(
                codigo.trim(), 
                Number(cantidad), 
                Number(id_asesor)
            );

            const mensajeSP = (resultado[0] && resultado[0].mensaje) ? resultado[0].mensaje : '';
            if (mensajeSP.startsWith('Error')) {
                return res.status(400).json({ error: mensajeSP });
            }

            return res.status(200).json({ 
                mensaje: 'Entrada registrada correctamente', 
                resultado 
            });

        } catch (error: any) {
            console.error('Error al registrar entrada de demo:', error);
            return res.status(500).json({ error: 'Error interno del servidor al registrar la entrada del demo.' });
        }
    }
}