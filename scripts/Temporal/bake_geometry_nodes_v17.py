import bpy
import mathutils
import os
import re

def bake_geometry_nodes_instances(emitter_prefix="Plane", start_frame=None, end_frame=None, export_glb=True, revert_blend=True):
    """
    V17 (La V6 Blindada)
    - Arquitectura 100% V6 (Empties intermedios + matrix_parent_inverse real).
    - FIX ÚNICO: Cuando parent_matrix tiene escala 0 (determinante=0, no invertible),
      en lugar de crashear, usa world_matrix directamente. La pieza es invisible
      en ese momento de todos modos (escala 0), así que la posición exacta no importa.
    - Añadido: Fase 1.5 Anti-GiroLoco para estabilizar rotaciones en frames con escala 0.
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
    print(f"INICIANDO BAKE Y EXPORTACIÓN GLB (V17 - V6 BLINDADA)")
    print(f"Prefijo de Emisores: '{emitter_prefix}'")
    print(f"Emisores Encontrados ({len(emitter_objs)}): {', '.join(o.name for o in emitter_objs)}")
    print(f"Rango de Frames: {start_frame} a {end_frame}")
    print(f"==================================================")
    
    # Estructura para guardar la animación leída: {objeto_original: [(frame, matrix_world)]}
    bake_data = {}
    
    # Guardar estado y selección actual usando nombres
    active_name = bpy.context.active_object.name if bpy.context.active_object else None
    selected_names = [o.name for o in bpy.context.selected_objects if o]
    original_frame = scene.frame_current
    
    # Deseleccionar todo para evitar interferencias
    bpy.ops.object.select_all(action='DESELECT')
    
    # Estructura para almacenar los Empties temporales
    empty_objs = []
    
    try:
        # --- FASE 1: LECTURA EN MEMORIA (Sin modificar la escena) ---
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
                    
                    # Evitar hornear los emisores mismos
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
                    print(f" -> Modificador '{mod.name}' en '{emitter_obj.name}' desactivado temporalmente.")

        # --- FASE 3: ESTABLECER JERARQUÍA TEMPORAL Y CREAR EMPTIES ---
        print("\nFase 3: Construyendo jerarquía temporal de Empties...")
        
        # 1. Identificar el mueble principal
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

        # Función para limpiar nombres duplicados (.001, etc.)
        def get_clean_name(name):
            return re.sub(r'\.\d{3}$', '', name)

        # Diccionario para almacenar los Empties temporales por tipo de herraje
        created_empties = {}
        
        # 2. Configurar todos los objetos en modo QUATERNION y crear Empties temporales
        for orig_obj in list(bake_data.keys()):
            orig_obj.rotation_mode = 'QUATERNION'
            orig_obj.animation_data_clear()
            
            # Si no es el mueble principal, creamos su Empty intermedio
            if mueble_principal and orig_obj != mueble_principal:
                clean_name = get_clean_name(orig_obj.name)
                
                if clean_name not in created_empties:
                    # Crear Empty
                    empty_data = bpy.data.objects.new(clean_name, None)
                    # Vincular a la misma colección del objeto
                    if orig_obj.users_collection:
                        orig_obj.users_collection[0].objects.link(empty_data)
                    else:
                        scene.collection.objects.link(empty_data)
                    
                    # Emparentar Empty al mueble principal
                    empty_data.parent = mueble_principal
                    empty_data.matrix_parent_inverse = mueble_principal.matrix_world.inverted()
                    
                    created_empties[clean_name] = empty_data
                    empty_objs.append(empty_data)
                    print(f"    - Creado Empty '{clean_name}' e hijo de '{mueble_principal.name}'")
                    
                # Emparentar el objeto original al Empty
                empty_parent = created_empties[clean_name]
                orig_obj.parent = empty_parent
                orig_obj.matrix_parent_inverse = empty_parent.matrix_world.inverted()

        # Diccionario para recordar el último cuaternión de cada objeto (evitar flips)
        prev_quaternions = {}
        
        # --- FASE 4: ESCRITURA DE KEYFRAMES ---
        print("\nFase 4: Horneando keyframes frame a frame con jerarquía de actualización...")
        
        for frame in range(start_frame, end_frame + 1):
            scene.frame_set(frame)
            
            # A. Colocar primero al mueble principal en su posición global para este frame
            if mueble_principal:
                mueble_keyframes = bake_data[mueble_principal]
                mueble_frame_data = next((m for f, m in mueble_keyframes if f == frame), None)
                if mueble_frame_data is not None:
                    mueble_principal.matrix_world = mueble_frame_data
                    
            # B. Forzar la actualización de la escena
            bpy.context.view_layer.update()
            
            # C. Procesar el resto de objetos hijos
            for orig_obj, keyframes in bake_data.items():
                frame_data = next((m for f, m in keyframes if f == frame), None)
                if frame_data is None:
                    continue
                    
                world_matrix = frame_data
                
                if orig_obj == mueble_principal:
                    # El mueble principal ya fue colocado arriba, solo lo descomponemos
                    matrix_local = world_matrix.copy()
                else:
                    # Si tiene padre (que es el Empty), obtenemos la matriz local
                    if orig_obj.parent:
                        parent_matrix = orig_obj.parent.matrix_world.copy()
                        combined = parent_matrix @ orig_obj.matrix_parent_inverse
                        
                        # =============================================================
                        # FIX V17: Protección contra matrices singulares (escala 0)
                        # Cuando el padre tiene escala (0,0,0), su matriz no se puede
                        # invertir (determinante = 0). En ese momento la pieza es
                        # invisible de todos modos, así que usamos world_matrix
                        # directamente como fallback seguro.
                        # =============================================================
                        try:
                            matrix_local = combined.inverted() @ world_matrix
                        except ValueError:
                            # Matriz singular: la pieza está en escala 0, invisible.
                            # Usamos la world_matrix directamente.
                            matrix_local = world_matrix.copy()
                    else:
                        matrix_local = world_matrix.copy()
                
                # Descomponer la matriz local en posición, rotación y escala
                loc, rot, scale = matrix_local.decompose()
                
                # Corrección antiflip de cuaternión
                if orig_obj in prev_quaternions:
                    prev_q = prev_quaternions[orig_obj]
                    if prev_q.dot(rot) < 0:
                        rot = -rot
                prev_quaternions[orig_obj] = rot.copy()
                
                # Aplicar transformaciones locales al objeto
                orig_obj.location = loc
                orig_obj.rotation_quaternion = rot
                orig_obj.scale = scale
                
                # Insertar keyframes locales
                orig_obj.keyframe_insert(data_path="location", frame=frame)
                orig_obj.keyframe_insert(data_path="rotation_quaternion", frame=frame)
                orig_obj.keyframe_insert(data_path="scale", frame=frame)
                
        # D. Configurar interpolación LINEAL
        for orig_obj in bake_data.keys():
            if orig_obj.animation_data and orig_obj.animation_data.action:
                for fcurve in orig_obj.animation_data.action.fcurves:
                    for kp in fcurve.keyframe_points:
                        kp.interpolation = 'LINEAR'
                        
        print(" -> Horneado completo con interpolación lineal y cuaterniones.")

        # Guardar los nombres de los emisores
        emitter_names = [obj.name for obj in emitter_objs]
        
        # Eliminar definitivamente todos los objetos emisores
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
    print(f"V17 - FINALIZADA (V6 BLINDADA + ANTI-GIRO LOCO)")
    print(f"==================================================\n")

if __name__ == "__main__":
    bake_geometry_nodes_instances(
        emitter_prefix="Plane",
        export_glb=True,
        revert_blend=True
    )
