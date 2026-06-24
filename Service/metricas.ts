import pool from '../Config/db';

export class MetricaService {
    
    // 1. Productos más vendidos (Top 5)
    static async obtenerProductosTop() {
        const [rows]: any = await pool.query('CALL sp_dashboard_productos_top()');
        return rows[0];
    }

    // 2. Productos menos vendidos (Bottom 5)
    static async obtenerProductosMenosVendidos() {
        const [rows]: any = await pool.query('CALL sp_productos_menos_vendidos()');
        return rows[0];
    }

  static async getTasaConversion(moneda: string = 'GLOBAL', idCliente: number | null = null) {
        const [rows]: any = await pool.query('CALL sp_tasa_conversion(?, ?)', [moneda, idCliente]);
        return rows[0]; 
    }

    static async obtenerProductosEstrella(idCliente: number | null = null) {

        const [rows]: any = await pool.query('CALL sp_productos_estrella(?)', [idCliente]);
        return rows[0];
    }

 static async obtenerTendenciaCotizaciones(moneda: string = 'GLOBAL', fechaInicio: string | null = null, fechaFin: string | null = null) {
        const [rows]: any = await pool.query('CALL sp_tendencia_cotizaciones(?, ?, ?)', [moneda, fechaInicio, fechaFin]);
        return rows[0];
    }
    // 6. Estadísticas Generales del Mes (KPIs Globales)
    static async obtenerEstadisticasGenerales() {
        const [rows]: any = await pool.query('CALL sp_estadisticas_generales_mes()');
        // Como es una sola fila con totales, devolvemos directamente el primer objeto del arreglo
        return rows[0][0]; 
    }
}