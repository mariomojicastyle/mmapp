# Módulo "Marketing" — Herramienta Propia de Gestión de Contenidos (v2)

## Contexto y Objetivo

Construir un módulo completo de planificación, publicación y análisis de contenido para redes sociales integrado nativamente en la plataforma Next.js de Mario Mojica, reemplazando por completo a Metricool.

**Canales conectados:**
- Instagram Profesional: `@mariomojicaff`
- YouTube: `@MarioMojicaff`
- Facebook: Página de empresa "Mario Mojica - Smart Assembly 3D"
- LinkedIn: Perfil personal + Página corporativa (pendiente de creación)

**Acceso exclusivo:** Solo el rol `superadmin` podrá ver y operar esta sección.

**Ubicación en la UI:** Sección **PLATAFORMA** del Sidebar, inmediatamente después de "Equipo".

---

## Decisiones de Arquitectura Confirmadas

### ✅ Almacenamiento de Medios: Google Drive

Los archivos multimedia (videos, renders 3D, fotos de productos) se almacenan en una **carpeta local del PC sincronizada con Google Drive**. La plataforma accede a estos archivos mediante la **Google Drive API** (OAuth 2.0) para:
1. Explorar y seleccionar archivos desde el editor de posts (file picker integrado).
2. Generar URLs compartibles (`anyone with the link`) que las APIs de Meta/LinkedIn/YouTube pueden consumir para publicar.
3. No duplicar almacenamiento: el archivo vive en Drive, la base de datos solo guarda la referencia (URL + metadata).

```
┌──────────────────────────────────────────────────────┐
│  PC Local (Carpeta sincronizada con Google Drive)    │
│  📁 Marketing/                                       │
│    ├── 📁 Videos/                                    │
│    ├── 📁 Renders/                                   │
│    ├── 📁 Fotos/                                     │
│    └── 📁 Diseños/                                   │
└──────────────────────┬───────────────────────────────┘
                       │ (Sincronización automática)
                       ▼
┌──────────────────────────────────────────────────────┐
│  Google Drive (Nube)                                 │
│  → API REST v3 (OAuth 2.0)                           │
│  → Genera URLs compartibles por archivo              │
└──────────────────────┬───────────────────────────────┘
                       │ (URL compartible)
                       ▼
┌──────────────────────────────────────────────────────┐
│  Plataforma Next.js                                  │
│  → File Picker integrado (explorar carpetas Drive)   │
│  → Previsualización en el editor de posts            │
│  → Guarda URL + metadata en Supabase                 │
└──────────────────────┬───────────────────────────────┘
                       │ (URL del medio)
                       ▼
┌──────────────────────────────────────────────────────┐
│  n8n Worker → APIs de Meta / LinkedIn / YouTube      │
│  → Descarga el archivo desde la URL de Drive         │
│  → Lo sube como multipart a la API de la red social  │
└──────────────────────────────────────────────────────┘
```

### ✅ Módulos Suspendidos

| Módulo | Estado | Razón |
| :--- | :--- | :--- |
| **Anuncios** (Meta Ads, Google Ads, TikTok Ads) | 🔴 Suspendido | Foco actual es crecimiento orgánico B2B |
| **SmartLinks** (Link in Bio) | 🔴 Suspendido | Prioridad menor para la fase actual |

Estos módulos **no se construyen ni se muestran** en la interfaz. Si en el futuro se reactivan, se agregarán como pestañas adicionales.

---

## Guía Paso a Paso: Registro de App en Meta/Google/LinkedIn

