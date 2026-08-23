# 🏗️ Guión e Historia de 3dBimFab para Storyboard Studio & Screencast

Este documento contiene la estructura completa del guión de concepto, los prompts cinematográficos para **Storyboard Studio** de Google Flow, las pautas de grabación de pantalla (**Screencasts en 3dBimFab**), la nomenclatura de archivos físicos, el guión de locución (Voiceover) cronometrado y el texto limpio para el generador de voz (TTS).

---

## 📝 1. Concepto General del Guión (Pega esto en la pestaña "Script")

Comercial corporativo de 55 a 65 segundos presentando **3dBimFab**, el motor de manufactura digital paramétrica de Mario Mojica para la industria del mueble. Te explico mi concepto:

El video contrasta la dolorosa ineficiencia de la ingeniería de muebles tradicional frente a la velocidad instantánea de la manufactura 4.0 en el navegador web. Abrimos en una oficina técnica de una fábrica de muebles: planos de papel acumulados, ingenieros redibujando cotas a contrarreloj en AutoCAD y calculando costos manualmente en hojas de Excel densas y propensas al error. Corte a la planta: una máquina CNC detenida esperando archivos de corte. Texto en pantalla: *"¿Por qué modificar un mueble sigue tomando 3 días?"*. Corte dinámico a la pantalla limpia de 3DBimFab en modo Tech Ethos: el usuario arrastra un componente paramétrico al visor 3D WebGL a 60 FPS; ajusta un slider de ancho y profundidad, y en tiempo real la geometría tridimensional, los herrajes Minifix y los barrenos se recalculan instantáneamente. Corte a la herramienta magnética: con un atajo de teclado (`G` + `B`), las piezas se atraen y ensamblan magnéticamente en el espacio. El usuario presiona *"⚡ Perforar Mueble"*: el algoritmo DfMA detecta las colisiones espaciales e inyecta las perforaciones de tarugos y pernos entre tableros vecinos en milisegundos. Corte a la Ficha de Despiece & Costos: en un clic, vemos la lista de corte milimétrica (BOM), el inventario exacto de herrajes consolidados y la Ficha Financiera Industrial liquidada al 100.00% (Materia Prima Novopan/Arauco + Mano de Obra + CIF). El usuario presiona *"Exportar DXF para Seccionadora CNC"*: se descarga el archivo multicapa normalizado para Biesse Skipper. Corte final a la planta hiper-automatizada: el centro de mecanizado CNC corta y taladra el tablero con precisión láser. Cierre: el visor 3D rota suavemente con iluminación PBR realista y transiciona al logotipo 3D de "3DBimFab — Powered by Mario Mojica".

Estilo visual: híbrido de alta gama. Alternancia entre tomas cinematográficas fotorrealistas de fábrica industrial 4.0 (luces de taller, chispas, brazos robóticos y CNC cortando tableros de melamina) y capturas de pantalla ultra-nítidas (Screencasts 4K / 60 FPS) de la interfaz de 3DBimFab (tema claro Tech Ethos, líneas vectoriales nítidas y movimientos de cursor fluidos y seguros).

Sonido: diseño sonoro industrial contemporáneo y rítmico. Teclados mecánicos sutiles, el siseo del raycast magnético en Three.js (*whoosh* suave), el sonido de un chasquido (*snap*) cuando las piezas se atraen magnéticamente, el zumbido potente y limpio de la fresa diamantada de la CNC cortando madera y una base musical electrónica corporativa moderna (estilo Apple/Tesla Keynote) que genera dinamismo y precisión.

Cierre de audio: "3DBimFab. El diseño paramétrico conectado directamente a la fábrica de manufactura."

---

## 🎬 2. Desglose de Tomas Híbridas (Google Flow + Screencasts)

### **Bloque 1: El Cuello de Botella de la Industria Tradicional**
*   **01. [Google Flow] Ineficiencia en Oficina Técnica (5s)** ➔ `Slow camera dolly over a cluttered engineering office in a furniture factory. Stacks of paper technical blueprints, messy desk, coffee mugs, flickering fluorescent light, stressed CAD engineer staring at complex wireframe drawings on an old monitor. Cinematic, moody industrial lighting.`
*   **02. [Google Flow] La Fábrica en Espera (4s)** ➔ `Low-angle tracking shot of a high-tech CNC industrial machining center sitting idle in a modern furniture factory. Blinking amber warning lights, clean polished concrete floor, dust motes in sunbeams. Cinematic, high contrast.`

