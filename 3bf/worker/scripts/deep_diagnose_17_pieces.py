import xml.etree.ElementTree as ET
import base64
import requests
import json
import rhino3dm

def diagnose_17_pieces():
    ghx_path = r"C:\Desarrollo\mmapp\temporal\Cajon_Experimento_Viktor.ghx"
    print(f"=== DIAGNÓSTICO PROFUNDO DE LAS 17 PIEZAS EN {ghx_path} ===")
    
    tree = ET.parse(ghx_path)
    root = tree.getroot()

    # 1. Buscar todos los componentes de tipo Geometría/Brep/Box/Transform en la definición XML
    geom_components = []
    for item in root.iter("chunk"):
        name_elem = item.find("./items/item[@name='Name']")
        nick_elem = item.find("./items/item[@name='NickName']")
        guid_elem = item.find("./items/item[@name='InstanceGuid']")
        
        comp_name = name_elem.text.strip() if (name_elem is not None and name_elem.text) else ""
        comp_nick = nick_elem.text.strip() if (nick_elem is not None and nick_elem.text) else ""
        comp_guid = guid_elem.text.strip() if (guid_elem is not None and guid_elem.text) else ""
        
        if comp_name in ["Geometry", "BRep", "Mesh", "Box", "Surface", "Transform", "Brep"]:
            geom_components.append({
                "name": comp_name,
                "nick": comp_nick,
                "guid": comp_guid
            })

    print(f"\n--- COMPONENTES DE GEOMETRÍA ENCONTRADOS EN EL XML ({len(geom_components)}) ---")
    for gc in geom_components:
        print(f"  • Tipo: '{gc['name']}' | NickName: '{gc['nick']}' | GUID: {gc['guid']}")

    # 2. Taggear los NickNames de TODOS los componentes de geometría con RH_OUT:
    count_tagged = 0
    for item in root.iter("chunk"):
        guid_elem = item.find("./items/item[@name='InstanceGuid']")
        nick_elem = item.find("./items/item[@name='NickName']")
        name_elem = item.find("./items/item[@name='Name']")
        
        comp_name = name_elem.text.strip() if (name_elem is not None and name_elem.text) else ""
        
        if comp_name in ["Geometry", "BRep", "Mesh", "Box", "Surface", "Transform", "Brep"]:
            if nick_elem is not None:
                current_nick = nick_elem.text.strip() if nick_elem.text else f"Pieza_{count_tagged+1}"
                if not current_nick.startswith("RH_OUT:") and not current_nick.startswith("RH_IN:"):
                    nick_elem.text = f"RH_OUT:{current_nick}"
                    count_tagged += 1

    # También taggear los grupos contenedores
    for item in root.iter("chunk"):
        name_elem = item.find("./items/item[@name='Name']")
        if name_elem is not None and name_elem.text == "Group":
            container = item.find("./chunks/chunk[@name='Container']")
            if container is not None:
                items_block = container.find("./items")
                if items_block is not None:
                    nick_item = items_block.find("./item[@name='NickName']")
                    if nick_item is not None and nick_item.text:
                        txt = nick_item.text.strip()
                        if txt and txt not in ["None", "A group of Grasshopper objects"] and not txt.startswith("RH_OUT:") and not txt.startswith("RH_IN:"):
                            nick_item.text = f"RH_OUT:{txt}"

    # Guardar en archivo de diagnóstico
    dst_diag = r"C:\Desarrollo\mmapp\temporal\Cajon_Experimento_Viktor_AllTagged.ghx"
    tree.write(dst_diag, encoding="utf-8", xml_declaration=False)
    
    with open(dst_diag, "r", encoding="utf-8") as f:
        xml_str = f.read()
    b64_algo = base64.b64encode(xml_str.encode("utf-8")).decode("utf-8")

    # 3. Probar /io con RhinoCompute 8
    res_io = requests.post("http://localhost:5000/io", json={"algo": b64_algo})
    print("\nSTATUS /io con todas las piezas etiquetadas RH_OUT:", res_io.status_code)
    io_data = res_io.json()
    
    print(f"\n--- ENTRADAS REGISTRADAS POR RHINOCOMPUTE ({len(io_data.get('Inputs', []))}) ---")
    for inp in io_data.get("Inputs", []):
        print(f"  • Input: '{inp.get('Name')}' ({inp.get('ParamType')})")
        
    outputs = io_data.get('Outputs', [])
    print(f"\n--- SALIDAS REGISTRADAS POR RHINOCOMPUTE ({len(outputs)}) ---")
    for out in outputs:
        print(f"  • Output: '{out.get('Name')}' ({out.get('ParamType')})")

    # 4. Probar /grasshopper
    payload_rc = {
        "algo": b64_algo,
        "pointer": None,
        "values": [
            {"ParamName": "RH_IN:Ancho", "InnerTree": {"{0}": [{"type": "System.Double", "data": "1200.0"}]}}
        ]
    }
    res_gh = requests.post("http://localhost:5000/grasshopper", json=payload_rc)
    gh_data = res_gh.json()
    
    real_meshes = []
    for val in gh_data.get("values", []):
        p_name = val.get("ParamName", "Pieza GH")
        inner = val.get("InnerTree", {})
        for path_key, items in inner.items():
            for item in items:
                raw_data = item.get("data")
                if not raw_data:
                    continue
                try:
                    obj = json.loads(raw_data) if isinstance(raw_data, str) else raw_data
                    if isinstance(obj, dict):
                        if "X" in obj and "Y" in obj and "Z" in obj:
                            x_size = abs(obj["X"]["T1"] - obj["X"]["T0"]) / 1000.0
                            y_size = abs(obj["Y"]["T1"] - obj["Y"]["T0"]) / 1000.0
                            z_size = abs(obj["Z"]["T1"] - obj["Z"]["T0"]) / 1000.0
                            center = obj.get("Center", {"X": 0, "Y": 0, "Z": 0})
                            real_meshes.append({
                                "name": p_name,
                                "path": path_key,
                                "size": [x_size, z_size, y_size],
                                "position": [center["X"]/1000.0, center["Z"]/1000.0, center["Y"]/1000.0]
                            })
                        elif "archive3dm" in obj or "opennurbs" in obj:
                            decoded = rhino3dm.CommonObject.Decode(obj)
                            if decoded:
                                bbox = decoded.GetBoundingBox()
                                x_size = abs(bbox.Max.X - bbox.Min.X) / 1000.0
                                y_size = abs(bbox.Max.Y - bbox.Min.Y) / 1000.0
                                z_size = abs(bbox.Max.Z - bbox.Min.Z) / 1000.0
                                center_x = (bbox.Min.X + bbox.Max.X) / 2.0 / 1000.0
                                center_y = (bbox.Min.Y + bbox.Max.Y) / 2.0 / 1000.0
                                center_z = (bbox.Min.Z + bbox.Max.Z) / 2.0 / 1000.0
                                real_meshes.append({
                                    "name": p_name,
                                    "path": path_key,
                                    "size": [x_size, z_size, y_size],
                                    "position": [center_x, center_z, center_y]
                                })
                except Exception as e:
                    pass

    print(f"\n[OK TOTAL] TOTAL MALLAS EXTRAÍDAS DE RHINO 8: {len(real_meshes)}")
    for m in real_meshes:
        print(f"  • Pieza: '{m['name']}' (Rama: {m['path']}) | Size X: {m['size'][0]*1000:.1f}mm | Pos Y: {m['position'][1]:.3f}m")

if __name__ == "__main__":
    diagnose_17_pieces()
