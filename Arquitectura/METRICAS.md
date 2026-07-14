# Ecosistema de Métricas y Analíticas B2B

Este documento detalla el funcionamiento, la arquitectura y los eventos de telemetría implementados en la plataforma de **Mario Mojica** para el monitoreo de la landing page y el comportamiento de armado en los manuales 3D.

---

## 🛠️ 1. Tecnologías de Analíticas Utilizadas

El sistema utiliza una arquitectura híbrida dividida en dos capas para garantizar redundancia y soberanía de los datos:

### A. Umami Analytics (Rastreo Web y Eventos Agregados)
* **Descripción:** Software de analítica web de código abierto, autoalojado, privacy-first y **100% libre de cookies**.
* **Infraestructura:** Corre en un contenedor Docker en el VPS Hetzner bajo el subdominio `analytics.mariomojica.com`, aislado en una red interna de base de datos PostgreSQL.
* **Uso principal:** Registro de visitas, orígenes, dispositivos, y almacenamiento de eventos agregados de interacción (clics en botones, conversiones de formularios, embudos de armado).
* **ID de Sitio Principal:** `61ad7bc7-dc54-4916-a586-4c9d94be795a`

### B. Supabase Telemetry (Rastreo Granular de Pasos y Feedback)
* **Descripción:** Persistencia relacional de eventos a nivel de fila y sesión de usuario.
* **Tabla de destino:** `public.telemetria_manuales` (con RLS y endpoints protegidos por rate limiting).
* **Uso principal:** Almacenamiento persistente de tiempos exactos de permanencia por paso, logs de interacción, y las reseñas/feedback que alimentan el generador de reportes PDF de fricción en la consola Next.js.

---

## 📐 2. Flujo de Datos y Telemetría

```
                                  ┌───────────────────────────────┐
                                  │   Interacción del Usuario     │
                                  └──────────────┬────────────────┘
                                                 │
                                                 ▼
                             ┌───────────────────┴───────────────────┐
                             │       Hook useTelemetry.js            │
                             │ (Carga script.js de Umami en cliente) │
                             └──────────┬─────────────────┬──────────┘
                                        │                 │
                           (Fetch POST) │                 │ (API de JS)
                                        ▼                 ▼
                      ┌───────────────────┐     ┌───────────────────┐
                      │ API Next.js Route │     │ Servidor Umami    │
                      │  /api/metrics     │     │   (Hetzner VPS)   │
                      └─────────┬─────────┘     └─────────┬─────────┘
                                │                         │
                                ▼                         ▼
                      ┌───────────────────┐     ┌───────────────────┐
                      │   Supabase DB     │     │  Base de Datos    │
                      │ (Reporte PDF      │     │  Umami (Métricas  │
                      │  de Fricción)     │     │  e Info Agregada) │
                      └───────────────────┘     └───────────────────┘
```

---

## 📊 3. Mapa de Eventos Personalizados (Umami)

### A. Eventos de los Manuales 3D (Estantería, Politorno y Futuros)
Rastreados dinámicamente mediante el hook `useTelemetry.js` en el visor:

| Nombre del Evento | Cuándo se dispara | Propiedades de Metadata del Evento |
| :--- | :--- | :--- |
| **`Session Start`** | Al cargarse la pantalla de bienvenida del manual. | `manual` (Código), `device`, `referrer` |
| **`Step Reached`** | Al cambiar o avanzar a un paso del manual. | `manual`, `step` (ej. `01`), `device` |
| **`Help Clicked`** | Clic en herramientas, ensambles, garantía o tutorial. | `manual`, `help_type` (ej. `tools`), `device` |
| **`Session Complete`** | Al finalizar el 100% de los pasos de armado. | `manual`, `device` |
| **`Feedback Submitted`** | Al enviar la encuesta de valoración del mueble. | `manual`, `rating` (1-5), `tags`, `device` |

### B. Eventos Declarativos de la Landing Page
Rastreados directamente en el DOM mediante el atributo `data-umami-event`:

* **`Navbar Navigation`:** Clics en la barra de navegación superior.
  * *Propiedad:* `data-umami-event-target` (valores: `caracteristicas`, `demo`, `contacto`).
* **`Navbar Free Prototype Clicked`:** Clic en el botón CTA de la Navbar.
* **`Navbar Login Clicked`:** Clic en el botón de acceso de administración.
* **`Body Free Prototype Clicked`:** Clic en el botón CTA de solicitar prototipo bajo la demo 3D.
* **`Language Changed`:** Clic en los selectores de idioma de la cabecera.
  * *Propiedad:* `data-umami-event-lang` (valores: `es`, `en`, `pt`).
* **`Lead Form Submitted`:** Envío exitoso del formulario de contacto (se gatilla únicamente tras una respuesta 200 de la API conectada a n8n).
  * *Propiedades:* `catalog` (Rango de productos del cliente), `company` (Nombre de la empresa).

---

## 🚀 4. Guía para Explotar las Analíticas en Negocio

Para convencer a las juntas directivas de las fábricas de muebles RTA (ej. Jamar, Maderkit, Politorno), utiliza estas técnicas en Umami:

### 1. Construcción de Embudos de Fricción (Funnels)
Crea un embudo en Umami configurando los eventos secuencialmente:
1. `Session Start`
2. `Step Reached` (con filtro `step` = `00`)
3. `Step Reached` (con filtro `step` = `01`)
4. ...
5. `Session Complete`

**Qué te dice:** El gráfico de barras te mostrará la retención de usuarios. Si notas una caída drástica en la barra del *Paso 04*, sabrás con certeza matemática que las instrucciones de armado del mueble en ese paso específico tienen problemas de comprensión.

### 2. Detección de Fricción Técnica (`Help Clicked`)
Filtra los eventos de `Help Clicked` por tipo. Si el tipo de ayuda más clicado es `tools` (Herramientas necesarias), significa que la gente no sabe qué destornillador o martillo preparar antes de comenzar. Si es `minifix` o `bisagra`, hay una alta fricción mecánica.

### 3. Origen del Tráfico (`Referrer`)
Analiza si las sesiones ingresan desde el QR impreso en la caja física del mueble (`referrer_type` = `qr`) o desde el widget embebido en la tienda online del cliente (`referrer_type` = `embed`). Esto te permite demostrarle al cliente B2B el porcentaje exacto de compradores físicos que utilizan el manual digital.
