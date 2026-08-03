# 🎛️ Guía Completa de Calibración de Renderizado 3D, Normales Vectoriales y Oclusión Z-Buffer

Este documento registra la arquitectura técnica, fórmulas matemáticas, algoritmos de corrección geométrica y controles de calibración en tiempo real para la visualización 3D en **3DBimFab (3BF)** con Three.js / React Three Fiber y Rhino 8 RhinoCompute.

---

## 📐 1. Arquitectura Geométrica y Normales de Cara

### 1.1 El Problema de las Normales Invertidas y la "Línea de Costura"
En gráficos 3D (WebGL), cada cara triangular posee una normal vector $\vec{N}$ que determina hacia dónde se refleja la luz y qué cara es visible.
* **Normales Invertidas**: Si el orden de los vértices (winding order) es horario en lugar de antihorario, $\vec{N}$ apunta hacia el interior de la madera. WebGL calcula sombreados oscuros o culla la cara, creando una ilusión de pieza transparente o hueca.
* **Normales Promediadas a $45^\circ$**: Al ejecutar `computeVertexNormals()` sobre mallas indexadas de vértices compartidos, Three.js promedia las normales de 3 caras ortogonales en las esquinas, creando normales a $45^\circ$. Esto genera **gradientes de sombra hacia los bordes** y produce una **línea de costura oscura** cuando dos tableros se juntan en el canto.

### 1.2 Algoritmo de Auto-Corrección Vectorial de Normales ($100\%$ Outward Normals)
Implementado en `Viewer3D.tsx`, el algoritmo analiza cada triángulo de la malla:

$$\vec{M} = \frac{p_A + p_B + p_C}{3} \quad (\text{Centroide del triángulo})$$
$$\vec{C} = \text{BoxCenter} \quad (\text{Centro del volumen delimitador})$$
$$\vec{V}_{out} = \vec{M} - \vec{C} \quad (\text{Vector de orientación hacia el exterior})$$
$$\vec{N} = (p_B - p_A) \times (p_C - p_A) \quad (\text{Normal geométrica del triángulo})$$

#### Criterio de Inversión (Flipping Inverted Normal):
Si el producto punto $\vec{N} \cdot \vec{V}_{out} < 0$, la normal apunta hacia el centro interno de la madera. El algoritmo intercambia inmediatamente los vértices $p_B \leftrightarrow p_C$:

```typescript
if (normal.dot(outVector) < 0) {
  posAttr.setXYZ(i + 1, pC.x, pC.y, pC.z);
  posAttr.setXYZ(i + 2, pB.x, pB.y, pB.z);
}
posAttr.needsUpdate = true;
geo.computeVertexNormals();
```
**Resultado**: El 100% de las caras tienen normales verdaderas orientadas hacia el exterior.

---

## 🧱 2. Patrón de Geometría Dual en Memoria

Para lograr simultáneamente aristas nítidas de $90^\circ$ sin líneas diagonales y caras de madera $100\%$ planas sin costuras:

| Malla | Tipo | Función | Resultado Visual |
| :--- | :--- | :--- | :--- |
| `indexedGeo` | Indexada (8 vértices compartidos) | Generar `THREE.EdgesGeometry(indexedGeo, threshold)` | Dibuja únicamente las 12 aristas perimetrales del cubo ($90^\circ$). Cero líneas diagonales. |
| `customGeometry` | No-Indexada (`toNonIndexed()`) | Renderizado de caras sólidas con normales independientes | Normales de cara 100% perpendiculares a $90^\circ$. Cero gradientes de sombra, cero líneas de costura. |

---

## 🛡️ 3. Oclusión Z-Buffer y Renderizado de Aristas Opacas

* **Material de Aristas (`lineBasicMaterial`)**:
  ```tsx
  <lineBasicMaterial
    color={calibracion.colorAristas}
    linewidth={1}
    depthTest={true}
    depthWrite={true}
    transparent={false}
    opacity={1.0}
  />
  ```
  Al configurar `depthTest={true}` y `depthWrite={true}` en la fase opaca (`transparent={false}`), las caras frontales de la madera sólida ocluyen e impiden el paso de las aristas traseras e interiores.
* **Filtro de Cajas Internas Coplanares**:
  Cuando `apertura_cajones === 0` en modo `Sólido` o `Renderizado`, el visor filtra las mallas de la caja interna (`Lateral Izq Cajon`, `Lateral Der Cajon`, `Posterior de Cajon`) situadas en $Z = 0$, eliminando superposiciones (*Z-fighting*).

---

## 🎛️ 4. Panel de Calibración Flotante (`CalibrationPanel.tsx`)

