import base64
import requests
import json
import rhino3dm

def test_index():
    ghx_path = r"C:\Desarrollo\mmapp\temporal\Cajon_Experimento_Viktor_3cajones.ghx"
    with open(ghx_path, "r", encoding="utf-8") as f:
        xml_str = f.read()
    b64_algo = base64.b64encode(xml_str.encode("utf-8")).decode("utf-8")

    print("=== PROBANDO ÍNDICES (0 Y 1) PARA EL VALUE LIST PROFUNDIDAD CAJON ===")

    for idx_val in [0, 1, "0", "1"]:
        sys_type = "System.Int32" if isinstance(idx_val, int) else "System.String"
        payload_rc = {
            "algo": b64_algo,
            "pointer": None,
            "values": [
                {"ParamName": "RH_IN:Ancho", "InnerTree": {"{0}": [{"type": "System.Double", "data": "1200.0"}]}},
                {"ParamName": "RH_IN:Alto", "InnerTree": {"{0}": [{"type": "System.Double", "data": "900.0"}]}},
                {"ParamName": "RH_IN:Profundidad", "InnerTree": {"{0}": [{"type": "System.Double", "data": "500.0"}]}},
                {"ParamName": "RH_IN:Profundidad cajon", "InnerTree": {"{0}": [{"type": f"{sys_type}", "data": str(idx_val)}]}}
            ]
        }
        res_gh = requests.post("http://localhost:5000/grasshopper", json=payload_rc)
        data = res_gh.json()
        
        laterales = []
        for val_node in data.get("values", []):
            p_name = val_node.get("ParamName", "")
            if "Lateral" in p_name or "Cajon" in p_name:
                inner = val_node.get("InnerTree", {})
                for path_key, items in inner.items():
                    for item in items:
                        raw_data = item.get("data")
                        if not raw_data:
                            continue
                        try:
                            obj = json.loads(raw_data) if isinstance(raw_data, str) else raw_data
                            if isinstance(obj, dict) and ("archive3dm" in obj or "opennurbs" in obj):
                                decoded = rhino3dm.CommonObject.Decode(obj)
                                if decoded:
                                    bbox = decoded.GetBoundingBox()
                                    length_mm = abs(bbox.Max.Y - bbox.Min.Y)
                                    laterales.append({"name": p_name, "length_mm": round(length_mm, 1)})
                        except Exception:
                            pass

        print(f"\n[VALOR ENVIADO ({sys_type}): '{idx_val}'] Total Mallas: {len(data.get('values', []))}")
        for l in laterales[:3]:
            print(f"  • {l['name']} -> Largo (Y): {l['length_mm']} mm")

if __name__ == "__main__":
    test_index()
