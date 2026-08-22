export interface Cotizacion {
    id: number;
    num_cotizacion: string;
    id_asesor: number;             
    nombre_asesor: string;          
    fecha: string;                 
    Estatus: number;
    id_cliente?: number | null;
    nombre_cliente_final: string;  
    rfc_cliente?: string | null;
    contacto: string;
    ciudad_destino: string;
    moneda: string;
    vigencia_dias: number;
    tipo_cambio: number;
    subtotal: number;
    iva: number;
    total: number;
    total_tipos_productos: number;
    total_piezas: number;
}

export interface DetalleCotizacion {
    id_detalle: number;
    id_cotizacion: number;
    id_producto?: number | null;    
    codigo_producto: string;       
    nombre_producto: string;
    extra_descripcion?: string;
    marca_producto?: string;        

    cantidad_producto: number;
    origen?: string;               
    tiempo_entrega: string;
    
    precio_unitario_cotizado: number;
    costo_flete: number;            
    subtotal_partida: number;     
}

export interface CotizacionCompleta extends Cotizacion {
    detalles: DetalleCotizacion[];
}