Ubicación: **Esquina superior izquierda del visor 3D** (`absolute top-3 left-3 z-30`).

### Parámetros Calibrables en Tiempo Real:
1. **`colorSolido`**: Color Hexadecimal base para modo Sólido (Default `#9CA3AF`).
2. **`opacidadMadera`**: Deslizador de $0.00$ a $1.00$ ($0\% - 100\%$).
3. **`rugosidadMadera`**: Deslizador de $0.00$ a $1.00$ (Roughness material PBR).
4. **`metalicidadMadera`**: Deslizador de $0.00$ a $1.00$ (Metalness material PBR).
5. **`mostrarAristas`**: Interruptor booleano encendido/apagado para aristas perimetrales.
6. **`colorAristas`**: Selector de color Hexadecimal de tinta de aristas (Default `#111827`).
7. **`opacidadAristas`**: Deslizador de $0.00$ a $1.00$ ($0\% - 100\%$).
8. **`thresholdAristas`**: Deslizador de ángulo umbral de $1^\circ$ a $89^\circ$ (Default $15^\circ$).
9. **`intensidadLuzDirecta`**: Deslizador de $0.0\text{x}$ a $3.0\text{x}$ (Luz solar / estudio).
10. **`intensidadLuzAmbiental`**: Deslizador de $0.0\text{x}$ a $2.0\text{x}$ (Luz ambiental difusa).
11. **`resetCalibracion`**: Botón de restablecimiento a valores originales de fábrica.

---

## 📌 5. Procedimiento de Recuperación Rápida ante Bloqueo (`Worker: API Fallback`)

### 5.1 Causa del Bloqueo (`API Fallback` / Canvas Blanco):
1. **Corrupción de Caché Dev `.next`**: Al ejecutar `npm run build` o alternar ramas git (`git checkout`), la caché interna de desarrollo de Next.js en `3BF/.next` pierde la sincronía de referencias estáticas, produciendo un error `MODULE_NOT_FOUND` en las llamadas internas a `/api/compute`.
2. **Desconexión del Worker Python en `localhost:8005`**: Si el Worker de Python o RhinoCompute sufren una desconexión o parpadeo en las peticiones HTTP, el frontend conmuta automáticamente al estado degradado de seguridad `Worker: API Fallback`.

### 5.2 Pasos de Diagnóstico y Recuperación Paso a Paso:

#### Paso 1: Verificar el Estado de los 3 Servicios Persistentes (`Daemons`)
Ejecutar en la terminal el verificador de salud:
```powershell
python -c "import requests; print('Rhino 5000:', requests.get('http://localhost:5000/version').status_code); print('Python 8005:', requests.get('http://localhost:8005/health').status_code); print('Next.js 3005:', requests.get('http://localhost:3005').status_code)"
```
* **Esperado**: Todos deben responder `ONLINE [200]`.

#### Paso 2: Limpieza de Caché Dev `.next` y Reinicio del Servidor Web
Si se presenta pantalla blanca o error de módulos:
```powershell
# 1. Eliminar la carpeta de caché corrompida
Remove-Item -Recurse -Force c:\Desarrollo\mmapp\3BF\.next

# 2. Reiniciar el servidor de desarrollo de Next.js
cd c:\Desarrollo\mmapp\3BF
npm run dev
```

#### Paso 3: Reinicio de Daemons de Segundo Plano (`/Arranque3BF`)
Si el Worker de Python (8005) o RhinoCompute (5000) se cerraron, re-lanzarlos como Daemons en segundo plano (`IsDaemon: true`):
1. **RhinoCompute 8**: `C:\Users\mario\AppData\Roaming\McNeel\Rhinoceros\packages\8.0\Hops\0.17.0\rhino.compute\rhino.compute.exe`
2. **3BF Worker Python**: `python -u worker/3bf_worker.py` en `c:\Desarrollo\mmapp\3BF`
3. **3BF Web App Next.js**: `npm run dev` en `c:\Desarrollo\mmapp\3BF`

---

## 📌 Archivos Clave del Sistema:
* `c:\Desarrollo\mmapp\3BF\components\viewer\Viewer3D.tsx` (Geometría dual, normales vectoriales, renderizado R3F, `key={activeMap.uuid}`)
* `c:\Desarrollo\mmapp\3BF\components\viewer\CalibrationPanel.tsx` (Interfaz UI del Panel Flotante de Calibración)
* `c:\Desarrollo\mmapp\3BF\app\api\compute\route.ts` (Bucle de conexión multiorigen `localhost:8005` y fallback)
* `c:\Desarrollo\mmapp\3BF\lib\store.ts` (Estado Zustand `calibracion` y valores por defecto)
