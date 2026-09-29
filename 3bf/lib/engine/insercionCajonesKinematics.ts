import * as THREE from "three";
import { PasoManualStudio, GrupoCinematicoShowcase } from "../storeTypes";
import { extraerPiezaMadre } from "../piezaMadreUtils";
import { getSafeRestPosition, getSafeRestQuaternion, coincidenMismoHerraje } from "./cadStateUtils";

function esCorrederaFijaMesh(name: string, cleanName: string, instKey: string): boolean {
  const all = `${name} ${cleanName} ${instKey}`.toLowerCase();
  return (
    all.includes("fixa") ||
    all.includes("fija") ||
    all.includes("corrediça - fixa") ||
    all.includes("corredica - fixa") ||
    all.includes("corredera fija") ||
    all.includes("corredera_fija")
  );
}

function esCorrederaIntermediaMesh(name: string, cleanName: string, instKey: string): boolean {
  const all = `${name} ${cleanName} ${instKey}`.toLowerCase();
  return (
    all.includes("intermedia") ||
    all.includes("intermediária") ||
    all.includes("intermediaria") ||
    all.includes("corrediça - intermediária") ||
    all.includes("corredica - intermediaria")
  );
}

function esSeguroCorrederaMesh(name: string, cleanName: string, instKey: string): boolean {
  const all = `${name} ${cleanName} ${instKey}`.toLowerCase();
  return (
    all.includes("seguro") ||
    all.includes("trava") ||
    all.includes("gatillo") ||
    all.includes("palanca") ||
    all.includes("corrediça - seguro") ||
    all.includes("corredica - seguro")
  );
}

/**
 * Coincidencia precisa y unívoca entre una pieza declarada en el Bloque Funcional y una malla 3D.
 */
function coincideConPiezaGrupo(nombrePieza: string, obj: THREE.Mesh): boolean {
  const piezaBuscada = nombrePieza.toLowerCase().trim();
  const instKey = ((obj.userData?.instanciaKey || "") as string).toLowerCase().trim();
  const cleanName = ((obj.userData?.cleanName || "") as string).toLowerCase().trim();
  const nodeName = (obj.name || "").toLowerCase().trim();

  // 1. Coincidencia unívoca canónica para herrajes por instancia física (ej. "Parafuso F (2)" === "Parafuso F (2)")
  if (
    coincidenMismoHerraje(piezaBuscada, instKey) ||
    coincidenMismoHerraje(piezaBuscada, cleanName) ||
    coincidenMismoHerraje(piezaBuscada, nodeName)
  ) {
    return true;
  }

  // 2. Coincidencia directa de string exacto
  if (instKey === piezaBuscada || cleanName === piezaBuscada || nodeName === piezaBuscada) {
    return true;
  }

  // 3. Coincidencia con prefijos de instancia de Three.js (ej: "Peça 19 (1)::0" o "Peça 19 (1)_0")
  if (
    nodeName.startsWith(piezaBuscada + "::") ||
    nodeName.startsWith(piezaBuscada + "_") ||
    cleanName.startsWith(piezaBuscada + "::")
  ) {
    return true;
  }

  // 4. Si la pieza buscada NO tiene paréntesis de número de instancia, comparar por pieza madre
  if (!nombrePieza.includes("(")) {
    const pmBuscada = extraerPiezaMadre(nombrePieza).toLowerCase().trim();
    const pmObj = extraerPiezaMadre(instKey || cleanName || nodeName).toLowerCase().trim();
    if (pmObj && pmObj === pmBuscada) return true;
  }

  return false;
}

/**
 * 📥 Compilador Cinemático de Incorporación / Inserción de Cajones
 * Regla de Oro: Mueve ESTRICTAMENTE y ÚNICAMENTE lo que trae cada Bloque Funcional (grupo.piezas).
 * Cero atracciones espaciales de herrajes del casco o de piezas fijas.
 */
