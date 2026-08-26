import base64
import requests
import json
import rhino3dm

def test_slider_effect(prof_val):
    ghx_file = r"C:\Desarrollo\mmapp\temporal\Cajon_Experimento_Viktor_RhinoCompute.ghx"
    with open(ghx_file, "r", encoding="utf-8") as f:
        xml_str = f.read()
    b64_algo = base64.b64encode(xml_str.encode("utf-8")).decode("utf-8")

    payload_rc = {
        "algo": b64_algo,
        "pointer": None,
        "values": [
            {"ParamName": "RH_IN:Profundidad", "InnerTree": {"{0}": [{"type": "System.Double", "data": str(float(prof_val))}]}},
            {"ParamName": "Profundidad", "InnerTree": {"{0}": [{"type": "System.Double", "data": str(float(prof_val))}]}}
        ]
    }

    res = requests.post("http://localhost:5000/grasshopper", json=payload_rc)
    rc_data = res.json()
    
    extracted_meshes = []
    for val in rc_data.get("values", []):
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
                            y_size = abs(obj["Y"]["T1"] - obj["Y"]["T0"])
                            extracted_meshes.append((p_name, y_size))
                        elif "archive3dm" in obj or "opennurbs" in obj:
                            decoded_geom = rhino3dm.CommonObject.Decode(obj)
                            if decoded_geom:
                                bbox = decoded_geom.GetBoundingBox()
                                y_size = abs(bbox.Max.Y - bbox.Min.Y)
                                extracted_meshes.append((p_name, y_size))
                except Exception:
                    pass

    print(f"\n--- Prueba Slider Profundidad = {prof_val} mm ---")
    for name, depth_mm in extracted_meshes:
        print(f"  • {name} -> Profundidad calculada: {depth_mm} mm")

if __name__ == "__main__":
    test_slider_effect(350.0)
    test_slider_effect(650.0)
