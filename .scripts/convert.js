const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

/**
 * Convierte una imagen JPG a WebP
 * @param {string} inputPath Ruta del archivo original
 * @param {string} outputPath Ruta donde se guardará el WebP
 */
async function convertToWebp(inputPath, outputPath) {
    try {
        await sharp(inputPath)
            .webp({ quality: 80 }) // Calidad balanceada
            .toFile(outputPath);
        console.log(`✅ Convertido: ${path.basename(inputPath)} -> ${path.basename(outputPath)}`);
    } catch (error) {
        console.error(`❌ Error al convertir ${inputPath}:`, error.message);
    }
}

// Argumentos de línea de comandos: node convert.js [input] [output]
const args = process.argv.slice(2);
const inputFile = args[0];
let outputFile = args[1];

if (!inputFile) {
    console.error('Uso: node convert.js <archivo_origen_jpg> [archivo_destino_webp]');
    process.exit(1);
}

if (!outputFile) {
    outputFile = inputFile.replace(path.extname(inputFile), '.webp');
}

// Verificar existencia del archivo
if (!fs.existsSync(inputFile)) {
    console.error(`Error: El archivo "${inputFile}" no existe.`);
    process.exit(1);
}

convertToWebp(inputFile, outputFile);
