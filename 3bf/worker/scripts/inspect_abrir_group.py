import xml.etree.ElementTree as ET

def inspect_abrir_group(ghx_path):
    tree = ET.parse(ghx_path)
    root = tree.getroot()
    
    print("=== Inspeccionando Grupo de Abrir Cajones ===")
    
    for item in root.iter("chunk"):
        name_elem = item.find("./items/item[@name='Name']")
        if name_elem is not None and name_elem.text == "Group":
            container = item.find("./chunks/chunk[@name='Container']")
            if container is not None:
                items_block = container.find("./items")
                if items_block is not None:
                    nick_item = items_block.find("./item[@name='NickName']")
                    if nick_item is not None and nick_item.text and "Abrir" in nick_item.text:
                        print(f"Grupo encontrado: '{nick_item.text}'")
                        for it in items_block:
                            print(f"  Item {it.attrib.get('name')}: {it.text}")

if __name__ == "__main__":
    inspect_abrir_group(r"C:\Desarrollo\mmapp\temporal\Cajon_Experimento_Viktor_RhinoCompute.ghx")
