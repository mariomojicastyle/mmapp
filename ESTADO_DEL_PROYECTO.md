# 🧠 Estado del Proyecto: mariomojica.com

## 🎯 Objetivo Principal
Conectar la landing page (`mariomojica.com`) a un sistema completo de captura y gestión de leads usando tecnologías Open Source autohospedadas (n8n + Baserow).

## 🚀 Arquitectura
1. **Frontend:** Next.js (mariomojica.com) -> Envía datos por POST.
2. **Automatización:** n8n (`n8n_app` en VPS) -> Recibe Webhook, envía email de notificación y registra datos.
3. **Database:** Supabase -> Almacena la data del prospecto y el pipeline de contenido.
4. **AI Layer (Antigravity):** Integración bi-direccional vía MCP (Model Context Protocol) para gestión autónoma de n8n.

### 🗄️ Base de Datos (Supabase)
Se ha realizado una limpieza total del esquema `public` para eliminar tablas de proyectos anteriores. La arquitectura actual se centra en la **Máquina de Estados de Contenido**:

*   **`leads`**: Perfiles de clientes, industrias y puntos de dolor.
*   **`templates`**: Estructuras de prompts (educativos, ventas, etc.) para la IA.
*   **`content_pipeline`**: Gestión del flujo de vida del post (`draft` -> `published`).
*   **`heartbeat`**: (Mantenimiento) Tabla dedicada para evitar la pausa del proyecto por inactividad.

### 🤖 Inteligencia Artificial (Gemma 4 Local)
*   **PC (Core):** `Gemma 4 31B` vía Ollama como motor de razonamiento y generación masiva.
*   **Móvil (Edge):** `Gemma 4 2B` para revisiones rápidas y consultas locales.
*   **Integración:** n8n servirá como puente entre Supabase y los modelos locales vía API de Ollama.

