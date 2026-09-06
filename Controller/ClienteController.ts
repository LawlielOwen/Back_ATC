import { Request, Response } from "express";
import { ClienteService } from "../Service/Cliente_s";
import fs from 'fs'; // Asegúrate de importar fs
import path from 'path';
const { leerPdfSatEstructurado } = require('./pdfHelper.js');
// Importación limpia, ahora sí permitida por el tsconfig
import pdfParse = require('pdf-parse');
function extraerRegimenPorTextoPlano(textoLimpio: string): string {
    const regexBloque = /Reg[ií]menes?:\s*(?:R[eé]gimen\s*Fecha\s*Inicio\s*Fecha\s*Fin\s*)?([\s\S]*?)(?:Obligaciones:|$)/i;
    const matchBloque = textoLimpio.match(regexBloque);

    if (matchBloque && matchBloque[1]) {
        const matchNombre = matchBloque[1].match(/^(.*?)\s*\d{2}\/\d{2}\/\d{4}/);
        if (matchNombre && matchNombre[1].trim()) return matchNombre[1].trim();
    }

    // Última red de seguridad: el regex original (formato viejo, sin tabla de fechas)
    const regexViejo = /(?:R[eé]gimen|R[eé]gimenes):?[\s\S]*?(?=\n|$|Obligaciones)/i;
    const matchViejo = textoLimpio.match(regexViejo);
    return matchViejo ? matchViejo[0].replace(/^Reg[ií]menes?:?\s*/i, '').trim() : '';
}
function extraerTablaRegimenes(itemsPorPagina: any[]): { nombre: string; fechaInicio: string; fechaFin: string } | null {
    const items = itemsPorPagina.flat();
    const normalizar = (s: string) => s.replace(/\s+/g, ' ').trim();

    // 1. Ubicamos dónde empieza la sección "Regímenes"
    const idxInicioSeccion = items.findIndex((it: any) =>
        /Reg[ií]menes?:?/i.test(normalizar(it.str))
    );
    if (idxInicioSeccion === -1) return null;

    // 2. Ubicamos dónde termina (inicio de "Obligaciones")
    let idxFinSeccion = items.findIndex((it: any, i: number) =>
        i > idxInicioSeccion && /Obligaciones:?/i.test(normalizar(it.str))
    );
    if (idxFinSeccion === -1) idxFinSeccion = items.length;

    const itemsSeccion = items.slice(idxInicioSeccion + 1, idxFinSeccion);
    if (itemsSeccion.length === 0) return null;

    // 3. Agrupamos por Y: todo lo que comparte (casi) la misma altura es la misma fila
    const TOLERANCIA_Y = 3;
    const filas: any[][] = [];
    let filaActual: any[] = [];
    let yFilaActual: number | null = null;

    for (const it of itemsSeccion) {
        if (yFilaActual === null || Math.abs(it.y - yFilaActual) <= TOLERANCIA_Y) {
            filaActual.push(it);
            if (yFilaActual === null) yFilaActual = it.y;
        } else {
            filas.push(filaActual);
            filaActual = [it];
            yFilaActual = it.y;
        }
    }
    if (filaActual.length > 0) filas.push(filaActual);

    // 4. Buscamos la fila de encabezado real: la que contiene "Fecha", "Inicio" y "Fin"
    //    (no asumimos que sea la primera fila, por si el SAT mete texto antes)
    const idxFilaEncabezado = filas.findIndex((fila) => {
        const texto = fila.map((it) => it.str).join(' ');
        return /Fecha/i.test(texto) && /Inicio/i.test(texto) && /Fin/i.test(texto);
    });
    if (idxFilaEncabezado === -1) return null;

    const filaEncabezado = filas[idxFilaEncabezado];

    // Localizamos las apariciones de "Fecha" en el encabezado para saber
    // dónde arranca cada columna (Fecha Inicio / Fecha Fin), sin importar
    // si vienen como un solo fragmento ("Fecha Inicio") o separados.
    const itemsFecha = filaEncabezado.filter((it: any) => /Fecha/i.test(it.str));
    if (itemsFecha.length < 2) return null;

    const xColumnaFechaInicio = itemsFecha[0].x;
    const xColumnaFechaFin = itemsFecha[1].x;

    // 5. Procesamos las filas de datos (todo lo que viene después del encabezado)
    const filasDatos = filas.slice(idxFilaEncabezado + 1);

    const registros = filasDatos.map((fila) => {
        const colNombre = fila.filter((it: any) => it.x < xColumnaFechaInicio - 2).map((it: any) => it.str);
        const colFechaInicio = fila.filter((it: any) => it.x >= xColumnaFechaInicio - 2 && it.x < xColumnaFechaFin - 2).map((it: any) => it.str);
        const colFechaFin = fila.filter((it: any) => it.x >= xColumnaFechaFin - 2).map((it: any) => it.str);

        return {
            nombre: normalizar(colNombre.join(' ')),
            fechaInicio: normalizar(colFechaInicio.join(' ')),
            fechaFin: normalizar(colFechaFin.join(' '))
        };
    }).filter((r) => r.nombre.length > 0);

    if (registros.length === 0) return null;


    const regexFecha = /\d{2}\/\d{2}\/\d{4}/;
    const registrosUnificados: any[] = [];
    for (const reg of registros) {
        const esContinuacion = !regexFecha.test(reg.fechaInicio) && registrosUnificados.length > 0;
        if (esContinuacion) {
            const anterior = registrosUnificados[registrosUnificados.length - 1];
            anterior.nombre = normalizar(`${anterior.nombre} ${reg.nombre}`);
        } else {
            registrosUnificados.push(reg);
        }
    }


    const vigente = registrosUnificados.find((r) => !regexFecha.test(r.fechaFin));
    if (vigente) return vigente;

    const parsearFecha = (str: string) => {
        const m = str.match(/(\d{2})\/(\d{2})\/(\d{4})/);
        if (!m) return 0;
        return new Date(`${m[3]}-${m[2]}-${m[1]}`).getTime();
    };
    registrosUnificados.sort((a, b) => parsearFecha(b.fechaInicio) - parsearFecha(a.fechaInicio));
    return registrosUnificados[0];
}

