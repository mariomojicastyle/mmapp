import xml.etree.ElementTree as ET

def find_shapediver_inputs(ghx_path):
    tree = ET.parse(ghx_path)
    root = tree.getroot()
    
    print(f"=== Buscando componentes ShapeDiver / Input en {ghx_path} ===")
    
    inputs = []
    for item in root.iter("chunk"):
        name_elem = item.find("./items/item[@name='Name']")
        nick_elem = item.find("./items/item[@name='NickName']")
        
        comp_name = name_elem.text.strip() if (name_elem is not None and name_elem.text) else ""
        comp_nick = nick_elem.text.strip() if (nick_elem is not None and nick_elem.text) else ""
        
        if "Input" in comp_name or "ShapeDiver" in comp_name or "Context" in comp_name:
            inputs.append((comp_name, comp_nick))
            
    print(f"Encontrados {len(inputs)} componentes de Input / ShapeDiver:")
    for name, nick in inputs:
        print(f"  • Componente: '{name}' | NickName: '{nick}'")

if __name__ == "__main__":
    find_shapediver_inputs(r"C:\Desarrollo\mmapp\temporal\Cajon_Experimental_ShapeDriver_02.ghx")
