# 🚀 RAM de Ventas — CRM Inteligente de Prospección B2B & Outreach Copilot

> **Ubicación en Plataforma:** `mario-mojica-plataforma/app/(dashboard)/ventas-ram`  
> **Tipos Core:** `mario-mojica-plataforma/lib/types/ventas-ram.ts`  
> **Acciones Serverless:** `mario-mojica-plataforma/app/actions/ventas-ram.ts`  
> **Persistencia:** Supabase PostgreSQL (`ventas_prospectos`, `ventas_interacciones`) & Baserow B2B  
> **WhatsApp Oficial:** `+57 311 764 6907`  
> **Email Oficial:** `mariomojica.style@gmail.com`  

El **RAM de Ventas** es el módulo central de memoria activa y prospección comercial estratégica de la plataforma de **Mario Mojica**. Diseñado para acelerar el ciclo de ventas B2B con tomadores de decisiones de la industria mueblera RTA (directores comerciales, gerentes de ingeniería y CEOs de Brasil y Latinoamérica).

---

## 🏗️ 1. Arquitectura del Módulo RAM de Ventas

El sistema opera bajo un flujo de triple capa:

```
[Captura LinkedIn / WhatsApp] 
         │
         ▼
[Analizador Multimodal IA] ──► [Extracción de Datos: Cargo, Empresa, Polo, Temperatura]
         │
         ▼
[Outreach Copilot] ──────────► [Copys Calibrados: 300, 600, 900, 1500 caracteres]
         │                     (Español & Português Brasileiro)
         ▼
[Persistencia & Telemetría] ─► [Supabase / Baserow CRM Tabla Leads (994)]
```

---

## 🌡️ 2. Termómetro de Leads (Temperatura Comercial)

El RAM de ventas categoriza automáticamente la temperatura del prospecto en 6 estados estratégicos:

| Estado | Descripción | Acción Inmediata |
| :--- | :--- | :--- |
| 🔥 **`caliente`** | Alto interés, ha solicitado demo o información técnica. | Agendar llamada o enviar link interactivo 3D en < 2 horas. |
| 🟡 **`tibio`** | Aceptó conexión, interactuó con publicaciones o respondió con cordialidad. | Enviar copy de 600 caracteres con caso de estudio RTA. |
| ❄️ **`enfriando`** | Sin respuesta tras 5 días del primer contacto. | Follow-up suave con enfoque en ahorro del 30% en costos de impresión. |
| ⏸️ **`pausado`** | Prospecto en ciclo presupuestal futuro o vacaciones. | Programar recordatorio en CRM para el próximo trimestre. |
| 🏆 **`cerrado_ganado`** | Cliente activo con contrato de manuales 3D o software. | Onboarding a la plataforma y configuración de IP Shield. |
| ❌ **`cerrado_perdido`** | Rechazo explícito o no encaja con el perfil de cliente ideal (ICP). | Archivar motivo de pérdida para analítica de producto. |

---

## ✉️ 3. Motor de Copys Calibrados (Outreach Copilot)

El módulo genera borradores en tiempo real listos para copiar y pegar, adaptados por longitud y cultura comercial:

1. **Nota de Conexión LinkedIn (300 caracteres | 240-270 útiles):**
   - *Objetivo:* Tasa máxima de aceptación.
   - *Fórmula:* Saludo personalizado + Cargo/Empresa + Posicionamiento ("Desarrollador de Software para la Manufactura") + Solución manuales 3D por voz + Enlace limpio (`mariomojica.com/demo`).
2. **InMail / Mensaje Corto (600 caracteres | 520-570 útiles):**
   - *Objetivo:* Generar curiosidad técnica y ejecutiva.
   - *Fórmula:* Asunto directo + Reconocimiento del polo industrial (ej. Bento Gonçalves, Arapongas, Ubá) + Sustitución del papel por 3D/voz + Reducción de costos del 30% + Propuesta de demo rápida.
3. **Mensaje Extendido B2B (900 caracteres | 800-870 útiles):**
   - *Objetivo:* Presentación de valor cuantificado y dolores de ingeniería.
   - *Fórmula:* El "Google Maps del armado" + Eliminación de reclamos en posventa + Métricas de armado para planta + Feedback al equipo de diseño.
4. **Propuesta Corporativa (1500 caracteres | 1300-1450 útiles):**
   - *Objetivo:* Cierre de demos corporativas con directores generales.
   - *Fórmula:* Filosofía del "último empleado de fábrica" + Impacto en CX + Telemetría detallada + Blindaje de propiedad intelectual (IP Shield) + Integración sin apps vía QR.

---

