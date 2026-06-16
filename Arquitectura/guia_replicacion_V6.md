# Guía de Replicación - Arquitectura V6

## 1. Stack Tecnológico
Esta versión (V6) consolida el ecosistema de aplicaciones bajo una arquitectura Headless impulsada por Supabase, aplicaciones React (Next.js y Vite), automatización en un VPS dedicado y renderizado paramétrico mediante Rhino Compute local.

* **Backend / Database:** Supabase Cloud (PostgreSQL, Storage, Auth, Realtime).
* **Plataforma B2B / CMS:** Next.js 16+ (App Router), Tailwind CSS (Obsidian Teal), Radix UI.
* **Visor 3D (App Armado):** React, Vite, Three.js (@react-three/fiber), Zustand.
* **Portafolio / Landing:** Next.js (SSG/SSR).
* **Automatización / CRM:** Servidor VPS en Hetzner con Docker (n8n + Baserow).
* **Renderizado Paramétrico:** Rhino Compute Standalone (Windows Host, Rhino 8).

---

## 2. Pasos de Replicación (Desde Cero)

### A. Preparación del Backend (Supabase)
1. Crear un nuevo proyecto en Supabase.
2. Ejecutar los scripts SQL de migración (ubicados en `Arquitectura/` o el esquema general) para crear las tablas principales (`proyectos`, `configuraciones_manual`, `profiles`).
3. Crear los buckets de Storage: `insumos_manuales` (público) para alojar GLBs, audios e imágenes.
4. Habilitar la Autenticación por Email.

### B. Despliegue de la Plataforma B2B (Next.js)
1. Clonar el directorio `mario-mojica-plataforma`.
2. Instalar dependencias con `npm install`.
3. Configurar el archivo `.env.local` con las credenciales de Supabase (ver sección de variables).
4. Ejecutar el servidor con `npm run dev` (puerto 3003).

### C. Despliegue del Visor 3D (Vite)
1. Navegar al directorio `legacy-aplicativo-armado`.
2. Instalar dependencias con `npm install`.
3. Conectar el archivo `.env` con el mismo proyecto de Supabase para consumir los assets vía HTTP (sin CORS locales al usar el proxy o URLs firmadas/públicas de Storage).
4. Ejecutar `npm run dev` (puerto 5173).

### D. Servidor Rhino Compute
1. Instalar Rhinoceros 8 comercial en una máquina Windows dedicada o en el host.
2. Descargar y ubicar los binarios de producción de Rhino Compute en `C:\RhinoCompute`.
3. Iniciar el servidor mediante el script de PowerShell `run_compute.ps1`, omitiendo los tokens de nube para forzar la validación de licencia local (puerto 8081).
4. Configurar el túnel local o proxy para ser accesible desde la plataforma B2B.

### E. Automatización y Leads (VPS Hetzner)
1. Desplegar un servidor Ubuntu en Hetzner Cloud.
2. Instalar Docker y Docker Compose.
3. Usar el archivo `docker-compose.yml` (previo) para levantar Traefik/Nginx, n8n y Baserow.
4. Importar el archivo `n8n_portfolio_automation_V1.json` en n8n para restablecer los webhooks de los formularios del Portafolio y Landing Page.

---

## 3. Variables de Entorno (Secretos)

Asegúrate de contar con estas variables en cada entorno `.env`:

**Plataforma B2B y Portafolio (`.env.local`)**
```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
RHINO_COMPUTE_URL=http://localhost:8081/
```

**Visor 3D App Armado (`.env`)**
```env
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

**VPS Hetzner (`.env` para Docker)**
```env
N8N_BASIC_AUTH_USER=
N8N_BASIC_AUTH_PASSWORD=
BASEROW_PUBLIC_URL=
```

---

## 4. Mantenimiento y Healthchecks

1. **Supabase:** Monitorear el límite de consumo de Storage y la cuota gratuita de base de datos. Asegurar que las políticas RLS (Row Level Security) eviten inserciones no autorizadas.
2. **Rhino Compute:** El servicio local `rhino.compute.exe` puede cerrarse si Rhino lanza excepciones críticas (`PayAttentionException`). Revisar periódicamente que el puerto 8081 responde al endpoint `/healthcheck`.
3. **VPS:** Verificar los logs de Docker en n8n semanalmente (`docker logs n8n`) para comprobar que los webhooks de WhatsApp Cloud API sigan activos y sin tokens expirados.
4. **Visor 3D:** Dado que depende 100% de la red para descargar GLBs desde Supabase, es crítico verificar que las URLs inyectadas por el CMS no estén rotas y que el bucket permanezca como público para lectura.
