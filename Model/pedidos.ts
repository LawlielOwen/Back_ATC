// Interfaz principal para la tabla / vista general de pedidos
export interface Pedido {
    id: number;
    id_cotizacion: number;
    fecha_pedido: string | Date; // Viene como 'fecha' en la tabla original, 'fecha_pedido' en la vista
    fecha_limite: string | Date;
    Estatus: number; 
    nombre_factura?: string; // Opcional porque puede estar nulo al principio
    factura_ruta?: string;   // Opcional
    fecha_factura?: string | Date; // Opcional
    alerta_enviada: number; // Generalmente 0 o 1 (tinyint)

    // Datos del Cliente (Traídos por la vista)
    id_cliente: number;
    nombre_cliente: string;
    Razon_social: string;
    RFC: string;
    contacto_principal: string;
    correo_contacto: string;

    // Datos del Asesor (Traídos por la vista)
    id_asesor: number;
    nombre_asesor: string;

    // Propiedades extra para la UI (opcionales)
    estatusTexto?: string; // Para mostrar 'Pendiente', 'Cancelado', 'Pagado', etc.
}

// Interfaz para la vista de los productos dentro del pedido
export interface DetallePedido {
    id_detalle: number;
    id_pedido: number;
    id_producto: number;
    cantidad: number;
    precio_unitario: number;
    importe: number; // Calculado en la vista (cantidad * precio_unitario)
    estatus_surtido: number;

    // Datos del Producto (Traídos por la vista)
    Codigo_numeral: string;
    Codigo_japon?: string;
    nombre_producto: string;
    modelo_producto?: string;
}

// Interfaz auxiliar por si necesitas tipar la respuesta completa con paginación
export interface PedidoResponse {
    pedidos: Pedido[];
    total: number;
    paginas: number;
    paginaActual: number;
}