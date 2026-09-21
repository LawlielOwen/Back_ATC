import pool from '../Config/db';
const puppeteer = require('puppeteer');
import fs from 'fs';
import path from 'path';
export class ValeService {
    static async obtenerVal(pagina: number = 1, limite: number = 10) {
        const offset = (pagina - 1) * limite;
        const [rows]: any = await pool.query('select * from verVales limit ? offset ?', [limite, offset]);
        const [totalRows]: any = await pool.query('SELECT COUNT(*) as total FROM verVales');
        const total = totalRows[0].total;
        return { vales: rows, total, paginas: Math.ceil(total / limite), paginaActual: pagina };
    }
    static async solicitarVale(id_asesor: number, id_cliente: number, id_pedido: number, productos: any[]) {
        const [rows]: any = await pool.query('CALL sp_crear_solicitud_vale(?, ?, ?, ?)',
            [id_asesor, id_cliente, id_pedido, JSON.stringify(productos)]);
        return rows;
    }
static async autorizarVale(idVale: number, comentarioGeneral: string, detalles: any[]) {
    const detallesJson = detalles && detalles.length > 0 ? JSON.stringify(detalles) : null;
    
    const [result]: any = await pool.query(
        'CALL sp_autorizar_vale(?, ?, ?)',
        [idVale, comentarioGeneral, detallesJson]
    );
    return result[0][0]; 
}
    static async rechazarVale(id_vale: number, comentario: string) {
        const [rows]: any = await pool.query('CALL sp_rechazar_vale(?, ?)', [id_vale, comentario]);
        return rows;
    }
    static async consultarVale(id_asesor: number | null, busqueda: string | null, estatus: number | null,
        fechaInicio: string | null, fechaFin: string | null, pagina: number = 1, limite: number = 10) {
        const [rows]: any = await pool.query('CALL sp_consultar_vales(?, ?, ?, ?, ?, ?, ?)',
            [id_asesor, busqueda, estatus, fechaInicio, fechaFin, pagina, limite]);
        const vales = rows[0];
        const total = rows[1][0].total;
        return { vales, total, paginas: Math.ceil(total / limite), paginaActual: pagina };
    }
    static async contarVales(id_asesor: number, rol: string) {
        const [rows]: any = await pool.query('CALL sp_contar_vales_estatus(?, ?)', [id_asesor, rol]);
        return rows[0];
    }
    static async obtenerValPorId(id: number) {
        const [rows]: any = await pool.query('select * from verVales where id_vale = ?', [id]);
        return rows[0];
    }
    static async obtenerDetallesVale(id: number) {
        const [rows]: any = await pool.query('CALL sp_obtener_productos_vale(?)', [id]);
        return rows[0];
    }
    static async pedidosDisponiblesVale(id_asesor: number, rol: string) {
        const [rows]: any = await pool.query('CALL sp_pedidos_disponibles_para_vale(?, ?)', [id_asesor, rol]);
        return rows[0];
    }
    static async cotizacionesDisponiblesVale(idSolicitante: number) {
        const [rows]: any = await pool.query('CALL sp_cotizaciones_disponibles_para_vale(?)', [idSolicitante]);
        return rows[0];
    }
    static async productosCotizacionVale(idCotizacion: number, idSolicitante: number) {
        const [rows]: any = await pool.query('CALL sp_productos_cotizacion_para_vale(?, ?)', [idCotizacion, idSolicitante]);
        return rows[0];
    }
    static async solicitarValeDesdeCotizacion(idCotizacion: number, idSolicitante: number) {
        const [rows]: any = await pool.query('CALL sp_crear_solicitud_vale_cotizacion(?, ?)', [idCotizacion, idSolicitante]);
        return rows[0][0];
    }
    static async solicitarValeDemo(id_asesor: number, id_cliente: number | null,
        empresa_no_registrada: string | null, id_visita: number, productos: any[]) {
        const [rows]: any = await pool.query('CALL sp_crear_solicitud_vale_demo(?, ?, ?, ?, ?)',
            [id_asesor, id_cliente || null, empresa_no_registrada || null, id_visita, JSON.stringify(productos)]);
        return rows;
    }
    static async aceptarValeDemo(id_vale: number, comentario: string, detalles: any[]) {
    const detallesJson = detalles && detalles.length > 0 ? JSON.stringify(detalles) : null;
    const [rows]: any = await pool.query('CALL sp_autorizar_vale_demo(?, ?, ?)', [id_vale, comentario || '', detallesJson]);
    return rows;
}
    static async visitasDisponiblesVale(id_tecnico: number) {
        const [rows]: any = await pool.query('CALL sp_visitas_disponibles_para_vale(?)', [id_tecnico]);
        return rows[0];
    }
 static async listarFoliosAsesores() {
  const [rows]: any = await pool.query(
    `SELECT id, Nombre, app, apm, Rol, iniciales_folio, consecutivo_vale
     FROM asesores
     WHERE Estatus = 1
     ORDER BY Nombre ASC`
  );

  return rows.map((r: any) => ({
    id_asesor: r.id,
    nombre: [r.Nombre, r.app, r.apm].filter(Boolean).join(' '),
    rol: r.Rol,
    iniciales: r.iniciales_folio,
    consecutivo: r.consecutivo_vale,
    folioPreview: r.iniciales_folio ? `${r.iniciales_folio}-${r.consecutivo_vale}` : null
  }));
}

static async obtenerFolioAsesor(idAsesor: number) {
  const [rows]: any = await pool.query(
    'SELECT id, Nombre, iniciales_folio, consecutivo_vale FROM asesores WHERE id = ?',
    [idAsesor]
  );
  if (rows.length === 0) return null;

  const { id, Nombre, iniciales_folio, consecutivo_vale } = rows[0];
  return {
    id_asesor: id,
    nombre: Nombre,
    iniciales: iniciales_folio,
    consecutivo: consecutivo_vale,
    folioPreview: iniciales_folio ? `${iniciales_folio}-${consecutivo_vale}` : null
  };
}

static async actualizarFolioAsesor(idAsesor: number, iniciales: string, consecutivo: number) {
  const inicialesLimpias = iniciales.trim().toUpperCase();

  const [dupe]: any = await pool.query(
    'SELECT id, Nombre FROM asesores WHERE iniciales_folio = ? AND id <> ?',
    [inicialesLimpias, idAsesor]
  );
  if (dupe.length > 0) {
    const err: any = new Error(`Las iniciales "${inicialesLimpias}" ya las tiene asignadas ${dupe[0].Nombre}`);
    err.status = 409;
    throw err;
  }

  const [result]: any = await pool.query(
    'UPDATE asesores SET iniciales_folio = ?, consecutivo_vale = ? WHERE id = ?',
    [inicialesLimpias, consecutivo, idAsesor]
  );

  return result.affectedRows > 0;
}

static async verificarFolioValeExistente(folioCandidato: string) {
  const [rows]: any = await pool.query(
    `SELECT id, fecha, estatus, id_asesor
     FROM vales_salida
     WHERE folio_vale = ?
     LIMIT 1`,
    [folioCandidato]
  );

  return {
    folio: folioCandidato,
    existe: rows.length > 0,
    valeExistente: rows.length > 0 ? rows[0] : null
  };
}
static async asignarFolioCotizacionManual(id_vale: number, folio: string) {
        const [rows]: any = await pool.query('CALL sp_asignar_folio_cotizacion_manual(?, ?)', [id_vale, folio]);
        return rows[0][0]; 
    }
static async asignarFolioManual(id_vale: number, folio: string) {
        const [rows]: any = await pool.query('CALL sp_asignar_folio_manual(?, ?)', [id_vale, folio]);
        return rows[0][0]; 
    }
static async generarPDFvale(id_vale: number): Promise<Buffer> {
    if (!Number.isInteger(id_vale) || id_vale <= 0) {
        throw new Error('El ID del vale no es válido');
    }

    const connection = await pool.getConnection();

    let vale: any;
    let detalles: any[] = [];
    let nombreSupervisor = '';
    let puestoSupervisor = 'ALMACÉN';
    try {
        // 1. Datos del vale y cotización de origen.
        const [vales]: any = await connection.query(`
            SELECT
                v.id,
                v.folio_vale,
                v.id_pedido,
                v.id_cotizacion,
                v.estatus,
                v.comentario,

                DATE_FORMAT(v.fecha, '%d') AS dia,
                DATE_FORMAT(v.fecha, '%m') AS mes,
                DATE_FORMAT(v.fecha, '%Y') AS anio,

                COALESCE(
                    NULLIF(TRIM(cp.num_cotizacion), ''),
                    NULLIF(TRIM(cv.num_cotizacion), ''),
                    NULLIF(TRIM(v.folio_cotizacion_manual), '')
                ) AS num_cotizacion,

                COALESCE(
                    NULLIF(TRIM(cl.Nombre), ''),
                    NULLIF(TRIM(v.empresa_no_registrada), ''),
                    NULLIF(TRIM(clp.Nombre), ''),
                    NULLIF(TRIM(clcp.Nombre), ''),
                    NULLIF(TRIM(cp.nombre_prospecto), ''),
                    NULLIF(TRIM(clcv.Nombre), ''),
                    NULLIF(TRIM(cv.nombre_prospecto), ''),
                    'Sin empresa registrada'
                ) AS empresa,

                TRIM(CONCAT_WS(
                    ' ',
                    NULLIF(TRIM(a.Nombre), ''),
                    NULLIF(TRIM(a.app), ''),
                    NULLIF(TRIM(a.apm), '')
                )) AS nombre_asesor

            FROM vales_salida v

            LEFT JOIN pedidos p
                ON p.id = v.id_pedido

            LEFT JOIN cotizaciones cp
                ON cp.id = p.id_cotizacion

            LEFT JOIN cotizaciones cv
                ON cv.id = v.id_cotizacion

            LEFT JOIN clientes cl
                ON cl.id = v.id_cliente

            LEFT JOIN clientes clp
                ON clp.id = p.id_cliente

            LEFT JOIN clientes clcp
                ON clcp.id = cp.id_cliente

            LEFT JOIN clientes clcv
                ON clcv.id = cv.id_cliente

            LEFT JOIN asesores a
                ON a.id = v.id_asesor

            WHERE v.id = ?
        `, [id_vale]);

        if (vales.length === 0) {
            throw new Error('Vale de salida no encontrado');
        }

        vale = vales[0];

        // 2. Supervisor: administrador distinto del ID 1.
       let [personal]: any = await connection.query(`
            SELECT
                id,
                Rol,
                TRIM(CONCAT_WS(
                    ' ',
                    NULLIF(TRIM(Nombre), ''),
                    NULLIF(TRIM(app), ''),
                    NULLIF(TRIM(apm), '')
                )) AS nombre_completo
            FROM asesores
            WHERE Rol = 'Almacen' AND id <> 1
            ORDER BY id
            LIMIT 1
        `);

         puestoSupervisor = 'ALMACÉN';

        if (personal.length === 0) {
            [personal] = await connection.query(`
                SELECT
                    id,
                    Rol,
                    TRIM(CONCAT_WS(
                        ' ',
                        NULLIF(TRIM(Nombre), ''),
                        NULLIF(TRIM(app), ''),
                        NULLIF(TRIM(apm), '')
                    )) AS nombre_completo
                FROM asesores
                WHERE Rol = 'Administrador' AND id <> 1
                ORDER BY id
                LIMIT 1
            `);
            puestoSupervisor = 'SUPERVISOR DE SUCURSAL';
        }

        if (personal.length === 0) {
            throw new Error(
                'No hay un encargado de Almacén ni un Administrador registrado distinto del usuario ID 1'
            );
        }

        nombreSupervisor = personal[0].nombre_completo;
        
        // Ajustar el puesto según el rol encontrado
        if (personal[0].Rol && personal[0].Rol.toLowerCase() === 'administrador') {
            puestoSupervisor = 'SUPERVISOR DE SUCURSAL';
        } else {
            puestoSupervisor = 'ALMACÉN';
        }

        if (!nombreSupervisor) {
            throw new Error('El responsable seleccionado no tiene un nombre registrado');
        }

        // 3. Productos, demos y partidas manuales.
        const [partidas]: any = await connection.query(`
            SELECT
                dv.id,
                dv.piezas,
                dv.observaciones,

                CASE
                    WHEN dv.id_producto IS NOT NULL
                        THEN pr.Codigo_numeral
                    WHEN dv.id_demo IS NOT NULL
                        THEN sd.numero_serie
                    ELSE dv.codigo_manual
                END AS codigo_interno,

                CASE
                    WHEN dv.id_producto IS NOT NULL
                        THEN pr.Codigo_japon
                    ELSE ''
                END AS codigo_japon,

                CASE
                    WHEN dv.id_producto IS NOT NULL THEN
                        COALESCE(
                            NULLIF(TRIM(pr.Descripcion), ''),
                            pr.Nombre
                        )
                    WHEN dv.id_demo IS NOT NULL THEN
                        COALESCE(
                            NULLIF(TRIM(sd.descripcion), ''),
                            sd.nombre_modelo
                        )
                    ELSE dv.descripcion_manual
                END AS descripcion

            FROM detalles_vale dv

            LEFT JOIN productos pr
                ON pr.id = dv.id_producto

            LEFT JOIN stock_demo sd
                ON sd.id = dv.id_demo

            WHERE dv.id_vale = ?

            ORDER BY dv.id ASC
        `, [id_vale]);

        detalles = partidas;
    } finally {
        connection.release();
    }

    // 4. Normalización y escape del contenido.
    const normalizarTextoPDF = (valor: unknown): string => {
        if (valor === null || valor === undefined) {
            return '';
        }

        return String(valor)
            .normalize('NFC')
            .replace(/\r\n?/g, '\n')
            .replace(
                /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F]/g,
                ' '
            );
    };

