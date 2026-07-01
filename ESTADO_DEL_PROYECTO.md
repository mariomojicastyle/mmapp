# 🧠 Estado Actual del Proyecto (Memoria Activa)

Este archivo es la "Memoria RAM" para Antigravity. Contiene el contexto de lo que estamos trabajando justo ahora, los objetivos pendientes y los bloqueos.

---

## 🏗️ 1. Plataforma B2B (Foco Actual)
**Estado:** Integración Supabase avanzada e Identidad Visual estandarizada.

### 🎯 Objetivos de la Fase
- [x] Migrar equipo a Supabase dinámico.
- [x] Corregir errores de hidratación y referencias en Solicitudes.
- [x] Sistema de Notificaciones Realtime (UI + DB + n8n).
- [x] Estandarización de Identidad Visual (Logo corregido en Login, Sidebar y TopNav).
- [x] Rediseño de Navegación Superior (TopNav con Créditos, Feedback y Búsqueda).
- [x] Rediseño de flujos de asignación de Solicitudes (Sliders, Roles SuperAdmin vs Coequipero, Vistas independientes).
- [x] Módulo de Proyectos & CMS de Armado (Vincular solicitudes a proyectos reales, modal "Nuevo Proyecto" restringido por rol).
- [x] **Pestaña Despiece y Calculador de Costos 3D (Refactorización V2)**:
  - Desglose de piezas individuales mediante badges apilados en lugar de cadenas de rangos.
  - Corrección de regex en escáner GLB para leer números de pegatinas desde nombres de padres con guiones o sin espacios.
  - Omitir el nodo raíz "Scene" para evitar nombres erróneos de piezas.
  - Filas de costo total por sección (Madera, Fondos, Herrajes) y alineación de herrajes a 14 columnas.
  - Bloque resumen de Gran Total al final de la pestaña.
- [x] **Módulo de Imagen de Perfil Interactiva (Hito Online_1)**:
  - Carga de imágenes locales y captura nativa de cámara web en vivo (`getUserMedia`) con previsualización circular Obsidian Teal.
  - Herramientas de ajuste: Zoom mediante slider, arrastre fluido (Pan) por pointer events y rotación acumulada a 90°.
  - Procesamiento por canvas a 150x150 píxeles codificado a Base64.
  - Galería con doble carrusel deslizable con flechas flotantes independientes para 20 personajes y 20 ilustraciones abstractas coloridas.
  - Sincronización en tiempo real del avatar cargado en el header (`TopNav`) y el menú lateral inferior (`RoleSelector` del `Sidebar`).
- [x] **Localización Multilingüe de la Landing Page B2B (Campaña_01)**:
  - Expansión de `LanguageContext` para soportar Portugués (pt) además de Español y Inglés.
  - Traducción estructural de 12 componentes clave (HeroManual, FAQ, ContactCTA, MetricsSection, etc.) inyectando variables en la función global `t()`.
  - Integración de selector en el Header para cambios en vivo con renderizado condicional rápido.
