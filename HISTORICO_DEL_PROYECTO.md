# 📜 Histórico del Proyecto: mariomojica.com

Este archivo es un registro vivo de la evolución tecnológica del ecosistema Mario Mojica Style. Complementa a `ESTADO_DEL_PROYECTO.md` conservando la memoria de decisiones, retos y soluciones técnicas.

---

## 🗓️ Marzo 2026

### 🔹 Semana 1-2: Cimientos y Automatización Inicial
* **Validación de Supabase:** Se verificó la estabilidad de la capa de datos gratuita y se automatizaron chequeos preventivos para mantener los servicios activos.
* **Primeros Pasos con n8n:** Configuración de los primeros webhooks para capturar contactos del portafolio.
* **Integración de Calendario:** Implementación de flujos de Google Calendar para agendar citas directamente desde el formulario de contacto.

### 🔹 Semana 3: El Salto al Autohospedaje (Self-Hosted)
* **Migración a VPS (Hetzner):** Decisión estratégica de dejar la nube compartida para mover **n8n** y **Baserow** a un VPS propio con Docker, ganando control total y eliminando limitaciones de filas.
* **Proxy Inverso (Nginx/Traefik):** Configuración de dominios y subdominios con SSL automático (Let's Encrypt).

---

## 🗓️ Abril 2026

### 🔹 Semana 1-2: Refactorización y Escalabilidad
* **Integración Cloud API (WhatsApp):** Sustitución de soluciones no oficiales por la API oficial de Meta para mayor estabilidad en notificaciones de leads.
* **LinkedIn Content Engine:** Diseño inicial de la automatización para procesar contenido de LinkedIn hacia Baserow.

### 🔹 Semana 3-4: Plataforma B2B e Identidad Visual
* **Estandarización Visual:**
  - Definición del estilo "Obsidian Teal" para toda la plataforma.
  - Implementación del logo corporativo corregido (`Logo_vertical_color_en.svg`) en Login, Sidebar y TopNav.
* **Navegación y UX:**
  - Rediseño completo de la `TopNav` (Barra Superior) incluyendo:
    - Identidad de usuario con icono.
    - Contador de créditos dinámico vinculado a Supabase.
    - Sistema de Feedback y Búsqueda global (Ctrl K).
    - Acceso rápido a Ayuda y Recarga de Créditos.
  - Ajuste de consistencia en el Módulo de Configuración (espaciado y paddings unificados).
* **Supabase & Notificaciones:**
  - Migración a un sistema de notificaciones basado en IDs de usuario (UUID) para mayor robustez.
  - Implementación de Realtime para alertas instantáneas de nuevas solicitudes.
  - Sincronización de perfiles con metadatos de autenticación y asignación de empresas (Jamar, Zanfairo, etc.).
* **Flujos de Trabajo:**
  - Estabilización del Kanban con lógica de arrastre refinada.
  - Sincronización en tiempo real de estados de tickets entre Admin y Cliente.
* **Evolución Arquitectónica:**

### 🔹 Semana 4: Refinamiento de Identidad y Simetría (UI/UX Pro)
* **Arquitectura de Layout Global:** Se reestructuró la jerarquía para que el `TopNav` sea un elemento raíz de ancho completo, con el `Sidebar` y el contenido residiendo debajo, evitando solapamientos.
* **Unificación de Branding:** Se eliminó el logosímbolo del sidebar para centralizar la identidad en el `TopNav`, alineándolo perfectamente con el eje vertical de los iconos de navegación.
* **Simetría Matemática:** Implementación de márgenes de 17px en ambos extremos del `TopNav` para equilibrar visualmente el logosímbolo (izq) y el avatar de usuario (der).
* **Navegación Contextual:** Activación de breadcrumbs dinámicos en la barra superior para mejorar la orientación del usuario.

---

*Este documento debe ser actualizado por Antigravity después de cada hito relevante. no se debe borrar informacion anterior,solo agregar nueva. *

---

*Última consolidación: 30 de Abril, 2026*
