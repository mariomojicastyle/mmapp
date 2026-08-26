import base64
import requests
import json

def diagnose_io(ghx_path):
    print(f"=== Diagnóstico I/O de RhinoCompute para: {ghx_path} ===")
    with open(ghx_path, "r", encoding="utf-8") as f:
        xml_str = f.read()
        
    b64_algo = base64.b64encode(xml_str.encode("utf-8")).decode("utf-8")
    
    res = requests.post("http://localhost:5000/io", json={"algo": b64_algo})
    print("STATUS /io:", res.status_code)
    data = res.json()
    
    print("\n--- ENTRADAS (Inputs) detectadas por RhinoCompute ---")
    inputs = data.get("Inputs", [])
    print(f"Total Inputs: {len(inputs)}")
    for inp in inputs:
        print(f"  • Input Name: '{inp.get('Name')}' | Nickname: '{inp.get('Nickname')}' | ParamType: '{inp.get('ParamType')}'")
        
    print("\n--- SALIDAS (Outputs) detectadas por RhinoCompute ---")
    outputs = data.get("Outputs", [])
    print(f"Total Outputs: {len(outputs)}")
    for out in outputs:
        print(f"  • Output Name: '{out.get('Name')}' | Nickname: '{out.get('Nickname')}' | ParamType: '{out.get('ParamType')}'")

if __name__ == "__main__":
    src_orig = r"C:\Desarrollo\mmapp\temporal\Cajon_Experimental_ShapeDriver_02.ghx"
    diagnose_io(src_orig)
