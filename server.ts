import dotenv from 'dotenv';
dotenv.config({ override: true });
import express, { Application} from 'express';

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
// Middleware
import cors from 'cors';
import { limiter } from './middleware/rate-limit';
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
app.use('/api/', limiter);
app.use('/api/health', healthRouter);
app.use('/api', LoginRouter);
app.use('/api', ClienteRouter);
app.use('/api', AsesoresRouter);
app.use('/api', ProductosRouter);
app.use('/api', MarcasRouter);
app.use('/api', NotificacionRouter);
app.use('/api', CotizacionRouter);
app.use('/api', MovimientosRouter);
app.use('/api', ValesRouter);
app.use('/uploads', express.static(path.resolve('uploads')));

io.on('connection', (socket) => {
    console.log('Nuevo cliente conectado a notificaciones:', socket.id);

socket.on('unirse_a_sala', (datosUsuario) => {
        
        // 🛡️ PARCHE: Si los datos llegan como texto (como desde Postman), los convertimos a JSON real
        if (typeof datosUsuario === 'string') {
            try { datosUsuario = JSON.parse(datosUsuario); } catch (e) { }
        }

        // 🛡️ EL ESCUDO: Verificamos que traiga datos, id y rol
        if (datosUsuario && datosUsuario.id && datosUsuario.rol) {
            socket.join(`usuario_${datosUsuario.id}`);
            socket.join(`rol_${datosUsuario.rol}`);
            console.log(`🟢 Usuario unido a ID: usuario_${datosUsuario.id} y ROL: rol_${datosUsuario.rol}`);
        } else {
            console.log('🟡 Intento de conexión fallido. Datos inválidos:', datosUsuario);
        }
    });

    socket.on('disconnect', () => {
        console.log('🔴 Cliente desconectado:', socket.id);
    });
});
server.listen(3000, () => {
    console.log(`🚀 Servidor HTTP y WebSockets corriendo en el puerto 3000, BD en: ${process.env.DB_HOST}`);
});
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Error interno del servidor' });
});