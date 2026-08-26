# 📐 3DBimFab (3BF) — Memoria Técnica y Manual de Procesos

> **Documento:** `3BF/PROCESOS/proceso.md`  
> **Ecosistema:** 3DBimFab (3BF) — Mario Mojica  
> **Propósito:** Especificación de ingeniería, estándares de renderizado 3D y guía de recuperación rápida de algoritmos críticos del Visor 3D (Raycasting, Aristas y Shaders).

---

## 🎯 1. Sistema de Raycasting Óptico de Cámara (`HoverRaycastTracker`)

### 📌 1.1 Regla de Oro y Propósito
El tooltip / nube flotante con el nombre del componente o pieza (`Cubierta`, `Lateral`, `Perno Minifix`, `Tarugo`, `MDP`, etc.) **SOLO debe aparecer en el momento exacto en que la línea de visión de la cámara intersecta físicamente una geometría 3D**.
Si el puntero del mouse apunta hacia el vacío, la cuadrícula del suelo o el fondo del visor, el tooltip debe destruirse inmediatamente a 0 ms.

```
      [ Ojo / Cámara 3D ]
             │
             │ Rayo Óptico (Raycaster)
             ▼
   [ Vector Puntero NDC (x,y) ] ───► ¿Intersecta Mesh 3D?
                                            │
                       ┌────────────────────┴────────────────────┐
                       ▼                                         ▼
                     [ SÍ ]                                    [ NO ]
          Muestra Tooltip con Nombre                    setHoveredPiece(null)
          (Cubierta, Perno, etc.)                       (0ms Latencia / Vacío)
```

---

### 🔍 1.2 Por qué fallaba la implementación previa (Causas de Pérdida de Configuración)
1. **Persistencia por Clic en Listas/Tablas:** En componentes auxiliares (como `PartBreakdownPanel`), el evento `onClick` llamaba `setHoveredPiece(parte.nombreLimpio)`, dejando una variable estática en el store de Zustand que persistía aunque el usuario moviera el mouse hacia el suelo o fuera del lienzo.
2. **Colisión de Eventos en Mallas:** Colocar `onPointerOver` y `onPointerOut` individualmente dentro de cada `<mesh>` provocaba que al mover el cursor rápidamente, Three.js perdiera el evento de salida sobre mallas con aristas hijas (`lineSegments`), dejando el nombre "congelado".
3. **Bucle Incontrolado en `useFrame`:** Consultar el raycaster a 60 fps sobre `scene.children` sin filtrar generaba colisiones con líneas de rejilla y objetos invisibles, reactivando el tooltip en cada fotograma.

---

### 💻 1.3 Implementación Canónica y Código de Recuperación (Backup)

Ubicación: `Viewer3D.tsx` (Dentro del árbol `<Canvas>`).

