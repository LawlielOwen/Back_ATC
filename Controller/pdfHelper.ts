// helpers/leerPdfSat.ts
// Este archivo exclusivamente modificarlo o ni tocarlo.
// Unicamente se encarga de cargar la libreria que extrae el texto del pdf.
const pdfjsLib = require('pdfjs-dist/build/pdf.js');

// Ajuste 1: Se agrega ': Buffer' (o ': any') al parámetro
async function leerPdfSat(bufferArchivo: Buffer) {
    const uint8Array = new Uint8Array(bufferArchivo);
    const pdf = await pdfjsLib.getDocument({ data: uint8Array }).promise;

    let textoCompleto = '';

    for (let numPagina = 1; numPagina <= pdf.numPages; numPagina++) {
        const pagina = await pdf.getPage(numPagina);
        const contenido = await pagina.getTextContent() as any;

        let xAnterior: number | null = null;
        let yAnterior: number | null = null;
        let lineaActual = '';

        for (const item of contenido.items) {
            const x = item.transform[4];
            const y = item.transform[5];

            if (yAnterior !== null && Math.abs(y - yAnterior) > 5) {
                // Salto de línea real
                textoCompleto += lineaActual + '\n';
                lineaActual = item.str;
            } else {
                // Misma línea — decide si meter espacio por gap horizontal
                const gap = xAnterior !== null ? x - xAnterior : 0;
                lineaActual += (gap > 3 ? ' ' : '') + item.str;
            }

            xAnterior = x + (item.width || 0);
            yAnterior = y;
        }

        textoCompleto += lineaActual + '\n';
    }

    return textoCompleto;
}

// Ajuste 2: Se cambia a sintaxis de exportación de ES Modules
export { leerPdfSat };