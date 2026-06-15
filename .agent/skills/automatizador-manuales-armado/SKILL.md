---
name: automatizador-manuales-armado
description: Automatiza la creación de animaciones de armado en Blender (vía scripts de Python bpy), coordina tiempos con archivos de audio, genera textos explicativos para locución y apoya en la exportación secuencial de modelos GLB.
---

# Automatizador de Manuales de Armado (Blender + Audio)

## Meta
Proveer un framework de automatización para generar de forma ágil y estructurada los recursos 3D y de audio de los manuales interactivos de armado. Facilita la creación de scripts de Python (`bpy`) para animar piezas en Blender en base a tiempos de audio, redactar los guiones de locución y automatizar las exportaciones de archivos `P01.glb` a `Pxx.glb`.

## Instrucciones

### 1. Guión y Locución (Generación de Texto de Audio)
Cuando el usuario solicita ayuda para redactar los audios explicativos de los pasos de armado, sigue estas directrices:
- **Tono**: Claro, instructivo, pausado y profesional (en español o inglés según se requiera).
- **Estructura**:
  - **Paso 00 (Bienvenida)**: Saludo, presentación del mueble, mención de herramientas necesarias y recomendación de armar sobre una alfombra o el mismo cartón del empaque.
  - **Pasos Intermedios**: Indicar qué piezas tomar (usando su número e identificador físico, ej. *«Toma la cubierta número 01 y los dos laterales número 03 y 04...»*), qué herrajes usar (ej. *«Inserta 4 pernos minifix en las perforaciones...»*) y la acción específica a realizar.
  - **Paso Final (Completado)**: Felicitación por terminar el armado e indicaciones finales de uso o seguridad.

### 2. Sincronización de Animación y Tiempos de Audio en Blender
Para coordinar los movimientos de las piezas en el timeline de Blender con la duración de los audios explicativos:
- **Tasa de Refresco estándar**: Usar **24 fps** (fotogramas por segundo) por defecto en Blender.
- **Fórmula de Duración**: `Frames = Duración en Segundos * 24`.
- **Secuenciador de Blender**: Se puede programar la inserción de la pista de audio en el Sequencer mediante Python para verificar su longitud o ajustar los movimientos en la línea de tiempo.

### 3. Plantilla Base de Script Python (`bpy`) para Blender
Utiliza y adapta el siguiente script de Python dentro de Blender para automatizar la animación y exportación:

