/**
 * ==============================================================================
 * 📦 3dBimFab CAD Engine — cadStateUtils
 * ==============================================================================
 * @version 1.4.0
 * @author 3dBimFab Core / Mario Mojica
 * @date 17 de Septiembre, 2026
 * 
 * Módulo de cinemática CAD, resolución de estados de reposo (pRest),
 * cálculo de colisión espacial milimétrica, mapeo bidireccional de contactos,
 * emparentamiento exclusivo inter-pieza y sincronización de vistas 3D en tiempo real.
 * Respaldo histórico versionado: lib/engine/v1/cadStateUtils_v1.ts
 * ==============================================================================
 */

import * as THREE from "three";
import { SubBloqueArmado } from "../store";
import { PiezaEsperaConfig } from "../storeTypes";
import {
  extraerPiezaMadre,
  extraerFamiliaPieza,
  perteneceAMismaFamiliaPieza,
  esHerrajeNombre,
  calcularBBoxMalla,
  anotarInstanciasFisicas,
} from "../piezaMadreUtils";
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
        // Coincidencia estricta de instancia (ej. "corrediça - fija (5)" vs "corrediça - fixa (5)")
        return (
          instKey === tClean ||
          cleanName === tClean ||
          rawName === tClean ||
          meshName === tClean ||
          meshName.startsWith(tClean + "::") ||
          meshName.includes(tClean) ||
          coincidenMismoHerraje(target, instKey) ||
          coincidenMismoHerraje(target, cleanName) ||
          coincidenMismoHerraje(target, rawName) ||
          coincidenMismoHerraje(target, meshName)
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
  id: string; // ej. "Peça 4::tarugo" o "Peça 4::Cavilha (14)"
  tipo:
    | "tarugo"
    | "tuerca"
    | "tornillo"
    | "tapa"
    | "minifix"
    | "corredera"
    | "cantonera"
    | "escuadra"
    | "soporte"
    | "bisagra"
    | "manija"
    | "pata"
    | "clavo"
    | "otro";
  label: string; // ej. "Tarugo" | "Tuerca plástica" | "Tornillo" | "Tarugo 14" | "Cantonera 13"
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
    n.includes("cantonera") ||
    n.includes("escuadra") ||
    n.includes("soporte") ||
    n.includes("suporte") ||
    n.includes("pata") ||
    n.includes("pes") ||
    n.includes("pés") ||
    n.includes("sapata") ||
    n.includes("deslizador") ||
    n.includes("bisagra") ||
    n.includes("dobradiça") ||
    n.includes("dobradi") ||
    n.includes("puxador") ||
    n.includes("manija") ||
    n.includes("tirador") ||
    n.includes("tapa") ||
    n.includes("tampa") ||
    n.includes("clavo") ||
    n.includes("prego") ||
    n.includes("puntilla") ||
    n.includes("grampo") ||
    n.includes("perfil") ||
    n.includes("trilho")
  ) && !n.includes("cajon") && !n.includes("cajón");
}

/**
 * Categoriza el herraje en una familia semántica y etiqueta legible en español.
 */
