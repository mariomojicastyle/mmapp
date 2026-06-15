import bpy
import mathutils
import os
import re

def bake_geometry_nodes_instances(emitter_prefix="Plane", start_frame=None, end_frame=None, export_glb=True, revert_blend=True):
    """
    V15 (El Equilibrio Perfecto)
    - Resuelve la "Destrucción por Cizalladura" (Shear Destruction) que causaba que las 
      piezas rotaran 90 grados fuera de su lugar durante el escalado.
    - El Motor Orbital ahora hereda la escala no-uniforme real del cajón, permitiendo
      que las piezas mantengan su rotación pura y sin distorsiones matemáticas.
    - Se implementa un "Clamp de Inversión" a 0.01 para evitar la explosión del Bounding Box
      (que causaba el GLB vacío en la V12/V13), logrando lo mejor de ambos mundos.
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
    print(f"INICIANDO BAKE Y EXPORTACIÓN GLB (V15)")
    print(f"==================================================")
    
    bake_data = {}
    active_name = bpy.context.active_object.name if bpy.context.active_object else None
    original_frame = scene.frame_current
    
    bpy.ops.object.select_all(action='DESELECT')
    
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

        # FASE 1.5: ANTI-GIRO LOCO
        print("Fase 1.5: Estabilizando rotaciones colapsadas...")
        for orig_obj, keyframes in bake_data.items():
            for i in range(len(keyframes)):
                f, mat = keyframes[i]
                l, r, s = mat.decompose()
                if s.length <= 0.001:
                    closest_rot = r
                    min_dist = 999999
                    for j in range(len(keyframes)):
                        if i == j: continue
                        fj, matj = keyframes[j]
                        lj, rj, sj = matj.decompose()
                        if sj.length > 0.001:
                            dist = abs(i - j)
                            if dist < min_dist:
                                min_dist = dist
                                closest_rot = rj
                    fixed_mat = mathutils.Matrix.LocRotScale(l, closest_rot, s)
                    keyframes[i] = (f, fixed_mat)

        # FASE 2: DESACTIVAR MODIFICADORES
        for emitter_obj in emitter_objs:
            for mod in emitter_obj.modifiers:
                if mod.type == 'NODES':
                    mod.show_viewport = False
                    mod.show_render = False

        # FASE 3: MOTOR ORBITAL
        print("\nFase 3: Construyendo Motor Orbital (Con Escala Heredada)...")
        orbital_motor_ref = None
        for obj in bake_data.keys():
            if "Conjunto" in obj.name or "Mueble" in obj.name or "mueble" in obj.name:
                orbital_motor_ref = obj
                break
        if not orbital_motor_ref:
            for obj in bake_data.keys():
                name_lower = obj.name.lower()
                if "puntilla" not in name_lower and "fondo" not in name_lower and "tornillo" not in name_lower and "herraje" not in name_lower:
                    orbital_motor_ref = obj
                    break

        orbital_motor = bpy.data.objects.new("Orbital_Motor_ROOT", None)
        orbital_motor.rotation_mode = 'QUATERNION'
        scene.collection.objects.link(orbital_motor)

        for orig_obj in list(bake_data.keys()):
            orig_obj.rotation_mode = 'QUATERNION'
            orig_obj.animation_data_clear()
            orig_obj.parent = orbital_motor
            orig_obj.matrix_parent_inverse = mathutils.Matrix()

        prev_quaternions = {}
        prev_motor_rot = mathutils.Quaternion((1, 0, 0, 0))
        motor_has_prev = False
        
        # FASE 4: ESCRITURA DE KEYFRAMES
        print("\nFase 4: Horneando keyframes libres de Cizalladura (Shear)...")
        for frame in range(start_frame, end_frame + 1):
            scene.frame_set(frame)
            
            if orbital_motor_ref:
                mueble_frame_data = next((m for f, m in bake_data[orbital_motor_ref] if f == frame), None)
                if mueble_frame_data is not None:
                    loc, rot, sca = mueble_frame_data.decompose()
                    
                    if motor_has_prev:
                        if prev_motor_rot.dot(rot) < 0:
                            rot.negate()
                    prev_motor_rot = rot.copy()
                    motor_has_prev = True
                    
                    # V15 FIX: El Motor Orbital ahora HEREDA la escala (sca)
                    orbital_motor.matrix_world = mathutils.Matrix.LocRotScale(loc, rot, sca)
                    orbital_motor.location = loc
                    orbital_motor.rotation_quaternion = rot
                    orbital_motor.scale = sca
                    
                    orbital_motor.keyframe_insert(data_path="location", frame=frame)
                    orbital_motor.keyframe_insert(data_path="rotation_quaternion", frame=frame)
                    orbital_motor.keyframe_insert(data_path="scale", frame=frame)
                    
            bpy.context.view_layer.update()
            
            for orig_obj, keyframes in bake_data.items():
                frame_data = next((m for f, m in keyframes if f == frame), None)
                if frame_data is None: continue
                
                base_mat = orbital_motor.matrix_world.copy()
                loc_m, rot_m, sca_m = base_mat.decompose()
                
                # V15 FIX: Clamp de inversión para evitar la explosión de coordenadas a 100km
                safe_sca_m = mathutils.Vector((
                    sca_m.x if abs(sca_m.x) >= 0.01 else (0.01 if sca_m.x >= 0 else -0.01),
                    sca_m.y if abs(sca_m.y) >= 0.01 else (0.01 if sca_m.y >= 0 else -0.01),
                    sca_m.z if abs(sca_m.z) >= 0.01 else (0.01 if sca_m.z >= 0 else -0.01)
                ))
                safe_base_mat = mathutils.Matrix.LocRotScale(loc_m, rot_m, safe_sca_m)
                
                try:
                    inv_mat = safe_base_mat.inverted()
                except ValueError:
                    inv_mat = mathutils.Matrix()
                        
                matrix_local = inv_mat @ frame_data
                loc, rot, scale = matrix_local.decompose()
                
                if orig_obj in prev_quaternions:
                    prev_q = prev_quaternions[orig_obj]
                    if prev_q.dot(rot) < 0:
                        rot.negate()
                prev_quaternions[orig_obj] = rot.copy()
                
                orig_obj.location = loc
                orig_obj.rotation_quaternion = rot
                orig_obj.scale = scale
                
                orig_obj.keyframe_insert(data_path="location", frame=frame)
                orig_obj.keyframe_insert(data_path="rotation_quaternion", frame=frame)
                orig_obj.keyframe_insert(data_path="scale", frame=frame)
                
        # Interpolación Lineal
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
    print(f"V15 - FINALIZADA (EQUILIBRIO PERFECTO)")
    print(f"==================================================\n")

if __name__ == "__main__":
    bake_geometry_nodes_instances()
