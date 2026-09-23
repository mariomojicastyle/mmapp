import * as THREE from "three";
import { PasoManualStudio } from "../store";
import { extraerPiezaMadre } from "../piezaMadreUtils";
import {
  getSafeRestPosition,
  getSafeRestQuaternion,
} from "./cadStateUtils";

export function compilarShowcaseP00(
  rootScene: THREE.Object3D,
  sceneMeshes: THREE.Mesh[],
  sceneObjects: Map<string, THREE.Object3D>,
  paso: PasoManualStudio,
  duracionPaso: number,
  tracks: THREE.KeyframeTrack[]
) {
  const distanciaDefecto = (paso.showcase?.distanciaAperturaMm || 300) / 1000.0; // metros
  const tEnd = duracionPaso;
  const coreografia = paso.showcase?.coreografia || "secuencial";
  const ejeGlobal = paso.showcase?.ejeGlobal || "+Z";

  // Helper para resolver vector unitario según el eje
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

  const grupos = paso.showcase?.gruposCinematicos || [];

  if (grupos.length > 0 && paso.showcase?.abrirCajones !== false) {
    const numGrupos = grupos.length;
    const tStartMargin = Math.max(0.2, 0.04 * tEnd);
    const tEndMargin = Math.max(0.2, 0.04 * tEnd);
    const tUsable = tEnd - tStartMargin - tEndMargin;

    // Calcular límites envolventes del mueble para bahía fisiomecánica
    let minXMueble = Infinity;
    let maxXMueble = -Infinity;
    sceneMeshes.forEach((mesh) => {
      const pos = getSafeRestPosition(mesh);
      if (pos.x < minXMueble) minXMueble = pos.x;
      if (pos.x > maxXMueble) maxXMueble = pos.x;
    });
    const centroXMueble = (minXMueble + maxXMueble) / 2.0;

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

    // Mapa de correderas fijas (perfiles atornillados al lateral del mueble que NUNCA se mueven)
    const correderasFijas: THREE.Vector3[] = [];
    sceneMeshes.forEach((mesh) => {
      const n = (mesh.name || "").toLowerCase();
      const cn = ((mesh.userData?.cleanName || "") as string).toLowerCase();
      const ik = ((mesh.userData?.instanciaKey || "") as string).toLowerCase();
      if ((n.includes("corredi") || ik.includes("corredi") || cn.includes("corredi")) && esCorrederaFijaMesh(n, cn, ik)) {
        correderasFijas.push(getSafeRestPosition(mesh));
      }
    });

    grupos.forEach((grupo, idx) => {
      const dirVector = resolverVectorEje(grupo.ejeApertura || ejeGlobal);
      const sincronizarCajones = paso.showcase?.sincronizarCarreraCajones !== false;
      const distMmEfectiva = (grupo.tipo === "cajon" && sincronizarCajones)
        ? (paso.showcase?.distanciaAperturaMm ?? grupo.distanciaMm ?? 300)
        : (grupo.distanciaMm ?? paso.showcase?.distanciaAperturaMm ?? 300);
      const distMetros = distMmEfectiva / 1000.0;
      const offset = dirVector.clone().multiplyScalar(distMetros);

      let t0 = tStartMargin;
      let t1 = tStartMargin + tUsable * 0.35;
      let t2 = tStartMargin + tUsable * 0.65;
      let t3 = tStartMargin + tUsable * 0.95;

      if (coreografia === "secuencial") {
        const slot = tUsable / Math.max(1, numGrupos);
        t0 = tStartMargin + idx * slot;
        t1 = t0 + slot * 0.38;
        t2 = t0 + slot * 0.62;
        t3 = t0 + slot * 0.96;
      } else if (coreografia === "cascada") {
        const stepOpen = (0.28 * tUsable) / Math.max(1, numGrupos);
        const durOpen = 0.22 * tUsable;
        t0 = tStartMargin + idx * stepOpen;
        t1 = t0 + durOpen;
        const tPauseEnd = tStartMargin + 0.55 * tUsable;
        const stepClose = (0.22 * tUsable) / Math.max(1, numGrupos);
        const durClose = 0.20 * tUsable;
        t2 = Math.max(t1 + 0.1, tPauseEnd + (numGrupos - 1 - idx) * stepClose);
        t3 = t2 + durClose;
      }

      const animatedMeshUuids = new Set<string>();

      if (grupo.tipo === "puerta") {
        const doorMeshes: THREE.Mesh[] = [];
        grupo.piezas.forEach((nombrePieza) => {
          const piezaBuscada = nombrePieza.toLowerCase().trim();
          const pmBuscada = extraerPiezaMadre(nombrePieza).toLowerCase().trim();
          if (!piezaBuscada && !pmBuscada) return;

          sceneMeshes.forEach((obj) => {
            const instKey = ((obj.userData?.instanciaKey || "") as string).toLowerCase().trim();
            const cleanName = ((obj.userData?.cleanName || "") as string).toLowerCase().trim();
            const nodeName = (obj.name || "").toLowerCase().trim();
            const pmObj = extraerPiezaMadre(instKey || cleanName || nodeName).toLowerCase().trim();

            const coincide =
              (instKey && (instKey === piezaBuscada || instKey === pmBuscada)) ||
              (nodeName && (nodeName === piezaBuscada || nodeName.startsWith(piezaBuscada + "::"))) ||
              (cleanName && (cleanName === piezaBuscada || cleanName === pmBuscada)) ||
              (pmObj && pmObj === pmBuscada && !nombrePieza.includes("("));

            if (coincide && !animatedMeshUuids.has(obj.uuid)) {
              animatedMeshUuids.add(obj.uuid);
              doorMeshes.push(obj);
            }
          });
        });

        if (doorMeshes.length > 0) {
          const groupBbox = new THREE.Box3();
          doorMeshes.forEach((m) => {
            if (m.geometry) {
              if (!m.geometry.boundingBox) m.geometry.computeBoundingBox();
              const b = m.geometry.boundingBox!.clone().applyMatrix4(m.matrixWorld);
              groupBbox.union(b);
            } else {
              groupBbox.expandByObject(m);
            }
          });

          const lado = grupo.ladoBisagra || "izquierda";
          const offsetM = (grupo.pivoteOffsetMm || 0) / 1000.0;
          const pivotX = lado === "derecha" ? groupBbox.max.x - offsetM : groupBbox.min.x + offsetM;
          const pivotY = groupBbox.min.y;
          const pivotZ = groupBbox.max.z;
          const pivot = new THREE.Vector3(pivotX, pivotY, pivotZ);

          const anguloDeg = grupo.anguloRotacionDeg ?? 90;
          const dirSign = lado === "derecha" ? 1 : -1;
          const totalAngRad = THREE.MathUtils.degToRad(anguloDeg * dirSign);

          doorMeshes.forEach((obj) => {
            const initPos = getSafeRestPosition(obj);
            const initQuat = getSafeRestQuaternion(obj);

            const numSubsteps = 5;
            const posTimes: number[] = [0, t0];
            const posValues: number[] = [initPos.x, initPos.y, initPos.z, initPos.x, initPos.y, initPos.z];
            const rotTimes: number[] = [0, t0];
            const rotValues: number[] = [initQuat.x, initQuat.y, initQuat.z, initQuat.w, initQuat.x, initQuat.y, initQuat.z, initQuat.w];

            for (let s = 1; s <= numSubsteps; s++) {
              const frac = s / numSubsteps;
              const timeSub = t0 + (t1 - t0) * frac;
              const aSub = totalAngRad * frac;
              const qSub = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), aSub);
              const pSub = pivot.clone().add(initPos.clone().sub(pivot).applyQuaternion(qSub));
              const qCombined = qSub.clone().multiply(initQuat);

              posTimes.push(timeSub);
              posValues.push(pSub.x, pSub.y, pSub.z);
              rotTimes.push(timeSub);
              rotValues.push(qCombined.x, qCombined.y, qCombined.z, qCombined.w);
            }

            const qOpenMax = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), totalAngRad);
            const pOpen = pivot.clone().add(initPos.clone().sub(pivot).applyQuaternion(qOpenMax));
            const qCombinedOpen = qOpenMax.clone().multiply(initQuat);

            posTimes.push(t2);
            posValues.push(pOpen.x, pOpen.y, pOpen.z);
            rotTimes.push(t2);
            rotValues.push(qCombinedOpen.x, qCombinedOpen.y, qCombinedOpen.z, qCombinedOpen.w);

            for (let s = 1; s <= numSubsteps; s++) {
              const frac = s / numSubsteps;
              const timeSub = t2 + (t3 - t2) * frac;
              const aSub = totalAngRad * (1 - frac);
              const qSub = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), aSub);
              const pSub = pivot.clone().add(initPos.clone().sub(pivot).applyQuaternion(qSub));
              const qCombined = qSub.clone().multiply(initQuat);

              posTimes.push(timeSub);
              posValues.push(pSub.x, pSub.y, pSub.z);
              rotTimes.push(timeSub);
              rotValues.push(qCombined.x, qCombined.y, qCombined.z, qCombined.w);
            }

            posTimes.push(tEnd);
            posValues.push(initPos.x, initPos.y, initPos.z);
            rotTimes.push(tEnd);
            rotValues.push(initQuat.x, initQuat.y, initQuat.z, initQuat.w);

            tracks.push(new THREE.VectorKeyframeTrack(`${obj.uuid}.position`, posTimes, posValues, THREE.InterpolateLinear));
            tracks.push(new THREE.QuaternionKeyframeTrack(`${obj.uuid}.quaternion`, rotTimes, rotValues));
          });
        }
      } else {
        // MODO CAJÓN
        let yCajon: number | null = null;
        let centroXCajon: number | null = null;
        let minXGrupo = Infinity;
        let maxXGrupo = -Infinity;

        grupo.piezas.forEach((nombrePieza) => {
          const piezaBuscada = nombrePieza.toLowerCase().trim();
          const pmBuscada = extraerPiezaMadre(nombrePieza).toLowerCase().trim();
          if (!piezaBuscada && !pmBuscada) return;

          sceneMeshes.forEach((obj) => {
            const instKey = ((obj.userData?.instanciaKey || "") as string).toLowerCase().trim();
            const cleanName = ((obj.userData?.cleanName || "") as string).toLowerCase().trim();
            const nodeName = (obj.name || "").toLowerCase().trim();
            const pmObj = extraerPiezaMadre(instKey || cleanName || nodeName).toLowerCase().trim();

            const coincide =
              (instKey && (instKey === piezaBuscada || instKey === pmBuscada)) ||
              (nodeName && (nodeName === piezaBuscada || nodeName.startsWith(piezaBuscada + "::"))) ||
              (cleanName && (cleanName === piezaBuscada || cleanName === pmBuscada)) ||
              (pmObj && pmObj === pmBuscada && !nombrePieza.includes("("));

            if (coincide) {
              const pos = getSafeRestPosition(obj);
              if (yCajon === null) yCajon = pos.y;
              if (pos.x < minXGrupo) minXGrupo = pos.x;
              if (pos.x > maxXGrupo) maxXGrupo = pos.x;
            }
          });
        });

        if (minXGrupo !== Infinity && maxXGrupo !== -Infinity) {
          centroXCajon = (minXGrupo + maxXGrupo) / 2.0;
        }

        const generarPistasCajon = (objUuid: string, basePos: THREE.Vector3, movOffset: THREE.Vector3) => {
          const times: number[] = [0, t0];
          const values: number[] = [basePos.x, basePos.y, basePos.z, basePos.x, basePos.y, basePos.z];

          const steps = 6;
          for (let s = 1; s <= steps; s++) {
            const frac = s / steps;
            const ease = frac * frac * (3 - 2 * frac);
            const t = t0 + (t1 - t0) * frac;
            const p = basePos.clone().add(movOffset.clone().multiplyScalar(ease));
            times.push(t);
            values.push(p.x, p.y, p.z);
          }

          times.push(t2);
          const pAbierto = basePos.clone().add(movOffset);
          values.push(pAbierto.x, pAbierto.y, pAbierto.z);

          for (let s = 1; s <= steps; s++) {
            const frac = s / steps;
            const ease = 1 - (frac * frac * (3 - 2 * frac));
            const t = t2 + (t3 - t2) * frac;
            const p = basePos.clone().add(movOffset.clone().multiplyScalar(Math.max(0, ease)));
            times.push(t);
            values.push(p.x, p.y, p.z);
          }

          times.push(tEnd);
          values.push(basePos.x, basePos.y, basePos.z);

          return new THREE.VectorKeyframeTrack(`${objUuid}.position`, times, values, THREE.InterpolateLinear);
        };

        grupo.piezas.forEach((nombrePieza) => {
          const piezaBuscada = nombrePieza.toLowerCase().trim();
          const pmBuscada = extraerPiezaMadre(nombrePieza).toLowerCase().trim();
          if (!piezaBuscada && !pmBuscada) return;

          sceneMeshes.forEach((obj) => {
            const instKey = ((obj.userData?.instanciaKey || "") as string).toLowerCase().trim();
            const cleanName = ((obj.userData?.cleanName || "") as string).toLowerCase().trim();
            const nodeName = (obj.name || "").toLowerCase().trim();
            const pmObj = extraerPiezaMadre(instKey || cleanName || nodeName).toLowerCase().trim();

            const esFija = esCorrederaFijaMesh(nodeName, cleanName, instKey);
            if (esFija) return;

            const initPos = getSafeRestPosition(obj);
            const esTornillo = pmObj.includes("parafuso") || pmObj.includes("tornillo") || cleanName.includes("parafuso") || instKey.includes("parafuso");
            if (esTornillo) {
              if (initPos.z < -0.40) return;
              const distMin = initPos.x - minXMueble;
              const distMax = maxXMueble - initPos.x;
              const distCentro = Math.abs(initPos.x - centroXMueble);
              if (distMin < 0.025 || distMax < 0.025 || distCentro < 0.010) return;

              if (correderasFijas.length > 0) {
                const unidoACorrederaFija = correderasFijas.some((fija) => {
                  const dy = Math.abs(initPos.y - fija.y);
                  const dz = Math.abs(initPos.z - fija.z);
                  if (dy < 0.035 && dz < 0.28) {
                    if (fija.x < centroXMueble && initPos.x <= fija.x + 0.002) return true;
                    if (fija.x >= centroXMueble && initPos.x >= fija.x - 0.002) return true;
                  }
                  return false;
                });
                if (unidoACorrederaFija) return;
              }
            }

            const coincide =
              (instKey && (instKey === piezaBuscada || instKey === pmBuscada)) ||
              (nodeName && (nodeName === piezaBuscada || nodeName.startsWith(piezaBuscada + "::"))) ||
              (cleanName && (cleanName === piezaBuscada || cleanName === pmBuscada)) ||
              (pmObj && pmObj === pmBuscada && !nombrePieza.includes("("));

            if (coincide && !animatedMeshUuids.has(obj.uuid)) {
              animatedMeshUuids.add(obj.uuid);
              const isIntermedia = esCorrederaIntermediaMesh(nodeName, cleanName, instKey);
              const effectiveOffset = isIntermedia ? offset.clone().multiplyScalar(0.5) : offset;
              tracks.push(generarPistasCajon(obj.uuid, initPos, effectiveOffset));
            }
          });
        });

        if (yCajon !== null) {
          const yCajonVal = yCajon;
          sceneMeshes.forEach((obj) => {
            const instKey = ((obj.userData?.instanciaKey || "") as string).toLowerCase().trim();
            const cleanName = ((obj.userData?.cleanName || "") as string).toLowerCase().trim();
            const nodeName = (obj.name || "").toLowerCase().trim();
            const esCorredera = instKey.includes("corredi") || cleanName.includes("corredi") || nodeName.includes("corredi");

            if (esCorredera && !animatedMeshUuids.has(obj.uuid)) {
              const initPos = getSafeRestPosition(obj);
              if (Math.abs(initPos.y - yCajonVal) < 0.10) {
                if (centroXCajon !== null && Math.abs(centroXCajon - centroXMueble) > 0.05) {
                  const cajonEnBahiaIzquierda = centroXCajon < centroXMueble;
                  const correderaEnBahiaIzquierda = initPos.x < centroXMueble;
                  if (cajonEnBahiaIzquierda !== correderaEnBahiaIzquierda) return;
                }

                if (minXGrupo !== Infinity && maxXGrupo !== -Infinity) {
                  const enMismaColumna = initPos.x >= minXGrupo - 0.015 && initPos.x <= maxXGrupo + 0.015;
                  if (!enMismaColumna) return;
                }

                const esFija = esCorrederaFijaMesh(nodeName, cleanName, instKey);
                if (esFija) return;

                animatedMeshUuids.add(obj.uuid);
                const esIntermedia = esCorrederaIntermediaMesh(nodeName, cleanName, instKey);
                if (esIntermedia) {
                  tracks.push(generarPistasCajon(obj.uuid, initPos, offset.clone().multiplyScalar(0.5)));
                } else {
                  tracks.push(generarPistasCajon(obj.uuid, initPos, offset));
                }
              }
            }
          });

          sceneMeshes.forEach((obj) => {
            if (animatedMeshUuids.has(obj.uuid)) return;

            const instKey = ((obj.userData?.instanciaKey || "") as string).toLowerCase().trim();
            const cleanName = ((obj.userData?.cleanName || "") as string).toLowerCase().trim();
            const nodeName = (obj.name || "").toLowerCase().trim();
            const pmObj = extraerPiezaMadre(instKey || cleanName || nodeName).toLowerCase().trim();

            const esHerrajeCajon =
              pmObj.includes("suporte") ||
              cleanName.includes("suporte") ||
              instKey.includes("suporte") ||
              pmObj.includes("parafuso f") ||
              cleanName.includes("parafuso f") ||
              instKey.includes("parafuso f") ||
              pmObj.includes("parafuso e") ||
              cleanName.includes("parafuso e") ||
              instKey.includes("parafuso e");

            if (esHerrajeCajon) {
              const initPos = getSafeRestPosition(obj);
              if (initPos.z < -0.40) return;

              if (Math.abs(initPos.y - yCajonVal) < 0.08) {
                if (centroXCajon !== null && Math.abs(centroXCajon - centroXMueble) > 0.05) {
                  const cajonEnBahiaIzquierda = centroXCajon < centroXMueble;
                  const herrajeEnBahiaIzquierda = initPos.x < centroXMueble;
                  if (cajonEnBahiaIzquierda !== herrajeEnBahiaIzquierda) return;
                }

                const esTornilloCorredera =
                  pmObj.includes("parafuso e") ||
                  cleanName.includes("parafuso e") ||
                  instKey.includes("parafuso e");

                if (esTornilloCorredera) {
                  const distMin = initPos.x - minXMueble;
                  const distMax = maxXMueble - initPos.x;
                  const distCentro = Math.abs(initPos.x - centroXMueble);
                  const esFijoAlMueble = distMin < 0.025 || distMax < 0.025 || distCentro < 0.010;
                  if (esFijoAlMueble) return;
                } else {
                  if (minXGrupo !== Infinity && maxXGrupo !== -Infinity) {
                    const enMismaColumna = initPos.x >= minXGrupo - 0.025 && initPos.x <= maxXGrupo + 0.025;
                    if (!enMismaColumna) return;
                  }
                }

                animatedMeshUuids.add(obj.uuid);
                tracks.push(generarPistasCajon(obj.uuid, initPos, offset));
              }
            }
          });
        }
      }
    });
  }
}