export class ClienteController {
    static async getClientes(req: Request, res: Response) {
        try {
            const pagina = parseInt(req.query.pagina as string) || 1;
            const limite = parseInt(req.query.limite as string) || 6;

            const usuario = (req as any).usuario;
            const idAsesorFiltro = (usuario && usuario.Rol === 'Asesor') ? usuario.id : 0;

            const resultado = await ClienteService.obtenerClientes(pagina, limite, idAsesorFiltro);

            res.status(200).json(resultado);
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Error al obtener clientes' });
        }
    }

    static async getClientePorId(req: Request, res: Response) {
        try {
            const id = parseInt(req.params.id as string);
            const result = await ClienteService.obtenerClientePorId(id);
            if (result) {
                res.status(200).json(result);
            } else {
                res.status(404).json({ error: 'Cliente no encontrado' });
            }
        } catch (error: any) {
            console.error(error);
            res.status(500).json({ error: 'Error interno del servidor' });
        }
    }

    static async agregarCliente(req: any, res: Response) {
        try {
            const cliente = { ...req.body };
            if (req.file) {
                cliente.nombre_constancia = req.file.originalname;
                cliente.ruta_constancia = `uploads/CSF/${req.file.filename}`;
            } else {
                cliente.nombre_constancia = '';
                cliente.ruta_constancia = '';
            }

            // El array de asesores viaja como string dentro del FormData, hay que parsearlo
            let asesoresAsignados: any[] = [];
            try {
                asesoresAsignados = JSON.parse(req.body.asesores_json || '[]');
            } catch {
                asesoresAsignados = [];
            }

            const result = await ClienteService.agregarCliente(cliente, asesoresAsignados);
            return res.status(201).json(result);

        } catch (error: any) {
            console.error('Error al agregar cliente:', error);
            if (req.file && req.file.path && fs.existsSync(req.file.path)) {
                fs.unlinkSync(req.file.path);
            }
            if (error.message && error.message.includes('FORMATO_INVALIDO')) {
                return res.status(400).json({ error: 'Solo se permite subir archivos PDF para la constancia.' });
            }
            if (error.message === 'File too large') {
                return res.status(400).json({ error: 'La constancia es demasiado grande. El límite es 5MB.' });
            }
            return res.status(500).json({ error: 'Error interno del servidor al agregar cliente' });
        }
    }

