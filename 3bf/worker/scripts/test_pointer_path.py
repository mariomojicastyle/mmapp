import requests

def test_pointer(gh_path):
    print(f"=== Probando envio de pointer a RhinoCompute ===")
    print("File:", gh_path)
    
    payload = {
        "algo": None,
        "pointer": gh_path,
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
    print("OUTPUT:", res.text)

if __name__ == "__main__":
    test_pointer(r"C:\Desarrollo\mmapp\temporal\Cajon_Experimento_Viktor.gh")