```python
import bpy
import os

# --- CONFIGURACIÓN DEL PROYECTO ---
CODIGO_MANUAL = "M00001"
OUTPUT_DIR = r"C:\Desarrollo\mmapp\mario-mojica-plataforma\public\{}\models".format(CODIGO_MANUAL)
AUDIO_DIR = r"C:\Desarrollo\mmapp\mario-mojica-plataforma\public\{}\sounds\es".format(CODIGO_MANUAL)
FPS = 24

# Crear directorio de salida si no existe
if not os.path.exists(OUTPUT_DIR):
    os.makedirs(OUTPUT_DIR)

# --- DEFINICIÓN DE PASOS DE ARMADO ---
# Cada paso define:
# - 'piezas': lista de nombres de objetos en Blender que se incorporan en este paso.
# - 'eje_insercion': eje de movimiento ('X', 'Y', 'Z') y distancia (en metros) para la animación de entrada.
# - 'duracion_seg': duración estimada del audio para ajustar el timeline.
# - 'audio_file': nombre del archivo de audio en el Sequencer.
PASOS = [
    {
        "paso": "01",
        "piezas": ["Pieza 03", "Pieza 04", "Pieza 05"],
        "eje_insercion": ("Z", 0.5), # Viene desde arriba (+0.5m en Z)
        "duracion_seg": 8.0,
        "audio_file": "01_es.mp3"
    },
    {
        "paso": "02",
        "piezas": ["Pieza 01", "Pieza 02"],
        "eje_insercion": ("Y", -0.4), # Viene desde el frente (-0.4m en Y)
        "duracion_seg": 6.5,
        "audio_file": "02_es.mp3"
    }
]

def limpiar_animaciones():
    """Elimina keyframes previos del proyecto."""
    for obj in bpy.data.objects:
        obj.animation_data_clear()
    print("Animaciones previas limpiadas.")

def animar_y_exportar():
    limpiar_animaciones()
    
    # Asegurar que el secuenciador de audio esté activo
    if not bpy.context.scene.sequence_editor:
        bpy.context.scene.sequence_editor_create()
    
    # 1. PASO 00: Exportar mueble completo ensamblado estático
    # Hacer visible todo
    for obj in bpy.data.objects:
        if obj.type == 'MESH':
            obj.hide_viewport = False
            obj.hide_render = False
    
    # Exportar P00.glb
    p00_path = os.path.join(OUTPUT_DIR, "P00.glb")
    bpy.ops.export_scene.gltf(filepath=p00_path, export_format='GLB', use_selection=False)
    print("Exportado paso 00 (Mueble Completo):", p00_path)

    # 2. PROCESAR CADA PASO DE ARMADO
    acumulado_frames = 1
    
    for idx, p_info in enumerate(PASOS):
        paso_num = p_info["paso"]
        piezas_del_paso = p_info["piezas"]
        eje, offset = p_info["eje_insercion"]
        duracion_frames = int(p_info["duracion_seg"] * FPS)
        
        start_frame = acumulado_frames
        end_frame = start_frame + duracion_frames
        
        print(f"\n--- PROGRAMANDO PASO {paso_num} (Frames {start_frame} a {end_frame}) ---")
        
        # Insertar pista de audio en el Sequencer (canal 1)
        audio_path = os.path.join(AUDIO_DIR, p_info["audio_file"])
        if os.path.exists(audio_path):
            bpy.context.scene.sequence_editor.sequences.new_sound(
                name=p_info["audio_file"],
                filepath=audio_path,
                channel=idx + 1,
                frame_start=start_frame
            )
        
        # Animar entrada de las piezas de este paso
        for name in piezas_del_paso:
            obj = bpy.data.objects.get(name)
            if not obj:
                print(f"Alerta: Objeto '{name}' no encontrado en el Outliner.")
                continue
            
            # Guardar la posición de destino final (ensamblado) en el frame final
            bpy.context.scene.frame_set(end_frame)
            obj.keyframe_insert(data_path="location", index=-1)
            
            # Calcular la posición inicial de explosión (al inicio del paso)
            bpy.context.scene.frame_set(start_frame)
            pos_inicial = list(obj.location)
            if eje == 'X':
                pos_inicial[0] += offset
            elif eje == 'Y':
                pos_inicial[1] += offset
            elif eje == 'Z':
                pos_inicial[2] += offset
            
            obj.location = pos_inicial
            obj.keyframe_insert(data_path="location", index=-1)
        
        # Configurar visibilidad secuencial para exportar este paso individualmente
        # Ocultar piezas de los pasos siguientes (que aún no se deben ver)
        for next_step_idx in range(idx + 1, len(PASOS)):
            for p_name in PASOS[next_step_idx]["piezas"]:
                o = bpy.data.objects.get(p_name)
                if o:
                    o.hide_viewport = True
                    o.hide_render = True
                    
        # Mostrar piezas de este paso y de los pasos anteriores
        for prev_step_idx in range(idx + 1):
            for p_name in PASOS[prev_step_idx]["piezas"]:
                o = bpy.data.objects.get(p_name)
                if o:
                    o.hide_viewport = False
                    o.hide_render = False
        
        # Exportar P[paso].glb
        export_path = os.path.join(OUTPUT_DIR, f"P{paso_num}.glb")
        # Exportar solo lo visible en el viewport
        bpy.ops.export_scene.gltf(
            filepath=export_path, 
            export_format='GLB', 
            use_selection=False,
            export_visible=True # Importante: exporta solo objetos visibles
        )
        print(f"Exportado paso P{paso_num}.glb con éxito.")
        
        acumulado_frames = end_frame + 24 # 1 segundo de pausa entre pasos
        
    # Restaurar visibilidad global
    for obj in bpy.data.objects:
        if obj.type == 'MESH':
            obj.hide_viewport = False
            obj.hide_render = False

animar_y_exportar()
```

## Restricciones
- **No silenciar errores**: Al generar código de Blender Python, envuelve las asignaciones en bloques condicionales (ej. `if obj:`) para prevenir excepciones si el Outliner tiene nombres diferentes a los previstos.
- **Respetar unidades**: Recordar que Blender por defecto opera en metros. Asegurar que las distancias de explosión (`offset`) sean proporcionales (ej. `0.3` a `0.6` metros son adecuados para despieces de maderas).
- **Modo Silencioso de Consola**: Cuando guíes en el uso del script, documenta cómo abrir la Consola del Sistema en Blender (Window > Toggle System Console) para ver los prints en tiempo real.

## Ejemplos

### Ejemplo 1: Generación de Guión y Configuración de Movimientos
**Entrada del usuario**: *"Tengo una mesa de noche con 2 laterales, 1 repisa intermedia y 1 cubierta. Ayúdame con el guión y los ejes de movimiento para el script"*
**Salida esperada**:
1. Propuesta de Guión de Audio por pasos (Paso 00 a Paso 03).
2. Estructura del diccionario `PASOS` lista para copiar y pegar en el script de Blender, especificando el eje e inserción idónea (ej. repisa desde atrás en Y, laterales deslizándose simétricamente en X, cubierta desde arriba en Z).
