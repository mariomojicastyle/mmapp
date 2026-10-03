---
name: graphify
description: "Motor de Grafo de Conocimiento y Dependencias de Código para 3BF y Antigravity. Permite consultar relaciones entre componentes, llamadas a funciones, imports y árboles de dependencia en milisegundos sin consumir tokens leyendo archivos a ciegas."
---

# 🕸️ Graphify: Grafo de Conocimiento y Arquitectura de Código

## 1. Propósito
Permite explorar la arquitectura de software de `3BF` y del proyecto Mario Mojica de forma determinista y ultrarrápida (en ~1.3 segundos), mapeando:
- Dependencias entre componentes de React / Next.js y el visor Three.js.
- Llamadas y utilidades cinemáticas (`cadStateUtils.ts`, `multiplePlusKinematics.ts`, `coreografiaHerrajes.ts`, etc.).
- Comunicación con el Worker de Python (`worker.py`, FastAPI, RhinoCompute).
- Detección de impacto antes de refactorizar ("¿Si toco esta función, qué módulos se rompen?").

---

## 2. Ubicación de los Artefactos en 3BF
- **Grafo principal (JSON):** `3BF/graphify-out/graph.json` (3.216 nodos, 11.060 aristas).
- **Visor Visual Interactivo:** [graph.html](file:///c:/Desarrollo/mmapp/3BF/graphify-out/graph.html)
- **Árbol Colapsable D3:** [GRAPH_TREE.html](file:///c:/Desarrollo/mmapp/3BF/graphify-out/GRAPH_TREE.html)

---

## 3. Comandos de Consulta Rápida (CLI)

Ejecutable local:
`C:\Users\mario\AppData\Local\Python\pythoncore-3.14-64\Scripts\graphify.exe`

### A. Consultar dependencias de un símbolo o concepto:
```powershell
& "C:\Users\mario\AppData\Local\Python\pythoncore-3.14-64\Scripts\graphify.exe" query "<concepto_o_funcion>" --graph "3BF\graphify-out\graph.json"
```
*Ejemplo:* `query "aplicarPosicionesEscena3D"`, `query "cinematica"`, `query "worker"`.

### B. Encontrar la ruta más corta entre dos módulos:
```powershell
& "C:\Users\mario\AppData\Local\Python\pythoncore-3.14-64\Scripts\graphify.exe" path "<NodoA>" "<NodoB>" --graph "3BF\graphify-out\graph.json"
```

### C. Explicar un nodo específico:
```powershell
& "C:\Users\mario\AppData\Local\Python\pythoncore-3.14-64\Scripts\graphify.exe" explain "<NombreNodo>" --graph "3BF\graphify-out\graph.json"
```

### D. Actualización incremental (tras cambios de código):
```powershell
& "C:\Users\mario\AppData\Local\Python\pythoncore-3.14-64\Scripts\graphify.exe" extract 3BF --code-only --out 3BF/graphify-out
```
*(Corre 100% en local con Tree-sitter AST, costo $0 de tokens de API).*
