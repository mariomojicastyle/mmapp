# 📜 Histórico del Proyecto: mariomojica.com

Este archivo es un registro vivo de la evolución tecnológica del ecosistema Mario Mojica Style. Complementa a `ESTADO_DEL_PROYECTO.md` conservando la memoria de decisiones, retos y soluciones técnicas.

---

## 🗓️ Marzo 2026

### 🔹 Semana 1-2: Cimientos y Automatización Inicial
* **Validación de Supabase:** Se verificó la estabilidad de la capa de datos gratuita y se automatizaron chequeos preventivos para mantener los servicios activos.
* **Primeros Pasos con n8n:** Configuración de los primeros webhooks para capturar contactos del portafolio.
* **Integración de Calendario:** Implementación de flujos de Google Calendar para agendar citas directamente desde el formulario de contacto.

### 🔹 Semana 3: El Salto al Autohospedaje (Self-Hosted)
* **Migración a VPS (Hetzner):** Decisión estratégica de dejar la nube compartida para mover **n8n** y **Baserow** a un VPS propio con Docker, ganando control total y eliminando limitaciones de filas.
* **Proxy Inverso (Nginx/Traefik):** Configuración de dominios y subdominios con SSL automático (Let's Encrypt).

---

## 🗓️ Abril 2026

### 🔹 Semana 1-2: Refactorización y Escalabilidad
* **Integración Cloud API (WhatsApp):** Sustitución de soluciones no oficiales por la API oficial de Meta para mayor estabilidad en notificaciones de leads.
* **LinkedIn Content Engine:** Diseño inicial de la automatización para procesar contenido de LinkedIn hacia Baserow.

### 🔹 Semana 3-4: Plataforma B2B e Identidad Visual
* **Estandarización Visual:**
  - Definición del estilo "Obsidian Teal" para toda la plataforma.
  - Implementación del logo corporativo corregido (`Logo_vertical_color_en.svg`) en Login, Sidebar y TopNav.
* **Navegación y UX:**
  - Rediseño completo de la `TopNav` (Barra Superior) incluyendo:
    - Identidad de usuario con icono.
    - Contador de créditos dinámico vinculado a Supabase.
    - Sistema de Feedback y Búsqueda global (Ctrl K).
    - Acceso rápido a Ayuda y Recarga de Créditos.
  - Ajuste de consistencia en el Módulo de Configuración (espaciado y paddings unificados).
* **Supabase & Notificaciones:**
  - Migración a un sistema de notificaciones basado en IDs de usuario (UUID) para mayor robustez.
  - Implementación de Realtime para alertas instantáneas de nuevas solicitudes.
  - Sincronización de perfiles con metadatos de autenticación y asignación de empresas (Jamar, Zanfairo, etc.).
* **Flujos de Trabajo:**
  - Estabilización del Kanban con lógica de arrastre refinada.
  - Sincronización en tiempo real de estados de tickets entre Admin y Cliente.
* **Evolución Arquitectónica:**

### 🔹 Semana 4: Refinamiento de Identidad y Simetría (UI/UX Pro)
* **Arquitectura de Layout Global:** Se reestructuró la jerarquía para que el `TopNav` sea un elemento raíz de ancho completo, con el `Sidebar` y el contenido residiendo debajo, evitando solapamientos.
* **Unificación de Branding:** Se eliminó el logosímbolo del sidebar para centralizar la identidad en el `TopNav`, alineándolo perfectamente con el eje vertical de los iconos de navegación.
* **Simetría Matemática:** Implementación de márgenes de 17px en ambos extremos del `TopNav` para equilibrar visualmente el logosímbolo (izq) y el avatar de usuario (der).
* **Navegación Contextual:** Activación de breadcrumbs dinámicos en la barra superior para mejorar la orientación del usuario.

---

*Este documento debe ser actualizado por Antigravity después de cada hito relevante. no se debe borrar informacion anterior,solo agregar nueva. *

---

### 🔹 Mayo 2026

### 🔹 Semana 1: Estabilización de Infraestructura Rhino
* **Resolución de PayAttentionException:**
  - Se identificó que el `RHINO_TOKEN` proporcionado en formato Base64/JSON causaba errores de validación.
  - Se extrajo el **JWT (Clean Token)** del wrapper JSON para inyectarlo directamente como variable de entorno.
  - Creación de script `run_compute.ps1` para automatizar el lanzamiento del servidor con el token corregido en Windows.
  - Actualización de `.env` para compatibilidad futura con Docker.

* **[2026-05-02] Implementación de Servidor Standalone:**
    - Se resolvió la ausencia del binario `rhino.compute.exe` en la instalación estándar de Rhino 8.
    - Se evitó la compilación manual de código (ruta de desarrollo) mediante el uso de binarios de producción oficiales.
    - Se superó el bloqueo de descarga de Chrome y se desplegó el servidor en una ubicación estable: `C:\RhinoCompute`.
    - **Estado:** Pendiente de validación final de la suma tras el primer arranque del servidor oficial.

---

* **[2026-05-09] Puesta en Marcha B2B Rhino Compute (Producción):**
    - **Gestión de Licencias y Ahorro:** Se configuró el servidor `Rhino Compute` para consumir la **licencia comercial local** de Rhino 8 del host, evadiendo el uso de "Core-Hour Billing tokens" en la nube. Esto estabiliza los costos operativos al forzar la validación local (eliminando la variable `RHINO_TOKEN`).
    - **Arquitectura de Interfaz con Grasshopper:** Se establecieron reglas estrictas para los archivos `.gh`: Las entradas deben usar componentes de Hops con prefijo `RH_IN:` y las salidas **deben** consolidarse en un grupo con el prefijo `RH_OUT:` para evitar bloqueos del motor (`500 PayAttentionException`).
    - **Desarrollo del Cliente de Automatización:** Se reemplazó la idea de un script Bash por un desarrollo robusto en **Python (`test_final.py`)**. Rhino exige una serialización JSON matemática estricta (ej. objetos `Point3d` serializados y codificados), algo que Bash no maneja bien. El script automatiza el ping, descubrimiento de puertos, envío estructurado y guardado del `3dm`.
    - **Resultado:** Integración completa comprobada. Un agente web ahora puede enviar parámetros HTTP y recibir un archivo 3D dinámico, listo para usarse en la plataforma `mmapp`.

* **[2026-05-15] Refinamiento UI y Arquitectura de Navegación:**
    - **Identidad Visual "Obsidian Teal":** Se implementó el efecto de borde iluminado (`ring-1 ring-inset`) en el Sidebar, alineando el diseño con el lenguaje visual de Supabase para mejorar la legibilidad del estado activo.
    - **Navegación de Aplicaciones:** Refactorización completa de `aplicaciones/page.tsx`. Se integró un sistema de sub-navegación por pestañas (TabMenu) para gestionar tres módulos core: **Aplicativo de armado**, **Definidor de empaque** y **Creador de contenido**.
    - **Vocabulario de Diseño:** Creación de `Arquitectura/Zonas.svg` para estandarizar la comunicación entre el usuario y el agente, definiendo áreas clave (TopNav, Sidebar, PageHeader, TabMenu, SubContent).

* **[2026-05-15] Localización y Despliegue Offline del Aplicativo de Armado:**
    - **Independencia Total del Servidor Externo:** Se completó la migración del aplicativo 3D de legado desde `3dymedios.com` a un entorno local autónomo dentro de `legacy-aplicativo-armado-original`.
    - **Migración de Activos Críticos:** Se descargaron y localizaron recursos de red que bloqueaban la ejecución offline: modelos GLB, texturas HDRI en formato webp, Matcaps para resaltado de piezas, iconos SVG de tips técnicos, fuentes tipográficas (Play-Regular) y audios de guía.
    - **Resolución de Errores de Compilación:** Se corrigieron fallos de Webpack (`Module not found`) moviendo declaraciones de fuentes `@font-face` al `index.html` estático, permitiendo una resolución de rutas limpia por parte del navegador.
    - **Optimización de Renderizado:** Se ajustaron los parámetros del `Canvas` de Three.js (`NoToneMapping`, `LinearEncoding`) para garantizar paridad visual con la versión original de producción.
    - **Resultado:** Aplicativo 100% funcional sin conexión a internet, con tiempos de carga instantáneos y cero errores de CORS.

* **[2026-05-18] AppArmado_v4 — Restauración del Sistema de Ayuda e Información:**
    - **Restauración del Tutorial Interactivo (Botón `?`):** Se recuperó la funcionalidad completa del sistema de ayuda con audio sincronizado. El audio `01_Ayuda.mp3` fue descargado y localizado en `public/assets/sounds/`. Se refactorizó `AudioPlayer.jsx` migrando de `ontimeupdate` (asignación de propiedad) a `addEventListener("timeupdate", ...)` para evitar conflictos entre el listener del audio global y el del tutorial.
    - **Localización de Tooltips SVG:** Se descargaron las 5 imágenes SVG del tutorial (`01_Indicaciones`, `03_Navegacion`, etc.) y se almacenaron en `public/assets/ayudas/`, actualizando `PanelAyudas.jsx` para usar rutas locales.
    - **Restauración del Panel de Información (Botón `i`):** Se diagnosticó que `PanelTips` retornaba `null` porque `AssemblyViewer.jsx` no propagaba el prop `data={productData}` a `NavBarSuperior` ni a `NavBarInferior`. Se corrigió la cadena de props, restaurando el panel con íconos de herramientas, ensambles y garantía.
    - **Localización de Tips SVG y PDF:** Se descargaron 8 SVGs de tips técnicos (Martillo, Destornillador, Allen, Sistema de Anclaje, Minifix, Tuerca Plástica, Bisagras, Oculta Tornillos) y el PDF de Garantía, almacenándolos en `public/assets/tips/`. Se eliminaron todas las referencias a `3dymedios.com` del componente.
    - **Gestión de Estado:** Se añadió `ResetAyudas` al store Zustand (`useEnviroment.js`) para resetear los tooltips secuenciales cada vez que se abre el panel de ayuda.
    - **Resultado:** Ambos paneles (Ayuda e Información) funcionan al 100% en modo offline, con audio sincronizado, tooltips secuenciales y assets locales.
* **[2026-05-19] AppArmado_v5 — Refinamiento Coordenadas 3D, Desconexión Total de Red y Optimización de Herrajes:**
    - **Alineación del Espacio 3D y Cámara:** Se eliminó la discrepancia de 1 metro de altura en las coordenadas de Three.js desplazando el contenedor del grupo del modelo de `[0, 1, 0]` a `[0, 0, 0]` en `Model.jsx`. Se sincronizaron las posiciones de `OrbitControls` y el `Floor`, que ahora desciende exactamente `17mm` para evitar colisiones visuales de las piezas de madera con la rejilla de suelo en los primeros pasos del armado.
    - **Desconexión Total y Estandarización Offline (Cero CORS / Network):**
        - Se localizaron múltiples recursos gráficos faltantes, descargándolos en `/assets/` y actualizando sus rutas en el código de forma estricta.
        - Iconos de herrajes: `Caja_0007374.jpg`, `Deslizador_007391.jpg`, `Perno_0007374.jpg`, `Tarugo_20030001.jpg`, `Tornillo_0000152.jpg`, `Tornillo_000152.jpg`, `Tuerca_0004674.jpg` y la corredera de cajón `Corredera_350_20080001.jpg`.
        - Logos y Ayudas: `Logo_Maderkit_blanco.svg` (Panel de Encuesta y Formulario), `07_Localizar_Herrajes.svg` y `hand_tool.svg` (Panel de Herrajes).
        - Tips técnicos: `Cantidades_Totales_de_Herrajes.svg` (Panel de Cantidades).
        - Se eliminaron todos los fallbacks redundantes hacia `https://3dymedios.com` en `PanelHerrajes.jsx`, `PanelCantidades.jsx` y `FormularioEncuesta.jsx`, garantizando un funcionamiento 100% autónomo.
    - **Solución a Errores de Interfaz y Renderizado:**
        - **Previene Duplicados en DOM:** Se implementó una rutina de limpieza del contenedor DOM de la lista de herrajes al cambiar de paso o producto en `PanelHerrajes.jsx`, evitando la duplicación visual de los componentes de herraje en la interfaz de usuario.
        - **Corrección de Tamaño de Tooltips:** Se aplicaron overrides CSS con `!important` para evitar que las reglas predeterminadas de Tailwind CSS Preflight encogieran y desconfiguraran las dimensiones de las imágenes en el tooltip de "Herrajes Necesarios".
        - **Interacción y Blinking:** Se restableció la animación parpadeante (`blinking`) y la interactividad por clic de las piezas 3D y herrajes, sincronizándola con el estado global de reproducción del audio.
    - **Resultado:** Aplicativo de armado migrado completamente a la versión v5, independiente de servidores de red, estable ante cambios de producto, sin warnings de Three.js y con una alineación visual perfecta de cámara, modelos y terreno.

---

*Última consolidación: 19 de Mayo, 2026 (16:05 PM)*

