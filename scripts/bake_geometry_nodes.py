import bpy
import mathutils
import os

def bake_geometry_nodes_instances(emitter_prefix="Plane", start_frame=None, end_frame=None, export_glb=True, revert_blend=True, export_path=None):
    """
    Bakea las animaciones de todos los Geometry Nodes asociados a objetos que empiecen con 'emitter_prefix'
    DIRECTAMENTE en los objetos reales de la escena, exporta un único archivo .glb unificado y
    revierte el archivo .blend a su estado original.
    
    CUIDADO: Guarda tu archivo .blend antes de correr el script, ya que revertirá
    al último estado guardado en el disco al finalizar la exportación.
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
    print(f"INICIANDO BAKE DIRECTO DE MÚLTIPLES GEOMETRY NODES")
    print(f"Prefijo de Emisores: '{emitter_prefix}'")
    print(f"Emisores Encontrados ({len(emitter_objs)}): {', '.join(o.name for o in emitter_objs)}")
    print(f"Rango de Frames: {start_frame} a {end_frame}")
    print(f"==================================================")
    
    # Estructura para guardar la animación leída: {objeto_original: [(frame, matrix_world)]}
    bake_data = {}
    
    # Guardar estado y selección actual
    active_obj = bpy.context.active_object
    selected_objs = list(bpy.context.selected_objects)
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
            
            # Aplicar la matriz de transformación global
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
            
    # Eliminar definitivamente todos los objetos emisores (Plane, Plane.001, etc.)
    for emitter_obj in emitter_objs:
        if active_obj == emitter_obj:
            active_obj = None
        if emitter_obj in selected_objs:
            selected_objs.remove(emitter_obj)
            
        for col in list(emitter_obj.users_collection):
            col.objects.unlink(emitter_obj)
        bpy.data.objects.remove(emitter_obj, do_unlink=True)
        print(f" -> Objeto emisor '{emitter_obj.name}' eliminado de la escena.")
            
    # --- FASE 4: EXPORTACIÓN AUTOMÁTICA A GLB ---
    if export_glb:
        if not export_path:
            blend_filepath = bpy.data.filepath
            if not blend_filepath:
                print("ERROR: El archivo .blend no ha sido guardado. No se puede auto-detectar ruta de exportación.")
                revert_blend = False
                export_glb = False
            else:
                directory = os.path.dirname(blend_filepath)
                filename = os.path.basename(blend_filepath)
                name_no_ext = os.path.splitext(filename)[0]
                export_path = os.path.join(directory, name_no_ext + ".glb")
                
        if export_glb and export_path:
            print(f"\nFase 3: Exportando a archivo GLB en: {export_path}...")
            try:
                # Exportar solo objetos visibles (sin los Plane porque ya los borramos)
                bpy.ops.export_scene.gltf(
                    filepath=export_path,
                    export_format='GLB',
                    use_selection=False,
                    export_visible=True, # Solo exportar visibles
                    export_animations=True
                )
                print(" -> Exportación GLB completada con éxito.")
            except Exception as e:
                print(f"ERROR durante la exportación GLB: {str(e)}")
                revert_blend = False # Evitar revertir si falla la exportación para revisar
                
    # --- FASE 5: REVERTIR ARCHIVO .BLEND (Opcional) ---
    if revert_blend:
        print("\nFase 4: Revirtiendo archivo .blend para descartar cambios locales...")
        bpy.ops.wm.revert_mainfile()
        print(" -> Archivo .blend restaurado a su estado original guardado.")
    else:
        # Restaurar la selección y el frame original del usuario
        scene.frame_set(original_frame)
        if active_obj:
            try:
                bpy.context.view_layer.objects.active = active_obj
            except Exception:
                pass
        for o in selected_objs:
            try:
                o.select_set(True)
            except Exception:
                pass
            
    print(f"\n==================================================")
    print(f"BAKE DIRECTO COMPLETADO EXITOSAMENTE")
    print(f"Los movimientos de todos los Geometry Nodes han sido grabados")
    print(f"directamente en tus objetos reales de la escena y unificados en GLB.")
    print(f"==================================================\n")

if __name__ == "__main__":
    # Escanea y procesa todos los objetos que empiecen con "Plane" (Plane, Plane.001, Plane.002, etc.)
    # Exporta un único GLB unificado y revierte el .blend local
    bake_geometry_nodes_instances(
        emitter_prefix="Plane",
        export_glb=True,
        revert_blend=True
    )
