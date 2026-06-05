import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

const conexion = mysql.createPool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
});
export async function testDbConnection() {
    try {
        // Intentamos obtener una conexión del pool
        const connection = await conexion.getConnection();
        console.log("¡Conexión a la base de datos db_atc establecida con éxito!");
        // Liberamos la conexión para que no se quede colgada
        connection.release();
    } catch (error) {
        console.error(" Error al conectar a la base de datos:");
        console.error(error);
    }
}
export default conexion;