import xml.etree.ElementTree as ET

def inspect_vl_items():
    ghx_path = r"C:\Desarrollo\mmapp\temporal\Cajon_Experimento_Viktor.ghx"
    tree = ET.parse(ghx_path)
    root = tree.getroot()

    print("=== INSPECCIONANDO TEXTO INTERNO DEL VALUE LIST RH_IN:Cantidada de Cajones ===")
    
    for chunk in root.iter("chunk"):
        if chunk.attrib.get("name") == "Object":
            nick_item = chunk.find("items/item[@name='NickName']")
            if nick_item is not None and "Cantidada de Cajones" in str(nick_item.text):
                print(f"\n[COMPONENTE ENCONTRADO] NickName: '{nick_item.text}'")
                for item in chunk.iter("item"):
                    if item.attrib.get("name") in ["UserList", "Item", "ValueListType", "SelectedItems"]:
                        print(f"   • Item '{item.attrib.get('name')}':\n{item.text}")

if __name__ == "__main__":
    inspect_vl_items()
