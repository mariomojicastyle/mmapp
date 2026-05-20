const fs = require('fs');
const path = require('path');

const items = [
  'Perno_0007374',
  'Deslizador_007391',
  'Tornillo_0000152',
  'Tornillo_000152',
  'Caja_0007374',
  'Tarugo_20030001',
  'Tuerca_0004674',
  'Corredera_350_20080001'
];

const destDir = 'c:\\Desarrollo\\mmapp\\legacy-aplicativo-armado\\public\\assets\\herrajes';

if (!fs.existsSync(destDir)) {
  fs.mkdirSync(destDir, { recursive: true });
}

async function downloadAll() {
  for (const item of items) {
    const url = `https://3dymedios.com/Prueba/AP/Recursos/Imagenes/Herrajes/${item}.jpg`;
    const dest = path.join(destDir, `${item}.jpg`);
    console.log(`Downloading ${url} to ${dest}...`);
    try {
      const res = await fetch(url);
      if (!res.ok) {
        throw new Error(`HTTP status ${res.status}`);
      }
      const buffer = Buffer.from(await res.arrayBuffer());
      fs.writeFileSync(dest, buffer);
      console.log(`Successfully downloaded ${item}.jpg`);
    } catch (err) {
      console.warn(`Failed to download ${item}.jpg: ${err.message}`);
    }
  }
}

downloadAll();
