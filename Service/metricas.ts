import pool from '../Config/db';

export class MetricaService {
static async obtenerProductosTop(idAsesor: number | null = null, meses: number = 3) {
    const [rows]: any = await pool.query('CALL sp_dashboard_productos_top(?, ?)', [idAsesor, meses]);
    return rows[0];
}

static async obtenerProductosMenosVendidos(idAsesor: number | null = null, meses: number = 3) {
    const [rows]: any = await pool.query('CALL sp_productos_menos_vendidos(?, ?)', [idAsesor, meses]);
    return rows[0];
}

    static async getTasaConversion(moneda: string = 'GLOBAL', idCliente: number | null = null, idAsesor: number | null = null) {
        const [rows]: any = await pool.query('CALL sp_tasa_conversion(?, ?, ?)', [moneda, idCliente, idAsesor]);
        return rows[0]; 
    }

    static async obtenerProductosEstrella(idCliente: number | null = null, idAsesor: number | null = null) {
        const [rows]: any = await pool.query('CALL sp_productos_estrella(?, ?)', [idCliente, idAsesor]);
        return rows[0];
    }

    static async obtenerTendenciaCotizaciones(moneda: string = 'GLOBAL', fechaInicio: string | null = null, fechaFin: string | null = null, idAsesor: number | null = null) {

        const [rows]: any = await pool.query('CALL sp_tendencia_cotizaciones(?, ?, ?, ?)', [moneda, fechaInicio, fechaFin, idAsesor]);
        return rows[0];
    }

    static async obtenerEstadisticasGenerales(idAsesor: number | null = null) {
        const [rows]: any = await pool.query('CALL sp_estadisticas_generales_mes(?)', [idAsesor]);
        return rows[0][0]; 
    }
}