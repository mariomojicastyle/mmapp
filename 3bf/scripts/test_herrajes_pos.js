const fs = require('fs');
const data = JSON.parse(fs.readFileSync('G:/Mi unidad/Muebles/Henn/CÔMODA/mueble_1789226875940_xq2sn.3bf.json', 'utf8'));
const inst = Object.values(data.instancias || {})[0];
const meshes = inst?.resultado?.real_meshes || [];

// Simular anotador de instancias
const conteos = {};
const annotated = meshes.map(m => {
  const baseName = m.name.replace(/^RH_OUT:/i, '').trim();
  conteos[baseName] = (conteos[baseName] || 0) + 1;
  const num = conteos[baseName];
  const ik = `${baseName} (${num})`;
  return { ...m, instanciaKey: ik, cleanName: baseName };
});

const p4 = annotated.find(m => m.cleanName === 'Peça 4');
console.log('Peça 4 rest pos:', p4.position);

const p3 = annotated.find(m => m.instanciaKey === 'Porca (3)');
console.log('Porca (3) found:', !!p3, p3?.position);

const c49 = annotated.find(m => m.instanciaKey === 'Cavilha (49)');
console.log('Cavilha (49) found:', !!c49, c49?.position);

const p4_porcas = annotated.filter(m => m.cleanName === 'Porca').slice(0, 8);
console.log('Porcas 1-8 pos:', p4_porcas.map(m => ({ ik: m.instanciaKey, pos: m.position })));
