import pypdf
import os

pdf_path = r"C:\Desarrollo\mmapp\Referentes_Catalogos\Brand-visual-systems.pdf"
reader = pypdf.PdfReader(pdf_path)

output_file = r"C:\Desarrollo\mmapp\scratch\pdf_full_text.txt"

with open(output_file, "w", encoding="utf-8") as out:
    for i, page in enumerate(reader.pages):
        text = page.extract_text()
        out.write(f"=== PAGINA {i+1} ===\n")
        out.write(text)
        out.write("\n\n")

print(f"Texto completo extraido a: {output_file}")
# Mostrar resúmenes de cada página para el log
for i, page in enumerate(reader.pages):
    text = page.extract_text()
    lines = [l.strip() for l in text.split("\n") if l.strip()]
    title = lines[0] if len(lines) > 0 else "[Sin contenido]"
    sub = lines[1] if len(lines) > 1 else ""
    print(f"P{i+1:02d}: {title} | {sub[:60]}")
