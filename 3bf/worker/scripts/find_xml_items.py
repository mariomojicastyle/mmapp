import xml.etree.ElementTree as ET

def find_all_text_elements(filepath):
    tree = ET.parse(filepath)
    root = tree.getroot()
    
    found_items = []
    
    # Buscar todos los elementos <item> con name="Name" o name="Description" o name="NickName"
    for item in root.iter("item"):
        name_attr = item.attrib.get("name")
        if name_attr in ["Name", "NickName", "Description", "Value", "Min", "Max"]:
            found_items.append((name_attr, item.text))
            
    print(f"Total ítems encontrados en XML: {len(found_items)}")
    for name, val in found_items[:30]:
        print(f"  [{name}]: {val}")

if __name__ == "__main__":
    find_all_text_elements(r"C:\Desarrollo\mmapp\temporal\Cajon_Experimental_ShapeDriver_02.ghx")
