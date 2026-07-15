import re
import os

def count_pages(pdf_path):
    try:
        with open(pdf_path, 'rb') as f:
            content = f.read()
        # Buscar el patrón /Count en el PDF
        matches = re.findall(b'/Type\s*/Pages\s*/Count\s*(\d+)', content)
        if matches:
            return int(matches[-1])
        # Intentar otro patrón común
        matches2 = re.findall(b'/Count\s*(\d+)', content)
        if matches2:
            return int(matches2[-1])
        # Fallback usando búsqueda de /Page
        page_matches = re.findall(b'/Type\s*/Page\b', content)
        return len(page_matches)
    except Exception as e:
        return f"Error: {e}"

folder = r"C:\Desarrollo\mmapp\Referentes_Catalogos"
for file in os.listdir(folder):
    if file.lower().endswith('.pdf'):
        path = os.path.join(folder, file)
        print(f"{file}: {count_pages(path)} paginas")
