---
name: image-to-svg-layout
description: Metodología para transformar imágenes de referencia de layouts (catálogos, revistas, UIs) en archivos SVG editables y profesionales.
---

# Image to SVG Layout

## Meta
Documentar y estandarizar el proceso de análisis visual y generación de código SVG para crear plantillas editables de alta calidad basadas en imágenes de referencia.

## Instrucciones

### 1. Análisis Visual del Referente
Antes de codificar, identifica los siguientes elementos en la imagen:
- **Retícula (Grid)**: ¿Es un diseño de una sola página o un "spread" (doble página)? ¿Usa columnas, filas o bloques libres?
- **Paleta de Colores**: Identifica los códigos hexadecimales (o usa `ui-ux-pro-max` para paletas armónicas).
- **Tipografía**: Define pesos (Bold, Light) y familias (Serif para elegancia, Sans-serif para modernidad).
- **Elementos UI**: Placeholders de imágenes, bloques de texto, iconos y acentos gráficos.

### 2. Estructura del Código SVG
Para asegurar la calidad y edición profesional:
- **ViewBox**: Usa dimensiones estándar (ej: `0 0 842 595` para A4 horizontal).
- **Agrupación (`<g>`)**: Organiza el diseño por capas lógicas (ej: `<g id="pagina_izquierda">`, `<g id="contenido_principal">`).
- **Nombres de ID**: Usa IDs descriptivos en inglés o español para que herramientas como Figma los reconozcan como capas nombradas (ej: `id="hero_image"`, `id="main_title"`).

### 3. Buenas Prácticas de Generación
- **Placeholders**: Usa `<rect>` con colores neutros (`#eeeeee`) para áreas de imágenes.
- **Tipografía Escalable**: Define `font-family` genéricos (Arial, sans-serif) para asegurar compatibilidad.
- **Responsividad**: Usa `width="100%"` y `height="auto"` si el SVG se usará en web, o medidas fijas si es para impresión.
- **Acentos**: Usa formas geométricas simples (`<circle>`, `<rect>`, `<line>`) para recrear los detalles de diseño del referente.

## Restricciones
- **No vectorizar píxel a píxel**: El objetivo no es una copia exacta, sino una **recreación editable** del layout.
- **Evitar código sucio**: No uses rutas de trazado (`<path>`) complejas si una forma básica (`<rect>`) es suficiente.

## Ejemplo de Flujo
1. **Entrada**: Imagen de un catálogo de muebles.
2. **Análisis**: 2 columnas, blanco y negro, fuentes Serif.
3. **Salida**: Un SVG con grupos limpios para el encabezado, la parrilla de productos y el pie de página.
