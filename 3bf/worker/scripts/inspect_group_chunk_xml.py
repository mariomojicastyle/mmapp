import xml.etree.ElementTree as ET

def inspect_group_container(ghx_path):
    tree = ET.parse(ghx_path)
    root = tree.getroot()
    
    for item in root.iter("chunk"):
        name_elem = item.find("./items/item[@name='Name']")
        if name_elem is not None and name_elem.text == "Group":
            print("\n--- CHUNK GROUP CONTAINER ---")
            container = item.find("./chunks/chunk[@name='Container']")
            if container is not None:
                for sub in container:
                    print("  Sub tag:", sub.tag)
                    if sub.tag == "items":
                        for it in sub:
                            print("    Item name:", it.attrib.get("name"), "Text:", it.text)
                    elif sub.tag == "chunks":
                        for ch in sub:
                            print("    Sub-chunk:", ch.attrib.get("name"))
                            for sub_it in ch.iter("item"):
                                print("      Sub-item name:", sub_it.attrib.get("name"), "Text:", sub_it.text)
            break

if __name__ == "__main__":
    inspect_group_container(r"C:\Desarrollo\mmapp\temporal\Cajon_Experimental_ShapeDriver_02.ghx")
