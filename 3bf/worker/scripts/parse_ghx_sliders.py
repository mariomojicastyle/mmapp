import xml.etree.ElementTree as ET

def parse_ghx_details(filepath):
    print(f"=== Parseando XML detallado de Grasshopper: {filepath} ===")
    tree = ET.parse(filepath)
    root = tree.getroot()

    sliders = []
    
    # Buscar todos los objetos de tipo GH_NumberSlider o nodos con Name
    for item in root.iter("chunk"):
        name_elem = item.find("./items/item[@name='Name']")
        if name_elem is not None and name_elem.text:
            obj_name = name_elem.text
            # Buscar min, max y valor actual si es un slider
            min_val = item.find("./items/item[@name='Min']")
            max_val = item.find("./items/item[@name='Max']")
            val_elem = item.find("./items/item[@name='Value']")
            
            if min_val is not None or max_val is not None or "slider" in item.attrib.get("name", "").lower():
                sliders.append({
                    "name": obj_name,
                    "min": min_val.text if min_val is not None else "N/A",
                    "max": max_val.text if max_val is not None else "N/A",
                    "value": val_elem.text if val_elem is not None else "N/A"
                })

    print(f"\nSe encontraron {len(sliders)} Sliders / Nodos en el archivo .ghx:\n")
    for s in sliders:
        print(f"  • Slider: '{s['name']}' | Min: {s['min']} | Max: {s['max']} | Actual: {s['value']}")

if __name__ == "__main__":
    parse_ghx_details(r"C:\Desarrollo\mmapp\temporal\Cajon_Experimental_ShapeDriver_02.ghx")
