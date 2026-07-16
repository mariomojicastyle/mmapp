# Playbook: Enriquecimiento de Leads mediante OSINT y Automatización de Enlaces en CRM

Este manual documenta la estrategia y los algoritmos utilizados por el agente para la prospección, recopilación y enlace automatizado de Leads B2B en la industria mueblera de Brasil/Latinoamérica, mitigando las barreras de privacidad de LinkedIn.

---

## 🔍 1. Técnica de OSINT Moveleiro (Búsqueda de Tomadores de Decisión)

Dado que LinkedIn bloquea la indexación pública de perfiles personales y requiere iniciar sesión para la mayoría de consultas, se utiliza **OSINT (Inteligencia de Fuentes Abiertas)** enfocada en la prensa y sindicatos del sector.

### Fuentes Clave a Consultar en Google:
1.  **Prensa Especializada Brasileña:** *eMóbile*, *Móveis de Valor*, *Setor Moveleiro*.
2.  **Sindicatos e Instituciones:** *SIMA* (Arapongas), *Sindmóveis* (Bento Gonçalves), *Movergs* (Rio Grande do Sul).
3.  **Registros de Marcas y Patentes/CNPJ:** Portales de datos empresariales como *Serasa Experian*, *CNPJA*, etc.

### Fórmulas de Búsqueda Efectivas:
*   Para CEOs/Directores: `"Nombre de la Empresa" (diretoria OR diretor OR CEO OR Presidente OR dono OR fundador)`
*   Para perfiles técnicos (I+D/Diseño): `"Nombre de la Empresa" AND ("P&D" OR "desenvolvimento" OR "designer" OR "produtos")`

---

## 🔗 2. Automatización de Enlaces en el CRM (Baserow)

Para evitar la fricción operativa de buscar manualmente a cada persona y copiar sus redes, se aplican dos fórmulas algorítmicas en la base de datos de Leads (Tabla 994).

### 2.1 Enlaces de Búsqueda de Personas en Redes Sociales (LinkedIn, Facebook e Instagram)
En lugar de almacenar enlaces a páginas de empresas genéricas o perfiles estáticos individuales difíciles de indexar externamente, se inyectan enlaces de búsqueda directa parametrizada con los nombres y apellidos de cada tomador de decisión:

*   **LinkedIn:** 
    *   *Fórmula:* `https://www.linkedin.com/search/results/people/?keywords={Nombre} {Apellido} {Empresa}`
    *   *Comportamiento:* Abre la búsqueda interna de LinkedIn con el nombre exacto y empresa.
*   **Facebook:** 
    *   *Fórmula:* `https://www.facebook.com/search/people/?q={Nombre} {Apellido} {Empresa}`
    *   *Comportamiento:* Abre la sección de personas en la búsqueda de Facebook filtrando además por la empresa para eliminar homónimos.
*   **Instagram (vía Google):**
    *   *Fórmula:* `https://www.google.com/search?q=site:instagram.com "{Nombre} {Apellido}" "{Empresa}"`
    *   *Comportamiento:* Realiza una consulta en Google filtrada únicamente para cuentas públicas de Instagram que tengan ese nombre exacto, esquivando la falta de un buscador abierto por URL en Instagram Web.

### 2.2 Enlace de Mensajería Directa (WhatsApp)
Se sanean las cadenas de texto del teléfono para convertirlas en URLs accionables de WhatsApp.
*   **Fórmula:** `https://wa.me/{código_país}{teléfono_saneado}` (sin espacios, guiones ni símbolos).
*   **Comportamiento:** Al pulsar el enlace, abre WhatsApp Web directamente en la conversación con el Lead sin necesidad de agregarlo a la agenda.

---

## 🛠️ 3. Automatización mediante Scripts en el Repositorio

Para replicar o robustecer esta base de datos ante nuevos lotes de Leads, se mantienen los siguientes scripts utilitarios en la carpeta `/scratch/`:

*   [add_leads_social_fields.js](file:///c:/Desarrollo/mmapp/scratch/add_leads_social_fields.js): Crea las columnas de redes (`LinkedIn`, `Facebook`, `Instagram`, `WhatsApp`, `Canal Preferido`, `Actividad en Redes`) en la tabla de Leads de Baserow y las ordena visualmente en la cuadrícula de la vista.
*   [populate_leads_social_data.js](file:///c:/Desarrollo/mmapp/scratch/populate_leads_social_data.js): Utiliza el mapeo relacional de empresas para heredar redes sociales corporativas, sanear teléfonos y generar las consultas personalizadas de búsqueda en LinkedIn para cada contacto.

---

## 📈 4. Flujo de Trabajo para el Agente en Futuros Turnos

Cuando el usuario solicite agregar o enriquecer Leads en el CRM:
1.  **Ejecutar OSINT** en la web utilizando las consultas de la Sección 1.
2.  **Identificar el ID de la Empresa Vinculada** en la tabla 991.
3.  **Generar el Payload** formateando correctamente los selectores de opción única (`Canal Preferido` y `Actividad en Redes`) como cadenas de texto plano (no objetos).
4.  **Inyectar los datos** mediante la API REST de Baserow en la tabla de Leads (994).
