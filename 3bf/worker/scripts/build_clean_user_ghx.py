import xml.etree.ElementTree as ET
import base64
import requests
import shutil

def build_clean_user_ghx():
    print("=== Generando versión limpia e íntegra .ghx con todas las piezas incluyendo Frentes de Cajón ===")
    src = r"C:\Desarrollo\mmapp\temporal\Cajon_Experimental_ShapeDriver_02.ghx"
    dst = r"C:\Desarrollo\mmapp\temporal\Cajon_Experimento_Viktor.ghx"
    dst_compute = r"C:\Desarrollo\mmapp\temporal\Cajon_Experimento_Viktor_RhinoCompute.ghx"

    tree = ET.parse(src)
    root = tree.getroot()

    # 1. Configurar NickName de Sliders
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

    # 2. Asignar RH_OUT a cualquier NickName/Name de geometría que contenga las palabras clave
    output_keywords = {
        "lateral izquierdo": "RH_OUT:Lateral Izquierdo",
        "lateral derecho": "RH_OUT:Lateral Derecho",
        "cubierta superior": "RH_OUT:Cubierta Superior",
        "cubierta inferior": "RH_OUT:Cubierta Inferior",
        "tapa luz": "RH_OUT:Tapa Luz",
        "tapaluz": "RH_OUT:Tapa Luz",
        "frente de cajon": "RH_OUT:Frente de Cajon",
        "frente": "RH_OUT:Frente de Cajon",
        "lateral izq cajon": "RH_OUT:Lateral Izq Cajon",
        "lateral der cajon": "RH_OUT:Lateral Der Cajon",
        "posterior de cajon": "RH_OUT:Posterior de Cajon"
    }

    for item in root.iter("chunk"):
        for sub in item.iter("item"):
            if sub.attrib.get("name") in ["NickName", "Name"] and sub.text:
                txt = sub.text.strip().lower()
                for kw, rh_out in output_keywords.items():
                    if kw in txt and not sub.text.startswith("RH_OUT:"):
                        sub.text = rh_out
                        break

    # 3. Asignar a grupos contenedores
    for item in root.iter("chunk"):
        name_elem = item.find("./items/item[@name='Name']")
        if name_elem is not None and name_elem.text == "Group":
            container = item.find("./chunks/chunk[@name='Container']")
            if container is not None:
                items_block = container.find("./items")
                if items_block is not None:
                    nick_item = items_block.find("./item[@name='NickName']")
                    if nick_item is not None and nick_item.text:
                        txt = nick_item.text.strip().lower()
                        for kw, rh_out in output_keywords.items():
                            if kw in txt and not nick_item.text.startswith("RH_OUT:"):
                                nick_item.text = rh_out
                                break

    tree.write(dst, encoding="utf-8", xml_declaration=False)
    shutil.copyfile(dst, dst_compute)
    print(f"[OK] Archivo reconstruido de 0 en {dst}")

    # Diagnosticar /io
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
    build_clean_user_ghx()
