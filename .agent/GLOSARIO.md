# 📖 Glosario de Habilidades (Vademécum de Skills)

Este documento es la guía de referencia para las habilidades (skills) instaladas en el agente Antigravity para el proyecto **mmapp**. Detalla qué hace cada una y cómo interactúa con el flujo de trabajo.

---

## 🔝 Habilidades de Alta Prioridad (Nuevas)
*Estas habilidades fueron instaladas para cubrir brechas críticas en seguridad, estabilidad y calidad.*

| Skill | Descripción | Uso |
| :--- | :--- | :--- |
| **`test-driven-development`** | Ciclo "Red-Green-Refactor": Escribir el test, verlo fallar y luego programar. | **Manual:** Ideal para lógica compleja. **Ejemplo:** Antes de programar un validador, creamos un test que "falle" si el campo está vacío; así aseguramos un código robusto y sin "grasa". |
| **`workflow-automation`** | Arquitectura de automatización duradera (n8n, GitHub, Inngest). | **Automático:** Diseña flujos usando patrones (Secuencial, Paralelo u Orquestador). Asegura que procesos críticos tengan reintentos y no se "rompan" a mitad de camino. |
| **`cost-optimization`** | Estrategias para reducir gastos en servicios de nube y tokens de IA. | **Automático:** Analiza si estamos usando recursos de más (Right-sizing) y propone planes de ahorro en AWS, Google o Vercel. |
| **`copywriting`** | Escritura profesional para convertir visitantes en clientes (Ventas). | **Manual:** "Escribe el texto de mi landing page". Prioriza los beneficios reales para el usuario por encima de adornos literarios. |
| **`security-auditor`** | Auditoría de seguridad para APIs, endpoints y autenticación. | **Automático:** Se activa al revisar código con datos sensibles. |
| **`api-security-best-practices`** | Patrones seguros para n8n y otros webhooks externos. | **Automático:** Se usa al diseñar o actualizar flujos de integración. |
| **`debugging-strategies`** | Metodología sistemática para resolución de errores complejos. | **Manual/Automático:** Invocada cuando un error persiste. |
| **`docker-expert`** | Diagnóstico y optimización de contenedores. | **Automático:** Se activa ante fallos de infraestructura local (n8n, etc.). |
| **`lint-and-validate`** | Verificación de estándares antes del commit. | **Automático:** Se ejecuta antes de cada paso de `commit`. |
| **`doc-coauthoring`** | Flujo estructurado para documentación técnica. | **Manual:** Úsala para crear manuales de alto nivel. |
| **`content-creator`** | Optimización de voz de marca y contenido para LinkedIn. | **Manual:** "Crea un post sobre X para LinkedIn". |
| **`prompt-engineer`** | Diseño y optimización de instrucciones para modelos de IA. | **Automático:** Mejora las respuestas de IA internas. |
| **`performance-optimizer`** | Auditoría de velocidad y Core Web Vitals. | **Manual:** "Audita el rendimiento de la página X". |

---

## 🛠️ Habilidades del Ecosistema n8n, SEO y Diseño
*Habilidades core ya existentes en el proyecto.*

| Categoría | Skills Incluidas | Propósito |
| :--- | :--- | :--- |
| **n8n Expert** | `n8n-code-js`, `n8n-code-python`, `n8n-expression-syntax`, `n8n-mcp-tools-expert`, `n8n-node-configuration`, `n8n-validation-expert`, `n8n-workflow-patterns` | Dominio total de la automatización en n8n. |
| **SEO & GEO** | `seo-audit`, `seo-geo` | Optimización para buscadores tradicionales y motores de IA. |
| **Diseño & UI/UX** | `ui-ux-pro-max`, `image-to-svg-layout`, `jpg-to-webp` | Creación de interfaces premium y optimización de assets visuales. |
| **Arquitectura** | `gestor-de-arquitectura`, `brainstorming` | Planificación de sistemas y generación de diagramas. |
| **Gestión & Git** | `commit`, `deploy-portfolio`, `find-skills`, `creador-de-habilidades` | Automatización de tareas de desarrollo y gestión de Antigravity. |
| **Backend** | `supabase-postgres-best-practices`, `vercel-react-best-practices`, `browser-use` | Optimizaciones específicas para la base de datos y el stack de frontend. |

---

## ⏳ Próximas Habilidades (Pendientes de Decisión)
*Estas habilidades están disponibles en el catálogo pero aún no han sido instaladas. Revisar para futura incorporación.*

| Skill | Beneficio Potencial | ¿Por qué considerarla? |
| :--- | :--- | :--- |
| **`create-pr`** | Creación estructurada de Pull Requests en GitHub. | Profesionaliza el flujo de trabajo si trabajas con más personas. |

---
*Última actualización: 2026-03-27*
