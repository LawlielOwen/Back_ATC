
export interface Cotizacion {
    id: number;
    num_cotizacion: string;
    fecha: string;
    Estatus: number;
    id_cliente?: number | null;
    nombre_cliente_final: string; 
    rfc_cliente?: string | null;
    extra_descripcion?: string;
    tipo_cambio: number;
    subtotal: number;
    iva: number;
    total: number;
    nombre_prospecto: string;
    total_tipos_productos: number;
    total_piezas: number;
    vigencia_dias: number;
    moneda: string;
    ciudad_destino: string;
    contacto: string;
}

export interface DetalleCotizacion {
    id_detalle: number;
    id_cotizacion: number;
    id_producto: number;
    Codigo_japon: string;
    Codigo_numeral: string;
    nombre_producto: string;
    modelo_producto: string;
    marca_producto: string;
    cantidad_producto: number;
    precio_unitario_cotizado: number;
    subtotal_partida: number; 
    extra_descripcion: string;
    tiempo_entrega: string;
}

export interface CotizacionCompleta extends Cotizacion {
    detalles: DetalleCotizacion[];
}