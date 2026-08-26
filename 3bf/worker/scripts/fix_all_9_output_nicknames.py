import xml.etree.ElementTree as ET
import base64
import requests
import json
import rhino3dm
import shutil

def fix_all_outputs():
    ghx_path = r"C:\Desarrollo\mmapp\temporal\Cajon_Experimento_Viktor.ghx"
    dst_compute = r"C:\Desarrollo\mmapp\temporal\Cajon_Experimento_Viktor_RhinoCompute.ghx"
    
    tree = ET.parse(ghx_path)
    root = tree.getroot()

    output_guids = {
        "43add241-2c4b-48c7-baed-77b32f8cf781": "RH_OUT:Lateral Izquierdo",
        "b66d9fa4-877a-48be-9c3a-ee6c9a8c3328": "RH_OUT:Lateral Derecho",
        "62e73ecd-6def-4e9a-8c43-789fc6fd2493": "RH_OUT:Cubierta Superior",
        "ba94570a-e8c0-4319-9979-3aca7e98d68c": "RH_OUT:Cubierta Inferior",
        "f0a298b5-a588-4335-8c67-6c23aa64004a": "RH_OUT:Tapa Luz",
        "24d5a658-4462-4439-9783-ca5c1fb406a0": "RH_OUT:Frente de Cajon",
        "c1557d12-70a6-45ba-8873-74d8e3b35e5f": "RH_OUT:Lateral Izq Cajon",
        "afcffc89-1579-473a-8dfb-1ac69c001519": "RH_OUT:Lateral Der Cajon",
        "439b2432-e460-4be1-9e07-bf0ef388a989": "RH_OUT:Posterior de Cajon"
    }

    # 1. Asignar el NickName RH_OUT: directamente al objeto de geometría
    for item in root.iter("chunk"):
        guid_elem = item.find("./items/item[@name='InstanceGuid']")
        if guid_elem is not None and guid_elem.text in output_guids:
            target_rh_out = output_guids[guid_elem.text]
            # Buscar el NickName dentro de los ítems del objeto
            for sub in item.iter("item"):
                if sub.attrib.get("name") == "NickName":
                    sub.text = target_rh_out
                    print(f"  * Asignado {target_rh_out} al componente {guid_elem.text}")

    # 2. Asignar el NickName RH_OUT: al grupo que contiene esa pieza
    for item in root.iter("chunk"):
        name_elem = item.find("./items/item[@name='Name']")
        if name_elem is not None and name_elem.text == "Group":
            container = item.find("./chunks/chunk[@name='Container']")
            if container is not None:
                items_block = container.find("./items")
                if items_block is not None:
                    nick_item = items_block.find("./item[@name='NickName']")
                    contained = [it.text.strip() for it in items_block.findall("./item[@name='ID']") if it.text]
                    for og_guid, og_name in output_guids.items():
                        if og_guid in contained:
                            if nick_item is not None:
                                nick_item.text = og_name
                                print(f"  * Asignado {og_name} al grupo contenedor del componente {og_guid}")

    tree.write(ghx_path, encoding="utf-8", xml_declaration=False)
    shutil.copyfile(ghx_path, dst_compute)

    with open(ghx_path, "r", encoding="utf-8") as f:
        xml_str = f.read()
    b64_algo = base64.b64encode(xml_str.encode("utf-8")).decode("utf-8")

    # 3. Probar /io
    res_io = requests.post("http://localhost:5000/io", json={"algo": b64_algo})
    print("\nSTATUS /io con las 9 piezas etiquetadas:", res_io.status_code)
    io_data = res_io.json()
    
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
                except Exception:
                    pass

    print(f"\n[OK TOTAL] TOTAL MALLAS EXTRAÍDAS DE RHINO 8: {len(real_meshes)}")
    for m in real_meshes:
        print(f"  • Pieza: '{m['name']}' (Rama: {m['path']}) | Size X: {m['size'][0]*1000:.1f}mm | Pos Y: {m['position'][1]:.3f}m")

if __name__ == "__main__":
    fix_all_outputs()
