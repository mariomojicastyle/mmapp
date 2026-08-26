import xml.etree.ElementTree as ET
import base64
import requests
import json
import rhino3dm

def inspect_slider_groups(ghx_path):
    tree = ET.parse(ghx_path)
    root = tree.getroot()
    
    print(f"=== Inspeccionando Grupos y Sliders en {ghx_path} ===")
    
    ancho_slider_guid = "625f42bc-be0f-47f8-a2b4-b934dea0a0d7"
    
    for item in root.iter("chunk"):
        name_elem = item.find("./items/item[@name='Name']")
        if name_elem is not None and name_elem.text == "Group":
            container = item.find("./chunks/chunk[@name='Container']")
            if container is not None:
                items_block = container.find("./items")
                if items_block is not None:
                    nick_item = items_block.find("./item[@name='NickName']")
                    contained = [it.text.strip() for it in items_block.findall("./item[@name='ID']") if it.text]
                    if ancho_slider_guid in contained:
                        print(f"  • Grupo que contiene el Slider Ancho: NickName='{nick_item.text if nick_item is not None else None}'")
                        for sub_it in items_block:
                            print(f"    Item {sub_it.attrib.get('name')}: '{sub_it.text}'")

if __name__ == "__main__":
    inspect_slider_groups(r"C:\Desarrollo\mmapp\temporal\Cajon_Experimental_ShapeDriver_02.ghx")
