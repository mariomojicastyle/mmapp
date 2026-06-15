import struct
import json
import os

def parse_glb_json(glb_path):
    with open(glb_path, 'rb') as f:
        # Read header
        magic = f.read(4)
        if magic != b'glTF':
            print("Not a valid GLB file")
            return None
        version = struct.unpack('<I', f.read(4))[0]
        length = struct.unpack('<I', f.read(4))[0]
        
        # Read Chunk 0 (JSON)
        chunk_length = struct.unpack('<I', f.read(4))[0]
        chunk_type = f.read(4)
        if chunk_type != b'JSON':
            print("Chunk 0 is not JSON")
            return None
        
        json_data = f.read(chunk_length).decode('utf-8')
        return json.loads(json_data)

def analyze_bisagras(glb_path):
    data = parse_glb_json(glb_path)
    if not data:
        return
    
    nodes = data.get('nodes', [])
    meshes = data.get('meshes', [])
    
    # Map parent relationships
    child_to_parent = {}
    for parent_idx, node in enumerate(nodes):
        children = node.get('children', [])
        for child_idx in children:
            child_to_parent[child_idx] = parent_idx

    print(f"Total nodes in GLB: {len(nodes)}")
    print(f"Total meshes in GLB: {len(meshes)}")
    print("\n--- BISAGRAS NODES ---")
    
    bisagras = []
    for idx, node in enumerate(nodes):
        name = node.get('name', '')
        if 'bisagra' in name.lower():
            parent_idx = child_to_parent.get(idx, None)
            parent_name = nodes[parent_idx].get('name', 'Scene') if parent_idx is not None else 'Scene'
            mesh_idx = node.get('mesh', None)
            mesh_name = meshes[mesh_idx].get('name', '') if mesh_idx is not None else None
            
            bisagras.append({
                'node_index': idx,
                'name': name,
                'parent_index': parent_idx,
                'parent_name': parent_name,
                'mesh_index': mesh_idx,
                'mesh_name': mesh_name,
                'translation': node.get('translation', [0,0,0])
            })
            
    # Print them nicely
    for b in sorted(bisagras, key=lambda x: x['name']):
        print(f"Node [{b['node_index']}]: '{b['name']}'")
        print(f"  Parent: [{b['parent_index']}] '{b['parent_name']}'")
        print(f"  Mesh: [{b['mesh_index']}] '{b['mesh_name']}'")
        print(f"  Translation: {b['translation']}")
        print()

if __name__ == '__main__':
    glb_path = r"c:\Desarrollo\mmapp\legacy-aplicativo-armado\public\M00001\models\P00.glb"
    if os.path.exists(glb_path):
        analyze_bisagras(glb_path)
    else:
        print(f"File not found: {glb_path}")
