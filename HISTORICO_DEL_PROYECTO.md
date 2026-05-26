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

---

*Última consolidación: 26 de Mayo, 2026*
