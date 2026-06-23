import os

pdf_content = b"""%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>
endobj
4 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>
endobj
5 0 obj
<< /Length 135 >>
stream
BT
/F1 24 Tf
100 700 Td
(Garantia del Producto) Tj
/F1 14 Tf
0 -40 Td
(Este es un documento de garantia generico para la plataforma B2B.) Tj
0 -20 Td
(Aqui se presentaran los detalles de la garantia del fabricante.) Tj
ET
endstream
endobj
xref
0 6
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000223 00000 n 
0000000293 00000 n 
trailer
<< /Size 6 /Root 1 0 R >>
startxref
477
%%EOF
"""

dest_dir = r"C:\Desarrollo\mmapp\legacy-aplicativo-armado\public\assets\tips"
os.makedirs(dest_dir, exist_ok=True)
dest_path = os.path.join(dest_dir, "Garantia.pdf")

with open(dest_path, "wb") as f:
    f.write(pdf_content)

print(f"✅ Archivo PDF generado exitosamente en {dest_path}")
