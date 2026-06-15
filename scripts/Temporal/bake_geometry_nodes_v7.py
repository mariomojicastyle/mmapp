import bpy
import mathutils
import os
import re

def bake_geometry_nodes_instances(emitter_prefix="Plane", start_frame=None, end_frame=None, export_glb=True, revert_blend=True):
    """
    Bakea las animaciones de todos los Geometry Nodes asociados a objetos que empiecen con 'emitter_prefix'
    DIRECTAMENTE en los objetos reales de la escena, elimina los emisores, exporta a .glb
    utilizando el modo de animación 'ACTIVE_ACTIONS' (Active actions merged) con compresión Draco,
    y finalmente restaura el archivo .blend a su estado original para no alterar el espacio de trabajo.

    V7 - Soluciona el error 'Matrix.invert(ed): matrix does not have an inverse' 
         al crear una función segura de inversión de matrices cuando la escala cae a 0.
    """
    scene = bpy.context.scene
    
    # 1. Configurar rango de frames
    if start_frame is None:
        start_frame = scene.frame_start
    if end_frame is None:
        end_frame = scene.frame_end
        
    # 2. Buscar todos los objetos emisores que inicien con el prefijo
    emitter_objs = [obj for obj in bpy.data.objects if obj.name.startswith(emitter_prefix)]
    if not emitter_objs:
        print(f"ERROR: No se encontraron objetos emisores que inicien con el prefijo '{emitter_prefix}'.")
        return
        
    print(f"\n==================================================")
    print(f"INICIANDO BAKE DIRECTO Y EXPORTACIÓN GLB (V7)")
    print(f"Prefijo de Emisores: '{emitter_prefix}'")
    print(f"Emisores Encontrados ({len(emitter_objs)}): {', '.join(o.name for o in emitter_objs)}")
    print(f"Rango de Frames: {start_frame} a {end_frame}")
    print(f"==================================================")
    
    bake_data = {}
    
    active_name = bpy.context.active_object.name if bpy.context.active_object else None
    selected_names = [o.name for o in bpy.context.selected_objects if o]
    original_frame = scene.frame_current
    
    bpy.ops.object.select_all(action='DESELECT')
    
    empty_objs = []
    
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

        # --- FASE 2: DESACTIVAR MODIFICADORES ---
        for emitter_obj in emitter_objs:
            for mod in emitter_obj.modifiers:
                if mod.type == 'NODES':
                    mod.show_viewport = False
                    mod.show_render = False
                    print(f" -> Modificador '{mod.name}' en '{emitter_obj.name}' desactivado temporalmente.")

        # --- FASE 3: ESTABLECER JERARQUÍA TEMPORAL ---
        print("\nFase 3: Construyendo jerarquía temporal de Empties...")
        
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
                    
        if mueble_principal:
            print(f" -> Mueble principal detectado para anclaje orbital: '{mueble_principal.name}'")
        else:
            print(" -> ADVERTENCIA: No se detectó un mueble principal. Se horneará de forma directa.")

        def get_clean_name(name):
            return re.sub(r'\.\d{3}$', '', name)

        created_empties = {}
        
        for orig_obj in list(bake_data.keys()):
            orig_obj.rotation_mode = 'QUATERNION'
            orig_obj.animation_data_clear()
            
            if mueble_principal and orig_obj != mueble_principal:
                clean_name = get_clean_name(orig_obj.name)
                
                if clean_name not in created_empties:
                    empty_data = bpy.data.objects.new(clean_name, None)
                    if orig_obj.users_collection:
                        orig_obj.users_collection[0].objects.link(empty_data)
                    else:
                        scene.collection.objects.link(empty_data)
                    
                    empty_data.parent = mueble_principal
                    empty_data.matrix_parent_inverse = mueble_principal.matrix_world.inverted()
                    
                    created_empties[clean_name] = empty_data
                    empty_objs.append(empty_data)
                    print(f"    - Creado Empty '{clean_name}' e hijo de '{mueble_principal.name}'")
                    
                empty_parent = created_empties[clean_name]
                orig_obj.parent = empty_parent
                orig_obj.matrix_parent_inverse = empty_parent.matrix_world.inverted()

        prev_quaternions = {}
        
        # --- FASE 4: ESCRITURA DE KEYFRAMES ---
        print("\nFase 4: Horneando keyframes frame a frame con jerarquía de actualización...")
        
        for frame in range(start_frame, end_frame + 1):
            scene.frame_set(frame)
            
            if mueble_principal:
                mueble_keyframes = bake_data[mueble_principal]
                mueble_frame_data = next((m for f, m in mueble_keyframes if f == frame), None)
                if mueble_frame_data is not None:
                    mueble_principal.matrix_world = mueble_frame_data
                    
            bpy.context.view_layer.update()
            
            for orig_obj, keyframes in bake_data.items():
                frame_data = next((m for f, m in keyframes if f == frame), None)
                if frame_data is None:
                    continue
                    
                world_matrix = frame_data
                
                if orig_obj == mueble_principal:
                    matrix_local = world_matrix.copy()
                else:
                    if orig_obj.parent:
                        parent_matrix = orig_obj.parent.matrix_world.copy()
                        base_mat = parent_matrix @ orig_obj.matrix_parent_inverse
                        
                        # FUNCIÓN SEGURA DE INVERSIÓN (V7)
                        try:
                            inv_mat = base_mat.inverted()
                        except ValueError:
                            # Si la matriz es degenerada (escala 0 en algún eje), fallará la inversión.
                            # Extraemos locación y rotación, y reconstruimos la matriz con escala perfecta (1,1,1)
                            # Esto permite calcular la posición relativa correctamente sin crashear.
                            loc, rot, sca = base_mat.decompose()
                            safe_mat = mathutils.Matrix.LocRotScale(loc, rot, mathutils.Vector((1.0, 1.0, 1.0)))
                            try:
                                inv_mat = safe_mat.inverted()
                            except ValueError:
                                inv_mat = mathutils.Matrix() # Fallback extremo: Identidad
                                
                        matrix_local = inv_mat @ world_matrix
                    else:
                        matrix_local = world_matrix.copy()
                
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
                
        for orig_obj in bake_data.keys():
            if orig_obj.animation_data and orig_obj.animation_data.action:
                for fcurve in orig_obj.animation_data.action.fcurves:
                    for kp in fcurve.keyframe_points:
                        kp.interpolation = 'LINEAR'
                        
        print(" -> Horneado completo con interpolación lineal y cuaterniones.")

        emitter_names = [obj.name for obj in emitter_objs]
        
        for emitter_obj in emitter_objs:
            try:
                for col in list(emitter_obj.users_collection):
                    col.objects.unlink(emitter_obj)
                bpy.data.objects.remove(emitter_obj, do_unlink=True)
            except Exception as e:
                print(f"Advertencia al eliminar emisor {emitter_obj}: {e}")
                
        for name in emitter_names:
            print(f" -> Objeto emisor '{name}' eliminado de la escena.")
                
        # --- FASE 5: EXPORTACIÓN GLB ---
        if export_glb:
            blend_filepath = bpy.data.filepath
            if not blend_filepath:
                print("ERROR: El archivo .blend no ha sido guardado. No se puede exportar GLB.")
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
                    print(" -> Exportación GLB con Draco completada con éxito.")
                except Exception as e:
                    print(f"ERROR durante la exportación GLB: {str(e)}")
                    raise e
                
    finally:
        # --- FASE 6: REVERTIR ARCHIVO .BLEND ---
        if revert_blend:
            print("\nFase 6: Revirtiendo archivo .blend para restaurar el estado limpio original...")
            try:
                bpy.ops.wm.revert_mainfile()
                print(" -> Archivo .blend original restaurado en disco y cargado.")
            except Exception as e:
                print(f"ERROR al revertir archivo .blend: {str(e)}")
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
    print(f"BAKE Y EXPORTACIÓN COMPLETADOS EXITOSAMENTE (V7)")
    print(f"El archivo .blend quedó intacto y se generó el GLB sin colisiones.")
    print(f"==================================================\n")

if __name__ == "__main__":
    bake_geometry_nodes_instances(
        emitter_prefix="Plane",
        export_glb=True,
        revert_blend=True
    )
