import xml.etree.ElementTree as ET

def find_custom_parameters(filepath):
    tree = ET.parse(filepath)
    root = tree.getroot()
    
    # Buscar todos los objetos de tipo Component / Slider
    objects = []
    
    for chunk in root.iter("chunk"):
        chunk_name = chunk.attrib.get("name")
        if chunk_name == "Object":
            # Extraer Name, NickName, Description
            name = ""
            nickname = ""
            val = ""
            
            for item in chunk.iter("item"):
                item_name = item.attrib.get("name")
                if item_name == "Name" and item.text:
                    name = item.text
                elif item_name == "NickName" and item.text:
                    nickname = item.text
                elif item_name == "Value" and item.text:
                    val = item.text
                    
            if name or nickname:
                objects.append({"name": name, "nickname": nickname, "value": val})

    print(f"=== Objetos y Nodos de Grasshopper encontrados ({len(objects)}) ===")
    seen = set()
    for obj in objects:
        key = (obj['name'], obj['nickname'])
        if key not in seen and obj['name'] not in ['Group', 'Grasshopper', 'Panel', 'Slider']:
            seen.add(key)
            print(f"  • Componente: '{obj['name']}' | NickName: '{obj['nickname']}' | Valor: {obj['value']}")

if __name__ == "__main__":
    find_custom_parameters(r"C:\Desarrollo\mmapp\temporal\Cajon_Experimental_ShapeDriver_02.ghx")
