import base64
import requests
import json
import rhino3dm

def test_0_1_indexes():
    ghx_path = r"C:\Desarrollo\mmapp\temporal\Cajon_Experimento_Viktor_3cajones.ghx"
    with open(ghx_path, "r", encoding="utf-8") as f:
        xml_str = f.read()
    b64_algo = base64.b64encode(xml_str.encode("utf-8")).decode("utf-8")

    print("=== PROBANDO VALORES 351 Y 400 EN RH_IN:Profundidad cajon ===")

    for val in ["351", "400", 351, 400, 0, 1]:
        payload_rc = {
            "algo": b64_algo,
            "pointer": None,
            "values": [
                {"ParamName": "RH_IN:Ancho", "InnerTree": {"{0}": [{"type": "System.Double", "data": "1200.0"}]}},
                {"ParamName": "RH_IN:Alto", "InnerTree": {"{0}": [{"type": "System.Double", "data": "900.0"}]}},
                {"ParamName": "RH_IN:Profundidad", "InnerTree": {"{0}": [{"type": "System.Double", "data": "500.0"}]}},
                {"ParamName": "RH_IN:Profundidad cajon", "InnerTree": {"{0}": [{"type": "System.String", "data": str(val)}]}},
                {"ParamName": "RH_IN:Profundidad cajon", "InnerTree": {"{0}": [{"type": "System.Int32", "data": str(val)}]}}
            ]
        }
        res_gh = requests.post("http://localhost:5000/grasshopper", json=payload_rc)
        data = res_gh.json()
        
        post_y = None
        for val_node in data.get("values", []):
            if val_node.get("ParamName") == "RH_OUT:Posterior de Cajon":
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
                                    post_y = round(bbox.Max.Y, 1)
                        except Exception:
                            pass

        print(f"Probando envio = {val} ({type(val).__name__}) -> Posición Y del Posterior: {post_y} mm")

if __name__ == "__main__":
    test_0_1_indexes()
