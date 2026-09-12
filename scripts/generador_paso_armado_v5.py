"""
generador_paso_armado_v5.py
---------------------------
Motor de Automatización de Manuales de Armado para Blender 4.5+ (Basado en el Protocolo Mario Mojica v5).

Evolución del protocolo manual:
- Carga el archivo maestro del mueble (o GLB).
- Crea el objeto 'Plane' (Emisor) con su GeometryNodeTree.
- Inserta automáticamente en orden todas las piezas y herrajes requeridos (Object Info).
- Conecta la cadena: Object Info -> Rotate Instances -> Translate Instances -> Scale Instances -> Join Geometry.
- Genera proceduralmente los keyframes de animación según los sub-pasos y tiempos definidos en el guión:
    1. Pop-in de escala (0 -> 1 o efecto pop).
    2. Desplazamiento desde posición despiece (offset) hacia la posición final de ensamble (0, 0, 0 local).
- Exporta automáticamente el archivo Pxx.glb y guarda el archivo Pxx.blend.
"""

import bpy
import os
import math
from mathutils import Vector

def crear_o_limpiar_emisor(tree_name="Geometry Nodes.001"):
    """Crea el objeto Plane 'Emisor' si no existe o limpia su árbol de nodos."""
    plane = bpy.data.objects.get("Plane")
    if not plane:
        mesh = bpy.data.meshes.new("PlaneMesh")
        plane = bpy.data.objects.new("Plane", mesh)
        bpy.context.scene.collection.objects.link(plane)
    
    # Asegurar modificador GeometryNodes
    mod = plane.modifiers.get("GeometryNodes")
    if not mod:
        mod = plane.modifiers.new(name="GeometryNodes", type="NODES")
    
    tree = bpy.data.node_groups.get(tree_name)
    if not tree:
        tree = bpy.data.node_groups.new(name=tree_name, type="GeometryNodeTree")
    mod.node_group = tree
    
    # Limpiar nodos previos en el árbol
    tree.nodes.clear()
    
    # Crear Output Node
    out_node = tree.nodes.new("NodeGroupOutput")
    out_node.location = (1200, 0)
    
    # Crear Join Geometry Node
    join_node = tree.nodes.new("GeometryNodeJoinGeometry")
    join_node.location = (900, 0)
    
    # Asegurar socket de salida en el árbol
    if hasattr(tree, 'interface'):
        if not any(item.name == "Geometry" and item.item_type == 'SOCKET' and item.in_out == 'OUTPUT' for item in tree.interface.items_tree):
            tree.interface.new_socket(name="Geometry", in_out="OUTPUT", socket_type="NodeSocketGeometry")
    
    tree.links.new(join_node.outputs[0], out_node.inputs[0])
    
    return plane, tree, join_node

def animar_fcurve_vector(action, data_path, frames_vals):
    """
    frames_vals: dict { array_index (0=X, 1=Y, 2=Z): [(frame, value), ...] }
    """
    for axis, kps in frames_vals.items():
        fc = action.fcurves.find(data_path=data_path, index=axis)
        if not fc:
            fc = action.fcurves.new(data_path=data_path, index=axis)
        for f, v in kps:
            fc.keyframe_points.insert(frame=f, value=v)

