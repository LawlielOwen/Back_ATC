import pool from '../Config/db';
import fs from 'fs';
import path from 'path';
const puppeteer = require('puppeteer');
export class VisitaDemoService {

  static async consultarVisitas(busqueda: string | null, estatus: number | null, id_tecnico: number | null, pagina: number = 1, limite: number = 10) {
        const offset = (pagina - 1) * limite;
        
        const [rows]: any = await pool.query('CALL sp_buscar_visitas_demo(?, ?, ?, ?, ?)', [
            busqueda || null,
            estatus !== null ? estatus : null,
            id_tecnico || null,
            limite,
            offset
        ]);
        const visitas = rows[0] || [];
        const total = (rows[1] && rows[1][0] && rows[1][0].total !== undefined) ? rows[1][0].total : visitas.length;

        return {
            visitas: visitas,
            total: total,
            paginas: Math.ceil(total / limite) || 1,
            paginaActual: pagina
        };
    }

    // Obtener una visita específica por ID
    static async obtenerVisitaPorId(id: number) {
        const [rows]: any = await pool.query('SELECT * FROM verVisitasDemostracion WHERE id_visita = ?', [id]);
        return rows[0];
    }

    // Obtener los productos demo asociados a una visita
    static async obtenerDetallesVisita(id_visita: number) {
        const [rows]: any = await pool.query('SELECT * FROM verDetallesVisitaDemo WHERE id_visita = ?', [id_visita]);
        return rows;
    }

    // Crear la visita (El "Antes": programa la visita y los demos que se lleva)
    static async crearVisita(data: { fecha_visita: string, id_tecnico: number, id_asesor: number, id_cliente: number | null, empresa_no_registrada: string | null, demos: any[] }) {
        const jsonDemos = JSON.stringify(data.demos);
        
        const [result]: any = await pool.query('CALL sp_crear_visita_demo(?, ?, ?, ?, ?, ?)', [
            data.fecha_visita,
            data.id_tecnico,
            data.id_asesor,
            data.id_cliente,
            data.empresa_no_registrada,
            jsonDemos
        ]);
        
        return result[0][0];
    }

    static async completarVisita(id_visita: number, resumen_actividades: string, retornos: any[]) {
        const jsonRetornos = JSON.stringify(retornos);

        const [result]: any = await pool.query('CALL sp_completar_visita_demo(?, ?, ?)', [
            id_visita,
            resumen_actividades,
            jsonRetornos
        ]);

        return result[0];
    }

