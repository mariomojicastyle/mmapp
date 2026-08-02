import xml.etree.ElementTree as ET
import base64
import requests
import shutil

def fix_frente_cajon():
    print("=== Ajustando RH_OUT:Frente de Cajon para extraer los 3 frentes calculados ===")
    src = r"C:\Desarrollo\mmapp\temporal\Cajon_Experimental_ShapeDriver_02.ghx"
    dst = r"C:\Desarrollo\mmapp\temporal\Cajon_Experimento_Viktor_RhinoCompute.ghx"
    
    tree = ET.parse(src)
    root = tree.getroot()

    slider_targets = {
        "ancho": "RH_IN:Ancho",
        "profundidad": "RH_IN:Profundidad",
        "alto": "RH_IN:Alto",
        "cantidada de cajones": "RH_IN:Cantidada de Cajones",
        "abrir cajones": "RH_IN:Abrir Cajones"
    }

    for item in root.iter("chunk"):
        name_elem = item.find("./items/item[@name='Name']")
        if name_elem is not None and name_elem.text == "Number Slider":
            for sub in item.iter("item"):
                if sub.attrib.get("name") == "NickName" and sub.text:
                    t = sub.text.strip().lower()
                    for key, rh_name in slider_targets.items():
                        if key == t:
                            sub.text = rh_name

    for item in root.iter("chunk"):
        guid_elem = item.find("./items/item[@name='InstanceGuid']")
        nick_elem = item.find("./items/item[@name='NickName']")
        if guid_elem is not None and guid_elem.text == "24d5a658-4462-4439-9783-ca5c1fb406a0":
            if nick_elem is not None:
                nick_elem.text = "RH_OUT:Frente de Cajon"
                print("  * Asignado RH_OUT:Frente de Cajon al parámetro GUID 24d5a658-4462-4439-9783-ca5c1fb406a0")

    for item in root.iter("chunk"):
        name_elem = item.find("./items/item[@name='Name']")
        if name_elem is not None and name_elem.text == "Group":
            container = item.find("./chunks/chunk[@name='Container']")
            if container is not None:
                items_block = container.find("./items")
                if items_block is not None:
                    nick_item = items_block.find("./item[@name='NickName']")
                    contained = [it.text.strip() for it in items_block.findall("./item[@name='ID']") if it.text]
                    if "24d5a658-4462-4439-9783-ca5c1fb406a0" in contained:
                        if nick_item is not None:
                            nick_item.text = "RH_OUT:Frente de Cajon"

    tree.write(dst, encoding="utf-8", xml_declaration=False)
    shutil.copyfile(dst, r"C:\Desarrollo\mmapp\temporal\Cajon_Experimento_Viktor.ghx")
    print("[OK] Definicion final .ghx guardada.")

if __name__ == "__main__":
    fix_frente_cajon()
