import bpy

def automatizar_nodos_instancias_v2():
    """
    V2: 
    Busca los nodos 'Object Info' desconectados, les aplica Relative/As Instance, 
    y busca los nodos Rotate, Translate y Scale más cercanos (por altura Y)
    para enlazarlos entre sí y conectarlos al Join Geometry.
    """
    count = 0
    
    for tree in bpy.data.node_groups:
        if tree.bl_idname == 'GeometryNodeTree':
            obj_infos = []
            rotates = []
            translates = []
            scales = []
            join_node = None
            
            for node in tree.nodes:
                if node.bl_idname == 'GeometryNodeObjectInfo':
                    geo_out = next((out for out in node.outputs if out.type in ['GEOMETRY', 'NODESOCKETGEOMETRY']), node.outputs[-1])
                    if not geo_out.is_linked:
                        obj_infos.append(node)
                        try: node.transform_space = 'RELATIVE'
                        except: pass
                        if 'As Instance' in node.inputs:
                            try: node.inputs['As Instance'].default_value = True
                            except: pass
                        for inp in node.inputs:
                            if inp.type == 'BOOLEAN':
                                try: inp.default_value = True
                                except: pass
                                
                elif node.bl_idname == 'GeometryNodeRotateInstances':
                    rotates.append(node)
                elif node.bl_idname == 'GeometryNodeTranslateInstances':
                    translates.append(node)
                elif node.bl_idname == 'GeometryNodeScaleInstances':
                    scales.append(node)
                elif node.bl_idname == 'GeometryNodeJoinGeometry':
                    join_node = node
            
            for obj_node in obj_infos:
                y = obj_node.location.y
                
                closest_rot = min(rotates, key=lambda n: abs(n.location.y - y)) if rotates else None
                closest_trans = min(translates, key=lambda n: abs(n.location.y - y)) if translates else None
                closest_scale = min(scales, key=lambda n: abs(n.location.y - y)) if scales else None
                
                if closest_rot and closest_trans and closest_scale:
                    geo_out = next((out for out in obj_node.outputs if out.type in ['GEOMETRY', 'NODESOCKETGEOMETRY']), obj_node.outputs[-1])
                    
                    try: tree.links.new(geo_out, closest_rot.inputs[0])
                    except: pass
                    try: tree.links.new(closest_rot.outputs[0], closest_trans.inputs[0])
                    except: pass
                    try: tree.links.new(closest_trans.outputs[0], closest_scale.inputs[0])
                    except: pass
                    
                    if join_node:
                        try: tree.links.new(closest_scale.outputs[0], join_node.inputs[0])
                        except: pass
                        
                    count += 1
            
    if count > 0:
        print(f"Éxito (V2): Se procesaron y conectaron {count} cadenas de nodos al Join Geometry.")
    else:
        print("Aviso: No se encontraron nodos 'Object Info' sueltos para conectar.")

automatizar_nodos_instancias_v2()
