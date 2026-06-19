
export interface Incidente {
    id?: number;
    id_pedido: number;
    id_producto: number;
    id_proveedor: number;
    id_asesor: number;
    Tipo: string;
    cantidad_afectada: number;
    Descripcion: string;
    Fecha_incidente?: string | Date; 
    nombre_producto?: string;
    nombre_proveedor?: string;
    nombre_asesor?: string;
}