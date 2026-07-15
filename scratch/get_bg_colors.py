import fitz

pdf_path = r"C:\Desarrollo\mmapp\Referentes_Catalogos\Brand-visual-systems.pdf"
doc = fitz.open(pdf_path)

for i in range(len(doc)):
    page = doc[i]
    pix = page.get_pixmap()
    # Tomar la muestra del pixel de la esquina superior izquierda (10, 10) para el color de fondo
    color_sample = pix.pixel(10, 10)
    # Convertir a hexadecimal
    hex_color = '#{:02x}{:02x}{:02x}'.format(color_sample[0], color_sample[1], color_sample[2])
    print(f"Pagina {i+1:02d} Fondo: {hex_color}")
