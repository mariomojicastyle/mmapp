import xml.etree.ElementTree as ET

def find_frente_cajon(ghx_path):
    tree = ET.parse(ghx_path)
    root = tree.getroot()
    
    print(f"=== Buscando 'Frente de Cajon' en {ghx_path} ===")
    
    matches = []
    for item in root.iter("chunk"):
        for sub in item.iter("item"):
            if sub.attrib.get("name") in ["NickName", "Name"] and sub.text and "Frente de Cajon" in sub.text:
                guid_item = item.find("./items/item[@name='InstanceGuid']")
                name_item = item.find("./items/item[@name='Name']")
                matches.append({
                    "chunk_name": name_item.text if name_item is not None else "Unknown",
                    "text": sub.text,
                    "guid": guid_item.text if guid_item is not None else "No GUID"
                })
                break
                
    print(f"Encontrados {len(matches)} elementos para 'Frente de Cajon':")
    for m in matches:
        print(f"  • Tipo: '{m['chunk_name']}' | Text: '{m['text']}' | GUID: {m['guid']}")

if __name__ == "__main__":
    find_frente_cajon(r"C:\Desarrollo\mmapp\temporal\Cajon_Experimental_ShapeDriver_02.ghx")
