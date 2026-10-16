# 🚀 RAM de Ventas — CRM Inteligente de Prospección B2B & Outreach Copilot

> **Ubicación en Plataforma:** `mario-mojica-plataforma/app/(dashboard)/ventas-ram`  
> **Tipos Core:** `mario-mojica-plataforma/lib/types/ventas-ram.ts`  
> **Acciones Serverless:** `mario-mojica-plataforma/app/actions/ventas-ram.ts`  
> **Persistencia:** Supabase PostgreSQL (`ventas_prospectos`, `ventas_interacciones`) & Local JSON (`data/ventas_ram_storage.json`)  
> **WhatsApp Oficial:** `+57 311 764 6907`  
> **Email Oficial:** `mariomojica.style@gmail.com`  
> **Portafolio Oficial:** `https://portfolio.mariomojica.com/es`  

---

## ⚡ PROTOCOLO DE ACTUACIÓN INMEDIATA (Zero Friction / < 60 Segundos)

El **RAM de Ventas** es la memoria viva y el motor de respuesta en tiempo real de Mario Mojica para la prospección y cierre comercial B2B con la industria mueblera de Brasil y Latinoamérica.

### 🎯 El Mandamiento Central:
> **"La velocidad y la profundidad de contexto son el cierre de la venta."**  
> Cuando Mario está conversando por WhatsApp o LinkedIn con un tomador de decisiones (Directores de P&D, Gerentes de Ingeniería, CEOs), **cada segundo cuenta**. Mario no debe esperar análisis abstractos ni explicaciones largas. Necesita la respuesta perfecta, en portugués brasileño natural y empático, con todo el contexto histórico aplicado, lista para copiar en un solo clic.

---

### 🔄 Flujo de Ejecución Automatizado ante cualquier Entrada:

Cada vez que Mario:
1. Suba una **captura de pantalla** de WhatsApp o LinkedIn, O
2. Pegue un **texto de conversación**, O
3. Diga: *"Qué le respondo a [Nombre/Empresa]"*, *"Ayúdame con este mensaje"*, *"Qué le digo a X"*:

Antigravity DEBE ejecutar automáticamente la siguiente secuencia sin pedir confirmaciones:

```
                      [CAPTURA O MENSAJE DEL USUARIO]
                                    │
                                    ▼
       ┌─────────────────────────────────────────────────────────┐
       │ 1. MATCH INMEDIATO CON EL PROSPECTO EN RAM              │
       │    Identifica nombre, empresa, cargo y canal.           │
       └────────────────────────────┬────────────────────────────┘
                                    │
                                    ▼
       ┌─────────────────────────────────────────────────────────┐
       │ 2. CARGA DE CONTEXTO PROFUNDO (PROHIBIDO RESUMIR)       │
       │    • Quién es el Padrino B2B / Conector.                │
       │    • Qué se habló en llamadas y mensajes anteriores.     │
       │    • Dolores técnicos específicos y productos tratados. │
       │    • Propuesta económica, precios y fechas acordadas.   │
       │    • Tono y nivel de formalidad de la relación.         │
       └────────────────────────────┬────────────────────────────┘
                                    │
                                    ▼
       ┌─────────────────────────────────────────────────────────┐
       │ 3. SALIDA EN EL CHAT: 2 BLOQUES DE CÓDIGO (1 CLIC)      │
       │    Bloque 1: Português do Brasil (Listo para enviar)    │
       │    Bloque 2: Español (Auditoría rápida para Mario)       │
       └────────────────────────────┬────────────────────────────┘
                                    │
                                    ▼
       ┌─────────────────────────────────────────────────────────┐
       │ 4. PERSISTENCIA SILENCIOSA AUTOMÁTICA                   │
       │    • Inyecta en Supabase Cloud y `ventas_ram_storage`   │
       │    • Actualiza la bitácora de este archivo              │
       │    • Actualiza la Próxima Jugada Táctica y Temperatura  │
       └─────────────────────────────────────────────────────────┘
```

---

## 📋 FORMATO ESTÁNDAR DE SALIDA EN EL CHAT (OBLIGATORIO)

Cada respuesta ante un prospecto debe entregarse SIEMPRE en este formato exacto:

### 🇧🇷 Bloque 1: Português do Brasil (1 Clic para Copiar)
```text
[Mensaje redactado en portugués brasileño corporativo, cálido, fluido y ultra-contextualizado. Cero traducción robótica. Adaptado al polo fabril (RS, PR, SC, SP, MG) y al canal de comunicación (WhatsApp o LinkedIn).]
```

### 🇪🇸 Bloque 2: Traducción y Auditoría en Español
```text
[Traducción fiel y explicativa en español para que Mario valide exactamente el mensaje, la estrategia y los acuerdos de fecha/hora antes de enviar.]
```

> **📌 Datos Clave de Apoyo (Pie de mensaje):**
> - **Lead:** [Nombre] — [Cargo] ([Empresa])
> - **Estado:** [Temperatura: Caliente / Tibio / etc.]
> - **Próxima Jugada Táctica:** [Fecha y acción concreta sugerida]

---

## 🏗️ ARQUITECTURA DE DATOS Y CONTEXTO PROFUNDO

Para evitar respuestas genéricas, el RAM de ventas almacena y cruza 5 dimensiones clave por cada prospecto:

1. **Vínculo y Padrino B2B:** Quién abrió la puerta (ej. Atilio Barse de Mobille/AKEO para Politorno; Jonas Borck para Móveis Henn; Andrés Moncaleano para Inval).
2. **Dolores de Ingeniería & P&D:** Costo de manuales impresos, reclamos por garantías de armado, falta de telemetría, errores en herrajes, tiempos de ingeniería en nuevos lanzamientos.
3. **Propuesta Económica & Piloto:** Valores cotizados (30% de ahorro garantizado, US$ 1.00/mes por mueble activo, tabla de costos enviada, piloto 3D sin costo en 1 producto).
4. **Avances de Software:** Pinceladas estratégicas de **3DBimFab** (`3bf.mariomojica.com`) como motor paramétrico para diseño y fabricación digital.
5. **Calendario y Logística:** Disponibilidad de horarios cruzada con Google Calendar para proponer franjas exactas con zona horaria (BRT / UTC-3 vs COL / UTC-5).

---

## 📊 DIRECTORIO MAESTRO DE PROSPECTOS B2B (ESTADO EN VIVO)

