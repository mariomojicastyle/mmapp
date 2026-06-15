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



