import bpy
import os
import json
import mathutils

SOURCE_BLEND = r"c:\Desarrollo\mmapp\temporal\Blender\Mesa Tijuca Polifurniture_Master_Girado.blend"
REF_P01_BLEND = r"c:\Desarrollo\mmapp\temporal\Blender\P01.blend"
PERFECT_RECIPE_PATH = r"C:\Users\mario\.gemini\antigravity\brain\ef7401f7-7ccf-40d4-b5fc-163b1a8a1b49\scratch\p01_perfect_recipe.json"
OBJ_ACTIONS_PATH = r"c:\Desarrollo\mmapp\temporal\Blender\p01_object_actions.json"
PARENTS_PATH = r"c:\Desarrollo\mmapp\temporal\Blender\p01_parents.json"

OUT_BLEND = r"c:\Desarrollo\mmapp\temporal\Blender\P01_propuesta_alternativa.blend"
OUT_GLB = r"c:\Desarrollo\mmapp\temporal\Blender\P01_propuesta_alternativa.glb"

def animar_fcurve(action, data_path, array_index, kps):
    fc = action.fcurves.find(data_path=data_path, index=array_index)
    if not fc:
        fc = action.fcurves.new(data_path=data_path, index=array_index)
    for pt in kps:
        frame = pt[0]
        val = pt[1]
        interp = pt[2] if len(pt) > 2 else 'BEZIER'
        kp = fc.keyframe_points.insert(frame=frame, value=val)
        kp.interpolation = interp

