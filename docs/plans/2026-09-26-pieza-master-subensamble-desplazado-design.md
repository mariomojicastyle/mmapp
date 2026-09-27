# Documento de Diseño: Subensambles Desplazados y Acople por Pieza Master

**Fecha:** 2026-09-26  
**Módulo:** 3dBimFab / Manual 3D Studio (Modo Múltiple Plus)  
**Estado:** Aprobado para Implementación  

---

## 1. Contexto y Justificación DfMA

En el flujo de fabricación y ensamble de muebles RTA (*Design for Manufacturing and Assembly*), un mueble no se monta en un solo bloque continuo sobre el mismo punto del espacio:
* Un porcentaje del mueble (ej. 40%: división interior, laterales, correderas del casco) se arma en pasos iniciales y queda de pie o acostado en el banco de trabajo.
* En pasos posteriores (ej. Paso 04), se debe construir un **subensamble independiente** (ej. 60%: travesaños, zócalos, amarres o marcos).
* Si ese segundo subensamble se obligara a armarse directamente en sus coordenadas finales CAD del mueble armado:
  1. Se generaría solapamiento físico y visual con la estructura ya armada.
  2. El operario y la cámara 3D perderían visibilidad para explicar la inserción de tarugos y pernos en los cantos de los travesaños.
  3. No reflejaría la realidad de taller: el operario arma el subconjunto a un costado del banco y, una vez rígido, traslada el bloque completo para ensamblarlo con el resto del mueble.

---

## 2. Definición Técnica: La Pieza Master como "Datum" Local

La **Pieza Master** funge como el origen local (Datum de referencia) del subensamble:
1. **Desplazamiento Temporal en Banco ($\vec{\Delta}_{\text{offset}}$):**
   La Pieza Master y todos los tableros y herrajes asociados se arman con respecto a una posición desplazada:
   $$\vec{P}_{\text{banco}} = \vec{P}_{\text{CAD}} + \vec{\Delta}_{\text{offset}}$$
2. **Emparentamiento Rígido Solidario:**
   Las capas de tableros y herrajes cuyo destino sea la Pieza Master se trasladan e insertan en las coordenadas relativas a $\vec{P}_{\text{banco}}$.
3. **El Acople Final (Matrimonio de Ensambles):**
   En una ventana temporal final del paso ($t_{\text{acople}} \to t_{\text{acople}} + \Delta t_{\text{acople}}$), la Pieza Master y todas las piezas y herrajes solidarios viajan rígidamente desde $\vec{P}_{\text{banco}}$ hasta su coordenada final $\vec{P}_{\text{CAD}}$ en el mueble.

---

## 3. Esquema de Datos (`storeTypes.ts`)

En `CapaMultiplePlus`:

```typescript
export interface OffsetBancoCm {
  x: number; // Desplazamiento transversal en cm (ej: +40)
  y: number; // Desplazamiento vertical en cm (por defecto 0)
  z: number; // Desplazamiento longitudinal en cm (ej: +20)
}

export interface CapaMultiplePlus {
  id: string;
  nombre: string;
  visible?: boolean;
  colapsada?: boolean;
  tableros: TableroCapaPlus[];
  herrajes: HerrajeCapaPlus[];
  congelados: HerrajeCapaPlus[];
  bloquesHeredadosIds?: string[];
  bloquesHeredadosVisibles?: Record<string, boolean>;
  
  // 👑 Parámetros Pieza Master y Subensamble Desplazado
  piezaMaster?: string;
  offsetBancoCm?: OffsetBancoCm;
  tiempoAcopleSegundos?: number;
  duracionAcopleSegundos?: number;
}
```

---

## 4. Diseño de Interfaz (`CapaMultiplePlusCard.tsx`)

Cumpliendo con:
- **Tema Claro Primario:** "Tech Ethos" (`#0088AA` / `#0891B2`).
- **Tema Oscuro Secundario:** Azul `#1368AA` mate sin incandescencias.
- **Regla Estricta de Formas:** Cápsulas obligatorias (`rounded-full`) en todos los botones y selectores.

Al seleccionar una `Pieza Master`:
1. Se despliegan controles en cápsulas circulares:
   * **Desplazamiento (cm):** Inputs o botones rápidos `X: [ +40 ] cm`, `Z: [ 0 ] cm`.
   * **Tiempo de Acople:** Cápsula informativa editable con icono de enlace `🔗`: `Acople: [ t ] s` y duración `[ 2.0 ] s`.
   * **Cálculo Automático por Defecto:**
     $$t_{\text{acople}} = \text{duracionTotalPaso} - 2.5\text{ s}$$

---

## 5. Cinemática Three.js (`multiplePlusKinematics.ts`)

* **Fase 1 ($0 \to t_{\text{acople}}$):**
  Posición de descanso temporal de la Pieza Master y sus asociadas fijada en $\vec{P}_{\text{banco}}$.
  Los vectores de inserción de herrajes se calculan respecto a $\vec{P}_{\text{banco}}$.
* **Fase 2 ($t_{\text{acople}} \to t_{\text{acople}} + \Delta t_{\text{acople}}$):**
  Pistas de animación vectoriales interpoladas cúbicamente:
  - En $t = t_{\text{acople}}$: $\vec{P}_{\text{banco}}$
  - En $t = t_{\text{acople}} + \Delta t_{\text{acople}}$: $\vec{P}_{\text{CAD}}$
  - De $t_{\text{acople}} + \Delta t_{\text{acople}}$ hasta $t_{\text{fin}}$: posición fija en $\vec{P}_{\text{CAD}}$.
