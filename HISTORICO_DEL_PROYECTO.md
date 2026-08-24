# 📜 Histórico del Proyecto: mariomojica.com

> [!IMPORTANT]
> ### 🛡️ REGLA DE ORO DE ESTE ARCHIVO (INQUEBRANTABLE):
> 1. **Orden Cronológico Progresivo / Ascendente**: Todas las entradas se registran estrictamente en orden cronológico hacia abajo. **Lo más antiguo al inicio y lo más reciente SIEMPRE abajo al final del archivo.**
> 2. **Prohibido Borrar**: Queda terminantemente prohibido borrar información de este archivo. Si se requiere una corrección o ajuste a un hito anterior, se debe agregar una anotación explícita indicando la corrección y su motivo sin eliminar el registro previo.

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

---

## 🗓️ Junio 2026

### 🔹 Semana 3: Internacionalización y Estabilidad B2B
* **Soporte Multilingüe Completo (Español, Inglés, Portugués):**
  - **Motor de Idiomas:** Se escaló el `LanguageContext` en la Landing Page B2B para aceptar una matriz trilingüe. La firma de la función `t(es, en, pt)` ahora soporta portugués de manera nativa sin impactar la lógica anterior.
  - **Traducción Integral:** Se adaptaron y tradujeron 12 componentes críticos (`HeroManual`, `HowItWorksSteps`, `ClientPortal`, `FAQ`, `ContactCTA`, entre otros) asegurando un alcance efectivo en el mercado latinoamericano (Brasil).
  - **Zero Console Errors:** Se llevó a cabo un proceso de depuración profundo para limpiar advertencias en la consola del navegador, asegurando que la carga y ejecución de los iframes con experiencias 3D en la Landing Page estén optimizadas.
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

* **[2026-05-20] AppArmado_v7 — Consolidación de Monorepo y Corrección de Hover Reactivo:**
    - **Consolidación en Monorepo `mmapp`**: Se desvinculó de manera definitiva el aplicativo de armado de su repositorio legado externo (`mm-app.git`), convirtiendo el subdirectorio `legacy-aplicativo-armado` en una carpeta nativa rastreada por el monorepo principal. Los metadatos de Git originales fueron respaldados de forma segura en `Temporales/git-backup-legacy/` y el directorio fue ignorado en el `.gitignore` del proyecto padre.
    - **Sincronización en GitHub y Entornos de Despliegue**: Se sincronizaron, fusionaron y subieron los archivos directos del aplicativo a las ramas principales `App_Armado_V7`, `develop` y `main` en `mmapp.git`, asegurando que todo el historial de la aplicación de armado quede respaldado bajo el control de versiones principal.
    - **Solución al Hover de Piezas (Falta de Nombres)**: Se detectó y resolvió un fallo reactivo en el DOM virtual de React en `NavBarInferior.jsx`, donde los nombres de las piezas 3D no se renderizaban en el banner blanco `#TextOption` al pasar el cursor sobre ellas. Se enlazó de forma directa la propiedad de estado de Zustand `PiezaHerraje` a la etiqueta `<h1>`, logrando una visualización dinámica y fluida de los nombres de los componentes en tiempo real.

---

* **[2026-05-21] AppArmado_v8 — Rediseño Obsidian Teal Glassmorphic, Cortina de Ayuda y Secuenciación de Tiempos:**
    - **Rediseño Estético Obsidian Teal Glassmorphic Premium**: Se transformaron visualmente las nubes del tutorial y los paneles de herrajes/cantidades para unificar el lenguaje visual en base a vidrio esmerilado oscuro translúcido (`rgba(20, 22, 28, 0.15)` con `backdrop-filter: blur(16px)`), bordes cian y tarjetas de herraje blancas que garantizan el máximo contraste de las fotos de los componentes.
    - **Cortina Deslizante de Ayudas**: Implementación de una cortina deslizante reactiva en el visor principal (`.cortina-ayudas`) que entra de derecha a izquierda al abrir el tutorial, bloqueando clics accidentales en el 3D y desenfocando el fondo de forma elegante sin afectar la nitidez ni interactividad de los menús e indicaciones.
    - **Alineación Simétrica de Botones en PC**: Se corrigió el posicionamiento lateral del botón de Realidad Aumentada (`.AR`) y el botón "X" de cerrar (`.cerrar`) en PC. Ambos están ahora perfectamente alineados verticalmente en la misma columna derecha por defecto (`right: 15px`). Al abrirse cualquiera de los paneles laterales en PC, el botón "X" se desplaza coordinadamente a `left: calc(50% + 340px)`.
    - **Unificación de Nubes de Ayuda**:
        - Centrado absoluto de títulos (ej. `"NAVEGACIÓN DE ARMADO"`) y descripciones corporales.
        - Unificación de flechas indicadoras a color azul celeste brillante (`var(--primary, #00f2fe)`) con halo luminoso neón.
        - Centrado y alineamiento de la burbuja explicativa de Realidad Aumentada (`ayuda6`) en PC y móvil, de modo que apunte de manera perfecta y milimétrica al cuadrante izquierdo del botón de AR.
    - **Secuenciación y Sincronía Temporal**: Sincronización y secuenciación reactiva de las tres flechas de `ayuda3` (Atrás, Paso, Siguiente) mediante el reproductor de audio general del tutorial, reduciendo los renders innecesarios en Zustand.
    - **Guía de Modificación de Tiempos y Sincronía**: Se documentó exhaustivamente en este archivo el mapa exacto de archivos, clases de CSS y condicionales que controlan la duración y aparición de las nubes del tutorial y el titileo secuencial de las flechas azules, facilitando futuras modificaciones.

---

## 🛠️ Guía de Modificación de Tiempos y Sincronía (Tutorial de Ayudas)

Para facilitar futuras mantenciones y permitir modificaciones rápidas y autónomas sobre los tiempos de reproducción del tutorial interactivo y el comportamiento de las flechas azules, se detallan a continuación los archivos y bloques de código clave:

### A. Sincronización de Aparición de las Nubes (Bocadillos de Ayuda)