### **Bloque 2: El Despertar de 3DBimFab & Modelado Paramétrico Web**
*   **03. [Screencast] Inserción & Drag and Drop 3D (5s)** ➔ *Grabación de pantalla real en 3DBimFab (Tema Tech Ethos): El cursor arrastra un componente `Cubierta` desde la Biblioteca de Componentes al visor 3D WebGL; la pieza cae y se alinea al suelo con un suave rebote a 60 FPS.*
*   **04. [Screencast] Sliders Paramétricos en Tiempo Real (6s)** ➔ *Grabación de pantalla: El cursor mueve el slider `Ancho` de 498mm a 900mm y `Profundidad` a 500mm. La geometría 3D, las vetas de madera PBR y los pernos Minifix se recalculan y estiran en vivo sin parpadeos.*

### **Bloque 3: Cinemática DfMA, Grab, Snap Magnético & Mecanizado**
*   **05. [Screencast] Snap Base Point Magnético Estilo Blender (6s)** ➔ *Grabación de pantalla: El usuario presiona la tecla `G` (Grab) y `B` (Snap Base Point). Aparece el marcador naranja de vértice (□). Arrastra la pieza hacia el lateral del mueble; el snap magnético se activa y encaja las piezas con precisión milimétrica.*
*   **06. [Screencast] Botón Perforar Mueble Inter-Componentes (5s)** ➔ *Grabación de pantalla: Clic en el botón `⚡ Perforar Mueble` en el HUD 3D. Aparece el badge `Perforado (8)` mostrando los cilindros analíticos OpenNURBS intersectando los tableros.*

### **Bloque 4: La Ficha Financiera 100% & Exportación CAM DXF**
*   **07. [Screencast] Despiece, BOM y Costos Industriales (6s)** ➔ *Grabación de pantalla: Clic en la pestaña `Despiece & Costos`. La cámara hace scroll por la Tabla 1 (Lista de corte con cantos), Tabla 2 (Herrajes consolidados) y la Tabla 4 (Resumen Financiero 100%: MP 77.78%, MO 12.42%, CIF 9.80%).*
*   **08. [Screencast] Exportación DXF Multicapa para CNC (4s)** ➔ *Grabación de pantalla: Clic en `Exportar DXF para Seccionadora CNC`. Descarga instantánea de los archivos `.dxf` normalizados con capas Biesse Skipper (`TCHW0B8...`, `TCHW1B8D2500`).*

### **Bloque 5: Manufactura 4.0 en Planta & Cierre de Marca**
*   **09. [Google Flow] El CNC en Acción Real (6s)** ➔ `Extreme close-up of a high-speed diamond CNC router bit drilling precision Minifix holes into a melamine board. Fine wood dust extraction, bright LED work lights, water-mist cooling, ultra-fast robotic movement. Cinematic 4K slow motion.`
*   **10. [Google Flow] Transición Digital a Logotipo 3D (8s)** ➔ `Slow camera push-out. A glowing holographic 3D wireframe furniture model rotates smoothly, surrounded by dynamic blue numerical coordinates and CNC toolpaths. Transition into the glowing 3D metallic logo: "3DBimFab — Powered by MARIO MOJICA". Dark high-tech environment.`

---

## 📁 3. Nomenclatura de Archivos Físicos para el Editor de Video

Utiliza esta guía para nombrar tus archivos exportados (tanto los generados con Google Flow como los clips grabados con OBS / Capturadora):

### 🏭 Bloque 1: El Cuello de Botella
*   **Archivo:** `01_B1_Oficina_Ingenieria_Lenta.mp4` (5s) — *[Google Flow]*
*   **Archivo:** `02_B1_Fabrica_CNC_Detenida.mp4` (4s) — *[Google Flow]*

### 🌐 Bloque 2: Modelado Paramétrico Web
*   **Archivo:** `03_B2_Screencast_DragDrop_Componente.mp4` (5s) — *[Screencast 3DBimFab]*
*   **Archivo:** `04_B2_Screencast_Sliders_En_Caliente.mp4` (6s) — *[Screencast 3DBimFab]*

