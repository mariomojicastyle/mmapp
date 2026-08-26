import xml.etree.ElementTree as ET

def find_ancho_sliders(ghx_path):
    tree = ET.parse(ghx_path)
    root = tree.getroot()
    
    print(f"=== ANÁLISIS DE LOS 3 SLIDERS DE ANCHO EN {ghx_path} ===")
    
    ancho_guids = ["625f42bc-be0f-47f8-a2b4-b934dea0a0d7", "6ec9a07e-28d5-4d79-9799-442008fa037b", "4be9e364-d8d7-4e21-a10e-2fbac8838d91"]
    
    for item in root.iter("chunk"):
        guid_elem = item.find("./items/item[@name='InstanceGuid']")
        if guid_elem is not None and guid_elem.text in ancho_guids:
            guid = guid_elem.text
            nick = ""
            val = ""
            sources = ""
            for sub in item.iter("item"):
                n = sub.attrib.get("name")
                if n == "NickName":
                    nick = sub.text
                elif n == "Value":
                    val = sub.text
                elif n == "SourceCount":
                    sources = sub.text
            print(f"  • Slider GUID: {guid} | NickName: '{nick}' | Valor: {val} | SourceCount: {sources}")

if __name__ == "__main__":
    find_ancho_sliders(r"C:\Desarrollo\mmapp\temporal\Cajon_Experimental_ShapeDriver_02.ghx")
