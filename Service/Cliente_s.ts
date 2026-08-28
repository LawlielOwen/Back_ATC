import pool from '../Config/db';
import { Cliente } from '../Model/Cliente';
export class ClienteService {

    static async obtenerClientes(pagina: number = 1, limite: number = 6, idAsesorFiltro: number = 0) {
        const offset = (pagina - 1) * limite;

        let queryDatos = 'SELECT * FROM verClientes';
        let queryCount = 'SELECT COUNT(*) as total FROM verClientes';

        const paramsDatos: any[] = [];
        const paramsCount: any[] = [];

        if (idAsesorFiltro > 0) {
            queryDatos += ' WHERE id_asesor = ?';
            queryCount += ' WHERE id_asesor = ?';
            paramsDatos.push(idAsesorFiltro);
            paramsCount.push(idAsesorFiltro);
        }

        queryDatos += ' LIMIT ? OFFSET ?';
        paramsDatos.push(limite, offset);

        const [rows]: any = await pool.query(queryDatos, paramsDatos);
        const [totalRows]: any = await pool.query(queryCount, paramsCount);

        const total = totalRows[0].total;

        return {
            clientes: rows,
            total: total,
            paginas: Math.ceil(total / limite),
            paginaActual: pagina
        };
    }
   

    static async eliminarCliente(id: number) {
        const [rows]: any = await pool.query('call sp_eliminar_cliente(?)', [id]);
        return rows;
    }
    static async obtenerClientePorId(id: number) {
    const [rows]: any = await pool.query('SELECT * FROM verClientes WHERE id = ?', [id]);
    const cliente = rows[0];
    if (!cliente) return null;

    // FIX: se agrega el JOIN a asesores para traer el nombre junto con sus marcas asignadas
    const [relaciones]: any = await pool.query(
        `SELECT 
            ca.id_asesor, 
            ca.asesor_tipo, 
            ca.marcas_asignadas,
            TRIM(CONCAT_WS(' ', a.Nombre, a.app, a.apm)) AS nombre_asesor
         FROM cliente_asesor ca
         LEFT JOIN asesores a ON ca.id_asesor = a.id
         WHERE ca.id_cliente = ?`,
        [id]
    );

    cliente.asesoresAsignados = relaciones.length > 0
        ? relaciones.map((r: any) => ({
            id_asesor: r.id_asesor.toString(),
            nombre_asesor: r.nombre_asesor || 'Asesor sin nombre',
            asesor_tipo: r.asesor_tipo,
            marcasArray: (r.marcas_asignadas || '')
                .split(',')
                .map((m: string) => m.trim())
                .filter((m: string) => m.length > 0),
            marcas_asignadas: r.marcas_asignadas || ''
        }))
        : [{ id_asesor: '', nombre_asesor: '', asesor_tipo: '', marcasArray: [], marcas_asignadas: '' }];

    return cliente;
}
    static async buscaryfiltrarClientes(busqueda: string | null, estatus: number | null, pagina: number = 1, limite: number = 6) {
        const offset = (pagina - 1) * limite;
        const [rows]: any = await pool.query('CALL sp_buscar_clientes(?, ?, ?, ?)', [
            busqueda,
            estatus,
            limite,
            offset
        ]);
        const clientes = rows[0];
        const total = rows[1][0].total;
        return {
            clientes: clientes,
            total: total,
            paginas: Math.ceil(total / limite),
            paginaActual: pagina
        };
    }
    static async activarCliente(id: number) {
        const [rows]: any = await pool.query('call sp_activar_cliente(?)', [id]);
        return rows;
    }
    static async countClientesActivos() {
        const [rows]: any = await pool.query('SELECT COUNT(*) AS total_activos FROM verClientes WHERE Estatus = 1;');
        return rows[0];
    }
    static async agregarCliente(cliente: Cliente | any, asesoresAsignados: any[] = []) {
        const {
            Nombre, RFC, Razon_social, Regimen_fiscal, Direccion,
            contacto_principal, correo_contacto, CP,
            nombre_constancia, ruta_constancia,
            tiene_credito, limite_credito
        } = cliente;

        const [resultSets]: any = await pool.query(
            'call sp_agregar_cliente(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)',
            [
                Nombre, RFC, Razon_social, Regimen_fiscal, Direccion,
                contacto_principal, correo_contacto, CP,
                nombre_constancia, ruta_constancia,
                tiene_credito || 0,
                limite_credito || 0.00,
                null, null, null
            ]
        );

        const nuevoId = resultSets[0][0].id;

        for (const rel of asesoresAsignados) {
            if (rel.id_asesor) {
                const marcas = Array.isArray(rel.marcasArray) ? rel.marcasArray.join(', ') : (rel.marcas_asignadas || '');
                await pool.query(
                    `INSERT INTO cliente_asesor (id_cliente, id_asesor, asesor_tipo, marcas_asignadas)
                 VALUES (?, ?, ?, ?)`,
                    [nuevoId, parseInt(rel.id_asesor), rel.asesor_tipo, marcas]
                );
            }
        }

        return { id: nuevoId, mensaje: 'Cliente agregado correctamente' };
    }

