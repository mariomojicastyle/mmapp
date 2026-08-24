# 🚀 RAM de Ventas — CRM Inteligente de Prospección B2B & Outreach Copilot

> **Ubicación en Plataforma:** `mario-mojica-plataforma/app/(dashboard)/ventas-ram`  
> **Tipos Core:** `mario-mojica-plataforma/lib/types/ventas-ram.ts`  
> **Acciones Serverless:** `mario-mojica-plataforma/app/actions/ventas-ram.ts`  
> **Persistencia:** Supabase PostgreSQL (`ventas_prospectos`, `ventas_interacciones`) & Local JSON (`data/ventas_ram_storage.json`)  
> **WhatsApp Oficial:** `+57 311 764 6907`  
> **Email Oficial:** `mariomojica.style@gmail.com`  

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
| **Politorno Móveis** | Marcelo Novo | Diretor / Líder P&D | Manuales 3D interactivos, revisión de propuesta económica y suite 3DBimFab | 🔥 Caliente (Vacaciones / Retoma Lun 31 Ago) | 24 Ago 2026 - Marcelo avisó que está de vacaciones esta semana. Receptivo a retomar la próxima | Contactar el lunes 31 de agosto para fijar la reunión |
| **Móveis Henn** | Marcos & Jonas Borck | Coordenador P&D & Analista Engenharia | Manuales interactivos 3D, reducción de garantías en RTA, demo Cômoda Ravenna D737 | 🔥 Cita Confirmada (Mié 26 Ago, 10:00 BRT) | 20 Ago 2026 - Link de Meet compartido. Asistirán juntos en sala de juntas | Enviar recordatorio 9:30 BRT el miércoles y presentar demo + pincelada 3DBimFab |
| **Grupo K1 (Kappesberg)** | Julio Santos | Especialista IA & Automação / Mkt | Costos de P&D de manuales, modelo suscripción ($1 USD/mes), IA aplicada | 🔥 En Evaluación / Cotización Enviada | 17 Ago 2026 - Solicitó valores e insumos. Enviada calculadora 30% ahorro | Esperar feedback de reunión interna con su gerente |
| **Kit's Paraná** | Marcos Benedito & Jamylle Duarte | Directivos P&D / Marketing | Costos de asistencia técnica, manuales en papel, telemetría | 🟡 Referenciado / Email Preparado | 17 Ago 2026 - Andre Luis facilitó sus correos | Enviar correo corporativo formal a Marcos y Jamylle |
| **MADECENTRO** | Dimas Tobón | Gerente General | Manuales interactivos 3D, módulos de cocina/closets, telemetría y software | 🔥 Contacto Directo / Caliente | 18 Ago 2026 - Respondió en LinkedIn | Responder para agendar reunión o demo 3D personalizada |
| **Italínea Móveis** | Maria do Carmo Roos Soares | Gestão & Eventos | Conexión con equipo de P&D / Criação (`pedcriareeitalinea@italinea.com.br`) | 🔥 Puente Activo / Caliente | 18 Ago 2026 - Solicitado WhatsApp de P&D tras Movelsul | Esperar respuesta con WhatsApp directo de P&D/Criação |
| **Grupo Pinho** | Patrick Antonowicz | Analista de Exportação Júnior | Conexión con Cristiane (área técnica de manuales/logística) | 🔥 Puente Activo / Caliente | 18 Ago 2026 - Reenvió propuesta a Cristiane | Solicitar a Patrick el e-mail o WhatsApp directo de Cristiane |
| **Multimóveis** | Leandra Piccin | Export Manager | Manuales 3D para exportación global, cero barrera idiomática, ahorro 30% P&D | 🔥 Caliente / En Evaluación | 18 Ago 2026 - Reenvió info al área técnica | Seguimiento con 30% ahorro + piloto 3D sin costo para exportación |
| **Madesa Móveis** | Douglas Guth | Líder DHO & Formação / P&D | Costos de P&D en manuales, e-commerce, reducción de garantías | 🔥 Caliente / En Evaluación Técnica | 18 Ago 2026 - Reenvió demo al sector técnico. Elogió la propuesta | Enviar comparativa de costos + prototipo 3D gratuito |
| **Del Alba / ex-Maderkit** | Andrés Felipe Moncaleano Campo | Gerente Supply Chain | Reconexión profesional, empaque, compras y manuales 3D | 🔥 Padrino B2B Activo | 18 Ago 2026 - Conectó con Juan Carlos Londoño (CEO Inval) | Mantenerlo informado de los avances con Inval |
| **Inval S.A.** | Juan Carlos Londoño | Presidente & CEO | Manuales interactivos 3D para muebles RTA, reducción de garantías | 🔥 Caliente / Vía Andrés Moncaleano | 18 Ago 2026 - Andrés facilitó su WhatsApp directo | Contactar por WhatsApp con el saludo y aval de Andrés Moncaleano |
| **RTA Design S.A.S** | Juan Carlos Pérez Londoño | Gerente Administrativo y Financiero | Búsqueda de vacantes en diseño y optimización de producto | 🟡 Contactado - Correo Listo | 13 Ago 2026 - Solicitó hoja de vida por correo | Enviar hoja de vida a `juan.perez@rta.com.co` |
| **Ternova** | Julio Sanchez | Ingeniería / Automatización | Manuales para maquinaria, limitaciones de Fusion 360 | 🟡 Puerta Abierta / Seguimiento Suave | 18 Ago 2026 - Mencionó avance en Fusion 360. Dejar relación abierta | Enviar tip de exportación web sin presión en 15 días |
| **Móveis Henn (Planejamento)** | Rudgeri Henkel | Gerente Planejamento e Materiais | Costos de asistencia técnica, errores de ensamble en RTA | 🟡 Mensaje de WhatsApp Listo | 03 Ago 2026 - Dio su WhatsApp directo en LinkedIn | Integrar al hilo de la reunión con Marcos y Jonas |
| **Bartira** | Hermes Rodrigues de Oliveira | Operador Logística / Planta | Conexión interna hacia el líder de Producto / Ingeniería | 🔥 Puente Interno Activo / Caliente | 18 Ago 2026 - Pasó perfil de Denis (ya salió). Pedir líder actual | Agradecer y pedir contacto del actual líder de P&D |
| **Bartira (Ex-Líder)** | Denis Roveri | Ex-Gerente de Engenharia | Relacionamiento en la industria de manufactura | ⏸️ Red Abierta | 17 Ago 2026 - Informó que salió de Bartira | Mantener contacto en su nuevo rol en la industria |
| **Demóbile** | Junio César Françolin | Gerente de Produção | Control de calidad extendido, telemetría de ensamble | ❄️ Enfriando | 05 Ago 2026 - Vio el perfil de Mario en LinkedIn | Enviar mensaje corto sobre control de calidad extendido |

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
- **Objetivo Estratégico:** Contactar a Marcelo el lunes 31 de agosto de 2026 al regreso de sus vacaciones para cerrar la fecha de la videollamada.

