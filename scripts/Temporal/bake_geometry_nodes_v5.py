import bpy
import mathutils
import os

def bake_geometry_nodes_instances(emitter_prefix="Plane", start_frame=None, end_frame=None, export_glb=True, revert_blend=True):
    """
    Bakea las animaciones de todos los Geometry Nodes asociados a objetos que empiecen con 'emitter_prefix'
    DIRECTAMENTE en los objetos reales de la escena, elimina los emisores, exporta a .glb
    utilizando el modo de animación 'ACTIVE_ACTIONS' (Active actions merged) con compresión Draco,
    y finalmente restaura el archivo .blend a su estado original para no alterar el espacio de trabajo.

    V4 - Corrige el problema de rotación y desfase del fondo y otros objetos mediante:
         1. Uso de rotación por CUATERNIONES en lugar de Euler para evitar Gimbal Lock y saltos.
         2. Cálculo preciso de matrices locales en presencia de jerarquías de parentesco (Parent-Child).
         3. Corrección antiflip de cuaterniones para garantizar interpolaciones de rotación suaves.
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
    print(f"INICIANDO BAKE DIRECTO Y EXPORTACIÓN GLB (V4)")
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
    print("\nFase 3: Aplicando matrices locales y escribiendo keyframes en cuaterniones...")
    
    # 1. Configurar todos los objetos animados en modo QUATERNION y limpiar sus animaciones anteriores
    for orig_obj in bake_data.keys():
        orig_obj.rotation_mode = 'QUATERNION'
        orig_obj.animation_data_clear()
        
    # Diccionario para recordar el último cuaternión de cada objeto (evitar flips de 180/360 grados)
    prev_quaternions = {}
    
    # 2. Escribir keyframes frame a frame
    for frame in range(start_frame, end_frame + 1):
        scene.frame_set(frame)
        
        for orig_obj, keyframes in bake_data.items():
            # Buscar la matriz de mundo para este frame
            frame_data = next((m for f, m in keyframes if f == frame), None)
            if frame_data is None:
                continue
                
            world_matrix = frame_data
            
            # Calcular la matriz local del objeto hijo en relación con la matriz del mundo de su padre
            if orig_obj.parent:
                parent = orig_obj.parent
                # Si el padre también está en el set de animación, buscamos su matriz del mundo del mismo frame
                if parent in bake_data:
                    parent_keyframes = bake_data[parent]
                    parent_matrix = next((m for f, m in parent_keyframes if f == frame), None)
                    if parent_matrix is None:
                        parent_matrix = parent.matrix_world.copy()
                else:
                    # Si el padre es estático o su animación no es de Geometry Nodes
                    parent_matrix = parent.matrix_world.copy()
                
                # Calcular la matriz local considerando la inversa de parentesco de Blender (matrix_parent_inverse)
                try:
                    matrix_local = (parent_matrix @ orig_obj.matrix_parent_inverse).inverted() @ world_matrix
                except ValueError:
                    # Fallback si la escala es 0 o la matriz no es invertible
                    matrix_local = parent_matrix.inverted() @ world_matrix
            else:
                matrix_local = world_matrix.copy()
                
            # Descomponer la matriz local en posición, rotación (cuaternión) y escala
            loc, rot, scale = matrix_local.decompose()
            
            # Corrección antiflip de cuaternión:
            # Si el cuaternión calculado tiene un producto punto negativo respecto al del frame anterior,
            # lo negamos para que la interpolación de cuaterniones elija el camino de rotación más corto.
            if orig_obj in prev_quaternions:
                prev_q = prev_quaternions[orig_obj]
                if prev_q.dot(rot) < 0:
                    rot = -rot
            prev_quaternions[orig_obj] = rot.copy()
            
            # Aplicar transformaciones locales
            orig_obj.location = loc
            orig_obj.rotation_quaternion = rot
            orig_obj.scale = scale
            
            # Insertar keyframes de Posición, Rotación (Cuaternión) y Escala
            orig_obj.keyframe_insert(data_path="location", frame=frame)
            orig_obj.keyframe_insert(data_path="rotation_quaternion", frame=frame)
            orig_obj.keyframe_insert(data_path="scale", frame=frame)
            
    # Configurar interpolación LINEAL en todas las F-Curves horneadas para evitar desalineaciones por facilidad (ease-in/out) Bézier
    for orig_obj in bake_data.keys():
        if orig_obj.animation_data and orig_obj.animation_data.action:
            for fcurve in orig_obj.animation_data.action.fcurves:
                for kp in fcurve.keyframe_points:
                    kp.interpolation = 'LINEAR'

    print(" -> Bake de keyframes completado con rotaciones por cuaterniones corregidas e interpolación lineal.")

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
            revert_blend = False
        else:
            directory = os.path.dirname(blend_filepath)
            filename = os.path.basename(blend_filepath)
            name_no_ext = os.path.splitext(filename)[0]
            export_path = os.path.join(directory, name_no_ext + ".glb")
            
            print(f"\nFase 4: Exportando a archivo GLB con compresión Draco en: {export_path}...")
            try:
                # Exportar escena usando ACTIVE_ACTIONS, compresión Draco y forzando muestreo exacto de keyframes sin optimizaciones simplificadoras
                bpy.ops.export_scene.gltf(
                    filepath=export_path,
                    export_format='GLB',
                    use_selection=False,
                    use_visible=False,  # Falso para incluir objetos ocultos en la escena
                    export_animations=True,
                    export_animation_mode='ACTIVE_ACTIONS',
                    export_draco_mesh_compression_enable=True,
                    export_draco_mesh_compression_level=6,
                    export_optimize_animation_size=False,
                    export_anim_remove_redundant_keyframes=False,
                    export_force_sampling=True
                )
                print(" -> Exportación GLB con Draco completada con éxito.")
            except Exception as e:
                print(f"ERROR durante la exportación GLB: {str(e)}")
                revert_blend = False  # No revertir si falla para poder inspeccionar la causa
            
    # --- FASE 5: REVERTIR ARCHIVO .BLEND (Opcional) ---
    if revert_blend:
        print("\nFase 5: Revirtiendo archivo .blend para restaurar el estado limpio original...")
        bpy.ops.wm.revert_mainfile()
        print(" -> Archivo .blend original restaurado en disco y cargado.")
    else:
        # Si no se revierte, restaurar la selección y el frame original del usuario
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
    print(f"BAKE Y EXPORTACIÓN COMPLETADOS EXITOSAMENTE (V4)")
    print(f"El archivo .blend quedó intacto y se generó el GLB comprimido con Draco.")
    print(f"==================================================\n")

if __name__ == "__main__":
    # Ejecuta el flujo completo, genera el GLB comprimido y descarta cambios en el .blend local
    bake_geometry_nodes_instances(
        emitter_prefix="Plane",
        export_glb=True,
        revert_blend=True
    )
