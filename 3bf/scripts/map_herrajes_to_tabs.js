const fs = require('fs');
const THREE = require('three');

const mData = JSON.parse(fs.readFileSync('G:/Mi unidad/Muebles/Henn/CÔMODA/mueble_1789226875940_xq2sn.3bf.json', 'utf8'));
const inst = Object.values(mData.instancias || {})[0];
const meshes = inst?.resultado?.real_meshes || [];

// Asignar instanciaKey
const conteos = {};
const annotated = meshes.map(m => {
  const baseName = m.name.replace(/^RH_OUT:/i, '').trim();
  conteos[baseName] = (conteos[baseName] || 0) + 1;
  return { ...m, instanciaKey: `${baseName} (${conteos[baseName]})`, cleanName: baseName };
});

const tableros = annotated.filter(m => m.cleanName.startsWith('Peça'));
const herrajes = annotated.filter(m => !m.cleanName.startsWith('Peça'));

console.log('Tableros totales:', tableros.length);
console.log('Herrajes totales:', herrajes.length);

// Para cada herraje de Capa 01 ("Porca (3)", "Cavilha (49)", "Porca (4)", "Cavilha (50)"):
// Encontrar a qué tablero está más cerca en distancia euclidiana:
const targets = ['Porca (3)', 'Cavilha (49)', 'Porca (4)', 'Cavilha (50)', 'Porca (1)', 'Cavilha (43)', 'Porca (2)', 'Cavilha (44)'];

for (const tName of targets) {
  const h = herrajes.find(x => x.instanciaKey === tName);
  if (!h) {
    console.log(tName, 'NO ENCONTRADO');
    continue;
  }
  const hPos = new THREE.Vector3(...h.position);
  let minDist = Infinity;
  let closestTab = null;
  for (const tab of tableros) {
    const tPos = new THREE.Vector3(...tab.position);
    // Bounding box del tablero
    const box = new THREE.Box3();
    if (tab.vertices && tab.vertices.length >= 3) {
      for (let i = 0; i < tab.vertices.length; i += 3) {
        box.expandByPoint(new THREE.Vector3(tPos.x + tab.vertices[i], tPos.y + tab.vertices[i+1], tPos.z + tab.vertices[i+2]));
      }
    } else {
      box.setFromCenterAndSize(tPos, new THREE.Vector3(...tab.size));
    }
    const d = box.distanceToPoint(hPos);
    if (d < minDist) {
      minDist = d;
      closestTab = tab.instanciaKey;
    }
  }
  console.log(`${tName} en [${h.position.map(v=>v.toFixed(3))}]: más cercano a ${closestTab} (distancia: ${(minDist*100).toFixed(2)} cm)`);
}