### 🔥 Leads Calientes / En Negociación Inmediata:
1. **Marcos De Henn Brasil (Móveis Henn - Brasil):**
   - **Cargo:** Decisor / P&D Engenharia (`+55 49 8807-4325`). Correo: `engenharia1@henn.com.br`.
   - **Estado:** CITA CONFIRMADA vía Google Meet para el **miércoles 26 de agosto de 2026 a las 10:00 BRT (8:00 COL)**.
   - **Última Acción:** Invitación enviada por Google Calendar y link de Meet compartido por WhatsApp con acuerdo de confirmación el miércoles temprano.
   - **Próxima Acción:** Enviar recordatorio breve por WhatsApp a las 9:30 BRT el miércoles antes de la demo 3D.

2. **Jonas Borck (Móveis Henn - Brasil):**
   - **Cargo:** Analista de Engenharia de Produtos (LinkedIn).
   - **Estado:** Padrino interno y puente comercial (Confirmó asistencia presencial a la sala de juntas con Marcos).
   - **Última Acción:** Jonas confirmó que Marcos entiende español si se habla pausado, que ambos participarán juntos en la sala de juntas proyectando la pantalla de Marcos en la TV, y sugirió mencionar 3DBimFab durante la presentación. Mario respondió agradeciendo el tip, confirmando el horario (Miércoles 26 a las 10:00 BRT) y comprometiéndose a dar el pincelazo de 3DBimFab.
   - **Próxima Acción:** Participar en la reunión técnica del miércoles 26 de agosto a las 10:00 BRT (8:00 COL).

---

## 🔄 4. Protocolo Antiduplicados y CRM Sincronizado

- **Detección Automática:** Cada lead extraído por imagen o texto es verificado contra la base de datos de Baserow (Tabla 994 / 600) y Supabase para evitar dobles registros.
- **Relaciones B2B:** Vinculación directa con la tabla de **Empresas Muebleras** (`ranking_empresas_rta_brasil.md`) para asociar el polo fabril, número de empleados y catálogo de productos.
- **Registro de Interacciones:** Cada mensaje enviado, respuesta y captura de pantalla queda archivada con fecha, resumen en español y borrador en portugués para seguimiento continuo del embudo.

---

---

---

## 🤝 6. Protocolo de Sincronización Antigravity & Fluidez Bilingüe (Local-First Brain)

### 🎯 El Propósito Fundamental del RAM de Ventas:
El mayor cuello de botella en la prospección comercial con tomadores de decisiones en Brasil es la **velocidad y fluidez de respuesta en portugués**. Dado que Mario no habla portugués nativo, Antigravity actúa como el **copiloto en tiempo real** que consulta el hilo histórico completo y genera respuestas inmediatas, hiper-contextualizadas y bilingües.

```
[Usuario pega Pantallazo de LinkedIn / WhatsApp en Antigravity] 
                               │
                               ▼
        [Antigravity (Cerebro Local con Contexto Total)] 
          • Historial completo del lead en RAM de Ventas
          • Dolores de ingeniería y categoría mueblera
          • Manifiesto B2B y fórmula de alto impacto
                               │
                               ▼
      [⚡ SALIDA EN EL CHAT: 2 BLOQUES DE CÓDIGO (1 CLIC)]
        1. Bloque en Português do Brasil (Listo para copiar y pegar)
        2. Bloque en Español (Traducción exacta para auditoría rápida)
                               │
                               ▼
            [INYECCIÓN AUTOMÁTICA EN RAM DE VENTAS]
        • Actualiza Supabase (`ventas_interacciones` / `ventas_prospectos`)
        • Guarda en `data/ventas_ram_storage.json`
        • Registra ambos campos: `borrador_pt` y `traduccion_es`
        • Actualiza Próxima Jugada Táctica y Temperatura
                               │
                               ▼
        [Visualización Inmediata en Web `localhost:3003/ventas-ram`]
```

---

### 📋 Regla Estricta de Formato de Salida en el Chat:
Cada vez que el usuario suba una captura o pida respuesta para un prospecto, Antigravity DEBE responder SIEMPRE con **dos bloques de código separados en el chat**:

1. **Bloque 1: Mensaje en Português do Brasil (1 Clic):**
   ```text
   [Texto del mensaje en portugués brasileño natural, cálido y persuasivo]
   ```
2. **Bloque 2: Traducción y Auditoría en Español (1 Clic):**
   ```text
   [Traducción fiel al español para que Mario entienda exactamente lo que se dice antes de enviar]
   ```

### 💉 Regla de Inyección en la Base de Datos y Almacén Local:
Al inyectar el evento en el hilo cronológico (`ventas_ram_storage.json` y Supabase PostgreSQL):
- `borrador_pt` / `mensaje_final_enviado`: Contiene el texto en portugués.
- `traduccion_es`: Contiene la traducción exacta en español.
- `resumen_es`: Resumen ejecutivo del hito en español.
- `proxima_accion_descripcion`: Tarea y fecha/hora del siguiente paso comercial.

