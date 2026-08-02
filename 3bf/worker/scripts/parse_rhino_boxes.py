import base64
import requests
import json

def parse_rhino_boxes_response(ghx_path, params_dict):
    print("=== Extrayendo Cajas y Mallas Reales de Rhino 8 RhinoCompute ===")
    with open(ghx_path, "r", encoding="utf-8") as f:
        xml_str = f.read()

    b64_algo = base64.b64encode(xml_str.encode("utf-8")).decode("utf-8")

    values = []
    for k, v in params_dict.items():
        values.append({
            "ParamName": k,
            "InnerTree": {
                "{0}": [{"type": "System.Double", "data": str(float(v))}]
            }
        })

    payload = {"algo": b64_algo, "pointer": None, "values": values}

    res = requests.post("http://localhost:5000/grasshopper", json=payload)
    data = res.json()

    extracted_meshes = []

    for val in data.get("values", []):
        param_name = val.get("ParamName", "Malla_GH")
        inner = val.get("InnerTree", {})
        for path, items in inner.items():
            for item in items:
                item_type = item.get("type", "")
                raw_data = item.get("data", "")
                if not raw_data:
                    continue

                obj = None
                if isinstance(raw_data, dict):
                    obj = raw_data
                elif isinstance(raw_data, str):
                    try:
                        obj = json.loads(raw_data)
                    except Exception:
                        pass

                if isinstance(obj, dict) and "XInterval" in obj:
                    x_size = abs(obj["XInterval"]["T1"] - obj["XInterval"]["T0"]) / 1000.0
                    y_size = abs(obj["YInterval"]["T1"] - obj["YInterval"]["T0"]) / 1000.0
                    z_size = abs(obj["ZInterval"]["T1"] - obj["ZInterval"]["T0"]) / 1000.0
                    
                    origin = obj.get("Plane", {}).get("Origin", {"X": 0, "Y": 0, "Z": 0})
                    
                    extracted_meshes.append({
                        "name": param_name,
                        "type": "box",
                        "size": [x_size, z_size, y_size],
                        "position": [
                            (origin["X"] / 1000.0) + (x_size / 2.0),
                            (origin["Z"] / 1000.0) + (z_size / 2.0),
                            (origin["Y"] / 1000.0) + (y_size / 2.0)
                        ]
                    })

    print(f"[OK] Se extrajeron {len(extracted_meshes)} mallas verdaderas del calculo de Grasshopper:")
    for m in extracted_meshes:
        print(f"  * Malla: '{m['name']}' | Tamanio (m): {m['size']} | Posicion: {m['position']}")

    return extracted_meshes

if __name__ == "__main__":
    src = r"C:\Desarrollo\mmapp\temporal\Cajon_Experimento_Viktor_RhinoCompute.ghx"
    params = {
        "RH_IN:Ancho": 850,
        "RH_IN:Alto": 1050,
        "RH_IN:Profundidad": 480
    }
    parse_rhino_boxes_response(src, params)
