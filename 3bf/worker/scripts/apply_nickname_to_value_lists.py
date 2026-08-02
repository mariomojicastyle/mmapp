import xml.etree.ElementTree as ET
import base64
import requests
import json

def fix_and_test():
    ghx_path = r"C:\Desarrollo\mmapp\temporal\Cajon_Experimento_Viktor.ghx"
    dst_path = r"C:\Desarrollo\mmapp\temporal\Cajon_Experimento_Viktor_RhinoCompute.ghx"
    
    tree = ET.parse(ghx_path)
    root = tree.getroot()

    print("=== ASIGNANDO RH_IN AL NICKNAME DE LOS COMPONENTES VALUE LIST ===")
    
    # 1. Recorrer todos los objetos de tipo Value List y transferir el NickName del grupo al componente
    for chunk in root.iter("chunk"):
        if chunk.attrib.get("name") == "Object":
            name_item = chunk.find("items/item[@name='Name']")
            nick_item = chunk.find("items/item[@name='NickName']")
            
            if name_item is not None and name_item.text == "Value List":
                # Buscar el Nickname dentro de los sub-elementos o sibling groups
                for item in chunk.iter("item"):
                    if item.attrib.get("name") == "NickName" and item.text and "RH_IN:" in item.text:
                        print(f"  • Asignando NickName al Value List: '{item.text}'")
                        nick_item.text = item.text

    tree.write(dst_path, encoding="utf-8", xml_declaration=True)
    tree.write(ghx_path, encoding="utf-8", xml_declaration=True)
    print(f"[OK] Archivos XML actualizados con RH_IN en los componentes Value List.")

    # 2. Probar evaluación en RhinoCompute 8 para 1, 2 y 3 cajones
    with open(dst_path, "r", encoding="utf-8") as f:
        xml_str = f.read()
    b64_algo = base64.b64encode(xml_str.encode("utf-8")).decode("utf-8")

    for n in [1, 2, 3]:
        payload_rc = {
            "algo": b64_algo,
            "pointer": None,
            "values": [
                {"ParamName": "RH_IN:Ancho", "InnerTree": {"{0}": [{"type": "System.Double", "data": "1200.0"}]}},
                {"ParamName": "RH_IN:Alto", "InnerTree": {"{0}": [{"type": "System.Double", "data": "900.0"}]}},
                {"ParamName": "RH_IN:Profundidad", "InnerTree": {"{0}": [{"type": "System.Double", "data": "500.0"}]}},
                {"ParamName": "RH_IN:Cantidada de Cajones", "InnerTree": {"{0}": [{"type": "System.Int32", "data": str(n)}]}},
                {"ParamName": "RH_IN:Cantidada de Cajones", "InnerTree": {"{0}": [{"type": "System.String", "data": str(n)}]}}
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

        frentes = [m for m in real_meshes if "Frente" in m["name"]]
        print(f"\n[PROBANDO {n} CAJONES] Total Mallas: {len(real_meshes)} | Frentes de Cajón: {len(frentes)}")

if __name__ == "__main__":
    fix_and_test()