    static async actualizarCliente(req: any, res: Response) {
        try {
            const id = parseInt(req.params.id as string);
            const cliente = { ...req.body };

            if (req.file) {
                cliente.nombre_constancia = req.file.originalname;
                cliente.ruta_constancia = req.file.path;
            } else {
                cliente.nombre_constancia = req.body.nombre_constancia || '';
                cliente.ruta_constancia = req.body.ruta_constancia || '';
            }

            let asesoresAsignados: any[] = [];
            try {
                asesoresAsignados = JSON.parse(req.body.asesores_json || '[]');
            } catch {
                asesoresAsignados = [];
            }

            const result = await ClienteService.actualizarCliente(id, cliente, asesoresAsignados);
            res.status(200).json(result);
        } catch (error: any) {
            console.error(error);
            res.status(500).json({ error: 'Error interno del servidor al actualizar cliente' });
        }
    }

    static async eliminarCliente(req: Request, res: Response) {
        const id = parseInt(req.params.id as string);
        try {
            const result = await ClienteService.eliminarCliente(id);
            res.status(200).json(result);
        } catch (error: any) {
            console.error(error);
            res.status(500).json({ error: 'Error interno del servidor' });
        }
    }

    static async activarCliente(req: Request, res: Response) {
        const id = parseInt(req.params.id as string);
        try {
            const result = await ClienteService.activarCliente(id);
            res.status(200).json(result);
        } catch (error: any) {
            console.error(error);
            res.status(500).json({ error: 'Error interno del servidor' });
        }
    }