| Empresa | Contacto | Cargo | Dolores / Oportunidad | Estado / Temperatura | Último Hito | Próxima Jugada Táctica |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Mobille / AKEO Partner** | Luiz Atilio Barse | Diretor & Super-Conector B2B | Conexión estratégica, apadrinamiento con fábricas en RS | 🔥 Aliado Estratégico (Padrino B2B) | 10 Ago 2026 - Conexión directa a Marcelo Novo (Politorno) con aval de Sr. Pedro | Mantenerlo informado de avances con Politorno |
| **Politorno Móveis** | Marcelo Piriz & Ricardo | Dirección P&D / Proyectos | Desconexión de software (Rhino, TopSolid, 3ds Max, manuales, empaque). Manual 3D y ADN paramétrico | 🔥 Propuesta Piloto Enviada / Muy Caliente | 28 Sep 2026 - Marcelo acusó recibo: "Estou bem atarefado. Quando der dou uma atenção para este tema!". Mario respondió con empatía total a la rutina de fábrica y cero presión | Esperar con tranquilidad a que Marcelo y Ricardo revisen la propuesta cuando tengan un respiro |
| **Móveis Henn** | Marcos Unnass & Jonas Borck | Coordenador P&D & Analista Engenharia | Manuales interactivos 3D, 3dBimFab, ERP TOTVS Datasul, ahorro 30% | 🔥 ¡Reunión Confirmada! / Martes 29 Sep 10:30 BRT | 24 Sep 2026 - Marcos aceptó Martes 29/09. Mario ajusta a 10:30 a 11:30 BRT (08:30 a 09:30 COL) para calzar agenda con Sistemas | Enviar link de Google Meet y citación para Marcos, Jonas y Sistemas |
| **Grupo K1 (Kappesberg)** | Julio Santos | Especialista IA & Automação / Mkt | Costos de P&D de manuales, modelo suscripción ($1 USD/mes), IA aplicada | 🔥 En Evaluación / Seguimiento Activo | 09 Oct 2026 - Solicitada retroalimentación sobre la planilla de estimación de costos enviada | Esperar respuesta de Julio para agendar 15 min de alineación con gerencia |
| **Kit's Paraná** | Marcos Benedito & Jamylle Duarte | Directivos P&D / Marketing | Costos de asistencia técnica, manuales en papel, telemetría | 🟡 Referenciado / Email Preparado | 17 Ago 2026 - Andre Luis facilitó sus correos | Enviar correo corporativo formal a Marcos y Jamylle |
| **MADECENTRO** | Dimas Tobón | Gerente General & Fundador | Oportunidad comercial Buga / Valle en muebles terminados RTA, modulares y 3dBimFab | 🔥 Muy Caliente / Solicitó Email | 10 Oct 2026 - Solicitó propuesta a Dimas.tobon@madecentro.com | Enviar correo ejecutivo y confirmar por LinkedIn para llamada |
| **Italínea Móveis** | Maria do Carmo Roos Soares | Gestão & Eventos | Conexión con equipo de P&D / Criação (`pedcriareeitalinea@italinea.com.br`) | 🔥 Puente Activo / Caliente | 18 Ago 2026 - Solicitado WhatsApp de P&D tras Movelsul | Esperar respuesta con WhatsApp directo de P&D/Criação |
| **Grupo Pinho** | Patrick Antonowicz | Analista de Exportação Júnior | Conexión con Cristiane (área técnica de manuales/logística) | 🔥 Puente Activo / Caliente | 18 Ago 2026 - Reenvió propuesta a Cristiane | Solicitar a Patrick el e-mail o WhatsApp directo de Cristiane |
| **Multimóveis** | Leandra Piccin | Export Manager | Manuales 3D para exportación global, cero barrera idiomática, ahorro 30% P&D | 🔥 Caliente / En Evaluación | 18 Ago 2026 - Reenvió info al área técnica | Seguimiento con 30% ahorro + piloto 3D sin costo para exportación |
| **Madesa Móveis** | Douglas Guth | Líder DHO & Formação / P&D | Costos de P&D en manuales, e-commerce, reducción de garantías | 🔥 Caliente / En Evaluación Técnica | 18 Ago 2026 - Reenvió demo al sector técnico. Elogió la propuesta | Enviar comparativa de costos + prototipo 3D gratuito |
| **Del Alba / ex-Maderkit** | Andrés Felipe Moncaleano Campo | Gerente Supply Chain | Reconexión profesional, empaque, compras y manuales 3D | 🔥 Padrino B2B Activo | 18 Ago 2026 - Conectó con Juan Carlos Londoño (CEO Inval) | Mantenerlo informado de los avances con Inval |
| **Inval S.A.** | Juan Carlos Londoño | Presidente & CEO | Manuales interactivos 3D para muebles RTA, reducción de garantías | 🔥 Caliente / Vía Andrés Moncaleano | 18 Ago 2026 - Andrés facilitó su WhatsApp directo | Contactar por WhatsApp con el saludo y aval de Andrés Moncaleano |
| **RTA Design S.A.S** | Juan Carlos Pérez & Paola Reyes | Gerente Adm. Financiero / Dir. Compensación | Entrevista presencial en Yumbo (Paola y Viviana). Propuesta de Piloto con Agente IA / 3dBimFab | 🔥 Caliente / Retroalimentación Pendiente | 16 Sep 2026 - Paola confirmó por WhatsApp que está pendiente la sesión de feedback con Juan Carlos | Responder con tranquilidad y esperar la retroalimentación interna |
| **Muebles Jamar Colombia** | Omar DeLaHoz Rocha & Juan Carlos Goez | VP Logística e Industria / Ingeniería CILA | Control de costo objetivo (Design to Cost), optimización de corte y kits mecanizados para el CILA | 🔥 Muy Caliente / Agendando Cita | 09 Oct 2026 - Propuesta de horarios de 15 min enviada para ver 3dBimFab (costeo y diseño en tiempo real para CILA) tras acuerdo de liberar agenda | Enviar link de reunión al confirmar opción A, B o C |
| **Ternova** | Julio Sanchez | Ingeniería / Automatización | Manuales para maquinaria, limitaciones de Fusion 360 | 🟡 Puerta Abierta / Seguimiento Suave | 18 Ago 2026 - Mencionó avance en Fusion 360. Dejar relación abierta | Enviar tip de exportación web sin presión en 15 días |
| **Móveis Henn (Planejamento)** | Rudgeri Henkel | Gerente Planejamento e Materiais | Costos de asistencia técnica, errores de ensamble en RTA | 🟡 Mensaje de WhatsApp Listo | 03 Ago 2026 - Dio su WhatsApp directo en LinkedIn | Integrar al hilo de la reunión con Marcos y Jonas |
| **Bartira (Padrino B2B)** | Hermes Rodrigues de Oliveira | Operador Logística / Planta | Conexión interna hacia el líder de Producto / Ingeniería | 🔥 Padrino Interno Clave | 25 Sep 2026 - Consiguió y entregó el contacto directo de Fábio de Jesus Ferreira (Projetista P&D) | Agradecer y coordinar aval de mención en la apertura |
| **Bartira (P&D / Engenharia)** | Fábio de Jesus Ferreira | Projetista | Desenvolvimento de Produtos - Eng | Modernización de proyectos, DfMA, gemelos digitales 3D y Lean Six Sigma | 🔥 Lead Caliente / Conversación Activa | 28 Sep 2026 - Fábio aceptó conexión y respondió "Seja bem vindo". Enviada respuesta apalancando el puente de Hermes y proponiendo demo 3D de 1 min | Esperar respuesta de Fábio para enviar enlace interactivo de 3dBimFab |
| **Bartira (Ex-Líder)** | Denis Roveri | Ex-Gerente de Engenharia | Relacionamiento en la industria de manufactura | ⏸️ Red Abierta | 17 Ago 2026 - Informó que salió de Bartira | Mantener contacto en su nuevo rol en la industria |
| **Demóbile** | Junio César Françolin | Gerente de Produção | Control de calidad extendido, telemetría de ensamble | ❄️ Enfriando | 05 Ago 2026 - Vio el perfil de Mario en LinkedIn | Enviar mensaje corto sobre control de calidad extendido |
| **SABMiller / Bavaria** | Cesar Alejandro Castañeda Castillo | Coordinador de Ventas Regional Costa - Occidente | Operaciones, ventas, proyectos (Descartado: Spam masivo de grupos WP) | 🛑 Descartado / Spam de Red | 16 Sep 2026 - Ofreció grupo de WP masivo de 120 empresas y 26k miembros | No responder o declinar educadamente sin entregar datos |
| **NODERE Pessoas & Negócios** | Édipo Lima | Consultor Comercial e Novos Negócios | Sinergias tecnología, industria y negocios en Serra Gaúcha, café virtual | 🔥 Caliente / Apertura Directa | 16 Sep 2026 - Respondió proponiendo sinergias y café virtual | Responder confirmando disposición para el café virtual y dejando la puerta abierta |
| **Bertolini Móveis** | Aline Maria Nunes | Marketing B2B & Eventos | Diferencial audiovisual en ferias, pantallas interactivas, posventa y manuales 3D | 🔥 Solicitud de Presentación / Muy Caliente | 30 Sep 2026 - Aceptó InMail y solicitó presentación a su e-mail (`aline.nunes@bertolini.com.br`) | Enviar presentación ejecutiva en PDF al e-mail corporativo y confirmar por LinkedIn/WhatsApp |
| **Maderkit** | Don Juan José | Presidencia / Junta Directiva | Paquete Full de Diseño y Entrega Técnica (Diseño de producto + Planos/CNC para máquinas + Manuales de Armado 3D interactivos). Outsourcing de alta eficiencia sin fricción interna | 🔥 ¡Reunión Agendada! / Viernes 16 Oct 19:00 COL (17 Oct 09:00 Japón) | 10 Oct 2026 - Don Juan José propuso cita desde su crucero en Japón para Octubre 16 a las 7:00 pm Colombia (Octubre 17 9:00 am Japón). Enfoque 100% en producto terminado y paquete completo de fabricación | Enviar enlace de Google Meet para Viernes 16 Octubre 7:00 pm COL |
| **Olivar Móveis** | Helder Lanzoni | Olivar Móveis | Manuales 3D interactivos, reducción de garantías y asistencia técnica en RTA | 🟡 Prospecto Activo / Tibio | 08 Oct 2026 - Registrado en Baserow (Lead ID 362, Empresa ID 82) | Enviar invitación personalizada en LinkedIn con foco en RTA |
| **Bortolini Group** | Lucas Bortolini & Sidinei Luis Sbeghen | Diretor Industrial / Gerente P&D (Estúdio ID) | Cuello de botella en ingeniería y programación de máquinas CNC. Vacantes activas en Garibaldi | 🔥 Prospección Estratégica / Muy Caliente | 14 Oct 2026 - Detección de vacante urgente de Analista de Engenharia y Programador CNC en LinkedIn. Mapeo de Lucas (Dir. Industrial) y Sidinei (Gerente P&D) | Disparar WhatsApp al (54) 99939 5582 y conectar con Lucas Bortolini y Sidinei Sbeghen en LinkedIn |
| **CE3D (Deep Tech / Óptica 3D)** | Ivan Ivaldo Gonzalez Ayala | Founder & Principal Inventor | Arquitectura de software, procesamiento geométrico 6DoF y optimización para manufactura/robótica | 🔥 Inbound Caliente / Alianza & Codesarrollo | 15 Oct 2026 - Ivan contactó directamente a Mario tras auditar su perfil. Busca escalar su tecnología patentada a nivel de software industrial | Agendar videollamada de intercambio técnico y sinergia |