    static async actualizarCliente(id: number, cliente: Cliente | any, asesoresAsignados: any[] = []) {
        const {
            Nombre, RFC, Razon_social, Regimen_fiscal, Direccion,
            contacto_principal, correo_contacto, CP,
            nombre_constancia, ruta_constancia,
            tiene_credito, limite_credito
        } = cliente;

        await pool.query(
            'call sp_modificar_cliente(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)',
            [
                id, Nombre, RFC, Razon_social, Regimen_fiscal, Direccion,
                contacto_principal, correo_contacto, CP,
                nombre_constancia, ruta_constancia,
                tiene_credito || 0,
                limite_credito || 0.00,
                null, null, null
            ]
        );


        await pool.query('DELETE FROM cliente_asesor WHERE id_cliente = ?', [id]);

        for (const rel of asesoresAsignados) {
            if (rel.id_asesor) {
                const marcas = Array.isArray(rel.marcasArray) ? rel.marcasArray.join(', ') : (rel.marcas_asignadas || '');
                await pool.query(
                    `INSERT INTO cliente_asesor (id_cliente, id_asesor, asesor_tipo, marcas_asignadas)
                 VALUES (?, ?, ?, ?)`,
                    [id, parseInt(rel.id_asesor), rel.asesor_tipo, marcas]
                );
            }
        }

        return { mensaje: 'Cliente actualizado correctamente' };
    }
    static async subirCSF(id_cliente: number, nombre_constancia: string, ruta_constancia: string) {
        const connection = await pool.getConnection();
        try {
            await connection.query('CALL sp_subir_csf_cliente(?, ?, ?, @p_mensaje, @p_ruta_anterior)', [
                id_cliente,
                nombre_constancia,
                ruta_constancia
            ]);

            const [results]: any = await connection.query('SELECT @p_mensaje AS mensaje, @p_ruta_anterior AS ruta_anterior');

            const mensaje = results[0].mensaje;
            const ruta_anterior = results[0].ruta_anterior;

            if (mensaje && mensaje.startsWith('Error:')) {
                throw new Error(mensaje);
            }

            return { mensaje, ruta_anterior };
        } finally {
            connection.release();
        }
    }
    static async asignarCredito(
    id_cliente: number,
    tiene_credito: boolean,
    limite_credito: number,
    fecha_vencimiento: string | null 
): Promise<string> {
    await pool.query(
        'CALL sp_asignar_credito_cliente(?, ?, ?, ?, @mensaje)',
        [id_cliente, tiene_credito ? 1 : 0, limite_credito, fecha_vencimiento]
    );

    const [rows]: any = await pool.query('SELECT @mensaje AS mensaje');

    return rows[0].mensaje;
}
}