import xml.etree.ElementTree as ET

def trace_guid():
    ghx_path = r"C:\Desarrollo\mmapp\temporal\Cajon_Experimento_Viktor.ghx"
    tree = ET.parse(ghx_path)
    root = tree.getroot()

    print("=== RASTREANDO CONEXIONES DE RH_IN:Cantidada de Cajones ===")
    
    # 1. Encontrar el InstanceGuid del objeto RH_IN:Cantidada de Cajones
    target_guid = None
    for chunk in root.iter("chunk"):
        if chunk.attrib.get("name") == "Object":
            nick_item = chunk.find("items/item[@name='NickName']")
            guid_item = chunk.find("items/item[@name='InstanceGuid']")
            name_item = chunk.find("items/item[@name='Name']")
            
            if nick_item is not None and "Cantidada de Cajones" in str(nick_item.text):
                target_guid = guid_item.text if guid_item is not None else None
                print(f"  • Componente RH_IN:Cantidada de Cajones -> Name: '{name_item.text if name_item is not None else ''}', Guid: {target_guid}")

    # 2. Rastrear si este Guid está en algún alambre (Wire/Source)
    if target_guid:
        wire_matches = []
        for item in root.iter("item"):
            if item.text and target_guid.lower() in item.text.lower():
                wire_matches.append(item)
        print(f"  • Menciones de este GUID en los cables de conexión del XML: {len(wire_matches)}")

if __name__ == "__main__":
    trace_guid()
