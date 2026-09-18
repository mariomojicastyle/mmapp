import * as THREE from "three";
import { PasoManualStudio, SubBloqueArmado } from "../../store";
import {
  obtenerMallasDeSubbloque,
  extraerPiezaMadre,
  getSafeRestPosition,
  getSafeRestQuaternion,
} from "../cadStateUtils";

/**
 * Coreografía especializada de 4 actos y giro longitudinal 180° para subbloques
 * de armado (ej. P02A -> P02B Cara A -> P02C -> P02B Giro y Cara B con correderas telescópicas).
 */
export function compilarCoreografiaSubbloquesGiro(
  paso: PasoManualStudio,
  sceneMeshes: THREE.Mesh[],
  tracks: THREE.KeyframeTrack[],
  duracionPaso: number
): void {
  if (!paso.subbloques || paso.subbloques.length === 0) return;

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
        tSubIni = T_ACTO1_INI;
        tSubFin = T_ACTO1_FIN;
        tSubDur = tSubFin - tSubIni;
      } else if (sIdx === 1) {
        tSubIni = T_ACTO2_INI;
        tSubFin = T_PASO_TOTAL;
        tSubDur = tSubFin - tSubIni;
      } else {
        tSubIni = T_ACTO3_INI;
        tSubFin = T_ACTO3_FIN;
        tSubDur = tSubFin - tSubIni;
      }
    } else {
      tSubIni = sub.trackAnimacion?.tiempoInicio ?? Number(((sIdx * duracionPaso) / numSubs).toFixed(1));
      tSubDur = Math.max(1, sub.trackAnimacion?.duracion ?? Number((duracionPaso / numSubs).toFixed(1)));
      tSubFin = Math.min(duracionPaso, tSubIni + tSubDur);
    }

    // 3. Separar mallas: Correderas, Tornillos y Madera Completa
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

    // 4. Envolvente geométrica y centro baricéntrico EXACTO
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
    centroMadera.x = 0.730;
    const yCentroMadera = centroMadera.y;
    const ALTURA_APROX = 0.30;
    const ALTURA_GIRO = 0.45;

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
      // 🔄 SUBBLOQUE DE DOBLE CARA (P02B): CARA A -> P02C -> GIRO 180° -> CARA B
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

      const tCaraAIni = T_ACTO2_INI;
      const tCaraAFin = T_ACTO2_FIN;

      const ejeVolteo = new THREE.Vector3(0, 0, 1);
      const qRot90 = new THREE.Quaternion().setFromAxisAngle(ejeVolteo, Math.PI * 0.5);
      const qRot180 = new THREE.Quaternion().setFromAxisAngle(ejeVolteo, Math.PI);

      const rotarPunto = (p: THREE.Vector3, q: THREE.Quaternion): THREE.Vector3 => {
        const v = p.clone().sub(centroMadera);
        v.applyQuaternion(q);
        return centroMadera.clone().add(v);
      };

      // ── 1. MADERA COMPLETA ──
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

      // ── AGRUPACIÓN POR NIVELES PARA CARA A Y CARA B ──
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

      // ANIMACIÓN CARA A
      const durCaraA = tCaraAFin - tCaraAIni;
      const KA = Math.max(1, gruposCaraA.length);
      const dtNivelA = durCaraA / KA;

      gruposCaraA.forEach((grp, k) => {
        const tNivelIni = tCaraAIni + k * dtNivelA;
        const tNivelFin = tNivelIni + dtNivelA;
        const tCorrIni = tNivelIni;
        const tCorrFin = tNivelIni + dtNivelA * 0.42;
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

          const scaleTimes = tCorrIni > 0.04
            ? [0, tCorrIni - 0.01, tCorrIni, T_PASO_TOTAL]
            : [0, T_PASO_TOTAL];
          const scaleValues = tCorrIni > 0.04
            ? [0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1]
            : [1, 1, 1, 1, 1, 1];
          tracks.push(new THREE.VectorKeyframeTrack(`${obj.uuid}.scale`, scaleTimes, scaleValues, THREE.InterpolateLinear));

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

          const rotTimes = [
            0, tCaraAFin, T_GIRO_INI, T_GIRO_SUBIDA, T_GIRO_ROTMID, T_GIRO_ROTFIN, T_GIRO_PISO, T_PASO_TOTAL
          ];
          const rotValues = [
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

          const pSubidaT = pRestT.clone().add(new THREE.Vector3(0, ALTURA_GIRO, 0));
          const pMidRotT = rotarPunto(pRestT, qRot90).add(new THREE.Vector3(0, ALTURA_GIRO, 0));
          const pFinRotT = rotarPunto(pRestT, qRot180).add(new THREE.Vector3(0, ALTURA_GIRO, 0));
          const pPisoVolteadaT = rotarPunto(pRestT, qRot180);

          const qMidRotT = qRot90.clone().multiply(qRestT);
          const qFinRotT = qRot180.clone().multiply(qRestT);

          const scaleTimes = [0, Math.max(0, tTornIni - 0.01), tTornIni, tTornPop, T_PASO_TOTAL];
          const scaleValues = [
            0, 0, 0,
            0, 0, 0,
            2.0, 2.0, 2.0,
            1.0, 1.0, 1.0,
            1.0, 1.0, 1.0,
          ];
          tracks.push(new THREE.VectorKeyframeTrack(`${tObj.uuid}.scale`, scaleTimes, scaleValues, THREE.InterpolateLinear));

          const posTimes = [
            0, tTornIni, tTornPop, tTornFin,
            T_GIRO_INI, T_GIRO_SUBIDA, T_GIRO_ROTMID, T_GIRO_ROTFIN, T_GIRO_PISO, T_PASO_TOTAL
          ];
          const posValues = [
            pPopT.x, pPopT.y, pPopT.z,
            pPopT.x, pPopT.y, pPopT.z,
            pPopT.x, pPopT.y, pPopT.z,
            pRestT.x, pRestT.y, pRestT.z,
            pSubidaT.x, pSubidaT.y, pSubidaT.z,
            pMidRotT.x, pMidRotT.y, pMidRotT.z,
            pFinRotT.x, pFinRotT.y, pFinRotT.z,
            pPisoVolteadaT.x, pPisoVolteadaT.y, pPisoVolteadaT.z,
            pPisoVolteadaT.x, pPisoVolteadaT.y, pPisoVolteadaT.z,
          ];
          tracks.push(new THREE.VectorKeyframeTrack(`${tObj.uuid}.position`, posTimes, posValues, THREE.InterpolateLinear));

          const rotAxis = new THREE.Vector3(0, 1, 0);
          const totalAngle = Math.PI * 4;
          const q0 = qRestT.clone();
          const qMid = qRestT.clone().multiply(new THREE.Quaternion().setFromAxisAngle(rotAxis, totalAngle * 0.5));
          const qFinal = qRestT.clone().multiply(new THREE.Quaternion().setFromAxisAngle(rotAxis, totalAngle));
          const tMid = tTornPop + (tTornFin - tTornPop) * 0.5;

          const rotTimes = [
            0, tTornPop, tMid, tTornFin,
            T_GIRO_INI, T_GIRO_SUBIDA, T_GIRO_ROTMID, T_GIRO_ROTFIN, T_GIRO_PISO, T_PASO_TOTAL
          ];
          const rotValues = [
            q0.x, q0.y, q0.z, q0.w,
            q0.x, q0.y, q0.z, q0.w,
            qMid.x, qMid.y, qMid.z, qMid.w,
            qFinal.x, qFinal.y, qFinal.z, qFinal.w,
            qFinal.x, qFinal.y, qFinal.z, qFinal.w,
            qMidRotT.x, qMidRotT.y, qMidRotT.z, qMidRotT.w,
            qFinRotT.x, qFinRotT.y, qFinRotT.z, qFinRotT.w,
            qFinRotT.x, qFinRotT.y, qFinRotT.z, qFinRotT.w,
            qFinRotT.x, qFinRotT.y, qFinRotT.z, qFinRotT.w,
          ];
          tracks.push(new THREE.QuaternionKeyframeTrack(`${tObj.uuid}.quaternion`, rotTimes, rotValues, THREE.InterpolateLinear));
        });
      });

      // ANIMACIÓN CARA B
      const durCaraB = T_PASO_TOTAL - T_CORRB_INI;
      const KB = Math.max(1, gruposCaraB.length);
      const dtNivelB = durCaraB / KB;

      gruposCaraB.forEach((grp, k) => {
        const tNivelIni = T_CORRB_INI + k * dtNivelB;
        const tNivelFin = tNivelIni + dtNivelB;
        const tCorrIni = tNivelIni;
        const tCorrFin = tNivelIni + dtNivelB * 0.40;
        const tTornIni = tCorrFin + 0.08;
        const tTornPop = Math.min(tTornIni + 0.22, tNivelFin - 0.22);
        const tTornFin = tNivelFin - 0.03;

        grp.correderas.forEach((obj) => {
          const pRestB_orig = getSafeRestPosition(obj);
          const qRestB_orig = getSafeRestQuaternion(obj);

          const pDestinoB = rotarPunto(pRestB_orig, qRot180);
          const qDestinoB = qRot180.clone().multiply(qRestB_orig);
          const pPopB = pDestinoB.clone().add(new THREE.Vector3(0, ALTURA_APROX, 0));

          const scaleTimes = [0, tCorrIni - 0.01, tCorrIni, T_PASO_TOTAL];
          const scaleValues = [0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1];
          tracks.push(new THREE.VectorKeyframeTrack(`${obj.uuid}.scale`, scaleTimes, scaleValues, THREE.InterpolateLinear));

          const posTimes = [0, tCorrIni, tCorrFin, T_PASO_TOTAL];
          const posValues = [
            pPopB.x, pPopB.y, pPopB.z,
            pPopB.x, pPopB.y, pPopB.z,
            pDestinoB.x, pDestinoB.y, pDestinoB.z,
            pDestinoB.x, pDestinoB.y, pDestinoB.z,
          ];
          tracks.push(new THREE.VectorKeyframeTrack(`${obj.uuid}.position`, posTimes, posValues, THREE.InterpolateLinear));

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

          const pDestinoTB = rotarPunto(pRestT_orig, qRot180);
          const qBaseTB = qRot180.clone().multiply(qRestT_orig);
          const pPopTB = pDestinoTB.clone().add(new THREE.Vector3(0, ALTURA_APROX, 0));

          const scaleTimes = [0, Math.max(0, tTornIni - 0.01), tTornIni, tTornPop, T_PASO_TOTAL];
          const scaleValues = [
            0, 0, 0,
            0, 0, 0,
            2.0, 2.0, 2.0,
            1.0, 1.0, 1.0,
            1.0, 1.0, 1.0,
          ];
          tracks.push(new THREE.VectorKeyframeTrack(`${tObj.uuid}.scale`, scaleTimes, scaleValues, THREE.InterpolateLinear));

          const posTimes = [0, tTornIni, tTornPop, tTornFin, T_PASO_TOTAL];
          const posValues = [
            pPopTB.x, pPopTB.y, pPopTB.z,
            pPopTB.x, pPopTB.y, pPopTB.z,
            pPopTB.x, pPopTB.y, pPopTB.z,
            pDestinoTB.x, pDestinoTB.y, pDestinoTB.z,
            pDestinoTB.x, pDestinoTB.y, pDestinoTB.z,
          ];
          tracks.push(new THREE.VectorKeyframeTrack(`${tObj.uuid}.position`, posTimes, posValues, THREE.InterpolateLinear));

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
      // 📄 SUBBLOQUE UNIFACIAL (P02A, P02C)
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
        // 🎭 COREOGRAFÍA 1: SECUENCIAL POR CORREDERA
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
        // 🎭 COREOGRAFÍA 2: SIMULTÁNEA EN BLOQUE
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
}
