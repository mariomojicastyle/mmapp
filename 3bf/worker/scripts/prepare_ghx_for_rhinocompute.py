import xml.etree.ElementTree as ET
import base64
import requests

def prepare_ghx_for_rhinocompute(input_ghx, output_ghx):
    print(f"=== Adaptando .ghx para RhinoCompute: {input_ghx} ===")
    tree = ET.parse(input_ghx)
    root = tree.getroot()
    
    modified_count = 0
    
    for item in root.iter("chunk"):
        nick_elem = item.find("./items/item[@name='NickName']")
        
        if nick_elem is not None and nick_elem.text:
            text = nick_elem.text.strip()
            if text in ["Ancho", "Alto", "Profundidad", "Abrir Cajones", "Cantidada de Cajones"] and not text.startswith("RH_IN:"):
                nick_elem.text = f"RH_IN:{text}"
                modified_count += 1
                print(f"  * Añadida entrada: {nick_elem.text}")
            elif text in ["Cubierta Superior", "Lateral Izquierdo", "Lateral Derecho", "Frente de Cajon", "Tapa Luz"] and not text.startswith("RH_OUT:"):
                nick_elem.text = f"RH_OUT:{text}"
                modified_count += 1
                print(f"  * Añadida salida: {nick_elem.text}")

    tree.write(output_ghx, encoding="utf-8", xml_declaration=True)
    print(f"[OK] Archivo guardado con {modified_count} etiquetas RH_IN/RH_OUT en: {output_ghx}")

    with open(output_ghx, "r", encoding="utf-8") as f:
        xml_str = f.read()
    b64_algo = base64.b64encode(xml_str.encode("utf-8")).decode("utf-8")
    
    res = requests.post("http://localhost:5000/io", json={"algo": b64_algo})
    print("\n--- Respuesta de RhinoCompute /io ---")
    print("STATUS:", res.status_code)
    print("PAYLOAD I/O:", res.json())

if __name__ == "__main__":
    src = r"C:\Desarrollo\mmapp\temporal\Cajon_Experimental_ShapeDriver_02.ghx"
    dst = r"C:\Desarrollo\mmapp\temporal\Cajon_Experimento_Viktor_RhinoCompute.ghx"
    prepare_ghx_for_rhinocompute(src, dst)
