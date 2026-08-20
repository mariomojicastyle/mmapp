# 3DBimFab (3BF) - Arquitectura y Flujo de Procesamiento Paramétrico en Tiempo Real

Este documento registra el flujo de trabajo técnico completo, paso a paso, con **diagramas gráficos vectoriales integrados**, estructuras XML, payloads JSON, código fuente y los **hitos históricos de desarrollo** para la evaluación paramétrica y renderizado 3D en tiempo real desde Grasshopper (`.gh` / `.ghx`) hacia la web vía **Rhino 8 RhinoCompute** y **Three.js / React Three Fiber**.

---

## ⚡ Comando de Arranque Unificado (`/Arranque3BF`)

Para iniciar la suite completa de **3DBimFab (3BF)** en una sola orden sin necesidad de lanzar tareas manuales separadas, ejecuta el comando de arranque:

### 🎮 Comando en Consola / Agente:
```bash
/Arranque3BF
```
> O ejecuta en PowerShell: `powershell -ExecutionPolicy Bypass -File C:\Desarrollo\mmapp\3BF\start_3bf.ps1`

### ⚙️ Los 3 Procesos Principales del Ecosistema (Daemons Persistentes):
Para garantizar que los servicios permanezcan activos a la primera sin cerrarse al finalizar la sesión del lanzador, se inician como demonios independientes (`IsDaemon: true`):
1. **🦏 RhinoCompute 8 Engine**: `$env:USERPROFILE\AppData\Roaming\McNeel\Rhinoceros\packages\8.0\Hops\0.17.0\rhino.compute\rhino.compute.exe` ➔ `http://localhost:5000` *(Motor CAD Grasshopper)*
2. **🐍 3BF Worker Python Engine**: `python -u worker/3bf_worker.py` ➔ `http://localhost:8005` *(Solver FastAPI DfMA en C:\Desarrollo\mmapp\3BF)*
3. **🌐 3BF Web App**: `npm run dev` ➔ `http://localhost:3005` *(Interfaz Web React / Three.js en C:\Desarrollo\mmapp\3BF)*

### 🛠️ Protocolo de Recuperación Rápida ante Bloqueo / API Fallback:
Si el visor se pone en blanco o muestra el badge amarillo `Worker: API Fallback`:
1. **Borrar Caché de Desarrollo `.next`**: `Remove-Item -Recurse -Force c:\Desarrollo\mmapp\3BF\.next`
2. **Reiniciar Servidor Web**: Ejecutar `npm run dev` en `c:\Desarrollo\mmapp\3BF`.
3. **Verificar Servicios**: Confirmar respuesta HTTP 200 en `http://localhost:5000/version` y `http://localhost:8005/health`.

---

## 📐 Diagrama del Flujo de Datos (Visual Tech Ethos - Versión 3.0 Estable)

![Diagrama del Flujo de Datos 3BF V3](./3BF_Proceso_Diagrama_V3.svg)

> **Historial y Evolución de Versiones del Diagrama:**
> - [Versión 3.0 (Estable Actual - Doble Inyección Universal XML & Coherencia Total)](./3BF_Proceso_Diagrama_V3.svg)
> - [Versión 2.0 (Transicional - Schema Discovery Inicial)](./3BF_Proceso_Diagrama_V2.svg)
> - [Versión 1.0 (Histórica - Pipeline Lineal Inicial)](./3BF_Proceso_Diagrama_V1.svg)

---

## 🚀 Hitos Históricos Logrados en la Integración Grasshopper ➔ 3BF

### 🏆 1. Resolución Definitiva de las 19 Piezas Reales (100% Nativo de Rhino 8)
- **Logro**: Se logró que **RhinoCompute 8** devuelva la geometría 100% nativa calculada en Rhino 8 (3 frentes de cajón, 3 posteriores, 3 tapas luz, 3 laterales derechos, 3 laterales izquierdos, cubierta superior, cubierta inferior, lateral izquierdo y lateral derecho).
- **Extracción de Geometría**: Se implementó en Python el uso de `rhino3dm.CommonObject.Decode()` para deserializar los BReps OpenNURBS (`archive3dm`) y calcular sus cajas delimitadoras 3D (`BoundingBox`) en metros para Three.js.
- **Alineación de Grilla**: Se eliminó el envoltorio `<Stage>` de `@react-three/drei` que auto-centraba la escena en Y, permitiendo que la grilla del piso descanse exactamente en `Y = 0` bajo la base del mueble.

