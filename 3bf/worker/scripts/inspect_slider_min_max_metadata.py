import requests
import json
import base64

def inspect_slider_limits():
    ghx_path = r"C:\Desarrollo\mmapp\temporal\Cajon_Experimento_Viktor_3cajones.ghx"
    with open(ghx_path, "r", encoding="utf-8") as f:
        xml_str = f.read()

    b64_algo = base64.b64encode(xml_str.encode("utf-8")).decode("utf-8")

    res_io = requests.post("http://localhost:5000/io", json={"algo": b64_algo})
    data = res_io.json()

    print("=== METADATOS DEVUELTOS POR RHINOCOMPUTE 8 /IO ===")
    inputs = data.get("inputs", [])
    for inp in inputs:
        name = inp.get("Name")
        print(f"\nParam: '{name}'")
        for k, v in inp.items():
            print(f"   • {k}: {v}")

if __name__ == "__main__":
    inspect_slider_limits()
