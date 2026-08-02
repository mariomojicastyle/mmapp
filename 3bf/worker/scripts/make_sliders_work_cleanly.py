import xml.etree.ElementTree as ET
import base64
import requests
import shutil

def enable_all_sliders_cleanly():
    print("=== Habilitando Sliders Ancho, Alto, Profundidad y Abrir Cajones ===")
    src = r"C:\Desarrollo\mmapp\temporal\Cajon_Experimental_ShapeDriver_02.ghx"
    dst = r"C:\Desarrollo\mmapp\temporal\Cajon_Experimento_Viktor_RhinoCompute.ghx"
    
    tree = ET.parse(src)
    root = tree.getroot()
    
    slider_targets = {
        "ancho": "RH_IN:Ancho",
        "profundidad": "RH_IN:Profundidad",
        "alto": "RH_IN:Alto",
        "abrir cajones": "RH_IN:Abrir Cajones"
    }

    # 1. Recorrer los Number Sliders
    for item in root.iter("chunk"):
        name_elem = item.find("./items/item[@name='Name']")
        if name_elem is not None and name_elem.text == "Number Slider":
            # Buscar el NickName del slider
            for sub in item.iter("item"):
                if sub.attrib.get("name") == "NickName" and sub.text:
                    t = sub.text.strip().lower()
                    for key, rh_name in slider_targets.items():
                        if key == t:
                            sub.text = rh_name

    # 2. Asignar RH_OUT solo a los grupos principales preferidos (TapaLuz y Frente de Cajon)
    for item in root.iter("chunk"):
        name_elem = item.find("./items/item[@name='Name']")
        if name_elem is not None and name_elem.text == "Group":
            container = item.find("./chunks/chunk[@name='Container']")
            if container is not None:
                items_block = container.find("./items")
                if items_block is not None:
                    nick_item = items_block.find("./item[@name='NickName']")
                    if nick_item is not None and nick_item.text:
                        txt = nick_item.text.strip()
                        if "TapaLuz" in txt or "Tapa Luz" in txt:
                            nick_item.text = "RH_OUT:TapaLuz"
                        elif "Frente de Cajon" in txt:
                            nick_item.text = "RH_OUT:Frente de Cajon"

    tree.write(dst, encoding="utf-8", xml_declaration=False)
    shutil.copyfile(dst, r"C:\Desarrollo\mmapp\temporal\Cajon_Experimento_Viktor.ghx")
    print("[OK] Sliders habilitados y versión restaurada a la preferencia visual del usuario.")

if __name__ == "__main__":
    enable_all_sliders_cleanly()
