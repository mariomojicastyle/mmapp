import base64
import requests
import json
import rhino3dm

def test_int32_400():
    ghx_path = r"C:\Desarrollo\mmapp\temporal\Cajon_Experimento_Viktor_3cajones.ghx"
    with open(ghx_path, "r", encoding="utf-8") as f:
        xml_str = f.read()
    b64_algo = base64.b64encode(xml_str.encode("utf-8")).decode("utf-8")

    print("=== PROBANDO SYSTEM.INT32 '400' Y SYSTEM.STRING '400' EN RHINOCOMPUTE 8 ===")

    payload_rc = {
        "algo": b64_algo,
        "pointer": None,
        "values": [
            {"ParamName": "RH_IN:Ancho", "InnerTree": {"{0}": [{"type": "System.Double", "data": "1200.0"}]}},
            {"ParamName": "RH_IN:Alto", "InnerTree": {"{0}": [{"type": "System.Double", "data": "900.0"}]}},
            {"ParamName": "RH_IN:Profundidad", "InnerTree": {"{0}": [{"type": "System.Double", "data": "500.0"}]}},
            {"ParamName": "RH_IN:Profundidad cajon", "InnerTree": {"{0}": [{"type": "System.Int32", "data": "400"}]}},
            {"ParamName": "RH_IN:Profundidad cajon", "InnerTree": {"{0}": [{"type": "System.String", "data": "400"}]}}
        ]
    }
    res_gh = requests.post("http://localhost:5000/grasshopper", json=payload_rc)
    data = res_gh.json()
    
    for val_node in data.get("values", []):
        p_name = val_node.get("ParamName", "")
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
                            center_y = (bbox.Min.Y + bbox.Max.Y) / 2.0
                            size_y = abs(bbox.Max.Y - bbox.Min.Y)
                            size_x = abs(bbox.Max.X - bbox.Min.X)
                            size_z = abs(bbox.Max.Z - bbox.Min.Z)
                            print(f"  • {p_name} ({path_key}) -> BBox Y: {round(bbox.Min.Y, 1)} a {round(bbox.Max.Y, 1)} (Tam Y: {round(size_y, 1)} mm)")
                except Exception as e:
                    pass

if __name__ == "__main__":
    test_int32_400()
