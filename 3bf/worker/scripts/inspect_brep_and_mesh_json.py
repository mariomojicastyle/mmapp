import base64
import requests
import json

ghx_file = r"C:\Desarrollo\mmapp\temporal\Cajon_Experimento_Viktor_RhinoCompute.ghx"
with open(ghx_file, "r", encoding="utf-8") as f:
    xml_str = f.read()
b64_algo = base64.b64encode(xml_str.encode("utf-8")).decode("utf-8")

payload_rc = {
    "algo": b64_algo,
    "pointer": None,
    "values": [
        {"ParamName": "RH_IN:Ancho", "InnerTree": {"{0}": [{"type": "System.Double", "data": "1200.0"}]}}
    ]
}

res = requests.post("http://localhost:5000/grasshopper", json=payload_rc)
rc_data = res.json()

print(f"Total Output Values: {len(rc_data.get('values', []))}")
for val in rc_data.get("values", []):
    p_name = val.get("ParamName")
    inner = val.get("InnerTree", {})
    for path, items in inner.items():
        print(f"\nPARAM: '{p_name}' | Branch {path}: {len(items)} items")
        for item in items:
            t = item.get("type")
            raw = item.get("data")
            print(f"  Item Type: '{t}'")
            if raw:
                try:
                    obj = json.loads(raw) if isinstance(raw, str) else raw
                    if isinstance(obj, dict):
                        print(f"    Dict Keys: {list(obj.keys())[:10]}")
                        if "bbox" in obj or "BoundingBox" in obj:
                            print(f"    BoundingBox: {obj.get('bbox') or obj.get('BoundingBox')}")
                except Exception as e:
                    print("    Parse err:", e)
