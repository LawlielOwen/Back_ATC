import { Request, Response } from "express";
import { ClienteService } from "../Service/Cliente_s";
import fs from 'fs'; // Asegúrate de importar fs
import path from 'path'; 
const { leerPdfSat } = require('./pdfHelper.js');
// Importación limpia, ahora sí permitida por el tsconfig
import pdfParse = require('pdf-parse');

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

            const result = await ClienteService.agregarCliente(cliente);
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

            // Lógica añadida: Si el usuario sube un archivo NUEVO durante la edición
            if (req.file) {
                cliente.nombre_constancia = req.file.originalname;
                cliente.ruta_constancia = req.file.path;
            } else {
                // Si no suben archivo, mantenemos los que vienen en el body (si existían)
                cliente.nombre_constancia = req.body.nombre_constancia || '';
                cliente.ruta_constancia = req.body.ruta_constancia || '';
            }

            const result = await ClienteService.actualizarCliente(id, cliente);
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
            const result = await ClienteService.buscaryfiltrarClientes(busqueda, estatus, pagina, limite);
            res.status(200).json(result);
        } catch (error: any) {
            console.error(error);
            res.status(500).json({ error: 'Error interno del servidor' });
        }
    }
    //Sanitizacion de los datos extraidos del pdf
    static async procesarCSF(req: any, res: Response) {
        try {
            if (!req.file) {
                return res.status(400).json({ error: 'No se subió ningún archivo' });
            }
            const dataBuffer = req.file.buffer;
            const textoPDF = await leerPdfSat(dataBuffer);

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
            const regexRegimen = /(?:R[eé]gimen|R[eé]gimenes):?[\s\S]*?(?=\n|$|Fecha|Obligaciones)/i; const matchRegimen = textoLimpio.match(regexRegimen);

            const mapaRegimenes: Record<string, string> = {
                'general de ley personas morales': '601',
                'fines no lucrativos': '603', // Lo acorté para que haga match más fácil
                'sueldos y salarios': '605',
                'arrendamiento': '606',
                'personas físicas con actividades': '612',
                'honorarios': '612',
                'incorporación fiscal': '621',
                'simplificado de confianza': '626',
            };
            let codigoRegimen = '';
            if (matchRegimen && matchRegimen[0]) {
                const fragmentoRegimen = matchRegimen[0].toLowerCase();

                for (const [clave, codigo] of Object.entries(mapaRegimenes)) {
                    // Buscamos la clave solo en el fragmentito de texto del régimen
                    if (fragmentoRegimen.includes(clave)) {
                        codigoRegimen = codigo;
                        break;
                    }
                }
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

            // Armamos la dirección limpia y con Title Case básico para que no todo esté gritando en mayúsculas
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

            // 1. Validar que Multer haya subido el archivo
            if (!req.file) {
                return res.status(400).json({ error: 'No se ha detectado ningún archivo CSF para subir.' });
            }

            if (isNaN(id_cliente)) {
                // Borramos físicamente el archivo recién subido usando path completo
                fs.unlinkSync(req.file.path); 
                return res.status(400).json({ error: 'El ID del cliente no es válido.' });
            }

            // 2. Extraer y formatear rutas
            const nombre_constancia = req.file.originalname; 
            // Ruta web limpia para la BD
            const ruta_constancia = `uploads/CSF/${req.file.filename}`; 

            // 3. Ejecutar actualización en BD
            const { mensaje, ruta_anterior } = await ClienteService.subirCSF(id_cliente, nombre_constancia, ruta_constancia);

            // 4. LIMPIEZA FÍSICA DEL ARCHIVO ANTERIOR
            if (ruta_anterior && ruta_anterior !== '') {
                // Reconstruimos la ruta absoluta del servidor uniendo la raíz con la ruta de la BD
                const rutaAbsolutaAnterior = path.join(process.cwd(), ruta_anterior);
                
                if (fs.existsSync(rutaAbsolutaAnterior)) {
                    fs.unlinkSync(rutaAbsolutaAnterior); // Adiós archivo viejo
                }
            }

            return res.status(200).json({ mensaje, ruta: ruta_constancia });

        } catch (error: any) {
            console.error('Error en subirCSF:', error);

            // Rollback físico: Si la BD falló, borramos el PDF nuevo que Multer ya había guardado
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
}