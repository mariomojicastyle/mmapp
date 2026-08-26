import base64
import requests
import json

def inspect_raw_data():
    ghx_path = r"C:\Desarrollo\mmapp\temporal\Cajon_Experimento_Viktor_RhinoCompute.ghx"
    with open(ghx_path, "r", encoding="utf-8") as f:
        xml_str = f.read()

    b64_algo = base64.b64encode(xml_str.encode("utf-8")).decode("utf-8")

    payload = {
        "algo": b64_algo,
        "pointer": None,
        "values": [
            {"ParamName": "RH_IN:Ancho", "InnerTree": {"{0}": [{"type": "System.Double", "data": "800.0"}]}}
        ]
    }

    res = requests.post("http://localhost:5000/grasshopper", json=payload)
    data = res.json()

    for val in data.get("values", []):
        param_name = val.get("ParamName")
        inner = val.get("InnerTree", {})
        for path, items in inner.items():
            for item in items:
                raw_data = item.get("data")
                print("RAW DATA TYPE:", type(raw_data))
                print("RAW DATA VALUE:", str(raw_data)[:300])

if __name__ == "__main__":
    inspect_raw_data()
