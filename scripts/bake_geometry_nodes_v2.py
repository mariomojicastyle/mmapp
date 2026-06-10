import bpy
import mathutils
import os

def bake_geometry_nodes_instances(emitter_prefix="Plane", start_frame=None, end_frame=None, export_glb=True):
    """
    Bakea las animaciones de todos los Geometry Nodes asociados a objetos que empiecen con 'emitter_prefix'
    DIRECTAMENTE en los objetos reales de la escena, elimina los emisores, y exporta a .glb
    utilizando el modo de animación 'ACTIVE_ACTIONS' (Active actions merged).
    """
    scene = bpy.context.scene
    
    # 1. Configurar rango de frames
    if start_frame is None:
        start_frame = scene.frame_start
    if end_frame is None:
        end_frame = scene.frame_end
        
    # 2. Buscar todos los objetos emisores que inicien con el prefijo (ej: Plane, Plane.001, Plane.002...)
    emitter_objs = [obj for obj in bpy.data.objects if obj.name.startswith(emitter_prefix)]
    if not emitter_objs:
        print(f"ERROR: No se encontraron objetos emisores que inicien con el prefijo '{emitter_prefix}'.")
        return
        
    print(f"\n==================================================")
    print(f"INICIANDO BAKE DIRECTO Y EXPORTACIÓN GLB (V2)")
    print(f"Prefijo de Emisores: '{emitter_prefix}'")
    print(f"Emisores Encontrados ({len(emitter_objs)}): {', '.join(o.name for o in emitter_objs)}")
    print(f"Rango de Frames: {start_frame} a {end_frame}")
    print(f"==================================================")
    
    # Estructura para guardar la animación leída: {objeto_original: [(frame, matrix_world)]}
    bake_data = {}
    
    # Guardar estado y selección actual usando nombres (evita ReferenceError al eliminar objetos)
    active_name = bpy.context.active_object.name if bpy.context.active_object else None
    selected_names = [o.name for o in bpy.context.selected_objects if o]
    original_frame = scene.frame_current
    
    # Deseleccionar todo para evitar interferencias
    bpy.ops.object.select_all(action='DESELECT')
    
    # --- FASE 1: LECTURA EN MEMORIA (Sin modificar la escena) ---
    print("Fase 1: Escaneando transformaciones desde todos los Geometry Nodes...")
    for frame in range(start_frame, end_frame + 1):
        scene.frame_set(frame)
        
        # Obtener el depsgraph evaluado en este frame
        depsgraph = bpy.context.evaluated_depsgraph_get()
        
        # Obtener la versión evaluada de todos los emisores en este frame
        eval_emitters = []
        for emitter_obj in emitter_objs:
            try:
                eval_emitters.append(emitter_obj.evaluated_get(depsgraph))
            except Exception:
                pass
        
        # Guardar los datos de las instancias de este frame
        for inst in depsgraph.object_instances:
            if inst.is_instance and inst.parent in eval_emitters:
                eval_inst_obj = inst.object
                if not eval_inst_obj:
                    continue
                
                orig_inst_obj = eval_inst_obj.original
                
                # Evitar hornear los emisores mismos
                if orig_inst_obj in emitter_objs:
                    continue
                
                # Inicializar el registro del objeto si es nuevo
                if orig_inst_obj not in bake_data:
                    bake_data[orig_inst_obj] = []
                
                # Guardar la matriz de transformación absoluta
                matrix_copy = inst.matrix_world.copy()
                
                # Evitar guardar datos duplicados para el mismo objeto en el mismo frame
                if not any(f == frame for f, _ in bake_data[orig_inst_obj]):
                    bake_data[orig_inst_obj].append((frame, matrix_copy))
                
    print(f" -> Escaneo completo. Se detectaron {len(bake_data)} objetos reales animados entre todos los emisores.")

    # --- FASE 2: DESACTIVAR MODIFICADORES DE GEOMETRY NODES ---
    # Desactivamos el modificador en cada uno de los emisores para romper el feedback loop
    for emitter_obj in emitter_objs:
        for mod in emitter_obj.modifiers:
            if mod.type == 'NODES':
                mod.show_viewport = False
                mod.show_render = False
                print(f" -> Modificador '{mod.name}' en '{emitter_obj.name}' desactivado temporalmente.")

    # --- FASE 3: ESCRITURA DE KEYFRAMES DIRECTO EN OBJETOS ORIGINALES ---
    print("\nFase 2: Aplicando matrices y escribiendo keyframes en los objetos...")
    for orig_obj, keyframes in list(bake_data.items()):
        print(f" -> Horneando: '{orig_obj.name}' ({len(keyframes)} frames)")
        
        # Limpiar cualquier animación previa para evitar conflictos
        orig_obj.animation_data_clear()
        
        for frame, matrix in keyframes:
            scene.frame_set(frame)
            
            # Aplicar la matriz de transformación global directamente
            orig_obj.matrix_world = matrix
            
            # Insertar keyframes de Posición, Rotación y Escala
            orig_obj.keyframe_insert(data_path="location", frame=frame)
            
            if orig_obj.rotation_mode == 'QUATERNION':
                orig_obj.keyframe_insert(data_path="rotation_quaternion", frame=frame)
            elif orig_obj.rotation_mode == 'AXIS_ANGLE':
                orig_obj.keyframe_insert(data_path="rotation_axis_angle", frame=frame)
            else:
                orig_obj.keyframe_insert(data_path="rotation_euler", frame=frame)
                
            orig_obj.keyframe_insert(data_path="scale", frame=frame)
            
    # Guardar los nombres de los emisores para poder imprimir sus nombres después de eliminarlos
    emitter_names = [obj.name for obj in emitter_objs]
    
    # Eliminar definitivamente todos los objetos emisores (Plane, Plane.001, etc.)
    for emitter_obj in emitter_objs:
        try:
            for col in list(emitter_obj.users_collection):
                col.objects.unlink(emitter_obj)
            bpy.data.objects.remove(emitter_obj, do_unlink=True)
        except Exception as e:
            print(f"Advertencia al eliminar emisor {emitter_obj}: {e}")
            
    for name in emitter_names:
        print(f" -> Objeto emisor '{name}' eliminado de la escena.")
            
    # --- FASE 4: EXPORTACIÓN GLB ---
    if export_glb:
        blend_filepath = bpy.data.filepath
        if not blend_filepath:
            print("ERROR: El archivo .blend no ha sido guardado. No se puede exportar GLB.")
        else:
            directory = os.path.dirname(blend_filepath)
            filename = os.path.basename(blend_filepath)
            name_no_ext = os.path.splitext(filename)[0]
            export_path = os.path.join(directory, name_no_ext + ".glb")
            
            print(f"\nFase 3: Exportando a archivo GLB en: {export_path}...")
            try:
                # Exportar escena usando ACTIVE_ACTIONS para fusionar todas las pistas de animación
                bpy.ops.export_scene.gltf(
                    filepath=export_path,
                    export_format='GLB',
                    use_selection=False,
                    use_visible=False,  # Falso para incluir objetos ocultos en la escena
                    export_animations=True,
                    export_animation_mode='ACTIVE_ACTIONS'
                )
                print(" -> Exportación GLB completada con éxito.")
            except Exception as e:
                print(f"ERROR durante la exportación GLB: {str(e)}")
            
    # Restaurar la selección y el frame original del usuario usando los nombres guardados
    scene.frame_set(original_frame)
    if active_name and active_name in bpy.data.objects:
        try:
            bpy.context.view_layer.objects.active = bpy.data.objects[active_name]
        except Exception:
            pass
    for name in selected_names:
        if name in bpy.data.objects:
            try:
                bpy.data.objects[name].select_set(True)
            except Exception:
                pass
            
    print(f"\n==================================================")
    print(f"BAKE Y EXPORTACIÓN COMPLETADOS EXITOSAMENTE (V2)")
    print(f"GLB exportado unificado con animación 'Active Actions Merged'.")
    print(f"==================================================\n")

if __name__ == "__main__":
    # Escanea, procesa todo, elimina los Plane... y exporta el GLB
    bake_geometry_nodes_instances(emitter_prefix="Plane", export_glb=True)
