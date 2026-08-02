import base64
import requests
import json
import rhino3dm

def inspect_user_file():
    ghx_path = r"C:\Desarrollo\mmapp\temporal\Cajon_Experimento_Viktor.ghx"
    print(f"=== Leyendo archivo guardado por el usuario: {ghx_path} ===")
    
    with open(ghx_path, "r", encoding="utf-8") as f:
        xml_str = f.read()
        
    # Limpiar encabezado XML con comillas simples si existe
    if xml_str.startswith("<?xml"):
        first_gt = xml_str.find(">")
        xml_str = xml_str[first_gt+1:].strip()
        xml_str = '<?xml version="1.0" encoding="utf-8"?>\n' + xml_str
        
    b64_algo = base64.b64encode(xml_str.encode("utf-8")).decode("utf-8")
    
    # 1. Probar /io
    res_io = requests.post("http://localhost:5000/io", json={"algo": b64_algo})
    print("STATUS /io:", res_io.status_code)
    io_data = res_io.json()
    
    print(f"\n--- ENTRADAS REGISTRADAS POR RHINOCOMPUTE ({len(io_data.get('Inputs', []))}) ---")
    for inp in io_data.get("Inputs", []):
        print(f"  • Input: '{inp.get('Name')}' | Type: {inp.get('ParamType')}")
        
    print(f"\n--- SALIDAS REGISTRADAS POR RHINOCOMPUTE ({len(io_data.get('Outputs', []))}) ---")
    for out in io_data.get("Outputs", []):
        print(f"  • Output: '{out.get('Name')}' | Type: {out.get('ParamType')}")

    # 2. Probar /grasshopper
    payload_rc = {
        "algo": b64_algo,
        "pointer": None,
        "values": []
    }
    
    res_gh = requests.post("http://localhost:5000/grasshopper", json=payload_rc)
    print("\nSTATUS /grasshopper:", res_gh.status_code)
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
                                    "size": [x_size, z_size, y_size],
                                    "position": [center_x, center_z, center_y]
                                })
                except Exception as e:
                    print("  Err decode:", e)

    print(f"\n[OK TOTAL] TOTAL MALLAS REALES EXTRAÍDAS DEL ARCHIVO DEL USUARIO: {len(real_meshes)}")
    for m in real_meshes:
        print(f"  • Pieza: '{m['name']}' | Posición: {m['position']} | Tamaño: {m['size']}")

if __name__ == "__main__":
    inspect_user_file()
