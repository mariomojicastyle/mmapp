import xml.etree.ElementTree as ET

def find_geometry_outputs(ghx_path):
    tree = ET.parse(ghx_path)
    root = tree.getroot()
    
    print(f"=== Buscando todos los componentes de salida en {ghx_path} ===")
    
    components = []
    for item in root.iter("chunk"):
        name_elem = item.find("./items/item[@name='Name']")
        nick_elem = item.find("./items/item[@name='NickName']")
        
        if name_elem is not None and name_elem.text:
            name = name_elem.text.strip()
            nick = nick_elem.text.strip() if (nick_elem is not None and nick_elem.text) else ""
            
            # Buscar componentes de tipo Geometry / BRep / Mesh / Box / Container
            if "Geometry" in name or "BRep" in name or "Mesh" in name or "Box" in name or "Surface" in name:
                components.append((name, nick))
                
    print(f"Encontrados {len(components)} componentes de geometría:")
    for name, nick in components:
        print(f"  • Componente: '{name}' | NickName: '{nick}'")

if __name__ == "__main__":
    find_geometry_outputs(r"C:\Desarrollo\mmapp\temporal\Cajon_Experimento_Viktor_RhinoCompute.ghx")