### 🧲 Bloque 3: Snap & Mecanizado Inter-Componentes
*   **Archivo:** `05_B3_Screencast_Snap_Magnetico_Blender.mp4` (6s) — *[Screencast 3DBimFab]*
*   **Archivo:** `06_B3_Screencast_Perforar_Mueble_HUD.mp4` (5s) — *[Screencast 3DBimFab]*

### 📊 Bloque 4: Costos 100% & Generador DXF
*   **Archivo:** `07_B4_Screencast_Ficha_Costos_BOM_100.mp4` (6s) — *[Screencast 3DBimFab]*
*   **Archivo:** `08_B4_Screencast_Descarga_DXF_CNC.mp4` (4s) — *[Screencast 3DBimFab]*

### 🚀 Bloque 5: Manufactura Real & Cierre
*   **Archivo:** `09_B5_Corte_CNC_Madera_Real.mp4` (6s) — *[Google Flow]*
*   **Archivo:** `10_B5_Holograma_Logo_3DBimFab.mp4` (8s) — *[Google Flow]*

---

## 🎙️ 4. Guión de Locución (Voiceover) Sincronizado por Tiempos

Este guión está adaptado para un tono enérgico, corporativo y tecnológico (aproximadamente 2.4 palabras por segundo):

### 🏭 Bloque 1: El Cuello de Botella (9s)
*   **01_B1_Oficina_Ingenieria_Lenta.mp4 (5s):**
    > *"En la industria del mueble, modificar las dimensiones de un producto toma días de redibujo manual..."*
*   **02_B1_Fabrica_CNC_Detenida.mp4 (4s):**
    > *"...frenando la producción y generando costosos errores humanos en planta."*

### 🌐 Bloque 2: Modelado Paramétrico Web (11s)
*   **03_B2_Screencast_DragDrop_Componente.mp4 (5s):**
    > *"Presentamos 3DBimFab: el motor de manufactura digital paramétrica que corre directamente en tu navegador."*
*   **04_B2_Screencast_Sliders_En_Caliente.mp4 (6s):**
    > *"Arrastra componentes inteligentes y ajusta cualquier medida. La geometría 3D, herrajes y barrenos se recalculan en milisegundos."*

### 🧲 Bloque 3: Cinemática DfMA & Mecanizado (11s)
*   **05_B3_Screencast_Snap_Magnetico_Blender.mp4 (6s):**
    > *"Con herramientas cinematográficas de ensamble magnético, une piezas con precisión milimétrica."*
*   **06_B3_Screencast_Perforar_Mueble_HUD.mp4 (5s):**
    > *"Y con un solo clic, el motor detecta colisiones y transfiere las perforaciones reales entre tableros."*

### 📊 Bloque 4: Ficha Financiera 100% & CAM DXF (10s)
*   **07_B4_Screencast_Ficha_Costos_BOM_100.mp4 (6s):**
    > *"Obtén al instante la lista de corte, el inventario consolidado y el costo total de fabricación al centavo."*
*   **08_B4_Screencast_Descarga_DXF_CNC.mp4 (4s):**
    > *"Exporta directamente los archivos DXF listos para tus centros de mecanizado CNC."*

### 🚀 Bloque 5: Manufactura Real & Cierre (14s)
*   **09_B5_Corte_CNC_Madera_Real.mp4 (6s):**
    > *"Elimina los cuellos de botella de ingeniería y conecta el diseño paramétrico a la fábrica."*
*   **10_B5_Holograma_Logo_3DBimFab.mp4 (8s):**
    > *"3DBimFab. La manufactura 4.0 impulsada por Mario Mojica."*

---

## 🎙️ 5. Texto Limpio para Generador de Voz (TTS)

### 🇪🇸 Versión en Español (Con Pausas Estructuradas)

```text
En la industria del mueble, modificar las dimensiones de un producto toma días de redibujo manual, 
frenando la producción y generando costosos errores humanos en planta. 
[pausa: 1]
Presentamos 3DBimFab: el motor de manufactura digital paramétrica que corre directamente en tu navegador. 
[pausa: 1]
Arrastra componentes inteligentes y ajusta cualquier medida. 
La geometría 3D, herrajes y barrenos se recalculan en tiempo real en milisegundos. 
[pausa: 1]
Con herramientas cinematográficas de ensamble magnético, une piezas con precisión milimétrica. 
Y con un solo clic, el motor detecta colisiones y perfora automáticamente los tableros vecinos. 
[pausa: 1]
Obtén al instante la lista de corte, el inventario consolidado y el costo total de fabricación al centavo, 
exportando directamente los archivos DXF listos para tus centros de mecanizado CNC. 
[pausa: 1]
Elimina los cuellos de botella de ingeniería y conecta el diseño paramétrico a la fábrica. 
[pausa: 1]
3DBimFab, la manufactura 4.0 impulsada por Mario Mojica.
```

