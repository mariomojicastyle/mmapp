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

## 🤖 4. Integraciones y Flujos de Automatización Avanzados (n8n + Gmail + Baserow)

Para maximizar la conversión B2B y garantizar la trazabilidad de interacciones, el sistema cuenta con una integración avanzada entre **Gmail**, **n8n** y **Baserow CRM**:

### Flujo de Trabajo: Sincronización Automática de Interacciones y Captura de Leads

1. **Trigger de Correo (Gmail Trigger):**
   * n8n monitorea en tiempo real los correos enviados o recibidos en `direccion@mariomojica.com` usando la API oficial mediante OAuth 2.0.

2. **Búsqueda en el CRM (Baserow):**
   * Busca en la tabla `Leads` (ID `600`) si existe un registro cuyo campo `Correo` (Field ID `5558`) coincida con la dirección del remitente.

3. **Lógica Bifurcada (IF: ¿Lead Existe?):**
   * **Ruta A (El Lead Existe):**
     * **Registro de Notas (Opción A):** n8n registra el correo (Asunto, Dirección y Cuerpo) en una tabla secundaria vinculada llamada `Interacciones` o `Notas` de Baserow, manteniendo un historial limpio por fila.
     * **Cambio de Estado:** El `Estado CRM` (Field ID `9457`) del lead se actualiza automáticamente a **"En Seguimiento"** para activar su prioridad en el Kanban.
     * **Alerta Instantánea:** Se dispara una alerta de WhatsApp mediante el nodo `WhatsApp Renueva` notificando al equipo sobre la respuesta del cliente.
   * **Ruta B (El Lead NO Existe - Recomendación de Valor):**
     * **Filtro de SPAM/Internos:** n8n comprueba que el remitente no sea una dirección interna `@mariomojica.com` ni un dominio de spam conocido.
     * **Creación Automática (Inbound):** Para maximizar la velocidad de respuesta comercial (speed-to-lead), n8n crea automáticamente un nuevo Lead en la tabla `Leads` (600) con estado **"Nuevo"** (`3952`), guardando el Asunto y el primer correo en el campo `Descripcion` (9455).
     * **Notificación de Alerta:** Envía un WhatsApp en tiempo real informando que un nuevo prospecto ha iniciado contacto por correo.

### Comparativa de Opciones de Registro y Recomendación Arquitectónica

Para el registro del historial de correos de leads en Baserow se evaluaron dos alternativas técnicas principales:

*   **Opción A (Tabla Secundaria Vinculada - `Interacciones` o `Notas` de Baserow):**
    *   **Funcionamiento:** Cada correo electrónico (entrante o saliente) se registra como una fila independiente en una tabla secundaria, vinculada mediante una relación de clave foránea al ID del Lead en la tabla principal `Leads` (600).
    *   **Pros:** Estructura limpia y relacional; evita saturar la tabla principal; preserva metadatos de forma aislada (Fecha, Asunto, Dirección, Sentido [Entrante/Saliente]); permite ordenar, filtrar y realizar analíticas avanzadas de interacción.
    *   **Contras:** Requiere una tabla configurada adicionalmente en Baserow y un paso extra en el flujo de n8n para asociar los registros.

*   **Opción B (Registro Acumulativo en un Campo Único - `Descripción` o `Notas` en la Tabla `Leads`):**
    *   **Funcionamiento:** n8n consulta el campo `Descripción` o `Notas` del Lead, concatena el nuevo correo en texto plano y actualiza el mismo registro.
    *   **Pros:** Simplicidad en la estructura de datos; permite visualizar toda la información directamente en la tarjeta Kanban del Lead sin navegar a subtablas.
    *   **Contras:** Límite de caracteres en campos de texto; pérdida de estructura (dificulta auditorías y reportes por interacción); riesgo de condiciones de carrera (si llegan correos concurrentes se pueden sobrescribir datos); requiere múltiples peticiones HTTP en n8n (lectura, concatenación y escritura).

---

### Análisis de Decisión

#### 1. ¿Qué se recomienda?
Se recomienda una **solución híbrida optimizada**:
*   **Para Leads nuevos:** Usar la **Opción B** para guardar el primer correo del prospecto en el campo `Descripción` (9455) al momento de su creación automática. Esto asegura que el vendedor tenga el contexto del primer contacto de forma visible e inmediata en su Kanban.
*   **Para Leads existentes:** Usar la **Opción A** para registrar el historial de conversaciones subsecuentes. Cada nuevo correo se inserta en la tabla vinculada `Interacciones`, manteniendo limpia la vista principal y acumulando una bitácora detallada.

