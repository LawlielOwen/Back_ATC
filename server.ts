import dotenv from 'dotenv';
dotenv.config({ override: true });
import express, { Application} from 'express';

// tarea prorgramada
import { NotificacionesJob } from './Jobs/NotifJob';
import { LimpiezaJob } from './Jobs/LimpiezaNotis';
// WebSockets
import http from 'http';
import { Server } from 'socket.io';
// Rutas de los servicios
import healthRouter from './Router/health';
import LoginRouter from './Router/login';
import ClienteRouter from './Router/cliente';
import AsesoresRouter from './Router/Asesor';
import ProductosRouter from './Router/Producto';
import MarcasRouter from './Router/Marca';
import CotizacionRouter from './Router/Cotizacion'
import MovimientosRouter from './Router/Movimientos';
import ValesRouter from './Router/Vales';
import NotificacionRouter from './Router/Notificacion';
import ProveedorRouter from './Router/Proveedor';
import PedidosRouter from './Router/pedidos';
import MetricasRouter from './Router/Metricas';
// Middleware
import cors from 'cors';
import { standardLimiter, loginLimiter, searchLimiter } from './middleware/rate-limit';
import helmet from 'helmet';
const app: Application = express();
const server = http.createServer(app);
import path from 'path';
app.use(helmet());
app.use(cors({origin: '*'}));
export const io = new Server(server, {
    cors: {
        origin: '*', 
        methods: ['GET', 'POST', 'PUT', 'DELETE']
    }
})
app.use(express.json());
app.use('/api/login', loginLimiter); 
app.use('/api/asesores/registro', loginLimiter);

app.use('/api/metricas', searchLimiter);
app.use('/api', standardLimiter);
app.use('/api', LoginRouter);
app.use('/api', MetricasRouter);
app.use('/api', healthRouter);
app.use('/api', ClienteRouter);
app.use('/api', AsesoresRouter);
app.use('/api', ProductosRouter);
app.use('/api', MarcasRouter);
app.use('/api', NotificacionRouter);
app.use('/api', CotizacionRouter);
app.use('/api', MovimientosRouter);
app.use('/api', ValesRouter);
app.use('/api', ProveedorRouter);
app.use('/api', PedidosRouter);

app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));
LimpiezaJob.iniciarMantenimiento();
io.on('connection', (socket) => {
    console.log('cliente conectado a notificaciones');

socket.on('unirse_a_sala', (datosUsuario) => {
        
        if (typeof datosUsuario === 'string') {
            try { datosUsuario = JSON.parse(datosUsuario); } catch (e) { }
        }

        if (datosUsuario && datosUsuario.id && datosUsuario.rol) {
            socket.join(`usuario_${datosUsuario.id}`);
            socket.join(`rol_${datosUsuario.rol}`);
            console.log(`🟢 Usuario unido a ID: usuario_${datosUsuario.id} y ROL: rol_${datosUsuario.rol}`);
        } else {
            console.log('🟡 Intento de conexión fallido. Datos inválidos:', datosUsuario);
        }
    });

    socket.on('disconnect', () => {
        console.log(' Cliente desconectado');
    });
});
server.listen(3000, () => {
    console.log(`🚀 Servidor HTTP y WebSockets corriendo en el puerto 3000, BD en: ${process.env.DB_HOST}`);
});
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Error interno del servidor' });
});