export interface Productos {
  id: number;
  Nombre: string;
  Descripcion: string;
  ExtraDescripcion: string;
  Precio: number;

  Codigo_numeral: string;
  Codigo_japon: string;

  id_estanteria: number | null;
  Estanteria: string | null;

  id_caja: number | null;
  Caja: string | null;

  Stock: number;
  Apartado: number;
  Estatus: number;

  id_marca: number;
  Marca: string;
}