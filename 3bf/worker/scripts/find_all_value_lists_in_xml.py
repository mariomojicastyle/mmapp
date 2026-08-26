import xml.etree.ElementTree as ET

def find_vl():
    ghx_path = r"C:\Desarrollo\mmapp\temporal\Cajon_Experimento_Viktor.ghx"
    tree = ET.parse(ghx_path)
    root = tree.getroot()

    print("=== TODOS LOS VALUE LISTS EN EL XML ===")
    for chunk in root.iter("chunk"):
        if chunk.attrib.get("name") == "Object":
            name_item = chunk.find("items/item[@name='Name']")
            nick_item = chunk.find("items/item[@name='NickName']")
            if name_item is not None and "Value List" in str(name_item.text):
                print(f"\nValue List Component (NickName: '{nick_item.text if nick_item is not None else ''}')")
                for item in chunk.iter("item"):
                    if item.attrib.get("name") in ["UserList", "Item", "Value", "NickName"]:
                        print(f"   • {item.attrib.get('name')}: {item.text}")

if __name__ == "__main__":
    find_vl()
