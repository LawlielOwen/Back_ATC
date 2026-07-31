export interface Ticket {
    id_ticket: number;
    url_ticket: string | null;
    id_asesor: number;
    nombre_asesor?: string; 
    id_cliente: number | null;
    nombre_cliente_oficial?: string | null; 
    nombre_prospecto: string | null;
    cliente_final?: string; 
    estatus: number; 
    venta_exitosa: number | null;
    cliente_registrado: number;
    comentarios: string | null;
    fecha_alta: Date | string;
    fecha_cierre: Date | string | null;
}