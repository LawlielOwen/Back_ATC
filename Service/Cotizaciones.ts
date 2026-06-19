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
                c.vigencia_dias || 15, // Si no lo mandan, por defecto 15 días
                c.subtotal,
                c.iva,
                c.total
            ]);

            const [rows]: any = await connection.query('SELECT @nuevo_id AS id_cotizacion');
            const idCotizacion = rows[0].id_cotizacion;

            if (c.detalles && c.detalles.length > 0) {
                for (const item of c.detalles) {
                    // Actualizamos el INSERT para incluir la descripción extra y el tiempo de entrega
                    await connection.query(
                        `INSERT INTO detalles_cotizacion 
                        (id_producto, id_cotizacion, cantidad_producto, extra_descripcion, tiempo_entrega, precio_unitario_cotizado) 
                        VALUES (?, ?, ?, ?, ?, ?)`,
                        [
                            item.id_producto,
                            idCotizacion,
                            item.cantidad_producto,
                            item.extra_descripcion || null,
                            item.tiempo_entrega || 'INMEDIATO', // Valor por defecto si no lo envían
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
    static async modificarCotizacion(id: number, c: CotizacionCompleta) {
        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();
            await connection.query('CALL sp_modificar_cotizacion(?, ?, ?, ?, ?, ?, ?, ?)', [
                id,
                c.extra_descripcion || null,
                c.id_cliente || null,
                c.nombre_prospecto || null,
                c.tipo_cambio,
                c.subtotal,
                c.iva,
                c.total
            ]);
            await connection.query('DELETE FROM detalles_cotizacion WHERE id_cotizacion = ?', [id]);
            if (c.detalles && c.detalles.length > 0) {
                for (const item of c.detalles) {
                    await connection.query(
                        `INSERT INTO detalles_cotizacion 
                        (id_producto, id_cotizacion, cantidad_producto, precio_unitario_cotizado) 
                        VALUES (?, ?, ?, ?)`,
                        [item.id_producto, id, item.cantidad_producto, item.precio_unitario_cotizado]
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
    static async BuscaryFiltrar(busqueda: string, estatus: number = -1,
        fechaInicio: string | null, fechaFin: string | null, ordenTotal: string = '',
        pagina: number = 1, limite: number = 10) {
        const [rows]: any = await pool.query('CALL sp_buscar_filtrar_cotizaciones(?, ?, ?, ?, ?, ?, ?)', [
            busqueda,
            estatus,
            fechaInicio,
            fechaFin,
            ordenTotal,
            pagina,  // Mandamos la página
            limite   // Mandamos el límite
        ]);

        const cot = rows[0];
        const total = rows[1][0].total;

        return {
            cot: cot,
            total: total,
            paginas: Math.ceil(total / limite),
            paginaActual: pagina
        };
    }
    static async convertirAPedido(idCotizacion: number) { // <-- Solo recibe el ID
        const connection = await pool.getConnection();
        try {
            await connection.query(
                'CALL sp_convertir_cotizacion_pedido(?, @nuevo_pedido, @mensaje_res)', // <-- Quitamos los dos '?'
                [idCotizacion]
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
                       cl.telefono AS telfax_cliente,
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
                SELECT d.*, p.Codigo_numeral, p.Nombre as nombre_producto
                FROM detalles_cotizacion d
                LEFT JOIN productos p ON d.id_producto = p.id
                WHERE d.id_cotizacion = ?
            `, [id_cotizacion]);

            // 3. Armar las filas de la tabla
            let filasHtml = '';
            
            // Verificamos si es USD y si hay un tipo de cambio válido (mayor a 0)
            const esUSD = cot.moneda === 'USD';
            const factorConversion = (esUSD && cot.tipo_cambio > 0) ? Number(cot.tipo_cambio) : 1;

            detalles.forEach((item: any, index: number) => {
                const precioUnitarioConvertido = Number(item.precio_unitario_cotizado) / factorConversion;
                const subtotalLineaConvertido = (item.cantidad_producto * Number(item.precio_unitario_cotizado)) / factorConversion;
                
                filasHtml += `
                <tr>
                    <td>${index + 1}</td>
                    <td>${item.cantidad_producto}</td>
                    <td>${item.Codigo_numeral || 'S/C'}</td>
                    <td class="text-left">${item.nombre_producto}</td>
                    <td class="text-left">${item.extra_descripcion || ''}</td>
                    <td>${item.tiempo_entrega || 'INMEDIATO'}</td>
                    <td>$${precioUnitarioConvertido.toFixed(2)}</td>
                    <td class="font-bold">$${subtotalLineaConvertido.toFixed(2)}</td>
                </tr>`;
            });

            // Rellenar con filas vacías (para mantener el formato Excel hasta abajo)
            for (let i = detalles.length; i < 15; i++) {
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

            // =========================================================
            // 6. GENERACIÓN DEL PDF CON PUPPETEER
            // =========================================================
            const browser = await puppeteer.launch({
                args: ['--no-sandbox', '--disable-setuid-sandbox'] // Básico para evitar errores en el servidor
            });

            const page = await browser.newPage();

            // Cargamos el HTML en la página invisible
            await page.setContent(htmlListo, { waitUntil: 'networkidle0' });

            // "Imprimimos" a PDF respetando fondos (printBackground: true)
            const pdfBuffer = await page.pdf({
                format: 'Letter',
                printBackground: true,
                landscape: true,
                margin: { top: '10mm', bottom: '10mm', left: '10mm', right: '10mm' }
            });

            await browser.close();

            // Devolvemos el binario del PDF al controlador
            return pdfBuffer;

        } finally {
            // Siempre liberamos la conexión a la base de datos
            connection.release();
        }
    }
}