import base64
import requests
import json
import rhino3dm

def check_user_fresh():
    ghx_path = r"C:\Desarrollo\mmapp\temporal\Cajon_Experimento_Viktor.ghx"
    print(f"=== Evaluando el archivo GUARDADO POR EL USUARIO en Rhino 8: {ghx_path} ===")
    
    with open(ghx_path, "r", encoding="utf-8") as f:
        xml_str = f.read()
        
    b64_algo = base64.b64encode(xml_str.encode("utf-8")).decode("utf-8")
    
    # 1. POST /io
    res_io = requests.post("http://localhost:5000/io", json={"algo": b64_algo})
    print("STATUS /io:", res_io.status_code)
    io_data = res_io.json()
    
    print(f"\n--- ENTRADAS REGISTRADAS POR RHINOCOMPUTE ({len(io_data.get('Inputs', []))}) ---")
    for inp in io_data.get("Inputs", []):
        print(f"  • Input: '{inp.get('Name')}' ({inp.get('ParamType')})")
        
    print(f"\n--- SALIDAS REGISTRADAS POR RHINOCOMPUTE ({len(io_data.get('Outputs', []))}) ---")
    for out in io_data.get("Outputs", []):
        print(f"  • Output: '{out.get('Name')}' ({out.get('ParamType')})")

    # 2. Probar evaluacion con RH_IN:Ancho = 600 y 1200
    def eval_val(val):
        payload_rc = {
            "algo": b64_algo,
            "pointer": None,
            "values": [
                {"ParamName": "RH_IN:Ancho", "InnerTree": {"{0}": [{"type": "System.Double", "data": str(float(val))}]}}
            ]
        }
        res = requests.post("http://localhost:5000/grasshopper", json=payload_rc)
        data = res.json()
        meshes = []
        for v in data.get("values", []):
            p = v.get("ParamName")
            inner = v.get("InnerTree", {})
            for pk, items in inner.items():
                for item in items:
                    raw = item.get("data")
                    if raw:
                        try:
                            obj = json.loads(raw) if isinstance(raw, str) else raw
                            if isinstance(obj, dict):
                                if "X" in obj and "Y" in obj and "Z" in obj:
                                    x_sz = abs(obj["X"]["T1"] - obj["X"]["T0"])
                                    meshes.append((p, x_sz))
                                elif "archive3dm" in obj or "opennurbs" in obj:
                                    dec = rhino3dm.CommonObject.Decode(obj)
                                    if dec:
                                        bbox = dec.GetBoundingBox()
                                        x_sz = abs(bbox.Max.X - bbox.Min.X)
                                        meshes.append((p, x_sz))
                        except Exception:
                            pass
        print(f"\n--- Resultado evaluando RH_IN:Ancho = {val} mm ---")
        for p, x in meshes:
            print(f"  • {p} -> Tamaño X: {x:.1f} mm")

    eval_val(600)
    eval_val(1200)

if __name__ == "__main__":
    check_user_fresh()
