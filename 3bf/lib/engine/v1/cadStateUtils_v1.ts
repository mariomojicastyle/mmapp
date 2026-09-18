import * as THREE from "three";
import { SubBloqueArmado } from "@/lib/store";
import {
  extraerPiezaMadre,
  extraerFamiliaPieza,
  perteneceAMismaFamiliaPieza,
  esHerrajeNombre,
  calcularBBoxMalla,
  anotarInstanciasFisicas,
} from "@/lib/piezaMadreUtils";
export { extraerPiezaMadre, extraerFamiliaPieza, perteneceAMismaFamiliaPieza };

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

export interface HerrajeContactoItem {
  id: string; // ej. "Peça 4::tarugo"
  tipo: "tarugo" | "tuerca" | "tornillo" | "tapa" | "minifix" | "corredera" | "otro";
  label: string; // ej. "Tarugo" | "Tuerca plástica" | "Tornillo"
  cantidad: number;
  nombresMallas: string[];
}

/**
 * Clasifica si un nombre de malla corresponde a un herraje de ensamble.
 */
export function isHardwareMeshName(name: string): boolean {
  if (!name) return false;
  const n = name.toLowerCase();
  return (
    n.includes("perno") ||
    n.includes("caja") ||
    n.includes("minifix") ||
    n.includes("tarugo") ||
    n.includes("cavilha") ||
    n.includes("clavilha") ||
    n.includes("tornillo") ||
    n.includes("parafuso") ||
    n.includes("porca") ||
    n.includes("tuerca") ||
    n.includes("corredera") ||
    n.includes("corredi") ||
    n.includes("cantoneira") ||
    n.includes("soporte") ||
    n.includes("pata") ||
    n.includes("pes") ||
    n.includes("pés") ||
    n.includes("bisagra") ||
    n.includes("dobradiça") ||
    n.includes("puxador") ||
    n.includes("manija") ||
    n.includes("tapa") ||
    n.includes("tampa")
  ) && !n.includes("cajon") && !n.includes("cajón");
}

/**
 * Categoriza el herraje en una familia semántica y etiqueta legible en español.
 */
export function categorizarHerraje(name: string): {
  tipo: "tarugo" | "tuerca" | "tornillo" | "tapa" | "minifix" | "corredera" | "otro";
  label: string;
} {
  const n = (name || "").toLowerCase();
  if (n.includes("cavilha") || n.includes("tarugo") || n.includes("clavilha")) {
    return { tipo: "tarugo", label: "Tarugo" };
  }
  if (n.includes("porca") || n.includes("tuerca") || n.includes("tambor")) {
    return { tipo: "tuerca", label: "Tuerca plástica" };
  }
  if (n.includes("tornillo") || n.includes("parafuso") || n.includes("perno")) {
    return { tipo: "tornillo", label: "Tornillo" };
  }
  if (n.includes("tampa") || n.includes("tapa")) {
    return { tipo: "tapa", label: "Tapa adhesiva" };
  }
  if (n.includes("minifix") || n.includes("caja")) {
    return { tipo: "minifix", label: "Minifix" };
  }
  if (n.includes("corredera") || n.includes("corredi")) {
    return { tipo: "corredera", label: "Corredera" };
  }
  return { tipo: "otro", label: "Herraje" };
}

/**
 * Detecta qué herrajes están en contacto espacial directo (o alojados en perforaciones)
 * con una familia de pieza determinada a partir de las mallas reales (real_meshes).
 */