---

## 📝 BITÁCORA HISTÓRICA PROFUNDA DE RELACIONES B2B

*(Esta sección contiene el registro inalterable y detallado de cada relación. Prohibido resumir o podar información).*

### 🟢 1. Politorno Móveis (Bento Gonçalves, RS)
- **Contacto:** Marcelo Novo (Diretor / Líder P&D).
- **Padrino B2B:** Luiz Atilio Barse (Mobille / socio de AKEO en Carlos Barbosa). Recomendación expresa: *"Dile que el Sr. Pedro de AKEO fue quien le indicó"*.
- **Historial Completo:**
  * *11 Julio 2026:* Contacto inicial y envío de enlace demo 3D (`mariomojica.com/demo`). Marcelo revisó y agradeció con interés.
  * *05 Agosto 2026:* Primera reunión virtual donde se explicó el alcance de los manuales 3D interactivos y la tecnología de manufactura.
  * *12 Agosto 2026:* Mario envió la Calculadora de Costos con propuesta de ahorro del 30% en P&D y valores por mueble. Marcelo confirmó que la revisaría con su equipo técnico.
  * *18 Agosto 2026:* Mario saludó por la feria Movelsul 2026 y ofreció retomar la charla la semana siguiente para mostrar avances del software paramétrico. Marcelo respondió en 7 min: *"Olá Mário... tudo ótimo e contigo? Acertou. Esta semana está bem corrida. Na próxima tentamos retomar este tema. Combinado Mario, na volta da Movelsul agendamos a reunião com a equipe. Perfeito! Abraço!"*.
  * *24 Agosto 2026 (08:38):* Mario envió mensaje de seguimiento post-Movelsul por WhatsApp solicitando 25-30 min para: 1) Revisar la propuesta económica de manuales 3D y arrancar el desarrollo con productos piloto, y 2) Presentar en primicia el software paramétrico 3DBimFab (`3bf.mariomojica.com`).
  * *24 Agosto 2026 (08:42):* Marcelo respondió inmediatamente en 4 minutos: *"Bom dia Mário. Tudo certo. Nesta semana não vou conseguir. Estou de férias e retorno só na próxima semana. Falamos na outra semana. Abraço!"*.
  * *24 Agosto 2026 (08:44):* Mario respondió deseándole merecidas vacaciones y acordando escribirle el lunes 31 de agosto para coordinar la llamada a su regreso.
  * *31 Agosto 2026 (08:53 BRT):* Mario envió mensaje de seguimiento enfocado en la metodología de levantamiento de costos de P&D (vía planilla de costos Politorno) y demo de 3dBimFab, proponiendo miércoles o jueves.
  * *31 Agosto 2026 (10:09 BRT):* **¡REUNIÓN AGENDADA!** Marcelo respondió en WhatsApp: *"Bom dia Mário... Tudo certo por aqui sim. Podemos fazer na quinta 11h 👍"*. Reunión confirmada para el **Jueves 3 de Septiembre a las 11:00 BRT (09:00 COL)**.
  * *07 Septiembre 2026 (09:55 BRT):* **Entrega del Estudio Visual Interactivo & Solicitud de Aval de Publicación:** Mario envió a Marcelo Novo el enlace privado (`https://mariomojica.com/estudio-corporativo-politorno.html`) con el estudio comparativo de las 10 escenas de la Mesa Tijuca (fotorrealismo IA vs catálogo original), descarga del paquete HD (.ZIP de 2048x2048) para libre uso de Politorno y estudio completo en PDF en portugués. Se le solicitó respetuosamente autorización para exhibir el caso de estudio con el logotipo oficial de Politorno en la página web pública `mariomojica.com`.
  * *07 Septiembre 2026 (10:18 BRT):* **Respuesta Inmediata de Marcelo (23 min):** *"Bom dia Mario. Hoje é feriado nacional por aqui. Estou voltando de viagem. Amanhã vejo o conteúdo e te retorno! Forte abraço!"*. (Día de la Independencia de Brasil). Mario responde de forma empática y sin presión, deseándole buen viaje de regreso a Bento y descanso, indicándole que lo mire con calma solo cuando le sea oportuno y que siguen en contacto.
  * *08 Septiembre 2026 (10:18 BRT):* **Seguimiento Ágil y Flexible de Marca:** Mario envía mensaje conciso a Marcelo solicitando aval para mostrar el trabajo de la Mesa Tijuca y mejoras de render en el manual de armado como caso de estudio, ofreciendo flexibilidad total con o sin logotipo.
  * *08 Septiembre 2026 (10:22 BRT):* **¡HITO CRÍTICO - VALIDACIÓN Y PRESENTACIÓN INTERNA!** Marcelo responde de inmediato en WhatsApp: *"Bom dia... Analisei sim. Só não consegui mostrar ainda pro pessoal do Render. Hoje vou apresentar aqui e te retorno 👍"*. Marcelo validó el estudio de la Mesa Tijuca y se convierte en promotor interno convocando hoy al equipo de renderizado y P&D de Politorno para evaluarlo. Mario responde agradeciendo y poniéndose a disposición para dudas técnicas del equipo de render.
  * *21 Septiembre 2026 (07:46 BRT):* **¡REUNIÓN AGENDADA CON EQUIPO DE RENDER!** Marcelo respondió acordando fecha y hora: *"Bom dia Mário... Na quarta eu não consigo. Poderíamos agendar para quinta de tarde? 15:00h?"*. Mario confirmó de inmediato para el **Jueves 24 de Septiembre a las 15:00 BRT (13:00 COL)**.
  * *24 Septiembre 2026 (07:20 COL / 09:20 BRT):* **Envío de Recordatorio & Link de Google Meet:** Mario envió saludo y enlace de Google Meet para la reunión de las 15:00 BRT.
  * *24 Septiembre 2026 (07:34 COL / 09:34 BRT):* **¡HITO HISTÓRICO - REUNIÓN CONFIRMADA DEFINITIVA PARA MAÑANA!** Marcelo respondió acordando la franja matutina: *"Pode ser 10:30h"*.
  * *25 Septiembre 2026 (10:30 - 11:42 BRT):* **¡HITO HISTÓRICO - REUNIÓN DE DEMOSTRACIÓN TÉCNICA (1h 12m)!**
    - **Participantes:** Marcelo Piriz (Dirección P&D Politorno), Ricardo (Ingeniería / Proyectos Politorno) y Mario Mojica.
    - **Puntos Clave y Diagnóstico:**
      1. *Desconexión Total Identificada:* Marcelo confirmó (<em>"Igual aquí"</em>) la fragmentación de herramientas en Politorno: diseño en **Rhino 3D**, ingeniería en **TopSolid**, renders en **3ds Max** (2 a 3 horas por imagen), manual de armado en software separado e instructivo de empaque en otro software aislado.
      2. *Demostración 3dBimFab:* Control paramétrico de variantes (2 a 3 minutos vs 1 día de cotización manual), costeo de insumos y mano de obra en tiempo real, renders IA con Google Nano Banana en segundos respetando 100% el diseño original, y exportación DXF/planos técnicos por coordenadas.
      3. *Manuales 3D:* Pestaña de armado con cinemática fotorrealista, sincronización de colores y locución inteligente en PT-BR, ES y EN.
      4. *Acuerdo de Cierre:* Marcelo indicó que debatirá internamente con Ricardo y el equipo. Para desbloquear y acelerar la decisión, Mario estructuró la propuesta de un piloto de 10 productos para manuales 3D interactivos.
  * *25 Septiembre 2026 (Tarde BRT):* **Entrega de Acta Ejecutiva & Propuesta Piloto 10 Productos:**
    - Mario formalizó y publicó la presentación interactiva en 16:9 (`http://localhost:3003/acta-propuesta-politorno-usd.html`) y documento PDF descargable (`Acta_Propuesta_Piloto_Politorno_Mario_Mojica_USD.pdf`).
    - **Esquema Económico:** 10 manuales medianos al 50% de descuento ($187 USD c/u = **$1.874 USD**), con **100% de bonificación en el desarrollo de software paramétrico 3dBimFab ($10.000 USD ➔ $0 USD)**. Ahorro consolidado en tecnología: **+$11.874 USD**.
  * *28 Septiembre 2026 (11:44 BRT):* **Acuse de Recibo & Rutina de Fábrica:** Marcelo respondió al envío de la propuesta ejecutiva en WhatsApp: *"Boa tarde Mário! Tudo certo e contigo? Estou bem atarefado. Quando der dou uma atenção para este tema!"*. Mario respondió inmediatamente validando el ajetreo habitual de inicio de semana en planta (*"imagino a correria de início de semana aí na fábrica"*), dándole 100% de tranquilidad y libertad para analizarlo con calma junto a Ricardo cuando tengan un respiro, manteniendo la puerta abierta y una relación cálida y profesional.
  * *06 Octubre 2026 (14:25 COL / 16:25 BRT):* **Envío de Video Didáctico en Portugués y Link de Cómoda Ravenna (`https://mariomojica.com/Comoda_Ravenna`):**
    - Mario envió a Marcelo el nuevo video explicativo hablando en portugués donde reflexiona sobre el criterio de armado real (diferencia entre animaciones lineales tipo videojuego vs manual interactivo paso a paso guiado).
    - Compartió también el enlace del manual interactivo de la Cómoda Ravenna aclarando con humildad y transparencia que son sus primeros pasos en portugués y que el manual aún está en proceso de calibración cosmética con el área de Marketing de Henn.
