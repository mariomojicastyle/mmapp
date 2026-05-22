# 🧠 Estado Actual del Proyecto (Memoria Activa)

Este archivo es la "Memoria RAM" para Antigravity. Contiene el contexto de lo que estamos trabajando justo ahora, los objetivos pendientes y los bloqueos.

---

## 🏗️ 1. Plataforma B2B (Foco Actual)
**Estado:** Integración Supabase avanzada e Identidad Visual estandarizada.

### 🎯 Objetivos de la Fase
- [x] Migrar equipo a Supabase dinámico.
- [x] Corregir errores de hidratación y referencias en Solicitudes.
- [x] Sistema de Notificaciones Realtime (UI + DB + n8n).
- [x] Estandarización de Identidad Visual (Logo corregido en Login, Sidebar y TopNav).
- [x] Rediseño de Navegación Superior (TopNav con Créditos, Feedback y Búsqueda).
- [ ] **PRÓXIMO:** Módulo de Proyectos (Vincular solicitudes a proyectos reales).

### 🚧 Bloqueos / Notas Técnicas
- **Identidad Visual:** Se utiliza el logo `Logo_vertical_color_en.svg` (corregido) como estándar global.
- **TopNav:** Implementa créditos dinámicos desde el perfil de Supabase (fallback a 1,250).
- **Hydration:** Se añadió el check de `mounted` en `SolicitudesPage` para evitar desajustes entre SSR y Client.

---

## 🌐 2. Portfolio y Leads (mariomojica.com)
**Estado:** Estable y en producción. Conectado a sistema completo de captura de leads.

### 🎯 Objetivos de la Fase
- [x] Formularios de Frontend diseñados y conectados (Producción).
- [x] Conexión n8n + Baserow.
- [x] Tabla de leads en Baserow optimizada y funcional.
- [x] Notificaciones de leads activas (WhatsApp Cloud API y Email).
- [x] **[NUEVO] n8n-MCP Integration:** Capacidad de la IA para crear/editar flujos de n8n.
- [ ] **PENDIENTE:** Monitoreo de tráfico y leads reales.
- [ ] **PENDIENTE:** Optimización SEO avanzada (ver Skill seo-audit) y GEO (Generative Engine Optimization).

---

## 🛠️ 3. Aplicativo de Armado (Legacy Restore)
**Estado:** Integración inmersiva de Gama (R4X Bot) completada al 100% en la portada de carga (App_Armado_V10). Rediseño Obsidian Teal Premium finalizado.

### 🎯 Objetivos de la Fase
- [x] App_Armado_V10: Integración inmersiva 3D de "Gama" en la pantalla de carga inicial mediante Spline (interactividad de ratón, diseño transparente y barra de progreso auto-ocultable).
- [x] Eliminar dependencias de `3dymedios.com` (localización total de GLB, Matcaps, HDRI, audio y tips).
- [x] Corregir desfase de 1 metro en coordenadas de Three.js entre el modelo y el terreno.
- [x] Desconexión de red definitiva (Logo, encuestas y ayudas).
- [x] Corregir duplicidad de herrajes en el DOM en cambios de paso/producto.
- [x] Solucionar escala de imágenes de tooltips afectadas por Tailwind Preflight.
- [x] Rediseño Obsidian Teal Glassmorphic Premium (Fondos de cortinas esmerilados y tarjetas blancas de alto contraste para herramientas).
- [x] Cierre global de cortinas por teclado (Escape / ESC) y pausa automática de audios al abrir cortinas laterales.
- [x] Cápsula Premium de Garantía Obsidian Teal interactiva y fichas de tips informativas estáticas.
- [x] Exclusión mutua de cortinas (cierre preventivo de paneles abiertos al abrir uno nuevo) en el store de Zustand para evitar traslapes.
- [x] Reordenamiento y renombrado del tooltip superior de "Guía y Herramientas" según requerimientos del usuario.
- [x] Ajustes de navegación inferior V8.5: Icono de pausa al arranque y aumento de tamaño proporcional (40%) para número de paso e icono lupa en UI responsiva.

---

## 🔗 Enlaces de Control
- **Baserow:** [Leads Table](https://baserow.mariomojica.com/database/144/table/600/2509)
- **n8n Principal:** [https://n8n.mariomojica.com/](https://n8n.mariomojica.com/)
- **Supabase Console:** [Cloud Project](https://supabase.com/dashboard/)
- **Local App:** [http://localhost:3000](http://localhost:3000)

---
*Última actualización de contexto: 22 de Mayo, 2026*
