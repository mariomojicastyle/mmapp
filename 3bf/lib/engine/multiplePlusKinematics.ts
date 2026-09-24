/**
 * multiplePlusKinematics.ts
 *
 * Motor cinemático aislado para el 5º Modo de Animación: "Múltiple Plus" (multiple_plus).
 * Gestiona capas independientes, tableros con tiempo de espera/desplazamiento hacia destinos
 * e inserción axial de herrajes a velocidad constante paramétrica (cm/s).
 *
 * Blindaje: Totalmente desacoplado de showcase, ensamble y bloque_estándar.
 */

import * as THREE from "three";
import { PasoManualStudio, CapaMultiplePlus, TableroCapaPlus, HerrajeCapaPlus } from "../storeTypes";
import { KinematicEngineResult, AnimationEngineToolMeshes } from "./types";
import {
  getSafeRestPosition,
  getSafeRestQuaternion,
  coincidenMismoHerraje,
  comprobarHerrajeCongelado,
  perteneceAMismaFamiliaPieza,
  normalizarNombreNodo,
  resolverTableroAnfitrionHerraje,
  TableroCapaReferencia,
} from "./cadStateUtils";

/**
 * Crea un VectorKeyframeTrack sanitizado sin marcas de tiempo duplicadas.
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

/**
 * Crea un track de escala sanitizado.
 */
function crearTrackEscalaSanitizado(name: string, rawTimes: number[], rawValues: number[]): THREE.VectorKeyframeTrack {
  return crearTrackVectorSanitizado(name, rawTimes, rawValues);
}

/**
 * Resuelve el vector de aproximación en 3D según el eje especificado.
 */
function resolverVectorEje(eje: string, distanciaM: number): THREE.Vector3 {
  const v = new THREE.Vector3();
  switch (eje) {
    case "+X":
      v.set(distanciaM, 0, 0);
      break;
    case "-X":
      v.set(-distanciaM, 0, 0);
      break;
    case "+Y":
      v.set(0, distanciaM, 0);
      break;
    case "-Y":
      v.set(0, -distanciaM, 0);
      break;
    case "+Z":
      v.set(0, 0, distanciaM);
      break;
    case "-Z":
      v.set(0, 0, -distanciaM);
      break;
    default:
      v.set(-distanciaM, 0, 0); // Defecto: -X
      break;
  }
  return v;
}

/**
 * 🎯 Determina si una malla de la escena corresponde unívocamente a un tablero de capa,
 * respetando la discriminación atómica de instancias (1), (2), etc.
 */
function coincideMallaConTablero(
  tabTargetLow: string,
  cn: string,
  pm: string,
  ik: string
): boolean {
  if (ik === tabTargetLow || cn === tabTargetLow || pm === tabTargetLow) {
    return true;
  }

  const matchTarget = tabTargetLow.match(/\((\d+)\)/);
  const matchMesh = ik.match(/\((\d+)\)/) || cn.match(/\((\d+)\)/);

  if (matchTarget) {
    // Si el tablero es una instancia específica (ej. "Peça 15 (1)"):
    if (matchMesh) {
      return matchMesh[1] === matchTarget[1] && perteneceAMismaFamiliaPieza(cn, tabTargetLow);
    }
    return false;
  }

  // Si el tablero es genérico sin número (ej. "Peça 1"):
  if (matchMesh) {
    return false;
  }

  return perteneceAMismaFamiliaPieza(cn, tabTargetLow);
}

/**
 * Compila y hornea las pistas de animación de un paso Múltiple Plus.
 */
