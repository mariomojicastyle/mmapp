import bpy
import mathutils
import os

def bake_geometry_nodes_instances(emitter_prefix="Plane", start_frame=None, end_frame=None, export_glb=True, revert_blend=False):
    """
    V20 (Versión de Producción Final - Jerarquía de Grupo Rígida)
    
    Esta versión soluciona el problema de desalineación y convergencia de piezas laterales
    (o frontales/traseras) en WebGL mediante una estructura de parenting jerárquico:
    1. Crea un Objeto Vacío (Bake_Pivot_Group) en la posición de 'Peça 10'.
    2. Emparenta todos los objetos animados a este Vacío central.
    3. Para cada frame, lee las matrices de mundo de la evaluación de Geometry Nodes.
    4. Aplica y hornea la animación del Vacío central en espacio mundo.
    5. Para cada objeto hijo, calcula su matriz LOCAL relativa al Vacío central y la
       hornea en sus canales de animación local.
    
    Esto asegura que durante las fases de rotación rígida, la rotación local de los hijos
    sea constante (usualmente identidad o un valor fijo), delegando la rotación física
    completamente al padre común. WebGL evalúa la transformación rígida de forma perfecta,
    impidiendo cualquier tipo de desalineación o convergencia.
    """
    scene = bpy.context.scene
    
    # 1. Configurar rango de frames
    if start_frame is None:
        start_frame = scene.frame_start
    if end_frame is None:
        end_frame = scene.frame_end
        
    # 2. Buscar todos los objetos emisores
    emitter_objs = [obj for obj in bpy.data.objects if obj.name.startswith(emitter_prefix)]
    if not emitter_objs:
        print(f"ERROR: No se encontraron objetos emisores que inicien con el prefijo '{emitter_prefix}'.")
        return
        
    print(f"\n==================================================")
    print(f"INICIANDO BAKE Y EXPORTACIÓN GLB (V20 - JERARQUÍA RÍGIDA)")
    print(f"Prefijo de Emisores: '{emitter_prefix}'")
    print(f"Emisores Encontrados ({len(emitter_objs)}): {', '.join(o.name for o in emitter_objs)}")
    print(f"Rango de Frames: {start_frame} a {end_frame}")
    print(f"==================================================")
    
    bake_data = {}
    bpy.ops.object.select_all(action='DESELECT')
    
    try:
        # --- FASE 1: LECTURA EN MEMORIA ---
        print("Fase 1: Escaneando transformaciones desde todos los Geometry Nodes...")
        for frame in range(start_frame, end_frame + 1):
            scene.frame_set(frame)
            depsgraph = bpy.context.evaluated_depsgraph_get()
            
            eval_emitters = []
            for emitter_obj in emitter_objs:
                try:
                    eval_emitters.append(emitter_obj.evaluated_get(depsgraph))
                except Exception:
                    pass
            
            for inst in depsgraph.object_instances:
                if inst.is_instance and inst.parent in eval_emitters:
                    eval_inst_obj = inst.object
                    if not eval_inst_obj:
                        continue
                    orig_inst_obj = eval_inst_obj.original
                    if orig_inst_obj in emitter_objs:
                        continue
                    
                    if orig_inst_obj not in bake_data:
                        bake_data[orig_inst_obj] = []
                    
                    matrix_copy = inst.matrix_world.copy()
                    if not any(f == frame for f, _ in bake_data[orig_inst_obj]):
                        bake_data[orig_inst_obj].append((frame, matrix_copy))
                    
        print(f" -> Escaneo completo. Se detectaron {len(bake_data)} objetos reales animados.")

        if not bake_data:
            print("ERROR: No se detectaron objetos animados en el depsgraph.")
            return

        # --- FASE 1.5: PIVOTE Y CREACIÓN DEL VACÍO PADRE ---
        print("\nFase 1.5: Buscando objeto pivote y creando el Vacío Padre...")
        
        # Intentar buscar Peça 10 como pivote principal, sino usar cualquier panel
        pivot_obj = None
        for name in ["Peça 10", "Peca 10", "Peça 06", "Peça 07", "Peça 08.001", "Peça 12.001"]:
            for obj in bake_data.keys():
                if name.replace("ç", "").lower() in obj.name.replace("ç", "").lower():
                    pivot_obj = obj
                    break
            if pivot_obj:
                break
                
        if not pivot_obj:
            pivot_obj = list(bake_data.keys())[0]
            
        print(f" -> Objeto pivote seleccionado para el Vacío: '{pivot_obj.name}'")
        
        # Crear el objeto Vacío (Empty)
        parent_empty = bpy.data.objects.new("Peca_Group", None)
        scene.collection.objects.link(parent_empty)
        parent_empty.rotation_mode = 'QUATERNION'
        print(f" -> Vacío Padre '{parent_empty.name}' creado.")

        # --- FASE 2: DESACTIVAR MODIFICADORES DE GEOMETRY NODES ---
        for emitter_obj in emitter_objs:
            for mod in emitter_obj.modifiers:
                if mod.type == 'NODES':
                    mod.show_viewport = False
                    mod.show_render = False
                    print(f" -> Modificador '{mod.name}' en '{emitter_obj.name}' desactivado.")

        # --- FASE 3: PREPARAR E EMPARENTAR OBJETOS HIJOS ---
        print("\nFase 3: Preparando y emparentando objetos hijos...")
        for orig_obj in list(bake_data.keys()):
            # 1. Desemparentar y limpiar restricciones
            orig_obj.parent = None
            orig_obj.matrix_parent_inverse = mathutils.Matrix()
            orig_obj.constraints.clear()
            
            # 2. Limpiar Delta Transforms
            orig_obj.delta_location = (0.0, 0.0, 0.0)
            orig_obj.delta_rotation_euler = (0.0, 0.0, 0.0)
            orig_obj.delta_rotation_quaternion = (1.0, 0.0, 0.0, 0.0)
            orig_obj.delta_scale = (1.0, 1.0, 1.0)
            
            # 3. Configurar rotación
            orig_obj.rotation_mode = 'QUATERNION'
            orig_obj.animation_data_clear()
            
            # 4. Desocultar
            orig_obj.hide_set(False)
            orig_obj.hide_viewport = False
            orig_obj.hide_render = False
            
            # 5. Emparentar al Vacío
            orig_obj.parent = parent_empty
            orig_obj.matrix_parent_inverse = mathutils.Matrix() # Limpiar parent inverse para usar matriz basis local directa
            
            print(f"    - '{orig_obj.name}' preparado y emparentado a '{parent_empty.name}'.")
            
        bpy.context.view_layer.update()

        # --- FASE 4: HORNEADO DE ANIMACIÓN EN JERARQUÍA ---
        print("\nFase 4: Horneando animación local y del Vacío Padre...")
        
        prev_quaternions = {}
        
        for frame in range(start_frame, end_frame + 1):
            scene.frame_set(frame)
            
            # 1. Obtener la matriz de mundo del pivote (Peça 10) para este frame
            pivot_keyframes = bake_data[pivot_obj]
            pivot_matrix = next((m for f, m in pivot_keyframes if f == frame), None)
            if pivot_matrix is None:
                # Si no hay frame para el pivote, usar el primero disponible
                pivot_matrix = pivot_keyframes[0][1]
                
            # Decomponer matriz del pivote y aplicar al Vacío Padre
            loc_p, rot_p, scale_p = pivot_matrix.decompose()
            
            # Clampear escala
            scale_p_safe = mathutils.Vector((
                scale_p.x if abs(scale_p.x) >= 0.0001 else 0.0001,
                scale_p.y if abs(scale_p.y) >= 0.0001 else 0.0001,
                scale_p.z if abs(scale_p.z) >= 0.0001 else 0.0001
            ))
            
            # Anti-flip para el padre
            if parent_empty in prev_quaternions:
                prev_q = prev_quaternions[parent_empty]
                if prev_q.dot(rot_p) < 0:
                    rot_p = -rot_p
            prev_quaternions[parent_empty] = rot_p.copy()
            
            parent_empty.location = loc_p
            parent_empty.rotation_quaternion = rot_p
            parent_empty.scale = scale_p_safe
            
            # Insertar keyframes al Vacío Padre
            parent_empty.keyframe_insert(data_path="location", frame=frame)
            parent_empty.keyframe_insert(data_path="rotation_quaternion", frame=frame)
            parent_empty.keyframe_insert(data_path="scale", frame=frame)
            
            # 2. Calcular y aplicar la transformación local de los hijos respecto al Vacío
            inv_parent_matrix = pivot_matrix.inverted()
            
            for orig_obj, keyframes in bake_data.items():
                child_matrix = next((m for f, m in keyframes if f == frame), None)
                if child_matrix is None:
                    continue
                    
                # Matriz local = Inversa(Padre_Mundo) x Hijo_Mundo
                local_matrix = inv_parent_matrix @ child_matrix
                loc_c, rot_c, scale_c = local_matrix.decompose()
                
                scale_c_safe = mathutils.Vector((
                    scale_c.x if abs(scale_c.x) >= 0.0001 else 0.0001,
                    scale_c.y if abs(scale_c.y) >= 0.0001 else 0.0001,
                    scale_c.z if abs(scale_c.z) >= 0.0001 else 0.0001
                ))
                
                # Anti-flip para el hijo
                if orig_obj in prev_quaternions:
                    prev_q = prev_quaternions[orig_obj]
                    if prev_q.dot(rot_c) < 0:
                        rot_c = -rot_c
                prev_quaternions[orig_obj] = rot_c.copy()
                
                orig_obj.location = loc_c
                orig_obj.rotation_quaternion = rot_c
                orig_obj.scale = scale_c_safe
                
                # Insertar keyframes locales al hijo
                orig_obj.keyframe_insert(data_path="location", frame=frame)
                orig_obj.keyframe_insert(data_path="rotation_quaternion", frame=frame)
                orig_obj.keyframe_insert(data_path="scale", frame=frame)
                
        # Configurar interpolación LINEAL en todo para evitar saltos
        all_animated = list(bake_data.keys()) + [parent_empty]
        for obj in all_animated:
            if obj.animation_data and obj.animation_data.action:
                for fcurve in obj.animation_data.action.fcurves:
                    for kp in fcurve.keyframe_points:
                        kp.interpolation = 'LINEAR'
                        
        print(" -> Horneado de jerarquía rígida completo con interpolación lineal.")

        # --- FASE 4.5: ELIMINAR EMISORES ---
        emitter_names = [obj.name for obj in emitter_objs]
        for emitter_obj in emitter_objs:
            try:
                for col in list(emitter_obj.users_collection):
                    col.objects.unlink(emitter_obj)
                bpy.data.objects.remove(emitter_obj, do_unlink=True)
            except Exception as e:
                print(f"Advertencia al eliminar emisor: {e}")
                
        for name in emitter_names:
            print(f" -> Emisor '{name}' eliminado.")
            
        bpy.context.view_layer.update()
                
        # --- FASE 5: EXPORTACIÓN GLB ---
        if export_glb:
            blend_filepath = bpy.data.filepath
            if not blend_filepath:
                print("ERROR: El archivo .blend no ha sido guardado.")
            else:
                directory = os.path.dirname(blend_filepath)
                filename = os.path.basename(blend_filepath)
                # Conservar exactamente el mismo nombre del .blend pero con extensión .glb
                name_no_ext = os.path.splitext(filename)[0]
                export_path = os.path.join(directory, name_no_ext + ".glb")
                
                print(f"\nFase 5: Exportando a archivo GLB en: {export_path}...")
                try:
                    bpy.ops.export_scene.gltf(
                        filepath=export_path,
                        export_format='GLB',
                        use_selection=False,
                        use_visible=False,
                        export_animations=True,
                        export_animation_mode='ACTIVE_ACTIONS',
                        export_optimize_animation_size=False, # Sincronización estricta de curvas
                        export_draco_mesh_compression_enable=True,
                        export_draco_mesh_compression_level=6
                    )
                    print(" -> Exportación GLB completada con éxito.")
                except Exception as e:
                    print(f"ERROR durante la exportación GLB: {str(e)}")
                    raise e
                
    finally:
        if revert_blend:
            print("\nFase 6: Revirtiendo archivo .blend...")
            try:
                bpy.ops.wm.revert_mainfile()
                print(" -> Archivo .blend original restaurado.")
            except Exception as e:
                print(f"ERROR al revertir archivo .blend: {e}")

if __name__ == "__main__":
    bake_geometry_nodes_instances(
        emitter_prefix="Plane",
        export_glb=True,
        revert_blend=True
    )
