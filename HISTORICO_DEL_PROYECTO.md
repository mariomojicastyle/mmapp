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

### 🏗️ 10 de Abril, 2026: Inicio Fase "Plataforma"
*   **Creación de Rama:** Se creó la rama `inicio-plataforma` para aislar el desarrollo del negocio del portafolio.
*   **Estructura:** Se creó la carpeta raíz `/Plataforma` dentro del proyecto actual. El objetivo es desarrollar aquí el "núcleo" del negocio que eventualmente vivirá en la raíz de `mariomojica.com`.
*   **Aislamiento:** El portafolio actual se mantiene intacto y funcional mientras se construye la nueva infraestructura en paralelo.

### 🎨 14-15 de Abril, 2026: El Maestro de Stitch y "The Digital Obsidian"
*   **Finalización de Dashboard:** Se completaron las 6 pantallas core del dashboard en alta fidelidad: Proyectos, Equipo, Integraciones, Uso, Facturación y Configuración.
*   **Diseño de Vanguardia:** Implementación del sistema **"The Digital Obsidian"**, un enfoque de diseño B2B que utiliza gradientes sutiles y capas de profundidad tonal en lugar de bordes tradicionales, inspirado en la estética de herramientas pro como Supabase.
*   **Estandarización:** Se unificó el Sidebar y Navbar en todas las pantallas. Se creó una **Design System Reference Card** en Stitch para mapear todos los tokens de color (Obsidian Teal #71d3f7 como color primario) y tipografía (Inter).
*   **Hito de Preparación:** Se estableció el diseño de Stitch como la "Base de Verdad" absoluta antes de iniciar la codificación local en `mario-mojica-plataforma`.

### 3. Ventaja de esta Metodología
*   **Consistencia:** El orden de los proyectos y las variables de diseño siempre se mantienen iguales entre idiomas.
*   **Ahorro de Tiempo:** El usuario solo se enfoca en crear contenido de calidad en español.
*   **SEO Global:** El sitio resultante genera rutas dinámicas `/es` y `/en` compatibles con Google Index.

---
*Este documento debe ser actualizado por Antigravity después de cada hito relevante.*

---

### 🔹 21 de Abril, 2026: Despliegue de Infraestructura Rhino.Compute
* **Misión Crítica:** Despliegue de Rhino.Compute Headless en el servidor cliente (`138.68.148.67`).
* **Actualización a Ubuntu 24.04 (Noble):** Se realizó un `do-release-upgrade` completo en el servidor de Fadi Salen para sacarlo de una versión EOL (23.10) y garantizar compatibilidad con los paquetes oficiales de McNeel.
* **Dockerización de Producción:**
    * Instalación de Docker y Docker Compose en la nueva base Noble.
    * Construcción de la imagen oficial de **Rhino.Compute** utilizando **.NET 9**.
* **Preparación de Lógica:** Carga de definiciones (.gh) y scripts de automatización en `/opt/rhino-compute/`.
* **Seguridad:** Configuración de acceso mediante llaves SSH y preparación de variables de entorno protegidas.
* **Estado Final:** Infraestructura **100% operativa** y lista para activar ("Turn-key") a la espera del Core-Hour Billing Token por parte del cliente.