- [x] **Ecosistema de Analíticas, CRM B2B y Blindaje de Métricas (Hito Manual_Metricas)**:
  - Despliegue de Umami Analytics en producción en el Hetzner VPS con PostgreSQL y certificado SSL Let's Encrypt bajo el subdominio `analytics.mariomojica.com`.
  - Integración condicional y asíncrona del script de Umami en la Landing Page y en la Consola CMS Next.js.
  - Implementación de la tabla `Leads` (600) de Baserow con campo `Estado CRM` de selección única y automatización de alertas de pipeline en n8n.
  - Creación de API Route `/api/metrics/collect` en Next.js con rate limiting (40 llamadas/min) para evitar escrituras directas del cliente en Supabase.
  - Diseño e implementación de la vista de reportes PDF de fricción en la consola, optimizada para impresión física en tamaño A4 (`@media print`).
  - Creación del archivo maestro de diseño técnico [Arquitectura.md](file:///c:/Desarrollo/mmapp/Arquitectura/Arquitectura.md) y diagrama vectorial [arquitectura_V7.svg](file:///c:/Desarrollo/mmapp/Arquitectura/arquitectura_V7.svg) como ancla de referencia para el proyecto.


### 🚧 Bloqueos / Notas Técnicas
- **Identidad Visual:** Se utiliza el logo `Logo_vertical_color_en.svg` (corregido) como estándar global.
- **TopNav:** Implementa créditos dinámicos desde el perfil de Supabase (fallback a 1,250).
- **Control de Acceso:** Solo `superadmin` y `coequipero` tienen permisos para crear proyectos.
- **Detección de Nombres**: Se prioriza `child.parent.name` si no contiene la palabra "PIEZA" ni es "Scene", manteniendo la cohesión con los tooltips.
- **MIME Types en Subidas:** Se solucionó el error `TypeError: Failed to fetch` en subidas de archivos `.svg`/`.pdf` mediante un mapeo estricto de extensiones a tipos MIME que solventa fallos cuando el navegador reporta un tipo vacío en Windows.
- **Burbujas de Ayuda en Móvil:** Se centraron horizontalmente todas las burbujas superiores e inferiores en responsive y se desplazaron sus flechas direccionales de forma asimétrica para coincidir con la posición de sus botones correspondientes sin recortarse.

---

## 📂 2. Arquitectura de Proyectos y CMS de Armado (Nuevo Gran Objetivo)

### 🧩 2.1 Concepto
Convertir el aplicativo de armado 3D estándar en un **CMS independiente y multitenant** gestionado desde la plataforma de Mario Mojica:
1. **Servidor Central:** El manual vive en los servidores de `mariomojica.com`.
2. **Branding Dinámico (Admin Cliente):** El cliente con rol `admin` puede personalizar colores primarios/secundarios, subir logotipo, subir icono, y configurar garantía.
3. **Widget Embebible (PDP Nativos):** El manual se puede embeber en la web del cliente (ej. `maderkit.com.co`) en sus PDP (Product Detail Pages) como si fuera nativo, usando un `<iframe src="https://mariomojica.com/embed/armado/[id]"/>` o widget JS con autorización por dominio (CORS/Referer).
4. **Roles de Creación:** Solamente el `superadmin` y el `coequipero` pueden crear nuevos proyectos/productos. Los clientes solicitan el manual, Mario Mojica lo desarrolla y le da acceso a su manual en su cuenta de cliente para obtener el código de inserción.

### 💾 2.2 Estructura de Datos (Tablas Supabase)

#### Tabla `public.proyectos` (Nueva)
Representa un proyecto en la plataforma (B2B, B2C, Aplicativo de armado, Genérico).
```sql
CREATE TABLE public.proyectos (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    nombre text NOT NULL,
    tipo_proyecto text NOT NULL CHECK (tipo_proyecto IN ('Aplicativo de armado', 'B2B', 'B2C', 'Genérico')),
    estado text DEFAULT 'Nuevo' CHECK (estado IN ('Nuevo', 'En progreso', 'En revisión', 'Completado')),
    progreso integer DEFAULT 10 CHECK (progreso >= 0 AND progreso <= 100),
    client_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
    solicitud_id bigint REFERENCES public.solicitudes(id) ON DELETE SET NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);
```

#### Tabla `public.configuraciones_manual` (Nueva - Específica de Armado)
Almacena la personalización y los assets cargados para cada manual.
```sql
CREATE TABLE public.configuraciones_manual (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    proyecto_id uuid REFERENCES public.proyectos(id) ON DELETE CASCADE UNIQUE,
    -- Identidad Gráfica (Personalización de Cliente Admin)
    color_primario text DEFAULT '#0D9488', -- Obsidian Teal por defecto
    color_secundario text DEFAULT '#111827',
    logo_url text,
    favicon_url text,
    dominio_autorizado text, -- Ej: maderkit.com.co
    
    -- Assets Dinámicos del Producto (Alimentados por Mario Mojica Team)
    glb_pasos jsonb DEFAULT '[]'::jsonb, -- Lista de URLs de GLBs por paso
    audio_es_pasos jsonb DEFAULT '[]'::jsonb, -- Audios en español por paso
    audio_en_pasos jsonb DEFAULT '[]'::jsonb, -- Audios en inglés por paso
    audio_ayuda text, -- Audio global de ayuda
    imagen_herramientas text, -- Imagen de herramientas requeridas
    imagenes_ensambles jsonb DEFAULT '[]'::jsonb, -- Imagenes de ensambles especiales
    garantia_texto text, -- Texto de garantía del producto
    fotos_herrajes jsonb DEFAULT '[]'::jsonb, -- Fotos de tornillos/herrajes
    renders_fotorealistas jsonb DEFAULT '[]'::jsonb, -- Galería de renders 3D
    
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);
```

## 🗺️ 3. Plan de Implementación de la Fase 1 (Completado)

- [x] **Paso 1:** Crear la Interfaz del Modal "Nuevo Proyecto" (`components/proyectos/nuevo-proyecto-modal.tsx`) en Obsidian Teal con listados reactivos.
- [x] **Paso 2:** Control de Roles. Restringir la creación de proyectos exclusivamente a `SuperAdmin` y `Coequipero`.
- [x] **Paso 3:** Integración de Supabase. Creación de tablas (`proyectos`, `configuraciones_manual`) con RLS, Server Actions (`proyectos.ts`) y listados dinámicos.

---

## 📂 4. Arquitectura y Plan de la Fase 2: Detalle de Proyecto, Panel de Insumos y Manual Vacío

### 📦 4.1 Definición de "Manual Vacío" (Plantilla Replicable)
Un **"Manual Vacío"** es un cascarón o aplicación base centralizada (desplegada en `/embed/armado/[proyecto_id]`) que en lugar de leer archivos estáticos en carpetas locales (como hace `M01536`), consulta en tiempo real una API que retorna el JSON de `public.configuraciones_manual` desde Supabase.
- **Estado Inicial (Vacío):** Si el proyecto no tiene assets cargados, el manual despliega una pantalla interactiva elegante de bienvenida Obsidian Teal: *"Este manual se encuentra en fase de desarrollo. Esperando insumos del administrador."*
- **Activación Dinámica:** En el momento en que se cargan los insumos desde la plataforma, la API devuelve las URLs correspondientes de Supabase Storage. El aplicativo base las inyecta de forma reactiva en Three.js y React, volviéndose 100% funcional de forma inmediata y automática (sin necesidad de desplegar código o carpetas físicas).

### 🗺️ 4.2 Localización y Mapeo de Assets (De M01536 a CMS Dinámico)

| Insumo del Manual | Ubicación Actual en `M01536` | Nueva Ubicación Ideal (CMS Dinámico) | Estructura en Base de Datos (`configuraciones_manual`) |
| :--- | :--- | :--- | :--- |
| **1. GLB de los pasos** | `/public/M01536/models/P00.glb` ... `P05.glb` | Bucket `manuals-assets/` bajo `[proyecto_id]/models/P[paso].glb` | `glb_pasos`: `jsonb` (Array de URLs públicas de GLB) |
| **2. Audio de pasos (ES/EN)** | `/public/M01536/sounds/[paso].mp3` (Solo ES) | Bucket `manuals-assets/` bajo `[proyecto_id]/sounds/[es|en]/[paso].mp3` | `audio_es_pasos` / `audio_en_pasos`: `jsonb` (Arrays de URLs) |
| **3. Audio de ayuda** | `/public/assets/sounds/01_Ayuda.mp3` (Estático) | Bucket `manuals-assets/` bajo `[proyecto_id]/sounds/ayuda.mp3` | `audio_ayuda`: `text` (URL del archivo de ayuda) |
| **4. Imagen de herramientas** | `/public/assets/tips/[martillo].svg` (Iconos individuales) | Bucket `manuals-assets/` bajo `[proyecto_id]/tips/tools.png` | `imagen_herramientas`: `text` (URL de la imagen consolidada) |
| **5. Ensambles especiales** | `/public/assets/tips/[minifix].svg` etc. | Bucket `manuals-assets/` bajo `[proyecto_id]/tips/assemblies/` | `imagenes_ensambles`: `jsonb` (Array de URLs de tips) |
| **6. Garantía del producto** | `/public/assets/tips/garantia.pdf` (Estático) | Bucket `manuals-assets/` bajo `[proyecto_id]/garantia.pdf` | `garantia_texto`: `text` (o URL del documento personalizado) |
| **7. Fotografías de herrajes** | Ilustraciones vectoriales estáticas en el DOM | Bucket `manuals-assets/` bajo `[proyecto_id]/hardware/[foto].jpg` | `fotos_herrajes`: `jsonb` (Fotos reales para facilitar armado) |
| **8. Renders fotorealistas** | `/public/M01536/renders/render1.jpg` ... | Bucket `manuals-assets/` bajo `[proyecto_id]/renders/[render].jpg` | `renders_fotorealistas`: `jsonb` (Array de renders de galería) |

### 🛠️ 4.3 Checklist de Implementación del Detalle de Proyecto & Panel de Carga

- [x] **Paso 1: Desarrollar Server Actions para Carga de Insumos (`app/actions/insumos.ts`)** (Completado)
  - Métodos para subir archivos a Supabase Storage en el bucket `insumos_manuales` dinámicamente.
  - Métodos para actualizar la tabla `configuraciones_manual` agregando/removiendo las URLs de los assets según el tipo correspondiente.
  
- [x] **Paso 2: Diseñar la Interfaz del Modal de Detalle de Proyecto (`components/proyectos/detalle-proyecto-modal.tsx`)** (Completado)
  - **Módulo Superior (Visualizador de Solicitud):**
    - Mapeo estructurado: Título, descripción y fecha de la solicitud de origen.
    - Galería interactiva de adjuntos (renderiza imágenes en miniatura directamente en el navegador).
    - Descarga integrada con un clic para archivos no visualizables (PDF, DWG, 3DM, etc.).
  - **Módulo Inferior (Uploader de Insumos CMS):**
    - Sección interactiva dividida en acordeones o pestañas para cada uno de los 8 tipos de insumos.
    - Soporte para agregar dinámicamente pasos de armado (con su GLB respectivo, su locución en español y locución en inglés).
    - Drag & drop con barras de progreso de carga en tiempo real en Obsidian Teal.

- [x] **Paso 3: Conectar el Modal al Dashboard de Proyectos** (Completado)
  - Añadir manejador de clic (`onClick`) en las tarjetas de `app/(dashboard)/proyectos/page.tsx`.
  - Al hacer clic en un proyecto, abrir `DetalleProyectoModal` pasándole todos los datos del proyecto, solicitud y cliente cargados en tiempo real.

- [x] **Paso 4: Sincronización Dinámica de Assets en el Visualizador 3D (Vite/Proxy)** (Completado)
  - Resolvimos dinámicamente la compatibilidad para el audio de ayuda (`01_Ayuda.mp3`) cargándolo y refrescando el buffer de HTML5 Audio correctamente.
  - Mapeamos e integramos dinámicamente las imágenes reales de los herrajes subidos por el cliente (con soporte para extensiones `.webp`, `.png`, `.jpg` y redimensionamiento contain de alta calidad).
  - Pintamos dinámicamente el botón central del paso actual en Obsidian Teal con el **Color Primario** seleccionado por el cliente.
  - Agregamos la columna `color_texto_botones` en Supabase y el selector de color de contraste (Texto/Iconos) en la plataforma Next.js, logrando que tanto los iconos como el número del paso central se pinten con el color de contraste elegido por el cliente.
  - Corregimos el helper `getStorageUrl` en `AssemblyPage.jsx` para que anteponga automáticamente el prefijo de subcarpeta del código de manual (`[id]/`), solucionando de raíz el error 404 que impedía la carga del Logotipo de la empresa y del Favicon personalizado de la pestaña del navegador.

- [x] **Paso 5: Personalización de 4 Texturas PBR Completas (Piso y Escenario/Paredes)** (Completado)
  - Incorporamos 8 columnas en Supabase (`pbr_floor_diff`, `pbr_floor_normal`, `pbr_floor_roughness`, `pbr_floor_height`, `pbr_wall_diff`, `pbr_wall_normal`, `pbr_wall_roughness`, `pbr_wall_height`).
  - Diseñamos la sección "Texturas del Escenario (PBR)" en `detalle-proyecto-modal.tsx` con soporte para cargar, borrar y guardar las 4 texturas para piso y escenario.
  - Actualizamos `AssemblyPage.jsx` para recuperar las URLs y `Experience.jsx` / `Floor.jsx` para renderizar materiales físicos PBR con `bumpMap` de altura y optimización anti-parpadeo entre pasos.

- [x] **Paso 6: Estandarización Visual de Tooltips y Generación Nativa de QR** (Completado)
  - Unificamos el estilo de todas las "nubes" de ayuda (`PanelAyudas`, `PanelBtn`, `PanelHerrajes`) con bordes de 20px, fuentes Inter, y el fondo utilizando el `color-mix` dinámico con `var(--primary)`.
  - Reemplazamos la API externa de códigos QR por `react-qr-code`, logrando generación 100% nativa, offline y a prueba de fallos directamente en el frontend.

- [x] **Paso 7: Modo Cristal (Glassmorphism) con Opacidad Regulable** (Completado)
  - Incorporamos la columna `opacidad_manual` en la tabla `configuraciones_manual` de Supabase para almacenar la opacidad del manual (rango 10-100%).
  - Diseñamos un Slider premium e interactivo en Obsidian Teal dentro del panel de Branding de Next.js, con un indicador dinámico de estado.
  - Sincronizamos e inyectamos la transparencia cromática en el manual de armado React mediante la función nativa CSS `color-mix(in srgb, Color Porcentaje%, transparent)` aplicada a `--surface` y afines.
  - Aseguramos la consistencia unificada del diseño aplicando la opacidad y el efecto esmerilado al círculo central indicador de pasos de la botonera.

---

## 🌐 5. Portfolio y Leads (mariomojica.com)
**Estado:** Estable y en producción. Conectado a sistema completo de captura de leads.

### 🎯 Objetivos de la Fase
- [x] Formularios de Frontend diseñados y conectados (Producción).
- [x] Conexión n8n + Baserow.
- [x] Tabla de leads en Baserow optimizada y funcional.
- [x] Notificaciones de leads activas (WhatsApp Cloud API y Email).
- [x] **[NUEVO] n8n-MCP Integration:** Capacidad de la IA para crear/editar flujos de n8n.
- [ ] **PENDIENTE:** Monitoreo de tráfico y leads reales.



---

## 📂 6. Aplicativo de Armado (Legacy Restore)
**Estado:** Integración inmersiva de Gama (R4X Bot) completada al 100% en la portada de carga (App_Armado_V11). Rediseño Obsidian Teal Premium finalizado con tooltips y SVGs nativos.

### 🎯 Objetivos de la Fase
- [x] App_Armado_V10: Integración inmersiva 3D de "Gama" en la pantalla de carga inicial.
- [x] App_Armado_V11: Optimización de iconos SVG nativos (Shadows) para herencia de color perfecta y adición de tooltips nativos en toda la interfaz de navegación.
- [x] Eliminar dependencias de `3dymedios.com` (localización total de GLB, Matcaps, HDRI, etc.).
- [x] Exclusión mutua de cortinas en Zustand para evitar traslapes.
- [x] Manual_Audios_v1: Sincronización y corrección de rutas de audio en español latino a la raíz de Supabase Storage (`sounds/[paso].mp3`) y restauración del ciclo de montaje de `AudioPlayer` para evadir bloqueos de Autoplay.
- [x] Manual_Audios_v1.1: Herrajes compartidos en Supabase (`_herrajes_compartidos/`), Overlay de cámara con Copy/Paste de coordenadas JSON, campos `cameraPosition`/`cameraTarget` en el modal, y unificación canónica de nombres de herrajes (`limpiarNombreMalla`) — réplica exacta del algoritmo `obtenerNombreLimpioTooltip` del modal para que el visor 3D muestre nombres idénticos (ej: `Bisagra_20040` en vez de `Bisagra`).
- [x] Manual_sonido_v2 (08 de Junio, 2026):
  - Posicionamiento de cámara flexible: Entradas de POS y TGT editables con pegado directo de coordenadas individuales o el texto completo filtrado automáticamente.
  - Unificación de botones de audio a 'Subir Audio' para Bienvenida, Ayuda e instrucciones paso a paso.
  - Solución de problemas de caché de Supabase inyectando cacheControl: '0' en las subidas por API.
  - Sincronización en tiempo real y eliminación de caché en el visor 3D mediante marca de tiempo dinámica (?t=timestamp) en las llamadas a audios en AudioPlayer.jsx.
  - Independencia de estado de carga: Spinner exclusivo para 'Subir Audio' (usando el sufijo _upload) y spinner de carga premium para la generación de la vista previa de voz (usando el sufijo _preview).
- [x] Manual_Iluminacion_Camara (09 de Junio, 2026):
  - **Calibración de Iluminación 3D en Caliente**: Implementación de un editor flotante premium (`LightingPanel.jsx`) en el visor 3D para calibrar luces y tone mapping en caliente y guardarlos directamente en Supabase desde el CMS.
  - **Guardado Automático de Cámara e Iluminación (postMessage)**: Conexión local robusta e instantánea entre el visor 3D (`localhost:5173`) y el CMS (`localhost:3003` / `mariomojica.com`) mediante la API HTML5 `postMessage` cross-origin (utilizando `rel="opener"` en los enlaces de previsualización), automatizando la persistencia a Supabase en caliente.
  - **Copia al Portapapeles y Casilleros de Pegado**: Se añade copia automática al portapapeles al pulsar "Definir posición" y se restauran inputs de texto individuales por paso en el modal para permitir el copiado y pegado clásico en cualquier situación.
  - **Corrección de Pantalla Negra y Rendimiento**: Reubicación de hooks de React en `CameraOverlay` para evitar fallos de ejecución y eliminación de bucles `useFrame` redundantes a 60fps para optimizar recursos.
- [x] Manual_Exportacion_glb_geometry_nodes (10-11 de Junio, 2026):
  - **Bake de Geometry Nodes a Objetos Reales**: Desarrollo de scripts en Python para Blender (`bake_geometry_nodes_v1.py` a `_v4.py`) que permiten hornear de forma masiva animaciones procedimentales generadas por Geometry Nodes directamente sobre los objetos reales de la escena, eliminando los planos emisores para evitar duplicidad.
  - **Bakeo por Cuaterniones y Antiflip (V4)**: Migración de rotaciones Euler a cuaterniones con corrección de signo antiflip ($q \cdot q_{prev} < 0$) para evitar Gimbal Lock y garantizar interpolaciones de rotación suaves.
  - **Corrección de Parentesco Inverso (V4)**: Incorporación de `matrix_parent_inverse` de Blender en el cálculo local de transformaciones (`(parent_matrix @ orig_obj.matrix_parent_inverse).inverted() @ world_matrix`), solucionando colisiones e intersecciones oblicuas de piezas con parentesco.
  - **Compresión Draco y Animaciones Unificadas**: Integración de la compresión Draco en la exportación de GLB (`export_draco_mesh_compression_enable=True`) para optimizar el peso en web y configuración del modo de animación a `Active actions merged` (`export_animation_mode='ACTIVE_ACTIONS'`) para unificar pistas.
  - **Restauración de Escena y Seguridad**: Implementación de reversión de archivo automática (`revert_blend=True` con `bpy.ops.wm.revert_mainfile()`) para no alterar el archivo `.blend` original en disco y uso de cadenas con nombres de objeto en lugar de referencias directas de C++ para evitar errores de `ReferenceError: StructRNA of type Object has been removed`.
  - **Soporte de Pausas y Silencios en TTS (Next.js)**: Adición de instructivo interactivo en el modal de detalles del proyecto y lógica en la API TTS para intercalar silencios exactos (`[pausa: X]`) basados en el formato binario nativo del motor de voz, evitando cortes del decodificador en la web.
- [x] Manual_Escaner (11 de Junio, 2026):
  - **Unificación Espacial de Herrajes Complejos**: Algoritmo tridimensional en Three.js que consolida submallas separadas por animación (bisagras y correderas) a menos de 100 mm en una única pieza física real, dividiendo al final entre 2 para reportar con absoluta precisión 4 bisagras y 4 correderas.
  - **Filtro de Superposición Estricto (2 mm)**: Para herrajes simples (pernos y puntillas), se restringe la tolerancia a 2 mm para ignorar copias duplicadas accidentalmente en Blender con Shift+D, reportando 34 puntillas y 28 pernos de forma blindada.
  - **Persistencia Automática de Despiece**: Automatización del guardado del despiece en Supabase (`despiece`) inmediatamente tras finalizar el escaneo con éxito en la plataforma Next.js.
  - **Sincronía Completa del Visor 3D**: Modificaciones en `PanelHerrajes.jsx` para heredar las cantidades estimadas directamente de `data.despiece` en el paso inicial 00, y réplica del algoritmo espacial/superposición en el fallback local en `PanelCantidades.jsx`.
- [x] **Estabilización de Animaciones (v18 - 13 de Junio, 2026)**: Resolución de la suite de bugs del horneado de Geometry Nodes. Se descartó la jerarquía de parentesco (causa raíz de matrices singulares por escala cero, cizalladura por escala no uniforme y desapariciones) a favor de un horneado directo en coordenadas de mundo absoluto (World Space) con unificación por cuaterniones y filtros antiflip.
- [x] **Internacionalización y Modo Estudio 3D (Manual_Entorno_mejorado - 13 de Junio, 2026)**:
  - **Internacionalización a Inglés**: Traducción dinámica de toda la interfaz visual (las 8 nubes de ayuda, tooltips, panel de cantidades, realidad aumentada con popup de QR y panel de tips generales) en tiempo real al cambiar a "EN". Implementación del atributo `data-tip-key` para no romper el filtrado de tips en español.
  - **Ajuste de Spacing**: Reubicación del botón de cantidades dentro de la lista `.menu` para heredar el `gap` idéntico a las fichas de los herrajes.
  - **Modo Estudio 3D (Spline)**: Escenario digital infinito configurable desde la plataforma mediante `tipo_ambiente` y `color_ambiente` en Supabase.
  - **Sombras Reales en Modo Estudio**: Malla de suelo de `30x30` que recibe sombras en WebGL y se desvanece de manera invisible en la niebla al compartir el mismo color de fondo.
  - **Control de Color en la Plataforma**: Selector de color interactivo en el modal para cambiar el tono de fondo/piso del estudio en caliente.
- [x] **Manual_Online (16 de Junio, 2026)**:
  - **Resolución de Carga de Assets en Producción**: Implementación de una utilidad de prefijo dinámico (`assets.js`) para redirigir correctamente las llamadas de assets locales estáticos y de manuales cuando la app se carga embebida bajo la subruta proxy `/embed/armado/*` en `mariomojica.com`.
  - **Bypass de Limitación de Proxies en Netlify**: Configuración de reglas explícitas de proxy en `netlify.toml` del portfolio y homepage para desviar recursos dinámicos (`models`, `sounds`, `herrajes`) directamente hacia el storage de Supabase, evitando el encadenamiento de proxies de Netlify que provocaba errores 404.
  - **Exclusión de Assets Estáticos Locales**: Adición de reglas prioritarias en `netlify.toml` para asegurar que las carpetas locales de la aplicación (`/assets/`, `/textures/`, `/Matcaps/`, `/hdri/`, `/manual-vacio/`) se sirvan desde el CDN de Netlify del visor en vez de enviarse a Supabase.
  - **Configuración de base path absoluto en Vite**: Migración de `base: './'` a `base: '/'` en `vite.config.js` para asegurar que el bundle del visor busque sus recursos de sistema en rutas absolutas, previniendo secuestros por parte de las reglas dinámicas.
  - **Soporte para Múltiples Clips de Animación**: Actualización del componente `Model.jsx` para iterar y reproducir simultáneamente todos los clips de animación contenidos en el GLB de pasos, dando soporte nativo a manuales complejos con tracks de animación segmentados.
  - **Bypass de Caché por Session Cache Buster**: Inyección de un timestamp único de sesión (`?v=timestamp`) en las solicitudes de assets locales y dinámicos para evitar que los navegadores o CDNs almacenen en caché versiones viejas de modelos y audios tras subirse nuevas versiones en el CMS.
- [x] **Bypass Resiliente de Carga y Sombra Tonal (15 de Junio, 2026)**:
  - **Bypass de Pantalla de Carga**: Se añadió un temporizador de respaldo en `PanelInicial.jsx` para que el botón "Iniciar" aparezca a los 6 segundos de forma automatizada, evitando bloqueos por fallos o timeouts en la red de Supabase.
  - **Sombra de Contraste Tonal**: Reemplazo de la sombra negra (`rgba(0,0,0,0.4)`) por una sombra tonal fluida (`color-mix` basada en `var(--secondary)`) en el título bajo la regla de Underline Glow para un contraste natural.
- [x] **Estabilización de Redirecciones, Fullscreen y Posición de Nubes (16 de Junio, 2026)**:
  - **Resolución de Assets (Herramientas y Garantía)**: Reordenamiento de las reglas de redirección en `netlify.toml` de todos los proyectos y en `_redirects` para priorizar archivos individuales (`/:manualId/:file`) antes que directorios de categorías (`/:manualId/:category/*`), eliminando barras diagonales no deseadas que causaban fallos 404 en el Storage de Supabase.
  - **Fullscreen por Rotación**: Inyección de lógica robusta en `AssemblyPage.jsx` para detectar rotación horizontal en dispositivos móviles e invocar `requestFullscreen` de forma interactiva (con fallback a listeners de interacción en pantalla si es bloqueado inicialmente por políticas del navegador).
  - **Alineación de Nubes y z-index**: Incremento del `z-index` de `.contenedor` a `1000` en `NavBarInferior.css` para permitir el paso por encima del botón de AR. Redefinición de burbujas superiores a alineaciones asimétricas individuales según su botón correspondiente (`ayuda1` a la izquierda, `ayudaLuz` al centro, y `ayudaVelocidad`/`ayudaIdioma` a la derecha con `right: 4px`) para evitar desbordes. Elevación y centrado de las burbujas inferiores en móviles a `bottom: 80px !important` en `PanelAyudas.css`, garantizando que floten elegantemente por encima de los botones inferiores sin tapar el slider ni el play/pausa.
- [x] **Perfeccionamiento Milimétrico de Nubes de Ayuda en Móvil (17 de Junio, 2026)**:
  - **Barra Superior**: Fijada la altura de `.contenedor1` a `52px !important` y desplazada hacia abajo con `top: 50px !important` en móviles para evitar la proximidad extrema con el borde superior de la pantalla (bajando 30px respecto a la versión anterior). Se removieron los estilos en línea de `position: relative` en los contenedores de velocidad e idioma, permitiendo que la regla de `position: static !important` surta efecto para alinear las burbujas superiores con total precisión respecto a `.contenedor1-1`.
  - **Botón de Cerrar**: Ajustado el `top` de `.cerrar` a `50px !important` en móviles para mantener simetría vertical perfecta con la barra superior de botones.
  - **Barra Inferior**: Centrado y acotado el ancho de `.SesionArriba` a exactamente `292px !important` en dispositivos móviles, sirviendo como marco de anclaje relativo exacto para las burbujas inferiores, eliminando cualquier desfase horizontal por ancho de pantalla.
  - **Burbujas Inferiores**: Redefinido el offset de las flechas de `ayuda4` (Buscador) y `ayuda5` (Play/Pausa) a `18px !important` para coincidir milimétricamente con el centro de la lupa y del botón play.
  - **Z-Index de Realidad Aumentada**: Incrementado el `z-index` de `.AR` a `1001 !important` en dispositivos móviles para sobrepasar la barra inferior de botones (`z-index: 1000`), manteniendo el botón de AR flotante e interactivo en primer plano en todo momento.
- [x] **Solución de Carga Errática en AR Móvil y Preload Dinámico de GLBs (17 de Junio, 2026)**:
  - **Botón AR Fijo en el DOM**: Se modificó `PanelInicial.jsx` para renderizar el botón `#inicio` permanentemente en el DOM de React, controlando su visibilidad mediante estilos inline `display: (displayProgress === 100 || progress >= 100) ? "flex" : "none"`. Esto corrige referencias nulas de DOM (`document.getElementById("inicio")`) y asegura que el botón aparezca de manera instantánea cuando Three.js completa la carga de los modelos.
  - **Simulación de Progreso**: Implementación de una simulación progresiva suave hasta el 90% para amortiguar el salto brusco de 0% a 100% (causado por la falta de cabeceras `Content-Length` en servidores de almacenamiento).
  - **Preload Dinámico de Modelos**: Se añadió preloading en `Model.jsx` usando `useGLTF.preload()` para los pasos `pasoActual + 1` y `pasoActual - 1`, permitiendo que el navegador descargue en segundo plano los modelos adyacentes y eliminando los retardos y pantallas vacías en la transición de pasos.
- [x] **Interacción Táctil de Tooltips y Posición Fija en Móvil (17 de Junio, 2026)**:
  - **Diferenciación de Dispositivos (Touch vs Desktop)**: Se introdujo la constante `isTouchDevice` para desactivar los listeners de hover `onPointerEnter` y `onPointerLeave` en móviles, evitando bloqueos de mallas resaltadas. En su lugar, se configuró un listener `onClick` (`handleTouchSelect`) en `Model.jsx` para alternar (seleccionar/deseleccionar) las piezas mediante toques directos.
  - **Ubicación Fija a Salvo del Dedo**: Se configuró la visualización del tooltip en dispositivos táctiles en una posición fija: centrado horizontalmente (`left: 50%`) y a exactamente `10px` por debajo de los botones superiores, leyendo en caliente el rectángulo de colisión (`rect.bottom`) de la barra de botones. Esto evita que la mano del usuario tape la lectura del nombre de la pieza seleccionada.
  - **Deselección Dinámica por Click en Fondo**: Añadida la directiva `onPointerMissed` en el canvas de R3F (`AssemblyViewer.jsx`) para que al tocar en cualquier espacio vacío del escenario se limpie el tooltip activo, restaurando de manera reactiva el material original de la pieza resaltada mediante un efecto en `Model.jsx`.
- [x] **Solución a Pausas del Generador de Audio TTS en Producción (17 de Junio, 2026)**:
  - **Restauración de Silencios Base64**: Se corrigió el endpoint `/api/tts/route.ts` de la plataforma Next.js. Debido a que las APIs serverless carecen de binarios locales (`edge-tts` CLI) y scripts Python, se sustituyó el fallback `synthesizeTts("...", voice)` (que no generaba silencio real) por la decodificación directa de un buffer de silencio MP3 puro de 1 segundo en base64 (`SILENT_MP3_BASE64`), garantizando pausas precisas de silencio en los archivos generados en producción.
- [x] **Ajuste Fino de Audios TTS y Edición Dinámica de Ayudas (Hito Manual_Online_v2 - 17 de Junio, 2026)**:
  - **Corrección de Detención en Pausas**: Refactorización de la API de TTS en Next.js para eliminar cabeceras ID3v2 redundantes en la concatenación de MP3s de silencios y voz. Al limpiar las cabeceras intermedias con `stripId3`, el decodificador de HTML5 Audio del navegador web puede reproducir de manera continua sin detener el audio al llegar a una pausa.
  - **CMS de Edición de Ayudas de Interfaz**: Nueva sección **8. Ayudas de Interfaz y Calibrador** en el panel de insumos del CMS. Permite editar en caliente los títulos y descripciones en español e inglés de las 8 burbujas de ayuda (nubes) del tutorial interactivo, con guardado directo en la columna `ayudas_texto` (`jsonb`) en Supabase.
  - **Traducción Automática**: Botón inteligente en el CMS que traduce automáticamente a inglés el título y contenido de cada ayuda usando el endpoint `/api/translate`.
  - **Visor Dinámico de Ayudas**: Sincronización del visor para renderizar dinámicamente los textos custom de las nubes y auto-cargar la versión de calibración local o productiva desde el botón del CMS.
  - **Limpieza de UI**: Eliminación del botón redundante "Abrir Calibrador UI" del pie de página del modal de detalles del CMS.
- [x] **Optimización de Interfaz y SEO del Visor de Armado (Hito Manual_Metricas - 18 de Junio, 2026)**:
  - **Open Graph Local**: Se procesó la imagen previa de portada (`Banner_Manual`) de PNG a formato WebP optimizado y se inyectó en el `index.html` con rutas relativas, resolviendo dependencias de Supabase para previsualizaciones ricas en WhatsApp.
  - **Iframe de Spline (Bienvenida)**: Se limpió la URL dinámica de Spline y se eliminó el atributo genérico `title="Spline 3D Scene"` del iframe, suprimiendo tooltips nativos indeseados del navegador en PC.
  - **Corrección de Margen Táctil**: Ajuste de CSS (`margin-top: 0`) para alinear perfectamente el botón "Iniciar" en dispositivos móviles, previniendo superposiciones con el logo y centrándolo en el borde superior de la pantalla.
  - **Restauración Síncrona de Hover en PC**: Se corrigió un bug de colisión de estados (race condition) originado en la actualización táctil anterior. Se reintrodujo la restauración síncrona del material en `onPointerLeave` exclusivamente para dispositivos no táctiles, evitando que las piezas queden seleccionadas infinitamente al arrastrar el mouse.
- [x] **Blindaje Legal Fase 3 y Traducción de Alias (23 de Junio, 2026)**:
  - **Eliminación de Paridad CSS y Marca**: Remoción de archivos de encuesta obsoletos y del logo de Maderkit. Refactorización de `Landscape.jsx` para usar Tailwind CSS y borrado de `Landscape.css`.
  - **Garantía Premium Neutra**: Creación de `Garantia.pdf` neutro de la plataforma y su sincronización local y en Supabase Storage.
  - **Capa de Traducción de Alias en React**: Implementación de `resolveAlias` en `assets.js` e integración en `PanelHerrajes.jsx`, `PanelCantidades.jsx` y `Model.jsx`. Traduce nombres de mallas con SKUs legacy del GLB a nombres limpios en caliente, permitiendo renderizar sus imágenes de forma blindada sin alterar los archivos 3D.
- [x] **Blindaje Legal Fase 4, Ofuscación Estructural y Eliminación de Código Legado (Fase 5) (24 de Junio, 2026)**:
  - **Refactorización de Escena 3D (R3F)**: Renombrado de `Experience` a `AssemblySceneViewer`, y métodos internos a estándares modernos (e.g. `parseCubemapTextureAtlas`, `alignSkyboxToGround`, `ViewportCameraManager`).
  - **Ofuscación y Limpieza en Model.jsx**: Renombrado de variables y funciones de control (`cleanMeshIdentifier`, `modelRef`, `materialsCache`, `resolvePartDisplayName`) y corrección de un `ReferenceError` en la fov por defecto de la cámara.
  - **Fase 5 (Higiene de PI)**: Remoción completa (física y de control de versiones Git) de la carpeta parent `legacy-aplicativo-armado-original` para independizar por completo el aplicativo blindado.

---


- [x] **Plataforma CMS - Traducciones TTS y Ergonomía (01 de Julio, 2026)**:
  - **Reingeniería de Traducción con Pausas**: Refactorización del motor de `/api/translate` garantizando la supervivencia y posicionamiento intacto (Límites de palabra) de las etiquetas de control `[pausa: N]` post-traducción a EN y PT.
  - **Ergonomía Bilingüe**: Reestructuración del CMS extrayendo la generación de Audio a la nueva pestaña dedicada "Textos y Locución (TTS)", eliminando colisiones de *Nested Scrolling* y quintuplicando la altura de los `textarea` para edición profesional sin ahogo de vista.


## 🔗 Enlaces de Control
- **Baserow:** [Leads Table](https://baserow.mariomojica.com/database/144/table/600/2509)
- **n8n Principal:** [https://n8n.mariomojica.com/](https://n8n.mariomojica.com/)
- **Supabase Console:** [Cloud Project](https://supabase.com/dashboard/)
- **Local App:** [http://localhost:3000](http://localhost:3000)

---
*Última actualización de contexto: 24 de Junio, 2026*


---

## 🤖 7. Automatización Blender (Cohesión de Mallas Grasshopper)
**Estado:** V30 Estable y en Producción.

### 🎯 Objetivos de la Fase
- [x] Desarrollar un script en Python para Blender que consolide mallas exportadas de Grasshopper.
- [x] Reconstrucción de Herrajes: Detectar y agrupar componentes fragmentados.
- [x] Cohesión de Láminas: Unir capas de tableros basándose en centros espaciales y geometría (paralelepípedo).
- [x] Absorción Inteligente de Parches 2D: Detectar geometrías sin grosor (tapitas de ranura) y fusionarlas a su pieza principal mediante análisis de Bounding Boxes.
- [x] Resolución de Geometría Invisible: Reparar fallos de visibilidad en parches 2D forzando geometría doble cara real, evitando el backface culling.
- [x] Orígenes Geométricos: Ajustar el origen de cada malla consolidada al centro geométrico del Bounding Box.

- [x] **Configuración de Leads y CRM en n8n (26 de Junio, 2026)**:
  - **Integración Gmail-Baserow**: Configuración exitosa del trigger de Gmail para procesar correos entrantes y buscar/crear leads en Baserow CRM basándose en el email del remitente.
  - **Manejo de Errores y Tipado**: Resolución de bugs críticos de tipado (Type Validation) en n8n al comparar IDs numéricos de Baserow dentro del nodo IF.
  - **Plantillas Meta WhatsApp**: Creación e integración de plantillas de Utilidad (lerta_correo_respuesta) en Meta WhatsApp Manager, corrigiendo la validación de parámetros dinámicos ({1}) para el envío de alertas de respuesta y nuevos leads al celular del administrador.

### 🚧 Notas Técnicas
- **Resolución Bounding Box Volumétrico:** En V30 se resolvió un bug de unión aleatoria obligando al algoritmo a validar colisiones (`bbox_contains`) siempre contra la malla de mayor grosor (MDP) en lugar de capas 2D (Cara), eliminando falsos negativos causados por el orden de extracción de `set()` en Python.