```tsx
function HoverRaycastTracker({ furnitureGroup }: { furnitureGroup: THREE.Group | null }) {
  const { camera, scene, gl } = useThree();
  const { setHoveredPiece, modoTransformacion } = use3BFStore();

  React.useEffect(() => {
    const dom = gl.domElement;
    const raycaster = new THREE.Raycaster();
    const pointerNDC = new THREE.Vector2();

    const handlePointerMove = (e: PointerEvent) => {
      // Si está en modo grab (G) o transformación, suprimir tooltips
      if (modoTransformacion !== "none") {
        setHoveredPiece(null);
        return;
      }

      const rect = dom.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;

      // 1. Normalización de Coordenadas de Dispositivo (NDC: -1 a +1)
      pointerNDC.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      pointerNDC.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      // 2. Proyectar el rayo estrictamente desde la cámara activa
      raycaster.setFromCamera(pointerNDC, camera);

      // 3. Recolectar objetivos válidos (Mueble activo + Instancias del catálogo)
      const targets: THREE.Object3D[] = [];
      if (furnitureGroup) {
        targets.push(furnitureGroup);
      }
      if (typeof window !== "undefined" && (window as any).__3bfInstanceGroups) {
        const groupsMap: Map<string, THREE.Group> = (window as any).__3bfInstanceGroups;
        groupsMap.forEach((grp) => {
          if (grp) targets.push(grp);
        });
      }

      if (targets.length === 0) {
        setHoveredPiece(null);
        return;
      }

      // 4. Intersección con filtrado estricto de Mallas 3D
      const hits = raycaster.intersectObjects(targets, true);
      const validHit = hits.find((h) => {
        const obj = h.object;
        const n = (obj.name || "").toLowerCase();
        return (
          obj.type === "Mesh" &&
          obj.visible &&
          obj.name.length > 0 &&
          !n.includes("floor") &&
          !n.includes("grid") &&
          !n.includes("plane") &&
          !n.includes("axis") &&
          !n.includes("silhouette") &&
          !n.includes("helper")
        );
      });

      // 5. Asignación inmediata o Limpieza en Vacío
      if (validHit) {
        const pieceName = obtenerNombreUnificadoPieza(validHit.object);
        setHoveredPiece(pieceName);
      } else {
        setHoveredPiece(null);
        if (typeof window !== "undefined") {
          (window as any).__hoveredInstanceId = null;
        }
      }
    };

    // 6. Limpieza al salir del Canvas 3D
    const handlePointerLeave = () => {
      setHoveredPiece(null);
      if (typeof window !== "undefined") {
        (window as any).__hoveredInstanceId = null;
      }
    };

    dom.addEventListener("pointermove", handlePointerMove, { passive: true });
    dom.addEventListener("pointerleave", handlePointerLeave);

    return () => {
      dom.removeEventListener("pointermove", handlePointerMove);
      dom.removeEventListener("pointerleave", handlePointerLeave);
    };
  }, [camera, scene, gl, furnitureGroup, modoTransformacion, setHoveredPiece]);

  return null;
}
```

---

## 📐 2. Delineado de Aristas 3D y Soldado de Vértices en Caras Planas

### 📌 2.1 Regla de Oro
Las aristas técnicas (delineado negro tipo plano CAD / Rhino Technical) **deben resaltar únicamente los bordes y quiebres reales a 90° o cilindros de mecanizados, NUNCA líneas de triangulación o costuras diagonales sobre caras coplanares o planas (como los cantos entre tarugos y pernos)**.

### 🛠️ 2.2 Algoritmo de Soldado (`BufferGeometryUtils.mergeVertices`)
En operaciones booleanas de Grasshopper, los triángulos de una cara plana pueden tener vértices duplicados en los bordes de los orificios. Three.js los interpreta como bordes abiertos independientes ("boundary edges") y traza líneas a través de la cara plana.

Para eliminar estas líneas falsas:
```tsx
import * as BufferGeometryUtils from "three/examples/jsm/utils/BufferGeometryUtils.js";

// En useMemo de creación de aristas:
const indexedGeo = new THREE.BufferGeometry();
indexedGeo.setAttribute("position", new THREE.Float32BufferAttribute(vertices, 3));
indexedGeo.setIndex(indices);
indexedGeo.computeVertexNormals();

// 🛠️ Unificación y soldado de vértices coplanares
const weldedGeo = BufferGeometryUtils.mergeVertices(indexedGeo, 0.001);
weldedGeo.computeVertexNormals();

// Extracción limpia de aristas con ángulo umbral
const edges = new THREE.EdgesGeometry(weldedGeo, calibracion.thresholdAristas || 25);
```

---

## 🎨 3. Sincronización de Capas y Modos Visuales

| Modo Visual | Fuente de Color y Textura | Comportamiento |
| :--- | :--- | :--- |
| **🧱 Sólido (Solid View)** | `capaAsignada.color` | Cada pieza adopta exactamente el color de su capa (`COL`) en tiempo real. |
| **💎 Cristal (Transparent)** | `coloresApariencia.mallasCristal` | Semitransparencia técnica (52%) tipo acrílico/cristal. |
| **🌐 Renderizado (Render View)** | `materialPBR.colorBase` + `texturaUrl` | Texturas fotorealistas PBR con mapas difusos, rugosidad y metalicidad. |
| **📐 Líneas (Wireframe)** | Geometría Vectorial | Modo armazón de alambre. |

