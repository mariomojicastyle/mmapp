import bpy
import os
import re

# --- CONFIGURACIÓN DEL PROYECTO ---
CODIGO_MANUAL = "M00001"
OUTPUT_DIR = r"C:\Desarrollo\mmapp\legacy-aplicativo-armado\public\M00001\models"
AUDIO_DIR = r"C:\Desarrollo\mmapp\legacy-aplicativo-armado\public\M00001\sounds\es"
FPS = 24

# Crear directorio de salida si no existe
if not os.path.exists(OUTPUT_DIR):
    os.makedirs(OUTPUT_DIR)

# --- DEFINICIÓN DE PASOS DE ARMADO ---
# Se asume que el mueble está de pie (vertical, centrado en 0,0,0)
PASOS = [
    {
        "paso": "01",
        "piezas": ["Pieza 01", "Pieza 04", "Pieza 09"],
        "eje_insercion": ("Z", 0.5),  # Descienden desde arriba (+0.5m)
        "duracion_seg": 22.0,
        "audio_file": "01_es.mp3"
    },
    {
        "paso": "02",
        "piezas": ["Pieza 05", "Pieza 12", "Pieza 03", "Pieza 10", "Pieza 20"],
        "eje_insercion": ("X", 0.5),  # Se deslizan desde la derecha (+0.5m)
        "duracion_seg": 38.0,
        "audio_file": "02_es.mp3"
    },
    {
        "paso": "03",
        "piezas": ["Pieza 06", "Pieza 08", "Pieza 02", "Pieza 07", "Pieza 19"],
        "eje_insercion": ("X", -0.5), # Se deslizan desde la izquierda o arriba (-0.5m)
        "duracion_seg": 38.0,
        "audio_file": "03_es.mp3"
    },
    {
        "paso": "04",
        "piezas": ["Pieza 24"], # Fondo del mueble (ensamble por detrás)
        "eje_insercion": ("Y", 0.5),  # Viene desde atrás en el eje Y (+0.5m)
        "duracion_seg": 28.0,
        "audio_file": "04_es.mp3"
    },
    {
        "paso": "05",
        "piezas": ["Pieza 21"], # Bisagras y puertas (preparación)
        "eje_insercion": ("Y", -0.4), # Viene desde el frente (-0.4m)
        "duracion_seg": 12.5,
        "audio_file": "05_es.mp3"
    },
    {
        "paso": "06",
        "piezas": ["Pieza 21"], # Puertas ensamblándose en el mueble
        "eje_insercion": ("Y", -0.4), # Vienen desde el frente (-0.4m)
        "duracion_seg": 22.5,
        "audio_file": "06_es.mp3"
    },
    {
        "paso": "07",
        "piezas": ["Pieza 11", "Pieza 14", "Pieza 13", "Pieza 15", "Pieza 23"], # Cajones armado
        "eje_insercion": ("Z", 0.3),  # Explosión vertical (+0.3m)
        "duracion_seg": 38.0,
        "audio_file": "07_es.mp3"
    },
    {
        "paso": "08",
        "piezas": ["Pieza 11", "Pieza 14", "Pieza 13", "Pieza 15", "Pieza 23"], # Inserción de cajones
        "eje_insercion": ("Y", -0.5), # Se insertan desde el frente (-0.5m en Y)
        "duracion_seg": 28.0,
        "audio_file": "08_es.mp3"
    }
]

def find_all_instances(base_name):
    """
    Busca todas las instancias de un objeto en Blender.
    Ej: Si base_name es 'Pieza 01', retornará ['Pieza 01', 'Pieza 01.001', 'Pieza 01.002', etc.]
    """
    matches = []
    pattern = re.compile(rf"^{re.escape(base_name)}(\.\d+)?$")
    for obj in bpy.data.objects:
        if pattern.match(obj.name):
            matches.append(obj)
    return matches

def limpiar_animaciones():
    """Elimina keyframes previos en todo el proyecto."""
    for obj in bpy.data.objects:
        obj.animation_data_clear()
    print("Animaciones previas limpiadas.")