---

### 🇧🇷 Versión en Portugués / Brasil (Traducción Optimizada con Mismas Pausas)

```text
Na indústria moveleira, modificar as dimensões de um produto leva dias de redesenho manual, 
travando a produção e gerando erros humanos caros na fábrica. 
[pausa: 1]
Apresentamos o 3DBimFab: o motor de manufatura digital paramétrica que roda direto no seu navegador. 
[pausa: 1]
Arraste componentes inteligentes e ajuste qualquer medida. 
A geometria 3D, ferragens e furações se recalculam em tempo real em milissegundos. 
[pausa: 1]
Com ferramentas cinemáticas de encaixe magnético, monte peças com precisão milimétrica. 
E com apenas um clique, o motor detecta colisões e fura automaticamente as chapas vizinhas. 
[pausa: 1]
Obtenha instantaneamente a lista de corte, o inventário consolidado e o custo total de fabricação no centavo, 
exportando diretamente os arquivos DXF prontos para seus centros de usinagem CNC. 
[pausa: 1]
Elimine os gargalos da engenharia e conecte o design paramétrico à fábrica. 
[pausa: 1]
3DBimFab, a manufatura 4.0 impulsionada por Mario Mojica.
```

---

## 📱 6. Copy para Redes Sociales (Post Publicado + Primer Comentario)

### 🇪🇸 Versión en Español

**Título Interno Opcional:** `¿Cuánto tiempo le toma a tu fábrica rediseñar un mueble y exportar sus planos CNC?`

**Texto del Post:**
```text
¿Cuánto tiempo le toma al equipo de ingeniería de tu fábrica modificar un mueble y generar sus planos CNC? ⏳🏭

En la manufactura tradicional: de 2 a 3 días redibujando en CAD, recalculando piezas y cuadrando costos en Excel.

Con 3DBimFab (3BF): 5 segundos en tu navegador web. ⚡

Arrastras el componente, mueves un slider y obtienes:
✅ Geometría 3D WebGL a 60 FPS con uniones Minifix y tarugos automáticos.
✅ Detección espacial de mecanizados y perforaciones inter-componentes.
✅ Lista de corte (BOM) y Ficha Financiera Industrial al 100%.
✅ Descarga instantánea de archivos CAM DXF listos para seccionadoras CNC.

La era del diseño paramétrico conectado directamente a la fábrica ya comenzó. 🚀

Mira 3DBimFab en acción en el video 👇
```

**Primer Comentario (Link a la Demo):**
```text
Conoce más sobre nuestra suite de software para manufactura aquí: https://mariomojica.com/demo 🚀
```

---

### 🇧🇷 Versión en Portugués / Brasil

**Título Interno Opcional:** `Quanto tempo sua fábrica leva para reprojetar um móvel e gerar os arquivos CNC?`

**Texto do Post:**
```text
Quanto tempo a equipe de engenharia da sua fábrica leva para modificar um móvel e gerar os arquivos CNC? ⏳🏭

Na manufatura tradicional: de 2 a 3 dias redesenhando em CAD, recalculando peças e fechando custos no Excel.

Com o 3DBimFab (3BF): 5 segundos direto no navegador web. ⚡

Você arrasta o componente, move um slider e obtém:
✅ Geometria 3D WebGL a 60 FPS com junções Minifix e cavilhas automáticas.
✅ Detecção espacial de usinagem e furações entre componentes.
✅ Lista de corte (BOM) e Ficha Financeira Industrial a 100%.
✅ Download instantâneo de arquivos CAM DXF prontos para seccionadoras e CNC.

A era do design paramétrico conectado diretamente à fábrica já começou. 🚀

Assista ao 3DBimFab em ação no vídeo 👇
```

**Primeiro Comentário (Link da Demo):**
```text
Saiba mais sobre a nossa suíte de software para manufatura aqui: https://mariomojica.com/demo 🚀
```




