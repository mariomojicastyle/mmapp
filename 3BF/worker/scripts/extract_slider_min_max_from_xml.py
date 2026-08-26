import xml.etree.ElementTree as ET

def extract_slider_bounds():
    ghx_path = r"C:\Desarrollo\mmapp\temporal\Cajon_Experimento_Viktor_3cajones.ghx"
    tree = ET.parse(ghx_path)
    root = tree.getroot()

    print("=== EXTRACCIÓN DIRECTA DE MÍNIMOS Y MÁXIMOS DE SLIDERS EN GRASSHOPPER XML ===")
    
    sliders = {}

    for chunk in root.iter("chunk"):
        if chunk.attrib.get("name") == "Object":
            name_item = chunk.find("items/item[@name='Name']")
            if name_item is not None and "Number Slider" in str(name_item.text):
                # Extraer propiedades del slider
                container = chunk.find("chunks/chunk[@name='Container']")
                if container is not None:
                    nick = container.find("items/item[@name='NickName']")
                    min_val = container.find("items/item[@name='Min']")
                    max_val = container.find("items/item[@name='Max']")
                    cur_val = container.find("items/item[@name='Value']")
                    
                    nick_text = nick.text if nick is not None else ""
                    if "RH_IN:" in nick_text or nick_text in ["Ancho", "Alto", "Profundidad"]:
                        sliders[nick_text] = {
                            "min": float(min_val.text) if min_val is not None else None,
                            "max": float(max_val.text) if max_val is not None else None,
                            "value": float(cur_val.text) if cur_val is not None else None
                        }

    for name, bounds in sliders.items():
        print(f"\nSlider '{name}':")
        print(f"   • Min: {bounds['min']} mm")
        print(f"   • Max: {bounds['max']} mm")
        print(f"   • Actual: {bounds['value']} mm")

if __name__ == "__main__":
    extract_slider_bounds()
