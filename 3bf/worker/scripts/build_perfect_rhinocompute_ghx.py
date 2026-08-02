import xml.etree.ElementTree as ET
import base64
import requests
import json

def build_perfect_ghx(input_ghx, output_ghx):
    print("=== Configurando Entradas (RH_IN) y Salidas (RH_OUT) en el XML de Grasshopper ===")
    tree = ET.parse(input_ghx)
    root = tree.getroot()
    
    # 1. Mapeo de Sliders de Entrada
    slider_map = {
        "Ancho": "RH_IN:Ancho",
        "Profundidad": "RH_IN:Profundidad",
        "Alto": "RH_IN:Alto",
        "Abrir Cajones": "RH_IN:Abrir Cajones",
        "Cantidada de Cajones": "RH_IN:Cantidada de Cajones"
    }
    
    # 2. Mapeo de Piezas de Salida
    output_names = {
        "TapaLuz": "RH_OUT:TapaLuz",
        "Frente de Cajon": "RH_OUT:Frente de Cajon",
        "Lateral Izquierdo": "RH_OUT:Lateral Izquierdo",
        "Lateral Derecho": "RH_OUT:Lateral Derecho",
        "Cubierta Superior": "RH_OUT:Cubierta Superior",
        "Cubierta Inferior": "RH_OUT:Cubierta Inferior",
        "Lateral Izq Cajon": "RH_OUT:Lateral Izq Cajon",
        "Lateral Der Cajon": "RH_OUT:Lateral Der Cajon",
        "Posterior de Cajon": "RH_OUT:Posterior de Cajon",
        "Lateral I Cajon": "RH_OUT:Lateral Izq Cajon"
    }

    modified_inputs = 0
    modified_outputs = 0

    for item in root.iter("chunk"):
        name_elem = item.find("./items/item[@name='Name']")
        nick_elem = item.find("./items/item[@name='NickName']")
        
        comp_name = name_elem.text.strip() if (name_elem is not None and name_elem.text) else ""
        comp_nick = nick_elem.text.strip() if (nick_elem is not None and nick_elem.text) else ""

        # A) Sliders de Entrada
        if comp_name == "Number Slider":
            for orig_key, rh_in_key in slider_map.items():
                if (orig_key in comp_nick or orig_key == comp_name) and not comp_nick.startswith("RH_IN:"):
                    if nick_elem is not None:
                        nick_elem.text = rh_in_key
                        modified_inputs += 1
                        print(f"  [ENTRADA RH_IN] Slider '{orig_key}' -> '{rh_in_key}'")

        # B) Grupos de Grasshopper (Hops/RhinoCompute lee los nombres de los grupos para generar entradas/salidas)
        if comp_name == "Group":
            for orig_key, rh_out_key in output_names.items():
                if orig_key in comp_nick and not comp_nick.startswith("RH_OUT:"):
                    if nick_elem is not None:
                        nick_elem.text = rh_out_key
                        modified_outputs += 1
                        print(f"  [SALIDA RH_OUT] Grupo '{orig_key}' -> '{rh_out_key}'")
            for orig_key, rh_in_key in slider_map.items():
                if orig_key in comp_nick and not comp_nick.startswith("RH_IN:"):
                    if nick_elem is not None:
                        nick_elem.text = rh_in_key
                        modified_inputs += 1
                        print(f"  [ENTRADA RH_IN] Grupo '{orig_key}' -> '{rh_in_key}'")

        # C) Componentes de Geometría / BRep / Mesh / Box
        if comp_name in ["Geometry", "BRep", "Mesh", "Box", "Surface"]:
            for orig_key, rh_out_key in output_names.items():
                if orig_key in comp_nick and not comp_nick.startswith("RH_OUT:"):
                    if nick_elem is not None:
                        nick_elem.text = rh_out_key
                        modified_outputs += 1
                        print(f"  [SALIDA RH_OUT] Geometría '{orig_key}' -> '{rh_out_key}'")

    # Guardar XML sin la declaración para evitar compatibilidad de comillas
    tree.write(output_output_ghx := output_ghx, encoding="utf-8", xml_declaration=False)
    print(f"\n[OK] Archivo guardado con {modified_inputs} entradas y {modified_outputs} salidas en: {output_ghx}")

    # Probar inspección I/O en RhinoCompute
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
    src = r"C:\Desarrollo\mmapp\temporal\Cajon_Experimental_ShapeDriver_02.ghx"
    dst = r"C:\Desarrollo\mmapp\temporal\Cajon_Experimento_Viktor_RhinoCompute.ghx"
    build_perfect_ghx(src, dst)
