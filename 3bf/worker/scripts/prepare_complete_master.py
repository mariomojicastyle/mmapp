import xml.etree.ElementTree as ET
import base64
import requests
import shutil

def prepare_complete_master():
    print("=== Configurando el Master Completo con TODOS los Frentes, Posteriores y Estructura ===")
    src = r"C:\Desarrollo\mmapp\temporal\Cajon_Experimental_ShapeDriver_02.ghx"
    dst = r"C:\Desarrollo\mmapp\temporal\Cajon_Experimento_Viktor_RhinoCompute.ghx"
    
    tree = ET.parse(src)
    root = tree.getroot()

    # 1. Sliders de entrada
    slider_targets = {
        "ancho": "RH_IN:Ancho",
        "profundidad": "RH_IN:Profundidad",
        "alto": "RH_IN:Alto",
        "cantidada de cajones": "RH_IN:Cantidada de Cajones",
        "cajones": "RH_IN:Cantidada de Cajones",
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

    # 2. Mapeo específico de GUIDs para no duplicar salidas
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

    for item in root.iter("chunk"):
        guid_elem = item.find("./items/item[@name='InstanceGuid']")
        nick_elem = item.find("./items/item[@name='NickName']")
        if guid_elem is not None and guid_elem.text in output_guids:
            if nick_elem is not None:
                nick_elem.text = output_guids[guid_elem.text]

    # Asignar a grupos contenedores
    for item in root.iter("chunk"):
        name_elem = item.find("./items/item[@name='Name']")
        if name_elem is not None and name_elem.text == "Group":
            container = item.find("./chunks/chunk[@name='Container']")
            if container is not None:
                items_block = container.find("./items")
                if items_block is not None:
                    nick_item = items_block.find("./item[@name='NickName']")
                    contained = [it.text.strip() for it in items_block.findall("./item[@name='ID']") if it.text]
                    for target_guid, rh_out_name in output_guids.items():
                        if target_guid in contained:
                            if nick_item is not None:
                                nick_item.text = rh_out_name

    tree.write(dst, encoding="utf-8", xml_declaration=False)
    shutil.copyfile(dst, r"C:\Desarrollo\mmapp\temporal\Cajon_Experimento_Viktor.ghx")
    print("[OK] Master final con todos los GUIDs únicos generado con éxito.")

if __name__ == "__main__":
    prepare_complete_master()
