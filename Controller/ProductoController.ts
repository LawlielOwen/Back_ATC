import { Request, Response } from "express";
import { ProductoService } from "../Service/Productos";

export class ProductoController {
    static async getProductos(req: Request, res: Response) {
        try {
            const pagina = parseInt(req.query.pagina as string) || 1;
            const limite = parseInt(req.query.limite as string) || 7;
            const result = await ProductoService.obtenerProductos(pagina, limite);
            res.status(200).json(result);
        } catch (error: any) {
            console.error(error);
            res.status(500).json({ error: 'Error interno del servidor' });
        }
    }
    static async getProductoPorId(req: Request, res: Response) {
        try {
            const id = parseInt(req.params.id as string);
            const result = await ProductoService.obtenerProductoPorId(id);
            if (result) {
                res.status(200).json(result);
            } else {
                res.status(404).json({ error: 'Producto no encontrado' });
            }
        } catch (error: any) {
            console.error(error);
            res.status(500).json({ error: 'Error interno del servidor' });
        }
    }
  static async agregarProducto(req: any, res: Response) {
    try {
        const producto = req.body;
        const result = await ProductoService.agregarProducto(producto);
        res.status(201).json(result);
    } catch (error: any) {
        console.error(error);
        
        if (error.message && error.message.includes('Error:')) {
            return res.status(400).json({ error: error.message });
        }

        res.status(500).json({ error: 'Error interno del servidor' });
    }
}
    static async actualizarProducto(req: Request, res: Response) {
        try {
            const id = parseInt(req.params.id as string);
            const producto = req.body;
            const result = await ProductoService.modificarProducto(id, producto);
            res.status(200).json(result);
        } catch (error: any) {
            console.error(error);
            res.status(500).json({ error: 'Error interno del servidor' });
        }
    }
    static async eliminarProducto(req: Request, res: Response) {
        const id = parseInt(req.params.id as string);
        try {
            const result = await ProductoService.eliminarProducto(id);
            res.status(200).json(result);
        } catch (error: any) {
            console.error(error);
            res.status(500).json({ error: 'Error interno del servidor' });
        }
    }
    static async activarProducto(req: Request, res: Response) {
        const id = parseInt(req.params.id as string);
        try {
            const result = await ProductoService.activarProducto(id);
            res.status(200).json(result);
        } catch (error: any) {
            console.error(error);
            res.status(500).json({ error: 'Error interno del servidor' });
        }
    }
    static async buscaryfiltrarProductos(req: Request, res: Response) {
        try {
            const busqueda = req.query.busqueda as string || null;
            const estatus = req.query.estatus ? parseInt(req.query.estatus as string) : null;
            const marca = req.query.marca ? parseInt(req.query.marca as string) : null;
            const pagina = parseInt(req.query.pagina as string) || 1;
            const limite = parseInt(req.query.limite as string) || 9;
            const result = await ProductoService.buscaryfiltrarProducto(busqueda, estatus, marca, pagina, limite);
            res.status(200).json(result);
        } catch (error: any) {
            console.error(error);
            res.status(500).json({ error: 'Error interno del servidor' });
        }
    }
      static async contarProductos(req: any, res: Response) {
        try {
            const result = await ProductoService.countProductosStock();
            if (result) {
                res.status(200).json(result);
            } else {
                res.status(404).json({ error: 'Productos no encontrados' });
            }
        } catch (error: any) {
            console.error(error);
            res.status(500).json({ error: 'Error interno del servidor' });
        }
    }
    static async buscarProductoPorCodigo(req: Request, res: Response) {
      try {
        const termino = (req.query.termino as string || '').trim();

        if (termino.length < 2) {
            return res.status(200).json([]);
        }

        const result = await ProductoService.buscarProductoPorCodigo(termino);
        res.status(200).json(result);
    } catch (error: any) {
        console.error(error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
    }
static async registrarEntradaProducto(req: Request, res: Response) {
    try {
        const { codigo, cantidad, destino, id_asesor, requestId } = req.body;

        if (!codigo || !cantidad || cantidad <= 0 || !destino) {
            return res.status(400).json({
                error: 'Código, cantidad (mayor a 0) y destino son obligatorios'
            });
        }

        if (!requestId || typeof requestId !== 'string' || requestId.trim().length !== 36) {
            return res.status(400).json({
                error: 'El identificador único de la operación no es válido'
            });
        }

        if (!id_asesor || isNaN(Number(id_asesor))) {
            return res.status(400).json({
                error: 'El asesor responsable es obligatorio'
            });
        }

        const destinoNormalizado =
            destino.toLowerCase() === 'pedido'
                ? 'Pedido'
                : 'Almacen';

        const result = await ProductoService.registrarEntradaProducto(
            codigo,
            parseInt(cantidad),
            destinoNormalizado,
            parseInt(id_asesor),
            requestId.trim()
        );

        res.status(200).json(result);

    } catch (error: any) {
        console.error(error);

        res.status(500).json({
            error: 'Error interno del servidor'
        });
    }
}
static async obtenerEstanterias(req: Request, res: Response) {
    try {
        const estanterias =
            await ProductoService.obtenerEstanterias();

        return res.status(200).json({
            estanterias
        });

    } catch (error: any) {
        console.error(
            'Error al obtener estanterías:',
            error
        );

        return res.status(500).json({
            error: 'Error interno del servidor al obtener las estanterías.'
        });
    }
}

static async obtenerCajas(req: Request, res: Response) {
    try {
        const cajas =
            await ProductoService.obtenerCajas();

        return res.status(200).json({
            cajas
        });

    } catch (error: any) {
        console.error(
            'Error al obtener cajas:',
            error
        );

        return res.status(500).json({
            error: 'Error interno del servidor al obtener las cajas.'
        });
    }
}
static async agregarEstanteria(req: Request, res: Response) {
    try {
        const {
            codigo,
            descripcion = null
        } = req.body;

        if (
            typeof codigo !== 'string' ||
            codigo.trim() === ''
        ) {
            return res.status(400).json({
                error: 'Debes ingresar el código de la estantería.'
            });
        }

        if (codigo.trim().length > 20) {
            return res.status(400).json({
                error: 'El código de la estantería no puede superar los 20 caracteres.'
            });
        }

        const mensaje =
            await ProductoService.agregarEstanteria(
                codigo,
                descripcion
            );

        if (
            !mensaje ||
            mensaje.startsWith('Error')
        ) {
            return res.status(400).json({
                error: mensaje || 'No se pudo registrar la estantería.'
            });
        }

        return res.status(201).json({
            mensaje
        });

    } catch (error: any) {
        console.error(
            'Error al agregar estantería:',
            error
        );

        return res.status(500).json({
            error: 'Error interno al registrar la estantería.'
        });
    }
}

static async desactivarEstanteria(req: Request, res: Response) {
    try {
        const id =
            Number(req.params.id);

        if (
            !Number.isInteger(id) ||
            id <= 0
        ) {
            return res.status(400).json({
                error: 'El ID de la estantería no es válido.'
            });
        }

        const mensaje =
            await ProductoService.desactivarEstanteria(id);

        if (
            !mensaje ||
            mensaje.startsWith('Error')
        ) {
            return res.status(400).json({
                error: mensaje || 'No se pudo desactivar la estantería.'
            });
        }

        return res.status(200).json({
            mensaje
        });

    } catch (error: any) {
        console.error(
            'Error al desactivar estantería:',
            error
        );

        return res.status(500).json({
            error: 'Error interno al desactivar la estantería.'
        });
    }
}

static async agregarCaja(req: Request, res: Response) {
    try {
        const {
            codigo,
            descripcion = null
        } = req.body;

        if (
            typeof codigo !== 'string' ||
            codigo.trim() === ''
        ) {
            return res.status(400).json({
                error: 'Debes ingresar el código de la caja.'
            });
        }

        if (codigo.trim().length > 20) {
            return res.status(400).json({
                error: 'El código de la caja no puede superar los 20 caracteres.'
            });
        }

        const mensaje =
            await ProductoService.agregarCaja(
                codigo,
                descripcion
            );

        if (
            !mensaje ||
            mensaje.startsWith('Error')
        ) {
            return res.status(400).json({
                error: mensaje || 'No se pudo registrar la caja.'
            });
        }

        return res.status(201).json({
            mensaje
        });

    } catch (error: any) {
        console.error(
            'Error al agregar caja:',
            error
        );

        return res.status(500).json({
            error: 'Error interno al registrar la caja.'
        });
    }
}

static async desactivarCaja(req: Request, res: Response) {
    try {
        const id =
            Number(req.params.id);

        if (
            !Number.isInteger(id) ||
            id <= 0
        ) {
            return res.status(400).json({
                error: 'El ID de la caja no es válido.'
            });
        }

        const mensaje =
            await ProductoService.desactivarCaja(id);

        if (
            !mensaje ||
            mensaje.startsWith('Error')
        ) {
            return res.status(400).json({
                error: mensaje || 'No se pudo desactivar la caja.'
            });
        }

        return res.status(200).json({
            mensaje
        });

    } catch (error: any) {
        console.error(
            'Error al desactivar caja:',
            error
        );

        return res.status(500).json({
            error: 'Error interno al desactivar la caja.'
        });
    }
}
static async consultarUbicaciones(
    req: Request,
    res: Response
) {
    try {
        const tipo =
            String(req.query.tipo || 'estanteria');

        const estatus =
            String(req.query.estatus || 'todos');

        const pagina =
            Number(req.query.pagina || 1);

        const limite =
            Number(req.query.limite || 9);

        if (
            tipo !== 'estanteria' &&
            tipo !== 'caja'
        ) {
            return res.status(400).json({
                error: 'El tipo debe ser estanteria o caja.'
            });
        }

        if (
            estatus !== 'todos' &&
            estatus !== 'activos' &&
            estatus !== 'inactivos'
        ) {
            return res.status(400).json({
                error: 'El estatus debe ser todos, activos o inactivos.'
            });
        }

        if (
            !Number.isInteger(pagina) ||
            pagina <= 0
        ) {
            return res.status(400).json({
                error: 'La página no es válida.'
            });
        }

        if (
            !Number.isInteger(limite) ||
            limite <= 0 ||
            limite > 50
        ) {
            return res.status(400).json({
                error: 'El límite no es válido.'
            });
        }

        const resultado =
            await ProductoService.consultarUbicaciones(
                tipo,
                estatus,
                pagina,
                limite
            );

        return res.status(200).json(resultado);

    } catch (error: any) {
        console.error(
            'Error al consultar ubicaciones:',
            error
        );

        return res.status(500).json({
            error:
                error.message ||
                'Error interno al consultar ubicaciones.'
        });
    }
}
}