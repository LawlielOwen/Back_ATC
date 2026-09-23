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
            const filtroAsesor = ` WHERE EXISTS (
            SELECT 1 FROM cliente_asesor ca 
            WHERE ca.id_cliente = verClientes.id 
              AND ca.id_asesor = ?
        )`;
            queryDatos += filtroAsesor;
            queryCount += filtroAsesor;
            paramsDatos.push(idAsesorFiltro);
            paramsCount.push(idAsesorFiltro);
        }

        queryDatos += ' ORDER BY id DESC LIMIT ? OFFSET ?';
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
    static async buscaryfiltrarClientes(busqueda: string | null, estatus: number | null, pagina: number = 1, limite: number = 6, idAsesor: number | null = null) {
        const offset = (pagina - 1) * limite;

        const [rows]: any = await pool.query('CALL sp_buscar_clientes(?, ?, ?, ?, ?)', [
            busqueda,
            estatus,
            limite,
            offset,
            idAsesor
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
    static async agregarCliente(
        cliente: any,
        asesoresAsignados: any[] = []
    ) {
        const {
            Nombre,
            RFC,
            Razon_social,
            Regimen_fiscal,
            Direccion,
            contacto_principal,
            nombre_contacto,
            correo_contacto,
            CP,
            nombre_constancia,
            ruta_constancia,
            tiene_credito,
            limite_credito,
            fecha_vencimiento_credito
        } = cliente;

        // FormData normalmente manda "0" y "1" como string.
        const tieneCredito =
            Number(tiene_credito) === 1 ? 1 : 0;

        const limiteCredito =
            tieneCredito === 1
                ? Number(limite_credito || 0)
                : 0;

        const fechaVencimiento =
            tieneCredito === 1 && fecha_vencimiento_credito
                ? fecha_vencimiento_credito
                : null;

        const [resultSets]: any = await pool.query(
            `CALL sp_agregar_cliente(
            ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
            ?, ?, ?, ?, ?, ?, ?
        )`,
            [
                Nombre,
                RFC,
                Razon_social,
                Regimen_fiscal,
                Direccion,

                contacto_principal,
                nombre_contacto || null,
                correo_contacto,
                CP,

                nombre_constancia || '',
                ruta_constancia || '',

                tieneCredito,
                limiteCredito,
                fechaVencimiento,

                null,
                null,
                null
            ]
        );

        const nuevoId = resultSets[0][0].id;

        /*
            El SP recibe asesor NULL porque tú actualmente
            manejas varios asesores desde Node.
        */

        for (const rel of asesoresAsignados) {

            if (!rel.id_asesor) {
                continue;
            }

            const marcas =
                Array.isArray(rel.marcasArray)
                    ? rel.marcasArray.join(', ')
                    : rel.marcas_asignadas || '';

            await pool.query(
                `
            INSERT INTO cliente_asesor (
                id_cliente,
                id_asesor,
                asesor_tipo,
                marcas_asignadas
            )
            VALUES (?, ?, ?, ?)
            `,
                [
                    nuevoId,
                    parseInt(rel.id_asesor),
                    rel.asesor_tipo,
                    marcas
                ]
            );
        }

        return {
            id: nuevoId,
            mensaje: 'Cliente agregado correctamente'
        };
    }

  static async actualizarCliente(
    id: number,
    cliente: any,
    asesoresAsignados: any[] = []
) {
    const {
        Nombre,
        RFC,
        Razon_social,
        Regimen_fiscal,
        Direccion,
        contacto_principal,
        nombre_contacto,
        correo_contacto,
        CP,
        nombre_constancia,
        ruta_constancia,
        tiene_credito,
        limite_credito,
        fecha_vencimiento_credito
    } = cliente;

    const tieneCredito =
        Number(tiene_credito) === 1 ? 1 : 0;

    const limiteCredito =
        tieneCredito === 1
            ? Number(limite_credito || 0)
            : 0;

    const fechaVencimiento =
        tieneCredito === 1 && fecha_vencimiento_credito
            ? fecha_vencimiento_credito
            : null;

    await pool.query(
        `CALL sp_modificar_cliente(
            ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
            ?, ?, ?, ?, ?, ?, ?, ?
        )`,
        [
            id,

            Nombre,
            RFC,
            Razon_social,
            Regimen_fiscal,
            Direccion,

            contacto_principal,
            nombre_contacto || null,
            correo_contacto,
            CP,

            nombre_constancia || '',
            ruta_constancia || '',

            tieneCredito,
            limiteCredito,
            fechaVencimiento,

            null,
            null,
            null
        ]
    );

    /*
        Se reemplazan las relaciones con asesores.
    */

    await pool.query(
        'DELETE FROM cliente_asesor WHERE id_cliente = ?',
        [id]
    );

    for (const rel of asesoresAsignados) {

        if (!rel.id_asesor) {
            continue;
        }

        const marcas =
            Array.isArray(rel.marcasArray)
                ? rel.marcasArray.join(', ')
                : rel.marcas_asignadas || '';

        await pool.query(
            `
            INSERT INTO cliente_asesor (
                id_cliente,
                id_asesor,
                asesor_tipo,
                marcas_asignadas
            )
            VALUES (?, ?, ?, ?)
            `,
            [
                id,
                parseInt(rel.id_asesor),
                rel.asesor_tipo,
                marcas
            ]
        );
    }

    return {
        mensaje: 'Cliente actualizado correctamente'
    };
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

    const connection = await pool.getConnection();

    try {

        await connection.query(
            `
            CALL sp_asignar_credito_cliente(
                ?, ?, ?, ?, @mensaje
            )
            `,
            [
                id_cliente,
                tiene_credito ? 1 : 0,
                limite_credito,
                fecha_vencimiento
            ]
        );

        const [rows]: any = await connection.query(
            'SELECT @mensaje AS mensaje'
        );

        const mensaje = rows[0].mensaje;

        if (
            mensaje?.startsWith('Error:') ||
            mensaje?.startsWith('No se puede')
        ) {
            throw new Error(mensaje);
        }

        return mensaje;

    } finally {

        connection.release();

    }
}
    static async registrarPagoCredito(
    idCliente: number,
    monto: number,
    referencia: string | null = null,
    observaciones: string | null = null
): Promise<string> {

    const connection = await pool.getConnection();

    try {

        await connection.query(
            `
            CALL sp_registrar_pago_credito(
                ?, ?, ?, ?, @mensaje
            )
            `,
            [
                idCliente,
                monto,
                referencia,
                observaciones
            ]
        );

        const [rows]: any = await connection.query(
            'SELECT @mensaje AS mensaje'
        );

        const mensaje = rows[0].mensaje;

        if (
            mensaje &&
            (
                mensaje.startsWith('Error:') ||
                mensaje.startsWith('El cliente') ||
                mensaje.startsWith('El pago')
            )
        ) {
            throw new Error(mensaje);
        }

        return mensaje;

    } finally {

        connection.release();

    }
}
static async obtenerMovimientosCredito(
    idCliente: number
) {
    const [rows]: any = await pool.query(
        `
        SELECT
            mc.id,
            mc.id_cliente,
            mc.id_pedido,
            mc.tipo_movimiento,
            mc.monto,
            mc.saldo_anterior,
            mc.saldo_posterior,
            mc.fecha_movimiento,
            mc.referencia,
            mc.observaciones
        FROM movimientos_credito mc
        WHERE mc.id_cliente = ?
        ORDER BY mc.fecha_movimiento DESC, mc.id DESC
        `,
        [idCliente]
    );

    return rows;
}
}