---
name: deploy-portfolio
description: Automatiza el proceso de despliegue del portafolio, asegurando que los cambios de 'develop' se fusionen en 'main' y se suban al repositorio correcto (mmapp) para activar Netlify.
---

# Deploy Portfolio

## Meta
Asegurar que cada actualización del portafolio llegue a la web pública (mariomojica.com) de forma consistente, evitando confusiones entre ramas o repositorios.

## Instrucciones

### 1. Verificación de Estado
Antes de desplegar, asegúrate de que estás en la raíz del proyecto y que no hay cambios sin commitear.
- `git status`

### 2. Flujo de Despliegue (Sync con Producción)
Sigue estos pasos exactos para llevar los cambios a la web:

1. **Asegurar que la rama de desarrollo esté al día:**
   - `git checkout develop`
   - `git pull origin develop` (si hay cambios remotos)

2. **Fusionar en Main (Producción):**
   - `git checkout main`
   - `git merge develop`

3. **Subir al repositorio oficial:**
   - `git push origin main`
   - `git push origin develop`

### 3. Verificación en Netlify
Una vez ejecutados los comandos, informa al usuario:
- "Los cambios han sido subidos a la rama `main` de `mmapp.git`."
- "Netlify detectará el cambio automáticamente."
- "Puedes monitorear el progreso en: https://app.netlify.com/sites/mariomojica/deploys"

## Restricciones
- **NUNCA** trabajar directamente en `main`. Todo cambio debe nacer en `develop` o una rama de feature y luego fusionarse.
- **SIEMPRE** verificar que el remoto `origin` apunte a `https://github.com/mariomojicastyle/mmapp.git`.

## Ejemplos

### Caso: Usuario pide actualizar la web
**Usuario**: "Publica los cambios actuales en la web"
**Acción**: Ejecutar el flujo de checkout main -> merge develop -> push origin main.
