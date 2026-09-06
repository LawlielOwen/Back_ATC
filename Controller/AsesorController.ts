import { Request, Response } from "express";
import { AsesorService } from '../Service/asesor';

export class AsesorController {
  static async getAsesores(req: Request, res: Response) {
    try {
      const result = await AsesorService.obtenerAsesores();
      res.status(200).json(result);
    } catch (error: any) {
      console.error(error);
      res.status(500).json({ error: 'Error interno en el servidor' });
    }
  }
  static async getAsesoresROL(req: Request, res: Response) {
    try {
      const rol = req.query.rol as string;
      const asesores = await AsesorService.obtenerAsesoresRol(rol);
      res.json(asesores);
    } catch (error) {
      res.status(500).json({ message: 'Error en el servidor' });
    }
  }
  static async addAsesor(req: Request, res: Response) {
    try {
      const asesor = req.body;
      const result = await AsesorService.agregarAsesor(asesor);
      
      res.status(201).json(result);
    } catch (error: any) {
      console.error('Error al agregar asesor:', error.message);
      res.status(400).json({ error: error.message || 'Error al intentar registrar el asesor' });
    }
  }

  static async updateAsesor(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id as string);
      const asesor = req.body;
      
      if (isNaN(id)) {
        return res.status(400).json({ error: 'ID de asesor inválido' });
      }

      const result = await AsesorService.modificarAsesor(id, asesor);
      res.status(200).json(result);
    } catch (error: any) {
      console.error('Error al modificar asesor:', error.message);
      res.status(400).json({ error: error.message || 'Error al intentar actualizar el asesor' });
    }
  }

  static async deleteAsesor(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id as string);
      
      if (isNaN(id)) {
        return res.status(400).json({ error: 'ID de asesor inválido' });
      }

      const result = await AsesorService.eliminarAsesor(id);
      res.status(200).json(result);
    } catch (error: any) {
      console.error('Error al eliminar asesor:', error.message);
      res.status(400).json({ error: error.message || 'Error al intentar eliminar el asesor' });
    }
  }

  static async buscarAsesores(req: Request, res: Response) {
    try {
      const pagina = Number(req.query.pagina) || 1;
      const limite = Number(req.query.limite) || 10;
      const offset = (pagina - 1) * limite;
      const busqueda = req.query.busqueda ? String(req.query.busqueda) : '';
      const estatus = req.query.estatus !== undefined ? Number(req.query.estatus) : -1;

      const resultado = await AsesorService.buscarAsesores(busqueda, estatus, limite, offset);

      const totalPaginas = Math.ceil(resultado.total / limite);

      res.status(200).json({
        a: resultado.a,
        total: resultado.total,
        paginas: totalPaginas,
        paginaActual: pagina
      });
    } catch (error: any) {
      console.error('Error al buscar asesores:', error);
      res.status(500).json({ error: 'Error interno en el servidor al buscar asesores' });
    }
  }
  static async countAsesoresActivos(req: Request, res: Response) {
    try {
      const total = await AsesorService.cantidadAsesoresActivos();
      
      res.status(200).json({ total: total });
    } catch (error: any) {
      console.error('Error al contar asesores activos:', error);
      res.status(500).json({ error: 'Error interno en el servidor al contar asesores' });
    }
  }
  static async registroAsesor (req: Request, res: Response) {
    try {
      const asesor = req.body;
      const result = await AsesorService.registroAsesor(asesor);
      
      res.status(201).json(result);
    } catch (error: any) {
      console.error('Error en el registro:', error.message);
      res.status(400).json({ error: error.message || 'Error al intentar el registro' });
    }
  }
  static async actualizarConsecutivo(req: Request, res: Response) {
        try {
            const idAsesor = parseInt(req.params.id as string);
            const consecutivo = parseInt(req.body.consecutivo);

            if (isNaN(idAsesor) || isNaN(consecutivo) || consecutivo < 1) {
                return res.status(400).json({ error: 'ID de asesor y un consecutivo válido son requeridos.' });
            }

            const actualizado = await AsesorService.actualizarConsecutivo(idAsesor, consecutivo);

            if (actualizado) {
                return res.status(200).json({ mensaje: 'Folio consecutivo actualizado correctamente.' });
            } else {
                return res.status(404).json({ error: 'Asesor no encontrado.' });
            }
        } catch (error: any) {AsesorService
            console.error('Error al actualizar el consecutivo:', error);
            return res.status(500).json({ error: 'Error interno del servidor.' });
        }
    }
    static async verificarFolio(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id as string);
      const numero = parseInt(req.query.numero as string);

      if (isNaN(id) || isNaN(numero) || numero < 1) {
        return res.status(400).json({ error: 'Parámetros inválidos.' });
      }

      const resultado = await AsesorService.verificarFolioExistente(id, numero);
      res.status(200).json(resultado);
    } catch (error: any) {
      console.error('Error al verificar folio:', error);
      res.status(500).json({ error: error.message || 'Error interno del servidor' });
    }
}
}