    const escapeHtml = (valor: unknown): string =>
        normalizarTextoPDF(valor)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');

    const textoMultilinea = (valor: unknown): string =>
        escapeHtml(valor).replace(/\n/g, '<br>');

    const comentarioGeneral = normalizarTextoPDF(
        vale.comentario
    ).trim();

    // 5. Filas: solo descripción, sin extra descripción.
    const filasProductos = detalles.map((item, index) => {
        const descripcion = normalizarTextoPDF(
            item.descripcion
        ).trim();

        const observacionProducto = normalizarTextoPDF(
            item.observaciones
        ).trim();

        const partesObservacion: string[] = [];

        if (observacionProducto) {
            partesObservacion.push(
                textoMultilinea(observacionProducto)
            );
        }

        // Se imprime una sola vez, dentro de OBSERVACIONES.
        if (index === 0 && comentarioGeneral) {
            partesObservacion.push(`
                <div>
                    ${textoMultilinea(comentarioGeneral)}
                </div>
            `);
        }

        return `
            <tr class="fila-producto">
                <td>${index + 1}</td>
                <td>${escapeHtml(item.codigo_interno)}</td>
                <td>${escapeHtml(item.codigo_japon)}</td>
                <td>${textoMultilinea(descripcion)}</td>
                <td>${escapeHtml(item.piezas)}</td>
                <td>${partesObservacion.join('<br>')}</td>
            </tr>
        `;
    }).join('');

