import cron from 'node-cron';
import pool from '../Config/db';
import { io } from '../server';

export class NotificacionesJob {
    static iniciarTareasProgramadas() {
        cron.schedule('0 8 * * *', async () => {
            console.log('Ejecutando revisión de pedidos próximos a llegar...');

            try {
                const [pedidos]: any = await pool.query(`
                    SELECT p.id, p.id_asesor, m.Nombre as proveedor
                    FROM pedidos_proveedores p
                    LEFT JOIN marca_proveedor m ON p.id_proveedor = m.id
                    WHERE p.Estatus = 0 
                    AND p.alerta_enviada = 0
                    AND DATE(p.fecha_estimada) = DATE_ADD(CURDATE(), INTERVAL 7 DAY)
                `);

                if (pedidos.length === 0) return;

                for (const pedido of pedidos) {
                    const mensaje = `Un pedido de material del proveedor ${pedido.proveedor} está proximo a ejecutarse en 7 días.`;
                   // A) Notificar al Asesor que lo pidió (Quitamos id_pedido y sus signos ?)
await pool.query(
    `INSERT INTO notificaciones (fecha, tipo_notificacion, id_asesor, mensaje, leida) 
     VALUES (NOW(), 'Llegada Próxima', ?, ?, 0)`,
    [pedido.id_asesor, mensaje]
);

await pool.query(`
    INSERT INTO notificaciones (fecha, tipo_notificacion, id_asesor, mensaje, leida)
    SELECT NOW(), 'Llegada Próxima', id, ?, 0 
    FROM Asesores WHERE Rol IN ('Administrador', 'Almacen')
`, [mensaje]);

                    await pool.query(
                        `UPDATE pedidos_proveedores SET alerta_enviada = 1 WHERE id = ?`,
                        [pedido.id]
                    );

                    // D) WebSockets en tiempo real
                    io.to(`usuario_${pedido.id_asesor}`)
                        .to('rol_Administrador')
                        .to('rol_Almacen')
                        .emit('nueva_notificacion', {
                            titulo: 'Llegada de Material Próxima',
                            mensaje: mensaje
                        });
                }

                console.log(`Se enviaron notificaciones para ${pedidos.length} pedidos.`);

            } catch (error) {
                console.error('Error al ejecutar el Cron Job de notificaciones:', error);
            }

        }, {
            timezone: "America/Mexico_City"
        });
    }
}