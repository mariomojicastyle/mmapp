import base64
import requests
import json
import rhino3dm

def test_original_file(ancho_val, alto_val, prof_val):
    ghx_file = r"C:\Desarrollo\mmapp\temporal\Cajon_Experimental_ShapeDriver_02.ghx"
    with open(ghx_file, "r", encoding="utf-8") as f:
        xml_str = f.read()
    b64_algo = base64.b64encode(xml_str.encode("utf-8")).decode("utf-8")

    payload_rc = {
        "algo": b64_algo,
        "pointer": None,
        "values": [
            {"ParamName": "Ancho", "InnerTree": {"{0}": [{"type": "System.Double", "data": str(float(ancho_val))}]}},
            {"ParamName": "Alto", "InnerTree": {"{0}": [{"type": "System.Double", "data": str(float(alto_val))}]}},
            {"ParamName": "Profundidad", "InnerTree": {"{0}": [{"type": "System.Double", "data": str(float(prof_val))}]}},
            {"ParamName": "RH_IN:Ancho", "InnerTree": {"{0}": [{"type": "System.Double", "data": str(float(ancho_val))}]}},
            {"ParamName": "RH_IN:Alto", "InnerTree": {"{0}": [{"type": "System.Double", "data": str(float(alto_val))}]}},
            {"ParamName": "RH_IN:Profundidad", "InnerTree": {"{0}": [{"type": "System.Double", "data": str(float(prof_val))}]}}
        ]
    }

    res = requests.post("http://localhost:5000/grasshopper", json=payload_rc)
    print(f"STATUS /grasshopper ({ancho_val}x{alto_val}x{prof_val}):", res.status_code)
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
                            y_size = abs(obj["Y"]["T1"] - obj["Y"]["T0"])
                            z_size = abs(obj["Z"]["T1"] - obj["Z"]["T0"])
                            extracted_meshes.append((p_name, x_size, y_size, z_size))
                        elif "archive3dm" in obj or "opennurbs" in obj:
                            decoded = rhino3dm.CommonObject.Decode(obj)
                            if decoded:
                                bbox = decoded.GetBoundingBox()
                                x_size = abs(bbox.Max.X - bbox.Min.X)
                                y_size = abs(bbox.Max.Y - bbox.Min.Y)
                                z_size = abs(bbox.Max.Z - bbox.Min.Z)
                                extracted_meshes.append((p_name, x_size, y_size, z_size))
                except Exception:
                    pass

    print(f"Total piezas extraídas: {len(extracted_meshes)}")
    for name, x, y, z in extracted_meshes:
        print(f"  • {name} -> Dimensiones: X={x:.1f}mm, Y={y:.1f}mm, Z={z:.1f}mm")

if __name__ == "__main__":
    print("--- Prueba 1: 1200 x 900 x 500 ---")
    test_original_file(1200, 900, 500)
    print("\n--- Prueba 2: 600 x 600 x 300 ---")
    test_original_file(600, 600, 300)
