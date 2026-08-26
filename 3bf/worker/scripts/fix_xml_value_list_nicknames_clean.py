import xml.etree.ElementTree as ET
import base64
import requests
import json

def fix_and_test_clean():
    ghx_path = r"C:\Desarrollo\mmapp\temporal\Cajon_Experimento_Viktor.ghx"
    dst_path = r"C:\Desarrollo\mmapp\temporal\Cajon_Experimento_Viktor_RhinoCompute.ghx"
    
    tree = ET.parse(ghx_path)
    root = tree.getroot()

    print("=== FIX: ASIGNANDO RH_IN DIRECTAMENTE A LOS COMPONENTES VALUE LIST ===")
    
    for chunk in root.iter("chunk"):
        if chunk.attrib.get("name") == "Object":
            name_item = chunk.find("items/item[@name='Name']")
            if name_item is not None and name_item.text == "Value List":
                # Buscar si hay un sub-item con RH_IN
                target_nickname = None
                for item in chunk.iter("item"):
                    if item.text and "RH_IN:" in item.text and item.attrib.get("name") != "Name":
                        target_nickname = item.text
                        break
                
                if target_nickname:
                    # Asignar NickName al item principal del componente
                    nick_item = chunk.find("items/item[@name='NickName']")
                    if nick_item is None:
                        items_node = chunk.find("items")
                        if items_node is not None:
                            nick_item = ET.SubElement(items_node, "item", {"name": "NickName", "type_name": "gh_string", "type_code": "10"})
                    
                    if nick_item is not None:
                        nick_item.text = target_nickname
                        print(f"  • [OK] Value List actualizado con NickName: '{target_nickname}'")

    tree.write(dst_path, encoding="utf-8", xml_declaration=True)
    tree.write(ghx_path, encoding="utf-8", xml_declaration=True)
    print(f"[OK ARCHIVO GUARDADO] {dst_path}")

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
                {"ParamName": "RH_IN:Cantidad de Cajones", "InnerTree": {"{0}": [{"type": "System.Int32", "data": str(n)}]}}
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
        print(f"[EVALUACIÓN CAJONES = {n}] Total Mallas: {len(real_meshes)} | Frentes: {len(frentes)}")

if __name__ == "__main__":
    fix_and_test_clean()
