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

def analyze_puntillas(glb_path):
    data = parse_glb_json(glb_path)
    if not data:
        return
    
    nodes = data.get('nodes', [])
    
    # Map parent relationships
    child_to_parent = {}
    for parent_idx, node in enumerate(nodes):
        children = node.get('children', [])
        for child_idx in children:
            child_to_parent[child_idx] = parent_idx
            
    print("--- ANÁLISIS DE PUNTILLAS ---")
    
    puntillas = []
    for idx, node in enumerate(nodes):
        name = node.get('name', '')
        if 'puntilla' in name.lower():
            parent_idx = child_to_parent.get(idx, None)
            parent_name = nodes[parent_idx].get('name', 'Scene') if parent_idx is not None else 'Scene'
            translation = node.get('translation', [0, 0, 0])
            
            puntillas.append({
                'node_idx': idx,
                'name': name,
                'parent_name': parent_name,
                'translation': translation
            })
            
    print(f"Total puntillas nodes found in GLB: {len(puntillas)}")
    
    # Check for duplicate positions (overlapping objects)
    pos_map = {}
    duplicates = []
    
    for p in puntillas:
        # Convert translation to a tuple with 4 decimal places to avoid floating point issues
        t_key = tuple(round(coord, 4) for coord in p['translation'])
        if t_key in pos_map:
            pos_map[t_key].append(p)
            duplicates.append(t_key)
        else:
            pos_map[t_key] = [p]
            
    # Print overlaps
    unique_duplicates = set(duplicates)
    if unique_duplicates:
        print(f"\nSe encontraron {len(unique_duplicates)} posiciones con objetos duplicados superpuestos:")
        for t in unique_duplicates:
            objs = pos_map[t]
            print(f"Posición {t}:")
            for o in objs:
                print(f"  - Node [{o['node_idx']}]: '{o['name']}' | Padre: '{o['parent_name']}'")
    else:
        print("\nNo se encontraron objetos duplicados por posición tridimensional exacta.")
        
    print("\nLista completa de puntillas:")
    for p in sorted(puntillas, key=lambda x: x['name']):
        print(f"Node [{p['node_idx']}]: '{p['name']}' | Parent: '{p['parent_name']}' | Pos: {p['translation']}")

if __name__ == '__main__':
    glb_path = r"c:\Desarrollo\mmapp\legacy-aplicativo-armado\public\M00001\models\P00.glb"
    analyze_puntillas(glb_path)
