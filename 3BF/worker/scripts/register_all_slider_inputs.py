import xml.etree.ElementTree as ET
import base64
import requests

def fix_sliders_to_registered_inputs(input_ghx, output_ghx):
    print("=== Configurando Sliders como Entradas Oficiales RH_IN en RhinoCompute ===")
    tree = ET.parse(input_ghx)
    root = tree.getroot()
    
    slider_targets = {
        "Ancho": "RH_IN:Ancho",
        "Alto": "RH_IN:Alto",
        "Profundidad": "RH_IN:Profundidad",
        "Cantidada de Cajones": "RH_IN:Cantidada de Cajones",
        "Abrir Cajones": "RH_IN:Abrir Cajones"
    }

    for item in root.iter("chunk"):
        name_elem = item.find("./items/item[@name='Name']")
        if name_elem is not None and name_elem.text == "Number Slider":
            # 1. Asignar el NickName del Slider
            for it in item.iter("item"):
                if it.attrib.get("name") in ["NickName", "Name"] and it.text:
                    txt = it.text.strip()
                    for k, rh in slider_targets.items():
                        if k.lower() in txt.lower():
                            it.text = rh
                            print(f"  * Modificado slider item '{txt}' -> '{rh}'")

    tree.write(output_ghx, encoding="utf-8", xml_declaration=False)

    with open(output_ghx, "r", encoding="utf-8") as f:
        xml_str = f.read()
    b64_algo = base64.b64encode(xml_str.encode("utf-8")).decode("utf-8")
    
    res = requests.post("http://localhost:5000/io", json={"algo": b64_algo})
    print("\n--- Diagnóstico de Entradas/Salidas Registradas en RhinoCompute /io ---")
    print("STATUS /io:", res.status_code)
    data = res.json()
    print(f"INPUTS DETECTADOS POR RHINOCOMPUTE ({len(data.get('Inputs', []))}):")
    for inp in data.get("Inputs", []):
        print(f"  • Input Name: '{inp.get('Name')}' | ParamType: {inp.get('ParamType')}")
    print(f"OUTPUTS DETECTADOS POR RHINOCOMPUTE ({len(data.get('Outputs', []))}):")
    for out in data.get("Outputs", []):
        print(f"  • Output Name: '{out.get('Name')}' | ParamType: {out.get('ParamType')}")

if __name__ == "__main__":
    src = r"C:\Desarrollo\mmapp\temporal\Cajon_Experimento_Viktor_RhinoCompute.ghx"
    dst = r"C:\Desarrollo\mmapp\temporal\Cajon_Experimento_Viktor_RhinoCompute.ghx"
    fix_sliders_to_registered_inputs(src, dst)
