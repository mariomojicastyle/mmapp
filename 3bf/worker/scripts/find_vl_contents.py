import xml.etree.ElementTree as ET

def find_vl_contents():
    ghx_path = r"C:\Desarrollo\mmapp\temporal\Cajon_Experimento_Viktor.ghx"
    tree = ET.parse(ghx_path)
    root = tree.getroot()

    print("=== BUSCANDO CONTENIDOS DE VALUE LIST EN EL XML ===")
    for chunk in root.iter("chunk"):
        if chunk.attrib.get("name") == "Object":
            name_item = chunk.find("items/item[@name='Name']")
            if name_item is not None and "Value List" in str(name_item.text):
                print("\n--- VALUE LIST OBJECT ---")
                for sub in chunk.iter("item"):
                    val_text = sub.text
                    if val_text and ("1" in val_text or "2" in val_text or "3" in val_text or "Cajon" in val_text or "Gate" in val_text):
                        print(f"  • {sub.attrib.get('name')}: {val_text}")

if __name__ == "__main__":
    find_vl_contents()
