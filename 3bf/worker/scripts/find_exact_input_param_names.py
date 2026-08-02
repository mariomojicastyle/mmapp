import base64
import requests

def inspect_io_details():
    ghx_path = r"C:\Desarrollo\mmapp\temporal\Cajon_Experimento_Viktor.ghx"
    with open(ghx_path, "r", encoding="utf-8") as f:
        xml_str = f.read()
    b64_algo = base64.b64encode(xml_str.encode("utf-8")).decode("utf-8")

    res_io = requests.post("http://localhost:5000/io", json={"algo": b64_algo})
    print("STATUS /io:", res_io.status_code)
    io_data = res_io.json()
    
    print("\n=== TODAS LAS ENTRADAS REGISTRADAS EN RHINOCOMPUTE ===")
    for inp in io_data.get("Inputs", []):
        print(f"  • Name: '{inp.get('Name')}' | ParamType: '{inp.get('ParamType')}' | Attrs: {inp}")

if __name__ == "__main__":
    inspect_io_details()
