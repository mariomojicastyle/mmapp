import xml.etree.ElementTree as ET
import base64
import requests
import shutil

def restore_working_state():
    print("=== Restaurando estado óptimo y funcional de Cajon_Experimento_Viktor.ghx ===")
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

    output_names = {
        "TapaLuz": "RH_OUT:TapaLuz",
        "Tapa Luz": "RH_OUT:TapaLuz",
        "Frente de Cajon": "RH_OUT:Frente de Cajon",
        "Lateral Izquierdo": "RH_OUT:Lateral Izquierdo",
        "Lateral Derecho": "RH_OUT:Lateral Derecho",
        "Cubierta Superior": "RH_OUT:Cubierta Superior",
        "Cubierta Inferior": "RH_OUT:Cubierta Inferior",
        "Lateral Izq Cajon": "RH_OUT:Lateral Izq Cajon",
        "Lateral Der Cajon": "RH_OUT:Lateral Der Cajon"
    }

    for item in root.iter("chunk"):
        name_elem = item.find("./items/item[@name='Name']")
        if name_elem is not None and name_elem.text == "Group":
            container = item.find("./chunks/chunk[@name='Container']")
            if container is not None:
                items_block = container.find("./items")
                if items_block is not None:
                    nick_item = items_block.find("./item[@name='NickName']")
                    if nick_item is not None and nick_item.text:
                        cur_nick = nick_item.text.strip()
                        for orig_k, rh_v in output_names.items():
                            if orig_k in cur_nick:
                                nick_item.text = rh_v

    tree.write(dst, encoding="utf-8", xml_declaration=False)
    shutil.copyfile(dst, r"C:\Desarrollo\mmapp\temporal\Cajon_Experimento_Viktor.ghx")
    print("[OK] Estado optimo restaurado en Cajon_Experimento_Viktor.ghx")

if __name__ == "__main__":
    restore_working_state()
