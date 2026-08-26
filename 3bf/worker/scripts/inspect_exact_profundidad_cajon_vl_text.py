import xml.etree.ElementTree as ET

def inspect_exact_userlist():
    ghx_path = r"C:\Desarrollo\mmapp\temporal\Cajon_Experimento_Viktor_3cajones.ghx"
    tree = ET.parse(ghx_path)
    root = tree.getroot()

    print("=== USERLIST EXACTO DE RH_IN:Profundidad cajon ===")
    for chunk in root.iter("chunk"):
        if chunk.attrib.get("name") == "Object":
            container = chunk.find("chunks/chunk[@name='Container']")
            nick = container.find("items/item[@name='NickName']") if container is not None else None
            if nick is not None and nick.text == "RH_IN:Profundidad cajon":
                for sub in chunk.iter("item"):
                    if sub.attrib.get("name") in ["UserList", "Item", "Expression", "Name"]:
                        print(f"  • {sub.attrib.get('name')}: '{sub.text}'")

if __name__ == "__main__":
    inspect_exact_userlist()
