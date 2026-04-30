---
name: medio-commit
description: Automatiza el proceso de "medio commit": hace commit con descripción generada por IA, fusiona con main, sube a GitHub (sin deploy de Netlify), elimina ramas sobrantes y crea una nueva rama especificada por el usuario. Se activa con comandos como "/mediocommit - [nombre_nueva_rama]".
---

# Medio Commit

## Meta
Proveer un flujo de trabajo rápido y estandarizado para guardar cambios, integrarlos en `main` y preparar el entorno para la siguiente funcionalidad, sin disparar procesos completos de despliegue a producción de forma innecesaria.

## Flujo de Trabajo (Instrucciones)

Cuando el usuario ejecute un comando como `/mediocommit - [nueva-rama]`, debes ejecutar la siguiente secuencia de pasos usando la terminal de comandos de forma consecutiva (esperando a que termine cada uno):

1. **Revisar estado y añadir cambios:**
   Ejecuta `git status` para ver qué cambió y luego `git add .` para preparar todos los archivos en la rama actual.
2. **Hacer el Commit:**
   Genera una descripción detallada y profesional (siguiendo las convenciones de Sentry o las mejores prácticas de Conventional Commits) basada en los archivos modificados.
   Ejecuta `git commit -m "<Descripción generada>"`.
3. **Guardar el nombre de la rama actual:**
   Ejecuta `git branch --show-current` para saber en qué rama estás. Esta será la `[rama-anterior]`. (A menos que estés en `main`, en ese caso avísale al usuario que ya estaba en `main`).
4. **Fusionar con Main:**
   Ejecuta `git checkout main`.
   Ejecuta `git pull origin main` (para asegurar que está actualizada localmente).
   Ejecuta `git merge [rama-anterior]`.
5. **Subir a GitHub:**
   Ejecuta `git push origin main`.
6. **Limpiar Ramas:**
   Si la `[rama-anterior]` no era `main` ni `develop`, elimínala localmente ejecutando `git branch -d [rama-anterior]`. (Pregunta antes de eliminar ramas principales).
7. **Crear Nueva Rama:**
   Ejecuta `git checkout -b [nueva-rama]` utilizando el nombre proporcionado por el usuario en el comando inicial.

## Restricciones
- Asegúrate de esperar a que cada comando termine en la terminal antes de continuar.
- El mensaje del commit debe ser descriptivo pero conciso, siempre incluyendo el `Co-Authored-By: Claude <noreply@anthropic.com>`.
- Si hay conflictos durante el `merge`, detén el proceso e informa al usuario inmediatamente para que lo resuelva.

## Ejemplos

**Entrada**: `/mediocommit - feature/notificaciones-push`

**Salida sugerida**: El agente realiza el `git add .`, hace commit en la rama actual (ej. `develop`) con un mensaje sobre lo último trabajado, hace checkout a `main`, hace merge de `develop`, pushea a GitHub en `main`, y luego crea y cambia a la rama `feature/notificaciones-push`. Finalmente le informa al usuario que todo el "medio commit" está listo y se encuentran en la nueva rama.
