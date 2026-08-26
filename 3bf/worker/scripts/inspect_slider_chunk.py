import xml.etree.ElementTree as ET

def inspect_slider(ghx_path):
    tree = ET.parse(ghx_path)
    root = tree.getroot()
    
    for item in root.iter("chunk"):
        name_elem = item.find("./items/item[@name='Name']")
        if name_elem is not None and name_elem.text == "Number Slider":
            print("\n--- CHUNK NUMBER SLIDER ---")
            for sub in item.iter("item"):
                print("  Item name:", sub.attrib.get("name"), "Text:", sub.text)
            break

if __name__ == "__main__":
    inspect_slider(r"C:\Desarrollo\mmapp\temporal\Cajon_Experimental_ShapeDriver_02.ghx")
