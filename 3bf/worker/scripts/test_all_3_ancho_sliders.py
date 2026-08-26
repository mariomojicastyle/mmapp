import xml.etree.ElementTree as ET
import base64
import requests
import json
import rhino3dm
import shutil

def update_all_3_ancho_sliders():
    src = r"C:\Desarrollo\mmapp\temporal\Cajon_Experimental_ShapeDriver_02.ghx"
    dst = r"C:\Desarrollo\mmapp\temporal\Cajon_Experimento_Viktor.ghx"
    dst_compute = r"C:\Desarrollo\mmapp\temporal\Cajon_Experimento_Viktor_RhinoCompute.ghx"
    
    tree = ET.parse(src)
    root = tree.getroot()

    ancho_guids = ["625f42bc-be0f-47f8-a2b4-b934dea0a0d7", "6ec9a07e-28d5-4d79-9799-442008fa037b", "4be9e364-d8d7-4e21-a10e-2fbac8838d91"]

    for item in root.iter("chunk"):
        guid_elem = item.find("./items/item[@name='InstanceGuid']")
        if guid_elem is not None and guid_elem.text in ancho_guids:
            for sub in item.iter("item"):
                if sub.attrib.get("name") == "NickName" and sub.text:
                    sub.text = "RH_IN:Ancho"

    for item in root.iter("chunk"):
        name_elem = item.find("./items/item[@name='Name']")
        if name_elem is not None and name_elem.text == "Group":
            container = item.find("./chunks/chunk[@name='Container']")
            if container is not None:
                items_block = container.find("./items")
                if items_block is not None:
                    nick_item = items_block.find("./item[@name='NickName']")
                    contained = [it.text.strip() for it in items_block.findall("./item[@name='ID']") if it.text]
                    for ag in ancho_guids:
                        if ag in contained:
                            if nick_item is not None:
                                nick_item.text = "RH_IN:Ancho"
                    if nick_item is not None and nick_item.text:
                        txt = nick_item.text.strip().lower()
                        if "tapa" in txt or "frente" in txt or "lateral" in txt or "cubierta" in txt:
                            if not nick_item.text.startswith("RH_OUT:"):
                                nick_item.text = f"RH_OUT:{nick_item.text.strip()}"

    tree.write(dst, encoding="utf-8", xml_declaration=False)
    shutil.copyfile(dst, dst_compute)

    with open(dst, "r", encoding="utf-8") as f:
        xml_str = f.read()
    b64_algo = base64.b64encode(xml_str.encode("utf-8")).decode("utf-8")

    def eval_ancho_3(val):
        vals = [{"ParamName": "RH_IN:Ancho", "InnerTree": {"{0}": [{"type": "System.Double", "data": str(float(val))}]}}]
        for ag in ancho_guids:
            vals.append({"ParamName": ag, "InnerTree": {"{0}": [{"type": "System.Double", "data": str(float(val))}]}})
            
        payload_rc = {
            "algo": b64_algo,
            "pointer": None,
            "values": vals
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
        print(f"\n--- Resultado evaluando Ancho por GUIDs + RH_IN = {val} mm ---")
        for p, x in meshes:
            print(f"  • {p} -> Tamaño X: {x:.1f} mm")

    eval_ancho_3(600)
    eval_ancho_3(900)

if __name__ == "__main__":
    update_all_3_ancho_sliders()
