import { Request, Response } from 'express';
import { ExcelService } from '../Service/excel';

export class ExcelController {
  static async reporteInventario(req: Request, res: Response) {
    try {
      const archivo = await ExcelService.generarReporteInventario();

      const fecha = new Date().toISOString().substring(0, 10);
      const nombreArchivo = `Reporte_Inventario_${fecha}.xlsx`;

      res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      );

      res.setHeader(
        'Content-Disposition',
        `attachment; filename="${nombreArchivo}"`
      );

      res.setHeader(
        'Content-Length',
        archivo.length
      );

      return res.status(200).send(archivo);

    } catch (error: any) {
      console.error(
        'Error al generar reporte de inventario:',
        error
      );

      return res.status(500).json({
        error: 'No se pudo generar el reporte de inventario.'
      });
    }
  }
}