import xml.etree.ElementTree as ET
import base64
import requests
import json

def test_keys():
    ghx_path = r"C:\Desarrollo\mmapp\temporal\Cajon_Experimento_Viktor.ghx"
    with open(ghx_path, "r", encoding="utf-8") as f:
        xml_str = f.read()

    b64_algo = base64.b64encode(xml_str.encode("utf-8")).decode("utf-8")

    test_inputs = [
        ("Int32", 0), ("Int32", 1), ("Int32", 2),
        ("String", "0"), ("String", "1"), ("String", "2"),
        ("String", "1"), ("String", "2"), ("String", "3"),
        ("String", "1 Cajon"), ("String", "2 Cajones"), ("String", "3 Cajones")
    ]

    for t_type, t_val in test_inputs:
        payload_rc = {
            "algo": b64_algo,
            "pointer": None,
            "values": [
                {"ParamName": "RH_IN:Ancho", "InnerTree": {"{0}": [{"type": "System.Double", "data": "1200.0"}]}},
                {"ParamName": "RH_IN:Alto", "InnerTree": {"{0}": [{"type": "System.Double", "data": "900.0"}]}},
                {"ParamName": "RH_IN:Profundidad", "InnerTree": {"{0}": [{"type": "System.Double", "data": "500.0"}]}},
                {"ParamName": "RH_IN:Cantidada de Cajones", "InnerTree": {"{0}": [{"type": f"System.{t_type}", "data": str(t_val)}]}}
            ]
        }
        res_gh = requests.post("http://localhost:5000/grasshopper", json=payload_rc)
        data = res_gh.json()
        
        real_meshes = []
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
                        if isinstance(obj, dict) and ("X" in obj or "archive3dm" in obj):
                            real_meshes.append({"name": p_name, "path": path_key})
                    except Exception:
                        pass

        frentes = [m for m in real_meshes if "Frente" in m["name"]]
        print(f"Probando {t_type}='{t_val}' -> Total Mallas: {len(real_meshes)} | Frentes: {len(frentes)}")

if __name__ == "__main__":
    test_keys()
