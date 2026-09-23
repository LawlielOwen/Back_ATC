export interface Cliente {
    id?: number;
    codigo_cliente?: string | null;

    Nombre: string;
    RFC: string;
    Razon_social: string;
    Regimen_fiscal: string;
    Direccion: string;

    contacto_principal: string;
    nombre_contacto?: string | null;
    correo_contacto: string;
    CP: string;

    nombre_constancia?: string | null;
    ruta_constancia?: string | null;
    fecha_constancia?: string | null;

    Estatus?: number;
    fecha_registro?: string;

    tiene_credito: number;
    limite_credito: number;
    credito_utilizado?: number;
    credito_disponible?: number;
    fecha_vencimiento_credito?: string | null;

    total_contactos?: number;
    total_constancias?: number;
    contactos?: ClienteContacto[];
    constancias?: ClienteConstancia[];

    ids_asesores?: string | null;
    Nombres_asesores?: string | null;
    Marcas_asignadas_todas?: string | null;

    asesoresAsignados?: AsesorAsignado[];
}

export interface ClienteContacto {
    id?: number;
    id_cliente?: number;
    nombre?: string | null;
    telefono?: string | null;
    correo?: string | null;
    puesto?: string | null;
    es_principal?: number;
    estatus?: number;
    fecha_registro?: string;
}

export interface ClienteConstancia {
    id?: number;
    id_cliente?: number;
    nombre?: string | null;
    ruta?: string | null;
    fecha?: string | null;
    es_principal?: number;
    estatus?: number;
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

    tipo_movimiento: 'Cargo' | 'Pago' | 'Ajuste' | 'Reembolso';

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