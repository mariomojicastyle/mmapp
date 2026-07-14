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
│    TABLA A: EMPRESAS (ID 989)   │  (El Tronco: Datos Corporativos)
└───────────────┬─────────────────┘
                │
                │ (1 a Muchos)
                ▼
┌─────────────────────────────────┐
│   TABLA B: CONTACTOS (ID 600)   │  (Las Ramas: Personas / Leads)
└───────────────┬─────────────────┘
                │
                │ (1 a Muchos)
                ▼
┌─────────────────────────────────┐
│ TABLA C: INTERACCIONES (ID 988) │  (Las Hojas: Historial/Bitácora)
└─────────────────────────────────┘
```

### Tabla A: Empresas (ID: 989)
Almacena la información de las fábricas de muebles objetivo.

| Nombre del Campo | Tipo de Dato Baserow | Descripción / Opciones |
| :--- | :--- | :--- |
| **`Nombre de la Empresa`** | `Text (Primary)` | Nombre oficial (Ej: *Jamar, Maderkit, Politorno*). |
| **`Sitio Web`** | `URL` | Enlace a la página web del fabricante. |
| **`LinkedIn Corporativo`** | `URL` | Perfil de LinkedIn de la empresa. |
| **`Pais`** | `Text` | Ubicación geográfica. |
| **`Nicho / Segmento`** | `Single Select` | *Mobiliario RTA, Oficina, Cocinas, Tapizados, Otro*. |
| **`Dolor Principal`** | `Single Select` | *Devoluciones de herrajes, R&D lento, Falta de WebAR, Ninguno*. |
| **`Estado Comercial`** | `Single Select` | *Prospecto, Contactado, Demo Agendada, Negociación, Cerrado Ganado, Cerrado Perdido*. |
| **`Notas del Target`** | `Long Text` | Comentarios estratégicos y catálogo del cliente. |
| **`Leads`** | `Link Row` | Relación inversa automática con la Tabla B (Contactos). |

### Tabla B: Contactos / Leads (ID: 600)
Almacena los datos de los tomadores de decisión dentro de las empresas.

| Nombre del Campo | Tipo de Dato Baserow | Descripción / Opciones |
| :--- | :--- | :--- |
| **`Nombre`** | `Text (Primary)` | Nombre del contacto. |
| **`Apellido`** | `Text` | Apellido del contacto. |
| **`Email`** | `Email` | Email corporativo directo de la persona. |
| **`Empresa Vinculada`** | `Link Row (ID 9475)` | **Relación** con la Tabla A (Empresas - ID 989). |
| **`Telefono`** | `Text` | Número móvil de contacto. |
| **`Rol`** | `Text` | Cargo / Puesto (Ej: *Gerente de I+D, Comprador, CEO*). |
| **`Estado CRM`** | `Single Select` | *Prospecto, Primer Contacto, Demo Agendada, Negociación, Cerrado Ganado, Cerrado Perdido*. |
| **`Interacciones`** | `Link Row (ID 9462)` | **Relación** con la Tabla C (Interacciones - ID 988). |
| **`Descripcion de la idea`** | `Long Text` | Mensaje inicial o descripción de su interés. |

### Tabla C: Interacciones (ID: 988)
Bitácora de contactos y respuestas vinculadas a un lead.

| Nombre del Campo | Tipo de Dato Baserow | Descripción / Opciones |
| :--- | :--- | :--- |
| **`Asunto`** | `Text (Primary)` | Asunto del email o resumen del mensaje. |
| **`Lead`** | `Link Row (ID 9461)` | Relación con la Tabla B (Contactos - ID 600). |
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
