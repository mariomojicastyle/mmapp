# 🚀 RAM de Ventas — CRM Inteligente de Prospección B2B & Outreach Copilot

> **Ubicación en Plataforma:** `mario-mojica-plataforma/app/(dashboard)/ventas-ram`  
> **Tipos Core:** `mario-mojica-plataforma/lib/types/ventas-ram.ts`  
> **Acciones Serverless:** `mario-mojica-plataforma/app/actions/ventas-ram.ts`  
> **Persistencia:** Supabase PostgreSQL (`ventas_prospectos`, `ventas_interacciones`) & Baserow B2B

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

## 🔄 4. Protocolo Antiduplicados y CRM Sincronizado

- **Detección Automática:** Cada lead extraído por imagen o texto es verificado contra la base de datos de Baserow (Tabla 994 / 600) y Supabase para evitar dobles registros.
- **Relaciones B2B:** Vinculación directa con la tabla de **Empresas Muebleras** (`ranking_empresas_rta_brasil.md`) para asociar el polo fabril, número de empleados y catálogo de productos.
- **Registro de Interacciones:** Cada mensaje enviado, respuesta y captura de pantalla queda archivada con fecha, resumen en español y borrador en portugués para seguimiento continuo del embudo.
