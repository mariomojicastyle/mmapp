const sharp = require('sharp');
const fs = require('fs');

async function editImage() {
    const inputPath = 'c:/Desarrollo/mmapp/mariomojica-portfolio/public/portfolio/2026_Mario_Mojica/Silla_Grasshopper/Silla_3D_Print_01.webp';
    const outputPath = 'c:/Desarrollo/mmapp/mariomojica-portfolio/public/portfolio/2026_Mario_Mojica/Silla_Grasshopper/Silla_3D_Print_01_fixed.webp';

    try {
        // Obtenemos metadatos para asegurar las proporciones
        const metadata = await sharp(inputPath).metadata();
        
        // Coordenadas calculadas para el bloque de texto (X: 1996, Y: 1561, W: 359, H: 70)
        // en una imagen de 3834 x 2045.
        // El color es aproximadamente el gris de fondo de Grasshopper (#C9CBCD o similar)
        
        // Creamos un rectángulo de color sólido (gris interfaz)
        const svgRect = Buffer.from(
            `<svg width="359" height="70">
                <rect width="359" height="70" fill="#E8EBED" />
            </svg>`
        );

        await sharp(inputPath)
            .composite([{
                input: svgRect,
                top: 1561,
                left: 1996
            }])
            .webp({ quality: 100, lossless: true })
            .toFile(outputPath);

        console.log(`✅ Edición quirúrgica completada sin pérdida de calidad: ${outputPath}`);
    } catch (err) {
        console.error('❌ Error editando la imagen:', err);
    }
}

editImage();
