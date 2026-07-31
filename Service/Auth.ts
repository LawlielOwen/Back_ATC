import pool from '../Config/db';
import { Asesor } from '../Model/asesor';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
dotenv.config();

export class AuthService {
    static async login(username: string, contra: string) {
        const [rows]: any = await pool.query('call login_asesor(?)', [username]);

        const asesor = rows[0];

        if (asesor.length === 0) {
            throw new Error('Usuario no encontrado');
        }
        
        const asesordata: Asesor = asesor[0];
        const passValida = await bcrypt.compare(contra, asesordata.contra);
        
        if (!passValida) {
            throw new Error('Contraseña incorrecta');
        }

        const payLoad = {
            id: asesordata.id,
            Nombre: asesordata.Nombre,     
            app: asesordata.app,
            apm: asesordata.apm,
            telefono: asesordata.telefono,   
            usuario: asesordata.usuario,
            Rol: asesordata.Rol,
            Correo: asesordata.Correo           
        };
        
        const key = process.env.JWT_SECRET as string;
        const token = jwt.sign(payLoad, key, { expiresIn: '8h' });

        return { token };
    }
}