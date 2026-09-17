import * as THREE from "three";
import { SubBloqueArmado } from "../store";
import { extraerPiezaMadre } from "../piezaMadreUtils";
export { extraerPiezaMadre };

/**
 * Asegura que el objeto tenga guardado su estado CAD original inmutable.
 * Este estado representa el diseño exacto original sin ninguna transformación de banco.
 */
export function asegurarCadOriginal(obj: THREE.Object3D) {
  if (!obj.userData.__cadOrigPosition) {
    const init = obj.userData.initialPosition;
    if (init && typeof init.clone === "function") {
      obj.userData.__cadOrigPosition = init.clone();
    } else if (init && typeof init.x === "number") {
      obj.userData.__cadOrigPosition = new THREE.Vector3(init.x, init.y, init.z);
    } else {
      obj.userData.__cadOrigPosition = obj.position ? obj.position.clone() : new THREE.Vector3();
    }

    obj.userData.__cadOrigQuaternion = obj.quaternion ? obj.quaternion.clone() : new THREE.Quaternion();
    obj.userData.__cadOrigScale = obj.scale ? obj.scale.clone() : new THREE.Vector3(1, 1, 1);
    obj.userData.__cadOrigMatrix = new THREE.Matrix4().compose(
      obj.userData.__cadOrigPosition,
      obj.userData.__cadOrigQuaternion,
      obj.userData.__cadOrigScale
    );
  }
}

/**
 * Restaura el objeto a su posición, rotación, escala y matriz CAD original inmutable.
 */
export function restaurarACadOriginal(obj: THREE.Object3D) {
  asegurarCadOriginal(obj);
  obj.position.copy(obj.userData.__cadOrigPosition);
  obj.quaternion.copy(obj.userData.__cadOrigQuaternion);
  obj.scale.copy(obj.userData.__cadOrigScale);
  obj.matrix.copy(obj.userData.__cadOrigMatrix);
  obj.updateMatrix();
  obj.updateMatrixWorld(true);
}

/**
 * Obtiene de forma segura la posición de reposo como THREE.Vector3 con .clone(),
 * previniendo errores si userData fue serializado o clonado como objeto plano.
 */
export function getSafeRestPosition(obj: THREE.Object3D): THREE.Vector3 {
  const r = obj.userData?.__baseRestPosition;
  if (r) {
    if (typeof r.clone === "function") return r.clone();
    if (typeof r.x === "number" && typeof r.y === "number" && typeof r.z === "number") {
      return new THREE.Vector3(r.x, r.y, r.z);
    }
  }
  const init = obj.userData?.__cadOrigPosition || obj.userData?.initialPosition;
  if (init) {
    if (typeof init.clone === "function") return init.clone();
    if (typeof init.x === "number" && typeof init.y === "number" && typeof init.z === "number") {
      return new THREE.Vector3(init.x, init.y, init.z);
    }
  }
  return obj.position && typeof obj.position.clone === "function" ? obj.position.clone() : new THREE.Vector3();
}

/**
 * Obtiene de forma segura el cuaternión de reposo como THREE.Quaternion con .clone()
 */
export function getSafeRestQuaternion(obj: THREE.Object3D): THREE.Quaternion {
  const q = obj.userData?.__baseRestQuaternion;
  if (q) {
    if (typeof q.clone === "function") return q.clone();
    if (typeof q.x === "number" && typeof q.y === "number" && typeof q.z === "number" && typeof q.w === "number") {
      return new THREE.Quaternion(q.x, q.y, q.z, q.w);
    }
  }
  const initQ = obj.userData?.__cadOrigQuaternion;
  if (initQ) {
    if (typeof initQ.clone === "function") return initQ.clone();
    if (typeof initQ.x === "number" && typeof initQ.y === "number" && typeof initQ.z === "number" && typeof initQ.w === "number") {
      return new THREE.Quaternion(initQ.x, initQ.y, initQ.z, initQ.w);
    }
  }
  return obj.quaternion && typeof obj.quaternion.clone === "function" ? obj.quaternion.clone() : new THREE.Quaternion();
}

/**
 * Normaliza nombres de malla eliminando prefijos de Grasshopper y sufijos de instancia
 */
export function normalizarNombreNodo(nombre: string): string {
  if (!nombre) return "";
  return nombre.replace(/^RH_OUT:/i, "").trim();
}

/**
 * Encuentra todas las mallas de Three.js que corresponden a las piezas y herrajes asignados a un subbloque.
 * Si el objetivo tiene un número de instancia (ej. "Corrediça - Fija (5)"), la coincidencia es 100% estricta
 * para evitar capturar correderas de otros laterales o subbloques.
 */
export function obtenerMallasDeSubbloque(sceneMeshes: THREE.Mesh[], sub: SubBloqueArmado): THREE.Mesh[] {
  const piezasSet = new Set([...(sub.piezas || []), ...(sub.herrajes || [])].map((p) => p.toLowerCase().trim()));
  if (piezasSet.size === 0) return [];

  const resultado: THREE.Mesh[] = [];
  sceneMeshes.forEach((mesh) => {
    const u = mesh.userData || {};
    const cleanName = ((u.cleanName || mesh.name || "") as string).toLowerCase().trim();
    const pm = ((u.piezaMadre || extraerPiezaMadre(cleanName)) as string).toLowerCase().trim();
    const rawName = ((u.rawName || "") as string).toLowerCase().trim();
    const instKey = ((u.instanciaKey || "") as string).toLowerCase().trim();
    const meshName = (mesh.name || "").toLowerCase().trim();

    const coincide = Array.from(piezasSet).some((target) => {
      const tClean = target.replace(/^rh_out:\s*/i, "").trim().toLowerCase();
      const tieneInstancia = /\(\s*\d+\s*\)/.test(tClean);

      if (tieneInstancia) {
        // Coincidencia estricta de instancia (ej. "corrediça - fija (5)")
        return (
          instKey === tClean ||
          cleanName === tClean ||
          rawName === tClean ||
          meshName === tClean ||
          meshName.startsWith(tClean + "::") ||
          meshName.includes(tClean)
        );
      }

      // Pieza estructural o genérica sin número de instancia (ej. "Peça 7")
      const tPM = extraerPiezaMadre(tClean).toLowerCase().trim();
      return (
        target === cleanName ||
        target === rawName ||
        target === instKey ||
        target === meshName ||
        tClean === cleanName ||
        tClean === instKey ||
        (tPM && (tPM === pm || tPM === cleanName))
      );
    });

    if (coincide && !resultado.includes(mesh)) {
      resultado.push(mesh);
    }
  });

  return resultado;
}