#### 2. ¿Qué será más eficiente?
La **Opción A (Tabla Secundaria Vinculada)** es significativamente más eficiente y robusta a nivel de sistema:
*   En la **Opción A**, n8n realiza un `POST` atómico directo para insertar la nueva fila en la tabla de interacciones. Es una sola llamada de API y no requiere conocer el estado anterior.
*   En la **Opción B**, n8n debe hacer un `GET` (leer descripción actual) -> Concatenar texto -> `PATCH` (guardar nuevo contenido). Esto duplica el tráfico de API de Baserow, aumenta el tiempo de ejecución del flujo y expone el sistema a sobreescrituras por condiciones de carrera cuando llegan correos concurrentes.

#### 3. ¿Qué opción está más cerca de generar valor?
*   **A corto plazo (Speed-to-Value):** La **Opción B** (o el texto consolidado inicial) genera valor inmediato porque reduce la fricción visual para el vendedor, quien puede ver la consulta del cliente en un solo golpe de vista en la plataforma.
*   **A mediano y largo plazo (Valor Estratégico B2B):** La **Opción A** es la que realmente genera valor de negocio escalable. Permite:
    1.  Medir métricas de rendimiento (ej: *tiempo promedio de respuesta del vendedor*).
    2.  Filtrar y automatizar alertas de leads inactivos (ej: *leads sin interacciones en los últimos 15 días*).
    3.  Integrar múltiples canales en una misma bitácora cronológica (llamadas, correos y alertas de WhatsApp en la misma tabla de interacciones).

---

## 🌐 5. Diagrama de Flujo y Redes

* **`mmapp_network` (Docker Bridge):** Conecta `n8n_app`, `baserow_app`, `npm_proxy` y `npm_database`.
* **`internal_network` (Docker Bridge):** Conecta `umami_app`, `umami_db` y `npm_proxy`. Esta separación evita que la base de datos de Umami sea visible desde otros contenedores del CRM o automatizaciones de negocio.

