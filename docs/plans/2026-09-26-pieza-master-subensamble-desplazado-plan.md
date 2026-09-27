# Plan de Implementación Detallado: Subensambles Desplazados y Acople por Pieza Master

**Fecha:** 2026-09-26  
**Rama:** `3BF_3_Tipos_de_Capas`  
**Objetivo:** Permitir el armado de un subensamble independiente (ej. 60% del mueble) desplazado en el banco de trabajo respecto al ensamble heredado, con traslación solidaria de acople ("matrimonio") hacia su coordenada final del mueble armado.

---

## Tareas de Implementación por Fases

### 🔹 Fase 1: Esquema de Datos y Métodos del Store
- [ ] **1.1 Actualizar Interfaces en `storeTypes.ts`**:
  * Definir `export interface OffsetBancoCm { x: number; y: number; z: number; }`.
  * Extender `CapaMultiplePlus` con:
    - `offsetBancoCm?: OffsetBancoCm;`
    - `tiempoAcopleSegundos?: number;`
    - `duracionAcopleSegundos?: number;`
- [ ] **1.2 Extender Métodos de Mutación en `manualMultiplePlusSlice.ts`**:
  * Implementar acción `actualizarOffsetBancoMasterPlus(pasoId: string, capaId: string, offset: Partial<OffsetBancoCm>)`.
  * Implementar acción `actualizarTiempoAcopleMasterPlus(pasoId: string, capaId: string, tiempo?: number, duracion?: number)`.
  * Persistir en caché local `guardarPasosEnCacheLocal`.

---

### 🔹 Fase 2: Motor Cinemático y Pistas de Animación (`multiplePlusKinematics.ts`)
- [ ] **2.1 Detección y Agrupación de Piezas por Pieza Master**:
  * Recopilar qué capas y piezas tienen como destino a la `Pieza Master` de una capa (o pertenecen a la misma capa de la Master).
  * Calcular el vector de desplazamiento en metros:
    $$\vec{\Delta}_{\text{offset}} = \left( \frac{\text{offset.x}}{100}, \frac{\text{offset.y}}{100}, \frac{\text{offset.z}}{100} \right)$$
- [ ] **2.2 Fase 1: Armado en Banco con Coordenadas Desplazadas**:
  * Si la capa tiene `offsetBancoCm`, la posición de destino de la Master y sus piezas dependientes es:
    $$\vec{P}_{\text{banco}} = \vec{P}_{\text{CAD}} + \vec{\Delta}_{\text{offset}}$$
  * Los herrajes asignados calculan sus puntos de inserción y aproximación relativos a $\vec{P}_{\text{banco}}$.
- [ ] **2.3 Fase 2: Pistas de Acople Solidario al Mueble CAD**:
  * Resolver el tiempo de acople $t_{\text{acople}}$ (valor configurado o por defecto $t_{\text{duracion}} - 2.5\text{ s}$) y duración $\Delta t_{\text{acople}}$ (2.0 s).
  * Para la Pieza Master y cada pieza/herraje del subensamble, generar pista `VectorKeyframeTrack` para `position`:
    - Desde $t = 0$ hasta $t = t_{\text{acople}}$: descansan o se ensamblan en $\vec{P}_{\text{banco}}$.
    - Desde $t = t_{\text{acople}}$ hasta $t = t_{\text{acople}} + \Delta t_{\text{acople}}$: interpolación suave de $\vec{P}_{\text{banco}} \to \vec{P}_{\text{CAD}}$.
    - Desde $t_{\text{acople}} + \Delta t_{\text{acople}}$ hasta el final del paso: descansan en $\vec{P}_{\text{CAD}}$.
  * Las escalas se mantienen en $1.0$ durante todo el acople.

---

### 🔹 Fase 3: Interfaz de Usuario en `CapaMultiplePlusCard.tsx`
- [ ] **3.1 Controles de Desplazamiento y Acople en la Fila de Pieza Master**:
  * Al seleccionar una `Pieza Master` (`👑 Peça X`), desplegar a su derecha:
    - Cápsula con controles de offset: `X: [ +/- cm ]` y `Z: [ +/- cm ]`.
    - Cápsula de tiempo de acople: icono `🔗`, input `Acople: [ s ]` y duración `[ s ]`.
  * Diseño estricto en cápsulas (`rounded-full`), tema Tech Ethos `#0088AA` (Light) y azul mate `#1368AA` (Dark), sin rectángulos redondeados.
- [ ] **3.2 Tooltips de Orientación CNC/Taller**:
  * Tooltips claros recordando los ejes de taller:
    - Eje X: Desplazamiento transversal (izquierda / derecha).
    - Eje Z: Desplazamiento longitudinal sobre el banco de trabajo.

---

### 🔹 Fase 4: Validación y Calidad
- [ ] **4.1 Verificación de Compilación TypeScript**:
  * Ejecutar `npx tsc --noEmit` en `3bf` y asegurar 0 errores.
- [ ] **4.2 Prueba Funcional en Cómoda Ravenna (Paso P04)**:
  * Asignar Pieza Master a una capa (ej. `Peça 10`).
  * Asignar un offset de prueba (ej. $+30\text{ cm}$ en X).
  * Reproducir la animación en el timeline y verificar visualmente en Three.js:
    1. Las piezas se arman desplazadas sin tocar el lateral vertical heredado.
    2. En el segundo de acople, el bloque entero viaja solidariamente y encaja en su posición final.
