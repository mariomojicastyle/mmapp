import xml.etree.ElementTree as ET
import os

def patch_variant_vl_nicknames():
    folder = r"C:\Desarrollo\mmapp\temporal"
    variant_files = [
        "Cajon_Experimento_Viktor_1cajon.ghx",
        "Cajon_Experimento_Viktor_2cajones.ghx",
        "Cajon_Experimento_Viktor_3cajones.ghx"
    ]

    for fname in variant_files:
        fpath = os.path.join(folder, fname)
        if not os.path.exists(fpath):
            continue

        tree = ET.parse(fpath)
        root = tree.getroot()
        count = 0

        for chunk in root.iter("chunk"):
            if chunk.attrib.get("name") == "Object":
                name_item = chunk.find("items/item[@name='Name']")
                if name_item is not None and name_item.text == "Value List":
                    container = chunk.find("chunks/chunk[@name='Container']")
                    if container is not None:
                        nick_item = container.find("items/item[@name='NickName']")
                        # Buscar si las opciones internas dicen 351 o 400
                        user_list = ""
                        for sub in chunk.iter("item"):
                            if sub.text and ("351" in sub.text or "400" in sub.text):
                                user_list += sub.text

                        if "351" in user_list or "400" in user_list:
                            if nick_item is not None:
                                nick_item.text = "RH_IN:Profundidad cajon"
                                count += 1
                                print(f"  • [{fname}] Value List de Profundidad cajon asignado NickName='RH_IN:Profundidad cajon'")

        tree.write(fpath, encoding="utf-8", xml_declaration=True)

if __name__ == "__main__":
    patch_variant_vl_nicknames()
