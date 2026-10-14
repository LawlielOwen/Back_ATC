// NO TOCAR
const pdfjsLib = require('pdfjs-dist/build/pdf.js');

export async function leerPdfSatEstructurado(bufferArchivo: Buffer | ArrayBuffer) {
    const uint8Array = new Uint8Array(bufferArchivo as ArrayBuffer);
    const pdf = await pdfjsLib.getDocument({ data: uint8Array }).promise;

    let textoCompleto: string = '';
    const itemsPorPagina: any[][] = [];

    for (let numPagina = 1; numPagina <= pdf.numPages; numPagina++) {
        const pagina = await pdf.getPage(numPagina);
        const contenido = await pagina.getTextContent();

        let xAnterior: number | null = null;
        let yAnterior: number | null = null;
        let lineaActual: string = '';
        const itemsPagina: any[] = [];

        for (const item of contenido.items as any[]) {
            const x: number = item.transform[4];
            const y: number = item.transform[5];

            itemsPagina.push({
                str: item.str,
                x,
                y,
                width: item.width || 0,
                pagina: numPagina
            });

            if (yAnterior !== null && Math.abs(y - yAnterior) > 5) {
                textoCompleto += lineaActual + '\n';
                lineaActual = item.str;
            } else {
                const gap: number = xAnterior !== null ? x - xAnterior : 0;
                lineaActual += (gap > 3 ? ' ' : '') + item.str;
            }

            xAnterior = x + (item.width || 0);
            yAnterior = y;
        }

        textoCompleto += lineaActual + '\n';
        itemsPorPagina.push(itemsPagina);
    }

    return {
        texto: textoCompleto,
        itemsPorPagina
    };
}