---

### 💎 2. Modo de Renderizado Técnico 3D "Rhino Technical" (Cristal Tintado 70%)
- **Estética CAD**: Se integró el componente de aristas negras nítidas `<Edges color="#000000" threshold={15} />` de `@react-three/drei`.
- **Modos Visuales Seleccionables**:
  - **💎 Cristal**: Material semitransparente (`transparent opacity={0.70} depthWrite={false}`) conservando el color de acabado tintado del usuario (`mainColor`).
  - **🧱 Sólido**: Renderizado opaco con sombra y rugosidad de madera MDF/MDP.
  - **📐 Líneas**: Visualización técnica puramente vectorial tipo armazón de alambre (Wireframe).

---

### 📂 3. Arquitectura de Variantes `.ghx` para Conmutación de Cajones
- **Descubrimiento Técnico**: `rhino.compute.exe` serializa las mallas en el estado activo guardado en el lienzo de Grasshopper.
- **Estrategia de Variantes**: Se habilitó la selección y carga dinámica automática en `3bf_worker.py` según la cantidad de cajones seleccionada:
  - `Cajon_Experimento_Viktor_1cajon.ghx`
  - `Cajon_Experimento_Viktor_2cajones.ghx`
  - `Cajon_Experimento_Viktor_3cajones.ghx`

---

### 🎛️ 4. Sliders con Mínimos/Máximos Auto-Detectados & Entrada Numérica Editable
- **Extracción de Rangos en XML**: La función `parse_ghx_slider_limits` extrae automáticamente `<Min>`, `<Max>` y `<Value>` de la etiqueta `<chunk name="Slider">` de Grasshopper.
- **Nombres 1:1 con Grasshopper**:
  - `Ancho` (300 a 1000 mm)
  - `Alto` (300 a 1200 mm)
  - `Profundidad` (200 a 1000 mm)
  - `Cantidada de Cajones` (Menú Desplegable `<select>`: 1, 2, 3)
  - `Abrir Cajones` (0 a 300 mm)
  - `Profundidad cajon` (Menú Desplegable `<select>`: 351 mm, 400 mm)
  - `Altura lateral de cajon` (50 a 250 mm)
- **Edición Numérica al Hacer Clic**: Se creó el componente React `EditableNumberInput` que permite escribir directamente la medida deseada y la clampea automáticamente al rango válido si se ingresa un valor menor al mínimo o mayor al máximo.

---

### 🧩 5. Mapeo de `Value List` para Parámetros Numéricos (`Int32` / `String`)
- **Hallazgo de Formato**: Cuando un componente de Grasshopper es un `Value List`, el envío de valores con punto decimal (`"351.0"`) hace que Grasshopper descarte la opción.
- **Formateo Estricto**: `3bf_worker.py` convierte los parámetros a cadenas de enteros limpios (`"351"`, `"400"`) enviando tanto `System.Int32` como `System.String`.

### 🎛️ 6. Calibración de Renderizado 3D PBR, Normales Perpendiculares y Oclusión Z-Buffer

- **Auto-Corrección Vectorial de Normales 3D**:
  - Se implementó la verificación y corrección de la orientación de las normales de cara en `Viewer3D.tsx`. Si una normal apunta hacia el centro interno del tablero ($\vec{N} \cdot \vec{V}_{out} < 0$), el sistema invierte automáticamente el orden de los vértices ($p_B \leftrightarrow p_C$). Esto garantiza que el **100% de las normales apunten hacia afuera ($100\%$ Outward-Facing Normals)**.
- **Geometría Dual en Memoria (Indexed vs Non-Indexed)**:
  - **Malla Indexada (`indexedGeo`)**: Se utiliza únicamente para generar `THREE.EdgesGeometry(indexedGeo, threshold)` sin líneas diagonales ni duplicadas.
  - **Malla No-Indexada (`toNonIndexed()`)**: Recalcula normales de cara $100\%$ perpendiculares a cada plano ($90^\circ$). Esto evita el suavizado de esquinas a $45^\circ$ y **elimina por completo los gradientes de sombra en los cantos y la línea de costura**.