export function compilarMultiplePlusPaso(
  rootScene: THREE.Object3D,
  paso: PasoManualStudio,
  sceneMeshes: THREE.Mesh[],
  sceneObjects: Map<string, THREE.Object3D>,
  tracks: THREE.KeyframeTrack[],
  duracionPaso: number,
  toolMeshes?: AnimationEngineToolMeshes
): void {
  const mpConfig = paso.multiplePlus || {
    velocidadTablerosCmS: 15,
    velocidadHerrajesCmS: 8,
    movimientoGlobalCm: 20,
    capas: [],
  };

  const velocidadTablerosM_s = Math.max(0.01, (mpConfig.velocidadTablerosCmS ?? 15) / 100);
  const velocidadHerrajesM_s = Math.max(0.01, (mpConfig.velocidadHerrajesCmS ?? 8) / 100);
  const distGlobalM = Math.max(0, (mpConfig.movimientoGlobalCm ?? 20) / 100);

  const capas = mpConfig.capas || [];

  // Mapear todas las piezas y herrajes asignados en cualquier capa
  const piezasAsignadasSet = new Set<string>();
  const herrajesAsignadosSet = new Set<string>();

  capas.forEach((capa) => {
    (capa.tableros || []).forEach((t) => piezasAsignadasSet.add(t.id.toLowerCase().trim()));
    (capa.herrajes || []).forEach((h) => herrajesAsignadosSet.add(h.id.toLowerCase().trim()));
    (capa.congelados || []).forEach((c) => herrajesAsignadosSet.add(c.id.toLowerCase().trim()));
  });

  // Procesar cada capa
  capas.forEach((capa) => {
    const capaVisible = capa.visible !== false;

    // ─────────────────────────────────────────────────────────────────────────
    // 🪵 1. TABLEROS DE LA CAPA
    // ─────────────────────────────────────────────────────────────────────────
    (capa.tableros || []).forEach((tablero: TableroCapaPlus) => {
      const tabTargetLow = tablero.id.replace(/^RH_OUT:/i, "").trim().toLowerCase();
      const matchingMeshes = sceneMeshes.filter((m) => {
        const u = m.userData || {};
        const cn = (u.cleanName || m.name || "").replace(/^RH_OUT:/i, "").trim().toLowerCase();
        const pm = (u.piezaMadre || "").toLowerCase().trim();
        const ik = (u.instanciaKey || "").toLowerCase().trim();
        return coincideMallaConTablero(tabTargetLow, cn, pm, ik);
      });

      matchingMeshes.forEach((mesh) => {
        const pRest = getSafeRestPosition(mesh);

        // Si la capa está apagada, ocultar por completo
        if (!capaVisible) {
          tracks.push(
            crearTrackEscalaSanitizado(`${mesh.uuid}.scale`, [0, duracionPaso], [0, 0, 0, 0, 0, 0])
          );
          return;
        }

        // Posición de espera Punto A
        const offX = (tablero.offsetXCm || 0) / 100;
        const offY = (tablero.offsetYCm || 0) / 100;
        const offZ = (tablero.offsetZCm || 0) / 100;
        const puntoA = pRest.clone().add(new THREE.Vector3(offX, offY, offZ));
        const puntoB = pRest.clone(); // Destino final de diseño

        // Tiempos
        const tAparicion = Math.max(0, tablero.tiempoAparicion || 0);
        const tInicioMov = typeof tablero.tiempoInicioMovimiento === "number" ? tablero.tiempoInicioMovimiento : 500;

        // Pista de Escala
        if (tAparicion >= duracionPaso) {
          tracks.push(
            crearTrackEscalaSanitizado(`${mesh.uuid}.scale`, [0, duracionPaso], [0, 0, 0, 0, 0, 0])
          );
        } else if (tAparicion > 0) {
          const tPre = Math.max(0, tAparicion - 0.02);
          const sTimes = [0, tPre, tAparicion, duracionPaso];
          const sVals = [0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1];
          tracks.push(crearTrackEscalaSanitizado(`${mesh.uuid}.scale`, sTimes, sVals));
        } else {
          tracks.push(
            crearTrackEscalaSanitizado(`${mesh.uuid}.scale`, [0, duracionPaso], [1, 1, 1, 1, 1, 1])
          );
        }

        // Pista de Posición
        const pTimes: number[] = [];
        const pVals: number[] = [];

        if (tInicioMov >= duracionPaso) {
          // Permanece en espera durante todo el paso (defecto 500s)
          pTimes.push(0, duracionPaso);
          pVals.push(puntoA.x, puntoA.y, puntoA.z, puntoA.x, puntoA.y, puntoA.z);
        } else {
          // Desplazamiento hacia el destino a velocidad constante
          const distViaje = puntoA.distanceTo(puntoB);
          const tViaje = Math.max(0.2, distViaje > 0.001 ? distViaje / velocidadTablerosM_s : 0.5);
          const tLlegada = Math.min(duracionPaso, tInicioMov + tViaje);

          pTimes.push(0, tInicioMov, tLlegada, duracionPaso);
          pVals.push(
            puntoA.x, puntoA.y, puntoA.z,
            puntoA.x, puntoA.y, puntoA.z,
            puntoB.x, puntoB.y, puntoB.z,
            puntoB.x, puntoB.y, puntoB.z
          );
        }

        tracks.push(crearTrackVectorSanitizado(`${mesh.uuid}.position`, pTimes, pVals));
      });
    });

    // ─────────────────────────────────────────────────────────────────────────
    // 🔩 2. HERRAJES DE LA CAPA (Inserción Axial o Congelados - Solidarios al Tablero)
    // ─────────────────────────────────────────────────────────────────────────
    // 🧭 Construir referencias de tableros de esta capa para vincular barrenos geométricamente
    const tablerosCapaRefs: TableroCapaReferencia[] = [];
    (capa.tableros || []).forEach((t) => {
      const tLow = t.id.replace(/^RH_OUT:/i, "").trim().toLowerCase();
      const tMeshes = sceneMeshes.filter((m) => {
        const u = m.userData || {};
        const cn = (u.cleanName || m.name || "").replace(/^RH_OUT:/i, "").trim().toLowerCase();
        const pm = (u.piezaMadre || "").toLowerCase().trim();
        const ik = (u.instanciaKey || "").toLowerCase().trim();
        return coincideMallaConTablero(tLow, cn, pm, ik);
      });

      const boxTotal = new THREE.Box3();
      const posProm = new THREE.Vector3();
      tMeshes.forEach((tm) => {
        const pR = getSafeRestPosition(tm);
        const pRWorld = tm.parent ? tm.parent.localToWorld(pR.clone()) : pR.clone();
        posProm.add(pRWorld);
        const b = new THREE.Box3().setFromObject(tm);
        if (!b.isEmpty()) {
          boxTotal.union(b);
        } else {
          boxTotal.expandByPoint(pRWorld);
        }
      });
      if (tMeshes.length > 0) {
        posProm.divideScalar(tMeshes.length);
      }

      tablerosCapaRefs.push({
        id: t.id,
        cleanName: t.id.replace(/^RH_OUT:/i, "").trim(),
        boxRestWorld: boxTotal,
        restWorldPos: posProm,
        mesh: tMeshes[0],
        offsetXCm: t.offsetXCm,
        offsetYCm: t.offsetYCm,
        offsetZCm: t.offsetZCm,
        tiempoInicioMovimiento: t.tiempoInicioMovimiento,
      });
    });

    const todosHerrajesCapa = [
      ...(capa.herrajes || []).map((h) => ({ ...h, congelado: false })),
      ...(capa.congelados || []).map((c) => ({ ...c, congelado: true })),
    ];

    todosHerrajesCapa.forEach((herraje: HerrajeCapaPlus) => {
      const hwTargetLow = herraje.id.replace(/^RH_OUT:/i, "").split("::").pop()!.trim().toLowerCase();
      const matchingHwMeshes = sceneMeshes.filter((m) => {
        const u = m.userData || {};
        const ik = (u.instanciaKey || "") as string;
        const cn = (u.cleanName || m.name || "") as string;
        const raw = m.name || "";
        const meshIdent = ik || raw || cn;
        return (
          coincidenMismoHerraje(herraje.id, meshIdent) ||
          coincidenMismoHerraje(hwTargetLow, meshIdent) ||
          (ik && coincidenMismoHerraje(herraje.id, ik)) ||
          (ik && coincidenMismoHerraje(hwTargetLow, ik)) ||
          (herraje.congelado && (
            comprobarHerrajeCongelado(meshIdent, [herraje.id]) ||
            comprobarHerrajeCongelado(raw, [herraje.id]) ||
            comprobarHerrajeCongelado(cn, [herraje.id]) ||
            Boolean(ik && comprobarHerrajeCongelado(ik, [herraje.id]))
          ))
        );
      });

      matchingHwMeshes.forEach((hwMesh) => {
        const pHwRest = getSafeRestPosition(hwMesh);
        const pHwRestWorld = hwMesh.parent ? hwMesh.parent.localToWorld(pHwRest.clone()) : pHwRest.clone();

        // 🎯 Resolver el tablero anfitrión específico para este herraje dentro de la capa
        const tabAnfitrion = resolverTableroAnfitrionHerraje(pHwRestWorld, tablerosCapaRefs);
        const offX = (tabAnfitrion?.offsetXCm || 0) / 100;
        const offY = (tabAnfitrion?.offsetYCm || 0) / 100;
        const offZ = (tabAnfitrion?.offsetZCm || 0) / 100;
        const vTableroOffset = new THREE.Vector3(offX, offY, offZ);
        const tieneOffsetTablero = vTableroOffset.lengthSq() > 0.00001;

        const tInicioMovTablero = typeof tabAnfitrion?.tiempoInicioMovimiento === "number"
          ? tabAnfitrion.tiempoInicioMovimiento
          : 500;
        const distV = vTableroOffset.length();
        const tViajeTab = Math.max(0.2, distV > 0.001 ? distV / velocidadTablerosM_s : 0.5);
        const tLlegadaTablero = Math.min(duracionPaso, tInicioMovTablero + tViajeTab);

        // Si la capa está apagada, ocultar por completo
        if (!capaVisible) {
          tracks.push(
            crearTrackEscalaSanitizado(`${hwMesh.uuid}.scale`, [0, duracionPaso], [0, 0, 0, 0, 0, 0])
          );
          return;
        }

        const tAparicion = Math.max(0, herraje.tiempoAparicion || 0);

        if (herraje.congelado) {
          // ❄️ Herraje congelado: ya instalado en barreno
          if (tAparicion >= duracionPaso) {
            tracks.push(
              crearTrackEscalaSanitizado(`${hwMesh.uuid}.scale`, [0, duracionPaso], [0, 0, 0, 0, 0, 0])
            );
          } else if (tAparicion > 0) {
            const tPre = Math.max(0, tAparicion - 0.02);
            tracks.push(
              crearTrackEscalaSanitizado(
                `${hwMesh.uuid}.scale`,
                [0, tPre, tAparicion, duracionPaso],
                [0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1]
              )
            );
          } else {
            tracks.push(
              crearTrackEscalaSanitizado(`${hwMesh.uuid}.scale`, [0, duracionPaso], [1, 1, 1, 1, 1, 1])
            );
          }

          // Posición: si la pieza está en el suelo, el herraje congelado reposa en el suelo
          const pHwEnPiso = pHwRest.clone().add(vTableroOffset);
          const pHwDestino = pHwRest.clone();
          const pTimes: number[] = [];
          const pVals: number[] = [];

          if (!tieneOffsetTablero || tInicioMovTablero >= duracionPaso) {
            const pFija = tieneOffsetTablero ? pHwEnPiso : pHwDestino;
            pTimes.push(0, duracionPaso);
            pVals.push(pFija.x, pFija.y, pFija.z, pFija.x, pFija.y, pFija.z);
          } else {
            pTimes.push(0, tInicioMovTablero, tLlegadaTablero, duracionPaso);
            pVals.push(
              pHwEnPiso.x, pHwEnPiso.y, pHwEnPiso.z,
              pHwEnPiso.x, pHwEnPiso.y, pHwEnPiso.z,
              pHwDestino.x, pHwDestino.y, pHwDestino.z,
              pHwDestino.x, pHwDestino.y, pHwDestino.z
            );
          }

          tracks.push(crearTrackVectorSanitizado(`${hwMesh.uuid}.position`, pTimes, pVals));
        } else {
          // 🚀 Herraje nuevo: inserción colineal desde Punto A hasta Punto B (barreno)
          const eje = herraje.ejeAproximacion || "-X";
          const vDirOffset = resolverVectorEje(eje, distGlobalM);

          const tViaje = distGlobalM > 0.001
            ? Math.max(0.15, distGlobalM / velocidadHerrajesM_s)
            : 0;
          const tHwStart = tAparicion;
          const tHwLlegada = Math.min(duracionPaso, tHwStart + tViaje);

          // Escala
          if (tHwStart >= duracionPaso) {
            tracks.push(
              crearTrackEscalaSanitizado(`${hwMesh.uuid}.scale`, [0, duracionPaso], [0, 0, 0, 0, 0, 0])
            );
          } else if (tHwStart > 0) {
            const tPre = Math.max(0, tHwStart - 0.02);
            tracks.push(
              crearTrackEscalaSanitizado(
                `${hwMesh.uuid}.scale`,
                [0, tPre, tHwStart, duracionPaso],
                [0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1]
              )
            );
          } else {
            tracks.push(
              crearTrackEscalaSanitizado(`${hwMesh.uuid}.scale`, [0, duracionPaso], [1, 1, 1, 1, 1, 1])
            );
          }

          // 📐 Posición:
          // Caso A: El herraje se instala DESPUÉS (o a la par) de que el tablero inicie su ensamble final.
          // Ej. Cantoneras y tornillos fijando la pieza 1 a la pieza 7 en t=51s cuando la pieza 1 ensambló en t=45s.
          // El barreno ya se encuentra en su posición armada final (pHwRest) y la inserción es 100% axial y colineal.
          const seInstalaDespuesDeEnsamble = tieneOffsetTablero && tHwStart >= tInicioMovTablero;

          const posTimes: number[] = [];
          const posVals: number[] = [];

          if (seInstalaDespuesDeEnsamble || !tieneOffsetTablero) {
            const puntoB = pHwRest.clone();
            const puntoA = puntoB.clone().add(vDirOffset);

            posTimes.push(0, tHwStart, tHwLlegada, duracionPaso);
            posVals.push(
              puntoA.x, puntoA.y, puntoA.z,
              puntoA.x, puntoA.y, puntoA.z,
              puntoB.x, puntoB.y, puntoB.z,
              puntoB.x, puntoB.y, puntoB.z
            );
          } else if (tInicioMovTablero >= duracionPaso) {
            // El tablero permanece en espera con offset durante todo el paso (banco/piso)
            const puntoB = pHwRest.clone().add(vTableroOffset);
            const puntoA = puntoB.clone().add(vDirOffset);

            posTimes.push(0, tHwStart, tHwLlegada, duracionPaso);
            posVals.push(
              puntoA.x, puntoA.y, puntoA.z,
              puntoA.x, puntoA.y, puntoA.z,
              puntoB.x, puntoB.y, puntoB.z,
              puntoB.x, puntoB.y, puntoB.z
            );
          } else {
            // Caso B: El herraje se instala PREVIAMENTE en el tablero (en espera en banco/suelo) antes de que viaje.
            // Ej. Tarugos o pernos instalados en t=10s, y el tablero viaja con ellos en t=45s.
            const pBarrenoEnPiso = pHwRest.clone().add(vTableroOffset);
            const puntoA = pBarrenoEnPiso.clone().add(vDirOffset);
            const puntoB = pBarrenoEnPiso.clone();
            const pFinalMueble = pHwRest.clone();

            const tTabStart = Math.max(tHwLlegada, tInicioMovTablero);
            const tTabEnd = Math.min(duracionPaso, tTabStart + (tLlegadaTablero - tInicioMovTablero));

            posTimes.push(0, tHwStart, tHwLlegada, tTabStart, tTabEnd, duracionPaso);
            posVals.push(
              puntoA.x, puntoA.y, puntoA.z,
              puntoA.x, puntoA.y, puntoA.z,
              puntoB.x, puntoB.y, puntoB.z,
              puntoB.x, puntoB.y, puntoB.z,
              pFinalMueble.x, pFinalMueble.y, pFinalMueble.z,
              pFinalMueble.x, pFinalMueble.y, pFinalMueble.z
            );
          }

          tracks.push(crearTrackVectorSanitizado(`${hwMesh.uuid}.position`, posTimes, posVals));
        }
      });
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // 💡 3. AISLAMIENTO DE PIEZAS NO ASIGNADAS (si ocultarNoAsignadas está activo)
  // ─────────────────────────────────────────────────────────────────────────
  if (paso.ocultarNoAsignadas) {
    sceneMeshes.forEach((m) => {
      const u = m.userData || {};
      const cn = (u.cleanName || m.name || "").replace(/^RH_OUT:/i, "").trim().toLowerCase();
      const pm = (u.piezaMadre || "").toLowerCase().trim();
      const ik = (u.instanciaKey || "").toLowerCase().trim();

      const estaAsignada =
        piezasAsignadasSet.has(cn) ||
        piezasAsignadasSet.has(pm) ||
        piezasAsignadasSet.has(ik) ||
        herrajesAsignadosSet.has(cn) ||
        herrajesAsignadosSet.has(ik);

      if (!estaAsignada) {
        tracks.push(
          crearTrackEscalaSanitizado(`${m.uuid}.scale`, [0, duracionPaso], [0, 0, 0, 0, 0, 0])
        );
      }
    });
  }
}
