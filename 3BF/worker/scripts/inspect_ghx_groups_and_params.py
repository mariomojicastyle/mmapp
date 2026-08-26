import xml.etree.ElementTree as ET

def inspect_structure(ghx_path):
    tree = ET.parse(ghx_path)
    root = tree.getroot()
    
    print(f"=== Inspección de Objetos en {ghx_path} ===")
    
    sliders = []
    geometries = []
    groups = []
    
    for item in root.iter("chunk"):
        name_elem = item.find("./items/item[@name='Name']")
        nick_elem = item.find("./items/item[@name='NickName']")
        
        name = name_elem.text.strip() if (name_elem is not None and name_elem.text) else ""
        nick = nick_elem.text.strip() if (nick_elem is not None and nick_elem.text) else ""
        
        if name == "Number Slider":
            sliders.append(nick or "Slider sin nombre")
        elif name in ["Geometry", "BRep", "Mesh", "Surface", "Box"]:
            geometries.append(nick or name)
        elif name == "Group":
            groups.append(nick or "Grupo sin nombre")
            
    print(f"\n--- SLIDERS ({len(sliders)}) ---")
    for s in sliders:
        print(f"  • Slider: '{s}'")
        
    print(f"\n--- GRUPOS ({len(groups)}) ---")
    for g in groups:
        print(f"  • Grupo: '{g}'")
        
    print(f"\n--- GEOMETRÍAS ({len(geometries)}) ---")
    for g in geometries[:25]:
        print(f"  • Geometría: '{g}'")

if __name__ == "__main__":
    src = r"C:\Desarrollo\mmapp\temporal\Cajon_Experimental_ShapeDriver_02.ghx"
    inspect_structure(src)
