import xml.etree.ElementTree as ET
import base64
import requests
import json
import rhino3dm
import shutil

def test_only_ancho():
    src = r"C:\Desarrollo\mmapp\temporal\Cajon_Experimental_ShapeDriver_02.ghx"
    dst = r"C:\Desarrollo\mmapp\temporal\Cajon_Experimento_Viktor.ghx"
    
    tree = ET.parse(src)
    root = tree.getroot()

    ancho_guid = "625f42bc-be0f-47f8-a2b4-b934dea0a0d7"

    # 1. Asignar RH_IN:Ancho al slider Ancho
    for item in root.iter("chunk"):
        guid_elem = item.find("./items/item[@name='InstanceGuid']")
        if guid_elem is not None and guid_elem.text == ancho_guid:
            for sub in item.iter("item"):
                if sub.attrib.get("name") in ["NickName", "Name"] and sub.text:
                    sub.text = "RH_IN:Ancho"

    # 2. Asignar RH_IN:Ancho al grupo del slider Ancho
    for item in root.iter("chunk"):
        name_elem = item.find("./items/item[@name='Name']")
        if name_elem is not None and name_elem.text == "Group":
            container = item.find("./chunks/chunk[@name='Container']")
            if container is not None:
                items_block = container.find("./items")
                if items_block is not None:
                    nick_item = items_block.find("./item[@name='NickName']")
                    contained = [it.text.strip() for it in items_block.findall("./item[@name='ID']") if it.text]
                    if ancho_guid in contained:
                        if nick_item is not None:
                            nick_item.text = "RH_IN:Ancho"

    # 3. Mantener las salidas RH_OUT para la visualización del mueble
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
    shutil.copyfile(dst, r"C:\Desarrollo\mmapp\temporal\Cajon_Experimento_Viktor_RhinoCompute.ghx")

    # Probar evaluación del slider Ancho en 600mm y 900mm
    with open(dst, "r", encoding="utf-8") as f:
        xml_str = f.read()
    b64_algo = base64.b64encode(xml_str.encode("utf-8")).decode("utf-8")

    def eval_ancho(val):
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

    eval_ancho(600)
    eval_ancho(900)

if __name__ == "__main__":
    test_only_ancho()
