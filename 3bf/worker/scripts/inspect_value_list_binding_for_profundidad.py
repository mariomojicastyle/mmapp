import requests
import json
import base64

def check_io():
    ghx_path = r"C:\Desarrollo\mmapp\temporal\Cajon_Experimento_Viktor_3cajones.ghx"
    with open(ghx_path, "r", encoding="utf-8") as f:
        xml_str = f.read()
    b64_algo = base64.b64encode(xml_str.encode("utf-8")).decode("utf-8")

    res_io = requests.post("http://localhost:5000/io", json={"algo": b64_algo})
    data = res_io.json()

    print("=== INPUTS REGISTRADOS EN RHINOCOMPUTE 8 DE CAJON 3 CAJONES ===")
    for inp in data.get("inputs", []):
        print(f"  • Name: '{inp.get('Name')}' | ParamType: '{inp.get('ParamType')}'")

if __name__ == "__main__":
    check_io()
