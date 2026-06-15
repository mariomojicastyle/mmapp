import struct
import json
import os

def parse_glb_json(glb_path):
    with open(glb_path, 'rb') as f:
        magic = f.read(4)
        if magic != b'glTF':
            print("Not a valid GLB file")
            return None
        version = struct.unpack('<I', f.read(4))[0]
        length = struct.unpack('<I', f.read(4))[0]
        chunk_length = struct.unpack('<I', f.read(4))[0]
        chunk_type = f.read(4)
        if chunk_type != b'JSON':
            print("Chunk 0 is not JSON")
            return None
        json_data = f.read(chunk_length).decode('utf-8')
        return json.loads(json_data)

def analyze_bisagras_geometry(glb_path):
    data = parse_glb_json(glb_path)
    if not data:
        return
    
    nodes = data.get('nodes', [])
    meshes = data.get('meshes', [])
    accessors = data.get('accessors', [])
    
    # Map parent relationships
    child_to_parent = {}
    for parent_idx, node in enumerate(nodes):
        children = node.get('children', [])
        for child_idx in children:
            child_to_parent[child_idx] = parent_idx
            
    print("--- DETALLES GEOMÉTRICOS DE BISAGRAS ---")
    
    for idx, node in enumerate(nodes):
        name = node.get('name', '')
        if 'bisagra' in name.lower():
            mesh_idx = node.get('mesh', None)
            if mesh_idx is None:
                continue
            
            mesh = meshes[mesh_idx]
            primitives = mesh.get('primitives', [])
            if not primitives:
                continue
            
            prim = primitives[0]
            attributes = prim.get('attributes', {})
            pos_accessor_idx = attributes.get('POSITION', None)
            
            if pos_accessor_idx is None:
                continue
                
            accessor = accessors[pos_accessor_idx]
            min_val = accessor.get('min', [0, 0, 0])
            max_val = accessor.get('max', [0, 0, 0])
            count = accessor.get('count', 0)
            
            # Dimensions in local space
            size = [max_val[i] - min_val[i] for i in range(3)]
            sorted_size = sorted(size)
            
            parent_idx = child_to_parent.get(idx, None)
            parent_name = nodes[parent_idx].get('name', 'Scene') if parent_idx is not None else 'Scene'
            
            print(f"Node [{idx}]: '{name}'")
            print(f"  Parent: [{parent_idx}] '{parent_name}'")
            print(f"  Mesh: [{mesh_idx}] '{mesh.get('name', '')}'")
            print(f"  Vertices count: {count}")
            print(f"  Local BBox Size: {size}")
            print(f"  Sorted Size (L, W, T): {[round(s, 5) for s in sorted_size]}")
            print()

if __name__ == '__main__':
    glb_path = r"c:\Desarrollo\mmapp\legacy-aplicativo-armado\public\M00001\models\P00.glb"
    analyze_bisagras_geometry(glb_path)