## 🔗 Enlaces de Servicio
* **Baserow:** [https://baserow.mariomojica.com/database/144/table/600/2509](https://baserow.mariomojica.com/database/144/table/600/2509)
* **n8n:** [https://n8n.mariomojica.com/workflow/YzQv4LZDAzUGcgGR](https://n8n.mariomojica.com/workflow/YzQv4LZDAzUGcgGR)
* **LinkedIn Engine:** [https://n8n.mariomojica.com/workflow/ytXCgHgrXf7kM5YD](https://n8n.mariomojica.com/workflow/ytXCgHgrXf7kM5YD)


## 📌 Progreso Actual
* [x] Formularios de Frontend diseñados y conectados (Producción).
* [x] Tabla de leads en Baserow optimizada y funcional.
* [x] Flujo de n8n estabilizado en VPS (Modo Activo / Background).
* [x] **[OPTIMIZADO]** WhatsApp Cloud API: Notificaciones inmediatas con todos los datos.
* [x] **[NUEVO] n8n-MCP Integration:** Capacidad de la IA para crear/editar flujos de n8n en el VPS.
* [x] **[NUEVO] n8n-Skills Library:** Biblioteca de +7 habilidades expertas para automatización robusta.
* [x] Identidad Profesional: Correo `direccion@mariomojica.com` configurado y testeado.
* [x] Instalación de `next-intl` y configuración de rutas (ES/EN).
* [x] **[NUEVO] LinkedIn Content Engine:** Workflow de 12 nodos desplegado en n8n (ID: `ytXCgHgrXf7kM5YD`).
* [x] **[NUEVO] SEO Completo:** Meta tags dinámicos (ES/EN), Open Graph, Twitter Cards, JSON-LD (Person + WebSite), sitemap, canonical + hreflang.
* [x] **[NUEVO] GEO Preparación:** robots.txt actualizado para bots de IA (ChatGPT, GPTBot, Perplexity, Claude, Gemini, Copilot).
* [x] **[NUEVO] Google Analytics 4:** Seguimiento de tráfico (`G-Z020RXK7EL`) implementado en todas las páginas.
* [x] **[NUEVO] Antigravity Advanced Skills:** Expansión a 31 habilidades (incluyendo Seguridad, Docker, TDD y Debugging).
* [x] **[HITO] Finalización de Diseño en Stitch:** Dashboard de la Plataforma finalizado con sistema "The Digital Obsidian" (6 pantallas core + Design System Card).
* [ ] **[EN PROGRESO] LinkedIn Engine — Credenciales:** Configurar API Keys de OpenRouter, Fal AI y LinkedIn OAuth.
* [ ] **[PENDIENTE] GEO — Fase 2:** FAQPage Schema, blog técnico, registro en Bing/Brave.

## Próximos pasos
* [ ] **LinkedIn Engine:** Configurar API Keys de OpenRouter, Fal AI y LinkedIn OAuth y testear workflow.
* [ ] **🧠 GEO Semana 1-2:** FAQPage Schema, blog técnico, registro en Bing/Brave y solicitud de indexación.
* [ ] **🚀 Implementación Plataforma (Next.js):** 
    * [ ] Inicializar proyecto Next.js en `mario-mojica-plataforma` con la estructura base.
    * [ ] Configurar el sistema de diseño "The Digital Obsidian" en `globals.css` (variables de color, tipografía Inter, gradientes).
    * [ ] Construir componentes base de UI (Sidebar estandarizado, Navbar, Split-tone cards).
    * [ ] Implementar pantalla de Login (Supabase + Google Auth).
    * [ ] Desarrollar Dashboard Dashboard inicial con rutas protegidas replicando el diseño de Stitch.
* Monitorear logs de n8n en el VPS ante picos de tráfico.

## 🛠️ Última Actividad (15 Abril 2026)
* **Finalización de Diseño en Stitch:** Se completó el diseño de alta fidelidad para el Dashboard de la Plataforma.
    * **Sistema de Diseño:** "The Digital Obsidian" (Dark Mode, Inter, Obsidian Teal #71d3f7).
    * **Arquitectura de Capas:** Definida por profundidad tonal (sin líneas), replicando el rigor técnico de Supabase.
    * **Pantallas Listas:** Proyectos, Equipo, Integraciones, Uso, Facturación y Configuración.
    * **Activo Maestro:** Se creó la "Design System Reference Card" en Stitch como guía para la implementación CSS.
* **Preparación para Desarrollo:** El foco cambia del diseño en Stitch a la implementación técnica en Next.js dentro de `mario-mojica-plataforma`.

## 📑 Estado Actual
- **Foco:** Validación y preparación del diseño avanzado de la plataforma de negocio en Stitch.
- **Contexto:** Se ha localizado el diseño maestro en Stitch ("Mario Mojica Full Desktop Replica"). No existe implementación local previa.
- **Rama activa:** `inicio-plataforma`.

## 🎯 Tareas Inmediatas
1. [ ] Configurar el entorno de desarrollo en `mario-mojica-plataforma`.
2. [ ] Traducir los tokens de diseño de Stitch a variables CSS en `globals.css` (The Digital Obsidian).
3. [ ] Implementar el Layout base (Sidebar + Navbar) que se repite en todas las pantallas.
* Monitorear logs de n8n en el VPS ante picos de tráfico.

## 📍 Próximos Pasos: Internacionalización (i18n) Pro
**Objetivo:** Permitir el cambio de idioma (ES/EN) con rutas dedicadas (`/es` y `/en`) para SEO internacional.

1.  **Instalación de Core:** Agregar `next-intl` al proyecto `mariomojica-portfolio`.
2.  **Refactor de Estructura:** Mover `app/` a `app/[locale]/` para habilitar el routing dinámico.
3.  **Diccionarios de Datos:** 
    *   Crear `messages/es.json` y `messages/en.json` para textos estáticos.
    *   Traducir el archivo `portfolio/data.ts` para que soporte campos bilingües.
4.  **UI Interactiva:** Modificar el componente `Header.tsx` para que el selector **ES / EN** navegue entre rutas de forma fluida.
5.  **Middleware:** Configurar la detección automática de idioma según la región del usuario.

