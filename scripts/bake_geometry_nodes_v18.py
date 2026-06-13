import bpy
import mathutils
import os
import re

def bake_geometry_nodes_instances(emitter_prefix="Plane", start_frame=None, end_frame=None, export_glb=True, revert_blend=True):
    """
    V18 (Arquitectura Limpia - Sin Jerarquías)
    
    Diagnóstico de por qué V6/V17 generaban GLB vacío en P08:
    1. Los objetos originales tienen los "ojitos apagados" (hide_viewport=True).
       Al desactivar Geometry Nodes, los objetos quedan ocultos y el exportador los ignora.
    2. Los Empties hijos de mueble_principal heredan su escala 0, causando matrices
       singulares (no invertibles) que corrompían las coordenadas locales.
    
    Solución: Eliminar la jerarquía de Empties por completo. Cada pieza recibe sus
    coordenadas de mundo directamente como keyframes. Sin padres = sin inversiones = 
    sin matrices singulares. Con keyframes en CADA frame + interpolación LINEAR,
    la sincronización está garantizada matemáticamente.
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
    print(f"INICIANDO BAKE Y EXPORTACIÓN GLB (V18 - LIMPIA)")
    print(f"Prefijo de Emisores: '{emitter_prefix}'")
    print(f"Emisores Encontrados ({len(emitter_objs)}): {', '.join(o.name for o in emitter_objs)}")
    print(f"Rango de Frames: {start_frame} a {end_frame}")
    print(f"==================================================")
    
    bake_data = {}
    
    active_name = bpy.context.active_object.name if bpy.context.active_object else None
    selected_names = [o.name for o in bpy.context.selected_objects if o]
    original_frame = scene.frame_current
    
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

        # --- FASE 1.5: ANTI-GIRO LOCO ---
        print("Fase 1.5: Estabilizando rotaciones colapsadas (Anti-GiroLoco)...")
        for orig_obj, keyframes in bake_data.items():
            for i in range(len(keyframes)):
                f, mat = keyframes[i]
                l, r, s = mat.decompose()
                if s.length <= 0.001:
                    closest_rot = r
                    min_dist = 999999
                    for j in range(len(keyframes)):
                        if i == j:
                            continue
                        fj, matj = keyframes[j]
                        lj, rj, sj = matj.decompose()
                        if sj.length > 0.001:
                            dist = abs(i - j)
                            if dist < min_dist:
                                min_dist = dist
                                closest_rot = rj
                    fixed_mat = mathutils.Matrix.LocRotScale(l, closest_rot, s)
                    keyframes[i] = (f, fixed_mat)
        print(" -> Rotaciones estabilizadas.")

        # --- FASE 2: DESACTIVAR MODIFICADORES DE GEOMETRY NODES ---
        for emitter_obj in emitter_objs:
            for mod in emitter_obj.modifiers:
                if mod.type == 'NODES':
                    mod.show_viewport = False
                    mod.show_render = False
                    print(f" -> Modificador '{mod.name}' en '{emitter_obj.name}' desactivado.")

        # --- FASE 3: PREPARAR OBJETOS (Sin jerarquía) ---
        print("\nFase 3: Preparando objetos para bake directo en espacio mundo...")
        for orig_obj in list(bake_data.keys()):
            # Desemparentar completamente
            orig_obj.parent = None
            orig_obj.matrix_parent_inverse = mathutils.Matrix()
            
            # Configurar modo QUATERNION y limpiar animación anterior
            orig_obj.rotation_mode = 'QUATERNION'
            orig_obj.animation_data_clear()
            
            # CRÍTICO: Desocultar los objetos (los "ojitos apagados")
            orig_obj.hide_set(False)
            orig_obj.hide_viewport = False
            orig_obj.hide_render = False
            
            print(f"    - '{orig_obj.name}' preparado y visible.")

        # Diccionario para anti-flip de cuaterniones
        prev_quaternions = {}
        
        # --- FASE 4: ESCRITURA DE KEYFRAMES EN ESPACIO MUNDO ---
        print("\nFase 4: Horneando keyframes en espacio mundo (sin inversiones matriciales)...")
        for frame in range(start_frame, end_frame + 1):
            scene.frame_set(frame)
            
            for orig_obj, keyframes in bake_data.items():
                frame_data = next((m for f, m in keyframes if f == frame), None)
                if frame_data is None:
                    continue
                
                # Descomponer la matriz de mundo directamente
                # Sin padre = location/rotation/scale SON las coordenadas de mundo
                loc, rot, scale = frame_data.decompose()
                
                # Anti-flip de cuaternión
                if orig_obj in prev_quaternions:
                    prev_q = prev_quaternions[orig_obj]
                    if prev_q.dot(rot) < 0:
                        rot = -rot
                prev_quaternions[orig_obj] = rot.copy()
                
                # Aplicar transformaciones directas
                orig_obj.location = loc
                orig_obj.rotation_quaternion = rot
                orig_obj.scale = scale
                
                # Insertar keyframes
                orig_obj.keyframe_insert(data_path="location", frame=frame)
                orig_obj.keyframe_insert(data_path="rotation_quaternion", frame=frame)
                orig_obj.keyframe_insert(data_path="scale", frame=frame)
                
        # Configurar interpolación LINEAL
        for orig_obj in bake_data.keys():
            if orig_obj.animation_data and orig_obj.animation_data.action:
                for fcurve in orig_obj.animation_data.action.fcurves:
                    for kp in fcurve.keyframe_points:
                        kp.interpolation = 'LINEAR'
                        
        print(" -> Horneado completo con interpolación lineal.")

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
                
        # --- FASE 5: EXPORTACIÓN GLB ---
        if export_glb:
            blend_filepath = bpy.data.filepath
            if not blend_filepath:
                print("ERROR: El archivo .blend no ha sido guardado.")
            else:
                directory = os.path.dirname(blend_filepath)
                filename = os.path.basename(blend_filepath)
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
                print(f"ERROR al revertir: {str(e)}")
        else:
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
    print(f"V18 - FINALIZADA (ARQUITECTURA LIMPIA)")
    print(f"==================================================\n")

if __name__ == "__main__":
    bake_geometry_nodes_instances(
        emitter_prefix="Plane",
        export_glb=True,
        revert_blend=True
    )
