# Diseño Técnico: Cohesión Espacial de Paralelepípedos en Blender

**Fecha:** 2026-06-02  
**Autor:** Antigravity AI  
**Estado:** Aprobado  

---

## 1. Contexto y Problema

El script de Blender `blender_join_pieces.py` es responsable de la unificación física de los distintos componentes que forman una pieza de madera en un mueble (tablero de MDP/MDF, caras laminadas, balances y los cantos en los bordes).

En la versión actual (V5), la agrupación inicial de piezas se basa estrictamente en el nombre del objeto (limpiando sufijos como `balance` o `canto`). Esto presenta fallas graves en los siguientes escenarios de Rhino/Blender:
1. **Nombres Genéricos de Cantos:** Si un canto se llama simplemente `"Canto"` o `"Canto_PVC"` sin el prefijo del nombre de la pieza (ej. `"Cubierta"`), el script lo agrupa bajo una sola familia `"Canto"`, por lo que nunca se une a su respectiva `"Cubierta"`.
2. **Nombres de Huérfanos:** Piezas como mallas importadas que quedan con nombres automáticos tipo `"Mesh_..."` no se asocian a las piezas de madera principales.

Como consecuencia, el paralelepípedo de la pieza de madera queda "abierto" o con bordes desnudos, perdiendo cohesión física en el visor 3D y en los listados del despiece.

---

## 2. Solución Propuesta (Cohesión Espacial Basada en Núcleos)

Proponemos una reestructuración de la fase de agrupación en `blender_join_pieces.py` para basarse en la **ubicación y superposición espacial en 3D** en lugar del nombre del objeto.

### 2.1. Clasificación Jerárquica de Mallas
Recorreremos todas las mallas (`MESH`) de la escena y las clasificaremos en las siguientes categorías:

1. **`Herrajes`**: Mallas que representan componentes metálicos/plásticos de unión (bisagras, tornillos, correderas, etc.). Identificados mediante `es_herraje(name)`. **Quedan excluidos del proceso de unión.**
2. **`Genericos`**: Núcleos de tablero de MDP o MDF (ej: `MDP.030`, `MDF.001`). Identificados mediante `es_generico(name)`.
3. **`Coverings` (Recubrimientos)**: Capas de canto, laminado, balance o tapa.
   * Se identifican por nombre (si contiene `"canto"`, `"laminado"`, `"balance"`, `"balanceo"`, o `"tapa"`).
   * O por dimensiones físicas (si su eje más delgado o espesor es $\le 3.5\text{ mm}$).
4. **`Huérfanos`**: Mallas genéricas de Rhino (ej. `Mesh_...`).
5. **`Nuclei` (Núcleos/Tablas Base)**: Mallas de madera legítimas nombradas (ej. `Cubierta`, `Lateral derecho`, `Frente de cajon`). Son los "centros de gravedad" a los que se unirá todo lo demás.
   * *Promoción Automática:* Si un `Generico` (MDP) no tiene un `Nuclei` cercano con el que coincida espacialmente, se le promueve automáticamente a `Nuclei` para que sea una tabla física independiente y no se pierda.

### 2.2. Algoritmo de Asignación Espacial
1. **Bounding Boxes Expandidos en 3D:** Cada `Nuclei` tendrá un bounding box expandido en el espacio del mundo con márgenes tolerantes para absorber holguras de Rhino:
   * `margen_espesor = 0.04` (+4 cm en la dirección del espesor).
   * `margen_otros = 0.005` (+5 mm en las otras dos direcciones).
2. **Medición de Coincidencia (Volumen Expandido):**
   * Para cada `Generico` (MDP), `Covering` (canto/laminado) y `Huérfano` en la escena:
     * Calculamos su `ratio_contencion` volumétrico contra todos los `Nuclei`.
     * Se le asigna de forma única al `Nuclei` con el **mayor ratio de contención** (con un umbral mínimo de $\ge 0.1$).
3. **Fase de Unión (`bpy.ops.object.join`):**
   * Unimos físicamente cada `Nuclei` con todos sus `Genericos`, `Coverings` y `Huérfanos` asignados.
   * El paralelepípedo resultante queda perfectamente cerrado en sus 6 caras (núcleo + 2 caras + 4 cantos).

### 2.3. Estructuración y Nomenclatura del Outliner
* El objeto unificado se renombra con el sticker de armado (ej: `Pieza 01` o `Pieza 07.001`).
* Su Mesh Data interno (`obj.data.name`) se renombra con el nombre limpio de la pieza base (ej: `Cubierta` o `Frente de cajon`), garantizando que Next.js y el visor 3D lean la información sin redundancia.

---

## 3. Plan de Verificación

1. **Prueba de Sintaxis en Python:**
   `python -m py_compile scripts/blender_join_pieces.py` para asegurar que el archivo no contenga errores de sintaxis.
2. **Ejecución en Blender:**
   El usuario recargará y ejecutará el script en Blender y verificará el archivo `JOIN_LOG` generado para confirmar:
   * **`MDP sin asignar: 0`**
   * **`Piezas con bordes desnudos: 0`**
   * Cohesión física perfecta de las 6 caras de cada pieza en el viewport y el outliner.
