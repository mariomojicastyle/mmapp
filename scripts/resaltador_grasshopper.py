import bpy

def get_gh_material():
    mat_name = "GH_Resaltado"
    mat = bpy.data.materials.get(mat_name)
    if not mat:
        mat = bpy.data.materials.new(mat_name)
        mat.use_nodes = True
        
        # Color verde brillante en la vista Sólida (Viewport Display)
        mat.diffuse_color = (0.05, 1.0, 0.05, 1.0) 
        
        # Color verde fosforescente en Material Preview / Render
        nodes = mat.node_tree.nodes
        nodes.clear()
        emission = nodes.new('ShaderNodeEmission')
        emission.inputs['Color'].default_value = (0.05, 1.0, 0.05, 1.0)
        emission.inputs['Strength'].default_value = 5.0
        output = nodes.new('ShaderNodeOutputMaterial')
        mat.node_tree.links.new(emission.outputs[0], output.inputs[0])
        
    return mat

def toggle_grasshopper_highlight():
    context = bpy.context
    active_obj = context.active_object
    if not active_obj:
        print("Error: Selecciona el objeto principal.")
        return
        
    geo_mod = next((mod for mod in active_obj.modifiers if mod.type == 'NODES'), None)
    if not geo_mod or not geo_mod.node_group:
        print("Error: No se encontraron Geometry Nodes en el objeto activo.")
        return
        
    tree = geo_mod.node_group
    active_node = tree.nodes.active
    
    out_node = next((n for n in tree.nodes if n.bl_idname == 'NodeGroupOutput'), None)
    if not out_node:
        print("Error: No se encontró el nodo Group Output.")
        return
        
    # Identificadores exclusivos de los nodos de nuestro sistema
    gh_realize_name = "GH_Realize"
    gh_mat_name = "GH_SetMaterial"
    gh_join_name = "GH_Join"
    
    gh_realize = tree.nodes.get(gh_realize_name)
    gh_mat = tree.nodes.get(gh_mat_name)
    gh_join = tree.nodes.get(gh_join_name)
    
    # 1. SI LA RAMA GH YA EXISTE EN EL ÁRBOL
    if gh_join and gh_mat and gh_realize:
        # Ver si el nodo actualmente resaltado es el mismo que tenemos seleccionado
        if len(gh_realize.inputs[0].links) > 0:
            connected_node = gh_realize.inputs[0].links[0].from_node
            
            # Si tocamos el mismo nodo, o no seleccionamos nada -> APAGAMOS
            if not active_node or connected_node == active_node or active_node.name in [gh_realize_name, gh_mat_name, gh_join_name]:
                original_source = None
                for link in gh_join.inputs[0].links:
                    if link.from_node != gh_mat:
                        original_source = link.from_socket
                        break
                        
                if original_source:
                    tree.links.new(original_source, out_node.inputs[0])
                elif len(out_node.inputs[0].links) > 0:
                    tree.links.remove(out_node.inputs[0].links[0])
                    
                tree.nodes.remove(gh_realize)
                tree.nodes.remove(gh_mat)
                tree.nodes.remove(gh_join)
                print("🟩 Resaltador Grasshopper: APAGADO.")
                return
                
        # Si llegamos aquí, queremos cambiar el resaltado a otro nodo distinto
        if active_node:
            geo_out = next((out for out in active_node.outputs if out.type in ['GEOMETRY', 'NODESOCKETGEOMETRY'] or 'Geometry' in out.name or 'Instances' in out.name), None)
            if geo_out:
                tree.links.new(geo_out, gh_realize.inputs[0])
                tree.nodes.active = active_node # Mantener foco visual
                print(f"🟩 Resaltador Grasshopper: Moviendo a '{active_node.name}'.")
            else:
                print("⚠️ El nodo seleccionado no produce geometría.")
        return

    # 2. SI LA RAMA GH NO EXISTE (ENCENDEMOS)
    if active_node:
        geo_out = next((out for out in active_node.outputs if out.type in ['GEOMETRY', 'NODESOCKETGEOMETRY'] or 'Geometry' in out.name or 'Instances' in out.name), None)
        if not geo_out:
            print("⚠️ Selecciona un nodo (Object Info, Translate, etc) antes de encender el resaltador.")
            return
            
        gh_realize = tree.nodes.new('GeometryNodeRealizeInstances')
        gh_realize.name = gh_realize_name
        gh_realize.location = (out_node.location.x - 400, out_node.location.y + 400)
        
        gh_mat = tree.nodes.new('GeometryNodeSetMaterial')
        gh_mat.name = gh_mat_name
        gh_mat.inputs['Material'].default_value = get_gh_material()
        gh_mat.location = (out_node.location.x - 200, out_node.location.y + 400)
        
        gh_join = tree.nodes.new('GeometryNodeJoinGeometry')
        gh_join.name = gh_join_name
        gh_join.location = (out_node.location.x - 50, out_node.location.y + 150)
        
        # Conectar el árbol original al Join GH
        if out_node.inputs[0].is_linked:
            original_link = out_node.inputs[0].links[0].from_socket
            tree.links.new(original_link, gh_join.inputs[0])
            
        # Conectar la rama GH
        tree.links.new(geo_out, gh_realize.inputs[0])
        tree.links.new(gh_realize.outputs[0], gh_mat.inputs[0])
        tree.links.new(gh_mat.outputs[0], gh_join.inputs[0])
        
        # Conectar al final
        tree.links.new(gh_join.outputs[0], out_node.inputs[0])
        
        tree.nodes.active = active_node
        print(f"🟩 Resaltador Grasshopper: ENCENDIDO en '{active_node.name}'.")

toggle_grasshopper_highlight()
