# 📐 Opti_Nesting: Motor Paramétrico de Nesting & Optimización de Corte Industrial (`3dBimFab`)

> **Regla Canónica de Marca:** La suite y motor paramétrico se escribe **SIEMPRE Y SIN EXCEPCIÓN** como **`3dBimFab`** (d minúscula, B mayúscula, F mayúscula: `3` + `d` + `Bim` + `Fab`).
> 
> **Pestaña de Acceso en la Web App:** `[ ✂️ Optimización ]` en la barra superior de navegación de `3bf/app/page.tsx`.
> 
> 📋 **Documento Técnico de Implementación:** [`PLAN_IMPLEMENTACION_NESTING.md`](file:///c:/Desarrollo/mmapp/3BF/PLAN_IMPLEMENTACION_NESTING.md) (Hoja de ruta por fases, contratos TypeScript y arquitectura de componentes).

---

## 🧭 1. Visión y Propósito del Módulo

El módulo **Opti_Nesting** de `3dBimFab` cierra la brecha entre el diseño paramétrico 3D y la planta de manufactura digital. Su objetivo es transformar automáticamente el listado de componentes, medidas, espesores, geometrías 2D, sentidos de veta y barrenos del modelo activo en **patrones de corte y maquinado de máximo aprovechamiento de material**.

### ⚡ Principio de Autosuficiencia In-Memory (Fase 1)
A diferencia de los optimizadores tradicionales que exigen importar tablas CSV o dibujos DXF manuales, **`3dBimFab` ya contiene toda la geometría en memoria viva**:
- Dimensiones milimétricas exactas (Largo $\times$ Ancho $\times$ Espesor).
- Dirección de veta de cada pieza calculada según la orientación del tablero.
- Ubicación concéntrica de todos los barrenos, cajeados y mecanizados.
- Clasificación canónica por pieza nativa de Grasshopper (`Peça 1` a `Peça 13`...).

---

## 🧩 2. La Tríada Canónica de Modos de Corte

Para cubrir la totalidad del espectro productivo mueblero, el optimizador integra tres motores de cálculo especializados e independientes, seleccionables mediante cápsulas circulares puras `rounded-full`:

```
                 ┌───────────────────────────────────────────────────────────┐
                 │             Pestaña [ ✂️ Optimización ] en 3dBimFab         │
                 │            (Selector en Cápsulas rounded-full)            │
                 └──────┬──────────────────────┬──────────────────────┬──────┘
                        │                      │                      │
           ┌────────────▼──────────┐ ┌─────────▼─────────┐ ┌──────────▼────────────┐
           │   MODO 1: SECCIONADORA │ │   MODO 2: NESTING   │ │   MODO 3: MADERA      │
           │   INDUSTRIAL          │ │   CELDA CNC MORB.   │ │   MACIZA / CILA       │
           │  (Corte Guillotina)   │ │  (Mesa de Vacío)    │ │  (Rip/Cross & PT)     │
           └───────────────────────┘ └─────────────────────┘ └───────────────────────┘
```

---

### 🪚 MODO 1: Seccionadora Industrial (Corte Guillotina Ortogonal)

* **Maquinaria Destino:** Sierras seccionadoras horizontales y verticales de corte continuo (Biesse Selco, Homag SAWTEQ, Giben, SCM Gabbiani, sierras de banco convencionales).
* **Material Base:** Tableros aglomerados y calibrados (MDP, MDF, Melamina, Triplex/Compensado) en formatos comerciales estándar:
  - $2440 \times 1830\text{ mm}$ ($8' \times 6'$)
  - $2750 \times 1830\text{ mm}$
  - $2440 \times 1220\text{ mm}$ ($8' \times 4'$)
* **Restricción Física Inmutable:** **Corte de extremo a extremo** de la lámina (Cortes tipo guillotina). 
  - La sierra circular corta linealmente toda la franja del material.
  - La descomposición se organiza por fases estrictas: **Corte Primario (Fase 1)** $\to$ **Corte Secundario (Fase 2)** $\to$ **Troceado Final (Fase 3)**.
  - **No permite:** Piezas encastradas en L, vaciados internos ni siluetas curvas en este paso de aserrado.
* **Algoritmo Matemático:** *2D Guillotine Strip Packing Problem* (Heurísticas combinatorias: *Best Area Fit - BAF*, *Best Short Side Fit - BSSF*, y *Maximal Rectangles*).
* **Parámetros de Taller:**
  - **Espesor de Hoja de Sierra (*Kerf*):** Paramétrico de $3.2\text{ mm}$ a $4.4\text{ mm}$ (pérdida de material en cada pasada de corte).
  - **Refilado Perimetral (*Trim Margin*):** Paramétrico de $10\text{ mm}$ a $15\text{ mm}$ en los 4 bordes del tablero para sanear golpes, suciedad y desalineaciones de transporte.
  - **Respeto de Veta (*Grain Alignment*):** Bloqueo de rotación a $0^\circ / 180^\circ$ para piezas melamínicas o de chapa con sentido de veta visible; rotación libre a $90^\circ$ para piezas lisas o fondos ocultos.

---

### 🌀 MODO 2: Celda Nesting CNC (Mesa de Vacío SCM Morbidelli X200 / Rover B FT)

* **Maquinaria Destino:** Centros de mecanizado CNC de nesting industrial con mesa de sacrificio (*spoilboard*) y bombas de vacío de alta succión:
  - **SCM Morbidelli X200** (Referencia de taller: Serial `AA10007313`, software Maestro Lab / Xilog).
  - **Biesse Rover B FT**, **Homag CENTATEQ N-500/N-600**.
* **Material Base:** Lámina entera cruda o melamínica colocada directamente sobre la mesa de sacrificio de MDF transpirable.
* **Filosofía Operativa (Ciclo Continuo Total en 1 Sola Estación):**
  A diferencia de la seccionadora, la máquina realiza **todas las operaciones en un único amarre**:
  1. **Taladrado Vertical:** El cabezal de taladro múltiple ejecuta todos los barrenos de ensamble (tarugos, pernos minifix, bisagras, confirmats) sobre la cara superior.
  2. **Ranurado y Cajeados:** Fresa de ranurar realiza las ranuras de fondos de cajón y traseras de mueble.
  3. **Fresado Perimetral (Corte de Contornos):** Fresa helicoidal de compresión (10 mm o 12 mm de diámetro) corta el perímetro de cada pieza sin restricciones ortogonales.
* **Algoritmo Matemático:** *2D Irregular Polygon Nesting / No-Fit Polygon (NFP)*:
  - Permite empaquetar piezas rectangulares y siluetas con curvas complejas, chaflanes y vaciados internos.
  - Optimización por envolventes orientadas (Oriented Bounding Boxes - OBB).
* **Parámetros Críticos de Nesting:**
  - **Diámetro de Fresa (*Tool Diameter*):** $10.0\text{ mm}$ o $12.0\text{ mm}$ (distancia mínima de separación entre piezas contiguas).
  - **Márgenes de Succión:** Margen de seguridad perimetral de $8\text{ mm}$ a $12\text{ mm}$ en la lámina.
  - **Pestañas de Retención / Sujeción (*Tabs / Onion Skin*):** 
    - Para piezas pequeñas (ej. frentes de cajón estrechos o tapas que midan menos de $0.08\text{ m}^2$) que corren riesgo de levantarse o salir disparadas al perder el área de vacío.
    - El software deja una membrana residual (*onion skin*) de $0.5\text{ mm}$ a $1.0\text{ mm}$ en la primera pasada y la retira en una pasada final rápida a baja carga lateral.
  - **Orden de Corte:** Las piezas interiores y más pequeñas se mecanizan primero mientras la lámina aún conserva su rigidez estructural máxima.

---

### 🪵 MODO 3: Madera Maciza & Ebanistería (CILA Jamar / Sillas, Comedores y Estructuras)

* **Material Base:** Tablones, tablillas, cuartones y listonería de madera natural aserrada (Roble, Cedro, Teca, Pino Pátula, Flor Morado, Eucalipto Grandis).
* **Realidad de Planta (DfMA Madera Natural):**
  - La madera natural no se suministra en láminas rectangulares perfectas de $2440 \times 1830\text{ mm}$.
  - Los tablones presentan **anchos variables** ($4''$, $6''$, $8''$, $10''$, $12''$), **largos dispares** ($8\text{ pies}$, $10\text{ pies}$, $12\text{ pies}$), alburas, nudos y rajaduras en cabeceras.
* **Estrategias de Aserrado Industrial:**
  1. **Estrategia *Rip-First* (Aserrado Longitudinal Primero):**
     - El tablón completo se asierra primero longitudinalmente a lo largo de toda su extensión en listones del ancho requerido, y luego cada listón se trocea transversalmente a las longitudes finales de cada pieza.
     - **Aplicación:** Listonería continua, largueros de camas, molduras, chambranas y piezas con fibras largas estructurales.
  2. **Estrategia *Crosscut-First* (Troceado Transversal Primero):**
     - El tablón se despunta y corta transversalmente a largos nominales predeterminados (eliminando grietas o nudos en los extremos), y posteriormente cada trozo se desorilla y corta al ancho requerido.
     - **Aplicación:** Paneles alistonados para tapas de mesa (*finger-joint*), frentes de gaveta de madera sólida y piezas cortas de alta pureza estética.
* **True Shape Nesting para Sillería y Formas Curvas:**
  - En sillas de comedor y sillones (ej. patas traseras curvas estilo Thonet o reina Ana, respaldos anatómicos, copetes y travesaños curvos), las piezas no son ortogonales.
  - El algoritmo empareja las siluetas curvas en **cuñas contrapuestas** ($A \cup B$ invertida a $180^\circ$) para reducir la merma de madera maciza del habitual 45-55% a menos del 22-28%.
* **Métrica Oficial de Cubicación: Pies Tablares (PT):**
  $$\text{PT} = \frac{\text{Espesor (pulgadas)} \times \text{Ancho (pulgadas)} \times \text{Largo (pies)}}{12}$$
  O en sistema métrico internacional:
  $$\text{PT} = \frac{E(\text{cm}) \times A(\text{cm}) \times L(\text{metros}) \times 0.424}{100} = \frac{E(\text{mm}) \times A(\text{mm}) \times L(\text{mm})}{2.359.737}$$
* **Indicadores de Rendimiento:**
  - $\text{Volumen Neto de Piezas (PT)}$ vs $\text{Volumen Bruto Requerido de Tablones (PT)}$.
  - **Factor de Merma / Rendimiento (%):** $\frac{\text{PT Neto}}{\text{PT Bruto}} \times 100$.
  - Conversión directa y simultánea a metros cúbicos ($m^3$) para costeo de materia prima en planta.

---

## 🗺️ 3. Hoja de Ruta por Fases de Desarrollo

| Fase | Alcance y Entregables | Estado |
| :--- | :--- | :--- |
| **Fase 1** | **Núcleo Nativo In-Memory (Tríada Completa en `3dBimFab`)**: <br>• Pestaña `[ ✂️ Optimización ]` con selector en cápsulas `rounded-full`.<br>• Extracción automática de piezas paramétricas del modelo activo.<br>• Motor de Seccionadora Guillotina 2D (algoritmo en TypeScript puro).<br>• Motor de Nesting Celda CNC Morbidelli X200 con fresa de 10-12 mm.<br>• Motor de Madera Maciza con *Rip-first* / *Crosscut-first* y cálculo en Pies Tablares (PT).<br>• Visor 2D interactivo en Canvas/SVG con rótulos, vetas y resumen de aprovechamiento. | 🚀 **En Implementación (Rama: `3BF_Nesting`)** |
| **Fase 2** | **Interoperabilidad Universal Externa**: <br>• Ingestión y parsing de archivos CSV externos para muebles no modelados en 3dBimFab.<br>• Parser de geometrías y siluetas curvas en formato DXF 2D.<br>• Interfaz de mapeo de columnas y corrección rápida de medidas. | 📋 Planificada |
| **Fase 3** | **Exportación Industrial & Postprocesadores CNC**: <br>• Fichas técnicas de corte en PDF con membrete oficial (`Logo_3BF.svg`), diagramas y códigos QR por pieza.<br>• Generador de G-Code estándar para routers CNC.<br>• Exportación de scripts y macros compatibles con SCM Xilog/Maestro Lab (`.xcs`, `.tchx`). | 📋 Planificada |

---

## 🎨 4. Estándares Visuales y Reglas de Interfaz (UI/UX)

1. **Cápsulas Obligatorias (`rounded-full`):** 
   - Prohibido el uso de rectángulos con bordes redondeados (`rounded-lg`, `rounded-xl`, etc.) en botones, badges, selectores o píldoras de acción.
   - Todos los selectores de modo y acciones de optimización deben usar `rounded-full` con terminaciones circulares puras.
2. **Paleta Canónica:**
   - **Tema Claro (Tech Ethos):** Azul cian `#0088AA` / `#0891B2` como color activo primario.
   - **Tema Oscuro (Obsidian):** Azul oficial `#1368AA` mate sin incandescencias fluorescentes ni resplandores neón.
3. **Nombres de Piezas:**
   - Fuente de Verdad: Nombres originales de Grasshopper (`Peça 1`, `Peça 2`...) visibles en las láminas y listados, acompañados de tooltips explicativos en español natural de taller.

---

## ⚡ 5. Benchmark Industrial & Fricción Psicológica (ROI B2B)

| Métrica / Parámetro | Software de Escritorio Tradicional (MaxCut / Deepnest) | Motor Cloud `3dBimFab` (Strip-Packing Multi-Semilla) |
| :--- | :--- | :--- |
| **Tiempo de Cálculo (Lote 50 cómodas - 2,650 piezas)** | **3 a 5 minutos** (proceso local bloqueante monohilo) | **283 milisegundos (0.28 seg)** (148 iteraciones in-memory) |
| **Fricción Psicológica en Planta** | **Pérdida de 15 a 20 minutos:** El operario saca el celular (WhatsApp, redes) durante la espera y la máquina queda inactiva. | **0 minutos de espera:** El resultado es instantáneo, manteniendo el ritmo y foco del operario en el banco de corte. |
| **Aprovechamiento de Material** | 78 tableros (16.46% de merma en MaxCut) | **75 tableros (12.9% de merma)** (+3 tableros salvados por lote) |
| **Conexión Paramétrica CAD/3D** | Nula. Requiere exportar/importar archivos CSV o DXF manuales. | **100% nativa:** Los cambios de medidas en 3D recalculan el corte de inmediato. |

* **Activo Gráfico Vectorial para Presentaciones B2B y LinkedIn:** [`publicidad/versus_optimizador_escritorio_vs_3dbimfab.svg`](file:///c:/Desarrollo/mmapp/publicidad/versus_optimizador_escritorio_vs_3dbimfab.svg)
* **Visor Interactivo Web:** [`publicidad/preview_versus_optimizador.html`](file:///c:/Desarrollo/mmapp/publicidad/preview_versus_optimizador.html)
