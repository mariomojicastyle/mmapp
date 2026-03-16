# 🧠 Estado del Proyecto: mariomojica.com

## 🎯 Objetivo Principal
Conectar la landing page (`mariomojica.com`) a un sistema completo de captura y gestión de leads usanto tecnologías Open Source autohospedadas (n8n + Baserow).

## 🚀 Arquitectura
1. **Frontend:** Next.js (mariomojica.com) -> Envía datos por POST.
2. **Automatización:** n8n (`n8n_app` en VPS) -> Recibe Webhook, envía email de notificación y registra datos.
3. **Database:** Baserow (`baserow_app` en VPS) -> Almacena la data del prospecto.

## 🔗 Enlaces de Servicio
* **Baserow:** [https://baserow.mariomojica.com/database/144/table/600/2509](https://baserow.mariomojica.com/database/144/table/600/2509)
* **n8n:** [https://n8n.mariomojica.com/workflow/VI01Zr7o8sDxoNwT/](https://n8n.mariomojica.com/workflow/VI01Zr7o8sDxoNwT/)


## 📌 Progreso Actual
* [x] Formularios de Frontend diseñados y conectados (Vite -> N8N).
* [x] Tabla de leads en Baserow optimizada (Tipos de datos corregidos).
* [x] Flujo de N8N funcional, saneado e integrado directamente.
* [x] Acceso SSH y control absoluto de contenedores Docker (`n8n_app`, `baserow_app`).
* [x] Mapeo de campos verificado mediante IDs técnicos de Baserow (`field_9455` para descripción).
* [x] Autohospedaje estabilizado (Baserow + n8n + Proxy).

## 🚧 Detalles Técnicos y Debugging (La Minucia)
* **[INTERÉS] Validación de Select:** Baserow rechazaba filas porque el campo "Interés" era un "Single Select" y no permitía valores nuevos. Se convirtió a **Texto de una sola línea**.
* **[MAPEADO] Ruta .body:** N8N busca los datos usando la ruta absoluta `$('Webhook: Formulario').item.json.body.nombre` para mayor robustez ante cambios en el flujo.
* **[FIELD ID] Descripción:** Se integró el campo "Descripción de la idea" (ID 9455) como Texto Largo, permitiendo capturar detalles cualitativos.
* **[STATUS] Published:** El flujo de n8n ha sido publicado y está en modo "Active", eliminando la necesidad de archivos JSON temporales.

1. **[ESTADO]** Las pruebas de humo han sido exitosas. La data fluye desde `localhost:3000` hasta el VPS y de ahí a Baserow y Gmail.
2. **[PRÓXIMO]** Monitoreo de los primeros leads reales y posible expansión de campos.

