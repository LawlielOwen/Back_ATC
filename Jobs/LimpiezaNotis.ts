import cron from 'node-cron';
import pool from '../Config/db';

export class LimpiezaJob {
    
    static iniciarMantenimiento() {
        cron.schedule('0 8 * * *', async () => {
            console.log('Iniciando rutina de limpieza de base de datos...');
            
            try {
                const [resultado]: any = await pool.query(`
                    DELETE FROM notificaciones 
                    WHERE fecha <= DATE_SUB(NOW(), INTERVAL 3 MONTH)
                `);

                if (resultado.affectedRows > 0) {
                    console.log(`Limpieza completada: Se eliminaron ${resultado.affectedRows} notificaciones antiguas.`);
                } else {
                    console.log('Limpieza completada: No hubo notificaciones tan antiguas para eliminar hoy.');
                }

            } catch (error) {
                console.error('Error al ejecutar el Cron Job de limpieza:', error);
            }
            
        }, {
            timezone: "America/Mexico_City" 
        });
    }
}