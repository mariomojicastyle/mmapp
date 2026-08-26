import xml.etree.ElementTree as ET

def trace_stream_filter():
    ghx_path = r"C:\Desarrollo\mmapp\temporal\Cajon_Experimento_Viktor.ghx"
    tree = ET.parse(ghx_path)
    root = tree.getroot()

    target_vl_guid = "d54cf14d-cdbb-4d6e-b517-4d755262595d"
    print(f"=== RASTREANDO CONEXIONES DESDE EL VALUE LIST GUID: {target_vl_guid} ===")

    connected_components = []

    for chunk in root.iter("chunk"):
        if chunk.attrib.get("name") == "Object":
            # Buscar si este objeto tiene a target_vl_guid como Source
            for item in chunk.iter("item"):
                if item.text and target_vl_guid.lower() in item.text.lower():
                    # Obtener nombre del componente receptor
                    nick_item = chunk.find("chunks/chunk[@name='Container']/items/item[@name='NickName']")
                    name_item = chunk.find("chunks/chunk[@name='Container']/items/item[@name='Name']")
                    param_name = chunk.find("items/item[@name='Name']")
                    
                    c_nick = nick_item.text if nick_item is not None else ""
                    c_name = name_item.text if name_item is not None else (param_name.text if param_name is not None else "")
                    
                    connected_components.append({
                        "name": c_name,
                        "nickname": c_nick,
                        "item_name": item.attrib.get("name"),
                        "raw_xml": ET.tostring(chunk, encoding="utf-8").decode("utf-8")[:300]
                    })

    print(f"\n[OK] Componentes que reciben el cable de 'RH_IN:Cantidada de Cajones': {len(connected_components)}")
    for comp in connected_components:
        print(f"  • Receptor: Name='{comp['name']}' | NickName='{comp['nickname']}' | Wire Item='{comp['item_name']}'")

if __name__ == "__main__":
    trace_stream_filter()
