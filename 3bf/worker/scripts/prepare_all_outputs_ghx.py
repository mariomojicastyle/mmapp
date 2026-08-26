import xml.etree.ElementTree as ET
import base64
import requests

def prepare_all_outputs_ghx(input_ghx, output_ghx):
    print(f"=== Etiquetando todas las geometrías de salida con RH_OUT: en {input_ghx} ===")
    tree = ET.parse(input_ghx)
    root = tree.getroot()
    
    target_outputs = [
        "Lateral Izquierdo", "Lateral Derecho", "Tapa Luz", "TapaLuz", "Tapaluz",
        "Frente de Cajon", "Lateral Izq Cajon", "Lateral Der Cajon", "Lateral I Cajon",
        "Posterior de Cajon", "Cubierta Inferior", "Cubierta Superior"
    ]
    
    modified_count = 0
    
    for item in root.iter("chunk"):
        nick_elem = item.find("./items/item[@name='NickName']")
        if nick_elem is not None and nick_elem.text:
            text = nick_elem.text.strip()
            # Sliders de entrada
            if text in ["Ancho", "Alto", "Profundidad", "Abrir Cajones", "Cantidada de Cajones"] and not text.startswith("RH_IN:"):
                nick_elem.text = f"RH_IN:{text}"
                modified_count += 1
            # Componentes de salida
            elif any(out_name == text or out_name in text for out_name in target_outputs) and not text.startswith("RH_OUT:"):
                nick_elem.text = f"RH_OUT:{text}"
                modified_count += 1

    tree.write(output_ghx, encoding="utf-8", xml_declaration=False)
    print(f"[OK] {modified_count} etiquetas RH_IN / RH_OUT actualizadas en: {output_ghx}")

    with open(output_ghx, "r", encoding="utf-8") as f:
        xml_str = f.read()
    b64_algo = base64.b64encode(xml_str.encode("utf-8")).decode("utf-8")
    
    res = requests.post("http://localhost:5000/io", json={"algo": b64_algo})
    print("\n--- Salidas Registradas en RhinoCompute /io ---")
    data_io = res.json()
    print("STATUS:", res.status_code)
    print("OUTPUT NAMES (Total:", len(data_io.get("OutputNames", [])), "):")
    for name in data_io.get("OutputNames", []):
        print("  • Salida GH:", name)

if __name__ == "__main__":
    src = r"C:\Desarrollo\mmapp\temporal\Cajon_Experimental_ShapeDriver_02.ghx"
    dst = r"C:\Desarrollo\mmapp\temporal\Cajon_Experimento_Viktor_RhinoCompute.ghx"
    prepare_all_outputs_ghx(src, dst)
