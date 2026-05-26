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
- [/] **TRABAJANDO:** Módulo de Proyectos & CMS de Armado (Vincular solicitudes a proyectos reales, modal "Nuevo Proyecto" restringido por rol).

### 🚧 Bloqueos / Notas Técnicas
- **Identidad Visual:** Se utiliza el logo `Logo_vertical_color_en.svg` (corregido) como estándar global.
- **TopNav:** Implementa créditos dinámicos desde el perfil de Supabase (fallback a 1,250).
- **Control de Acceso:** Solo `superadmin` y `coequipero` tienen permisos para crear proyectos.

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

## 🛠️ 6. Aplicativo de Armado (Legacy Restore)
**Estado:** Integración inmersiva de Gama (R4X Bot) completada al 100% en la portada de carga (App_Armado_V10). Rediseño Obsidian Teal Premium finalizado.

### 🎯 Objetivos de la Fase
- [x] App_Armado_V10: Integración inmersiva 3D de "Gama" en la pantalla de carga inicial.
- [x] Eliminar dependencias de `3dymedios.com` (localización total de GLB, Matcaps, HDRI, etc.).
- [x] Exclusión mutua de cortinas en Zustand para evitar traslapes.

---

## 🔗 Enlaces de Control
- **Baserow:** [Leads Table](https://baserow.mariomojica.com/database/144/table/600/2509)
- **n8n Principal:** [https://n8n.mariomojica.com/](https://n8n.mariomojica.com/)
- **Supabase Console:** [Cloud Project](https://supabase.com/dashboard/)
- **Local App:** [http://localhost:3000](http://localhost:3000)

---
*Última actualización de contexto: 26 de Mayo, 2026*
