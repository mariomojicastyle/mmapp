import xml.etree.ElementTree as ET
import base64
import requests

def tag_all_groups(input_ghx, output_ghx):
    print("=== Configurando Nombres de Grupos (GH_Group) para Entradas (RH_IN) y Salidas (RH_OUT) ===")
    tree = ET.parse(input_ghx)
    root = tree.getroot()
    
    # 1. Mapeo de InstanceGuid de objetos a sus nombres deseados
    slider_targets = {
        "Ancho": "RH_IN:Ancho",
        "Alto": "RH_IN:Alto",
        "Profundidad": "RH_IN:Profundidad",
        "Cantidada de Cajones": "RH_IN:Cantidada de Cajones",
        "Abrir Cajones": "RH_IN:Abrir Cajones"
    }
    
    geom_targets = {
        "Lateral Izquierdo": "RH_OUT:Lateral Izquierdo",
        "Lateral Derecho": "RH_OUT:Lateral Derecho",
        "Cubierta Superior": "RH_OUT:Cubierta Superior",
        "Cubierta Inferior": "RH_OUT:Cubierta Inferior",
        "Lateral Izq Cajon": "RH_OUT:Lateral Izq Cajon",
        "Lateral Der Cajon": "RH_OUT:Lateral Der Cajon",
        "Posterior de Cajon": "RH_OUT:Posterior de Cajon",
        "Tapa Luz": "RH_OUT:Tapa Luz",
        "TapaLuz": "RH_OUT:Tapa Luz",
        "Frente de Cajon": "RH_OUT:Frente de Cajon"
    }

    # Mapeo de InstanceGuid de objeto -> Tipo/Nombre
    guid_map = {}
    
    for item in root.iter("chunk"):
        guid_elem = item.find("./chunks/chunk[@name='Container']/items/item[@name='InstanceGuid']")
        if guid_elem is None:
            guid_elem = item.find("./items/item[@name='InstanceGuid']")
            
        nick_elem = item.find("./chunks/chunk[@name='Container']/items/item[@name='NickName']")
        if nick_elem is None:
            nick_elem = item.find("./items/item[@name='NickName']")
            
        if guid_elem is not None and guid_elem.text:
            guid = guid_elem.text.strip()
            nick = nick_elem.text.strip() if (nick_elem is not None and nick_elem.text) else ""
            guid_map[guid] = nick

    # 2. Recorrer los Grupos y asignar RH_IN / RH_OUT a Container -> items -> NickName
    inputs_count = 0
    outputs_count = 0
    
    for item in root.iter("chunk"):
        name_elem = item.find("./items/item[@name='Name']")
        if name_elem is not None and name_elem.text == "Group":
            container = item.find("./chunks/chunk[@name='Container']")
            if container is not None:
                items_block = container.find("./items")
                if items_block is not None:
                    nick_item = items_block.find("./item[@name='NickName']")
                    contained_guids = [it.text.strip() for it in items_block.findall("./item[@name='ID']") if it.text]
                    
                    # Revisar si contiene un Slider
                    for g in contained_guids:
                        name_in_guid = guid_map.get(g, "")
                        for s_key, s_rh in slider_targets.items():
                            if s_key in name_in_guid:
                                if nick_item is not None:
                                    nick_item.text = s_rh
                                    inputs_count += 1
                                    print(f"  * Grupo Entrada de Slider: '{s_key}' -> '{s_rh}'")

                    # Revisar si contiene Geometría
                    for g in contained_guids:
                        name_in_guid = guid_map.get(g, "")
                        for out_key, out_rh in geom_targets.items():
                            if out_key in name_in_guid:
                                if nick_item is not None and (not nick_item.text or not nick_item.text.startswith("RH_OUT:")):
                                    nick_item.text = out_rh
                                    outputs_count += 1
                                    print(f"  * Grupo Salida de Geometría: '{out_key}' -> '{out_rh}'")

    tree.write(output_ghx, encoding="utf-8", xml_declaration=False)
    print(f"\n[OK] Grupos configurados: {inputs_count} Entradas RH_IN, {outputs_count} Salidas RH_OUT")

    with open(output_ghx, "r", encoding="utf-8") as f:
        xml_str = f.read()
    b64_algo = base64.b64encode(xml_str.encode("utf-8")).decode("utf-8")
    
    res = requests.post("http://localhost:5000/io", json={"algo": b64_algo})
    print("\n--- Resultado Diagnóstico RhinoCompute /io ---")
    print("STATUS /io:", res.status_code)
    data = res.json()
    print(f"INPUTS DETECTADOS POR RHINOCOMPUTE ({len(data.get('Inputs', []))}):")
    for inp in data.get("Inputs", []):
        print(f"  • Input Name: '{inp.get('Name')}' | ParamType: {inp.get('ParamType')}")
    print(f"OUTPUTS DETECTADOS POR RHINOCOMPUTE ({len(data.get('Outputs', []))}):")
    for out in data.get("Outputs", []):
        print(f"  • Output Name: '{out.get('Name')}' | ParamType: {out.get('ParamType')}")

if __name__ == "__main__":
    src = r"C:\Desarrollo\mmapp\temporal\Cajon_Experimental_ShapeDriver_02.ghx"
    dst = r"C:\Desarrollo\mmapp\temporal\Cajon_Experimento_Viktor_RhinoCompute.ghx"
    tag_all_groups(src, dst)
