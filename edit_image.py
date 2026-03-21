from PIL import Image, ImageDraw
import os

def clean_portfolio_image(input_path, output_path):
    # Abrir la imagen original
    with Image.open(input_path) as img:
        # Coordenadas sugeridas con margen de seguridad (X: 1996, Y: 1561, W: 359, H: 70)
        # Se calculan respecto a la imagen original de 3834 x 2045
        rect_x, rect_y = 1996, 1561
        rect_w, rect_h = 359, 70
        
        # Obtener el color del fondo (gris de la interfaz de Grasshopper) 
        # Tomando una muestra de un píxel cercano al área de texto
        pixel_color = img.getpixel((2000, 1550)) # Un poco arriba del texto
        
        # Dibujar el rectángulo para ocultar el texto
        draw = ImageDraw.Draw(img)
        draw.rectangle([rect_x, rect_y, rect_x + rect_w, rect_y + rect_h], fill=pixel_color)
        
        # Guardar en WebP manteniendo la máxima calidad (100)
        img.save(output_path, "WEBP", quality=100, lossless=True)
        print(f"✅ Imagen guardada exitosamente en: {output_path}")

# Rutas
original_path = r"c:\Desarrollo\mmapp\mariomojica-portfolio\public\portfolio\2026_Mario_Mojica\Silla_Grasshopper\Silla_3D_Print_01.webp"
new_path = r"c:\Desarrollo\mmapp\mariomojica-portfolio\public\portfolio\2026_Mario_Mojica\Silla_Grasshopper\Silla_3D_Print_01_fixed.webp"

if __name__ == "__main__":
    if os.path.exists(original_path):
        clean_portfolio_image(original_path, new_path)
    else:
        print(f"❌ No se encontró la imagen en {original_path}")