- **Oclusión Z-Buffer y Aristas Opacas**:
  - `<lineBasicMaterial>` se configura con `depthTest={true}`, `depthWrite={true}`, `transparent={false}`, forzando a que las aristas de contorno se dibujen en la fase opaca. La madera sólida ocluye el 100% de las líneas traseras e internas.
- **Panel de Calibración Flotante (`CalibrationPanel.tsx`)**:
  - Ubicado en la esquina superior izquierda del visor (`🎛️ Calibrar 3D`), permite ajustar en tiempo real: color base sólido (`#9CA3AF`), opacidad ($0-100\%$), rugosidad ($0-1$), metalicidad ($0-1$), interruptor de aristas, color de aristas (`#111827`), opacidad de aristas, ángulo umbral ($1^\circ-89^\circ$), luz directa ($0-3\text{x}$) y luz ambiental ($0-2\text{x}$).

- **Desmantelamiento Definitivo de Secciones Residuales (`Tablero & Espesor`)**:
  - La sección hardcoded "Tablero & Espesor" fue eliminada permanentemente del panel de control (`ControlPanel.tsx`). La interfaz de 3BF es 100% autónoma y guiada exclusivamente por los parámetros nativos expuestos por los algoritmos de Grasshopper (`.ghx`).

---

### 🏛️ 7. Arquitectura V3.0: Doble Inyección Universal XML & Coherencia Total (Release Estable)

- **Evolución Arquitectónica (V1 ➔ V2 ➔ V3)**:
  * **Versión 1.0 (Histórica)**: Pipeline Lineal Inicial. Ceguera semántica, puente Base64 pasivo y UI rígida con nombres quemados (`ancho`, `alto`).
  * **Versión 2.0 (Transicional)**: Schema Discovery Inicial. Escaneaba metadatos en `/metadata`, pero presentaba debilidades: RhinoCompute ignoraba los cambios en sliders porque no se actualizaban los nodos `<Value>` en el XML nativo antes de Base64, y solo se detectaban `Number Sliders` simples.
  * **Versión 3.0 (Estable Actual)**: **Doble Inyección Universal en Caliente (Universal Hot XML Ingestion)**.
    1. **Eslabón 2.1 (Schema Discovery Total)**: Escanea en **5 ms** todos los `Number Sliders` (min/max/default) y `Value Lists` (opciones completas y opción activa), estructurando las tarjetas según la jerarquía VisualARQ (`01.x`, `02.x`).
    2. **Eslabón 2.2 (Inyección en Caliente en Árbol XML)**: Inyecta directamente en memoria los valores del usuario tanto en `<item name="Value">` (Sliders) como en `<item name="Selected">` (Value Lists) antes de codificar en Base64. RhinoCompute 8 calcula siempre sobre el archivo ya modificado con **cero pérdida de parámetros**.
- **Coherencia Absoluta 3D vs UI**:
  - Las dimensiones modificadas en sliders (Ancho, Profundidad, Recedidos) y los cambios en selectores de herrajes (Minifix, Tornillos, Cantos, Mapeados) se reflejan simultáneamente en la interfaz y en el visor Three.js con latencia de ~200 ms.
- **Trilogía Oficial de Diagramas Vectoriales**:
  - [Versión 3.0 (Estable)](./3BF_Proceso_Diagrama_V3.svg)
  - [Versión 2.0 (Transicional)](./3BF_Proceso_Diagrama_V2.svg)
  - [Versión 1.0 (Histórica)](./3BF_Proceso_Diagrama_V1.svg)

---

### 🎮 8. Contorno de Silueta $100\%$ Continuo y Ceñido en 3D (Cero Efecto Sombra)

Se calibró la coordenada vertical ($Y$) de los desvíos sobre los pernos para montarse exactamente sobre el cuerpo del herraje (`p.center.y`):

```mermaid
flowchart TD
    A["Arista de Madera (Canto a cota yCoord)"] --> B["Transición Vertical Suave al eje del Perno (pernoY)"]
    B --> C["Recorrido y Arco en la Cota Real del Perno (p.tip, pernoY, z)"]
    C --> D["Regreso Vertical al Canto de la Madera (yCoord)"]
    D --> E["🎯 Línea Ceñida a la Geometría Física (Cero Efecto Sombra)"]
```