    static async buscaryfiltrarClientes(req: Request, res: Response) {
    try {
        const busqueda = req.query.busqueda as string || null;
        const estatus = req.query.estatus ? parseInt(req.query.estatus as string) : null;
        const pagina = parseInt(req.query.pagina as string) || 1;
        const limite = parseInt(req.query.limite as string) || 9;
        const idAsesor = req.query.idAsesor ? parseInt(req.query.idAsesor as string) : null; // Se captura el ID

        const result = await ClienteService.buscaryfiltrarClientes(busqueda, estatus, pagina, limite, idAsesor);
        res.status(200).json(result);
    } catch (error: any) {
        console.error(error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
}

    static async procesarCSF(req: any, res: Response) {
        try {
            if (!req.file) {
                return res.status(400).json({ error: 'No se subió ningún archivo' });
            }
            const dataBuffer = req.file.buffer;
            const { texto: textoPDF, itemsPorPagina } = await leerPdfSatEstructurado(dataBuffer);

            const textoLimpio = textoPDF.replace(/[\r\n"]+/g, ' ').replace(/\s{2,}/g, ' ');

            // ── RFC ──────────────────────────────────────────────────────────────
            const regexRFC = /[A-Z&Ñ]{3,4}\d{6}[A-V1-9][A-Z1-9][0-9A]/i;
            const matchRFC = textoLimpio.match(regexRFC);

            // ── CÓDIGO POSTAL ─────────────────────────────────────────────────────
            const regexCP = /C[oó]digo\s*Postal\s*:?\s*(\d{5})/i;
            const matchCP = textoLimpio.match(regexCP);

            // ── NOMBRE(S) y APELLIDOS (Para Personas Físicas) ──────────────────────
            const matchNombres = textoLimpio.match(/Nombre\(s\):\s*(.+?)(?=\s+PrimerApellido)/i);
            const matchApellido1 = textoLimpio.match(/PrimerApellido:\s*(.+?)(?=\s+SegundoApellido)/i);
            const matchApellido2 = textoLimpio.match(/SegundoApellido:\s*(.+?)(?=\s+(Fecha|CURP|Datos))/i);

            let razonSocialCompuesta = [
                matchNombres ? matchNombres[1].trim() : '',
                matchApellido1 ? matchApellido1[1].trim() : '',
                matchApellido2 ? matchApellido2[1].trim() : '',
            ].filter(p => p !== '').join(' ');

            if (!razonSocialCompuesta) {
                const matchRazonSocialPM = textoLimpio.match(/Denominaci.n\/Raz.n\s*Social:\s*(.+?)(?=\s*R.gimen\s*Capital)/i);
                if (matchRazonSocialPM) {
                    razonSocialCompuesta = matchRazonSocialPM[1].trim();
                }
            }

            const matchNombreComercial = textoLimpio.match(/Nombre\s*Comercial:\s*(.*?)(?=\s*Fecha\s*inicio)/i);

            let nombreComercial = razonSocialCompuesta; // Fallback por defecto
            if (matchNombreComercial && matchNombreComercial[1].trim().length > 0) {
                nombreComercial = matchNombreComercial[1].trim();
            }

            // ── RÉGIMEN FISCAL ────────────────────────────────────────────────────
            // Intento 1 (robusto): reconstrucción de la tabla por coordenadas
            let nombreRegimenExtraido = '';
            const registroRegimen = extraerTablaRegimenes(itemsPorPagina);
            if (registroRegimen && registroRegimen.nombre) {
                nombreRegimenExtraido = registroRegimen.nombre;
            } else {
                // Intento 2 (fallback): regex sobre el texto plano
                nombreRegimenExtraido = extraerRegimenPorTextoPlano(textoLimpio);
            }

            const mapaRegimenes: Record<string, string> = {
                'general de ley personas morales': '601',
                'fines no lucrativos': '603',
                'sueldos y salarios': '605',
                'arrendamiento': '606',
                'personas físicas con actividades': '612',
                'honorarios': '612',
                'incorporación fiscal': '621',
                'simplificado de confianza': '626',
            };

            let codigoRegimen = '';
            if (nombreRegimenExtraido) {
                const fragmentoRegimen = nombreRegimenExtraido.toLowerCase();
                for (const [clave, codigo] of Object.entries(mapaRegimenes)) {
                    if (fragmentoRegimen.includes(clave)) {
                        codigoRegimen = codigo;
                        break;
                    }
                }
            }

            if (!codigoRegimen) {
                console.warn('[CSF] No se pudo mapear el régimen fiscal. Texto detectado:', nombreRegimenExtraido || '(vacío)');
            }

            // ── DIRECCIÓN ─────────────────────────────────────────────────────────
            const formatearTexto = (texto: string) => {
                if (!texto) return '';

                let textoSeparado = texto
                    .replace(/([a-zA-Z])(\d)/g, '$1 $2')
                    .replace(/(\d)([a-zA-Z])/g, '$1 $2')
                    .replace(/([a-z])([A-Z])/g, '$1 $2');

                return textoSeparado.replace(/\w\S*/g, (palabra) => {
                    const particulas = ['de', 'del', 'la', 'las', 'el', 'los', 'y', 'en', 'col', 'num', 'ext', 'int'];
                    const palabraMin = palabra.toLowerCase();

                    if (particulas.includes(palabraMin)) {
                        return palabraMin;
                    }

                    return palabra.charAt(0).toUpperCase() + palabra.substring(1).toLowerCase();
                }).trim();
            };

            const matchVialidad = textoLimpio.match(
                /Nombre\s*de\s*Vialidad\s*:?\s*(.+?)(?=\s*N[uú]mero\s*Exterior)/i
            );
            const matchNumExt = textoLimpio.match(
                /N[uú]mero\s*Exterior\s*:?\s*(\w+)/i
            );
            const matchColonia = textoLimpio.match(
                /Nombre\s*de\s*la\s*Colonia\s*:?\s*(.+?)(?=\s*Nombre\s*de\s*la\s*Localidad)/i
            );
            const matchLocalidad = textoLimpio.match(
                /Nombre\s*de\s*la\s*Localidad\s*:?\s*(.+?)(?=\s*Nombre\s*del\s*Municipio)/i
            );
            const matchEstado = textoLimpio.match(
                /Nombre\s*de\s*la\s*Entidad\s*Federativa\s*:?\s*(.+?)(?=\s*Entre\s*Calle)/i
            );

            const direccionCompuesta = [
                matchVialidad ? formatearTexto(matchVialidad[1]) : '',
                matchNumExt ? `#${formatearTexto(matchNumExt[1])}` : '',
                matchColonia ? `Col. ${formatearTexto(matchColonia[1])}` : '',
                matchLocalidad ? formatearTexto(matchLocalidad[1]) : '',
                matchEstado ? formatearTexto(matchEstado[1]) : '',
            ].filter(p => p !== '').join(', ');

            return res.status(200).json({
                RFC: matchRFC ? matchRFC[0].trim() : '',
                CP: matchCP ? matchCP[1].trim() : '',
                nombre: nombreComercial,
                razon_social: razonSocialCompuesta,
                regimen_fiscal: codigoRegimen,
                direccion: direccionCompuesta,
                ruta_constancia: req.file.path,
                nombre_constancia: req.file.originalname
            });

        } catch (error) {
            console.error("Error al procesar el PDF:", error);
            return res.status(500).json({ error: 'El documento parece ser un escaneo. Por favor, sube el PDF original o utiliza el Registro Manual.' });
        }
    }
    static async contarClientes(req: any, res: Response) {
        try {
            const result = await ClienteService.countClientesActivos();
            if (result) {
                res.status(200).json(result);
            } else {
                res.status(404).json({ error: 'Clientes no encontrados' });
            }
        } catch (error: any) {
            console.error(error);
            res.status(500).json({ error: 'Error interno del servidor' });
        }
    }
    static async subirCSF(req: any, res: Response) {
        try {
            const id_cliente = parseInt(req.params.id as string);

            if (!req.file) {
                return res.status(400).json({ error: 'No se ha detectado ningún archivo CSF para subir.' });
            }

            if (isNaN(id_cliente)) {
                fs.unlinkSync(req.file.path);
                return res.status(400).json({ error: 'El ID del cliente no es válido.' });
            }

            const nombre_constancia = req.file.originalname;
            const ruta_constancia = `uploads/CSF/${req.file.filename}`;
            const { mensaje, ruta_anterior } = await ClienteService.subirCSF(id_cliente, nombre_constancia, ruta_constancia);

            if (ruta_anterior && ruta_anterior !== '') {
                const rutaAbsolutaAnterior = path.join(process.cwd(), ruta_anterior);

                if (fs.existsSync(rutaAbsolutaAnterior)) {
                    fs.unlinkSync(rutaAbsolutaAnterior);
                }
            }

            return res.status(200).json({ mensaje, ruta: ruta_constancia });

        } catch (error: any) {
            console.error('Error en subirCSF:', error);

            if (req.file && fs.existsSync(req.file.path)) {
                fs.unlinkSync(req.file.path);
            }

            if (error.message && error.message.includes('FORMATO_INVALIDO')) {
                return res.status(400).json({ error: 'Solo se permite subir archivos PDF para la constancia.' });
            }
            if (error.message === 'File too large') {
                return res.status(400).json({ error: 'El archivo es demasiado grande. El máximo es 5MB.' });
            }

            if (error.message && error.message.startsWith('Error:')) {
                return res.status(400).json({ error: error.message.replace('Error: ', '') });
            }

            return res.status(500).json({ error: 'Error interno del servidor al procesar la CSF.' });
        }
    }
 static async asignarCredito(req: Request, res: Response) {
    try {
        const { id } = req.params;
        const { tiene_credito, limite_credito, fecha_vencimiento } = req.body;

        if (tiene_credito === undefined || tiene_credito === null) {
            return res.status(400).json({ error: 'El campo tiene_credito es obligatorio.' });
        }

        const limite = limite_credito !== undefined && limite_credito !== null
            ? Number(limite_credito)
            : 0;

        if (isNaN(limite)) {
            return res.status(400).json({ error: 'El límite de crédito debe ser un número válido.' });
        }

        const tieneCreditoBool = Boolean(tiene_credito);

        // NUEVO: si se autoriza crédito, la fecha es obligatoria desde este nivel también
        // (el SP la vuelve a validar, pero así el error llega más rápido y más claro)
        if (tieneCreditoBool && (!fecha_vencimiento || typeof fecha_vencimiento !== 'string')) {
            return res.status(400).json({ error: 'Debe capturar una fecha de vencimiento para autorizar la línea de crédito.' });
        }

        const fechaVencimientoFinal = tieneCreditoBool ? fecha_vencimiento : null;

        const mensaje = await ClienteService.asignarCredito(
            Number(id),
            tieneCreditoBool,
            limite,
            fechaVencimientoFinal
        );

        if (mensaje.toLowerCase().startsWith('error')) {
            return res.status(400).json({ error: mensaje });
        }

        return res.status(200).json({ mensaje });

    } catch (error) {
        console.error('Error al asignar crédito:', error);
        return res.status(500).json({ error: 'No se pudo procesar la asignación de crédito.' });
    }
}

}