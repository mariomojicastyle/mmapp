import xml.etree.ElementTree as ET
import base64
import requests

def inspect_and_tag_groups(input_ghx, output_ghx):
    tree = ET.parse(input_ghx)
    root = tree.getroot()
    
    print("=== Inspeccionando y Vinculando Grupos GH a Sliders y Geometrías ===")
    
    # 1. Encontrar todos los componentes y sus GUIDs o nick_names
    # En Grasshopper XML, cada objeto (Object) tiene un InstanceGuid
    guid_to_nick = {}
    slider_guids = {}
    
    for item in root.iter("chunk"):
        name_elem = item.find("./items/item[@name='Name']")
        nick_elem = item.find("./items/item[@name='NickName']")
        guid_elem = item.find("./items/item[@name='InstanceGuid']")
        
        comp_name = name_elem.text.strip() if (name_elem is not None and name_elem.text) else ""
        comp_nick = nick_elem.text.strip() if (nick_elem is not None and nick_elem.text) else ""
        guid = guid_elem.text.strip() if (guid_elem is not None and guid_elem.text) else ""
        
        if guid:
            guid_to_nick[guid] = comp_nick or comp_name
            if comp_name == "Number Slider":
                slider_guids[guid] = comp_nick
                print(f"  • Slider encontrado: Nick='{comp_nick}', GUID={guid}")

    # 2. Ahora buscar todos los chunks de tipo Group
    # Un grupo en GH tiene un array de ID (GUIDs) de los objetos contenidos
    group_count = 0
    for item in root.iter("chunk"):
        name_elem = item.find("./items/item[@name='Name']")
        nick_elem = item.find("./items/item[@name='NickName']")
        
        comp_name = name_elem.text.strip() if (name_elem is not None and name_elem.text) else ""
        
        if comp_name == "Group":
            group_count += 1
            comp_nick = nick_elem.text.strip() if (nick_elem is not None and nick_elem.text) else ""
            
            # Buscar los objetos dentro de este grupo
            contained_guids = []
            for item_elem in item.iter("item"):
                if item_elem.get("type") == "System.Guid" and item_elem.text:
                    contained_guids.append(item_elem.text.strip())
                    
            contained_nicks = [guid_to_nick.get(g, g) for g in contained_guids]
            
            # Si el grupo contiene un slider, renombrar el grupo a RH_IN:<NombreSlider>
            for s_guid, s_nick in slider_guids.items():
                if s_guid in contained_guids:
                    new_group_name = f"RH_IN:{s_nick}"
                    if nick_elem is not None:
                        nick_elem.text = new_group_name
                        print(f"  [GRUPO ENTRADA] Grupo renombrado a '{new_group_name}' porque contiene Slider '{s_nick}'!")

            # Si el grupo contiene componentes con nombre de pieza, renombrar a RH_OUT:<NombrePieza>
            piece_keywords = ["Lateral", "Cubierta", "Frente", "Posterior", "Tapa", "Piso", "Fondo"]
            for cn in contained_nicks:
                for pk in piece_keywords:
                    if pk.lower() in cn.lower() and not comp_nick.startswith("RH_OUT:"):
                        new_group_name = f"RH_OUT:{cn}"
                        if nick_elem is not None:
                            nick_elem.text = new_group_name
                            print(f"  [GRUPO SALIDA] Grupo renombrado a '{new_group_name}' porque contiene '{cn}'!")

    print(f"\nProcesados {group_count} grupos.")
    tree.write(output_ghx, encoding="utf-8", xml_declaration=False)

    # Diagnosticar /io en RhinoCompute
    with open(output_ghx, "r", encoding="utf-8") as f:
        xml_str = f.read()
    b64_algo = base64.b64encode(xml_str.encode("utf-8")).decode("utf-8")
    
    res = requests.post("http://localhost:5000/io", json={"algo": b64_algo})
    print("\n--- Respuesta Diagnóstico RhinoCompute /io ---")
    print("STATUS /io:", res.status_code)
    data = res.json()
    print(f"INPUTS DETECTADOS ({len(data.get('Inputs', []))}):")
    for inp in data.get("Inputs", []):
        print(f"  • Input: '{inp.get('Name')}' ({inp.get('ParamType')})")
    print(f"OUTPUTS DETECTADOS ({len(data.get('Outputs', []))}):")
    for out in data.get("Outputs", []):
        print(f"  • Output: '{out.get('Name')}' ({out.get('ParamType')})")

if __name__ == "__main__":
    src = r"C:\Desarrollo\mmapp\temporal\Cajon_Experimental_ShapeDriver_02.ghx"
    dst = r"C:\Desarrollo\mmapp\temporal\Cajon_Experimento_Viktor_RhinoCompute.ghx"
    inspect_and_tag_groups(src, dst)
