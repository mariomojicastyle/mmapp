import base64
import requests
import json
import rhino3dm

def inspect_drawer_fronts_and_backs():
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
            {"ParamName": "RH_IN:Cantidada de Cajones", "InnerTree": {"{0}": [{"type": "System.Double", "data": "3.0"}]}}
        ]
    }

    res = requests.post("http://localhost:5000/grasshopper", json=payload_rc)
    rc_data = res.json()
    
    print("=== INSPECCIÓN DE RAMAS (BRANCHES) DE FRENTE DE CAJÓN Y POSTERIOR ===")
    for val in rc_data.get("values", []):
        p_name = val.get("ParamName")
        if "Frente" in p_name or "Posterior" in p_name:
            inner = val.get("InnerTree", {})
            print(f"\nPARÁMETRO: '{p_name}' (Total ramas: {len(inner)})")
            for path_key, items in inner.items():
                print(f"  Branch '{path_key}': {len(items)} ítems")
                for idx, item in enumerate(items):
                    raw_data = item.get("data")
                    if raw_data:
                        try:
                            obj = json.loads(raw_data) if isinstance(raw_data, str) else raw_data
                            if isinstance(obj, dict):
                                if "X" in obj:
                                    print(f"    Item {idx} (Box): Center={obj.get('Center')}")
                                elif "archive3dm" in obj or "opennurbs" in obj:
                                    decoded = rhino3dm.CommonObject.Decode(obj)
                                    if decoded:
                                        bbox = decoded.GetBoundingBox()
                                        print(f"    Item {idx} (Brep): BBox Min=[{bbox.Min.X:.1f}, {bbox.Min.Y:.1f}, {bbox.Min.Z:.1f}], Max=[{bbox.Max.X:.1f}, {bbox.Max.Y:.1f}, {bbox.Max.Z:.1f}]")
                        except Exception as e:
                            print(f"    Err item {idx}:", e)

if __name__ == "__main__":
    inspect_drawer_fronts_and_backs()
