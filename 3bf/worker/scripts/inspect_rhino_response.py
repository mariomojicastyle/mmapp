import base64
import requests
import json

ghx_path = r"C:\Desarrollo\mmapp\temporal\Cajon_Experimento_Viktor_RhinoCompute.ghx"
with open(ghx_path, "r", encoding="utf-8") as f:
    xml_str = f.read()

b64_algo = base64.b64encode(xml_str.encode("utf-8")).decode("utf-8")

payload = {
    "algo": b64_algo,
    "pointer": None,
    "values": [
        {"ParamName": "RH_IN:Ancho", "InnerTree": {"{0}": [{"type": "System.Double", "data": "800.0"}]}},
        {"ParamName": "RH_IN:Alto", "InnerTree": {"{0}": [{"type": "System.Double", "data": "1000.0"}]}},
        {"ParamName": "RH_IN:Profundidad", "InnerTree": {"{0}": [{"type": "System.Double", "data": "500.0"}]}}
    ]
}

res = requests.post("http://localhost:5000/grasshopper", json=payload)
data = res.json()

print("KEYS:", list(data.keys()))
for val in data.get("values", []):
    print("PARAM NAME:", val.get("ParamName"))
    inner = val.get("InnerTree", {})
    for path, items in inner.items():
        print(f"  Branch {path}: {len(items)} items")
        for item in items:
            print(f"    Item type: {item.get('type')}")
            raw = item.get("data", "")
            print(f"    Item data snippet: {str(raw)[:150]}")
