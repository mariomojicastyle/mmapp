const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

/**
 * Convierte una imagen a WebP
 */
async function convertToWebp(inputPath, outputPath, quality = 80) {
    try {
        await sharp(inputPath)
            .webp({ quality })
            .toFile(outputPath);
        return { success: true, file: path.basename(inputPath) };
    } catch (error) {
        return { success: false, file: path.basename(inputPath), error: error.message };
    }
}

/**
 * Procesa recursivamente o por carpeta
 */
async function processFolder(folderPath, recursive = false, excludeList = []) {
    const files = fs.readdirSync(folderPath);
    const results = [];

    for (const file of files) {
        const fullPath = path.join(folderPath, file);
        const stat = fs.statSync(fullPath);

        // Verificar si el archivo/carpeta está en la lista de exclusión
        if (excludeList.some(excludePath => fullPath.includes(excludePath))) {
            continue;
        }

        if (stat.isDirectory() && recursive) {
            const subResults = await processFolder(fullPath, recursive, excludeList);
            results.push(...subResults);
        } else if (stat.isFile() && /\.(jpe?g|png)$/i.test(file)) {
            const outputPath = fullPath.replace(path.extname(fullPath), '.webp');
            const result = await convertToWebp(fullPath, outputPath);
            results.push(result);
        }
    }
    return results;
}

const args = process.argv.slice(2);
const target = args.find(arg => !arg.startsWith('-')) || '.';
const isRecursive = args.includes('--recursive') || args.includes('-r');
const excludeArgs = args.filter(arg => arg.startsWith('--exclude=')).map(arg => arg.split('=')[1]);

if (!fs.existsSync(target)) {
    console.error(`Error: El destino "${target}" no existe.`);
    process.exit(1);
}

const stat = fs.statSync(target);

(async () => {
    console.log(`🚀 Iniciando conversión en: ${target}${isRecursive ? ' (recursivo)' : ''}`);
    if (excludeArgs.length > 0) console.log(`🚫 Excluyendo: ${excludeArgs.join(', ')}`);

    let results = [];
    if (stat.isDirectory()) {
        results = await processFolder(target, isRecursive, excludeArgs);
    } else {
        const outputPath = target.replace(path.extname(target), '.webp');
        results = [await convertToWebp(target, outputPath)];
    }


    const successCount = results.filter(r => r.success).length;
    const failCount = results.length - successCount;

    console.log(`\n✅ Completado: ${successCount} archivos.`);
    if (failCount > 0) {
        console.log(`❌ Fallidos: ${failCount} archivos.`);
        results.filter(r => !r.success).forEach(r => console.log(`   - ${r.file}: ${r.error}`));
    }
})();
