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

                    io.to(`usuario_${pedido.id_asesor}`)
                        .to('rol_Administrador')
                        .to('rol_Almacen')
                        .emit('nueva_notificacion', {
                            titulo: 'Llegada de Material Próxima',
                            mensaje: mensaje
                        });
                }

                console.log(`Se enviaron notificaciones para ${pedidos.length} pedidos de proveedores.`);

            } catch (error) {
                console.error('Error al ejecutar el Cron Job de llegadas:', error);
            }

        }, {
            timezone: "America/Mexico_City"
        });

        // 2. JOB: Adeudos de clientes (5 días de antelación)
     
        cron.schedule('0 9 * * *', async () => {
            console.log('Ejecutando revisión de adeudos de clientes (5 días)...');

            try {
                const [pedidosAdeudo]: any = await pool.query(`
                    SELECT p.id, p.id_asesor, c.Nombre as nombre_cliente
                    FROM pedidos p
                    LEFT JOIN clientes c ON p.id_cliente = c.id
                    WHERE p.Estatus = 1 
                    AND p.alerta_enviada = 0
                    AND DATE(p.fecha_limite) = DATE_ADD(CURDATE(), INTERVAL 5 DAY)
                `);

                if (pedidosAdeudo.length === 0) return;

                for (const pedido of pedidosAdeudo) {
                    const mensaje = `El cliente ${pedido.nombre_cliente} tiene una fecha límite de pago en 5 días y aún no presenta comprobante de pago.`;
                   
                    await pool.query(
                        `INSERT INTO notificaciones (fecha, tipo_notificacion, id_asesor, mensaje, leida) 
                         VALUES (NOW(), 'Alerta de Adeudo', ?, ?, 0)`,
                        [pedido.id_asesor, mensaje]
                    );

                    await pool.query(`
                        INSERT INTO notificaciones (fecha, tipo_notificacion, id_asesor, mensaje, leida)
                        SELECT NOW(), 'Alerta de Adeudo', id, ?, 0 
                        FROM Asesores WHERE Rol IN ('Administrador', 'Cotizador')
                    `, [mensaje]);

                    await pool.query(
                        `UPDATE pedidos SET alerta_enviada = 1 WHERE id = ?`,
                        [pedido.id]
                    );

                    io.to(`usuario_${pedido.id_asesor}`)
                        .to('rol_Administrador')
                        .to('rol_Cotizador')
                        .emit('nueva_notificacion', {
                            titulo: 'Límite de Pago Cercano',
                            mensaje: mensaje
                        });
                }

                console.log(`Se enviaron notificaciones de adeudo para ${pedidosAdeudo.length} pedidos de clientes.`);

            } catch (error) {
                console.error('Error al ejecutar el Cron Job de adeudos:', error);
            }

        }, {
            timezone: "America/Mexico_City"
        });
    }
}