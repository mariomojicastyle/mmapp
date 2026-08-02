import base64
import requests

def test_ghx_exact_names(ghx_path):
    print("=== Probando .ghx con nombres de parametros exactos (Ancho, Alto, Profundidad) ===")
    with open(ghx_path, "r", encoding="utf-8") as f:
        xml_str = f.read()
        
    b64_algo = base64.b64encode(xml_str.encode("utf-8")).decode("utf-8")
    
    payload = {
        "algo": b64_algo,
        "pointer": None,
        "values": [
            {
                "ParamName": "Ancho",
                "InnerTree": {
                    "{0}": [{"type": "System.Double", "data": "800.0"}]
                }
            },
            {
                "ParamName": "Alto",
                "InnerTree": {
                    "{0}": [{"type": "System.Double", "data": "1000.0"}]
                }
            },
            {
                "ParamName": "Profundidad",
                "InnerTree": {
                    "{0}": [{"type": "System.Double", "data": "500.0"}]
                }
            }
        ]
    }
    
    res = requests.post("http://localhost:5000/grasshopper", json=payload)
    print("STATUS:", res.status_code)
    try:
        data = res.json()
        print("Keys:", data.keys())
        if "values" in data:
            print(f"EXITO TOTAL EN RHINO 8 COMPUTE: Se recibieron {len(data['values'])} mallas/geometrias reales de Grasshopper!")
            for val in data["values"]:
                print("  * Output ParamName:", val.get("ParamName"))
        else:
            print("Response:", data)
    except Exception as e:
        print("Text:", res.text[:500])

if __name__ == "__main__":
    test_ghx_exact_names(r"C:\Desarrollo\mmapp\temporal\Cajon_Experimental_ShapeDriver_02.ghx")
