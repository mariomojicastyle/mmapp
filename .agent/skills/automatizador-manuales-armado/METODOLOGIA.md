# Metodología de Trabajo y Modelado en Blender

Este documento registra de forma detallada el flujo de trabajo estándar (workflow) diseñado por el usuario para estructurar los proyectos en Blender y preparar las piezas antes de realizar la animación y exportación del manual dinámico.

---

## 📂 1. Creación del Archivo Maestro (`Master.blend`)

El punto de partida para cualquier manual de armado interactivo es el archivo base del modelo 3D del mueble, el cual debe ser organizado de la siguiente manera:

1. **Importación del Mueble**: Se carga el archivo 3D limpio del mueble en su estado final completamente armado en Blender.
2. **Estructura por Colecciones en el Outliner**:
   - Se crean colecciones secundarias dentro de la colección principal (`Scene Collection`).
   - Cada colección representa un paso de armado y debe nombrarse con la nomenclatura **`P01`**, **`P02`**, **`P03`** hasta **`Pxx`** (donde `xx` es el último paso).
3. **Distribución de Piezas**:
   - Sin animar ni mover ninguna pieza de su ubicación original, se arrastran y organizan las mallas (piezas de madera) y los herrajes (tornillos, tarugos, bisagras, etc.) dentro de la colección (`P01`, `P02`, etc.) que corresponde al momento exacto en que deben ser instalados.
4. **Guardado Coherente**:
   - Este archivo se guarda bajo el nombre de **`Master.blend`**.
   - *Importante*: Este archivo representa el estado geométrico base y final (ensamblado) del mueble agrupado por etapas, sirviendo como la fuente de verdad del proyecto.

## 🔄 2. Orientación de Armado (`Master_girado.blend`)

Una vez estructurado el archivo maestro, se establece la orientación física en la que se llevará a cabo el ensamble real:

1. **Duplicación del Archivo**: Se genera una copia idéntica del archivo `Master.blend`.
2. **Rotación General**:
   - Esta copia se abre y se gira el mueble completo (junto con todas sus colecciones y piezas internas) hacia la posición óptima e intuitiva para iniciar el armado físico.
   - *Práctica Común*: En la gran mayoría de los casos de muebles grandes o modulares (como armarios, cómodas o escritorios), esto implica **acostar el mueble** horizontalmente sobre el suelo para facilitar el ensamble de la estructura inicial.
3. **Guardado Coherente**:
   - Este archivo se guarda bajo el nombre de **`Master_girado.blend`**.
   - *Importante*: Todos los procesos posteriores de animación, sincronización con audios y exportaciones individuales a archivos GLTF se realizarán trabajando sobre este archivo o sus derivados directos.

## 💾 3. Segmentación en Archivos Individuales por Paso (`P01.blend` ... `Pxx.blend`)

Para aislar el trabajo de animación y enfocar la vista del usuario en lo que se debe hacer en cada etapa:

1. **Creación de Archivos por Paso**:
   - Se crean archivos independientes (`P01.blend`, `P02.blend`, etc.) a partir del archivo maestro girado.
   - Cada archivo contiene únicamente los componentes (maderas y herrajes correspondientes) que se van a animar o instalar en ese paso específico.
2. **Sub-ensambles y Preparación Plana**:
   - En los primeros pasos (ej. `P01.blend`), el archivo suele aislar una sola pieza (como un lateral o una repisa divisoria) con sus respectivos tarugos de madera, pernos minifix y correderas metálicas de cajón. Esto se hace para que el usuario prepare las piezas planas sobre el piso antes de levantar la estructura.
3. **Animación Individual**:
   - Se sincroniza la animación y se exporta el archivo `P01.glb` a partir de este modelo aislado.

---

## 💡 4. Propuestas de Optimización y Flujo de Trabajo Sugerido (IA)

Aunque el flujo de múltiples archivos `.blend` individuales funciona, puede mejorarse drásticamente para evitar trabajo repetitivo y problemas de sincronización de materiales o mallas:

### 🚀 Optimización del Pipeline: "Un Solo Archivo Maestro Animado"
En lugar de tener 15 archivos `.blend` distintos, podemos realizar todo en el mismo `Master_girado.blend`:
1. **Línea de Tiempo Segmentada**:
   - Definimos un rango de fotogramas para cada paso (ej. Paso 1: frames 1-100, Paso 2: frames 101-200, etc.).
   - Animamos cada colección de piezas en su respectivo rango de frames.
2. **Script de Exportación Inteligente**:
   - Programamos un script de Python en Blender que, al ejecutarse, recorra los rangos de frames:
     - Para el Paso $N$, oculta automáticamente las colecciones del Paso $N+1$ en adelante.
     - Mantiene visibles las piezas de los pasos $1$ a $N-1$ de forma estática (eliminando sus keyframes de movimiento para que no se muevan de nuevo).
     - Ejecuta la animación de las piezas del Paso $N$.
     - Exporta automáticamente a `P0N.glb`.
3. **Beneficio**: Si cambias el material de la madera o el modelo de un tornillo, lo haces **una sola vez** en el archivo maestro y vuelves a correr el script. Se actualizan todos los GLBs de golpe.

---

## 🧠 5. Reglas de Sentido Común en la Secuencia Lógica de Armado

Para indagar y proponer secuencias lógicas de armado de forma autónoma, la IA sigue estas **Reglas de Oro del Fabricante**:

1. **Regla de Oro 1: Pre-ensambles Planos Primero (Sub-assemblies)**:
   - Nunca se debe iniciar el manual levantando la estructura en 3D.
   - Los primeros pasos siempre deben ser la preparación individual de tableros sobre el suelo: atornillar correderas metálicas en laterales, insertar tarugos (dowels) de madera y pernos de minifix. Atornillar correderas dentro de un mueble ya cerrado es sumamente difícil.
2. **Regla de Oro 2: De la Base hacia Arriba (Bottom-Up)**:
   - El ensamble de la estructura debe comenzar uniendo la base (zócalos y piso del mueble) con los laterales y divisiones verticales principales utilizando pernos de unión o minifix.
3. **Regla de Oro 3: Escuadra y Rigidez (El Fondo)**:
   - Antes de colocar el techo o levantar el mueble, se debe deslizar o clavar la lámina trasera (Fondo). El fondo es el elemento estructural que aporta rigidez y asegura que el mueble quede a 90 grados perfectos.
4. **Regla de Oro 4: Cubierta Superior (Cierre de Caja)**:
   - Se coloca la cubierta o techo del mueble para cerrar el cajón estructural principal.
5. **Regla de Oro 5: Elementos Móviles y Ajustes Finales**:
   - Una vez la caja del mueble es estable y está en su posición final de pie, se procede a:
     - Ensamblar los cajones por separado y deslizarlos en las correderas.
     - Montar las puertas ajustando las bisagras.
     - Colocar tiradores, manijas y niveladores/patas de base.
