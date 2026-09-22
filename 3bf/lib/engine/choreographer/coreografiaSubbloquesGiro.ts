import * as THREE from "three";
import { PasoManualStudio, SubBloqueArmado } from "../../store";
import {
  obtenerMallasDeSubbloque,
  extraerPiezaMadre,
  getSafeRestPosition,
  getSafeRestQuaternion,
  coincidenMismoHerraje,
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

  // ⏱️ Definición Canónica y Sincronizada con el Mezclador Multipista
  // Para 3 láminas con doble cara y tarugos, se requiere un piso mínimo de 13.50s para que no se corten los 5 actos
  const T_PASO_TOTAL = Math.max(duracionPaso, numSubs >= 3 && hayDobleCara ? 13.50 : 1.0);

  // Subbloques configurados
  const sub0 = paso.subbloques[0];
  const sub1 = paso.subbloques[idxDobleCara >= 0 ? idxDobleCara : 1] || paso.subbloques[1];
  const sub2 = paso.subbloques.length > 2 ? paso.subbloques[2] : null;

  // Acto 1 (P03A / Lateral 1):
  const tActo1_Ini = Math.max(0, sub0?.trackAnimacion?.tiempoInicio ?? 0.0);
  const tActo1_Dur = sub0?.trackAnimacion?.duracion && sub0.trackAnimacion.duracion > 0
    ? sub0.trackAnimacion.duracion
    : 2.40;
  const tActo1_Fin = tActo1_Ini + tActo1_Dur;

  // Acto 2 (P03B Cara A / Pieza Central Cara A):
  const tSub1TrackIni = sub1?.trackAnimacion?.tiempoInicio;
  const tCaraA_Ini = (tSub1TrackIni !== undefined && tSub1TrackIni > tActo1_Ini)
    ? tSub1TrackIni
    : tActo1_Fin;
  const tSub2TrackIni = sub2?.trackAnimacion?.tiempoInicio;
  // Cara A concluye cuando empieza P03C, o dura 2.4s (nunca puede tomar 11s de un track global)
  const tCaraA_Dur = (tSub2TrackIni !== undefined && tSub2TrackIni > tCaraA_Ini)
    ? Math.max(1.0, tSub2TrackIni - tCaraA_Ini)
    : 2.40;
  const tCaraA_Fin = tCaraA_Ini + tCaraA_Dur;

  // Acto 3 (P03C / Lateral 2):
  // 🛡️ CRÍTICO: Si tSub2TrackIni es 0 o menor a Cara A, cae a tCaraA_Fin para evitar que P03C se monte sobre P03A
  const tActo3_Ini = (tSub2TrackIni !== undefined && tSub2TrackIni >= tCaraA_Fin)
    ? tSub2TrackIni
    : tCaraA_Fin;
  const tActo3_Dur = sub2?.trackAnimacion?.duracion && sub2.trackAnimacion.duracion > 0
    ? sub2.trackAnimacion.duracion
    : 2.50;
  const tActo3_Fin = tActo3_Ini + tActo3_Dur;

  // Acto 4: Giro 180° de la pieza central (arranca tan pronto finaliza P03C sobre la mesa)
  const T_GIRO_INI = Math.max(tCaraA_Fin, tActo3_Fin);
  const durGiro = 1.70;
  const T_GIRO_SUBIDA = T_GIRO_INI + 0.50; // Sube +45 cm (0.5s)
  const T_GIRO_ROTMID = T_GIRO_SUBIDA + 0.35; // Rota 90° (0.35s)
  const T_GIRO_ROTFIN = T_GIRO_ROTMID + 0.35; // Rota 180° (0.35s)
  const T_GIRO_PISO   = T_GIRO_ROTFIN + 0.50; // Desciende al piso volteada (0.5s)

  // Montaje de Cara B (Correderas y tornillos de la cara B tras el giro):
  const T_CORRB_INI = T_GIRO_PISO;
  const durCaraB_base = 2.40;
  const durTarugos_base = 1.50;
  const duracionMinimaRestante = durCaraB_base + durTarugos_base + 0.60;
  const tTechoReal = Math.max(T_PASO_TOTAL, T_CORRB_INI + duracionMinimaRestante);

  const durCaraB = Math.max(durCaraB_base, tTechoReal - T_CORRB_INI - 2.10);
  const T_CORRB_FIN_GLOBAL = T_CORRB_INI + durCaraB;

  // Acto 5: Tarugos (Cavilhas) en cantos de tableros
  const T_TARUGOS_INI = T_CORRB_FIN_GLOBAL;
  const T_TARUGOS_POP = T_TARUGOS_INI + 0.20;
  const T_TARUGOS_FIN = Math.min(tTechoReal - 0.20, T_TARUGOS_INI + durTarugos_base);
  const DISTANCIA_TARUGO_M = 0.20; // 20 cm solicitados explícitamente

  const tarugosYaAsignadosGlobal = new Set<string>();

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
        tSubIni = tActo1_Ini;
        tSubFin = tActo1_Fin;
        tSubDur = tSubFin - tSubIni;
      } else if (sIdx === 1) {
        tSubIni = tCaraA_Ini;
        tSubFin = T_PASO_TOTAL;
        tSubDur = tSubFin - tSubIni;
      } else {
        tSubIni = tActo3_Ini;
        tSubFin = tActo3_Fin;
        tSubDur = tSubFin - tSubIni;
      }
    } else {
      tSubIni = sub.trackAnimacion?.tiempoInicio ?? Number(((sIdx * duracionPaso) / numSubs).toFixed(1));
      tSubDur = Math.max(0.5, sub.trackAnimacion?.duracion ?? Number((duracionPaso / numSubs).toFixed(1)));
      tSubFin = Math.min(duracionPaso, tSubIni + tSubDur);
    }

    // 3. Separar mallas: Correderas, Tornillos, Tarugos (Cavilhas) y Madera Completa
    const correderas: THREE.Mesh[] = [];
    const tornillos: THREE.Mesh[] = [];
    const tarugos: THREE.Mesh[] = [];
    const mallasMadera: THREE.Mesh[] = [];

    mallasSub.forEach((m) => {
      const nLow = (m.name || m.userData?.cleanName || "").toLowerCase();
      if (nLow.includes("corredi") || nLow.includes("trilho")) {
        correderas.push(m);
      } else if (nLow.includes("parafuso") || nLow.includes("tornillo") || nLow.includes("perno")) {
        tornillos.push(m);
      } else if (nLow.includes("cavilha") || nLow.includes("tarugo") || nLow.includes("clavilha")) {
        tarugos.push(m);
        tarugosYaAsignadosGlobal.add(m.uuid);
      } else {
        mallasMadera.push(m);
      }
    });

    // Búsqueda de rescate si las cavilhas están en sub.herrajes pero no cayeron en mallasSub:
    const tarugosSubNombres = (sub.herrajes || []).filter((h) => {
      const hLow = h.toLowerCase();
      return hLow.includes("cavilha") || hLow.includes("tarugo") || hLow.includes("clavilha");
    });
    if (tarugos.length === 0 && tarugosSubNombres.length > 0) {
      tarugosSubNombres.forEach((tNombre) => {
        const tMesh = sceneMeshes.find((m) => {
          const cn = ((m.userData?.cleanName || m.name || "") as string).toLowerCase();
          const ik = ((m.userData?.instanciaKey || "") as string).toLowerCase();
          return (
            coincidenMismoHerraje(tNombre, cn) ||
            coincidenMismoHerraje(tNombre, ik) ||
            cn === tNombre.toLowerCase() ||
            ik === tNombre.toLowerCase()
          );
        });
        if (tMesh && !tarugos.includes(tMesh)) {
          tarugos.push(tMesh);
          tarugosYaAsignadosGlobal.add(tMesh.uuid);
        }
      });
    }

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

    // 🪵 Auto-detección espacial de tarugos (cavilhas) por proximidad geométrica al lateral de madera:
    // Los tarugos se insertan en los cantos o perforaciones de la madera.
    if (tarugos.length === 0 && !boxMaderaCompleta.isEmpty()) {
      sceneMeshes.forEach((m) => {
        const cn = ((m.userData?.cleanName || m.name || "") as string).toLowerCase();
        if (
          (cn.includes("cavilha") || cn.includes("tarugo") || cn.includes("clavilha")) &&
          !tarugosYaAsignadosGlobal.has(m.uuid)
        ) {
          const p = getSafeRestPosition(m);
          if (boxMaderaCompleta.distanceToPoint(p) <= 0.035) {
            tarugos.push(m);
            tarugosYaAsignadosGlobal.add(m.uuid);
          }
        }
      });
    }

    const centroMadera = new THREE.Vector3();
    boxMaderaCompleta.getCenter(centroMadera);
    if (masterMesh) {
      const boxMaster = new THREE.Box3().setFromObject(masterMesh);
      const cMaster = new THREE.Vector3();
      boxMaster.getCenter(cMaster);
      centroMadera.x = cMaster.x;
    }
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

    const ejeVolteo = new THREE.Vector3(0, 0, 1);
    const qRot90 = new THREE.Quaternion().setFromAxisAngle(ejeVolteo, Math.PI * 0.5);
    const qRot180 = new THREE.Quaternion().setFromAxisAngle(ejeVolteo, Math.PI);

    // 🛡️ Marco inercial de cuerpo rígido: la pieza máster de madera es el centro y origen absoluto de giro
    const pMaderaRef = (masterMesh ? getSafeRestPosition(masterMesh) : null) ||
      (mallasMadera[0] ? getSafeRestPosition(mallasMadera[0]) : centroMadera);

    const rotarPunto = (p: THREE.Vector3, q: THREE.Quaternion): THREE.Vector3 => {
      const ref = tieneDosCaras ? pMaderaRef : centroMadera;
      const v = p.clone().sub(ref);
      v.applyQuaternion(q);
      return ref.clone().add(v);
    };

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

      const tCaraAIni = tCaraA_Ini;
      const tCaraAFin = tCaraA_Fin;

      // ── 1. MADERA COMPLETA ──
      mallasMadera.forEach((maderaObj) => {
        const p0 = getSafeRestPosition(maderaObj);
        const q0 = getSafeRestQuaternion(maderaObj);

        // 🛡️ Blindaje de concentricidad absoluta: el eje de rotación no se desplaza en X.
        // La madera sube en Y, gira 180° sobre su propio eje central y baja en Y conservando exactamente p0.x inmutable.
        const pSubida = new THREE.Vector3(p0.x, p0.y + ALTURA_GIRO, p0.z);
        const pMidRot = new THREE.Vector3(p0.x, p0.y + ALTURA_GIRO, p0.z);
        const pFinRot = new THREE.Vector3(p0.x, p0.y + ALTURA_GIRO, p0.z);
        const pPisoVolteada = p0.clone(); // Aterriza en su misma huella exacta en reposo

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

      // 🌀 Generador de trayectoria de arco circular para herrajes de Cara A durante el giro
      // Evita el hundimiento/clavado en la madera producido por interpolación cartesiana lineal
      const PASOS_ARCO_GIRO = 24; // Muestreo cada 7.5° -> error de cuerda < 0.5 mm
      const generarMuestrasGiroArco = (
        pRest: THREE.Vector3,
        qBase: THREE.Quaternion
      ) => {
        const timesPos: number[] = [];
        const valsPos: number[] = [];
        const timesRot: number[] = [];
        const valsRot: number[] = [];

        const tIni = T_GIRO_SUBIDA;
        const tFin = T_GIRO_ROTFIN;
        const durGiro = tFin - tIni;

        for (let i = 0; i <= PASOS_ARCO_GIRO; i++) {
          const u = i / PASOS_ARCO_GIRO;
          const t = Number((tIni + u * durGiro).toFixed(4));
          const angulo = u * Math.PI;
          const qStep = new THREE.Quaternion().setFromAxisAngle(ejeVolteo, angulo);

          const pRotStep = rotarPunto(pRest, qStep).add(new THREE.Vector3(0, ALTURA_GIRO, 0));
          const qRotStep = qStep.clone().multiply(qBase);

          timesPos.push(t);
          valsPos.push(pRotStep.x, pRotStep.y, pRotStep.z);

          timesRot.push(t);
          valsRot.push(qRotStep.x, qRotStep.y, qRotStep.z, qRotStep.w);
        }

        return { timesPos, valsPos, timesRot, valsRot };
      };

      gruposCaraA.forEach((grp, k) => {
        let tCorrIni: number;
        let tCorrFin: number;
        let tTornIni: number;
        let tTornPop: number;
        let tTornFin: number;

        if (coreoPaso === 2) {
          // 🎭 COREOGRAFÍA 2: SIMULTÁNEA EN BLOQUE (Todas las correderas bajan juntas, luego tornillos juntos)
          const durBloque = durCaraA;
          tCorrIni = tCaraAIni;
          tCorrFin = tCaraAIni + durBloque * 0.38;
          tTornIni = tCaraAIni + durBloque * 0.45;
          tTornPop = tCaraAIni + durBloque * 0.65;
          tTornFin = tCaraAIni + durBloque * 0.95;
        } else {
          // 🎭 COREOGRAFÍA 1: SECUENCIAL POR CORREDERA (Cascada uno a uno con progresión proporcional segura)
          const tNivelIni = tCaraAIni + k * dtNivelA;
          tCorrIni = tNivelIni;
          tCorrFin = tNivelIni + dtNivelA * 0.38;
          tTornIni = tNivelIni + dtNivelA * 0.45;
          tTornPop = tNivelIni + dtNivelA * 0.65;
          tTornFin = tNivelIni + dtNivelA * 0.95;
        }

        grp.correderas.forEach((obj) => {
          const pRestA = getSafeRestPosition(obj);
          const qRestA = getSafeRestQuaternion(obj);
          const pPopA = pRestA.clone().add(new THREE.Vector3(0, ALTURA_APROX, 0));
          const pPisoVolteadaA = rotarPunto(pRestA, qRot180);
          const qFinRotA = qRot180.clone().multiply(qRestA);

          const { timesPos: tGiroPos, valsPos: vGiroPos, timesRot: tGiroRot, valsRot: vGiroRot } =
            generarMuestrasGiroArco(pRestA, qRestA);

          const scaleTimes = tCorrIni > 0.04
            ? [0, Number((tCorrIni - 0.01).toFixed(3)), Number(tCorrIni.toFixed(3)), T_PASO_TOTAL]
            : [0, Number(T_PASO_TOTAL.toFixed(3))];
          const scaleValues = tCorrIni > 0.04
            ? [0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1]
            : [1, 1, 1, 1, 1, 1];
          tracks.push(new THREE.VectorKeyframeTrack(`${obj.uuid}.scale`, scaleTimes, scaleValues, THREE.InterpolateLinear));

          const posTimes = tCorrIni > 0.01
            ? [
                0,
                Number(tCorrIni.toFixed(3)),
                Number(tCorrFin.toFixed(3)),
                T_GIRO_INI,
                ...tGiroPos,
                T_GIRO_PISO,
                T_PASO_TOTAL
              ]
            : [
                0,
                Number(tCorrFin.toFixed(3)),
                T_GIRO_INI,
                ...tGiroPos,
                T_GIRO_PISO,
                T_PASO_TOTAL
              ];
          const posValues = tCorrIni > 0.01
            ? [
                pPopA.x, pPopA.y, pPopA.z,
                pPopA.x, pPopA.y, pPopA.z,
                pRestA.x, pRestA.y, pRestA.z,
                pRestA.x, pRestA.y, pRestA.z,
                ...vGiroPos,
                pPisoVolteadaA.x, pPisoVolteadaA.y, pPisoVolteadaA.z,
                pPisoVolteadaA.x, pPisoVolteadaA.y, pPisoVolteadaA.z,
              ]
            : [
                pPopA.x, pPopA.y, pPopA.z,
                pRestA.x, pRestA.y, pRestA.z,
                pRestA.x, pRestA.y, pRestA.z,
                ...vGiroPos,
                pPisoVolteadaA.x, pPisoVolteadaA.y, pPisoVolteadaA.z,
                pPisoVolteadaA.x, pPisoVolteadaA.y, pPisoVolteadaA.z,
              ];
          tracks.push(new THREE.VectorKeyframeTrack(`${obj.uuid}.position`, posTimes, posValues, THREE.InterpolateLinear));

          const rotTimes = [
            0, Number(tCaraAFin.toFixed(3)), T_GIRO_INI,
            ...tGiroRot,
            T_GIRO_PISO, T_PASO_TOTAL
          ];
          const rotValues = [
            qRestA.x, qRestA.y, qRestA.z, qRestA.w,
            qRestA.x, qRestA.y, qRestA.z, qRestA.w,
            qRestA.x, qRestA.y, qRestA.z, qRestA.w,
            ...vGiroRot,
            qFinRotA.x, qFinRotA.y, qFinRotA.z, qFinRotA.w,
            qFinRotA.x, qFinRotA.y, qFinRotA.z, qFinRotA.w,
          ];
          tracks.push(new THREE.QuaternionKeyframeTrack(`${obj.uuid}.quaternion`, rotTimes, rotValues, THREE.InterpolateLinear));
        });

        grp.tornillos.forEach((tObj) => {
          const pRestT = getSafeRestPosition(tObj);
          const qRestT = getSafeRestQuaternion(tObj);
          const pPopT = pRestT.clone().add(new THREE.Vector3(0, ALTURA_APROX, 0));
          const pPisoVolteadaT = rotarPunto(pRestT, qRot180);

          const rotAxis = new THREE.Vector3(0, 1, 0);
          const totalAngle = Math.PI * 4;
          const q0 = qRestT.clone();
          const qMid = qRestT.clone().multiply(new THREE.Quaternion().setFromAxisAngle(rotAxis, totalAngle * 0.5));
          const qFinal = qRestT.clone().multiply(new THREE.Quaternion().setFromAxisAngle(rotAxis, totalAngle));
          const tMid = Number((tTornPop + (tTornFin - tTornPop) * 0.5).toFixed(3));
          const qFinRotT = qRot180.clone().multiply(qFinal);

          const { timesPos: tGiroPosT, valsPos: vGiroPosT, timesRot: tGiroRotT, valsRot: vGiroRotT } =
            generarMuestrasGiroArco(pRestT, qFinal);

          const scaleTimes = [
            0,
            Math.max(0, Number((tTornIni - 0.01).toFixed(3))),
            Number(tTornIni.toFixed(3)),
            Number(tTornPop.toFixed(3)),
            T_PASO_TOTAL
          ];
          const scaleValues = [
            0, 0, 0,
            0, 0, 0,
            2.0, 2.0, 2.0,
            1.0, 1.0, 1.0,
            1.0, 1.0, 1.0,
          ];
          tracks.push(new THREE.VectorKeyframeTrack(`${tObj.uuid}.scale`, scaleTimes, scaleValues, THREE.InterpolateLinear));

          const posTimes = [
            0,
            Number(tTornIni.toFixed(3)),
            Number(tTornPop.toFixed(3)),
            Number(tTornFin.toFixed(3)),
            T_GIRO_INI,
            ...tGiroPosT,
            T_GIRO_PISO,
            T_PASO_TOTAL
          ];
          const posValues = [
            pPopT.x, pPopT.y, pPopT.z,
            pPopT.x, pPopT.y, pPopT.z,
            pPopT.x, pPopT.y, pPopT.z,
            pRestT.x, pRestT.y, pRestT.z,
            pRestT.x, pRestT.y, pRestT.z,
            ...vGiroPosT,
            pPisoVolteadaT.x, pPisoVolteadaT.y, pPisoVolteadaT.z,
            pPisoVolteadaT.x, pPisoVolteadaT.y, pPisoVolteadaT.z,
          ];
          tracks.push(new THREE.VectorKeyframeTrack(`${tObj.uuid}.position`, posTimes, posValues, THREE.InterpolateLinear));

          const rotTimes = [
            0,
            Number(tTornPop.toFixed(3)),
            tMid,
            Number(tTornFin.toFixed(3)),
            T_GIRO_INI,
            ...tGiroRotT,
            T_GIRO_PISO, T_PASO_TOTAL
          ];
          const rotValues = [
            q0.x, q0.y, q0.z, q0.w,
            q0.x, q0.y, q0.z, q0.w,
            qMid.x, qMid.y, qMid.z, qMid.w,
            qFinal.x, qFinal.y, qFinal.z, qFinal.w,
            qFinal.x, qFinal.y, qFinal.z, qFinal.w,
            ...vGiroRotT,
            qFinRotT.x, qFinRotT.y, qFinRotT.z, qFinRotT.w,
            qFinRotT.x, qFinRotT.y, qFinRotT.z, qFinRotT.w,
          ];
          tracks.push(new THREE.QuaternionKeyframeTrack(`${tObj.uuid}.quaternion`, rotTimes, rotValues, THREE.InterpolateLinear));
        });
      });

      // ANIMACIÓN CARA B (Fijada entre T_CORRB_INI y T_CORRB_FIN_GLOBAL)
      const durCaraB = Math.max(0.5, T_CORRB_FIN_GLOBAL - T_CORRB_INI);
      const KB = Math.max(1, gruposCaraB.length);
      const dtNivelB = durCaraB / KB;

      gruposCaraB.forEach((grp, k) => {
        let tCorrIni: number;
        let tCorrFin: number;
        let tTornIni: number;
        let tTornPop: number;
        let tTornFin: number;

        if (coreoPaso === 2) {
          // 🎭 COREOGRAFÍA 2: SIMULTÁNEA EN BLOQUE (Todas las correderas de Cara B bajan juntas, luego tornillos juntos)
          const durBloque = durCaraB;
          tCorrIni = T_CORRB_INI;
          tCorrFin = T_CORRB_INI + durBloque * 0.38;
          tTornIni = T_CORRB_INI + durBloque * 0.45;
          tTornPop = T_CORRB_INI + durBloque * 0.65;
          tTornFin = T_CORRB_INI + durBloque * 0.95;
        } else {
          // 🎭 COREOGRAFÍA 1: SECUENCIAL POR CORREDERA (Cascada uno a uno con progresión proporcional segura)
          const tNivelIni = T_CORRB_INI + k * dtNivelB;
          tCorrIni = tNivelIni;
          tCorrFin = tNivelIni + dtNivelB * 0.38;
          tTornIni = tNivelIni + dtNivelB * 0.45;
          tTornPop = tNivelIni + dtNivelB * 0.65;
          tTornFin = tNivelIni + dtNivelB * 0.95;
        }

        grp.correderas.forEach((obj) => {
          const pRestB_orig = getSafeRestPosition(obj);
          const qRestB_orig = getSafeRestQuaternion(obj);

          const pDestinoB = rotarPunto(pRestB_orig, qRot180);
          const qDestinoB = qRot180.clone().multiply(qRestB_orig);
          const pPopB = pDestinoB.clone().add(new THREE.Vector3(0, ALTURA_APROX, 0));

          const scaleTimes = [0, Math.max(0, Number((tCorrIni - 0.01).toFixed(3))), Number(tCorrIni.toFixed(3)), T_PASO_TOTAL];
          const scaleValues = [0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1];
          tracks.push(new THREE.VectorKeyframeTrack(`${obj.uuid}.scale`, scaleTimes, scaleValues, THREE.InterpolateLinear));

          const posTimes = [0, Number(tCorrIni.toFixed(3)), Number(tCorrFin.toFixed(3)), T_PASO_TOTAL];
          const posValues = [
            pPopB.x, pPopB.y, pPopB.z,
            pPopB.x, pPopB.y, pPopB.z,
            pDestinoB.x, pDestinoB.y, pDestinoB.z,
            pDestinoB.x, pDestinoB.y, pDestinoB.z,
          ];
          tracks.push(new THREE.VectorKeyframeTrack(`${obj.uuid}.position`, posTimes, posValues, THREE.InterpolateLinear));

          const rotTimes = [0, Number(tCorrIni.toFixed(3)), T_PASO_TOTAL];
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

          const scaleTimes = [
            0,
            Math.max(0, Number((tTornIni - 0.01).toFixed(3))),
            Number(tTornIni.toFixed(3)),
            Number(tTornPop.toFixed(3)),
            T_PASO_TOTAL
          ];
          const scaleValues = [
            0, 0, 0,
            0, 0, 0,
            2.0, 2.0, 2.0,
            1.0, 1.0, 1.0,
            1.0, 1.0, 1.0,
          ];
          tracks.push(new THREE.VectorKeyframeTrack(`${tObj.uuid}.scale`, scaleTimes, scaleValues, THREE.InterpolateLinear));

          const posTimes = [
            0,
            Number(tTornIni.toFixed(3)),
            Number(tTornPop.toFixed(3)),
            Number(tTornFin.toFixed(3)),
            T_PASO_TOTAL
          ];
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
          const tMid = Number((tTornPop + (tTornFin - tTornPop) * 0.5).toFixed(3));

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
        // 🎭 COREOGRAFÍA 1: SECUENCIAL POR CORREDERA (Cascada uno a uno con progresión proporcional segura)
        const dtNivel = tSubDur / K;
        gruposNivel.forEach((grp, k) => {
          const tNivelIni = tSubIni + k * dtNivel;
          const tCorrIni = tNivelIni;
          const tCorrFin = tNivelIni + dtNivel * 0.38;
          const tTornIni = tNivelIni + dtNivel * 0.45;
          const tTornPop = tNivelIni + dtNivel * 0.65;
          const tTornFin = tNivelIni + dtNivel * 0.95;

          grp.correderas.forEach((obj) => {
            const pRest = getSafeRestPosition(obj);
            const pPop = pRest.clone().add(new THREE.Vector3(0, ALTURA_APROX, 0));

            const scaleTimes = tCorrIni > 0.04
              ? [0, Number((tCorrIni - 0.01).toFixed(3)), Number(tCorrIni.toFixed(3)), T_PASO_TOTAL]
              : [0, Number(T_PASO_TOTAL.toFixed(3))];
            const scaleValues = tCorrIni > 0.04
              ? [0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1]
              : [1, 1, 1, 1, 1, 1];
            tracks.push(new THREE.VectorKeyframeTrack(`${obj.uuid}.scale`, scaleTimes, scaleValues, THREE.InterpolateLinear));

            const posTimes = tCorrIni > 0.01
              ? [0, Number(tCorrIni.toFixed(3)), Number(tCorrFin.toFixed(3)), T_PASO_TOTAL]
              : [0, Number(tCorrFin.toFixed(3)), T_PASO_TOTAL];
            const posValues = tCorrIni > 0.01
              ? [
                  pPop.x, pPop.y, pPop.z,
                  pPop.x, pPop.y, pPop.z,
                  pRest.x, pRest.y, pRest.z,
                  pRest.x, pRest.y, pRest.z,
                ]
              : [
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

            const scaleTimes = [
              0,
              Math.max(0, Number((tTornIni - 0.01).toFixed(3))),
              Number(tTornIni.toFixed(3)),
              Number(tTornPop.toFixed(3)),
              T_PASO_TOTAL
            ];
            const scaleValues = [
              0, 0, 0,
              0, 0, 0,
              2.0, 2.0, 2.0,
              1.0, 1.0, 1.0,
              1.0, 1.0, 1.0,
            ];
            tracks.push(new THREE.VectorKeyframeTrack(`${tObj.uuid}.scale`, scaleTimes, scaleValues, THREE.InterpolateLinear));

            const posTimes = [0, Number(tTornIni.toFixed(3)), Number(tTornPop.toFixed(3)), Number(tTornFin.toFixed(3)), T_PASO_TOTAL];
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
            const tRotMid = Number((tTornPop + (tTornFin - tTornPop) * 0.5).toFixed(3));

            const rotTimes = [0, Number(tTornPop.toFixed(3)), tRotMid, Number(tTornFin.toFixed(3)), T_PASO_TOTAL];
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
        // 🎭 COREOGRAFÍA 2: SIMULTÁNEA EN BLOQUE (Todas las correderas bajan juntas, luego todos los tornillos juntos)
        const durBloque = tSubDur;
        const tCorrIni = tSubIni;
        const tCorrFin = tSubIni + durBloque * 0.38;
        const tTornIni = tSubIni + durBloque * 0.45;
        const tTornPop = tSubIni + durBloque * 0.65;
        const tTornFin = tSubIni + durBloque * 0.95;

        correderas.forEach((obj) => {
          const pRest = getSafeRestPosition(obj);
          const pPop = pRest.clone().add(new THREE.Vector3(0, ALTURA_APROX, 0));

          const scaleTimes = tCorrIni > 0.04
            ? [0, Number((tCorrIni - 0.01).toFixed(3)), Number(tCorrIni.toFixed(3)), T_PASO_TOTAL]
            : [0, Number(T_PASO_TOTAL.toFixed(3))];
          const scaleValues = tCorrIni > 0.04
            ? [0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1]
            : [1, 1, 1, 1, 1, 1];
          tracks.push(new THREE.VectorKeyframeTrack(`${obj.uuid}.scale`, scaleTimes, scaleValues, THREE.InterpolateLinear));

          const posTimes = tCorrIni > 0.01
            ? [0, Number(tCorrIni.toFixed(3)), Number(tCorrFin.toFixed(3)), T_PASO_TOTAL]
            : [0, Number(tCorrFin.toFixed(3)), T_PASO_TOTAL];
          const posValues = tCorrIni > 0.01
            ? [
                pPop.x, pPop.y, pPop.z,
                pPop.x, pPop.y, pPop.z,
                pRest.x, pRest.y, pRest.z,
                pRest.x, pRest.y, pRest.z,
              ]
            : [
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

          const scaleTimes = [
            0,
            Math.max(0, Number((tTornIni - 0.01).toFixed(3))),
            Number(tTornIni.toFixed(3)),
            Number(tTornPop.toFixed(3)),
            T_PASO_TOTAL
          ];
          const scaleValues = [
            0, 0, 0,
            0, 0, 0,
            2.0, 2.0, 2.0,
            1.0, 1.0, 1.0,
            1.0, 1.0, 1.0,
          ];
          tracks.push(new THREE.VectorKeyframeTrack(`${tObj.uuid}.scale`, scaleTimes, scaleValues, THREE.InterpolateLinear));

          const posTimes = [0, Number(tTornIni.toFixed(3)), Number(tTornPop.toFixed(3)), Number(tTornFin.toFixed(3)), T_PASO_TOTAL];
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
          const tRotMid = Number((tTornPop + (tTornFin - tTornPop) * 0.5).toFixed(3));

          const rotTimes = [0, Number(tTornPop.toFixed(3)), tRotMid, Number(tTornFin.toFixed(3)), T_PASO_TOTAL];
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

    // 🪵 5. ACTO 5: ANIMACIÓN DE TARUGOS (CAVILHAS) (11.40s -> 12.90s -> 13.50s)
    // Emergen a 20 cm en el plano XY a lo largo del eje Y (positivo o negativo según ubicación) y se insertan
    if (tarugos.length > 0) {
      tarugos.forEach((tarugoObj) => {
        const pRest = getSafeRestPosition(tarugoObj);
        const qRest = getSafeRestQuaternion(tarugoObj);
        const hwName = (tarugoObj.userData?.cleanName || tarugoObj.name || "").toLowerCase();

        let pFinal = pRest.clone();
        let qFinal = qRest.clone();

        if (tieneDosCaras) {
          // La pieza P02B giró 180° sobre eje Z concéntrico y reposa en el piso volteada
          pFinal = rotarPunto(pRest, qRot180);
          qFinal = qRot180.clone().multiply(qRest);
        }

        // 🎯 Eje longitudinal del plano de la mesa (Eje Z en Three.js / Eje Y en Rhino-plano):
        // 🛡️ Inmutabilidad absoluta en X (ancho) y en Y (altura vertical de la perforación):
        // - Franja del borde superior (fondo): se mueven en dirección Y1 a Y0 (desde el fondo hacia el canto)
        // - Par de tarugos del borde inferior de P03B (frente): se mueven en dirección Y0 a Y1 (desde el frente hacia el canto)
        const zCentroMadera = centroMadera.z;
        const dirOffsetZ = pFinal.z < zCentroMadera ? -DISTANCIA_TARUGO_M : DISTANCIA_TARUGO_M;

        const pAparicion = new THREE.Vector3(
          pFinal.x, // Cero movimiento en X
          pFinal.y, // Cero movimiento en altura vertical: perfectamente alineado con la perforación
          pFinal.z + dirOffsetZ // Desplazamiento exclusivo longitudinal entrando al canto
        );

        // 1. Escala: Oculto antes de T_TARUGOS_INI, Pop-In en T_TARUGOS_POP y visible hasta el final
        const scaleTimes = [0, T_TARUGOS_INI, T_TARUGOS_POP, T_PASO_TOTAL];
        const scaleValues = [
          0, 0, 0,
          0, 0, 0,
          1, 1, 1,
          1, 1, 1,
        ];
        tracks.push(new THREE.VectorKeyframeTrack(`${tarugoObj.uuid}.scale`, scaleTimes, scaleValues, THREE.InterpolateLinear));

        // 2. Posición: Emerge a 20 cm en el plano, avanza colinealmente y se inserta en pFinal
        const posTimes = [0, T_TARUGOS_INI, T_TARUGOS_POP, T_TARUGOS_FIN, T_PASO_TOTAL];
        const posValues = [
          pAparicion.x, pAparicion.y, pAparicion.z,
          pAparicion.x, pAparicion.y, pAparicion.z,
          pAparicion.x, pAparicion.y, pAparicion.z,
          pFinal.x, pFinal.y, pFinal.z,
          pFinal.x, pFinal.y, pFinal.z,
        ];
        tracks.push(new THREE.VectorKeyframeTrack(`${tarugoObj.uuid}.position`, posTimes, posValues, THREE.InterpolateLinear));

        // 3. Rotación: Orientación fija concéntrica
        const rotTimes = [0, T_TARUGOS_INI, T_PASO_TOTAL];
        const rotValues = [
          qFinal.x, qFinal.y, qFinal.z, qFinal.w,
          qFinal.x, qFinal.y, qFinal.z, qFinal.w,
          qFinal.x, qFinal.y, qFinal.z, qFinal.w,
        ];
        tracks.push(new THREE.QuaternionKeyframeTrack(`${tarugoObj.uuid}.quaternion`, rotTimes, rotValues, THREE.InterpolateLinear));
      });
    }
  });
}
