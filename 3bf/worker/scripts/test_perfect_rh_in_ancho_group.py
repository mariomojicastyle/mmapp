import xml.etree.ElementTree as ET
import base64
import requests
import json
import rhino3dm
import shutil
import uuid

def build_perfect_ancho_group():
    print("=== Creando un grupo XML perfecto para RH_IN:Ancho y actualizando contadores ===")
    src = r"C:\Desarrollo\mmapp\temporal\Cajon_Experimental_ShapeDriver_02.ghx"
    dst = r"C:\Desarrollo\mmapp\temporal\Cajon_Experimento_Viktor.ghx"
    dst_compute = r"C:\Desarrollo\mmapp\temporal\Cajon_Experimento_Viktor_RhinoCompute.ghx"
    
    tree = ET.parse(src)
    root = tree.getroot()

    ancho_slider_guid = "625f42bc-be0f-47f8-a2b4-b934dea0a0d7"

    # 1. NickName del Slider Ancho
    for item in root.iter("chunk"):
        guid_elem = item.find("./items/item[@name='InstanceGuid']")
        if guid_elem is not None and guid_elem.text == ancho_slider_guid:
            for sub in item.iter("item"):
                if sub.attrib.get("name") == "NickName" and sub.text:
                    sub.text = "RH_IN:Ancho"

    # 2. Retirar el slider ancho del grupo gigante
    for item in root.iter("chunk"):
        name_elem = item.find("./items/item[@name='Name']")
        if name_elem is not None and name_elem.text == "Group":
            container = item.find("./chunks/chunk[@name='Container']")
            if container is not None:
                items_block = container.find("./items")
                if items_block is not None:
                    id_count_elem = items_block.find("./item[@name='ID_Count']")
                    if id_count_elem is not None and int(id_count_elem.text or 0) > 10:
                        id_items = items_block.findall("./item[@name='ID']")
                        for id_it in id_items:
                            if id_it.text and id_it.text.strip() == ancho_slider_guid:
                                items_block.remove(id_it)
                        remaining = items_block.findall("./item[@name='ID']")
                        id_count_elem.text = str(len(remaining))

    # 3. Insertar un nuevo chunk de tipo Group al final de DefinitionObjects y actualizar attrib count
    definition_chunk = root.find("./chunks/chunk[@name='Definition']")
    objects_chunk = definition_chunk.find("./chunks/chunk[@name='DefinitionObjects']") if definition_chunk is not None else None

    if objects_chunk is not None:
        new_group_guid = str(uuid.uuid4())
        idx = len(objects_chunk)
        
        new_group_chunk = ET.Element("chunk", attrib={"name": "Object", "index": str(idx)})
        
        items_el = ET.SubElement(new_group_chunk, "items", attrib={"count": "2"})
        ET.SubElement(items_el, "item", attrib={"name": "GUID", "type_name": "gh_guid", "type_code": "9"}).text = "c552a431-af5b-46a9-a8a4-0fcbc27ef596"
        ET.SubElement(items_el, "item", attrib={"name": "Name", "type_name": "gh_string", "type_code": "10"}).text = "Group"
        
        chunks_el = ET.SubElement(new_group_chunk, "chunks", attrib={"count": "1"})
        container_chunk = ET.SubElement(chunks_el, "chunk", attrib={"name": "Container"})
        
        c_items = ET.SubElement(container_chunk, "items", attrib={"count": "7"})
        ET.SubElement(c_items, "item", attrib={"name": "Border", "type_name": "gh_int32", "type_code": "3"}).text = "1"
        ET.SubElement(c_items, "item", attrib={"name": "Description", "type_name": "gh_string", "type_code": "10"}).text = "A group of Grasshopper objects"
        ET.SubElement(c_items, "item", attrib={"name": "ID", "type_name": "gh_guid", "type_code": "9"}).text = ancho_slider_guid
        ET.SubElement(c_items, "item", attrib={"name": "ID_Count", "type_name": "gh_int32", "type_code": "3"}).text = "1"
        ET.SubElement(c_items, "item", attrib={"name": "InstanceGuid", "type_name": "gh_guid", "type_code": "9"}).text = new_group_guid
        ET.SubElement(c_items, "item", attrib={"name": "Name", "type_name": "gh_string", "type_code": "10"}).text = "Group"
        ET.SubElement(c_items, "item", attrib={"name": "NickName", "type_name": "gh_string", "type_code": "10"}).text = "RH_IN:Ancho"
        
        objects_chunk.append(new_group_chunk)
        objects_chunk.attrib["count"] = str(len(objects_chunk))
        print(f"  * Insertado nuevo grupo dedicado 'RH_IN:Ancho'. DefinitionObjects count = {objects_chunk.attrib['count']}")

    # 4. Asignar RH_OUT a las salidas preferidas TapaLuz y Frente de Cajon
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

    # Probar /io
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
            print(f"  • {p} -> Tamaño X calculada: {x:.1f} mm")

    test_val(600)
    test_val(900)

if __name__ == "__main__":
    build_perfect_ancho_group()
