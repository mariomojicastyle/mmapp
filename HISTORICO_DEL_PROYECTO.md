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

### 🔹 23 de Marzo: IA en el Corazón de la Automatización
* **Empoderamiento del Agente:** Instalación del servidor **n8n-MCP** (Model Context Protocol). Ahora el Agente IA tiene permisos para leer, crear y editar flujos de trabajo directamente en el VPS.
* **Fix MCP Crítico:** Resolución del error `invalid character 'â'` en la inicialización del servidor MCP. Causa raíz: caracteres no-ASCII (emojis/logs) contaminando el flujo JSON-RPC. Solución: uso de `stdio-wrapper.js` para silenciar toda salida no-protocolo.
* **Biblioteca de Inteligencia:** Incorporación de **7 Habilidades Expertas** (`n8n-skills`) que permiten a la IA validar sintaxis de expresiones, configurar nodos complejos y aplicar patrones de diseño industriales en n8n automáticamente.
* **LinkedIn Content Engine 🚀:** Diseño de estrategia completa de visibilidad profesional:
    * **Estrategia:** 5 pilares de contenido (Diseño Industrial, IA+Automatización, Portafolio, Tendencias, Tutoriales) con pesos ponderados.
    * **Calendario:** Publicación Mar/Mié/Jue a las 6:00 AM COL (horarios óptimos de LinkedIn).
    * **Workflow (12 nodos):** Schedule Trigger → Selector de Pilar → OpenRouter AI (texto) → Fal AI (imagen) → WhatsApp Preview → Aprobación Humana → LinkedIn Publish → Registro en Baserow.
    * **Pendiente:** Configuración de credenciales API (OpenRouter, Fal AI, LinkedIn OAuth).
* **Capa de Control:** Creación de `AGENTS.md` para estandarizar la forma en que la IA debe operar los flujos de automatización bilingües.
* **Seguridad:** Configuración de credenciales seguras vía JWT para la API de n8n.
* **Arquitectura V5:** Actualización de la documentación técnica para reflejar la nueva capa de control autónomo.

### 🔹 9 de Abril: Gestión de Crisis Supabase 🛡️
* **Alerta de Pausa:** El proyecto de Supabase (`mariomojica_Proyecto`) notificó una pausa por inactividad a pesar de tener un workflow diario en n8n.
* **Diagnóstico:** El workflow original realizaba un `GET` sobre una tabla vacía, lo cual era insuficiente para el motor de tracking de Supabase.
* **Solución Crítica:**
    1. Creación de una tabla `public.heartbeat` dedicada.
    2. Refactor del workflow en n8n para sustituir el `GET` pasivo por un `PATCH` (escritura) activo diario.
    3. Validación exitosa: Se forzó actividad escrita para garantizar el mantenimiento del plan gratuito.

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

### 🧪 10 de Abril, 2026: Despliegue Exitoso de Gemma 4 Total
*   **PC (OMEN 17):** Se instaló con éxito `gemma4:31b` vía Ollama. El modelo demostró alta capacidad de razonamiento técnico, diseñando un plan de arquitectura senior para automatización en LinkedIn.
*   **Móvil (Tecno Camon 40 Pro):** Se logró la carga estable de `gemma-4-E2B-it-Q3_K_S` en PocketPal AI tras corregir errores de descarga corrupta y configurar `n_gpu_layers: 0`. Tasa de respuesta estable ~5 tokens/sec.
*   **Próxima Fase:** Implementación de la arquitectura diseñada por Gemma 4 31B (Fase 1: Infraestructura y Base de Datos en Supabase).

### 3. Ventaja de esta Metodología
*   **Consistencia:** El orden de los proyectos y las variables de diseño siempre se mantienen iguales entre idiomas.
*   **Ahorro de Tiempo:** El usuario solo se enfoca en crear contenido de calidad en español.
*   **SEO Global:** El sitio resultante genera rutas dinámicas `/es` y `/en` compatibles con Google Index.

---
*Este documento debe ser actualizado por Antigravity después de cada hito relevante.*