    // Completa 10 renglones cuando el vale tiene pocas partidas.
    const FILAS_MINIMAS = 10;
    let filasVacias = '';

    for (let i = detalles.length; i < FILAS_MINIMAS; i++) {
        const observacion = (
            detalles.length === 0 &&
            i === 0 &&
            comentarioGeneral
        )
            ? `
                <strong>General:</strong><br>
                ${textoMultilinea(comentarioGeneral)}
            `
            : '';

        filasVacias += `
            <tr class="fila-vacia">
                <td>${i + 1}</td>
                <td></td>
                <td></td>
                <td></td>
                <td></td>
                <td>${observacion}</td>
            </tr>
        `;
    }

    // 6. Plantilla y recursos.
    const rutaPlantilla = path.join(
        __dirname,
        '../Template/Plantillavale.html'
    );

    const rutaLogo = path.join(
        __dirname,
        '../assets/logo_atc.png'
    );

    const cargarFuente = (archivo: string): string => {
        const ruta = path.join(
            __dirname,
            '../assets/fonts',
            archivo
        );

        return 'data:font/ttf;base64,' +
            fs.readFileSync(ruta, 'base64');
    };

    const nombreAsesor = normalizarTextoPDF(
        vale.nombre_asesor
    ).trim();

    const nombreAsesorConTitulo = nombreAsesor
        ? (/^ING\.?\s/i.test(nombreAsesor)
            ? nombreAsesor
            : `ING. ${nombreAsesor}`)
        : '';

