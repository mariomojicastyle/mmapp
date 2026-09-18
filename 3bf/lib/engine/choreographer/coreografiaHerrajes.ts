import * as THREE from "three";
import { PasoManualStudio, ElementoSecuenciaCinematica, PiezaEsperaConfig } from "../../store";
import {
  getSafeRestPosition,
  getSafeRestQuaternion,
  coincidenMismoHerraje,
  comprobarHerrajeCongelado,
  resolverDireccionAproximacionHerraje,
  perteneceAMismaFamiliaPieza,
} from "../cadStateUtils";

/**
 * Crea un VectorKeyframeTrack garantizando que los tiempos sean estrictamente crecientes
 * y no contenga marcas de tiempo duplicadas que generen divisiones por cero en THREE.Interpolant.
 */
function crearTrackVectorSanitizado(name: string, rawTimes: number[], rawValues: number[]): THREE.VectorKeyframeTrack {
  const times: number[] = [];
  const values: number[] = [];
  for (let i = 0; i < rawTimes.length; i++) {
    const t = Math.max(0, rawTimes[i]);
    const x = rawValues[i * 3];
    const y = rawValues[i * 3 + 1];
    const z = rawValues[i * 3 + 2];
    if (times.length > 0 && Math.abs(times[times.length - 1] - t) < 0.005) {
      values[values.length - 3] = x;
      values[values.length - 2] = y;
      values[values.length - 1] = z;
    } else {
      times.push(t);
      values.push(x, y, z);
    }
  }
  return new THREE.VectorKeyframeTrack(name, times, values);
}

function crearTrackQuaternionSanitizado(name: string, rawTimes: number[], rawValues: number[]): THREE.QuaternionKeyframeTrack {
  const times: number[] = [];
  const values: number[] = [];
  for (let i = 0; i < rawTimes.length; i++) {
    const t = Math.max(0, rawTimes[i]);
    const x = rawValues[i * 4];
    const y = rawValues[i * 4 + 1];
    const z = rawValues[i * 4 + 2];
    const w = rawValues[i * 4 + 3];
    if (times.length > 0 && Math.abs(times[times.length - 1] - t) < 0.005) {
      values[values.length - 4] = x;
      values[values.length - 3] = y;
      values[values.length - 2] = z;
      values[values.length - 1] = w;
    } else {
      times.push(t);
      values.push(x, y, z, w);
    }
  }
  return new THREE.QuaternionKeyframeTrack(name, times, values);
}

/**
 * Genera las pistas de animación de herrajes cohesionados a una pieza:
 * - Herrajes congelados (pre-instalados en pasos anteriores): escala sincronizada con madre y traslado solidario.
 * - Herrajes nuevos: inserción concéntrica Punto A -> Punto B en barrenos, apriete axial 720°, y traslado hacia el mueble al llegar a tStartTraslado.
 */
