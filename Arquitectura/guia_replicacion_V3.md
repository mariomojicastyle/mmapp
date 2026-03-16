# Guía de Replicación de Arquitectura B2B - V3

Esta guía documenta la estabilización completa del sistema de captación de leads, migrando a un stack 100% autohospedado en el VPS para mayor control y escalabilidad.

## 1. Stack Tecnológico (V3)
- **Frontend**: Next.js 15 (Portfolio) en Netlify.
- **Automatización**: **n8n** (Docker en Hetzner VPS).
- **Base de Datos**: **Baserow** (Docker en Hetzner VPS).
- **Proxy/SSL**: **Nginx Proxy Manager** (Docker en Hetzner VPS).
- **Notificaciones**: Gmail SMTP vía STARTTLS (Port 587).

## 2. Cambios Clave en V3
- **Mapeo Robusto**: n8n ahora extrae datos directamente usando la ruta absoluta `$('Webhook: Formulario').item.json.body.descripcion`.
- **Campo Cualitativo**: Inclusión de "Descripción de la idea" (field_9455 en Baserow) como campo de texto largo.
- **Independencia de Supabase Cloud**: Los leads del portfolio ahora se centralizan en Baserow dentro de la infraestructura propia.

## 3. Configuración del VPS (Docker Compose)
Los servicios corren en contenedores aislados comunicados por una red interna:
- `n8n_app`: Gestiona la automatización.
- `baserow_app`: Almacena la data estructurada.
- `npm_proxy`: Gestiona los certificados SSL y dominios `baserow.mariomojica.com` y `n8n.mariomojica.com`.

## 4. Pasos para Replicar
1. **Infraestructura**:
   - Levantar los servicios usando el `compose.yml` del proyecto.
   - Configurar los Virtual Hosts en Nginx Proxy Manager con SSL de Let's Encrypt.
2. **Base de Datos (Baserow)**:
   - Crear una base de datos llamada "Portafolio".
   - Crear tabla "Leads" con los campos: Nombre, Apellido, Email, Empresa, País, Teléfono, Rol, Interés, Origen y **Descripción de la idea** (Texto largo).
3. **Automatización (n8n)**:
   - Importar el webhook.
   - Configurar credenciales de Baserow Portfolio API.
   - Mapear el nodo "Baserow: Guardar Lead" asegurando que el nombre del campo coincida (ej: `Descripcion de la idea`).

## 5. Variables de Entorno Críticas
- `NEXT_PUBLIC_N8N_WEBHOOK_URL`: URL del webhook en producción.
- `BASEROW_TOKEN`: Para la conexión n8n -> Baserow.
- `SMTP_USER` / `SMTP_PASS`: Para las notificaciones por correo.

---
*Generado automáticamente por el Gestor de Arquitectura V3 - 2026-03-16*
