export interface Cliente {
    id?: number;

    Nombre: string;
    RFC: string;
    Razon_social: string;
    Regimen_fiscal: string;
    Direccion: string;

    contacto_principal: string;
    nombre_contacto?: string | null;
    correo_contacto: string;
    CP: string;

    nombre_constancia?: string;
    ruta_constancia?: string;
    fecha_constancia?: string | null;

    Estatus?: number;
    fecha_registro?: string;

    // Crédito
    tiene_credito: number;
    limite_credito: number;
    credito_utilizado?: number;
    credito_disponible?: number;
    fecha_vencimiento_credito?: string | null;

    // Información proveniente de la vista
    ids_asesores?: string | null;
    Nombres_asesores?: string | null;
    Marcas_asignadas_todas?: string | null;

    asesoresAsignados?: AsesorAsignado[];
}

export interface AsesorAsignado {
    id_asesor: string;
    nombre_asesor?: string;
    asesor_tipo: string;
    marcasArray: string[];
    marcas_asignadas?: string;
}

export interface MovimientoCredito {
    id: number;
    id_cliente: number;
    id_pedido?: number | null;

    tipo_movimiento: 'Cargo' | 'Pago' | 'Ajuste';

    monto: number;

    saldo_anterior: number;
    saldo_posterior: number;

    fecha_movimiento: string;

    referencia?: string | null;
    observaciones?: string | null;
}

export interface RegistrarPagoCredito {
    monto: number;
    referencia?: string | null;
    observaciones?: string | null;
}