---

## 🎛️ 4. Control de Aristas en Panel Calibrar

El control de activación, color, opacidad y umbral de aristas reside exclusivamente en:
* **Pestaña lateral derecha:** `Calibrar` ➔ Sección `Aristas y Contornos`.
* **Propiedades de Rejilla (en Apariencia):** Reservado estrictamente para la configuración del suelo tridimensional (*Mostrar líneas de rejilla*, *Mostrar ejes de rejilla*, *Mostrar icono de ejes del plano universal*).

---

## ⚡ 5. Sistema DfMA de Perforación Inter-Componentes & CAM DXF desde OpenNURBS

### 📌 5.1 Principio Rector
Al acoplar módulos independientes (ej. Cajón dentro de Nicho, o Cubierta unida a otra Cubierta):
- Cada componente define sus fijaciones como **cilindros analíticos OpenNURBS** en Grasshopper (`.ghx`).
- **Cero Booleanos en Malla 3D:** Se evita hacer sustracciones booleanas destructivas en WebGL.
- **Intersección Espacial 3D (`/mecanizar-intercomponentes`):** El worker evalúa la posición mundial de los cilindros contra los tableros vecinos en escena ($25\text{ mm}$ de tolerancia).
- **Inyección en DXF CAM:** Las perforaciones transferidas se proyectan con $(u, v)$ milimétrico en las capas estandarizadas de Biesse Skipper (`TCHW0B2D1200` para $\varnothing 5$, `TCHW1B8D2500` para $\varnothing 8$, `TCHW0B15D1350` para $\varnothing 15$).

### 🛠️ 5.2 Botones de Control en Interfaz
* **`⚡ Perforar Mueble`:** Dispara el cómputo de intersecciones y registra las perforaciones en `mecanizadosCruzados`.
* **`🗑️ Limpiar`:** Elimina las perforaciones cruzadas cuando los módulos se separan o se mueven con Grab/Snap.
* **`Exportar DXF Seccionadora CNC`:** Genera el plano con los círculos transferidos integrados en sus capas de mecanizado.

---

---

## ⏪ 6. Historial de 100 Operaciones (Undo / Redo) & Renombrado Interactivo en HUD 3D

### ⌨️ 6.1 Atajos de Teclado Universales
* **`Ctrl + Z` / `Cmd + Z`**: Deshacer (Undo) hasta 100 operaciones hacia atrás en el tiempo.
* **`Ctrl + Y` / `Ctrl + Shift + Z`**: Rehacer (Redo) operaciones deshechas.
* **Capacidad de Historial:** 100 estados en memoria (`SnapshotEscenario` en `pilaHistorial`), registrando adición, borrado, duplicación, transformaciones espaciales (Grab/Snap), cambios de parámetros y renombrado.

### ✏️ 6.2 Renombrado Interactivo por Doble Clic en HUD
* En la lista jerárquica de componentes del HUD superior izquierdo (`• Cubierta`, `• Cubierta_01`), el usuario puede hacer **doble clic** sobre el nombre de cualquier componente para activar el editor de texto en línea (`<input />`).
* Al presionar `Enter` o perder el foco (`onBlur`), se ejecuta `renombrarInstancia(id, nuevoNombre)`, actualizando en cascada la ficha de despiece, tabla de costos y nombres de archivos DXF exportados.
* `Escape` cancela la edición sin alterar el estado.

---

> **Mantenimiento:** Ante cualquier descalibración en futuras iteraciones de Three.js / React Three Fiber o del Worker FastAPI, remitirse a las funciones documentadas en este archivo y en `3BF_Proceso.md` para restaurar el comportamiento canónico.

