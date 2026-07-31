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
static async guardarCotizacion(c: any): Promise<number> {
        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();

            await connection.query('CALL sp_guardar_cotizacion(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, @nuevo_id)', [
                c.id_asesor,
                c.id_cliente || null,
                c.nombre_prospecto || null,
                c.contacto || null,
                c.ciudad_destino || null,
                c.moneda || 'MONEDA NACIONAL',
                c.tipo_cambio,
                c.vigencia_dias || 15, 
                c.subtotal,
                c.iva,
                c.total
            ]);

            const [rows]: any = await connection.query('SELECT @nuevo_id AS id_cotizacion');
            const idCotizacion = rows[0].id_cotizacion;

            if (c.detalles && c.detalles.length > 0) {
                for (const item of c.detalles) {
                    
                    // =================================================================
                    // 1. Consultar la marca y el origen fijo del producto en la BD
                    // =================================================================
                    const [prodRows]: any = await connection.query(
                        `SELECT m.Nombre AS marca, p.origen 
                         FROM productos p 
                         LEFT JOIN marca_proveedor m ON p.id_marca = m.id 
                         WHERE p.id = ?`, 
                        [item.id_producto]
                    );
                    
                    const productoInfo = prodRows[0] || {};
                    let origenFinal = item.origen; // Por defecto, asumimos que el frontend manda el origen manual
                    
                    // =================================================================
                    // 2. Lógica de Negocio: SMC tiene origen fijo, sobreescribimos lo del frontend
                    // =================================================================
                    if (productoInfo.marca === 'SMC') {
                        // Forzamos el origen que ya está registrado en el inventario
                        origenFinal = productoInfo.origen; 
                    }

                    // =================================================================
                    // 3. Insertar el detalle con el origen ya definido
                    // =================================================================
                    await connection.query(
                        `INSERT INTO detalles_cotizacion 
                        (id_producto, id_cotizacion, cantidad_producto, origen, tiempo_entrega, precio_unitario_cotizado) 
                        VALUES (?, ?, ?, ?, ?, ?)`,
                        [
                            item.id_producto,
                            idCotizacion,
                            item.cantidad_producto,
                            origenFinal || null, // Se guardará el fijo de SMC o el manual del frontend
                            item.tiempo_entrega || 'INMEDIATO', 
                            item.precio_unitario_cotizado
                        ]
                    );
                }
            }

            await connection.commit();
            return idCotizacion;

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
            
            // 1. Actualizamos la cabecera enviando los 11 parámetros requeridos por el SP
            await connection.query('CALL sp_modificar_cotizacion(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', [
                id,
                c.id_cliente || null,
                c.nombre_prospecto || null,
                c.contacto || null,
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
                    
                    const [prodRows]: any = await connection.query(
                        `SELECT m.Nombre AS marca, p.origen 
                         FROM productos p 
                         LEFT JOIN marca_proveedor m ON p.id_marca = m.id 
                         WHERE p.id = ?`, 
                        [item.id_producto]
                    );
                    
                    const productoInfo = prodRows[0] || {};
                    let origenFinal = item.origen; 
                    
                    if (productoInfo.marca === 'SMC') {
                        origenFinal = productoInfo.origen; 
                    }

                    await connection.query(
                        `INSERT INTO detalles_cotizacion 
                        (id_producto, id_cotizacion, cantidad_producto, origen, tiempo_entrega, precio_unitario_cotizado) 
                        VALUES (?, ?, ?, ?, ?, ?)`,
                        [
                            item.id_producto, 
                            id, 
                            item.cantidad_producto, 
                            origenFinal || null, 
                            item.tiempo_entrega || 'INMEDIATO',
                            item.precio_unitario_cotizado
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
        limite: number = 10
    ) {

        const offset = (pagina - 1) * limite;

        const [rows]: any = await pool.query('CALL sp_buscar_filtrar_cotizaciones(?, ?, ?, ?, ?, ?, ?)', [
            busqueda,
            estatus,
            fechaInicio,
            fechaFin,
            ordenTotal,
            limite,
            offset
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
            // 1. Obtener datos principales de la cotización y cliente
            const [cotizaciones]: any = await connection.query(`
                SELECT c.*, 
                       COALESCE(cl.Nombre, c.nombre_prospecto) AS nombre_cliente_final,
                       cl.Direccion, 
                       cl.contacto_principal AS telfax_cliente,
                       cl.correo_contacto AS email_cliente,
                       CONCAT(a.Nombre, ' ', a.app) AS nombre_asesor,
                       a.telefono AS tel_asesor
                FROM cotizaciones c
                LEFT JOIN clientes cl ON c.id_cliente = cl.id
                LEFT JOIN asesores a ON c.id_asesor = a.id
                WHERE c.id = ?
            `, [id_cotizacion]);

            if (cotizaciones.length === 0) throw new Error('Cotización no encontrada');
            const cot = cotizaciones[0];

            // 2. Obtener las partidas (productos)
            const [detalles]: any = await connection.query(`
                SELECT d.*, p.Codigo_numeral, p.Descripcion as nombre_producto,p.ExtraDescripcion
                FROM detalles_cotizacion d
                LEFT JOIN productos p ON d.id_producto = p.id
                WHERE d.id_cotizacion = ?
            `, [id_cotizacion]);

            // 3. Armar las filas de la tabla
            let filasHtml = '';

            // Verificamos si es USD y si hay un tipo de cambio válido (mayor a 0)
            const esUSD = cot.moneda === 'USD';
            const factorConversion = (esUSD && cot.tipo_cambio > 0) ? Number(cot.tipo_cambio) : 1;

           const escapeHtml = (str: any) => {
    if (str === null || str === undefined) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
};

detalles.forEach((item: any, index: number) => {
    const precioUnitarioConvertido = Number(item.precio_unitario_cotizado) / factorConversion;
    const subtotalLineaConvertido = (item.cantidad_producto * Number(item.precio_unitario_cotizado)) / factorConversion;

    const origen = item.origen ? String(item.origen).trim() : '';


    const esOrigenRojo = /reab|obsoleto/i.test(origen);

    const celdaExtra = origen
        ? `<div class="extra-desc-flex has-origen">
                <span class="extra-desc-text">${escapeHtml(item.ExtraDescripcion)}</span>
                <span class="extra-desc-origen${esOrigenRojo ? ' origen-rojo' : ''}">${escapeHtml(origen)}</span>
           </div>`
        : `<div class="extra-desc-flex">
                <span class="extra-desc-text">${escapeHtml(item.ExtraDescripcion)}</span>
           </div>`;

    filasHtml += `
    <tr>
        <td>${index + 1}</td>
        <td>${item.cantidad_producto}</td>
        <td>${item.Codigo_numeral || 'S/C'}</td>
        <td class="text-left">${escapeHtml(item.nombre_producto)}</td>
        <td class="text-left">${celdaExtra}</td>
        <td>${item.tiempo_entrega || 'INMEDIATO'}</td>
        <td>$${precioUnitarioConvertido.toFixed(2)}</td>
        <td class="font-bold">$${subtotalLineaConvertido.toFixed(2)}</td>
    </tr>`;
});

           const FILAS_MINIMAS = 6;
for (let i = detalles.length; i < FILAS_MINIMAS; i++) {
    filasHtml += `<tr><td>&nbsp;</td><td></td><td></td><td></td><td></td><td></td><td></td><td></td></tr>`;
}


            const rutaPlantilla = path.join(__dirname, '../Template/Plantilla.html');
            const rutaLogo = path.join(__dirname, '../assets/logo_atc.png');
            const rutaSMC = path.join(__dirname, '../assets/smc.png');
            const rutaBanner = path.join(__dirname, '../assets/banner.png');
            // Leer HTML como texto
            let htmlString = fs.readFileSync(rutaPlantilla, 'utf8');

            // Leer imágenes y convertirlas a Base64 para inyectarlas directamente
            const logoBase64 = 'data:image/png;base64,' + fs.readFileSync(rutaLogo, 'base64');
            const bannerBase64 = 'data:image/png;base64,' + fs.readFileSync(rutaBanner, 'base64');
            const smcBase64 = 'data:image/png;base64,' + fs.readFileSync(rutaSMC, 'base64');

            const htmlListo = htmlString
                // Primero inyectamos las imágenes en Base64
                .replace(/{{logo_atc_base64}}/g, logoBase64)
                .replace(/{{banner_marcas_base64}}/g, bannerBase64)
                .replace(/{{smc_base64}}/g, smcBase64)
                // Luego inyectamos los datos de la base de datos
                .replace(/{{num_cotizacion}}/g, cot.num_cotizacion || '')
                .replace(/{{fecha}}/g, new Date(cot.fecha).toLocaleDateString('es-MX'))
                .replace(/{{nombre_cliente}}/g, cot.nombre_cliente_final || '')
                .replace(/{{direccion_cliente}}/g, cot.Direccion || '')
                .replace(/{{contacto}}/g, cot.contacto || '')
                .replace(/{{ciudad_destino}}/g, cot.ciudad_destino || '')
                .replace(/{{email_cliente}}/g, cot.email_cliente || '')
                .replace(/{{telfax_cliente}}/g, cot.telfax_cliente || '')
                .replace(/{{tel_asesor}}/g, cot.tel_asesor || '')
                .replace(/{{nombre_asesor}}/g, cot.nombre_asesor || '')
                .replace(/{{filas_productos}}/g, filasHtml)
                .replace(/{{vigencia_dias}}/g, cot.vigencia_dias || 15)
                .replace(/{{subtotal}}/g, Number(cot.subtotal).toFixed(2))
                .replace(/{{iva}}/g, Number(cot.iva).toFixed(2))
                .replace(/{{total}}/g, Number(cot.total).toFixed(2))
                .replace(/{{moneda_texto}}/g, cot.moneda === 'USD' ? 'DOLARES AMERICANOS' : 'MONEDA NACIONAL')
                .replace(/{{texto_monto_letras}}/g, 'AQUÍ VA TU TEXTO EN LETRAS');

          const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    ...(process.env.PUPPETEER_EXECUTABLE_PATH && { executablePath: process.env.PUPPETEER_EXECUTABLE_PATH })
});

const page = await browser.newPage();

const DPI = 96;
const anchoHojaPulgadas = 11;
const altoHojaPulgadas = 8.5;
const margenPulgadas = 10 / 25.4;

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
    landscape: true,
    scale: escala,   
    margin: { top: '10mm', bottom: '10mm', left: '10mm', right: '10mm' }
});

await browser.close();
return pdfBuffer;

        } finally {
            // Siempre liberamos la conexión a la base de datos
            connection.release();
        }
    }
    static async vincularCliente(id_cotizacion: number, id_cliente: number) {
    const connection = await pool.getConnection();
    try {
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