### Paso 1: Registrar App en Meta for Developers
1. Iniciar sesión en [developers.facebook.com](https://developers.facebook.com/) con la cuenta que administra la página "Mario Mojica - Smart Assembly 3D".
2. Crear App comercial ("Empresa") con el nombre `Mario Mojica Platform`.
3. Activar los productos **Facebook Login for Business**, **Instagram Graph API** y **Pages API**.
4. Agregar en la configuración del Login las URLs de callback:
   - `http://localhost:3003/api/auth/facebook/callback`
   - `https://mariomojica.com/api/auth/facebook/callback`
5. Guardar el **App ID** y **App Secret** en tu `.env.local`.
6. Solicitar revisión de permisos avanzados (`pages_manage_posts`, `instagram_content_publish`, `instagram_manage_insights`).

### Paso 2: Registrar App en Google Cloud Console
1. Ir a [console.cloud.google.com](https://console.cloud.google.com/).
2. Crear un proyecto `Mario Mojica Platform` y habilitar las APIs: **YouTube Data API v3** y **Google Drive API**.
3. Configurar la pantalla de consentimiento de OAuth como tipo interna.
4. Generar credenciales de tipo "ID de cliente OAuth 2.0" añadiendo los callbacks:
   - `http://localhost:3003/api/auth/youtube/callback` y `/api/auth/google-drive/callback`
   - `https://mariomojica.com/api/auth/youtube/callback` y `/api/auth/google-drive/callback`
5. Guardar **Google Client ID** y **Google Client Secret** en `.env.local`.

### Paso 3: Registrar App en LinkedIn Developer Portal
1. Ir a [linkedin.com/developers](https://www.linkedin.com/developers/) y crear una app asociada a la página de empresa.
2. Habilitar los productos **Share on LinkedIn** y **Sign In with LinkedIn using OpenID Connect**.
3. En la pestaña Auth, añadir las URLs de redirección para localhost y producción.
4. Guardar **LinkedIn Client ID** y **LinkedIn Client Secret** en `.env.local`.

---

## Arquitectura General del Módulo

```
┌──────────────────────────────────────────────────────────────────────┐
│   SIDEBAR — Sección "PLATAFORMA" (después de "Equipo")              │
│   📢 Marketing → /marketing                                         │
└──────────────────────────────────────┬───────────────────────────────┘
                                       │
              ┌────────────────────────┼────────────────────────┐
              │         SUB-NAVEGACIÓN POR PESTAÑAS (Tabs)       │
              ├──────────┬──────────┬───────┬───────────────────┤
              │ 📊       │ 📄      │ 💬   │ 📅               │
              │ Analítica│Reporting│Inbox  │ Planificación     │
              │  (F2)    │  (F2)   │ (F3) │   ★ ACTIVA (F1)  │
              └──────────┴──────────┴───────┴───────────────────┘
```

---

## Fases de Implementación

### 🟢 FASE 1: Planificación + Conexión de Cuentas + Google Drive (MVP)
El usuario conecta sus cuentas, busca medios en su Google Drive sincronizado localmente, programa posts en un calendario semanal con mapa de calor y el worker de n8n publica los contenidos de manera automática.

### 🟡 FASE 2: Analítica + Reporting
Paneles de métricas (impresiones, engagement, seguidores) por canal y exportación automatizada de reportes en PDF.

### 🔴 FASE 3: Inbox
Bandeja de entrada unificada para mensajes directos y comentarios de todas las redes.

---

## FASE 1: Detalle de Cambios en la Plataforma

### 1. Integración con el Sistema de Navegación y Permisos

#### [navigation.ts](file:///c:/Desarrollo/mmapp/mario-mojica-plataforma/lib/navigation.ts)
Añadir "Marketing" a la sección PLATAFORMA utilizando el icono `Megaphone` de Lucide:
```typescript
{ name: "Marketing", href: "/marketing", icon: Megaphone }
```

#### [roles.ts](file:///c:/Desarrollo/mmapp/mario-mojica-plataforma/lib/auth/roles.ts)
Añadir permisos restrictivos para que solo el rol `superadmin` tenga acceso visual e interactivo:
```typescript
MARKETING: {
  VIEW: ["superadmin"],
  MANAGE: ["superadmin"],
}
```

---

### 2. Capa de Datos (Supabase SQL)

#### Tablas Core a Crear:
1. **`marketing_cuentas`**: Almacena los tokens OAuth encriptados, refresh tokens, fecha de expiración y metadatos de las conexiones activas (Facebook, Instagram, LinkedIn, YouTube, Google Drive).
2. **`marketing_posts`**: Contiene el texto base, overrides para cada red social (ej: primer comentario en LinkedIn), listado de IDs de archivos de Google Drive asociados, estado (`borrador`, `programado`, `en_cola`, `publicando`, `publicado`, `fallido`) y fecha de programación.
3. **`marketing_colas`**: Almacena las colas de autolistas junto con su configuración de slots de tiempo (`[{ dia: "martes", hora: "09:00" }]`) y política de reciclaje.
4. **`marketing_metricas`** y **`marketing_post_metricas`**: Reservadas para persistir las estadísticas diarias obtenidas por las APIs (Fase 2).

---

### 3. Server Actions & API Routes

- **`app/actions/marketing.ts`**: Lógica de base de datos para crear, reprogramar, actualizar y eliminar posts y colas. Además, conecta con la Google Drive API para explorar el árbol de directorios del usuario.
- **`app/api/auth/[plataforma]/route.ts`** y **`[plataforma]/callback/route.ts`**: Controladores de OAuth 2.0 para realizar el intercambio de códigos y guardar los tokens persistidos en la base de datos de manera segura.

---

### 4. Componentes y UI (Next.js)

- **`app/(dashboard)/marketing/layout.tsx`**: Layout general que define la cabecera del módulo con las pestañas de navegación superiores y un panel lateral de control para cuentas vinculadas.
- **`components/marketing/drive-file-picker.tsx`**: Explorador visual integrado en el editor para que el superadmin busque y seleccione archivos de su Google Drive de forma cómoda.
- **`components/marketing/calendario-semanal.tsx`**: Cuadrícula de planificación con Drag and Drop (`@hello-pangea/dnd`) apoyada sobre el gradiente del mapa de calor de horas recomendadas.
- **`components/marketing/editor-post-modal.tsx`**: Editor multi-canal que te permite redactar un post y ver previsualizaciones exactas de cómo se renderizará el texto y las imágenes en los feeds de LinkedIn, Instagram, Facebook y YouTube de forma simultánea.

---

### 5. Configuración de Workers en n8n

1. **`marketing_publisher_worker`**: Cron ejecutado cada minuto. Detecta publicaciones programadas listas para ser publicadas, descarga temporalmente el medio de Google Drive (usando el access_token guardado) y lo envía a la API de la red social de destino.
2. **`marketing_token_refresher`**: Tarea diaria automatizada para renovar tokens de OAuth 2.0 que estén a menos de 48 horas de expirar, previniendo fallos en la publicación por expiración de accesos.
