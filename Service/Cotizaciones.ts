import pool from '../Config/db';
import { CotizacionCompleta, Cotizacion } from '../Model/Cotizacion';
const puppeteer = require('puppeteer');
import fs from 'fs';
import path from 'path';
export class CotizacionService {
    static async obtenerCotizaciones(pagina: number = 1, limite: number = 10) {
        const offset = (pagina - 1) * limite;
        const [rows]: any = await pool.query('CALL sp_cotizaciones_mes_actual(?, ?)', [limite, offset]);
        const cotizacionesMes = rows[0];
        const queryCount = `
            SELECT COUNT(*) as total 
            FROM verCot 
            WHERE MONTH(fecha) = MONTH(CURRENT_DATE()) 
              AND YEAR(fecha) = YEAR(CURRENT_DATE())
        `;
        const [totalRows]: any = await pool.query(queryCount);
        const total = totalRows[0].total;
        return {
            cot: cotizacionesMes,
            total: total,
            paginas: Math.ceil(total / limite),
            paginaActual: pagina
        };
    }
static async guardarCotizacion(c: any): Promise<{ id: number, num_cotizacion: string }> {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        // Actualizado a 16 parámetros (incluyendo los @OUT)
        await connection.query('CALL sp_guardar_cotizacion(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, @nuevo_id, @nuevo_folio)', [
            c.id_asesor,
            c.id_cliente || null,
            c.nombre_prospecto || null,
            c.contacto || null,
            c.direccion || null,       // NUEVO
            c.nombre_contacto || null, // NUEVO
            c.correo || null,          // NUEVO
            c.ciudad_destino || null,
            c.moneda || 'MONEDA NACIONAL',
            c.tipo_cambio,
            c.vigencia_dias || 15,
            c.subtotal,
            c.iva,
            c.total
        ]);

        const [rows]: any = await connection.query('SELECT @nuevo_id AS id_cotizacion, @nuevo_folio AS num_cotizacion');
        const idCotizacion = rows[0].id_cotizacion;
        const numCotizacion = rows[0].num_cotizacion;

        if (c.detalles && c.detalles.length > 0) {
            for (const item of c.detalles) {
                await connection.query(
                    // Se agregó la columna "observaciones"
                    `INSERT INTO detalles_cotizacion 
                    (id_cotizacion, id_producto, codigo_manual, descripcion_manual, extra_descripcion_manual, observaciones, cantidad_producto, origen, tiempo_entrega, precio_unitario_cotizado, tipo_flete, valor_flete, moneda_flete, costo_flete) 
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, // Ahora son 14 signos de interrogación
                    [
                        idCotizacion,
                        item.id_producto || null,
                        item.codigo_manual || null,
                        item.descripcion_manual || null,
                        item.extra_descripcion_manual || null,
                        item.observaciones || null, // NUEVO
                        item.cantidad_producto,
                        item.origen || null,
                        item.tiempo_entrega || 'INMEDIATO',
                        item.precio_unitario_cotizado,
                        item.tipo_flete || 'FIJO',
                        item.valor_flete || 0,
                        item.moneda_flete || 'MXN',
                        item.costo_flete || 0
                    ]
                );
            }
        }

        await connection.commit();
        return { id: idCotizacion, num_cotizacion: numCotizacion };

    } catch (error: any) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
}

   static async modificarCotizacion(id: number, c: any) {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        // Actualizado a 14 parámetros exactos del SP
        await connection.query('CALL sp_modificar_cotizacion(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', [
            id,
            c.id_cliente || null,
            c.nombre_prospecto || null,
            c.contacto || null,
            c.direccion || null,       // NUEVO
            c.nombre_contacto || null, // NUEVO
            c.correo || null,          // NUEVO
            c.ciudad_destino || null,
            c.moneda || 'MONEDA NACIONAL',
            c.tipo_cambio,
            c.vigencia_dias || 15,
            c.subtotal,
            c.iva,
            c.total
        ]);

        await connection.query('DELETE FROM detalles_cotizacion WHERE id_cotizacion = ?', [id]);
        
        if (c.detalles && c.detalles.length > 0) {
            for (const item of c.detalles) {
                await connection.query(
                    // Se agregó la columna "observaciones"
                    `INSERT INTO detalles_cotizacion 
                    (id_cotizacion, id_producto, codigo_manual, descripcion_manual, extra_descripcion_manual, observaciones, cantidad_producto, origen, tiempo_entrega, precio_unitario_cotizado, tipo_flete, valor_flete, moneda_flete, costo_flete) 
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, // Ahora son 14 signos
                    [
                        id,
                        item.id_producto || null,
                        item.codigo_manual || null,
                        item.descripcion_manual || null,
                        item.extra_descripcion_manual || null,
                        item.observaciones || null, // NUEVO
                        item.cantidad_producto,
                        item.origen || null,
                        item.tiempo_entrega || 'INMEDIATO',
                        item.precio_unitario_cotizado,
                        item.tipo_flete || 'FIJO',
                        item.valor_flete || 0,
                        item.moneda_flete || 'MXN',
                        item.costo_flete || 0
                    ]
                );
            }
        }

        await connection.commit();
        return { mensaje: 'Cotización actualizada correctamente' };

    } catch (error: any) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
}
    static async cancelarCotizacion(id: number) {
        const [rows]: any = await pool.query('call CancelarCot(?)', [id]);
        return rows;
    }
    static async cotizacionesMensuales() {
        const query = `
            SELECT 
                COALESCE(SUM(CASE WHEN Estatus = 0 THEN 1 ELSE 0 END), 0) AS canceladas,
                COALESCE(SUM(CASE WHEN Estatus = 1 THEN 1 ELSE 0 END), 0) AS pendientes,
                COALESCE(SUM(CASE WHEN Estatus = 2 THEN 1 ELSE 0 END), 0) AS aceptadas,
                COUNT(*) AS total_mes
            FROM cotizaciones
            WHERE MONTH(fecha) = MONTH(CURRENT_DATE()) 
              AND YEAR(fecha) = YEAR(CURRENT_DATE());
        `;

        const [rows]: any = await pool.query(query);
        return rows[0];
    }
    static async obtenerCotizacionId(id: number) {
        const query = 'SELECT * FROM verDetallesCot WHERE id_cotizacion = ?';
        const [rows]: any = await pool.query(query, [id]);
        return rows;
    }
    static async BuscaryFiltrar(
        busqueda: string,
        estatus: number = -1,
        fechaInicio: string | null,
        fechaFin: string | null,
        ordenTotal: string | null,
        pagina: number = 1,
        limite: number = 10,
        idAsesor: number,
        rol: string
    ) {

        const offset = (pagina - 1) * limite;

        const [rows]: any = await pool.query('CALL sp_buscar_filtrar_cotizaciones(?, ?, ?, ?, ?, ?, ?, ?, ?)', [
            busqueda,
            estatus,
            fechaInicio,
            fechaFin,
            ordenTotal,
            limite,
            offset,
            idAsesor,
            rol
        ]);

        const cot = rows[0];
        const total = rows[1] ? rows[1][0].total : 0;

        return {
            cot: cot,
            total: total,
            paginas: Math.ceil(total / limite),
            paginaActual: pagina
        };
    }
    static async convertirAPedido(idCotizacion: number, orden_compra: string) {
        const connection = await pool.getConnection();
        try {
            await connection.query(
                'CALL sp_convertir_cotizacion_pedido(?, ? , @nuevo_pedido, @mensaje_res)', // <-- Quitamos los dos '?'
                [idCotizacion, orden_compra]
            );

            const [rows]: any = await connection.query('SELECT @nuevo_pedido AS id_pedido, @mensaje_res AS mensaje');
            const resultado = rows[0];

            if (resultado.id_pedido === -1) {
                throw new Error(resultado.mensaje);
            }

            return {
                id_pedido: resultado.id_pedido,
                mensaje: resultado.mensaje
            };

        } catch (error: any) {
            throw error;
        } finally {
            connection.release();
        }
    }
    static async buscarProductos(busqueda: string, id_proveedor: number | null = null) {
        const terminoLimpio = busqueda.trim();
        const [rows]: any = await pool.query('CALL sp_buscar_producto_para_cotizacion(?, ?)', [
            terminoLimpio,
            id_proveedor
        ]);
        return rows[0];
    }
