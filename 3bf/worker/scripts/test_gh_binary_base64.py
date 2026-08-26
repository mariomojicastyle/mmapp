import base64
import requests

def test_binary_gh(gh_file):
    print(f"=== Probando envio de binario .gh Base64 a RhinoCompute ===")
    print(f"Archivo: {gh_file}")
    with open(gh_file, "rb") as f:
        raw_bytes = f.read()
        b64_str = base64.b64encode(raw_bytes).decode("utf-8")

    payload = {
        "algo": b64_str,
        "pointer": None,
        "values": []
    }

    res = requests.post("http://localhost:5000/grasshopper", json=payload)
    print("Status Code:", res.status_code)
    try:
        data = res.json()
        print("Keys:", data.keys())
        if "values" in data:
            print(f"EXITO TOTAL RHINO 8 COMPUTE: {len(data['values'])} salidas devueltas de Grasshopper!")
            for v in data["values"]:
                print("  * Output Name:", v.get("ParamName"))
        else:
            print("Response:", data)
    except Exception as e:
        print("Text:", res.text)

if __name__ == "__main__":
    test_binary_gh(r"C:\Desarrollo\mmapp\temporal\Cajon_Experimento_Viktor.gh")
