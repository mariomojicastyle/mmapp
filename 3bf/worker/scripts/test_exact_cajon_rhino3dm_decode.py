import base64
import requests
import json
import rhino3dm

def test_decode_boxes():
    ghx_path = r"C:\Desarrollo\mmapp\temporal\Cajon_Experimento_Viktor.ghx"
    with open(ghx_path, "r", encoding="utf-8") as f:
        xml_str = f.read()
    b64_algo = base64.b64encode(xml_str.encode("utf-8")).decode("utf-8")

    print("=== PROBANDO RHINOCOMPUTE CON DECODE DE RHINO3DM ===")

    for val in [1, 2, 3, "1", "2", "3"]:
        payload_rc = {
            "algo": b64_algo,
            "pointer": None,
            "values": [
                {"ParamName": "RH_IN:Ancho", "InnerTree": {"{0}": [{"type": "System.Double", "data": "1200.0"}]}},
                {"ParamName": "RH_IN:Alto", "InnerTree": {"{0}": [{"type": "System.Double", "data": "900.0"}]}},
                {"ParamName": "RH_IN:Profundidad", "InnerTree": {"{0}": [{"type": "System.Double", "data": "500.0"}]}},
                {"ParamName": "RH_IN:Cantidada de Cajones", "InnerTree": {"{0}": [{"type": "System.Int32", "data": str(val)}]}}
            ]
        }
        res_gh = requests.post("http://localhost:5000/grasshopper", json=payload_rc)
        data = res_gh.json()
        
        frentes = []
        for val_node in data.get("values", []):
            p_name = val_node.get("ParamName", "")
            if "Frente" in p_name:
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
                                    height_mm = abs(bbox.Max.Z - bbox.Min.Z)
                                    frentes.append({"name": p_name, "path": path_key, "height_mm": round(height_mm, 1)})
                        except Exception as e:
                            pass

        print(f"\n[VALOR ENVIADO: {val}] Total Frentes Extraídos: {len(frentes)}")
        for f in frentes:
            print(f"  • {f['name']} ({f['path']}) -> Altura: {f['height_mm']} mm")

if __name__ == "__main__":
    test_decode_boxes()