def animar_y_exportar():
    # --- PASO 00: Exportar mueble completo armado y animado (Puertas y Cajones abriendo/cerrando) ---
    # Hacemos visible todo antes de exportar
    for obj in bpy.data.objects:
        if obj.type == 'MESH':
            obj.hide_viewport = False
            obj.hide_render = False
            
    p00_path = os.path.join(OUTPUT_DIR, "P00.glb")
    # Exportar P00.glb preservando las animaciones existentes en el archivo (abrir/cerrar puertas y cajones)
    bpy.ops.export_scene.gltf(
        filepath=p00_path,
        export_format='GLB',
        use_selection=False,
        use_visible=True,
        export_animations=True # Conserva y exporta las animaciones de apertura/cierre
    )
    print(f"Exportado paso 00 (Mueble Completo Animado): {p00_path}")

    # --- PROCESAR PASOS DE ARMADO EN SECUENCIA ---
    # Limpiamos las animaciones de apertura/cierre temporalmente en el timeline para generar la secuencia de armado.
    # NOTA IMPORTANTE: Al finalizar, el usuario NO debe guardar el archivo .blend para conservar sus animaciones de apertura/cierre originales.
    limpiar_animaciones()
    
    # Asegurar que el sequence_editor exista para sincronizar audios
    if not bpy.context.scene.sequence_editor:
        bpy.context.scene.sequence_editor_create()
        
    acumulado_frames = 1
    
    for idx, p_info in enumerate(PASOS):
        paso_num = p_info["paso"]
        piezas_base = p_info["piezas"]
        eje, offset = p_info["eje_insercion"]
        duracion_frames = int(p_info["duracion_seg"] * FPS)
        
        start_frame = acumulado_frames
        end_frame = start_frame + duracion_frames
        
        print(f"\n--- PROGRAMANDO PASO {paso_num} (Frames {start_frame} a {end_frame}) ---")
        
        # 1. Insertar audio en el secuenciador de Blender para control en viewport
        audio_path = os.path.join(AUDIO_DIR, p_info["audio_file"])
        if os.path.exists(audio_path):
            try:
                bpy.context.scene.sequence_editor.sequences.new_sound(
                    name=p_info["audio_file"],
                    filepath=audio_path,
                    channel=idx + 1,
                    frame_start=start_frame
                )
                print(f"Audio insertado en timeline: {p_info['audio_file']}")
            except Exception as e:
                print(f"No se pudo insertar pista de audio: {e}")
        
        # 2. Animar las piezas del paso actual
        for p_base in piezas_base:
            objs = find_all_instances(p_base)
            if not objs:
                print(f"Alerta: No se encontraron objetos con patrón '{p_base}'")
                continue
                
            for obj in objs:
                # Keyframe final (posición de ensamblado a 0,0,0 relativo a su origen final)
                bpy.context.scene.frame_set(end_frame)
                obj.keyframe_insert(data_path="location", index=-1)
                
                # Keyframe inicial (desplazado en el eje de inserción)
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
                print(f"Animada entrada para: {obj.name}")

        # 3. Configurar visibilidad secuencial para la exportación de este paso
        # Ocultamos todas las piezas que pertenecen a pasos futuros
        piezas_acumuladas = []
        for i in range(idx + 1):
            piezas_acumuladas.extend(PASOS[i]["piezas"])
            
        piezas_futuras = []
        for i in range(idx + 1, len(PASOS)):
            piezas_futuras.extend(PASOS[i]["piezas"])

        # Ocultar piezas futuras
        for p_futura in piezas_futuras:
            objs_futuros = find_all_instances(p_futura)
            for o in objs_futuros:
                o.hide_viewport = True
                o.hide_render = True

        # Mostrar piezas acumuladas (las de este paso y anteriores)
        for p_acumulada in piezas_acumuladas:
            objs_acumulados = find_all_instances(p_acumulada)
            for o in objs_acumulados:
                o.hide_viewport = False
                o.hide_render = False

        # 4. Exportar GLB específico del paso actual
        export_path = os.path.join(OUTPUT_DIR, f"P{paso_num}.glb")
        
        # Configurar rango del timeline para que solo exporte la animación de este paso
        bpy.context.scene.frame_start = start_frame
        bpy.context.scene.frame_end = end_frame
        
        bpy.ops.export_scene.gltf(
            filepath=export_path,
            export_format='GLB',
            use_selection=False,
            use_visible=True, # Exporta solo lo que es visible en viewport
            export_animations=True # Bake animations
        )
        print(f"Exportado exitosamente: P{paso_num}.glb")
        
        # Avanzar el timeline agregando un pequeño espacio (1 segundo) para pausas
        acumulado_frames = end_frame + 24
        
    # Al finalizar, restaurar la visibilidad de todo el modelo y el rango del timeline completo
    for obj in bpy.data.objects:
        if obj.type == 'MESH':
            obj.hide_viewport = False
            obj.hide_render = False
            
    bpy.context.scene.frame_start = 1
    bpy.context.scene.frame_end = acumulado_frames
    print("\n--- ¡PROCESO DE EXPORTACIÓN FINALIZADO CON ÉXITO! ---")
    print("IMPORTANTE: Cierre Blender SIN guardar los cambios en Master_M00001.blend para mantener sus animaciones originales de apertura/cierre intactas.")

if __name__ == "__main__":
    animar_y_exportar()
