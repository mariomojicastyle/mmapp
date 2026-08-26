import compute_rhino3d.Util
import compute_rhino3d.Grasshopper as gh
import rhino3dm
import base64
import json
import requests
import os

compute_rhino3d.Util.url = "http://localhost:5000/"

def convert_rhino_response_to_glb(ghx_path, params_dict, output_glb_path):
    print("=== Evaluando .ghx real en RhinoCompute y exportando mallas a 3D ===")
    
    with open(ghx_path, "r", encoding="utf-8") as f:
        xml_str = f.read()
        
    b64_algo = base64.b64encode(xml_str.encode("utf-8")).decode("utf-8")
    
    values = []
    for k, v in params_dict.items():
        values.append({
            "ParamName": k,
            "InnerTree": {
                "{0}": [{"type": "System.Double", "data": str(float(v))}]
            }
        })
        
    payload = {
        "algo": b64_algo,
        "pointer": None,
        "values": values
    }
    
    res = requests.post("http://localhost:5000/grasshopper", json=payload)
    if res.status_code != 200:
        print("Error en RhinoCompute:", res.text)
        return False
        
    data = res.json()
    model = rhino3dm.File3dm()
    
    mesh_count = 0
    if "values" in data:
        for val in data["values"]:
            param_name = val.get("ParamName")
            inner_tree = val.get("InnerTree", {})
            for branch_key, branch_items in inner_tree.items():
                for item in branch_items:
                    raw_data = item.get("data")
                    if raw_data:
                        try:
                            obj_json = json.loads(raw_data)
                            geom = rhino3dm.CommonObject.Decode(obj_json)
                            if geom:
                                model.Objects.Add(geom, None)
                                mesh_count += 1
                        except Exception as e:
                            pass
                            
    print(f"[OK] Se deserializaron {mesh_count} objetos de geometria real desde Grasshopper en rhino3dm!")
    
    temp_3dm = output_glb_path.replace(".glb", ".3dm")
    model.Write(temp_3dm, 7)
    print(f"[OK] Archivo .3dm nativo generado en: {temp_3dm}")
    return True

if __name__ == "__main__":
    src = r"C:\Desarrollo\mmapp\temporal\Cajon_Experimento_Viktor_RhinoCompute.ghx"
    dst_glb = r"C:\Desarrollo\mmapp\3BF\public\exports\mueble_real.glb"
    os.makedirs(r"C:\Desarrollo\mmapp\3BF\public\exports", exist_ok=True)
    
    params = {
        "RH_IN:Ancho": 900,
        "RH_IN:Alto": 1100,
        "RH_IN:Profundidad": 450,
        "RH_IN:Cantidada de Cajones": 4,
        "RH_IN:Abrir Cajones": 150
    }
    convert_rhino_response_to_glb(src, params, dst_glb)