---

### 🟢 2. Móveis Henn (Mondaí, SC)
- **Contactos Clave:**
  * **Marcos** (Coordenador de Engenharia e P&D - Tomador de decisión): WhatsApp `+55 49 8807-4325`, Email `engenharia1@henn.com.br`.
  * **Jonas Borck** (Analista de Engenharia de Produtos - Padrino y Promotor interno en LinkedIn).
  * **Rudgeri Henkel** (Gerente de Planejamento e Materiais - WhatsApp `+55 49 9883-16920`).
- **Historial Completo:**
  * *03 Agosto 2026:* Rudgeri Henkel entregó su WhatsApp por LinkedIn para recibir la demo.
  * *19 Agosto 2026:* Contacto con Jonas Borck. Jonas aclaró que él no diseña manuales, pero tras conocer la trayectoria de Mario (15 años en Maderkit) y recibir la calculadora con 30% de ahorro para la *Cômoda Ravenna D737*, se convirtió en promotor interno y entregó el contacto directo de su jefe Marcos.
  * *20 Agosto 2026:* Mario contactó a Marcos por WhatsApp referenciado por Jonas. Marcos aceptó de inmediato agendar videollamada para el **Miércoles 26 de Agosto a las 10:00 BRT (8:00 COL)**. Jonas confirmó que ambos estarán en la sala de juntas proyectando la pantalla de Marcos en la TV. Jonas recomendó que Mario hable pausado en español y dé un pincelazo de 3DBimFab.
- **Objetivo Estratégico:** Demostración en vivo de la Cômoda Ravenna D737 en 3D, presentación de la calculadora de ahorro y oferta de piloto 3D gratuito para 1 producto.

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

### 🟢 8. Madecentro (Medellín, Colombia)
- **Contacto:** Dimas Tobón (Gerente General).
- **Historial Completo:**
  * Dimas respondió al contacto en LinkedIn de Mario.
- **Estrategia Activa:** Agendar demo de 15 minutos enfocada en módulos de cocina, closets y muebles RTA para su red nacional de tiendas y clientes finales.

---

## 🔒 POLÍTICA DE RESGUARDO Y REGLA DE ORO

1. **PROHIBIDO BORRAR U OMITIR HISTORIAL:** Cada nueva interacción se añade al final de su respectivo prospecto. Si hay correcciones, se agrega una nota explicativa.
2. **LOCAL-FIRST BRAIN:** La memoria reside en los archivos del repositorio (`RAM_de_ventas.md`, `ventas_ram_storage.json`) y se sincroniza en paralelo con Supabase PostgreSQL.
3. **RESPUESTA EN < 60 SEGUNDOS:** Ante cualquier solicitud de mensaje, Antigravity genera de inmediato los dos bloques de código (Português + Español) sin rodeos.
