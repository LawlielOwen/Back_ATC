# Back_ATC

Backend del sistema de gestión de ventas e inventario para **ATC (Automatización, Tecnología y Control)**, desarrollado durante mis prácticas profesionales en la sucursal de León, Guanajuato. Expone la API REST que sostiene la gestión de clientes, proyectos, tickets de venta, control de inventario y métricas de negocio, actualmente en uso por los asesores de la sucursal.

![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat&logo=typescript&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-339933?style=flat&logo=node.js&logoColor=white)
![MySQL](https://img.shields.io/badge/MySQL-4479A1?style=flat&logo=mysql&logoColor=white)

## 📋 Contexto

La sucursal de ATC dependía de plantillas en Excel y procesos manuales para su operación diaria. Esto generaba:

- **Cotizaciones lentas** — 3 a 10 minutos por documento, con un volumen de 30 a 50 cotizaciones diarias
- **Inventario no sincronizado** — redundancia y duplicidad de registros al no existir un archivo centralizado en red
- **Vales de salida en papel** — exigían firma presencial, retrasando el surtido a clientes
- **Pérdida de seguimiento** — tanto en cotizaciones enviadas sin cierre de venta, como en pedidos a proveedores con plazos de 1 a 2 meses sin monitoreo

Este backend expone la API que sostiene la plataforma web desarrollada para digitalizar y automatizar estos procesos.

## 🧩 Stack técnico

- **Lenguaje:** TypeScript
- **Entorno:** Node.js + Express
- **Base de datos:** MySQL (vistas, stored procedures, transacciones)
- **Tiempo real:** WebSockets
- **Automatización:** Cron jobs para tareas programadas

## 🏗️ Arquitectura

Backend organizado por capas, cada una con una responsabilidad única:

| Capa | Responsabilidad |
|---|---|
| `Model` | Entidades del sistema |
| `Controller` | Manejo de peticiones y respuestas HTTP (200, 404, 500, etc.) |
| `Service` | Lógica de negocio y consultas a base de datos |
| `Router` | Definición de rutas y métodos HTTP (GET, POST, PUT, etc.) |
| `Middleware` | Seguridad del lado del servidor |
| `Config` | Conexión a base de datos vía variables de entorno |
| `Jobs` | Tareas programadas (cron jobs) |
| `Uploads` | Almacenamiento de archivos PDF del sistema |
| `Assets` | Imágenes usadas en la plantilla de cotización |
| `Template` | Plantilla HTML para la generación de cotizaciones |

## 📦 Módulos principales

**Catálogo** — catálogo y gestión general de todos los productos de la sucursal, con precios y existencias.

**Demos** — control de productos actualmente en fase de demostración o prueba.

**Visitas** — registro de las visitas realizadas a clientes para llevar los productos que están en fase de demostración.

**Clientes** — registro de clientes con extracción automática de datos fiscales desde su Constancia de Situación Fiscal (CSF) en PDF, y asignación de línea de crédito.

**Cotizaciones** — cotizador dinámico que genera propuestas económicas con conversión de divisas, usando el tipo de cambio diario obtenido de la API de Banxico.

**Pedidos** — gestiona los pagos de los pedidos de clientes: subida del recibo de pago proporcionado por el cliente, o uso del crédito autorizado por la sucursal para ese cliente.

**Tickets** — leads de seguimiento asignados a asesores, donde se reporta cada acción realizada a lo largo del lead hasta su cierre.

**Proyectos** — gestiona los proyectos con clientes desde la propuesta hasta el cierre de venta, con flujo de estatus (Alta → Revisión Cliente → Ejecución → Completado) y bitácora auditable de avances.

**Historial E/S** — historial de las entradas y salidas de las existencias de los productos de la sucursal.

**Vales de salida** — solicitud y control de las salidas de productos para concluir con los pedidos de los clientes y realizar su entrega final, sincronizado en tiempo real vía WebSockets.

**Recepción** — gestión de los pedidos realizados a proveedores; confirma si la mercancía llegó correcta o con incidencias, con verificación automática de fechas para notificar a los asesores cuando un pedido está por vencerse.

**Asesores** — gestión de los usuarios registrados dentro del sistema (acceso restringido al rol Administrador).

**Métricas (Dashboard)**
- Comparativo de lo cotizado mensualmente (últimos 3 meses)
- Productos más y menos pedidos del trimestre
- Productos estrella por cliente
- Comparación de lo cotizado vs. lo efectivamente vendido

## 💱 Manejo de divisas

Los módulos de Cotizaciones, Pedidos y Métricas trabajan con montos en distintas monedas. Para esto, el backend consume la API SIE (Sistema de Información Económica) del Banco de México, consultando la serie `SF43718` (tipo de cambio FIX), autenticado con un token personal enviado en el header `Bmx-Token` y almacenado como variable de entorno:

```typescript
const url = `https://www.banxico.org.mx/SieAPIRest/service/v1/series/SF43718/datos/oportuno`;

const response = await axios.get(url, {
  headers: { 'Bmx-Token': process.env.KEY_TOKEN_BANXICO }
});
```

El endpoint regresa el tipo de cambio más reciente publicado por Banxico, que se usa para convertir montos entre pesos mexicanos y dólares dentro de cotizaciones, pedidos y los reportes del dashboard.

## 🔗 Repositorio relacionado

Frontend: [Front_ATC](https://github.com/LawlielOwen/Front_ATC)

## 📌 Estado

Sistema en producción activa, utilizado actualmente por los asesores de la sucursal. 