- **Objetivo Estratégico:** Mantener vivo el vínculo con Politorno mediante contenido de alto valor y autenticidad sin presionar la propuesta comercial de los 10 productos piloto.

---

### 🟢 2. Móveis Henn (Mondaí, SC)
- **Contactos Clave:**
  * **Marcos Unnass** (Coordenador de Engenharia e P&D - Tomador de decisión): WhatsApp `+55 49 8807-4325`, Email `engenharia1@henn.com.br`.
  * **Jonas Borck** (Analista de Engenharia de Produtos - Padrino B2B y Promotor interno): WhatsApp Personal `+55 49 9982-75012`, LinkedIn Activo.
  * **Cintia** (Diseñadora P&D - Modelado en SketchUp y manuales).
  * **Rudgeri Henkel** (Gerente de Planejamento e Materiais - WhatsApp `+55 49 9883-16920`).
- **Historial Completo:**
  * *03 Agosto 2026:* Rudgeri Henkel entregó su WhatsApp por LinkedIn para recibir la demo.
  * *19 Agosto 2026:* Contacto con Jonas Borck. Jonas aclaró que él no diseña manuales, pero tras conocer la trayectoria de Mario (15 años en Maderkit) y recibir la calculadora con 30% de ahorro para la *Cômoda Ravenna D737*, se convirtió en promotor interno y entregó el contacto directo de su jefe Marcos.
  * *20 Agosto 2026:* Mario contactó a Marcos por WhatsApp referenciado por Jonas. Marcos aceptó de inmediato agendar videollamada para el **Miércoles 26 de Agosto a las 10:00 BRT (8:00 COL)**. Jonas confirmó que ambos estarán en la sala de juntas proyectando la pantalla de Marcos en la TV. Jonas recomendó que Mario hable pausado en español y dé un pincelazo de 3dBimFab.
  * *26 Agosto 2026 (09:25 BRT):* Envío de mensaje recordatorio 30 minutos antes de la reunión a Jonas Borck confirmando que todo está preparado del lado de Mario para la sesión de las 10:00 BRT (8:00 COL) con Marcos y él en la sala de juntas.
  * *26 Agosto 2026 (10:00 - 11:37 BRT):* **HITO HISTÓRICO - Reunión de Presentación Técnica (1h 37min):**
    - **Asistentes:** Mario Mojica, Marcos Unnass y Jonas Borck.
    - **Puntos Tratados:**
      1. *Contexto & Dolor:* Desconexión de flujos actuales (SketchUp, Illustrator, InDesign aislados) frente a la suite integrada de Mario.
      2. *Manual 3D Interactivo:* Demostración de navegación 3D, asistencia por voz, multilenguaje (PT/EN/ES), realidad aumentada, reducción de garantías/SAC en 45-60% y telemetría de usuario final.
      3. *3dBimFab (Motor Paramétrico):* Presentación de RhinoCompute en la nube, interoperabilidad DWG/DXF a algorítmico, orientación automática de vetas, costeo y despiece en tiempo real, render IA de catálogo y asistente de empaque.
      4. *Integración ERP:* Marcos consultó viabilidad técnica con el ERP TOTVS Datasul de Henn. Mario ratificó que la integración vía APIs es directa, flexible y gradual.
      5. *Propuesta Piloto:* Mario propuso vincularse 3 meses como diseñador / partner tecnológico junto a Jonas para lograr victorias tempranas con productos reales de Henn.
    - **Acuerdos & Próximos Pasos Inmediatos:**
      1. Mario enviará el enlace de la demo 3D para que el equipo de Henn lo pruebe en dispositivos móviles.
      2. **Llamada de Levantamiento de Costos:** Agendada para el **Jueves 27 de agosto a las 9:00 AM (BRT)** entre Mario y Marcos para relevar tiempos, herramientas y costos actuales del proceso y proyectar el ahorro garantizado de al menos 30%.
      3. Marcos estructurará la presentación de costos y viabilidad para los directivos de Henn con la propuesta del proyecto piloto de 3 meses.
  * *26 Agosto 2026 (10:18 BRT):* **Respaldo Directo de Jonas Borck:** Mario envió un mensaje cálido de agradecimiento personal de colega a colega a Jonas. Jonas respondió: *"Boa tarde Mario! Tudo bem sim, e ai, como estas? Legal, foi uma apresentação bem interessante, deu para entender a grandeza do seu software. Sigo a disposição aqui, ou pode me chamar no WhatsApp 5549998275012, para qualquer dúvida. Em horário comercial dificilmente eu acesso meu celular, mas quando da eu te respondo. Valeuu! Abraço"*. Con esto, Jonas habilitó su WhatsApp personal `+55 49 9982-75012` y consolidó su rol de Padrino B2B interno.
  * *26 Agosto 2026 (11:20 BRT):* **Envío de Memoria Técnica Oficial a Marcos Unnass:** Se remitió por WhatsApp a Marcos el informe oficial en Portugués (`Integracao_TOTVS_Datasul_Moveis_Henn_PT.pdf` de 4 páginas) con la minuta proactiva, la diferenciación de los dos pilotos (Piloto 1 SketchUp vs Piloto 2 3dBimFab), y recomendándole revisar la **Página 4 (Tabla de Costos y Tiempos de P&D)** como base de trabajo para la llamada de costos.
  * *28 Agosto 2026 (08:00 - 08:53 BRT):* **HITO HISTÓRICO - Reunión de Levantamiento de Costos Reales de P&D (53 min):**
    - **Participantes:** Mario Mojica y Marcos Unnass (Coordenador P&D Henn).
    - **Validación del Libro Financiero Maestro (`Cotizador_Costos_Moveis_Henn_Mario_Mojica.xlsx`):**
      1. *Volumen Real de Henn:* **80 manuales únicos/año** (sobre 150-200 lanzamientos anuales con colores; 330 productos/mes en planta).
      2. *Costos Internos Actuales:* 2 proyectistas CLT (R$ 6.000/mes c/u con cargas = R$ 144.000/año) + Licencias SketchUp (R$ 2.400/año) + Adobe CC (R$ 3.600/año) + 10h/mes soporte/retrabajo = **R$ 154.090,91 BRL/año** (**R$ 1.926,14 BRL / manual**).
      3. *Propuesta Mario (30% Ahorro Garantizado):* **R$ 1.348,30 BRL / manual** (R$ 107.863,64 BRL/año) = **Ahorro Neto de +R$ 46.227,27 BRL/año** para la directiva de Henn.
      4. *Calibración por Complejidad:* Pequeños hasta 10 piezas (R$ 876,39 BRL / $170,50 USD), Medianos 11-24 piezas (~20 piezas promedio Henn: R$ 1.348,30 BRL / $262,31 USD), Grandes 25-40 piezas (R$ 1.820,20 BRL / $354,12 USD).
    - **Descubrimiento del Gran Dolor Técnico ("La Brecha de Datos de Promob"):**
      - Promob se satura y se ralentiza si insertan herrajes pequeños; por eso en fábrica omiten hasta un 15% de herrajes (cantoneras, esquineras, puntillas de espaldar).
      - Como Promob no tiene esos herrajes, el conteo en InDesign se hace a mano, provocando constantes errores en la BOM y quejas de clientes por piezas faltantes.
      - Mario demostró que con `3dBimFab` el conteo es paramétrico 100% automático por instancias y no pesa en el navegador, eliminando el error humano.
  * *31 Agosto 2026 (12:42 BRT):* Mario envió el acta de la reunión 02 en PDF por WhatsApp y correo.
  * *31 Agosto 2026 (13:58 - 14:00 BRT):* **¡ARCHIVOS RECIBIDOS DE CÓMODA RAVENA!** Marcos envió por WhatsApp los 3 archivos fuente completos:
    1. `D737_Comoda_Ravena_6Gavetas.DWG` (5 MB - Modelo 3D Promob para test de manuales en video y presentación interna).
    2. `D737-Comoda_Ravenna_6Gav (lista de ferragens).xlsx` (10 kB - Lista de herrajes completa).
    3. `D737- Comoda Ravenna 6Pts.indd` (21 MB - Manual técnico en InDesign).
  * *15-16 Septiembre 2026:* Mario escribió a Marcos proponiendo miércoles (16) o jueves (17). Marcos respondió por WhatsApp que sus vacaciones se aplazaron y regresaba el 21: *"Peguei férias mais tarde e estou essa semana fora da empresa. Volto dia 21 aos trabalhos. Podemos marcar na outra semana."* Mario respondió acordando escribirle el lunes 21 de septiembre.
  * *21 Septiembre 2026 (07:35 BRT):* Mario envió saludo de bienvenida post-vacaciones proponiendo franjas para miércoles 23/09 o jueves 24/09 (mañana o tarde BRT).
  * *22 Septiembre 2026 (09:56 BRT):* **¡HITO CRÍTICO DE ESCALAMIENTO - AUDIO DE MARCOS UNNASS!** Marcos envió mensaje de audio de WhatsApp (18s):
    > *"Ô Mário, tudo certo? Desculpa não ter respondido antes aí. É, de tarde eu vou te falar qual o horário certo porque eu quero envolver o pessoal do sistema ali e ele não me passou a agenda dele ainda. Se pode ser na, na quarta de manhã ou na quinta, ou de manhã ou de tarde."*
    **Impacto:** Marcos confirma que va a convocar directamente al **equipo de Sistemas / TI de Henn** para evaluar la integración de `3dBimFab` y el manual 3D con su infraestructura.
  * *22 Septiembre 2026 (10:16 BRT):* Mario respondió celebrando la inclusión del equipo de Sistemas y confirmando flexibilidad para jueves, viernes o próxima semana.
  * *22 Septiembre 2026 (11:23 BRT):* **¡HITO HISTÓRICO - REUNIÓN AGENDADA Y CONFIRMADA!** Marcos confirmó la fecha y franja exacta por WhatsApp:
    > *"Tudo certo aqui tbm. Pode marcar para quinta feira de manhã das 10:30 as 11:30"*
    **Reunión Agendada:** **Jueves 24 de Septiembre de 2026, de 10:30 a 11:30 BRT (08:30 a 09:30 COL)**.
    **Participantes:** Mario Mojica, Marcos Unnass (Coordenador P&D), Jonas Borck (Engenharia de Produtos) y el **Equipo de Sistemas / TI de Móveis Henn**.
  * *24 Septiembre 2026 (07:10 COL / 09:10 BRT):* **Propuesta de Reprogramación Específica:** Tras el aviso de Marcos sobre su reunión de productos, Mario propuso dos franjas: Viernes 25/09 tarde o Martes 29/09 mañana.
  * *24 Septiembre 2026 (07:20 COL / 09:20 BRT):* **¡HITO HISTÓRICO - REUNIÓN REAGENDADA Y CONFIRMADA DEFINITIVA!** Marcos respondió confirmando de inmediato la opción: *"vamos marcar pra semana que vem de manhã dia 29 - 9:30 as 10:30"*.
    **Nueva Reunión Agendada:** **Martes 29 de Septiembre de 2026, de 09:30 a 10:30 BRT (07:30 a 08:30 COL)**.
    **Participantes:** Mario Mojica, Marcos Unnass (Coordenador P&D), Jonas Borck (Engenharia de Produtos) y el **Equipo de Sistemas / TI de Móveis Henn**.
  * *29 Septiembre 2026 (Tarde BRT):* Envío de la Propuesta Comercial en PDF (`Proposta_Comercial_Moveis_Henn_Mario_Mojica_PT_USD_Clean.pdf`) y Acta de Reunión 03 (`Ata_Reuniao_03_Moveis_Henn_Mario_Mojica_PT.pdf`). Marcos respondió: *"Sim, com calma dou uma olhada e se precisar tbm te chamo"*.
  * *06 Octubre 2026 (13:22 BRT):* **¡HITO DE VALIDACIÓN INTERNA - AUDIO DE MARCOS UNNASS (30s)!**
    - Marcos envió mensaje de audio de WhatsApp revisando el manual interactivo de la Cómoda Ravenna (`https://mariomojica.com/Comoda_Ravenna`):
      > *"Ô Mário, boa tarde, tudo certo 100%. Eu tô conferindo internamente aqui, pedi para passar [para a equipe] do manual. Tu me dá uma olhada, vê se tem algo que dá para enxergar que possa ser diferente, ou que não esteja conclusivo, ou algo nesse sentido. E nessa semana eu vou ainda tentar reunir com o pessoal do marketing, eu vou mandar algumas informações para eles também de acordo como tá, para deixar eles a par da situação de como a gente tem a ideia, e aí nós marcar essa agenda aí, tá bom?"*
    - **Diagnóstico y Avance Clave:**
      1. Marcos está revisando el flujo internamente y ya puso a su equipo técnico de manuales a testear la demo interactiva.
      2. Le pide a Mario revisar si hay detalles a ajustar o pulir.
      3. Confirmó que **esta misma semana se reunirá con el equipo de Marketing de Henn** y les presentará la propuesta e idea del manual 3D para alinear a todos y **agendar la reunión conjunta**.