Para una representación gráfica interactiva de estas conexiones, ver el diagrama vectorial generado en [arquitectura_V7.svg](file:///c:/Desarrollo/mmapp/Arquitectura/arquitectura_V7.svg).

---

## 🗺️ 6. Mapeo de Código y Arquitectura del Visor 3D (legacy-aplicativo-armado)

Este apartado sirve como mapa de referencia compacta para la arquitectura, el flujo de datos, el manejo de estados globales y la responsabilidad de cada archivo clave dentro del proyecto [legacy-aplicativo-armado](file:///c:/Desarrollo/mmapp/legacy-aplicativo-armado/).

### A. Arquitectura General y Jerarquía

El aplicativo es una experiencia 3D interactiva construida en **React + Three.js** utilizando `@react-three/fiber` (R3F) y `@react-three/drei`. Los menús e interfaces se superponen sobre el lienzo 3D como capas HTML tradicionales (Overlay UI).

```mermaid
graph TD
    A[main.jsx / App.jsx] --> B[pages/AssemblyPage.jsx]
    B -- Carga data.json del producto --> C[AssemblyViewer.jsx]
    C --> D[Lienzo 3D: Canvas]
    C --> E[Capa de Interfaz: Overlay UI]
    
    D --> D1[3d-escene/Experience.jsx]
    D1 --> D2[3d-escene/Model.jsx - Modelo GLB paso a paso]
    D1 --> D3[3d-escene/Floor.jsx - Rejilla del Suelo]
    
    E --> E1[components/NavBarSuperior.jsx]
    E --> E2[components/NavBarInferior.jsx]
    E --> E3[components/Landscape.jsx - Alertas de giro]
    
    E2 --> E2a[PanelHerrajes.jsx - Panel lateral de piezas]
    E2 --> E2b[PanelAyudas.jsx - Tutorial interactivo]
    E2 --> E2c[PanelTips.jsx - Información técnica/Garantía]
    E2 --> E2d[AudioPlayer.jsx - Control de voz en off]
```

### B. El Cerebro Global: `useEnviroment.js`
*Ubicación:* [useEnviroment.js](file:///c:/Desarrollo/mmapp/legacy-aplicativo-armado/src/features/AssemblyInstructions/hooks/useEnviroment.js)

El proyecto utiliza **Zustand** como manejador de estado global. En lugar de pasar propiedades de padre a hijo, los componentes se suscriben a este store.

*   **`pasoActual`** (String): El paso de armado actual (ej. `"00"`, `"01"`, `"02"`). Controla qué modelo `.glb` cargar.
*   **`pasos`** (Array): Lista de todos los identificadores de paso cargados desde el `data.json`.
*   **`id`** (String): El ID del producto (ej. `"M01536"`). Define las rutas de assets.
*   **`phaseAudio`** (String): Estado de reproducción (`"start"`, `"playing"`, `"paused"`, `"reset"`).
*   **`PiezaHerraje`** (String): Nombre del elemento que el usuario está señalando o tocando en 3D. Se muestra en el banner inferior.
*   **`show`** (Boolean): Variable de transición rápida para desmontar y remontar el Canvas 3D al cambiar de paso, limpiando memoria.
*   **`Parpadeo`** (Boolean): Si es `true`, hace destellar la flecha de avanzar paso.
*   **Paneles Activos:** `panelTips`, `PanelAyudas`, `PanelCantidades` y `PanelShow` controlan qué ventana modal o panel lateral está abierto.

### C. Inventario de Archivos Clave

#### Cimientos y Enrutamiento
1.  **`index.html`**
    *   *Propósito:* Punto de entrada web. Aloja fuentes locales (`Play-Regular`) para evitar retrasos de carga.
2.  **`src/main.jsx` & `src/App.jsx`**
    *   *Propósito:* Configura el enrutador (`react-router-dom`). Redirige la raíz `/` automáticamente al ID de producto por defecto (`/M01536`).
3.  **`src/pages/AssemblyPage.jsx`**
    *   *Propósito:* Captura el ID de la URL y hace un `fetch` dinámico del archivo `/${id}/data.json` que reside en la carpeta pública. Si tiene éxito, renderiza el `AssemblyViewer`.

#### El Núcleo 3D (Carpeta `src/features/AssemblyInstructions/3d-escene/`)
4.  **`AssemblyViewer.jsx`**
    *   *Propósito:* El contenedor raíz de la vista 3D. Inicializa el store Zustand con los datos del JSON, define la configuración del renderizador web de Three (`gl`, `toneMapping`, `camera`) y distribuye el Overlay UI.
5.  **`Experience.jsx (AssemblySceneViewer)`**
    *   *Propósito:* Configura las luces de la escena, las sombras, el control de órbita (`OrbitControls`) y el entorno panorámico local (`hdri2/salon_01.webp`).
6.  **`Model.jsx`**
    *   *Propósito:* Carga dinámicamente el modelo GLB del paso correspondiente (`/${id}/models/P${pasoActual}.glb`). Contiene la lógica de animación, detección de clics en piezas, resaltado con Matcaps y emisión de la señal de parpadeo visual.

#### La Interfaz HTML (Carpeta `src/features/AssemblyInstructions/components/`)
7.  **`NavBarSuperior/NavBarSuperior.jsx` & `.css`**
    *   *Propósito:* Controles del borde superior: Botón de ayuda (`?`), información técnica (`i`) y el botón de Realidad Aumentada (`AR.html`). Contiene selectores de color del mueble (desactivados).
8.  **`NavBarInferior/NavBarInferior.jsx` & `.css`**
    *   *Propósito:* Controles del borde inferior: Flecha izquierda (`left`), Flecha derecha (`right`), Play/Pausa/Reset de audio, e indicador circular de porcentaje completado.
    *   *⚠️ Nota Crítica:* Este archivo contiene **grandes imágenes SVG embebidas en formato Base64**, lo que lo hace muy pesado de leer.
9.  **`AudioPlayer/AudioPlayer.jsx`**
    *   *Propósito:* Gestiona el elemento de audio HTML5 `<audio>` que reproduce las instrucciones habladas (`/${id}/sounds/...`). Coordina con Zustand la detención y reinicio de la narración en sincronía con el visualizador.
10. **`PanelTips/PanelTips.jsx`**
    *   *Propósito:* Panel de información técnica (herramientas necesarias, sistemas de ensamble, garantía). Libre de links externos.
11. **`NavBarInferior/PanelHerrajes/PanelHerrajes.jsx`**
    *   *Propósito:* Barra flotante que muestra qué herrajes se necesitan en el paso actual. Contiene el tutorial gráfico para localizarlos.
12. **`NavBarInferior/PanelAyudas/PanelAyudas.jsx`**
    *   *Propósito:* Despliega el tutorial inicial del aplicativo en 5 pasos interactivos de ayuda.

---

### D. Simplificación y Ahorro de Tokens de la IA

Al modificar este proyecto, es importante tener en cuenta:
1.  **SVGs Embebidos Gigantes en JSX (Densidad de Texto):** Archivos como `NavBarInferior.jsx` y `NavBarSuperior.jsx` tienen en su JSX iconos y flechas representados como strings SVG larguísimos o cadenas de Base64. Cada lectura procesa miles de caracteres inútiles. Se recomienda externalizar o ignorar estas zonas en ediciones no relacionadas.
2.  **Manipulación Imperativa del DOM:** La aplicación mezcla React con manipulación directa del DOM (`document.querySelector`, inyección con `.innerHTML`). Hay que editar con cautela para no romper este puente.
3.  **Ediciones Quirúrgicas:** Utilizar reemplazos de bloques específicos en lugar de reescribir archivos completos para mantener la estabilidad del código.