La aparición de cada nube del tutorial está sincronizada reactivamente con los segundos del audio de ayudas general (`01_Ayuda.mp3`). Todo el flujo se controla en:
📄 **[AudioPlayer.jsx](file:///c:/Desarrollo/mmapp/legacy-aplicativo-armado/src/features/AssemblyInstructions/components/AudioPlayer/AudioPlayer.jsx)** (dentro del listener de actualización de tiempo `handleTimeUpdateAyudas`).

La variable `ct` (`currentTime`) evalúa el segundo exacto de la pista para activar o desactivar cada sección del tutorial mediante Zustand:

| Burbuja de Ayuda / Funcionalidad | Rango de Tiempo (Segundos) | Acción Ejecutada |
| :--- | :---: | :--- |
| **Ayuda 1**: Guía y Herramientas (Menú Superior) | `ct >= 2 && ct < 10` | `state.ActivarAyuda1()` |
| **Ayuda 3**: Navegación de Armado (Barra Inferior) | `ct >= 10 && ct < 24` | `state.ActivarAyuda3()` |
| **Ayuda 4**: Buscador de Piezas / Herrajes (Lupa) | `ct >= 24 && ct < 33` | `state.ActivarAyuda4()` |
| **Ayuda 5**: Reproducción de Audio (Play / Pausa) | `ct >= 33 && ct < 35` | `state.ActivarAyuda5()` |
| **Ayuda 6**: Proyectar en AR (Realidad Aumentada) | `ct >= 38` | `state.ActivarAyuda6()` |

*💡 **¿Cómo modificar los tiempos de aparición?** Abre `AudioPlayer.jsx` y localiza el método `handleTimeUpdateAyudas`. Edita los números de los condicionales `if / else if` para redefinir el intervalo exacto (en segundos) en el que debe mostrarse y ocultarse cada nube de diálogo.*

---

### B. Secuenciación y Sincronía de las Flechas de Ayuda 3 (Navegación)

El encendido secuencial de las tres flechas inferiores de la burbuja de Navegación de Armado (`ayuda3`) está anidado dentro del mismo bloque de `ct >= 10 && ct < 24` en:
📄 **[AudioPlayer.jsx](file:///c:/Desarrollo/mmapp/legacy-aplicativo-armado/src/features/AssemblyInstructions/components/AudioPlayer/AudioPlayer.jsx)**.

Puedes cambiar de forma intuitiva los rangos en que se enciende cada flecha editando las sub-condiciones:

* **Flecha Central (Paso actual / Aro de Progreso)**:
  ```javascript
  if (ct >= 10 && ct < 15) { // <--- Cambia el 10 y 15 para modificar la duración en segundos
    state.SetAyuda3ArrowCenter(true);
    state.SetAyuda3ArrowRight(false);
    state.SetAyuda3ArrowLeft(false);
  }
  ```
* **Flecha Derecha (Botón Siguiente)**:
  ```javascript
  else if (ct >= 15 && ct < 20) { // <--- Cambia el 15 y 20 para modificar la duración en segundos
    state.SetAyuda3ArrowCenter(false);
    state.SetAyuda3ArrowRight(true);
    state.SetAyuda3ArrowLeft(false);
  }
  ```
* **Flecha Izquierda (Botón Atrás)**:
  ```javascript
  else if (ct >= 20 && ct < 24) { // <--- Cambia el 20 y 24 para modificar la duración en segundos
    state.SetAyuda3ArrowCenter(false);
    state.SetAyuda3ArrowRight(false);
    state.SetAyuda3ArrowLeft(true);
  }
  ```

---

### C. Ajuste del Estilo, Color y Transición de las Flechas Azules

Los estilos, colores y tiempos de transición de las flechas azules se configuran centralizadamente en la hoja de estilos:
📄 **[PanelAyudas.css](file:///c:/Desarrollo/mmapp/legacy-aplicativo-armado/src/features/AssemblyInstructions/components/NavBarInferior/PanelAyudas/PanelAyudas.css)**.

* **Color y Resplandor de Flechas Estándar (Ayuda 1, 4, 5, 6)**:
  Se edita bajo la clase `.ayuda-bubble-arrow`. Utiliza el color primario de la aplicación `var(--primary, #00f2fe)` y un sombreado brillante:
  ```css
  background: var(--primary, #00f2fe);
  box-shadow: 0 0 10px rgba(0, 242, 254, 0.8);
  ```
* **Flechas de Ayuda 3 (Navegación)**:
  Tienen una fase inactiva (vidrio semi-traslúcido) y activa (azul celeste brillante). Se configuran en:
  * `.ayuda3-arrow`: Define el estilo inactivo y el tiempo de transición física (`transition: background 0.3s cubic-bezier(...), box-shadow 0.3s ...;`). Puedes cambiar el valor `0.3s` si quieres que el cambio de color sea más veloz o más lento y suave.
  * `.ayuda3-arrow.is-active`: Define el estado encendido en azul celeste brillante (`var(--primary, #00f2fe) !important`) y brillo de neón (`box-shadow: 0 0 12px rgba(0, 242, 254, 0.9) !important`).

---

* **[2026-05-21] AppArmado_v8.1 — Posicionamiento Dinámico del Botón AR y Sincronía de Alineación:**
    - **Alineación Dinámica Reactiva en PC**: Se corrigió el comportamiento del botón de Realidad Aumentada (`.AR`) en pantallas grandes. Anteriormente, el botón permanecía de forma estática en `left: calc(50% + 340px)`, provocando que en la visualización por defecto (sin paneles laterales abiertos) flotara incorrectamente hacia la izquierda, rompiendo la simetría visual de la esquina derecha.
    - **Refactorización con Zustand**: Se importaron los estados globales `PanelShow` y `PanelCantidades` en `RealidadAumentada.jsx`, combinándolos con `PanelAyudas` para crear un flag unificado de estado de paneles: `isPanelOpen`.
    - **Clase Dinámica `panel-herrajes-open`**:
        - Si ningún panel está abierto, el botón AR se posiciona de forma predeterminada en `right: 15px; bottom: 120px;`, perfectamente alineado en la columna derecha de interacción rápida con el viewport.
        - Si se activa algún panel lateral o la cortina del tutorial, la clase `.panel-herrajes-open` se inyecta de forma dinámica, desplazando el botón AR de forma suave (`transition: all 0.3s ease`) hacia `left: calc(50% + 340px)`, garantizando una alineación vertical perfecta y simétrica con el botón de cerrar "X".
    - **Resultado**: La experiencia en PC ahora goza de una simetría adaptativa impecable; el botón AR está al extremo derecho por defecto y solo se desplaza hacia la izquierda para unirse a la vertical del botón "X" cuando este entra en pantalla por la apertura de un panel.

* **[2026-05-21] AppArmado_v8.2 — Rediseño Estético Glassmorphic y Fichas de Tips de Alto Contraste (PanelTips):**
    - **Fondo Glassmorphic de Cortina (`.panel2`)**: Fondo esmerilado translúcido Obsidian Teal (`rgba(20, 22, 28, 0.15)` con `backdrop-filter: blur(16px)` y transición de Bezier premium cubic).
    - **Tarjetas de Tips de Alto Contraste (`.option2`)**: Rediseño completo a base blanca `#ffffff` y tipografía gris oscuro `#111319` con bordes cian sutiles, permitiendo una visibilidad e iluminación del 100% de los bocetos de línea negra de las herramientas (martillo, tuerca, destornillador, minifix) que antes se perdían sobre fondos oscuros.
    - **Aislamiento de Logotipo (`#logo`)**: Estilo transparente e inmune a las tarjetas blancas y efectos hover.
    - **Botón de Garantía Premium (`.option2 a`)**: Adaptado con alta fidelidad para el contraste sobre tarjetas blancas.
    - **Resultado**: Coherencia absoluta en la estética visual de todos los paneles interactivos del manual 3D y solución definitiva al problema de contraste.

* **[2026-05-21] AppArmado_v8.3 — Alineación de "X", Cápsula Premium de Garantía y Cierre por Tecla ESC:**
    - **Alineación Dinámica Sincronizada del Panel de Tips**: Se integró el estado de Zustand `panelTips` en la variable condicional `isPanelOpen` de `RealidadAumentada.jsx` y `BotonCerrar.jsx`. Ahora, al abrir la cortina de tips de armado, tanto la "X" de cerrar como el botón de Realidad Aumentada se desplazan de forma reactiva y con transiciones CSS fluidas a la vertical de control `left: calc(50% + 340px)`.
    - **Cierre Global Instantáneo mediante Tecla ESC**: Se implementó un event listener global para el teclado físico en `BotonCerrar.jsx`. Al pulsar la tecla **ESC** (Escape), se invoca centralizadamente la acción `cerrarPaneles()`, cerrando instantáneamente cualquier cortina abierta (herrajes, cantidades, tutorial de ayudas o tips de armado) y devolviendo la interfaz a su estado limpio.
    - **Cápsula Premium para "Garantía del Producto"**: Se reemplazó la antigua tarjeta blanca rígida `.option2 10` por una cápsula flotante Obsidian Teal (`.garantia-btn`) independiente. Cuenta con fondo de vidrio esmerilado oscuro, borde cian, icono de verificación (`verified_user`) y efectos hover interactivos de alta gama idénticos a los del botón de "Cantidades Totales de Herrajes", conservando la clase de control `.option2` para preservar la lógica condicional de visualización por producto.
    - **Pausa Automática de la Locución al Abrir Cortinas**: Se inyectó lógica reactiva en `AudioPlayer.jsx` para pausar inmediatamente cualquier audio explicativo o de fondo (`PausedAudio()`) en el momento en que se activa alguna cortina lateral o panel (`PanelShow`, `PanelCantidades` o `panelTips`), evitando el solapamiento acústico.
    - **Fichas Estáticas e Informativas de Tips**: Se inyectó el manejador `onClick={(e) => e.stopPropagation()}` a cada una de las tarjetas informativas `.option2` de `PanelTips.jsx`. Esto anula el cierre accidental del panel al hacer clic en las fichas del tutorial, convirtiéndolas en elementos estáticos e informativos (con efectos de hover físicos intactos) y permitiendo cerrar la cortina únicamente mediante el botón "X", el teclado (ESC) o haciendo clic fuera de las tarjetas.

* **[2026-05-21] AppArmado_v8.4 — Exclusión Mutua de Cortinas y Reordenamiento del Tooltip Superior (ayuda1):**
    - **Exclusión Mutua de Cortinas en Zustand**: Refactorizadas centralizadamente las funciones de apertura en `useEnviroment.js` (`PanelTipsTrue`, `PositivePanel`, `PanelCantidadesTrue` y `PanelAyudasTrue`). Ahora, al abrir cualquier cortina, se limpian preventivamente de forma explícita los flags de todas las demás cortinas activas (ej: al abrir los tips se desactiva de inmediato el tutorial y viceversa), eliminando de raíz el bug de traslapes de páneles laterales reportado por el usuario.
    - **Reordenamiento y Renombrado del Tooltip Superior (`ayuda1`)**: Se modificaron las etiquetas HTML `<li>` dentro de la burbuja `.ayuda1` en `NavBarSuperior.jsx` para reflejar la secuencia exacta e instructiva solicitada:
      1. *Marca del producto* (en reemplazo de "Marca y soporte").
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
    - **Alineación del Espacio 3D y Cámara:** Se eliminó la discrepancia de 1 metro de altura en las coordenadas de Three.js desplazando el contenedor del grupo del modelo de `[0, 1, 0]` a `[0, 0, 0]` in `Model.jsx`. Se sincronizaron las posiciones de `OrbitControls` y el `Floor`, que ahora desciende exactamente `17mm` para evitar colisiones visuales de las piezas de madera con la rejilla de suelo en los primeros pasos del armado.
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

* **[2026-07-18] Optimización Móvil y Corrección de Botón AR:**
    - **Carga Ultra-Rápida en Celulares:** Modificado `PanelInicial.jsx` para discriminar navegadores móviles (`isMobile = true`) y omitir la descarga del iframe pesado de Spline 3D (~15-20MB), cargando instantáneamente el backdrop ligero Obsidian Teal con logo y progreso.
    - **Visibilidad Permanente de Realidad Aumentada:** Eliminada la condición `isFullscreen` en `RealidadAumentada.jsx` que ocultaba el botón `ar-btn-pc` en móviles sin maximizar. El botón AR ahora permanece visible y totalmente interactivo en todo momento.
    - **Resolución de Autoplay y Fullscreen Móvil:** Reemplazada la página Next.js con iframe por una redirección Netlify 302 directa a `/embed/armado/M00001` para resolver assets por proxy. Creado puente de audio directo (`__directAudioPlay`) en el click handler táctil para conservar el gesto de usuario.
    - **Prevención de Auto-Pausado por Orientación:** Añadida bandera de inicio de 1.5s (`window.__startingApp`) para evitar que el chequeo de orientación portrait pause automáticamente el audio y la animación al arrancar.

---

* **[2026-07-11] Politorno_Multimarca_Full — Valla Publicitaria Digital B2B:**
    - **Reemplazo del Precargador y Co-branding UI:** Se rediseñó la experiencia inicial del visor 3D para potenciar las ventas corporativas. Se implementó un panel frontal flotante interactivo (`PanelInicial.jsx`) que lee el logotipo corporativo configurado en Supabase (CMS).
    - **Loop CSS Infinito:** Se implementó una animación inteligente (`brandLoop`) de 10 segundos que otorga protagonismo temporal rotativo entre la marca del cliente B2B ("Productos [Politorno]") y el autor ("Potenciados por [Mario Mojica]"), logrando una alianza de co-branding muy sofisticada y amigable.
    - **Internacionalización Dinámica:** Se expandió el objeto de traducciones interno del visor de ensamblaje para cambiar "Productos" / "Potenciados por" a tres idiomas (ES, EN, PT) en tiempo real basado en la URL `?lang=`.
    - **Posicionamiento Responsivo sobre 3D:** El panel blanco de marca se ajustó posicionalmente (`top: 36%`, `left: 50%`) con compensación `translate` para coincidir con perfecta tolerancia matemática sobre el panel de vidrio pre-renderizado dentro de la propia escena de Spline, independientemente de la relación de aspecto del navegador.

---

* **[2026-05-20] AppArmado_v7 — Consolidación de Monorepo y Corrección de Hover Reactivo:**
    - **Consolidación en Monorepo `mmapp`**: Se desvinculó de manera definitiva el aplicativo de armado de su repositorio legado externo (`mm-app.git`), convirtiendo el subdirectorio `legacy-aplicativo-armado` en una carpeta nativa rastreada por el monorepo principal. Los metadatos de Git originales fueron respaldados de forma segura en `Temporales/git-backup-legacy/` y el directorio fue ignorado en el `.gitignore` del proyecto padre.
    - **Sincronización en GitHub y Entornos de Despliegue**: Se sincronizaron, fusionaron y subieron los archivos directos del aplicativo a las ramas principales `App_Armado_V7`, `develop` y `main` en `mmapp.git`, asegurando que todo el historial de la aplicación de armado quede respaldado bajo el control de versiones principal.
    - **Solución al Hover de Piezas (Falta de Nombres)**: Se detectó y resolvió un fallo reactivo en el DOM virtual de React en `NavBarInferior.jsx`, donde los nombres de las piezas 3D no se renderizaban en el banner blanco `#TextOption` al pasar el cursor sobre ellas. Se enlazó de forma directa la propiedad de estado de Zustand `PiezaHerraje` a la etiqueta `<h1>`, logrando una visualización dinámica y fluida de los nombres de los componentes en tiempo real.

---

* **[2026-05-21] AppArmado_v8 — Rediseño Obsidian Teal Glassmorphic, Cortina de Ayuda y Secuenciación de Tiempos:**
    - **Rediseño Estético Obsidian Teal Glassmorphic Premium**: Se transformaron visualmente las nubes del tutorial y los paneles de herrajes/cantidades para unificar el lenguaje visual en base a vidrio esmerilado oscuro translúcido (`rgba(20, 22, 28, 0.15)` con `backdrop-filter: blur(16px)`), bordes cian y tarjetas de herraje blancas que garantizan el máximo contraste de las fotos de los componentes.
    - **Cortina Deslizante de Ayudas**: Implementación de una cortina deslizante reactiva en el visor principal (`.cortina-ayudas`) que entra de derecha a izquierda al abrir el tutorial, bloqueando clics accidentales en el 3D y desenfocando el fondo de forma elegante sin afectar la nitidez ni interactividad de los menús e indicaciones.
    - **Alineación Simétrica de Botones en PC**: Se corrigió el posicionamiento lateral del botón de Realidad Aumentada (`.AR`) y el botón "X" de cerrar (`.cerrar`) en PC. Ambos están ahora perfectamente alineados verticalmente en la misma columna derecha por defecto (`right: 15px`). Al abrirse cualquiera de los paneles laterales en PC, el botón "X" se desplaza coordinadamente a `left: calc(50% + 340px)`.
    - **Unificación de Nubes de Ayuda**:
        - Centrado absoluto de títulos (ej. `"NAVEGACIÓN DE ARMADO"`) y descripciones corporales.
        - Unificación de flechas indicadoras a color azul celeste brillante (`var(--primary, #00f2fe)`) con halo luminoso neón.
        - Centrado y alineamiento de la burbuja explicativa de Realidad Aumentada (`ayuda6`) en PC y móvil, de modo que apunte de manera perfecta y milimétrica al cuadrante izquierdo del botón de AR.
    - **Secuenciación y Sincronía Temporal**: Sincronización y secuenciación reactiva de las tres flechas de `ayuda3` (Atrás, Paso, Siguiente) mediante el reproductor de audio general del tutorial, reduciendo los renders innecesarios en Zustand.
    - **Guía de Modificación de Tiempos y Sincronía**: Se documentó exhaustivamente en este archivo el mapa exacto de archivos, clases de CSS y condicionales que controlan la duración y aparición de las nubes del tutorial y el titileo secuencial de las flechas azules, facilitando futuras modificaciones.

---

## 🛠️ Guía de Modificación de Tiempos y Sincronía (Tutorial de Ayudas)

Para facilitar futuras mantenciones y permitir modificaciones rápidas y autónomas sobre los tiempos de reproducción del tutorial interactivo y el comportamiento de las flechas azules, se detallan a continuación los archivos y bloques de código clave:

### A. Sincronización de Aparición de las Nubes (Bocadillos de Ayuda)

La aparición de cada nube del tutorial está sincronizada reactivamente con los segundos del audio de ayudas general (`01_Ayuda.mp3`). Todo el flujo se controla en:
📄 **[AudioPlayer.jsx](file:///c:/Desarrollo/mmapp/legacy-aplicativo-armado/src/features/AssemblyInstructions/components/AudioPlayer/AudioPlayer.jsx)** (dentro del listener de actualización de tiempo `handleTimeUpdateAyudas`).

La variable `ct` (`currentTime`) evalúa el segundo exacto de la pista para activar o desactivar cada sección del tutorial mediante Zustand:

| Burbuja de Ayuda / Funcionalidad | Rango de Tiempo (Segundos) | Acción Ejecutada |
| :--- | :---: | :--- |
| **Ayuda 1**: Guía y Herramientas (Menú Superior) | `ct >= 2 && ct < 10` | `state.ActivarAyuda1()` |
| **Ayuda 3**: Navegación de Armado (Barra Inferior) | `ct >= 10 && ct < 24` | `state.ActivarAyuda3()` |
| **Ayuda 4**: Buscador de Piezas / Herrajes (Lupa) | `ct >= 24 && ct < 33` | `state.ActivarAyuda4()` |
| **Ayuda 5**: Reproducción de Audio (Play / Pausa) | `ct >= 33 && ct < 35` | `state.ActivarAyuda5()` |
| **Ayuda 6**: Proyectar en AR (Realidad Aumentada) | `ct >= 38` | `state.ActivarAyuda6()` |

*💡 **¿Cómo modificar los tiempos de aparición?** Abre `AudioPlayer.jsx` y localiza el método `handleTimeUpdateAyudas`. Edita los números de los condicionales `if / else if` para redefinir el intervalo exacto (en segundos) en el que debe mostrarse y ocultarse cada nube de diálogo.*

---

### B. Secuenciación y Sincronía de las Flechas de Ayuda 3 (Navegación)

El encendido secuencial de las tres flechas inferiores de la burbuja de Navegación de Armado (`ayuda3`) está anidado dentro del mismo bloque de `ct >= 10 && ct < 24` en:
📄 **[AudioPlayer.jsx](file:///c:/Desarrollo/mmapp/legacy-aplicativo-armado/src/features/AssemblyInstructions/components/AudioPlayer/AudioPlayer.jsx)**.

Puedes cambiar de forma intuitiva los rangos en que se enciende cada flecha editando las sub-condiciones:

* **Flecha Central (Paso actual / Aro de Progreso)**:
  ```javascript
  if (ct >= 10 && ct < 15) { // <--- Cambia el 10 y 15 para modificar la duración en segundos
    state.SetAyuda3ArrowCenter(true);
    state.SetAyuda3ArrowRight(false);
    state.SetAyuda3ArrowLeft(false);
  }
  ```
* **Flecha Derecha (Botón Siguiente)**:
  ```javascript
  else if (ct >= 15 && ct < 20) { // <--- Cambia el 15 y 20 para modificar la duración en segundos
    state.SetAyuda3ArrowCenter(false);
    state.SetAyuda3ArrowRight(true);
    state.SetAyuda3ArrowLeft(false);
  }
  ```
* **Flecha Izquierda (Botón Atrás)**:
  ```javascript
  else if (ct >= 20 && ct < 24) { // <--- Cambia el 20 y 24 para modificar la duración en segundos
    state.SetAyuda3ArrowCenter(false);
    state.SetAyuda3ArrowRight(false);
    state.SetAyuda3ArrowLeft(true);
  }
  ```

---

### C. Ajuste del Estilo, Color y Transición de las Flechas Azules

Los estilos, colores y tiempos de transición de las flechas azules se configuran centralizadamente en la hoja de estilos:
📄 **[PanelAyudas.css](file:///c:/Desarrollo/mmapp/legacy-aplicativo-armado/src/features/AssemblyInstructions/components/NavBarInferior/PanelAyudas/PanelAyudas.css)**.

* **Color y Resplandor de Flechas Estándar (Ayuda 1, 4, 5, 6)**:
  Se edita bajo la clase `.ayuda-bubble-arrow`. Utiliza el color primario de la aplicación `var(--primary, #00f2fe)` y un sombreado brillante:
  ```css
  background: var(--primary, #00f2fe);
  box-shadow: 0 0 10px rgba(0, 242, 254, 0.8);
  ```
* **Flechas de Ayuda 3 (Navegación)**:
  Tienen una fase inactiva (vidrio semi-traslúcido) y activa (azul celeste brillante). Se configuran en:
  * `.ayuda3-arrow`: Define el estilo inactivo y el tiempo de transición física (`transition: background 0.3s cubic-bezier(...), box-shadow 0.3s ...;`). Puedes cambiar el valor `0.3s` si quieres que el cambio de color sea más veloz o más lento y suave.
  * `.ayuda3-arrow.is-active`: Define el estado encendido en azul celeste brillante (`var(--primary, #00f2fe) !important`) y brillo de neón (`box-shadow: 0 0 12px rgba(0, 242, 254, 0.9) !important`).

---

* **[2026-05-21] AppArmado_v8.1 — Posicionamiento Dinámico del Botón AR y Sincronía de Alineación:**
    - **Alineación Dinámica Reactiva en PC**: Se corrigió el comportamiento del botón de Realidad Aumentada (`.AR`) en pantallas grandes. Anteriormente, el botón permanecía de forma estática en `left: calc(50% + 340px)`, provocando que en la visualización por defecto (sin paneles laterales abiertos) flotara incorrectamente hacia la izquierda, rompiendo la simetría visual de la esquina derecha.
    - **Refactorización con Zustand**: Se importaron los estados globales `PanelShow` y `PanelCantidades` en `RealidadAumentada.jsx`, combinándolos con `PanelAyudas` para crear un flag unificado de estado de paneles: `isPanelOpen`.
    - **Clase Dinámica `panel-herrajes-open`**:
        - Si ningún panel está abierto, el botón AR se posiciona de forma predeterminada en `right: 15px; bottom: 120px;`, perfectamente alineado en la columna derecha de interacción rápida con el viewport.
        - Si se activa algún panel lateral o la cortina del tutorial, la clase `.panel-herrajes-open` se inyecta de forma dinámica, desplazando el botón AR de forma suave (`transition: all 0.3s ease`) hacia `left: calc(50% + 340px)`, garantizando una alineación vertical perfecta y simétrica con el botón de cerrar "X".
    - **Resultado**: La experiencia en PC ahora goza de una simetría adaptativa impecable; el botón AR está al extremo derecho por defecto y solo se desplaza hacia la izquierda para unirse a la vertical del botón "X" cuando este entra en pantalla por la apertura de un panel.

* **[2026-05-21] AppArmado_v8.2 — Rediseño Estético Glassmorphic y Fichas de Tips de Alto Contraste (PanelTips):**
    - **Fondo Glassmorphic de Cortina (`.panel2`)**: Fondo esmerilado translúcido Obsidian Teal (`rgba(20, 22, 28, 0.15)` con `backdrop-filter: blur(16px)` y transición de Bezier premium cubic).
    - **Tarjetas de Tips de Alto Contraste (`.option2`)**: Rediseño completo a base blanca `#ffffff` y tipografía gris oscuro `#111319` con bordes cian sutiles, permitiendo una visibilidad e iluminación del 100% de los bocetos de línea negra de las herramientas (martillo, tuerca, destornillador, minifix) que antes se perdían sobre fondos oscuros.
    - **Aislamiento de Logotipo (`#logo`)**: Estilo transparente e inmune a las tarjetas blancas y efectos hover.
    - **Botón de Garantía Premium (`.option2 a`)**: Adaptado con alta fidelidad para el contraste sobre tarjetas blancas.
    - **Resultado**: Coherencia absoluta en la estética visual de todos los paneles interactivos del manual 3D y solución definitiva al problema de contraste.

* **[2026-05-21] AppArmado_v8.3 — Alineación de "X", Cápsula Premium de Garantía y Cierre por Tecla ESC:**
    - **Alineación Dinámica Sincronizada del Panel de Tips**: Se integró el estado de Zustand `panelTips` en la variable condicional `isPanelOpen` de `RealidadAumentada.jsx` y `BotonCerrar.jsx`. Ahora, al abrir la cortina de tips de armado, tanto la "X" de cerrar como el botón de Realidad Aumentada se desplazan de forma reactiva y con transiciones CSS fluidas a la vertical de control `left: calc(50% + 340px)`.
    - **Cierre Global Instantáneo mediante Tecla ESC**: Se implementó un event listener global para el teclado físico en `BotonCerrar.jsx`. Al pulsar la tecla **ESC** (Escape), se invoca centralizadamente la acción `cerrarPaneles()`, cerrando instantáneamente cualquier cortina abierta (herrajes, cantidades, tutorial de ayudas o tips de armado) y devolviendo la interfaz a su estado limpio.
    - **Cápsula Premium para "Garantía del Producto"**: Se reemplazó la antigua tarjeta blanca rígida `.option2 10` por una cápsula flotante Obsidian Teal (`.garantia-btn`) independiente. Cuenta con fondo de vidrio esmerilado oscuro, borde cian, icono de verificación (`verified_user`) y efectos hover interactivos de alta gama idénticos a los del botón de "Cantidades Totales de Herrajes", conservando la clase de control `.option2` para preservar la lógica condicional de visualización por producto.
    - **Pausa Automática de la Locución al Abrir Cortinas**: Se inyectó lógica reactiva en `AudioPlayer.jsx` para pausar inmediatamente cualquier audio explicativo o de fondo (`PausedAudio()`) en el momento en que se activa alguna cortina lateral o panel (`PanelShow`, `PanelCantidades` o `panelTips`), evitando el solapamiento acústico.
    - **Fichas Estáticas e Informativas de Tips**: Se inyectó el manejador `onClick={(e) => e.stopPropagation()}` a cada una de las tarjetas informativas `.option2` de `PanelTips.jsx`. Esto anula el cierre accidental del panel al hacer clic en las fichas del tutorial, convirtiéndolas en elementos estáticos e informativos (con efectos de hover físicos intactos) y permitiendo cerrar la cortina únicamente mediante el botón "X", el teclado (ESC) o haciendo clic fuera de las tarjetas.

* **[2026-05-21] AppArmado_v8.4 — Exclusión Mutua de Cortinas y Reordenamiento del Tooltip Superior (ayuda1):**
    - **Exclusión Mutua de Cortinas en Zustand**: Refactorizadas centralizadamente las funciones de apertura en `useEnviroment.js` (`PanelTipsTrue`, `PositivePanel`, `PanelCantidadesTrue` y `PanelAyudasTrue`). Ahora, al abrir cualquier cortina, se limpian preventivamente de forma explícita los flags de todas las demás cortinas activas (ej: al abrir los tips se desactiva de inmediato el tutorial y viceversa), eliminando de raíz el bug de traslapes de páneles laterales reportado por el usuario.
    - **Reordenamiento y Renombrado del Tooltip Superior (`ayuda1`)**: Se modificaron las etiquetas HTML `<li>` dentro de la burbuja `.ayuda1` en `NavBarSuperior.jsx` para reflejar la secuencia exacta e instructiva solicitada:
      1. *Marca del producto* (en reemplazo de "Marca y soporte").
      2. *Herramientas requeridas* (en reemplazo de "Herramientas requeridas").
      3. *Indicaciones especiales* (en reemplazo de "Indicaciones de armado").
      4. *Garantía del mueble* (en reemplazo de "Garantía del mueble").
    - **Validación de Compilación**: Ejecutada con éxito la compilación para producción (`npm run build`), obteniendo un bundle optimizado de Vite en 3.62 segundos con 0 errores y 0 warnings.

* **[2026-05-21] AppArmado_v8.5 — Ajustes en Navegación Inferior (Play/Pausa, Tamaños Lupa y Paso Central):**
    - **Icono de Pausa al Arranque**: Modificado el estado inicial de `phaseAudio` en `useEnviroment.js` de `"start"` a `"playing"`. Esto garantiza que al inicializarse la aplicación y arrancar la locución, el botón del menú de control (que lee este estado) renderice el icono de las dos rayas verticales (Pausa) en lugar del triángulo de Play.
    - **Ampliación del Número de Paso Central (40%)**: Refactorizada la propiedad CSS en `NavBarInferior.css` (`.percent .number h2` y `#numpaso`). Se aumentó un 40% el tamaño del texto indicador del paso: de `24px` a `34px` en escritorio y de `16px` a `22px` en dispositivos móviles, manteniendo la legibilidad sin desbordamientos en el círculo central.
    - **Ampliación Responsiva del Icono Lupa (40%)**: Se eliminó el estilo inline rígido del componente `<IconSearch>` en `PanelBtn.jsx` (`style={{ width: "16px", height: "16px" }}`) para desbloquear el escalado en hojas de estilo. Se agregaron reglas responsivas en `PanelBtn.css` ajustando el gráfico un 40% más grande de forma proporcional: `22.4px` en escritorio, `18px` en móviles (65% del botón) y `15px` en dispositivos mini, integrando perfectamente el Glassmorphism y manteniendo proporciones visuales.

---

* **[2026-05-22] AppArmado_V10 — Integración de Escena 3D Spline (Gama) en Pantalla de Carga:**
    - **Reemplazo de Elementos Estáticos por Iframe 3D**: Se eliminó el logotipo plano de imagen estática y los textos introductorios del panel HTML para darle el 100% de protagonismo a la escena del personaje Gama (R4X Bot). Se insertó un `<iframe className="spline-bg">` configurado sin bordes, inyectando directamente la exportación interactiva de la nube de Spline. Se inyectó control de caché dinámico (ej. `?v=7`) en la URL del iframe para forzar la actualización de cambios de Spline en el visor web.
    - **Reubicación de Interfaz Superpuesta (Top Content)**: Se rediseñó el HTML/CSS para que la barra de carga y el botón "Iniciar" floten sobre la escena 3D como elementos HUD. Se reubicaron en la mitad superior de la pantalla, liberando el área inferior y central para evitar tapar el modelo interactivo de Gama.
    - **Homologación Visual y Mimetización de la Barra de Carga**: Se configuró el fondo del contenedor de progreso `.progress` como transparente con bordes Teal brillantes (`var(--primary)`). El relleno de carga activo utiliza una barra translúcida lumínica (`var(--primary-glow)`), con el texto de porcentaje alineado y formateado en color cian sólido, logrando que el diseño coincida milimétricamente con el botón "Iniciar".
    - **Transición Cinemática (Auto-Hide)**: Se implementó lógica dinámica en React dentro de `PanelInicial.jsx`. Al alcanzar el 100%, la barra espera exactamente 2 segundos antes de iniciar una transición suave (fade-out) y desaparecer completamente (`display: none`), dejando la escena impecable para interactuar libremente con Gama.

---

* **[2026-05-23] Plataforma B2B — Usuarios_v2 (Gestión Avanzada y Sincronización Realtime):**
    - **Gestión Avanzada de Usuarios y Roles**: Implementación completa del ecosistema jerárquico (SuperAdmin, Coequipero, Admin Cliente, Diseñador, Lector) con validación cruzada y UI condicional en la plataforma B2B.
    - **Sincronización en Tiempo Real de Notificaciones**: Refactorización del hook `useNotifications` para integrarse con `Supabase Realtime` bajo la condición de eventos `*` (INSERT y UPDATE). Esto permite que el punto rojo de notificaciones no leídas desaparezca o se active instantáneamente en el Sidebar cuando el usuario lee una notificación en la página principal, sin requerir recargas de página.
    - **Seguridad y Expulsión Instantánea**: Desarrollo de un guardián de rutas global (`layout.tsx`) apoyado por una suscripción `Realtime` en el contexto de autenticación (`auth-context.tsx`). Si un administrador elimina un perfil de usuario activo, la plataforma intercepta el evento de eliminación de la base de datos y expulsa al usuario inmediatamente, cerrando su sesión JWT y forzando la redirección instantánea a `/login`.
    - **Ajustes de UI en Sidebar**: Corrección de problemas de salto visual (layout shift) en el menú lateral. Al transicionar entre el estado expandido y comprimido, se aislaron los elementos ocultos (`w-0`, `overflow-hidden`) de forma estructurada para garantizar que la alineación vertical y horizontal de los iconos sea completamente estática, replicando la estabilidad y fluidez visual de plataformas como Supabase.

* **[2026-05-25] Plataforma B2B — Usuarios_v3 (Gestión de Roles y Sliders de Asignación):**
    - **Protección de Permisos por Rol**: Se implementó el hook `usePermissions` a nivel del detalle de la solicitud (`solicitud-detalle.tsx`) para garantizar que la reasignación de tareas (modificación de `assigned_to_id`) sea una función estrictamente bloqueada a `SuperAdmin`.
    - **Refactorización de Interfaz Condicional (Slider de Solicitudes)**: Se dividió el Slider en dos experiencias de usuario totalmente distintas basadas en el estado de la tarea y el rol del usuario:
        - **SuperAdmin**: Al abrir tareas en estado "Nueva" o "Asignada", visualiza un módulo limpio y centralizado de **"Asignar Coequipero"** (sin fechas). Al seleccionar a un miembro, se ancla un layout visual con el Avatar posicionado estáticamente (mediante limitadores de ancho CSS) y un badge del nombre del coequipero.
        - **Coequipero**: El módulo de asignación queda completamente invisible. Un coequipero que recibe una tarea es llevado directamente a la configuración de la **"Fecha de Entrega"** (SLA), donde ahora se omite el `AssigneeSelector` pero se informa textualmente que la tarea está a su cargo, forzando un flujo 100% orientado al cumplimiento del trabajo.

* **[2026-05-26] Plataforma B2B — Integracion_Manual_v1 y Módulo de Proyectos CMS (Arquitectura e Implementación):**
    - **Nueva Base de Datos (Proyectos y Configuración de Manual)**: Se crearon las tablas `public.proyectos` y `public.configuraciones_manual` en Supabase. Se habilitó seguridad por políticas de fila (RLS), otorgando privilegios totales de administración al `SuperAdmin` y `Coequipero`, mientras que los clientes solo pueden visualizar los proyectos en los que son titulares.
    - **Mapeo Automático de Assets para CMS**: La arquitectura establece una vía de inyección directa de GLBs, locuciones en inglés/español, audios de ayuda, Renders 3D y especificaciones de tornillos/herrajes en formato JSON nativo para cada manual.
    - **Modal Premium "Nuevo Proyecto"**: Implementación de la vista y modal en Obsidian Teal con listados reactivos y dinámicos que enlazan Clientes (profiles) y Solicitudes activas, organizando los tipos de proyecto alfabéticamente (Aplicativo de armado, B2B, B2C, Genérico).
    - **Control de Roles de Creación**: Se restringió visual y operacionalmente la capacidad de registrar nuevos proyectos únicamente al `SuperAdmin` y `Coequipero`, garantizando un flujo B2B seguro e institucional.
    - **Detalle de Proyecto & Panel de Carga de Insumos (Fase 2)**:
        - Desarrollo del componente `DetalleProyectoModal` que integra de forma unificada la previsualización interactiva de la Solicitud (descripción de tickets, previsualizador de imágenes integrado y descarga directa de archivos XLSX/DWG/3DM/PDF) con el uploader del core del manual.
        - Definición técnica del **"Manual Vacío"**: Aplicación centralizada que se auto-alimenta dinámicamente de Supabase Storage en lugar de requerir carpetas locales estáticas, permitiendo que al cargar los 8 tipos de insumos el manual quede 100% operativo de inmediato.
        - Mapeo total de recursos del manual `M01536` a la nueva estructura relacional de la base de datos (GLBs, audios de voz en español/inglés, audios de ayuda global, herramientas, renders y fotos reales de tornillería).
        - **Ubicación de Referencia del Manual M01536**: Los archivos de construcción y originales del último manual desarrollado residen localmente en `C:\Desarrollo\mmapp\legacy-aplicativo-armado\dist\M01536` y `C:\Desarrollo\mmapp\legacy-aplicativo-armado\public\M01536`.
    - **Pulido de CMS e Integración del Manual 3D Dinámico (Corrección de Incidencias)**:
        - **Mapeo de Imágenes de Herrajes con Formatos Mixtos**: Implementada la función helper `getHerrajeImageUrl` en `PanelHerrajes.jsx` y `PanelCantidades.jsx`. Resuelve dinámicamente la extensión exacta subida por el usuario (`.webp`, `.png`, `.jpg`, etc.) desde el listado `fotosHerrajesList` de la base de datos, sirviendo las imágenes de herrajes dinámicamente a través del proxy de Supabase.
        - **Adaptación Estándar de Tamaño de Herrajes**: El visualizador de herrajes utiliza de forma robusta la propiedad CSS `background-size: contain; background-repeat: no-repeat; background-position: center;`, forzando que todas las imágenes subidas por el cliente, sin importar su tamaño y proporción, se presenten bajo el mismo estándar estético pulido y profesional sin deformarse.
        - **Resolución de la API de Audio de Ayuda**: Se corrigió el orden de operaciones en `AudioPlayer.jsx` al activar el tutorial de ayudas, asignando el `.src` dinámico e invocando inmediatamente después `.load()`. Esto fuerza la recarga del buffer de HTML5 Audio, superando la caché y reproduciendo con total fidelidad el audio de ayuda personalizado de Supabase.
        - **Botón Central del Paso en Color Primario**: Se modificó la inyección dinámica de CSS para asignar `--surface-container` al color primario del cliente, y se refactorizó `.percent` en `NavBarInferior.css` para utilizar `--primary` como fondo con número en blanco, logrando que el círculo central del paso actual herede la identidad del cliente.
        - **Personalización Dinámica del Color de Texto y Contraste de Botones**: 
          - Agregada la columna `color_texto_botones` en la base de datos de Supabase.
          - Implementado un selector del "Color de Texto / Iconos" en el panel de Branding de `detalle-proyecto-modal.tsx` en la plataforma.
          - Inyectada dinámicamente la variable CSS `--btn-text-color` desde `AssemblyPage.jsx` y aplicada en `NavBarInferior.css` para los iconos de todos los botones (`.button`, `#left`, `#right`, `#btnPause`) y el número de paso central. Esto unifica estéticamente todos los elementos de control y permite al cliente asegurar un contraste visual premium 100% personalizable.
        - **Resolución de Paths de Supabase para Logo y Favicon (Corrección 404)**: Corregimos una discrepancia crítica en el helper `getStorageUrl` de `AssemblyPage.jsx`. Al subir los archivos de logotipo (`logo.svg`) y favicon (`favicon.ico`) desde la plataforma, se almacenan físicamente bajo la subcarpeta `${codigoManual}/` en el Storage, pero en la base de datos de configuraciones se guardaba únicamente el nombre del archivo. Modificamos el helper para que anteponga automáticamente el prefijo de subcarpeta del código de manual (`[id]/`), solucionando de raíz el error 404 y cargando de inmediato y con total fidelidad la identidad corporativa y el icono de la pestaña del navegador.

* **[2026-05-26] AppArmado_v11 / Integracion_Manu_Dina_v3 — Personalización de 4 Texturas PBR Completas, Corrección de Alturas e Inmunidad a Flicker:**
    - **Base de Datos y Supabase**:
        - Agregadas las 8 nuevas columnas PBR en la tabla `public.configuraciones_manual` mediante migraciones DDL: `pbr_floor_diff`, `pbr_floor_normal`, `pbr_floor_roughness`, `pbr_floor_height`, `pbr_wall_diff`, `pbr_wall_normal`, `pbr_wall_roughness`, `pbr_wall_height`.
    - **Plataforma CMS (Administración)**:
        - Rediseño e implementación en `detalle-proyecto-modal.tsx` con una sección Obsidian Teal Glassmorphic para subir, visualizar y borrar las 4 texturas PBR para piso y escenario en Supabase Storage (`insumos_manuales`).
        - Resolución de la advertencia de contexto elevado (`no-use-before-define`) reubicando las declaraciones de estado en el modal.
    - **Visor 3D y React Three Fiber (`Experience.jsx` y `Floor.jsx`)**:
        - Inyección dinámica en `Experience.jsx` de texturas PBR para las paredes con escala `repeat.set(4, 2)` mediante un material estándar físico que responde a la luz utilizando mapas de difusión (`map`), normales (`normalMap`), rugosidad (`roughnessMap`) y relieve visual (`bumpMap` con escala `0.02`).
        - Inyección en `Floor.jsx` de texturas PBR completas para el piso con `bumpMap` de altura (escala `0.03`) y deshabilitando el mapa de oclusión ambiental (`aoMap`) estático local para evitar interferencias visuales.
    - **Resolución de Flicker y Desviación de Altura**:
        - Solución definitiva al parpadeo (flicker) del Skybox en la transición de pasos removiendo `PasoActual` y `alturas` de las dependencias del `useEffect` de instanciación del Mesh.
        - Corrección de la pérdida de posición vertical al inicio, invocando imperativamente la función `repositionSkybox(skyBox)` durante la creación del Mesh para estabilizar la altura del escenario.
    - **Mapeo de URLs**:
        - Actualización del mapeo dinámico en `AssemblyPage.jsx` para resolver correctamente los 8 enlaces de Storage de Supabase en `dynamicProductData`.

* **[2026-05-28] AppArmado_v12 / Integracion_Manu_Dina_v4 — Regla Inteligente PBR, Cache Buster, Impecable Ajuste de Escala, Depuración de Cámara y Estabilidad de Audio:**
    - **Regla Inteligente PBR (Modo Práctico vs. Modo Avanzado):** Implementamos una lógica reactiva automatizada en `Experience.jsx` que evalúa las texturas cargadas en `productData`. Si el usuario solo sube una única imagen panorámica 360 en `pbr_wall_diff` (sin mapas complementarios de normales o rugosidad), el sistema la detecta automáticamente como una tira de escenario cubemap horizontal de 6 caras y la usa para el Skybox. Si se añaden mapas adicionales PBR de normales o rugosidad, se activa dinámicamente el modo de paredes PBR con textura repetitiva en las paredes laterales. Esto simplifica drásticamente el flujo de trabajo (solo requiere subir una imagen panorámica) sin perder la capacidad de usar mapas PBR avanzados.
    - **Inmunidad a Caché (Cache Buster):** Añadimos un parámetro dinámico basado en tiempo (`?v=${Date.now()}`) al cargador de texturas de `Experience.jsx`. Esto fuerza al navegador a descargar siempre el archivo de imagen fresca directamente del disco en cada recarga de la página, eliminando de forma definitiva el molesto almacenamiento en caché y la necesidad de usar el modo incógnito o de navegación privada.
    - **Alineación del Suelo y Proporción Coherente de la Puerta:** Se restauró la escala geométrica del Skybox a las proporciones de producción estándar de **`(12, 4.5, -12)`** y el offset en Y a **`2.25`** en la función `repositionSkybox`. Esto corrige el tamaño gigante de la puerta y las molduras, haciendo que luzcan lejanas y coherentes respecto al mueble de madera, a la vez que calza milimétricamente la línea del zócalo del fondo con la base del piso visual gris, eliminando por completo la franja blanca de separación flotante.
    - **Widget Depuración de Cámara en Vivo (60 FPS):** Implementamos un panel flotante Obsidian Teal (`CAM POS` y `TARGET`) en la esquina superior izquierda del viewport en `Experience.jsx`. El widget utiliza una referencia directa de React para actualizar su contenido textual desde el lazo de animación `useFrame` a 60fps estables sin disparar ciclos de re-renderizado en React, facilitando al usuario definir visualmente y con total precisión matemática la ubicación exacta de la cámara para cada paso.
    - **Resolución a Errores de Interrupción de Audio (`AbortError`):** Identificamos y corregimos las excepciones recurrentes en la consola de desarrollador del navegador. Ocurrían porque `AudioPlayer.jsx` llamaba de forma redundante e inmediata a `.play()` dentro de las condiciones de control (provocando solicitudes simultáneas de reproducción) o realizaba nuevas cargas sobre buffers asincrónicos abiertos. Reestructuramos la lógica de llamadas únicas y envolvimos la ejecución en promesas controladas con captura segura (`.catch()`), silenciando las alertas y garantizando una reproducción libre de warnings.
    - **Ángulos de Cámara Dinámicos desde el CMS (Supabase):** Refactorizamos el mapeo de datos en `AssemblyPage.jsx` para habilitar el soporte dinámico de `cameraPosition` y `cameraTarget` directamente desde el JSON de configuración `glb_pasos` en la base de datos de Supabase. Anteriormente, todos los manuales de Supabase utilizaban posiciones fijas/hardcodeadas para todos los pasos.
    - **Configuración del Ángulo Inicial en Producción (Paso 00):** Actualizamos de forma exitosa y persistente el registro de Supabase para fijar exactamente las coordenadas de la cámara en el paso `"00"` (posición: `[-1.8550, 1.2881, 2.4559]`, target: `[-0.3964, -0.5206, 0.1974]`), logrando que la aplicación de armado inicie e incline el viewport de manera impecable con el ángulo exacto solicitado por el usuario.
    - **Configuración del Ángulo para el Paso 01:** Actualizamos en Supabase las coordenadas exactas de la cámara para el paso `"01"` (posición: `[-1.8680, 0.5159, 2.4278]`, target: `[0.0582, -0.2509, 0.0717]`), permitiendo una transición de cámara fluida y una orientación óptima del viewport elegida por el usuario para la segunda etapa del armado.
    - **Eliminación del Parpadeo del Piso en Transiciones:** Separamos los límites de `<Suspense>` de Three.js en `Experience.jsx`. Al colocar `<Floor />` en su propio bloque de Suspense independiente del de `<Model />`, evitamos que el suelo se desmonte y desaparezca/parpadee cuando cambia la URL del modelo 3D entre pasos. Ahora el piso permanece 100% estable y visible.
    - **Restauración de la Barra de Carga Horizontal Personalizable:** Configuramos el cargador de transición intermedia (`Experience.jsx` y `index.css`) para que sea **exactamente la misma barra horizontal de progreso de la pantalla inicial** (`.progress-model-loader`). Utiliza las variables CSS dinámicas de la plataforma (`var(--primary)` y `var(--primary-glow)`). Para resolver la falta de llenado y la invisibilidad del texto de porcentaje, implementamos la misma rutina de animación suave (`requestAnimationFrame`) que hace transicionar el progreso de 0 a 100% de manera fluida y desacoplamos el texto de porcentaje (`span`) colocándolo en una capa superpuesta con posicionamiento absoluto centrado. Esto evita el recorte por desbordamiento (`overflow: hidden`) y asegura que la barra funcione con la misma lógica interactiva y el mismo color amarillo `#ffff00` personalizado que en la portada.
    - **Transparencia en el Indicador Circular de Pasos:** Modificamos el anillo de progreso circular que rodea el botón central del paso actual en la barra inferior (`NavBarInferior.css`). Reemplazamos el trazo rojo intenso sólido (`var(--primary)`) por el mismo color con una elegante opacidad del 35% (`color-mix(in srgb, var(--primary) 35%, transparent)`) tanto para escritorio como para móvil. Esto unifica visualmente la estética de todos los indicadores de progreso del manual y suaviza su presencia en el viewport.
    - **Configuración del Ángulo para el Paso 02:** Actualizamos en Supabase las coordenadas exactas de la cámara para el paso `"02"` (posición: `[-1.8164, 0.7570, 1.7456]`, target: `[0.0850, -0.3733, 0.1607]`) copiadas del registro de la consola F12 compartida por el usuario.
    - **Guía Técnica de Configuración de Cámara:** Creamos el archivo de referencia operativa [GUIA_CONFIGURACION_CAMARA.md](file:///C:/Desarrollo/mmapp/docs/GUIA_CONFIGURACION_CAMARA.md) en la carpeta `/docs/`. Esta guía paso a paso documenta todo el procedimiento de captura, mapeo y sentencias SQL seguras (con delimitación por $) para acelerar y simplificar futuras actualizaciones de cámara por parte del equipo o agentes.
    - **Customización Completa de Ángulos de Cámara (Pasos 03, 04 y 05):** Completamos de forma exitosa y persistente la carga de coordenadas personalizadas para todos los pasos restantes del manual interactivo `"M00001"` en Supabase:
      * **Paso 03:** Posición `[-1.3511, 1.2612, 2.4388]`, Target `[0.1458, -0.5126, 0.3147]`
      * **Paso 04:** Posición `[-0.7098, 0.9053, 2.0210]`, Target `[-0.0331, -0.4914, 0.0865]`
      * **Paso 05:** Posición `[-2.2539, 0.4994, -1.0758]`, Target `[0.2323, -0.2729, 0.1521]` (Corregido y centrado según la última captura de consola).
      Esto concluye con total éxito la fase de personalización del viewport 3D por paso, logrando transiciones fluidas de cámara en toda la experiencia.
    - **Estandarización de las Nubes de Ayuda (Paneles y Tooltips):** Corregimos el estilo visual de todas las burbujas informativas (nubes) de la interfaz, incluyendo las de "Guía y Herramientas" y los tooltips de "Herrajes Necesarios" (`PanelBtn.css` y `PanelHerrajes.css`). Se aplicaron los lineamientos premium (bordes redondeados a 20px, fuentes Inter, sombras envolventes y espaciado), pero respetando la personalización del cliente: el fondo ahora es dinámico (`color-mix(in srgb, var(--primary) 20%, transparent)`), y la flecha directriz presenta un color primario sólido y vibrante, eliminando el gris oscuro estático anterior que no respetaba la configuración de Supabase. El tooltip flotante del cursor fue revertido a su estado original según solicitud.
    - **Generación Nativa y Offline de Códigos QR para AR:** Instalamos la librería `react-qr-code` para generar el código QR de Realidad Aumentada de forma 100% local en el navegador del cliente. Eliminamos la dependencia de la API externa gratuita (`api.qrserver.com`) en `RealidadAumentada.jsx`, lo que cierra el ciclo de configuración de forma automática y profesional: ahora el QR se dibuja en milisegundos, es aprueba de caídas de servidores de terceros y se adapta dinámicamente a la URL donde sea que se incruste el manual en la web del cliente.

------

* **[2026-05-28] AppArmado_v11 — Optimización de Iconos SVG Nativos y Tooltips Integrados:**
    - **Refactorización de `IconShadows` a SVG Nativo**: Se resolvió el bug visual donde el icono del sol (sombras) se renderizaba como un círculo sólido magenta. Se eliminó la dependencia de la fuente `material-symbols-outlined` y las etiquetas `div`/`span` que rompían la herencia de color de CSS, reescribiendo el componente directamente con paths SVG (`light_mode` y `routine`). Esto garantiza una herencia de color perfecta (`currentColor`), permitiendo que el componente adopte dinámicamente los colores primarios configurables.
    - **Tooltips Nativos de Navegación**: Implementación del atributo `title` en todos los botones estratégicos de la interfaz para mejorar la accesibilidad y usabilidad (UX):
      - `NavBarSuperior`: Botones de Ayuda ("Tutorial de Interfaz") e Información ("Información General").
      - `NavBarInferior`: Controles de flujo "Retroceder un paso", "Ir al siguiente paso" y el botón central de reproducción actualizado a "Pausar, Activar o Reiniciar".
      - `PanelBtn`: Botón de lupa actualizado a "identificar Herrajes".
    - **Resultado**: Una interfaz mucho más intuitiva, libre de bugs visuales de herencia en los iconos, y preparada para personalizaciones de temas de color de alto contraste (Obsidian Teal o Light Theme).

* **[2026-05-29] Modo Cristal Regulable en Plataforma y Manual (AppArmado_v13 / Integracion_Plataforma_v5):**
    - **Base de Datos (Supabase):** Añadimos la columna `opacidad_manual` (entero de 10 a 100) en la tabla `configuraciones_manual` de manera completamente retrocompatible (valor por defecto 100).
    - **Slider de Opacidad Premium (Next.js):** Diseñamos e implementamos un control Slider (`type="range"`) estilizado en Obsidian Teal en el panel de Branding del modal de detalles del proyecto, con un indicador dinámico de estado en tiempo real (mostrando badge de "Sólido (100%)" o "Cristal (X%)").
    - **Inyección de Transparencia CSS (`color-mix`):** Actualizamos `AssemblyPage.jsx` para leer la opacidad y, si es inferior a 100%, inyectar la transparencia a las variables `--surface`, `--surface-opaque`, `--surface-container` y `--surface-active` usando la función nativa CSS `color-mix(in srgb, Color Porcentaje%, transparent)`.
    - **Unificación Estética del Círculo Central:** Modificamos `NavBarInferior.css` para que el círculo indicador central de pasos (`.percent`) utilice `var(--surface)` en lugar de `var(--primary)`, permitiéndole heredar de forma impecable y coherente la transparencia del modo cristal seleccionada.

* **[2026-05-30] Pestaña Despiece y Calculador de Costos 3D Integrado (Integracion_Plataforma_v6):**
    - **Base de Datos (Supabase):** Añadimos de manera segura la columna `despiece` (de tipo `jsonb`) a la tabla `configuraciones_manual` para almacenar los costos e insumos procesados.
    - **Extracción de Insumos GLB Silenciosa en Cliente:** Diseñamos un flujo de descarga nativa mediante `.download(path)` de Supabase que evita en un 100% problemas de CORS y autorización de red, procesando el binario localmente como un `Blob` temporal.
    - **Soporte para Compresión Draco 3D:** Integramos dinámicamente `DRACOLoader` de Three.js configurado con el CDN oficial del decodificador Draco de Google, logrando descomprimir en vivo geometrías 3D Draco en milisegundos en el navegador.
    - **Extractor de Tooltips e Identificación:** Portamos con precisión milimétrica la función `obtenerNombreLimpioTooltip` de `Model.jsx` para que las piezas del listado coincidan 1:1 con el visor interactivo.
    - **Reglas Especiales de Clasificación de Insumos:**
        - **Maderas / Estructura:** Si el componente empieza por `"Tapaluz"`, se clasifica obligatoriamente como madera, evadiendo colisiones generales.
        - **Herrajes / Accesorios:** Si el componente empieza por `"Caja"` o `"Puntilla"`, se clasifica deterministamente como herraje. El resto de herrajes se identifican por palabras clave genéricas (`tornillo`, `perno`, `tarugo`, etc.).
    - **Interfaz Glassmorphic & Panel de Control de Costos:**
        - Creamos una pestaña **Despiece** con un panel resumen de KPIs (Total Insumos, Maderas Únicas, Herrajes Únicos) y Costo Total del Mueble actualizado en vivo al cambiar inputs de Costo Unitario.
        - Añadimos botones rápidos para escanear en vivo y guardar de forma express el despiece sin interferir con otros insumos.

*Última consolidación: 30 de Mayo, 2026*

---

## 🗓️ Junio 2026

### 🔹 Semana 1: Estabilización de Ecosistema Rhino/Blender
* **[2026-06-02] Automatización Python-Blender (script_cohesion_v30):**
    - **Reconstrucción Espacial Post-Grasshopper**: Se desarrolló desde cero un algoritmo complejo en Python (`script_cohesion_v30.py`) para Blender que reconstruye y unifica mallas fragmentadas exportadas por Rhino/Grasshopper.
    - **Algoritmo Multi-Fase**:
      1. Agrupación por proximidad para Herrajes (tornillos, bisagras).
      2. Unión de láminas de madera (Cara, MDP) usando validación estricta de centros y comprobación de deformación de volumen (`forman_paralelepipedo`).
      3. Absorción de parches 2D y recortes huérfanos utilizando lógicas combinadas de `bbox_overlap` (para coincidencias explícitas de nombre) y `bbox_contains` dinámico, evaluando siempre contra la capa más volumétrica del grupo objetivo para evitar falsos negativos en caras planas.
    - **Solución de Normales Invisibles**: Se resolvió un bug crítico donde el recálculo estándar de normales de Blender invertía y ocultaba planos de grosor cero (parches de ranura). Se implementó la función `hacer_doble_cara` que duplica y voltea físicamente los polígonos de piezas de 0 grosor, garantizando visibilidad absoluta bidireccional independientemente del motor de render.
    - **Resultado**: Exportaciones crudas de Grasshopper ahora se transforman instantáneamente en una jerarquía Outliner limpia, de objetos sólidos e independientes, con orígenes (centroides) perfectos y una geometría impecable lista para motores web.

* **[2026-06-03] Refactorización de Despiece y Alineación Estructural de Costos (Manual_Blender_v2 / Integracion_Plataforma_v7):**
    - **Visualización Desglosada**: Se actualizó el listado del modal para desglosar y apilar individualmente badges (`Pieza 01`, `Pieza 02`) en lugar de usar rangos de texto como "Pieza 01 a Pieza 02".
    - **Precisión del Escáner GLB**:
        - Se priorizó el nombre de los nodos padres del GLB (`child.parent.name`) omitiendo explícitamente el nodo contenedor `"Scene"`.
        - Se ajustó la expresión regular del escáner (`/Pieza[_\s]*(\d+)/i`) con soporte para limpiar sufijos duplicados, resolviendo de raíz el fallo de detección en nombres con guiones bajos o sin espacios.
    - **Alineación de Grilla (Herrajes)**: Se adaptó la sección de herrajes al formato de grid de 14 columnas de maderas/fondos para garantizar simetría visual en las columnas de Cantidad, Costo Unitario y Costo Total.
    - **Caja de Gran Total e Hitos por Sección**:
        - Se introdujeron filas de subtotal por sección (Maderas, Láminas y Herrajes).
        - Se añadió una tarjeta de resumen consolidada de "Gran Total" en la base de la pestaña para visualizar la suma de todas las secciones en pesos colombianos.

* **[2026-06-07] AppArmado_v14 / Manual_Audios_v1 — Sincronización de Audios del CMS y Corrección de Autoplay**:
    - **Corrección de Rutas en Español Latino**: Se diagnosticó que los audios generados por la síntesis del habla (TTS) del CMS se guardan directamente en la raíz de la carpeta de sonidos de Supabase como `sounds/{paso}.mp3`, mientras que el reproductor de la app buscaba erróneamente en `/sounds/es/{paso}_es.mp3` (que contenía audios legados antiguos e incompletos). Se corrigió el helper `getAudioSrc` para apuntar a la raíz: `/${id}/sounds/${paso}.mp3`.
    - **Existencia de Audios en Supabase**: Se verificó mediante un script de peticiones HTTP directas la existencia de todos los audios de armado (`00.mp3` a `08.mp3`) en el storage de Supabase, validando que el archivo `00.mp3` contiene el saludo de bienvenida real.
    - **Ciclo de Montaje y Evasión del Bloqueo por Autoplay**: Se restauró la renderización condicional del reproductor en `NavBarInferior.jsx` (`{toogle ? <AudioPlayer /> : null}`). Esto desmonta y vuelve a montar el componente durante 200ms al cambiar de paso, forzando la creación de un nuevo elemento de audio en el DOM inmediatamente después de la acción de click, lo cual desbloquea el permiso del navegador para Autoplay y evita retardos.
    - **Simplificación de Idiomas**: Se removieron los botones de cambio de idioma en `NavBarSuperior.jsx` (código original respaldado en `idiomas_respaldo.md`) y se fijó el estado `idioma` a `"es"` en el store Zustand para concentrar las pruebas y la validación en el idioma español latino.
* **[2026-06-08] AppArmado_v15 / Manual_Audios_v1.1 — Herrajes Compartidos, Overlay de Cámara y Nombrado Canónico:**
    - **Herrajes Compartidos en Supabase Storage**: Se configuró un proxy en `vite.config.js` para servir assets desde la carpeta global `_herrajes_compartidos/` del bucket `insumos_manuales`, permitiendo reutilizar fotos de herrajes entre múltiples manuales sin duplicar archivos. El modal de la plataforma ahora prefija con `_shared:` los archivos compartidos para diferenciarlos de los específicos del manual.
    - **Overlay de Cámara con Copy/Paste de Coordenadas JSON**: Se implementó un overlay de desarrollo en `Experience.jsx` que muestra en tiempo real las coordenadas de la cámara (`position` y `target` de OrbitControls) con botones de copiar y pegar vía `localStorage`. Se añadieron los campos `cameraPosition` y `cameraTarget` en el modal de la plataforma (`detalle-proyecto-modal.tsx`) para guardar coordenadas personalizadas por paso de armado directamente en la tabla `glb_pasos` de Supabase.
    - **Proxy Dinámico de Vite Refactorizado**: Se refactorizó completamente `vite.config.js` con un proxy regex genérico que captura automáticamente todas las subcarpetas de cualquier manual (modelos, sonidos, herrajes) desde Supabase Storage, eliminando la necesidad de definir proxies individuales por ruta.
    - **Unificación Canónica de Nombres de Herrajes (`limpiarNombreMalla`)**: Se replicó la función `obtenerNombreLimpioTooltip` del modal de la plataforma directamente en los componentes del visor 3D (`PanelHerrajes.jsx` y `PanelCantidades.jsx`). Esto garantiza que los nombres mostrados en el manual dinámico sean **idénticos** a los del despiece del modal (ej: `Bisagra_20040` en vez de `Bisagra`, `Tarugo_20030` en vez de `Tarugo`). La función aplica la misma lógica de limpieza: remoción de sufijos de Blender (`0\d\d$`), filtrado inteligente de instancias numéricas, y eliminación de sufijos de material (`_BALANCE`, `_TAPA`, etc.).
    - **Detección de Herrajes por Palabras Clave**: Se reemplazó la dependencia de `data.despiece` (que no siempre carga `esHerraje: true` en el visor) por una función `esHerrajeConocido` que usa la misma lógica de clasificación del modal: exclusiones (tapaluz, fondo), inclusiones especiales (caja, puntilla, SKUs numéricos) y keywords genéricos.
    - **Resultado**: Los paneles de herrajes y cantidades del manual 3D ahora muestran nombres precisos y consistentes con el despiece del modal, independientemente de si los datos del despiece están disponibles en el visor.

* **[2026-06-08] AppArmado_v16 / Manual_sonido_v2 — Cámara Flexible, Unificación de Botones y Gestión de Caché de Audio:**
    - **Edición de Cámara y Pegado Flexible**: Se habilitó la edición directa de los campos de entrada de la cámara (`POS` y `TGT`) en el modal. Los usuarios ahora pueden ingresar coordenadas individuales o pegar textos completos como `"CÁMARA -> posición: [-1.3396, 1.3663, 2.5663] | target: [-0.1186, 0.4350, 0.2247]"`, los cuales se filtran y procesan automáticamente para actualizar ambos campos al instante.
    - **Unificación de Botones como "Subir Audio"**: Se reemplazaron y unificaron todos los nombres de los botones de subida/generación de TTS (en saludo de bienvenida, tutorial de ayuda y pasos individuales) a la etiqueta estándar **"Subir Audio"**.
    - **Eliminación Definitiva de Caché en Supabase y Navegador**: 
        - En la API de subida (`/api/tts/route.ts`), se configuró la cabecera `cacheControl: "0"` para evitar que la CDN de Supabase retenga copias viejas de audios sobrescritos.
        - En el visor 3D (`AudioPlayer.jsx`), se añadió una marca de tiempo dinámica (`?t=timestamp`) en las llamadas HTTP a los audios. Esto anula la caché del navegador y la del servidor de desarrollo local de Vite (`global.audioCache`), logrando una recarga instantánea de los audios nuevos.
    - **Aislamiento de Cargas y Visualizadores**: Se separaron las acciones en la interfaz mediante sufijos `_preview` and `_upload` en el estado de generación, aislando la animación de carga del botón "Subir Audio" para que no se active de manera errónea al escuchar previsualizaciones. Se añadió además un spinner de carga en el botón de escucha mientras la locución se sintetiza.

* **[2026-06-09] AppArmado_v17 / Manual_Iluminacion_Camara — Calibración de Iluminación 3D, postMessage y Casilleros de Pegado:**
    - **Calibración de Iluminación 3D en Caliente**: Se diseñó e implementó un panel flotante de calibración (`LightingPanel.jsx`) con glassmorphism oscuro y sliders táctiles para modificar la intensidad de luz ambiente, direccional, spot, sombras, intensidad de entorno (IBL), tone mapping (ACESFilmic, AgX, Linear, etc.) y exposición del Canvas.
    - **Guardado Automático de Cámara e Iluminación (postMessage)**: Se habilitó la comunicación local cross-origin instantánea entre el visor 3D (`localhost:5173`) y el CMS de la plataforma (`localhost:3003`) mediante el envío de eventos con la API HTML5 `postMessage` a `window.opener` (habilitado tras configurar `rel="opener"` en los enlaces de previsualización). Al hacer clic en "Definir posición" o "Guardar iluminación", el visor escribe y guarda los datos de forma directa en el CMS y en la base de datos de Supabase, evitando bloqueos por políticas RLS y sobrecargas de red.
    - **Copia al Portapapeles Automática**: Cuando el usuario define una posición de cámara en el visor, el sistema escribe automáticamente las coordenadas en el portapapeles en el formato tradicional (`🎥 CÁMARA -> posición: [...] | target: [...]`).
    - **Casillero de Pegado Manual Restablecido**: Se restauró un casillero de texto individual debajo del estado de la cámara en las tarjetas de pasos del modal. Esto permite que el usuario pegue manualmente el texto de la cámara copiado del portapapeles para su parseo inmediato y auto-guardado en la base de datos, sirviendo como una alternativa robusta offline si la comunicación directa está desactivada.
    - **Corrección de Pantalla Negra (Reglas de Hooks)**: Se corrigió un error en `CameraOverlay` que producía pantalla negra al alternar el panel de cámara, reubicando el hook `useThree()` en la raíz del componente (antes de las cláusulas de guarda condicionales).
    - **Optimización del Ciclo useFrame**: Se eliminaron los bucles `useFrame` que corrían a 60fps en `Experience` y `CameraOverlay` para calcular y actualizar coordenadas constantemente, optimizando la CPU/GPU al interactuar con el modelo 3D.

* **[2026-06-10] AppArmado_v18 / Manual_Exportacion_glb_geometry_nodes — Bake de Geometry Nodes, Draco, Reversión de Blend y Silencios TTS:**
    - **Bake Masivo de Geometry Nodes a Mallas Reales**: Creación de scripts de Python para Blender (`bake_geometry_nodes_v1.py`, `_v2.py`, `_v3.py`) que automatizan el traspaso de animaciones procedimentales de múltiples objetos emisores (`Plane`, `Plane.001`, etc.) hacia los componentes físicos del modelo, desactivando modificadores temporalmente para evadir bucles de retroalimentación.
    - **Compresión Draco de Malla en GLB**: Incorporación de los parámetros `export_draco_mesh_compression_enable=True` y `export_draco_mesh_compression_level=6` en el operador de exportación glTF de Blender, optimizando drásticamente el peso del archivo `.glb` para la web sin pérdida perceptible de calidad geométrica.
    - **Compilación Unificada de Animaciones (`Active Actions Merged`)**: Configuración del modo de animación del exportador a `ACTIVE_ACTIONS` para compilar todas las pistas individuales de movimiento en un único clip de animación, garantizando compatibilidad inmediata con Three.js y reproducciones sincronizadas.
    - **Prevención contra ReferenceError de Blender en Python**: Refactorización del flujo de selección y limpieza de objetos para registrar estados usando cadenas de nombres (`strings`) en lugar de referencias directas a structs de C++ (`bpy.types.Object`), neutralizando errores por referencias nulas al remover los emisores destruidos.
    - **Descarte de Cambios con Reversión Automática**: Programación de la instrucción `bpy.ops.wm.revert_mainfile()` al final del flujo del script para recargar el archivo original `.blend` desde el disco, deshaciendo los cambios temporales de animación y eliminando emisores en el archivo de trabajo mientras se conserva el GLB exportado.
    - **Instructivo y Procesamiento de Silencios en TTS**: Añadido instructivo interactivo en Obsidian Teal en el panel de carga de audios (`detalle-proyecto-modal.tsx`) para la etiqueta de pausas `[pausa: X]`. En la API, se programó la síntesis de silencios concatenando búferes binarios nativos del motor edge-tts (formato idéntico de audio) para evitar colapsos o desincronizaciones en el decodificador de HTML5 Audio del cliente.

* **[2026-06-11] AppArmado_v19 / Plataforma_v8 — Unificación Espacial, Filtro de Superposición de 2mm, Persistencia de Despiece Automática y Sincronía Completa del Visor 3D:**
    - **Unificación Espacial de Herrajes Complejos (Bisagras y Correderas)**:
        - Se resolvió la duplicación recurrente en el despiece de bisagras (daba 8 en lugar de 4) causada porque sus mallas se segmentan en Blender por animación móvil/fija (unas cuelgan del Empty de la puerta y otras de `Scene`).
        - Se implementó un algoritmo de consolidación en Three.js en la plataforma y el visor que evalúa el centro tridimensional del Bounding Box de cada herraje. Si otra submalla del mismo tipo (ej: `Bisagra_20040`) está a menos de **100 mm (10 cm)**, hereda el mismo `instanceId` para agruparlas en 1 sola pieza real.
        - Se programó una división entre 2 de la cantidad de bisagras y correderas al final del escaneo para reportar con absoluta precisión **4 bisagras y 4 correderas** en el CMS.
    - **Filtro de Superposición Estricto (2 mm) para Herrajes Simples**:
        - Para evitar la consolidación errónea de herrajes de unión individuales que están a poca distancia (como pernos o tornillos), se restringió la unificación espacial de 100 mm a herrajes complejos.
        - Para herrajes simples (pernos, tornillos, tarugos, puntillas), se implementó un filtro de superposición estricto con una tolerancia de **2 mm**. Esto descarta mallas superpuestas exactamente en la misma coordenada por errores de modelado en Blender (duplicaciones accidentales con Shift+D).
        - Gracias a este filtro, el escáner ignora los 4 duplicados accidentales de puntillas del modelo `P00.glb` y reporta exactamente **34 puntillas físicas reales** y **28 pernos**.
    - **Persistencia Automática de Despiece (Supabase)**:
        - Se automatizó la persistencia del despiece al terminar el escaneo del GLB llamando directamente a `handleSaveDespiece` desde la rutina de éxito del escáner en [detalle-proyecto-modal.tsx](file:///c:/Desarrollo/mmapp/mario-mojica-plataforma/components/proyectos/detalle-proyecto-modal.tsx#L1743-L1753). Esto evita que la columna `despiece` quede en `null` por fallos de interacción del usuario al no pulsar el botón manual de guardar.
    - **Sincronía e Integridad del Visor 3D**:
        - Se modificó [PanelHerrajes.jsx](file:///c:/Desarrollo/mmapp/legacy-aplicativo-armado/src/features/AssemblyInstructions/components/NavBarInferior/PanelHerrajes/PanelHerrajes.jsx#L201-L224) para que en el paso inicial 00, herede estrictamente la cantidad del despiece oficial (`data.despiece`) de Supabase en lugar de extraerla del nombre del nodo del GLB (lo cual reportaba 16 correderas al haber 16 mallas físicas).
        - Se alineó el fallback local de [PanelCantidades.jsx](file:///c:/Desarrollo/mmapp/legacy-aplicativo-armado/src/features/AssemblyInstructions/components/NavBarInferior/PanelHerrajes/PanelCantidades/PanelCantidades.jsx#L141-L276) importando `three` y aplicando las mismas reglas de unificación espacial (100 mm), filtro de superposición de 2 mm y división entre 2. Esto garantiza coherencia visual absoluta en las cantidades del manual incluso si falla la base de datos o corre de forma local.
* **[2026-06-11] AppArmado_v20 / Manual_Bake_v4_Correccion — Precisión de Rotación por Cuaterniones, Corrección Antiflip y Ajuste de Parent Inverso (matrix_parent_inverse):**
    - **Precisión de Rotación por Cuaterniones**: Se modificó el script de horneado (`bake_geometry_nodes_v4.py` y `bake_geometry_nodes.py`) para forzar temporalmente el modo de rotación de todas las piezas a `QUATERNION` antes de aplicar los keyframes y restaurar el estado original en la reversión. Esto elimina por completo el Gimbal Lock y los saltos de interpolación característicos de los ángulos de Euler, evitando que el fondo rote de forma descontrolada o al revés en la interpolación entre frames.
    - **Corrección de Cuaternión Antiflip**: Se programó un filtro de continuidad en el tiempo. Si el producto punto del cuaternión calculado y el del frame anterior es negativo ($q \cdot q_{prev} < 0$), se niega el cuaternión ($q = -q$), forzando a la interpolación slerp en Three.js/GLTF a tomar el camino de rotación física más corto.
    - **Ajuste de Parent Inverse en Jerarquías**: Se descubrió que Blender calcula las transformaciones locales de los hijos multiplicando la matriz del padre y la matriz de parentesco inverso (`matrix_parent_inverse`). Si un objeto (como los fondos superiores) fue emparentado manteniendo su transformación original, no tener en cuenta esta propiedad causaba rotaciones oblicuas incorrectas y deformaciones diagonales. Se refinó la fórmula local a `matrix_local = (parent_matrix @ orig_obj.matrix_parent_inverse).inverted() @ world_matrix` con fallback en caso de escala cero, logrando una precisión absoluta del 100% que impide colisiones del fondo con la estructura en el GLB.

* **[2026-06-13] bake_geometry_nodes — Diagnóstico, Evolución y Estabilización Final (v6 a v18):**
    - **Contexto del Problema**: Se analizó el comportamiento errático del script de horneado de animaciones de Blender Geometry Nodes (`bake_geometry_nodes`) al exportar archivos GLB. Tras múltiples iteraciones entre la versión v6 (estable inicial) y la v18 (solución definitiva), se identificaron fallas críticas de geometría vacía, desincronización y rotaciones oblicuas (cizalladura) causadas por jerarquías de parentesco complejas al escalar a cero.
    - **Tabla Comparativa de la Evolución de Versiones**:
      
      | Versión | Problema Observado | Causa Raíz Identificada |
      | :--- | :--- | :--- |
      | **v6** | Bloqueo/Crash `ValueError: matrix does not have an inverse` en modelos como P08. | Los objetos padres vacíos heredan escala `0` de `mueble_principal`, lo que resulta en matrices singulares (determinante = 0) no invertibles. |
      | **v7 - v8** | GLB vacío (sin geometría 3D visible). | Los objetos se exportan ocultos ("ojitos apagados" / `hide_viewport=True`). El script desactivaba Geometry Nodes pero no los hacía visibles. |
      | **v9 - v11** | El objeto se inicia rotado 180° y presenta un tambaleo brusco en el frame 49. | Introducción del "Motor Orbital" (padre vacío) con `matrix_parent_inverse = Identidad` en lugar de la inversa real, sin protección de flip de cuaternión en el motor. |
      | **v12 - v13** | GLB vacío de nuevo. | El Motor Orbital hereda escala real; al dividir por un valor cercano a cero, las coordenadas explotan a más de 100 km, y el exportador GLTF descarta la jerarquía. |
      | **v14** | Las piezas rotan 90° de forma independiente (cizalladura/shear). | El Motor Orbital fuerza escala `(1,1,1)` mientras el mueble tiene escala no uniforme, rompiendo la descomposición de escala de los hijos rotados. |
      | **v15 - v16** | GLB vacío. | Reincidencia en la explosión de coordenadas al heredar la escala de vuelta por el Motor Orbital. |
      | **v17** | GLB vacío. | Retorno a la arquitectura de la v6, pero con herencia de escala 0 en Empties y objetos ocultos. |
      | **v18 ✅** | **¡Perfecto y 100% Estable!** Sin deformaciones ni pérdidas de geometría. | **Eliminación absoluta de jerarquías de parentesco**. Cada pieza obtiene y hornea sus coordenadas directamente en el espacio del mundo (World Space). Los objetos se fuerzan como visibles de forma explícita. |

    - **Arquitectura Ganadora de la Versión v18**:
      1. **Fase 1 (Lectura Procedimental)**: Lee y guarda en memoria todas las transformaciones de las instancias generadas por Geometry Nodes, frame por frame.
      2. **Fase 1.5 (Filtro Anti-GiroLoco)**: Para frames con escala crítica ($\le 0.001$), sustituye la rotación por la más cercana de un frame visible y válido.
      3. **Fase 2 (Desactivación)**: Desactiva por completo los modificadores de Geometry Nodes.
      4. **Fase 3 (Desvinculación Jerárquica)**: Elimina el parentesco de todos los objetos, los unifica en modo de rotación `QUATERNION` y los hace visibles (`hide_set`, `hide_viewport` y `hide_render` en `False`).
      5. **Fase 4 (Horneado Directo)**: Escribe keyframes de posición, rotación y escala directamente en el espacio de coordenadas del mundo (sin padres), aplicando un filtro antiflip de cuaternión.
      6. **Fase 4.5 (Limpieza)**: Elimina mallas emisoras temporales (`Plane`, `Plane.001`, etc.).
      7. **Fase 5 (Exportación Optimizada)**: Exporta a formato GLB usando compresión de malla Draco y combinando las animaciones activas en un único clip.
      8. **Fase 6 (Reversión)**: Ejecuta una reversión automática del archivo `.blend` para no ensuciar el archivo de trabajo.
    - **Lección Aprendida**: La simplicidad estructural superó a los esquemas jerárquicos complejos. El horneado directo en coordenadas de mundo evita singularidades matemáticas por escala cero e incompatibilidades de deformaciones oblicuas en exportadores WebGL.

* **[2026-06-13] AppArmado_v21 / Plataforma_v9 — Internacionalización, Espaciado del Menú y Modo Estudio 3D (Manual_Entorno_mejorado):**
    - **Internacionalización Completa a Inglés (EN)**: Se tradujeron de manera dinámica todas las cadenas textuales de la interfaz del visor 3D al cambiar a "EN". Esto incluye las 8 nubes/bocadillos del tutorial de ayuda, los tooltips de piezas, la lista de herrajes activos, el panel inferior de total de cantidades, el panel lateral de tips generales y el modal flotante de Realidad Aumentada con su código QR. Para preservar la funcionalidad de búsqueda de tips en español en la base de datos, se implementó el atributo `data-tip-key` que mantiene el filtro nativo sin alterar el texto visible del usuario.
    - **Ajuste de Margen y Alineación en Herrajes**: Se corrigió el espaciado vertical del botón de total de cantidades en el panel inferior. Al mover el contenedor dentro de la lista `.menu` e igualar sus estilos en `PanelHerrajes.css`, ahora hereda un `gap: 20px` idéntico al de las tarjetas de herrajes individuales, resolviendo la desalineación visual.
    - **Modo Estudio 3D (Estilo Spline) con Sombras Reales**:
        - Se implementó la opción de alternar entre el ambiente de habitación clásico (skybox 360 y piso texturizado) y el "Modo Estudio 3D" digital.
        - En Modo Estudio, se desactivan el skybox y el piso texturizado, y se renderiza una escena limpia con color de fondo plano, niebla (`fog`) y una cuadrícula de referencia (`gridHelper`).
        - Se habilitaron sombras WebGL reales en el piso. La malla de suelo (`30x30`) recibe sombras suaves y se integra de manera invisible con el fondo plano mediante la niebla, logrando un efecto digital de espacio infinito continuo.
    - **Control CMS y Persistencia**: Se añadieron las columnas `tipo_ambiente` (text, default `'habitacion'`) y `color_ambiente` (text, default `'#e8e8e8'`) a la tabla `public.configuraciones_manual` en Supabase. El modal de edición de proyectos en la plataforma Next.js (`detalle-proyecto-modal.tsx`) se actualizó para incluir un selector de ambiente y un picker de color interactivo que se guardan y leen en Supabase, y se transmiten al visor 3D.

* **[2026-06-15] AppArmado_v22 / Plataforma_v10 — Estilo de Títulos 'Underline Glow', Sombra Tonal Basada en el Secundario y Bypass Resiliente por Timeout:**
    - **Estilo de Títulos 'Underline Glow'**: Reemplazo del estilo 'Delineado' (`stroke`) con renderizado pixelado en navegador por 'Subrayado de Acento (Underline Glow)'. Implementa una línea degradada de acento brillante al fondo del texto mediante pseudo-elementos `::after`.
    - **Sombra Tonal Táctil**: Sustitución de la sombra de texto dura gris (`rgba(0,0,0,0.4)`) por una mezcla tonal basada en el color secundario (`color-mix(in srgb, var(--secondary) 40%, transparent)`), logrando una integración de color premium que previene halos grises en el fondo 3D.
    - **Mecanismo de Bypass de Carga por Timeout**: Adición de un temporizador de respaldo en `PanelInicial.jsx` que a los 6 segundos de inactividad o lentitud en la respuesta de la red del storage de Supabase, auto-completa la barra al 100% y activa el botón "Iniciar" para garantizar accesibilidad en conexiones lentas o bloqueadas.

* **[2026-06-16] AppArmado_v23 / Manual_Online — Assets con Path Absoluto, Soporte Multi-Animación y Bypass de Caché de Sesión**:
    - **Resolución de Carga de Assets en Producción**: Implementación de una utilidad de prefijo dinámico (`assets.js`) para redirigir correctamente las llamadas de assets locales estáticos y de manuales cuando la app se carga embebida bajo la subruta proxy `/embed/armado/*` en `mariomojica.com`.
    - **Bypass de Limitación de Proxies en Netlify**: Configuración de reglas explícitas de proxy en `netlify.toml` del portfolio y del homepage para desviar recursos dinámicos (`models`, `sounds`, `herrajes`) directamente hacia el storage de Supabase, evitando el encadenamiento de proxies de Netlify que provocaba errores 404.
    - **Exclusión de Assets Estáticos Locales**: Adición de reglas prioritarias en `netlify.toml` para asegurar que las carpetas locales de la aplicación (`/assets/`, `/textures/`, `/Matcaps/`, `/hdri/`, `/manual-vacio/`) se sirvan desde el CDN de Netlify del visor en vez de enviarse a Supabase.
    - **Configuración de base path absoluto en Vite**: Migración de `base: './'` a `base: '/'` en `vite.config.js` para asegurar que el bundle del visor busque sus recursos de sistema en rutas absolutas, previniendo secuestros por parte de las reglas dinámicas.
    - **Soporte para Múltiples Clips de Animación**: Actualización del componente `Model.jsx` para iterar y reproducir simultáneamente todos los clips de animación contenidos en el GLB de pasos, dando soporte nativo a manuales complejos con tracks de animación segmentados.
    - **Bypass de Caché por Session Cache Buster**: Inyección de una variable única de sesión (`?v=sessionBuster`) en las solicitudes de assets locales y dinámicos en `assets.js`, lo que obliga al navegador y al CDN de Netlify a buscar y descargar los nuevos assets en caliente tras recargar la página en lugar de leer versiones viejas del caché.

* **[2026-06-16] AppArmado_v24 / Plataforma_v11 — Centrado de Nubes de Ayuda, Subidas Robustas SVG/PDF y Remoción de Renders**:
    - **Centrado y Rediseño de Flechas en Nubes de Ayuda (Móvil)**: Ajuste en `PanelAyudas.css` para que en pantallas móviles todas las nubes de ayuda se posicionen respecto al contenedor `.contenedor1-1` y se centren horizontalmente en la pantalla (`left: 50%; transform: translateX(-50%)`), evitando desbordamientos laterales. Se desplazaron individualmente las flechas mediante offsets exactos (`-62px`, `0px`, `+62px`, `+124px` para arriba, y `-120px`, `+120px` para abajo) para apuntar con precisión a sus botones de origen.
    - **Mapeo de Tipos MIME en Subida (Bypass de CORS/Failed to fetch)**: Corrección de un fallo recurrente al subir archivos `.svg` y `.pdf` en Windows donde el navegador reporta un tipo MIME vacío, provocando rechazos del WAF o CORS preflight. Se implementó un mapeo de extensiones seguro en `handleRealUpload` de la plataforma para asignar de forma explícita `image/svg+xml`, `application/pdf`, etc.
    - **Eliminación de Renders 3D en el Modal**: Se removió el acordeón y la opción de subir "Renders Fotorealistas 3D" en el panel administrativo.
    - **Visualización y Eliminación de Garantía y Herramientas**: Integración de soporte para eliminar imágenes de herramientas y documentos de garantía del Storage de Supabase y reiniciar sus estados con iconos de papelera en el modal.

* **[2026-06-16] AppArmado_v25 / Plataforma_v12 — Corrección de Redirecciones Netlify, Fullscreen por Rotación Móvil y Acoplamiento de Nubes**:
    - **Redirección de Assets**: Se corrigió el orden de las reglas de proxy en `netlify.toml` de todos los proyectos (`legacy-aplicativo-armado`, `mariomojica-portfolio` y `mario-mojica-homepage`) y en `public/_redirects` de la aplicación de armado. Se colocó la regla de archivo individual (`/:manualId/:file`) antes de la regla general de categoría (`/:manualId/:category/*`), evitando que Netlify añada una barra diagonal al final (ej. `herramientas.svg/` o `garantia.pdf/`) que provocaba errores 404 de Supabase Storage.
    - **Fullscreen automático al girar la pantalla**: Inyección de un `useEffect` robusto en `AssemblyPage.jsx` para dispositivos móviles que detecta la orientación landscape y solicita `requestFullscreen()` en el elemento raíz del documento. Para saltar las políticas de seguridad de gestos de usuario (User Gesture), se añaden listeners temporales de toque/clic en la pantalla tras la rotación que activan el fullscreen inmediatamente al interactuar. Al regresar a portrait, se sale de fullscreen mediante `exitFullscreen()`.
    - **Alineación de nubes y z-index**: Se incrementó el `z-index` de `.contenedor` en `NavBarInferior.css` a `1000` para garantizar que las nubes se rendericen por encima del botón flotante de AR (el cual tiene `z-index: 50`). Además, se redefinieron de forma asimétrica e individual las nubes superiores (`ayuda1` a la izquierda, `ayudaLuz` al centro, y `ayudaVelocidad`/`ayudaIdioma` a la derecha con `right: 4px`) para evitar desbordes y alinear milimétricamente sus flechas en cualquier celular. Las nubes inferiores `.ayuda3`, `.ayuda4` y `.ayuda5` se elevaron en la media query de `PanelAyudas.css` a `bottom: 80px !important` y se centraron horizontalmente (`left: 50% !important`, `transform: translateX(-50%) !important`), de modo que floten elegantemente sobre los botones inferiores y dejen el slider de pasos y el play/pausa 100% visibles y libres de obstrucción.

* **[2026-06-17] AppArmado_v26 / Plataforma_v13 — Alineación Milimétrica a 2px de Nubes y Ajuste de z-index para AR en Móviles**:
    - **Alineación Vertical Milimétrica (La Luz de 2px)**:
        - Se configuró la altura de la barra superior en móviles (`.contenedor1`) a un valor fijo de `52px !important` en `NavBarSuperior.css`.
        - Se redefinieron los valores de `top` de las burbujas superiores a `56px !important` en `PanelAyudas.css`, lo que posiciona la punta de sus flechas en `50px`, dejando una luz de separación de exactamente **2 píxeles** con respecto al borde inferior de los botones (`48px`).
        - En la barra inferior, se bajaron y acoplaron las nubes a sus respectivos botones: `ayuda3` (Navegación) a `bottom: 60px !important` (dejando 2px con el círculo central del paso de 52px), y `ayuda4` (Buscador) y `ayuda5` (Play/Pausa) a `bottom: 56px !important` (dejando 2px con los botones de 44px).
    - **Alineación Horizontal Asimétrica e Individual de Nubes Inferiores**:
        - Se configuró `ayuda4` (Buscador) a `left: 4px !important; right: auto !important; transform-origin: left bottom !important` con su flecha en `left: 22px !important` (apuntando al botón de la lupa `Q`).
        - Se configuró `ayuda5` (Play/Pausa) a `right: 4px !important; left: auto !important; transform-origin: right bottom !important` con su flecha en `right: 22px !important; left: auto !important` (apuntando al botón de play `▶`).
    - **Interactividad del Botón de AR (z-index)**:
        - Para que el botón flotante de AR se dibuje por encima de la burbuja `ayuda5` y permanezca 100% interactivo y en primer plano en móviles, se incrementó el `z-index` de `.AR` a `1001 !important` in `RealidadAumentada.css`, superando el `z-index: 1000` de `.contenedor` que agrupa las nubes.

* **[2026-06-17] AppArmado_v26.1 — Aumento de Distancia Vertical y Simetría de Botones Superiores**:
    - **Separación de la Barra Superior y Botón Cerrar**: Incrementado el `top` del contenedor `.contenedor1` (botones superiores) y del botón de cerrar `.cerrar` en móviles a `50px !important` (y a `40px !important` en pantallas extra pequeñas de 320px). Esto aleja la UI superior de la barra de direcciones del navegador del teléfono móvil en 30px adicionales, mejorando drásticamente el aire visual y logrando una simetría armónica respecto a la holgura de la barra inferior.
    - **Alineación con Nubes de Ayuda**: Al ser `.contenedor1-1` el ancestro posicionado relativo de las nubes superiores en móviles, el desplazamiento vertical de la barra superior arrastra automáticamente las burbujas asociadas, manteniendo de forma blindada la luz de separación de 2px de las flechas.

* **[2026-06-17] AppArmado_v27 — Solución de Carga Errática en AR Móvil y Preload Dinámico de GLBs**:
    - **Solución al Botón "VER EN TU ESPACIO"**: Se modificó la renderización del botón `#inicio` en [PanelInicial.jsx](file:///c:/Desarrollo/mmapp/legacy-aplicativo-armado/src/features/AssemblyInstructions/components/NavBarInferior/PanelInicial/PanelInicial.jsx) para que esté siempre presente en el DOM de React en lugar de renderizarse de forma condicional sobre `displayProgress === 100`. Su visibilidad se controla dinámicamente mediante `display: (displayProgress === 100 || progress >= 100) ? "flex" : "none"`, evitando referencias nulas en el DOM al intentar acceder por ID y asegurando la aparición instantánea del botón cuando se completa la carga de Three.js.
    - **Simulación de Carga Progresiva**: Se refinó la lógica de carga para que el indicador aumente paulatinamente hasta el 90% y dé el salto final al 100% una vez la red o el storage de Supabase hayan entregado el archivo.
    - **Preload Dinámico de Modelos Adyacentes (Rendimiento 3D)**: Se introdujo un hook `useEffect` en [Model.jsx](file:///c:/Desarrollo/mmapp/legacy-aplicativo-armado/src/features/AssemblyInstructions/3d-escene/Model.jsx) que ejecuta `useGLTF.preload()` para los pasos `pasoActual + 1` y `pasoActual - 1`. Esto permite que el navegador descargue en segundo plano los archivos `.glb` correspondientes a los pasos inmediatos, haciendo las transiciones de ensamble instantáneas y suprimiendo las molestas pantallas vacías provocadas por el unmount de Suspense.

* **[2026-06-17] AppArmado_v27.1 — Interacción Táctil de Tooltips de Piezas y Posicionamiento Fijo**:
    - **Interacción Táctil (Mobile/Touch)**: Se implementó un detector de dispositivos táctiles (`isTouchDevice`) para separar la interacción por hover de la interacción por toque. En móviles, se ignoran los eventos de cursor `onPointerEnter` y `onPointerLeave` para evitar atascos de resaltado, y en su lugar se utiliza un manejador `onClick` en [Model.jsx](file:///c:/Desarrollo/mmapp/legacy-aplicativo-armado/src/features/AssemblyInstructions/3d-escene/Model.jsx) (`handleTouchSelect`) para seleccionar y deseleccionar piezas mediante pulsaciones.
    - **Posicionamiento Fijo en Celular**: En dispositivos táctiles, el tooltip se renderiza centrado horizontalmente en la pantalla y posicionado dinámicamente a exactamente 10px por debajo del borde inferior de la barra de botones superiores (calculado mediante `getBoundingClientRect()` de `.contenedor1-1` o `.contenedor1` en [AssemblyViewer.jsx](file:///c:/Desarrollo/mmapp/legacy-aplicativo-armado/src/features/AssemblyInstructions/AssemblyViewer.jsx)). Esto evita que la mano del usuario tape el tooltip flotante al interactuar con el modelo.
    - **Deselección y Reset por Clic en Fondo**: Se añadió la propiedad `onPointerMissed` al canvas de R3F en [AssemblyViewer.jsx](file:///c:/Desarrollo/mmapp/legacy-aplicativo-armado/src/features/AssemblyInstructions/AssemblyViewer.jsx) para que al pulsar sobre el fondo/espacio vacío se limpien la selección y el tooltip activo, restaurando de manera coordinada el material original de la pieza resaltada mediante un efecto `useEffect` en [Model.jsx](file:///c:/Desarrollo/mmapp/legacy-aplicativo-armado/src/features/AssemblyInstructions/3d-escene/Model.jsx).

* **[2026-06-17] Plataforma_v13.1 — Solución a Pausas del Generador de Audio TTS en Producción**:
    - **Restauración de Silencios Reales (Base64)**: Se corrigió un error en la API [/api/tts/route.ts](file:///c:/Desarrollo/mmapp/mario-mojica-plataforma/app/api/tts/route.ts) donde la generación de silencios programada online mediante `synthesizeTts("...", voice)` no producía ningún silencio real perceptible. Se reincorporó el búfer binario de 1 segundo de silencio puro precargado vía Base64 (`SILENT_MP3_BASE64`) para la concatenación, el cual es 100% compatible con el decodificador de MP3 de HTML5 Audio del cliente y no tiene dependencias de binarios locales (evitando la necesidad de llamadas a `edge-tts` por CLI o scripts Python, lo que hacía fallar la API local en la nube).

* **[2026-06-17] Plataforma_v14 / AppArmado_v28 — Estabilización de Pausas TTS por Limpieza de Cabeceras ID3 y Edición Dinámica de Ayudas de Interfaz**:
    - **Estabilización de Pausas TTS (Limpieza ID3)**: Se identificó que al concatenar múltiples segmentos de MP3 (de silencios y voz), la presencia de metadatos/cabeceras ID3v2 intermedias en medio del flujo provocaba que el decodificador de audio del navegador web se detuviera de forma abrupta. Se implementó una función `stripId3` en [route.ts](file:///c:/Desarrollo/mmapp/mario-mojica-plataforma/app/api/tts/route.ts) para limpiar todas las cabeceras ID3v2 de los bloques de silencio y de los segmentos de texto intermedios, logrando que el audio resultante se reproduzca fluidamente sin interrupciones.
    - **Sección CMS de Ayudas de Interfaz**: Creación de la sección **8. Ayudas de Interfaz y Calibrador** en el modal de detalles del proyecto. Permite pre-cargar automáticamente los textos actuales y editar en caliente los títulos y descripciones en español e inglés de las 8 nubes de ayuda de la interfaz, sincronizándolas con la columna `ayudas_texto` (`jsonb`) en la base de datos Supabase.
    - **Traducción Automática**: Integración de un botón de traducción automática con el endpoint `/api/translate` para las versiones en inglés de las 8 burbujas de ayuda en el CMS.
    - **Mapeo Dinámico en el Visor**: Modificaciones en [AssemblyPage.jsx](file:///c:/Desarrollo/mmapp/legacy-aplicativo-armado/src/pages/AssemblyPage.jsx), [NavBarSuperior.jsx](file:///c:/Desarrollo/mmapp/legacy-aplicativo-armado/src/features/AssemblyInstructions/components/NavBarSuperior/NavBarSuperior.jsx), [NavBarInferior.jsx](file:///c:/Desarrollo/mmapp/legacy-aplicativo-armado/src/features/AssemblyInstructions/components/NavBarInferior/NavBarInferior.jsx) y [RealidadAumentada.jsx](file:///c:/Desarrollo/mmapp/legacy-aplicativo-armado/src/features/AssemblyInstructions/components/NavBarSuperior/RealidadAumentada/RealidadAumentada.jsx) para leer en tiempo real las personalizaciones de las nubes del manual e inyectar el parámetro `data` correspondiente.
    - **Limpieza de UI**: Eliminación del botón redundante "Abrir Calibrador UI" del pie de página del modal del CMS, centralizando la funcionalidad de calibración en la nueva sección de ayudas.

* **[2026-06-18] AppArmado_v29 / Manual_Metricas — Integración de Spline, SEO Local (WebP) y Resoluciones Táctiles vs PC**:
    - **Optimización SEO y Open Graph**: Conversión a WebP de la imagen `Banner_Manual` y vinculación mediante rutas absolutas/relativas en `index.html` para previsualizaciones ricas (Rich Snippets) al compartir por WhatsApp o redes sociales.
    - **Clean Embed de Spline 3D**: Ajuste de iframe de bienvenida en `PanelInicial.jsx` removiendo `?v=8` para asegurar la última versión de la escena. Eliminación del atributo nativo `title="Spline 3D Scene"` para suprimir tooltips de sistema operativo no deseados.
    - **Corrección de Margen "Iniciar" (UI/UX Mobile)**: Reseteo de `margin-top: 0` para el botón de inicio en `PanelInicial.css` en dispositivos táctiles, permitiendo que la suma con el padding padre lo ubique perfectamente a 40px del tope de la pantalla, evitando el traslape con la gráfica 3D "M M".
    - **Resolución de Race Condition en Tooltips (PC vs Móvil)**: Se arregló un bug crítico donde el hover en dispositivos de escritorio dejaba las piezas 3D resaltadas permanentemente. La causa era la supresión de la restauración síncrona en `onPointerLeave` durante el fix táctil previo, que generaba colisiones con actualizaciones asíncronas de Zustand (`globalPiezaHerraje === ""`). Se reimplementó `event.object.material = originalMaterials.current.get(event.object)` síncronamente en `onPointerLeave` sólo para PC, separando definitivamente ambos ecosistemas interactivos.

* **[2026-06-19] Plataforma_v15 / Online_1 — Imagen de Perfil Interactiva, Soporte de Cámara en Vivo, Crop & Rotate Premium y Sincronización en Sidebar**:
    - **Uploader con Modal y Captura de Cámara**: Creación de un modal animado oscuro con Framer Motion en [/configuracion](file:///c:/Desarrollo/mmapp/mario-mojica-plataforma/app/(dashboard)/configuracion/page.tsx) con carga de archivos y soporte nativo para captura en vivo desde la webcam utilizando la API de navegador `getUserMedia`.
    - **Herramientas de Ajuste "Crop & rotate"**: Implementación de controles interactivos con arrastre fluido (Pan) por eventos de puntero y zoom de escala del 100% al 300% regulado por un control deslizante (slider) dentro de una máscara de recorte circular con guías blancas.
    - **Procesamiento de Alta Fidelidad en Canvas**: La función `applyCropAndRotate` computa la traslación, escala y rotaciones a 90° acumulativas para exportar una imagen Base64 JPEG optimizada de 150x150 píxeles.
    - **Galería con Doble Carrusel Deslizable**:
      - *Franja 1:* 20 personajes/avatares no woke (10 masculinos y 10 femeninos tradicionales con fondos de colores vibrantes y pasteles).
      - *Franja 2:* 20 ilustraciones abstractas de figuras y objetos coloridos.
      - Ambos carruseles cuentan con flechas de desplazamiento independientes y comportamiento scroll suave.
    - **Sincronización del Perfil**: El avatar seleccionado se asocia físicamente al perfil del usuario actual, actualizándose al instante en la cabecera ([topnav.tsx](file:///c:/Desarrollo/mmapp/mario-mojica-plataforma/components/layout/topnav.tsx#L169-L174)) y el selector de roles del menú del pie del lateral ([sidebar.tsx](file:///c:/Desarrollo/mmapp/mario-mojica-plataforma/components/layout/sidebar.tsx#L154)).

* **[2026-06-22] Plataforma_v16 / Landing_GTM — Respaldo de Landing Page Original y Enfoque de Lanzamiento (Manuales 3D B2B):**
    - **Respaldo de Landing Page**: Creación del archivo de respaldo [page.original.bak](file:///c:/Desarrollo/mmapp/mario-mojica-homepage/src/app/page.original.bak) para conservar la estructura del home general mientras se re-enfoca la landing comercial hacia el Manual de Armado 3D interactivo.
    - **Actualización del Manifiesto de Negocio**: Redacción e integración en [MANIFIESTO_NEGOCIO.md](file:///c:/Desarrollo/mmapp/docs/MANIFIESTO_NEGOCIO.md) de las secciones de Go-To-Market (GTM) y Puesta en Marcha, consolidando el manual interactivo 3D como el "Caballo de Troya" B2B para la captación de clientes de la industria RTA y la integración de métricas ejecutivas.

* **[2026-06-22] Landing_GTM_v2 — Implementación de la Nueva Landing B2B (Manual de Armado 3D):**
    - **Estrategia de Respaldo Completo**: Creación de la carpeta `mario-mojica-homepage/src/components/_original_backup/` con copia íntegra de los 10 componentes originales (Hero, Brands, WhyChoose, HowItWorks, DetailedFeatures, CurationSection, MaximizePotential, ProcessVideo, Showcase, FinalCTA). Combinado con el `page.original.bak` ya existente, permite revertir la landing anterior al 100%.
    - **Estrategia de Reversión Documentada**: Para restaurar la landing anterior: (1) Copiar `page.original.bak` → `page.tsx`, (2) Restaurar componentes desde `_original_backup/`, (3) No se necesita revertir `globals.css`, `layout.tsx` ni el design system (se mantienen intactos).
    - **Nuevos Componentes Implementados** (8 componentes nuevos para el enfoque B2B):
      - `HeroManual.tsx` — Hero enfocado en el dolor de devoluciones por armado de muebles RTA.
      - `SocialProof.tsx` — Franja de métricas de impacto rápido (reducción reclamos, soporte, tasa finalización).
      - `PainVsSolution.tsx` — Contraste visual: manual de papel vs. manual 3D interactivo.
      - `LiveDemo.tsx` — Iframe embebido del visor 3D interactivo real del manual.
      - `ProductFeatures.tsx` — 6 tarjetas de características (TTS, WebAR, Herrajes, Branding, QR, PBR).
      - `MetricsSection.tsx` — Sistema de analíticas ejecutivas: funnel de retención, tasa de finalización, sentimiento.
      - `ClientPortal.tsx` — Portal B2B: acceso autenticado, branding autogestionable, descarga de QR.
      - `HowItWorksSteps.tsx` — Proceso de integración en 3 pasos para el fabricante.
      - `FAQ.tsx` — Preguntas frecuentes B2B sobre integración, tiempos y costos.
      - `ContactCTA.tsx` — Formulario de captura de leads B2B con campos específicos.
    - **Componentes Modificados**: `Header.tsx` (navegación actualizada), `Footer.tsx` (enlaces ajustados), `layout.tsx` (metadata SEO para Manual de Armado).
    - **Componentes Eliminados del Render**: `Showcase.tsx`, `ProblemSolution.tsx`, `GondolaViewer.tsx` (no aplicables al nuevo enfoque).



* **[2026-06-22] Landing_GTM_v2 (Fixes) - Reparación de Modo Oscuro, Permisos AR y Cola de Telemetría**:
    - **Dark Mode Global y Header Dinámico**: Restauración de la clase `dark` en la raíz de `layout.tsx` para hacer cumplir los Brand Guidelines (Obsidian Teal). Se parcheó `Header.tsx` con colores translúcidos (`bg-[#0a0a0a]/90`) y filtros de logo invertidos (`brightness-0 invert`) para legibilidad sobre el carrusel y en scroll.
    - **Violaciones de Política de Iframe (AR)**: Solución de advertencia `[Violation] Permissions policy violation: xr-spatial-tracking` inyectando los atributos `allow="xr-spatial-tracking; fullscreen; autoplay; web-share"` en el `LiveDemo.tsx` que aloja el Model Viewer.
    - **Cola de Eventos de Telemetría (Evitar 400)**: Corrección de error `400 Bad Request` en `telemetria_manuales`. Se implementó un `eventQueue` en `useTelemetry.js` (legacy-aplicativo-armado) para atrapar eventos prematuros (ej: tracking de paso 1 al montar) y retenerlos en memoria hasta que Supabase resuelva el `proyecto_id`.
    - **Navegación Fluida Landing-Plataforma**: Ajuste de enlaces del `Footer.tsx` (`Aviso de Privacidad` y `Términos`) apuntando a la plataforma B2B con soporte `window.history.back()` nativo.

* **[2026-06-23] AppArmado_v30 — Blindaje Legal Fase 3, Limpieza de Encuesta y Capa de Traducción de Alias**:
    - **Eliminación de Módulo Inactivo**: Se borró por completo el panel de encuesta (`PanelEncuesta` y `FormularioEncuesta` con sus respectivos CSS) y el logo de Maderkit (`Logo_Maderkit_blanco.svg`) para eliminar todo riesgo relacionado con Habeas Data o marcas previas.
    - **Remoción de Paridad CSS en Landscape**: Se eliminó `Landscape.css` e integraron las reglas CSS directamente como clases responsivas de Tailwind CSS en `Landscape.jsx`, alterando la firma del código de diseño.
    - **Garantía Premium con Marca**: Se implementó una garantía genérica y limpia de la plataforma en `Garantia.pdf` y se subió localmente y al storage de Supabase en `M00001/garantia.pdf`.
    - **Traducción de Alias (Mapeo de Mallas GLB)**: Se definió un diccionario de alias (`nameAliases`) y la función `resolveAlias` en `assets.js` para interceptar nombres de mallas que aún contienen códigos SKU de Maderkit (como `Caja_0002715` o `Perno_0007374`) y traducirlos a nombres limpios en `PanelHerrajes.jsx`, `PanelCantidades.jsx` y `Model.jsx`. Esto restaura las imágenes de los herrajes y limpia la UI en caliente sin obligar a re-exportar el GLB.

* **[2026-06-24] Diagnóstico de WhatsApp Cloud API (Notificaciones de Leads)**:
    - **Contexto**: Se diagnosticó una intermitencia en la recepción de notificaciones de leads de n8n al WhatsApp del administrador. La integración en n8n está validadísima (status 200 y `message_status: accepted` persistente). Hace 2 días se corrigieron los métodos de pago en Facebook Business y funcionó con normalidad.
    - **Hallazgo (Restricción de Conversaciones Iniciadas por la Empresa)**: Se descubrió que Meta estaba reteniendo las plantillas proactivas a menos que el administrador le escribiera a la cuenta de WhatsApp (ej. un "Hola"). Esto ocurre porque Meta aplica restricciones de spam agresivas a cuentas nuevas o **no verificadas**, bloqueando silenciosamente los mensajes "Business-Initiated" (fuera de la ventana de 24 horas), pero permitiendo su entrega inmediata si entran en la ventana de servicio al cliente de 24 horas (User-Initiated).
    - **Lección**: Cualquier fallo futuro donde n8n marque `accepted` pero WhatsApp no suene, recae exclusivamente en bloqueos de la plataforma de Meta Business Suite (por impago, restricción de la calidad de cuenta, falta de verificación empresarial o shadowbans anti-spam).

* **[2026-06-26] Despliegue de Umami, CRM B2B y Blindaje de Métricas (Manual_Metricas)**:
    - **Despliegue de Umami en Producción**: Puesta en marcha de Umami Analytics en el VPS de Hetzner mediante Docker Compose. Se resolvió de manera crítica un problema de disco lleno al 100% (36GB de 38GB) ejecutando una limpieza profunda de capas y contenedores obsoletos en Docker, liberando 16GB de espacio.
    - **Enrutamiento Seguro y Redes**: Se conectó el contenedor `npm_proxy` a la red `internal_network` de Umami para un ruteo directo y seguro de `analytics.mariomojica.com` sin exponer puertos adicionales. Se instaló el certificado SSL Let's Encrypt de forma exitosa.
    - **Estructura CRM en Baserow + n8n**: Modificación de la tabla de Leads (ID `600`) para incorporar el campo `Estado CRM` de selección única y actualización en caliente del flujo n8n para inyectar por defecto el estado `Prospecto`.
    - **Soberanía de Datos**: Creación del endpoint `/api/metrics/collect` en Next.js con rate-limiting (40 llamadas/min) para blindar la base de datos de Supabase contra escrituras directas del cliente. Refactorización de `useTelemetry.js` para despachar eventos POST seguros.
    - **Reporte de Fricción PDF**: Implementación de la vista de reportes dinámica optimizada para impresión física en tamaño A4 (`@media print` con diseño *Tech Ethos*) en la consola y enlace rápido desde el modal de detalles del proyecto.
    - **Ancla Estructural de Arquitectura**: Se consolidó la documentación técnica viva del sistema en el archivo maestro [Arquitectura.md](file:///c:/Desarrollo/mmapp/Arquitectura/Arquitectura.md) y se regeneró el diagrama vectorial [arquitectura_V7.svg](file:///c:/Desarrollo/mmapp/Arquitectura/arquitectura_V7.svg), los cuales sirven como base teórica y mapa visual definitivo para la réplica o mantenimiento de todo el ecosistema B2B de Mario Mojica.

* **[2026-06-24] AppArmado_v31 — Blindaje Legal Fase 4, Refactorización de Escena R3F y Ofuscación de Nombres**:
    - **Renombrado y Estructura en Experience.jsx**: Se renombró el componente principal `Experience` a `AssemblySceneViewer` y se actualizaron funciones internas helper para cambiar su firma (`getTexturesFromAtlasFile` ➔ `parseCubemapTextureAtlas`, `repositionSkybox` ➔ `alignSkyboxToGround`, `CameraOverlay` ➔ `ViewportCameraManager`). Se refactorizaron estados y refs (`useOrbitControls` ➔ `controlsRef`, `toogle` ➔ `isModelVisible`).
    - **Actualización de AssemblyViewer.jsx**: Se migró la importación y renderizado de la escena R3F para usar `AssemblySceneViewer` en lugar del antiguo `Experience`.
    - **Ofuscación y Limpieza en Model.jsx**: Se renombraron variables globales de fallback de cámara (`camera_origin_x` ➔ `defaultCameraPosX`, `focalDistance_origin` ➔ `defaultFov`). Se modificaron funciones y refs internas de control (`obtenerNombreLimpioTooltip` ➔ `cleanMeshIdentifier`, `useModel` ➔ `modelRef`, `originalMaterials` ➔ `materialsCache`, `obtenerNombreDeObjeto` ➔ `resolvePartDisplayName`).

* **[2026-06-24] AppArmado_v32 — Eliminación Definitiva de Código Legado Original (Fase 5)**:
    - **Remoción Completa del Código sin Blindar**: Se eliminó del control de versiones (`git rm -r`) y físicamente de la máquina de desarrollo el directorio `legacy-aplicativo-armado-original` con todos sus submódulos, configuraciones obsoletas y recursos con marcas corporativas de Maderkit.
    - **Aislamiento Total del Visor Blindado**: El aplicativo blindado `legacy-aplicativo-armado` queda establecido como el único visor 3D oficial del proyecto B2B, sin conservar vínculos o históricos locales de la versión de legado anterior.


## 🗓️ Julio 2026

* **[2026-07-01] Automatización Blender — Segmentación de Versiones de Cohesión por Marca (Maderkit vs Politorno)**:
    - **Diferenciación y Coexistencia**: Para evitar colisiones de lógica de nomenclatura entre diferentes fabricantes B2B, se renombraron y segmentaron las dos versiones estables del script de Blender en la carpeta [scripts/](file:///c:/Desarrollo/mmapp/scripts/):
      1. [script_cohesion_Maderkit_v54.py](file:///c:/Desarrollo/mmapp/scripts/script_cohesion_Maderkit_v54.py) (Antiguo `v54`): Conserva la lógica de numeración correlativa secuencial ciega (`contador_global`) y limpieza regex de dígitos finales (`re.sub`). Es 100% estable y compatible con el catálogo del cliente Maderkit.
      2. [script_cohesion_Politorno_v55.py](file:///c:/Desarrollo/mmapp/scripts/script_cohesion_Politorno_v55.py) (Antiguo `v55`): Incorpora el algoritmo de componentes conexas bajo un umbral de solapamiento físico estricto de 1 mm (`margin=0.001`) y la preservación redundante e íntegra de los nombres con dígitos definidos originalmente en Rhino (ej. `Peça 01`, `Peça 06` y sus duplicados diferenciados por Blender con puntos `.001`). Es 100% compatible con el fabricante brasilero Politorno.



* **[2026-07-01] Plataforma CMS ?" Protocolos de Traducción Multilingüe y Reestructuración de Locución (TTS)**:
* **[2026-07-01] Plataforma CMS — Protocolos de Traducción Multilingüe y Reestructuración de Locución (TTS)**:
    - **Protocolos de Traducción Inteligente (PT, EN)**: Implementación de flujos de traducción automática integrando Google Translate y Gemini (fallback avanzado) para la generación de audios TTS en Español, Inglés y Portugués Brasileño.
    - **Preservación Determinística de Etiquetas [pausa: N]**: Diagnóstico y refactorización del endpoint `/api/translate` para extraer pre-traducción y re-insertar post-traducción las etiquetas de pausas de audio. Se implementó un algoritmo avanzado de *Word-Boundary Alignment* que garantiza la reinserción en separadores de puntuación cercanos (espacios, puntos, comas), previniendo roturas sintácticas como `scre[pausa: 3]ws`.
    - **Reestructuración Arquitectónica del Modal CMS**:
        - **Desacoplamiento de Entornos**: El panel de "2. Generador de Audios TTS" fue extraído del tab original (renombrado a "Cargar Insumos CMS") y convertido en una pestaña maestra independiente denominada **"Textos y Locución (TTS)"**.
        - **Persistencia Reactiva**: El campo identificador `Código de Carpeta / Manual` ahora persiste e hidrata en caliente el estado entre ambas pestañas mediante `useState` heredado.
        - **Eliminación de Scroll Anidado**: Se suprimió la contención `max-h-[400px]` del listado de pasos, resolviendo un conflicto crítico de UX (scroll dentro de scroll). Ahora la vista de pasos fluye libremente sobre el frame principal (`max-h-[60vh]`).
        - **Expansión Ergonómica de Textareas**: Multiplicación de la altura base (x5) de los campos de texto del CMS (`rows={15}`, `min-h-[300px]`), mejorando sustancialmente la comodidad de la edición y lectura de los pasos y saludos extensos en los tres idiomas de manera simultánea.

* **[2026-07-02] Plataforma CMS - Robustez en Traducción, Pluralización en Inglés y Alineación de Pausas**:
    - **Cascada de Modelos y Reintentos (Anti-429)**: Incorporación de una cascada secuencial de modelos (`gemini-2.5-flash`, `gemini-flash-latest`, `gemini-2.0-flash`, `gemini-pro-latest`) con reintentos exponenciales en `/api/translate`, previniendo de forma blindada fallos silenciosos por límite de cuota (429).
    - **Inyección de Glosario por Placeholders**: Implementación de una técnica de marcadores temporales (`__GLOS_PL_N__`, `__GLOS_SG_N__`) en el flujo de traducción de Google Translate. Esto permite inyectar con total precisión los términos técnicos del glosario (ej: `"corrediças"`) antes de enviar el texto al motor y restaurarlos después, ofreciendo un comportamiento unificado sin importar el traductor activo.
    - **Pluralización Inteligente en Inglés (Sustantivos únicamente)**: Refactorización de `pluralizeEnglish` para evitar la pluralización redundante de adjetivos en términos técnicos (ej: corregido de *"Flats heads screws"* a *"Flat head screws"*). Ahora el sistema identifica la posición correcta del sustantivo, incluso en presencia de adjetivos descriptivos de orientación/longitud como *"long"*, *"short"*, *"left"* y *"right"*.
    - **Alineación de Pausas por Tiers de Puntuación (Ventana de 35)**: Rediseño de la lógica de reinserción de pausas (`reinsertPauses`) para clasificar separadores en Tier 1 (puntuación/saltos de línea) y Tier 2 (espacios). Al ampliar la ventana de búsqueda a 35 caracteres, el sistema detecta de forma resiliente los finales de oración en cualquier idioma, evitando la inserción de pausas a mitad de una frase o palabra.
    - **Control de Pensamiento de Modelos (20k Tokens) y Alerta de Truncado**: Aumento de `maxOutputTokens` a 20,000 en el backend de traducción para absorber los tokens de razonamiento interno de los modelos avanzados y diseño de un banner interactivo de advertencia (color amarillo, icono `AlertTriangle`) en el modal de detalles del CMS Next.js para informar al usuario de cualquier truncamiento potencial.

* **[2026-07-07] Plataforma CMS — Algoritmos de Escaneo y Clasificación Tridimensional (Maderkit vs Politorno):**
    - **Funcionalidad del Escáner Maderkit**:
      - **Nomenclatura Secuencial**: Basado en un algoritmo que escanea y ordena las mallas por volumen e identifica la numeración lógica asignada a cada pieza mediante expresiones regulares compatibles con nomenclatura con espacios o guiones bajos (ej. `Pieza 07`, `Pieza_07`).
      - **Detección de Jerarquías**: Reconoce relaciones padre-hijo (ej. el panel padre `Pieza 07` y su hijo geométrico `Cubierta-6.001` emparentados en Blender) para agrupar las mallas que componen una misma pieza física.
      - **Traducción de Alias**: Utiliza un mapeo de alias (`resolveAlias`) que traduce códigos SKU o nombres crudos heredados a nombres limpios en caliente, permitiendo asociar imágenes de herrajes en la interfaz del manual interactivo.
    - **Funcionalidad del Escáner Politorno**:
      - **Preservación de Nombres Originales**: Mantención de la numeración y estructura de nombres en portugués exportados desde Rhino/Blender (ej. `Peça 01`, `Peça 06`, `Peça 12`, `Peça 13`), evitando la numeración secuencial ciega.
      - **Clasificación por Espesor y Filtrado de Fondos (MDP)**: Diferenciación entre paneles estructurales de madera (espesor >= 2.5 mm, típicamente 15 mm) y fondos o paneles traseros (`Fundo`, con espesor exacto de 3 mm), mapeando estos últimos automáticamente para forzar su nombre y tipología.
      - **Algoritmo de Unificación por Primitiva Mayor**: Agrupamiento de meshes por su identificador único física y espacialmente. Filtra las mallas por su grosor tridimensional y selecciona la de mayor volumen (`volume = l * w * t`) como la representante del conteo, omitiendo los duplicados de menor volumen (como ranuras, cajetines o el frente duplicado del cajón de menor volumen en `Peça 12`).
      - **Unificación Compuesta por Padre Común**: Solución a una anomalía crítica donde piezas internas del cajón (`Peça 06`, `Peça 07`, `Peça 08`, `Peça 10` / `Fundo`) reportaban cantidad `3` en lugar de `2`. Debido a que Three.js colapsa el árbol optimizando nodos y cuelga estas piezas directamente del frente del cajón (`Peça 12` o `Peça 13`), el escáner implementa ahora un identificador compuesto `${child.parent.uuid}_${nombreLimpio}` cuando no hay coincidencia directa de nombre con el padre. Esto cohesiona de forma perfecta todas las primitivas que comparten el mismo cajón padre, reportando la cantidad exacta de `2` de cada pieza.
      - **Agrupamiento Físico de Herrajes por Proximidad 3D**: Detecta herrajes portugueses en el árbol (`cavilha`, `corrediça`, `parafuso`, etc.) y calcula el centro geométrico de su Bounding Box en coordenadas mundiales. Para herrajes complejos (como correderas) utiliza un umbral de proximidad física de 100 mm, y para herrajes simples (tornillos, tarugos) un umbral estricto de 2 mm. Esto unifica mallas fragmentadas en una única pieza física real, previniendo duplicidades causadas por múltiples primitives de hardware compartiendo espacio.

* **[2026-07-07] Plataforma CMS — Resolución de Nombres y Clasificación Estructurada de Tornillos (Hito PolitornoP01):**
    - **Inversión y Estandarización de Identificadores (M00001)**: Se implementó la lógica en todas las capas del sistema para dividir e identificar correctamente los dos tipos de tornillos de Maderkit (`Tornillo_1` y `Tornillo_2`). Mapeamos el código `Tornillo_0000152` a `Tornillo_2` (Tornillo Largo Estructural Negro, 32 unidades) y `Tornillo_0004705` (junto con `Tornillo_000152`) a `Tornillo_1` (Tornillo Corto Plateado de Rieles, 84 unidades).
    - **Ajustes de Lógica de Limpieza en Código**: Modificación de las funciones `obtenerNombreLimpioTooltip` en `detalle-proyecto-modal.tsx`, `limpiarNombreMalla` en `PanelHerrajes.jsx` y `PanelCantidades.jsx`, y `cleanMeshIdentifier` en `Model.jsx` para blindar y hacer cumplir esta resolución.
    - **Persistencia en Base de Datos**: Actualización en Supabase de la columna `despiece` para el proyecto `M00001` con cantidades e identificadores sincronizados, eliminando la duplicidad genérica de `"Tornillo"` y previniendo la normalización incorrecta.
    - **Bypass de Panel de Cantidades en Paso Inicial**: Corrección en `PanelBtn.jsx` para forzar que el botón principal de la botonera inferior abra el panel de despiece/cantidades directamente si el usuario está en el paso de bienvenida `00`, evitando bloqueos del visor.

* **[2026-07-08] Sincronización de Animación y Encuesta Final (FeedbackModal):**
    - **Contexto del Problema**: En el último paso del manual, la encuesta final de opinión (`FeedbackModal`) se abría antes de que finalizara la animación 3D de las piezas. Esto ocurría porque la activación dependía únicamente de la finalización del audio TTS (`AudioEnded === true`), interrumpiendo visualmente el armado.
    - **Implementación de Sincronización Doble**:
      - Se creó el estado global `AnimationEnded` en [useEnviroment.js](file:///C:/Desarrollo/mmapp/legacy-aplicativo-armado/src/features/AssemblyInstructions/hooks/useEnviroment.js) para monitorear el estado de las animaciones 3D.
      - En [Model.jsx](file:///C:/Desarrollo/mmapp/legacy-aplicativo-armado/src/features/AssemblyInstructions/3d-escene/Model.jsx), se destructuró el `mixer` de Three.js y se configuró un `useEffect` que escucha el evento `'finished'` del mezclador de animaciones. Cuando no hay más acciones de animación en ejecución, se marca `AnimationEnded` como `true`. Si un paso no contiene animaciones, se marca inmediatamente como `true`.
      - En [AssemblyViewer.jsx](file:///C:/Desarrollo/mmapp/legacy-aplicativo-armado/src/features/AssemblyInstructions/AssemblyViewer.jsx), se actualizó el disparador del modal de feedback para exigir ambas condiciones: `AudioEnded === true && AnimationEnded === true`.

* **[2026-07-08] Personalización de Color de Objeto Tocado:**
    - **Contexto del Requerimiento**: Habilitar a los administradores la posibilidad de personalizar el color de realce (highlight) de los objetos 3D (piezas/herrajes) al interactuar con ellos, reemplazando el color rosado estático original.
    - **Base de Datos**: Añadida la columna `color_objeto_tocado` (tipo `text` con fallback `#ec4899`) en la tabla `configuraciones_manual`.
    - **Plataforma CMS**: Añadido selector de color interactivo e input de texto hexadecimal en la pestaña **"Personalización UI"** justo después de "Color de Texto / Iconos" en [detalle-proyecto-modal.tsx](file:///c:/Desarrollo/mmapp/mario-mojica-plataforma/components/proyectos/detalle-proyecto-modal.tsx). Se vinculó al guardado en base de datos.
    - **Visualizador 3D**: Configurada la carga de la variable en el store global de Zustand en [useEnviroment.js](file:///c:/Desarrollo/mmapp/legacy-aplicativo-armado/src/features/AssemblyInstructions/hooks/useEnviroment.js), se inyectó desde la página principal y se aplicó al material de realce de Three.js en [Model.jsx](file:///c:/Desarrollo/mmapp/legacy-aplicativo-armado/src/features/AssemblyInstructions/3d-escene/Model.jsx), con actualización reactiva en caliente si el valor en el store cambia.

* **[2026-07-10] Preservación de Números en Piezas que Comienzan con "Ensamblaje":**
    - **Contexto del Problema**: En el visor y en el CMS, cuando una geometría o pieza contenía un número de paso legítimo al final de su nombre (como `Ensamblaje_Paso_1` que corresponde a las piezas armadas en el paso 1 y que sirve de referencia visual en el paso 2), la regla inteligente de guiones bajos la catalogaba erróneamente como una instancia redundante de Blender/Rhino (al ser un número menor a 100) y eliminaba el dígito, dejando el nombre simplemente como `"Ensamblaje_Paso"`.
    - **Solución y Regla de Blindaje**: Modificación de las funciones de limpieza de identificadores de malla en los 4 archivos críticos del ecosistema para comprobar si el nombre crudo original comienza con `"ensamblaje"` (ignorando mayúsculas/minúsculas). Si es así, se anula la omisión del número de instancia, garantizando la consistencia de visualización para todas las marcas.
    - **Archivos Modificados**:
      - En `legacy-aplicativo-armado`: [Model.jsx](file:///c:/Desarrollo/mmapp/legacy-aplicativo-armado/src/features/AssemblyInstructions/3d-escene/Model.jsx), [PanelCantidades.jsx](file:///c:/Desarrollo/mmapp/legacy-aplicativo-armado/src/features/AssemblyInstructions/components/NavBarInferior/PanelHerrajes/PanelCantidades/PanelCantidades.jsx), [PanelHerrajes.jsx](file:///c:/Desarrollo/mmapp/legacy-aplicativo-armado/src/features/AssemblyInstructions/components/NavBarInferior/PanelHerrajes/PanelHerrajes.jsx).
      - En `mario-mojica-plataforma`: [detalle-proyecto-modal.tsx](file:///c:/Desarrollo/mmapp/mario-mojica-plataforma/components/proyectos/detalle-proyecto-modal.tsx).

* **[2026-07-10] Automatización Blender — Solución Definitiva de Animación Rígida en WebGL mediante Jerarquía de Grupo (Bake V20):**
    - **Contexto del Problema (Inclinación/Convergencia en WebGL)**: Se detectó un defecto crítico donde las piezas cuyo eje largo era paralelo al eje de rotación en Blender (ej. los laterales `Peça 06`/`Peça 07` al rotar sobre Y, o el frente/trasero `Peça 12`/`Peça 8` al rotar sobre X) se inclinaban o convergían al reproducir la animación en motores WebGL (Three.js/Babylon.js). A pesar de que en Blender la animación horneada era 100% paralela (desviación angular y de distancia de 0 mm/0.0000°), WebGL interpretaba de forma errónea las rotaciones sobre mallas con quiralidad invertida o simplificaba las interpolaciones de cuaterniones de forma asíncrona.
    - **Descubrimiento y Descarte de Hipótesis**: Se analizó matemáticamente el archivo GLB y se descartó la teoría de un espejo (mirror de Rhino/Blender), ya que el problema ocurría igualmente en piezas asimétricas y no simétricas cuando el eje de rotación coincidía con el eje largo del objeto. El factor común era que WebGL fallaba al evaluar la rotación alrededor del eje largo local de cada pieza cuando se horneaba de forma independiente en espacio mundo.
    - **Solución Definitiva (Bake Jerárquico V20)**: Se rediseñó el flujo en [scripts/bake_geometry_nodes_v20.py](file:///c:/Desarrollo/mmapp/scripts/bake_geometry_nodes_v20.py), abandonando el horneado independiente en espacio mundo para todas las piezas. La nueva lógica implementa una **jerarquía rígida**:
      1. Se crea un objeto Empty (`Bake_Pivot_Group`) en el centro de rotación (piso `Peça 10`).
      2. Se emparenta a todas las piezas y herrajes (23 objetos) a este Empty Padre central.
      3. Se hornea la animación de transformación en espacio mundo únicamente en el Empty Padre.
      4. Para cada pieza hija, se calcula su transformación **local** (Inversa del Padre x Mundo del Hijo) en cada frame y se hornea en sus canales locales. Durante la fase de rotación rígida, la rotación local de los hijos se mantiene constante (identidad `[0,0,0,1]`), delegando el movimiento por completo al Empty Padre.
    - **Resultados**: En WebGL, al evaluar la animación sobre un único nodo padre, la rotación rígida se hereda por multiplicación de matrices perfecta. Se eliminó por completo el defecto de inclinación, garantizando una rigidez absoluta de todas las partes con un menor tamaño de archivo GLB. La V20 queda declarada como la versión oficial y estable del motor de automatización.


## 2026-07-10: Solución Definitiva a Extracción de Herrajes (V20) y Parche de Interfaz

### Problema Inicial
Tras implementar el flujo de horneado (Baking) de la V20, la aplicación web no lograba extraer los herrajes del paso `P03.glb` (el ensamble del cajón). A pesar de que los herrajes estaban presentes en el archivo, en la interfaz web no aparecía la "Tapa furo adesivo", y en su lugar se mostraba "Tapa tornillo estructural" junto con otros herrajes que parecían pertenecer a la escena.

### Diagnóstico de la Raíz del Problema

1. **El defecto del "Caracter de Reemplazo" en GLTF:**
   Se descubrió que el problema se originaba en el agrupador principal creado por el script de Geometry Nodes. En Blender, el agrupador se llamaba `Peça_Group`. Sin embargo, el exportador GLTF de Blender corrompe ciertos caracteres no ASCII (como la 'ç').
   En el GLB final, el string guardado no era `"Pea_Group"` ni `"Peca_Group"`, sino literalmente `"Pe\ufffdA_Group"`, donde `\ufffd` es el **Caracter de Reemplazo Unicode**.

2. **Fallo en la Lógica de Detección (isPieceName):**
   La función `isPieceName` en `pieceUtils.js` se encarga de excluir los nombres de las piezas de madera para procesar únicamente herrajes y extraerlos del `geometry.name`. Debido a que `"PE\ufffdA_Group"` no coincidía con los sinónimos (ej. `"PEA"`), la función evaluaba a `false`.
   Al ser evaluado como `false`, `PanelHerrajes.jsx` asumía que `Pe\ufffdA_Group` era el nombre base a limpiar (en vez de saltarse al hijo), y como `"Pea_Group"` no es un herraje conocido en `esHerrajeConocido()`, ignoraba en cascada absolutamente **todos** los hijos de ese grupo. Esto causó que **ningún herraje de P03.glb fuera listado.**

3. **El "Espejismo" de los Herrajes Incorrectos en P03:**
   ¿Por qué, entonces, se mostraba "Tapa tornillo estructural" en la lista del paso 3?
   La arquitectura de la aplicación carga múltiples modelos simultáneamente (ej. P01.glb, P02.glb y P03.glb). Los modelos P01 y P02 (escritorio base) tienen herrajes sueltos (fuera de grupos problemáticos). La lógica activa en `PanelHerrajes.jsx` añade *por defecto* al panel de herrajes cualquier nodo de la escena que no tenga un guion (`-`) en su nombre.
   Como resultado, la aplicación estaba leyendo la `Tampa parafuso estrutural` (Tapa tornillo estructural) y los demás tornillos directamente desde `P01.glb` y `P02.glb`, mientras ignoraba completamente el `P03.glb`.

### Soluciones Aplicadas

1. **Parche a Nivel de Interfaz y Lógica (React):**
   - Se actualizó el arreglo `PIECE_SYNONYMS` en `pieceUtils.js` añadiendo explícitamente el caracter de reemplazo Unicode `"PE\ufffdA"`.
   - Para hacer la función absolutamente resistente a cualquier tipo de corrupción de caracteres en el futuro, se implementó una Expresión Regular destructiva: `/^PE.A/i`. Ahora, si el grupo comienza con "PE", tiene cualquier símbolo, y luego una "A", se identificará infaliblemente como madera.
   
2. **Parche Visual ("Hotfix Quemado"):**
   - Para resolver instantáneamente el impacto visual donde "Tapa furo plástico" (del P01) aparecía catalogado como "Tapa tornillo estructural" en lugar del adhesivo, se inyectó un hotfix en `PanelHerrajes.jsx` y `PanelCantidades.jsx`.
   - Se añadió una condición explícita para el paso 03 (`PasoActual === "03"`), donde cualquier herraje extraído que contenga la palabra `"tampa"` o `"tapa"` se sobrescribe de manera absoluta con el `cleanName` `"Tapa furo adesivo"`. Esto obliga a la plataforma a cruzarlo con el glosario, retornando la traducción correcta "Tapones adhesivo" y forzando la textura gráfica correspondiente (`Tapa_furo_adesivo.webp`).

3. **Corrección de la Fuente (Scripts Python):**
   - Para sanear futuros ensambles, el script `bake_geometry_nodes_v20.py` se actualizó para no usar caracteres no ASCII. El agrupador se crea nativamente como `Peca_Group` en lugar de `Peça_Group`.
   
Con esta batería de arreglos y la validación en caliente, la V20 se establece formalmente como la **VERSIÓN ESTABLE**, garantizando la integración sin fricciones entre la topología generada por Blender 4.2 y el aplicativo en React.

* **[2026-07-13] Modo de Arranque Móvil, Fullscreen Directo, Altura del Iframe y Cargador Adaptativo:**
    - **Base de Datos**: Añadida la columna `modo_arranque_movil` (tipo `text` con fallback `'gamma'`) en la tabla `configuraciones_manual`.
    - **Plataforma CMS**: Añadido selector dropdown en la pestaña **"Personalización UI"** de [detalle-proyecto-modal.tsx](file:///c:/Desarrollo/mmapp/mario-mojica-plataforma/components/proyectos/detalle-proyecto-modal.tsx) para elegir entre modo Gamma (interactivo con robot Spline) y Simple (backdrop limpio Mario Mojica).
    - **Aumento de la Altura del Iframe**: Se cambió el aspect ratio del iframe de la demo en [LiveDemo.tsx](file:///c:/Desarrollo/mmapp/mario-mojica-homepage/src/components/LiveDemo.tsx) de `aspect-video` a `aspect-[16/13.5]` (50% más alto en estado inactivo).
    - **Fullscreen Directo desde CTAs**: Se declaró `window.__triggerLiveDemoFullscreen` en la landing page y se interceptó el clic en "Ver Demo Interactiva" en [HeroManual.tsx](file:///c:/Desarrollo/mmapp/mario-mojica-homepage/src/components/HeroManual.tsx) para abrir directamente la pantalla completa.
    - **Cargador Adaptativo de Bienvenida (Modo Demo)**:
      - Se aisló la pantalla de carga del código QR (`isArMode === true`) para mantenerla original.
      - En [PanelInicial.jsx](file:///c:/Desarrollo/mmapp/legacy-aplicativo-armado/src/features/AssemblyInstructions/components/NavBarInferior/PanelInicial/PanelInicial.jsx) y [PanelInicial.css](file:///c:/Desarrollo/mmapp/legacy-aplicativo-armado/src/features/AssemblyInstructions/components/NavBarInferior/PanelInicial/PanelInicial.css), se implementó la clase `.demo-welcome-container` con una media query `@media (max-height: 480px)`. En pantallas cortas u horizontales, el logotipo se desplaza a la izquierda y el cargador con el cubo 3D y los botones se colocan a la derecha, evitando cualquier superposición de textos.
    - **Integración de Controles (Exit Fullscreen con Botón 'X' Simétrico y Ajustes Móviles)**:
      - Removido el botón flotante de maximizar del contenedor principal [LiveDemo.tsx](file:///c:/Desarrollo/mmapp/mario-mojica-homepage/src/components/LiveDemo.tsx).
      - Implementado el botón `.close-fullscreen-btn` (icono Material Symbol "close") directamente fuera del contenedor `.AR` en [RealidadAumentada.jsx](file:///c:/Desarrollo/mmapp/legacy-aplicativo-armado/src/features/AssemblyInstructions/components/NavBarSuperior/RealidadAumentada/RealidadAumentada.jsx) cuando `isFullscreen` es verdadero.
      - Posicionado el botón `.close-fullscreen-btn` en [RealidadAumentada.css](file:///c:/Desarrollo/mmapp/legacy-aplicativo-armado/src/features/AssemblyInstructions/components/NavBarSuperior/RealidadAumentada/RealidadAumentada.css) en `right: 15px; top: 140px` en móviles, alineado en el eje X con el de AR.
      - Añadido soporte de doble disparo de pantalla completa (local e iframe message) en [PanelInicial.jsx](file:///c:/Desarrollo/mmapp/legacy-aplicativo-armado/src/features/AssemblyInstructions/components/NavBarInferior/PanelInicial/PanelInicial.jsx) para asegurar el comportamiento de maximizado en móvil.
      - Condicionado el botón de AR en móviles (`(!isMobile || isFullscreen)`) para ocultarse en el frame de la demo inline y evitar superposiciones con los botones del NavBar superior.
    - **Pausa de Audio al Salir de Fullscreen**:
      - Configurada la intercepción del evento `fullscreenchange` y el mensaje `FULLSCREEN_CHANGE` en [RealidadAumentada.jsx](file:///c:/Desarrollo/mmapp/legacy-aplicativo-armado/src/features/AssemblyInstructions/components/NavBarSuperior/RealidadAumentada/RealidadAumentada.jsx) para pausar la locución del manual (`useEnviroment.getState().PausedAudio()`) en caso de salir del modo pantalla completa, evitando audios en segundo plano.
      - Condicionada la pausa local por evento `fullscreenchange` para ejecutarse únicamente cuando no esté embebido en iframe (`window.self === window.top`), previniendo el auto-pausado al arrancar.
    - **Corrección de Limpieza de Piezas**: Corregido el algoritmo de extracción en [pieceUtils.js](file:///c:/Desarrollo/mmapp/legacy-aplicativo-armado/src/lib/pieceUtils.js) para detectar y recortar sufijos numéricos de duplicados de Blender que pierdan el punto (ej: `11003` -> `11`).

* **[2026-07-14] Rediseño de Gráfico SVG Ensamble Minifix y Estilo Estándar:**
    - **Reglas del Proyecto**: Registrado el tema claro **"Tech Ethos"** en `AGENTS.md` como la estética de diseño predeterminada y recomendada del proyecto.
    - **Rediseño de Ensamble_Minifix.svg**: Recreado por completo el gráfico del ensamble Minifix en [Ensamble_Minifix.svg](file:///c:/Desarrollo/mmapp/temporal/SVG/Ensamble_Minifix.svg) y en la ruta de recursos públicos del visor [Ensamble_Minifix.svg](file:///c:/Desarrollo/mmapp/legacy-aplicativo-armado/public/assets/tips/Ensamble_Minifix.svg). Se reemplazaron los trazados oscuros, rugosos e ineficientes por formas nativas optimizadas (`<circle>`, `<rect>`, `<path>`) con gradientes lineales metálicos realistas, bordes suaves en gris pizarra, y un resplandor en cian vibrante de la marca para el indicador circular de rotación de 180°.

* **[2026-07-14] Ajuste de CTA y Corrección de Scroll Horizontal en Celulares:**
    - **Texto del Botón CTA**: Modificada la etiqueta del botón en [LiveDemo.tsx](file:///c:/Desarrollo/mmapp/mario-mojica-homepage/src/components/LiveDemo.tsx) a `"Solicitar un prototipo con tu marca"`, incluyendo las traducciones para inglés y portugués.
    - **Corrección de Overflows**: Optimizado el espaciado del contenedor (`px-4 md:px-6`) y el ancho del logotipo (`w-32 md:w-40`) en móviles dentro de [Header.tsx](file:///c:/Desarrollo/mmapp/mario-mojica-homepage/src/components/Header.tsx). Esto libera espacio suficiente en pantallas estrechas para alojar el botón de menú y el selector de idiomas sin romper el ancho de la página.
    - **Estilo Anti-Desplazamiento**: Agregadas reglas de `max-width: 100%; overflow-x: hidden;` en `html, body` dentro de [globals.css](file:///c:/Desarrollo/mmapp/mario-mojica-homepage/src/app/globals.css) y clase `overflow-x-hidden` en el contenedor `main` de [page.tsx](file:///c:/Desarrollo/mmapp/mario-mojica-homepage/src/app/page.tsx) como capa de seguridad absoluta para impedir que elementos del DOM expandan el viewport móvil.

* **[2026-07-14] Corrección de Recorte de Controles Inferiores en Móvil:**
    - **Posicionamiento Seguro de Botones**: En [NavBarInferior.css](file:///c:/Desarrollo/mmapp/legacy-aplicativo-armado/src/features/AssemblyInstructions/components/NavBarInferior/NavBarInferior.css), se modificó la posición `bottom` para utilizar `env(safe-area-inset-bottom)`. Esto detecta dinámicamente si el dispositivo tiene barra de gestos física (como el home indicator de iOS o la barra de tres botones de Android).
    - **Aumento de Margen de Elevación**: Se aumentó el margen base en móviles de `20px` a `32px` (`bottom: calc(32px + env(safe-area-inset-bottom))`) para garantizar que la barra de control (zoom, pasos, play/pause) nunca quede tapada por el sistema en modo pantalla completa, asegurando su visibilidad y facilidad de interacción.

* **[2026-07-14] Integración de Analíticas Umami y Telemetría Multitenant:**
    - **Visor 3D**: Integración del script de Umami de forma dinámica en la inicialización del hook de telemetría [useTelemetry.js](file:///c:/Desarrollo/mmapp/legacy-aplicativo-armado/src/hooks/useTelemetry.js). Se mapearon en paralelo con Supabase todos los eventos de interacción (`Session Start`, `Step Reached`, `Help Clicked`, `Session Complete`, `Feedback Submitted`), logrando un rastreo automático para todos los manuales activos y futuros (Estantería Multifuncional M00001, Politorno, etc.) diferenciados por URL.
    - **Homepage**: Configuración de rastreo declarativo (`data-umami-event`) en [Header.tsx](file:///c:/Desarrollo/mmapp/mario-mojica-homepage/src/components/Header.tsx) (para enlaces, selector de idiomas y login), en [LiveDemo.tsx](file:///c:/Desarrollo/mmapp/mario-mojica-homepage/src/components/LiveDemo.tsx) (para el CTA del prototipo), y en [ContactCTA.tsx](file:///c:/Desarrollo/mmapp/mario-mojica-homepage/src/components/ContactCTA.tsx) (rastreando envíos exitosos de leads tras su recepción por n8n).
    - **Documentación y Protocolo de Arranque**: Creación del documento técnico de referencia [METRICAS.md](file:///c:/Desarrollo/mmapp/Arquitectura/METRICAS.md) en la carpeta de Arquitectura e inyección del mismo en el protocolo de inicio de [AGENTS.md](file:///c:/Desarrollo/mmapp/AGENTS.md) para lectura y recuperación de contexto síncrona.

* **[2026-07-14] Diseño Relacional de CRM y Árbol de Clientes B2B:**
    - **Esquema Relacional**: Estructuración del CRM de Baserow en dos tablas vinculadas (Empresas y Contactos) para habilitar estrategias de Account-Based Marketing (ABM) e inyección de perfiles de LinkedIn para prospección.
    - **Documentación y Protocolo**: Creación del archivo técnico [CRM.md](file:///c:/Desarrollo/mmapp/Arquitectura/CRM.md) en la carpeta de Arquitectura e inyección del mismo en el protocolo de arranque de [AGENTS.md](file:///c:/Desarrollo/mmapp/AGENTS.md).

* **[2026-07-14] Creación de Carpeta Comercial e Inyección de Tier 2 RTA:**
    - **Nueva Carpeta de Negocio**: Creación del directorio `/Comercial` dedicado al crecimiento comercial y marketing del proyecto.
    - **Estudio de Mercado**: Guardado del estudio de competidores [ranking_empresas_rta_brasil.md](file:///c:/Desarrollo/mmapp/Comercial/ranking_empresas_rta_brasil.md) y registro en [AGENTS.md](file:///c:/Desarrollo/mmapp/AGENTS.md) para lectura de contexto inicial.
    - **Semilla del CRM**: Diseño y ejecución del script [inject_tier2_companies.js](file:///c:/Desarrollo/mmapp/scratch/inject_tier2_companies.js) para cargar en masa las 15 empresas del Tier 2 de RTA en Brasil en la tabla de Empresas de Baserow, permitiendo iniciar la prospección comercial controlada.

* **[2026-07-14] Configuración de Marca Personal y Resiliencia de Enlace en LinkedIn:**
    - **Optimización de Perfil Personal (Mario Mojica)**: Redacción e implementación de un titular (Headline) B2B de alto impacto enfocado en la transición de RTA a la Industria 4.0 y en el Manual 3D interactivo.
    - **Localización Bilingüe**: Traducción y configuración de la sección "Acerca de" (About/Sobre) en español y portugués brasileño para captar la atención de los directores de diseño y producción de las empresas RTA brasileñas.
    - **Credenciales y Seguridad**: Verificación exitosa de la dirección de correo electrónico corporativo (`direccion@mariomojica.com`) como cuenta de correo principal del perfil, y adición de las 10 aptitudes (skills) clave del negocio.
    - **Registro de Log de Bloqueo**: Documentación del bloqueo temporal de 24 horas impuesto por LinkedIn para la creación de la Página de Empresa para cuentas nuevas.

* **[2026-07-15] Blindaje de Propiedad Intelectual y Ofuscación 3D GLB (IP Shield):**
    - **Protección Antirrobo**: Implementación de un sistema de ofuscación binaria XOR en caliente para archivos `.glb` (aplicado sobre los primeros 1024 bytes de la cabecera).
    - **Integración CMS y Visor**: Ofuscación automatizada al subir modelos en el CMS Next.js (`detalle-proyecto-modal.tsx`) y descifrado efímero en la memoria RAM del cliente mediante URLs de Blob (`blob:`) en el visualizador React/Vite (`Model.jsx` y `Experience.jsx`) y el escáner de despiece en Next.js.
    - **Migración Retroactiva**: Ejecución de un script automatizado (`encrypt_existing_glbs.js`) que protegió retroactivamente los 21 archivos `.glb` activos de la Mesa Tijuca, la Estantería Multifuncional y los manuales de desarrollo en Supabase Storage.
    - **Documentación de Seguridad B2B**: Creación del manual técnico corporativo [Seguridad.md](file:///c:/Desarrollo/mmapp/docs/Seguridad.md) detallando el funcionamiento del IP Shield como propuesta de valor de seguridad para clientes B2B.

* **[2026-07-15] Corrección de LinkedIn de Notável en CRM B2B (Baserow):**
    - **Ajuste de Notável**: Se actualizó exclusivamente el perfil de **Móveis Notável** (ID 2) a su URL real de compañía `https://www.linkedin.com/company/notável-design-móveis/` (encontrado manualmente por el usuario), preservando intactos el resto de enlaces de la semilla del Tier 2.
    - **Automatización**: Ejecución del script `update_notavel_only.js` en caliente.

* **[2026-07-15] Expansión Multicanal y WhatsApp en CRM (Baserow):**
    - **Estructura de Datos**: Creación de los campos `Facebook` (URL), `Instagram` (URL), `WhatsApp` (URL), `Canal Preferido` (Selección Única) y `Actividad en Redes` (Selección Única) en la tabla 991. Se incluyó "WhatsApp" como opción de canal preferido.
    - **Poblamiento Seguro y Canal Directo**: Actualización de la información para las 15 empresas del Tier 2 brasileño. Se mapeó el link directo de WhatsApp para **Poliman Móveis** (ID 14), vaciando sus campos de Instagram y Facebook por inactividad comercial en esas redes.
    - **Automatización**: Ejecución de los scripts `add_whatsapp_field.js`, `reorder_columns_with_whatsapp.js` y `update_poliman_whatsapp.js`.

* **[2026-07-15] Ecosistema de Redes Sociales B2B (Facebook, Instagram y YouTube):**
    - **Branding y Optimización**: Se optimizó el perfil comercial de Facebook de Mario Mojica y se creó la página de empresa oficial *"Mario Mojica - Smart Assembly 3D - Inteligência Moveleira"*, enfocada en el sector RTA de Brasil.
    - **Conexión de Canales**: Se vinculó la cuenta profesional de Instagram `@mariomojicaff` a la nueva página de Facebook y se enlazaron exitosamente tanto Instagram como el canal de YouTube en la plataforma Metricool para la programación de videos, shorts y demos interactivos.

* **[2026-07-16] Inyección de Empresas del Tier 1 y Ajuste Estratégico del Manifiesto B2B:**
    - **Carga Masiva**: Creación y ejecución exitosa del script [inject_tier1_companies.js](file:///c:/Desarrollo/mmapp/scratch/inject_tier1_companies.js) para inyectar a los 15 gigantes RTA de Brasil (como Bartira, Kappesberg, Henn, Madesa, etc.) en la tabla de Empresas (ID 991).
    - **Enriquecimiento**: Registro de sus sitios web, LinkedIn, Instagram y Facebook corporativos, canales de comunicación preferidos de prospección, nivel de actividad en redes y estimaciones de facturación anual / empleados.
    - **Alineación del Manifiesto**: Actualización de [MANIFIESTO_NEGOCIO.md](file:///c:/Desarrollo/mmapp/docs/MANIFIESTO_NEGOCIO.md) para inyectar la diferenciación y segmentación core de mercado entre Planejados (Dell Anno), Modulados (Favorita/New) y RTA/Seriados (Politorno/Madesa) para consolidar el enfoque de ventas y automatización.
    - **Validación con Movel Sul (Tier 2)**: Contraste con el histórico de expositores (2016-2026). Se identificaron e inyectaron 2 ausencias clave de gran volumen mediante [inject_missing_exhibitors.js](file:///c:/Desarrollo/mmapp/scratch/inject_missing_exhibitors.js): *Kits Paraná* (Fila ID 31) y *Möbler Móveis* (Fila ID 32) en la tabla de Empresas (991).
    - **Validación y Corrección de LinkedIn**: Creación y ejecución de [validate_tier1_linkedin.js](file:///c:/Desarrollo/mmapp/scratch/validate_tier1_linkedin.js) y [update_tier1_linkedin.js](file:///c:/Desarrollo/mmapp/scratch/update_tier1_linkedin.js) para comprobar y actualizar los slugs de LinkedIn corporativos de Tier 1. Se resolvió la redirección de error `/company/unavailable/` dejando en blanco la de *Móveis Lopas* (sin presencia en la red) y aplicando percent-encoding. Se documentó el protocolo en [CRM.md](file:///c:/Desarrollo/mmapp/Comercial/CRM.md).
* **[2026-07-22] mario-mojica-homepage — Corrección de Enlace del Portafolio a Producción:**
    - **Reemplazo de URL de Portafolio**: Se modificó [Footer.tsx](file:///c:/Desarrollo/mmapp/mario-mojica-homepage/src/components/Footer.tsx) para sustituir el valor hardcoded de desarrollo `http://localhost:3002` por la variable de entorno `NEXT_PUBLIC_PORTFOLIO_URL`, con fallback por defecto `'https://portfolio.mariomojica.com'`.
    - **Configuración de Entorno**: Se registró la variable `NEXT_PUBLIC_PORTFOLIO_URL=https://portfolio.mariomojica.com` en los archivos `.env.local` y `.env.example` de la landing page.

* **[2026-07-23] Visor 3D y Backend — Recuperación de Realidad Aumentada (AR) y Exclusión de Analíticas:**
    - **Edge Function Serverless `decrypt-glb`**: Desplegada la función Deno en Supabase para interceptar las solicitudes de **Google Scene Viewer** (Android), descifrar efímeramente los primeros 4KB del modelo `.glb` (cifrados con AES-256-GCM por el IP Shield V2) en la RAM del servidor y retornar un binario GLB válido de 0ms latencia.
    - **Firma de Tokens HMAC-SHA256**: Implementación del módulo [arToken.js](file:///c:/Desarrollo/mmapp/legacy-aplicativo-armado/src/lib/arToken.js) para autorizar peticiones AR mediante firmas con expiración TTL (30 min) y secreto compartido.
    - **Corrección de Compatibilidad en `<model-viewer>`**: Reemplazado `display: none` por posicionamiento fuera de pantalla `opacity: 0` en [RealidadAumentada.jsx](file:///c:/Desarrollo/mmapp/legacy-aplicativo-armado/src/features/AssemblyInstructions/components/NavBarSuperior/RealidadAumentada/RealidadAumentada.jsx), permitiendo que `model-viewer` detecte correctamente los componentes WebXR del dispositivo. Se agregó un fallback de disparo directo por Intent nativo de Android (`intent://arvr.google.com/scene-viewer...`).
    - **Control de Falsos Positivos en Umami**: Creación del componente [UmamiIgnoreManager.tsx](file:///c:/Desarrollo/mmapp/mario-mojica-homepage/src/components/UmamiIgnoreManager.tsx) y actualización de [useTelemetry.js](file:///c:/Desarrollo/mmapp/legacy-aplicativo-armado/src/hooks/useTelemetry.js) para activar `localStorage.setItem('umami.disabled', '1')` mediante la URL `?ignore_me=true`.


### 🔹 Hito Merkadeo V2 / Marketing_02 (26-27 de Julio, 2026): Motor de Publicaciones Multicanal B2B & Conexión Meta (FB/IG)

#### 1. Arquitectura y Componentes UI:
- **Editor Multi-Canal Persistente (`EditorPostModal`)**: Componente reactivo con soporte para drag & drop de imágenes en carrusel, vista previa en tiempo real por red (LinkedIn, Facebook, Instagram y YouTube), compresión del lado del cliente vía HTML5 Canvas (<150KB JPEG por imagen) y límite ampliado a 25MB en Server Actions (`next.config.ts`).
- **Modal de Gestión Directa de Tokens (`ConfigTokensModal`)**: Creación del componente modal y botón **`🔑 Configurar Tokens API`** en la interfaz de `app.mariomojica.com/marketing` para inyectar/refrescar tokens de páginas empresariales directamente en Supabase sin depender de bloqueos OAuth del navegador.
- **Planificador Semanal B2B**: Grilla con franjas horarias óptimas de CTR B2B (`08:30` a `21:00`), emparejador de slots más cercano y cálculo de zonas horarias locales.

#### 2. Infraestructura de Publicación Autónoma (n8n & Next.js API Route):
- **Worker Autónomo n8n (`marketing_publisher_worker`, ID `rhkOkQuv7M4ARSEm`)**: Flujo cron de n8n configurado para ejecutarse minutalmente llamando a la API pública de producción `https://mariomojica.com/api/marketing/publish`.
- **API Engine (`app/api/marketing/publish/route.ts`)**:
  - Consulta en Supabase (`marketing_posts`) publicaciones con estado `programado` y `fecha_programada <= AHORA`.
  - Extrae de la tabla `marketing_cuentas` las credenciales conectadas.
  - Para Facebook: Consulta dinámicamente `/v19.0/me/accounts` obteniendo el **Page Access Token** y el ID real de la página (`1219474691249252`), realizando la publicación vía Graph API POST a `/v19.0/{page_id}/feed`.
  - Actualiza automáticamente el estado en Supabase a `publicado` o `fallido` con su log de error exacto.

#### 3. Diagnóstico y Solución de Autenticación Meta:
- **Resolució del error `(#200) / (#283) Requires pages_read_engagement & pages_manage_posts`**:
  - Se identificó que las llamadas a perfiles personales no son permitidas por Meta v19.0+.
  - Se configuró la App oficial **`Mario Mojica Marketing`** (App ID `1736322840851405`) con los permisos `pages_read_engagement` y `pages_manage_posts` en estado *Listo para la prueba*.
  - Se extrajo el Token de Página de la fanpage oficial **`Mario Mojica - Smart Assembly 3D - Inteligência Moveleira`** (ID: `1219474691249252`).
- **Resolución de Bloqueos Netlify & Redirecciones 404**:
  - Se corrigió la regla `from = "/M*"` en `mario-mojica-homepage/netlify.toml` que interceptaba erróneamente las rutas `/api/*` enviándolas a 404.
  - Se agregaron las fallbacks de producción para `FACEBOOK_APP_ID` y `FACEBOOK_APP_SECRET`.

#### 4. Hito Alcanzado & Verificación en Vivo:
- 🟢 **Publicación en Muro Facebook Confirmada**: Publicación automática procesada por n8n (`Ejecución #921`, `succeeded in 4.011s`) e inyectada exitosamente en el muro oficial de Facebook (*Mario Mojica - Smart Assembly 3D - Inteligência Moveleira*).
- 🟢 **Subida de Imágenes Ultra HD 2K**: Motor de procesamiento actualizado a `2048px` y `98%` calidad HD con renderizado y alojamiento automático en el bucket público de Supabase Storage (`marketing-media`).
- 🟢 **Vinculación Oficial de Instagram Business**: Perfil comercial **`@mariomojicaff`** vinculado exitosamente a la Página de Facebook principal **`Mario Mojica - Smart Assembly 3D - Inteligência Moveleira`** dentro del Portfolio Comercial de Meta.

#### 5. Protocolo Oficial de Habilitación de Permisos de Instagram (Meta Developers):
- **Ubicación en el Panel de Meta Developers**: `App Mario Mojica Marketing` (`1736322840851405`) -> `Casos de uso` -> `API de Instagram` -> `Permisos y funciones`.
- **Permisos Obligatorios para Publicación Automática**:
  1. `pages_show_list`
  2. `pages_read_engagement`
  3. `pages_manage_posts`
  4. 🟢 **`instagram_basic`**: Requerido para leer el perfil y vincular el ID de la cuenta empresarial.
  5. 🟢 **`instagram_content_publish`**: Requerido para crear contenedores multimedia y publicar en el Feed de Instagram.
- **Ruta de Extracción en Graph API Explorer**:
  - `App de Meta`: **Mario Mojica Marketing**
  - `Usuario o página`: **Mario Mojica - Smart Assembly 3D - Inteligência Moveleira**
  - Permisos activos confirmados: `pages_show_list`, `pages_read_engagement`, `pages_manage_posts`, `instagram_basic`, `instagram_content_publish`.

#### 📌 Inventario Oficial de Cuentas y Vinculaciones de Marketing:
| Canal / Activo | ID Externo / Usuario | Nombre de Cuenta / Página | Estado de Vinculación |
| :--- | :--- | :--- | :--- |
| **Facebook Page** | `1219474691249252` | `Mario Mojica - Smart Assembly 3D - Inteligência Moveleira` | 🟢 **ACTIVA & PUBLICANDO EN VIVO** |
| **Instagram Business** | `@mariomojicaff` | `Mario Mojica` | 🟢 **VINCULADA A LA PÁGINA DE FB EN META BUSINESS** |
| **App de Desarrollador Meta** | `1736322840851405` | `Mario Mojica Marketing` | 🟢 **APP OFICIAL MARKETING API** |
| **Bucket de Medios HD** | `marketing-media` | `Supabase Public Storage` | 🟢 **PUBLICACIÓN 2K HD ACTIVA** |
| **Worker n8n** | `rhkOkQuv7M4ARSEm` | `marketing_publisher_worker` | 🟢 **EJECUCIÓN CRON MINUTAL ACTIVA** |

#### 📌 Inventario Oficial de Apps de Meta (Control y Limpieza):
| Nombre de App | App ID | Estado / Uso Principal |
| :--- | :--- | :--- |
| **`Mario Mojica Marketing`** | `1736322840851405` | 🟢 **OFICIAL MARKETING** (Publicación FB & IG) |
| **`Portfolio Leads`** | `789877134189531` | 🟢 **OFICIAL WHATSAPP** (API Leads & Notificaciones) |
| **`Mario Mojica Platform`** | `1010974468469260` | 🟡 Inactiva (Prueba de Login previa) |
| **`Portafolio Nuevo`** | `2359711811200697` | 🔴 Deprecada (Para borrar) |
| **`Mario Mojica Marketing`** | `1407378518112964` | 🔴 Deprecada (Para borrar) |

---

---

### 🔹 Hito Mercadeo_Face_Insta_OK & Arquitectura V8 (27 de Julio, 2026): Consolidación de Publicación Multicanal (FB/IG), Planificador 24H y Arquitectura V8

#### 1. Publicación Multicanal HD (Facebook & Instagram):
- **Motor de Publicación Directa (`/api/marketing/publish`)**: Verificado en vivo con publicación de Single Photo y Carruseles a la Página de Facebook `Mario Mojica - Smart Assembly 3D - Inteligência Moveleira` (`1219474691249252`) e Instagram Business `@mariomojicaff`.
- **Conversor Base64 DataURL a HTTPS**: Implementación de `ensurePublicImageUrl()` subiendo automáticamente imágenes del Canvas cliente al bucket público `marketing-media` en Supabase Storage, garantizando URLs HTTPS públicas exigidas por la CDN de Meta.
- **Pausa Técnica CDN de Instagram**: Incorporación de un retraso asíncrono de 3.5 segundos (`setTimeout(3500)`) entre `POST /media` y `POST /media_publish` para permitir que el backend de Meta finalice el procesamiento del contenedor de imágenes.
- **Intercambio Automático de Tokens**: `saveMarketingCuenta` convierte tokens efímeros Explorer a tokens de 60 días y extrae el **Never-Expiring Page Access Token** para la página comercial.

#### 2. Rediseño UI del Planificador Semanal Estilo Metricool:
- **Grilla de 24 Horas**: Cobertura de `00:00` a `23:00` horas.
- **Cabecera Sticky de Días**: Posición `sticky top-0 z-20` con efecto de desenfoque (`backdrop-blur-md`) manteniendo los días de la semana congelados mientras se navega por el tiempo.
- **Mapa de Calor CTR B2B (Metricool Heatmap)**: Resaltado de horas de mayor rendimiento comercial B2B con degradados de color coral/rosa e indicador `🔥 Pico` para prospección RTA Brasil.
- **Selector de Zonas Horarias**: Alternancia entre **Bento Gonçalves / Brasil (UTC-3)** y **Colombia (UTC-5)** con cálculo automático de equivalencia de hora local (ej. `08:00 (06:00 Col)`).
- **Gestión de Eliminación**: Límite de `max-h-[380px]` en Próximas Publicaciones con scrollbar y botón destructivo `🗑️ Eliminar` en el modal de edición.

#### 3. Documentación Arquitectónica V8:
- Consolidación de los entregables de infraestructura: `Arquitectura/arquitectura_V8.svg`, `Arquitectura/arquitectura_V8.md` y `Arquitectura/guia_replicacion_V8.md`.

---

---

* **[2026-07-29] Hito Ajuste_GeoSeo — Redefinición de Posicionamiento Corporativo, Hero y Metadatos GEO/OpenGraph:**
    - **Posicionamiento y Hero Corporativo**: Redefinición en `mario-mojica-homepage` del Hero con el Badge, Titular H1 y Subtítulo corporativo (*"Desarrollamos software para la manufactura de muebles. Escalamos tus procesos de fabricación y creamos para tus clientes una experiencia memorable desde la compra hasta el uso."*).
    - **Taxonomía de 5 Categorías Muebleras**: Actualización de [MANIFIESTO_NEGOCIO.md](file:///c:/Desarrollo/mmapp/docs/MANIFIESTO_NEGOCIO.md) para registrar formalmente las 5 grandes categorías del mercado: RTA / Seriados, Modulados, Planeados, Tapizados/Espumados (sofás, pufs, colchones) y Personalizados.
    - **Optimización SEO y GEO (Motores de IA)**: Inyección de datos estructurados Schema.org `JSON-LD` (`SoftwareApplication` / `Organization`) en [layout.tsx](file:///c:/Desarrollo/mmapp/mario-mojica-homepage/src/app/layout.tsx) para indexación en ChatGPT, Perplexity, Gemini y Copilot.
    - **Solución a las Advertencias del Meta Sharing Debugger**: Configuración de `og:image` fija WebP de alta resolución (1200x630), `og:url` y la meta etiqueta `fb:app_id` `1736322840851405` tanto en la homepage como en el visor 3D embebido (`legacy-aplicativo-armado/index.html`), asegurando previsualizaciones visuales de alta calidad en WhatsApp y Facebook.

---

### 🔹 Hito Fundacional 3DBimFab (3BF) — Web-BIM Configurator (30 de Julio, 2026)
- **Evolución Concepto y Nomenclatura**: Eliminación definitiva de nombres legacy (*MakeLab*) sustituidos por **3DBimFab (3BF)**.
- **Documento Fundacional**: Creación de [3BF.md](file:///c:/Desarrollo/mmapp/3BF/3BF.md) con la definición de la metodología (3D, BIM, Fab) y la visión Web-BIM para eliminar la dependencia de licencias VisualARQ.
- **Reordenamiento Estratégico de Pilares de Negocio**:
  - **Pilar 1 (Núcleo)**: Automatización de Fábrica e Industria 4.0 (Grasshopper Engine + DXF + Nesting + CNC).
  - **Pilar 2 (Periferia)**: Digitalización, Marketing Visual y Configurador Web 3D Paramétrico (React + Three.js).
  - **Pilar 3 (Periferia)**: Optimización Postventa & Telemetría (Manuales 3D + Métricas de Campo).
- **Consolidación de Protocolo y Monorepo**:
  - Inclusión de [3BF.md](file:///c:/Desarrollo/mmapp/3BF/3BF.md) en el protocolo de arranque obligatorio [AGENTS.md](file:///c:/Desarrollo/mmapp/AGENTS.md).
  - Creación de la estructura del proyecto en `c:\Desarrollo\mmapp\3bf\`.
  - Migración de scripts Python clave (`get_io.py`, `test_final.py`, `script_cohesion_v10.py`) desde el repositorio obsoleto `b2b-rhino-compute` hacia `3bf/docs/legacy-rhino-compute/`.
  - Elaboración y fijación del plan de implementación definitivo en [c:\Desarrollo\mmapp\3bf\plan_de_implementacion.md](file:///c:/Desarrollo/mmapp/3bf/plan_de_implementacion.md) con arquitectura Netlify (Frontend i18n) + Rhino Compute Local (Engine).

---

---

## 🗓️ Agosto 2026

* **[2026-08-01] ¡ÉXITO TOTAL E HITOS FUNDACIONALES DE 3DBIMFAB (3BF) CON RHINO 8 & GRASSHOPPER!**
    - **Triunfo Tecnológico y Resurrección de 3BF:** Se resolvió de manera definitiva la comunicación con RhinoCompute 8, logrando el recálculo paramétrico nativo de 19 piezas reales en tiempo real desde Grasshopper hacia Three.js.
    - **Logros Consolidados:**
      1. Modo de renderizado técnico **Rhino Technical (💎 Cristal Tintado al 70%)** con delineado CAD de aristas negras nítidas.
      2. Carga dinámica de variantes `.ghx` por cantidad de cajones (`1cajon.ghx`, `2cajones.ghx`, `3cajones.ghx`).
      3. Auto-detección de límites `min` / `max` en sliders XML y edición numérica directa con auto-clampeo (`EditableNumberInput`).
      4. Mapeo estricto de `Value List` enviando datos en formato `System.Int32` y `System.String` sin decimales flotantes.
      5. Creación del comando unificado **`/Arranque3BF`** y el script `start_3bf.ps1` para iniciar los 3 daemons en un solo paso.

---

### 🔹 Hito 3DBimFab (3BF) v1 — Integración Paramétrica Nativa Rhino 8 & Grasshopper (01 de Agosto, 2026)

#### 1. Diagnóstico y Recálculo Nativo de las 19 Piezas Reales:
- **Geometría 100% Pura de Rhino 8**: Se resolvió la lectura de las 19 piezas reales del mueble (3 frentes de cajón, 3 posteriores, 3 tapas luz, 3 laterales derechos, 3 laterales izquierdos, cubierta superior, cubierta inferior, lateral izquierdo y lateral derecho), eliminando cualquier duplicación artificial en Python.
- **Descodificación OpenNURBS (`archive3dm`)**: Implementación en `3bf_worker.py` del método `rhino3dm.CommonObject.Decode()` para deserializar los BReps OpenNURBS complejos devueltos por `rhino.compute.exe` y calcular sus coordenadas 3D en metros.
- **Alineación del Piso en Y = 0**: Remoción del contenedor `<Stage>` de Drei para evitar el centrado vertical automático y garantizar que la grilla descansara en `Y = 0` bajo la base del mueble.

#### 2. Renderizado Técnico 3D "Rhino Technical" (Cristal Tintado 70%):
- **Aristas CAD Nítidas**: Integración de `<Edges color="#000000" threshold={15} />` de `@react-three/drei` en cada malla.
- **Modos Visuales en Tiempo Real**: Implementación de selectores UI para alternar entre **💎 Cristal** (`transparent opacity={0.70}` tintado con el color del acabado), **🧱 Sólido** (opaco con sombra) y **📐 Líneas** (Wireframe).

#### 3. Arquitectura de Variantes `.ghx` para Conmutación de Cajones:
- **Descubrimiento de Estado en Rhino 8**: Identificación de que RhinoCompute serializa las mallas horneadas en el estado activo guardado en Grasshopper.
- **Gestión Dinámica de Archivos**: Creación de la carga inteligente de variantes en `3bf_worker.py` para alternar automáticamente entre `Cajon_Experimento_Viktor_1cajon.ghx`, `2cajones.ghx` y `3cajones.ghx` guardados en `temporal/`.

#### 4. Sliders con Límites Auto-Detectados & Entrada Numérica Editable:
- **Extracción de Rangos en XML**: Desarrollo de la función `parse_ghx_slider_limits` para leer `<Min>`, `<Max>` y `<Value>` desde la etiqueta `<chunk name="Slider">` de Grasshopper.
- **Estandarización de Etiquetas 1:1**: Renombrado de controles en `ControlPanel.tsx` para coincidir 1:1 con Grasshopper (`Ancho`, `Alto`, `Profundidad`, `Cantidada de Cajones`, `Abrir Cajones`, `Profundidad cajon`, `Altura lateral de cajon`).
- **Componente `EditableNumberInput`**: Habilitación de edición numérica directa al hacer clic sobre cualquier cifra, con auto-clampeo automático al rango permitido (`min`-`max`) al presionar `Enter` o perder foco (`onBlur`).

#### 5. Mapeo Estricto de `Value List` para Parámetros Numéricos:
- **Detección de Tipos de Datos**: Corrección del formateo de parámetros en `3bf_worker.py` enviando enteros limpios sin decimales (`"351"`, `"400"`) mediante `System.Int32` y `System.String`, permitiendo la conmutación inmediata de Value Lists en RhinoCompute 8.

#### 6. Comando de Arranque Unificado (`/Arranque3BF`):
- **Script de Automatización (`start_3bf.ps1`)**: Creación de un script PowerShell que verifica y arranca los 3 procesos principales (`rhino.compute.exe` en puerto 5000, `3bf_worker.py` en puerto 8005 y `Next.js Web App` en puerto 3005).
- **Documentación de Control**: Registro del comando `/Arranque3BF` en `3BF_Proceso.md` y en el protocolo de arranque de `AGENTS.md`.

---

### 🔹 Hito 3DBimFab (3BF) — Calibración Visual 3D, Normales Perpendiculares & Textura PBR (02 de Agosto, 2026)

#### 1. Panel de Calibración Flotante (`CalibrationPanel.tsx` / `🎛️ Calibrar 3D`):
- **Ajuste en Tiempo Real**: Creación de un panel flotante de calibración en la esquina superior izquierda del visor (`absolute top-3 left-3 z-30`) para modificar parámetros de renderizado en vivo en WebGL.
- **10 Controles de Calibración**:
  - **Material**: Color sólido base (`colorSolido`, Hex `#9CA3AF`), Opacidad de solidez (`opacidadMadera`, $0-100\%$), Rugosidad (`rugosidadMadera`, $0-1$), Metalicidad (`metalicidadMadera`, $0-1$).
  - **Aristas**: Interruptor de visibilidad (`mostrarAristas`), Color de aristas (`colorAristas`, Hex `#111827`), Opacidad de aristas (`opacidadAristas`, $0-100\%$), Ángulo umbral (`thresholdAristas`, $1^\circ-89^\circ$).
  - **Iluminación**: Luz directa principal (`intensidadLuzDirecta`, $0-3\text{x}$) y Luz ambiental global (`intensidadLuzAmbiental`, $0-2\text{x}$).
  - **Restablecimiento**: Botón `🔄 Restablecer Valores por Defecto`.

#### 2. Auto-Corrección Vectorial de Normales 3D ($100\%$ Outward-Facing Normals):
- **Diagnóstico Vectorial**: Identificación de que ciertas caras triangulares tenían su vector normal apuntando hacia el centro interno de la madera ($\vec{N} \cdot \vec{V}_{out} < 0$), causando sombreados invertidos y transparencias falsas.
- **Algoritmo de Inversión de Vértices**: Desarrollo en `Viewer3D.tsx` del algoritmo que evalúa la dirección del producto punto de la normal de cada cara contra el vector saliente desde el centro del volumen delimitador (`BoxCenter`). Si la normal es interna, invierte automáticamente los vértices ($p_B \leftrightarrow p_C$), garantizando que el **100% de las normales apunten hacia el exterior**.

#### 3. Geometría Dual en Memoria (Indexed vs Non-Indexed):
- **Aristas Nítidas (`EdgesGeometry`)**: Generadas desde la malla indexada original de 8 vértices (`indexedGeo`) con filtro de ángulo umbral (`thresholdAristas`), eliminando líneas diagonales y duplicadas.
- **Malla Sólida (`toNonIndexed()`)**: Convertida a no-indexada para recalcular normales de cara $100\%$ perpendiculares a cada plano ($90^\circ$). Esto elimina el suavizado de esquinas a $45^\circ$, **suprimiendo los gradientes de sombra en los cantos y eliminando por completo la línea de costura**.

#### 4. Oclusión Z-Buffer Estricta y Filtro de Piezas Coplanares:
- **Aristas en Fase Opaca**: Configuración de `<lineBasicMaterial>` with `depthTest={true}`, `depthWrite={true}`, `transparent={false}`, obligando a que la madera sólida ocluya las líneas traseras e internas.
- **Filtro de Cajas Internas Coplanares**: Filtrado dinámico de las mallas internas de los cajones (`Lateral Izq Cajon`, `Lateral Der Cajon`, `Posterior de Cajon`) cuando los cajones se encuentran cerrados (`apertura_cajones === 0`) en modo Sólido o Renderizado.

#### 5. Re-Compilación Dinámica GLSL en WebGL y Validación Autónoma por Browser Automation:
- **Causa Raíz del Re-Renderizado**: En React Three Fiber, los materiales montados inicialmente con `map={null}` compilan shaders GLSL en GPU sin `#define USE_MAP`. Al actualizar `map` asincrónicamente con la textura descargada, Three.js no re-compilaba el shader GLSL, manteniendo la pieza en gris.
- **Inyección de Key Única en `<meshStandardMaterial>`**: Solucionado añadiendo `key={activeMap ? activeMap.uuid : "no-map"}`, obligando a Three.js a instanciar `#define USE_MAP` en el Fragment Shader tan pronto la textura finaliza su carga.
- **Uploader de Bitmaps Personalizados (`📁 Cargar Bitmap`)**: Soporte en `CalibrationPanel.tsx` para subir imágenes PNG/JPG locales vía `FileReader` y DataURL, activando automáticamente el visor en modo `🖼️ Renderizado`.
- **Validación Visual Autónoma por Playwright (Chromium Headless)**: Implementación de scripts de automatización con Playwright Python para navegar a `http://localhost:3005`, accionar los controles visuales, capturar imágenes reales del canvas WebGL y verificar visualmente la veta melamínica sin alucinaciones.

---

### 🔹 Hito Blindaje Cloudflare DNS Anycast, IPv6 Nativo, HSTS & IP Shield V2 (03 de Agosto, 2026)

- **Cloudflare Anycast Security Edge**: Delegación DNS a `justin` y `tara.ns.cloudflare.com` con CNAME Flattening IPv6 nativo para antenas móviles LTE/5G (Claro, Tigo, Movistar), resolviendo bloqueos `ERR_CONNECTION_TIMED_OUT`.
- **Cabeceras HSTS & SSL Compliance**: Inyección de `Strict-Transport-Security: max-age=31536000; includeSubDomains; preload` forzando conexiones HTTPS, junto con cabeceras anti-clickjacking y WAF a nivel de borde.
- **IP Shield V2 AES-256-GCM & Serverless Edge Decrypt**: Cifrado simétrico de los primeros 4KB de cada modelo GLB con derivación PBKDF2 (`MASTER_SALT + manualId`), descifrado en RAM del cliente con `Web Crypto API` (`blob:`) y proxy serverless via Supabase Edge Function `decrypt-glb` con tokens HMAC-SHA256 (TTL 30 min) para Realidad Aumentada (Google Scene Viewer).
- **Actualización Arquitectónica V8**: Refactorización de [Arquitectura.md](file:///c:/Desarrollo/mmapp/Arquitectura/Arquitectura.md) y regeneración del diagrama vectorial [arquitectura_V8.svg](file:///c:/Desarrollo/mmapp/Arquitectura/arquitectura_V8.svg).

---

### 🔹 Hito Drive_Video — Integración de Video MP4 y Google Drive sin Almacenamiento en Supabase (03 de Agosto, 2026)

- **Soporte de Video en Mockups**: Habilitación dinámica de etiquetas `<video>` y renderizado de ícono de película cinematográfica (`Film`) en miniaturas para el Editor Multi-Canal B2B de Next.js, implementando `crossOrigin="anonymous"` para resolución de CORS y credenciales locales en navegadores Chrome/Safari.
- **Soporte Nativo de Google Drive (Almacenamiento Cero)**: Creación de políticas RLS en Supabase Storage para el bucket `marketing-media`. Implementación en el cliente de un parser de enlaces públicos de Google Drive (`parseGoogleDriveLink`) para extraer el ID del archivo y generar URLs de descarga directa (`drive.usercontent.google.com`).
- **Evadir Restricciones CORP de Google**: Integración de iframe de visualización interactiva oficial de Google Drive (`/preview`) en los mockups de redes sociales del panel del CMS para eludir las restricciones de origen cruzado de Google (`Cross-Origin-Resource-Policy: same-site`), manteniendo la descarga directa limpia para consumo asíncrono y publicación en n8n.
- **Bypass de Límites de Carga**: Superación exitosa de los límites de carga de funciones serverless de Netlify (6MB) al permitir guardar y previsualizar videos pesados (~50MB) de la campaña de Michael Thonet mediante Google Drive.

---

### 🔹 Hito Video_Marketing — Soporte de Publicación de Video en Meta y LinkedIn (04 de Agosto, 2026)

- **Publicación de Video en Facebook**: Implementación de la API de Videos de Facebook (`/videos`) utilizando el parámetro `file_url` para subir y publicar remotamente videos de Google Drive.
- **Publicación de Video en Instagram (Reels)**: Integración del flujo de subida de Reels (`media_type: 'REELS'`) a la API de Instagram Business, con lógica de sondeo (polling) asíncrono para verificar que el video esté completamente procesado (`FINISHED`) antes de publicar.
- **Publicación de Video en LinkedIn**: Configuración de la receta `feedshare-video` y la categoría de medio `"VIDEO"` en el UGC Post para publicar y procesar nativamente videos MP4 en la red profesional.

---

### 🔹 Hito Upwork_Video — Producción y Publicación de Video de Presentación Profesional & Solución XML en API TTS (06 de Agosto, 2026)

- **Video de Presentación Profesional Publicado**: Grabado, producido y sincronizado video de 9m 33s en inglés y español demostrando la plataforma SaaS de manuales 3D, el motor paramétrico 3DBimFab, la arquitectura de seguridad IP Shield V2, Supabase SQL y Docker en Hetzner VPS.
- **Alojamiento en YouTube (No Listado + Permitir Incorporación)**: Publicado en modo **No listado (Unlisted)** con la casilla **Permitir incorporación (Allow embedding)** activada (`https://youtu.be/wK_a7Fvp2nk`), integrado sin errores en el reproductor modal del perfil de Upwork.
- **Diagnóstico y Corrección de Bug XML en API TTS (`/api/tts`)**: Diagnóstico empírico y solución del fallo que generaba 0 bytes de audio al sintetizar párrafos con ampersands (`&`) en textos como `R&D`. Se implementó la función `escapeXml()` en `mario-mojica-plataforma/app/api/tts/route.ts` para sanitizar automáticamente caracteres especiales reservado en SSML/XML (`&`, `<`, `>`, `"`, `'`).
- **Guion Maestro Sincronizado**: Creado el documento [`docs/Upwork/video_presentacion.md`](file:///c:/Desarrollo/mmapp/docs/Upwork/video_presentacion.md) con las versiones en español e inglés TTS organizadas por bloques conceptuales.
- **Configuración de Perfil Upwork**: Publicado el título oficial `Full-Stack Software Engineer | Next.js, Python & AI Automation`, tarifa de `$30.00/hr` y estrategia de portafolio B2B refactorizada en [`docs/Upwork/perfil.md`](file:///c:/Desarrollo/mmapp/docs/Upwork/perfil.md).

---

### 🔹 Hito 3BF_Mesh_OK — Optimización de Carga, Raycasting Centralizado por Profundidad & Exportación Limpia a Blender (13 de Agosto, 2026)

- **Sincronización Dinámica de Metadatos (Endpoint `/metadata`)**: Creado el endpoint `/metadata` en `3bf_worker.py` y proxy en Next.js `/api/metadata` que parsea los `default_values` del XML de Grasshopper en milisegundos sin invocar a RhinoCompute, reduciendo el tiempo de carga a la mitad (~1.5s) y eliminando peticiones dobles o parpadeos iniciales.
- **Motor de Raycasting Centralizado por Profundidad (`<RaycastHandler />`)**: Reemplazados todos los handlers de puntero manuales por un evaluador centralizado frame-a-frame en Three.js con `useFrame` e `intersectObjects`. Resuelto de raíz el bug del tooltip en el aire/vacío al ejecutar `setHoveredPiece(null)` instantáneamente cuando no hay colisiones o al salir del Canvas (`onMouseLeave`).
- **Formateo Unificado de Piezas DfMA (`obtenerNombreUnificadoPieza`)**: Nomenclatura homologada entre el visor 3D y la *Scene Collection* de Blender: sub-mallas del tablero (`Balance cubierta2`, `Color cubierta2`, `MDP2`) muestran unificadamente **"Cubierta"**, mientras que herrajes muestran **"Perno Minifix"**, **"Caja Minifix"**, **"Tarugo"** o **"Tornillo"**.
- **Deduplicación Global Raíz de Mallas en GLB**: Deduplicación a nivel raíz `cleanRealMeshes` en `Viewer3D.tsx` que elimina mallas obsoletas base (ej. `MDP`) si la escena contiene versiones actualizadas (ej. `MDP2`), produciendo exportaciones GLB en Blender 100% limpias bajo los grupos `Cubierta`, `Herrajes` y `Maquinados` sin carpetas o mallas huérfanas en `Otros`.
- **Estándar VisualARQ de Organización de Grupos y Sliders**: Implementado algoritmo en `3bf_worker.py` y `ControlPanel.tsx` que respeta la jerarquía multinivel de VisualARQ. Los grupos de Grasshopper (`GH_Group`) definen los títulos de las tarjetas sin números, mientras que los prefijos numéricos principales (`01.x`, `05.x`) ordenan las tarjetas y los sub-prefijos decimales (`.0`, `.1`) ordenan los controles internamente, ocultando la numeración en la web para una UI 100% limpia y auto-organizada.

---

### 🔹 Hito 3BF_Alineado — Alineación Geométrica 1:1 CAD/WebGL, Widget de Ejes Rhino 8 & Protocolo Purge-First (14 de Agosto, 2026)

- **Alineación Geométrica 1:1 Rhino ➔ Three.js**: Resolución del efecto espejo en profundidad en el visor 3D mediante la transformación de coordenadas dextrógira coherente (`Three.js X = Rhino X`, `Three.js Y = Rhino Z`, `Three.js Z = -Rhino Y`), con inversión de devanado de caras triangulares (CCW) para conservar normales 100% exteriores sin reflejos especulares ni inversiones de izquierda/derecha.
- **Widget Vectorial de Ejes X, Y, Z (Estilo Rhino 8)**: Implementación de `RhinoAxisTracker` y widget vectorial SVG minimalista en la esquina inferior izquierda que replica con exactitud los ejes triédricos `x`, `y`, `z` de Rhinoceros, sincronizándose de forma fluida a 60 FPS con `OrbitControls` sin tocar el framebuffer de WebGL.
- **Protocolo de Purga Previa (Purge-First en 3 Niveles)**:
  * **Nivel 1 (Web React)**: Función `purgarEstadoCompleto()` en `ControlPanel.tsx` que resetea el explorador de archivos, el resultado previo y las referencias de caché antes de cargar una nueva definición.
  * **Nivel 2 (Python Worker)**: Purga física en disco (`os.remove(custom_path)`) antes de escribir `uploaded_custom.ghx` en `/metadata` y `/compute`.
  * **Nivel 3 (RhinoCompute 8)**: Inyección dinámica de `<!-- 3BF_CACHE_BUST: timestamp -->` para invalidar la memoria RAM del solver de Grasshopper.
- **Corrección de Coincidencia Estricta de Signos (`-1` vs `1`)**: Eliminación del bug de neutralización de signos negativos en `3bf_worker.py` reemplazando búsquedas de subcadenas por comparaciones estrictas (`tv_low == in_name`), permitiendo el desplazamiento simétrico exacto de 64 mm en pernos Minifix.
- **Consolidación del Estándar de Salidas Agrupadas (`RH_OUT:...`)**: Homologación del estándar de exportación de McNeel Hops / RhinoCompute 8 envolviendo componentes en grupos `GH_Group`, garantizando el retorno íntegro de las 24 mallas poligonales (tableros, pernos, cajas y maquinados CNC).
- **Diagrama de Arquitectura Oficial Versión 3.0**: Publicación de `3BF_Proceso_Diagrama_V3.svg` y `3BF_Arquitectura_V3.svg` bajo el estándar visual *Tech Ethos*.

---

### 🔹 Hito 3BF_Costos — Motor de Costeo B2B, Negociación de Proveedurías, Descuentos de Cara, Desperdicio Nesting & Google Sheets Optimizer (15 de Agosto, 2026)

- **Directorio Modular de "Negociación Proveedurías"**: Reestructuración de la vista de base de datos incorporando fichas desplegables en orden alfabético estricto de una sola línea (`Arauco`, `Duratex`, `Masisa`, `Novopan`), permitiendo expandir o colapsar individualmente matrices de importación complejas y configuraciones de TRM.
- **Matriz Viva y Matemática de Liquidación Novopan (Ecuador ➔ Colombia)**: Integración reactiva completa de los parámetros de importación desde Ecuador (Apoyo Volumen 20.0%, Apoyo Tasa 15.1%, Pronto Pago 3.5%, Gastos Nacionalización 8.7%, Financiación 1.1%, Flete $18.57/m³ y TRM Novopan de $4.000 COP), liquidando al centavo el costo de cada lámina y su costo por metro cuadrado.
- **Algoritmo de Descuento por Tipo de Acabado / Cara (`D/B` vs `D/D`)**: Detección y columna editable `Desc. Cara (I)` en la tabla de tableros. Aplica 5.0% de descuento a tableros con balance blanco (`D/B`) y 0.0% a tableros con diseño en ambas caras (`D/D`, `D/KN`, madera), logrando coincidencia exacta con la columna `I` de la plantilla de costos industrial.
- **Control de Porcentaje de Desperdicio de Corte / Nesting (`% DESP`)**: Implementación del cálculo industrial de consumo real según la fórmula oficial de Excel `EDP`: $\text{Factor} = \frac{1}{1 - \frac{\% \text{Desp}}{100}}$, con control global editable en cabecera (`10.0%` por defecto) y casillas fila a fila por pieza en la lista de corte (BOM).
- **Auto-selección Numérica Global y Soporte Coma/Punto (`DecimalInput`)**: Estandarización en toda la plataforma del componente de entrada numérica con auto-selección total al tocar con el puntero del ratón (`select()`), eliminación de ceros residuales invasivos y compatibilidad simultánea con punto y coma decimal.
- **Optimizador de Plantillas ERP para Google Sheets (`FILE_TOO_LARGE` y `#NAME?` Resueltos)**: 
  * Eliminación de cuadrículas fantasmas (1.048.576 filas en `BD` y 16.383 columnas en `HERRAJES CANTOS`), reduciendo el peso de `4.66 MB` a `602 KB` (reducción del 87%).
  * Restauración de los 35 Rangos Nombrados Globales (`TRM`, `MPLAMINAS`, `MP2HERRAJES_CANTOS`, `CODIGOS`), permitiendo abrir la plantilla instantáneamente en Google Sheets con cálculos vivos y cero errores.
- **Simplificación del Selector de Sustrato en BOM**: Menú desplegable optimizado que muestra exclusivamente el nombre comercial limpio del material sin sufijos redundantes de precio, delegando la visualización económica a su columna dedicada de `Costo m²`.

---

- **Creación del Documento Maestro `WORKER.md`**: Publicación oficial del documento técnico [`3BF/WORKER.md`](file:///c:/Desarrollo/mmapp/3BF/WORKER.md) y registro en el protocolo de arranque de [`AGENTS.md`](file:///c:/Desarrollo/mmapp/AGENTS.md), blindando la memoria del microservicio `3bf_worker.py` (FastAPI / Three.js).
- **Matriz de Texturizado DfMA y Mapeo Cúbico de 6 Niveles**: Estandarización de la tabla de giros angulares ortogonales (`Rotate 3D`) para los 6 tipos de piezas de mobiliario (`0: Vertical`, `1: Vertical Atravesada`, `2: Frontal`, `3: Frontal Atravesada`, `4: Horizontal`, `5: Horizontal Atravesada`) con caja estándar cúbica de 600 x 600 x 600 mm.
- **Algoritmo de Mapeo Cúbico 3D Real (BoxMapping Nativo de 6 Caras)**: Implementación del componente Python nativo en Rhino 8 que evalúa la normal dominante de cada vértice para eliminar rayas estiradas en cantos perimetrales y proyectar la veta continua sin dependencias de plugins externos como *Human*.
- **Pipeline de Extracción de UVs en el Worker**: Extracción de `decoded_geom.TextureCoordinates` en `3bf_worker.py` y renderizado PBR en `Viewer3D.tsx`, logrando la representación física 1:1 de vetas longitudinales y transversales para optimización de corte CNC (Nesting).
- **Purga Total al "Buscar en Disco"**: Reseteo de variables de estado en `purgarEstadoCompleto()` (`model_id = ""`, `custom_filename = ""`) y eliminación de fallbacks hardcodeados en `ControlPanel.tsx`, dejando la interfaz 100% limpia.

---

### 🔹 Hito 3BF_ManoObra_CIF — Ficha Financiera Industrial 100%, Pestaña de Mano de Obra & CIF y Detección Automática DfMA de Cantos (15 de Agosto, 2026)

- **Ficha Financiera Industrial Consolidada (100.00% Ficha Técnica)**:
  * Implementación del modelo contable de costeo por absorción estándar (**NIC 2 / RTA**) que proyecta la totalidad del costo de fabricación: $\text{Costo Total (100\%)} = \text{Materia Prima Directa (77.78\%)} + \text{Tercerizaciones (0.00\%)} + \text{Mano de Obra + Prestaciones (12.42\%)} + \text{Costos Indirectos de Fabricación - CIF (9.80\%)}$.
  * Algoritmo de liquidación matemática directa: $\mathbf{\text{Costo Total}} = \frac{\text{Total MP} + \text{Tercerizaciones}}{1 - (\% \text{MO+PRES} + \% \text{CIF})}$, permitiendo conocer con exactitud el valor monetario de MOD y CIF aún con cómputos preliminares de materiales.
- **Nueva Pestaña Modular `🏭 Mano de Obra & CIF` en Base de Datos**:
  * Controles interactivos con `DecimalInput` para parametrizar en tiempo real los porcentajes de **Mano de Obra Directa + Prestaciones** (`12.42%` por defecto), **Costos Indirectos de Fabricación - CIF** (`9.80%` por defecto), **Adicionales & Consumibles** (`0.40%` por defecto), y costos fijos de **Tercerizaciones & Maquilas** en COP.
  * Tarjeta de matriz consolidada de distribución del 100% con barra proporcional tricolor y desglose legal de cargas prestacionales (cesantías, primas, salud, pensión, ARL, parafiscales) y CIF de planta (depreciación de CNCs Morbidelli/Skipper, energía industrial, adhesivos PUR y desgaste de fresas).
- **Tabla 4 "Resumen de Costo" en la Vista de Despiece (`DespieceView.tsx`)**:
  * Incorporada la tabla financiera completa que detalla fila por fila: 1. Láminas, 2. Fondos, 3. Cantos, 4. Empaque, 5. Herrajes, 6. Adicionales, Subtotal MP (77.78%), 7. Tercerizaciones (0.00%), 8. MO+PRES (12.42%), 9. CIF (9.80%) y Gran Total (100.00%).
  * Sincronización íntegra del payload de guardado en **Supabase** y almacenamiento local con campos desglosados de `costo_total_fabricacion_100_cop/usd`, `mano_obra_pres_cop/usd` y `cif_cop/usd`.
- **Detección y Cómputo Automático de Cantos DfMA (Visor 3D ➔ BOM)**:
  * Conexión reactiva entre los selectores de borde del configurador 3D (`Borde Izquierdo`, `Borde Derecho`, `Unión`) y la tabla de cantos: detecta automáticamente si una pieza requiere 0, 1 o 2 cantos en ancho y largo sin intervención manual, con fórmula oficial de despunte de $+100\text{ mm}$ por borde.

---

### 🔹 Hito 3BF_DXF — Generador CAM DXF Nativo para Biesse Skipper, 5 Vistas Desplegadas en Cruz, Convención NURBS DfMA e Hidratación Inmediata de Store (15 de Agosto, 2026)

- **Generador CAM DXF Nativo para Centros de Mecanizado Biesse Skipper (`/export-dxf`)**:
  * Implementación del motor vectorial nativo en formato **AutoCAD 2007 (AC1021)** compatible al 100% con los postprocesadores de centros de mecanizado y seccionadoras **Biesse Skipper (BiesseWorks / bSolid / TpaCAD)**.
  * Esquema ortogonal de **5 vistas desplegadas en cruz**:
    1. **Cara Superior $W_0$ (Centro):** Contorno de corte pasante `TCHW0B8D1500` con cajas Minifix $\varnothing 15\text{ mm}$ a $13.5\text{ mm}$ de profundidad (`TCHW0B15D1350`).
    2. **Cantos Laterales Desplegados ($W_1$ Izq, $W_3$ Der):** Rectángulos cerrados (`TCHW1B8`, `TCHW3B8`) con taladros de espiga Minifix y tarugos $\varnothing 8\text{ mm}$ a $25\text{ mm}$ de profundidad (`TCHW1B8D2500`, `TCHW3B8D2500`) con separación estándar (*Gap = 20mm*).
    3. **Cantos Frontal y Posterior Desplegados ($W_4$ Sup, $W_2$ Inf):** Rectángulos cerrados (`TCHW4B8`, `TCHW2B8`) con *Gap = 20mm*.
  * **Diferenciación Dinámica Pieza Mecanizada vs Pieza de Corte Puro**:
    * **Cubierta:** Genera contorno + cajas Minifix + taladros en cantos (`Cubierta_498x480_15mm_BD1.0.dxf`).
    * **Entrepaño:** Genera contorno rectangular ($497 \times 480\text{ mm}$) con sus 4 cantos desplegados completamente limpios de perforaciones para corte directo en seccionadora (`Entrepaño_497x480_15mm_BD1.0.dxf`).
- **Convención Oficial de Nombres y Eliminación de Z-Fighting (NURBS vs Meshes)**:
  * **Regla DfMA Establecida:** Salidas `RH_OUT:...` para elementos visibles y texturizados en la web (`Color`, `Balance`, `Herrajes`); nombres `Nurbs [Pieza]` para sólidos matemáticos Brep internos de cálculo y CAM.
  * **Eliminación Total de Titileo:** El worker y el visor 3D Three.js filtran automáticamente los sólidos `Nurbs`, eliminando piezas duplicadas o parpadeos en pantalla y reservando los Breps para el despiece BOM y el DXF.
- **Hidratación Global Inmediata al Inicio (`hidratarDesdeLocalStorage`)**:
  * Ejecución en el primer ciclo de montaje de `app/page.tsx` y `DespieceView.tsx`, asegurando que los costos de catálogo (Caja $100 COP, Perno $87 COP, Tarugo $17 COP, Tornillo $27 COP, Soporte $150 COP) aparezcan correctos desde el primer milisegundo sin necesidad de visitar la pestaña Base de Datos.
- **Refinamiento UI en Cabecera de Despiece**:
  * Retiro del botón redundante inferior, simplificación del botón superior a **`Guardar`** con icono monocromático y selector de versiones limpio (**`BD 1.0`**, **`BD 1.1`**, **`BD 2.0`**).
- **Actualización de la Memoria Técnica en `WORKER.md`**:
  * Inyectadas las Secciones 10 (Módulo CAM DXF Biesse Skipper), 11 (Fundamentos NURBS vs Mallas) y 12 (Persistencia e Hidratación Inmediata).

---

### 🔹 Hito 3BF_Blender_Nav_Selection — Navegación 3D Estándar Blender, Zoom Continuo Direccional, Selección Instantánea y Silueta Perimetral Fiel 90% (17 de Agosto, 2026)

- **Navegación 3D Idéntica al Keymap de Blender (Right Select)**:
  * **Giro Orbital (Orbit):** Rueda central presionada (`MMB` / Botón 1) para rotación orbital fluida y reactiva.
  * **Zoom Continuo Direccional (Dolly):** `Ctrl` + Rueda presionada (`Ctrl + MMB Drag`) con dirección cinemática intuitiva (mover arriba acerca la cámara al punto de vista, mover abajo aleja la cámara).
  * **Paneo de Vista (Pan):** `Shift` + Rueda presionada (`Shift + MMB Drag`) para traslación de pantalla en ejes locales.
  * **Selección Física Permanente (Select):** Clic Derecho (`RMB` / Botón 2) instantáneo (0ms de latencia) con `capture: true`, garantizando persistencia estable sin auto-deselección al soltar el ratón.
  * **Deselección y Controles UI:** Clic Izquierdo (`LMB` / Botón 0) para deseleccionar al tocar el vacío o manipular la interfaz y sliders.
- **Delineado de Silueta Perimetral Fiel (90% Efectividad Validada)**:
  * **Algoritmo de Visibilidad de Caras XOR ($\text{visible}(A) \oplus \text{visible}(B)$):** Detecta las aristas del tablero que hacen contacto real con el vacío según el ángulo del punto de vista de la cámara, eliminando líneas internas diagonales o frontales.
  * **Calibre Cuadruplicado ($4\text{ px}$):** Trazado sólido y nítido en color naranja `#ff9500` con `@react-three/drei` `<Line>`.
  * **Alineación Tridimensional y Curvas en Pernos:** Anclaje tridimensional a la cota física de los cantos de madera y arcos circulares en las puntas de los pernos Minifix salientes, eliminando el efecto sombra o líneas flotantes.
  * **Optimización de Rendimiento a 60 FPS:** Separación de la extracción estructural en `useMemo` y reducción de `useFrame` a un cálculo liviano de 6 productos punto escalares ($0.001\text{ ms}$).

---

### 🔹 Hito 3BF_MultiInstancia_GHX_BOM_Global — Arquitectura Multi-Instancia GHX, Nombrado Secuencial, Snaps y Despiece & Costos Globales (17 de Agosto, 2026)

- **Multi-Instancia Paramétrica GHX en Escenario 3D**:
  * Capacidad de insertar múltiples archivos `.ghx` iguales o diferentes simultáneamente en el lienzo WebGL.
  * Cada objeto en el escenario se gestiona como una entidad independiente (`ObjetoInstancia3BF`) con su propio `id`, `parametros`, geometría 3D, posición y estado de carga.
- **Reglas de Nombrado Secuencial Inteligente**:
  * Primera instancia del modelo: nombre limpio original (ej. `Cubierta`).
  * Siguientes instancias del mismo origen: sufijos formateados secuenciales automáticos (`Cubierta_01`, `Cubierta_02`, `Cubierta_03`).
- **Selección Tridimensional y Panel de Control Vinculado**:
  * Al hacer **Clic Derecho** sobre cualquier pieza en el 3D, se selecciona la instancia y se sincroniza el panel lateral.
  * Cabecera informativa superior en `ControlPanel.tsx` con badge `🏷️ Objeto Activo: Cubierta_01` y selector desplegable para conmutar entre objetos.
  * Los sliders modifican y recomputan de forma atómica y reactiva los parámetros del objeto seleccionado.
- **Despiece y Costos Globales de Escena Completa (BOM Consolidado)**:
  * La pestaña **Despiece y Costos** (`DespieceView.tsx`) agrega automáticamente todas las piezas y herrajes de todos los componentes presentes en la escena (`getDespieceGlobal()`, `getHerrajesGlobal()`).
  * Si existen 2 o más cubiertas u otros muebles, la tabla de despiece lista todas las piezas identificadas por objeto, suma sus áreas y metros lineales de canto, y liquida el presupuesto industrial consolidado de la escena.
- **Árbol de Objetos (Outliner) en N-Panel**:
  * Añadida la sección *Objetos en Escena* en la pestaña Escenario para listar instancias, seleccionarlas, duplicarlas o eliminarlas.
- **Snaps de Alta Visibilidad & Silueta en Modo Mover**:
  * Silueta en modo mover (`G`) en color negro sólido `#111827` (4px).
  * Iconos de Snap renderizados en overlay HTML/SVG `z-index: 9999` en color naranja `#ff9500` ($100\%$ sólido) con soporte para endpoints ($\square$) y midpoints ($\triangle$).

---

### 🔹 Hito BiblioMuebles_Ram_Ventas — Biblioteca de Muebles Blender 4.x, Sincronía Google Drive (G:), RAM de Ventas & BOM Consolidado (18 de Agosto, 2026)

- **Biblioteca de Muebles & Asset Browser Estilo Blender 4.x**:
  * Reestructuración de la interfaz en el N-Panel separando las definiciones `.ghx` en crudo (**Componentes**) de las composiciones y catálogos comerciales (**Muebles**).
  * Estética minimalista pura inspirada en Blender 4.x: sin marcos envolventes pesados, sin badges de categoría invasivos, con miniaturas 3D cuadradas nítidas y nombres limpios centrados.
  * Edición inline de nombres mediante doble clic o icono de lápiz, con guardado instantáneo al presionar `Enter`.
- **Integración Nativa Bidireccional con Google Drive (`G:\Mi unidad\Muebles`)**:
  * Conexión directa y en vivo con Google Drive para escritorio (`provider: google_drive_desktop_active`).
  * Eliminación de listas quemadas en código: el árbol jerárquico de marcas (`RTA Design`, `Politorno`, `Henn`, `Bartira`, `Genmo Base`, `Partira`) y tipologías se escanea 100% en tiempo real.
  * Botón interactivo **`Ir al Drive ↗`** que abre la carpeta oficial en Google Drive Web en una nueva pestaña y botón **`Sincronizar` (`RefreshCw`)** para refrescar carpetas agregadas o eliminadas.
  * Flujo completo "Guardar como..." y "Abrir Mueble", empaquetando geometría, parámetros, ficha técnica y miniaturas en archivos `.3bf.json`.
- **Captura Fotográfica 3D WebGL Centrada (360×360 px)**:
  * Componente `ThumbnailCapturer` que extrae el centro exacto del viewport 3D en formato WebP cuadrado de alta resolución, evitando bordes negros y desalineaciones.
- **Armonización Visual de la Biblioteca de Componentes**:
  * Rediseño de las tarjetas de definiciones GHX con el mismo estándar minimalista de Blender, preservando la funcionalidad de arrastrar y soltar (`drag & drop`) hacia el escenario 3D.
- **Despiece Multi-Instancia y Consolidación Pura de Herrajes**:
  * Reflejo de dimensiones reactivas por instancia (ej. 498 mm vs 1540 mm), separando el origen técnico (`Pieza`) de la descripción comercial editable.
  * Unificación total de herrajes (8 cajas y 8 pernos para 2 cubiertas) leídos de forma pura y directa desde Grasshopper sin parches espaciales en código.
- **Módulo Comercial RAM de Ventas & Arquitectura V10**:
  * Documentación completa del módulo de prospección en `Comercial/RAM_de_ventas.md` y actualización del diagrama de arquitectura a la versión 10 (`Arquitectura/arquitectura_v10.svg` y `Arquitectura/Arquitectura.md`).
  * Inclusión de `RAM_de_ventas.md` en el protocolo de arranque de `AGENTS.md`.

---

- **Módulo Completo de RAM de Ventas (`/ventas-ram`)**:
  * Implementado en la plataforma Next.js con permisos de rol de usuario (`VENTAS_RAM`), navegación con ícono `BrainCircuit` y diseño Tech Ethos / Obsidian Teal.
- **Visión Multimodal con Ingesta Multi-Captura**:
  * Soporte para pegar múltiples capturas en secuencia con `Ctrl+V` (o selector de archivos) con galería cronológica numerada (`#1`, `#2`, `#3`...).
  * Compresión inteligente en cliente (redimensión proporcional a 1280px y JPEG 0.82) reduciendo payloads de 20MB a menos de 400KB para envíos ultrarrápidos (< 2 segundos).
- **Auto-Extracción Inteligente de Prospectos con IA**:
  * Modal `+ Nuevo` con auto-completado mediante Visión Gemini desde capturas de perfil de LinkedIn / WhatsApp (extrayendo Empresa, Nombre, Cargo, Teléfono, URL, Región y Notas con salvaguardas anti-alucinación).
- **Separación Clara: Archivo Histórico vs Acción Comercial Bajo Demanda**:
  * **Pestaña 1 (`⚡ Analizar & Archivar Evento`)**: Extrae conclusiones ejecutivas de eventos pasados y guarda hitos limpios en el historial sin generar respuestas inventadas.
  * **Pestaña 2 (`💬 Hilo de Conversación Completo`)**: Muestra la bitácora cronológica con citas reales del chat, banner proactivo de **Próxima Jugada Táctica** y botón protagónico **`⚡ Activar Antigravity: Redactar Mensaje`** para generar respuestas bajo demanda en **Português Brasileño + Traducción en Español** con refinamiento interactivo.
- **Persistencia Reactiva & Memoria Local**:
  * Sincronización transparente entre Supabase, memoria local y la memoria activa `.agent/skills/b2b-sales-closer/ventas_ram.md`.

---

### 🔹 Hito 3BF_UI_Colores — Personalización de Apariencia Estilo Rhinoceros 8, Glosario Completo de Colores 2D/3D/BOM, Guardado Predefinido, Copiado/Pegado Rápido #HEX 1-Touch, N-Panel Contextual y Overlay en Fichas de Datos (18 de Agosto, 2026)

- **Panel de Apariencia y Glosario Completo de Colores (Estilo Rhinoceros 8)**:
  * Incorporación de la pestaña 6 `Apariencia` en el N-Panel (`AppearanceSettingsPanel.tsx`) con tabla interactiva de swatches dividida por categorías: *Colores de la vista* (fondo 3D, rejilla mayor/menor, ejes X/Y/Z, silueta), *Visualización de objetos* (selección `#FF9500`, bloqueados, material base, cristal, herrajes, cantos), *Objetos de interfaz* (paneles, bordes, textos, marca, botones, TopNav), *Ficha de Despiece & Base de Datos* (encabezados, celdas/filas, divisores, total consolidado, KPIs) y *Widgets* (Gizmo U/V/W, puntos snap).
  * Selector de Esquema de Color integrado: **Oscuro**, **Claro** y **Personalizado**.
- **Vinculación Reactiva en Tiempo Real (60 FPS) & ThemeManager**:
  * Vinculación directa en Three.js/R3F para siluetas de selección, marcadores de snap, mallas y rejillas.
  * Inyector dinámico de variables CSS (`ThemeManager.tsx`) para fondos de panel, bordes, cabeceras de tabla (`--tabla-th-bg`), totales y tarjetas KPI.
- **Workflow Rápido de Copiar y Pegar #HEX con 1 Solo Toque**:
  * Botones individuales en cada fila para copiar el color hexadecimal con 1 clic al portapapeles y pegar directamente (`ClipboardPaste`) con feedback visual instantáneo (`COPIADO` / `PEGADO`).
- **Persistencia de Preset ("Guardar como predefinido")**:
  * Botón para almacenar la combinación de colores activa en `localStorage` (`3bf_colores_predefinidos`) con auto-hidratación inmediata al abrir la plataforma.
- **N-Panel Contextual y Overlay Limpio por Vista**:
  * **Visor 3D:** El N-Panel reside en su posición nativa dentro del lienzo WebGL con ancho redimensionable y tira vertical de 6 pestañas.
  * **Despiece & Costos y Base de Datos:** Eliminado el botón circular flotante invasivo; al presionar **`N`**, el panel de Apariencia se despliega directamente encima del panel fijo derecho (`ControlPanel`), cubriéndolo al 100% sin invadir las tablas de datos y mostrando exclusivamente la configuración de esa sección.

---

### 🔹 Hito 3BF_Persistencia_Simbiotica_UI_Responsiva — Arquitectura de Gemelo Digital .3bf.json en Google Drive, Persistencia Simbiótica con BD de Costos, Redimensión Ergonómica de Panel y Transición Dinámica Texto/Miniatura (19 de Agosto, 2026)

- **Persistencia Simbiótica (`.3bf.json` en Google Drive + Base de Datos)**:
  * Al pulsar **Guardar como...**, se genera un paquete integral de Gemelo Digital atómico (`.3bf.json`) almacenado en `G:\Mi unidad\Muebles\[Marca]\[Tipología]\...`.
  * El paquete encapsula de forma simbiótica: (1) Geometría y parámetros 3D completos, (2) Ficha técnica de despiece, metros de cantos, herrajes y costeo 100%, (3) Miniatura WebGL de alta definición y (4) Metadata comercial.
  * Los precios de materiales quedan congelados referenciando los registros maestros de la **Base de Datos** (Novopan, Pelíkano, Blum, etc.), logrando una reconstrucción 100% fiel al abrir el mueble.
- **Redimensión Ergonómica del Panel Derecho**:
  * Implementado un divisor interactivo (`cursor-ew-resize`) entre el área principal y el panel lateral derecho con persistencia en `localStorage` (de 280px a 800px, predeterminado 380px), eliminando truncamientos en textos como *"líneas de rejilla"*.
- **Transición Adaptativa Miniatura ➔ Texto Puro**:
  * En el Asset Browser de Muebles, las tarjetas mantienen un tamaño uniforme acotado estilo Blender (`70×70px`). Al contraer el panel a su mínimo ancho, la miniatura desaparece automáticamente dejando el 100% del ancho para el nombre del producto (`00002`) sin truncamientos.
- **Unificación del Botón Guardar en Ficha de Despiece**:
  * Consolidación de los botones duplicados en un único botón redondeado (`rounded-full`) que abre directamente el Asset Browser de Muebles en el panel derecho.

---

### 🔹 Hito 3BF_UI — Homologación Integral de Apariencia Tech Ethos / Obsidian Teal en Base de Datos, Botones Píldora Visor 3D, Reordenamiento Ergonómico DfMA y Calibración Milimétrica de Barra Superior (19 de Agosto, 2026)

- **Homologación Visual Completa de Base de Datos (`DatabaseView.tsx`)**:
  * Sincronización al 100% de todas las tablas maestras (Herrajes, Tableros, Cantos), paneles de proveedores y costos de conversión industrial con el sistema de variables `coloresApariencia` (Tech Ethos y Obsidian Teal).
- **Botones Píldora Estilo Visor 3D**:
  * Estandarización de las pestañas secundarias (*Herrajes & Accesorios*, *Tableros & Sustratos*, *Cantos & Acabados*, *Negociación Proveedurías*, *Mano de Obra & CIF*) y botones de acción (*Importar Excel*, *Guardar Cambios*, *+ Nuevo Herraje*) al formato píldora (`rounded-full`), con bordes redondeados y estados activo/inactivo contrastados.
- **Reordenamiento Ergonómico DfMA en Herrajes**:
  * Reubicación de columnas: *Proveedor* situado tras *Descripción Comercial*, y *Unidad* tras *Mallas por Unidad*, logrando una agrupación lógica que posiciona las métricas de costo monetario a la derecha.
- **Depuración & Limpieza Visual**:
  * Removido el prefijo `"RH_OUT: "` en todas las filas de la tabla de Herrajes.
  * Removidas las etiquetas secundarias redundantes de las cabeceras de proveedores (Arauco, Duratex, Masisa, Novopan).
  * Eliminada la tarjeta de simulación de liquidación y convertidos los indicadores *"Estándar ERP 100%"* y *"4 Proveedores Activos"* a texto plano limpio.
- **Calibración de Contrastes en Modo Claro (*Tech Ethos*)**:
  * Fondo de cabeceras de tabla a `#E2E8F0` con divisor `#CBD5E1`, texto `#1E293B`, rayado alternado (*zebra striping* `#FFFFFF` / `#F8FAFC`) y color corporativo cian en el icono de importación de Excel.
- **Armonización de Alturas en Barra Superior (`app/page.tsx`)**:
  * Homologación dimensional de todos los componentes de la barra de herramientas (Pestañas centrales, Modos 3D, Botón de Cámara, Switch Light/Dark e indicador `vBeta 0.1 Online`) en contenedores cápsula `h-9` (36px, `p-1`) con elementos interactivos interiores `h-7` (28px).

---

### 🔹 Hito 3BF_Web — Despliegue de Producción en Netlify con Dominio https://3bf.mariomojica.com, Puente Cloudflare Tunnel con RhinoCompute 8, Icono Oficial Icon_3BF y Homologación Visual Tech Ethos en Base de Datos (20 de Agosto, 2026)

- **Despliegue y Activación en la Nube (`https://3bf.mariomojica.com`)**:
  * Configuración del archivo `3bf/netlify.toml` con plugin `@netlify/plugin-nextjs`, directivas de compilación estática/dinámica, archivo `robots.txt` y cabeceras HTTP de no-indexación (`X-Robots-Tag: noindex, nofollow, noarchive, nosnippet`).
  * Creación y vinculación del subdominio oficial con registro CNAME en Cloudflare DNS y certificado SSL aprovisionado.
- **Túnel Seguro de Comunicación Cloudflare Tunnel (`cloudflared`)**:
  * Instalación y ejecución del túnel seguro de Cloudflare comunicando el puerto local `8005` (FastAPI / RhinoCompute 8) con la web en Netlify mediante `NEXT_PUBLIC_3BF_WORKER_URL`.
  * Verificación del indicador de estado en vivo en la barra superior (`🟢 vBeta 0.1 Online`).
- **Saneamiento Integral del Historial Git**:
  * Purga histórica mediante `git filter-branch` de videos residuales antiguos (>100MB) para asegurar sincronización y deploys limpios a GitHub.
- **Icono Oficial `Icon_3BF`**:
  * Procesamiento del asset `Icon_3BF.png` a formatos `.ico` y `.png` multirresolución (16x16 hasta 256x256) e integración en `RootLayout` como favicon oficial del navegador con soporte cache-busting.
- **Homologación de Tablas y Limpieza Visual en Base de Datos (`DatabaseView.tsx`)**:
  * Homologación uniforme del fondo de la fila de cabeceras en la tabla de tableros, eliminando franjas y bloques de color en `Lista (USD)`, `Desc. Cara` y `Fábrica (COP)`.
  * Eliminación de emojis/sufijos redundantes (✏️, (I), 🏭) para una estética 100% sobria y profesional.

---

* **[2026-08-20] Hito 3BF_GLBGOOD — Editor de Materiales PBR, Galería Redimensionable y Exportación GLB 100% Sólida para Blender HD:**
    - **Galería de Materiales Redimensionable**: Implementación de separador interactivo vertical (`cursor-row-resize`) con tirador visual y persistencia en `localStorage` (`3bf_altura_galeria_materiales`) en `MaterialManagerPanel.tsx`.
    - **Blindaje Total de Normales y Caras Paralelas**: Implementación matemática de orientación de normales inversas para caras paralelas del tablero:
      - Cara Superior (`Color cubierta`): Normal estrictamente hacia $+Y$ (arriba).
      - Cara Inferior (`Balance cubierta`): Normal estrictamente hacia $-Y$ (abajo con inversión de vértices).
      - Cantos y perforaciones (`MDP`): Normales perimetrales hacia afuera.
    - **Purga de Planos Fantasmas en Blender**: Eliminación definitiva de mallas auxiliares y helpers anónimos de Three.js (`Pieza_3BF...`, sombras, outlines, edges) en el exportador GLB (`Viewer3D.tsx`).
    - **Separación Estricta de Modos Visuales**:
      - **Modo Sólido**: Renderizado y exportación en Gris Técnico limpio (`#CBD5E1`) sin texturas.
      - **Modo Renderizado**: Materiales PBR completos con mapas de madera, melamina, MDP expuesto y metales para Cycles/Eevee.
    - **Detección Global de Modelos en Escena**: El botón `⬇ Descargar GLB` exporta las instancias activas directamente sin requerir que la pieza esté seleccionada en ese instante.

---

* **[2026-08-21] Hito 3BF_RaycastEdges — Sistema Óptico de Raycasting de Cámara (HoverRaycastTracker), Soldado de Aristas Coplanarias y Jerarquía HUD en Visor 3D:**
    - **Sistema Óptico de Raycasting de Cámara (`HoverRaycastTracker`)**:
      * Implementación de raycaster estricto proyectado desde la cámara activa (`raycaster.setFromCamera(pointerNDC, camera)`) para detección 100% física de mallas 3D.
      * Eliminación de tooltips persistentes en el vacío: el tooltip desaparece inmediatamente ($0\text{ ms}$) al apuntar a la rejilla o suelo, eliminando colisiones con eventos locales y bucles de frame.
      * Corrección en el Desglose de Partes (`PartBreakdownPanel.tsx`), eliminando la persistencia de hover al hacer clic en filas de componentes.
    - **Delineado de Aristas Coplanarias con Soldado de Vértices (`BufferGeometryUtils.mergeVertices`)**:
      * Aplicación de unificación geométrica de vértices con tolerancia de $0.001\text{ mm}$ antes de generar `THREE.EdgesGeometry`.
      * Eliminación total de líneas de triangulación y costuras falsas en caras planas (como cantos entre tarugos y pernos), resaltando únicamente quiebres de $90^\circ$ y cilindros de mecanizado.
    - **Alineación de Modo Sólido con Color de Capa**:
      * En Modo Sólido, cada pieza adopta en tiempo real el color exacto asignado a su capa (`capa.color`), reaccionando instantáneamente a los cambios del Gestor de Capas.
    - **Mejoras en UI & Gestor de Capas**:
      * Esferas 3D de material asignado con volumen e iluminación realista (`18px × 18px`), reflejo especular adaptativo y destellos en metales (`Sparkles`).
      * Eliminación de las columnas obsoletas `ACT` (Capa Activa) y `BLOQ` (Bloqueo) en el Gestor de Capas, optimizando el espacio horizontal.
      * Botón de guardado superior izquierdo con estilo cápsula (`rounded-full`) y texto `"Guardar"`, con conteo dinámico de componentes y reporte de `(0) Componentes` en escenario vacío.
      * Botón de captura rápida de miniatura fotográfica (📷) al pasar el cursor sobre las tarjetas de la Biblioteca de Componentes.
      * Documentación técnica canónica y guía de recuperación rápida consignada en `3BF/3BF_Proceso.md` y `3BF/PROCESOS/proceso.md`.

---

* **[2026-08-21] Hito 3BF_DrillingCAM — Sistema DfMA de Perforación Inter-Componentes, Calibración Homologada y Generación CAM DXF desde OpenNURBS:**
    - **Extracción Analítica de Cilindros OpenNURBS (`3bf_worker.py`)**:
      * Deserialización de geometrías `rhino3dm.Brep` / `archive3dm` generadas por Grasshopper para extraer coordenadas $[X_c, Y_c, Z_c]$, radios, alturas, ejes principales y tipos de broca ($\varnothing 5$, $\varnothing 8$, $\varnothing 15$, $\varnothing 35$) sin recurrir a booleanos de mallas poligonales.
    - **Endpoint de Detección e Intersección Espacial 3D (`/mecanizar-intercomponentes`)**:
      * Algoritmo de intersección geométrica 3D que evalúa la penetración de cilindros de fijación de cualquier componente sobre los tableros vecinos en escena con tolerancia de $25\text{ mm}$.
      * Mapeo de coordenadas locales $(u, v)$ en milímetros y clasificación automática de caras de entrada (`cara_superior`, `canto_izq`, `canto_der`).
    - **Integración en Flujo de Interfaz & DXF CAM**:
      * Botón **`⚡ Perforar Mueble`** y **`🗑️ Limpiar`** integrados en el HUD del Visor 3D (`Viewer3D.tsx`) y en la barra de fabricación de la Ficha Técnica (`DespieceView.tsx`).
      * Exportador DXF (`/export-dxf`) con inserción de entidades `CIRCLE` en las capas normalizadas de seccionadoras y centros de taladrado Biesse Skipper (`TCHW0B2D1200`, `TCHW1B8D2500`, `TCHW0B15D1350`).
    - **Homologación de Estilos en Panel Calibrar**:
      * Rediseño completo de los controles del panel de Calibración 3D con sub-tarjetas individuales, pistas de slider en cian corporativo, cajas de entrada numérica directa (`DirectNumberInput`) y ampliación del rango de ángulo umbral hasta $120^\circ$.
      * Homologación en tono gris de la jerarquía de componentes en el HUD superior izquierdo.
    - **Memoria Técnica & Documentación**:
      * Registro exhaustivo de la arquitectura de mecanizado inter-componentes y fórmulas DfMA en `3BF/3BF_Proceso.md` y `3BF/PROCESOS/proceso.md`.

---

* **[2026-08-21] Hito 3BF_Undo_Redo_Rename — Historial Profundo de 100 Operaciones (Ctrl+Z / Ctrl+Y), Renombrado Interactivo en HUD 3D & Exportación Multi-Pieza DXF:**
    - **Historial de Deshacer / Rehacer de 100 Estados (Undo / Redo)**:
      * Implementación de cola circular en memoria (`SnapshotEscenario` en `pilaHistorial`) con capacidad estricta de hasta 100 estados de escena.
      * Registro automático de instantáneas ante: inserción de componentes, transformaciones espaciales (Grab / Snap), duplicación, borrado, alteración de sliders paramétricos y renombrado.
      * Activación de atajos de teclado globales en toda la aplicación: `Ctrl + Z` / `Cmd + Z` (Deshacer) y `Ctrl + Y` / `Ctrl + Shift + Z` (Rehacer).
    - **Renombrado Interactivo en el HUD Superior Izquierdo (Doble Clic)**:
      * En la lista jerárquica de componentes del HUD del visor 3D (`• Cubierta`, `• Cubierta_01`), el usuario puede hacer **doble clic** sobre cualquier componente para activar el editor de texto en línea (`<input />`).
      * Confirmación inmediata mediante tecla `Enter` o pérdida de foco (`onBlur`), o cancelación con `Escape`.
      * Sincronización reactiva mediante `renombrarInstancia(id, nuevoNombre)`, propagando el nombre a la lista de corte BOM, matriz de costos, nombres de exportación CAM y árbol de objetos.
    - **Exportación DXF Multi-Pieza (1 Archivo por Tablero)**:
      * Botón principal adaptado para exportar secuencialmente archivos DXF independientes para cada tablero del mueble (`Cubierta_498x480_15mm_BD1.0.dxf` y `Cubierta_01_498x480_15mm_BD1.0.dxf`), cada uno con sus propias geometrías y mecanizados cruzados.
      * Botón de descarga rápida individual por fila (`Download`) incorporado en la Tabla 1 de Despiece.
      * Eliminación del residuo hardcodeado `"Minifix"` en los defaults de `/export-dxf`, respetando la unión activa ("Tornillo y Tarugo") sin generar taladros fantasma.
    - **Documentación Técnica & Memoria**:
      * Registro del estándar en `3BF/3BF_Proceso.md`, `3BF/PROCESOS/proceso.md` y `ESTADO_DEL_PROYECTO.md`.

---

* **[2026-08-21] Hito 3BF_SaveFurniture_Fix — Botón Guardar Cambios en HUD 3D, Sanitización de Posición/Rotación y Blindaje de Apertura de Muebles:**
    - **Botón Guardar Cambios Siempre Visible y Funcional en HUD Superior Izquierdo**:
      * Botón `Guardar` con ícono `<Save />` visible permanentemente en el Nivel 1 del HUD 3D.
      * Si se trabaja sobre un mueble abierto del catálogo (`muebleActivoGuardado`), al presionar `Guardar` se ejecuta `guardarCambiosMueble()` sobrescribiendo instantáneamente el estado, posiciones 3D, sliders y miniaturas tanto en memoria como en Google Drive (`save_furniture`).
      * Si es un diseño nuevo no guardado, activa el flujo guiado `Guardar como` (`modalGuardarComoAbierto`).
    - **Resolución de Error Crítico `TypeError: v.posicion is not iterable`**:
      * Sanitización profunda con comprobación `Array.isArray()` en `guardarEstadoHistorial`, `deshacer`, `rehacer`, `abrirMueble` y serialización de muebles.
      * Prevención absoluta de fallos ante instancias antiguas o incompletas restauradas desde Google Drive.
    - **Documentación Técnica & Memoria**:
      * Consignado en `ESTADO_DEL_PROYECTO.md` y `3BF/3BF_Proceso.md`.

---

* **[2026-08-22] Hito 3BF_AutoWatchHotReload — Detección Automática de Guardado en Grasshopper (File Watcher mtime & Hot-Reload Autónomo sin Clics):**
    - **Observador de Archivos GHX en Tiempo Real (`GHXAutoWatcher` & `/check-mtime`)**:
      * Monitoreo continuo y ultra-ligero del timestamp de modificación (`os.path.getmtime`) de todos los componentes presentes en la escena 3D.
      * Al presionar `Ctrl + S` en Grasshopper, Windows actualiza el `mtime` del archivo en disco.
      * El componente `<GHXAutoWatcher />` detecta el cambio en milisegundos, aplica un *debounce* de seguridad de $300\text{ ms}$ (para garantizar que Rhino termine la escritura XML) y dispara `recargarDefinicionInstancia(id)` de forma 100% autónoma.
    - **Experiencia de Usuario Minimalista y Cero Fricción**:
      * Se eliminó el botón manual de actualización del encabezado de parámetros (`ControlPanel.tsx`), dejando una interfaz despejada con indicador sutil de estado (`Sincronizando...`).
      * Las dimensiones configuradas por el usuario se conservan intactas mientras los nuevos parámetros `RH_IN:` y la geometría 3D se actualizan al instante sin mover la cámara.
    - **Documentación Técnica & Memoria**:
      * Consignado en `ESTADO_DEL_PROYECTO.md` y `3BF/3BF_Proceso.md`.

---

* **[2026-08-22] Hito 3BF_DeleteComponent — Borrado Rápido de Componentes con Tecla Delete / Supr / Backspace / X y Botón de Papelera en HUD:**
    - **Atajos de Teclado Globales (`Delete`, `Supr`, `Backspace`, `X`)**:
      * Al presionar `Delete`, `Backspace` o `X` (mientras no se esté editando texto ni en modo Grab), el componente seleccionado se elimina inmediatamente del escenario 3D.
      * El foco de selección se transfiere de forma segura al siguiente componente disponible o se limpia el estado si la escena queda vacía.
      * Cada borrado queda registrado en el historial para poder deshacer con `Ctrl + Z`.
    - **Icono de Papelera en Lista HUD (`Viewer3D.tsx`)**:
      * Se integró un botón interactivo de papelera (`Trash2`) visible al pasar el cursor sobre cualquier componente en el listado superior izquierdo, permitiendo eliminarlo también con un clic.
    - **Documentación Técnica & Memoria**:
      * Consignado en `ESTADO_DEL_PROYECTO.md` y `3BF/3BF_Proceso.md`.

---

* **[2026-08-22] Hito 3BF_LogoTextColor_And_Color3BF — Atributos Dedicados "Texto Logotipo" y "Color 3BF" en Apariencia:**
    - **Separación Precisa de Colores de Marca (`app/page.tsx` & `AppearanceSettingsPanel.tsx`)**:
      * `Texto logotipo` (`textoLogotipo`): Controla exclusivamente el título `"3dBimFab"` y el subtítulo `"Powered by MARIO MOJICA"`.
      * `Color 3BF` (`color3BF`): Controla independientemente el texto `"3BF"` dentro del recuadro rojo (por defecto `#FFFFFF` blanco inmutable).
    - **Documentación Técnica & Memoria**:
      * Consignado en `ESTADO_DEL_PROYECTO.md` y `3BF/3BF_Proceso.md`.

---

* **[2026-08-22] Hito 3BF_UniversalGrainMapping_And_MeshUVFix — Mapeado Universal de Veta 3D y Corrección de UVs en Visor Three.js:**
    - **Causa Raíz Descubierta en Three.js (`Viewer3D.tsx`)**:
      * Los tableros que no se llamaban "Cubierta" (como `RH_OUT:Frente de Cajon`, `RH_OUT:Lateral Izquierdo`, etc.) caían en el grupo `otherMeshes`, donde la propiedad `uvs={m.uvs}` no se estaba pasando al componente `BoardMesh`. Por esta razón, el visor WebGL descartaba las coordenadas UV calculadas por Grasshopper y recurría a una proyección triplanar estática.
      * Se amplió el filtro de `boardMeshes` para incluir `frente`, `lateral`, `tapa`, `posterior`, `cajon`, `panel`, `tablero`, y se garantizó el paso de `uvs={m.uvs}` en todos los grupos.
    - **Algoritmo Universal de Mapeo en Grasshopper (`3BF`)**:
      * Reemplazo del complejo esquema de 6 cajas y rotaciones por una proyección adaptativa paramétrica que detecta la orientación del tablero y permite alternar entre `Longitudinal (0)` y `Atravesada (1)`.
    - **Documentación Técnica & Memoria**:
      * Consignado en `ESTADO_DEL_PROYECTO.md` y `3BF/3BF_Proceso.md`.

---

* **[2026-08-22] Hito 3BF_ActiveSelectionUX_And_EdgebandGrainFix — Veta Continua en Cantos y UX de Selección Activa en N-Panel:**
    - **Alineación Continua de Veta en Cantos (Estándar Tapacanto PVC)**:
      * En el script Python de Grasshopper, la veta en los 4 cantos de cualquier tablero (horizontal, lateral o frontal) corre siempre de forma longitudinal y continua a lo largo del canto a escala métrica ($600\text{ mm}$), mientras que las caras principales responden al selector `Longitudinal / Atravesada`.
    - **UX de Conexión y Estado Desactivado en N-Panel (`ControlPanel.tsx`)**:
      * Cuando ningún objeto está seleccionado en el visor 3D, el panel lateral muestra un estado inactivo claro e interactivo con aviso explicativo y botón directo de 1 clic para seleccionar el componente activo, evitando modificar controles desconectados.
    - **Documentación Técnica & Memoria**:
      * Consignado en `ESTADO_DEL_PROYECTO.md` y `3BF/3BF_Proceso.md`.

---

* **[2026-08-22] Hito 3BF_DynamicSelectionBoundingBoxFix — Actualización Dinámica del Marco Perimetral de Selección en Todos los Ejes (X, Y, Z):**
    - **Detección Tridimensional Completa (`Viewer3D.tsx`)**:
      * La clave de actualización del marco perimetral (`bboxKey`) no estaba evaluando el eje $Y$ (altura). Se incorporaron `locMinY` y `locMaxY` en el hash reactivo, y se amplió el cálculo del BoundingBox para abarcar todas las piezas del mueble (`frente`, `lateral`, `cajon`, etc.), haciendo que el contorno naranja se redimensione de forma fluida e instantánea al cambiar Alto, Ancho o Profundidad.
    - **Documentación Técnica & Memoria**:
      * Consignado en `ESTADO_DEL_PROYECTO.md` y `3BF/3BF_Proceso.md`.

---

* **[2026-08-22] Hito 3BF_AutoAssignTonoToLaminas — Asignación Automática de Capa "Tono" para Tableros y Láminas:**
    - **Coherencia Visual en Desglose de Partes (`PartBreakdownPanel.tsx`)**:
      * Al importar un componente GHX sin capas explícitas, el sistema ahora asigna automáticamente la capa **"Tono"** a todos los tableros y láminas (`cubierta`, `lateral`, `frente`, `tapa`, `cajon`, `entrepaño`, etc.), mientras que los herrajes (`perno`, `tornillo`, `caja`) se enrutan a sus capas correspondientes.
      * Se elimina la discrepancia donde el desplegable mostraba "Acero" por defecto pero el visor 3D renderizaba madera.
    - **Documentación Técnica & Memoria**:
      * Consignado en `ESTADO_DEL_PROYECTO.md` y `3BF/3BF_Proceso.md`.

---

* **[2026-08-22] Hito 3BF_SanitizeLegacyAceroLayers — Higienización Reactiva de Capas en Memoria Local (localStorage):**
    - **Saneamiento Automático de Tableros (`lib/store.ts` & `PartBreakdownPanel.tsx` & `Viewer3D.tsx`)**:
      * Se implementó un filtro de higienización que detecta y reemplaza cualquier asignación residual de `"capa_acero"` en piezas de tablero (`lateral`, `cubierta`, `frente`, `tapa`, `cajon`, `entrepaño`) tanto al cargar el estado desde `localStorage` como en el renderizado del visor 3D, garantizando que el `Lateral Izquierdo` y todos los costados amanezcan y permanezcan vestidos de **Tono (Madera)** de forma 100% confiable.
    - **Documentación Técnica & Memoria**:
      * Consignado en `ESTADO_DEL_PROYECTO.md` y `3BF/3BF_Proceso.md`.

---

* **[2026-08-22] Hito 3BF_PureDynamicParameterForwarding — Cero Hardcoding y Descubrimiento Dinámico Universal de Parámetros RH_IN:**
    - **Arquitectura Paramétrica Pura (`worker/3bf_worker.py`)**:
      * Se eliminó por completo el bloque legacy hardcodeado de parámetros fijos.
      * El Worker ahora opera bajo una arquitectura 100% agnóstica al modelo: cualquier slider, lista o parámetro que comience con `RH_IN:*` en Grasshopper (sea "Abrir Cajones", "Abrir Puertas", "Ángulo", "Espesor", etc.) es descubierto dinámicamente desde el XML de Grasshopper y retransmitido a RhinoCompute sin requerir conocimiento previo del mueble.
    - **Documentación Técnica & Memoria**:
      * Consignado en `ESTADO_DEL_PROYECTO.md` y `3BF/3BF_Proceso.md`.

---

* **[2026-08-22] Hito 3BF_ComputeDebounceAndAbortController — Fluidez Extrema con Debounce Inteligente y Cancelación de Peticiones Viejas:**
    - **Control de Concurrencia y Anti-Saturación (`lib/store.ts` & `ControlPanel.tsx`)**:
      * **Debounce de 180ms en Sliders**: Mientras el usuario arrastra un slider, la interfaz visual (número y barra) se actualiza de forma sedosa a 60 FPS sin saturar a RhinoCompute con 40 peticiones por segundo. El cálculo pesado se dispara únicamente cuando el usuario pausa o suelta el ratón (`onPointerUp`).
      * **Disparo Instantáneo (0ms) en Input Numérico y Selectores**: Al digitar un número y presionar `Enter` o `Blur`, o al elegir una opción en listas desplegables, el sistema ejecuta el cálculo 3D inmediatamente sin esperar ningún timer.
      * **AbortController Activo**: Se cancelan automáticamente las peticiones en vuelo previas para erradicar por completo los saltos geométricos ("saltos hacia atrás") provocados por respuestas fuera de orden.
    - **Documentación Técnica & Memoria**:
      * Consignado en `ESTADO_DEL_PROYECTO.md` y `3BF/3BF_Proceso.md`.

---

* **[2026-08-23] Hito 3BF_PureGeometricThickness1to1 — Fidelidad Geométrica Pura 1:1, Cero Clamping y Lectura Exacta de Espesores desde Grasshopper:**
    - **Erradicación de Clamping Artificial (`worker/3bf_worker.py`)**:
      * Se eliminaron por completo las restricciones mínimas heredadas (`max(0.005, ...)` y el condicional legacy `if esp_malla < 5.0: esp_malla = 15.0`) que forzaban a los fondos de cajón y tableros delgados de 3 mm a reportarse como 5 mm o 15 mm.
      * El Bounding Box de RhinoCompute y la matriz de despiece leen y reportan de forma pura y sin alteraciones las dimensiones reales calculadas por Grasshopper (ej. 3.0 mm para fondos HDF/MDF, 2.7 mm para traseras o 15.0/18.0/25.0 mm para estructuras).
    - **Afinamiento de Consolidación Espacial Geométrica (`3bf_worker.py`)**:
      * Se condicionó la fusión de mallas espaciales superpuestas a tolerancias dimensionales estrictas (`diff_lar < 15mm` y `diff_anc < 15mm`), evitando que piezas distintas con centros espaciales cercanos (como laterales de cajón y laterales estructurales del mueble) se fusionen por error.
    - **Documentación Técnica & Memoria**:
      * Consignado en `ESTADO_DEL_PROYECTO.md` y `3BF/3BF_Proceso.md`.

---

* **[2026-08-23] Hito 3BF_AIRenderStudio_GeminiImagen3_PromptHub — 3BF AI Render Studio: Motor Fotorrealista fal.ai (Google Nano Banana 1:1, Bria & FLUX Dev), Google Gemini & Prompt Hub:**
    - **Motor de Render IA Multi-Proveedor (`/api/render-ia`)**:
      * Integración nativa con **`fal-ai/nano-banana/edit`** (el modelo original de edición de Google utilizado en Google Flow) que calca con fidelidad tridimensional 1:1 el producto de origen a partir de la captura 3D e inserta la ambientación con luz y sombras de contacto reales en el suelo.
      * Soporte complementario para **Bria Product Shot**, **FLUX.1 Dev** y motor de respaldo **FLUX.1 Libre**.
    - **Biblioteca de Prompts Calibrada ("Prompt Hub" — `PromptLibraryManager.tsx`)**:
      * Presets profesionales con nuevo preset de **Calibración Estricta 1:1 en Fondo Blanco Puro**, Oficina Ejecutiva, Sala Japandi, Dormitorio Cálido, Catálogo Fondo Neutro y Showroom Boutique con persistencia en `localStorage`.
    - **Captura Limpia 3D Proporcional (`Viewer3D.tsx`)**:
      * Función `__capturarEscenaRenderIA` con recorte $1:1$ centrado (cero deformación anamórfica) y aislamiento puro sin grilla ni gizmos.
    - **Modal Interactivo "3BF AI Render Studio" (`AIRenderStudioModal.tsx`)**:
      * Panel de control dual con gestión de API Keys (fal.ai y Google), selector de aspect ratio, comparador Antes/Después y descarga en alta calidad HD (PNG).
    - **Documentación Técnica & Memoria**:
      * Consignado en `ESTADO_DEL_PROYECTO.md` y `3BF/3BF_Proceso.md`.

---

### 🔹 Hito 3BF_PBRMaterialStudio_ShaderBallLab — Laboratorio de Calibración de Materiales PBR, Generador Algorítmico de Mapas en Canvas 2D & Shader Ball 3D en Vivo (23 de Agosto, 2026)

- **Generador Algorítmico Instantáneo de Mapas PBR (`lib/pbrMapGenerator.ts`)**:
  * Motor en Canvas 2D que procesa cualquier imagen o fotografía en $<50\text{ms}$ para generar:
    * **Normal Map (RGB Tangente)**: Derivadas espaciales de Sobel $3\times 3$ $(dX, dY)$ normalizadas a vector unitario azul/púrpura $(R=X, G=Y, B=Z)$ con micro-relieve táctil de poro y veta.
    * **Roughness Map (Brillo/Mate B&N)**: Ecualización de luminosidad calibrada según tipo de material (Melamina satinada $0.45$, Madera rústica $0.65$, Metal $0.25$, Pintura $0.30$).
    * **Ambient Occlusion (AO)**: Detección laplaciana de micro-cavidades para acentuar sombras en el poro de la madera.
    * **Ajustes de Diffuse**: Brillo, Contraste, Saturación y Tinte cromático (*Color Tint Overlay*).
- **Shader Ball 3D Interactivo en Tiempo Real (`components/viewer/ShaderBallViewer.tsx`)**:
  * Visor Three.js con `MeshPhysicalMaterial` / `MeshStandardMaterial` que responde a 60 FPS a los sliders físicos.
  * Selector de geometrías de prueba intercambiables: **Esfera PBR (*Shader Ball*)**, **Tablero Plano con Cantos** (ideal para melaminas de muebles) y **Cubo Biselado**.
  * Control de rotación de luz de estudio en $360^\circ$ con slider interactivo.
- **Modal de Calibración "3BF PBR Material Studio" (`components/ui/PBRMaterialStudioModal.tsx`)**:
  * Panel dividido en 3 columnas ergonómicas en tema claro **"Tech Ethos"**:
    * *Columna Izquierda*: Subida de texturas, botón mágico **`✨ Auto-Generar Canales PBR (0.1s)`** y tarjetas de los 4 canales con miniaturas e intensidad de relieve.
    * *Columna Central*: Visor Shader Ball 3D interactivo con órbita $360^\circ$ y selector de geometría.
    * *Columna Derecha*: Propiedades Principled BSDF (Nombre, Tipo, Marca/Proveedor, Metalicidad, Capa de resina *Clearcoat*, IOR, Especularidad) con botones `💾 Guardar en Catálogo PBR` y `🎯 Aplicar al Mueble 3D Activo`.
- **Enlace Físico en Viewport Principal (`Viewer3D.tsx` & `MaterialManagerPanel.tsx`)**:
  * Incorporación del hook reactivo `useMaterialPBRMaps` para cargar simultáneamente texturas difusas, mapas de normales, rugosidad y AO sobre las mallas del mueble.
  * Acceso directo con botón **`🧪 PBR Studio`** en la cabecera y en el panel de materiales.
- **Documentación Técnica & Memoria**:
  * Registrado en `ESTADO_DEL_PROYECTO.md`, `3BF/3BF_Proceso.md` y artefacto `walkthrough.md`.

---

### 🔹 Hito 3BF_AIRenderStudio_GeminiImagen3_PromptHub_PhotaEnhance — 3BF AI Render Studio: Motor Fotorrealista Google Nano Banana PRO / Imagen 3, Mejorador 4K Phota Enhance, Prompt Hub Persistente & PBR Studio Fullscreen (23 de Agosto, 2026)

- **Integración Directa 3BF AI Render Studio (`components/ui/AIRenderStudioModal.tsx` & `app/api/render-ia/route.ts`)**:
  * Modal ergonómico expandido a tamaño gigante (`98vw x 95vh`) con modo pantalla completa 100%.
  * Encuadre 3D conectado en vivo con la captura de alta fidelidad del mueble calibrado en el viewport (texturas PBR, cantos, aristas y piso ciclorama de estudio).
  * Render resultante protagonista con visualización maximizada, comparador interactivo *Render IA vs Captura 3D*, y botones de acción rápida (*Copiar*, *Usar como Miniatura del Proyecto*, *Descargar HD*).
- **Motor de Render Fotorrealista de Grado Editorial (`/api/render-ia`)**:
  * Integración con **`fal-ai/nano-banana-pro/edit` (Google Nano Banana PRO)** con pipeline de óptica fotográfica (apertura f/2.8, lentes de 35mm, sombras físicas de contacto difusas y textura táctil de madera).
  * Manejo tolerante de credenciales multi-fuente (`falKey`, `falApiKey`, `clientFalKey`, `geminiKey`, `geminiApiKey`) y soporte para motor libre **FLUX.1** de respaldo.
- **Mejorador de Imagen 4K con Phota Enhance (`fal-ai/phota/enhance`)**:
  * Botón directo **`✨ Mejorar con Phota 4K`** sobre la barra del render para aumentar nitidez, resolución y micro-texturas preservando 100% la identidad, geometría y veta del mueble.
  * Guardado automático en el historial de renders como `✨ [Phota 4K Enhanced]`.
- **Biblioteca de Prompts Calibrada ("Prompt Hub" — `components/ui/PromptLibraryManager.tsx`)**:
  * Presets editoriales arquitectónicos de alta gama (Oficina Nórdica con Laptop, Estudio Blanco Puro de Catálogo, Sala Japandi Minimalista, Habitación Moderna, Cocina Contemporánea) con persistencia en `localStorage`.
  * Prompts nativos en español con traducción optimizada y sistema de creación rápida de presets personalizados con categorización.
  * Optimización vertical al 100% del modal sin espacios muertos inferiores, y botón compacto de restauración de fábrica en el encabezado superior.
- **Laboratorio PBR con Mueble 3D Real & Control Dedicado de Aristas (`PBRMaterialStudioModal.tsx` & `ShaderBallViewer.tsx`)**:
  * Rediseño ergonómico a 2 columnas con navegación idéntica a Blender (MMB Órbita, Shift+MMB Pan, Ctrl+MMB Zoom).
  * Selector de 4 geometrías de prueba: **🔮 Esfera**, **🪵 Tablero Melamina**, **🧊 Cubo** y **🪑 Mueble 3D Real** (piezas paramétricas de RhinoCompute con `EdgesGeometry`).
  * Sección dedicada **`📐 3. Control de Aristas & Contornos`** en la columna izquierda: activación/desactivación reactiva, selector de color HEX con muestra en vivo, slider de opacidad (10% a 100%) y ángulo de umbral/threshold (1° a 89°).
  * Soporte para entornos HDRI de exterior (**Poly Haven Alps Field**) e interior nórdico de alta gama (**Poly Haven Modern Bathroom**).
  * Botón directo **`✨ Lanzar Render AI con este Material`** para conectar la calibración física 3D con la generación fotorrealista.
- **Coherencia Visual Total con "Apariencia"**:
  * Adaptabilidad completa de todos los modales, barras, botones, selectores y cajas de alertas al sistema de temas (`tema === "obsidian"` y `coloresApariencia`), garantizando legibilidad y alto contraste tanto en tema claro ("Tech Ethos") como oscuro ("Obsidian").

---

### 🔹 Hito 3BF_Render_AI_UI_Estandarizacion — Estandarización Universal de Botones Píldora, Depuración Visual de Estudio Render IA & Reordenamiento de Franja N-Panel (24 de Agosto, 2026)

- **Estandarización Universal de Botones Estilo Píldora (`rounded-full`) en Todo el Ecosistema 3BF**:
  * Se auditaron y unificaron todos los botones y acciones en todos los paneles y modales (`LayerManagerPanel.tsx`, `ControlPanel.tsx`, `FurnitureAssetBrowser.tsx`, `SaveFurnitureModal.tsx`, `AIRenderStudioModal.tsx`, `PromptLibraryManager.tsx`, `AppearanceSettingsPanel.tsx`, `DespieceView.tsx`, `DatabaseView.tsx`), reemplazando las esquinas rectangulares por el formato de píldora estándar del sistema (`rounded-full`), con tipografía consistente (`font-semibold text-xs`), color corporativo `botonActivo` y sombras sutiles (`shadow-xs`), logrando una coherencia estética 100% homogénea y minimalista.
- **Depuración Visual y Simplificación en Estudio de Render IA (`AIRenderStudioModal.tsx`)**:
  * **Cabecera Minimalista**: Se eliminaron los iconos de destello (`Sparkles`), insignias decorativas y el subtítulo redundante, dejando única y exclusivamente el título limpio **`3BF AI Render Studio`**.
  * **Testigo de Estado de API**: Reemplazo del botón de llave por un testigo minimalista con punto circular verde esmeralda (`bg-emerald-500`) y texto conciso **`Api AI Conectada`**, idéntico al testigo de estado `LOD200`.
  * **Limpieza de Motor IA**: Eliminados los emojis (`👑`, `🆓`) y el prefijo de proveedor en el selector, dejando los textos limpios: **`Google Nano Banana PRO (Recomendado)`** y **`FLUX.1 Libre (Sin Claves)`**.
  * **Upscaling y Comparación 1:1**: Botón de realce simplificado a **`Mejorar 2K`** con estilo de píldora azul sólido corporativo. Homogeneización de los botones de comparación (**Render IA Fotorrealista** y **Captura 3D Original**) con el mismo fondo de panel, borde y tipografía que la barra de acciones inferior (**Copiar**, **Usar Miniatura**, **Descargar HD**).
  * **Sección de Prompts y Presets**: Botones **`Guardar Preset`** y **`Biblioteca`** estandarizados en formato píldora limpia con formulario de guardado integrado.
- **Reordenamiento Estricto de Pestañas Verticales en N-Panel & Estados Reactivos (`NPanel.tsx`)**:
  * Reorganizada la franja lateral en la secuencia solicitada: (1) **Componentes**, (2) **Muebles**, (3) **Partes**, (4) **Capas**, (5) **Materiales**, (6) **Render IA**, seguido de la línea divisoria y los ajustes de visor (7) **Apariencia** y (8) **Calibrar**.
  * El botón **`Render IA`** ahora maneja dinámicamente los estados inactivo (color neutro de texto) y activo (azul sólido `botonActivo` con icono/texto blanco) idéntico a las demás pestañas, utilizando un icono de cámara fotográfica 3D limpio (`Camera`).
- **Calibración Óptica de Iluminación y Aristas en PBR Studio (`ShaderBallViewer.tsx` & `PBRMaterialStudioModal.tsx`)**:
  * Calibradas las intensidades base de luces de estudio y mapa HDRI para que el punto medio del slider ($1.0\text{x}$) ofrezca la visualización fotorrealista ideal.
  * Eliminados los iconos de regla (`📐`) de los controles de aristas.



















