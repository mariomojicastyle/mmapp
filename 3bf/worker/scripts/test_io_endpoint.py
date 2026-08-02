import base64
import requests

def test_io(ghx_path):
    print("=== Probando /io endpoint en RhinoCompute (Rhino 8) ===")
    with open(ghx_path, "r", encoding="utf-8") as f:
        xml_str = f.read()
        
    b64_algo = base64.b64encode(xml_str.encode("utf-8")).decode("utf-8")
    
    res_io = requests.post("http://localhost:5000/io", json={"algo": b64_algo})
    print("POST /io STATUS:", res_io.status_code)
    print("POST /io OUTPUT:", res_io.text[:500])

if __name__ == "__main__":
    test_io(r"C:\Desarrollo\mmapp\temporal\Cajon_Experimental_ShapeDriver_02.ghx")
