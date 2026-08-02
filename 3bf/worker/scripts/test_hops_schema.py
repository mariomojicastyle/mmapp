import compute_rhino3d.Util
import compute_rhino3d.Grasshopper as gh
import rhino3dm
import base64
import requests
import json

compute_rhino3d.Util.url = "http://localhost:5000/"

def test_hops_eval(gh_filepath):
    print("=== Probando Hops / RhinoCompute Evaluate ===")
    
    with open(gh_filepath, "rb") as f:
        gh_bytes = f.read()
        algo_b64 = base64.b64encode(gh_bytes).decode("utf-8")
        
    payload = {
        "algo": algo_b64,
        "pointer": None,
        "values": [
            {
                "ParamName": "RH_IN:Ancho",
                "InnerTree": {
                    "{0}": [{"type": "System.Double", "data": "800.0"}]
                }
            },
            {
                "ParamName": "RH_IN:Alto",
                "InnerTree": {
                    "{0}": [{"type": "System.Double", "data": "1000.0"}]
                }
            }
        ]
    }
    
    res = requests.post("http://localhost:5000/grasshopper", json=payload)
    print("STATUS:", res.status_code)
    print("OUTPUT:", res.text[:500])

if __name__ == "__main__":
    gh_filepath = r"C:\Desarrollo\mmapp\temporal\Cajon_Experimento_Viktor.gh"
    test_hops_eval(gh_filepath)
