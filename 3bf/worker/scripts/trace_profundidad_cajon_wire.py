import xml.etree.ElementTree as ET

def trace_prof_wire():
    ghx_path = r"C:\Desarrollo\mmapp\temporal\Cajon_Experimento_Viktor_3cajones.ghx"
    tree = ET.parse(ghx_path)
    root = tree.getroot()

    print("=== RASTREANDO CABLE DEL VALUE LIST PROFUNDIDAD CAJON ===")
    
    # 1. Encontrar el Guid del objeto Value List Profundidad cajon
    vl_guid = None
    for chunk in root.iter("chunk"):
        if chunk.attrib.get("name") == "Object":
            container = chunk.find("chunks/chunk[@name='Container']")
            nick = container.find("items/item[@name='NickName']") if container is not None else None
            if nick is not None and nick.text == "RH_IN:Profundidad cajon":
                guid = container.find("items/item[@name='InstanceGuid']")
                vl_guid = guid.text if guid is not None else None
                print(f"  • Found Value List 'RH_IN:Profundidad cajon' -> InstanceGuid: {vl_guid}")

    if vl_guid:
        receptors = []
        for chunk in root.iter("chunk"):
            if chunk.attrib.get("name") == "Object":
                xml_str = ET.tostring(chunk, encoding="utf-8").decode("utf-8")
                if vl_guid.lower() in xml_str.lower():
                    container = chunk.find("chunks/chunk[@name='Container']")
                    nick = container.find("items/item[@name='NickName']") if container is not None else None
                    name = container.find("items/item[@name='Name']") if container is not None else None
                    receptors.append(f"Name='{name.text if name is not None else ''}' | NickName='{nick.text if nick is not None else ''}'")
        
        print(f"  • Menciones del GUID en receptores: {len(receptors)}")
        for r in receptors:
            print("     ->", r)

if __name__ == "__main__":
    trace_prof_wire()
