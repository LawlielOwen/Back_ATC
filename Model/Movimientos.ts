export interface Movimiento {
  id: number;
  tipo_movimiento: 'Entrada' | 'Salida'; 
  destino: 'Almacen' | 'Pedido' | string;
  cantidad: number;
  fecha: Date | string; 
  id_producto: number;
  nombre_producto: string;
  Codigo_japon: string;
  Codigo_numeral: string;
  modelo_producto: string;
  marca_producto: string;
  id_asesor: number;
  nombre_asesor: string;
  id_cliente: number;
}