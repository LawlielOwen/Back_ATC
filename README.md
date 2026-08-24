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

**Clientes** — registro de clientes con extracción automática de datos fiscales desde su Constancia de Situación Fiscal (CSF) en PDF, y asignación de línea de crédito.

**Proyectos** — gestiona los proyectos con clientes desde la propuesta hasta el cierre de venta, con flujo de estatus (Alta → Revisión Cliente → Ejecución → Completado) y bitácora auditable de avances.

**Tickets** — leads de seguimiento asignados a asesores, donde se reporta cada acción realizada a lo largo del lead hasta su cierre.

**Demos y Visitas** — control de productos en fase de demostración/prueba, y registro de visitas a clientes para llevar dichos productos.

**Pedidos** — gestión de pedidos a proveedores, con verificación automática de fechas: el sistema detecta pedidos a una semana de vencerse y notifica a los asesores de venta.

**Recepción** — registra la llegada de pedidos y confirma si llegaron correctos o con incidencias.

**Vales de salida** — control de movimientos de inventario (salida de productos para pedidos o demos), sincronizado en tiempo real vía WebSockets.

**Cotizador dinámico** — genera propuestas económicas con conversión de divisas, obteniendo el tipo de cambio diario desde la API de Banxico.

**Métricas (Dashboard)**
- Comparativo de lo cotizado mensualmente (últimos 3 meses)
- Productos más y menos pedidos del trimestre
- Productos estrella por cliente
- Comparación de lo cotizado vs. lo efectivamente vendido

## ⚙️ Variables de entorno

Crea un archivo `.env` en la raíz basado en este ejemplo:
