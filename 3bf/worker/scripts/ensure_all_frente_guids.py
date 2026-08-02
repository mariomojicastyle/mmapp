import xml.etree.ElementTree as ET
import base64
import requests
import shutil

def ensure_all_frente():
    src = r"C:\Desarrollo\mmapp\temporal\Cajon_Experimento_Viktor_RhinoCompute.ghx"
    dst = r"C:\Desarrollo\mmapp\temporal\Cajon_Experimento_Viktor_RhinoCompute.ghx"
    
    tree = ET.parse(src)
    root = tree.getroot()
    
    for item in root.iter("chunk"):
        for sub in item.iter("item"):
            if sub.attrib.get("name") in ["NickName", "Name"] and sub.text and "Frente" in sub.text:
                sub.text = "RH_OUT:Frente de Cajon"

    for item in root.iter("chunk"):
        name_elem = item.find("./items/item[@name='Name']")
        if name_elem is not None and name_elem.text == "Group":
            container = item.find("./chunks/chunk[@name='Container']")
            if container is not None:
                items_block = container.find("./items")
                if items_block is not None:
                    nick_item = items_block.find("./item[@name='NickName']")
                    if nick_item is not None and nick_item.text and "Frente" in nick_item.text:
                        nick_item.text = "RH_OUT:Frente de Cajon"

    tree.write(dst, encoding="utf-8", xml_declaration=False)
    shutil.copyfile(dst, r"C:\Desarrollo\mmapp\temporal\Cajon_Experimento_Viktor.ghx")
    print("[OK] Frentes de Cajon completamente asegurados.")

if __name__ == "__main__":
    ensure_all_frente()