- **Objetivo Estratégico:** Demostración en vivo de la *Cômoda Ravenna D737* en `3dBimFab`, integración con TOTVS Datasul, y reunión con P&D + Marketing para cierre del paquete piloto de manuales interactivos 3D.

---

### 🟢 3. Grupo K1 / Kappesberg (Tupandi, RS)
- **Contacto:** Julio Santos (Especialista em IA & Automação / Marketing).
- **Historial Completo:**
  * *17 Agosto 2026:* Julio contactó a Mario manifestando que la plataforma hace total sentido con su operación y que la presentará formalmente a su gerente. Preguntó por valores e insumos requeridos.
  * *18 Agosto 2026:* Mario envió la propuesta técnica: insumos mínimos (solo PDF para muebles de hasta 24 piezas), formato de manual de 1 página con QR, calculadora de ahorro del 30% y modelo de suscripción de US$ 1.00/mes por mueble activo.
- **Objetivo Estratégico:** Esperar feedback de la reunión interna de Julio con la gerencia general para agendar demo corporativa.

---

### 🟢 4. Mobille / AKEO Partner (Carlos Barbosa, RS)
- **Contacto:** Luiz Atilio Barse (Diretor / Super-Conector). WhatsApp `+55 54 9909-1202`.
- **Historial Completo:**
  * Aliado y mentor de Mario en el sur de Brasil. Amigo de confianza por más de una década.
  * Facilitó el contacto directo con Marcelo Novo (Politorno) con el respaldo del Sr. Pedro de AKEO.
  * Manifestó que si la vinculación con Politorno es exitosa, abrirá las puertas con otras grandes fábricas de Bento Gonçalves y Rio Grande do Sul.
- **Estrategia Activa:** Mantenerlo informado de cada avance para honrar su respaldo.

---

