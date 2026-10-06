import pool from "../Config/db";
import ExcelJS from 'exceljs';


type Tono = 'rojo' | 'ambar' | 'verde' | 'azul' | 'naranja' | 'violeta' | 'gris';

const TONOS: Record<Tono, { fondo: string; texto: string }> = {
  rojo:    { fondo: 'FFFEE2E2', texto: 'FFB91C1C' },
  ambar:   { fondo: 'FFFEF9C3', texto: 'FF854D0E' },
  verde:   { fondo: 'FFD1FAE5', texto: 'FF065F46' },
  azul:    { fondo: 'FFDBEAFE', texto: 'FF1E40AF' },
  naranja: { fondo: 'FFFFEDD5', texto: 'FFC2410C' },
  violeta: { fondo: 'FFEDE9FE', texto: 'FF5B21B6' },
  gris:    { fondo: 'FFF1F5F9', texto: 'FF475569' },
};

const COLOR = {
  azulOscuro: 'FF003B8A',
  azul: 'FF1D4ED8',
  teal: 'FF0F766E',
  verde: 'FF047857',
  gris: 'FF475569',
  naranja: 'FFB45309',
  texto: 'FF1E293B',
  cebra: 'FFF8FAFC',
  borde: 'FFCBD5E1',
  seccion: 'FFE0E7FF',
};

const BORDES: Partial<ExcelJS.Borders> = {
  top:    { style: 'thin', color: { argb: COLOR.borde } },
  left:   { style: 'thin', color: { argb: COLOR.borde } },
  bottom: { style: 'thin', color: { argb: COLOR.borde } },
  right:  { style: 'thin', color: { argb: COLOR.borde } },
};

const relleno = (argb: string): ExcelJS.Fill => ({
  type: 'pattern',
  pattern: 'solid',
  fgColor: { argb },
});

const aplicarTono = (celda: ExcelJS.Cell, tono: Tono) => {
  celda.font = { bold: true, size: 11, color: { argb: TONOS[tono].texto } };
  celda.fill = relleno(TONOS[tono].fondo);
};

function estilizarEncabezado(
  hoja: ExcelJS.Worksheet,
  colorDe: (col: number) => string,
  altura = 38
) {
  const fila = hoja.getRow(1);
  fila.height = altura;
  fila.eachCell({ includeEmpty: false }, (celda, col) => {
    celda.font = { bold: true, size: 11, color: { argb: 'FFFFFFFF' } };
    celda.fill = relleno(colorDe(col));
    celda.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
    celda.border = BORDES;
  });
}

/** Estilo base de una fila de datos: bordes, cebra y centrado vertical. */
function estilizarFila(fila: ExcelJS.Row, indice: number) {
  fila.eachCell({ includeEmpty: true }, (celda) => {
    celda.border = BORDES;
    celda.font = { size: 11, color: { argb: COLOR.texto } };
    celda.alignment = { vertical: 'middle' };
    if (indice % 2 === 0) celda.fill = relleno(COLOR.cebra);
  });
}

function configurarImpresion(hoja: ExcelJS.Worksheet) {
  hoja.pageSetup = {
    orientation: 'landscape',
     paperSize: 1 as ExcelJS.PaperSize, 
    fitToPage: true,
    fitToWidth: 1,
    fitToHeight: 0,
    printTitlesRow: '1:1',
  };
}


export class ExcelService {
  static async generarReporteInventario(): Promise<Buffer> {
    const productos = await this.obtenerInventarioReporte();

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'ATC ERP';
    workbook.created = new Date();

    this.crearHojaResumen(workbook, productos);
    this.crearHojaInventario(workbook, productos);
    this.crearHojaAlertas(workbook, productos);

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }

  static async obtenerInventarioReporte() {
    const [rows]: any = await pool.query(`
      SELECT
        p.id,
        p.Nombre,
        p.Descripcion,
        p.ExtraDescripcion,
        p.Precio,
        p.Codigo_numeral,
        p.Codigo_japon,
        p.Estanteria,
        p.Caja,
        p.Stock,
        p.Estatus,
        p.id_marca,
        p.Marca,
        IFNULL(r.apartado_comprometido, 0) AS ApartadoComprometido,
        IFNULL(r.apartado_libre, 0) AS ApartadoLibre,
        IFNULL(r.apartado_comprometido, 0) + IFNULL(r.apartado_libre, 0) AS Apartado,
        p.Stock + IFNULL(r.apartado_comprometido, 0) + IFNULL(r.apartado_libre, 0) AS ExistenciaFisica
      FROM verProductos p
      LEFT JOIN (
        SELECT
          id_producto,
          SUM(CASE WHEN id_pedido IS NOT NULL THEN cantidad_reservada ELSE 0 END) AS apartado_comprometido,
          SUM(CASE WHEN id_pedido IS NULL THEN cantidad_reservada ELSE 0 END) AS apartado_libre
        FROM reservas_stock
        WHERE estatus = 'activa'
        GROUP BY id_producto
      ) r ON r.id_producto = p.id
      ORDER BY p.Marca ASC, p.Nombre ASC
    `);

    return rows;
  }

private static crearHojaResumen(workbook: ExcelJS.Workbook, productos: any[]) {
  const hoja = workbook.addWorksheet('Resumen', {
    views: [{ showGridLines: false }],
    properties: { tabColor: { argb: COLOR.azul } },
  });

  hoja.columns = [{ width: 44 }, { width: 22 }];

  const suma = (campo: string) =>
    productos.reduce((total, p) => total + Number(p[campo] || 0), 0);

  const totalProductos = productos.length;
  const productosActivos = productos.filter(p => Number(p.Estatus) === 1).length;
  const productosConStock = productos.filter(p => Number(p.Stock) > 0).length;
  const productosSinStock = productos.filter(p => Number(p.Stock) <= 0).length;
  const productosSinUbicacion = productos.filter(p => !p.Estanteria || !p.Caja).length;

  const stockDisponible = suma('Stock');
  const apartadoSinPedido = suma('ApartadoLibre');
  const comprometidoPedidos = suma('ApartadoComprometido');
  const totalApartado = suma('Apartado');
  const existenciaFisica = suma('ExistenciaFisica');
  const valorComercialDisponible = productos.reduce(
    (total, p) => total + Number(p.Stock || 0) * Number(p.Precio || 0), 0
  );

  // Título
  hoja.mergeCells('A1:B2');
  const titulo = hoja.getCell('A1');
  titulo.value = 'REPORTE GENERAL DE INVENTARIO';
  titulo.font = { size: 18, bold: true, color: { argb: 'FFFFFFFF' } };
  titulo.fill = relleno(COLOR.azulOscuro);
  titulo.alignment = { vertical: 'middle', horizontal: 'center' };

  hoja.mergeCells('A3:B3');
  const fecha = hoja.getCell('A3');
  fecha.value = `Generado: ${new Date().toLocaleString('es-MX', { timeZone: 'America/Mexico_City' })}`;
  fecha.font = { italic: true, size: 10, color: { argb: 'FF64748B' } };
  fecha.alignment = { horizontal: 'center', vertical: 'middle' };
  hoja.getRow(3).height = 20;

  let fila = 5;
  let contador = 0;

  const seccion = (texto: string, color: string) => {
    hoja.mergeCells(`A${fila}:B${fila}`);
    const celda = hoja.getCell(`A${fila}`);
    celda.value = texto;
    celda.font = { bold: true, size: 11, color: { argb: 'FFFFFFFF' } };
    celda.fill = relleno(color);
    celda.alignment = { vertical: 'middle', indent: 1 };
    hoja.getRow(fila).height = 24;
    fila++;
    contador = 0;
  };

  const indicador = (
    etiqueta: string,
    valor: number,
    opciones: { formato?: string; tono?: Tono; negrita?: boolean } = {}
  ) => {
    const a = hoja.getCell(`A${fila}`);
    const b = hoja.getCell(`B${fila}`);

    a.value = etiqueta;
    b.value = valor;
    b.numFmt = opciones.formato ?? '#,##0';

    [a, b].forEach((c) => {
      c.border = BORDES;
      c.font = { size: 11, bold: !!opciones.negrita, color: { argb: COLOR.texto } };
      c.alignment = { vertical: 'middle' };
      if (contador % 2 === 1) c.fill = relleno(COLOR.cebra);
    });
    a.alignment = { vertical: 'middle', indent: 1 };
    b.alignment = { vertical: 'middle', horizontal: 'right', indent: 1 };

    // Solo se resalta si el valor llama la atención (> 0)
    if (opciones.tono && valor > 0) aplicarTono(b, opciones.tono);

    hoja.getRow(fila).height = 22;
    fila++;
    contador++;
  };

  const definicion = (termino: string, explicacion: string) => {
    hoja.mergeCells(`A${fila}:B${fila}`);
    const celda = hoja.getCell(`A${fila}`);
    celda.value = {
      richText: [
        { text: `${termino}: `, font: { bold: true, size: 10, color: { argb: COLOR.texto } } },
        { text: explicacion, font: { size: 10, color: { argb: 'FF64748B' } } },
      ],
    };
    celda.alignment = { vertical: 'middle', wrapText: true, indent: 1 };
    celda.border = BORDES;
    hoja.getRow(fila).height = 34;
    fila++;
  };

  seccion('PRODUCTOS', COLOR.azulOscuro);
  indicador('Productos registrados', totalProductos);
  indicador('Productos activos', productosActivos);
  indicador('Productos con stock libre', productosConStock);
  indicador('Productos sin stock libre', productosSinStock, { tono: 'rojo' });
  indicador('Productos sin ubicación completa', productosSinUbicacion, { tono: 'naranja' });

  fila++; // espacio entre secciones

  seccion('UNIDADES', COLOR.azul);
  indicador('Unidades libres', stockDisponible);
  indicador('Apartadas sin pedido', apartadoSinPedido, { tono: 'azul' });
  indicador('Comprometidas en pedidos', comprometidoPedidos, { tono: 'ambar' });
  indicador('Total unidades apartadas', totalApartado);
  indicador('Existencia física total', existenciaFisica, { negrita: true });

  fila++;

  seccion('VALOR', COLOR.verde);
  indicador('Valor comercial disponible', valorComercialDisponible, {
    formato: '$#,##0.00',
    negrita: true,
  });

  fila++;

  // Glosario
  seccion('¿CÓMO SE CALCULA?', COLOR.gris);
  definicion('Unidades libres', 'suma del Stock Libre de todos los productos.');
  definicion('Apartadas sin pedido', 'reservas activas que no están ligadas a un pedido.');
  definicion('Comprometidas en pedidos', 'reservas activas ligadas a un pedido.');
  definicion('Total unidades apartadas', 'apartadas sin pedido + comprometidas en pedidos.');
  definicion('Existencia física total', 'unidades libres + total de unidades apartadas.');
  definicion(
    'Valor comercial disponible',
    'suma de (Stock Libre × Precio) de cada producto. No incluye las unidades apartadas.'
  );

  configurarImpresion(hoja);
}

private static crearHojaInventario(workbook: ExcelJS.Workbook, productos: any[]) {
  const hoja = workbook.addWorksheet('Inventario', {
    views: [{ state: 'frozen', xSplit: 3, ySplit: 1 }], // congela encabezado + 3 primeras columnas
    properties: { tabColor: { argb: COLOR.azulOscuro } },
  });

  hoja.columns = [
    { header: 'Código Numeral', key: 'codigoNumeral', width: 18 },
    { header: 'Código Japón', key: 'codigoJapon', width: 18 },
    { header: 'Producto', key: 'producto', width: 28 },
    { header: 'Descripción', key: 'descripcion', width: 40 },
    { header: 'Marca', key: 'marca', width: 20 },
    { header: 'Estantería', key: 'estanteria', width: 15 },
    { header: 'Caja', key: 'caja', width: 12 },
    { header: 'Stock Libre', key: 'stock', width: 14 },
    { header: 'Apartado sin Pedido', key: 'apartadoLibre', width: 16 },
    { header: 'Comprometido en Pedidos', key: 'comprometido', width: 18 },
    { header: 'Total Apartado', key: 'apartado', width: 14 },
    { header: 'Existencia Física', key: 'existencia', width: 14 },
    { header: 'Disponibilidad', key: 'disponibilidad', width: 32 },
    { header: 'Precio', key: 'precio', width: 15 },
    { header: 'Valor Comercial Disponible\n(Stock Libre × Precio)', key: 'valor', width: 22 },
    { header: 'Estatus', key: 'estatus', width: 13 },
  ];

  const CENTRADAS = [6, 7, 8, 9, 10, 11, 12, 16];
  const CONTEOS = [8, 9, 10, 11, 12];
  const DINERO = [14, 15];

  productos.forEach((p: any, i: number) => {
    const stock = Number(p.Stock || 0);
    const apartado = Number(p.Apartado || 0);
    const precio = Number(p.Precio || 0);

    let disponibilidad = 'Disponible';
    let tono: Tono = 'verde';
    if (stock <= 0) {
      disponibilidad = 'Sin disponibilidad';
      tono = 'rojo';
    } else if (apartado > 0) {
      disponibilidad = 'Con inventario comprometido';
      tono = 'ambar';
    }

    const fila = hoja.addRow({
      codigoNumeral: p.Codigo_numeral || '',
      codigoJapon: p.Codigo_japon || '',
      producto: p.Nombre || '',
      descripcion: p.Descripcion || '',
      marca: p.Marca || '',
      estanteria: p.Estanteria || 'Sin ubicación',
      caja: p.Caja || 'Sin ubicación',
      stock,
      apartadoLibre: Number(p.ApartadoLibre || 0),
      comprometido: Number(p.ApartadoComprometido || 0),
      apartado,
      existencia: Number(p.ExistenciaFisica || 0),
      disponibilidad,
      precio,
      valor: stock * precio,
      estatus: Number(p.Estatus) === 1 ? 'Activo' : 'Inactivo',
    });

    // Valor Comercial = Stock Libre (col H) × Precio (col N), visible como fórmula en Excel
    fila.getCell(15).value = {
      formula: `H${fila.number}*N${fila.number}`,
      result: stock * precio,
    };

    estilizarFila(fila, i);

    // Alineaciones y formatos por tipo de columna
    CENTRADAS.forEach(c => (fila.getCell(c).alignment = { vertical: 'middle', horizontal: 'center' }));
    CONTEOS.forEach(c => (fila.getCell(c).numFmt = '#,##0'));
    DINERO.forEach(c => {
      fila.getCell(c).numFmt = '$#,##0.00';
      fila.getCell(c).alignment = { vertical: 'middle', horizontal: 'right', indent: 1 };
    });
    fila.getCell(4).alignment = { vertical: 'middle', wrapText: true }; // descripción

    // Resaltados por significado
    aplicarTono(fila.getCell(13), tono);
    fila.getCell(13).alignment = { vertical: 'middle', horizontal: 'center' };

    if (stock <= 0) {
      fila.getCell(8).font = { bold: true, size: 11, color: { argb: TONOS.rojo.texto } };
    }
    if (!p.Estanteria) {
      fila.getCell(6).font = { italic: true, size: 11, color: { argb: TONOS.rojo.texto } };
    }
    if (!p.Caja) {
      fila.getCell(7).font = { italic: true, size: 11, color: { argb: TONOS.rojo.texto } };
    }
    aplicarTono(fila.getCell(16), Number(p.Estatus) === 1 ? 'verde' : 'gris');
    fila.getCell(16).alignment = { vertical: 'middle', horizontal: 'center' };
  });

  // Encabezados con color por grupo de columnas (altura 50 por el subtítulo del valor comercial)
  estilizarEncabezado(
    hoja,
    (col) => {
      if (col <= 5) return COLOR.azulOscuro; // identificación
      if (col <= 7) return COLOR.teal;       // ubicación
      if (col <= 13) return COLOR.azul;      // inventario
      if (col <= 15) return COLOR.verde;     // comercial
      return COLOR.gris;                     // estatus
    },
    50
  );

  // Notas que aparecen al pasar el mouse sobre el encabezado
  const NOTAS_ENCABEZADO: Record<number, string> = {
    8:  'Stock Libre: unidades disponibles para vender, sin contar lo apartado.',
    9:  'Apartado sin Pedido: unidades reservadas que aún no pertenecen a un pedido.',
    10: 'Comprometido en Pedidos: unidades reservadas para pedidos existentes.',
    11: 'Total Apartado = Apartado sin Pedido + Comprometido en Pedidos.',
    12: 'Existencia Física = Stock Libre + Total Apartado (lo que hay físicamente en almacén).',
    15: 'Valor Comercial Disponible = Stock Libre × Precio.\nNo incluye unidades apartadas ni comprometidas.',
  };

  Object.entries(NOTAS_ENCABEZADO).forEach(([col, texto]) => {
    hoja.getRow(1).getCell(Number(col)).note = texto;
  });

  hoja.autoFilter = {
    from: { row: 1, column: 1 },
    to: { row: Math.max(hoja.rowCount, 1), column: 16 },
  };

  configurarImpresion(hoja);
}

