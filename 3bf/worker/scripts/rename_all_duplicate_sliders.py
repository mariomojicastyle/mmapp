import xml.etree.ElementTree as ET
import base64
import requests

def fix_all_duplicate_sliders(input_ghx, output_ghx):
    print("=== Renombrando TODOS los Sliders Duplicados a sus nombres RH_IN correspondientes ===")
    tree = ET.parse(input_ghx)
    root = tree.getroot()
    
    target_map = {
        "ancho": "RH_IN:Ancho",
        "profundidad": "RH_IN:Profundidad",
        "alto": "RH_IN:Alto",
        "cajones": "RH_IN:Cantidada de Cajones",
        "abrir": "RH_IN:Abrir Cajones"
    }

    count = 0
    for item in root.iter("chunk"):
        name_elem = item.find("./items/item[@name='Name']")
        if name_elem is not None and name_elem.text == "Number Slider":
            for sub in item.iter("item"):
                if sub.attrib.get("name") == "NickName" and sub.text:
                    t = sub.text.strip().lower()
                    for key, rh_name in target_map.items():
                        if key in t:
                            sub.text = rh_name
                            count += 1
                            print(f"  * Slider (original '{t}') -> '{rh_name}'")

    tree.write(output_ghx, encoding="utf-8", xml_declaration=False)
    print(f"[OK] Total sliders renombrados: {count}")

if __name__ == "__main__":
    src = r"C:\Desarrollo\mmapp\temporal\Cajon_Experimental_ShapeDriver_02.ghx"
    dst = r"C:\Desarrollo\mmapp\temporal\Cajon_Experimento_Viktor_RhinoCompute.ghx"
    fix_all_duplicate_sliders(src, dst)
