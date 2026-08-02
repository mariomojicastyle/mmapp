import base64
import requests
import json

def solve_full_model():
    ghx_file = r"C:\Desarrollo\mmapp\temporal\Cajon_Experimento_Viktor_RhinoCompute.ghx"
    with open(ghx_file, "r", encoding="utf-8") as f:
        xml_str = f.read()
    b64_algo = base64.b64encode(xml_str.encode("utf-8")).decode("utf-8")

    payload_rc = {
        "algo": b64_algo,
        "pointer": None,
        "values": [
            {"ParamName": "RH_IN:Ancho", "InnerTree": {"{0}": [{"type": "System.Double", "data": "1200.0"}]}},
            {"ParamName": "RH_IN:Alto", "InnerTree": {"{0}": [{"type": "System.Double", "data": "900.0"}]}},
            {"ParamName": "RH_IN:Profundidad", "InnerTree": {"{0}": [{"type": "System.Double", "data": "500.0"}]}},
            {"ParamName": "RH_IN:Abrir Cajones", "InnerTree": {"{0}": [{"type": "System.Double", "data": "100.0"}]}}
        ]
    }

    res = requests.post("http://localhost:5000/grasshopper", json=payload_rc)
    print("STATUS /grasshopper:", res.status_code)
    rc_data = res.json()
    
    real_meshes = []
    for val in rc_data.get("values", []):
        p_name = val.get("ParamName", "Geometría GH")
        inner = val.get("InnerTree", {})
        for path_key, items in inner.items():
            for item in items:
                raw_data = item.get("data")
                if not raw_data:
                    continue
                try:
                    obj = json.loads(raw_data) if isinstance(raw_data, str) else raw_data
                    if isinstance(obj, dict) and "X" in obj and "Y" in obj and "Z" in obj:
                        x_size = abs(obj["X"]["T1"] - obj["X"]["T0"]) / 1000.0
                        y_size = abs(obj["Y"]["T1"] - obj["Y"]["T0"]) / 1000.0
                        z_size = abs(obj["Z"]["T1"] - obj["Z"]["T0"]) / 1000.0
                        center = obj.get("Center", {"X": 0, "Y": 0, "Z": 0})
                        
                        real_meshes.append({
                            "name": p_name,
                            "size": [x_size, z_size, y_size],
                            "position": [
                                center["X"] / 1000.0,
                                center["Z"] / 1000.0,
                                center["Y"] / 1000.0
                            ]
                        })
                except Exception as e:
                    pass

    print(f"\n[OK] TOTAL MALLAS EXTRAIDAS DE GRASSHOPPER: {len(real_meshes)}")
    for m in real_meshes:
        print(f"  * Pieza: '{m['name']}' | Tamaños (m): {m['size']} | Posicion: {m['position']}")

if __name__ == "__main__":
    solve_full_model()
