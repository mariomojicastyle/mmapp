---
name: super-commit
description: Automatiza el flujo completo de Git: commit profesional, merge a main, push a GitHub para despliegue en Netlify, limpieza de ramas y creación de una nueva rama de trabajo. Se activa con el comando "/super-commit - [PROXIMA_RAMA]".
---

# Super-Commit Protocol

## Meta
Automatizar la gestión de ramas y despliegues para asegurar que el repositorio esté siempre sincronizado con GitHub/Netlify y que el flujo de trabajo siga las mejores prácticas de la industria con un solo comando.

## Secuencia de Operación
Cuando el usuario ejecute `/super-commit - [NOMBRE_NUEVA_RAMA]`, el agente DEBE realizar los siguientes pasos de forma estrictamente secuencial:

1. **Identificar Rama Actual**: Obtener el nombre de la rama en la que se está trabajando.
2. **Commit Profesional**:
   - Analizar los cambios actuales (git status/diff).
   - Realizar `git add .`.
   - Generar un commit con formato Conventional Commits: `<tipo>(<alcance>): <Descripción corta>`.
   - Añadir en el pie: `Co-Authored-By: Antigravity <noreply@antigravity.ai>`.
3. **Sincronización con Main**:
   - Cambiar a `main` (`git checkout main`).
   - Traer cambios remotos (`git pull origin main`).
   - Fusionar la rama de trabajo (`git merge [RAMA_TRABAJO]`).
4. **Despliegue (GitHub/Netlify)**:
   - Subir cambios a GitHub (`git push origin main`).
5. **Limpieza del Repo**:
   - Eliminar la rama de trabajo local que ya fue fusionada (`git branch -d [RAMA_TRABAJO]`).
6. **Preparación para Nueva Etapa**:
   - Crear y cambiar a la nueva rama especificada por el usuario (`git checkout -b [NOMBRE_NUEVA_RAMA]`).
7. **Resumen Final**:
   - Informar al usuario que el despliegue a Netlify se ha disparado.
   - Confirmar en qué rama se encuentra el agente ahora mismo.

## Recomendaciones
- Si hay conflictos durante el merge, detenerse inmediatamente e informar al usuario.
- Siempre redactar los mensajes de commit en español (o el idioma que el usuario prefiera).
- Asegurarse de que el servidor local (si existe) no interfiera con las operaciones de Git.

## Ejemplo de uso
**Usuario**: `/super-commit - landing-nueva-seccion`
**Agente**: [Ejecuta pasos 1-6] -> "¡Listo! Cambios subidos a main, despliegue en Netlify iniciado y ahora estamos en la rama `landing-nueva-seccion`."
