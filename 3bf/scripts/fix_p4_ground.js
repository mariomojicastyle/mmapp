const fs = require('fs');
const THREE = require('three');

// Cargar manual
const mPath = 'G:/Mi unidad/Manuales/RTA Design/Manuales 3D/manual_1_comoda_ravenna.3bm.json';
const manual = JSON.parse(fs.readFileSync(mPath, 'utf8'));

// Cargar mueble para matrices
const furnPath = 'G:/Mi unidad/Muebles/Henn/CÔMODA/mueble_1789226875940_xq2sn.3bf.json';
const furn = JSON.parse(fs.readFileSync(furnPath, 'utf8'));
const inst = Object.values(furn.instancias || {})[0];
const meshes = inst?.resultado?.real_meshes || [];

const p4Mesh = meshes.find(m => m.name.includes('Peça 4'));
console.log('Peça 4 size:', p4Mesh.size, 'pos:', p4Mesh.position);

// Orientacion banco en P03: rotación [90, 0, 0] y apoyo en piso
const rotMat = new THREE.Matrix4().makeRotationX(THREE.MathUtils.degToRad(90));
const localBox = new THREE.Box3();
for (const m of meshes) {
  const pX = m.position ? m.position[0] : 0;
  const pY = m.position ? m.position[1] : 0;
  const pZ = m.position ? m.position[2] : 0;
  if (m.vertices && m.vertices.length >= 3) {
    for (let i = 0; i < m.vertices.length; i += 3) {
      localBox.expandByPoint(new THREE.Vector3(pX + m.vertices[i], pY + m.vertices[i+1], pZ + m.vertices[i+2]));
    }
  }
}
const unrotatedCenter = new THREE.Vector3();
localBox.getCenter(unrotatedCenter);
const corners = [
  new THREE.Vector3(localBox.min.x, localBox.min.y, localBox.min.z),
  new THREE.Vector3(localBox.min.x, localBox.min.y, localBox.max.z),
  new THREE.Vector3(localBox.min.x, localBox.max.y, localBox.min.z),
  new THREE.Vector3(localBox.min.x, localBox.max.y, localBox.max.z),
  new THREE.Vector3(localBox.max.x, localBox.min.y, localBox.min.z),
  new THREE.Vector3(localBox.max.x, localBox.min.y, localBox.max.z),
  new THREE.Vector3(localBox.max.x, localBox.max.y, localBox.min.z),
  new THREE.Vector3(localBox.max.x, localBox.max.y, localBox.max.z),
];
let minYRotado = Infinity;
for (const c of corners) {
  const cRot = c.clone().applyMatrix4(rotMat);
  if (cRot.y < minYRotado) minYRotado = cRot.y;
}
const rotatedCenter = unrotatedCenter.clone().applyMatrix4(rotMat);
const groupPos = new THREE.Vector3(-rotatedCenter.x, -minYRotado, -rotatedCenter.z);
const groupQuat = new THREE.Quaternion().setFromEuler(new THREE.Euler(THREE.MathUtils.degToRad(90), 0, 0, 'XYZ'));
const groupMatrix = new THREE.Matrix4().compose(groupPos, groupQuat, new THREE.Vector3(1, 1, 1));
const invGroupMatrix = groupMatrix.clone().invert();

// Calcular bounding box de Peça 4 en rest
const p4_box_local = new THREE.Box3();
for (let i = 0; i < p4Mesh.vertices.length; i += 3) {
  p4_box_local.expandByPoint(new THREE.Vector3(
    p4Mesh.position[0] + p4Mesh.vertices[i],
    p4Mesh.position[1] + p4Mesh.vertices[i+1],
    p4Mesh.position[2] + p4Mesh.vertices[i+2]
  ));
}
// Transformar a world
const p4_box_world = p4_box_local.clone().applyMatrix4(groupMatrix);
const p4_world_rest = new THREE.Vector3(...p4Mesh.position).applyMatrix4(groupMatrix);
console.log('p4_world_rest:', p4_world_rest);
console.log('p4_box_world min.y:', p4_box_world.min.y, 'max.y:', p4_box_world.max.y);

// Para que el fondo toque Y = 0 (el suelo):
// La altura actual de su fondo es p4_box_world.min.y (0.02m)
// En el suelo, su fondo debe ser Y = 0.
// Queremos colocar Peça 4 sobre el suelo enfrente (Z positivo, ej. Z = 0.20m o desplazada):
const targetWorld = new THREE.Vector3(
  p4_world_rest.x,
  p4_world_rest.y - p4_box_world.min.y, // <-- Toca el suelo exactamente (Y = 0)
  p4_world_rest.z + 0.35 // Separada 35cm hacia adelante sobre el suelo
);

// Convertir a local space:
const targetLocal = targetWorld.clone().applyMatrix4(invGroupMatrix);
const pRestLocal = new THREE.Vector3(...p4Mesh.position);
const deltaLocal = targetLocal.clone().sub(pRestLocal);

console.log('targetWorld en suelo:', targetWorld);
console.log('deltaLocal para poner en suelo:', deltaLocal);
console.log('offset en cm: X=', Math.round(deltaLocal.x * 100), 'Y=', Math.round(deltaLocal.y * 100), 'Z=', Math.round(deltaLocal.z * 100));
