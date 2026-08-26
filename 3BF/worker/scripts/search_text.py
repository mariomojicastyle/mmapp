import re

def search_text():
    ghx_path = r"C:\Desarrollo\mmapp\temporal\Cajon_Experimento_Viktor.ghx"
    with open(ghx_path, "r", encoding="utf-8") as f:
        xml_str = f.read()

    matches = [m.start() for m in re.finditer("RH_IN", xml_str)]
    print(f"Total 'RH_IN' encontrados en el XML: {len(matches)}")
    for pos in matches:
        snippet = xml_str[max(0, pos-100):min(len(xml_str), pos+300)]
        print("\n--- SNIPPET RH_IN ---")
        print(snippet)

if __name__ == "__main__":
    search_text()
