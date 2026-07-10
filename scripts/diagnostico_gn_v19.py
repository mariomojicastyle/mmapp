"""
SCRIPT DE DIAGNÓSTICO V19 - NO MODIFICA NADA
Ejecutar en el Editor de Texto de Blender con el archivo P03.blend abierto.
Exporta un archivo JSON con toda la información necesaria para debuggear.
"""
import bpy
import mathutils
import json
import os

def matrix_to_list(mat):
    """Convierte una Matrix de Blender a lista de listas para JSON."""
    return [[mat[row][col] for col in range(4)] for row in range(4)]

def vector_to_list(vec):
    """Convierte un Vector de Blender a lista."""
    return [v for v in vec]

def quat_to_list(q):
    """Convierte un Quaternion a lista [w, x, y, z]."""
    return [q.w, q.x, q.y, q.z]

def diagnose():
    scene = bpy.context.scene
    blend_filepath = bpy.data.filepath
    report = {
        "blend_file": blend_filepath,
        "blender_version": list(bpy.app.version),
        "frame_range": [scene.frame_start, scene.frame_end],
        "fps": scene.render.fps,
        "unit_system": scene.unit_settings.system,
        "unit_scale": scene.unit_settings.scale_length,
    }
    
    # ============================================================
    # SECCIÓN 1: TODOS LOS OBJETOS DE LA ESCENA
    # ============================================================
    all_objects = {}
    for obj in bpy.data.objects:
        loc, rot, scale = obj.matrix_world.decompose()
        obj_info = {
            "type": obj.type,
            "parent": obj.parent.name if obj.parent else None,
            "parent_type": obj.parent_type if obj.parent else None,
            "hide_viewport": obj.hide_viewport,
            "hide_render": obj.hide_render,
            "hide_get": obj.hide_get(),
            "visible_get": obj.visible_get(),
            "location": vector_to_list(obj.location),
            "rotation_euler": vector_to_list(obj.rotation_euler),
            "rotation_mode": obj.rotation_mode,
            "scale": vector_to_list(obj.scale),
            "dimensions": vector_to_list(obj.dimensions),
            "matrix_world": matrix_to_list(obj.matrix_world),
            "matrix_local": matrix_to_list(obj.matrix_local),
            "matrix_parent_inverse": matrix_to_list(obj.matrix_parent_inverse),
            "decomposed_world_loc": vector_to_list(loc),
            "decomposed_world_rot": quat_to_list(rot),
            "decomposed_world_scale": vector_to_list(scale),
            "modifiers": [],
            "collections": [c.name for c in obj.users_collection],
            "has_animation": obj.animation_data is not None and obj.animation_data.action is not None,
        }
        
        # Detalles de modificadores
        for mod in obj.modifiers:
            mod_info = {
                "name": mod.name,
                "type": mod.type,
                "show_viewport": mod.show_viewport,
                "show_render": mod.show_render,
            }
            if mod.type == 'NODES' and mod.node_group:
                mod_info["node_group_name"] = mod.node_group.name
                # Listar inputs expuestos del modificador
                mod_inputs = {}
                for key in mod.keys():
                    val = mod[key]
                    if hasattr(val, 'name'):
                        mod_inputs[key] = f"Object: {val.name}"
                    elif isinstance(val, (int, float, str, bool)):
                        mod_inputs[key] = val
                    else:
                        mod_inputs[key] = str(type(val).__name__)
                mod_info["exposed_inputs"] = mod_inputs
            obj_info["modifiers"].append(mod_info)
            
        # Info de mesh (vértices, etc.)
        if obj.type == 'MESH' and obj.data:
            obj_info["mesh_name"] = obj.data.name
            obj_info["vertex_count"] = len(obj.data.vertices)
            obj_info["polygon_count"] = len(obj.data.polygons)
            # Bounding box
            if obj.bound_box:
                bb = [vector_to_list(mathutils.Vector(corner)) for corner in obj.bound_box]
                obj_info["bounding_box"] = bb
        
        all_objects[obj.name] = obj_info
    
    report["all_objects"] = all_objects
    
    # ============================================================
    # SECCIÓN 2: ÁRBOL DE GEOMETRY NODES COMPLETO
    # ============================================================
    geometry_nodes_trees = {}
    for ng in bpy.data.node_groups:
        if ng.type == 'GEOMETRY':
            tree_info = {
                "name": ng.name,
                "nodes": [],
                "links": [],
            }
            
            for node in ng.nodes:
                node_info = {
                    "name": node.name,
                    "type": node.type,
                    "bl_idname": node.bl_idname,
                    "label": node.label,
                    "mute": node.mute,
                    "location": [node.location.x, node.location.y],
                    "inputs": {},
                    "outputs": {},
                }
                
                # Inputs del nodo
                for i, inp in enumerate(node.inputs):
                    inp_info = {
                        "name": inp.name,
                        "type": inp.type,
                        "is_linked": inp.is_linked,
                    }
                    # Intentar leer default_value
                    if hasattr(inp, 'default_value'):
                        try:
                            dv = inp.default_value
                            if dv is None:
                                inp_info["default_value"] = None
                            elif hasattr(dv, 'name'):
                                inp_info["default_value"] = f"Object: {dv.name}"
                            elif isinstance(dv, (int, float, str, bool)):
                                inp_info["default_value"] = dv
                            else:
                                try:
                                    inp_info["default_value"] = [round(v, 6) for v in dv]
                                except:
                                    inp_info["default_value"] = str(dv)
                        except Exception:
                            inp_info["default_value"] = "<unreadable>"
                    node_info["inputs"][f"{i}_{inp.name}"] = inp_info
                
                # Outputs del nodo
                for i, out in enumerate(node.outputs):
                    out_info = {
                        "name": out.name,
                        "type": out.type,
                        "is_linked": out.is_linked,
                    }
                    node_info["outputs"][f"{i}_{out.name}"] = out_info
                
                # Propiedades especiales según tipo de nodo
                if node.type == 'OBJECT_INFO':
                    node_info["transform_space"] = node.transform_space
                
                if hasattr(node, 'operation'):
                    node_info["operation"] = node.operation
                    
                if hasattr(node, 'domain'):
                    node_info["domain"] = node.domain
                    
                if hasattr(node, 'data_type'):
                    node_info["data_type"] = node.data_type
                
                tree_info["nodes"].append(node_info)
            
            # Links (conexiones)
            for link in ng.links:
                link_info = {
                    "from_node": link.from_node.name,
                    "from_socket": link.from_socket.name,
                    "from_socket_index": next((i for i, s in enumerate(link.from_node.outputs) if s == link.from_socket), -1),
                    "to_node": link.to_node.name,
                    "to_socket": link.to_socket.name,
                    "to_socket_index": next((i for i, s in enumerate(link.to_node.inputs) if s == link.to_socket), -1),
                    "is_muted": link.is_muted,
                }
                tree_info["links"].append(link_info)
            
            geometry_nodes_trees[ng.name] = tree_info
    
    report["geometry_nodes_trees"] = geometry_nodes_trees
    
    # ============================================================
    # SECCIÓN 3: DEPSGRAPH - INSTANCIAS POR FRAME (frames clave)
    # ============================================================
    # Solo muestrear algunos frames para no hacer el JSON gigante
    sample_frames = [scene.frame_start]
    mid = (scene.frame_start + scene.frame_end) // 2
    if mid != scene.frame_start and mid != scene.frame_end:
        sample_frames.append(mid)
    sample_frames.append(scene.frame_end)
    
    # Agregar frames intermedios cada 10%
    total = scene.frame_end - scene.frame_start
    if total > 20:
        for pct in [25, 50, 75]:
            f = scene.frame_start + int(total * pct / 100)
            if f not in sample_frames:
                sample_frames.append(f)
    sample_frames.sort()
    
    depsgraph_data = {}
    emitter_objs = [obj for obj in bpy.data.objects if obj.name.startswith("Plane")]
    
    for frame in sample_frames:
        scene.frame_set(frame)
        depsgraph = bpy.context.evaluated_depsgraph_get()
        
        eval_emitters = []
        for emitter_obj in emitter_objs:
            try:
                eval_emitters.append(emitter_obj.evaluated_get(depsgraph))
            except:
                pass
        
        frame_instances = []
        for inst in depsgraph.object_instances:
            if inst.is_instance and inst.parent in eval_emitters:
                eval_obj = inst.object
                if not eval_obj:
                    continue
                orig = eval_obj.original
                if orig in emitter_objs:
                    continue
                
                loc, rot, scale = inst.matrix_world.decompose()
                
                # Verificar ortogonalidad de la matriz 3x3
                R = inst.matrix_world.to_3x3()
                x = R.col[0].normalized()
                y = R.col[1].normalized()
                z = R.col[2].normalized()
                dot_xy = abs(x.dot(y))
                dot_xz = abs(x.dot(z))
                dot_yz = abs(y.dot(z))
                has_shear = dot_xy > 0.001 or dot_xz > 0.001 or dot_yz > 0.001
                
                inst_info = {
                    "object_name": orig.name,
                    "parent_name": inst.parent.original.name if hasattr(inst.parent, 'original') else str(inst.parent),
                    "matrix_world": matrix_to_list(inst.matrix_world),
                    "decomposed_loc": vector_to_list(loc),
                    "decomposed_rot_quat": quat_to_list(rot),
                    "decomposed_scale": vector_to_list(scale),
                    "has_shear": has_shear,
                    "dot_products": {
                        "xy": round(dot_xy, 6),
                        "xz": round(dot_xz, 6),
                        "yz": round(dot_yz, 6),
                    },
                    "column_lengths": {
                        "x": round(R.col[0].length, 6),
                        "y": round(R.col[1].length, 6),
                        "z": round(R.col[2].length, 6),
                    },
                }
                frame_instances.append(inst_info)
        
        depsgraph_data[str(frame)] = {
            "instance_count": len(frame_instances),
            "instances": frame_instances,
        }
    
    report["depsgraph_samples"] = depsgraph_data
    
    # ============================================================
    # SECCIÓN 4: COMPARATIVA OBJETO ORIGINAL vs INSTANCIA
    # ============================================================
    comparisons = {}
    scene.frame_set(scene.frame_end)  # Último frame (posición ensamblada)
    depsgraph = bpy.context.evaluated_depsgraph_get()
    eval_emitters = []
    for emitter_obj in emitter_objs:
        try:
            eval_emitters.append(emitter_obj.evaluated_get(depsgraph))
        except:
            pass
    
    for inst in depsgraph.object_instances:
        if inst.is_instance and inst.parent in eval_emitters:
            eval_obj = inst.object
            if not eval_obj:
                continue
            orig = eval_obj.original
            if orig in emitter_objs:
                continue
            
            if orig.name not in comparisons:
                orig_loc, orig_rot, orig_scale = orig.matrix_world.decompose()
                inst_loc, inst_rot, inst_scale = inst.matrix_world.decompose()
                
                comparisons[orig.name] = {
                    "original_matrix_world": matrix_to_list(orig.matrix_world),
                    "original_loc": vector_to_list(orig_loc),
                    "original_rot": quat_to_list(orig_rot),
                    "original_scale": vector_to_list(orig_scale),
                    "instance_matrix_world": matrix_to_list(inst.matrix_world),
                    "instance_loc": vector_to_list(inst_loc),
                    "instance_rot": quat_to_list(inst_rot),
                    "instance_scale": vector_to_list(inst_scale),
                    "loc_difference": vector_to_list(inst_loc - orig_loc),
                    "scale_ratio": [
                        round(inst_scale[i] / orig_scale[i], 6) if abs(orig_scale[i]) > 1e-6 else "inf"
                        for i in range(3)
                    ],
                }
    
    report["original_vs_instance"] = comparisons
    
    # ============================================================
    # SECCIÓN 5: EMITTERS INFO
    # ============================================================
    emitter_info = {}
    for eo in emitter_objs:
        loc, rot, scale = eo.matrix_world.decompose()
        emitter_info[eo.name] = {
            "matrix_world": matrix_to_list(eo.matrix_world),
            "location": vector_to_list(loc),
            "rotation": quat_to_list(rot),
            "scale": vector_to_list(scale),
            "applied_scale": vector_to_list(eo.scale),
            "dimensions": vector_to_list(eo.dimensions),
        }
    report["emitters"] = emitter_info
    
    # ============================================================
    # EXPORTAR JSON
    # ============================================================
    if blend_filepath:
        output_dir = os.path.dirname(blend_filepath)
    else:
        output_dir = os.path.expanduser("~")
    
    output_path = os.path.join(output_dir, "diagnostico_v19.json")
    
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(report, f, indent=2, ensure_ascii=False, default=str)
    
    print(f"\n{'='*60}")
    print(f"DIAGNÓSTICO EXPORTADO EXITOSAMENTE")
    print(f"Archivo: {output_path}")
    print(f"Objetos totales: {len(all_objects)}")
    print(f"Árboles GN: {len(geometry_nodes_trees)}")
    print(f"Frames muestreados: {sample_frames}")
    print(f"Instancias en último frame: {len(comparisons)}")
    print(f"{'='*60}")
    
    # Restaurar frame original
    scene.frame_set(scene.frame_start)
    
    return output_path

if __name__ == "__main__":
    diagnose()
