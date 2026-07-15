import pypdf
import os

pdf_path = r"C:\Desarrollo\mmapp\Referentes_Catalogos\Brand-visual-systems.pdf"
reader = pypdf.PdfReader(pdf_path)

print(f"Total paginas: {len(reader.pages)}")

# Extraer y mostrar los primeros 200 caracteres de texto de cada página para entender su contenido
for i, page in enumerate(reader.pages):
    text = page.extract_text()
    # Limpiar espacios en blanco
    lines = [line.strip() for line in text.split('\n') if line.strip()]
    header_info = " | ".join(lines[:6]) if lines else "[Sin texto]"
    print(f"Pagina {i+1:02d}: {header_info[:160]}")