export function categorizarHerraje(name: string): {
  tipo: "tarugo" | "tuerca" | "tornillo" | "tapa" | "minifix" | "corredera" | "cantonera" | "escuadra" | "soporte" | "bisagra" | "manija" | "pata" | "clavo" | "otro";
  label: string;
} {
  const n = (name || "").toLowerCase();
  if (n.includes("cavilha") || n.includes("tarugo") || n.includes("clavilha")) {
    return { tipo: "tarugo", label: "Tarugo" };
  }
  if (n.includes("cantoneira") || n.includes("cantonera") || n.includes("escuadra") || n.includes("angulo") || n.includes("ángulo")) {
    return { tipo: "cantonera", label: "Cantonera" };
  }
  if (n.includes("soporte") || n.includes("suporte")) {
    return { tipo: "soporte", label: "Soporte" };
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
  if (n.includes("corredera") || n.includes("corredi") || n.includes("trilho")) {
    return { tipo: "corredera", label: "Corredera" };
  }
  if (n.includes("dobradi") || n.includes("bisagra")) {
    return { tipo: "bisagra", label: "Bisagra" };
  }
  if (n.includes("puxador") || n.includes("manija") || n.includes("tirador")) {
    return { tipo: "manija", label: "Tirador" };
  }
  if (n.includes("prego") || n.includes("clavo") || n.includes("puntilla") || n.includes("grampo")) {
    return { tipo: "clavo", label: "Clavo / Grapa" };
  }
  if (n.includes("pata") || n.includes("sapata") || n.includes("pé") || n.includes("pes") || n.includes("deslizador")) {
    return { tipo: "pata", label: "Pata" };
  }
  return { tipo: "otro", label: "Herraje" };
}

/**
 * 🏷️ Extrae la familia canónica universal normalizada de un herraje,
 * unificando términos en portugués, español, inglés y variantes de taller.
 */
export function obtenerFamiliaHerrajeCanonica(rawStr?: string | null): string {
  if (!rawStr) return "otro";
  const clean = rawStr.replace(/^rh_(?:out|in):\s*/i, "").split("::").pop()!.toLowerCase().trim();
  const sinNum = clean.replace(/\d+/g, "").replace(/[()_:\-]/g, " ").trim();

  if (sinNum.includes("tampa") || sinNum.includes("tapa") || sinNum.includes("adesiv") || sinNum.includes("tapon") || sinNum.includes("tapón")) {
    return "tapa";
  }
  if (sinNum.includes("cavilha") || sinNum.includes("tarugo") || sinNum.includes("clavilha") || sinNum.includes("espiga")) {
    return "tarugo";
  }
  if (sinNum.includes("parafuso") || sinNum.includes("tornillo") || sinNum.includes("perno")) {
    const subL = clean.match(/(?:parafuso|tornillo|perno)\s*([a-z])/i)?.[1]?.toLowerCase() || "";
    return subL ? `tornillo_${subL}` : "tornillo";
  }
  if (sinNum.includes("porca") || sinNum.includes("tuerca") || sinNum.includes("tambor")) {
    return "tuerca";
  }
  if (sinNum.includes("corredi") || sinNum.includes("corredera") || sinNum.includes("trilho")) {
    if (sinNum.includes("fija") || sinNum.includes("fixa")) return "corredera_fija";
    if (sinNum.includes("movil") || sinNum.includes("móvel") || sinNum.includes("móvil")) return "corredera_movil";
    if (sinNum.includes("intermedia") || sinNum.includes("intermediaria") || sinNum.includes("intermediária")) return "corredera_intermedia";
    if (sinNum.includes("trava") || sinNum.includes("seguro") || sinNum.includes("gatilho")) return "corredera_trava";
    return "corredera";
  }
  if (sinNum.includes("cantoneira") || sinNum.includes("cantonera") || sinNum.includes("escuadra") || sinNum.includes("angulo") || sinNum.includes("ángulo")) {
    return "cantonera";
  }
  if (sinNum.includes("soporte") || sinNum.includes("suporte")) {
    return "soporte";
  }
  if (sinNum.includes("minifix") || sinNum.includes("caja")) {
    return "minifix";
  }
  if (sinNum.includes("dobradi") || sinNum.includes("bisagra")) {
    return "bisagra";
  }
  if (sinNum.includes("puxador") || sinNum.includes("manija") || sinNum.includes("tirador") || sinNum.includes("jaladera")) {
    return "manija";
  }
  if (sinNum.includes("prego") || sinNum.includes("clavo") || sinNum.includes("puntilla") || sinNum.includes("grampo")) {
    return "clavo";
  }
  if (sinNum.includes("pata") || sinNum.includes("pes") || sinNum.includes("pés") || sinNum.includes("sapata") || sinNum.includes("pie")) {
    return "pata";
  }

  return sinNum || "otro";
}

/**
 * 🔗 Comprueba con precisión quirúrgica si dos nombres o identificadores representan
 * EXACTAMENTE la misma instancia física de herraje, independientemente del idioma
 * (Español vs Portugués) o del formato del número de instancia ("Tapa 3" vs "Tampa (3)").
 */
export function coincidenMismoHerraje(a?: string | null, b?: string | null): boolean {
  if (!a || !b) return false;
  if (a === b) return true;

  const aClean = a.replace(/^rh_(?:out|in):\s*/i, "").split("::").pop()!.toLowerCase().trim();
  const bClean = b.replace(/^rh_(?:out|in):\s*/i, "").split("::").pop()!.toLowerCase().trim();
  if (aClean === bClean) return true;

  // Extraer número de instancia física de ambos (ej. "3" en "Tampa (3)" y "Tapa 3")
  const matchA = aClean.match(/\d+/);
  const matchB = bClean.match(/\d+/);
  const numA = matchA ? matchA[0] : null;
  const numB = matchB ? matchB[0] : null;

  // 🛡️ REGLA ESTRICTA DE INSTANCIA FÍSICA:
  // Si uno de los dos tiene número de instancia física, el otro DEBE tener exactamente el MISMO número.
  // "Cavilha (2)" NUNCA coincide con "Cavilha (93)" ni con "Cavilha" genérico sin número.
  if (numA || numB) {
    if (!numA || !numB || numA !== numB) return false;
  }

  const famA = obtenerFamiliaHerrajeCanonica(aClean);
  const famB = obtenerFamiliaHerrajeCanonica(bClean);

  if (famA === famB && famA !== "otro") {
    // Si ambos tenían número y coincidió: TRUE
    if (numA && numB && numA === numB) return true;
    // Si ninguno tenía número y pertenecen a la misma familia específica: TRUE
    if (!numA && !numB) return true;
  }

  return false;
}

/**
 * 🏷️ Estandariza y retorna el NOMBRE NATIVO REAL DE GRASSHOPPER para cada herraje.
 * Preserva la verdad absoluta del archivo CAD (PT-BR) con sufijos limpios de instancia:
 * - "Tampa (3)"
 * - "Cavilha (14)"
 * - "Parafuso B (5)"
 * - "Cantoneira (13)"
 * - "Corrediça - Fixa (1)"
 * - "Corrediça - Intermediária (1)"
 * - "Corrediça - Móvel (1)"
 * - "Corrediça - Trava (1)"
 * - "Porca (1)"
 */
export function formatearNombreIndividualHerraje(instKey: string): string {
  if (!instKey) return "Herraje";

  const clean = instKey.replace(/^rh_(?:out|in):\s*/i, "").split("::").pop()!.trim();
  const matchNum = clean.match(/\(?(\d+)\)?$/) || clean.match(/\s+(\d+)$/);
  const numStr = matchNum ? matchNum[1] : "";
  const n = clean.toLowerCase();

  // Cavilha (Tarugo)
  if (n.includes("cavilha") || n.includes("tarugo") || n.includes("clavilha")) {
    return numStr ? `Cavilha (${numStr})` : "Cavilha";
  }
  // Cantoneira (Cantonera / Escuadra)
  if (n.includes("cantoneira") || n.includes("cantonera") || n.includes("escuadra") || n.includes("angulo") || n.includes("ángulo")) {
    return numStr ? `Cantoneira (${numStr})` : "Cantoneira";
  }
  // Suporte (Soporte)
  if (n.includes("suporte") || n.includes("soporte")) {
    return numStr ? `Suporte (${numStr})` : "Suporte";
  }
  // Porca (Tuerca / Tambor)
  if (n.includes("porca") || n.includes("tuerca") || n.includes("tambor")) {
    return numStr ? `Porca (${numStr})` : "Porca";
  }
  // Parafuso (Tornillo)
  if (n.includes("parafuso") || n.includes("tornillo") || n.includes("perno")) {
    const letraMatch = clean.match(/(?:parafuso|tornillo|perno)\s*([a-zA-Z])/i);
    const letra = letraMatch ? ` ${letraMatch[1].toUpperCase()}` : "";
    return numStr ? `Parafuso${letra} (${numStr})` : `Parafuso${letra}`;
  }
  // Tampa (Tapa adhesiva)
  if (n.includes("tampa") || n.includes("tapa") || n.includes("adesiv")) {
    return numStr ? `Tampa (${numStr})` : "Tampa";
  }
  // Minifix
  if (n.includes("minifix") || n.includes("girofix") || n.includes("caja")) {
    return numStr ? `Minifix (${numStr})` : "Minifix";
  }
  // Corrediça (Corredera telescópica)
  if (n.includes("corredi") || n.includes("corredera") || n.includes("trilho")) {
    if (n.includes("fixa") || n.includes("fija")) {
      return numStr ? `Corrediça - Fixa (${numStr})` : "Corrediça - Fixa";
    }
    if (n.includes("intermedia") || n.includes("intermediaria") || n.includes("intermediária")) {
      return numStr ? `Corrediça - Intermediária (${numStr})` : "Corrediça - Intermediária";
    }
    if (n.includes("movil") || n.includes("móvel") || n.includes("móvil")) {
      return numStr ? `Corrediça - Móvel (${numStr})` : "Corrediça - Móvel";
    }
    if (n.includes("trava") || n.includes("seguro") || n.includes("gatilho")) {
      return numStr ? `Corrediça - Trava (${numStr})` : "Corrediça - Trava";
    }
    return numStr ? `Corrediça (${numStr})` : "Corrediça";
  }
  // Dobradiça (Bisagra)
  if (n.includes("dobradi") || n.includes("bisagra")) {
    return numStr ? `Dobradiça (${numStr})` : "Dobradiça";
  }
  // Puxador (Tirador / Manija)
  if (n.includes("puxador") || n.includes("manija") || n.includes("tirador")) {
    return numStr ? `Puxador (${numStr})` : "Puxador";
  }
  // Prego (Clavo / Puntilla)
  if (n.includes("prego") || n.includes("clavo") || n.includes("puntilla")) {
    return numStr ? `Prego (${numStr})` : "Prego";
  }
  // Sapata / Pé (Pata / Deslizador)
  if (n.includes("pata") || n.includes("sapata") || n.includes("pé") || n.includes("pes")) {
    return numStr ? `Sapata (${numStr})` : "Sapata";
  }

  // Si ya viene con formato exacto de Grasshopper (ej. "Tampa (3)"), mantenerlo fiel
  return clean || "Herraje";
}

/**
 * 🇪🇸 Traducción descriptiva al Español para tooltips de accesibilidad y ayuda visual en la UI.
 */
export function obtenerDescripcionEspanolHerraje(instKey: string): string {
  if (!instKey) return "Herraje de ensamble";
  const n = instKey.toLowerCase();

  if (n.includes("cavilha") || n.includes("tarugo")) return "Tarugo / Espiga de madera";
  if (n.includes("cantoneira") || n.includes("cantonera") || n.includes("escuadra")) return "Cantonera / Escuadra metálica";
  if (n.includes("suporte") || n.includes("soporte")) return "Soporte de entrepaño";
  if (n.includes("porca") || n.includes("tuerca")) return "Tuerca plástica / Tambor";
  if (n.includes("parafuso") || n.includes("tornillo")) {
    const letraMatch = instKey.match(/(?:parafuso|tornillo)\s*([a-zA-Z])/i);
    const letra = letraMatch ? ` ${letraMatch[1].toUpperCase()}` : "";
    return `Tornillo${letra} autorroscante`;
  }
  if (n.includes("tampa") || n.includes("tapa")) return "Tapa adhesiva cubre-tornillo";
  if (n.includes("minifix") || n.includes("girofix")) return "Perno / Caja Minifix";
  if (n.includes("corredi") || n.includes("corredera")) {
    if (n.includes("fixa") || n.includes("fija")) return "Corredera Fija (perfil exterior de mueble)";
    if (n.includes("intermedia") || n.includes("intermediária")) return "Corredera Intermedia (jaula telescópica)";
    if (n.includes("movil") || n.includes("móvel")) return "Corredera Móvil (perfil interno de cajón)";
    if (n.includes("trava") || n.includes("seguro")) return "Traba plástica de corredera";
    return "Corredera telescópica";
  }
  if (n.includes("dobradi") || n.includes("bisagra")) return "Bisagra de cazoleta";
  if (n.includes("puxador") || n.includes("manija")) return "Tirador / Manija de cajón";
  if (n.includes("prego") || n.includes("clavo")) return "Clavo / Puntilla de fondo";
  if (n.includes("sapata") || n.includes("pata") || n.includes("pé")) return "Deslizador / Pata de apoyo";

  return "Herraje de ensamble";
}

/**
 * 🔒 Determina si un herraje es estructural y transferible libremente entre piezas de ensamble
 * (ej. tarugos, cantoneras, tornillos de unión, minifix) o si es fijo e intransferible a un solo
 * panel anfitrión (ej. correderas fijadas a laterales, patas en zócalo, tiradores en frentes, tapas).
 */
export function esHerrajeTransferible(tipo: string, nombre: string): boolean {
  const t = (tipo || "").toLowerCase();
  const n = (nombre || "").toLowerCase();

  // Correderas telescópicas o fijas van montadas exclusivamente en los laterales del mueble
  if (t === "corredera" || n.includes("corredi") || n.includes("corredera")) return false;
  // Tapas adhesivas o plásticas van sobre su propia pieza perforada
  if (t === "tapa" || n.includes("tampa") || n.includes("tapa")) return false;
  // Tiradores van fijados en cajones o puertas
  if (t === "manija" || n.includes("puxador") || n.includes("tirador") || n.includes("manija")) return false;
  // Patas van fijadas en la base o zócalo
  if (t === "pata" || n.includes("pata") || n.includes("sapata") || n.includes("pés") || n.includes("pé")) return false;

  return true;
}

/**
 * 🎯 Resuelve analíticamente la dirección y distancia de aproximación óptima para un herraje.
 * - Cantoneras (Cantoneira): Determina si se apoya en la cara inferior (-Y), superior (+Y), frontal (+Z), trasera (-Z) o laterales (±X).
 *   Distancia proporcional reducida (5 cm) para evitar que flote desmesuradamente en el espacio.
 * - Tapas adhesivas (Tampa): Salen perpendiculares a la cara exterior del panel lateral (±X). Distancia 4 cm.
 * - Tornillos / Tarugos / Herrajes estándar: Respetan la dirección configurada o +Y/global (15 cm).
 */
export function resolverDireccionAproximacionHerraje(
  nombreHerraje: string,
  pHwRest: THREE.Vector3,
  meshPieza: THREE.Object3D | null,
  distanciaGlobalCm: number = 15,
  dirConfigurada?: string
): { dirCode: string; distM: number } {
  const nLow = (nombreHerraje || "").toLowerCase();
  const esCantoneira = nLow.includes("cantoneira") || nLow.includes("cantonera") || nLow.includes("escuadra");
  const esTapa = nLow.includes("tampa") || nLow.includes("tapa") || nLow.includes("adesiv");

  let distM = (distanciaGlobalCm || 15) / 100;
  if (esCantoneira) {
    distM = Math.min(0.05, Math.max(0.03, distM * 0.35)); // 5 cm proporcionales
  } else if (esTapa) {
    distM = Math.min(0.04, Math.max(0.02, distM * 0.25)); // 4 cm
  }

  if (dirConfigurada && dirConfigurada.trim().length > 0) {
    return { dirCode: dirConfigurada.toUpperCase().trim(), distM };
  }

  if (esTapa) {
    return { dirCode: pHwRest.x < 0.5 ? "-X" : "+X", distM };
  }

  if (!meshPieza) {
    return { dirCode: esCantoneira ? "-Y" : "+Y", distM };
  }

  const pRestPieza = getSafeRestPosition(meshPieza);
  const delta = pHwRest.clone().sub(pRestPieza);

  if (esCantoneira) {
    // Si la cantonera está claramente por debajo de la pieza (cara inferior):
    if (delta.y < -0.005) return { dirCode: "-Y", distM };
    // Si está por encima (cara superior):
    if (delta.y > 0.005) return { dirCode: "+Y", distM };
    // Si está desplazada en Z:
    if (delta.z > 0.005) return { dirCode: "+Z", distM };
    if (delta.z < -0.005) return { dirCode: "-Z", distM };
    // Si está desplazada en X:
    if (delta.x > 0.005) return { dirCode: "+X", distM };
    if (delta.x < -0.005) return { dirCode: "-X", distM };
    return { dirCode: "-Y", distM };
  }

  return { dirCode: "+Y", distM };
}

/**
 * Detecta qué herrajes están en contacto espacial directo (o alojados en perforaciones)
 * con una familia de pieza determinada a partir de las mallas reales (real_meshes).
 * 
 * @param nombreFamiliaPieza Nombre de la pieza madre (ej. "Peça 7")
 * @param realMeshes Mallas extraídas de Rhino/Grasshopper
 * @param herrajesAsignadosAlPaso Lista opcional de herrajes seleccionados para este paso de armado
 * @param desgloseGranular Si es true, genera una cápsula por cada herraje físico individual
 */
export function detectarHerrajesEnContactoConPieza(
  nombreFamiliaPieza: string,
  realMeshes: Array<{
    name: string;
    position?: [number, number, number];
    size?: [number, number, number];
    vertices?: number[];
    es_duplicado_ghx?: boolean;
  }>,
  herrajesAsignadosAlPaso?: string[],
  desgloseGranular: boolean = true
): HerrajeContactoItem[] {
  if (!nombreFamiliaPieza || !realMeshes || realMeshes.length === 0) return [];

  // 1. Descartar mallas marcadas como duplicados de Grasshopper y anotar instancias físicas
  const cleanMeshes = realMeshes.filter((m) => !m.es_duplicado_ghx);
  const anotadas = anotarInstanciasFisicas(cleanMeshes);

  // 2. Si el paso tiene herrajes asignados explícitos, filtrar solo los herrajes autorizados para este paso
  const herrajesPermitidosSet = (herrajesAsignadosAlPaso && herrajesAsignadosAlPaso.length > 0)
    ? new Set(herrajesAsignadosAlPaso.map((h) => h.toLowerCase().trim()))
    : null;

  // 3. Construir Box3 unificada para todas las submallas de la pieza de madera evaluada (en reposo)
  const boxPieza = new THREE.Box3();
  const mallasPieza = anotadas.filter((m) => {
    const raw = (m.name || "").replace(/^RH_OUT:/i, "").trim();
    if (isHardwareMeshName(raw)) return false;
    return (
      perteneceAMismaFamiliaPieza(raw, nombreFamiliaPieza) ||
      perteneceAMismaFamiliaPieza(m.instanciaKey, nombreFamiliaPieza)
    );
  });

  if (mallasPieza.length === 0) return [];

  mallasPieza.forEach((m) => {
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

  // 4. Evaluar cada instancia física discreta de herraje en la escena
  const grupos = new Map<
    string,
    {
      tipo: any;
      label: string;
      instancias: Set<string>;
      nombresMallas: Set<string>;
    }
  >();

  const itemsGranulares: HerrajeContactoItem[] = [];

  // Filtrar solo las mallas anotadas de herraje
  const mallasHerraje = anotadas.filter((m) => {
    const raw = (m.name || "").replace(/^RH_OUT:/i, "").trim();
    return isHardwareMeshName(raw) || isHardwareMeshName(m.instanciaKey);
  });

  // Agrupar mallas que pertenecen a la misma instancia física
  const porInstancia = new Map<string, typeof mallasHerraje>();
  mallasHerraje.forEach((m) => {
    const key = m.instanciaKey || (m.name || "").replace(/^RH_OUT:/i, "").trim();
    if (!porInstancia.has(key)) porInstancia.set(key, []);
    porInstancia.get(key)!.push(m);
  });

  porInstancia.forEach((items, instKey) => {
    // 🛡️ FILTRO PASO ACTIVO: Si el paso tiene herrajes asignados, comprobar que este herraje esté asignado
    if (herrajesPermitidosSet) {
      const coincide = Array.from(herrajesPermitidosSet).some((target) => {
        return (
          coincidenMismoHerraje(instKey, target) ||
          instKey.toLowerCase().trim() === target.toLowerCase().trim()
        );
      });
      if (!coincide) return;
    }

    // Construir la caja AABB exacta de esta instancia física concreta en coordenadas del mundo
    const boxHw = new THREE.Box3();
    const centroHw = new THREE.Vector3();

    items.forEach((m) => {
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

      if (desgloseGranular) {
        // 🎯 MODO GRANULAR: Cada instancia física individual genera su propia cápsula exclusiva
        const labelIndividual = formatearNombreIndividualHerraje(instKey);
        itemsGranulares.push({
          id: `${nombreFamiliaPieza}::${instKey}`,
          tipo: cat.tipo,
          label: labelIndividual,
          cantidad: 1,
          nombresMallas: [instKey],
        });
      } else {
        // MODO AGRUPADO (Legacy / Consolidado por tipo)
        if (!grupos.has(grupoKey)) {
          grupos.set(grupoKey, {
            tipo: cat.tipo,
            label: cat.label,
            instancias: new Set<string>(),
            nombresMallas: new Set<string>(),
          });
        }
        grupos.get(grupoKey)!.instancias.add(instKey);
        grupos.get(grupoKey)!.nombresMallas.add(instKey);
      }
    }
  });

  if (desgloseGranular) {
    // Ordenar herrajes granulares inteligentemente: Tarugos -> Cantoneras -> Minifix -> Tornillos -> Correderas
    const prioridadTipo: Record<string, number> = {
      tarugo: 1,
      cantonera: 2,
      escuadra: 2,
      minifix: 3,
      tornillo: 4,
      tuerca: 5,
      tapa: 6,
      corredera: 7,
      bisagra: 8,
      manija: 9,
      pata: 10,
      soporte: 11,
      otro: 99,
    };

    return itemsGranulares.sort((a, b) => {
      const prioA = prioridadTipo[a.tipo] || 50;
      const prioB = prioridadTipo[b.tipo] || 50;
      if (prioA !== prioB) return prioA - prioB;
      const numA = a.label.match(/\d+/);
      const numB = b.label.match(/\d+/);
      if (numA && numB) return parseInt(numA[0], 10) - parseInt(numB[0], 10);
      return a.label.localeCompare(b.label);
    });
  }

  // 4. Formatear la lista acumulada
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

export interface MapaContactosHerrajesResult {
  // Mapa de cada clave de instancia ("Cavilha (9)") a la lista de piezas que toca: ["Peça 7", "Peça 8"]
  contactosPorHerraje: Record<string, string[]>;
  // Mapa de cada pieza a su lista completa de herrajes en contacto físico
  herrajesPorPieza: Record<string, HerrajeContactoItem[]>;
}

/**
 * 🔗 Detecta el mapa bidireccional exhaustivo de contactos físicos entre tableros y herrajes.
 * Permite saber de inmediato qué piezas toca cada tarugo o tornillo para transferir su pertenencia.
 */
export function mapearContactosPiezasHerrajes(
  tablerosAsignados: string[],
  realMeshes: Array<{
    name?: string;
    position?: [number, number, number];
    size?: [number, number, number];
    vertices?: number[];
    es_duplicado_ghx?: boolean;
    instanciaKey?: string;
  }>,
  herrajesAsignadosAlPaso?: string[]
): MapaContactosHerrajesResult {
  const contactosPorHerraje: Record<string, string[]> = {};
  const herrajesPorPieza: Record<string, HerrajeContactoItem[]> = {};

  tablerosAsignados.forEach((t) => {
    herrajesPorPieza[t] = [];
  });

  if (!tablerosAsignados || tablerosAsignados.length === 0 || !realMeshes || realMeshes.length === 0) {
    return { contactosPorHerraje, herrajesPorPieza };
  }

  const cleanMeshes = realMeshes.filter((m) => !m.es_duplicado_ghx && m.name) as any[];
  const anotadas: any[] = anotarInstanciasFisicas(cleanMeshes) as any[];

  const herrajesPermitidosSet =
    herrajesAsignadosAlPaso && herrajesAsignadosAlPaso.length > 0
      ? new Set(herrajesAsignadosAlPaso.map((h) => h.toLowerCase().trim()))
      : null;

  // Tolerancia adaptativa: 8 mm para herrajes estándar, 22 mm para correderas y tapas exteriores
  const TOLERANCIA_ESTANDAR_M = 0.008; // 8 mm
  const TOLERANCIA_AMPLIADA_M = 0.022; // 22 mm (cubre perfiles telescópicos y tapas externas)
  const boxPiezaRealMap: Record<string, THREE.Box3> = {};
  const boxPiezaExpandidaMap: Record<string, THREE.Box3> = {};
  const boxPiezaExpandidaAmpliadaMap: Record<string, THREE.Box3> = {};
  const esTableroVerticalMap: Record<string, boolean> = {};

  tablerosAsignados.forEach((nombreFamilia) => {
    const box = new THREE.Box3();
    const mallasPieza = anotadas.filter((m) => {
      const raw = (m.name || "").replace(/^RH_OUT:/i, "").trim();
      if (isHardwareMeshName(raw)) return false;
      return (
        perteneceAMismaFamiliaPieza(raw, nombreFamilia) ||
        perteneceAMismaFamiliaPieza(m.instanciaKey, nombreFamilia)
      );
    });

    mallasPieza.forEach((m) => {
      const posX = m.position ? m.position[0] : 0;
      const posY = m.position ? m.position[1] : 0;
      const posZ = m.position ? m.position[2] : 0;

      if (m.vertices && m.vertices.length >= 3) {
        for (let i = 0; i < m.vertices.length; i += 3) {
          box.expandByPoint(
            new THREE.Vector3(
              m.vertices[i] + posX,
              m.vertices[i + 1] + posY,
              m.vertices[i + 2] + posZ
            )
          );
        }
      } else if (m.position && m.size) {
        box.expandByPoint(
          new THREE.Vector3(
            posX - m.size[0] / 2,
            posY - m.size[1] / 2,
            posZ - m.size[2] / 2
          )
        );
        box.expandByPoint(
          new THREE.Vector3(
            posX + m.size[0] / 2,
            posY + m.size[1] / 2,
            posZ + m.size[2] / 2
          )
        );
      }
    });

    if (!box.isEmpty()) {
      boxPiezaRealMap[nombreFamilia] = box.clone();
      boxPiezaExpandidaMap[nombreFamilia] = box.clone().expandByScalar(TOLERANCIA_ESTANDAR_M);
      boxPiezaExpandidaAmpliadaMap[nombreFamilia] = box.clone().expandByScalar(TOLERANCIA_AMPLIADA_M);

      // Clasificación geométrica de orientación:
      // Tableros horizontales (bases, pisos, techos) tienen espesor en Y (size.y <= 35 mm o mucho menor que X y Z)
      const sz = box.getSize(new THREE.Vector3());
      const esHorizontal = sz.y <= 0.035 || (sz.y < sz.x * 0.3 && sz.y < sz.z * 0.3);
      esTableroVerticalMap[nombreFamilia] = !esHorizontal;
    }
  });

  const mallasHerraje = anotadas.filter((m) => {
    const raw = (m.name || "").replace(/^RH_OUT:/i, "").trim();
    return isHardwareMeshName(raw) || isHardwareMeshName(m.instanciaKey);
  });

  const porInstancia = new Map<string, typeof mallasHerraje>();
  mallasHerraje.forEach((m) => {
    const key = m.instanciaKey || (m.name || "").replace(/^RH_OUT:/i, "").trim();
    if (!porInstancia.has(key)) porInstancia.set(key, []);
    porInstancia.get(key)!.push(m);
  });

  // Mapa de propagación para correderas telescópicas: slideIdx -> tablero lateral anfitrión
  const duenioPorSlideIdx: Record<string, string> = {};

  // Fase 1: Detectar primero los perfiles fijos de corredera para registrar su tablero anfitrión con distancia euclídea mínima
  porInstancia.forEach((items, instKey) => {
    const nLow = instKey.toLowerCase();
    if (!nLow.includes("fixa") && !nLow.includes("fija")) return;
    const matchIdx = instKey.match(/\((\d+)\)/)?.[1];
    if (!matchIdx) return;

    const boxHw = new THREE.Box3();
    items.forEach((m) => {
      const hPosX = m.position ? m.position[0] : 0;
      const hPosY = m.position ? m.position[1] : 0;
      const hPosZ = m.position ? m.position[2] : 0;
      if (m.vertices && m.vertices.length >= 3) {
        for (let i = 0; i < m.vertices.length; i += 3) {
          boxHw.expandByPoint(new THREE.Vector3(m.vertices[i] + hPosX, m.vertices[i + 1] + hPosY, m.vertices[i + 2] + hPosZ));
        }
      } else if (m.position && m.size) {
        boxHw.expandByPoint(new THREE.Vector3(hPosX - m.size[0] / 2, hPosY - m.size[1] / 2, hPosZ - m.size[2] / 2));
        boxHw.expandByPoint(new THREE.Vector3(hPosX + m.size[0] / 2, hPosY + m.size[1] / 2, hPosZ + m.size[2] / 2));
      }
    });

    if (boxHw.isEmpty()) return;
    const centroHw = new THREE.Vector3();
    boxHw.getCenter(centroHw);

    let mejorTablero: string | null = null;
    let menorDist = Infinity;

    tablerosAsignados.forEach((nombreFamilia) => {
      const boxReal = boxPiezaRealMap[nombreFamilia];
      const boxExp = boxPiezaExpandidaAmpliadaMap[nombreFamilia];
      if (!boxReal || !boxExp) return;

      // 🛡️ REGLA FÍSICA RTA: Las correderas se fijan exclusivamente a paneles verticales (laterales o divisiones)
      const esVertical = esTableroVerticalMap[nombreFamilia] !== false;
      if (!esVertical) return;

      if (boxExp.intersectsBox(boxHw) || boxExp.containsPoint(centroHw)) {
        const dist = boxReal.distanceToPoint(centroHw);
        if (dist < menorDist) {
          menorDist = dist;
          mejorTablero = nombreFamilia;
        }
      }
    });

    if (mejorTablero) {
      duenioPorSlideIdx[matchIdx] = mejorTablero;
    }
  });

  // Fase 2: Procesar todos los herrajes y asociarlos con su pieza de contacto
  porInstancia.forEach((items, instKey) => {
    // 🛡️ FILTRO PASO ACTIVO: Comprobación canónica universal tolerante a idiomas y versiones
    if (herrajesPermitidosSet) {
      const coincide = Array.from(herrajesPermitidosSet).some((target) => {
        return (
          coincidenMismoHerraje(instKey, target) ||
          instKey.toLowerCase().trim() === target.toLowerCase().trim()
        );
      });
      if (!coincide) return;
    }

    const boxHw = new THREE.Box3();
    const centroHw = new THREE.Vector3();

    items.forEach((m) => {
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

    const cat = categorizarHerraje(instKey);
    const nKeyLow = instKey.toLowerCase();
    const esCorredera = cat.tipo === "corredera" || nKeyLow.includes("corredi") || nKeyLow.includes("corredera");
    const esTapa = cat.tipo === "tapa" || nKeyLow.includes("tampa") || nKeyLow.includes("tapa") || nKeyLow.includes("adesiv");
    const mapaCajas = (esCorredera || esTapa) ? boxPiezaExpandidaAmpliadaMap : boxPiezaExpandidaMap;

    let piezasEnContacto: string[] = [];

    // 🎯 REGLA DE ORO DE CORREDERAS TELESCÓPICAS:
    // Si es una pieza de corredera y ya conocemos el lateral anfitrión de este riel (slideIdx), se asigna de forma directa
    const matchSlideIdx = instKey.match(/\((\d+)\)/)?.[1];
    if (esCorredera && matchSlideIdx && duenioPorSlideIdx[matchSlideIdx]) {
      piezasEnContacto = [duenioPorSlideIdx[matchSlideIdx]];
    } else {
      const piezasCandidatas: string[] = [];

      tablerosAsignados.forEach((nombreFamilia) => {
        const boxExp = mapaCajas[nombreFamilia];
        if (!boxExp) return;

        if (boxExp.intersectsBox(boxHw) || boxExp.containsPoint(centroHw)) {
          piezasCandidatas.push(nombreFamilia);
        }
      });

      const esTransf = esHerrajeTransferible(cat.tipo, instKey);

      if (piezasCandidatas.length <= 1 || esTransf) {
        piezasEnContacto = piezasCandidatas;
      } else {
        // 🔒 Herrajes fijos intransferibles (tapas, correderas, tiradores, patas):
        // Para correderas, si hay candidatas verticales y horizontales, priorizar estrictamente las verticales
        let candidatasFiltradas = piezasCandidatas;
        if (esCorredera) {
          const soloVerticales = piezasCandidatas.filter((pz) => esTableroVerticalMap[pz] !== false);
          if (soloVerticales.length > 0) candidatasFiltradas = soloVerticales;
        }

        // Elegimos la pieza con menor distancia euclídea exacta a la caja CAD real sin expandir
        let mejorPieza = candidatasFiltradas[0];
        let menorDist = Infinity;

        candidatasFiltradas.forEach((pz) => {
          const boxReal = boxPiezaRealMap[pz];
          if (!boxReal) return;
          const dist = boxReal.distanceToPoint(centroHw);
          if (dist < menorDist) {
            menorDist = dist;
            mejorPieza = pz;
          }
        });

        piezasEnContacto = [mejorPieza];
      }
    }

    // Si aún no tenía registrado el dueño de este riel y lo acabamos de detectar, registrarlo
    if (esCorredera && matchSlideIdx && piezasEnContacto.length > 0 && !duenioPorSlideIdx[matchSlideIdx]) {
      duenioPorSlideIdx[matchSlideIdx] = piezasEnContacto[0];
    }

    contactosPorHerraje[instKey] = piezasEnContacto;

    const labelIndividual = formatearNombreIndividualHerraje(instKey);

    piezasEnContacto.forEach((pz) => {
      herrajesPorPieza[pz].push({
        id: `${pz}::${instKey}`,
        tipo: cat.tipo,
        label: labelIndividual,
        cantidad: 1,
        nombresMallas: [instKey],
      });
    });
  });

  const prioridadTipo: Record<string, number> = {
    tarugo: 1,
    cantonera: 2,
    escuadra: 2,
    minifix: 3,
    tornillo: 4,
    tuerca: 5,
    tapa: 6,
    corredera: 7,
    bisagra: 8,
    manija: 9,
    pata: 10,
    soporte: 11,
    otro: 99,
  };

  tablerosAsignados.forEach((pz) => {
    herrajesPorPieza[pz].sort((a, b) => {
      const prioA = prioridadTipo[a.tipo] || 50;
      const prioB = prioridadTipo[b.tipo] || 50;
      if (prioA !== prioB) return prioA - prioB;
      const numA = a.label.match(/\d+/);
      const numB = b.label.match(/\d+/);
      if (numA && numB) return parseInt(numA[0], 10) - parseInt(numB[0], 10);
      return a.label.localeCompare(b.label);
    });
  });

  return { contactosPorHerraje, herrajesPorPieza };
}

/**
 * 📐 Calcula el vector de desplazamiento tridimensional vOffset exacto para una pieza en piso.
 */
export function calcularVectorOffsetPieza(
  confPieza: {
    offsetXCm?: number;
    offsetYCm?: number;
    offsetZCm?: number;
    apoyadaEnPiso?: boolean;
  },
  meshPieza: THREE.Object3D | null
): THREE.Vector3 {
  const offY = confPieza.offsetYCm ?? confPieza.offsetZCm ?? 0;
  const vWorld = new THREE.Vector3((confPieza.offsetXCm || 0) / 100, 0, offY / 100);

  if (!meshPieza || !meshPieza.parent) {
    return vWorld;
  }

  const pRest = getSafeRestPosition(meshPieza);
  meshPieza.parent.updateWorldMatrix(true, false);
  const targetObjRestWorld = meshPieza.parent.localToWorld(pRest.clone());

  let floorDropY = 0;
  if (confPieza.apoyadaEnPiso !== false) {
    const curPos = meshPieza.position.clone();
    meshPieza.position.copy(pRest);
    meshPieza.updateWorldMatrix(true, true);
    const objBox = new THREE.Box3().setFromObject(meshPieza);
    meshPieza.position.copy(curPos);
    meshPieza.updateWorldMatrix(true, true);

    if (!objBox.isEmpty()) {
      floorDropY = -objBox.min.y;
    }
  }

  const targetObjPopWorld = new THREE.Vector3(
    targetObjRestWorld.x + vWorld.x,
    targetObjRestWorld.y + floorDropY,
    targetObjRestWorld.z + vWorld.z
  );
  const targetObjPopLocal = meshPieza.parent.worldToLocal(targetObjPopWorld);
  return targetObjPopLocal.clone().sub(pRest);
}

/**
 * ❄️ Determina con certeza absoluta si un herraje o submalla está congelado en una pieza.
 * Soporta coincidencia canónica de strings y REGLA DE ORO DE CORREDERAS TELESCÓPICAS:
 * Si cualquier componente de un riel telescópico con índice (idx) está congelado,
 * TODOS los componentes de ese riel (Fixa, Intermediária, Móvel, Trava) quedan 100% congelados.
 */
export function comprobarHerrajeCongelado(
  identificadorHerraje: string,
  listaCongelados?: string[]
): boolean {
  if (!listaCongelados || listaCongelados.length === 0 || !identificadorHerraje) return false;

  const idClean = identificadorHerraje.replace(/^rh_(?:out|in):\s*/i, "").split("::").pop()!.toLowerCase().trim();

  // 1. Coincidencia canónica estándar (coincidenMismoHerraje o igualdad exacta)
  const esMatchDirecto = listaCongelados.some((c) => {
    const cClean = c.replace(/^rh_(?:out|in):\s*/i, "").split("::").pop()!.toLowerCase().trim();
    return (
      cClean === idClean ||
      c.toLowerCase().trim() === identificadorHerraje.toLowerCase().trim() ||
      coincidenMismoHerraje(c, identificadorHerraje) ||
      coincidenMismoHerraje(cClean, idClean)
    );
  });
  if (esMatchDirecto) return true;

  // 2. 🛡️ REGLA DE ORO DE CORREDERAS TELESCÓPICAS:
  // Una corredera telescópica (Fixa, Intermediária, Móvel, Trava) es un único riel solidario.
  // Si cualquier componente del riel con número (idx) está en el congelador, TODO el riel (idx) está congelado.
  const esCorredera = idClean.includes("corredi") || idClean.includes("corredera") || idClean.includes("trilho");
  if (esCorredera) {
    const matchIdx = idClean.match(/\((\d+)\)/)?.[1] || idClean.match(/\d+/)?.[0];
    if (matchIdx) {
      return listaCongelados.some((c) => {
        const cClean = c.replace(/^rh_(?:out|in):\s*/i, "").split("::").pop()!.toLowerCase().trim();
        const cEsCorredera = cClean.includes("corredi") || cClean.includes("corredera") || cClean.includes("trilho");
        if (!cEsCorredera) return false;
        const cIdx = cClean.match(/\((\d+)\)/)?.[1] || cClean.match(/\d+/)?.[0];
        return cIdx === matchIdx;
      });
    }
  }

  return false;
}

/**
 * 👑 Resuelve la pieza dueña activa de un herraje físico mediante prioridades estrictas:
 * 1. PRIORIDAD SUPREMA: Congelado (pre-instalado en un paso previo en esa pieza).
 * 2. PRIORIDAD ALTA: Activado explícitamente en una pieza (y no desactivado).
 * 3. PRIORIDAD POR DEFECTO: El primer contacto en la lista física (ctcList[0]) si no está desactivado.
 * 4. PRIORIDAD SECUNDARIA: Cualquier otra pieza en ctcList que no esté desactivada.
 * Si todas las piezas en contacto lo tienen desactivado, retorna null.
 */
export function resolverDuenioHerrajeCanonica(
  hwInstKey: string,
  ctcList: string[],
  piezasConfig: PiezaEsperaConfig[]
): string | null {
  if (!ctcList || ctcList.length === 0) return null;

  const instClean = hwInstKey.replace(/^rh_out:\s*/i, "").trim();
  const instLow = instClean.toLowerCase();

  // Coincidencia insensible a mayúsculas, prefijos de id y equivalencia canónica bilingüe
  const coincideId = (lista: string[] | undefined, pz: string): boolean => {
    if (!lista || lista.length === 0) return false;
    const idCompleto = `${pz}::${instClean}`.toLowerCase();
    return (
      comprobarHerrajeCongelado(instClean, lista) ||
      comprobarHerrajeCongelado(idCompleto, lista) ||
      lista.some((item) => {
        const itLow = item.toLowerCase().trim();
        return (
          itLow === idCompleto ||
          itLow === instLow ||
          itLow.endsWith(`::${instLow}`) ||
          coincidenMismoHerraje(item, instClean) ||
          coincidenMismoHerraje(item, idCompleto)
        );
      })
    );
  };

  // 1. PRIORIDAD SUPREMA: Congelado en esta pieza
  for (const pz of ctcList) {
    const pConf = piezasConfig.find((p) => p.nombrePieza === pz);
    if (!pConf) continue;
    if (comprobarHerrajeCongelado(instClean, pConf.herrajesCongelados) || coincideId(pConf.herrajesCongelados, pz)) {
      return pz;
    }
  }

  // 2. PRIORIDAD ALTA: Activado explícitamente en una pieza
  for (const pz of ctcList) {
    const pConf = piezasConfig.find((p) => p.nombrePieza === pz);
    if (!pConf) continue;
    const estaDesact = coincideId(pConf.herrajesDesactivados, pz);
    const estaAct = coincideId(pConf.herrajesActivados, pz);
    if (estaAct && !estaDesact) {
      return pz;
    }
  }

  // 3. PRIORIDAD POR DEFECTO: ctcList[0] si no está desactivado
  const primerDuenio = ctcList[0];
  const pConfDef = piezasConfig.find((p) => p.nombrePieza === primerDuenio);
  if (pConfDef) {
    const estaDesact = coincideId(pConfDef.herrajesDesactivados, primerDuenio);
    if (!estaDesact) {
      return primerDuenio;
    }
  }

  // 4. PRIORIDAD SECUNDARIA: Cualquier otra pieza en contacto que no esté desactivada
  for (let i = 1; i < ctcList.length; i++) {
    const pz = ctcList[i];
    const pConf = piezasConfig.find((p) => p.nombrePieza === pz);
    if (!pConf) continue;
    const estaDesact = coincideId(pConf.herrajesDesactivados, pz);
    if (!estaDesact) {
      return pz;
    }
  }

  return null;
}

/**
 * 🎬 Sincroniza las posiciones de las piezas y sus herrajes en el visor Three.js en tiempo real.
 * @param sceneRoot Raíz de la escena Three.js (__threeScene3BF o furnitureGroup)
 * @param piezasConfig Lista de configuraciones de piezas en espera (con ordenEnsamble, offsetXCm, offsetYCm, herrajesActivados, herrajesDesactivados)
 * @param contactosPorHerraje Mapeo de qué piezas contacta físicamente cada herraje
 * @param modo 'original' para ver el mueble ensamblado en CAD | 'desplazada' para ver las piezas en piso para el armado
 */
export function aplicarPosicionesEscena3D(
  sceneRoot: THREE.Object3D | null,
  piezasConfig: PiezaEsperaConfig[],
  contactosPorHerraje: Record<string, string[]>,
  modo: "original" | "desplazada",
  distanciaAproximacionHerrajesCm: number = 15
) {
  if (!sceneRoot) return;

  if (modo === "original") {
    // Restaurar absolutamente todas las mallas al reposo CAD
    sceneRoot.traverse((child: any) => {
      if (child.isMesh) {
        const pRest = getSafeRestPosition(child);
        const qRest = getSafeRestQuaternion(child);
        child.position.copy(pRest);
        child.quaternion.copy(qRest);
        child.updateMatrix();
        child.updateMatrixWorld(true);
      }
    });
    return;
  }

  // Modo 'desplazada':
  // 1. Mapear cada pieza a su mesh representativo para calcular el drop de piso y el vOffset exacto
  const vOffsetPorPieza: Record<string, THREE.Vector3> = {};
  const meshPorPieza: Record<string, THREE.Object3D> = {};

  sceneRoot.traverse((child: any) => {
    if (!child.isMesh) return;
    const ik = ((child.userData?.instanciaKey || "") as string).toLowerCase().trim();
    const cn = ((child.userData?.cleanName || child.name || "") as string).toLowerCase().trim();
    const raw = (child.name || "").replace(/^RH_OUT:/i, "").trim().toLowerCase();

    piezasConfig.forEach((pConf) => {
      if (meshPorPieza[pConf.nombrePieza]) return;
      if (
        perteneceAMismaFamiliaPieza(ik, pConf.nombrePieza) ||
        perteneceAMismaFamiliaPieza(cn, pConf.nombrePieza) ||
        perteneceAMismaFamiliaPieza(raw, pConf.nombrePieza)
      ) {
        meshPorPieza[pConf.nombrePieza] = child;
      }
    });
  });

  piezasConfig.forEach((pConf) => {
    const meshObj = meshPorPieza[pConf.nombrePieza] || null;
    vOffsetPorPieza[pConf.nombrePieza] = calcularVectorOffsetPieza(pConf, meshObj);
  });

  // 2. Determinar la pieza dueña activa de cada herraje físico con prioridad canónica estricta
  const duenioActivoPorHerraje: Record<string, string | null> = {};

  Object.entries(contactosPorHerraje).forEach(([hwInstKey, ctcList]) => {
    const hwLow = hwInstKey.replace(/^rh_out:\s*/i, "").trim().toLowerCase();
    const duenio = resolverDuenioHerrajeCanonica(hwInstKey, ctcList, piezasConfig);
    duenioActivoPorHerraje[hwLow] = duenio;
  });

  // 3. Aplicar las transformaciones en la escena
  sceneRoot.traverse((child: any) => {
    if (!child.isMesh) return;
    const u = child.userData || {};
    const ik = ((u.instanciaKey || "") as string).toLowerCase().trim();
    const cn = ((u.cleanName || child.name || "") as string).toLowerCase().trim();
    const raw = (child.name || "").replace(/^RH_OUT:/i, "").trim().toLowerCase();

    // Descomponer posibles nombres compuestos como "Cavilha (4)::Cavilha (4)"
    const partesName = raw.split("::");
    const cleanInstMesh = partesName[0].trim().toLowerCase();
    const cleanPartMesh = (partesName[1] || partesName[0]).trim().toLowerCase();

    const isHw = isHardwareMeshName(raw) || isHardwareMeshName(ik) || isHardwareMeshName(cleanInstMesh);
    const pRest = getSafeRestPosition(child);

    if (isHw) {
      // Es un herraje: buscar si tiene dueño activo en este paso
      let duenio =
        (ik && duenioActivoPorHerraje[ik]) ||
        (cleanInstMesh && duenioActivoPorHerraje[cleanInstMesh]) ||
        (cleanPartMesh && duenioActivoPorHerraje[cleanPartMesh]) ||
        (cn && duenioActivoPorHerraje[cn]) ||
        (raw && duenioActivoPorHerraje[raw]) ||
        null;

      if (!duenio) {
        // Búsqueda canónica universal y tolerante entre idiomas (ej. Tapa 3 == Tampa (3))
        const matchEntry = Object.entries(duenioActivoPorHerraje).find(([k, d]) => {
          if (!d) return false;
          return (
            coincidenMismoHerraje(k, ik) ||
            coincidenMismoHerraje(k, cleanInstMesh) ||
            coincidenMismoHerraje(k, cleanPartMesh) ||
            coincidenMismoHerraje(k, cn) ||
            coincidenMismoHerraje(k, raw)
          );
        });

        if (matchEntry) {
          duenio = matchEntry[1];
        }
      }

      // 🛡️ Búsqueda por número de riel de corredera si no se encontró por nombre de subpieza
      if (!duenio) {
        const esCorr = raw.includes("corredi") || raw.includes("corredera") || ik.includes("corredi") || ik.includes("corredera");
        if (esCorr) {
          const numSlide = (ik || raw || cn).match(/\((\d+)\)/)?.[1] || (ik || raw || cn).match(/\d+/)?.[0];
          if (numSlide) {
            const matchCorrEntry = Object.entries(duenioActivoPorHerraje).find(([k, d]) => {
              if (!d) return false;
              const kEsCorr = k.includes("corredi") || k.includes("corredera");
              if (!kEsCorr) return false;
              const kNum = k.match(/\((\d+)\)/)?.[1] || k.match(/\d+/)?.[0];
              return kNum === numSlide;
            });
            if (matchCorrEntry) {
              duenio = matchCorrEntry[1];
            }
          }
        }
      }

      // ❄️ Si aún no tiene dueño asignado en este paso, buscar si está CONGELADO en alguna pieza activa
      if (!duenio) {
        for (const pConf of piezasConfig) {
          if (
            comprobarHerrajeCongelado(ik, pConf.herrajesCongelados) ||
            comprobarHerrajeCongelado(cleanInstMesh, pConf.herrajesCongelados) ||
            comprobarHerrajeCongelado(cleanPartMesh, pConf.herrajesCongelados) ||
            comprobarHerrajeCongelado(raw, pConf.herrajesCongelados) ||
            comprobarHerrajeCongelado(cn, pConf.herrajesCongelados)
          ) {
            duenio = pConf.nombrePieza;
            break;
          }
        }
      }

      // 1. Obtener el offset de la pieza dueña (o Vector3(0, 0, 0) por defecto si es la Master o en reposo CAD)
      const vOffsetDuenio = duenio
        ? (vOffsetPorPieza[duenio] ||
           Object.entries(vOffsetPorPieza).find(([k]) =>
             k.toLowerCase().trim() === duenio.toLowerCase().trim() ||
             perteneceAMismaFamiliaPieza(k, duenio)
           )?.[1] ||
           new THREE.Vector3(0, 0, 0))
        : null;

      if (duenio && vOffsetDuenio) {
        const puntoB = pRest.clone().add(vOffsetDuenio);
        const pConfDuenio = piezasConfig.find((p) =>
          p.nombrePieza === duenio ||
          p.nombrePieza.toLowerCase().trim() === duenio.toLowerCase().trim() ||
          perteneceAMismaFamiliaPieza(p.nombrePieza, duenio)
        );

        // 🛡️ Búsqueda ultra-robusta de herraje congelado mediante comprobarHerrajeCongelado
        const listaCongDuenio = pConfDuenio?.herrajesCongelados || [];
        const esCongelado =
          comprobarHerrajeCongelado(ik, listaCongDuenio) ||
          comprobarHerrajeCongelado(cleanInstMesh, listaCongDuenio) ||
          comprobarHerrajeCongelado(cleanPartMesh, listaCongDuenio) ||
          comprobarHerrajeCongelado(raw, listaCongDuenio) ||
          comprobarHerrajeCongelado(cn, listaCongDuenio);

        if (esCongelado) {
          // ❄️ HERRAJE CONGELADO: Permanece 100% fijo e inamovible en su barreno (Punto B)
          child.position.copy(puntoB);
        } else {
          // 🔩 HERRAJE NUEVO: Se ubica en su Punto A (espera separada a la distancia global en su dirección)
          let dirConfigurada: string | undefined = undefined;
          const dirsMap = pConfDuenio?.direccionesHerrajes || {};

          for (const [k, v] of Object.entries(dirsMap)) {
            if (
              coincidenMismoHerraje(k, ik) ||
              coincidenMismoHerraje(k, cleanInstMesh) ||
              coincidenMismoHerraje(k, cleanPartMesh) ||
              coincidenMismoHerraje(k, raw) ||
              coincidenMismoHerraje(k, cn)
            ) {
              dirConfigurada = v;
              break;
            }
          }

          const meshPiezaDuenia = meshPorPieza[duenio] || null;
          const dirInfo = resolverDireccionAproximacionHerraje(
            raw || ik || cn,
            pRest,
            meshPiezaDuenia,
            distanciaAproximacionHerrajesCm,
            dirConfigurada
          );

          const dirNorm = dirInfo.dirCode;
          const distM = dirInfo.distM;
          let vDirOffset = new THREE.Vector3(0, distM, 0); // +Y por defecto

          if (dirNorm === "-Y") vDirOffset.set(0, -distM, 0);
          else if (dirNorm === "+X") vDirOffset.set(distM, 0, 0);
          else if (dirNorm === "-X") vDirOffset.set(-distM, 0, 0);
          else if (dirNorm === "+Z") vDirOffset.set(0, 0, distM);
          else if (dirNorm === "-Z") vDirOffset.set(0, 0, -distM);

          const puntoA = puntoB.clone().add(vDirOffset);
          child.position.copy(puntoA);
        }
      } else {
        // Apagado o sin dueño en este paso: permanece en pRest
        child.position.copy(pRest);
      }
    } else {
      // Es un tablero / pieza de madera: buscar su config
      const pConf = piezasConfig.find((p) =>
        perteneceAMismaFamiliaPieza(ik, p.nombrePieza) ||
        perteneceAMismaFamiliaPieza(cn, p.nombrePieza) ||
        perteneceAMismaFamiliaPieza(cleanInstMesh, p.nombrePieza) ||
        perteneceAMismaFamiliaPieza(raw, p.nombrePieza)
      );

      if (pConf && vOffsetPorPieza[pConf.nombrePieza]) {
        child.position.copy(pRest.clone().add(vOffsetPorPieza[pConf.nombrePieza]));
      } else {
        child.position.copy(pRest);
      }
    }

    child.updateMatrix();
    child.updateMatrixWorld(true);
  });
}