  private static crearHojaAlertas(workbook: ExcelJS.Workbook, productos: any[]) {
    const hoja = workbook.addWorksheet('Alertas', {
      views: [{ state: 'frozen', ySplit: 1 }],
      properties: { tabColor: { argb: COLOR.naranja } },
    });

    hoja.columns = [
      { header: 'Alerta', key: 'alerta', width: 38 },
      { header: 'Código', key: 'codigo', width: 18 },
      { header: 'Producto', key: 'producto', width: 32 },
      { header: 'Marca', key: 'marca', width: 20 },
      { header: 'Estantería', key: 'estanteria', width: 15 },
      { header: 'Caja', key: 'caja', width: 12 },
      { header: 'Stock Libre', key: 'stock', width: 14 },
      { header: 'Apartado sin Pedido', key: 'apartadoLibre', width: 16 },
      { header: 'Comprometido', key: 'comprometido', width: 16 },
      { header: 'Existencia Física', key: 'existencia', width: 16 },
    ];

    // El orden de las llaves define la prioridad (de más a menos urgente)
    const TONO_ALERTA: Record<string, Tono> = {
      'Sin stock libre': 'rojo',
      'Ubicación incompleta': 'naranja',
      'Producto inactivo con existencia': 'violeta',
      'Apartado sin pedido': 'azul',
      'Inventario comprometido en pedidos': 'ambar',
    };
    const ORDEN = Object.keys(TONO_ALERTA);

    const filas: any[] = [];

    productos.forEach((p: any) => {
      const stock = Number(p.Stock || 0);
      const apartadoLibre = Number(p.ApartadoLibre || 0);
      const comprometido = Number(p.ApartadoComprometido || 0);
      const existencia = Number(p.ExistenciaFisica || 0);

      const datos = {
        codigo: p.Codigo_numeral || p.Codigo_japon || '',
        producto: p.Nombre || '',
        marca: p.Marca || '',
        estanteria: p.Estanteria || 'Sin estantería',
        caja: p.Caja || 'Sin caja',
        stock,
        apartadoLibre,
        comprometido,
        existencia,
      };

      if (stock <= 0) filas.push({ alerta: 'Sin stock libre', ...datos });
      if (!p.Estanteria || !p.Caja) filas.push({ alerta: 'Ubicación incompleta', ...datos });
      if (Number(p.Estatus) !== 1 && existencia > 0) {
        filas.push({ alerta: 'Producto inactivo con existencia', ...datos });
      }
      if (apartadoLibre > 0) filas.push({ alerta: 'Apartado sin pedido', ...datos });
      if (comprometido > 0) filas.push({ alerta: 'Inventario comprometido en pedidos', ...datos });
    });

    filas.sort((a, b) => ORDEN.indexOf(a.alerta) - ORDEN.indexOf(b.alerta));

    filas.forEach((datos, i) => {
      const fila = hoja.addRow(datos);
      estilizarFila(fila, i);

      aplicarTono(fila.getCell(1), TONO_ALERTA[datos.alerta]);
      fila.getCell(1).alignment = { vertical: 'middle', indent: 1 };

      [5, 6, 7, 8, 9, 10].forEach(c => {
        fila.getCell(c).alignment = { vertical: 'middle', horizontal: 'center' };
      });
      [7, 8, 9, 10].forEach(c => (fila.getCell(c).numFmt = '#,##0'));
    });

    if (filas.length === 0) {
      hoja.mergeCells('A2:J2');
      const celda = hoja.getCell('A2');
      celda.value = 'No se detectaron alertas de inventario';
      aplicarTono(celda, 'verde');
      celda.alignment = { vertical: 'middle', horizontal: 'center' };
      hoja.getRow(2).height = 28;
    }

    estilizarEncabezado(hoja, () => COLOR.naranja);

    hoja.autoFilter = {
      from: { row: 1, column: 1 },
      to: { row: Math.max(hoja.rowCount, 1), column: 10 },
    };

    configurarImpresion(hoja);
  }
}