export function compilarInsercionCajonesPaso(
  rootScene: THREE.Object3D,
  sceneMeshes: THREE.Mesh[],
  sceneObjects: Map<string, THREE.Object3D>,
  paso: PasoManualStudio,
  duracionPaso: number,
  tracks: THREE.KeyframeTrack[],
  pasoP00?: PasoManualStudio | null
) {
  const tEnd = duracionPaso;
  const config = paso.insercionCajones || {};

  // 1. Obtener grupos de cajones (propios o heredados de P00)
  let grupos: GrupoCinematicoShowcase[] =
    config.gruposCinematicos && config.gruposCinematicos.length > 0
      ? config.gruposCinematicos
      : pasoP00?.showcase?.gruposCinematicos || [];

  // Filtrar exclusivamente cajones
  grupos = grupos.filter((g) => g.tipo === "cajon" || !g.tipo);
  if (grupos.length === 0) return;

  // Invertir orden si es ascendente (de abajo hacia arriba)
  if (config.ordenInsercion === "ascendente") {
    grupos = [...grupos].reverse();
  }

  const numGrupos = grupos.length;
  const coreografia = config.coreografia || "cascada";
  const ejeGlobal = config.ejeGlobal || pasoP00?.showcase?.ejeGlobal || "+Z";

  const resolverVectorEje = (eje: string) => {
    switch (eje) {
      case "+Z": return new THREE.Vector3(0, 0, 1);
      case "-Z": return new THREE.Vector3(0, 0, -1);
      case "+Y": return new THREE.Vector3(0, 1, 0);
      case "-Y": return new THREE.Vector3(0, -1, 0);
      case "+X": return new THREE.Vector3(1, 0, 0);
      case "-X": return new THREE.Vector3(-1, 0, 0);
      default: return new THREE.Vector3(0, 0, 1);
    }
  };

  // Distancias de apertura y aproximación
  const distAperturaMm = config.distanciaAperturaMm ?? pasoP00?.showcase?.distanciaAperturaMm ?? 350;
  const distAperturaM = distAperturaMm / 1000.0; // ej. 0.35 m
  const distAproxCm = config.distanciaAproximacionCm ?? 30; // 30 cm por defecto
  const distAproxM = distAproxCm / 100.0; // ej. 0.30 m

  // Márgenes temporales
  const tStartMargin = Math.max(0.5, 0.05 * tEnd);
  const tEndMargin = Math.max(0.8, 0.08 * tEnd);
  const tUsable = tEnd - tStartMargin - tEndMargin;

  // Bahía / envolventes del mueble
  let minXMueble = Infinity;
  let maxXMueble = -Infinity;
  sceneMeshes.forEach((mesh) => {
    const pos = getSafeRestPosition(mesh);
    if (pos.x < minXMueble) minXMueble = pos.x;
    if (pos.x > maxXMueble) maxXMueble = pos.x;
  });
  const centroXMueble = (minXMueble + maxXMueble) / 2.0;

  const animatedMeshUuids = new Set<string>();

  grupos.forEach((grupo, idx) => {
    const dirVector = resolverVectorEje(grupo.ejeApertura || ejeGlobal);
    const distTotalCajonM = distAperturaM + distAproxM; // ej: 0.35 + 0.30 = 0.65m fuera
    const distIntermediaM = distAperturaM * 0.5; // ej: 0.175m fuera

    const offsetInicialCajon = dirVector.clone().multiplyScalar(distTotalCajonM);
    const offsetAcopleCajon = dirVector.clone().multiplyScalar(distAperturaM);
    const offsetIntermedia = dirVector.clone().multiplyScalar(distIntermediaM);

    // Asignación de tiempos según coreografía
    let tStart = tStartMargin;
    let tAcople = tStartMargin + tUsable * 0.40;
    let tCierre = tStartMargin + tUsable * 0.90;

    if (coreografia === "simultaneo") {
      tStart = tStartMargin;
      tAcople = tStart + tUsable * 0.40;
      tCierre = tStart + tUsable * 0.95;
    } else if (coreografia === "cascada") {
      const step = (0.50 * tUsable) / Math.max(1, numGrupos);
      const durAprox = 0.22 * tUsable;
      const durCierre = 0.28 * tUsable;
      tStart = tStartMargin + idx * step;
      tAcople = tStart + durAprox;
      tCierre = tAcople + durCierre;
    } else if (coreografia === "secuencial") {
      const slot = tUsable / Math.max(1, numGrupos);
      tStart = tStartMargin + idx * slot;
      tAcople = tStart + slot * 0.45;
      tCierre = tStart + slot * 0.95;
    }

    // Helper de pista para el cajón y sus herrajes solidarios (móviles, tornillos, tiradores, tableros)
    const generarPistaInsercionCajon = (objUuid: string, basePos: THREE.Vector3) => {
      const posInicial = basePos.clone().add(offsetInicialCajon);
      const posAcople = basePos.clone().add(offsetAcopleCajon);
      const posFinal = basePos.clone(); // posición cerrada en reposo

      const times: number[] = [0];
      const values: number[] = [posInicial.x, posInicial.y, posInicial.z];

      // Hasta tStart, el cajón permanece en reposo suspendido en posición inicial
      if (tStart > 0.05) {
        times.push(tStart);
        values.push(posInicial.x, posInicial.y, posInicial.z);
      }

      // Fase 1: Viaje de aproximación (posInicial -> posAcople)
      const stepsAprox = 5;
      for (let s = 1; s <= stepsAprox; s++) {
        const frac = s / stepsAprox;
        const ease = frac * frac * (3 - 2 * frac); // Smoothstep
        const t = tStart + (tAcople - tStart) * frac;
        const p = posInicial.clone().lerp(posAcople, ease);
        times.push(t);
        values.push(p.x, p.y, p.z);
      }

      // Fase 2: Inserción hacia el interior (posAcople -> posFinal)
      const stepsCierre = 6;
      for (let s = 1; s <= stepsCierre; s++) {
        const frac = s / stepsCierre;
        const ease = frac * frac * (3 - 2 * frac); // Smoothstep
        const t = tAcople + (tCierre - tAcople) * frac;
        const p = posAcople.clone().lerp(posFinal, ease);
        times.push(t);
        values.push(p.x, p.y, p.z);
      }

      // Fase 3: Queda adentro hasta el final
      if (tCierre < tEnd) {
        times.push(tEnd);
        values.push(posFinal.x, posFinal.y, posFinal.z);
      }

      return new THREE.VectorKeyframeTrack(`${objUuid}.position`, times, values, THREE.InterpolateLinear);
    };

    // Helper de pista para la corredera intermedia
    const generarPistaInsercionIntermedia = (objUuid: string, basePos: THREE.Vector3) => {
      const posExtendida = basePos.clone().add(offsetIntermedia);
      const posFinal = basePos.clone();

      const times: number[] = [0];
      const values: number[] = [posExtendida.x, posExtendida.y, posExtendida.z];

      // La corredera intermedia permanece extendida esperando el acople del cajón (hasta tAcople)
      if (tAcople > 0.05) {
        times.push(tAcople);
        values.push(posExtendida.x, posExtendida.y, posExtendida.z);
      }

      // Fase de cierre: Se desliza junto con el cajón hacia el fondo (posExtendida -> posFinal)
      const stepsCierre = 6;
      for (let s = 1; s <= stepsCierre; s++) {
        const frac = s / stepsCierre;
        const ease = frac * frac * (3 - 2 * frac);
        const t = tAcople + (tCierre - tAcople) * frac;
        const p = posExtendida.clone().lerp(posFinal, ease);
        times.push(t);
        values.push(p.x, p.y, p.z);
      }

      // Queda adentro hasta el final
      if (tCierre < tEnd) {
        times.push(tEnd);
        values.push(posFinal.x, posFinal.y, posFinal.z);
      }

      return new THREE.VectorKeyframeTrack(`${objUuid}.position`, times, values, THREE.InterpolateLinear);
    };

    // Helper de pista de rotación para la palanca de seguro de la corredera móvil (deflexión elástica)
    const generarPistaRotacionSeguro = (objUuid: string, initQuat: THREE.Quaternion, esLadoIzquierdo: boolean) => {
      const rotTimes: number[] = [0];
      const rotValues: number[] = [initQuat.x, initQuat.y, initQuat.z, initQuat.w];

      if (tStart > 0.05) {
        rotTimes.push(tStart);
        rotValues.push(initQuat.x, initQuat.y, initQuat.z, initQuat.w);
      }

      // 1. Inicia presión de la palanca (baja / deflecta a 10°) durante el viaje de aproximación
      const tGiroStart = tStart + (tAcople - tStart) * 0.25;
      const tGiroMax = tStart + (tAcople - tStart) * 0.70;
      const anguloRad = THREE.MathUtils.degToRad(10.0) * (esLadoIzquierdo ? -1 : 1);

      rotTimes.push(tGiroStart);
      rotValues.push(initQuat.x, initQuat.y, initQuat.z, initQuat.w);

      const qDeflectado = new THREE.Quaternion()
        .setFromAxisAngle(new THREE.Vector3(0, 1, 0), anguloRad)
        .multiply(initQuat);

      rotTimes.push(tGiroMax);
      rotValues.push(qDeflectado.x, qDeflectado.y, qDeflectado.z, qDeflectado.w);

      // 2. Justo en el instante de acople tAcople: ¡Retorno elástico con "clic" mecánico al riel!
      rotTimes.push(tAcople);
      rotValues.push(initQuat.x, initQuat.y, initQuat.z, initQuat.w);

      // Permanece en 0° (bloqueado) hasta el final
      if (tEnd > tAcople) {
        rotTimes.push(tEnd);
        rotValues.push(initQuat.x, initQuat.y, initQuat.z, initQuat.w);
      }

      return new THREE.QuaternionKeyframeTrack(`${objUuid}.quaternion`, rotTimes, rotValues);
    };

    // 1. Detección de centro y cota Y para las correderas intermedias
    let yCajon: number | null = null;
    let minXCajon = Infinity;
    let maxXCajon = -Infinity;

    grupo.piezas.forEach((nombrePieza) => {
      sceneMeshes.forEach((obj) => {
        if (coincideConPiezaGrupo(nombrePieza, obj)) {
          const pos = getSafeRestPosition(obj);
          if (yCajon === null) yCajon = pos.y;
          if (pos.x < minXCajon) minXCajon = pos.x;
          if (pos.x > maxXCajon) maxXCajon = pos.x;
        }
      });
    });

    const centroXCajon = (minXCajon !== Infinity && maxXCajon !== -Infinity) ? (minXCajon + maxXCajon) / 2.0 : null;

    // 2. ✨ ANIMACIÓN RIGUROSA: SOLO LAS PIEZAS ASIGNADAS AL BLOQUE FUNCIONAL
    grupo.piezas.forEach((nombrePieza) => {
      sceneMeshes.forEach((obj) => {
        if (animatedMeshUuids.has(obj.uuid)) return;

        const instKey = ((obj.userData?.instanciaKey || "") as string).toLowerCase().trim();
        const cleanName = ((obj.userData?.cleanName || "") as string).toLowerCase().trim();
        const nodeName = (obj.name || "").toLowerCase().trim();

        // 🛡️ REGLA ABSOLUTA: Las correderas fijas NUNCA viajan con el cajón
        if (esCorrederaFijaMesh(nodeName, cleanName, instKey)) return;

        if (coincideConPiezaGrupo(nombrePieza, obj)) {
          animatedMeshUuids.add(obj.uuid);
          const initPos = getSafeRestPosition(obj);
          const isIntermedia = esCorrederaIntermediaMesh(nodeName, cleanName, instKey);

          if (isIntermedia) {
            tracks.push(generarPistaInsercionIntermedia(obj.uuid, initPos));
          } else {
            // Toda pieza perteneciente al bloque funcional viaja solidaria con el cajón
            tracks.push(generarPistaInsercionCajon(obj.uuid, initPos));

            // 🌟 Si es la palanca del seguro de la corredera móvil, añadir deflexión elástica y "clic" de acople
            if (esSeguroCorrederaMesh(nodeName, cleanName, instKey)) {
              const initQuat = getSafeRestQuaternion(obj);
              const esLadoIzquierdo = centroXCajon !== null ? initPos.x < centroXCajon : true;
              tracks.push(generarPistaRotacionSeguro(obj.uuid, initQuat, esLadoIzquierdo));
            }
          }
        }
      });
    });

    // 3. 🎯 CORREDERAS INTERMEDIAS VINCULADAS A LA BAHÍA DE ESTE CAJÓN
    // Solo se buscan las correderas telescópicas intermedias correspondientes a la altura Y de este cajón
    // (Ningún otro herraje se toca por proximidad)
    if (yCajon !== null) {
      const yCajonVal = yCajon;
      sceneMeshes.forEach((obj) => {
        if (animatedMeshUuids.has(obj.uuid)) return;

        const instKey = ((obj.userData?.instanciaKey || "") as string).toLowerCase().trim();
        const cleanName = ((obj.userData?.cleanName || "") as string).toLowerCase().trim();
        const nodeName = (obj.name || "").toLowerCase().trim();

        const esIntermedia = esCorrederaIntermediaMesh(nodeName, cleanName, instKey);
        if (!esIntermedia) return;

        const initPos = getSafeRestPosition(obj);

        // Verificar cota de altura Y de la corredera con el cajón
        if (Math.abs(initPos.y - yCajonVal) < 0.10) {
          // Verificar columna (bahía izquierda vs derecha)
          if (centroXCajon !== null && Math.abs(centroXCajon - centroXMueble) > 0.05) {
            const cajonEnBahiaIzquierda = centroXCajon < centroXMueble;
            const correderaEnBahiaIzquierda = initPos.x < centroXMueble;
            if (cajonEnBahiaIzquierda !== correderaEnBahiaIzquierda) return;
          }

          if (minXCajon !== Infinity && maxXCajon !== -Infinity) {
            const enMismaColumna = initPos.x >= minXCajon - 0.020 && initPos.x <= maxXCajon + 0.020;
            if (!enMismaColumna) return;
          }

          animatedMeshUuids.add(obj.uuid);
          tracks.push(generarPistaInsercionIntermedia(obj.uuid, initPos));
        }
      });
    }
  });
}
