const fs = require('fs');
const p = 'G:/Mi unidad/Manuales/RTA Design/Manuales 3D/manual_1_comoda_ravenna.3bm.json';
const data = JSON.parse(fs.readFileSync(p, 'utf8'));
console.log('Nombre:', data.nombre);
console.log('Pasos:', data.pasos.length);
data.pasos.forEach(paso => {
  console.log(`\nPASO ${paso.id}: ${paso.titulo}`);
  if (paso.multiplePlus?.capas) {
    console.log(`  MultiplePlus capas (${paso.multiplePlus.capas.length}):`);
    paso.multiplePlus.capas.forEach(c => {
      const tabs = (c.tableros || []).map(t => `${t.id} (offX=${t.offsetXCm}, offY=${t.offsetYCm}, offZ=${t.offsetZCm})`).join(', ');
      const hw = (c.herrajes || []).map(h => h.id).join(', ');
      console.log(`    Capa "${c.nombre}": tableros=[${tabs}], herrajes=[${hw}]`);
    });
  }
});
