import bpy
import mathutils
import os
import re

def bake_geometry_nodes_instances(emitter_prefix="Plane", start_frame=None, end_frame=None, export_glb=True, revert_blend=True):
    """
    V10 - Corrige el "Cajón invertido/colapsado". En la V9, el Motor Orbital movía las piezas
          pero olvidamos guardarle keyframes al propio motor. Por ende, el GLB exportaba el motor
          estático en su posición final, causando que todas las piezas volaran por los aires al 
          inicio y encajaran mágicamente solo al final de la animación.
    """
    scene = bpy.context.scene
    
    if start_frame is None:
        start_frame = scene.frame_start
    if end_frame is None:
        end_frame = scene.frame_end
        
    emitter_objs = [obj for obj in bpy.data.objects if obj.name.startswith(emitter_prefix)]
    if not emitter_objs:
        print(f"ERROR: No se encontraron emisores con el prefijo '{emitter_prefix}'.")
        return
        
    print(f"\n==================================================")
    print(f"INICIANDO BAKE Y EXPORTACIÓN GLB (V10 FINAL)")
    print(f"==================================================")
    
    bake_data = {}
    active_name = bpy.context.active_object.name if bpy.context.active_object else None
    selected_names = [o.name for o in bpy.context.selected_objects if o]
    original_frame = scene.frame_current
    
    bpy.ops.object.select_all(action='DESELECT')
    empty_objs = []
    
    try:
        # FASE 1: LECTURA
        print("Fase 1: Escaneando transformaciones...")
        for frame in range(start_frame, end_frame + 1):
            scene.frame_set(frame)
            depsgraph = bpy.context.evaluated_depsgraph_get()
            
            eval_emitters = []
            for emitter_obj in emitter_objs:
                try: eval_emitters.append(emitter_obj.evaluated_get(depsgraph))
                except: pass
            
            for inst in depsgraph.object_instances:
                if inst.is_instance and inst.parent in eval_emitters:
                    eval_inst_obj = inst.object
                    if not eval_inst_obj: continue
                    orig_inst_obj = eval_inst_obj.original
                    if orig_inst_obj in emitter_objs: continue
                    
                    if orig_inst_obj not in bake_data:
                        bake_data[orig_inst_obj] = []
                    
                    matrix_copy = inst.matrix_world.copy()
                    if not any(f == frame for f, _ in bake_data[orig_inst_obj]):
                        bake_data[orig_inst_obj].append((frame, matrix_copy))

        # FASE 2: DESACTIVAR MODIFICADORES
        for emitter_obj in emitter_objs:
            for mod in emitter_obj.modifiers:
                if mod.type == 'NODES':
                    mod.show_viewport = False
                    mod.show_render = False

        # FASE 3: NUEVA ARQUITECTURA DE JERARQUÍA (MOTOR ORBITAL)
        print("\nFase 3: Construyendo Motor Orbital inmaculado...")
        mueble_principal = None
        for obj in bake_data.keys():
            if "Conjunto" in obj.name or "Mueble" in obj.name or "mueble" in obj.name:
                mueble_principal = obj
                break
        if not mueble_principal:
            for obj in bake_data.keys():
                name_lower = obj.name.lower()
                if "puntilla" not in name_lower and "fondo" not in name_lower and "tornillo" not in name_lower and "herraje" not in name_lower:
                    mueble_principal = obj
                    break

        orbital_motor = bpy.data.objects.new("Orbital_Motor_ROOT", None)
        orbital_motor.rotation_mode = 'QUATERNION' # CRÍTICO: Debe ser quaternion
        scene.collection.objects.link(orbital_motor)
        empty_objs.append(orbital_motor)

        def get_clean_name(name):
            return re.sub(r'\.\d{3}$', '', name)

        created_empties = {}
        for orig_obj in list(bake_data.keys()):
            orig_obj.rotation_mode = 'QUATERNION'
            orig_obj.animation_data_clear()
            
            clean_name = get_clean_name(orig_obj.name)
            if clean_name not in created_empties:
                empty_data = bpy.data.objects.new(clean_name, None)
                if orig_obj.users_collection:
                    orig_obj.users_collection[0].objects.link(empty_data)
                else:
                    scene.collection.objects.link(empty_data)
                
                empty_data.parent = orbital_motor
                empty_data.matrix_parent_inverse = orbital_motor.matrix_world.inverted()
                
                created_empties[clean_name] = empty_data
                empty_objs.append(empty_data)
                
            empty_parent = created_empties[clean_name]
            orig_obj.parent = empty_parent
            orig_obj.matrix_parent_inverse = empty_parent.matrix_world.inverted()

        prev_quaternions = {}
        
        # FASE 4: ESCRITURA DE KEYFRAMES
        print("\nFase 4: Horneando keyframes frame a frame...")
        for frame in range(start_frame, end_frame + 1):
            scene.frame_set(frame)
            
            if mueble_principal:
                mueble_keyframes = bake_data[mueble_principal]
                mueble_frame_data = next((m for f, m in mueble_keyframes if f == frame), None)
                if mueble_frame_data is not None:
                    loc, rot, sca = mueble_frame_data.decompose()
                    
                    # Antiflip Quaternion para el Motor
                    if orbital_motor in prev_quaternions:
                        prev_q = prev_quaternions[orbital_motor]
                        if prev_q.dot(rot) < 0:
                            rot = -rot
                    prev_quaternions[orbital_motor] = rot.copy()
                    
                    # Aplicar transformación
                    orbital_motor.matrix_world = mathutils.Matrix.LocRotScale(loc, rot, mathutils.Vector((1.0, 1.0, 1.0)))
                    
                    # V10 FIX: GUARDAR KEYFRAMES DEL MOTOR PARA QUE EXPORTE AL GLB
                    orbital_motor.location = loc
                    orbital_motor.rotation_quaternion = rot
                    orbital_motor.scale = (1, 1, 1)
                    
                    orbital_motor.keyframe_insert(data_path="location", frame=frame)
                    orbital_motor.keyframe_insert(data_path="rotation_quaternion", frame=frame)
                    orbital_motor.keyframe_insert(data_path="scale", frame=frame)
                    
            bpy.context.view_layer.update()
            
            for orig_obj, keyframes in bake_data.items():
                frame_data = next((m for f, m in keyframes if f == frame), None)
                if frame_data is None: continue
                
                world_matrix = frame_data
                parent_matrix = orig_obj.parent.matrix_world.copy()
                base_mat = parent_matrix @ orig_obj.matrix_parent_inverse
                
                try:
                    inv_mat = base_mat.inverted()
                except ValueError:
                    loc, rot, sca = base_mat.decompose()
                    safe_mat = mathutils.Matrix.LocRotScale(loc, rot, mathutils.Vector((1.0, 1.0, 1.0)))
                    try: inv_mat = safe_mat.inverted()
                    except: inv_mat = mathutils.Matrix()
                        
                matrix_local = inv_mat @ world_matrix
                loc, rot, scale = matrix_local.decompose()
                
                if orig_obj in prev_quaternions:
                    prev_q = prev_quaternions[orig_obj]
                    if prev_q.dot(rot) < 0:
                        rot = -rot
                prev_quaternions[orig_obj] = rot.copy()
                
                orig_obj.location = loc
                orig_obj.rotation_quaternion = rot
                orig_obj.scale = scale
                
                orig_obj.keyframe_insert(data_path="location", frame=frame)
                orig_obj.keyframe_insert(data_path="rotation_quaternion", frame=frame)
                orig_obj.keyframe_insert(data_path="scale", frame=frame)
                
        # Interpolación Lineal (incluyendo al motor orbital)
        for obj in list(bake_data.keys()) + [orbital_motor]:
            if obj.animation_data and obj.animation_data.action:
                for fcurve in obj.animation_data.action.fcurves:
                    for kp in fcurve.keyframe_points:
                        kp.interpolation = 'LINEAR'
                        
        print(" -> Desocultando objetos originales para el GLB...")
        for orig_obj in bake_data.keys():
            try:
                orig_obj.hide_set(False)
                orig_obj.hide_viewport = False
                orig_obj.hide_render = False
            except: pass

        emitter_names = [obj.name for obj in emitter_objs]
        for emitter_obj in emitter_objs:
            try:
                for col in list(emitter_obj.users_collection):
                    col.objects.unlink(emitter_obj)
                bpy.data.objects.remove(emitter_obj, do_unlink=True)
            except: pass
                
        # FASE 5: EXPORTACIÓN
        if export_glb:
            blend_filepath = bpy.data.filepath
            if blend_filepath:
                directory = os.path.dirname(blend_filepath)
                filename = os.path.basename(blend_filepath)
                name_no_ext = os.path.splitext(filename)[0]
                export_path = os.path.join(directory, name_no_ext + ".glb")
                
                print(f"\nFase 5: Exportando a archivo GLB...")
                try:
                    bpy.ops.export_scene.gltf(
                        filepath=export_path,
                        export_format='GLB',
                        use_selection=False,
                        use_visible=False,
                        export_animations=True,
                        export_animation_mode='ACTIVE_ACTIONS',
                        export_draco_mesh_compression_enable=True,
                        export_draco_mesh_compression_level=6
                    )
                    print(" -> Exportación exitosa.")
                except Exception as e:
                    print(f"ERROR exportando: {e}")
                    raise e
                    
    finally:
        if revert_blend:
            try: bpy.ops.wm.revert_mainfile()
            except: pass
        else:
            scene.frame_set(original_frame)
            if active_name and active_name in bpy.data.objects:
                try: bpy.context.view_layer.objects.active = bpy.data.objects[active_name]
                except: pass
                
    print(f"\n==================================================")
    print(f"V10 FINALIZADA - BUG DEL CAJON EXPLOSIVO RESUELTO")
    print(f"==================================================\n")

if __name__ == "__main__":
    bake_geometry_nodes_instances()
