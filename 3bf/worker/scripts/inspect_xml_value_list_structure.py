import xml.etree.ElementTree as ET

def inspect_xml():
    ghx_path = r"C:\Desarrollo\mmapp\temporal\Cajon_Experimento_Viktor.ghx"
    tree = ET.parse(ghx_path)
    root = tree.getroot()

    print("=== BUSCANDO EL NODO RH_IN:Cantidada de Cajones EN EL XML DE GRASSHOPPER ===")
    
    for obj in root.iter("object"):
        name_node = obj.find("items/item[@name='Name']")
        nickname_node = obj.find("items/item[@name='NickName']")
        
        name_val = name_node.text if name_node is not None else ""
        nick_val = nickname_node.text if nickname_node is not None else ""
        
        if "Cantidada de Cajones" in name_val or "Cantidada de Cajones" in nick_val or "Cajones" in name_val or "Cajones" in nick_val:
            print(f"\n[ENCONTRADO COMPONENTE] Name: '{name_val}' | NickName: '{nick_val}' | Class: {obj.attrib.get('name')}")
            for item in obj.iter("item"):
                item_name = item.attrib.get("name")
                item_text = item.text
                if item_name in ["Name", "NickName", "ValueListType", "SelectedItems", "Items"]:
                    print(f"   • Item '{item_name}': {item_text}")

if __name__ == "__main__":
    inspect_xml()
