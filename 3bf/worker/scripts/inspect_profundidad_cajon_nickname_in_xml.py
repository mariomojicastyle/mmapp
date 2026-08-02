import xml.etree.ElementTree as ET

def inspect_prof_xml():
    ghx_path = r"C:\Desarrollo\mmapp\temporal\Cajon_Experimento_Viktor_3cajones.ghx"
    tree = ET.parse(ghx_path)
    root = tree.getroot()

    print("=== INSPECCIONANDO NICKNAME DE PROFUNDIDAD CAJON ===")
    for chunk in root.iter("chunk"):
        if chunk.attrib.get("name") == "Object":
            xml_str = ET.tostring(chunk, encoding="utf-8").decode("utf-8")
            if "Profundidad" in xml_str and "cajon" in xml_str.lower():
                name_i = chunk.find("items/item[@name='Name']")
                container = chunk.find("chunks/chunk[@name='Container']")
                nick_i = container.find("items/item[@name='NickName']") if container is not None else None
                print(f"Objeto -> Name: '{name_i.text if name_i is not None else ''}', NickName: '{nick_i.text if nick_i is not None else ''}'")

if __name__ == "__main__":
    inspect_prof_xml()
