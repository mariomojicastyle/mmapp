# Guía de Replicación de Arquitectura B2B - V2

Esta guía actualiza el sistema estable de MMAp, incorporando el **Portafolio Profesional** con Next.js y el flujo de automatización mejorado.

## 1. Stack Tecnológico (V2)
- **Frontend Portfolio**: Next.js 15 (App Router).
- **Frontend B2B**: React + Vite (Legacy/Demo).
- **Hosting**: Netlify (Automatizado vía `netlify.toml`).
- **Base de Datos**: Supabase Cloud (PostgreSQL).
- **Automatización**: n8n (Docker en Hetzner VPS).
- **Control de Versiones**: GitHub (Branching: `main` y `develop`).

## 2. Nueva Estructura de Proyectos
El repositorio ahora maneja múltiples aplicaciones en subdirectorios:
- `/mariomojica-portfolio`: Proyecto principal (Next.js).
- `/frontend`: Proyecto B2B legacy.

## 3. Automatización de Despliegue (Netlify)
Hemos eliminado la necesidad de configurar paneles manualmente mediante archivos de configuración:

### Archivo `netlify.toml` (Raíz)
```toml
[build]
  base = "mariomojica-portfolio"
  command = "npm run build"
  publish = ".next"

[[plugins]]
  package = "@netlify/plugin-nextjs"
```

> [!NOTE]
> Se ha incluido una copia redundante en `/frontend/netlify.toml` por si el dashboard de Netlify tiene bloqueado ese directorio base.

## 4. Estrategia de Ramas Recomendada
1.  **Work in Progress**: Trabajar siempre en la rama `develop`.
2.  **Preview**: Netlify generará un link temporal automático para cada commit en `develop`.
3.  **Production**: Fusionar `develop` en `main` solo cuando los cambios sean estables.

## 5. Pasos para Replicar desde Cero
1. **Clonar Repo**: `git clone https://github.com/mariomojicastyle/mmapp.git`
2. **DNS**: Apuntar `mariomojica.com` a Netlify.
3. **Netlify**:
   - Conectar el repo.
   - Si no detecta el `netlify.toml`, establecer `Base directory` a `mariomojica-portfolio`.
4. **Supabase**: Reutilizar el esquema `schema_leads_V1.sql` para la base de datos de captación.

---
*Generado automáticamente por el Gestor de Arquitectura V2*
