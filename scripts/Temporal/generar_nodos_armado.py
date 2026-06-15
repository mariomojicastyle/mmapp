import bpy

def automatizar_nodos_instancias():
    """
    V1: 
    Busca los nodos 'Object Info' en los árboles de Geometry Nodes,
    los pasa a modo 'RELATIVE' y activa la casilla 'As Instance'.
    """
    count = 0
    
    # Vamos a buscar en TODOS los grupos de Geometry Nodes que existan en el archivo
    for tree in bpy.data.node_groups:
        if tree.bl_idname == 'GeometryNodeTree':
            for node in tree.nodes:
                if node.bl_idname == 'GeometryNodeObjectInfo':
                    # 1. Pasarlo a Relative
                    try:
                        node.transform_space = 'RELATIVE'
                    except Exception:
                        pass
                        
                    # 2. Activar "As Instance"
                    if 'As Instance' in node.inputs:
                        try:
                            node.inputs['As Instance'].default_value = True
                        except Exception:
                            pass
                    
                    for inp in node.inputs:
                        if inp.type == 'BOOLEAN':
                            try:
                                inp.default_value = True
                            except Exception:
                                pass
                                
                    count += 1
            
    if count > 0:
        print(f"Éxito: Se actualizaron {count} nodos de Object Info a Relative y As Instance.")
    else:
        print("Error: No se encontró ningún nodo 'Object Info' en Geometry Nodes.")

automatizar_nodos_instancias()
