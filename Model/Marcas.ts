export interface Marcas {
    id: number
    Nombre: string
    Estatus: number
}

export interface MarcaConConteo extends Marcas {
    total_productos: number
    total_demos: number
}