import xml.etree.ElementTree as ET

def trace_ancho_connections(ghx_path):
    tree = ET.parse(ghx_path)
    root = tree.getroot()
    
    ancho_guid = "625f42bc-be0f-47f8-a2b4-b934dea0a0d7"
    print(f"=== Rastrenado conexiones del Slider Ancho (GUID: {ancho_guid}) en {ghx_path} ===")
    
    # 1. Buscar el chunk del Slider Ancho
    ancho_chunk = None
    for item in root.iter("chunk"):
        guid_elem = item.find("./items/item[@name='InstanceGuid']")
        if guid_elem is not None and guid_elem.text == ancho_guid:
            ancho_chunk = item
            break
            
    if ancho_chunk is not None:
        print("\n--- CHUNK DEL SLIDER ANCHO ENCONTRADO ---")
        for it in ancho_chunk.iter("item"):
            print(f"  {it.attrib.get('name')}: {it.text}")

    # 2. Buscar en todos los componentes del grafo cuáles se conectan al GUID del Slider Ancho
    connected_components = []
    for item in root.iter("chunk"):
        # Buscar si en los inputs (Sources) de algún componente está el GUID de Ancho
        name_elem = item.find("./items/item[@name='Name']")
        nick_elem = item.find("./items/item[@name='NickName']")
        guid_elem = item.find("./items/item[@name='InstanceGuid']")
        
        comp_name = name_elem.text.strip() if (name_elem is not None and name_elem.text) else ""
        comp_nick = nick_elem.text.strip() if (nick_elem is not None and nick_elem.text) else ""
        comp_guid = guid_elem.text.strip() if (guid_elem is not None and guid_elem.text) else ""
        
        for sub in item.iter("item"):
            if sub.attrib.get("type_name") == "gh_guid" and sub.text == ancho_guid:
                connected_components.append({
                    "name": comp_name,
                    "nick": comp_nick,
                    "guid": comp_guid
                })
                break

    print(f"\n--- COMPONENTES CONECTADOS AL SLIDER ANCHO ({len(connected_components)}) ---")
    for cc in connected_components:
        print(f"  • Componente: '{cc['name']}' | NickName: '{cc['nick']}' | GUID: {cc['guid']}")

if __name__ == "__main__":
    trace_ancho_connections(r"C:\Desarrollo\mmapp\temporal\Cajon_Experimental_ShapeDriver_02.ghx")
