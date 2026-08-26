import base64
import requests
import json

def test_stream_gates():
    ghx_path = r"C:\Desarrollo\mmapp\temporal\Cajon_Experimento_Viktor_RhinoCompute.ghx"
    with open(ghx_path, "r", encoding="utf-8") as f:
        xml_str = f.read()
    b64_algo = base64.b64encode(xml_str.encode("utf-8")).decode("utf-8")

    # Probar pasar los valores exactos 1, 2, 3 como String y como Int32 al Value List
    for gate_val in ["1", "2", "3", 1, 2, 3, 0, 1, 2]:
        payload_rc = {
            "algo": b64_algo,
            "pointer": None,
            "values": [
                {"ParamName": "RH_IN:Ancho", "InnerTree": {"{0}": [{"type": "System.Double", "data": "1200.0"}]}},
                {"ParamName": "RH_IN:Alto", "InnerTree": {"{0}": [{"type": "System.Double", "data": "900.0"}]}},
                {"ParamName": "RH_IN:Profundidad", "InnerTree": {"{0}": [{"type": "System.Double", "data": "500.0"}]}},
                {"ParamName": "RH_IN:Cantidada de Cajones", "InnerTree": {"{0}": [{"type": "System.String", "data": str(gate_val)}]}}
            ]
        }
        res_gh = requests.post("http://localhost:5000/grasshopper", json=payload_rc)
        data = res_gh.json()
        
        real_meshes = []
        for val in data.get("values", []):
            p_name = val.get("ParamName", "Pieza GH")
            inner = val.get("InnerTree", {})
            for path_key, items in inner.items():
                for item in items:
                    raw_data = item.get("data")
                    if not raw_data:
                        continue
                    try:
                        obj = json.loads(raw_data) if isinstance(raw_data, str) else raw_data
                        if isinstance(obj, dict) and ("X" in obj or "archive3dm" in obj):
                            real_meshes.append({"name": p_name, "path": path_key})
                    except Exception:
                        pass

        print(f"Probando Gate Value = {gate_val} ({type(gate_val).__name__}) -> Total Mallas: {len(real_meshes)}")

if __name__ == "__main__":
    test_stream_gates()
