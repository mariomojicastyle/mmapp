import xml.etree.ElementTree as ET
import os

def parse_ghx_slider_limits(ghx_path):
    limits = {}
    if not os.path.exists(ghx_path):
        return limits

    try:
        tree = ET.parse(ghx_path)
        root = tree.getroot()

        for chunk in root.iter("chunk"):
            if chunk.attrib.get("name") == "Object":
                name_item = chunk.find("items/item[@name='Name']")
                if name_item is not None and "Number Slider" in str(name_item.text):
                    container = chunk.find("chunks/chunk[@name='Container']")
                    if container is not None:
                        nick_item = container.find("items/item[@name='NickName']")
                        slider_chunk = container.find("chunks/chunk[@name='Slider']")
                        
                        if nick_item is not None and slider_chunk is not None:
                            nick = nick_item.text or ""
                            min_item = slider_chunk.find("items/item[@name='Min']")
                            max_item = slider_chunk.find("items/item[@name='Max']")
                            val_item = slider_chunk.find("items/item[@name='Value']")

                            if min_item is not None and max_item is not None:
                                limits[nick] = {
                                    "min": float(min_item.text),
                                    "max": float(max_item.text),
                                    "default": float(val_item.text) if val_item is not None else float(min_item.text)
                                }
    except Exception as e:
        print(f"[3BF Worker] Error parseando límites slider: {e}")

    return limits

if __name__ == "__main__":
    path = r"C:\Desarrollo\mmapp\temporal\Cajon_Experimento_Viktor_3cajones.ghx"
    res = parse_ghx_slider_limits(path)
    print("=== LÍMITES DE SLIDERS EXTRAÍDOS DEL GHX ===")
    for k, v in res.items():
        print(f"  • {k} -> Min: {v['min']}, Max: {v['max']}, Default: {v['default']}")
