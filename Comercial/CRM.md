# Arquitectura y Diseño del CRM B2B (Baserow)

Este documento detalla el diseño relacional, la estructura de datos y el flujo de automatización del sistema de gestión de clientes (**CRM / Árbol de Clientes**) integrado en el ecosistema de **Mario Mojica Style**.

---

## 🏗️ 1. Infraestructura y Motor CRM

El CRM está soportado sobre **Baserow** (versión autohospedada en Docker dentro del Hetzner VPS bajo el dominio `baserow.mariomojica.com`). 
* **Ventaja:** Soberanía absoluta de datos, sin límites de filas y comunicación directa mediante API REST de baja latencia con **n8n** y la plataforma **Next.js**.

---

## 📐 2. Modelo Relacional de Datos (Árbol de Clientes)

Para evitar la duplicidad de información y permitir la prospección basada en cuentas corporativas (**Account-Based Marketing / ABM**), el CRM está estructurado en tres tablas vinculadas mediante relaciones de clave foránea (Uno-a-Muchos):

```
┌─────────────────────────────────┐
│    TABLA A: EMPRESAS (ID 991)   │  (El Tronco: Datos Corporativos)
└───────────────┬─────────────────┘
                │
                │ (1 a Muchos)
                ▼
┌─────────────────────────────────┐
│   TABLA B: CONTACTOS (ID 994)   │  (Las Ramas: Personas / Leads)
└───────────────┬─────────────────┘
                │
                │ (1 a Muchos)
                ▼
┌─────────────────────────────────┐
│ TABLA C: INTERACCIONES (ID 995) │  (Las Hojas: Historial/Bitácora)
└─────────────────────────────────┘
```

### Tabla A: Empresas (ID: 991)
Almacena la información de las fábricas de muebles objetivo.

| Nombre del Campo | Tipo de Dato Baserow | Descripción / Opciones |
| :--- | :--- | :--- |
| **`Nombre de la Empresa`** | `Text (Primary)` | Nombre oficial (Ej: *Jamar, Maderkit, Politorno*). |
| **`Sitio Web`** | `URL` | Enlace a la página web del fabricante. |
| **`LinkedIn Corporativo`** | `URL` | Perfil de LinkedIn de la empresa. |
| **`Facebook`** | `URL` | Perfil de Facebook de la empresa. |
| **`Instagram`** | `URL` | Perfil de Instagram de la empresa. |
| **`WhatsApp`** | `URL` | Enlace directo a WhatsApp Business (Ej: `https://wa.me/number`). |
| **`Canal Preferido`** | `Single Select` | Canal caliente de comunicación: *LinkedIn, Instagram, Facebook, Sitio Web / Formulario, WhatsApp*. |
| **`Actividad en Redes`** | `Single Select` | Nivel de publicación y engagement de la marca: *Muy Activo, Moderado, Inactivo*. |
| **`Pais`** | `Text` | Ubicación geográfica (Brasil para la semilla Tier 2). |
| **`Nicho / Segmento`** | `Single Select` | *Mobiliario RTA, Oficina, Cocinas, Tapizados, Otro*. |
| **`Dolor Principal`** | `Single Select` | *Devoluciones de herrajes, R&D lento, Falta de WebAR, Ninguno*. |
| **`Estado Comercial`** | `Single Select` | *Prospecto, Contactado, Demo Agendada, Negociación, Cerrado Ganado, Cerrado Perdido*. |
| **`Notas del Target`** | `Long Text` | Comentarios estratégicos y catálogo del cliente. |
| **`Leads`** | `Link Row` | Relación inversa automática con la Tabla B (Contactos). |

### Tabla B: Contactos / Leads (ID: 994)
Almacena los datos de los tomadores de decisión dentro de las empresas.

