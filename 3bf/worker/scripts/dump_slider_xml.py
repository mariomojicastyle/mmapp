import xml.etree.ElementTree as ET

def dump_slider_xml():
    ghx_path = r"C:\Desarrollo\mmapp\temporal\Cajon_Experimento_Viktor_3cajones.ghx"
    tree = ET.parse(ghx_path)
    root = tree.getroot()

    print("=== DUMP COMPLETO DE SLIDER XML EN GRASSHOPPER ===")
    for chunk in root.iter("chunk"):
        if chunk.attrib.get("name") == "Object":
            name_item = chunk.find("items/item[@name='Name']")
            if name_item is not None and "Number Slider" in str(name_item.text):
                xml_str = ET.tostring(chunk, encoding="utf-8").decode("utf-8")
                if "RH_IN:Ancho" in xml_str:
                    print(xml_str)
                    break

if __name__ == "__main__":
    dump_slider_xml()
