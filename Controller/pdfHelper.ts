// Mantenemos el require para evitar problemas de compatibilidad de módulos con pdfjs-dist
const pdfjsLib = require('pdfjs-dist/build/pdf.js');

// ✦ Cambiamos a exportación nativa de TypeScript y tipamos el parámetro
export async function leerPdfSat(bufferArchivo: Buffer | ArrayBuffer): Promise<string> {
    const uint8Array = new Uint8Array(bufferArchivo as ArrayBuffer);
    const pdf = await pdfjsLib.getDocument({ data: uint8Array }).promise;

    let textoCompleto: string = '';

    for (let numPagina = 1; numPagina <= pdf.numPages; numPagina++) {
        const pagina = await pdf.getPage(numPagina);
        const contenido = await pagina.getTextContent();

        // ✦ Tipado estricto para coordenadas
        let xAnterior: number | null = null;
        let yAnterior: number | null = null;
        let lineaActual: string = '';

        // ✦ Usamos 'any' en item porque pdfjs-dist carece de @types oficiales 100% compatibles
        for (const item of contenido.items as any[]) {
            const x: number = item.transform[4];
            const y: number = item.transform[5];

            if (yAnterior !== null && Math.abs(y - yAnterior) > 5) {
                // Salto de línea real
                textoCompleto += lineaActual + '\n';
                lineaActual = item.str;
            } else {
                // Misma línea — decide si meter espacio por gap horizontal
                const gap: number = xAnterior !== null ? x - xAnterior : 0;
                lineaActual += (gap > 3 ? ' ' : '') + item.str;
            }

            xAnterior = x + (item.width || 0);
            yAnterior = y;
        }

        textoCompleto += lineaActual + '\n';
    }

    return textoCompleto;
}