    const folioVale = normalizarTextoPDF(
        vale.folio_vale
    ).trim();

    const numeroCotizacion = normalizarTextoPDF(
        vale.num_cotizacion
    ).trim();

    const valores: Record<string, string> = {
        fuente_regular: cargarFuente('NotoSans-Regular.ttf'),
        fuente_bold: cargarFuente('NotoSans-Bold.ttf'),

        logo_atc_base64:
            'data:image/png;base64,' +
            fs.readFileSync(rutaLogo, 'base64'),

        origen_label: 'COTIZACIÓN',
        origen_folio: escapeHtml(
            numeroCotizacion || 'Sin cotización'
        ),

        folio_vale: escapeHtml(folioVale),
        empresa: escapeHtml(vale.empresa),

        dia: escapeHtml(vale.dia),
        mes: escapeHtml(vale.mes),
        anio: escapeHtml(vale.anio),

        filas_productos: filasProductos,
        filas_vacias: filasVacias,

        // Compatibilidad con tu HTML actual.
        observacion_general: '',

        nombre_asesor: escapeHtml(nombreAsesorConTitulo),
        nombre_supervisor: escapeHtml(nombreSupervisor),
        puesto_supervisor: escapeHtml(puestoSupervisor)
    };

    const htmlPlantilla = fs.readFileSync(
        rutaPlantilla,
        'utf8'
    ).replace(/<!--[\s\S]*?-->/g, '');

