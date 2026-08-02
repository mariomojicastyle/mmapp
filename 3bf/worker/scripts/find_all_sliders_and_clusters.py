import xml.etree.ElementTree as ET

def find_all_sliders_detail(ghx_path):
    tree = ET.parse(ghx_path)
    root = tree.getroot()
    
    print(f"=== DETALLE COMPLETO DE SLIDERS EN {ghx_path} ===")
    
    for item in root.iter("chunk"):
        name_elem = item.find("./items/item[@name='Name']")
        if name_elem is not None and name_elem.text == "Number Slider":
            nick = ""
            val = ""
            min_val = ""
            max_val = ""
            guid = ""
            
            for sub in item.iter("item"):
                n = sub.attrib.get("name")
                if n == "NickName" and sub.text:
                    nick = sub.text.strip()
                elif n == "Value" and sub.text:
                    val = sub.text.strip()
                elif n == "Min" and sub.text:
                    min_val = sub.text.strip()
                elif n == "Max" and sub.text:
                    max_val = sub.text.strip()
                elif n == "InstanceGuid" and sub.text:
                    guid = sub.text.strip()
                    
            print(f"  • Slider NickName: '{nick}' | Valor Actual: {val} (Min: {min_val}, Max: {max_val}) | GUID: {guid}")

if __name__ == "__main__":
    find_all_sliders_detail(r"C:\Desarrollo\mmapp\temporal\Cajon_Experimental_ShapeDriver_02.ghx")
