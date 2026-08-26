import xml.etree.ElementTree as ET
import base64
import requests
import shutil

def build_15_piece_ghx():
    print("=== Generando versión completa de 15 piezas reales (Frentes, Posteriores, Estructura) ===")
    src = r"C:\Desarrollo\mmapp\temporal\Cajon_Experimental_ShapeDriver_02.ghx"
    dst = r"C:\Desarrollo\mmapp\temporal\Cajon_Experimento_Viktor.ghx"
    dst_compute = r"C:\Desarrollo\mmapp\temporal\Cajon_Experimento_Viktor_RhinoCompute.ghx"

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

    guid_to_info = {}
    slider_guids = {}
    geom_guids = {}
    
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
            info = nick or name
            guid_to_info[guid] = info
            
            if name == "Number Slider" or any(st in nick.lower() for st in slider_targets.keys()):
                slider_guids[guid] = nick or info
            elif name in ["Geometry", "BRep", "Mesh", "Box", "Surface"] or any(k in nick.lower() for k in ["lateral", "cubierta", "frente", "posterior", "tapa", "piso"]):
                geom_guids[guid] = nick or info

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
                            target_name = f"RH_IN:{s_name.replace('RH_IN:', '')}"
                            if nick_item is not None:
                                nick_item.text = target_name

                    for g_guid, g_name in geom_guids.items():
                        if g_guid in contained:
                            clean_name = g_name.replace('RH_OUT:', '').strip()
                            target_name = f"RH_OUT:{clean_name}"
                            if nick_item is not None and (not nick_item.text or nick_item.text in ["None", "A group of Grasshopper objects"]):
                                nick_item.text = target_name
                                
                    # Forzar etiquetado si el grupo contiene el texto frente de cajon
                    if nick_item is not None and nick_item.text and "frente" in nick_item.text.lower():
                        nick_item.text = "RH_OUT:Frente de Cajon"

    tree.write(dst, encoding="utf-8", xml_declaration=False)
    shutil.copyfile(dst, dst_compute)
    print(f"[OK] Archivo generado e integrado en {dst}")

    # Probar /io y /grasshopper
    with open(dst, "r", encoding="utf-8") as f:
        xml_str = f.read()
    b64_algo = base64.b64encode(xml_str.encode("utf-8")).decode("utf-8")
    
    res_io = requests.post("http://localhost:5000/io", json={"algo": b64_algo})
    print("\nSTATUS /io:", res_io.status_code)
    io_data = res_io.json()
    print(f"OUTPUTS ({len(io_data.get('Outputs', []))}):")
    for out in io_data.get("Outputs", []):
        print(f"  • Output: '{out.get('Name')}' ({out.get('ParamType')})")

if __name__ == "__main__":
    build_15_piece_ghx()
