import xml.etree.ElementTree as ET
import base64
import requests
import json
import rhino3dm
import shutil

def setup_isolated_group():
    print("=== Reasignando un grupo pequeño exclusivo para RH_IN:Ancho ===")
    src = r"C:\Desarrollo\mmapp\temporal\Cajon_Experimental_ShapeDriver_02.ghx"
    dst = r"C:\Desarrollo\mmapp\temporal\Cajon_Experimento_Viktor.ghx"
    dst_compute = r"C:\Desarrollo\mmapp\temporal\Cajon_Experimento_Viktor_RhinoCompute.ghx"
    
    tree = ET.parse(src)
    root = tree.getroot()

    ancho_guid = "625f42bc-be0f-47f8-a2b4-b934dea0a0d7"

    # 1. NickName del Slider Ancho
    for item in root.iter("chunk"):
        guid_elem = item.find("./items/item[@name='InstanceGuid']")
        if guid_elem is not None and guid_elem.text == ancho_guid:
            for sub in item.iter("item"):
                if sub.attrib.get("name") == "NickName" and sub.text:
                    sub.text = "RH_IN:Ancho"

    # 2. Remover Ancho del grupo gigante y buscar un grupo pequeño de 1-2 items para convertirlo en RH_IN:Ancho
    for item in root.iter("chunk"):
        name_elem = item.find("./items/item[@name='Name']")
        if name_elem is not None and name_elem.text == "Group":
            container = item.find("./chunks/chunk[@name='Container']")
            if container is not None:
                items_block = container.find("./items")
                if items_block is not None:
                    # Si es el grupo gigante de 40 items, remover el slider ancho
                    id_count_elem = items_block.find("./item[@name='ID_Count']")
                    if id_count_elem is not None and int(id_count_elem.text or 0) > 10:
                        id_items = items_block.findall("./item[@name='ID']")
                        for id_it in id_items:
                            if id_it.text and id_it.text.strip() == ancho_guid:
                                items_block.remove(id_it)
                                print("  * Slider Ancho retirado del grupo gigante de 40 ítems.")
                        remaining = items_block.findall("./item[@name='ID']")
                        id_count_elem.text = str(len(remaining))

    # 3. Buscar un grupo pequeño de 1 o 2 ítems y convertirlo en el grupo dedicado de RH_IN:Ancho
    group_assigned = False
    for item in root.iter("chunk"):
        name_elem = item.find("./items/item[@name='Name']")
        if name_elem is not None and name_elem.text == "Group":
            container = item.find("./chunks/chunk[@name='Container']")
            if container is not None:
                items_block = container.find("./items")
                if items_block is not None:
                    id_count_elem = items_block.find("./item[@name='ID_Count']")
                    nick_item = items_block.find("./item[@name='NickName']")
                    
                    if not group_assigned and id_count_elem is not None and int(id_count_elem.text or 0) in [1, 2]:
                        if nick_item is not None and (not nick_item.text or nick_item.text in ["None", "A group of Grasshopper objects"]):
                            # Reemplazar su ID por el GUID de Ancho
                            id_items = items_block.findall("./item[@name='ID']")
                            for id_it in id_items:
                                items_block.remove(id_it)
                            
                            ET.SubElement(items_block, "item", attrib={"name": "ID", "type_name": "gh_guid", "type_code": "9"}).text = ancho_guid
                            id_count_elem.text = "1"
                            nick_item.text = "RH_IN:Ancho"
                            group_assigned = True
                            print("  * Convertido un grupo pequeño en el grupo exclusivo 'RH_IN:Ancho'")

    # 4. Salidas preferidas TapaLuz y Frente de Cajon
    for item in root.iter("chunk"):
        name_elem = item.find("./items/item[@name='Name']")
        if name_elem is not None and name_elem.text == "Group":
            container = item.find("./chunks/chunk[@name='Container']")
            if container is not None:
                items_block = container.find("./items")
                if items_block is not None:
                    nick_item = items_block.find("./item[@name='NickName']")
                    if nick_item is not None and nick_item.text:
                        txt = nick_item.text.strip()
                        if "TapaLuz" in txt or "Tapa Luz" in txt:
                            nick_item.text = "RH_OUT:TapaLuz"
                        elif "Frente de Cajon" in txt:
                            nick_item.text = "RH_OUT:Frente de Cajon"

    tree.write(dst, encoding="utf-8", xml_declaration=False)
    shutil.copyfile(dst, dst_compute)

    with open(dst, "r", encoding="utf-8") as f:
        xml_str = f.read()
    b64_algo = base64.b64encode(xml_str.encode("utf-8")).decode("utf-8")

    res_io = requests.post("http://localhost:5000/io", json={"algo": b64_algo})
    print("\nSTATUS /io:", res_io.status_code)
    io_data = res_io.json()
    print(f"INPUTS DETECTADOS ({len(io_data.get('Inputs', []))}):")
    for inp in io_data.get("Inputs", []):
        print(f"  • Input: '{inp.get('Name')}' ({inp.get('ParamType')})")
    print(f"OUTPUTS DETECTADOS ({len(io_data.get('Outputs', []))}):")
    for out in io_data.get("Outputs", []):
        print(f"  • Output: '{out.get('Name')}' ({out.get('ParamType')})")

    # Evaluacion con RH_IN:Ancho = 600mm vs 900mm
    def test_val(val):
        payload_rc = {
            "algo": b64_algo,
            "pointer": None,
            "values": [
                {"ParamName": "RH_IN:Ancho", "InnerTree": {"{0}": [{"type": "System.Double", "data": str(float(val))}]}}
            ]
        }
        res = requests.post("http://localhost:5000/grasshopper", json=payload_rc)
        data = res.json()
        meshes = []
        for v in data.get("values", []):
            p = v.get("ParamName")
            inner = v.get("InnerTree", {})
            for pk, items in inner.items():
                for item in items:
                    raw = item.get("data")
                    if raw:
                        try:
                            obj = json.loads(raw) if isinstance(raw, str) else raw
                            if isinstance(obj, dict):
                                if "X" in obj and "Y" in obj and "Z" in obj:
                                    x_sz = abs(obj["X"]["T1"] - obj["X"]["T0"])
                                    meshes.append((p, x_sz))
                                elif "archive3dm" in obj or "opennurbs" in obj:
                                    dec = rhino3dm.CommonObject.Decode(obj)
                                    if dec:
                                        bbox = dec.GetBoundingBox()
                                        x_sz = abs(bbox.Max.X - bbox.Min.X)
                                        meshes.append((p, x_sz))
                        except Exception:
                            pass
        print(f"\n--- Resultado evaluando RH_IN:Ancho = {val} mm ---")
        for p, x in meshes:
            print(f"  • {p} -> Tamaño X: {x:.1f} mm")

    test_val(600)
    test_val(900)

if __name__ == "__main__":
    setup_isolated_group()
