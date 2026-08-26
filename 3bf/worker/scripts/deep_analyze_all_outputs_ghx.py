import xml.etree.ElementTree as ET

def deep_analyze_ghx(ghx_path):
    tree = ET.parse(ghx_path)
    root = tree.getroot()
    
    print(f"=== ANÁLISIS PROFUNDO DE COMPONENTES DE GEOMETRÍA EN {ghx_path} ===")
    
    geometries = []
    groups = []
    params = []
    
    for item in root.iter("chunk"):
        name_elem = item.find("./items/item[@name='Name']")
        nick_elem = item.find("./items/item[@name='NickName']")
        guid_elem = item.find("./items/item[@name='InstanceGuid']")
        
        name = name_elem.text.strip() if (name_elem is not None and name_elem.text) else ""
        nick = nick_elem.text.strip() if (nick_elem is not None and nick_elem.text) else ""
        guid = guid_elem.text.strip() if (guid_elem is not None and guid_elem.text) else ""
        
        if name in ["Geometry", "BRep", "Mesh", "Surface", "Box", "Extrusion"] or "RH_OUT" in nick:
            geometries.append({
                "type": name,
                "nick": nick,
                "guid": guid
            })
        elif name == "Group":
            container = item.find("./chunks/chunk[@name='Container']")
            group_nick = ""
            if container is not None:
                items_block = container.find("./items")
                if items_block is not None:
                    n_item = items_block.find("./item[@name='NickName']")
                    if n_item is not None and n_item.text:
                        group_nick = n_item.text.strip()
            groups.append({
                "nick": group_nick,
                "guid": guid
            })

    print(f"\n--- TOTAL PARÁMETROS / GEOMETRÍAS ENCONTRADAS: {len(geometries)} ---")
    for g in geometries:
        if g['nick']:
            print(f"  • Geometría Param: '{g['nick']}' (Tipo: {g['type']}) | GUID: {g['guid']}")
            
    print(f"\n--- TOTAL GRUPOS ENCONTRADOS EN GH: {len(groups)} ---")
    for gr in groups:
        if gr['nick'] and gr['nick'] not in ["None", "A group of Grasshopper objects"]:
            print(f"  • Grupo GH: '{gr['nick']}' | GUID: {gr['guid']}")

if __name__ == "__main__":
    deep_analyze_ghx(r"C:\Desarrollo\mmapp\temporal\Cajon_Experimental_ShapeDriver_02.ghx")
