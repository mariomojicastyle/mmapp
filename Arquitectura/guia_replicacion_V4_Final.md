# 🏛️ Arquitectura del Sistema: V4 Final (marzo 2026)

## 🎯 Objetivo de la Versión
Lanzamiento oficial del portafolio bilingüe con una infraestructura de captura de leads robusta, automatizada y con una experiencia de usuario premium en todos los dispositivos.

## 🏗️ Diagrama de Flujo de Datos (Lógico)

[Frontend: Next.js + next-intl]
         |
         v
[Webhook POST: /leads-v3]
         |
         +--> [VPS: Dockerized n8n]
                  |
                  +--> [Register: Baserow Lead Table]
                  |
                  +--> [Notification: WhatsApp Cloud API (Meta)]
                  |
                  +--> [Notification: Email SMTP (Private Email)]
                  |
                  +--> [Sync: Google Calendar / Appointments]

## 🛠️ Tecnologías Utilizadas

1. **Frontend (Portafolio):**
   - **Framework:** Next.js 15+
   - **Estilado:** Tailwind CSS
   - **Internacionalización:** next-intl (Master Sync ES-EN)
   - **Despliegue:** Netlify

2. **Automatización & Backend (VPS):**
   - **Motor:** n8n (Versión 1.x) en Docker
   - **Base de Datos:** Baserow (Auto-hospedado)
   - **Proxy:** Nginx Proxy Manager (SSL Let's Encrypt)
   - **Comunicaciones:** WhatsApp Cloud API (Meta) + SMTP Directo.

## 🌟 Características Premium Implementadas

- **Diseño Adaptativo:** Header inteligente que se ajusta automáticamente entre escritorio y móvil sin colisiones visuales.
- **Master Sync i18n:** Sistema de traducción centralizado en español que escala automáticamente al inglés mediante IA.
- **Redundancia de Leads:** Uso de `fallback_urls` en el frontend para asegurar la captura de datos aun sin variables de entorno configuradas en la nube.
- **Validación Instantánea:** Feedback táctil y personalización dinámica del mensaje de éxito con el nombre del usuario.

## 🛡️ Seguridad y Mantenimiento (Próximos Pasos)

- [ ] Implementar Google Analytics para seguimiento de conversiones.
- [ ] Reforzar seguridad de cabeceras HTTP (Security Headers).
- [ ] Configuración de auditoría de logs para detectar intentos de spam.

---
*Evolución de Arquitectura liderada por Antigravity / Stitch.*
