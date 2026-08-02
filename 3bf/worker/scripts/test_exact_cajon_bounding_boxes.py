import base64
import requests
import json

def test_boxes():
    ghx_path = r"C:\Desarrollo\mmapp\temporal\Cajon_Experimento_Viktor.ghx"
    with open(ghx_path, "r", encoding="utf-8") as f:
        xml_str = f.read()
    b64_algo = base64.b64encode(xml_str.encode("utf-8")).decode("utf-8")

    print("=== PROBANDO VALORES 0, 1, 2 Y ANALIZANDO LA ALTURA DE CADA FRENTE DE CAJÓN ===")

    for val in [0, 1, 2, "0", "1", "2"]:
        payload_rc = {
            "algo": b64_algo,
            "pointer": None,
            "values": [
                {"ParamName": "RH_IN:Ancho", "InnerTree": {"{0}": [{"type": "System.Double", "data": "1200.0"}]}},
                {"ParamName": "RH_IN:Alto", "InnerTree": {"{0}": [{"type": "System.Double", "data": "900.0"}]}},
                {"ParamName": "RH_IN:Profundidad", "InnerTree": {"{0}": [{"type": "System.Double", "data": "500.0"}]}},
                {"ParamName": "RH_IN:Cantidada de Cajones", "InnerTree": {"{0}": [{"type": "System.Int32", "data": str(val)}]}}
            ]
        }
        res_gh = requests.post("http://localhost:5000/grasshopper", json=payload_rc)
        data = res_gh.json()
        
        frentes = []
        for val_node in data.get("values", []):
            if val_node.get("ParamName") == "RH_OUT:Frente de Cajon":
                inner = val_node.get("InnerTree", {})
                for path_key, items in inner.items():
                    for item in items:
                        raw_data = item.get("data")
                        if not raw_data:
                            continue
                        try:
                            obj = json.loads(raw_data) if isinstance(raw_data, str) else raw_data
                            if isinstance(obj, dict) and "Y" in obj:
                                y_size = abs(obj["Y"]["T1"] - obj["Y"]["T0"])
                                frentes.append({"path": path_key, "height_mm": round(y_size, 1)})
                        except Exception:
                            pass

        print(f"\n[VALOR ENVIADO: {val}] Total frentes devueltos: {len(frentes)}")
        for f in frentes:
            print(f"  • Frente (Branch {f['path']}): Altura = {f['height_mm']} mm")

if __name__ == "__main__":
    test_boxes()