def construir_paso_armado(config_paso):
    """
    config_paso = {
        "paso": "P01",
        "output_blend": "c:/Desarrollo/mmapp/temporal/Blender/P01_automatizado.blend",
        "output_glb": "c:/Desarrollo/mmapp/temporal/Blender/P01_automatizado.glb",
        "duracion_total_frames": 92,
        "fps": 24, # o 1 fps según tu timeline
        "elementos": [
            {
                "objeto": "Sapata redonda.001",
                "pop_frame": 70, # frame donde aparece en escala
                "offset_inicio": Vector((0.0, 0.0, -0.10)), # despiece en Z (-10cm)
                "frame_inicio_mov": 72,
                "frame_fin_mov": 75,
            },
            ...
        ]
    }
    """
    plane, tree, join_node = crear_o_limpiar_emisor()
    
    # Crear o asignar Action para el NodeGroup
    if not tree.animation_data:
        tree.animation_data_create()
    action_name = f"{tree.name}Action"
    action = bpy.data.actions.get(action_name)
    if not action:
        action = bpy.data.actions.new(name=action_name)
    action.fcurves.clear()
    tree.animation_data.action = action
    
    elementos = config_paso.get("elementos", [])
    start_x = -600
    start_y = (len(elementos) * 180) / 2
    
    for idx, item in enumerate(elementos):
        obj_name = item["objeto"]
        obj = bpy.data.objects.get(obj_name)
        if not obj:
            print(f"⚠️ Advertencia: Objeto '{obj_name}' no encontrado en la escena. Se omite.")
            continue
            
        y = start_y - (idx * 180)
        
        # 1. Object Info
        obj_node = tree.nodes.new("GeometryNodeObjectInfo")
        obj_node.location = (start_x, y)
        obj_node.transform_space = "RELATIVE"
        obj_node.inputs["Object"].default_value = obj
        if "As Instance" in obj_node.inputs:
            obj_node.inputs["As Instance"].default_value = True
            
        # 2. Rotate Instances
        rot_node = tree.nodes.new("GeometryNodeRotateInstances")
        rot_node.location = (start_x + 220, y)
        tree.links.new(obj_node.outputs[3] if len(obj_node.outputs) > 3 else obj_node.outputs[-1], rot_node.inputs[0])
        
        # 3. Translate Instances
        trans_node = tree.nodes.new("GeometryNodeTranslateInstances")
        trans_node.location = (start_x + 440, y)
        tree.links.new(rot_node.outputs[0], trans_node.inputs[0])
        
        # 4. Scale Instances
        scale_node = tree.nodes.new("GeometryNodeScaleInstances")
        scale_node.location = (start_x + 660, y)
        tree.links.new(trans_node.outputs[0], scale_node.inputs[0])
        
        # 5. Link to Join Geometry
        tree.links.new(scale_node.outputs[0], join_node.inputs[0])
        
        # --- ANIMACIÓN ---
        pop_f = item.get("pop_frame")
        offset = item.get("offset_inicio", Vector((0.0, 0.0, 0.0)))
        f_ini = item.get("frame_inicio_mov")
        f_fin = item.get("frame_fin_mov")
        
        # A. Keyframes de Scale (Efecto Pop / Aparición)
        if pop_f is not None:
            # Scale va de 0 a 2.0/3.0 y luego se asienta en 1.0 (efecto pop pulido)
            scale_path = f'nodes["{scale_node.name}"].inputs[2].default_value'
            scale_kps = [
                (pop_f, 0.0),
                (pop_f + 1, 2.0),
                (pop_f + 2, 1.0)
            ]
            animar_fcurve_vector(action, scale_path, {
                0: scale_kps,
                1: scale_kps,
                2: scale_kps
            })
        else:
            # Siempre visible a escala 1.0
            scale_node.inputs[2].default_value = Vector((1.0, 1.0, 1.0))
            
        # B. Keyframes de Translation (Despiece -> Ensamble)
        if f_ini is not None and f_fin is not None and (offset.length > 0.0001):
            trans_path = f'nodes["{trans_node.name}"].inputs[2].default_value'
            trans_dict = {}
            for axis_idx, axis_val in enumerate([offset.x, offset.y, offset.z]):
                if abs(axis_val) > 0.0001:
                    trans_dict[axis_idx] = [
                        (f_ini, axis_val),
                        (f_fin, 0.0)
                    ]
                else:
                    trans_dict[axis_idx] = [
                        (f_ini, 0.0),
                        (f_fin, 0.0)
                    ]
            animar_fcurve_vector(action, trans_path, trans_dict)
        else:
            trans_node.inputs[2].default_value = Vector((0.0, 0.0, 0.0))
            
    # Configurar timeline
    dur_frames = config_paso.get("duracion_total_frames", 92)
    bpy.context.scene.frame_start = 0
    bpy.context.scene.frame_end = dur_frames
    bpy.context.scene.render.fps = config_paso.get("fps", 24)
    
    # Guardar archivo .blend
    out_blend = config_paso.get("output_blend")
    if out_blend:
        os.makedirs(os.path.dirname(out_blend), exist_ok=True)
        bpy.ops.wm.save_as_mainfile(filepath=out_blend)
        print(f"✅ Archivo Blend guardado con éxito: {out_blend}")
        
    # Exportar archivo .glb
    out_glb = config_paso.get("output_glb")
    if out_glb:
        os.makedirs(os.path.dirname(out_glb), exist_ok=True)
        # Ocultar o deseleccionar objetos que no pertenezcan al Plane emisor si es necesario
        bpy.ops.export_scene.gltf(
            filepath=out_glb,
            export_format="GLB",
            export_animations=True,
            export_current_frame=False,
        )
        print(f"✅ Archivo GLB exportado con éxito: {out_glb}")

if __name__ == "__main__":
    print("Script generador_paso_armado_v5 cargado correctamente.")
