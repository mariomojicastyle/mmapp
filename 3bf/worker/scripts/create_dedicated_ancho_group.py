import xml.etree.ElementTree as ET
import base64
import requests
import json
import rhino3dm
import shutil
import uuid

def create_dedicated_group():
    print("=== Creando un Grupo RH_IN:Ancho dedicado EXCLUSIVAMENTE al Slider Ancho ===")
    src = r"C:\Desarrollo\mmapp\temporal\Cajon_Experimental_ShapeDriver_02.ghx"
    dst = r"C:\Desarrollo\mmapp\temporal\Cajon_Experimento_Viktor.ghx"
    dst_compute = r"C:\Desarrollo\mmapp\temporal\Cajon_Experimento_Viktor_RhinoCompute.ghx"
    
    tree = ET.parse(src)
    root = tree.getroot()

    ancho_slider_guid = "625f42bc-be0f-47f8-a2b4-b934dea0a0d7"

    # 1. Remover el GUID del Slider Ancho de cualquier grupo gigante existente
    for item in root.iter("chunk"):
        name_elem = item.find("./items/item[@name='Name']")
        if name_elem is not None and name_elem.text == "Group":
            container = item.find("./chunks/chunk[@name='Container']")
            if container is not None:
                items_block = container.find("./items")
                if items_block is not None:
                    # Filtrar elementos ID para remover el slider ancho
                    id_items = items_block.findall("./item[@name='ID']")
                    for id_it in id_items:
                        if id_it.text and id_it.text.strip() == ancho_slider_guid:
                            items_block.remove(id_it)
                            print("  • Slider Ancho removido de grupo gigante anterior.")
                    # Actualizar ID_Count
                    remaining_ids = items_block.findall("./item[@name='ID']")
                    count_it = items_block.find("./item[@name='ID_Count']")
                    if count_it is not None:
                        count_it.text = str(len(remaining_ids))

    # 2. Asignar el NickName 'RH_IN:Ancho' al Slider Ancho
    for item in root.iter("chunk"):
        guid_elem = item.find("./items/item[@name='InstanceGuid']")
        if guid_elem is not None and guid_elem.text == ancho_slider_guid:
            for sub in item.iter("item"):
                if sub.attrib.get("name") == "NickName" and sub.text:
                    sub.text = "RH_IN:Ancho"

    # 3. Construir un nuevo chunk de tipo Group DEDICADO solo para el Slider Ancho
    definition_chunk = root.find("./chunks/chunk[@name='Definition']")
    objects_chunk = definition_chunk.find("./chunks/chunk[@name='DefinitionObjects']") if definition_chunk is not None else None

    if objects_chunk is not None:
        new_group_guid = str(uuid.uuid4())
        
        # Crear estructura de grupo dedicada
        new_group_chunk = ET.Element("chunk", attrib={"name": "Object", "index": str(len(objects_chunk))})
        
        items_el = ET.SubElement(new_group_chunk, "items", attrib={"count": "2"})
        ET.SubElement(items_el, "item", attrib={"name": "GUID", "type_name": "gh_guid", "type_code": "9"}).text = "c552a431-af5b-46a9-a8a4-0fcbc27ef596"
        ET.SubElement(items_el, "item", attrib={"name": "Name", "type_name": "gh_string", "type_code": "10"}).text = "Group"
        
        chunks_el = ET.SubElement(new_group_chunk, "chunks", attrib={"count": "1"})
        container_chunk = ET.SubElement(chunks_el, "chunk", attrib={"name": "Container"})
        
        c_items = ET.SubElement(container_chunk, "items", attrib={"count": "6"})
        ET.SubElement(c_items, "item", attrib={"name": "Border", "type_name": "gh_int32", "type_code": "3"}).text = "1"
        ET.SubElement(c_items, "item", attrib={"name": "Description", "type_name": "gh_string", "type_code": "10"}).text = "Grupo RH_IN de Ancho"
        ET.SubElement(c_items, "item", attrib={"name": "ID", "type_name": "gh_guid", "type_code": "9"}).text = ancho_slider_guid
        ET.SubElement(c_items, "item", attrib={"name": "ID_Count", "type_name": "gh_int32", "type_code": "3"}).text = "1"
        ET.SubElement(c_items, "item", attrib={"name": "InstanceGuid", "type_name": "gh_guid", "type_code": "9"}).text = new_group_guid
        ET.SubElement(c_items, "item", attrib={"name": "Name", "type_name": "gh_string", "type_code": "10"}).text = "Group"
        ET.SubElement(c_items, "item", attrib={"name": "NickName", "type_name": "gh_string", "type_code": "10"}).text = "RH_IN:Ancho"
        
        objects_chunk.append(new_group_chunk)
        print(f"  • Creado nuevo grupo dedicado 'RH_IN:Ancho' (GUID: {new_group_guid})")

    # 4. Mantener las salidas RH_OUT para la visualización del mueble
    output_keywords = {
        "lateral izquierdo": "RH_OUT:Lateral Izquierdo",
        "lateral derecho": "RH_OUT:Lateral Derecho",
        "cubierta superior": "RH_OUT:Cubierta Superior",
        "cubierta inferior": "RH_OUT:Cubierta Inferior",
        "tapa luz": "RH_OUT:Tapa Luz",
        "tapaluz": "RH_OUT:Tapa Luz",
        "frente": "RH_OUT:Frente de Cajon",
        "lateral izq cajon": "RH_OUT:Lateral Izq Cajon",
        "lateral der cajon": "RH_OUT:Lateral Der Cajon"
    }

    for item in root.iter("chunk"):
        name_elem = item.find("./items/item[@name='Name']")
        if name_elem is not None and name_elem.text == "Group":
            container = item.find("./chunks/chunk[@name='Container']")
            if container is not None:
                items_block = container.find("./items")
                if items_block is not None:
                    nick_item = items_block.find("./item[@name='NickName']")
                    if nick_item is not None and nick_item.text:
                        txt = nick_item.text.strip().lower()
                        for kw, rh_out in output_keywords.items():
                            if kw in txt and not nick_item.text.startswith("RH_OUT:") and not nick_item.text.startswith("RH_IN:"):
                                nick_item.text = rh_out
                                break

    tree.write(dst, encoding="utf-8", xml_declaration=False)
    shutil.copyfile(dst, dst_compute)

    # Diagnosticar /io
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

    # Evaluacion con RH_IN:Ancho = 800mm vs 600mm
    def eval_test(val):
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
        print(f"\n--- Evaluación Ancho = {val} mm ---")
        for p, x in meshes:
            print(f"  • {p} -> Tamaño X: {x:.1f} mm")

    eval_test(600)
    eval_test(850)

if __name__ == "__main__":
    create_dedicated_group()
