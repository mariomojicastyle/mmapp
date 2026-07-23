---
name: generador-alternativas-posts-svg
description: Generador de alternativas de diseño de posts en formato SVG multipágina nativo y optimizado para Inkscape 1.2+.
---

# Generador de Alternativas de Posts en SVG (Multipágina de Inkscape)

Esta habilidad le permite al agente Antigravity generar alternativas de diseño y maquetación de publicaciones (por ejemplo para LinkedIn) directamente en un archivo SVG estructurado de forma que Inkscape 1.2+ lo interprete de manera nativa como un documento multipágina, organizándolas en columnas para evitar un crecimiento vertical infinito.

## Directrices Técnicas Fundamentales

### 1. Dimensiones y Lienzo Base del SVG
Para que Inkscape renderice el documento multipágina correctamente (mostrando las páginas separadas e independientes en el escritorio en lugar de un lienzo gigante):
* **Atributos del elemento `<svg>` principal:** Deben coincidir exactamente con el tamaño de la **primera página** del documento (generalmente un post cuadrado de `1080x1080` píxeles):
  ```xml
  <svg
     width="1080"
     height="1080"
     viewBox="0 0 1080 1080"
     ...
  ```

### 2. Definición de Páginas en `<sodipodi:namedview>`
Cada página se define de forma explícita utilizando el elemento `<inkscape:page>` dentro del nodo `<sodipodi:namedview>`.
* **Márgenes y Sangrado:** Para la primera página (`page1`) se aconseja incluir `margin="0"` y `bleed="0"` de forma que sea la raíz.
* **Separación entre páginas (Gap):** La separación estándar debe ser exactamente de **30 píxeles** tanto horizontal como verticalmente.
* **Distribución en Cuadrícula de Columnas (Matriz de 3x5):**
  * **Columna 1 (x = 0 px)**:
    * Página 01: `x="0" y="0"`
    * Página 02: `x="0" y="1110"`
    * Página 03: `x="0" y="2220"`
    * Página 04: `x="0" y="3330"`
    * Página 05: `x="0" y="4440"`
  * **Columna 2 (x = 1110 px)**:
    * Página 06: `x="1110" y="0"`
    * Página 07: `x="1110" y="1110"`
    * Página 08: `x="1110" y="2220"`
    * Página 09: `x="1110" y="3330"`
    * Página 10: `x="1110" y="4440"`
  * **Columna 3 (x = 2220 px)**:
    * Página 11: `x="2220" y="0"`
    * Página 12: `x="2220" y="1110"`
    * Página 13: `x="2220" y="2220"`
    * Página 14: `x="2220" y="3330"`
    * Página 15: `x="2220" y="4440"`

### 3. Integridad Estructural del XML (Peligro de Autocierre y Anidamiento)
1. **Prevención del Autocierre de `<sodipodi:namedview>`**: Inkscape a veces autocierra esta etiqueta (`<sodipodi:namedview ... />`) cuando se edita el archivo. Al hacerlo, se destruyen las páginas hijas `<inkscape:page>`. Al inyectar o modificar código, se debe forzar siempre la apertura y cierre formal (`<sodipodi:namedview> ... </sodipodi:namedview>`) para declarar las páginas explícitamente.
2. **Cierre Estricto de Grupos `<g>`**: Se debe validar al 100% que cada opción y sus subgrupos (ej. el logosímbolo o la caja de texto) tengan sus respectivas etiquetas de cierre `</g>` completas. Un solo `</g>` faltante provocará que todos los posts subsiguientes se aniden dentro del anterior, sumando sus coordenadas `translate` y provocando un desfase horizontal/vertical fantasma acumulado en cascada.

## 4. Maquetación del Contenido
Cada alternativa de post se envuelve dentro de un grupo `<g>` con un ID único (`opcion_XX`) y se traslada (`translate(x, y)`) a las coordenadas correspondientes de su página de Inkscape:
```xml
<g id="opcion_02" transform="translate(0, 1110)">
  <!-- Fondo y elementos de la segunda página aquí -->
</g>
```

## 5. Directrices de Marca y Elementos de Diseño
* **Logosímbolo Oficial:** Utilizar siempre el Logosímbolo definido en `<defs>` con `<use href="#logosimbolo" ... />`. Variar su posición y escala (escala recomendada `1.0` a `1.5`) para integrarlo de forma armónica en el diseño de cada página.
* **Paleta de Colores:** Alternar designs basados en la paleta oficial:
  * **Tech Ethos (Claro):** Fondos claros (`#F9FAFB`, `#E6F4F2`), textos en grises oscuros y negros (`#111827`, `#4B5563`) y acentos cian (`#0088aa`).
  * **Obsidian Teal (Oscuro):** Fondos oscuros (`#0D1117`, `#111319`), textos en blanco y gris claro (`#FFFFFF`, `#9CA3AF`) y acentos cian (`#0088aa`).
* **Marcadores de Ilustración / Personaje:** Dejar siempre un grupo guía claro con una línea discontinua (`stroke-dasharray="10,10"`) etiquetado como `personaje_opcion_XX` para que el usuario pueda insertar su PNG o SVG en Inkscape con precisión.
* **Grilla de Fondo Vectorial Editable (MANDATORIO)**: Evitar patrones SVG (`<pattern>`) para las grillas de fondo, ya que impiden la edición visual interactiva en Inkscape. En su lugar, inyectar un grupo de líneas reales (`<line>`) en cada alternativa estructurado en dos subgrupos:
  * **Líneas finas secundarias (cada 40px)**: Ancho de trazo `1px` (o `0.5px`), color gris claro (`#E5E7EB` para claro, `#1F2937` para oscuro) y opacidad regulada.
  * **Líneas principales gruesas (cada 200px)**: Ancho de trazo `1.5px` (o `1.2px`), color más contrastado (`#D1D5DB` para claro, azul de marca `#0088aa` para oscuro).

## 6. Preservación del Trabajo Preexistente
Al inyectar o modificar alternativas de posts en archivos SVG de gran tamaño (que a menudo contienen imágenes base64 de 3MB o más al final del documento):
* Utilizar herramientas locales de procesamiento de texto o scripts en Node.js para insertar los datos limpiamente antes de la etiqueta `<image>` del final.
* Nunca sobrescribir ni modificar el bloque base64 del final del SVG.
