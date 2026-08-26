import xml.etree.ElementTree as ET

def dump_all_matching_cajones():
    ghx_path = r"C:\Desarrollo\mmapp\temporal\Cajon_Experimento_Viktor.ghx"
    tree = ET.parse(ghx_path)
    root = tree.getroot()

    print("=== DUMP COMPONENTES CON 'Cantidada de Cajones' ===")
    for chunk in root.iter("chunk"):
        if chunk.attrib.get("name") == "Object":
            xml_str = ET.tostring(chunk, encoding="utf-8").decode("utf-8")
            if "Cantidada de Cajones" in xml_str:
                name_i = chunk.find("items/item[@name='Name']")
                nick_i = chunk.find("items/item[@name='NickName']")
                guid_i = chunk.find("items/item[@name='InstanceGuid']")
                print(f"\nObjeto -> Name: '{name_i.text if name_i is not None else ''}', NickName: '{nick_i.text if nick_i is not None else ''}', Guid: '{guid_i.text if guid_i is not None else ''}'")

if __name__ == "__main__":
    dump_all_matching_cajones()
