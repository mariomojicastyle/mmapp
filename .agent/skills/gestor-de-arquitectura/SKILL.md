---
name: gestor-de-arquitectura
description: Gestiona, explica y regenera la arquitectura del sistema B2B bajo demanda. Crea diagramas SVG y guías de replicación versionadas en la carpeta /Arquitectura.
---

# Gestor de Arquitectura

## Meta
Mantener una documentación técnica viva y reproducible de la arquitectura del sistema B2B, permitiendo su entendimiento, recuperación, replicación y mantenimiento estable.

## Instrucciones

### 1. Activación
Esta habilidad se activa cuando el usuario solicita:
- "explica arquitectura"
- "genera arquitectura"
- "actualiza arquitectura"
- "dame la versión actual de la arquitectura"

### 2. Gestión de Versiones
- La información se almacena en la carpeta raíz `/Arquitectura`.
- Cada generación debe incrementar el número de versión (V1, V2, V3...).
- Antes de generar, el agente debe verificar cuál es la última versión existente para determinar el siguiente número.

### 3. Entregables Obligatorios por Versión
Para cada solicitud de generación/actualización, se deben crear:

#### A. Diagrama Arquitectónico (`Arquitectura/arquitectura_V[N].svg`)
- Un diagrama vectorial (SVG) que muestre la relación entre:
  - **Frontend** (React/Vite fuera del VPS).
  - **Base de Datos** (Supabase Cloud).
  - **Servidor de Automatización** (Hetzner VPS con n8n y Proxy).
  - Flujos de datos y webhooks.

#### B. Guía de Replicación (`Arquitectura/guia_replicacion_V[N].md`)
Un documento técnico que explique:
- **Stack Tecnológico**: Detalle de versiones y herramientas.
- **Pasos de Replicación**: Instrucciones paso a paso para levantar el sistema desde cero en otro proyecto.
- **Variables de Entorno**: Lista de secretos necesarios (sin valores reales, solo los nombres).
- **Mantenimiento**: Cómo asegurar que la infraestructura siga "en pie" (healthchecks, límites de recursos).

### 4. Entregables Opcionales (Si son relevantes)
- `Arquitectura/docker-compose_V[N].yml`: Si hubo cambios en la infraestructura Docker.
- `Arquitectura/nginx_config_V[N].conf`: Si hubo cambios en el proxy.

## Restricciones
- **No sobrescribir**: Nunca borres o sobrescribas una versión anterior. La historia debe preservarse.
- **Idioma**: Todo el contenido debe estar en español profesional.
- **Rutas**: Referenciar siempre rutas relativas al proyecto para asegurar portabilidad.

## Ejemplos de Uso
**Usuario**: "Genera la arquitectura actual para el repositorio."
**Agente**: 
1. Detecta que no hay versiones. Elige V1.
2. Crea `Arquitectura/arquitectura_V1.svg`.
3. Crea `Arquitectura/guia_replicacion_V1.md`.
4. Informa al usuario sobre la ubicación de los archivos.
