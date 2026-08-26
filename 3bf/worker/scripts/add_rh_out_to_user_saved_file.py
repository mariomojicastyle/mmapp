import xml.etree.ElementTree as ET
import base64
import requests
import json
import rhino3dm
import shutil

def tag_rh_out():
    ghx_path = r"C:\Desarrollo\mmapp\temporal\Cajon_Experimento_Viktor.ghx"
    dst_compute = r"C:\Desarrollo\mmapp\temporal\Cajon_Experimento_Viktor_RhinoCompute.ghx"
    
    tree = ET.parse(ghx_path)
    root = tree.getroot()

    output_keywords = {
        "lateral izquierdo": "RH_OUT:Lateral Izquierdo",
        "lateral derecho": "RH_OUT:Lateral Derecho",
        "cubierta superior": "RH_OUT:Cubierta Superior",
        "cubierta inferior": "RH_OUT:Cubierta Inferior",
        "tapa luz": "RH_OUT:Tapa Luz",
        "tapaluz": "RH_OUT:Tapa Luz",
        "frente": "RH_OUT:Frente de Cajon",
        "lateral izq cajon": "RH_OUT:Lateral Izq Cajon",
        "lateral der cajon": "RH_OUT:Lateral Der Cajon",
        "posterior": "RH_OUT:Posterior de Cajon"
    }

    # 1. Asignar RH_OUT a componentes y grupos de salida
    for item in root.iter("chunk"):
        for sub in item.iter("item"):
            if sub.attrib.get("name") in ["NickName", "Name"] and sub.text:
                txt = sub.text.strip().lower()
                for kw, rh_out in output_keywords.items():
                    if kw in txt and not sub.text.startswith("RH_OUT:") and not sub.text.startswith("RH_IN:"):
                        sub.text = rh_out
                        break

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

    tree.write(ghx_path, encoding="utf-8", xml_declaration=False)
    shutil.copyfile(ghx_path, dst_compute)

    with open(ghx_path, "r", encoding="utf-8") as f:
        xml_str = f.read()
    b64_algo = base64.b64encode(xml_str.encode("utf-8")).decode("utf-8")

    # 2. Diagnóstico /io
    res_io = requests.post("http://localhost:5000/io", json={"algo": b64_algo})
    print("STATUS /io:", res_io.status_code)
    io_data = res_io.json()
    
    print(f"\n--- ENTRADAS REGISTRADAS POR RHINOCOMPUTE ({len(io_data.get('Inputs', []))}) ---")
    for inp in io_data.get("Inputs", []):
        print(f"  • Input: '{inp.get('Name')}' ({inp.get('ParamType')})")
        
    print(f"\n--- SALIDAS REGISTRADAS POR RHINOCOMPUTE ({len(io_data.get('Outputs', []))}) ---")
    for out in io_data.get("Outputs", []):
        print(f"  • Output: '{out.get('Name')}' ({out.get('ParamType')})")

    # 3. Evaluacion con RH_IN:Ancho = 600mm vs 1200mm
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
        print(f"\n--- Evaluando RH_IN:Ancho = {val} mm ---")
        for p, x in meshes:
            print(f"  • {p} -> Tamaño X: {x:.1f} mm")

    test_val(600)
    test_val(1200)

if __name__ == "__main__":
    tag_rh_out()
