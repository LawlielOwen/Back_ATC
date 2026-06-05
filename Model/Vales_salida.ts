
export interface ValeSalida {
  id?: number;
  folio_vale:string;
  id_asesor: number;
  nombre_asesor: string;
  id_cliente: number;
  nombre_cliente:string;
  fecha: Date | string;
  orden_compra: string;
  num_factura:string;
  comentario: string;
  alerta_enviada: number | boolean;
  detalles?: DetalleVale[]; 
  estatus: number;
}

export interface DetalleVale {
  id?: number;
  id_producto: number;
  id_vale: number;
  piezas: number;
}