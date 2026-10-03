# 📋 Plan de Implementación Técnica: Módulo de Nesting & Optimización de Corte Industrial (`Opti_Nesting`) en `3dBimFab`

> **Estado:** Documento Maestro de Ingeniería y Hoja de Ruta de Desarrollo  
> **Rama Git Activa:** `3BF_Nesting`  
> **Ecosistema:** `3dBimFab` (Next.js 14 App Router, Three.js, Zustand, TypeScript, Canvas 2D)  
> **Documento de Referencia Conceptual:** [`3BF/Opti_Nesting.md`](file:///c:/Desarrollo/mmapp/3BF/Opti_Nesting.md)

---

## 🎯 1. Resumen Ejecutivo y Objetivos Técnicos

El propósito de este plan es guiar la construcción paso a paso del nuevo módulo **`[ ✂️ Optimización ]`** dentro de la web app `3dBimFab`. 

### Principio de Diseño "Cero Fricción" (Fase 1 In-Memory):
- **Sin archivos intermedios:** No requiere exportar ni importar CSV o DXF para muebles modelados en `3dBimFab`.
- **Lectura en tiempo real:** Extrae automáticamente las piezas del modelo paramétrico activo en memoria (`use3BFStore`), reconociendo dimensiones ($L \times A \times E$), orientación de veta, material y mecanizados (barrenos).
- **Tríada de Motores:** Tres estrategias de manufactura intercambiables con un solo clic:
  1. **Seccionadora Industrial** (Corte Guillotina ortogonal en X/Y).
  2. **Celda Nesting CNC** (Mesa de vacío SCM Morbidelli X200 / fresado continuo 2D).
  3. **Madera Maciza & Ebanistería** (Simulación *Rip-first* / *Crosscut-first* y Pies Tablares PT).

---

## 🏗️ 2. Arquitectura de Software y Árbol de Componentes

Los nuevos archivos se ubicarán en `c:\Desarrollo\mmapp\3BF\`:

```
3BF/
├── app/
│   └── page.tsx                         <-- Nueva pestaña [ ✂️ Optimización ] en cabecera
├── components/
│   └── optimizacion/                    <-- Directorio dedicado del módulo
│       ├── OptimizadorPanel.tsx         <-- Contenedor principal del módulo
│       ├── OptimizadorHeader.tsx        <-- Selector de modos en cápsulas rounded-full
│       ├── OptimizadorParametrosBar.tsx <-- Inputs de lámina, kerf, refilado, fresa
│       ├── VisorLaminasCanvas.tsx       <-- Renderizador interactivo Canvas 2D/SVG
│       ├── ResumenMetricasCard.tsx      <-- Tarjeta de estadísticas (% merma, m lineales, PT)
│       └── ListaPiezasOptimizadas.tsx   <-- Tabla/Acordeón de piezas agrupadas por espesor
└── lib/
    └── optimizador/                     <-- Lógica matemática y algoritmos puros
        ├── tiposOptimizador.ts          <-- Interfaces y contratos TypeScript
        ├── useOptimizadorStore.ts       <-- Estado reactivo Zustand del módulo
        ├── extractorPiezasModelo.ts     <-- Extractor in-memory desde use3BFStore
        ├── guillotineOptimizer.ts       <-- Motor 1: Algoritmo Guillotina 2D
        ├── nestingCncOptimizer.ts       <-- Motor 2: Algoritmo Celda Nesting Morbidelli
        └── maderaMacizaOptimizer.ts     <-- Motor 3: Algoritmo Rip/Crosscut & Pies Tablares
```

---

## 📐 3. Contratos de Datos y Tipos TypeScript (`tiposOptimizador.ts`)

```typescript
export type ModoOptimizacion = "seccionadora" | "nesting_cnc" | "madera_maciza";
export type EstrategiaMadera = "rip_first" | "crosscut_first";

export interface PiezaCorte {
  id: string;
  nombre: string;            // Nombre canónico Grasshopper: "Peça 1", "Peça 2"...
  descripcion?: string;      // En español: "Lateral izquierdo", "Frente cajón"...
  largo: number;             // Milímetros
  ancho: number;             // Milímetros
  espesor: number;           // Milímetros (15, 12, 3...)
  cantidad: number;          // Unidades
  rotacionPermitida: boolean;// false si respeta veta estricta
  material?: string;         // "MDP Nogal", "MDF Blanco", etc.
  barrenosCount?: number;    // Conteo de mecanizados
}

export interface ConfiguracionLaminas {
  // Dimensiones del material bruto (tablero comercial o tablón)
  largoBruto: number;        // ej. 2440 mm
  anchoBruto: number;        // ej. 1830 mm
  espesorBruto: number;      // ej. 15 mm
  
  // Parámetros de máquina
  kerfSierra: number;        // Modo 1: Espesor de disco (3.2 a 4.4 mm)
  diametroFresa: number;     // Modo 2: Diámetro fresa de compresión (10 o 12 mm)
  refiladoMargen: number;    // Margen perimetral de saneamiento (10 a 15 mm)
  
  // Parámetros de Madera Maciza (Modo 3)
  estrategiaMadera: EstrategiaMadera;
  costoPorPieTablar?: number;
}

export interface PiezaColocada {
  piezaId: string;
  nombre: string;
  x: number;                 // Coordenada X dentro de la lámina (mm)
  y: number;                 // Coordenada Y dentro de la lámina (mm)
  ancho: number;             // Ancho final posicionado
  largo: number;             // Largo final posicionado
  rotada: boolean;           // Si se giró 90 grados
}

export interface LaminaResultado {
  indice: number;
  espesor: number;
  material: string;
  anchoTotal: number;
  largoTotal: number;
  piezas: PiezaColocada[];
  areaTotalMm2: number;
  areaUtilizadaMm2: number;
  porcentajeAprovechamiento: number;
  porcentajeDesperdicio: number;
  metrosLinealesCorte: number;
  
  // Métrica exclusiva Madera Maciza
  piesTablaresBrutos?: number;
  piesTablaresNetos?: number;
}

export interface ResultadoOptimizacionGlobal {
  modo: ModoOptimizacion;
  laminas: LaminaResultado[];
  totalLaminas: number;
  aprovechamientoPromedio: number;
  tiempoCalculoMs: number;
  piezasNoColocadas: PiezaCorte[];
}
```

---

## ⚙️ 4. Desglose de Fases de Implementación Técnica

### 🚀 FASE 1: Núcleo Nativo In-Memory (Prioridad Actual)

#### Hito 1.1: Conexión de Estado & Extractor Paramétrico
- **Objetivo:** Tomar el objeto `resultado` y `piezas` que entrega RhinoCompute en `use3BFStore` y normalizarlos a la interfaz `PiezaCorte[]`.
- **Archivo:** `3BF/lib/optimizador/extractorPiezasModelo.ts`.
- **Criterio de Aceptación:**
  * En Cómoda Ravenna, debe detectar automáticamente los grupos de espesor:
    - Espesor $15\text{ mm}$: Laterales, Techo, Base, Montante central, Zócalos, Frentes cajón.
    - Espesor $12\text{ mm}$: Gualderas (laterales y traseras) de gavetas.
    - Espesor $3\text{ mm}$: Traseras del mueble y fondos de gavetas.
  * Respetar automáticamente la veta de los tableros verticales y frentes.

#### Hito 1.2: Shell de Interfaz de Usuario (UI Canónica Tech Ethos / Obsidian)
- **Objetivo:** Integrar la pestaña `[ ✂️ Optimización ]` en la barra de navegación de `3bf/app/page.tsx` con soporte para temas Claro y Oscuro.
- **Archivos:**
  * `3BF/components/optimizacion/OptimizadorPanel.tsx`
  * `3BF/components/optimizacion/OptimizadorHeader.tsx`
- **Criterio de Aceptación:**
  * Selector de Modo en cápsulas puras `rounded-full`:
    - `[ 🪚 Seccionadora (Guillotina) ]`
    - `[ 🌀 Celda Nesting CNC (Morbidelli) ]`
    - `[ 🪵 Madera Maciza (Rip/Cross) ]`
  * Indicador de piezas cargadas en tiempo real (*"13 piezas detectadas de Cómoda Ravenna"*).
  * Paleta visual: `#0088AA` en Tech Ethos (Light) y `#1368AA` mate sin incandescencias en Obsidian (Dark).

#### Hito 1.3: Motor 1 - Algoritmo de Guillotina 2D (`guillotineOptimizer.ts`)
- **Objetivo:** Algoritmo determinista de corte de lado a lado (*Guillotine 2D Strip Packing*).
- **Lógica de Partición:**
  1. Aplicar refilado perimetral (*trim*: 10 mm) reduciendo el área útil del tablero.
  2. Clasificar piezas por área descendente (*Best Short Side Fit*).
  3. Al ubicar una pieza en una sub-área rectangular libre, se realiza una incisión de guillotina que divide el espacio remanente en dos rectángulos nuevos (horizontal o verticalmente).
  4. Respetar el espesor de disco de sierra (*kerf*: 3.5 mm) en cada partición.
- **Criterio de Aceptación:**
  * Ningún corte puede exigir "paradas intermedias de disco".
  * Rendimiento medido superior al 85% en tableros estándar de MDP 15 mm.

#### Hito 1.4: Motor 2 - Algoritmo Celda Nesting CNC Morbidelli X200 (`nestingCncOptimizer.ts`)
- **Objetivo:** Distribución continua de piezas sobre tablero de sacrificio sin restricción de guillotina.
- **Lógica de Anidado:**
  1. Separación paramétrica entre contornos igual a $\text{Diámetro de Fresa} + \text{Margen}$ (ej. $10\text{ mm} + 2\text{ mm} = 12\text{ mm}$).
  2. Búsqueda de empaquetamiento 2D continuo utilizando cajas envolventes orientadas (OBB).
  3. Detección de piezas pequeñas ($< 0.08\text{ m}^2$) para marcarlas con *flag* de puente de sujeción (*onion skin*).
- **Criterio de Aceptación:**
  * Aprovechamiento superior al de la seccionadora en muebles con múltiples piezas de formatos dispares.
  * Lista de mecanizados lista para secuenciar: taladros $\to$ ranuras $\to$ contornos perimetrales.

#### Hito 1.5: Motor 3 - Madera Maciza & Ebanistería (`maderaMacizaOptimizer.ts`)
- **Objetivo:** Simulación de aserrado de tablones naturales en listonería y piezas curvas con cubicación comercial.
- **Lógica de Proceso:**
  1. Modo **Rip-First:** Dividir el tablón bruto a lo largo en tiras longitudinales del ancho requerido y luego trocear a largo.
  2. Modo **Crosscut-First:** Trocear transversalmente a largos nominales y luego perfilar al ancho.
  3. Cálculo automático en **Pies Tablares (PT)**:
     $$\text{PT} = \frac{E(\text{mm}) \times A(\text{mm}) \times L(\text{mm})}{2.359.737}$$
- **Criterio de Aceptación:**
  * Indicador comparativo en vivo de aprovechamiento: *Rip-First* vs *Crosscut-First* para que el usuario elija la estrategia más rentable en segundos.

#### Hito 1.6: Visor Interactivo Canvas 2D (`VisorLaminasCanvas.tsx`)
- **Objetivo:** Renderizado gráfico ultra-rápido de cada lámina optimizada.
- **Características:**
  * Visualización a escala con zoom y paneo continuo mediante rueda del mouse.
  * Etiquetas de texto en cada pieza con su nombre canónico (`Peça 1`, `Peça 2`...) y dimensiones exactas ($L \times A$).
  * Resaltado del sentido de veta con líneas tenues direccionales.
  * Trazos de corte diferenciados: líneas rojas continuas para seccionadora (guillotina) y contornos cian con offset de fresa para celda CNC.
  * Selector de láminas en píldoras: `[ Lámina 1 (15mm) ]`, `[ Lámina 2 (15mm) ]`, `[ Lámina 3 (12mm) ]`, etc.

---

### 📦 FASE 2: Interoperabilidad Externa (CSV & DXF) — [COMPLETADA Y VALIDADA ✅]
* **Hito 2.1:** Parser de CSV genérico con mapeo inteligente de columnas (`Largo`, `Ancho`, `Espesor`, `Cantidad`, `Veta`), detección de delimitadores y descarga de plantilla de ejemplo en 1 clic.
* **Hito 2.2:** Lector de polilíneas y capas DXF 2D (`LWPOLYLINE`) para importar siluetas curvas y piezas geométricas 2D con cálculo de Bounding Box.
* **Hito 2.3:** Modal interactivo Drag & Drop (`ModalImportarCorte.tsx`) y selector dinámico de origen de datos (`[ Modelo 3D ]` vs `[ Archivo Externo ]`).

---

### 🏭 FASE 3: Salida Industrial a Taller — [COMPLETADA Y VALIDADA ✅]
* **Hito 3.1:** Generador de Fichas Técnicas de Corte en PDF imprimibles para taller con membrete oficial canónico 3dBimFab (`Logo_3BF.svg`), código QR de trazabilidad de producción en Base64, diagramas vectoriales SVG a escala por lámina, líneas de corte guillotina/anidado, tabla de despiece completa (dimensiones, rotación, flags de Onion Skin) y fallback automático ante bloqueadores de ventanas emergentes.
* **Hito 3.2:** Exportador de programas de mecanizado G-Code estándar (`.nc`) para routers CNC con velocidades de avance F6000 mm/min, husillo 18000 RPM, retracciones de seguridad Z25.0 mm, penetración en tablero de sacrificio y empaquetado multi-lámina en `.zip` vía JSZip.
* **Hito 3.3:** Exportador nativo de scripts `.xcs` para el entorno Xilog Plus y Maestro Lab en celdas de nesting con mesa de vacío SCM Morbidelli X200 (empaquetado multi-lámina en `.zip`).
* **Hito 3.4:** Integración visual y funcional en cápsulas puras (`rounded-full`) en `OptimizadorHeader` (botón rápido Ficha PDF) y `ResumenMetricasCard` (suite completa de exportación PDF, G-Code y Morbidelli).

---

## 🧪 5. Protocolo de Pruebas y Validación (Checklist de Calidad)

- [x] **Compilación TypeScript:** Ejecución incondicional de `npx tsc --noEmit` en `c:\Desarrollo\mmapp\3BF` con **0 errores**.
- [x] **Modelo de Referencia Cómoda Ravenna:**
  - 13 tipos de piezas cargadas desde el `.ghx` real en vivo sin caché congelado.
  - Correcta segregación en al menos 2 espesores distintos ($15\text{ mm}$ y $12\text{ mm}$).
  - Respeto del sentido de veta vertical en los laterales (`Peça 6`, `Peça 7`).
- [x] **Integridad Geométrica:**
  - Verificación matemática de colisiones: ninguna pieza puede solaparse con otra ni rebasar los límites del tablero menos el refilado perimetral.
  - Distancia inter-piezas igual o mayor al kerf o diámetro de fresa configurado.
- [x] **Ergonomía de Interfaz:** Cápsulas `rounded-full` en todos los interactivos y compatibilidad con tema Claro (Tech Ethos `#0088AA`) y Oscuro (Obsidian `#1368AA` mate).
- [x] **Exportación Industrial:**
  - Generación de Ficha Técnica PDF con membrete vectorial y QR funcional.
  - Descarga unitaria y multi-lámina (.zip) de archivos G-Code (`.nc`) y Morbidelli (`.xcs`).
