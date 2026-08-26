import xml.etree.ElementTree as ET
import base64
import requests
import shutil

def restore_and_enable_sliders():
    print("=== Configurando Grupos RH_IN en los Sliders de la Versión Preferida ===")
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

    # 1. Mapear InstanceGuids de sliders
    slider_guids = {}
    for item in root.iter("chunk"):
        guid_elem = item.find("./chunks/chunk[@name='Container']/items/item[@name='InstanceGuid']")
        if guid_elem is None:
            guid_elem = item.find("./items/item[@name='InstanceGuid']")
            
        name_elem = item.find("./items/item[@name='Name']")
        nick_elem = item.find("./chunks/chunk[@name='Container']/items/item[@name='NickName']")
        if nick_elem is None:
            nick_elem = item.find("./items/item[@name='NickName']")
            
        if guid_elem is not None and guid_elem.text:
            guid = guid_elem.text.strip()
            name = name_elem.text.strip() if (name_elem is not None and name_elem.text) else ""
            nick = nick_elem.text.strip() if (nick_elem is not None and nick_elem.text) else ""
            
            if name == "Number Slider" or any(st in nick.lower() for st in slider_targets.keys()):
                slider_guids[guid] = nick or name

    # 2. Etiquetar los Grupos contenedores de los Sliders como RH_IN:<Nombre>
    for item in root.iter("chunk"):
        name_elem = item.find("./items/item[@name='Name']")
        if name_elem is not None and name_elem.text == "Group":
            container = item.find("./chunks/chunk[@name='Container']")
            if container is not None:
                items_block = container.find("./items")
                if items_block is not None:
                    nick_item = items_block.find("./item[@name='NickName']")
                    contained = [it.text.strip() for it in items_block.findall("./item[@name='ID']") if it.text]
                    
                    for s_guid, s_name in slider_guids.items():
                        if s_guid in contained:
                            for st_k, rh_v in slider_targets.items():
                                if st_k in s_name.lower():
                                    if nick_item is not None:
                                        nick_item.text = rh_v

    # 3. Mantener los grupos de salida preferidos (TapaLuz y Frente de Cajon)
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
    print("[OK] Sliders activados con RH_IN en los Grupos.")

    # Diagnosticar /io
    with open(dst, "r", encoding="utf-8") as f:
        xml_str = f.read()
    b64_algo = base64.b64encode(xml_str.encode("utf-8")).decode("utf-8")
    res = requests.post("http://localhost:5000/io", json={"algo": b64_algo})
    data = res.json()
    print(f"\n--- DIAGNÓSTICO RHINOCOMPUTE /io ---")
    print(f"INPUTS DETECTADOS ({len(data.get('Inputs', []))}):")
    for inp in data.get("Inputs", []):
        print(f"  • Input: '{inp.get('Name')}' ({inp.get('ParamType')})")

if __name__ == "__main__":
    restore_and_enable_sliders()
