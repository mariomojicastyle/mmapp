# Guía de Replicación - Arquitectura V8

## 1. Stack Tecnológico (V8)
Esta versión (V8) consolida la plataforma B2B con un **Motor de Mercadeo Multicanal (Facebook & Instagram Meta Graph API v19.0)**, planificador de 24 horas estilo Metricool con mapa de calor y zonas horarias, blindaje 3D (IP Shield), automatización de leads en VPS Hetzner y almacenamiento dual en Supabase Cloud.

* **Backend & Database:** Supabase Cloud (PostgreSQL 15, Storage dual, Auth JWT).
* **Plataforma B2B / CMS:** Next.js 16+ (App Router), Server Actions, Tailwind CSS, Lucide Icons.
* **Motor de Publicación:** Graph API v19.0 (Facebook Page `1219474691249252` & Instagram Business `@mariomojicaff`).
* **Visor 3D (App Armado):** React, Vite, Three.js (@react-three/fiber), Zustand, Canvas 2K HD.
* **Portafolio / Landing:** Next.js en Netlify (`mariomojica.com`).
* **VPS Hetzner (Docker):** n8n (Webhooks de leads y cron worker), Baserow (CRM B2B RTA Brasil), Umami Analytics, Nginx Proxy Manager.

---

## 2. Pasos de Replicación (Desde Cero)

### A. Preparación del Backend (Supabase)
1. Crear proyecto en Supabase Cloud.
2. Ejecutar esquemas SQL para las tablas: `proyectos`, `telemetria_friccion`, `marketing_posts`, `marketing_cuentas`, `marketing_colas`.
3. Crear los buckets de Storage:
   - `insumos_manuales` (PRIVADO) -> Modelos `.glb`, audios 3D y texturas.
   - `marketing-media` (PÚBLICO) -> Imágenes publicables para Meta CDN.
4. Habilitar la Autenticación por Email / JWT.

### B. Configuración de Meta App para Mercadeo
1. Entrar a [developers.facebook.com](https://developers.facebook.com).
2. Seleccionar la App `Mario Mojica Marketing` (App ID `1736322840851405`).
3. Asegurar los permisos aprobados: `instagram_basic`, `instagram_content_publish`, `pages_show_list`, `pages_read_engagement`, `pages_manage_posts`.
4. Obtener el Token de Usuario Explorer y guardarlo en la sección de Configuración de Tokens de la Plataforma. El sistema lo convertirá automáticamente en un **Never-Expiring Page Access Token**.

### C. Despliegue de la Plataforma B2B (`mario-mojica-plataforma`)
1. Instalar dependencias: `npm install`.
2. Configurar `.env.local` con credenciales de Supabase y Meta App.
3. Compilar con `npm run build` o ejecutar desarrollo con `npm run dev` (puerto 3003).

### D. Servidor VPS Hetzner (Dockerized Stack)
1. Conectar por SSH al VPS Ubuntu.
2. Levantar el stack Docker con Nginx Proxy Manager, n8n, Baserow y Umami.
3. Importar workflows de n8n para el webhook de leads del Portafolio y la cola de publicaciones.

---

## 3. Variables de Entorno (Secretos)

```env
# Supabase Cloud
NEXT_PUBLIC_SUPABASE_URL=https://<tu-proyecto>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>

# Meta App (Facebook & Instagram Publishing)
FACEBOOK_APP_ID=1736322840851405
FACEBOOK_APP_SECRET=<app-secret>

# Rhino Compute Standalone Local
RHINO_COMPUTE_URL=http://localhost:8081/
```

---

## 4. Mantenimiento y Healthchecks

1. **Tokens de Meta:** La acción `saveMarketingCuenta` realiza el intercambio automático a Token Perenne de Página. Verificar trimestralmente en Meta Graph API Explorer que la sesión siga activa.
2. **Storage Public URLs:** Asegurar que el bucket `marketing-media` permanezca como público para que la CDN de Meta pueda descargar las imágenes sin error de CORS o 403 Forbidden.
3. **Delay de Instagram:** Mantener la pausa técnica de 3.5 segundos (`setTimeout(3500)`) entre `POST /media` y `POST /media_publish` para prevenir el error `Media ID is not available`.
