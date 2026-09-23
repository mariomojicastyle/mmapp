const fs = require('fs');
const THREE = require('three');

const mData = JSON.parse(fs.readFileSync('G:/Mi unidad/Muebles/Henn/CÔMODA/mueble_1789226875940_xq2sn.3bf.json', 'utf8'));
const inst = Object.values(mData.instancias || {})[0];
const meshes = inst?.resultado?.real_meshes || [];

const conteos = {};
const annotated = meshes.map(m => {
  const baseName = m.name.replace(/^RH_OUT:/i, '').trim();
  conteos[baseName] = (conteos[baseName] || 0) + 1;
  return { ...m, instanciaKey: `${baseName} (${conteos[baseName]})`, cleanName: baseName };
});

const p4 = annotated.find(m => m.cleanName === 'Peça 4');
const tPos = new THREE.Vector3(...p4.position);
const box = new THREE.Box3();
for (let i = 0; i < p4.vertices.length; i += 3) {
  box.expandByPoint(new THREE.Vector3(tPos.x + p4.vertices[i], tPos.y + p4.vertices[i+1], tPos.z + p4.vertices[i+2]));
}

console.log('Peça 4 box:', box.min, box.max);

const herrajes = annotated.filter(m => !m.cleanName.startsWith('Peça'));
const herrajesP4 = [];

for (const h of herrajes) {
  const hPos = new THREE.Vector3(...h.position);
  const d = box.distanceToPoint(hPos);
  if (d <= 0.02) { // 2 cm de tolerancia
    herrajesP4.push({ name: h.instanciaKey, pos: h.position, dist: (d*100).toFixed(2) });
  }
}

console.log('Herrajes que pertenecen a Peça 4:', herrajesP4);