    static async cancelarVisita(id_visita: number) {
        const [result]: any = await pool.query('CALL sp_cancelar_visita_demo(?)', [id_visita]);
        return result[0];
    }
    static async generarPDFVisita(id_visita: number) {
    const connection = await pool.getConnection();
    try {
        // 1. Obtener la visita (encabezado, cliente, asesor, técnico, resumen)
        const [visitas]: any = await connection.query(
            'SELECT * FROM verVisitasDemostracion WHERE id_visita = ?',
            [id_visita]
        );

        if (visitas.length === 0) throw new Error('Visita no encontrada');
        const visita = visitas[0];

        // 2. Obtener los equipos demo asociados a la visita
        const [detalles]: any = await connection.query(
            'SELECT * FROM verDetallesVisitaDemo WHERE id_visita = ?',
            [id_visita]
        );

        const escapeHtml = (str: any) => {
            if (str === null || str === undefined) return '';
            return String(str)
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;');
        };

        // ⚠️ AJUSTA este mapeo según los valores reales que usan
        // sp_completar_visita_demo / sp_cancelar_visita_demo para "estatus"
        const ESTATUS_MAP: Record<number, { texto: string; clase: string }> = {
            0: { texto: 'PROGRAMADA', clase: 'programada' },
            1: { texto: 'COMPLETADA', clase: 'completada' },
            2: { texto: 'CANCELADA', clase: 'cancelada' }
        };
        const estatusInfo = ESTATUS_MAP[Number(visita.estatus)] ?? ESTATUS_MAP[0];

        // 3. Construir filas de la tabla de equipos
        let filasHtml = '';
        let totalEquipos = 0;

        detalles.forEach((item: any, index: number) => {
            const cantidad = Number(item.cantidad) || 0;
            totalEquipos += cantidad;

            filasHtml += `
            <tr>
                <td>${index + 1}</td>
                <td>${escapeHtml(item.numero_serie)}</td>
                <td class="col-modelo">${escapeHtml(item.nombre_modelo)}</td>
                <td>${escapeHtml(item.marca_proveedor)}</td>
                <td>${cantidad}</td>
                <td><span class="badge-retorno">${escapeHtml(item.estatus_retorno) || 'PENDIENTE'}</span></td>
            </tr>`;
        });

        const FILAS_MINIMAS = 6;
        for (let i = detalles.length; i < FILAS_MINIMAS; i++) {
            filasHtml += `<tr><td>&nbsp;</td><td></td><td></td><td></td><td></td><td></td></tr>`;
        }

        // 4. Cargar plantilla y assets
        const rutaPlantilla = path.join(__dirname, '../Template/PlantillaVisita.html');
        const rutaLogo = path.join(__dirname, '../assets/logo_atc.png');
        const rutaSMC = path.join(__dirname, '../assets/smc.png');
        let htmlString = fs.readFileSync(rutaPlantilla, 'utf8');

        const logoBase64 = 'data:image/png;base64,' + fs.readFileSync(rutaLogo, 'base64');
        const smcBase64 = 'data:image/png;base64,' + fs.readFileSync(rutaSMC, 'base64');

        const nombreCliente = visita.empresa_destino
            || visita.nombre_cliente_oficial
            || visita.empresa_no_registrada
            || '';

        const htmlListo = htmlString
            .replace(/{{logo_atc_base64}}/g, logoBase64)
            .replace(/{{smc_base64}}/g, smcBase64)
            .replace(/{{folio_visita}}/g, String(visita.id_visita).padStart(5, '0'))
            .replace(/{{fecha_visita}}/g, visita.fecha_visita
                ? new Date(visita.fecha_visita).toLocaleDateString('es-MX')
                : '')
            .replace(/{{estatus_clase}}/g, estatusInfo.clase)
            .replace(/{{estatus_texto}}/g, estatusInfo.texto)
            .replace(/{{nombre_cliente}}/g, escapeHtml(nombreCliente))
            .replace(/{{nombre_asesor}}/g, escapeHtml(visita.nombre_asesor))
            .replace(/{{nombre_tecnico}}/g, escapeHtml(visita.nombre_tecnico))
            .replace(/{{filas_productos}}/g, filasHtml)
            .replace(/{{total_equipos}}/g, String(totalEquipos))
            .replace(/{{resumen_actividades}}/g, escapeHtml(visita.resumen_actividades) || 'Sin observaciones.');

        // 5. Generar el PDF (plantilla es PORTRAIT, a diferencia de cotizaciones)
        const browser = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox'],
            ...(process.env.PUPPETEER_EXECUTABLE_PATH && { executablePath: process.env.PUPPETEER_EXECUTABLE_PATH })
        });

        const page = await browser.newPage();

        const DPI = 96;
        const anchoHojaPulgadas = 8.5;
        const altoHojaPulgadas = 11;
        const margenPulgadas = 8 / 25.4; // 8mm, igual que el @page de la plantilla

        const anchoUtilPx = Math.floor((anchoHojaPulgadas - margenPulgadas * 2) * DPI);
        const altoUtilPx = Math.floor((altoHojaPulgadas - margenPulgadas * 2) * DPI);

        await page.setViewport({ width: anchoUtilPx, height: altoUtilPx });
        await page.setContent(htmlListo, { waitUntil: 'load' });

        const alturaContenidoPx = await page.evaluate('document.body.scrollHeight') as number;

        let escala = 1;
        if (alturaContenidoPx > altoUtilPx) {
            escala = altoUtilPx / alturaContenidoPx;
            escala = Math.max(escala, 0.65);
        }

        const pdfBuffer = await page.pdf({
            format: 'Letter',
            printBackground: true,
            landscape: false,
            scale: escala,
            margin: { top: '8mm', bottom: '8mm', left: '8mm', right: '8mm' }
        });

        await browser.close();
        return pdfBuffer;

    } finally {
        connection.release();
    }
}
}