import xml.etree.ElementTree as ET
import base64
import requests
import json
import rhino3dm

def inspect_dynamic():
    ghx_path = r"C:\Desarrollo\mmapp\temporal\Cajon_Experimento_Viktor_RhinoCompute.ghx"
    print(f"=== Evaluando RhinoCompute con Ancho=950, Alto=400, Profundidad=500 ===")
    
    with open(ghx_path, "r", encoding="utf-8") as f:
        xml_str = f.read()
        
    b64_algo = base64.b64encode(xml_str.encode("utf-8")).decode("utf-8")
    
    payload_rc = {
        "algo": b64_algo,
        "pointer": None,
        "values": [
            {"ParamName": "RH_IN:Ancho", "InnerTree": {"{0}": [{"type": "System.Double", "data": "950.0"}]}},
            {"ParamName": "RH_IN:Alto", "InnerTree": {"{0}": [{"type": "System.Double", "data": "400.0"}]}},
            {"ParamName": "RH_IN:Profundidad", "InnerTree": {"{0}": [{"type": "System.Double", "data": "500.0"}]}}
        ]
    }
    
    res_gh = requests.post("http://localhost:5000/grasshopper", json=payload_rc)
    print("STATUS /grasshopper:", res_gh.status_code)
    data = res_gh.json()
    
    all_raw_pieces = []
    for val in data.get("values", []):
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
                            all_raw_pieces.append({
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
                                all_raw_pieces.append({
                                    "name": p_name,
                                    "path": path_key,
                                    "size": [x_size, z_size, y_size],
                                    "position": [center_x, center_z, center_y]
                                })
                except Exception as e:
                    pass

    print(f"\n[OK] TOTAL PIEZAS DEVUELTAS POR RHINOCOMPUTE: {len(all_raw_pieces)}")
    for p in all_raw_pieces:
        print(f"  • Pieza: '{p['name']}' (Branch: {p['path']}) | Size: {[round(s,3) for s in p['size']]} | Pos Y (Alto): {p['position'][1]:.3f}m")

if __name__ == "__main__":
    inspect_dynamic()
