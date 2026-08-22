// Interfaz principal para la tabla / vista general de pedidos
export interface Pedido {
    id: number;
    id_cotizacion: number;
    fecha_pedido: string | Date; // Viene como 'fecha' en la tabla original
    fecha_limite: string | Date;
    Estatus: number; 
    orden_compra?: string;   // NUEVO: Agregado en el SP de convertir cotización
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

// Interfaz para la vista de los productos dentro del pedido (verDetallesPedido)
export interface DetallePedido {
    id_detalle: number;
    id_pedido: number;
    id_producto?: number | null; // AHORA ES OPCIONAL: Si es null, es un producto manual

    // Datos del Producto (Combinación de Catálogo y Manual traídos por la magia COALESCE)
    codigo_producto: string; // p.Nombre o dp.codigo_manual
    nombre_producto: string; // p.Descripcion o dp.descripcion_manual
    extra_descripcion?: string; // p.ExtraDescripcion o dp.extra_descripcion_manual
    
    // Estos pueden ser nulos si el producto no existe en el catálogo
    Codigo_numeral?: string;
    Codigo_japon?: string;

    // Cantidades y Costos
    cantidad: number;
    cantidad_surtida: number; // NUEVO: Para llevar el control de lo entregado
    precio_unitario: number;
    costo_flete: number;      // NUEVO: Costo extra de traer el producto
    importe: number;          // Calculado: cantidad * (precio_unitario + costo_flete)
    estatus_surtido: number;

    // Datos heredados de la cotización
    moneda?: string;          // NUEVO: MXN o USD
    tipo_cambio?: number;     // NUEVO: Por si necesitas hacer cálculos en la UI
}

// Interfaz auxiliar por si necesitas tipar la respuesta completa con paginación
export interface PedidoResponse {
    pedidos: Pedido[];
    total: number;
    paginas: number;
    paginaActual: number;
}