### 🟢 5. Madesa Móveis (Bom Princípio, RS)
- **Contacto:** Douglas Guth (Líder DHO & Formação / P&D).
- **Historial Completo:**
  * Douglas evaluó la demo 3D y la catalogó como *"genial y con gran potencial"*, compartiéndola con el departamento técnico de manuales de montaje.
  * Mario preparó la propuesta con ahorro del 30% (R$ 4.390/mes vs R$ 6.272/mes tradicional = ahorro de ~R$ 22.580/año) + oferta de prototipo 3D gratuito sobre 1 mueble real del catálogo.
- **Estrategia Activa:** Seguimiento para conectar con el jefe de ingeniería de montaje.

---

### 🟢 6. Multimóveis (Bento Gonçalves, RS)
- **Contacto:** Leandra Piccin (Export Manager).
- **Historial Completo:**
  * Leandra confirmó haber reenviado la demo interactiva al área técnica.
  * Enfoque comercial adaptado: Cero barreras idiomáticas para exportación global a más de 40 países + ahorro del 30% en P&D + piloto 3D gratuito.
- **Estrategia Activa:** Seguimiento con propuesta de piloto real para catálogo de exportación.

---

### 🟢 7. Inval S.A. & Del Alba (Palmira / Cali, Colombia)
- **Contactos:**
  * **Andrés Felipe Moncaleano Campo** (Gerente Supply Chain Del Alba / ex-Maderkit). Padrino comercial.
  * **Juan Carlos Londoño** (Presidente & CEO de Inval S.A.). WhatsApp directo facilitado por Andrés.
- **Estrategia Activa:** Iniciar contacto por WhatsApp con Juan Carlos Londoño con el saludo y aval de Andrés Moncaleano para manuales 3D en muebles RTA y optimización de ensamble.

---

### 🟢 8. Madecentro (Medellín / Nacional, Colombia)
- **Contacto:** Dimas Tobón (Gerente General & Fundador). Correo corporativo directo: `Dimas.tobon@madecentro.com`.
- **Historial Completo:**
  * *18 Agosto 2026:* Contacto inicial en Sales Navigator / LinkedIn y envío de presentación ejecutiva.
  * *09 Octubre 2026:* Mario le envió propuesta estratégica enfocada en la oportunidad de mercado en Buga y centro del Valle para mobiliario terminado y modulares a medida sobre la capacidad instalada de Madecentro.
  * *10 Octubre 2026 (09:31 COL):* **¡HITO CRÍTICO DE ESCALAMIENTO EJECUTIVO!** Dimas respondió directamente en LinkedIn: *"Hola. Envíame este mensaje a mi e mail: Dimas.tobon@madecentro.com"*.
- **Estrategia Activa:** Enviar correo ejecutivo a `Dimas.tobon@madecentro.com` con la propuesta de negocio estructurada, CV adjunto y portafolio digital, y responder en LinkedIn confirmando el envío para coordinar llamada de 15 minutos.

---

### 🟢 9. CI RTA Design S.A.S (Yumbo / Medellín, Colombia)
- **Contactos:**
  * **Juan Carlos Pérez Londoño:** Gerente Administrativo y Financiero.
  * **Paola Reyes:** Directora de Personal y Compensación (Planta Yumbo). Contacto directo por WhatsApp.
  * **Viviana:** Área de Gestión Humana / Selección (Planta Yumbo).
