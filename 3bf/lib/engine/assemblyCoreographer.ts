import * as THREE from "three";
import { PasoManualStudio, SubBloqueArmado, ElementoSecuenciaCinematica } from "../store";
import { AnimationEngineToolMeshes } from "./types";
import {
  obtenerMallasDeSubbloque,
  extraerPiezaMadre,
  getSafeRestPosition,
  getSafeRestQuaternion,
  normalizarNombreNodo
} from "./cadStateUtils";

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
    // 🧩 2.1 MODO MULTI-SUBBLOQUE (P02A, P02B, P02C... con Coreografía 1 o 2)
    if (paso.subbloques && paso.subbloques.length > 0) {
      const coreoPaso = paso.coreografiaSubbloques || 1;
      const numSubs = paso.subbloques.length;
      // 1. Detección previa de subbloque con doble cara (P02B) para orquestar la coreografía de 4 actos
      const idxDobleCara = paso.subbloques.findIndex((sub: SubBloqueArmado) => {
        const mallas = obtenerMallasDeSubbloque(sceneMeshes, sub);
        let master = null;
        if (sub.piezaMaster) {
          const pTarget = sub.piezaMaster.toLowerCase().trim();
          master = mallas.find((m) => {
            const cn = ((m.userData?.cleanName || m.name || "") as string).toLowerCase().trim();
            const pm = ((m.userData?.piezaMadre || extraerPiezaMadre(cn)) as string).toLowerCase().trim();
            return cn === pTarget || pm === pTarget;
          }) || null;
        }
        if (!master) master = mallas.find((m) => m.userData?.isWoodBoard) || mallas[0];
        if (!master) return false;
        master.updateWorldMatrix(true, false);
        const bMaster = new THREE.Box3().setFromObject(master);
        const yMed = (bMaster.min.y + bMaster.max.y) / 2;

        const corr = mallas.filter((m) => {
          if (m === master) return false;
          const n = (m.name || m.userData?.cleanName || "").toLowerCase();
          return n.includes("corredi") || n.includes("trilho");
        });

        let cA = 0, cB = 0;
        corr.forEach((c) => {
          const p = getSafeRestPosition(c);
          if (p.y >= yMed - 0.002) cA++;
          else cB++;
        });
        return cA > 0 && cB > 0;
      });

      const hayDobleCara = idxDobleCara >= 0;

      // ⏱️ Definición Canónica de Tiempos para Coreografía de 3 Láminas (P02A -> P02B Cara A -> P02C -> P02B Giro y Cara B)
      // Solicitud canónica del usuario:
      // En t = 7.30s termina P02C (concluye el último tornillo).
      // Exactamente en t = 7.30s arranca el giro de P02B: se levanta +30 cm, gira 180° en el aire, baja al piso,
      // y en ese momento aparecen las 2 correderas de Cara B, descienden y se insertan sus 2 tornillos por corredera.
      const T_ACTO1_INI = 0.0;
      const T_ACTO1_FIN = 2.40;  // P02A: 0.0s -> 2.4s
      const T_ACTO2_INI = 2.40;
      const T_ACTO2_FIN = 4.80;  // P02B Cara A: 2.4s -> 4.8s (se aseguran tornillos)
      const T_ACTO3_INI = 4.80;
      const T_ACTO3_FIN = 7.30;  // P02C: 4.8s -> 7.30s (último tornillo asegurado exactamente en 7.3s)
      const T_GIRO_INI = 7.30;   // Arranca giro de P02B en 7.30s
      const T_GIRO_SUBIDA = 7.80; // Sube +30 cm verticalmente (0.5s)
      const T_GIRO_ROTMID = 8.15; // Rota 90° en el aire (0.35s)
      const T_GIRO_ROTFIN = 8.50; // Rota 180° en el aire (0.35s)
      const T_GIRO_PISO = 9.00;   // Desciende de nuevo al piso volteada (0.5s)
      const T_CORRB_INI = 9.00;   // Aparecen las 2 correderas de Cara B
      const T_CORRB_FIN = 9.70;   // Descienden a la madera volteada
      const T_TORNB_INI = 9.78;   // Aparecen los 4 tornillos de Cara B
      const T_TORNB_POP = 10.05;  // Pop-In 200% -> 100%
      const T_TORNB_FIN = 11.10;  // Bajan y se atornillan 720° colinealmente
      const T_PASO_TOTAL = Math.max(duracionPaso, 11.40);

      paso.subbloques.forEach((sub: SubBloqueArmado, sIdx: number) => {
        const mallasSub = obtenerMallasDeSubbloque(sceneMeshes, sub);
        if (mallasSub.length === 0) return;

        // 1. Identificar Pieza Máster
        let masterMesh: THREE.Mesh | null = null;
        if (sub.piezaMaster) {
          const pTarget = sub.piezaMaster.toLowerCase().trim();
          masterMesh = mallasSub.find((m) => {
            const cn = ((m.userData?.cleanName || m.name || "") as string).toLowerCase().trim();
            const pm = ((m.userData?.piezaMadre || extraerPiezaMadre(cn)) as string).toLowerCase().trim();
            return cn === pTarget || pm === pTarget;
          }) || null;
        }
        if (!masterMesh) {
          masterMesh = mallasSub.find((m) => m.userData?.isWoodBoard) || mallasSub[0];
        }

        // 2. Ventana temporal asignada a este subbloque
        let tSubIni: number;
        let tSubDur: number;
        let tSubFin: number;

        if (hayDobleCara && numSubs === 3) {
          if (sIdx === 0) {
            // P02A (Acto 1)
            tSubIni = T_ACTO1_INI;
            tSubFin = T_ACTO1_FIN;
            tSubDur = tSubFin - tSubIni;
          } else if (sIdx === 1) {
            // P02B (Abarca Cara A en Acto 2, y Giro + Cara B en Acto 4)
            tSubIni = T_ACTO2_INI;
            tSubFin = T_PASO_TOTAL;
            tSubDur = tSubFin - tSubIni;
          } else {
            // P02C (Acto 3: 4.8s -> 7.30s)
            tSubIni = T_ACTO3_INI;
            tSubFin = T_ACTO3_FIN;
            tSubDur = tSubFin - tSubIni;
          }
        } else {
          tSubIni = sub.trackAnimacion?.tiempoInicio ?? Number(((sIdx * duracionPaso) / numSubs).toFixed(1));
          tSubDur = Math.max(1, sub.trackAnimacion?.duracion ?? Number((duracionPaso / numSubs).toFixed(1)));
          tSubFin = Math.min(duracionPaso, tSubIni + tSubDur);
        }

        // 3. Separar mallas: Correderas, Tornillos y Madera Completa (todas las mallas de tablero)
        const correderas: THREE.Mesh[] = [];
        const tornillos: THREE.Mesh[] = [];
        const mallasMadera: THREE.Mesh[] = [];

        mallasSub.forEach((m) => {
          const nLow = (m.name || m.userData?.cleanName || "").toLowerCase();
          if (nLow.includes("corredi") || nLow.includes("trilho")) {
            correderas.push(m);
          } else if (nLow.includes("parafuso") || nLow.includes("tornillo") || nLow.includes("perno")) {
            tornillos.push(m);
          } else {
            mallasMadera.push(m);
          }
        });

        if (mallasMadera.length === 0 && masterMesh) {
          mallasMadera.push(masterMesh);
        }

        // 4. Envolvente geométrica y centro baricéntrico EXACTO (Línea Verde Central)
        // Si masterMesh existe, su centro es la referencia canónica de simetría de la tabla
        const boxMaderaCompleta = new THREE.Box3();
        if (masterMesh) {
          masterMesh.updateWorldMatrix(true, false);
          boxMaderaCompleta.setFromObject(masterMesh);
        }
        mallasMadera.forEach((m) => {
          m.updateWorldMatrix(true, false);
          boxMaderaCompleta.expandByObject(m);
        });
        const centroMadera = new THREE.Vector3();
        boxMaderaCompleta.getCenter(centroMadera);
        if (masterMesh) {
          const boxMaster = new THREE.Box3().setFromObject(masterMesh);
          const cMaster = new THREE.Vector3();
          boxMaster.getCenter(cMaster);
          centroMadera.x = cMaster.x;
        }
        // 🎯 Ajuste explícito de cota de eje X solicitado por el usuario (750 mm = 0.750 m)
        centroMadera.x = 0.730;
        const yCentroMadera = centroMadera.y;
        const ALTURA_APROX = 0.30; // 📏 30 cm para elevación de pop y descenso de herrajes
        const ALTURA_GIRO = 0.45;  // 📏 45 cm (+15 cm) para evitar colisión con el piso durante el giro 180°

        const correderasCaraA: THREE.Mesh[] = [];
        const correderasCaraB: THREE.Mesh[] = [];

        correderas.forEach((c) => {
          const p = getSafeRestPosition(c);
          if (p.y >= yCentroMadera - 0.002) {
            correderasCaraA.push(c);
          } else {
            correderasCaraB.push(c);
          }
        });

        const tieneDosCaras = correderasCaraA.length > 0 && correderasCaraB.length > 0;

        if (tieneDosCaras) {
          // =========================================================================
          // 🔄 SUBBLOQUE DE DOBLE CARA (P02B): CARA A -> P02C -> GIRO 180° -> CARA B
          // =========================================================================
          const tornillosCaraA: THREE.Mesh[] = [];
          const tornillosCaraB: THREE.Mesh[] = [];

          tornillos.forEach((t) => {
            const pT = getSafeRestPosition(t);
            if (pT.y >= yCentroMadera) {
              tornillosCaraA.push(t);
            } else {
              tornillosCaraB.push(t);
            }
          });

          // Tiempos exactos
          const tCaraAIni = T_ACTO2_INI;
          const tCaraAFin = T_ACTO2_FIN;

          // 📏 Parámetros de Giro 180° Longitudinal sobre Eje Z (0, 0, 1) concéntrico en centroMadera
          const ejeVolteo = new THREE.Vector3(0, 0, 1);
          const qRot90 = new THREE.Quaternion().setFromAxisAngle(ejeVolteo, Math.PI * 0.5);
          const qRot180 = new THREE.Quaternion().setFromAxisAngle(ejeVolteo, Math.PI);

          const rotarPunto = (p: THREE.Vector3, q: THREE.Quaternion): THREE.Vector3 => {
            const v = p.clone().sub(centroMadera);
            v.applyQuaternion(q);
            return centroMadera.clone().add(v);
          };

          // ── 1. MADERA COMPLETA (Todas las mallas del tablero: Cantos MDP + Cara A + Cara B) ──
          // Permanece quieta en el piso hasta 7.30s. En 7.30s sube 45 cm (+15 cm), gira 180° en el aire sobre su eje central y baja al piso en 9.0s.
          mallasMadera.forEach((maderaObj) => {
            const p0 = getSafeRestPosition(maderaObj);
            const q0 = getSafeRestQuaternion(maderaObj);

            const pSubida = p0.clone().add(new THREE.Vector3(0, ALTURA_GIRO, 0));
            const pMidRot = rotarPunto(p0, qRot90).add(new THREE.Vector3(0, ALTURA_GIRO, 0));
            const pFinRot = rotarPunto(p0, qRot180).add(new THREE.Vector3(0, ALTURA_GIRO, 0));
            const pPisoVolteada = rotarPunto(p0, qRot180);

            const qMidRot = qRot90.clone().multiply(q0);
            const qFinRot = qRot180.clone().multiply(q0);

            const posTimes = [0, T_GIRO_INI, T_GIRO_SUBIDA, T_GIRO_ROTMID, T_GIRO_ROTFIN, T_GIRO_PISO, T_PASO_TOTAL];
            const posValues = [
              p0.x, p0.y, p0.z,
              p0.x, p0.y, p0.z,
              pSubida.x, pSubida.y, pSubida.z,
              pMidRot.x, pMidRot.y, pMidRot.z,
              pFinRot.x, pFinRot.y, pFinRot.z,
              pPisoVolteada.x, pPisoVolteada.y, pPisoVolteada.z,
              pPisoVolteada.x, pPisoVolteada.y, pPisoVolteada.z,
            ];
            tracks.push(new THREE.VectorKeyframeTrack(`${maderaObj.uuid}.position`, posTimes, posValues, THREE.InterpolateLinear));

            const rotTimes = [0, T_GIRO_INI, T_GIRO_SUBIDA, T_GIRO_ROTMID, T_GIRO_ROTFIN, T_GIRO_PISO, T_PASO_TOTAL];
            const rotValues = [
              q0.x, q0.y, q0.z, q0.w,
              q0.x, q0.y, q0.z, q0.w,
              q0.x, q0.y, q0.z, q0.w,
              qMidRot.x, qMidRot.y, qMidRot.z, qMidRot.w,
              qFinRot.x, qFinRot.y, qFinRot.z, qFinRot.w,
              qFinRot.x, qFinRot.y, qFinRot.z, qFinRot.w,
              qFinRot.x, qFinRot.y, qFinRot.z, qFinRot.w,
            ];
            tracks.push(new THREE.QuaternionKeyframeTrack(`${maderaObj.uuid}.quaternion`, rotTimes, rotValues, THREE.InterpolateLinear));
          });

          // ── AGRUPACIÓN POR NIVELES PARA CARA A Y CARA B (SOPORTE COREOGRAFÍAS 1 Y 2) ──
          correderasCaraA.sort((a, b) => {
            const pA = getSafeRestPosition(a);
            const pB = getSafeRestPosition(b);
            return (pA.z - pB.z) || (pA.x - pB.x);
          });

          const gruposCaraA: Array<{ correderas: THREE.Mesh[]; tornillos: THREE.Mesh[] }> = [];
          correderasCaraA.forEach((c) => {
            const pC = getSafeRestPosition(c);
            let g = gruposCaraA.find((grp) => {
              const ref = getSafeRestPosition(grp.correderas[0]);
              return Math.abs(ref.z - pC.z) < 0.04 && Math.abs(ref.x - pC.x) < 0.04;
            });
            if (!g) {
              g = { correderas: [], tornillos: [] };
              gruposCaraA.push(g);
            }
            g.correderas.push(c);
          });

          if (gruposCaraA.length === 0 && tornillosCaraA.length > 0) {
            gruposCaraA.push({ correderas: [], tornillos: tornillosCaraA });
          } else {
            tornillosCaraA.forEach((t) => {
              const pT = getSafeRestPosition(t);
              let mejorGrupo = gruposCaraA[0];
              let mejorDist = Infinity;
              gruposCaraA.forEach((grp) => {
                grp.correderas.forEach((c) => {
                  const dist = pT.distanceTo(getSafeRestPosition(c));
                  if (dist < mejorDist) {
                    mejorDist = dist;
                    mejorGrupo = grp;
                  }
                });
              });
              if (mejorGrupo) {
                mejorGrupo.tornillos.push(t);
              }
            });
          }

          correderasCaraB.sort((a, b) => {
            const pA = getSafeRestPosition(a);
            const pB = getSafeRestPosition(b);
            return (pA.z - pB.z) || (pA.x - pB.x);
          });

          const gruposCaraB: Array<{ correderas: THREE.Mesh[]; tornillos: THREE.Mesh[] }> = [];
          correderasCaraB.forEach((c) => {
            const pC = getSafeRestPosition(c);
            let g = gruposCaraB.find((grp) => {
              const ref = getSafeRestPosition(grp.correderas[0]);
              return Math.abs(ref.z - pC.z) < 0.04 && Math.abs(ref.x - pC.x) < 0.04;
            });
            if (!g) {
              g = { correderas: [], tornillos: [] };
              gruposCaraB.push(g);
            }
            g.correderas.push(c);
          });

          if (gruposCaraB.length === 0 && tornillosCaraB.length > 0) {
            gruposCaraB.push({ correderas: [], tornillos: tornillosCaraB });
          } else {
            tornillosCaraB.forEach((t) => {
              const pT = getSafeRestPosition(t);
              let mejorGrupo = gruposCaraB[0];
              let mejorDist = Infinity;
              gruposCaraB.forEach((grp) => {
                grp.correderas.forEach((c) => {
                  const dist = pT.distanceTo(getSafeRestPosition(c));
                  if (dist < mejorDist) {
                    mejorDist = dist;
                    mejorGrupo = grp;
                  }
                });
              });
              if (mejorGrupo) {
                mejorGrupo.tornillos.push(t);
              }
            });
          }

          // ── 2 y 3. CARA A: CORREDERAS Y TORNILLOS (Coreografía 1 Secuencial vs Coreografía 2 Simultánea) ──
          const KA = Math.max(1, gruposCaraA.length);
          const dtCaraA = (tCaraAFin - tCaraAIni) / (coreoPaso === 1 ? KA : 1);

          gruposCaraA.forEach((grp, k) => {
            const tNivelIni = coreoPaso === 1 ? tCaraAIni + k * dtCaraA : tCaraAIni;
            const tNivelFin = coreoPaso === 1 ? tNivelIni + dtCaraA : tCaraAFin;
            const tCorrIni = tNivelIni;
            const tCorrFin = tNivelIni + (tNivelFin - tNivelIni) * 0.42;
            const tTornIni = tCorrFin + 0.08;
            const tTornPop = Math.min(tTornIni + 0.22, tNivelFin - 0.22);
            const tTornFin = tNivelFin - 0.03;

            grp.correderas.forEach((obj) => {
              const pRestA = getSafeRestPosition(obj);
              const qRestA = getSafeRestQuaternion(obj);
              const pPopA = pRestA.clone().add(new THREE.Vector3(0, ALTURA_APROX, 0));

              const pSubidaA = pRestA.clone().add(new THREE.Vector3(0, ALTURA_GIRO, 0));
              const pMidRotA = rotarPunto(pRestA, qRot90).add(new THREE.Vector3(0, ALTURA_GIRO, 0));
              const pFinRotA = rotarPunto(pRestA, qRot180).add(new THREE.Vector3(0, ALTURA_GIRO, 0));
              const pPisoVolteadaA = rotarPunto(pRestA, qRot180);

              const qMidRotA = qRot90.clone().multiply(qRestA);
              const qFinRotA = qRot180.clone().multiply(qRestA);

              // Escala: oculta antes de su tCorrIni
              const scaleTimes = tCorrIni > 0.04
                ? [0, tCorrIni - 0.01, tCorrIni, T_PASO_TOTAL]
                : [0, T_PASO_TOTAL];
              const scaleValues = tCorrIni > 0.04
                ? [0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1]
                : [1, 1, 1, 1, 1, 1];
              tracks.push(new THREE.VectorKeyframeTrack(`${obj.uuid}.scale`, scaleTimes, scaleValues, THREE.InterpolateLinear));

              // Posición: desciende en su turno, reposa en la madera, y en 7.3s gira con la madera
              const posTimes = [
                0, tCorrIni, tCorrFin,
                T_GIRO_INI, T_GIRO_SUBIDA, T_GIRO_ROTMID, T_GIRO_ROTFIN, T_GIRO_PISO, T_PASO_TOTAL
              ];
              const posValues = [
                pPopA.x, pPopA.y, pPopA.z,
                pPopA.x, pPopA.y, pPopA.z,
                pRestA.x, pRestA.y, pRestA.z,
                pRestA.x, pRestA.y, pRestA.z,
                pSubidaA.x, pSubidaA.y, pSubidaA.z,
                pMidRotA.x, pMidRotA.y, pMidRotA.z,
                pFinRotA.x, pFinRotA.y, pFinRotA.z,
                pPisoVolteadaA.x, pPisoVolteadaA.y, pPisoVolteadaA.z,
                pPisoVolteadaA.x, pPisoVolteadaA.y, pPisoVolteadaA.z,
              ];
              tracks.push(new THREE.VectorKeyframeTrack(`${obj.uuid}.position`, posTimes, posValues, THREE.InterpolateLinear));

              // Rotación: en reposo hasta giro 7.3s
              const rotTimes = [
                0, tCaraAFin, T_GIRO_INI, T_GIRO_SUBIDA, T_GIRO_ROTMID, T_GIRO_ROTFIN, T_GIRO_PISO, T_PASO_TOTAL
              ];
              const rotValues = [
                qRestA.x, qRestA.y, qRestA.z, qRestA.w,
                qRestA.x, qRestA.y, qRestA.z, qRestA.w,
                qRestA.x, qRestA.y, qRestA.z, qRestA.w,
                qRestA.x, qRestA.y, qRestA.z, qRestA.w,
                qMidRotA.x, qMidRotA.y, qMidRotA.z, qMidRotA.w,
                qFinRotA.x, qFinRotA.y, qFinRotA.z, qFinRotA.w,
                qFinRotA.x, qFinRotA.y, qFinRotA.z, qFinRotA.w,
                qFinRotA.x, qFinRotA.y, qFinRotA.z, qFinRotA.w,
              ];
              tracks.push(new THREE.QuaternionKeyframeTrack(`${obj.uuid}.quaternion`, rotTimes, rotValues, THREE.InterpolateLinear));
            });

            grp.tornillos.forEach((tObj) => {
              const pRestT = getSafeRestPosition(tObj);
              const qRestT = getSafeRestQuaternion(tObj);
              const pPopT = pRestT.clone().add(new THREE.Vector3(0, ALTURA_APROX, 0));

              // Rotación de atornillado axial
              const rotAxis = new THREE.Vector3(0, 1, 0);
              const totalAngle = Math.PI * 4;
              const qAtornilladoA = qRestT.clone().multiply(new THREE.Quaternion().setFromAxisAngle(rotAxis, totalAngle));

              const pSubidaT = pRestT.clone().add(new THREE.Vector3(0, ALTURA_GIRO, 0));
              const pMidRotT = rotarPunto(pRestT, qRot90).add(new THREE.Vector3(0, ALTURA_GIRO, 0));
              const pFinRotT = rotarPunto(pRestT, qRot180).add(new THREE.Vector3(0, ALTURA_GIRO, 0));
              const pPisoVolteadaT = rotarPunto(pRestT, qRot180);

              const qMidRotT = qRot90.clone().multiply(qAtornilladoA);
              const qFinRotT = qRot180.clone().multiply(qAtornilladoA);

              // Escala: oculta antes de su tTornIni, Pop-In 200% -> 100%
              const scaleTimes = [0, Math.max(0, tTornIni - 0.01), tTornIni, tTornPop, T_PASO_TOTAL];
              const scaleValues = [
                0, 0, 0,
                0, 0, 0,
                2.0, 2.0, 2.0,
                1.0, 1.0, 1.0,
                1.0, 1.0, 1.0,
              ];
              tracks.push(new THREE.VectorKeyframeTrack(`${tObj.uuid}.scale`, scaleTimes, scaleValues, THREE.InterpolateLinear));

              // Posición: baja y se asegura en su nivel, luego reposa y en 7.3s gira
              const posTimes = [
                0, tTornIni, tTornPop, tTornFin,
                T_GIRO_INI, T_GIRO_SUBIDA, T_GIRO_ROTMID, T_GIRO_ROTFIN, T_GIRO_PISO, T_PASO_TOTAL
              ];
              const posValues = [
                pPopT.x, pPopT.y, pPopT.z,
                pPopT.x, pPopT.y, pPopT.z,
                pPopT.x, pPopT.y, pPopT.z,
                pRestT.x, pRestT.y, pRestT.z,
                pRestT.x, pRestT.y, pRestT.z,
                pSubidaT.x, pSubidaT.y, pSubidaT.z,
                pMidRotT.x, pMidRotT.y, pMidRotT.z,
                pFinRotT.x, pFinRotT.y, pFinRotT.z,
                pPisoVolteadaT.x, pPisoVolteadaT.y, pPisoVolteadaT.z,
                pPisoVolteadaT.x, pPisoVolteadaT.y, pPisoVolteadaT.z,
              ];
              tracks.push(new THREE.VectorKeyframeTrack(`${tObj.uuid}.position`, posTimes, posValues, THREE.InterpolateLinear));

              // Rotación: atornillado axial 720° en su ventana, luego reposo y giro a 7.3s
              const rotTimes = [
                0, tTornPop, tTornFin,
                T_GIRO_INI, T_GIRO_SUBIDA, T_GIRO_ROTMID, T_GIRO_ROTFIN, T_GIRO_PISO, T_PASO_TOTAL
              ];
              const rotValues = [
                qRestT.x, qRestT.y, qRestT.z, qRestT.w,
                qRestT.x, qRestT.y, qRestT.z, qRestT.w,
                qAtornilladoA.x, qAtornilladoA.y, qAtornilladoA.z, qAtornilladoA.w,
                qAtornilladoA.x, qAtornilladoA.y, qAtornilladoA.z, qAtornilladoA.w,
                qAtornilladoA.x, qAtornilladoA.y, qAtornilladoA.z, qAtornilladoA.w,
                qMidRotT.x, qMidRotT.y, qMidRotT.z, qMidRotT.w,
                qFinRotT.x, qFinRotT.y, qFinRotT.z, qFinRotT.w,
                qFinRotT.x, qFinRotT.y, qFinRotT.z, qFinRotT.w,
                qFinRotT.x, qFinRotT.y, qFinRotT.z, qFinRotT.w,
              ];
              tracks.push(new THREE.QuaternionKeyframeTrack(`${tObj.uuid}.quaternion`, rotTimes, rotValues, THREE.InterpolateLinear));
            });
          });

          // ── 4 y 5. CARA B: CORREDERAS Y TORNILLOS (Coreografía 1 Secuencial vs Coreografía 2 Simultánea) ──
          const KB = Math.max(1, gruposCaraB.length);
          const tDurTotalB = T_PASO_TOTAL - T_CORRB_INI;
          const dtCaraB = tDurTotalB / (coreoPaso === 1 ? KB : 1);

          gruposCaraB.forEach((grp, k) => {
            const tNivelIni = coreoPaso === 1 ? T_CORRB_INI + k * dtCaraB : T_CORRB_INI;
            const tNivelFin = coreoPaso === 1 ? tNivelIni + dtCaraB : T_PASO_TOTAL;
            const tCorrIni = tNivelIni;
            const tCorrFin = tNivelIni + (tNivelFin - tNivelIni) * 0.42;
            const tTornIni = tCorrFin + 0.08;
            const tTornPop = Math.min(tTornIni + 0.22, tNivelFin - 0.22);
            const tTornFin = tNivelFin - 0.03;

            grp.correderas.forEach((obj) => {
              const pRestB_orig = getSafeRestPosition(obj);
              const qRestB_orig = getSafeRestQuaternion(obj);

              // Posición y rotación de destino sobre la madera volteada
              const pDestinoB = rotarPunto(pRestB_orig, qRot180);
              const qDestinoB = qRot180.clone().multiply(qRestB_orig);
              const pPopB = pDestinoB.clone().add(new THREE.Vector3(0, ALTURA_APROX, 0));

              // Escala: estrictamente OCULTA hasta su tCorrIni
              const scaleTimes = [0, tCorrIni - 0.01, tCorrIni, T_PASO_TOTAL];
              const scaleValues = [0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1];
              tracks.push(new THREE.VectorKeyframeTrack(`${obj.uuid}.scale`, scaleTimes, scaleValues, THREE.InterpolateLinear));

              // Posición: aparece arriba a 30 cm sobre la cara superior volteada y desciende
              const posTimes = [0, tCorrIni, tCorrFin, T_PASO_TOTAL];
              const posValues = [
                pPopB.x, pPopB.y, pPopB.z,
                pPopB.x, pPopB.y, pPopB.z,
                pDestinoB.x, pDestinoB.y, pDestinoB.z,
                pDestinoB.x, pDestinoB.y, pDestinoB.z,
              ];
              tracks.push(new THREE.VectorKeyframeTrack(`${obj.uuid}.position`, posTimes, posValues, THREE.InterpolateLinear));

              // Rotación: orientada boca arriba en la cara volteada
              const rotTimes = [0, tCorrIni, T_PASO_TOTAL];
              const rotValues = [
                qDestinoB.x, qDestinoB.y, qDestinoB.z, qDestinoB.w,
                qDestinoB.x, qDestinoB.y, qDestinoB.z, qDestinoB.w,
                qDestinoB.x, qDestinoB.y, qDestinoB.z, qDestinoB.w,
              ];
              tracks.push(new THREE.QuaternionKeyframeTrack(`${obj.uuid}.quaternion`, rotTimes, rotValues, THREE.InterpolateLinear));
            });

            grp.tornillos.forEach((tObj) => {
              const pRestT_orig = getSafeRestPosition(tObj);
              const qRestT_orig = getSafeRestQuaternion(tObj);

              // Posición y orientación de destino sobre la corredera volteada
              const pDestinoTB = rotarPunto(pRestT_orig, qRot180);
              const qBaseTB = qRot180.clone().multiply(qRestT_orig);
              const pPopTB = pDestinoTB.clone().add(new THREE.Vector3(0, ALTURA_APROX, 0));

              // Escala: estrictamente OCULTA hasta tTornIni, Pop-In 200% -> 100%
              const scaleTimes = [0, Math.max(0, tTornIni - 0.01), tTornIni, tTornPop, T_PASO_TOTAL];
              const scaleValues = [
                0, 0, 0,
                0, 0, 0,
                2.0, 2.0, 2.0,
                1.0, 1.0, 1.0,
                1.0, 1.0, 1.0,
              ];
              tracks.push(new THREE.VectorKeyframeTrack(`${tObj.uuid}.scale`, scaleTimes, scaleValues, THREE.InterpolateLinear));

              // Posición: arriba a 30cm -> desciende colinealmente hasta pDestinoTB
              const posTimes = [0, tTornIni, tTornPop, tTornFin, T_PASO_TOTAL];
              const posValues = [
                pPopTB.x, pPopTB.y, pPopTB.z,
                pPopTB.x, pPopTB.y, pPopTB.z,
                pPopTB.x, pPopTB.y, pPopTB.z,
                pDestinoTB.x, pDestinoTB.y, pDestinoTB.z,
                pDestinoTB.x, pDestinoTB.y, pDestinoTB.z,
              ];
              tracks.push(new THREE.VectorKeyframeTrack(`${tObj.uuid}.position`, posTimes, posValues, THREE.InterpolateLinear));

              // Rotación: atornillado axial continuo de 720° (2 vueltas) sobre el eje local del tornillo
              const rotAxis = new THREE.Vector3(0, 1, 0);
              const totalAngle = Math.PI * 4;
              const qRotAtornillado = new THREE.Quaternion().setFromAxisAngle(rotAxis, totalAngle);
              const qAtornilladoTB = qBaseTB.clone().multiply(qRotAtornillado);
              const tMid = tTornPop + (tTornFin - tTornPop) * 0.5;

              const rotTimes = [0, tTornPop, tMid, tTornFin, T_PASO_TOTAL];
              const rotValues = [
                qBaseTB.x, qBaseTB.y, qBaseTB.z, qBaseTB.w,
                qBaseTB.x, qBaseTB.y, qBaseTB.z, qBaseTB.w,
                qAtornilladoTB.x, qAtornilladoTB.y, qAtornilladoTB.z, qAtornilladoTB.w,
                qAtornilladoTB.x, qAtornilladoTB.y, qAtornilladoTB.z, qAtornilladoTB.w,
                qAtornilladoTB.x, qAtornilladoTB.y, qAtornilladoTB.z, qAtornilladoTB.w,
              ];
              tracks.push(new THREE.QuaternionKeyframeTrack(`${tObj.uuid}.quaternion`, rotTimes, rotValues, THREE.InterpolateLinear));
            });
          });
        } else {
          // =========================================================================
          // 📄 SUBBLOQUE UNIFACIAL (P02A, P02C): CORREDERAS EN UNA SOLA CARA
          // =========================================================================
          // Agrupar correderas en niveles longitudinales
          correderas.sort((a, b) => {
            const pA = getSafeRestPosition(a);
            const pB = getSafeRestPosition(b);
            return (pA.z - pB.z) || (pA.x - pB.x);
          });

          const gruposNivel: Array<{ correderas: THREE.Mesh[]; tornillos: THREE.Mesh[] }> = [];
          correderas.forEach((c) => {
            const pC = getSafeRestPosition(c);
            let g = gruposNivel.find((grp) => {
              const ref = getSafeRestPosition(grp.correderas[0]);
              return Math.abs(ref.z - pC.z) < 0.04 && Math.abs(ref.x - pC.x) < 0.04;
            });
            if (!g) {
              g = { correderas: [], tornillos: [] };
              gruposNivel.push(g);
            }
            g.correderas.push(c);
          });

          if (gruposNivel.length === 0 && tornillos.length > 0) {
            gruposNivel.push({ correderas: [], tornillos: tornillos });
          } else {
            tornillos.forEach((t) => {
              const pT = getSafeRestPosition(t);
              let mejorGrupo = gruposNivel[0];
              let mejorDist = Infinity;
              gruposNivel.forEach((grp) => {
                grp.correderas.forEach((c) => {
                  const dist = pT.distanceTo(getSafeRestPosition(c));
                  if (dist < mejorDist) {
                    mejorDist = dist;
                    mejorGrupo = grp;
                  }
                });
              });
              if (mejorGrupo) {
                mejorGrupo.tornillos.push(t);
              }
            });
          }

          const K = Math.max(1, gruposNivel.length);

          if (coreoPaso === 1) {
            // 🎭 COREOGRAFÍA 1: SECUENCIAL POR CORREDERA (Nivel por Nivel)
            const dtNivel = tSubDur / K;
            gruposNivel.forEach((grp, k) => {
              const tNivelIni = tSubIni + k * dtNivel;
              const tNivelFin = tNivelIni + dtNivel;
              const tCorrIni = tNivelIni;
              const tCorrFin = tNivelIni + dtNivel * 0.42;
              const tTornIni = tCorrFin + 0.08;
              const tTornPop = Math.min(tTornIni + 0.22, tNivelFin - 0.22);
              const tTornFin = tNivelFin - 0.03;

              grp.correderas.forEach((obj) => {
                const pRest = getSafeRestPosition(obj);
                const pPop = pRest.clone().add(new THREE.Vector3(0, ALTURA_APROX, 0));

                const scaleTimes = tCorrIni > 0.04
                  ? [0, tCorrIni - 0.01, tCorrIni, duracionPaso]
                  : [0, duracionPaso];
                const scaleValues = tCorrIni > 0.04
                  ? [0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1]
                  : [1, 1, 1, 1, 1, 1];
                tracks.push(new THREE.VectorKeyframeTrack(`${obj.uuid}.scale`, scaleTimes, scaleValues, THREE.InterpolateLinear));

                const posTimes = [0, tCorrIni, tCorrFin, duracionPaso];
                const posValues = [
                  pPop.x, pPop.y, pPop.z,
                  pPop.x, pPop.y, pPop.z,
                  pRest.x, pRest.y, pRest.z,
                  pRest.x, pRest.y, pRest.z,
                ];
                tracks.push(new THREE.VectorKeyframeTrack(`${obj.uuid}.position`, posTimes, posValues, THREE.InterpolateLinear));
              });

              grp.tornillos.forEach((tObj) => {
                const pRest = getSafeRestPosition(tObj);
                const qRest = getSafeRestQuaternion(tObj);
                const pPopTorn = pRest.clone().add(new THREE.Vector3(0, ALTURA_APROX, 0));

                const scaleTimes = [0, Math.max(0, tTornIni - 0.01), tTornIni, tTornPop, duracionPaso];
                const scaleValues = [
                  0, 0, 0,
                  0, 0, 0,
                  2.0, 2.0, 2.0,
                  1.0, 1.0, 1.0,
                  1.0, 1.0, 1.0,
                ];
                tracks.push(new THREE.VectorKeyframeTrack(`${tObj.uuid}.scale`, scaleTimes, scaleValues, THREE.InterpolateLinear));

                const posTimes = [0, tTornIni, tTornPop, tTornFin, duracionPaso];
                const posValues = [
                  pPopTorn.x, pPopTorn.y, pPopTorn.z,
                  pPopTorn.x, pPopTorn.y, pPopTorn.z,
                  pPopTorn.x, pPopTorn.y, pPopTorn.z,
                  pRest.x, pRest.y, pRest.z,
                  pRest.x, pRest.y, pRest.z,
                ];
                tracks.push(new THREE.VectorKeyframeTrack(`${tObj.uuid}.position`, posTimes, posValues, THREE.InterpolateLinear));

                const rotAxis = new THREE.Vector3(0, 1, 0);
                const totalAngle = Math.PI * 4;
                const q0 = qRest.clone();
                const qMid = qRest.clone().multiply(new THREE.Quaternion().setFromAxisAngle(rotAxis, totalAngle * 0.5));
                const qFinal = qRest.clone().multiply(new THREE.Quaternion().setFromAxisAngle(rotAxis, totalAngle));
                const tRotMid = tTornPop + (tTornFin - tTornPop) * 0.5;

                const rotTimes = [0, tTornPop, tRotMid, tTornFin, duracionPaso];
                const rotValues = [
                  q0.x, q0.y, q0.z, q0.w,
                  q0.x, q0.y, q0.z, q0.w,
                  qMid.x, qMid.y, qMid.z, qMid.w,
                  qFinal.x, qFinal.y, qFinal.z, qFinal.w,
                  qFinal.x, qFinal.y, qFinal.z, qFinal.w,
                ];
                tracks.push(new THREE.QuaternionKeyframeTrack(`${tObj.uuid}.quaternion`, rotTimes, rotValues, THREE.InterpolateLinear));
              });
            });
          } else {
            // 🎭 COREOGRAFÍA 2: SIMULTÁNEA EN BLOQUE (Todas las correderas juntas, luego todos los tornillos)
            const tCorrIni = tSubIni;
            const tCorrFin = tSubIni + tSubDur * 0.42;
            const tTornIni = tCorrFin + 0.08;
            const tTornPop = Math.min(tTornIni + 0.25, tSubFin - 0.22);
            const tTornFin = tSubFin - 0.04;

            correderas.forEach((obj) => {
              const pRest = getSafeRestPosition(obj);
              const pPop = pRest.clone().add(new THREE.Vector3(0, ALTURA_APROX, 0));

              const scaleTimes = tCorrIni > 0.04
                ? [0, tCorrIni - 0.01, tCorrIni, duracionPaso]
                : [0, duracionPaso];
              const scaleValues = tCorrIni > 0.04
                ? [0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1]
                : [1, 1, 1, 1, 1, 1];
              tracks.push(new THREE.VectorKeyframeTrack(`${obj.uuid}.scale`, scaleTimes, scaleValues, THREE.InterpolateLinear));

              const posTimes = [0, tCorrIni, tCorrFin, duracionPaso];
              const posValues = [
                pPop.x, pPop.y, pPop.z,
                pPop.x, pPop.y, pPop.z,
                pRest.x, pRest.y, pRest.z,
                pRest.x, pRest.y, pRest.z,
              ];
              tracks.push(new THREE.VectorKeyframeTrack(`${obj.uuid}.position`, posTimes, posValues, THREE.InterpolateLinear));
            });

            tornillos.forEach((tObj) => {
              const pRest = getSafeRestPosition(tObj);
              const qRest = getSafeRestQuaternion(tObj);
              const pPopTorn = pRest.clone().add(new THREE.Vector3(0, ALTURA_APROX, 0));

              const scaleTimes = [0, Math.max(0, tTornIni - 0.01), tTornIni, tTornPop, duracionPaso];
              const scaleValues = [
                0, 0, 0,
                0, 0, 0,
                2.0, 2.0, 2.0,
                1.0, 1.0, 1.0,
                1.0, 1.0, 1.0,
              ];
              tracks.push(new THREE.VectorKeyframeTrack(`${tObj.uuid}.scale`, scaleTimes, scaleValues, THREE.InterpolateLinear));

              const posTimes = [0, tTornIni, tTornPop, tTornFin, duracionPaso];
              const posValues = [
                pPopTorn.x, pPopTorn.y, pPopTorn.z,
                pPopTorn.x, pPopTorn.y, pPopTorn.z,
                pPopTorn.x, pPopTorn.y, pPopTorn.z,
                pRest.x, pRest.y, pRest.z,
                pRest.x, pRest.y, pRest.z,
              ];
              tracks.push(new THREE.VectorKeyframeTrack(`${tObj.uuid}.position`, posTimes, posValues, THREE.InterpolateLinear));

              const rotAxis = new THREE.Vector3(0, 1, 0);
              const totalAngle = Math.PI * 4;
              const q0 = qRest.clone();
              const qMid = qRest.clone().multiply(new THREE.Quaternion().setFromAxisAngle(rotAxis, totalAngle * 0.5));
              const qFinal = qRest.clone().multiply(new THREE.Quaternion().setFromAxisAngle(rotAxis, totalAngle));
              const tRotMid = tTornPop + (tTornFin - tTornPop) * 0.5;

              const rotTimes = [0, tTornPop, tRotMid, tTornFin, duracionPaso];
              const rotValues = [
                q0.x, q0.y, q0.z, q0.w,
                q0.x, q0.y, q0.z, q0.w,
                qMid.x, qMid.y, qMid.z, qMid.w,
                qFinal.x, qFinal.y, qFinal.z, qFinal.w,
                qFinal.x, qFinal.y, qFinal.z, qFinal.w,
              ];
              tracks.push(new THREE.QuaternionKeyframeTrack(`${tObj.uuid}.quaternion`, rotTimes, rotValues, THREE.InterpolateLinear));
            });
          }
        }
      });
    } else {
      // 2.2 Fallback legacy si no hay subbloques: iterar paso.secuencia
      paso.secuencia.forEach((elem: ElementoSecuenciaCinematica) => {
      const targetObj = sceneObjects.get(elem.nombreNodo) || sceneObjects.get(normalizarNombreNodo(elem.nombreNodo));
      if (!targetObj) return;

      const pRest = getSafeRestPosition(targetObj);
      const qRest = getSafeRestQuaternion(targetObj);
      const sRest = new THREE.Vector3(1, 1, 1);

      const tStart = Math.max(0, elem.tiempoInicio);
      const tDur = Math.max(0.5, elem.duracionMovimiento);
      const tEndAction = tStart + tDur;

      // Dirección colineal de aproximación:
      // Si es herraje, aproximarse a lo largo de su orientación o en +Y / +Z
      const offsetDist = elem.distanciaAproximacion || 0.15;
      const vOffset = new THREE.Vector3(0, offsetDist, 0);
      if (elem.tipo === "herraje") {
        vOffset.set(0, offsetDist, 0.05);
      }
      const pPop = pRest.clone().add(vOffset);

      // ── PISTA DE ESCALA (Pop-In 200% -> 100%) ──────────────────────────────
      if (elem.popIn) {
        const scaleTimes = [0, Math.max(0, tStart - 0.05), tStart, tStart + 0.35, tEndAction, duracionPaso];
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

      // ── PISTA DE POSICIÓN (Aproximación colineal suave) ─────────────────────
      const posTimes = [0, tStart, tStart + 0.35, tEndAction, duracionPaso];
      const posValues = [
        pPop.x, pPop.y, pPop.z,
        pPop.x, pPop.y, pPop.z,
        pPop.x, pPop.y, pPop.z,
        pRest.x, pRest.y, pRest.z,
        pRest.x, pRest.y, pRest.z,
      ];
      tracks.push(new THREE.VectorKeyframeTrack(`${targetObj.uuid}.position`, posTimes, posValues));

      // ── PISTA DE ROTACIÓN (Atornillado 720° / Minifix 180°) ──────────────────
      if (elem.rotacionGrados && elem.rotacionGrados > 0) {
        const totalAngleRad = THREE.MathUtils.degToRad(elem.rotacionGrados);
        const rotAxis = new THREE.Vector3(0, 1, 0); // Eje axial del tornillo
        
        // 4 sub-pasos de rotación continua
        const tRotStart = tStart + 0.35;
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
          qFinal.x, qFinal.y, qFinal.z, qFinal.w,
        ];
        tracks.push(new THREE.QuaternionKeyframeTrack(`${targetObj.uuid}.quaternion`, rotTimes, rotValues));
      }

      // ── HERRAMIENTAS ACOPLADAS AL ELEMENTO ─────────────────────────────────
      if (elem.herramienta === "martillo" && toolMeshes?.martillo) {
        const hammer = toolMeshes.martillo;
        const hContact = pRest.clone().add(new THREE.Vector3(0, 0.05, 0)); // Contacto tangencial exacto 0mm
        const hReady = hContact.clone().add(new THREE.Vector3(0, 0.06, 0));
        const hRetract = hContact.clone().add(new THREE.Vector3(0, 0.25, 0));

        // 3 impactos rítmicos de martillado
        const tHStart = tStart + 0.35;
        const dt = (tEndAction - tHStart) / 6;

        const hTimes = [
          0, tStart, tHStart,
          tHStart + dt, tHStart + dt * 2,
          tHStart + dt * 3, tHStart + dt * 4,
          tHStart + dt * 5, tEndAction,
          tEndAction + 0.4, duracionPaso,
        ];
        const hPosValues = [
          hRetract.x, hRetract.y, hRetract.z,
          hRetract.x, hRetract.y, hRetract.z,
          hReady.x, hReady.y, hReady.z,
          hContact.x, hContact.y, hContact.z, // Golpe 1
          hReady.x, hReady.y, hReady.z,
          hContact.x, hContact.y, hContact.z, // Golpe 2
          hReady.x, hReady.y, hReady.z,
          hContact.x, hContact.y, hContact.z, // Golpe 3
          hContact.x, hContact.y, hContact.z,
          hRetract.x, hRetract.y, hRetract.z,
          hRetract.x, hRetract.y, hRetract.z,
        ];

        tracks.push(new THREE.VectorKeyframeTrack(`${hammer.uuid}.position`, hTimes, hPosValues));
        // Escala del martillo: visible solo durante su acción
        tracks.push(
          new THREE.VectorKeyframeTrack(
            `${hammer.uuid}.scale`,
            [0, tStart, tStart + 0.1, tEndAction + 0.4, duracionPaso],
            [0, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0]
          )
        );
      }

      if (elem.herramienta === "llave_allen" && toolMeshes?.llaveAllen) {
        const allen = toolMeshes.llaveAllen;
        const aSocket = pRest.clone(); // Concéntrico en el socket
        const aRetract = aSocket.clone().add(new THREE.Vector3(0, 0.18, 0));

        tracks.push(
          new THREE.VectorKeyframeTrack(
            `${allen.uuid}.position`,
            [0, tStart + 0.35, tEndAction, tEndAction + 0.5, duracionPaso],
            [
              aRetract.x, aRetract.y, aRetract.z,
              aSocket.x, aSocket.y, aSocket.z,
              aSocket.x, aSocket.y, aSocket.z,
              aRetract.x, aRetract.y, aRetract.z,
              aRetract.x, aRetract.y, aRetract.z,
            ]
          )
        );
        // Rota solidariamente con el tornillo
        if (elem.rotacionGrados) {
          const totalAngleRad = THREE.MathUtils.degToRad(elem.rotacionGrados);
          const qFinalAllen = qRest.clone().multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), totalAngleRad));
          tracks.push(
            new THREE.QuaternionKeyframeTrack(
              `${allen.uuid}.quaternion`,
              [0, tStart + 0.35, tEndAction, duracionPaso],
              [
                qRest.x, qRest.y, qRest.z, qRest.w,
                qRest.x, qRest.y, qRest.z, qRest.w,
                qFinalAllen.x, qFinalAllen.y, qFinalAllen.z, qFinalAllen.w,
                qFinalAllen.x, qFinalAllen.y, qFinalAllen.z, qFinalAllen.w,
              ]
            )
          );
        }
        tracks.push(
          new THREE.VectorKeyframeTrack(
            `${allen.uuid}.scale`,
            [0, tStart + 0.2, tStart + 0.35, tEndAction + 0.5, duracionPaso],
            [0, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0]
          )
        );
      }
    });
  }
  }

}
