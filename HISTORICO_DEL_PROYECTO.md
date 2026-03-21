# 📜 Histórico del Proyecto: mariomojica.com

Este archivo es un registro vivo de la evolución tecnológica del ecosistema Mario Mojica Style. Complementa a `ESTADO_DEL_PROYECTO.md` conservando la memoria de decisiones, retos y soluciones técnicas.

---

## 🗓️ Marzo 2026

### 🔹 Semana 1-2: Cimientos y Automatización Inicial
* **Validación de Supabase:** Se verificó la estabilidad de la capa de datos gratuita y se automatizaron chequeos preventivos para mantener los servicios activos.
* **Primeros Pasos con n8n:** Configuración de los primeros webhooks para capturar contactos del portafolio.
* **Integración de Calendario:** Implementación de flujos de Google Calendar para agendar citas directamente desde el formulario de contacto.

### 🔹 Semana 3: El Salto al Autohospedaje (Self-Hosted)
* **Migración a VPS (Hetzner):** Decisión estratégica de dejar la nube compartida para mover **n8n** y **Baserow** a contenedores Docker propios para máximo control.
* **Estabilización de Red:** Resolución de errores "Bad Gateway" (502) mediante la configuración de una red interna de Docker y el uso de **Nginx Proxy Manager**.
* **Arquitectura V1 a V3:** Refactorización del flujo de leads. Los datos ahora se guardan en Baserow y se notifican simultáneamente por email.

### 🔹 16-18 de Marzo: La Era de WhatsApp Cloud API
* **Conexión con Meta:** Configuración exitosa del portal de desarrolladores de Meta.
* **Integración Cloud API:** Pasamos de SMTP básico a notificaciones inmediatas por WhatsApp.
* **Reto de Credenciales:** Solución del problema de los tokens temporales mediante la implementación de un **System User con Token Permanente** en Meta Business Suite.
* **Validación de Identidad:** Configuración de `direccion@mariomojica.com` como remitente profesional.

### 🔹 19-20 de Marzo: Resiliencia y Recuperación Crítica
* **Incidente BSOD (Local):** Colapso del sistema local (Hypervisor Error) que requirió una reconstrucción del contexto de desarrollo.
* **Crisis de Acceso a Baserow:** Bloqueo de credenciales en la instancia del VPS. Se realizó un **bypass de seguridad por SSH** para resetear la contraseña del superusuario manualmente.
* **Optimización de Persistencia:** Descubrimiento de falta de volúmenes persistentes en Docker. Se aplicó un "blindaje" al `docker-compose.yml` para que la data de Baserow e n8n sobreviva a cualquier reinicio del servidor.
* **Prueba de Fuego (ÉXITO):** Test final exitoso donde un solo lead activó:
    1. Registro en Baserow.
    2. Notificación Email profesional.
    3. Notificación WhatsApp Cloud API.

### 🔹 21 de Marzo: Hito de Lanzamiento Portafolio Premium
* **Experiencia de Entrada:** Implementación de un **Video Banner (Hero)** con overlay azul de marca para un impacto visual inmediato.
* **Diseño Responsivo (Mobile First):** Reorganización estructural del Header. 
    * El menú (Hamburger) se movió a la izquierda y el selector de idiomas a la derecha para evitar superposiciones con el logo centrado.
* **Interfaz de Contacto Avanzada:** 
    * Botón de envío con feedback táctil (`active:scale-95`).
    * Implementación de **Personalización en Tiempo Real** (El mensaje de éxito ahora incluye el nombre del usuario dinámicamente).
    * **Robustez de Red:** Configuración de un "Webhook Fallback URL" para asegurar que los leads se envíen incluso si hay fallas en las variables de entorno de la nube.
* **Sincronización Total:** Integración de todas las traducciones de proyectos (ES/EN) con el motor Master Sync.

---

## 🏗️ Evolución de la Stack
1. **Fase 1:** Landing -> Email (Simple).
2. **Fase 2:** Landing -> n8n Cloud -> Supabase.
3. **Fase 3:** Next.js (Netlify/Local) -> VPS Personal (n8n + Baserow) -> WhatsApp Cloud API + Email SMTP Pro.
4. **Fase 4 (Lanzamiento):** Portafolio Premium Bilingüe con Video Banner e Interfaz Adaptiva. 🚀

### Marzo 2026 - Hito Internacionalización (I18n) 🌐
* **Desafío:** Expandir el portafolio a audiencias angloparlantes de forma automatizada.
* **Solución:** Implementación de `next-intl` con el modelo **Master Sync ES-EN**.
* **Estado:** Lanzamiento exitoso de la versión bilingüe en `/es` y `/en`. Selector de idioma interactivo y formulario dinámico configurados.

---

## 🌎 Guía de Mantenimiento i18n (Master Sync)

Para evitar la edición de doble contenido y errores humanos en la traducción, hemos implementado una arquitectura de **"Idioma Maestro"**.

### 1. El Flujo de Trabajo
*   **Archivo Maestro:** `messages/es.json` (Aquí es donde editas todo el contenido en español).
*   **Traducción IA:** `messages/en.json` (Este archivo se genera automáticamente y NO debe editarse a mano).

### 2. Pasos para Actualizar Textos (Tutorial):
1.  **Edita el Maestro:** Abre `src/messages/es.json` y cambia lo que necesites (ej: el título de un proyecto).
2.  **Dispara la Sincronización:** Ejecuta el comando personalizado en la terminal:
    ```bash
    npm run translate
    ```
3.  **Verificación IA:** El script enviará los cambios al motor de IA para traducir manteniendo el tono premium y técnico del portafolio.
4.  **Sincronización:** `en.json` se actualizará automáticamente con las nuevas traducciones preservando las claves y la estructura.

### 3. Ventaja de esta Metodología
*   **Consistencia:** El orden de los proyectos y las variables de diseño siempre se mantienen iguales entre idiomas.
*   **Ahorro de Tiempo:** El usuario solo se enfoca en crear contenido de calidad en español.
*   **SEO Global:** El sitio resultante genera rutas dinámicas `/es` y `/en` compatibles con Google Index.

---
*Este documento debe ser actualizado por Antigravity después de cada hito relevante.*