- **Conector / Referido:** Andrés Felipe Moncaleano Campo (ex-Maderkit) en común.
- **Historial Completo:**
  * *13 Agosto 2026:* Contacto inicial con Juan Carlos por LinkedIn. Solicitó el envío de la hoja de vida al correo `juan.perez@rta.com.co`.
  * *28 Agosto 2026:* Paola Reyes contactó a Mario por WhatsApp para coordinar entrevista presencial en la planta de Yumbo (Carrera 15 # 17-28 La Nueva Estancia).
  * *04 Septiembre 2026:* Entrevista presencial en la planta de Yumbo con Paola Reyes y Viviana. Mario compartió su trayectoria de 15 años en diseño industrial y manufactura de muebles RTA, y les presentó el motor paramétrico `3dBimFab`. Paola y Viviana indicaron que la reunión se dio por solicitud de Juan Carlos, pero que no tenían vacante tradicional abierta este año, y elaborarían un informe interno para él.
  * *10 Septiembre 2026:* Envío de mensaje directo a Juan Carlos Pérez vía LinkedIn junto con el video de demostración de `3dBimFab`, agradeciendo la atención en Yumbo y proponiendo un Proyecto Piloto de Diseño Asistido por Agente de IA para una categoría o ambiente específico.
  * *16 Septiembre 2026 (10:14 - 10:18 COL):* Mario escribió por WhatsApp a Paola Reyes agradeciendo la visita a Yumbo y consultando por la retroalimentación de Juan Carlos. Paola respondió casi de inmediato (4 min): *"Buenos días Mario cómo estás no tenemos pendiente la retroalimentación de la entrevista con el"*. Se confirma que el informe fue remitido pero la sesión de retroalimentación interna de GH con Juan Carlos Pérez Londoño aún está pendiente de realizarse en RTA Design. Mario responde agradeciendo y quedando atento sin presionar.
- **Objetivo Estratégico:** Esperar a que Paola y Viviana tengan la sesión interna con Juan Carlos Pérez para conocer sus comentarios y evaluar la viabilidad del Proyecto Piloto o consultoría.

---

### 🟢 10. Muebles Jamar Colombia (Barranquilla / CILA)
- **Contactos:**
  * **Benny Naimark:** Liderazgo directivo / Alta Dirección de Muebles Jamar. Contacto de 1er grado en LinkedIn.
  * **Omar DeLaHoz Rocha:** VP de Logística e Industria de Muebles Jamar Colombia. Cuenta con 19 años de experiencia previa como Gerente de Informática y TI en Carulla (perfil con mentalidad de datos, sistemas, logística y optimización de procesos). Lidera a toda la red de fábricas y artesanos del clúster **CILA** (Centro de Innovación y Logística del Atlántico), responsables de fabricar el 95% del mobiliario comercializado por Jamar.
  * **Juan Carlos Goez Zapata:** Área de Ingeniería / Operaciones de Planta Jamar CILA (participó activamente en la sesión técnica demostrativa).
- **Historial Completo:**
  * *16 Septiembre 2026:* Benny publicó sobre sus visitas a ferias internacionales y fábricas para aprender y optimizar la operación y exhibición en Jamar. Mario interactúa mediante social selling (Top-of-Mind / comentario de alto nivel sobre traducción industrial de tendencias globales).
  * *Enero 2026 (Preparación y Contacto Inicial):* Mario identificó el perfil tecnológico de Omar y su liderazgo sobre el CILA. Tras estructurar un pitch que conectaba el pasado comercial de Mario (diseño de muebles icónicos para Jamar desde Maderkit) con la tecnología digital (Grasshopper, automatización CNC y corte limpio), Omar aceptó inmediatamente coordinar una reunión de 1 hora.
  * *24 Enero 2026 (Reunión Demostrativa de 48 minutos con Omar y Juan Carlos Goez Zapata):*
    - **Demostración de Mario:** Presentó en Rhino 8 + Grasshopper el prototipo paramétrico de "Cajonera Modular" con control de cotas en vivo, anidado automático en lámina de 122x244 cm, porcentaje de desperdicio y cálculo financiero instantáneo ($78.000 COP de costo, 35% de margen, $159.900 PVP). También exhibió el visor 3D interactivo de armado.
    - **Revelación del Gran Dolor de Jamar / CILA:** Juan Carlos y Omar detallaron el proyecto neurálgico del CILA: un proveedor central en la cámara de secado y mecanizado procesará los tableros para vender los **kits de piezas mecanizadas a los talleres**, quienes únicamente se encargarán del ensamble. El gran dolor de cabeza es que los diseños actuales **no tienen costo objetivo (Design to Cost)** y presentan un altísimo desperdicio de madera por falta de ingeniería algorítmica. Omar enfatizó: *"estamos bregando para que se automaticen, y ahí es donde tú tendrías que asesorarnos y ver cuál es el beneficio"*.
  * *Mayo/Junio 2026 (Presentación de Manuales de Armado 3D):* Mario le presentó la propuesta de manuales de armado interactivos 3D. Omar no mostró interés comercial en este servicio, confirmando que la prioridad de Jamar no es la posventa al usuario final, sino la ingeniería de fábrica, el control de costos y la optimización de despieces del CILA.
  * *02-03 Octubre 2026 (Envío de Video de Automatización y Acuerdos de Reunión):* Mario le compartió por WhatsApp el video demostrativo de diseño industrial y automatización de diseño (3dBimFab). Omar lo revisó con alto interés y le pidió una semana de plazo para liberar espacio en su agenda y coordinar la cita de 15 minutos, mencionando incluso que coordinaría con alguna de las empresas satélite del CILA para la reunión.
  * *09 Octubre 2026 (Propuesta de Horarios para Cita de 15 min):* Mario le envía propuesta concreta de horarios (Opciones A, B y C para la semana entrante) enfocada en demostrar la modificación de diseños en tiempo real y retroalimentación instantánea de costos para unificar a las fábricas del CILA. *(Nota de control: Omar mantiene configurados mensajes efímeros que se autodestruyen a las 24 horas en su chat).*
- **Objetivo Estratégico:** Demostrar a Omar DeLaHoz y a los fabricantes aliados del CILA cómo `3dBimFab` permite el control de costos en vivo (Design to Cost) y despieces automatizados para la producción masiva de kits.

---

### 🟢 11. NODERE Pessoas & Negócios (Caxias do Sul, RS)
- **Contacto:** Édipo Lima (Consultor Comercial e Novos Negócios | Vendas Consultivas B2B | Executive Search). Perfil: `linkedin.com/in/edipolima/`.
- **Conexión:** Solicitud / conexión en LinkedIn. Más de 15 contactos en común (Alex Jonas, Daniel, etc.).
- **Historial:**
  * *15 Septiembre 2026:* Contacto inicial generado para LinkedIn. Mensaje de bienvenida (~600 caracteres) destacando el vínculo con Caxias do Sul, la trayectoria en mobiliario RTA, el propósito de transformación digital con `3dBimFab` y apertura para colaborar con NODERE en iniciativas y proyectos del polo mueblero de la Serra Gaúcha.
  * *16 Septiembre 2026:* Édipo respondió con gran apertura y afinidad: *"Obrigado pela mensagem e pela conexão. Muito interessante conhecer um pouco mais sobre o seu trabalho e o 3dBimFab. Acredito bastante nessas conexões entre tecnologia, indústria e desenvolvimento de negócios. Com certeza podemos trocar algumas ideias e entender possíveis pontos de sinergia. Vamos mantendo contato e, em um próximo momento, podemos combinar esse café virtual."* Apertura confirmada para café virtual y sinergias en la Serra Gaúcha.
- **Objetivo Estratégico:** Responder con calidez ejecutiva confirmando disposición para el café virtual, manteniendo el vínculo vivo con NODERE para explorar sinergias y conexiones en el polo de Caxias do Sul.

---

### 🔴 12. Cesar Alejandro Castañeda Castillo (Descartado - Spam de Red)
- **Contacto:** Cesar Alejandro Castañeda Castillo (Figura en LinkedIn como Coordinador de Ventas Regional Costa - Occidente en SABMiller).
- **Canal:** LinkedIn (Contacto de 1er grado).
- **Historial:**
  * *16 Septiembre 2026 (08:49 COL):* Cesar Alejandro inició contacto directo con saludo escueto: *"Buen dia / Cordial saludo"*. Mario respondió a las 08:56 de forma cálida indagando por sus proyectos en C3.
  * *16 Septiembre 2026 (09:19 COL):* Respondió con mensaje masivo prefabricado/automatizado: *"Buen dia, estimado miembro de mi red. Tenemos un grupo de wp con mas de 120 empresas y personas para hacer negocios, re gustaria estar ahi? Y adicional tener acceso a 26.000 miembros mas?"*.
- **Diagnóstico y Estado:** 🛑 **DESCARTADO / SPAM DE RED (Caza-leads / Grupos masivos de WhatsApp).** No existe necesidad B2B, no es un tomador de decisiones industrial y presenta riesgo de spam o captura de datos. Se sugiere no interactuar o declinar amablemente sin entregar teléfonos.

### 🟢 13. Indústria de Móveis Bartira (Grupo Casas Bahia - São Caetano do Sul, SP)
- **Empresa:** Indústria de Móveis Bartira Ltda (Mayor fábrica de muebles de América Latina por volumen, Tier 1 indiscutible de Brasil, ~1.800 - 2.200 colaboradores, facturación R$ 1.2B - 1.5B).
- **Padrino B2B / Puente Interno:** Hermes Rodrigues de Oliveira (Operador de Logística y Planta en Bartira). Actuó como conector interno clave.
- **Tomador de Decisión / Lead Técnico:** Fábio de Jesus Ferreira (Projetista | Desenvolvimento de Produtos - Engenharia). Perfil: `https://www.linkedin.com/in/fabiodejesusferreira/`.
- **Antecedentes:**
  * *17-18 Agosto 2026:* Contacto con Denis Roveri (ex-Gerente de Engenharia), quien informó que ya no estaba en Bartira. Mario conversó con Hermes para solicitar el contacto del líder actual del área técnica.
  * *25 Septiembre 2026 (10:08 COL):* Hermes escribió proactivamente: *"Olá Mario tudo bem? Conseguir achar esse funcionário da Bartira, ele trabalha na engenharia na parte de projetos. Acho que ele pode te dar uma atenção melhor no seus projetos. Desculpe a demora."* Hermes entregó la captura del perfil de LinkedIn de Fábio de Jesus Ferreira.
  * *25 Septiembre 2026 (16:03 BRT):* Mario envió solicitud de conexión con mensaje personalizado sobre el software paramétrico y conexión de diseño a fábrica y manual 3D.
  * *28 Septiembre 2026 (08:14 BRT):* **¡CONEXIÓN ACEPTADA Y APERTURA DE DIÁLOGO!** Fábio respondió en LinkedIn: *"Seja bem vindo"*.
  * *30 Septiembre 2026:* Mario envía mensaje contundente de invitación directa (~540 caracteres): posiciona a Bartira como pionera de los manuales 3D interactivos en Brasil, destaca el alivio a P&D y eliminación de costos de asistencia técnica, y lanza el desafío táctico de analizar los 10 productos más complejos de armado de la fábrica en una reunión breve de 20 minutos.
- **Perfil de Fábio de Jesus Ferreira:**
  * Más de 6 años en control de calidad y desarrollo de producto en Bartira.
  * Formación en Lean Six Sigma, ingeniería de procesos y modernización de líneas de ensamble.
  * Responsable directo de proyectos en planta: dolor latente en reprocesos de planos, despieces rígidos y garantías de ensamble en las colecciones masivas de Casas Bahia.
- **Estado Actual:** 🔥 **LEAD CALIENTE / CONVERSACIÓN ACTIVA.** Lead ID 275 registrado en Baserow y vinculado a la empresa 16 (Indústria de Móveis Bartira Ltda).
- **Próxima Jugada:** Enviar propuesta de horarios en cuanto Fábio confirme disponibilidad para los 20 minutos de demo.

---

### 🟢 14. Bertolini Móveis (Bento Gonçalves, RS)
- **Empresa:** Bertolini S/A (Polo Bento Gonçalves, RS - Rank 12 Tier 1 de Brasil, R$ 250M - 300M, 550 - 700 colaboradores). Gigante en cocinas de acero RTA, mobiliario corporativo, residencial y sistemas de almacenaje industrial.
- **Contacto Clave:** Aline Maria Nunes (Marketing B2B, campañas, contenidos audiovisuales y apoyo a ferias y convenciones).
- **Email Corporativo:** `aline.nunes@bertolini.com.br`
- **Canal de Entrada:** LinkedIn InMail.
- **Historial Completo:**
  * *Septiembre 2026:* Mario envió mensaje personalizado vía InMail destacando el rol de Aline en marketing B2B y ferias, proponiendo los Manuales 3D Interactivos como herramienta audiovisual de alto impacto para pantallas interactivas en estands de ferias y revolución de la posventa (enlace `mariomojica.com/demo`).
  * *30 Septiembre 2026 (06:10 BRT):* **¡HITO CRÍTICO - INMAIL ACEPTADO Y SOLICITUD DE PRESENTACIÓN!** Aline respondió en LinkedIn aceptando el InMail y pidiendo la presentación formal: *"Oii, bom día! Poderia enviar uma apresentação da sua empresa para meu e-mail corporativo? aline.nunes@bertolini.com.br"*.
  * *30 Septiembre 2026:* Mario responde por LinkedIn confirmando el envío inmediato de la presentación ejecutiva en PDF y enlaces 3D al correo corporativo, y facilitando su WhatsApp directo (`+57 311 764 6907`).
- **Estado Actual:** 🔥 **MUY CALIENTE / SOLICITUD FORMAL DE PRESENTACIÓN RECIBIDA.**
- **Próxima Jugada:** Enviar correo corporativo formal a `aline.nunes@bertolini.com.br` con el dossier ejecutivo y enlaces de prueba móvil, avisándole por LinkedIn para consolidar el contacto.

---

### 🟢 15. Bortolini Group (Bortolini Móveis Corporativos - Garibaldi, RS)
- **Empresa:** Bortolini Indústria de Móveis Ltda (Bortolini Group) — RST 453, KM 90, Rota do Sol, Garibaldi, RS. Referencia en mobiliario corporativo, puestos de trabajo, divisiones y almacenamiento para oficinas en la Serra Gaúcha (polo Garibaldi / Bento Gonçalves / Carlos Barbosa).
- **Contactos Clave Mapeados:**
  * **Lucas Bortolini:** Diretor Industrial (`https://www.linkedin.com/in/lucas-bortolini-548a86132/`). Líder de planta, procesos verticalizados y tecnología industrial (Baserow ID 363).
  * **Sidinei Luis Sbeghen:** Gerente de Projetos, Pesquisa e Desenvolvimento / Designer de Produtos e Coordenador do Estúdio ID (`https://www.linkedin.com/in/sidinei-luis-sbeghen-18092162/`). Más de 44 años en Bortolini; comenzó en 1982 como auxiliar de producción, montador y PROGRAMADOR CNC (Baserow ID 364).
  * **Marcos Barella:** Desenhista Projetista Móveis (`https://www.linkedin.com/in/marcos-barella-663502182/`). ¡PUENTE B2B DE ORO! Ex-Coordenador de Engenharia en Politorno Móveis durante más de 10 años (may. 2023 - abr. 2026), relación directa con Marcelo Novo y Ricardo (Baserow ID 367).
  * **Cleber Bassani:** Coordenação de Projetos & Desenvolvimento de Produto (`https://www.linkedin.com/in/cleber-bassani-1a2743b6/`). 25 años de experiencia técnica en el sector de mobiliario corporativo (Baserow ID 368).
  * **Ricardo Donatti:** Executivo Comercial | Expansão & Segmento Premium (`https://www.linkedin.com/in/ricardo-donatti-31069b4a/`) (Baserow ID 365).
  * **Rodrigo Fernandes:** Gerente Comercial Bortolini Group (`https://www.linkedin.com/in/rodrigo-fernandes-19a96238/`). Contacto en común con Leandra Piccin (Multimóveis) (Baserow ID 369).
  * **Bruno Rodolfo:** Gerente Comercial | Gestão & Expansão em São Paulo (`https://www.linkedin.com/in/bruno-rodolfo-b5b70938/`) (Baserow ID 366).
  * **Denise Paz:** Gerente de Contas / Comercial em São Paulo (`https://www.linkedin.com/in/denise-paz-00b21615/`) (Baserow ID 370).
  * **Igor Silveira Dellazzari:** Projetista Autônomo (`https://www.linkedin.com/in/igor-silveira-dellazzari-40a250398/`) (Baserow ID 371).
  * **Caroline Covolo Berté:** Publicidade, Marketing e Eventos (`https://www.linkedin.com/in/caroline-covolo-berté-897451148/`). Responsable de comunicación y estandes en ferias (Movelsul 2026, InfraFM SP) y líneas como Miroo Móveis (Baserow ID 372).
  * **Carlos Mantelli:** Gestor de Engenharia na Bortolini Móveis Corporativos (Baserow ID 373). Contacto personal directo transferido por RRHH con autorización explícita (*"Pode chama-lo, Mario 😉"*).
- **Canal Abierto de Reclutamiento:** WhatsApp `+55 54 99939-5582` (`(54) 99939 5582`) / Tel: `(54) 3433 2500`.
- **Diagnóstico del Dolor y Oportunidad B2B:**
  * *14 Octubre 2026 (12:34 - 12:42):* **¡HITO HISTÓRICO - CONTACTO DIRECTO DEL GESTOR DE ENGENHARIA ENTREGADO!** Mario envió la propuesta técnica por WhatsApp. A las 12:39 RRHH avisó que lo reenviaría a su gestor de ingeniería, y a las **12:42** compartieron la tarjeta de contacto oficial de **Carlos Mantelli** con autorización expresa: *"Pode chama-lo, Mario 😉"*. Conexión caliente 1-a-1 lograda en menos de 8 minutos.
  * *15 Octubre 2026 (19:03 - 19:51):* **¡DENISE PAZ PIDE LA DEMO DEL MANUAL 3D!** Denise respondió con gran cercanía: *"Estou bem também! Desculpe estava na academia... Vou querer ver sim, me mande quando puder."* Además revisó el perfil de Mario en LinkedIn (Sales Insights). Se le envía el enlace directo de la Cómoda Ravenna (`https://mariomojica.com/Comoda_Ravenna`) enfocado en la experiencia mobile y reducción de fricciones en montajes corporativos en SP.
- **Estado Actual:** 🔥 **MUY CALIENTE / DEMO 3D ENVIADA A GERENCIA DE CONTAS SP.**
- **Próxima Jugada:** Dejar que interactúe con el manual 3D en su móvil y hacer seguimiento ligero en 24-48 horas. Paralelamente, disparar WhatsApp a Carlos Mantelli (Gestor de Engenharia).

---

### 🔬 16. CE3D - Three Dimensional Spatial Encoding (Tijuana, México)
- **Empresa / Proyecto:** CE3D (Tecnología de codificación óptica posicional tridimensional, 6DoF y arquitectura óptica pasiva - Solicitud de Patente MX/a/2026/008448 IMPI).
- **Contacto Clave:** Ivan Ivaldo Gonzalez Ayala - Founder & Principal Inventor (`https://www.linkedin.com/in/three-dimensional-spatial-encoding/`).
- **Formación:** Escuela de Mecánica de Aviación Naval, México. Ubicación: Tijuana, Baja California, México.
- **Tecnología Core de la Patente:** Codificación física directa de coordenadas 3D deterministas en el campo de luz antes de tocar el sensor. Con una sola captura 2D estándar proporciona posición 3D/6DoF exacta, eliminando la sobrecarga computacional de reconstrucción posterior, SLAM, triangulación y estimación de pose.
- **Diagnóstico del Dolor y Oportunidad B2B:**
  * *15 Octubre 2026 (20:31):* **INBOUND DIRECTO DE ALTO NIVEL TÉCNICO.** Ivan contactó a Mario en LinkedIn tras revisar su perfil con el mensaje: *"Hola, Mario. Gracias por conectar. Soy inventor y fundador de CE3D, una tecnología mexicana que integra codificación óptica posicional tridimensional, lectura óptico-angular y procesamiento geométrico para navegación espacial 6DoF. Me interesa tu experiencia en software y optimización de procesos de manufactura, especialmente por la siguiente etapa de desarrollo profesional de mi tecnología. Un gusto saludarte."*
  * **Sinergia Técnica Profunda:** Ivan tiene resuelto el principio físico/óptico y la IP, pero para llevarlo al mercado manufacturero e industrial necesita transformar el modelo en software profesional de alto rendimiento (APIs, algoritmos de procesamiento geométrico, integración con control de movimiento CNC/robótica, CAD/CAM y gemelos digitales). Justo la especialidad de Mario (arquitectura de software, computación geométrica, Three.js/Rhino/Grasshopper y automatización industrial).
- **Estado Actual:** 🔥 **MUY CALIENTE / INBOUND DE CODESARROLLO & ALIANZA DEEP TECH.**
- **Próxima Jugada:** Responder validando el enorme valor de eliminar el cuello de botella computacional de pose estimation en 6DoF y proponer una videollamada técnica de 20-30 minutos para explorar cómo estructurar la capa de software para manufactura.

---

## 🔒 POLÍTICA DE RESGUARDO Y REGLA DE ORO

1. **PROHIBIDO BORRAR U OMITIR HISTORIAL:** Cada nueva interacción se añade al final de su respectivo prospecto. Si hay correcciones, se agrega una nota explicativa.
2. **LOCAL-FIRST BRAIN:** La memoria reside en los archivos del repositorio (`RAM_de_ventas.md`, `ventas_ram_storage.json`) y se sincroniza en paralelo con Supabase PostgreSQL.
3. **RESPUESTA EN < 60 SEGUNDOS:** Ante cualquier solicitud de mensaje, Antigravity genera de inmediato los dos bloques de código (Português + Español) sin rodeos.
