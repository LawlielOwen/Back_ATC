export interface Cliente {
    id: number;
    Nombre: string;
    RFC: string;
    Razon_social: string;
    Regimen_fiscal: string;
    Direccion: string;
    contacto_principal: string;
    correo_contacto: string;
    CP: string;
    nombre_constancia: string;  
    ruta_constancia: string;
    fecha_constancia: Date;
    
    tiene_credito: number;
    limite_credito: number;
    fecha_vencimiento_credito: string | null;   // NUEVO
    
    ids_asesores?: string;
    Nombres_asesores?: string;
    Marcas_asignadas_todas?: string;

    asesoresAsignados?: {
        id_asesor: string;
        nombre_asesor: string;        // NUEVO
        asesor_tipo: string;
        marcasArray: string[];
        marcas_asignadas: string;
    }[];

    Estatus: number;
    fecha_registro: Date;
}