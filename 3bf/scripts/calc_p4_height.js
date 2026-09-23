const fs = require('fs');
const THREE = require('three');

const mData = JSON.parse(fs.readFileSync('G:/Mi unidad/Muebles/Henn/CÔMODA/mueble_1789226875940_xq2sn.3bf.json', 'utf8'));
const inst = Object.values(mData.instancias || {})[0];
const meshes = inst?.resultado?.real_meshes || [];

const p4 = meshes.find(m => m.name.includes('Peça 4'));
console.log('Peça 4 size:', p4.size); // [1.239, 0.012, 0.08]
console.log('Peça 4 pos local:', p4.position); // [0.6475, 0.129, -0.06]

// Simular furnitureGroup con rotación [90, 0, 0] y apoyo en piso
// En SingleFurnitureInstanceMesh:
// rotMat = Rotation X 90 deg
const rotMat = new THREE.Matrix4().makeRotationX(THREE.MathUtils.degToRad(90));

// Calcular localBox de todas las mallas
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
const offsetY = -minYRotado;
const groupPos = new THREE.Vector3(-rotatedCenter.x, offsetY, -rotatedCenter.z);

console.log('Group pos en piso:', groupPos);

// Ahora calcular la posición MUNDIAL de Peça 4 con pRest:
// En Three.js: worldPos = group.localToWorld(pRest.clone())
// group matrix: T(groupPos) * R(rotMat)
const groupMatrix = new THREE.Matrix4().compose(groupPos, new THREE.Quaternion().setFromEuler(new THREE.Euler(THREE.MathUtils.degToRad(90), 0, 0, 'XYZ')), new THREE.Vector3(1,1,1));

const p4_pRest = new THREE.Vector3(...p4.position);
const p4_worldRest = p4_pRest.clone().applyMatrix4(groupMatrix);
console.log('Peça 4 world rest:', p4_worldRest);

// Bounding box mundial de Peça 4 en rest:
const p4_box = new THREE.Box3();
for (let i = 0; i < p4.vertices.length; i += 3) {
  const vLocal = new THREE.Vector3(p4.position[0] + p4.vertices[i], p4.position[1] + p4.vertices[i+1], p4.position[2] + p4.vertices[i+2]);
  const vWorld = vLocal.applyMatrix4(groupMatrix);
  p4_box.expandByPoint(vWorld);
}
console.log('Peça 4 world box min:', p4_box.min, 'max:', p4_box.max);
console.log('Peça 4 altura sobre el piso (min.y):', p4_box.min.y, 'metros (', (p4_box.min.y * 100).toFixed(1), 'cm )');
