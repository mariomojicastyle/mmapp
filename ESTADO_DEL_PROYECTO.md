# 🧠 Estado del Proyecto: mariomojica.com

## 🎯 Objetivo Principal
Conectar la landing page (`mariomojica.com`) a un sistema completo de captura y gestión de leads usando tecnologías Open Source autohospedadas (n8n + Baserow).

## 🚀 Arquitectura
1. **Frontend:** Next.js (mariomojica.com) -> Envía datos por POST.
2. **Automatización:** n8n (`n8n_app` en VPS) -> Recibe Webhook, envía email de notificación y registra datos.
3. **Database:** Baserow (`baserow_app` en VPS) -> Almacena la data del prospecto.

## 🔗 Enlaces de Servicio
* **Baserow:** [https://baserow.mariomojica.com/database/144/table/600/2509](https://baserow.mariomojica.com/database/144/table/600/2509)
* **n8n:** [https://n8n.mariomojica.com/workflow/YzQv4LZDAzUGcgGR](https://n8n.mariomojica.com/workflow/YzQv4LZDAzUGcgGR)


## 📌 Progreso Actual
* [x] Formularios de Frontend diseñados y conectados (Producción).
* [x] Tabla de leads en Baserow optimizada y funcional.
* [x] Flujo de n8n estabilizado en VPS (Modo Activo / Background).
* [x] **[OPTIMIZADO]** WhatsApp Cloud API: Notificaciones inmediatas con todos los datos.
    * *Nota:* Token permanente configurado y número verificado en Meta Business Suite.
* [x] Identidad Profesional: Correo `direccion@mariomojica.com` configurado y testeado.
* [x] Instalación de `next-intl` y configuración de rutas.
* [x] Creación de diccionario maestro `es.json` y esclavo `en.json`.
* [x] Adaptación de componentes `Header` y `ContactForm` para bilingüismo.
* [x] Corrección de navegación interna (Deep Linking) para portafolio bilingüe.
* [x] Configuración de Middleware para redirección automática por idioma.
* [x] Creación de Script de Sincronización i18n Master Sync.

## Próximos pasos
* [x] Traducir contenido detallado de los proyectos en el portafolio (actualmente en código).
* [x] Optimizar imágenes .webp para carga ultra-rápida en ambas versiones.
* [x] **[NUEVO]** Implementación de Banner de Video Hero con overlay dinámico.
* [x] **[NUEVO]** Header Inteligente con comportamiento responsivo (Hamburger a la izquierda en móvil).
* [x] **[NUEVO]** Formulario de contacto personalizado por nombre de usuario.

## 🛠️ Última Actividad (21 Marzo 2026)
* **Hito Final:** Lanzamiento del Portafolio Premium Bilingüe con Video Banner.
* **UI/UX:** Reorganización del Header para dispositivos móviles (evitando colisión con logo).
* **Interactividad:** Botón de contacto con feedback táctil y lógica de envío robusta (webhook fallback).
* **Personalización:** Mensaje de éxito dinámico con el nombre del lead capturado.

## 🏆 Estatus Final
* **Arquitectura:** Estable y robusta. 🛡️
* **Tiempos de respuesta:** < 3 segundos. ⚡
* **Escalabilidad:** Preparado para recibir cientos de prospectos mensuales. 🚀

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