export function detectarHerrajesEnContactoConPieza(
  nombreFamiliaPieza: string,
  realMeshes: Array<{
    name: string;
    position?: [number, number, number];
    size?: [number, number, number];
    vertices?: number[];
    es_duplicado_ghx?: boolean;
  }>
): HerrajeContactoItem[] {
  if (!nombreFamiliaPieza || !realMeshes || realMeshes.length === 0) return [];

  // 1. Descartar mallas marcadas como duplicados de Grasshopper y anotar instancias físicas
  const cleanMeshes = realMeshes.filter((m) => !m.es_duplicado_ghx);
  const anotadas = anotarInstanciasFisicas(cleanMeshes);

  // 2. Construir Box3 unificada para todas las submallas de la pieza de madera evaluada (en reposo)
  const boxPieza = new THREE.Box3();
  const mallasPieza = anotadas.filter((m: any) => {
    const raw = (m.name || "").replace(/^RH_OUT:/i, "").trim();
    if (isHardwareMeshName(raw)) return false;
    return (
      perteneceAMismaFamiliaPieza(raw, nombreFamiliaPieza) ||
      perteneceAMismaFamiliaPieza(m.instanciaKey, nombreFamiliaPieza)
    );
  });

  if (mallasPieza.length === 0) return [];

  mallasPieza.forEach((m: any) => {
    const posX = m.position ? m.position[0] : 0;
    const posY = m.position ? m.position[1] : 0;
    const posZ = m.position ? m.position[2] : 0;

    if (m.vertices && m.vertices.length >= 3) {
      for (let i = 0; i < m.vertices.length; i += 3) {
        boxPieza.expandByPoint(
          new THREE.Vector3(
            m.vertices[i] + posX,
            m.vertices[i + 1] + posY,
            m.vertices[i + 2] + posZ
          )
        );
      }
    } else if (m.position && m.size) {
      boxPieza.expandByPoint(
        new THREE.Vector3(
          posX - m.size[0] / 2,
          posY - m.size[1] / 2,
          posZ - m.size[2] / 2
        )
      );
      boxPieza.expandByPoint(
        new THREE.Vector3(
          posX + m.size[0] / 2,
          posY + m.size[1] / 2,
          posZ + m.size[2] / 2
        )
      );
    }
  });

  if (boxPieza.isEmpty()) return [];

  // Tolerancia de contacto milimétrica (4 mm):
  // Captura tornillos, tarugos y pernos insertados en perforaciones/cantos sin saltar a tableros lejanos.
  const TOLERANCIA_CONTACTO_M = 0.004;
  const boxPiezaExpandida = boxPieza.clone().expandByScalar(TOLERANCIA_CONTACTO_M);

  // 3. Evaluar cada instancia física discreta de herraje en la escena
  const grupos = new Map<
    string,
    {
      tipo: any;
      label: string;
      instancias: Set<string>;
      nombresMallas: Set<string>;
    }
  >();

  // Filtrar solo las mallas anotadas de herraje
  const mallasHerraje = anotadas.filter((m: any) => {
    const raw = (m.name || "").replace(/^RH_OUT:/i, "").trim();
    return isHardwareMeshName(raw) || isHardwareMeshName(m.instanciaKey);
  });

  // Agrupar mallas que pertenecen a la misma instancia física (ej. componentes telescópicos de corredera)
  const porInstancia = new Map<string, typeof mallasHerraje>();
  mallasHerraje.forEach((m: any) => {
    const key = m.instanciaKey || (m.name || "").replace(/^RH_OUT:/i, "").trim();
    if (!porInstancia.has(key)) porInstancia.set(key, []);
    porInstancia.get(key)!.push(m);
  });

  porInstancia.forEach((items, instKey) => {
    // Construir la caja AABB exacta de esta instancia física concreta en coordenadas del mundo
    const boxHw = new THREE.Box3();
    const centroHw = new THREE.Vector3();

    items.forEach((m: any) => {
      const hPosX = m.position ? m.position[0] : 0;
      const hPosY = m.position ? m.position[1] : 0;
      const hPosZ = m.position ? m.position[2] : 0;

      if (m.vertices && m.vertices.length >= 3) {
        for (let i = 0; i < m.vertices.length; i += 3) {
          boxHw.expandByPoint(
            new THREE.Vector3(
              m.vertices[i] + hPosX,
              m.vertices[i + 1] + hPosY,
              m.vertices[i + 2] + hPosZ
            )
          );
        }
      } else if (m.position && m.size) {
        boxHw.expandByPoint(
          new THREE.Vector3(
            hPosX - m.size[0] / 2,
            hPosY - m.size[1] / 2,
            hPosZ - m.size[2] / 2
          )
        );
        boxHw.expandByPoint(
          new THREE.Vector3(
            hPosX + m.size[0] / 2,
            hPosY + m.size[1] / 2,
            hPosZ + m.size[2] / 2
          )
        );
      }
    });

    if (boxHw.isEmpty()) return;
    boxHw.getCenter(centroHw);

    // Comprobar contacto físico directo con la pieza de madera
    const estaEnContacto =
      boxPiezaExpandida.intersectsBox(boxHw) || boxPiezaExpandida.containsPoint(centroHw);

    if (estaEnContacto) {
      const cat = categorizarHerraje(instKey);
      const grupoKey = cat.tipo;

      if (!grupos.has(grupoKey)) {
        grupos.set(grupoKey, {
          tipo: cat.tipo,
          label: cat.label,
          instancias: new Set<string>(),
          nombresMallas: new Set<string>(),
        });
      }
      // Registrar la instancia física unívoca (ej. "Cavilha (1)", "Corrediça - Fija (2)")
      grupos.get(grupoKey)!.instancias.add(instKey);
      grupos.get(grupoKey)!.nombresMallas.add(instKey);
      // Registrar los nombres directos de malla para coincidencia en la escena Three.js
      items.forEach((m: any) => {
        const rName = (m.name || "").replace(/^RH_OUT:/i, "").trim();
        if (rName) grupos.get(grupoKey)!.nombresMallas.add(rName);
      });
    }
  });

  // 4. Formatear la lista de herrajes en contacto agrupados por tipo
  const resultado: HerrajeContactoItem[] = [];
  grupos.forEach((item, grupoKey) => {
    const listaMallas = Array.from(item.nombresMallas);
    resultado.push({
      id: `${nombreFamiliaPieza}::${grupoKey}`,
      tipo: item.tipo,
      label: item.label,
      cantidad: item.instancias.size,
      nombresMallas: listaMallas,
    });
  });

  return resultado;
}

