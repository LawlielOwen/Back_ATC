
export interface ValeSalida {
  id?: number;
  id_asesor: number;
  nombre_asesor:string;
  id_cliente: number;
  nombre_cliente:string;
  fecha: Date | string;
  orden_compra: string;
  folio_vale:string;
  num_factura:string;
  alerta_enviada: number | boolean;
  estatus:number;
  comentario: string;
  tipo_vale?: string;
  detalles?: DetalleVale[]; 
}

export interface DetalleVale {
  id?: number;
  id_producto: number;
  id_vale: number;
  piezas: number;
}