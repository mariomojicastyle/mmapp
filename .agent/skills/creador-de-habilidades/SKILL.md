---
name: creador-de-habilidades
description: Esta habilidad actúa como un experto en la creación de habilidades para Antigravity en idioma español. Guía al usuario o al propio agente para diseñar, estructurar y escribir nuevas habilidades siguiendo las mejores prácticas y los formatos oficiales.
---

# Creador de Habilidades

## Meta
Proveer un flujo de trabajo estructurado y una guía detallada para la creación de nuevas habilidades ("skills") para el agente Antigravity, asegurando que sigan el formato estándar (`SKILL.md`, YAML frontmatter, estructura de directorios) y que estén bien documentadas en español.

## Instrucciones

### 1. Recolección de Requisitos
Antes de escribir cualquier archivo, identifica:
- **Nombre de la habilidad**: Corto, descriptivo, en minúsculas y con guiones (ej: `validador-de-codigo-python`).
- **Propósito**: ¿Qué problema específico resuelve?
- **Activación**: ¿Cuándo debería activarse esta habilidad?
- **Acciones**: ¿Qué herramientas o scripts necesita?

### 2. Estructura de Directorios
Crea la siguiente estructura en el proyecto:
- `.agent/skills/[nombre-de-la-habilidad]/`
  - `SKILL.md` (Obligatorio)
  - `scripts/` (Opcional: scripts de apoyo)
  - `examples/` (Opcional: ejemplos de uso)
  - `resources/` (Opcional: plantillas o archivos estáticos)

### 3. Formato del Archivo SKILL.md
El archivo debe comenzar con un bloque YAML de metadatos:
```yaml
---
name: nombre-de-la-habilidad
description: Descripción clara en tercera persona que ayude al agente a saber cuándo usarla.
---
```
Seguido del contenido en Markdown:
- `# Título de la Habilidad`
- `## Meta`: Objetivo principal.
- `## Instrucciones`: Pasos detallados.
- `## Restricciones`: Qué NO debe hacer la habilidad.
- `## Ejemplos`: Casos prácticos de entrada/salida.

## Restricciones
- **No inventar formatos**: Seguir estrictamente el formato de `SKILL.md`.
- **Idioma**: Todo el contenido de la habilidad (descripciones, instrucciones, metas) debe estar en español, a menos que se trate de términos técnicos universales.
- **Enfoque**: Cada habilidad debe centrarse en una sola tarea o área de conocimiento.
- **Rutas**: Siempre usar rutas absolutas o relativas al root del proyecto de forma coherente.

## Ejemplos

### Ejemplo de creación de una habilidad básica:
**Entrada**: "Crea una habilidad para revisar lints de Javascript"
**Salida sugerida**:
1. Crear carpeta `.agent/skills/revisor-lint-js`
2. Crear archivo `SKILL.md` con:
   ```yaml
   ---
   name: revisor-lint-js
   description: Analiza archivos Javascript en busca de errores de estilo y lints usando ESLint.
   ---
   # Revisor de Lint JS
   ## Meta
   Asegurar que el código JS cumpla con los estándares definidos en el proyecto.
   ...
   ```
