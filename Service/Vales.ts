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
                    NULLIF(TRIM(cv.num_cotizacion), '')
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

    // 7. Generación del PDF.
    const browser = await puppeteer.launch({
        headless: true,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox'
        ],
        ...(process.env.PUPPETEER_EXECUTABLE_PATH && {
            executablePath: process.env.PUPPETEER_EXECUTABLE_PATH
        })
    });

    try {
        const page = await browser.newPage();

        const anchoUtilPx = Math.floor(
            (11 - (24 / 25.4)) * 96
        );

        const altoUtilPx = Math.floor(
            (8.5 - (24 / 25.4)) * 96
        );

        await page.setViewport({
            width: anchoUtilPx,
            height: altoUtilPx
        });

        await page.emulateMediaType('print');

        await page.setContent(htmlListo, {
            waitUntil: 'load'
        });

        await page.addStyleTag({
            content: `
                @page {
                    size: letter landscape;
                    margin: 12mm;
                }

                .vale-hoja {
                    display: flow-root;
                    width: 100%;
                    height: auto;
                    overflow: visible;
                }

                .vale-hoja + .vale-hoja {
                    break-before: page;
                    page-break-before: always;
                }

                .items-table {
                    width: 100%;
                    table-layout: fixed;
                    border-collapse: collapse;
                    border: 0.5px solid #000;
                }

                .items-table th,
                .items-table td {
                    text-align: center !important;
                    vertical-align: middle !important;
                    overflow-wrap: anywhere;
                }

                .items-table th {
                    border: 0.5px solid #000;
                }

                .items-table td {
                    border-left: 0.5px solid #000;
                    border-right: 0.5px solid #000;
                    border-top: 0.5px dotted #666;
                    border-bottom: 0.5px dotted #666;
                }

                .items-table tbody tr:last-child td {
                    border-bottom: 0.5px solid #000;
                }

                .items-table thead {
                    display: table-header-group;
                }

                .items-table tr,
                .vale-footer {
                    break-inside: avoid;
                    page-break-inside: avoid;
                }

                /* Compacto: conserva el tamaño de letra. */
                .vale-hoja[data-densidad="compacto"] .logo-atc {
                    max-height: 65px;
                }

                .vale-hoja[data-densidad="compacto"] .vale-header {
                    margin-bottom: 8px;
                    padding-bottom: 5px;
                }

                .vale-hoja[data-densidad="compacto"] .vale-datos-fila {
                    margin: 8px 0;
                }

                .vale-hoja[data-densidad="compacto"] .items-table {
                    margin-top: 6px;
                }

                .vale-hoja[data-densidad="compacto"] .items-table th {
                    padding: 3px 4px;
                }

                .vale-hoja[data-densidad="compacto"] .items-table td {
                    padding: 2px 4px;
                    line-height: 1.15;
                }

                .vale-hoja[data-densidad="compacto"] .vale-footer {
                    margin-top: 16px;
                }

                .vale-hoja[data-densidad="compacto"] .firma-titulo {
                    margin-bottom: 28px;
                }

                /* Muy compacto: tabla con letra de 9 px. */
                .vale-hoja[data-densidad="muy-compacto"] .logo-atc {
                    max-height: 52px;
                }

                .vale-hoja[data-densidad="muy-compacto"] .vale-header {
                    margin-bottom: 6px;
                    padding-bottom: 4px;
                }

                .vale-hoja[data-densidad="muy-compacto"] .titulo-empresa {
                    font-size: 14px;
                }

                .vale-hoja[data-densidad="muy-compacto"] .titulo-sucursal,
                .vale-hoja[data-densidad="muy-compacto"] .titulo-vale {
                    font-size: 11px;
                    margin-top: 2px;
                }

                .vale-hoja[data-densidad="muy-compacto"] .vale-datos-fila {
                    margin: 6px 0;
                    font-size: 10px;
                }

                .vale-hoja[data-densidad="muy-compacto"] .items-table {
                    margin-top: 4px;
                }

                .vale-hoja[data-densidad="muy-compacto"] .items-table th {
                    font-size: 9px;
                    padding: 2px 4px;
                    line-height: 1.1;
                }

                .vale-hoja[data-densidad="muy-compacto"] .items-table td {
                    font-size: 9px;
                    padding: 1px 4px;
                    line-height: 1.1;
                }

                .vale-hoja[data-densidad="muy-compacto"] .fila-vacia td {
                    height: 14px;
                }

                .vale-hoja[data-densidad="muy-compacto"] .vale-footer {
                    margin-top: 12px;
                }

                .vale-hoja[data-densidad="muy-compacto"] .firma-titulo {
                    font-size: 9px;
                    margin-bottom: 24px;
                }

                .vale-hoja[data-densidad="muy-compacto"] .firma-nombre {
                    font-size: 9px;
                }
            `
        });

        // Espera las fuentes y el logo antes de medir.
        await page.evaluate(`(async () => {
            const fuentes = await Promise.all([
                document.fonts.load('400 10px "CotizacionPDF"'),
                document.fonts.load('700 10px "CotizacionPDF"')
            ]);

            await document.fonts.ready;

            if (fuentes.some(grupo => grupo.length === 0)) {
                throw new Error('No se cargaron las fuentes del vale');
            }

            await Promise.all(
                Array.from(
                    document.images,
                    imagen => imagen.decode()
                )
            );
        })()`);

        // 8. Paginación: máximo 30 partidas por hoja.
        await page.evaluate(`(async () => {
            const MAX_PRODUCTOS = 30;
            const TOTAL_PRODUCTOS = ${detalles.length};
            const ALTO_DISPONIBLE = ${altoUtilPx} - 12;
            const ANCHO_DISPONIBLE = ${anchoUtilPx};

            const modos = [
                'normal',
                'compacto',
                'muy-compacto'
            ];

            const original = document.getElementById('vale');

            if (!original) {
                throw new Error('No se encontró el contenedor #vale');
            }

            const cuerpoOriginal = original.querySelector(
                '.items-table tbody'
            );

            if (!cuerpoOriginal) {
                throw new Error('No se encontró la tabla del vale');
            }

            const filasProductos = Array.from(
                cuerpoOriginal.querySelectorAll('tr.fila-producto')
            );

            const filasRelleno = Array.from(
                cuerpoOriginal.querySelectorAll('tr.fila-vacia')
            );

            if (
                filasProductos.length !== TOTAL_PRODUCTOS ||
                filasProductos.some(fila => fila.cells.length !== 6)
            ) {
                throw new Error(
                    'La tabla no coincide con las partidas del vale'
                );
            }

            const plantilla = original.cloneNode(true);
            original.replaceChildren();

            const crearHoja = async () => {
                const hoja = plantilla.cloneNode(true);

                hoja.removeAttribute('id');
                hoja.classList.add('vale-hoja');
                hoja.dataset.densidad = 'normal';

                original.appendChild(hoja);

                await Promise.all(
                    Array.from(
                        hoja.querySelectorAll('img'),
                        imagen => imagen.decode()
                    )
                );

                return hoja;
            };

            const ajustarHoja = (hoja) => {
                for (const modo of modos) {
                    hoja.dataset.densidad = modo;

                    const rect = hoja.getBoundingClientRect();

                    const alto = Math.max(
                        rect.height,
                        hoja.scrollHeight
                    );

                    const ancho = Math.max(
                        rect.width,
                        hoja.scrollWidth
                    );

                    if (
                        alto <= ALTO_DISPONIBLE &&
                        ancho <= ANCHO_DISPONIBLE + 1
                    ) {
                        return true;
                    }
                }

                return false;
            };

            // Vale sin productos: conserva el comentario en la primera fila.
            if (TOTAL_PRODUCTOS === 0) {
                const hoja = await crearHoja();

                if (!ajustarHoja(hoja)) {
                    const relleno = Array.from(
                        hoja.querySelectorAll('.fila-vacia')
                    );

                    // Conserva la primera fila, que puede tener comentario.
                    relleno.slice(1).forEach(fila => fila.remove());

                    if (!ajustarHoja(hoja)) {
                        throw new Error(
                            'El contenido del vale supera una página. ' +
                            'No se ha recortado el texto.'
                        );
                    }
                }

                return;
            }

            let inicio = 0;

            while (inicio < TOTAL_PRODUCTOS) {
                const hoja = await crearHoja();
                const tbody = hoja.querySelector('.items-table tbody');

                let cantidad = Math.min(
                    MAX_PRODUCTOS,
                    TOTAL_PRODUCTOS - inicio
                );

                let cabe = false;

                while (cantidad > 0) {
                    tbody.replaceChildren();

                    for (
                        let i = inicio;
                        i < inicio + cantidad;
                        i++
                    ) {
                        tbody.appendChild(
                            filasProductos[i].cloneNode(true)
                        );
                    }

                    // Relleno solo para vales cortos completos.
                    if (
                        inicio === 0 &&
                        cantidad === TOTAL_PRODUCTOS &&
                        TOTAL_PRODUCTOS < 10
                    ) {
                        filasRelleno.forEach(fila => {
                            tbody.appendChild(fila.cloneNode(true));
                        });
                    }

                    cabe = ajustarHoja(hoja);

                    // Retira filas vacías antes de mover productos.
                    if (!cabe) {
                        tbody.querySelectorAll('.fila-vacia')
                            .forEach(fila => fila.remove());

                        cabe = ajustarHoja(hoja);
                    }

                    if (cabe) {
                        break;
                    }

                    // Si el texto es extenso, mueve la última partida
                    // a la página siguiente.
                    cantidad--;
                }

                if (!cabe) {
                    throw new Error(
                        'La partida ' + (inicio + 1) +
                        ' contiene demasiado texto para una hoja. ' +
                        'No se ha recortado su contenido.'
                    );
                }

                inicio += cantidad;
            }
        })()`);

        const pdfBuffer = await page.pdf({
            format: 'Letter',
            landscape: true,
            preferCSSPageSize: true,
            printBackground: true,
            scale: 1,
            margin: {
                top: '12mm',
                bottom: '12mm',
                left: '12mm',
                right: '12mm'
            }
        });

        return Buffer.from(pdfBuffer);
    } finally {
        await browser.close();
    }
}
}