def run():
    print("\n=======================================================")
    print("GENERADOR DE PROPUESTA ALTERNATIVA CON COHERENCIA FISICA")
    print("1. Martillo en Pata Derecha (sobre Prego en Sapata redonda.003)")
    print("2. Llave Allen en Pata Derecha (acoplada en Parafuso estrutural.001)")
    print("3. Correderas con tornillos atornillados inmediatamente")
    print("4. Apoyo estructural continuo y sin elementos en el aire")
    print("=======================================================")

    # 1. Abrir Master_Girado
    bpy.ops.wm.open_mainfile(filepath=SOURCE_BLEND)

    # 2. Cargar receta base calibrada
    with open(PERFECT_RECIPE_PATH, "r", encoding="utf-8") as f:
        recipe_items = json.load(f)
    recipe_dict = {item["name"]: item for item in recipe_items}
    recipe_names = set(recipe_dict.keys())

    # 3. Importar Martillo y Chave allen originales
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

    # 3.1. Reubicar y reorientar Chave allen para Pata Derecha (Parafuso estrutural.001)
    chave = bpy.data.objects.get("Chave allen")
    if chave:
        chave.location = mathutils.Vector((0.4501, -0.1347, 0.4200))
        chave.rotation_mode = 'QUATERNION'
        chave.rotation_quaternion = mathutils.Quaternion((0.0, 0.0, -0.7071068, 0.7071068))

    # 3.2. Reubicar Martillo para Pata Derecha (sobre Prego en Sapata redonda.003) con tolerancia submilim?trica (0.17 mm)
    martillo = bpy.data.objects.get("Martillo")
    if martillo:
        martillo.location = mathutils.Vector((0.4426, -0.6522, 0.6424))
        martillo.rotation_mode = 'QUATERNION'
        martillo.rotation_quaternion = mathutils.Quaternion((0.7071067, 0.0, 0.0, -0.7071069))

    # 4. Aislar exclusivamente las 39 piezas del Paso 01
    for obj in list(bpy.data.objects):
        if obj.type == "MESH" and obj.name not in recipe_names:
            bpy.data.objects.remove(obj, do_unlink=True)
    mesh_count = len([o for o in bpy.data.objects if o.type == 'MESH'])
    print("Piezas aisladas para P01:", mesh_count)

    # 4.5. Aplicar jerarquias de ensamble (Parenting)
    if os.path.exists(PARENTS_PATH):
        with open(PARENTS_PATH, "r", encoding="utf-8") as f:
            parents_data = json.load(f)
        for child_name, p_info in parents_data.items():
            child = bpy.data.objects.get(child_name)
            parent = bpy.data.objects.get(p_info["parent"])
            if child and parent:
                child.parent = parent
                child.matrix_parent_inverse = mathutils.Matrix(p_info["matrix_parent_inverse"])
        print("Relaciones de emparentado aplicadas:", len(parents_data))

    # 5. Crear Plane Emisor
    mesh = bpy.data.meshes.new("PlaneMesh")
    plane = bpy.data.objects.new("Plane", mesh)
    p3 = bpy.data.objects.get("Pe?a 03")
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

    tree.animation_data_create()
    gn_action = bpy.data.actions.new(name="Geometry Nodes.001Action")
    if hasattr(gn_action, "id_root"):
        gn_action.id_root = "NODETREE"
    if hasattr(gn_action, "slots") and len(gn_action.slots) == 0:
        gn_action.slots.new("NODETREE", "Geometry Nodes.001")
    tree.animation_data.action = gn_action
    if hasattr(tree.animation_data, "action_slot") and len(gn_action.slots) > 0:
        tree.animation_data.action_slot = gn_action.slots[0]

    # --- MODIFICACIONES COREOGRAFICAS ALTERNATIVAS CON COHERENCIA FISICA ---

    # A) LLAVE ALLEN EN PATA DERECHA (Frames 54 a 61)
    # Acople conc?ntrico al hex?gono del tornillo estrutural.001
    recipe_dict["Chave allen"]["scale_anim"] = {
        "0": [[0.0, 0.0, 'BEZIER'], [53.0, 0.0, 'BEZIER'], [54.0, 1.0, 'BEZIER'], [60.0, 1.0, 'BEZIER'], [61.0, 0.0, 'BEZIER']],
        "1": [[0.0, 0.0, 'BEZIER'], [53.0, 0.0, 'BEZIER'], [54.0, 1.0, 'BEZIER'], [60.0, 1.0, 'BEZIER'], [61.0, 0.0, 'BEZIER']],
        "2": [[0.0, 0.0, 'BEZIER'], [53.0, 0.0, 'BEZIER'], [54.0, 1.0, 'BEZIER'], [60.0, 1.0, 'BEZIER'], [61.0, 0.0, 'BEZIER']]
    }
    # Con el eje X local invertido 180?, valores negativos avanzan hacia +X en mundo
    recipe_dict["Chave allen"]["trans_anim"] = {
        "0": [
            [54.0, -0.20, 'BEZIER'],
            [56.0, -0.20, 'BEZIER'],
            [57.0, -0.10, 'BEZIER'],
            [58.0, -0.03, 'BEZIER'],
            [59.0, 0.0, 'BEZIER'],
            [60.0, -0.06, 'BEZIER'], # Desacople hacia afuera (+X)
            [61.0, -0.10, 'BEZIER']
        ],
        "1": [[54.0, 0.0, 'BEZIER'], [61.0, 0.0, 'BEZIER']],
        "2": [[54.0, 0.0, 'BEZIER'], [61.0, 0.0, 'BEZIER']]
    }
    recipe_dict["Chave allen"]["rot_anim"] = {
        "0": [
            [56.0, 0.0, 'LINEAR'],
            [57.0, 3.14159, 'LINEAR'],
            [58.0, 6.28318, 'LINEAR'],
            [59.0, 12.56637, 'LINEAR'], # 720? de apriete rotacional
            [60.0, 12.56637, 'LINEAR']
        ],
        "1": [[56.0, 0.0, 'BEZIER']],
        "2": [[56.0, 0.0, 'BEZIER']]
    }

    # B) TORNILLO ESTRUCTURAL PATA DERECHA (Parafuso estrutural.001)
    # Gira y avanza simult?neamente con la llave Allen
    recipe_dict["Parafuso estrutural.001"]["scale_anim"] = {
        "0": [[0.0, 0.0, 'BEZIER'], [53.0, 0.0, 'BEZIER'], [54.0, 2.0, 'BEZIER'], [55.0, 1.0, 'BEZIER']],
        "1": [[0.0, 0.0, 'BEZIER'], [53.0, 0.0, 'BEZIER'], [54.0, 2.0, 'BEZIER'], [55.0, 1.0, 'BEZIER']],
        "2": [[0.0, 0.0, 'BEZIER'], [53.0, 0.0, 'BEZIER'], [54.0, 2.0, 'BEZIER'], [55.0, 1.0, 'BEZIER']]
    }
    recipe_dict["Parafuso estrutural.001"]["trans_anim"] = {
        "0": [
            [54.0, 0.20, 'BEZIER'],
            [56.0, 0.20, 'BEZIER'],
            [57.0, 0.10, 'BEZIER'],
            [58.0, 0.03, 'BEZIER'],
            [59.0, 0.0, 'BEZIER']
        ],
        "1": [[54.0, 0.0, 'BEZIER']],
        "2": [[54.0, 0.0, 'BEZIER']]
    }
    recipe_dict["Parafuso estrutural.001"]["rot_anim"] = {
        "0": [
            [56.0, 0.0, 'LINEAR'],
            [57.0, 3.14159, 'LINEAR'],
            [58.0, 6.28318, 'LINEAR'],
            [59.0, 12.56637, 'LINEAR']
        ],
        "1": [[56.0, 0.0, 'BEZIER']],
        "2": [[56.0, 0.0, 'BEZIER']]
    }

    # C) TORNILLO ESTRUCTURAL PATA IZQUIERDA (Parafuso estrutural)
    # Ajuste autom?tico limpio a frames 40-44
    recipe_dict["Parafuso estrutural"]["scale_anim"] = {
        "0": [[0.0, 0.0, 'BEZIER'], [39.0, 0.0, 'BEZIER'], [40.0, 2.0, 'BEZIER'], [41.0, 1.0, 'BEZIER']],
        "1": [[0.0, 0.0, 'BEZIER'], [39.0, 0.0, 'BEZIER'], [40.0, 2.0, 'BEZIER'], [41.0, 1.0, 'BEZIER']],
        "2": [[0.0, 0.0, 'BEZIER'], [39.0, 0.0, 'BEZIER'], [40.0, 2.0, 'BEZIER'], [41.0, 1.0, 'BEZIER']]
    }
    recipe_dict["Parafuso estrutural"]["trans_anim"] = {
        "0": [
            [41.0, -0.20, 'BEZIER'],
            [42.0, -0.12, 'BEZIER'],
            [43.0, -0.04, 'BEZIER'],
            [44.0, 0.0, 'BEZIER']
        ],
        "1": [[41.0, 0.0, 'BEZIER']],
        "2": [[41.0, 0.0, 'BEZIER']]
    }
    recipe_dict["Parafuso estrutural"]["rot_anim"] = {
        "0": [
            [41.0, 0.0, 'LINEAR'],
            [42.0, 3.14159, 'LINEAR'],
            [43.0, 6.28318, 'LINEAR'],
            [44.0, 12.56637, 'LINEAR']
        ],
        "1": [[41.0, 0.0, 'BEZIER']],
        "2": [[41.0, 0.0, 'BEZIER']]
    }

    # D) MARTILLO EN PATA DERECHA (Frames 80 a 86)
    # Golpea tangencialmente a Prego en Sapata redonda.003
    recipe_dict["Martillo"]["scale_anim"] = {
        "0": [[0.0, 0.0, 'BEZIER'], [80.0, 0.0, 'BEZIER'], [81.0, 1.0, 'BEZIER'], [85.0, 1.0, 'BEZIER'], [86.0, 0.0, 'BEZIER']],
        "1": [[0.0, 0.0, 'BEZIER'], [80.0, 0.0, 'BEZIER'], [81.0, 1.0, 'BEZIER'], [85.0, 1.0, 'BEZIER'], [86.0, 0.0, 'BEZIER']],
        "2": [[0.0, 0.0, 'BEZIER'], [80.0, 0.0, 'BEZIER'], [81.0, 1.0, 'BEZIER'], [85.0, 1.0, 'BEZIER'], [86.0, 0.0, 'BEZIER']]
    }
    recipe_dict["Martillo"]["rot_anim"] = {
        "0": [[81.0, 0.0, 'BEZIER']],
        "1": [
            [81.0, 0.0, 'LINEAR'],
            [82.0, 0.12217, 'LINEAR'], # Golpe 1 sobre cabeza de Prego
            [83.0, 0.0, 'LINEAR'],
            [84.0, 0.12217, 'LINEAR'], # Golpe 2 sobre cabeza de Prego
            [85.0, 0.0, 'LINEAR']
        ],
        "2": [[81.0, 0.0, 'BEZIER']]
    }
    recipe_dict["Martillo"]["trans_anim"] = {
        "0": [[81.0, 0.0, 'BEZIER'], [83.0, -0.008, 'BEZIER'], [85.0, -0.018, 'BEZIER'], [86.0, -0.018, 'BEZIER']],
        "1": [[81.0, 0.0, 'BEZIER']],
        "2": [[81.0, 0.0, 'BEZIER']]
    }

    # E) CLAVO EN PATA DERECHA (Prego)
    # Recibe los dos golpes e ingresa penetrando la madera hasta enrasar
    recipe_dict["Prego"]["scale_anim"] = {
        "0": [[0.0, 0.0, 'BEZIER'], [76.0, 0.0, 'BEZIER'], [77.0, 3.0, 'BEZIER'], [78.0, 1.0, 'BEZIER']],
        "1": [[0.0, 0.0, 'BEZIER'], [76.0, 0.0, 'BEZIER'], [77.0, 3.0, 'BEZIER'], [78.0, 1.0, 'BEZIER']],
        "2": [[0.0, 0.0, 'BEZIER'], [76.0, 0.0, 'BEZIER'], [77.0, 3.0, 'BEZIER'], [78.0, 1.0, 'BEZIER']]
    }
    recipe_dict["Prego"]["trans_anim"] = {
        "0": [[78.0, 0.0, 'BEZIER']],
        "1": [[78.0, 0.0, 'BEZIER']],
        "2": [
            [78.0, -0.08, 'BEZIER'],
            [81.0, -0.04, 'BEZIER'],
            [82.0, -0.02, 'BEZIER'], # Penetraci?n tras golpe 1
            [83.0, -0.02, 'BEZIER'],
            [84.0, -0.005, 'BEZIER'], # Penetraci?n tras golpe 2
            [85.0, 0.0, 'BEZIER']     # Totalmente enrasado con la sapata
        ]
    }

    # F) CLAVO PATA IZQUIERDA (Prego.002)
    # Entra fluidamente con las dem?s sapatas
    recipe_dict["Prego.002"]["scale_anim"] = {
        "0": [[0.0, 0.0, 'BEZIER'], [86.0, 0.0, 'BEZIER'], [87.0, 3.0, 'BEZIER'], [88.0, 1.0, 'BEZIER']],
        "1": [[0.0, 0.0, 'BEZIER'], [86.0, 0.0, 'BEZIER'], [87.0, 3.0, 'BEZIER'], [88.0, 1.0, 'BEZIER']],
        "2": [[0.0, 0.0, 'BEZIER'], [86.0, 0.0, 'BEZIER'], [87.0, 3.0, 'BEZIER'], [88.0, 1.0, 'BEZIER']]
    }
    recipe_dict["Prego.002"]["trans_anim"] = {
        "0": [[88.0, 0.0, 'BEZIER']],
        "1": [[88.0, 0.0, 'BEZIER']],
        "2": [[88.0, -0.08, 'BEZIER'], [89.0, 0.0, 'BEZIER']]
    }

    # 6. Conectar los 39 elementos en Geometry Nodes
    start_x = -700
    start_y = (len(recipe_items) * 160) / 2

    for idx, item in enumerate(recipe_items):
        obj_name = item["name"]
        obj = bpy.data.objects.get(obj_name)
        if not obj:
            print("Item no encontrado:", obj_name)
            continue

        y = start_y - (idx * 160)

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

        rot_node = tree.nodes.new("GeometryNodeRotateInstances")
        rot_node.name = f"Rotate_{obj_name}"
        rot_node.location = (start_x + 240, y)
        if "rot_default" in item and len(rot_node.inputs) > 2:
            rot_node.inputs[2].default_value = item["rot_default"]
        tree.links.new(geo_socket, rot_node.inputs["Instances"])

        trans_node = tree.nodes.new("GeometryNodeTranslateInstances")
        trans_node.name = f"Translate_{obj_name}"
        trans_node.location = (start_x + 480, y)
        if "trans_default" in item and len(trans_node.inputs) > 2:
            trans_node.inputs[2].default_value = item["trans_default"]
        tree.links.new(rot_node.outputs["Instances"], trans_node.inputs["Instances"])

        scale_node = tree.nodes.new("GeometryNodeScaleInstances")
        scale_node.name = f"Scale_{obj_name}"
        scale_node.location = (start_x + 720, y)
        if "scale_default" in item and len(scale_node.inputs) > 2:
            scale_node.inputs[2].default_value = item["scale_default"]
        tree.links.new(trans_node.outputs["Instances"], scale_node.inputs["Instances"])

        tree.links.new(scale_node.outputs["Instances"], join_node.inputs["Geometry"])

        for axis_str, kps in item.get("rot_anim", {}).items():
            animar_fcurve(gn_action, f'nodes["{rot_node.name}"].inputs[2].default_value', int(axis_str), kps)
        for axis_str, kps in item.get("trans_anim", {}).items():
            animar_fcurve(gn_action, f'nodes["{trans_node.name}"].inputs[2].default_value', int(axis_str), kps)
        for axis_str, kps in item.get("scale_anim", {}).items():
            animar_fcurve(gn_action, f'nodes["{scale_node.name}"].inputs[2].default_value', int(axis_str), kps)

    # 7. Asignar acciones directas a los objetos estructurales
    with open(OBJ_ACTIONS_PATH, "r", encoding="utf-8") as f:
        obj_actions = json.load(f)

    # Actualizar MartilloAction con coordenadas exactas sobre Prego en Pata Derecha
    if "MartilloAction" in obj_actions:
        for track in obj_actions["MartilloAction"]:
            if track["data_path"] == "location" and track["array_index"] == 0:
                track["kps"] = [[57.0, 0.4426], [80.0, 0.4426]]
            elif track["data_path"] == "location" and track["array_index"] == 1:
                track["kps"] = [[57.0, -0.6522], [70.0, -0.6522], [80.0, -0.6522]]
            elif track["data_path"] == "location" and track["array_index"] == 2:
                track["kps"] = [[57.0, 0.6424], [70.0, 0.6424], [80.0, 0.6424]]

    mapping_obj_actions = {
        "Pe?a 03": "Pe?a 03Action",
        "Pe?a 04": "Pe?a 04Action",
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
            print("Accion directa asignada a", target_name)

    p3_act = bpy.data.actions.get("Pe?a 03Action")
    if p3_act and plane:
        if not plane.animation_data:
            plane.animation_data_create()
        plane.animation_data.action = p3_act
        if hasattr(plane.animation_data, "action_slot") and len(p3_act.slots) > 0:
            plane.animation_data.action_slot = p3_act.slots[0]

    # 8. Timeline (0 a 92 frames, 1 frame = 1 segundo de tiempo real)
    bpy.context.scene.frame_start = 0
    bpy.context.scene.frame_end = 92
    bpy.context.scene.render.fps = 1
    bpy.context.scene.render.fps_base = 1.0

    # 9. Guardar .blend
    os.makedirs(os.path.dirname(OUT_BLEND), exist_ok=True)
    bpy.ops.wm.save_as_mainfile(filepath=OUT_BLEND)
    print("Archivo .blend guardado:", OUT_BLEND)

    # 10. Hornear con bake_geometry_nodes_v18
    with bpy.data.libraries.load(REF_P01_BLEND, link=False) as (df, dt):
        if "bake_geometry_nodes_v18.py" in df.texts:
            dt.texts = ["bake_geometry_nodes_v18.py"]

    bake_text = bpy.data.texts.get("bake_geometry_nodes_v18.py")
    if bake_text:
        print("Ejecutando horneado v18 y exportando GLB alternativo...")
        exec(bake_text.as_string(), {"__name__": "__main__"})
        print("GLB Alternativo exportado exitosamente en:", OUT_GLB)

if __name__ == "__main__":
    run()