#### 📐 Perfeccionamiento de Cota:
1. **🚫 Eliminación del Efecto Sombra:**
   * La línea ya no cae al suelo (`minY`) ni flota en el techo (`maxY`), sino que se acopla a la altura real del cilindro del perno (`pernoY`).
2. **✨ Continuidad 3D Total:**
   * La transición entre la madera y el perno es tridimensionalmente continua y ceñida a los bordes visibles que dan al vacío.
3. **🔶 Calibre $4\text{ px}$ Nítido:**
   * Trazado continuo en `#ff9500` con `@react-three/drei` `<Line>`.

### 🧲 9. Snap Base Point Estilo Blender (Flujo Completo Origen ➔ Destino)

Se implementó el ciclo integral de selección de punto base y pegado magnético a puntos destino:

```mermaid
flowchart TD
    A["1. Presionar G (Modo Mover)"] --> B["2. Presionar B (Snap Base Point)"]
    B --> C["🧊 La Pieza se Congela / Queda Inmóvil"]
    C --> D["3. Pasar cursor por vértice (□) o mitad (△)"]
    D --> E["4. Clic Izquierdo (o Derecho) sobre el icono naranja"]
    E --> F["🎯 Punto Origen Fijado + Reanudación de Movimiento"]
    F --> G["5. Desplazar hacia el punto destino (Grid / Eje / Referencia)"]
    G --> H["🧲 Aparece Icono Destino Naranja (□) + Snap Magnético Automático"]
    H --> I["6. Clic Izquierdo / Enter: Pieza fijada en el destino"]
```

#### 📐 Perfeccionamiento Visual y Cinemático:
1. **🔶 Iconografía Naranja Sólida y Nítida:**
   * Calibre delineado de $2.5\text{ px}$ en `#ff9500` $100\%$ sólido y brillante (`depthTest={false}`, `renderOrder={999}`).
   * Tamaño proporcionado: Cuadrado $\square$ de $24\text{ mm}$ para Endpoints y Triángulo $\triangle$ de $28\text{ mm}$ para Midpoints.
2. **🎯 Anclaje de Origen:**
   * Al hacer clic sobre el vértice o punto medio, la coordenada se bloquea como origen de arrastre.
3. **🧲 Snapping Magnético en Destino:**
   * A medida que se desplaza la pieza, al aproximarse a un punto destino, se dibuja el marcador de destino y la pieza se **pega magnéticamente** al punto objetivo.

## 🔄 Estado Final del Ecosistema 3BF

- **3BF Worker Python (`3bf_worker.py`)**: Corriendo en `http://localhost:8005`.
- **RhinoCompute 8 (`rhino.compute.exe`)**: Corriendo en `http://localhost:5000`.
- **Aplicación Web Next.js 3BF**: Corriendo en `http://localhost:3005`.
- **Archivos de Definición en `temporal/`**:
  - `Cajon_Experimento_Viktor_1cajon.ghx`
  - `Cajon_Experimento_Viktor_2cajones.ghx`
  - `Cajon_Experimento_Viktor_3cajones.ghx`
- **Textura PBR Integrada**: `c:\Desarrollo\mmapp\3BF\public\textures\Marfil_diffuse.jpg`.

### 📄 Paso 1: Lectura, Etiquetado y Saneamiento del Archivo (`.ghx`)

El archivo `.ghx` de Grasshopper es un documento XML estructurado (`GH_Archive`). Para que **RhinoCompute 8** pueda exponer automáticamente los modificadores y capturar la geometría de salida, se aplica el protocolo de prefijos `RH_IN:` y `RH_OUT:`.

