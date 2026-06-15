import bpy

def is_unlinked(node):
    # Verifica si el puerto principal de entrada está libre (sin conexión)
    if len(node.inputs) > 0:
        return not node.inputs[0].is_linked
    return True

def automatizar_nodos_instancias_v3():
    """
    V3 - PASO 3: 
    Busca Object Info desconectados. Si no tienen Rotate, Translate o Scale 
    libres a su lado, los CREA inteligentemente. Luego conecta todo en cadena hasta el Join.
    """
    count = 0
    
    for tree in bpy.data.node_groups:
        if tree.bl_idname == 'GeometryNodeTree':
            obj_infos = []
            rotates = []
            translates = []
            scales = []
            
            # Buscar el Group Output para poder conectarnos al Join Geometry final
            out_node = next((n for n in tree.nodes if n.bl_idname == 'NodeGroupOutput'), None)
            join_node = None
            
            if out_node:
                # Buscar si ya hay un Join Geometry conectado directo al Output
                for link in tree.links:
                    if link.to_node == out_node and link.from_node.bl_idname == 'GeometryNodeJoinGeometry':
                        join_node = link.from_node
                        break
                
                # Si no hay Join Geometry final, creamos uno
                if not join_node:
                    join_node = tree.nodes.new('GeometryNodeJoinGeometry')
                    join_node.location = (out_node.location.x - 200, out_node.location.y)
                    if out_node.inputs[0].is_linked:
                        tree.links.new(out_node.inputs[0].links[0].from_socket, join_node.inputs[0])
                    tree.links.new(join_node.outputs[0], out_node.inputs[0])
            
            # Clasificar los nodos existentes en el árbol
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
            
            # Procesar cada Object Info suelto
            for obj_node in obj_infos:
                y = obj_node.location.y
                x = obj_node.location.x
                
                # Paso 1 automático: Relative y As Instance
                try: obj_node.transform_space = 'RELATIVE'
                except: pass
                if 'As Instance' in obj_node.inputs:
                    try: obj_node.inputs['As Instance'].default_value = True
                    except: pass
                for inp in obj_node.inputs:
                    if inp.type == 'BOOLEAN':
                        try: inp.default_value = True
                        except: pass
                
                # Buscar Rotate libre cercano, si no existe, CREARLO
                rot_node = next((n for n in rotates if is_unlinked(n) and abs(n.location.y - y) < 100), None)
                if not rot_node:
                    rot_node = tree.nodes.new('GeometryNodeRotateInstances')
                    rot_node.location = (x + 200, y)
                    rotates.append(rot_node) # Guardar en lista por si otro nodo lo busca (aunque ya estará linked)
                    
                # Buscar Translate libre cercano, si no existe, CREARLO
                trans_node = next((n for n in translates if is_unlinked(n) and abs(n.location.y - y) < 100), None)
                if not trans_node:
                    trans_node = tree.nodes.new('GeometryNodeTranslateInstances')
                    trans_node.location = (rot_node.location.x + 200, y)
                    translates.append(trans_node)
                    
                # Buscar Scale libre cercano, si no existe, CREARLO
                scale_node = next((n for n in scales if is_unlinked(n) and abs(n.location.y - y) < 100), None)
                if not scale_node:
                    scale_node = tree.nodes.new('GeometryNodeScaleInstances')
                    scale_node.location = (trans_node.location.x + 200, y)
                    scales.append(scale_node)
                
                # Enlazar toda la cadena
                geo_out = next((out for out in obj_node.outputs if out.type in ['GEOMETRY', 'NODESOCKETGEOMETRY']), obj_node.outputs[-1])
                
                try: tree.links.new(geo_out, rot_node.inputs[0])
                except: pass
                try: tree.links.new(rot_node.outputs[0], trans_node.inputs[0])
                except: pass
                try: tree.links.new(trans_node.outputs[0], scale_node.inputs[0])
                except: pass
                
                # Enlazar el Scale final al Join Geometry
                if join_node:
                    try: tree.links.new(scale_node.outputs[0], join_node.inputs[0])
                    except: pass
                    
                count += 1
                
    if count > 0:
        print(f"Éxito (V3): Se procesaron {count} objetos, creando nodos faltantes y conectando todo.")
    else:
        print("Aviso: No se encontraron nodos 'Object Info' sueltos.")

automatizar_nodos_instancias_v3()
