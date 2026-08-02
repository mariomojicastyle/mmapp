import xml.etree.ElementTree as ET

def fix_nicknames():
    ghx_path = r"C:\Desarrollo\mmapp\temporal\Cajon_Experimento_Viktor.ghx"
    dst_path = r"C:\Desarrollo\mmapp\temporal\Cajon_Experimento_Viktor_RhinoCompute.ghx"
    
    with open(ghx_path, "r", encoding="utf-8") as f:
        xml_str = f.read()

    # Reemplazar el NickName genérico 'Value List' por RH_IN:Cantidada de Cajones en el componente
    print("=== ASIGNANDO RH_IN AL COMPONENTE COMPONENTE VALUE LIST ===")
    
    # 1. Asignar RH_IN:Cantidada de Cajones al componente Value List correspondiente
    pattern_old = '<item name="Name" type_name="gh_string" type_code="10">Value List</item>\n                    <item name="NickName" type_name="gh_string" type_code="10">Value List</item>'
    
    # Encontrar Value List de Cajones en el XML
    tree = ET.parse(ghx_path)
    root = tree.getroot()
    
    count_replaced = 0
    for chunk in root.iter("chunk"):
        if chunk.attrib.get("name") == "Object":
            # Verificar si es un Value List
            name_item = chunk.find("items/item[@name='Name']")
            nick_item = chunk.find("items/item[@name='NickName']")
            
            if name_item is not None and name_item.text == "Value List":
                # Ver los items internos del Value List
                vl_items = chunk.find("chunks/chunk[@name='Container']/items/item[@name='UserList']")
                if vl_items is not None and "Cajon" in str(vl_items.text):
                    print(f"  • Encontrado Value List de Cajones: '{vl_items.text}'")
                    nick_item.text = "RH_IN:Cantidada de Cajones"
                    count_replaced += 1
                elif vl_items is not None and ("351" in str(vl_items.text) or "300" in str(vl_items.text)):
                    print(f"  • Encontrado Value List de Profundidad Cajon: '{vl_items.text}'")
                    nick_item.text = "RH_IN:Profundidad cajon"
                    count_replaced += 1
                elif vl_items is not None and ("102" in str(vl_items.text) or "100" in str(vl_items.text)):
                    print(f"  • Encontrado Value List de Altura Lateral: '{vl_items.text}'")
                    nick_item.text = "RH_IN:Altura lateral de cajon"
                    count_replaced += 1

    tree.write(dst_path, encoding="utf-8", xml_declaration=True)
    print(f"[OK] {count_replaced} Value Lists actualizados con RH_IN: en {dst_path}")

if __name__ == "__main__":
    fix_nicknames()
