import base64
import requests

def solve_real():
    ghx_file = r"C:\Desarrollo\mmapp\temporal\Cajon_Experimento_Viktor_RhinoCompute.ghx"
    with open(ghx_file, "r", encoding="utf-8") as f:
        xml_str = f.read()
        
    b64_algo = base64.b64encode(xml_str.encode("utf-8")).decode("utf-8")
    
    payload = {
        "algo": b64_algo,
        "pointer": None,
        "values": [
            {
                "ParamName": "RH_IN:Ancho",
                "InnerTree": {
                    "{0}": [{"type": "System.Double", "data": "800.0"}]
                }
            }
        ]
    }
    
    res = requests.post("http://localhost:5000/grasshopper", json=payload)
    print("STATUS:", res.status_code)
    try:
        data = res.json()
        print("KEYS:", data.keys())
        if "values" in data:
            print("EXITO ABSOLUTO: RhinoCompute devolvio la geometria real de Grasshopper:")
            for val in data["values"]:
                print(f"  * ParamName: {val.get('ParamName')}")
                tree = val.get("InnerTree", {})
                print(f"    Ramas en DataTree: {list(tree.keys())}")
        else:
            print("RESPUESTA:", data)
    except Exception as e:
        print("TEXT:", res.text[:500])

if __name__ == "__main__":
    solve_real()