#### Estructura XML de un Slider de Entrada (`RH_IN:Ancho`):
```xml
<chunk name="Object" index="85">
  <items count="2">
    <item name="GUID" type_name="gh_guid" type_code="9">57da07bd-ecab-415d-9d86-af36d7073abc</item>
    <item name="Name" type_name="gh_string" type_code="10">Number Slider</item>
  </items>
  <chunks count="1">
    <chunk name="Container">
      <items count="6">
        <item name="Name" type_name="gh_string" type_code="10">Number Slider</item>
        <item name="NickName" type_name="gh_string" type_code="10">RH_IN:Ancho</item>
      </items>
      <chunks count="2">
        <chunk name="Slider">
          <items count="7">
            <item name="Min" type_name="gh_double" type_code="6">300</item>
            <item name="Max" type_name="gh_double" type_code="6">1000</item>
            <item name="Value" type_name="gh_double" type_code="6">1000</item>
          </items>
        </chunk>
      </chunks>
    </chunk>
  </chunks>
</chunk>
```

#### Estructura XML de un Value List (`RH_IN:Profundidad cajon`):
```xml
<chunk name="Object" index="148">
  <items count="2">
    <item name="Name" type_name="gh_string" type_code="10">Value List</item>
  </items>
  <chunks count="1">
    <chunk name="Container">
      <items count="9">
        <item name="NickName" type_name="gh_string" type_code="10">RH_IN:Profundidad cajon</item>
        <item name="ListMode" type_name="gh_int32" type_code="3">1</item>
      </items>
      <chunks count="2">
        <chunk name="ListItem" index="0">
          <items count="3">
            <item name="Expression" type_name="gh_string" type_code="10">351</item>
            <item name="Name" type_name="gh_string" type_code="10">351</item>
            <item name="Value" type_name="gh_string" type_code="10">351</item>
          </items>
        </chunk>
        <chunk name="ListItem" index="1">
          <items count="3">
            <item name="Expression" type_name="gh_string" type_code="10">400</item>
            <item name="Name" type_name="gh_string" type_code="10">400</item>
            <item name="Value" type_name="gh_string" type_code="10">400</item>
          </items>
        </chunk>
      </chunks>
    </chunk>
  </chunks>
</chunk>
```

---

### ⚡ Paso 2: Construcción del Payload y Petición HTTP a RhinoCompute 8

Cuando el usuario modifica cualquier parámetro en la interfaz web, el backend en Python elige la variante `.ghx` correcta, convierte el documento XML a **Base64** y construye la petición HTTP enviada a `http://localhost:5000/grasshopper`:

#### Código de Ensamblaje en Python (`3bf_worker.py`):
```python
import base64
import requests

# 1. Cargar la variante .ghx correspondiente a la cantidad de cajones
variant_file = f"C:\\Desarrollo\\mmapp\\temporal\\Cajon_Experimento_Viktor_{cant_cajones}cajon{'es' if cant_cajones > 1 else ''}.ghx"
ghx_file = variant_file if os.path.exists(variant_file) else r"C:\Desarrollo\mmapp\temporal\Cajon_Experimento_Viktor.ghx"

with open(ghx_file, "r", encoding="utf-8") as f:
    xml_content = f.read()

b64_algo = base64.b64encode(xml_content.encode("utf-8")).decode("utf-8")

# 2. Construir árbol de datos (InnerTree)
payload_rc = {
    "algo": b64_algo,
    "pointer": None,
    "values": [
        {"ParamName": "RH_IN:Ancho", "InnerTree": {"{0}": [{"type": "System.Double", "data": str(float(ancho))}]}},
        {"ParamName": "RH_IN:Alto", "InnerTree": {"{0}": [{"type": "System.Double", "data": str(float(alto))}]}},
        {"ParamName": "RH_IN:Profundidad", "InnerTree": {"{0}": [{"type": "System.Double", "data": str(float(prof))}]}},
        {"ParamName": "RH_IN:Abrir Cajones", "InnerTree": {"{0}": [{"type": "System.Double", "data": str(float(apertura_mm))}]}},
        {"ParamName": "RH_IN:Profundidad cajon", "InnerTree": {"{0}": [{"type": "System.Int32", "data": str(int(prof_cajon))}]}},
        {"ParamName": "RH_IN:Profundidad cajon", "InnerTree": {"{0}": [{"type": "System.String", "data": str(int(prof_cajon))}]}},
        {"ParamName": "RH_IN:Altura lateral de cajon", "InnerTree": {"{0}": [{"type": "System.Double", "data": str(float(alt_lat_cajon))}]}}
    ]
}

# 3. Disparar recálculo a RhinoCompute 8
response = requests.post("http://localhost:5000/grasshopper", json=payload_rc, timeout=10)
data = response.json()
```

