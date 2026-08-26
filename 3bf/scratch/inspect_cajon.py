import os
import xml.etree.ElementTree as ET
import requests

ghx_path = r"C:\Desarrollo\mmapp\3BF\Definiciones\Cajon_Experimento_3DBimFab.ghx"

if not os.path.exists(ghx_path):
    print(f"File not found: {ghx_path}")
else:
    print(f"Found file: {ghx_path}, size: {os.path.getsize(ghx_path)} bytes")

    # Let's inspect RH_OUT or RH_IN components in Cajon_Experimento_3DBimFab.ghx
    tree = ET.parse(ghx_path)
    root = tree.getroot()

    rh_inputs = []
    rh_outputs = []

    for chunk in root.iter("chunk"):
        if chunk.attrib.get("name") == "Container":
            name = ""
            nickname = ""
            for item in chunk.findall("items/item"):
                if item.attrib.get("name") == "Name":
                    name = item.text
                elif item.attrib.get("name") == "NickName":
                    nickname = item.text
            if name and (name.startswith("RH_IN") or name.startswith("RH_OUT") or "Rhino" in name):
                rh_inputs.append((name, nickname))
            elif nickname and ("RH_" in nickname or "RH_IN" in nickname or "RH_OUT" in nickname):
                rh_outputs.append((name, nickname))

    print("RH Inputs/Outputs found:")
    for item in root.iter("chunk"):
        if item.attrib.get("name") == "Container":
            for it in item.findall("items/item"):
                if it.attrib.get("name") == "Name" and it.text and ("RH_" in it.text or "Rhino" in it.text):
                    print("  Name:", it.text)
                if it.attrib.get("name") == "NickName" and it.text and ("RH_" in it.text or "Rhino" in it.text):
                    print("  NickName:", it.text)

