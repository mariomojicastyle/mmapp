import compute_rhino3d.Util
import compute_rhino3d.Grasshopper as gh
import rhino3dm
import base64
import json
import requests

def evaluate_with_base64(gh_path, params_dict):
    print("=== Enviando definición Grasshopper en Base64 a RhinoCompute ===")
    
    with open(gh_path, "rb") as f:
        gh_bytes = f.read()
        algo_b64 = base64.b64encode(gh_bytes).decode("utf-8")
        
    values = []
    for k, v in params_dict.items():
        values.append({
            "ParamName": k,
            "InnerTree": {
                "{0}": [{"type": "System.String", "data": f"\"{v}\""}]
            }
        })
        
    payload = {
        "algo": algo_b64,
        "pointer": None,
        "values": values
    }
    
    response = requests.post("http://localhost:5000/grasshopper", json=payload)
    print("Status Code:", response.status_code)
    try:
        res_json = response.json()
        print("Response Keys:", res_json.keys())
        if "values" in res_json:
            print(f"EXITO TOTAL: Se recibieron {len(res_json['values'])} ramas de salida reales de Grasshopper!")
            for out in res_json["values"]:
                name = out.get("ParamName")
                tree = out.get("InnerTree")
                print(f"  * Componente Salida GH: '{name}' | Nodos en DataTree: {list(tree.keys()) if tree else 0}")
        else:
            print("Response:", res_json)
    except Exception as e:
        print("Error al parsear JSON:", response.text)

if __name__ == "__main__":
    gh_file = r"C:\Desarrollo\mmapp\temporal\Cajon_Experimento_Viktor.gh"
    params = {
        "RH_IN:Ancho": "800",
        "RH_IN:Alto": "1000",
        "RH_IN:Profundidad": "500"
    }
    evaluate_with_base64(gh_file, params)
