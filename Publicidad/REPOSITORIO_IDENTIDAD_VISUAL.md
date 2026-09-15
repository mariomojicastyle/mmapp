# 🎨 Repositorio Canónico de Identidad Gráfica y Logotipos (/Publicidad)

> 🏷️ **REGLA DE ORO DE MARCA:** La suite y motor paramétrico se escribe **SIEMPRE Y SIN EXCEPCIÓN** como **`3dBimFab`** (`3` + `d` minúscula + `B` mayúscula + `im` + `F` mayúscula + `ab`).

Este documento es el **Mapa Central y Protocolo de Distribución** de todos los activos gráficos, vectoriales SVG, favicons y recursos de marca de la empresa **Mario Mojica** y el producto **3dBimFab**.

---

## 📂 1. Directorio Fuente Canónico Maestro: `c:\Desarrollo\mmapp\Publicidad\`

Todos los archivos originales, editables en Inkscape / Illustrator y rasterizados maestros residen **exclusivamente en esta carpeta**:

| Archivo | Tipo | Descripción | Modo de Uso |
| :--- | :--- | :--- | :--- |
| **`Logo_3BF.svg`** | SVG Vectorial | **Logotipo Oficial 3dBimFab (Modo Light v2)**: Badge rojo `#bb0f0f` con `3BF` en `Prompt Bold` blanco, texto `3dBimFab` negro y `Powered by MARIO MOJICA`. | Encabezados claros, minutas, cotizaciones y reportes PDF. |
| **`Logo_3BF_Dark.svg`** | SVG Vectorial | **Logotipo Oficial 3dBimFab (Modo Dark v2)**: Misma geometría y badge `#bb0f0f`, pero con tipografía `3dBimFab` y subtítulo en blanco puro (`#ffffff`). | Interfaces oscuras (`#131B2E` / `#0B0F17`), modo AR y visores nocturnos. |
| **`Icon_3BF.svg`** | SVG Vectorial | **Ícono Cuadrado Maestro 3BF v2**: Badge rojo `#bb0f0f` con esquinas redondeadas suaves y texto `3BF` de alto calibre. | Favicons, avatares, apps y material publicitario. |
| **`Icon_3BF.png`** | PNG 512x512 | Rasterizado maestro de alta resolución del ícono 3BF. | Base para compiladores de instaladores y favicons. |
| **`Icon_3BF.ico`** | ICO Multirresolución | Empaquetado multiescala (16px, 32px, 48px, 64px, 128px, 256px). | Favicon para navegadores y ejecutables de Windows. |
| **`Icon_3DBimFab.ico`** | ICO Multirresolución | Alias idéntico a `Icon_3BF.ico` para empaquetado de software de escritorio. | Ejecutables y hops de RhinoCompute. |
| **`Logo_3BF.png`** | PNG 920x320 | Logotipo horizontal exportado en fondo transparente para documentos de oficina. | Word, Excel, presentaciones y redes. |
| **`Logo_3BF_Dark.png`** | PNG 920x320 | Logotipo horizontal para fondos oscuros con base pre-renderizada en `#131B2E`. | Mockups y banners nocturnos. |
| **`Logo_MM_en.svg`** | SVG Vectorial | **Logotipo Corporativo Maestro Mario Mojica**: Isotipo MM + *FORM & FUTURE*. | Identidad institucional y pie de firma. |

---

## 🗺️ 2. Mapa de Distribución en el Código (Dónde se replican los activos)

Cuando se actualice cualquiera de los activos en `Publicidad/`, deben actualizarse en estos destinos exactos:

### A. Aplicación Web 3dBimFab Next.js (`c:\Desarrollo\mmapp\3bf\`)

1. **Archivos Estáticos en `c:\Desarrollo\mmapp\3bf\public\`**:
   - `Logo_3BF.svg` -> Consumido por `/access` (pantalla de login/shield).
   - `Logo_3BF_Dark.svg` -> Consumido por `/ar` (pantalla de realidad aumentada en celular).
   - `Icon_3BF.svg` -> Favicon vectorial nativo para Google Chrome.
   - `Icon_3BF.png` -> Favicon PNG 90x90 para navegadores.
   - `Icon_3BF.ico` y `favicon.ico` -> Favicons multiescala para pestañas de navegador.
   - `icon-192.png` -> Ícono PWA maskable (192x192) para instalación en celulares (Android/iOS) con zona segura centrada (Safe Zone 70%).
   - `icon-512.png` -> Ícono PWA maskable (512x512) para splash screen de Android/iOS.
   - `site.webmanifest` -> Manifiesto PWA de instalación en celular.

2. **Código Fuente con SVG Inline en `c:\Desarrollo\mmapp\3bf\app\`**:
   - `app/page.tsx` (Líneas ~340-395): Header de la aplicación con el SVG inline del logotipo (renderiza el badge rojo con esquinas suaves y tipografía `Prompt Bold`).
   - `app/layout.tsx` (Líneas ~35-75): Configuración de metadatos de Next.js (`metadata.icons`) y enlaces `<head>` con cache-busting `?v=X`.

### B. Portal Web Corporativo (`c:\Desarrollo\mmapp\mario-mojica-homepage\`)

- `mario-mojica-homepage/public/publicidad/`:
  - `Logo_3BF.svg`
  - `Logo_3BF_Dark.svg`
  - `Logo_3BF.png`
  - `Logo_3BF_Dark.png`
  - `Icon_3BF.ico`
  - `Icon_3DBimFab.ico`

---

## 📱 3. Especificación Técnica de Íconos PWA para Celular (Anti-Recortes)

Para evitar que Android o iOS recorten el texto o creen esquinas dobles:

1. **Lienzo 100% Relleno de Color Rojo (`#bb0f0f`)**:
   El fondo del icono PWA (`icon-192.png` e `icon-512.png`) **NO debe tener esquinas transparentes**. Debe llenar el 100% del cuadrado con `#bb0f0f`.
2. **Zona Segura (Safe Zone 70%)**:
   El texto `3BF` se ubica dentro del 70% central del lienzo. Así, cuando los launchers de Android (Samsung OneUI, Xiaomi MIUI, Google Pixel) recorten el icono en círculo, squircle o lágrima, el texto `3BF` permanece perfectamente centrado, con margen de respiración equilibrado y jamás pegado a los bordes.
