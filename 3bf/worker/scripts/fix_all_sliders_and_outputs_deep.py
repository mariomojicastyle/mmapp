import xml.etree.ElementTree as ET
import base64
import requests

def fix_all_sliders_and_outputs_deep(input_ghx, output_ghx):
    print("=== Configuración Profunda de Entradas (RH_IN) y Salidas (RH_OUT) en XML ===")
    tree = ET.parse(input_ghx)
    root = tree.getroot()
    
    slider_targets = {
        "Ancho": "RH_IN:Ancho",
        "Alto": "RH_IN:Alto",
        "Profundidad": "RH_IN:Profundidad",
        "Cantidada de Cajones": "RH_IN:Cantidada de Cajones",
        "Abrir Cajones": "RH_IN:Abrir Cajones"
    }

    modified_sliders = 0

    for item in root.iter("chunk"):
        name_elem = item.find("./items/item[@name='Name']")
        if name_elem is not None and name_elem.text == "Number Slider":
            # Buscar TODOS los elementos NickName dentro de este chunk del Number Slider
            for nick_elem in item.iter("item"):
                if nick_elem.attrib.get("name") == "NickName" and nick_elem.text:
                    text = nick_elem.text.strip()
                    for target_key, rh_name in slider_targets.items():
                        if (target_key in text or text in target_key) and not text.startswith("RH_IN:"):
                            nick_elem.text = rh_name
                            modified_sliders += 1
                            print(f"  ✔ Slider modificado: '{text}' -> '{rh_name}'")

    # Guardar XML sin la declaración
    tree.write(output_ghx, encoding="utf-8", xml_declaration=False)
    print(f"\n[OK] Sliders modificados: {modified_sliders}")

    with open(output_ghx, "r", encoding="utf-8") as f:
        xml_str = f.read()
    b64_algo = base64.b64encode(xml_str.encode("utf-8")).decode("utf-8")
    
    res = requests.post("http://localhost:5000/io", json={"algo": b64_algo})
    print("\n--- Respuesta de Diagnóstico de RhinoCompute /io ---")
    print("STATUS /io:", res.status_code)
    data = res.json()
    print(f"INPUTS DETECTADOS ({len(data.get('Inputs', []))}):")
    for inp in data.get("Inputs", []):
        print(f"  • Input: '{inp.get('Name')}' ({inp.get('ParamType')})")
    print(f"OUTPUTS DETECTADOS ({len(data.get('Outputs', []))}):")
    for out in data.get("Outputs", []):
        print(f"  • Output: '{out.get('Name')}' ({out.get('ParamType')})")

if __name__ == "__main__":
    src = r"C:\Desarrollo\mmapp\temporal\Cajon_Experimento_Viktor_RhinoCompute.ghx"
    dst = r"C:\Desarrollo\mmapp\temporal\Cajon_Experimento_Viktor_RhinoCompute.ghx"
    fix_all_sliders_and_outputs_deep(src, dst)
