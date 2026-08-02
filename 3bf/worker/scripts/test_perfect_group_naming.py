import xml.etree.ElementTree as ET
import base64
import requests

def fix_group_nicknames(input_ghx, output_ghx):
    print("=== Configurando Nombres de Grupos en Container -> items -> NickName ===")
    tree = ET.parse(input_ghx)
    root = tree.getroot()
    
    guid_to_info = {}
    slider_guids = {}
    geom_guids = {}
    
    for item in root.iter("chunk"):
        guid_item = item.find("./chunks/chunk[@name='Container']/items/item[@name='InstanceGuid']")
        if guid_item is None:
            guid_item = item.find("./items/item[@name='InstanceGuid']")
            
        name_elem = item.find("./items/item[@name='Name']")
        nick_elem = item.find("./chunks/chunk[@name='Container']/items/item[@name='NickName']")
        if nick_elem is None:
            nick_elem = item.find("./items/item[@name='NickName']")
            
        if guid_item is not None and guid_item.text:
            guid = guid_item.text.strip()
            name = name_elem.text.strip() if (name_elem is not None and name_elem.text) else ""
            nick = nick_elem.text.strip() if (nick_elem is not None and nick_elem.text) else ""
            
            info = nick or name
            guid_to_info[guid] = info
            
            if name == "Number Slider" or nick in ["Ancho", "Alto", "Profundidad", "Abrir Cajones", "Cantidada de Cajones"]:
                slider_guids[guid] = nick or info
            elif name in ["Geometry", "BRep", "Mesh", "Box", "Surface"] or any(k in nick for k in ["Lateral", "Cubierta", "Frente", "Posterior", "Tapa", "Piso"]):
                geom_guids[guid] = nick or info

    print(f"Total Sliders detectados por GUID: {len(slider_guids)}")
    for g, n in slider_guids.items():
        print(f"  * Slider GUID {g}: '{n}'")

    tagged_inputs = 0
    tagged_outputs = 0
    
    for item in root.iter("chunk"):
        name_elem = item.find("./items/item[@name='Name']")
        if name_elem is not None and name_elem.text == "Group":
            container = item.find("./chunks/chunk[@name='Container']")
            if container is not None:
                items_block = container.find("./items")
                if items_block is not None:
                    nick_item = items_block.find("./item[@name='NickName']")
                    
                    contained = [it.text.strip() for it in items_block.findall("./item[@name='ID']") if it.text]
                    
                    # A) Verificar si contiene un Slider
                    for s_guid, s_name in slider_guids.items():
                        if s_guid in contained:
                            target_name = f"RH_IN:{s_name}"
                            if nick_item is not None:
                                nick_item.text = target_name
                                tagged_inputs += 1
                                print(f"  [GRUPO ENTRADA DETECTADO] NickName set to '{target_name}' (contiene slider {s_name})")

                    # B) Verificar si contiene componentes de geometría
                    for g_guid, g_name in geom_guids.items():
                        if g_guid in contained:
                            target_name = f"RH_OUT:{g_name}"
                            if nick_item is not None and (not nick_item.text or nick_item.text in ["None", "A group of Grasshopper objects"]):
                                nick_item.text = target_name
                                tagged_outputs += 1
                                print(f"  [GRUPO SALIDA DETECTADO] NickName set to '{target_name}' (contiene {g_name})")

    tree.write(output_ghx, encoding="utf-8", xml_declaration=False)
    print(f"\n[OK] Grupos etiquetados con exito: {tagged_inputs} Entradas RH_IN, {tagged_outputs} Salidas RH_OUT")

    with open(output_ghx, "r", encoding="utf-8") as f:
        xml_str = f.read()
    b64_algo = base64.b64encode(xml_str.encode("utf-8")).decode("utf-8")
    
    res = requests.post("http://localhost:5000/io", json={"algo": b64_algo})
    print("\n--- Respuesta Diagnostico RhinoCompute /io ---")
    print("STATUS /io:", res.status_code)
    data = res.json()
    print(f"INPUTS DETECTADOS ({len(data.get('Inputs', []))}):")
    for inp in data.get("Inputs", []):
        print(f"  * Input: '{inp.get('Name')}' ({inp.get('ParamType')})")
    print(f"OUTPUTS DETECTADOS ({len(data.get('Outputs', []))}):")
    for out in data.get("Outputs", []):
        print(f"  * Output: '{out.get('Name')}' ({out.get('ParamType')})")

if __name__ == "__main__":
    src = r"C:\Desarrollo\mmapp\temporal\Cajon_Experimental_ShapeDriver_02.ghx"
    dst = r"C:\Desarrollo\mmapp\temporal\Cajon_Experimento_Viktor_RhinoCompute.ghx"
    fix_group_nicknames(src, dst)
