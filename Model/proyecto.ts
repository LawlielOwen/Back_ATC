export interface ProyectoSoporte {
  id_proyecto: number;
  nombre_proyecto: string;
  descripcion: string;
  fecha_alta: string; 
  fecha_termino: string | null;
  se_cotizo: number; 
  estatus: number;
  id_tecnico: number;
  nombre_tecnico: string;
  id_cliente: number | null;
  empresa_destino: string;

  materiales?: MaterialProyecto[];
  bitacora?: BitacoraProyecto[];
}

export interface MaterialProyecto {
  id_detalle: number;
  id_proyecto: number;
  cantidad: number;
  id_producto: number;
  nombre_producto: string;
  Codigo_japon: string | null;
  Codigo_numeral: string | null;
  marca_producto: string | null;
}

export interface BitacoraProyecto {
  id_bitacora: number;
  id_proyecto: number;
  fecha_registro: string;
  comentarios: string;
}