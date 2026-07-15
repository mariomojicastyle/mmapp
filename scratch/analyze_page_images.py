import fitz
import collections

pdf_path = r"C:\Desarrollo\mmapp\Referentes_Catalogos\Brand-visual-systems.pdf"
doc = fitz.open(pdf_path)

# Analizar las páginas 1, 2 y 8 para ver el histograma de colores de los píxeles
for page_num in [0, 1, 7]: # Índices 0, 1, 7 corresponden a Páginas 1, 2, 8
    page = doc[page_num]
    pix = page.get_pixmap()
    
    # Muestrear colores de una rejilla de 50x50 para ver la distribución
    grid_colors = collections.Counter()
    w, h = pix.width, pix.height
    for x in range(0, w, w // 40):
        for y in range(0, h, h // 40):
            # Obtener color del pixel
            c = pix.pixel(x, y)
            hex_c = '#{:02x}{:02x}{:02x}'.format(c[0], c[1], c[2])
            grid_colors[hex_c] += 1
            
    print(f"\nDistribucion de colores en la Pagina {page_num+1}:")
    for color, count in grid_colors.most_common(5):
        print(f"- {color}: {count} pixeles muestreados")