static async generarPDFCotizacion(id_cotizacion: number) {
    const connection = await pool.getConnection();
    try {
        const [cotizaciones]: any = await connection.query(`
            SELECT c.*, 
                   COALESCE(cl.Nombre, c.nombre_prospecto) AS nombre_cliente_final,
                   COALESCE(cl.Direccion, c.direccion) AS direccion_final,
                   COALESCE(cl.nombre_contacto, c.nombre_contacto) AS contacto_final, 
                   COALESCE(cl.contacto_principal, c.contacto) AS telfax_cliente_final,
                   COALESCE(cl.correo_contacto, c.correo) AS email_cliente_final,
                   
                   CONCAT(a.Nombre, ' ', a.app) AS nombre_asesor,
                   a.telefono AS tel_asesor
            FROM cotizaciones c
            LEFT JOIN clientes cl ON c.id_cliente = cl.id
            LEFT JOIN asesores a ON c.id_asesor = a.id
            WHERE c.id = ?
        `, [id_cotizacion]);

        if (cotizaciones.length === 0) throw new Error('Cotización no encontrada');
        const cot = cotizaciones[0];

        const [detalles]: any = await connection.query(`
            SELECT *
            FROM verDetallesCot
            WHERE id_cotizacion = ?
            ORDER BY id_detalle
        `, [id_cotizacion]);
        let filasHtml = '';

        // Formato visual: comas de miles y punto decimal para MXN y USD.
        // Los cálculos siguen usando números; el símbolo $ ya está en la plantilla.
        const formatoImporte = new Intl.NumberFormat('en-US', {
            useGrouping: true,
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
        const formatearImporte = (valor: unknown): string => {
            const numero = Number(valor);
            if (!Number.isFinite(numero)) {
                throw new Error('La cotización contiene un importe no válido');
            }
            return formatoImporte.format(numero);
        };

        const esUSD = cot.moneda === 'USD';
        const factorConversion = (esUSD && cot.tipo_cambio > 0) ? Number(cot.tipo_cambio) : 1;

        // Conserva Unicode válido, incluidos ñ, acentos y símbolos técnicos.
        const normalizarTextoPDF = (valor: unknown): string => {
            if (valor === null || valor === undefined) return '';
            return String(valor)
                .normalize('NFC')
                .replace(/\r\n?/g, '\n')
                .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F]/g, ' ');
        };

        const escapeHtml = (valor: unknown): string => normalizarTextoPDF(valor)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');

        detalles.forEach((item: any, index: number) => {
            const precioTotalPartida = Number(item.precio_unitario_cotizado) + Number(item.costo_flete);
            const precioUnitarioConvertido = precioTotalPartida / factorConversion;
            const subtotalLineaConvertido = Number(item.subtotal_partida) / factorConversion;

            const origen = normalizarTextoPDF(item.origen).trim().toUpperCase();
            const esOrigenRojo = /reab|obsoleto/i.test(origen);
            const tieneOrigen = origen !== '';

            const observacion = normalizarTextoPDF(item.observaciones).trim();
            const tieneObservacion = observacion !== '';

            const tiempoEntrega = (normalizarTextoPDF(item.tiempo_entrega).trim() || 'INMEDIATO').toUpperCase();

            // ── Determina qué ocupa el slot derecho (donde normalmente va el ORIGEN) ──
            let origenVaEnDescripcion = false;
            let contenidoSlotDerecho = '';

            if (tieneOrigen && tieneObservacion) {
                // Ambos: el origen se desplaza a la columna DESCRIPCION,
                // la observación toma el lugar del origen.
                origenVaEnDescripcion = true;
                contenidoSlotDerecho = `<span class="extra-desc-origen">${escapeHtml(observacion)}</span>`;
            } else if (tieneOrigen) {
                // Solo origen: comportamiento normal.
                contenidoSlotDerecho = `<span class="extra-desc-origen${esOrigenRojo ? ' origen-rojo' : ''}">${escapeHtml(origen)}</span>`;
            } else if (tieneObservacion) {
                // Solo observación: toma el lugar del origen.
                contenidoSlotDerecho = `<span class="extra-desc-origen">${escapeHtml(observacion)}</span>`;
            }

            const hayContenidoDerecho = contenidoSlotDerecho !== '';

            const celdaExtra = hayContenidoDerecho
                ? `<div class="extra-desc-flex has-origen">
                        <span class="extra-desc-text">${escapeHtml(item.extra_descripcion)}</span>
                        ${contenidoSlotDerecho}
                   </div>`
                : `<div class="extra-desc-flex">
                        <span class="extra-desc-text">${escapeHtml(item.extra_descripcion)}</span>
                   </div>`;

            // Conserva la regla actual: si hay origen y observación, aquí se muestra el origen.
            const descripcionCompleta = origenVaEnDescripcion
                ? `<span style="font-weight:bold; color:${esOrigenRojo ? '#db1c1c' : '#000'};">${escapeHtml(origen)}</span>`
                : escapeHtml(item.nombre_producto);

            filasHtml += `
            <tr class="fila-producto">
                <td>${index + 1}</td>
                <td>${escapeHtml(item.cantidad_producto)}</td>
                <td>${escapeHtml(item.codigo_producto)}</td>
                <td class="text-left">${descripcionCompleta}</td>
                <td class="text-left">${celdaExtra}</td>
                <td>${escapeHtml(tiempoEntrega)}</td>
                <td>$${formatearImporte(precioUnitarioConvertido)}</td>
                <td class="font-bold">$${formatearImporte(subtotalLineaConvertido)}</td>
            </tr>`;
        });


        const FILAS_MINIMAS = 6;
        for (let i = detalles.length; i < FILAS_MINIMAS - 1; i++) {
            filasHtml += '<tr class="fila-relleno"><td>&nbsp;</td><td></td><td></td><td></td><td></td><td></td><td></td><td></td></tr>';
        }

        const rutaPlantilla = path.join(__dirname, '../Template/Plantilla.html');
        const rutaLogo = path.join(__dirname, '../assets/logo_atc.png');
        const rutaSMC = path.join(__dirname, '../assets/smc.png');
        const rutaBanner = path.join(__dirname, '../assets/banner.png');
        let htmlString = fs.readFileSync(rutaPlantilla, 'utf8');

        const logoBase64 = 'data:image/png;base64,' + fs.readFileSync(rutaLogo, 'base64');
        const bannerBase64 = 'data:image/png;base64,' + fs.readFileSync(rutaBanner, 'base64');
        const smcBase64 = 'data:image/png;base64,' + fs.readFileSync(rutaSMC, 'base64');

        const cargarFuente = (archivo: string): string => {
            const ruta = path.join(__dirname, '../assets/fonts', archivo);
            return 'data:font/ttf;base64,' + fs.readFileSync(ruta, 'base64');
        };

        const valores: Record<string, string> = {
            fuente_regular: cargarFuente('NotoSans-Regular.ttf'),
            fuente_bold: cargarFuente('NotoSans-Bold.ttf'),
            logo_atc_base64: logoBase64,
            banner_marcas_base64: bannerBase64,
            smc_base64: smcBase64,
            num_cotizacion: escapeHtml(cot.num_cotizacion),
            fecha: escapeHtml(new Date(cot.fecha).toLocaleDateString('es-MX')),
            nombre_cliente: escapeHtml(cot.nombre_cliente_final),
            direccion_cliente: escapeHtml(cot.direccion_final),
            contacto: escapeHtml(cot.contacto_final),
            ciudad_destino: escapeHtml(cot.ciudad_destino),
            email_cliente: escapeHtml(cot.email_cliente_final),
            telfax_cliente: escapeHtml(cot.telfax_cliente_final),
            tel_asesor: escapeHtml(cot.tel_asesor),
            nombre_asesor: escapeHtml(cot.nombre_asesor),
            filas_productos: filasHtml,
            vigencia_dias: escapeHtml(cot.vigencia_dias || 15),
            subtotal: formatearImporte(cot.subtotal),
            iva: formatearImporte(cot.iva),
            total: formatearImporte(cot.total),
            moneda_texto: esUSD ? 'DOLARES AMERICANOS' : 'MONEDA NACIONAL',
            moneda_color_clase: esUSD ? 'moneda-usd' : 'moneda-mxn',
            texto_monto_letras: ''
        };

        const htmlListo = htmlString.replace(/{{([a-z0-9_]+)}}/g, (marcador, clave: string) => {
            if (!Object.prototype.hasOwnProperty.call(valores, clave)) {
                throw new Error('Marcador desconocido en plantilla: ' + marcador);
            }
            return valores[clave];
        });

        const browser = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox'],
            ...(process.env.PUPPETEER_EXECUTABLE_PATH && { executablePath: process.env.PUPPETEER_EXECUTABLE_PATH })
        });

        try {
            // Requiere: npm install pdf-lib
            const { PDFDocument } = await import('pdf-lib');
            const page = await browser.newPage();

            const DPI = 96;
            const anchoHojaPulgadas = 11;
            const altoHojaPulgadas = 8.5;
            const margenPulgadas = 10 / 25.4;

            const anchoUtilPx = Math.floor((anchoHojaPulgadas - margenPulgadas * 2) * DPI);
            const altoUtilPx = Math.floor((altoHojaPulgadas - margenPulgadas * 2) * DPI);

            await page.setViewport({ width: anchoUtilPx, height: altoUtilPx });
            await page.emulateMediaType('print');
            await page.setContent(htmlListo, { waitUntil: 'load' });

        
            await page.evaluate(`(async () => {
                const fuentes = await Promise.all([
                    document.fonts.load('400 9px "CotizacionPDF"'),
                    document.fonts.load('700 9px "CotizacionPDF"')
                ]);
                await document.fonts.ready;
                if (fuentes.some(grupo => grupo.length === 0)) {
                    throw new Error('No se cargaron las fuentes de la cotización');
                }
            })()`);


            await page.evaluate(`Promise.all(Array.from(document.images, imagen => imagen.decode()))`);
            await page.evaluate(`document.getElementById('cotizacion').style.width = '${anchoUtilPx}px'`);

            const ESCALA_MINIMA = 0.65;
            const HOLGURA_PX = 8;
            const modos = ['normal', 'compacto', 'muy-compacto'];
            let escala = 1;
            let modoElegido = 'normal';

            let cabeEnUnaPagina = false;

            for (const modo of modos) {
                const escalas = modo === 'muy-compacto'
                    ? [1, 0.95, 0.90, 0.85, 0.80, 0.75, 0.70, ESCALA_MINIMA]
                    : [1, 0.95, 0.90];
                await page.evaluate(`document.getElementById('cotizacion').dataset.densidad = '${modo}'`);
                for (const candidata of escalas) {
                    const anchoComposicion = (anchoUtilPx - HOLGURA_PX) / candidata;
                    await page.evaluate(`document.getElementById('cotizacion').style.width = '${anchoComposicion}px'`);
                    const medida = await page.evaluate(`(() => {
                        const contenedor = document.getElementById('cotizacion');
                        const rect = contenedor.getBoundingClientRect();
                        return {
                            alto: Math.max(rect.height, contenedor.scrollHeight),
                            ancho: Math.max(rect.width, contenedor.scrollWidth)
                        };
                    })()`) as { alto: number; ancho: number };
                    if (medida.alto * candidata <= altoUtilPx - HOLGURA_PX &&
                        medida.ancho * candidata <= anchoUtilPx - 2) {
                        escala = candidata;
                        modoElegido = modo;
                        cabeEnUnaPagina = true;
                        break;
                    }
                }
                if (cabeEnUnaPagina) break;
            }

            if (!cabeEnUnaPagina || !Number.isFinite(escala) || escala < ESCALA_MINIMA) {
                throw new Error(
                    'La cotización contiene demasiado texto para una sola hoja carta horizontal. ' +
                    'Reduce las descripciones o utiliza una plantilla de varias páginas. No se ha recortado ningún producto.'
                );
            }

            for (let intento = 0; intento < 5; intento++) {
                const pdfBuffer = await page.pdf({
                    format: 'Letter',
                    printBackground: true,
                    landscape: true,
                    scale: escala,
                    margin: { top: '10mm', bottom: '10mm', left: '10mm', right: '10mm' }
                });
                const documento = await PDFDocument.load(pdfBuffer);
                if (documento.getPageCount() === 1) return pdfBuffer;

                const siguienteEscala = escala * 0.97;
                if (siguienteEscala < ESCALA_MINIMA) break;
                escala = siguienteEscala;
            }

            throw new Error(
                'No fue posible ajustar la cotización a una sola página en modo ' + modoElegido +
                '. Reduce el texto o utiliza una plantilla de varias páginas. No se ha recortado ningún producto.'
            );
        } finally {
            await browser.close();
        }

    } finally {
        connection.release();
    }
}
  static async vincularCliente(id_cotizacion: number, id_cliente: number) {
    const connection = await pool.getConnection();
    try {
        const [clienteRows]: any = await connection.query(
            'SELECT id FROM clientes WHERE id = ? AND (estatus = 1 OR Estatus = 1)',
            [id_cliente]
        );
        if (clienteRows.length === 0) {
            throw new Error('El cliente indicado no existe o está inactivo.');
        }

        await connection.query(
            'UPDATE cotizaciones SET id_cliente = ? WHERE id = ?',
            [id_cliente, id_cotizacion]
        );
        return { mensaje: 'Cliente vinculado correctamente a la cotización.' };
    } finally {
        connection.release();
    }
}
    
}