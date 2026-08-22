export interface ProductoRecepcion {
    id_producto: number;
    cantidad_buena: number; 
    Estatus: number;
  Tipo?: string; 
    cantidad_afectada?: number;
    Descripcion?: string;
}

export interface RecepcionPedidoPayload {
    id_pedido: number;
    id_asesor: number;
    productos: ProductoRecepcion[]; 
}