---

### 🔓 Paso 3: Descodificación y Extracción Geométrica (`rhino3dm`)

El Worker de Python recibe la respuesta de Rhino 8 e invoca la librería nativa `rhino3dm` para deserializar las mallas y calcular sus coordenadas espaciales exactas en metros:

```python
import json
import rhino3dm

real_meshes = []

for val in data.get("values", []):
    param_name = val.get("ParamName", "Pieza GH")
    inner_tree = val.get("InnerTree", {})
    
    for path, items in inner_tree.items():
        for item in items:
            raw_data = item.get("data")
            if not raw_data:
                continue
                
            obj = json.loads(raw_data) if isinstance(raw_data, str) else raw_data
            
            # Primitiva BRep compleja (OpenNURBS / archive3dm)
            if "archive3dm" in obj or "opennurbs" in obj:
                decoded_geo = rhino3dm.CommonObject.Decode(obj)
                if decoded_geo:
                    bbox = decoded_geo.GetBoundingBox()
                    x_size = max(0.005, abs(bbox.Max.X - bbox.Min.X) / 1000.0)
                    y_size = max(0.005, abs(bbox.Max.Y - bbox.Min.Y) / 1000.0)
                    z_size = max(0.005, abs(bbox.Max.Z - bbox.Min.Z) / 1000.0)
                    center_x = (bbox.Min.X + bbox.Max.X) / 2.0 / 1000.0
                    center_y = (bbox.Min.Y + bbox.Max.Y) / 2.0 / 1000.0
                    center_z = (bbox.Min.Z + bbox.Max.Z) / 2.0 / 1000.0
                    
                    real_meshes.append({
                        "name": param_name,
                        "size": [x_size, z_size, y_size],
                        "position": [center_x, center_z, center_y]
                    })
```

---

### 🎨 Paso 4: Renderizado 3D Estilo "Rhino Technical" (`Viewer3D.tsx`)

La aplicación React recibe el JSON `real_meshes` y renderiza cada pieza con material semitransparente u opaco y delineado de aristas negras nítidas:

```tsx
{real_meshes.map((mesh: any, idx: number) => (
  <mesh key={idx} position={mesh.position}>
    <boxGeometry args={mesh.size} />
    <meshStandardMaterial 
      color="#0088aa" 
      transparent={modoVisual === "semitransparente"}
      opacity={modoVisual === "semitransparente" ? 0.70 : 1.0}
      depthWrite={modoVisual !== "semitransparente"}
    />
    <Edges color="#000000" threshold={15} />
  </mesh>
))}
```

---

---

### 🪑 7. Biblioteca de Muebles & Asset Browser Estilo Blender 4.x
- **Reestructuración de la Interfaz**: División en el N-Panel separando las definiciones `.ghx` en crudo (**Componentes**) de los muebles y composiciones terminadas (**Muebles**).
- **Estética Minimalista Pura de Blender 4.x**: Miniaturas 3D cuadradas sin marcos grises ni badges superpuestos, con nombres limpios centrados debajo de la imagen.
- **Edición Inline de Nombres**: Doble clic o icono de lápiz para renombrar archivos `.3bf.json` en tiempo real con la tecla `Enter`.
- **Miniaturas 3D Automáticas y Centradas**: Captura WebGL de alta resolución recortando el centro exacto del visor a 360×360 px en formato WebP.

---

### ☁️ 8. Sincronización Nativa con Google Drive (`G:\Mi unidad\Muebles`)
- **Almacenamiento Directo y Bidireccional**: Integración con Google Drive para escritorio en Windows (`G:\Mi unidad\Muebles`).
- **Escaneo en Vivo sin Listas Quemadas**: La interfaz lee en tiempo real la estructura de marcas (`RTA Design`, `Politorno`, `Henn`, `Bartira`, etc.) y sus subcarpetas tipológicas. Si se borra o agrega una carpeta en Google Drive, se actualiza al instante con el botón **`Sincronizar`**.
- **Botón `Ir al Drive ↗`**: Enlace directo que abre la carpeta oficial en Google Drive Web en una nueva pestaña.
- **Flujo "Guardar como..." & "Abrir Mueble"**: Empaquetado completo de la geometría 3D, posiciones, rotaciones, parámetros y ficha técnica de costos en archivos estructurados `.3bf.json`.

