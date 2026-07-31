import { Request, Response } from "express";
import { AuthService } from "../Service/Auth";

export const AuthController = async (req: Request, res: Response) => {
    try {
        const { usuario, contra } = req.body;
        const result = await AuthService.login(usuario, contra);
        
        res.status(200).json({
            mensaje: "Login exitoso",
            token: result.token
        });
    } catch (error: any) {
        console.log(error);
        if (error.message === 'Usuario no encontrado' || error.message === 'Contraseña incorrecta') {
            res.status(401).json({ error: 'Usuario o contraseña incorrectos' });
        } 
        else if (error.message === 'USUARIO_INACTIVO') {
            res.status(403).json({ error: 'El usuario está desactivado' });
        } 
        else {
            res.status(500).json({ error: 'Error interno del servidor' });
        }
    }
}