| Nombre del Campo | Tipo de Dato Baserow | Descripción / Opciones / IDs |
| :--- | :--- | :--- |
| **`Nombre`** | `Text (Primary)` | Nombre del contacto. |
| **`Apellido`** | `Text` | Apellido del contacto. |
| **`Empresa`** | `Text` | Nombre de la empresa en texto plano (Ej: *Möbler Móveis*). Requerido para visualización en grid. |
| **`Empresa Vinculada`** | `Link Row (ID 9545)` | **Relación formal** con la Tabla A (Empresas - ID 991). Vincula la fila de la empresa. |
| **`Pais`** | `Text` | País del contacto (Ej: *Brasil*). Requerido para filtrado rápido en la vista de Leads. |
| **`Rol`** | `Text` | Cargo / Puesto (Ej: *Gerente Geral, Consultora comercial*). |
| **`Email`** | `Email` | Email corporativo directo de la persona (Ej: *nombre.apellido@empresa.ind.br*). |
| **`Telefono`** | `Text` | Número móvil o teléfono de la empresa (Ej: *+55 43 3242-8800*). |
| **`Status`** | `Single Select (ID 9534)` | Estado del flujo: **`Nuevo` (ID 4017)**, `Contactado` (ID 4018), `Agendado` (ID 4019), `Descartado` (ID 4020). |
| **`Estado CRM`** | `Single Select (ID 9537)` | Estado de prospección: **`Prospecto` (ID 4021)**, `Primer Contacto` (ID 4022), `Demo Agendada` (ID 4023), `Negociación` (ID 4024). |
| **`LinkedIn`** | `URL (ID 9552)` | Enlace directo al perfil personal de LinkedIn. |
| **`Facebook`** | `URL (ID 9553)` | Enlace directo o URL de búsqueda estructurada en Facebook. |
| **`Instagram`** | `URL (ID 9554)` | Enlace directo o URL de búsqueda estructurada en Instagram. |
| **`WhatsApp`** | `URL (ID 9555)` | Enlace directo a WhatsApp Business (Ej: `https://wa.me/number`). |
| **`Canal Preferido`** | `Single Select (ID 9556)`| `LinkedIn` (ID 4037), `Instagram` (ID 4038), `WhatsApp` (ID 4040), `Correo` (ID 4041). |
| **`Actividad en Redes`** | `Single Select (ID 9557)`| `Muy Activo` (ID 4043), `Moderado` (ID 4044), `Inactivo` (ID 4045). |
| **`Notas`** | `Text` | Filtro inicial u observaciones (Ej: *FI*). |
| **`Origen`** | `Text` | Origen del prospecto (Ej: *Prospección Activa*). |
| **`Descripcion de la idea`** | `Long Text (ID 9536)`| Mensaje inicial o descripción de su rol estratégico e interés. |

> [!IMPORTANT]
> **Protocolo de Inserción de Leads (Tabla B): Cero Celdas Vacías**
> Para garantizar la integridad de los datos y evitar registros incompletos al prospectar de forma manual o asíncrona, se **PROHÍBE** insertar un lead solo con los datos superficiales (Nombre, Cargo y LinkedIn). Toda inyección de un nuevo lead debe aplicar una rutina de enriquecimiento deductivo obligatorio:
> 1. **Relación y Contexto:** Completar redundantemente `Empresa Vinculada` (Link Row), `Empresa` (Texto plano para Grid) y `Pais`.
> 2. **Deducción de Contacto:** Inferir el `Email` basándose en el patrón del dominio corporativo (ej. *nombre.apellido@dominio.com*) y asignar el `Telefono` y `WhatsApp` matriz de la empresa si no hay uno directo.
> 3. **Generación de Enlaces:** Inyectar automáticamente las URLs de búsqueda parametrizada para `Facebook` y `Instagram` concatenando el Nombre y la Empresa.
> 4. **Estados por Defecto:** Asignar siempre `Status` (Nuevo), `Estado CRM` (Prospecto), `Canal Preferido` (LinkedIn) y `Actividad en Redes` (Inactivo).
> 
> *Usa el script `scratch/insert_lead_factory.js` para estandarizar este proceso.*

### Tabla C: Interacciones (ID: 995)
Bitácora de contactos y respuestas vinculadas a un lead.

| Nombre del Campo | Tipo de Dato Baserow | Descripción / Opciones |
| :--- | :--- | :--- |
| **`Asunto`** | `Text (Primary)` | Asunto del email o resumen del mensaje. |
| **`Lead`** | `Link Row (ID 9543)` | Relación con la Tabla B (Contactos - ID 994). |
| **`Cuerpo`** | `Long Text` | Detalle o contenido completo del mensaje. |
| **`Direccion`** | `Single Select` | *Entrante, Saliente*. |

---

## 🤖 3. Flujo de Automatización e Integración con IA (n8n)

El CRM está diseñado para interactuar con flujos automáticos en **n8n** y capacidades de procesamiento de lenguaje natural de la IA:

```
   [ Registro de Prospecto ] (Vía formulario nativo o API Next.js)
              │
              ▼
   [ Trigger de n8n ] (Detecta nueva fila en Baserow)
              │
              ├─► [ Enriquecimiento IA ] ➔ Scrapea LinkedIn / Web de Empresa
              │                            Detecta el dolor y actualiza Baserow.
              │
              ▼
   [ Generación de Outreach ] ➔ La IA lee perfil de Baserow + dolor principal
                                Redacta correo en frío hiper-personalizado.
```

### Casos de Uso Automatizados:
1. **Captura Rápida (UI de Entrada):** Mario Mojica registra prospectos mediante una vista de Formulario nativa de Baserow en su celular tras visitar una feria de diseño o navegar en la web.
2. **Enriquecimiento en Caliente:** Al registrar un LinkedIn personal, n8n dispara una llamada a APIs de enriquecimiento (o scrapping de perfil) para guardar la trayectoria e intereses del contacto.
3. **Outreach Copilot:** La IA (copiloto) consulta la tabla REST de Baserow, extrae los dolores de la empresa y la biografía del contacto, y genera propuestas comerciales a medida basadas en la metodología *Challenger Sale*.

---

## 🛠️ 4. Estructura de Opciones y Scripts de Mantenimiento

Para facilitar la manipulación del CRM por API REST o workflows de n8n, se detallan los IDs de las opciones estructuradas y la bitácora de scripts de soporte de base de datos.

