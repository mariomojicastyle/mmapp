import base64
import requests

ghx_file = r"C:\Desarrollo\mmapp\temporal\Cajon_Experimental_ShapeDriver_02.ghx"
with open(ghx_file, "r", encoding="utf-8") as f:
    xml_str = f.read()

if xml_str.startswith("<?xml"):
    xml_str = xml_str[xml_str.find(">")+1:].strip()
    
b64_algo = base64.b64encode(xml_str.encode("utf-8")).decode("utf-8")

payload_rc = {
    "algo": b64_algo,
    "pointer": None,
    "values": []
}

res = requests.post("http://localhost:5000/grasshopper", json=payload_rc)
print("STATUS:", res.status_code)
print("RESPONSE TEXT:", res.text[:500])
