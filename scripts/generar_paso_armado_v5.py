import bpy
import os
import json
import mathutils

SOURCE_BLEND = r"c:\Desarrollo\mmapp\temporal\Blender\Mesa Tijuca Polifurniture_Master_Girado.blend"
REF_P01_BLEND = r"c:\Desarrollo\mmapp\temporal\Blender\P01.blend"
PERFECT_RECIPE_PATH = r"C:\Users\mario\.gemini\antigravity\brain\ef7401f7-7ccf-40d4-b5fc-163b1a8a1b49\scratch\p01_perfect_recipe.json"
OBJ_ACTIONS_PATH = r"c:\Desarrollo\mmapp\temporal\Blender\p01_object_actions.json"
PARENTS_PATH = r"c:\Desarrollo\mmapp\temporal\Blender\p01_parents.json"

OUT_BLEND = r"c:\Desarrollo\mmapp\temporal\Blender\P01_automatizado.blend"
OUT_GLB = r"c:\Desarrollo\mmapp\temporal\Blender\P01_automatizado.glb"

def animar_fcurve(action, data_path, array_index, kps):
    """Inserta keyframes con interpolación preservada."""
    fc = action.fcurves.find(data_path=data_path, index=array_index)
    if not fc:
        fc = action.fcurves.new(data_path=data_path, index=array_index)
    for pt in kps:
        frame = pt[0]
        val = pt[1]
        interp = pt[2] if len(pt) > 2 else 'BEZIER'
        kp = fc.keyframe_points.insert(frame=frame, value=val)
        kp.interpolation = interp

