import xml.etree.ElementTree as ET
import base64
import requests
import shutil

def add_posterior_cajon():
    print("=== Configurando RH_OUT:Posterior de Cajon en el XML de Grasshopper ===")
    src = r"C:\Desarrollo\mmapp\temporal\Cajon_Experimento_Viktor_RhinoCompute.ghx"
    dst = r"C:\Desarrollo\mmapp\temporal\Cajon_Experimento_Viktor_RhinoCompute.ghx"
    
    tree = ET.parse(src)
    root = tree.getroot()
    
    post_guid = "439b2432-e460-4be1-9e07-bf0ef388a989"
    
    updated_comps = 0
    for item in root.iter("chunk"):
        for sub in item.iter("item"):
            if sub.attrib.get("name") in ["NickName", "Name"] and sub.text and "Posterior de Cajon" in sub.text:
                sub.text = "RH_OUT:Posterior de Cajon"
                updated_comps += 1

    for item in root.iter("chunk"):
        name_elem = item.find("./items/item[@name='Name']")
        if name_elem is not None and name_elem.text == "Group":
            container = item.find("./chunks/chunk[@name='Container']")
            if container is not None:
                items_block = container.find("./items")
                if items_block is not None:
                    nick_item = items_block.find("./item[@name='NickName']")
                    contained = [it.text.strip() for it in items_block.findall("./item[@name='ID']") if it.text]
                    if post_guid in contained:
                        if nick_item is not None:
                            nick_item.text = "RH_OUT:Posterior de Cajon"
                            print("  * Grupo contenedor de Posterior de Cajon actualizado a 'RH_OUT:Posterior de Cajon'")

    tree.write(dst, encoding="utf-8", xml_declaration=False)
    shutil.copyfile(dst, r"C:\Desarrollo\mmapp\temporal\Cajon_Experimento_Viktor.ghx")
    print(f"[OK] {updated_comps} referencias a Posterior de Cajon actualizadas.")

    with open(dst, "r", encoding="utf-8") as f:
        xml_str = f.read()
    b64_algo = base64.b64encode(xml_str.encode("utf-8")).decode("utf-8")
    res = requests.post("http://localhost:5000/io", json={"algo": b64_algo})
    data = res.json()
    print(f"\n--- DIAGNOSTICO RHINOCOMPUTE /io ---")
    print(f"OUTPUTS ({len(data.get('Outputs', []))}):")
    for out in data.get("Outputs", []):
        print(f"  * Output: '{out.get('Name')}' ({out.get('ParamType')})")

if __name__ == "__main__":
    add_posterior_cajon()
