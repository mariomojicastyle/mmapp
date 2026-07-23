# 🎨 Diseñador de Posts en SVG (Multipágina de Inkscape)

Este documento centraliza todas las especificaciones, reglas técnicas y metodologías para la generación de alternativas de diseño de posts en formato SVG estructurado, diseñado específicamente para ser editable en **Inkscape 1.2 o superior** utilizando su función multipágina nativa.

---

## 📐 1. Estructura Técnica del SVG Multipágina

Para que Inkscape renderice las alternativas como páginas individuales independientes (en lugar de una sola página gigante que abarque todo), se deben cumplir las siguientes reglas:

### 1.1 El Lienzo SVG Base
El elemento raíz del SVG debe coincidir exactamente con el tamaño de una sola página base (usualmente `1080x1080` píxeles para posts cuadrados de LinkedIn):
```xml
<svg
   width="1080"
   height="1080"
   viewBox="0 0 1080 1080"
   ...
```

### 1.2 Definición de Páginas en `<sodipodi:namedview>`
Cada página se registra de manera individual mediante la etiqueta `<inkscape:page>` dentro del nodo `<sodipodi:namedview>`.
* **Margen y Sangrado:** La primera página (`page1`) debe contener los atributos `margin="0"` y `bleed="0"`.
* **Separación (Gap):** La separación entre páginas es de exactamente **30 píxeles** (horizontal y vertical).
* **Distribución en Cuadrícula (Matriz 3x5):** Para evitar que el archivo crezca infinitamente hacia abajo, las páginas se organizan en 3 columnas de 5 filas máximo:
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

### 1.3 El Peligro del Autocierre de `<sodipodi:namedview>` (CRÍTICO)
Inkscape tiene una tendencia automática a compactar la etiqueta `<sodipodi:namedview>` y autocerrarla como `<sodipodi:namedview ... />` si es guardada o editada externamente sin elementos hijos reconocidos.
> [!WARNING]
> Si la etiqueta se autocierra, **las páginas `<inkscape:page>` se destruyen**, causando que Inkscape pierda la referencia multipágina y dibuje los posts flotantes de forma desalineada (siguiendo sólo los transforms de grupo).
> **Regla de Persistencia:** Al editar o inyectar opciones mediante código, siempre se debe forzar la estructura de apertura y cierre formal (`<sodipodi:namedview> ... </sodipodi:namedview>`) y volver a declarar las páginas en su interior.

---

## 🎨 2. Directrices de Identidad de Marca y Diseño

* **Logosímbolo Oficial:** El recurso vectorial `#logosimbolo` se define en `<defs>`. Cada página debe contener una instancia `<use href="#logosimbolo" ... />` posicionada de forma creativa e integrada de acuerdo con la diagramación de la alternativa (escala típica `1.0` a `1.5`).
* **Temáticas de Color:**
  * **Tech Ethos (Claro):** Fondos claros (`#F9FAFB`, `#E6F4F2`), textos en grises oscuros y negros (`#111827`, `#4B5563`) y acentos cian (`#0088aa`).
  * **Obsidian Teal (Oscuro):** Fondos oscuros (`#0D1117`, `#111319`), textos en blanco y gris claro (`#FFFFFF`, `#9CA3AF`) y acentos cian (`#0088aa`).
* **Grilla de Fondo Vectorial Editable (MANDATORIO)**: No utilizar patrones SVG (`<pattern>`) para las grillas de fondo, ya que bloquean la edición rápida de color y calibre en Inkscape. En su lugar, inyectar un grupo de líneas reales (`<line>`) en cada alternativa estructurado en dos subgrupos para facilitar la edición con un solo clic:
  * **Líneas finas secundarias (cada 40px)**: Ancho de trazo `1px` (o `0.5px` a `0.8px`), color gris claro (`#E5E7EB` para claro, `#1F2937` para oscuro) y opacidad regulada.
  * **Líneas principales gruesas (cada 200px)**: Ancho de trazo `1.5px` (o `1.2px`), color más contrastado (`#D1D5DB` para claro, azul de marca `#0088aa` para oscuro).
* **Seguridad y Persistencia:** Al editar archivos SVG existentes con imágenes incrustadas (base64 de gran tamaño), se deben inyectar las nuevas páginas a nivel local mediante scripts antes de la etiqueta `<image>` final para no alterar ni perder los datos preexistentes del usuario.

---

## 🗣️ 3. Prompt de Comunicación Recomendado

Para solicitar alternativas de forma efectiva y consistente, puedes copiar y modificar la siguiente plantilla en tus mensajes a Antigravity:

```markdown
Genera alternativas de diseño para post en SVG con los siguientes parámetros:
- **Título en imagen**: "[Escribe aquí la frase que irá en la imagen]"
- **Cantidad de alternativas**: [Número, ej: 10]
- **Archivo de destino**: "Publicaciones/[Nombre del archivo].svg"
- **Temática visual**: Tech Ethos (Claro) y Obsidian Teal (Oscuro) alternados.
- **Logosímbolo**: Incluir una ubicación creativa de #logosimbolo por página.
- **Marcador del personaje**: Dejar un círculo/rectángulo guía discontinuo para la ilustración.
- **Separación entre páginas**: 30px
```

---

## 🏆 4. Caso de Éxito de Composición (Post de Julio - Tornillos)

Para futuras generaciones de alternativas, se recomienda emular la estructura de la propuesta final exitosa del Post de Julio:

* **División Vertical Asimétrica (70/30)**:
  * **Columna Principal (70% Izquierda)**: Fondo azul cian oficial (`#0088aa`) con la grilla vectorial fina blanca de fondo. Títulos en amarillo y blanco de alta legibilidad y gran tamaño. Logosímbolo oficial blanco en la base inferior izquierda.
  * **Columna de Acento (30% Derecha)**: Fondo texturizado temático (ej. patrón sutil de líneas o mini-tornillos en trama) con un elemento iconográfico o tipográfico gigante (como un signo de interrogación `?` gigante en blanco).
* **Superposición del Personaje**: Colocar la ilustración del personaje en el centro-derecho inferior, solapando ambas columnas. Esto unifica visualmente las dos secciones asimétricas de forma fluida.
* **Jerarquía de Textos**: Subtítulo en amarillo para captar atención rápida (`Armaste tu mueble...`), y la agitación principal en blanco (`¿Y TE SOBRARON TORNILLOS!!?`).

