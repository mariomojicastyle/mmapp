import xml.etree.ElementTree as ET

def inspect_abrir_cajones(ghx_path):
    tree = ET.parse(ghx_path)
    root = tree.getroot()
    
    for item in root.iter("chunk"):
        nick_elem = item.find("./chunks/chunk[@name='Container']/items/item[@name='NickName']")
        if nick_elem is None:
            nick_elem = item.find("./items/item[@name='NickName']")
            
        if nick_elem is not None and nick_elem.text and "Abrir Cajones" in nick_elem.text:
            print("\n--- CHUNK ABRIR CAJONES ---")
            name_elem = item.find("./items/item[@name='Name']")
            print("Name:", name_elem.text if name_elem is not None else "None")
            print("NickName:", nick_elem.text)
            for sub in item.iter("item"):
                print("  Item:", sub.attrib.get("name"), "->", sub.text)
            break

if __name__ == "__main__":
    inspect_abrir_cajones(r"C:\Desarrollo\mmapp\temporal\Cajon_Experimental_ShapeDriver_02.ghx")
