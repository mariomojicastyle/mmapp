import xml.etree.ElementTree as ET
import base64
import requests
import json
import rhino3dm
import shutil

def tag_all_outputs():
    ghx_path = r"C:\Desarrollo\mmapp\temporal\Cajon_Experimento_Viktor.ghx"
    dst_compute = r"C:\Desarrollo\mmapp\temporal\Cajon_Experimento_Viktor_RhinoCompute.ghx"
    
    tree = ET.parse(ghx_path)
    root = tree.getroot()

    output_guids = {
        "43add241-2c4b-48c7-baed-77b32f8cf781": "RH_OUT:Lateral Izquierdo",
        "b66d9fa4-877a-48be-9c3a-ee6c9a8c3328": "RH_OUT:Lateral Derecho",
        "62e73ecd-6def-4e9a-8c43-789fc6fd2493": "RH_OUT:Cubierta Superior",
        "ba94570a-e8c0-4319-9979-3aca7e98d68c": "RH_OUT:Cubierta Inferior",
        "f0a298b5-a588-4335-8c67-6c23aa64004a": "RH_OUT:Tapa Luz",
        "24d5a658-4462-4439-9783-ca5c1fb406a0": "RH_OUT:Frente de Cajon",
        "c1557d12-70a6-45ba-8873-74d8e3b35e5f": "RH_OUT:Lateral Izq Cajon",
        "afcffc89-1579-473a-8dfb-1ac69c001519": "RH_OUT:Lateral Der Cajon",
        "439b2432-e460-4be1-9e07-bf0ef388a989": "RH_OUT:Posterior de Cajon"
    }

    output_keywords = {
        "lateral izquierdo": "RH_OUT:Lateral Izquierdo",
        "lateral derecho": "RH_OUT:Lateral Derecho",
        "cubierta superior": "RH_OUT:Cubierta Superior",
        "cubierta inferior": "RH_OUT:Cubierta Inferior",
        "tapa luz": "RH_OUT:Tapa Luz",
        "tapaluz": "RH_OUT:Tapa Luz",
        "frente": "RH_OUT:Frente de Cajon",
        "lateral izq cajon": "RH_OUT:Lateral Izq Cajon",
        "lateral der cajon": "RH_OUT:Lateral Der Cajon",
        "posterior": "RH_OUT:Posterior de Cajon"
    }

    # 1. Asignar por GUID
    for item in root.iter("chunk"):
        guid_elem = item.find("./items/item[@name='InstanceGuid']")
        nick_elem = item.find("./items/item[@name='NickName']")
        if guid_elem is not None and guid_elem.text in output_guids:
            if nick_elem is not None:
                nick_elem.text = output_guids[guid_elem.text]

    # 2. Asignar por palabras clave en grupos
    for item in root.iter("chunk"):
        name_elem = item.find("./items/item[@name='Name']")
        if name_elem is not None and name_elem.text == "Group":
            container = item.find("./chunks/chunk[@name='Container']")
            if container is not None:
                items_block = container.find("./items")
                if items_block is not None:
                    nick_item = items_block.find("./item[@name='NickName']")
                    contained = [it.text.strip() for it in items_block.findall("./item[@name='ID']") if it.text]
                    
                    # Chequear GUIDs
                    for og_guid, og_name in output_guids.items():
                        if og_guid in contained:
                            if nick_item is not None and nick_item.text and not nick_item.text.startswith("RH_IN:"):
                                nick_item.text = og_name
                                
                    if nick_item is not None and nick_item.text:
                        txt = nick_item.text.strip().lower()
                        for kw, rh_out in output_keywords.items():
                            if kw in txt and not nick_item.text.startswith("RH_OUT:") and not nick_item.text.startswith("RH_IN:"):
                                nick_item.text = rh_out
                                break

    tree.write(ghx_path, encoding="utf-8", xml_declaration=False)
    shutil.copyfile(ghx_path, dst_compute)

    with open(ghx_path, "r", encoding="utf-8") as f:
        xml_str = f.read()
    b64_algo = base64.b64encode(xml_str.encode("utf-8")).decode("utf-8")

    res_io = requests.post("http://localhost:5000/io", json={"algo": b64_algo})
    print("STATUS /io:", res_io.status_code)
    io_data = res_io.json()
    
    print(f"\n--- ENTRADAS REGISTRADAS EN RHINOCOMPUTE ({len(io_data.get('Inputs', []))}) ---")
    for inp in io_data.get("Inputs", []):
        print(f"  • Input: '{inp.get('Name')}' ({inp.get('ParamType')})")
        
    print(f"\n--- SALIDAS REGISTRADAS EN RHINOCOMPUTE ({len(io_data.get('Outputs', []))}) ---")
    for out in io_data.get("Outputs", []):
        print(f"  • Output: '{out.get('Name')}' ({out.get('ParamType')})")

if __name__ == "__main__":
    tag_all_outputs()
