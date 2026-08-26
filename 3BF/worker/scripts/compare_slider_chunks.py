import xml.etree.ElementTree as ET

def compare_sliders(ghx_path):
    tree = ET.parse(ghx_path)
    root = tree.getroot()
    
    print("=== Comparando XML de RH_IN:Abrir Cajones vs RH_IN:Ancho ===")
    
    for item in root.iter("chunk"):
        name_elem = item.find("./items/item[@name='Name']")
        if name_elem is not None and name_elem.text == "Number Slider":
            for sub in item.iter("item"):
                if sub.attrib.get("name") == "NickName" and sub.text:
                    if "Abrir Cajones" in sub.text or "Ancho" in sub.text:
                        print(f"\n--- SLIDER CHUNK: '{sub.text}' ---")
                        for it in item.iter("item"):
                            print(f"  {it.attrib.get('name')}: '{it.text}'")
                        break

if __name__ == "__main__":
    compare_sliders(r"C:\Desarrollo\mmapp\temporal\Cajon_Experimento_Viktor_RhinoCompute.ghx")
