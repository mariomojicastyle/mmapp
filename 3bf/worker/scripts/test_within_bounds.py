import base64
import requests
import json
import rhino3dm

def test_bounds(ancho, alto, prof, apertura):
    ghx_file = r"C:\Desarrollo\mmapp\temporal\Cajon_Experimento_Viktor_RhinoCompute.ghx"
    with open(ghx_file, "r", encoding="utf-8") as f:
        xml_str = f.read()
    b64_algo = base64.b64encode(xml_str.encode("utf-8")).decode("utf-8")

    payload_rc = {
        "algo": b64_algo,
        "pointer": None,
        "values": [
            {"ParamName": "RH_IN:Ancho", "InnerTree": {"{0}": [{"type": "System.Double", "data": str(float(ancho))}]}},
            {"ParamName": "RH_IN:Alto", "InnerTree": {"{0}": [{"type": "System.Double", "data": str(float(alto))}]}},
            {"ParamName": "RH_IN:Profundidad", "InnerTree": {"{0}": [{"type": "System.Double", "data": str(float(prof))}]}},
            {"ParamName": "RH_IN:Abrir Cajones", "InnerTree": {"{0}": [{"type": "System.Double", "data": str(float(apertura))}]}}
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
                            x_size = abs(obj["X"]["T1"] - obj["X"]["T0"])
                            extracted_meshes.append((p_name, x_size))
                        elif "archive3dm" in obj or "opennurbs" in obj:
                            decoded = rhino3dm.CommonObject.Decode(obj)
                            if decoded:
                                bbox = decoded.GetBoundingBox()
                                x_size = abs(bbox.Max.X - bbox.Min.X)
                                extracted_meshes.append((p_name, x_size))
                except Exception:
                    pass

    print(f"\n--- Probando Ancho={ancho}mm, Alto={alto}mm, Prof={prof}mm ---")
    for name, x in extracted_meshes:
        print(f"  • {name} -> Tamaño X: {x:.1f} mm")

if __name__ == "__main__":
    test_bounds(600, 900, 408, 0)
    test_bounds(850, 700, 350, 150)
