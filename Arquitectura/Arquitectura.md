# Arquitectura de la Solución B2B — Mario Mojica (Versión 7)

Este documento detalla de forma exhaustiva la arquitectura técnica y el ecosistema de aplicaciones, seguridad, automatización y métricas de la plataforma de **Mario Mojica**. Está diseñado para servir como punto de referencia estructural y técnico para el desarrollo continuo y la replicabilidad del sistema.

---

## 🛠️ 1. Vista General del Ecosistema

El sistema está estructurado bajo una arquitectura **Headless distribuida**, acoplando servicios de Backend-as-a-Service (BaaS), aplicaciones frontend interactivas en 3D, un clúster de microservicios dockerizados en un VPS para automatización/analítica, y renderizado paramétrico local.

```
                                      ┌────────────────────────────────┐
                                      │   Clientes / Navegadores       │
                                      └──────────────┬─────────────────┘
                                                     │
                             ┌───────────────────────┼──────────────────────┐
                             │ (HTTPS / Analytics)   │ (Signed URLs / POST) │
                             ▼                       ▼                      ▼
               ┌───────────────────────────┐ ┌───────────────┐     ┌─────────────────┐
               │    VPS Hetzner Docker     │ │  Landing Page │     │    Visor 3D     │
               │ (Nginx Proxy Manager,     │ │   (Netlify)   │     │ (Vite/Three.js) │
               │  n8n, Baserow, Umami)     │ └───────────────┘     └────────┬────────┘
               └─────────────┬─────────────┘                                │
                             │                                              │
                             │ (Secure Actions / Telemetry / Sign)          │
                             ▼                                              │
               ┌───────────────────────────┐                                │
               │   Plataforma CMS / API    │◄───────────────────────────────┘
               │     Next.js (Netlify)     │
               └─────────────┬─────────────┘
                             │
                             ▼
               ┌───────────────────────────┐
               │      Supabase Cloud       │
               │ (PostgreSQL, Storage Priv)│
               └───────────────────────────┘
```

---

## 📦 2. Detalle de Componentes

### A. Capa de Frontend y Experiencia 3D

1. **Plataforma CMS B2B (Next.js):**
   * **Directorio:** `mario-mojica-plataforma/`
   * **Descripción:** Panel de administración donde Mario Mojica gestiona sus proyectos y visualiza reportes de comportamiento.
   * **Framework:** Next.js (App Router) en React. Estilo premium basado en la estética *Obsidian Teal* (modo oscuro por defecto) y *Tech Ethos* para impresión.
   * **Endpoints Críticos:**
     * `/api/metrics/collect`: Recolector de telemetría con rate limiting local en memoria (máximo 40 peticiones por minuto por IP/sesión).
     * `/api/assets/sign`: Generador seguro de URLs firmadas para archivos `.glb` y audios.
     * `/proyectos/[id]/reporte`: Vista dinámica optimizada para impresión física en tamaño A4 (`@media print`) que genera el Reporte de Fricción mensual sin dependencias pesadas.

2. **Visor 3D Interactivo (App Armado):**
   * **Directorio:** `legacy-aplicativo-armado/`
   * **Descripción:** El motor interactivo que renderiza las instrucciones de ensamblado de los muebles en 3D en tiempo real.
   * **Librerías Clave:** React (Vite), Three.js mediante `@react-three/fiber` y `@react-three/drei` para el control de cámara y orbitales, Zustand para el manejo del estado global.

3. **Landing Page y Portafolio:**
   * **Directorio:** `mario-mojica-homepage/` (y `mario-mojica-landing-page/`)
   * **Descripción:** Sitio corporativo público diseñado para la captación de leads en la industria de muebles RTA (prioridad: Brasil y Latinoamérica).

---

### B. Capa de Datos e Infraestructura Core (Supabase Cloud)

* **Base de Datos Relacional (PostgreSQL):** Almacena las tablas de `proyectos`, `configuraciones_manual`, `profiles` y la tabla `telemetria_manuales` donde se consolida la interacción de los usuarios con el visor.
* **Storage Privado (IP Shield):** El bucket `insumos_manuales` está configurado como **Privado**. No es posible acceder de forma directa a los archivos `.glb`, audios o texturas PBR sin una firma de corta duración (5 minutos), evitando la piratería y la descarga no autorizada de los assets de diseño.

