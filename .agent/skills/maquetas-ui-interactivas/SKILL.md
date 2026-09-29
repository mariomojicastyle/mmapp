---
name: maquetas-ui-interactivas
description: Diseña, genera y renderiza maquetas interactivas de alta fidelidad en vivo para la interfaz de usuario de 3dBimFab y la plataforma Mario Mojica. Se activa automáticamente cuando el usuario solicita 'maqueta', 'maqueta de interfaz', 'maqueta interactiva', 'laboratorio de UI', 'propuesta de diseño de interfaz' o pide validar visualmente botones, cápsulas, controles y paneles antes de implementar en código.
---

# Maquetas UI Interactivas (Laboratorio de Interfaz en Vivo)

## Meta
Permitir la validación ergonómica y visual rápida de componentes de interfaz (paneles, cápsulas, botones, inputs y flujos de interacción) antes de escribir código en Next.js/React, presentando maquetas autónomas 100% funcionales directamente incrustadas en el flujo del chat.

---

## 🎯 Principio Rector: La Interfaz Real es la Verdad
- **Prohibido:** Queda estrictamente prohibido perder tiempo o distraer al usuario creando simulaciones 3D ficticias, mundos virtuales simulados o canvas 3D inventados dentro de la maqueta.
- **Foco Absoluto en UI/UX:** La maqueta debe centrarse 100% en:
  1. La disposición y ergonomía real dentro del panel lateral ("Configurador Manual"), tarjetas de capas o cabecera.
  2. La presencia exacta de los botones, sus iconos SVG y sus textos explicativos.
  3. Las micro-interacciones vivas: qué ocurre al hacer clic, ciclar valores (`0° ➔ 90° ➔ 180° ➔ -90°`), alternar estados activos/inactivos o abrir menús/popovers.
  4. La semántica cromática: respuesta de color según el estado (activo, en reposo, advertencia).

---

## 🎨 Reglas de Marca e Identidad Gráfica

### 1. Formas de UI: Cápsulas Obligatorias (`rounded-full`)
- Todos los botones, badges, selectores, píldoras y campos de acción deben tener terminaciones circulares puras (`rounded-full` / `border-radius: 9999px`).
- Prohibido el uso de rectángulos con esquinas redondeadas (`rounded-lg`, `rounded-xl`, etc.) en elementos de acción interactivos.
- Botones de ícono único deben ser estrictamente circulares (`w-7 h-7 rounded-full`).

### 2. Paleta Oficial Dual (Tech Ethos & Obsidian)
- **Tema Claro Primario ("Tech Ethos"):**
  * Color de acción primario / botón activo: Azul cian oficial **`#0088AA`** / `#0891B2`.
  * Estados activos / de atención: Ámbar suave (`bg-amber-500/15`, borde `#F59E0B`, texto `#B45309`).
  * Fondos de panel: Blanco `#FFFFFF` o gris slate sutil `#F8FAFC`.
  * Bordes: `#E2E8F0` / `#CBD5E1`.
- **Tema Oscuro Secundario ("Obsidian"):**
  * Color primario activo: Azul sobrio **`#1368AA`** (RGB: 19, 104, 170) **mate sin incandescencias neón**.
  * Fondos: Panel `#131B2E`, fondo profundo `#0B0F17`.
- **Nomenclatura Canónica:** La suite siempre se escribe como **`3dBimFab`**.

---

## 🛠️ Flujo de Trabajo Obligatorio para Generar Maquetas

### Paso 1: Identificación y Replicación Fiel
Al recibir la solicitud de maqueta, tomar como base la estructura real de los componentes del proyecto (ej. `CapsulaTableroPlus.tsx`, `CapsulaHerrajePlus.tsx`, `MultiplePlusSection.tsx`, `CapaMultiplePlusCard.tsx`). No inventes un layout genérico; replica el contexto real del panel.

### Paso 2: Generación de Opciones Comparativas
Siempre que la solución admita alternativas, ofrece **2 o 3 propuestas interactivas** en la misma maqueta (ej. *Propuesta 1: Píldora compacta + Menú flotante*, *Propuesta 2: Triple píldora cíclica inline a 1 clic*), detallando ventajas de cada una.

### Paso 3: Código Autónomo y Cumplimiento CSP
Generar el archivo HTML con las siguientes reglas técnicas:
1. **Tailwind CSS Autorizado:** Usar ÚNICAMENTE el script aprobado por CSP en el `<head>`:
   ```html
   <script src="https://www.gstatic.com/antigravity/web/dev/tailwindcss.min.js"></script>
   ```
2. **Cero Dependencias Externas Bloqueadas:** No usar CDNs externos (`cdn.tailwindcss.com`, cdnjs, unpkg, jsdelivr). Todo el JavaScript debe ser vanilla e inline en un bloque `<script>`.
3. **Soporte de Tema y Embed:**
   ```html
   <body class="bg-transparent text-[var(--foreground)] antialiased p-2">
     <div class="bg-[var(--card)] text-[var(--foreground)] border border-[var(--border)] rounded-2xl p-4 shadow-sm space-y-4 max-w-4xl mx-auto">
       <!-- Contenido interactivo -->
     </div>
   </body>
   ```

### Paso 4: Escritura del Artefacto
Guardar el archivo `.html` en el directorio de artefactos con nombre descriptivo (ej. `maqueta_[tema]_[propuesta].html`) utilizando `write_to_file` con `UserFacing: true`.

### Paso 5: Incrustación Directa en Chat (`<agent-embed>`)
En la respuesta visible para el usuario, incluir OBLIGATORIAMENTE la etiqueta de incrustación:
```html
<agent-embed src="file:///<ruta_absoluta_del_artefacto>.html"></agent-embed>
```
Esto asegura que el usuario no vea código inerte, sino la interfaz viva y funcional lista para interactuar al hacer scroll.

---

## 💡 Ejemplos de Invocación Natural
Esta habilidad debe activarse de forma transparente y automática ante frases como:
- *"Muestrame una maqueta de interfaz para..."*
- *"Hazme una maqueta interactiva de..."*
- *"Quiero ver una propuesta de UI para..."*
- *"Laboratorio de interfaz para [botón / control / cápsula]"*
- *"Antes de programar, maqueta cómo se vería..."*
- *"Pon a funcionar la maqueta en vivo en el chat"*
