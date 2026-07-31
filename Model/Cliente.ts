export interface Cliente{
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
    id_asesor: number;
    Nombre_asesor: string;
    Estatus: number;
    fecha_registro : Date;
    asesor_tipo:string;
}