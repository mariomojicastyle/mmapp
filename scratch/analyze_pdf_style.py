import fitz # PyMuPDF
import collections

pdf_path = r"C:\Desarrollo\mmapp\Referentes_Catalogos\Brand-visual-systems.pdf"
doc = fitz.open(pdf_path)

print(f"Paginas: {len(doc)}")

# 1. Analizar Fuentes
fonts = set()
for page in doc:
    for font in page.get_fonts():
        fonts.add(font[3]) # Nombre de la fuente
print("\nFuentes en el PDF:")
for f in sorted(list(fonts)):
    print(f"- {f}")

# 2. Analizar colores y fondos
# PyMuPDF permite inspeccionar los dibujos en la página (shapes)
colors = collections.Counter()
bg_colors = []

for i in range(min(5, len(doc))):
    page = doc[i]
    drawings = page.get_drawings()
    print(f"\nDibujos en Pagina {i+1}: {len(drawings)}")
    for draw in drawings[:10]:
        if draw['type'] == 's': # rectangulo o path solido
            fill = draw['fill']
            if fill:
                # Convertir a hex
                hex_color = '#{:02x}{:02x}{:02x}'.format(int(fill[0]*255), int(fill[1]*255), int(fill[2]*255))
                colors[hex_color] += 1

print("\nColores de relleno comunes en los primeros dibujos:")
for color, count in colors.most_common(10):
    print(f"- {color}: {count} veces")

# 3. Inspeccionar texto y tamaños para entender la jerarquía
print("\nJerarquía de texto de la Pagina 1 y 2:")
for i in range(2):
    page = doc[i]
    blocks = page.get_text("dict")["blocks"]
    for b in blocks[:15]:
        if "lines" in b:
            for l in b["lines"]:
                for s in l["spans"]:
                    # Imprimir solo si el tamaño es relevante
                    if s["size"] > 10:
                        hex_color = '#{:06x}'.format(s["color"])
                        print(f"P{i+1} Text: '{s['text']}' | Size: {s['size']:.1f} | Font: {s['font']} | Color: {hex_color}")
