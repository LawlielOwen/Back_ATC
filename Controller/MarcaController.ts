import { Request, Response } from "express";
import { MarcaService } from '../Service/Marcas';

export class MarcaController {

    static async getMarcasActivas(req: Request, res: Response) {
        try {
            const busqueda = (req.query.busqueda as string) || null;
            const result = await MarcaService.obtenerMarcasActivas(busqueda);
            res.status(200).json(result);
        } catch (error: any) {
            console.error(error);
            res.status(500).json({ error: 'Error interno en el servidor' });
        }
    }

    static async getMarcasConConteos(req: Request, res: Response) {
        try {
            const busqueda = (req.query.busqueda as string) || null;
            const estatus = req.query.estatus !== undefined ? Number(req.query.estatus) : null;
            const limite = req.query.limite ? Number(req.query.limite) : 10;
            const pagina = req.query.pagina ? Number(req.query.pagina) : 1;
            const offset = (pagina - 1) * limite;

            const result = await MarcaService.obtenerMarcasConConteos(busqueda, estatus, limite, offset);
            res.status(200).json(result);
        } catch (error: any) {
            console.error(error);
            res.status(500).json({ error: 'Error interno en el servidor' });
        }
    }

    static async agregarMarca(req: Request, res: Response) {
        try {
            const { Nombre } = req.body;

            if (!Nombre || Nombre.trim() === '') {
                return res.status(400).json({ error: 'El nombre de la marca es obligatorio' });
            }

            const mensaje = await MarcaService.agregarMarca(Nombre.trim());
            res.status(201).json({ mensaje });
        } catch (error: any) {
            console.error(error);
            res.status(500).json({ error: 'Error interno en el servidor' });
        }
    }

    static async modificarMarca(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const { Nombre } = req.body;

            if (!Nombre || Nombre.trim() === '') {
                return res.status(400).json({ error: 'El nombre de la marca es obligatorio' });
            }

            const mensaje = await MarcaService.modificarMarca(Number(id), Nombre.trim());
            res.status(200).json({ mensaje });
        } catch (error: any) {
            console.error(error);
            res.status(500).json({ error: 'Error interno en el servidor' });
        }
    }

    static async eliminarMarca(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const mensaje = await MarcaService.eliminarMarca(Number(id));
            res.status(200).json({ mensaje });
        } catch (error: any) {
            console.error(error);
            res.status(500).json({ error: 'Error interno en el servidor' });
        }
    }

    static async activarMarca(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const mensaje = await MarcaService.activarMarca(Number(id));
            res.status(200).json({ mensaje });
        } catch (error: any) {
            console.error(error);
            res.status(500).json({ error: 'Error interno en el servidor' });
        }
    }
}