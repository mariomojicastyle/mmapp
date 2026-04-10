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
* [ ] **[EN PROGRESO] LinkedIn Engine — Credenciales:** Configurar API Keys de OpenRouter, Fal AI y LinkedIn OAuth.
* [ ] **[PENDIENTE] GEO — Fase 2:** FAQPage Schema, blog técnico, registro en Bing/Brave.

## Próximos pasos
* [ ] **LinkedIn Engine:** Crear cuentas en OpenRouter y Fal AI, obtener API Keys.
* [ ] **LinkedIn Engine:** Configurar app OAuth en LinkedIn Developer Portal.
* [ ] **LinkedIn Engine:** Asignar credenciales en n8n y hacer test completo.
* [ ] **LinkedIn Engine:** Activar workflow para publicación automática (Mar/Mié/Jue 6AM COL).
* [ ] **🧠 GEO Semana 1:** Agregar FAQPage Schema (diseño paramétrico, Manufactura 4.0, productos).
* [ ] **🧠 GEO Semana 1:** Deploy SEO/GEO a producción + Solicitar indexación en Google Search Console.
* [ ] **🧠 GEO Semana 2:** Crear sección de blog con 3 artículos técnicos ricos en estadísticas.
* [ ] **🧠 GEO Semana 2:** Registrar sitio en Bing Webmaster Tools y Brave Search.
* [ ] **🧠 GEO Semana 3:** Publicar whitepaper PDF público (caso de estudio de diseño paramétrico).
* [ ] **🧠 GEO Mes 2+:** Publicar 1 artículo cada 2 semanas (contenido fresco = 3.2x citas en ChatGPT).
* [ ] Implementar auditoría de leads vía IA (Análisis de sentimiento/Interés).
* [ ] Optimizar imágenes .webp para carga ultra-rápida.
* [ ] Configurar analíticas avanzadas en Netlify.

## 🛠️ Última Actividad (24 Marzo 2026)
* **SEO Overhaul:** Reemplazo completo de metadata estática por `generateMetadata()` dinámica con título/descripción por idioma.
* **Open Graph + Twitter Cards:** Preview enriquecido para LinkedIn, WhatsApp, Facebook y X.
* **JSON-LD Schema.org:** Datos estructurados `Person` (expertise, ocupación, skills) + `WebSite`.
* **Sitemap dinámico:** 14 URLs generadas (homepage + 6 proyectos × 2 idiomas) con hreflang.
* **robots.ts para IA:** Acceso explícito para ChatGPT-User, GPTBot, PerplexityBot, ClaudeBot, Google-Extended y Bingbot.
* **Estrategia GEO documentada:** Plan completo basado en investigación Princeton/KDD 2024 (9 métodos de optimización para IA).
* **Pendiente GEO:** FAQPage Schema, blog técnico, registro Bing/Brave, whitepaper PDF.

## 🏆 Estatus Final
* **Arquitectura:** Estable, robusta y potenciada por IA. 🤖🛡️
* **Tiempos de respuesta:** < 3 segundos. ⚡
* **Escalabilidad:** Lista para automatización compleja de procesos B2B. 🚀

## ✅ Mantenimiento Futuro
* Revisar ocasionalmente el panel de Meta para verificar que el número emisor esté "Healthy".
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

