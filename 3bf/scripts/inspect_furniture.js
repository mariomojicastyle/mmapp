const fs = require('fs');
const files = fs.readdirSync('G:/Mi unidad/Manuales/RTA Design/Manuales 3D');
console.log('Archivos en Manuales 3D:', files);

// Buscar muebles en G:\Mi unidad
function searchFiles(dir, pattern) {
  let results = [];
  try {
    const list = fs.readdirSync(dir);
    for (const f of list) {
      const full = dir + '/' + f;
      const stat = fs.statSync(full);
      if (stat.isDirectory()) {
        results = results.concat(searchFiles(full, pattern));
      } else if (f.includes(pattern)) {
        results.push(full);
      }
    }
  } catch (e) {}
  return results;
}

const muebles = searchFiles('G:/Mi unidad', '.3bf');
console.log('Muebles .3bf encontrados:', muebles);
if (muebles.length > 0) {
  const mData = JSON.parse(fs.readFileSync(muebles[0], 'utf8'));
  console.log('Mueble id:', mData.id, 'nombre:', mData.nombre);
  const inst = Object.values(mData.instancias || {})[0];
  if (inst && inst.resultado && inst.resultado.real_meshes) {
    const meshes = inst.resultado.real_meshes;
    console.log('Total real_meshes:', meshes.length);
    const hwMeshes = meshes.filter(m => m.name.includes('Porca') || m.name.includes('Cavilha') || m.name.includes('Peça 4'));
    console.log('Meshes relevantes:', hwMeshes.map(m => ({ name: m.name, pos: m.position, size: m.size })));
  }
}
