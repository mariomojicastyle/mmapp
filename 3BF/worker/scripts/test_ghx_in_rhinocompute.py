import base64
import requests

def test_original_ghx():
    fpath = r"C:\Desarrollo\mmapp\temporal\Cajon_Experimental_ShapeDriver_02.ghx"
    with open(fpath, "r", encoding="utf-8") as f:
        xml_str = f.read()
        
    b64 = base64.b64encode(xml_str.encode("utf-8")).decode("utf-8")
    
    res = requests.post("http://localhost:5000/io", json={"algo": b64})
    print("STATUS original GHX /io:", res.status_code)
    if res.status_code != 200:
        print("Error text:", res.text[:300])

if __name__ == "__main__":
    test_original_ghx()
