import sys
import os
import re
import xml.etree.ElementTree as ET

def inspect_gh_file(filepath):
    print(f"=== Analizando Archivo: {filepath} ===")
    if not os.path.exists(filepath):
        print("Error: El archivo no existe.")
        return

    with open(filepath, "rb") as f:
        raw_data = f.read()

    # Intentar decodificar strings ASCII / UTF-8 / UTF-16
    content_utf8 = raw_data.decode("utf-8", errors="ignore")
    content_utf16 = raw_data.decode("utf-16-le", errors="ignore")
    full_text = content_utf8 + "\n" + content_utf16

    extract_parameters_from_text(full_text)

def extract_parameters_from_text(text):
    # Buscar patrones de entradas RH_IN: o nombres de Sliders
    rh_inputs = set(re.findall(r"RH_IN:[A-Za-z0-9_]+", text))
    rh_outputs = set(re.findall(r"RH_OUT:[A-Za-z0-9_]+", text))
    
    # Buscar nombres de sliders en Grasshopper
    slider_names = set(re.findall(r"Name[\"'\s:=]+([A-Za-z0-9_\-\s]{3,30})", text))
    
    print("\n--- Entradas Detectadas (RH_IN:) ---")
    if rh_inputs:
        for inp in sorted(list(rh_inputs)):
            print(f"  * INPUT: {inp}")
    else:
        print("  (No se detectaron prefijos explícitos RH_IN:)")
        
    print("\n--- Salidas Detectadas (RH_OUT:) ---")
    if rh_outputs:
        for out in sorted(list(rh_outputs)):
            print(f"  * OUTPUT: {out}")
    else:
        print("  (No se detectaron prefijos explícitos RH_OUT:)")

    print("\n--- Nombres de Sliders / Nodos Detectados ---")
    keywords = set(re.findall(r"\b(Ancho|Alto|Profundidad|Espesor|Largo|Cajon|Material|Fondo|Puerta|Minifix|Bisagra|Frente|Tirador|Corredera|Despiece)\b", text, re.IGNORECASE))
    for kw in sorted(list(keywords)):
        print(f"  * Parámetro: {kw}")

if __name__ == "__main__":
    target = r"C:\Desarrollo\mmapp\temporal\Cajon_Experimento_Viktor.gh"
    inspect_gh_file(target)
    
    print("\n" + "="*50 + "\n")
    target_xml = r"C:\Desarrollo\mmapp\temporal\Cajon_Experimental_ShapeDriver_02.ghx"
    inspect_gh_file(target_xml)