### IDs de Opciones Select (Tabla A - Empresas 991)

*   **Canal Preferido (Campo ID 9549):**
    *   `LinkedIn` ➔ ID: `4029` (Color: blue)
    *   `Instagram` ➔ ID: `4030` (Color: pink)
    *   `Facebook` ➔ ID: `4031` (Color: light-blue)
    *   `Sitio Web / Formulario` ➔ ID: `4032` (Color: light-gray)
    *   `WhatsApp` ➔ ID: `4036` (Color: green)
*   **Actividad en Redes (Campo ID 9550):**
    *   `Muy Activo` ➔ ID: `4033` (Color: green)
    *   `Moderado` ➔ ID: `4034` (Color: yellow)
    *   `Inactivo` ➔ ID: `4035` (Color: red)

### Bitácora de Scripts de Soporte (Carpeta `scratch/`)

Para realizar actualizaciones controladas del CRM en caliente mediante node, se han programado los siguientes scripts:
*   [add_social_fields.js](file:///c:/Desarrollo/mmapp/scratch/add_social_fields.js) - Creación inicial de los nuevos campos de redes sociales en la tabla 991.
*   [add_whatsapp_field.js](file:///c:/Desarrollo/mmapp/scratch/add_whatsapp_field.js) - Inyección de la opción `WhatsApp` en el select 9549 y creación del campo URL `WhatsApp` (ID 9551).
*   [populate_social_data.js](file:///c:/Desarrollo/mmapp/scratch/populate_social_data.js) - Script seguro para cargar las redes, nivel de actividad y canal preferido mapeado para las 15 empresas del Tier 2, conservando intactos los LinkedIn originales.
*   [update_poliman_whatsapp.js](file:///c:/Desarrollo/mmapp/scratch/update_poliman_whatsapp.js) - Actualización a medida para Poliman Móveis (ID 14), vaciando sus campos de Instagram/Facebook por inactividad y configurando su WhatsApp directo y canal preferido.
*   [reorder_columns_with_whatsapp.js](file:///c:/Desarrollo/mmapp/scratch/reorder_columns_with_whatsapp.js) - PATCH de reordenación visual de campos en la vista Grid (ID 4352) para posicionar todas las columnas de redes consecutivamente después de `LinkedIn Corporativo`.
*   [check_whatsapp_crm.js](file:///c:/Desarrollo/mmapp/scratch/check_whatsapp_crm.js) - Validador rápido de la fila de Poliman Móveis y preservación de URLs del Tier 2.
*   [validate_tier1_linkedin.js](file:///c:/Desarrollo/mmapp/scratch/validate_tier1_linkedin.js) - Script de escaneo y validación de variaciones de URL de LinkedIn en paralelo para el Tier 1.
*   [update_tier1_linkedin.js](file:///c:/Desarrollo/mmapp/scratch/update_tier1_linkedin.js) - Carga de las URLs validadas del Tier 1 en Baserow.

---

## 🛡️ 5. Protocolo de Validación de Enlaces de LinkedIn Corporativos

Para evitar que los enlaces de LinkedIn en Baserow apunten a páginas caídas o redirijan a la página de error general de LinkedIn (`/company/unavailable/`), se debe seguir el siguiente protocolo:

### A. El Dolor: Limitaciones y Redirecciones en Caliente
LinkedIn redirige automáticamente cualquier URL incorrecta, aproximada, o con caracteres especiales mal escapados a `https://www.linkedin.com/company/unavailable/`. Esto rompe la experiencia de prospección del vendedor en el CRM B2B y corrompe los datos que consume la IA.

### B. La Solución Técnica (El Algoritmo de Verificación)
Antes de insertar o actualizar enlaces de LinkedIn en Baserow de forma masiva:
1.  **Variaciones de Nombres:** Generar un set de variaciones para el slug de la compañía (`moveis-marca`, `marcamoveis`, `marca-oficial`, etc.).
2.  **Percent-Encoding:** Codificar correctamente los slugs con caracteres latinos (ej. `móveis` ➔ `m%C3%B3veis`) al construir la URL.
3.  **Simulación de Cabecera:** Realizar peticiones HTTP `GET` asíncronas simulando un `User-Agent` de navegador de escritorio.
4.  **Detección de Redirecciones:** Capturar la respuesta y evaluar si el `finalUrl` devuelto por el servidor de redirecciones de LinkedIn contiene la palabra clave `'unavailable'` o responde con estado `404`.
5.  **Políticas de Consistencia de Celdas:** Si ninguna variación resulta en un código de estado `200` limpio y válido:
    *   **La celda en Baserow DEBE dejarse vacía (`""`)**.
    *   *Razón:* Es común que empresas tradicionales o familiares en Brasil (como *Móveis Lopas* en Tier 1 o *Imcal Móveis* en Tier 2) no tengan una página de empresa oficial en LinkedIn. Dejar la celda vacía es mejor y más consistente que guardar un enlace tentativo que tire error al hacer clic.

