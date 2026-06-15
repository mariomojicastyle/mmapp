import bpy

def is_unlinked(node):
    # Verifica si el puerto principal de entrada está libre (sin conexión)
    if len(node.inputs) > 0:
        return not node.inputs[0].is_linked
    return True

def get_connected_node(node, target_bl_idname):
    # Rastrea si el nodo ya está conectado hacia adelante con un nodo del tipo especificado
    for out in node.outputs:
        if out.type in ['GEOMETRY', 'NODESOCKETGEOMETRY'] or 'Geometry' in out.name or 'Instances' in out.name:
            for link in out.links:
                if link.to_node.bl_idname == target_bl_idname:
                    return link.to_node
    return None

def automatizar_nodos_instancias_v4():
    """
    V4: Evita crear nodos redundantes si el usuario duplicó el bloque completo.
    Rastrea las conexiones existentes (Rotate -> Translate -> Scale) para reutilizarlas
    y solo crea los nodos que realmente falten.
    """
    count = 0
    
    for tree in bpy.data.node_groups:
        if tree.bl_idname == 'GeometryNodeTree':
            obj_infos = []
            rotates = []
            translates = []
            scales = []
            
            # Buscar o crear el Join Geometry final
            out_node = next((n for n in tree.nodes if n.bl_idname == 'NodeGroupOutput'), None)
            join_node = None
            
            if out_node:
                for link in tree.links:
                    if link.to_node == out_node and link.from_node.bl_idname == 'GeometryNodeJoinGeometry':
                        join_node = link.from_node
                        break
                if not join_node:
                    join_node = tree.nodes.new('GeometryNodeJoinGeometry')
                    join_node.location = (out_node.location.x - 200, out_node.location.y)
                    if out_node.inputs[0].is_linked:
                        tree.links.new(out_node.inputs[0].links[0].from_socket, join_node.inputs[0])
                    tree.links.new(join_node.outputs[0], out_node.inputs[0])
            
            # Clasificar nodos existentes
            for node in tree.nodes:
                if node.bl_idname == 'GeometryNodeObjectInfo':
                    geo_out = next((out for out in node.outputs if out.type in ['GEOMETRY', 'NODESOCKETGEOMETRY']), node.outputs[-1])
                    if not geo_out.is_linked:
                        obj_infos.append(node)
                elif node.bl_idname == 'GeometryNodeRotateInstances':
                    rotates.append(node)
                elif node.bl_idname == 'GeometryNodeTranslateInstances':
                    translates.append(node)
                elif node.bl_idname == 'GeometryNodeScaleInstances':
                    scales.append(node)
            
            # Procesar cada Object Info
            for obj_node in obj_infos:
                y = obj_node.location.y
                x = obj_node.location.x
                
                # Paso 1: Configurar Object Info
                try: obj_node.transform_space = 'RELATIVE'
                except: pass
                if 'As Instance' in obj_node.inputs:
                    try: obj_node.inputs['As Instance'].default_value = True
                    except: pass
                for inp in obj_node.inputs:
                    if inp.type == 'BOOLEAN':
                        try: inp.default_value = True
                        except: pass
                
                geo_out = next((out for out in obj_node.outputs if out.type in ['GEOMETRY', 'NODESOCKETGEOMETRY']), obj_node.outputs[-1])
                
                # --- ROTATE ---
                rot_node = get_connected_node(obj_node, 'GeometryNodeRotateInstances')
                if not rot_node:
                    rot_node = next((n for n in rotates if is_unlinked(n) and abs(n.location.y - y) < 100), None)
                    if not rot_node:
                        rot_node = tree.nodes.new('GeometryNodeRotateInstances')
                        rot_node.location = (x + 200, y)
                        rotates.append(rot_node)
                    try: tree.links.new(geo_out, rot_node.inputs[0])
                    except: pass
                    
                # --- TRANSLATE ---
                # Verificar si el Rotate ya está conectado a un Translate (evita duplicados si el usuario copió el bloque)
                trans_node = get_connected_node(rot_node, 'GeometryNodeTranslateInstances')
                if not trans_node:
                    trans_node = next((n for n in translates if is_unlinked(n) and abs(n.location.y - y) < 100), None)
                    if not trans_node:
                        trans_node = tree.nodes.new('GeometryNodeTranslateInstances')
                        trans_node.location = (rot_node.location.x + 200, y)
                        translates.append(trans_node)
                    try: tree.links.new(rot_node.outputs[0], trans_node.inputs[0])
                    except: pass
                    
                # --- SCALE ---
                scale_node = get_connected_node(trans_node, 'GeometryNodeScaleInstances')
                if not scale_node:
                    scale_node = next((n for n in scales if is_unlinked(n) and abs(n.location.y - y) < 100), None)
                    if not scale_node:
                        scale_node = tree.nodes.new('GeometryNodeScaleInstances')
                        scale_node.location = (trans_node.location.x + 200, y)
                        scales.append(scale_node)
                    try: tree.links.new(trans_node.outputs[0], scale_node.inputs[0])
                    except: pass
                
                # --- JOIN GEOMETRY ---
                if join_node:
                    already_joined = False
                    for link in scale_node.outputs[0].links:
                        if link.to_node == join_node:
                            already_joined = True
                            break
                    if not already_joined:
                        try: tree.links.new(scale_node.outputs[0], join_node.inputs[0])
                        except: pass
                        
                count += 1
                
    if count > 0:
        print(f"Éxito (V4): Se procesaron {count} objetos, reutilizando conexiones existentes y creando solo los nodos faltantes.")
    else:
        print("Aviso: No se encontraron nodos 'Object Info' sueltos.")

automatizar_nodos_instancias_v4()
