import base64
import requests
import json

def find_exact_trigger():
    ghx_path = r"C:\Desarrollo\mmapp\temporal\Cajon_Experimento_Viktor.ghx"
    with open(ghx_path, "r", encoding="utf-8") as f:
        xml_str = f.read()
    b64_algo = base64.b64encode(xml_str.encode("utf-8")).decode("utf-8")

    print("=== PROBANDO VALORES PARA CONMUTAR EL STREAM FILTER EN RHINOCOMPUTE 8 ===")
    
    # Probar diferentes variaciones de valores de entrada para RH_IN:Cantidada de Cajones
    test_variations = [
        ("System.Int32", "0"),
        ("System.Int32", "1"),
        ("System.Int32", "2"),
        ("System.Int32", "3"),
        ("System.String", "0"),
        ("System.String", "1"),
        ("System.String", "2"),
        ("System.String", "3"),
        ("System.String", "1 Cajon"),
        ("System.String", "2 Cajones"),
        ("System.String", "3 Cajones"),
        ("System.String", "A 1 Cajon"),
        ("System.String", "A 2 cajones"),
        ("System.String", "A 3 Cajones")
    ]

    for sys_type, val_str in test_variations:
        payload_rc = {
            "algo": b64_algo,
            "pointer": None,
            "values": [
                {"ParamName": "RH_IN:Ancho", "InnerTree": {"{0}": [{"type": "System.Double", "data": "1200.0"}]}},
                {"ParamName": "RH_IN:Alto", "InnerTree": {"{0}": [{"type": "System.Double", "data": "900.0"}]}},
                {"ParamName": "RH_IN:Profundidad", "InnerTree": {"{0}": [{"type": "System.Double", "data": "500.0"}]}},
                {"ParamName": "RH_IN:Cantidada de Cajones", "InnerTree": {"{0}": [{"type": f"{sys_type}", "data": val_str}]}}
            ]
        }
        res_gh = requests.post("http://localhost:5000/grasshopper", json=payload_rc)
        data = res_gh.json()
        
        frentes = []
        for val in data.get("values", []):
            if val.get("ParamName") == "RH_OUT:Frente de Cajon":
                inner = val.get("InnerTree", {})
                for path_key, items in inner.items():
                    for item in items:
                        if item.get("data"):
                            frentes.append({"path": path_key, "data": item.get("data")})

        print(f"Entrada ({sys_type}): '{val_str}' -> Frentes de Cajón devueltos por Grasshopper: {len(frentes)}")

if __name__ == "__main__":
    find_exact_trigger()
