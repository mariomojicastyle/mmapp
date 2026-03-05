---
name: jpg-to-webp
description: Convierte imágenes JPG/JPEG (y PNG) a formato WebP optimizado, permitiendo procesar archivos individuales o carpetas enteras de forma recursiva.
---

# JPG to WebP Converter

## Meta
Proveer una herramienta eficiente para la optimización de imágenes en el proyecto, convirtiendo formatos tradicionales a WebP para reducir el peso de carga sin perder calidad visual significativa.

## Instrucciones

### 1. Requisitos Previos
- Node.js instalado.
- Dependencia `sharp` instalada en el proyecto (`npm install sharp`).

### 2. Uso de la Habilidad
El agente puede invocar esta habilidad cuando el usuario solicite:
- "Convierte esta imagen a webp"
- "Optimiza las imágenes de la carpeta X"
- "Pasa todos los jpg a webp recursivamente"

### 3. Ejecución Técnica
La habilidad utiliza un script de Node.js ubicado en `.agent/skills/jpg-to-webp/scripts/batch-convert.js`.

**Comandos:**
- **Archivo individual:** `node .agent/skills/jpg-to-webp/scripts/batch-convert.js "ruta/foto.jpg"`
- **Carpeta (nivel actual):** `node .agent/skills/jpg-to-webp/scripts/batch-convert.js "ruta/carpeta"`
- **Carpeta (recursivo):** `node .agent/skills/jpg-to-webp/scripts/batch-convert.js "ruta/carpeta" --recursive`
- **Excluir carpeta:** `node .agent/skills/jpg-to-webp/scripts/batch-convert.js "ruta/carpeta" --recursive "--exclude=carpeta_a_ignorar"`


### 4. Flujo de Trabajo del Agente
1. Identificar la ruta proporcionada por el usuario.
2. Verificar si es un archivo o una carpeta.
3. Ejecutar el comando de `node` correspondiente.
4. Informar al usuario sobre el total de archivos convertidos exitosamente.

## Restricciones
- No eliminar los archivos originales (.jpg, .png) a menos que el usuario lo pida explícitamente.
- No procesar archivos que ya son .webp.
- Mantener una calidad de 80 por defecto para balancear peso y fidelidad.

## Ejemplos

### Caso 1: Carpeta específica
**Usuario**: "Convierte las imágenes de la carpeta Referentes_Catalogos a webp"
**Acción**: Ejecutar `node .agent/skills/jpg-to-webp/scripts/batch-convert.js "Referentes_Catalogos"`

### Caso 2: Todo el proyecto
**Usuario**: "Convierte todos los jpg de mi proyecto a webp"
**Acción**: Ejecutar `node .agent/skills/jpg-to-webp/scripts/batch-convert.js "." --recursive`