    const htmlListo = htmlPlantilla.replace(
        /{{([a-z0-9_]+)}}/g,
        (marcador: string, clave: string) => {
            if (!Object.prototype.hasOwnProperty.call(valores, clave)) {
                throw new Error(
                    'Marcador desconocido en plantilla: ' + marcador
                );
            }

            return valores[clave];
        }
    );

    // 7. Carta vertical: asesor arriba y almacén abajo.
    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
        ...(process.env.PUPPETEER_EXECUTABLE_PATH && {
            executablePath: process.env.PUPPETEER_EXECUTABLE_PATH
        })
    });

    try {
        const page = await browser.newPage();
        await page.setViewport({ width: 816, height: 1056 });
        await page.emulateMediaType('print');
        await page.setContent(htmlListo, { waitUntil: 'load' });

        // JavaScript ejecutado en Chromium, sin requerir tipos DOM en el backend.
        await page.evaluate(`(async () => {
            const fuentes = await Promise.all([
                document.fonts.load('400 9px "CotizacionPDF"'),
                document.fonts.load('700 9px "CotizacionPDF"')
            ]);
            await document.fonts.ready;
            if (fuentes.some(grupo => grupo.length === 0)) {
                throw new Error('No se cargaron las fuentes del vale');
            }
            await Promise.all(Array.from(document.images, img => img.decode()));

            const original = document.getElementById('vale');
            if (!original) throw new Error('No se encontró el contenedor #vale');
            const tabla = original.querySelector('.items-table tbody');
            if (!tabla) throw new Error('No se encontró la tabla del vale');

            const filas = Array.from(tabla.querySelectorAll('tr.fila-producto'));
            const relleno = Array.from(tabla.querySelectorAll('tr.fila-vacia'));
            if (filas.length !== ${detalles.length} || filas.some(f => f.cells.length !== 6)) {
                throw new Error('La tabla no coincide con las partidas del vale');
            }
            const plantilla = original.cloneNode(true);
            original.replaceChildren();
            const grupos = [];
            const modos = ['normal', 'compacto', 'muy-compacto'];

          const crearContenido = () => {
    const contenido = plantilla.cloneNode(true);
    contenido.removeAttribute('id');
    contenido.className = 'vale-contenido';

    contenido.querySelectorAll('.vale-copia')
        .forEach(el => el.remove());

    return contenido;
};

            const cabe = (contenido, mitad) => {
                const estilo = getComputedStyle(mitad);
                const limiteAlto = mitad.getBoundingClientRect().height
                    - parseFloat(estilo.paddingTop) - parseFloat(estilo.paddingBottom) - 2;
                const limiteAncho = mitad.getBoundingClientRect().width
                    - parseFloat(estilo.paddingLeft) - parseFloat(estilo.paddingRight);
                return Math.max(contenido.scrollHeight, contenido.getBoundingClientRect().height) <= limiteAlto
                    && contenido.scrollWidth <= limiteAncho + 1;
            };

            let inicio = 0;
            do {
                const hoja = document.createElement('section');
                hoja.className = 'hoja-carta';
                const superior = document.createElement('div');
                superior.className = 'mitad-vale mitad-asesor';
                const inferior = document.createElement('div');
                inferior.className = 'mitad-vale mitad-almacen';
                const corte = document.createElement('div');
                corte.className = 'linea-corte';
                hoja.append(superior, inferior, corte);
                original.appendChild(hoja);

                const asesor = crearContenido();
                superior.appendChild(asesor);
                await Promise.all(Array.from(asesor.querySelectorAll('img'), img => img.decode()));
                const cuerpo = asesor.querySelector('.items-table tbody');
                let cantidad = Math.min(30, filas.length - inicio);
                let ajustado = false;

                while (!ajustado) {
                    cuerpo.replaceChildren();
                    filas.slice(inicio, inicio + cantidad).forEach(f => cuerpo.appendChild(f.cloneNode(true)));
                    if (inicio === 0 && cantidad === filas.length) {
                        relleno.forEach(f => cuerpo.appendChild(f.cloneNode(true)));
                    }
                    for (const modo of modos) {
                        asesor.dataset.densidad = modo;
                        if (cabe(asesor, inferior)) { ajustado = true; break; }
                    }
                    if (!ajustado) {
                        // Conserva el primer renglón en vales sin productos: puede contener comentario.
                        Array.from(cuerpo.querySelectorAll('.fila-vacia'))
                            .forEach((f, i) => { if (filas.length > 0 || i > 0) f.remove(); });
                        ajustado = cabe(asesor, inferior);
                    }
                    if (!ajustado) {
                        if (cantidad <= 1) {
                            throw new Error('Una partida o el encabezado supera media hoja. No se ha recortado el contenido.');
                        }
                        cantidad--;
                    }
                }

                const almacen = asesor.cloneNode(true);
inferior.appendChild(almacen);

await Promise.all(
    Array.from(
        almacen.querySelectorAll('img'),
        img => img.decode()
    )
);

grupos.push({ asesor, almacen, superior, inferior });
inicio += cantidad;
            } while (inicio < filas.length);

          grupos.forEach((grupo) => {
    if (
        !cabe(grupo.asesor, grupo.superior) ||
        !cabe(grupo.almacen, grupo.inferior)
    ) {
        throw new Error(
            'El contenido excede el espacio de media hoja'
        );
    }
});
        })()`);

        const pdfBuffer = await page.pdf({
            format: 'Letter',
            landscape: false,
            preferCSSPageSize: true,
            printBackground: true,
            scale: 1,
            margin: { top: '0mm', bottom: '0mm', left: '0mm', right: '0mm' }
        });
        return Buffer.from(pdfBuffer);
    } finally {
        await browser.close();
    }
}

}