def run_calibrado():
    print(f"\n=======================================================")
    print(f"CALIBRACIÓN EXACTA DE TIEMPOS Y POSICIONES: PASO 01")
    print(f"=======================================================")
    
    # 1. Abrir Master_Girado (el punto de partida real del paso 01)
    bpy.ops.wm.open_mainfile(filepath=SOURCE_BLEND)
    
    # 2. Cargar receta perfecta
    with open(PERFECT_RECIPE_PATH, "r", encoding="utf-8") as f:
        recipe_items = json.load(f)
    recipe_names = set(item["name"] for item in recipe_items)
    
    # 3. Importar Martillo y Chave allen originales exactos de P01.blend
    for name in ["Martillo", "Chave allen"]:
        old = bpy.data.objects.get(name)
        if old:
            bpy.data.objects.remove(old, do_unlink=True)
            
    with bpy.data.libraries.load(REF_P01_BLEND, link=False) as (df, dt):
        to_import = []
        if "Martillo" in df.objects:
            to_import.append("Martillo")
        if "Chave allen" in df.objects:
            to_import.append("Chave allen")
        dt.objects = to_import
        
    for obj in dt.objects:
        if obj:
            bpy.context.scene.collection.objects.link(obj)

    # 4. Aislar exclusivamente las 39 piezas del Paso 01
    for obj in list(bpy.data.objects):
        if obj.type == "MESH" and obj.name not in recipe_names:
            bpy.data.objects.remove(obj, do_unlink=True)
    print(f"Piezas aisladas para P01: {len([o for o in bpy.data.objects if o.type == 'MESH'])}")
    
    # 4.5. Aplicar jerarquías de ensamble (Parenting)
    if os.path.exists(PARENTS_PATH):
        with open(PARENTS_PATH, "r", encoding="utf-8") as f:
            parents_data = json.load(f)
        for child_name, p_info in parents_data.items():
            child = bpy.data.objects.get(child_name)
            parent = bpy.data.objects.get(p_info["parent"])
            if child and parent:
                child.parent = parent
                child.matrix_parent_inverse = mathutils.Matrix(p_info["matrix_parent_inverse"])
        print(f"Relaciones de emparentado aplicadas: {len(parents_data)}")

    # 5. Crear Plane Emisor
    mesh = bpy.data.meshes.new("PlaneMesh")
    plane = bpy.data.objects.new("Plane", mesh)
    p3 = bpy.data.objects.get("Peça 03")
    if p3:
        plane.location = p3.location.copy()
        plane.rotation_mode = p3.rotation_mode
        plane.rotation_quaternion = p3.rotation_quaternion.copy()
        plane.rotation_euler = p3.rotation_euler.copy()
    else:
        plane.rotation_mode = 'QUATERNION'
    bpy.context.scene.collection.objects.link(plane)
    
    mod = plane.modifiers.new(name="GeometryNodes", type="NODES")
    tree = bpy.data.node_groups.new(name="Geometry Nodes.001", type="GeometryNodeTree")
    mod.node_group = tree
    
    out_node = tree.nodes.new("NodeGroupOutput")
    out_node.location = (1600, 0)
    join_node = tree.nodes.new("GeometryNodeJoinGeometry")
    join_node.location = (1300, 0)
    
    if hasattr(tree, 'interface'):
        if not any(item.name == "Geometry" and item.item_type == 'SOCKET' and item.in_out == 'OUTPUT' for item in tree.interface.items_tree):
            tree.interface.new_socket(name="Geometry", in_out="OUTPUT", socket_type="NodeSocketGeometry")
    tree.links.new(join_node.outputs[0], out_node.inputs[0])
    
    # Acción para Geometry Nodes con ranura tipada Blender 4.5
    tree.animation_data_create()
    gn_action = bpy.data.actions.new(name="Geometry Nodes.001Action")
    if hasattr(gn_action, "id_root"):
        gn_action.id_root = "NODETREE"
    if hasattr(gn_action, "slots") and len(gn_action.slots) == 0:
        gn_action.slots.new("NODETREE", "Geometry Nodes.001")
    tree.animation_data.action = gn_action
    if hasattr(tree.animation_data, "action_slot") and len(gn_action.slots) > 0:
        tree.animation_data.action_slot = gn_action.slots[0]
        
    # 6. Conectar los 39 elementos con nombres indexados y aplicar FCurves exactas
    start_x = -700
    start_y = (len(recipe_items) * 160) / 2
    
    for idx, item in enumerate(recipe_items):
        obj_name = item["name"]
        obj = bpy.data.objects.get(obj_name)
        if not obj:
            print(f"⚠️ {obj_name} no encontrado en escena!")
            continue
            
        y = start_y - (idx * 160)
        
        # Object Info
        obj_node = tree.nodes.new("GeometryNodeObjectInfo")
        obj_node.name = f"Object Info_{obj_name}"
        obj_node.location = (start_x, y)
        obj_node.transform_space = "RELATIVE"
        obj_node.inputs["Object"].default_value = obj
        if "As Instance" in obj_node.inputs:
            obj_node.inputs["As Instance"].default_value = True
            
        geo_socket = obj_node.outputs.get("Geometry")
        if not geo_socket:
            geo_socket = next((out for out in obj_node.outputs if out.type in ["GEOMETRY", "NODESOCKETGEOMETRY"]), obj_node.outputs[-1])
            
        # Rotate
        rot_node = tree.nodes.new("GeometryNodeRotateInstances")
        rot_node.name = f"Rotate_{obj_name}"
        rot_node.location = (start_x + 240, y)
        if "rot_default" in item and len(rot_node.inputs) > 2:
            rot_node.inputs[2].default_value = item["rot_default"]
        tree.links.new(geo_socket, rot_node.inputs["Instances"])
        
        # Translate
        trans_node = tree.nodes.new("GeometryNodeTranslateInstances")
        trans_node.name = f"Translate_{obj_name}"
        trans_node.location = (start_x + 480, y)
        if "trans_default" in item and len(trans_node.inputs) > 2:
            trans_node.inputs[2].default_value = item["trans_default"]
        tree.links.new(rot_node.outputs["Instances"], trans_node.inputs["Instances"])
        
        # Scale
        scale_node = tree.nodes.new("GeometryNodeScaleInstances")
        scale_node.name = f"Scale_{obj_name}"
        scale_node.location = (start_x + 720, y)
        if "scale_default" in item and len(scale_node.inputs) > 2:
            scale_node.inputs[2].default_value = item["scale_default"]
        tree.links.new(trans_node.outputs["Instances"], scale_node.inputs["Instances"])
        
        # Join
        tree.links.new(scale_node.outputs["Instances"], join_node.inputs["Geometry"])
        
        # Inyectar keyframes exactos en Geometry Nodes
        for axis_str, kps in item.get("rot_anim", {}).items():
            animar_fcurve(gn_action, f'nodes["{rot_node.name}"].inputs[2].default_value', int(axis_str), kps)
        for axis_str, kps in item.get("trans_anim", {}).items():
            animar_fcurve(gn_action, f'nodes["{trans_node.name}"].inputs[2].default_value', int(axis_str), kps)
        for axis_str, kps in item.get("scale_anim", {}).items():
            animar_fcurve(gn_action, f'nodes["{scale_node.name}"].inputs[2].default_value', int(axis_str), kps)

    # 7. Asignar acciones directas a los objetos estructurales
    with open(OBJ_ACTIONS_PATH, "r", encoding="utf-8") as f:
        obj_actions = json.load(f)
        
    mapping_obj_actions = {
        "Peça 03": "Peça 03Action",
        "Peça 04": "Peça 04Action",
        "Martillo": "MartilloAction",
        "Parafuso estrutural": "Parafuso estruturalAction"
    }
    
    for target_name, act_name in mapping_obj_actions.items():
        o = bpy.data.objects.get(target_name)
        if o and act_name in obj_actions:
            if not o.animation_data:
                o.animation_data_create()
            act = bpy.data.actions.new(name=act_name)
            if hasattr(act, "slots") and len(act.slots) == 0:
                act.slots.new("OBJECT", target_name)
            o.animation_data.action = act
            if hasattr(o.animation_data, "action_slot") and len(act.slots) > 0:
                o.animation_data.action_slot = act.slots[0]
            for cd in obj_actions[act_name]:
                animar_fcurve(act, cd["data_path"], cd["array_index"], cd["kps"])
            print(f"Acción directa asignada a {target_name} ({len(act.fcurves)} curvas)")

    # Asignar Peça 03Action también a Plane (sincronía matemática con Peça 03)
    p3_act = bpy.data.actions.get("Peça 03Action")
    if p3_act and plane:
        if not plane.animation_data:
            plane.animation_data_create()
        plane.animation_data.action = p3_act
        if hasattr(plane.animation_data, "action_slot") and len(p3_act.slots) > 0:
            plane.animation_data.action_slot = p3_act.slots[0]
        print("Acción Peça 03Action vinculada exitosamente a Plane")

    # 8. Timeline (0 a 92 frames, 1 frame = 1 segundo de armado)
    bpy.context.scene.frame_start = 0
    bpy.context.scene.frame_end = 92
    bpy.context.scene.render.fps = 1
    bpy.context.scene.render.fps_base = 1.0
    
    # 9. Guardar .blend editable
    os.makedirs(os.path.dirname(OUT_BLEND), exist_ok=True)
    bpy.ops.wm.save_as_mainfile(filepath=OUT_BLEND)
    print(f"Archivo .blend calibrado guardado: {OUT_BLEND}")

    # 10. Hornear con bake_geometry_nodes_v18
    with bpy.data.libraries.load(REF_P01_BLEND, link=False) as (df, dt):
        if "bake_geometry_nodes_v18.py" in df.texts:
            dt.texts = ["bake_geometry_nodes_v18.py"]
            
    bake_text = bpy.data.texts.get("bake_geometry_nodes_v18.py")
    if bake_text:
        print("Ejecutando horneado v18 y exportando GLB calibrado...")
        exec(bake_text.as_string(), {"__name__": "__main__"})
        print(f"🎉 GLB Calibrado 100% exportado en: {OUT_GLB}")

if __name__ == "__main__":
    run_calibrado()
