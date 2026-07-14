# Arquitectura y Diseño del CRM B2B (Baserow)

Este documento detalla el diseño relacional, la estructura de datos y el flujo de automatización del sistema de gestión de clientes (**CRM / Árbol de Clientes**) integrado en el ecosistema de **Mario Mojica Style**.

---

## 🏗️ 1. Infraestructura y Motor CRM

El CRM está soportado sobre **Baserow** (versión autohospedada en Docker dentro del Hetzner VPS bajo el dominio `baserow.mariomojica.com`). 
* **Ventaja:** Soberanía absoluta de datos, sin límites de filas y comunicación directa mediante API REST de baja latencia con **n8n** y la plataforma **Next.js**.

---

## 📐 2. Modelo Relacional de Datos (Árbol de Clientes)

Para evitar la duplicidad de información y permitir la prospección basada en cuentas corporativas (**Account-Based Marketing / ABM**), el CRM está estructurado en dos tablas vinculadas mediante una relación de clave foránea (Uno-a-Muchos):

```
┌───────────────────────────┐
│     TABLA A: EMPRESAS     │  (El Tronco: Datos Corporativos)
└─────────────┬─────────────┘
              │
              │ (1 a Muchos)
              ▼
┌───────────────────────────┐
│     TABLA B: CONTACTOS    │  (Las Ramas: Personas / Decisores)
└───────────────────────────┘
```

### Tabla A: Empresas (Companies)
Almacena la información de las fábricas de muebles objetivo.

| Nombre del Campo | Tipo de Dato Baserow | Descripción / Opciones |
| :--- | :--- | :--- |
| **`Nombre de la Empresa`** | `Text` | Nombre oficial (Ej: *Jamar, Maderkit, Politorno*). |
| **`Sitio Web`** | `URL` | Enlace a la página web del fabricante. |
| **`LinkedIn Corporativo`** | `URL` | Perfil de LinkedIn de la empresa. |
| **`País`** | `Single Select` | Ubicación geográfica (Ej: *Colombia, Brasil, México, etc.*). |
| **`Nicho / Segmento`** | `Single Select` | Tipo de mueble (Ej: *RTA Furniture, Cocinas, Oficina, Tapizados*). |
| **`Dolor Principal`** | `Single Select` | Cuello de botella detectado (Ej: *Devolución de herrajes, R&D lento*). |
| **`Estado Comercial`** | `Single Select` | *Prospecto, Contactado, Demo Agendada, Negociación, Cliente, Perdido*. |
| **`Notas del Target`** | `Long Text` | Comentarios estratégicos y catálogo del cliente. |

### Tabla B: Contactos (Contacts)
Almacena los datos de los tomadores de decisión dentro de las empresas.

| Nombre del Campo | Tipo de Dato Baserow | Descripción / Opciones |
| :--- | :--- | :--- |
| **`Nombre y Apellido`** | `Text` | Nombre completo del contacto. |
| **`Empresa`** | `Link to Table` | **Relación** con la Tabla A (Empresas). |
| **`Cargo`** | `Text` | Puesto exacto (Ej: *Gerente de I+D, Comprador de Herrajes, CEO*). |
| **`Rol en la Compra`** | `Single Select` | *Decisor, Influenciador, Campeón Interno, Bloqueador*. |
| **`LinkedIn Personal`** | `URL` | **Crítico:** Enlace para análisis de IA y personalización de mensajes. |
| **`Correo Electrónico`** | `Email` | Email corporativo directo de la persona. |
| **`WhatsApp / Teléfono`** | `Phone` | Número móvil de contacto. |
| **`Último Contacto`** | `Date` | Fecha de la última interacción realizada. |
| **`Estado del Contacto`** | `Single Select` | *Sin Contactar, Mensaje Enviado, En Conversación, Rechazado*. |

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
