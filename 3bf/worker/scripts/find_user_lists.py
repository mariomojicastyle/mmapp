import xml.etree.ElementTree as ET

def find_user_lists():
    ghx_path = r"C:\Desarrollo\mmapp\temporal\Cajon_Experimento_Viktor.ghx"
    tree = ET.parse(ghx_path)
    root = tree.getroot()

    print("=== TODOS LOS USERLIST ENCONTRADOS EN EL ARCHIVO DE GRASSHOPPER ===")
    for item in root.iter("item"):
        if item.attrib.get("name") == "UserList":
            print("\n--- USERLIST ---")
            print(item.text)

if __name__ == "__main__":
    find_user_lists()