---

### C. Capa de Automatización y CRM (Hetzner VPS)

El servidor VPS (Ubuntu) corre de forma aislada un conjunto de contenedores Docker interconectados en redes locales:

1. **Nginx Proxy Manager (`npm_proxy`):**
   * Gestiona el enrutamiento externo y expone subdominios seguros con SSL Let's Encrypt automático (`n8n.mariomojica.com`, `baserow.mariomojica.com` y `analytics.mariomojica.com`).
   * Está conectado a la red externa de aplicaciones y a la red `internal_network` de Umami.

2. **n8n Automation Engine (`n8n_app`):**
   * Gestiona flujos de trabajo e integraciones. El flujo **`9DCA7UuMADzYk24Y`** intercepta el registro de leads del portafolio, inyecta su estado por defecto, y dispara alertas en WhatsApp y Gmail.

3. **Baserow CRM (`baserow_app`):**
   * Utilizado como base de datos y Kanban para el equipo de ventas. La tabla **`Leads`** (ID `600`) dentro de la base de datos `Portafolio` (ID `144`) contiene el campo tipo select **`Estado CRM`** (Field ID `9457`) para estructurar el embudo comercial (`Prospecto`, `Primer Contacto`, `Demo Agendada`, `Negociación`, `Cerrado Ganado`, `Cerrado Perdido`).

4. **Umami Analytics (`umami_app` & `umami_db`):**
   * Analítica web privada autoalojada y libre de cookies. La base de datos es PostgreSQL (`postgres:15-alpine`) y la aplicación corre en el puerto interno `3000` (mapeado en host al `3010`), conectada al proxy de Nginx mediante la red `internal_network`.

---

## 🔒 3. Protocolos de Seguridad y Optimización

### A. IP Shield (Protección de Diseños 3D)
Para evitar que los modelos `.glb` sean descargados por terceros directamente desde las llamadas de red:
1. El visor 3D nunca solicita la URL pública directa del archivo.
2. Al iniciar la escena, el visor realiza una petición masiva asíncrona al endpoint `/api/assets/sign` de la Plataforma Next.js.
3. El endpoint valida las cabeceras HTTP `Origin` y `Referer`. Solo si coinciden con el dominio autorizado registrado para ese proyecto (o `localhost` en desarrollo) se procede con la firma.
4. La Plataforma de Next.js (usando la clave de acceso administrativa `service_role`) genera una URL firmada en Supabase Storage con un tiempo de vida (TTL) de 300 segundos (5 minutos) y la retorna.
5. El visor almacena las URLs temporales en un caché en memoria local (`urlsFirmadasCache`) para que Three.js cargue y renderice fluidamente los assets de forma instantánea.

### B. Soberanía de Métricas y Telemetrías
El hook `useTelemetry.js` envía periódicamente la interacción del usuario (paso actual, tiempo de ensamblado, errores de orientación, clics en audio).
* En lugar de insertar datos directamente usando el SDK de Supabase (lo cual requeriría abrir permisos de escritura anónimos en la base de datos), los datos se envían por POST a `/api/metrics/collect`.
* Esta API Route valida la estructura de datos e inserta el registro usando la API interna segura, protegiendo la base de datos contra inyecciones y SPAM mediante un rate limiter de 40 llamadas/min.

---

## 🌐 4. Diagrama de Flujo y Redes

* **`mmapp_network` (Docker Bridge):** Conecta `n8n_app`, `baserow_app`, `npm_proxy` y `npm_database`.
* **`internal_network` (Docker Bridge):** Conecta `umami_app`, `umami_db` y `npm_proxy`. Esta separación evita que la base de datos de Umami sea visible desde otros contenedores del CRM o automatizaciones de negocio.

Para una representación gráfica interactiva de estas conexiones, ver el diagrama vectorial generado en [arquitectura_V7.svg](file:///c:/Desarrollo/mmapp/Arquitectura/arquitectura_V7.svg).
