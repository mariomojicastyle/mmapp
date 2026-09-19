import * as THREE from "three";
import { PasoManualStudio, ElementoSecuenciaCinematica } from "../store";
import { AnimationEngineToolMeshes } from "./types";
import {
  extraerPiezaMadre,
  extraerFamiliaPieza,
  perteneceAMismaFamiliaPieza,
  getSafeRestPosition,
  getSafeRestQuaternion,
  normalizarNombreNodo,
} from "./cadStateUtils";
import { compilarCoreografiaSubbloquesGiro } from "./choreographer/coreografiaSubbloquesGiro";
import { compilarCoreografiaHerrajesCohesionados } from "./choreographer/coreografiaHerrajes";
import { compilarCoreografiaHerramientas } from "./choreographer/coreografiaHerramientas";

/**
 * Compila y hornea las trayectorias cinematográficas de pasos de ensamble (P01+):
 * Piezas maestras, subbloques, correderas telescópicas, herrajes (tornillos, cavilhas/tarugos)
 * y herramientas activas (destornillador, llave allen, martillo).
 */
export function compilarEnsamblePaso(
  rootScene: THREE.Object3D,
  paso: PasoManualStudio,
  sceneMeshes: THREE.Mesh[],
  sceneObjects: Map<string, THREE.Object3D>,
  tracks: THREE.KeyframeTrack[],
  duracionPaso: number,
  toolMeshes?: AnimationEngineToolMeshes
): void {
  if (paso.tipo === "ensamble") {
    const tieneCinematicaCalibrada = Boolean(
      paso.configuracionCinematica?.piezasEspera &&
      paso.configuracionCinematica.piezasEspera.some(
        (p) => p.offsetXCm !== 0 || (p.offsetYCm ?? p.offsetZCm ?? 0) !== 0
      )
    );

    // 🧩 2.1 MODO MULTI-SUBBLOQUE (P02A, P02B, P02C... con Coreografía 1 o 2)
    if (paso.subbloques && paso.subbloques.length > 0 && !tieneCinematicaCalibrada) {
      compilarCoreografiaSubbloquesGiro(paso, sceneMeshes, tracks, duracionPaso);
    } else {
      // 2.2 Cinemática calibrada por piezas o fallback de secuencia
      const listaSecuencia: ElementoSecuenciaCinematica[] = [...(paso.secuencia || [])];

      // 👑 1. Identificar Pieza Master del paso (permanece firme en su posición de reposo)
      const masterKey = (
        paso.piezaMaster ||
        paso.configuracionCinematica?.piezasEspera?.find((p) => p.ordenEnsamble === 1)?.nombrePieza ||
        ""
      ).toLowerCase().trim();

      // 🔍 ESCÁNER DE ASENTAMIENTO EN PISO (DfMA Grounding Scanner):
      // Analiza la cota mínima de todas las piezas activas del paso en su reposo CAD.
      // Si el paso no incluye piezas apoyadas en el piso (ej. patas no instaladas en este paso),
      // calcula stepFloorDropY para que la base del ensamble descanse exactamente sobre el piso (Y = 0).
      let stepFloorDropY = 0;
      let minPasoY = Infinity;

      sceneMeshes.forEach((m) => {
        if (!m.isMesh) return;
        const u = m.userData || {};
        const cn = ((u.cleanName || m.name || "") as string).toLowerCase().trim();
        const pm = ((u.piezaMadre || extraerPiezaMadre(cn)) as string).toLowerCase().trim();
        const ik = ((u.instanciaKey || "") as string).toLowerCase().trim();
        const raw = (m.name || "").replace(/^RH_OUT:/i, "").trim().toLowerCase();

        const esDePaso = (paso.piezasAsignadas || []).some((pAsig) => {
          const pAsigLow = pAsig.toLowerCase().trim();
          return cn === pAsigLow || pm === pAsigLow || ik === pAsigLow || raw === pAsigLow || perteneceAMismaFamiliaPieza(cn, pAsigLow);
        });

        if (esDePaso) {
          const pRest = getSafeRestPosition(m);
          const curPos = m.position.clone();
          m.position.copy(pRest);
          m.updateWorldMatrix(true, true);
          const bBox = new THREE.Box3().setFromObject(m);
          m.position.copy(curPos);
          m.updateWorldMatrix(true, true);

          if (!bBox.isEmpty() && bBox.min.y < minPasoY) {
            minPasoY = bBox.min.y;
          }
        }
      });

      if (minPasoY !== Infinity && minPasoY > 0.005) {
        stepFloorDropY = -minPasoY;
      }

      // Asegurar que cada pieza configurada en piezasEspera tenga su elemento en la secuencia
      if (paso.configuracionCinematica?.piezasEspera) {
        paso.configuracionCinematica.piezasEspera.forEach((pConf, pIdx) => {
          const esMaster = Boolean(masterKey && perteneceAMismaFamiliaPieza(pConf.nombrePieza, masterKey));
          const existe = listaSecuencia.some(
            (s) =>
              s.nombreNodo === pConf.nombrePieza ||
              perteneceAMismaFamiliaPieza(s.nombreNodo || "", pConf.nombrePieza || "")
          );
          if (!existe) {
            const offY = pConf.offsetYCm ?? pConf.offsetZCm ?? 0;
            const dist = Math.sqrt((pConf.offsetXCm / 100) ** 2 + (offY / 100) ** 2);
            listaSecuencia.push({
              id: `seq_${pConf.nombrePieza}`,
              nombreNodo: pConf.nombrePieza,
              tipo: "pieza",
              tiempoInicio: esMaster ? 0.5 : 0.5 + pIdx * 2.0,
              duracionInsercionHerrajes: 2.0,
              duracionMovimiento: esMaster ? 0 : Math.max(1.5, Math.round((dist / 0.15) * 10) / 10),
              popIn: false,
              distanciaAproximacion: esMaster ? 0 : dist,
              herrajesCongelados: pConf.herrajesCongelados || [],
              direccionesHerrajes: pConf.direccionesHerrajes || {},
              tiemposAparicionHerrajes: pConf.tiemposAparicionHerrajes || {},
              tiempoAparicionPieza: pConf.tiempoAparicionPieza || 0,
              tiempoFinHerrajes: pConf.tiempoFinHerrajes || 0,
              distanciaAproximacionHerrajesCm: paso.configuracionCinematica?.distanciaAproximacionHerrajesCm || 15,
            });
          }
        });
      }

      listaSecuencia.forEach((elem: ElementoSecuenciaCinematica) => {
        const esMaster = Boolean(masterKey && perteneceAMismaFamiliaPieza(elem.nombreNodo || "", masterKey));
        const distEspera = elem.distanciaAproximacion || 0;
        const trasladaMadera = !esMaster || distEspera > 0.01;

        // Configuración de la pieza en piezasEspera
        const confPiezaPre = paso.configuracionCinematica?.piezasEspera?.find(
          (p) =>
            p.nombrePieza === elem.nombreNodo ||
            perteneceAMismaFamiliaPieza(p.nombrePieza, elem.nombreNodo)
        );

        // Identificar si tiene herrajes nuevos a insertar en este paso
        const congeladosSetPre = new Set(
          (elem.herrajesCongelados || confPiezaPre?.herrajesCongelados || []).map((h) =>
            h.replace(/^RH_OUT:/i, "").split("::").pop()!.trim().toLowerCase()
          )
        );
        const listaNuevosPre = (elem.herrajesCohesionados || []).filter((h) => {
          const hLow = h.replace(/^RH_OUT:/i, "").split("::").pop()!.trim().toLowerCase();
          return !congeladosSetPre.has(hLow);
        });
        const tieneHerrajesNuevos =
          (elem.herrajesNuevos && elem.herrajesNuevos.length > 0) || listaNuevosPre.length > 0;
        const vHwM_sPre = Math.max(0.02, (paso.configuracionCinematica?.velocidadHerrajesCmS || 8) / 100);
        const distHwMPre = ((elem.distanciaAproximacionHerrajesCm || paso.configuracionCinematica?.distanciaAproximacionHerrajesCm || 15) / 100);
        const durInsertFisicaFallback = Math.round((Math.max(0.3, distHwMPre / vHwM_sPre) + 0.4) * 10) / 10;
        const durInsert = elem.duracionInsercionHerrajes || (tieneHerrajesNuevos ? durInsertFisicaFallback : 0);

        const tKey = (elem.nombreNodo || "").toLowerCase().trim();
        const tMadre = extraerPiezaMadre(elem.nombreNodo || "").toLowerCase().trim();
        const tFamilia = extraerFamiliaPieza(elem.nombreNodo || "").toLowerCase().trim();

        // 🎯 Encontrar TODAS las mallas que coincidan (incluyendo instancias hermanas y submallas núcleo/balance)
        const targetMeshes = sceneMeshes.filter((m) => {
          const u = m.userData || {};
          const cn = ((u.cleanName || m.name || "") as string).toLowerCase().trim();
          const pm = ((u.piezaMadre || extraerPiezaMadre(cn)) as string).toLowerCase().trim();
          const ik = ((u.instanciaKey || "") as string).toLowerCase().trim();
          const raw = (m.name || "").replace(/^RH_OUT:/i, "").trim().toLowerCase();

          return (
            cn === tKey ||
            ik === tKey ||
            raw === tKey ||
            pm === tKey ||
            (Boolean(tFamilia) && (
              perteneceAMismaFamiliaPieza(cn, tFamilia) ||
              perteneceAMismaFamiliaPieza(pm, tFamilia) ||
              perteneceAMismaFamiliaPieza(ik, tFamilia) ||
              perteneceAMismaFamiliaPieza(raw, tFamilia)
            )) ||
            (Boolean(tMadre) && (pm === tMadre || extraerPiezaMadre(cn) === tMadre || extraerPiezaMadre(raw) === tMadre))
          );
        });

        if (targetMeshes.length === 0) {
          const fallbackObj = sceneObjects.get(elem.nombreNodo) || sceneObjects.get(normalizarNombreNodo(elem.nombreNodo));
          if (fallbackObj && (fallbackObj as THREE.Mesh).isMesh) {
            targetMeshes.push(fallbackObj as THREE.Mesh);
          }
        }

        if (targetMeshes.length === 0) return;

        targetMeshes.forEach((targetObj) => {
          const pRest = getSafeRestPosition(targetObj);
          const qRest = getSafeRestQuaternion(targetObj);
          const sRest = new THREE.Vector3(1, 1, 1);

          // 🎯 Posición de reposo final exacta de diseño ensamblado (Modelo Armado CAD original de Grasshopper)
          const pRestFinal = pRest.clone();

          const tStart = Math.max(0, elem.tiempoInicio);
          const durInsertCalculada = durInsert || elem.duracionInsercionHerrajes || 0;
          let tDurTraslado = Math.max(0.5, elem.duracionMovimiento);

          // Dirección y posición de espera en piso:
          let vOffset = new THREE.Vector3(0, elem.distanciaAproximacion || 0.15, 0);
          const confPieza = paso.configuracionCinematica?.piezasEspera?.find(
            (p) => {
              if (p.nombrePieza === elem.nombreNodo || p.nombrePieza === targetObj.name || p.nombrePieza === targetObj.userData?.cleanName) return true;
              const madreP = extraerPiezaMadre(p.nombrePieza).toLowerCase().trim();
              const madreElem = extraerPiezaMadre(elem.nombreNodo || "").toLowerCase().trim();
              const madreTarget = extraerPiezaMadre(targetObj.userData?.cleanName || targetObj.name || "").toLowerCase().trim();
              const madreUserData = ((targetObj.userData?.piezaMadre || "") as string).toLowerCase().trim();
              return Boolean(madreP && (madreP === madreElem || madreP === madreTarget || madreP === madreUserData)) ||
                     perteneceAMismaFamiliaPieza(p.nombrePieza, elem.nombreNodo) ||
                     perteneceAMismaFamiliaPieza(p.nombrePieza, targetObj.name) ||
                     perteneceAMismaFamiliaPieza(p.nombrePieza, targetObj.userData?.cleanName);
            }
          );

          // ⏱️ Segundo exacto en que la pieza/capa aparece a escala real en la escena (por defecto 0s)
          const tAparicionPieza = Math.max(0, confPieza?.tiempoAparicionPieza ?? elem.tiempoAparicionPieza ?? 0);
          const tFinHerrajes = Math.max(0, confPieza?.tiempoFinHerrajes ?? elem.tiempoFinHerrajes ?? 0);

          // 🚀 Si hay configuración cinemática con velocidad o tiempo por capa, asegurar la duración física exacta:
          if (confPieza) {
            if (paso.configuracionCinematica?.modoTiempo === "por_capa" && confPieza.tiempoAnimacionSegundos) {
              tDurTraslado = Math.max(0.5, confPieza.tiempoAnimacionSegundos);
            } else if (paso.configuracionCinematica?.velocidadPiezasCmS) {
              const offY = confPieza.offsetYCm ?? confPieza.offsetZCm ?? 0;
              const distEspera = Math.sqrt(((confPieza.offsetXCm || 0) / 100) ** 2 + (offY / 100) ** 2);
              if (distEspera > 0.001) {
                const vPiezaM_s = Math.max(0.02, paso.configuracionCinematica.velocidadPiezasCmS / 100);
                tDurTraslado = Math.max(0.5, Math.round((distEspera / vPiezaM_s) * 100) / 100);
              }
            }
          }

          const tStartBase = Math.max(tStart, tAparicionPieza);
          // 🚀 Si se definió tiempoFinHerrajes (> 0), la pieza permanece inmóvil y a partir de ese segundo inicia su desplazamiento
          // Asegurando siempre que los herrajes hayan culminado su inserción física previa
          const tFinInsercionMinima = durInsertCalculada > 0 ? tStartBase + durInsertCalculada : tStartBase;
          const tStartTraslado = tFinHerrajes > 0
            ? Math.max(tAparicionPieza, tFinHerrajes, tFinInsercionMinima)
            : (durInsertCalculada > 0 ? tStartBase + durInsertCalculada + 0.2 : tStartBase);
          const tEndAction = trasladaMadera ? tStartTraslado + tDurTraslado : tStartBase + durInsertCalculada;

          if (confPieza) {
            const offY = confPieza.offsetYCm ?? confPieza.offsetZCm ?? 0;
            const tieneDesplazamientoPiso = Math.abs(confPieza.offsetXCm || 0) > 0.01 || Math.abs(offY) > 0.01;

            if (!tieneDesplazamientoPiso) {
              // 🛡️ Si la pieza no tiene desplazamiento en el piso (ej. Peça 7 / base firme), su posición es estrictamente el reposo CAD
              vOffset.set(0, 0, 0);
            } else {
              const vWorld = new THREE.Vector3((confPieza.offsetXCm || 0) / 100, 0, offY / 100);

              if (targetObj.parent) {
                targetObj.parent.updateWorldMatrix(true, false);
                const targetObjRestWorld = targetObj.parent.localToWorld(pRest.clone());

                // 🎯 Si la pieza está en espera y debe reposar en piso (apoyadaEnPiso !== false):
                let floorDropY = 0;
                if (confPieza.apoyadaEnPiso !== false) {
                  const curPos = targetObj.position.clone();
                  targetObj.position.copy(pRest);
                  targetObj.updateWorldMatrix(true, true);
                  const objBox = new THREE.Box3().setFromObject(targetObj);
                  targetObj.position.copy(curPos);
                  targetObj.updateWorldMatrix(true, true);

                  if (!objBox.isEmpty()) {
                    floorDropY = -objBox.min.y;
                  }
                }

                const targetObjPopWorld = new THREE.Vector3(
                  targetObjRestWorld.x + vWorld.x,
                  targetObjRestWorld.y + floorDropY,
                  targetObjRestWorld.z + vWorld.z
                );
                const targetObjPopLocal = targetObj.parent.worldToLocal(targetObjPopWorld);
                vOffset = targetObjPopLocal.clone().sub(pRest);
              } else {
                vOffset = vWorld;
              }
            }
          } else if (elem.tipo === "herraje") {
            vOffset.set(0, elem.distanciaAproximacion || 0.15, 0.05);
          }
          const pPop = pRest.clone().add(vOffset);

          // ── PISTA DE ESCALA (Aparición en segundo exacto o Pop-In 200% -> 100%) ──────────────────────────────
          if (tAparicionPieza >= duracionPaso) {
            // 🚫 La pieza NO debe aparecer en este paso (ej. configurada en 100s para que permanezca ausente)
            const scaleTimes = [0, duracionPaso];
            const scaleValues = [
              0, 0, 0,
              0, 0, 0,
            ];
            tracks.push(new THREE.VectorKeyframeTrack(`${targetObj.uuid}.scale`, scaleTimes, scaleValues));
          } else if (tAparicionPieza > 0) {
            // 👁️ La pieza aparece en el segundo exacto configurado (antes de ese segundo es estrictamente invisible)
            const tPre = Math.max(0, tAparicionPieza - 0.02);
            const scaleTimes = tPre > 0 ? [0, tPre, tAparicionPieza, duracionPaso] : [0, tAparicionPieza, duracionPaso];
            const scaleValues = tPre > 0
              ? [
                  0, 0, 0,
                  0, 0, 0,
                  sRest.x, sRest.y, sRest.z,
                  sRest.x, sRest.y, sRest.z,
                ]
              : [
                  0, 0, 0,
                  sRest.x, sRest.y, sRest.z,
                  sRest.x, sRest.y, sRest.z,
                ];
            tracks.push(new THREE.VectorKeyframeTrack(`${targetObj.uuid}.scale`, scaleTimes, scaleValues));
          } else if (elem.popIn && trasladaMadera) {
            const scaleTimes = [0, Math.max(0, tStartTraslado - 0.05), tStartTraslado, tStartTraslado + 0.35, tEndAction, duracionPaso];
            const scaleValues = [
              0, 0, 0,                        // Oculto antes de entrar
              0, 0, 0,                        // Oculto hasta instante exacto
              2.0, 2.0, 2.0,                  // Pop-In 200% de alto impacto
              sRest.x, sRest.y, sRest.z,      // Escala 100% normal
              sRest.x, sRest.y, sRest.z,      // Permanece a 100%
              sRest.x, sRest.y, sRest.z,      // Permanece a 100%
            ];
            tracks.push(new THREE.VectorKeyframeTrack(`${targetObj.uuid}.scale`, scaleTimes, scaleValues));
          }

          // ── PISTA DE POSICIÓN DE LA MADERA ──────────────────────────────────
          if (tAparicionPieza >= duracionPaso) {
            // Pieza oculta durante todo el paso: fija e invisible en espera
            const pPosFija = pPop;
            const posTimes = [0, duracionPaso];
            const posValues = [
              pPosFija.x, pPosFija.y, pPosFija.z,
              pPosFija.x, pPosFija.y, pPosFija.z,
            ];
            tracks.push(new THREE.VectorKeyframeTrack(`${targetObj.uuid}.position`, posTimes, posValues));
          } else if (trasladaMadera) {
            const posTimes: number[] = [];
            const posValues: number[] = [];

            if (tStartTraslado > 0) {
              posTimes.push(0, tStartTraslado, tEndAction, duracionPaso);
              posValues.push(
                pPop.x, pPop.y, pPop.z,
                pPop.x, pPop.y, pPop.z,
                pRestFinal.x, pRestFinal.y, pRestFinal.z,
                pRestFinal.x, pRestFinal.y, pRestFinal.z
              );
            } else {
              posTimes.push(0, tEndAction, duracionPaso);
              posValues.push(
                pPop.x, pPop.y, pPop.z,
                pRestFinal.x, pRestFinal.y, pRestFinal.z,
                pRestFinal.x, pRestFinal.y, pRestFinal.z
              );
            }
            tracks.push(new THREE.VectorKeyframeTrack(`${targetObj.uuid}.position`, posTimes, posValues));
          } else {
            // PIEZA MASTER O PIEZA FIJA EN PISO
            const pPosFija = pPop;
            const posTimes = [0, duracionPaso];
            const posValues = [
              pPosFija.x, pPosFija.y, pPosFija.z,
              pPosFija.x, pPosFija.y, pPosFija.z,
            ];
            tracks.push(new THREE.VectorKeyframeTrack(`${targetObj.uuid}.position`, posTimes, posValues));
          }

          // ── PISTA DE ROTACIÓN (Atornillado 720° / Minifix 180°) ──────────────────
          if (elem.rotacionGrados && elem.rotacionGrados > 0 && trasladaMadera) {
            const totalAngleRad = THREE.MathUtils.degToRad(elem.rotacionGrados);
            const rotAxis = new THREE.Vector3(0, 1, 0);
            
            const tRotStart = tStartTraslado + 0.35;
            const tRotMid1 = tRotStart + (tEndAction - tRotStart) * 0.33;
            const tRotMid2 = tRotStart + (tEndAction - tRotStart) * 0.66;
            const tRotEnd = tEndAction;

            const qStart = qRest.clone();
            const qMid1 = qRest.clone().multiply(new THREE.Quaternion().setFromAxisAngle(rotAxis, totalAngleRad * 0.33));
            const qMid2 = qRest.clone().multiply(new THREE.Quaternion().setFromAxisAngle(rotAxis, totalAngleRad * 0.66));
            const qFinal = qRest.clone().multiply(new THREE.Quaternion().setFromAxisAngle(rotAxis, totalAngleRad));

            const rotTimes = [0, tRotStart, tRotMid1, tRotMid2, tRotEnd, duracionPaso];
            const rotValues = [
              qStart.x, qStart.y, qStart.z, qStart.w,
              qStart.x, qStart.y, qStart.z, qStart.w,
              qMid1.x, qMid1.y, qMid1.z, qMid1.w,
              qMid2.x, qMid2.y, qMid2.z, qMid2.w,
              qFinal.x, qFinal.y, qFinal.z, qFinal.w,
            ];
            tracks.push(new THREE.QuaternionKeyframeTrack(`${targetObj.uuid}.quaternion`, rotTimes, rotValues));
          }

          // ── HERRAJES COHESIONADOS (Inserción concéntrica en barrenos y traslado solidario) ──
          compilarCoreografiaHerrajesCohesionados(
            elem,
            confPieza,
            sceneMeshes,
            stepFloorDropY,
            vOffset,
            tStart,
            durInsertCalculada,
            duracionPaso,
            tAparicionPieza,
            tStartTraslado,
            tEndAction,
            trasladaMadera,
            paso,
            tracks
          );

          // ── HERRAMIENTAS ACOPLADAS AL ELEMENTO (Martillo, Llave Allen) ─────
          compilarCoreografiaHerramientas(
            elem,
            toolMeshes,
            pRest,
            qRest,
            tStart,
            tEndAction,
            duracionPaso,
            tracks
          );
        });
      });
    }
  }
}