export function compilarCoreografiaHerrajesCohesionados(
  elem: ElementoSecuenciaCinematica,
  confPieza: PiezaEsperaConfig | undefined,
  sceneMeshes: THREE.Mesh[],
  stepFloorDropY: number,
  vOffset: THREE.Vector3,
  tStart: number,
  durInsert: number,
  duracionPaso: number,
  tAparicionPieza: number,
  tStartTraslado: number,
  tEndAction: number,
  trasladaMadera: boolean,
  paso: PasoManualStudio,
  tracks: THREE.KeyframeTrack[]
): void {
  if (!elem.herrajesCohesionados || elem.herrajesCohesionados.length === 0) return;

  // 🛡️ BLINDAJE DE COHERENCIA TEMPORAL:
  // Si tAparicionPieza no está definida, usar 0.
  const tAparicionSaneada = Math.max(0, tAparicionPieza || 0);

  const listaCongeladosRaw = elem.herrajesCongelados || confPieza?.herrajesCongelados || [];
  const congeladosSet = new Set(
    listaCongeladosRaw.map((h) =>
      h.replace(/^RH_OUT:/i, "").split("::").pop()!.trim().toLowerCase()
    )
  );

  const listaNuevos = elem.herrajesCohesionados.filter((h) => {
    const hLow = h.replace(/^RH_OUT:/i, "").split("::").pop()!.trim().toLowerCase();
    return !congeladosSet.has(hLow) && !comprobarHerrajeCongelado(h, listaCongeladosRaw);
  });
  const totalNuevos = Math.max(1, listaNuevos.length);

  // 🪵 Malla representativa de la pieza madre para cálculo de vectores de aproximación relativos
  const targetMadreMesh = sceneMeshes.find((m) => {
    const cn = (m.userData?.cleanName || m.name || "").replace(/^RH_OUT:/i, "").trim().toLowerCase();
    const pm = (m.userData?.piezaMadre || "").toLowerCase().trim();
    const ik = (m.userData?.instanciaKey || "").toLowerCase().trim();
    const nodo = (elem.nombreNodo || "").toLowerCase().trim();
    return cn === nodo || pm === nodo || ik === nodo || perteneceAMismaFamiliaPieza(cn, nodo);
  }) || null;

  elem.herrajesCohesionados.forEach((hwMeshName) => {
    const hwTargetLow = hwMeshName.replace(/^RH_OUT:/i, "").split("::").pop()!.trim().toLowerCase();
    const matchingHwMeshes = sceneMeshes.filter((m) => {
      const u = m.userData || {};
      const ik = (u.instanciaKey || "") as string;
      const cn = (u.cleanName || m.name || "") as string;
      const raw = m.name || "";
      const meshIdent = ik || raw || cn;
      return (
        coincidenMismoHerraje(hwMeshName, meshIdent) ||
        coincidenMismoHerraje(hwTargetLow, meshIdent) ||
        (ik && coincidenMismoHerraje(hwMeshName, ik)) ||
        (ik && coincidenMismoHerraje(hwTargetLow, ik))
      );
    });

    const esCongelado =
      congeladosSet.has(hwTargetLow) ||
      comprobarHerrajeCongelado(hwMeshName, listaCongeladosRaw) ||
      comprobarHerrajeCongelado(hwTargetLow, listaCongeladosRaw) ||
      Array.from(congeladosSet).some((c) => coincidenMismoHerraje(c, hwMeshName));
    const idxNuevo = listaNuevos.indexOf(hwMeshName);

    matchingHwMeshes.forEach((hwMesh) => {
      const u = hwMesh.userData || {};
      const ik = (u.instanciaKey || "") as string;
      const raw = hwMesh.name || "";
      const cn = (u.cleanName || "") as string;

      const esCongeladoMesh =
        esCongelado ||
        comprobarHerrajeCongelado(ik, listaCongeladosRaw) ||
        comprobarHerrajeCongelado(raw, listaCongeladosRaw) ||
        comprobarHerrajeCongelado(cn, listaCongeladosRaw);

      const pHwRest = getSafeRestPosition(hwMesh);
      // 🎯 Posición de reposo final exacta de diseño ensamblado (Modelo Armado CAD original de Grasshopper)
      const pHwRestFinal = pHwRest.clone();
      const pHwPop = pHwRest.clone().add(vOffset);

      if (esCongeladoMesh) {
        // ❄️ HERRAJE PRE-INSTALADO (CONGELADO):
        let tAparicionCongelado = tAparicionSaneada;
        const mapTiempos = {
          ...(confPieza?.tiemposAparicionHerrajes || {}),
          ...(elem.tiemposAparicionHerrajes || {}),
        };
        for (const [k, v] of Object.entries(mapTiempos)) {
          if (
            coincidenMismoHerraje(k, hwTargetLow) ||
            coincidenMismoHerraje(k, hwMeshName) ||
            coincidenMismoHerraje(k, hwMesh.name) ||
            coincidenMismoHerraje(k, ik) ||
            coincidenMismoHerraje(k, cn)
          ) {
            if (typeof v === "number" && v > 0) {
              tAparicionCongelado = v;
              break;
            }
          }
        }

        let hwScaleTimes: number[];
        let hwScaleValues: number[];

        if (tAparicionCongelado >= duracionPaso) {
          hwScaleTimes = [0, duracionPaso];
          hwScaleValues = [0, 0, 0, 0, 0, 0];
        } else if (tAparicionCongelado > 0) {
          const tPop = Math.min(duracionPaso, tAparicionCongelado);
          const tPre = Math.max(0, tPop - 0.02);
          if (tPre > 0) {
            hwScaleTimes = [0, tPre, tPop, duracionPaso];
            hwScaleValues = [
              0, 0, 0,
              0, 0, 0,
              1, 1, 1,
              1, 1, 1,
            ];
          } else {
            hwScaleTimes = [0, tPop, duracionPaso];
            hwScaleValues = [
              0, 0, 0,
              1, 1, 1,
              1, 1, 1,
            ];
          }
        } else {
          hwScaleTimes = [0, duracionPaso];
          hwScaleValues = [1, 1, 1, 1, 1, 1];
        }
        tracks.push(crearTrackVectorSanitizado(`${hwMesh.uuid}.scale`, hwScaleTimes, hwScaleValues));

        const hwPosTimes: number[] = [];
        const hwPosValues: number[] = [];

        if (trasladaMadera) {
          if (tStartTraslado > 0) {
            hwPosTimes.push(0, tStartTraslado, tEndAction, duracionPaso);
            hwPosValues.push(
              pHwPop.x, pHwPop.y, pHwPop.z,
              pHwPop.x, pHwPop.y, pHwPop.z,
              pHwRestFinal.x, pHwRestFinal.y, pHwRestFinal.z,
              pHwRestFinal.x, pHwRestFinal.y, pHwRestFinal.z
            );
          } else {
            hwPosTimes.push(0, tEndAction, duracionPaso);
            hwPosValues.push(
              pHwPop.x, pHwPop.y, pHwPop.z,
              pHwRestFinal.x, pHwRestFinal.y, pHwRestFinal.z,
              pHwRestFinal.x, pHwRestFinal.y, pHwRestFinal.z
            );
          }
        } else {
          hwPosTimes.push(0, duracionPaso);
          hwPosValues.push(
            pHwPop.x, pHwPop.y, pHwPop.z,
            pHwPop.x, pHwPop.y, pHwPop.z
          );
        }
        tracks.push(crearTrackVectorSanitizado(`${hwMesh.uuid}.position`, hwPosTimes, hwPosValues));
      } else {
        // 🔩 HERRAJE NUEVO: ANIMACIÓN DE INSERCIÓN CONCÉNTRICA EN BARRENO
        const tHwStart = durInsert > 0
          ? tStart + (Math.max(0, idxNuevo) / totalNuevos) * (durInsert * 0.40)
          : tStart;
        const tHwPop = tHwStart + 0.15;
        const tHwLlegada = durInsert > 0 ? tHwStart + (durInsert * 0.55) : tStart + 0.3;

        const distGlobalCm =
          elem.distanciaAproximacionHerrajesCm ||
          paso.configuracionCinematica?.distanciaAproximacionHerrajesCm ||
          15;

        let dirCodeConfigurada: string | undefined = undefined;
        const mapDirs = {
          ...(confPieza?.direccionesHerrajes || {}),
          ...(elem.direccionesHerrajes || {}),
        };

        for (const [k, v] of Object.entries(mapDirs)) {
          if (
            coincidenMismoHerraje(k, hwTargetLow) ||
            coincidenMismoHerraje(k, hwMeshName) ||
            coincidenMismoHerraje(k, hwMesh.name) ||
            coincidenMismoHerraje(k, (hwMesh.userData?.instanciaKey as string)) ||
            coincidenMismoHerraje(k, (hwMesh.userData?.cleanName as string))
          ) {
            dirCodeConfigurada = v;
            break;
          }
        }

        const dirInfo = resolverDireccionAproximacionHerraje(
          hwMeshName,
          pHwRest,
          targetMadreMesh,
          distGlobalCm,
          dirCodeConfigurada
        );

        const dirNorm = dirInfo.dirCode;
        const distEfectivaM = dirInfo.distM;

        let vDirOffset = new THREE.Vector3(0, distEfectivaM, 0); // +Y por defecto
        if (dirNorm === "-Y") vDirOffset.set(0, -distEfectivaM, 0);
        else if (dirNorm === "+X") vDirOffset.set(distEfectivaM, 0, 0);
        else if (dirNorm === "-X") vDirOffset.set(-distEfectivaM, 0, 0);
        else if (dirNorm === "+Z") vDirOffset.set(0, 0, distEfectivaM);
        else if (dirNorm === "-Z") vDirOffset.set(0, 0, -distEfectivaM);

        const puntoB = pHwPop.clone();
        const puntoA = pHwPop.clone().add(vDirOffset);

        const mapTiempos = {
          ...(confPieza?.tiemposAparicionHerrajes || {}),
          ...(elem.tiemposAparicionHerrajes || {}),
        };
        let tAparicionPersonalizado: number | null = null;
        for (const [k, v] of Object.entries(mapTiempos)) {
          if (
            coincidenMismoHerraje(k, hwTargetLow) ||
            coincidenMismoHerraje(k, hwMeshName) ||
            coincidenMismoHerraje(k, hwMesh.name) ||
            coincidenMismoHerraje(k, (hwMesh.userData?.instanciaKey as string)) ||
            coincidenMismoHerraje(k, (hwMesh.userData?.cleanName as string))
          ) {
            if (typeof v === "number" && v > 0) {
              tAparicionPersonalizado = v;
              break;
            }
          }
        }

        if ((tAparicionPersonalizado === null || tAparicionPersonalizado === 0) && tAparicionSaneada > 0) {
          tAparicionPersonalizado = tAparicionSaneada;
        }

        // Pista de Escala
        let scaleTimes: number[];
        let scaleValues: number[];
        if (tAparicionPersonalizado !== null && tAparicionPersonalizado >= duracionPaso) {
          scaleTimes = [0, duracionPaso];
          scaleValues = [0, 0, 0, 0, 0, 0];
        } else if (tAparicionPersonalizado !== null && tAparicionPersonalizado > 0) {
          const tPop = Math.min(duracionPaso, tAparicionPersonalizado);
          const tPre = Math.max(0, tPop - 0.02);
          if (tPre > 0) {
            scaleTimes = [0, tPre, tPop, duracionPaso];
            scaleValues = [
              0, 0, 0,
              0, 0, 0,
              1.0, 1.0, 1.0,
              1.0, 1.0, 1.0,
            ];
          } else {
            scaleTimes = [0, tPop, duracionPaso];
            scaleValues = [
              0, 0, 0,
              1.0, 1.0, 1.0,
              1.0, 1.0, 1.0,
            ];
          }
        } else {
          scaleTimes = [0, duracionPaso];
          scaleValues = [
            1.0, 1.0, 1.0,
            1.0, 1.0, 1.0,
          ];
        }
        tracks.push(crearTrackVectorSanitizado(`${hwMesh.uuid}.scale`, scaleTimes, scaleValues));

        // Pista de Posición
        const hwPosTimes: number[] = [];
        const hwPosValues: number[] = [];

        if (tAparicionPersonalizado !== null && tAparicionPersonalizado > 0) {
          const tHwCustomStart = Math.min(duracionPaso, tAparicionPersonalizado);
          const tHwCustomLlegada = Math.min(duracionPaso, tHwCustomStart + 0.6);

          if (trasladaMadera && tHwCustomStart >= tStartTraslado) {
            // 🎯 CASO A: El herraje aparece DESPUÉS de que la pieza madre ya inició o completó su traslado (ej: 53s vs 14s).
            // La pieza madre ya está en el mueble. El herraje debe aparecer DIRECTAMENTE en el mueble junto a la pieza.
            const puntoBMueble = pHwRestFinal.clone();
            const puntoAMueble = pHwRestFinal.clone().add(vDirOffset);

            hwPosTimes.push(0, tHwCustomStart, tHwCustomLlegada, duracionPaso);
            hwPosValues.push(
              puntoAMueble.x, puntoAMueble.y, puntoAMueble.z,
              puntoAMueble.x, puntoAMueble.y, puntoAMueble.z,
              puntoBMueble.x, puntoBMueble.y, puntoBMueble.z,
              puntoBMueble.x, puntoBMueble.y, puntoBMueble.z
            );
          } else {
            // 🎯 CASO B: El herraje aparece ANTES del traslado de la pieza madre (ej: 0s vs 14s).
            // Se inserta en el piso y a partir de tStartTraslado viaja SOLIDARIAMENTE con la pieza hacia el mueble.
            hwPosTimes.push(0, tHwCustomStart, tHwCustomLlegada);
            hwPosValues.push(
              puntoA.x, puntoA.y, puntoA.z,
              puntoA.x, puntoA.y, puntoA.z,
              puntoB.x, puntoB.y, puntoB.z
            );

            if (trasladaMadera) {
              if (tStartTraslado > tHwCustomLlegada) {
                hwPosTimes.push(tStartTraslado);
                hwPosValues.push(puntoB.x, puntoB.y, puntoB.z);
              }
              hwPosTimes.push(tEndAction, duracionPaso);
              hwPosValues.push(
                pHwRestFinal.x, pHwRestFinal.y, pHwRestFinal.z,
                pHwRestFinal.x, pHwRestFinal.y, pHwRestFinal.z
              );
            } else {
              hwPosTimes.push(duracionPaso);
              hwPosValues.push(puntoB.x, puntoB.y, puntoB.z);
            }
          }
        } else {
          hwPosTimes.push(0, tHwStart, tHwLlegada);
          hwPosValues.push(
            puntoA.x, puntoA.y, puntoA.z,
            puntoA.x, puntoA.y, puntoA.z,
            puntoB.x, puntoB.y, puntoB.z
          );

          if (trasladaMadera) {
            if (tStartTraslado > tHwLlegada) {
              hwPosTimes.push(tStartTraslado);
              hwPosValues.push(puntoB.x, puntoB.y, puntoB.z);
            }
            hwPosTimes.push(tEndAction, duracionPaso);
            hwPosValues.push(
              pHwRestFinal.x, pHwRestFinal.y, pHwRestFinal.z,
              pHwRestFinal.x, pHwRestFinal.y, pHwRestFinal.z
            );
          } else {
            hwPosTimes.push(duracionPaso);
            hwPosValues.push(puntoB.x, puntoB.y, puntoB.z);
          }
        }
        tracks.push(crearTrackVectorSanitizado(`${hwMesh.uuid}.position`, hwPosTimes, hwPosValues));

        // Pista de Rotación (Tornillos / Pernos / Tuercas / Minifix)
        const isScrew = /(parafuso|tornillo|perno|porca|tuerca|minifix)/i.test(hwTargetLow);
        if (isScrew) {
          const qRestHw = getSafeRestQuaternion(hwMesh);
          const rotAxis = new THREE.Vector3(0, 1, 0);
          const totalRot = Math.PI * 4;
          const qRotMid = qRestHw.clone().multiply(new THREE.Quaternion().setFromAxisAngle(rotAxis, totalRot * 0.5));
          const qRotFin = qRestHw.clone().multiply(new THREE.Quaternion().setFromAxisAngle(rotAxis, totalRot));

          let rotTimes: number[];
          let rotValues: number[];

          if (tAparicionPersonalizado !== null && tAparicionPersonalizado > 0) {
            const tRotStart = Math.min(duracionPaso, tAparicionPersonalizado);
            const tRotEnd = Math.min(duracionPaso, tRotStart + 0.6);
            const tRotMid = tRotStart + (tRotEnd - tRotStart) * 0.5;
            rotTimes = [0, tRotStart, tRotMid, tRotEnd, duracionPaso];
            rotValues = [
              qRestHw.x, qRestHw.y, qRestHw.z, qRestHw.w,
              qRestHw.x, qRestHw.y, qRestHw.z, qRestHw.w,
              qRotMid.x, qRotMid.y, qRotMid.z, qRotMid.w,
              qRotFin.x, qRotFin.y, qRotFin.z, qRotFin.w,
              qRotFin.x, qRotFin.y, qRotFin.z, qRotFin.w,
            ];
          } else {
            const tRotMid = tHwPop + (tHwLlegada - tHwPop) * 0.5;
            rotTimes = [0, tHwPop, tRotMid, tHwLlegada, duracionPaso];
            rotValues = [
              qRestHw.x, qRestHw.y, qRestHw.z, qRestHw.w,
              qRestHw.x, qRestHw.y, qRestHw.z, qRestHw.w,
              qRotMid.x, qRotMid.y, qRotMid.z, qRotMid.w,
              qRotFin.x, qRotFin.y, qRotFin.z, qRotFin.w,
              qRotFin.x, qRotFin.y, qRotFin.z, qRotFin.w,
            ];
          }
          tracks.push(crearTrackQuaternionSanitizado(`${hwMesh.uuid}.quaternion`, rotTimes, rotValues));
        }
      }
    });
  });
}