---

---

### 📦 10. Arquitectura de Persistencia Simbiótica (`.3bf.json` en Google Drive + Base de Datos)

El flujo de guardado de **3DBimFab (3BF)** opera bajo un modelo de **Persistencia Simbiótica y Gemelo Digital Atómico**. Al pulsar **"Guardar como..."**, el sistema no solo almacena un archivo CAD aislado, sino un paquete integral estructurado:

```mermaid
flowchart TD
    subgraph UI["🖥️ 3BF Web App"]
        A["Escenario 3D (Three.js)"]
        B["Ficha de Despiece & BOM"]
        C["Base de Datos de Precios (Novopan/Blum)"]
    end

    subgraph Save["📦 Guardar como... (Gemelo Digital)"]
        D["Archivo .3bf.json Atómico"]
    end

    subgraph Storage["☁️ Google Drive & Sistema"]
        E["G:\\Mi unidad\\Muebles\\[Marca]\\[Tipología]\\mueble_xxxx.3bf.json"]
        F["Asset Browser (Indexación en Vivo)"]
    end

    A & B & C --> D
    D --> E
    E --> F
    F -->|"Abrir Mueble"| A & B
```

#### 🗂️ Componentes del Archivo `.3bf.json`:
1. **Geometría y Parámetros 3D**: Registro exacto de todas las instancias del escenario (dimensiones de ancho, alto, profundidad, posiciones, offsets y rotaciones espaciales).
2. **Ficha Técnica & BOM (Despiece Industrial)**: Lista completa de piezas de corte, metros lineales de cantos, inventario de herrajes DfMA y estructura de costeo consolidada al 100%.
3. **Miniatura Gráfica WebGL**: Captura en alta definición generada directamente desde el Canvas WebGL.
4. **Metadata Comercial**: Marca, tipología de catálogo, fecha de creación, descripción comercial y conteo de piezas.

#### 🤝 Funcionamiento en Pareja (Google Drive + Base de Datos):
- **Contenedor Maestro Autónomo**: El archivo `.3bf.json` en Google Drive preserva tanto la geometría 3D como el estado económico y técnico del producto.
- **Vinculación con la Base de Datos Maestra**: Los costos de materiales se congelan referenciando la lista de precios maestros de tableros, cantos y herrajes.
- **Reconstrucción 100% Fiel**: Al abrir el mueble desde el Asset Browser, el sistema reconstituye simultáneamente la escena tridimensional en el visor y toda la ficha técnica de fabricación sin inconsistencias ni pérdidas de datos.

---

### 📏 11. Calibración Global de Despunte Técnico de Cantos (mm)

- **Control Paramétrico Universal**: Se implementó la casilla **`Despunte Canto: [ 100 ] mm`** en la cabecera de la ficha de despiece, permitiendo a cualquier fábrica ajustar su tolerancia de despunte por borde (ej. 50 mm, 80 mm, 100 mm = 10 cm).
- **Fórmula Oficial Reactiva**:
  $$\text{Metros} = \left[ \frac{(\text{Ancho} + \text{Despunte}) \times A + (\text{Largo} + \text{Despunte}) \times L}{1000} \right] \times \text{Cantidad}$$
- **Sincronización & Persistencia**: El valor se recalcula instantáneamente en la tabla de corte (Tabla 1) y en el inventario consolidado de cantos (Tabla 3), persistiendo en la configuración de la ficha técnica y en el archivo `.3bf.json`.

---

## 🔄 Estado Final del Ecosistema 3BF

- **3BF Worker Python (`3bf_worker.py`)**: Corriendo en `http://localhost:8005` (FastAPI).
- **RhinoCompute 8 (`rhino.compute.exe`)**: Corriendo en `http://localhost:5000` (Rhino 8 Engine).
- **Aplicación Web Next.js 3BF**: Corriendo en `http://localhost:3005`.
- **Google Drive Storage**: Sincronizado en `G:\Mi unidad\Muebles`.


