import xml.etree.ElementTree as ET
import base64
import requests
import json

def patch_expressions():
    ghx_path = r"C:\Desarrollo\mmapp\temporal\Cajon_Experimento_Viktor.ghx"
    dst_path = r"C:\Desarrollo\mmapp\temporal\Cajon_Experimento_Viktor_RhinoCompute.ghx"
    
    tree = ET.parse(ghx_path)
    root = tree.getroot()

    print("=== MAPANDO EXPRESIONES DE VALUE LIST A LOS ÍNDICES DE STREAM FILTER (0, 1, 2) ===")
    
    for chunk in root.iter("chunk"):
        if chunk.attrib.get("name") == "Object":
            nick_item = chunk.find("items/item[@name='NickName']")
            if nick_item is not None and "Cantidada de Cajones" in str(nick_item.text):
                print("  • Encontrado Value List 'RH_IN:Cantidada de Cajones'")
                for sub in chunk.iter("item"):
                    if sub.attrib.get("name") == "UserList":
                        # Mapear 1->0 (Gate 0), 2->1 (Gate 1), 3->2 (Gate 2)
                        new_list = "1 Cajon = 0\n2 Cajones = 1\n3 Cajones = 2"
                        sub.text = new_list
                        print(f"   [OK] Nuevo UserList asignado:\n{new_list}")

    tree.write(dst_path, encoding="utf-8", xml_declaration=True)
    tree.write(ghx_path, encoding="utf-8", xml_declaration=True)

    # 2. Probar en RhinoCompute 8 con Gate 0 (1 Cajón), Gate 1 (2 Cajones), Gate 2 (3 Cajones)
    with open(dst_path, "r", encoding="utf-8") as f:
        xml_str = f.read()
    b64_algo = base64.b64encode(xml_str.encode("utf-8")).decode("utf-8")

    for test_val in [0, 1, 2, "0", "1", "2"]:
        payload_rc = {
            "algo": b64_algo,
            "pointer": None,
            "values": [
                {"ParamName": "RH_IN:Ancho", "InnerTree": {"{0}": [{"type": "System.Double", "data": "1200.0"}]}},
                {"ParamName": "RH_IN:Alto", "InnerTree": {"{0}": [{"type": "System.Double", "data": "900.0"}]}},
                {"ParamName": "RH_IN:Profundidad", "InnerTree": {"{0}": [{"type": "System.Double", "data": "500.0"}]}},
                {"ParamName": "RH_IN:Cantidada de Cajones", "InnerTree": {"{0}": [{"type": "System.Int32", "data": str(test_val)}]}}
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
        print(f"Probando Gate index {test_val} -> Total Mallas: {len(real_meshes)}, Frentes: {len(frentes)}")

if __name__ == "__main__":
    patch_expressions()
