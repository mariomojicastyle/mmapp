import xml.etree.ElementTree as ET

def dump_vl_structure():
    ghx_path = r"C:\Desarrollo\mmapp\temporal\Cajon_Experimento_Viktor.ghx"
    tree = ET.parse(ghx_path)
    root = tree.getroot()

    print("=== DUMP ESTRUCTURA COMPLETA DE VALUE LIST ===")
    for chunk in root.iter("chunk"):
        if chunk.attrib.get("name") == "Object":
            xml_str = ET.tostring(chunk, encoding="utf-8").decode("utf-8")
            if "Cantidada de Cajones" in xml_str and "Value List" in xml_str:
                print(xml_str[:1500])

if __name__ == "__main__":
    dump_vl_structure()
