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
import { use3BFStore } from "../store";
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
  isHardwareMeshName,
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
 * Crea un QuaternionKeyframeTrack sanitizado sin marcas de tiempo duplicadas.
 */
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

const qIdentitySanitizado = new THREE.Quaternion(0, 0, 0, 1);

/**
 * 🔄 Resuelve el estado rotacional rígido exacto de un tablero o herraje a cualquier tiempo t.
 * Interpola el cuaternión esféricamente (slerp) y deriva la matriz rotacional exacta,
 * eliminando al 100% la desviación de cuerda y la pérdida de cohesión geométrica.
 */
function evaluarGiroTableroAtTime(
  t: number,
  tieneRotacion: boolean,
  qGiro: THREE.Quaternion,
  tRotStart: number,
  tRotEnd: number
): { qCurGiro: THREE.Quaternion; matCurGiro: THREE.Matrix4 } {
  if (!tieneRotacion) {
    return {
      qCurGiro: qIdentitySanitizado.clone(),
      matCurGiro: new THREE.Matrix4(),
    };
  }
  if (t <= tRotStart) {
    return {
      qCurGiro: qGiro.clone(),
      matCurGiro: new THREE.Matrix4().makeRotationFromQuaternion(qGiro),
    };
  }
  if (t >= tRotEnd) {
    return {
      qCurGiro: qIdentitySanitizado.clone(),
      matCurGiro: new THREE.Matrix4(),
    };
  }
  const alpha = (t - tRotStart) / Math.max(0.001, tRotEnd - tRotStart);
  const qCurGiro = qGiro.clone().slerp(qIdentitySanitizado, alpha);
  const matCurGiro = new THREE.Matrix4().makeRotationFromQuaternion(qCurGiro);
  return { qCurGiro, matCurGiro };
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
 * 🎯 Determina si dos nombres de tablero corresponden a la misma instancia física,
 * distinguiendo estrictamente instancias numeradas (1) y (2).
 */
export function sonMismoTableroOInstancia(a?: string | null, b?: string | null): boolean {
  if (!a || !b) return false;
  const aLow = a.replace(/^RH_OUT:/i, "").trim().toLowerCase();
  const bLow = b.replace(/^RH_OUT:/i, "").trim().toLowerCase();
  if (aLow === bLow) return true;

  const matchA = aLow.match(/\((\d+)\)/);
  const matchB = bLow.match(/\((\d+)\)/);

  if (matchA || matchB) {
    return Boolean(
      matchA &&
      matchB &&
      matchA[1] === matchB[1] &&
      perteneceAMismaFamiliaPieza(aLow, bLow)
    );
  }

  return perteneceAMismaFamiliaPieza(aLow, bLow);
}

/**
 * 🎯 Determina si una malla de la escena corresponde unívocamente a un tablero de capa,
 * respetando la discriminación atómica de instancias (1), (2), etc.
 */
export function coincideMallaConTablero(
  tabTargetLow: string,
  cn: string,
  pm: string,
  ik: string
): boolean {
  if (ik === tabTargetLow || cn === tabTargetLow) {
    return true;
  }

  const matchTarget = tabTargetLow.match(/\((\d+)\)/);
  const matchMesh = ik.match(/\((\d+)\)/) || cn.match(/\((\d+)\)/);

  if (matchTarget) {
    // Si el tablero es una instancia específica (ej. "Peça 14 (1)"):
    if (matchMesh) {
      return matchMesh[1] === matchTarget[1] && perteneceAMismaFamiliaPieza(cn, tabTargetLow);
    }
    return false;
  }

  // Si el tablero es genérico sin número (ej. "Peça 1"):
  if (matchMesh) {
    return perteneceAMismaFamiliaPieza(cn, tabTargetLow) || perteneceAMismaFamiliaPieza(pm, tabTargetLow);
  }

  return pm === tabTargetLow || perteneceAMismaFamiliaPieza(cn, tabTargetLow) || perteneceAMismaFamiliaPieza(pm, tabTargetLow);
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

  // 📐 Transformación de elevación vertical mundial (Y-Up Three.js) al espacio local del contenedor (consistente con orientacionBanco)
  const rotBanco = paso.orientacionBanco?.rotacion || mpConfig.orientacionBanco?.rotacion || [0, 0, 0];
  const radX = THREE.MathUtils.degToRad(rotBanco[0] || 0);
  const radY = THREE.MathUtils.degToRad(rotBanco[1] || 0);
  const radZ = THREE.MathUtils.degToRad(rotBanco[2] || 0);
  const rotMat = new THREE.Matrix4().makeRotationFromEuler(new THREE.Euler(radX, radY, radZ, "XYZ"));
  const invRotMat = rotMat.clone().invert();

  const calcularVectorElevacionLocal = (elevacionCm?: number): THREE.Vector3 => {
    const elevM = (elevacionCm || 0) / 100;
    if (Math.abs(elevM) <= 0.0001) return new THREE.Vector3(0, 0, 0);
    return new THREE.Vector3(0, elevM, 0).applyMatrix4(invRotMat);
  };

  // 🛡️ Mapa unívoco de pistas de animación por nombre de propiedad (Garantía de unicidad total Three.js)
  const tracksMap = new Map<string, THREE.KeyframeTrack>();
  const agregarTrack = (track: THREE.KeyframeTrack) => {
    tracksMap.set(track.name, track);
  };
  const mallasAnimadasEnCapas = new Set<string>();

  // Mapear todas las piezas y herrajes asignados en cualquier capa
  const piezasAsignadasSet = new Set<string>();
  const herrajesAsignadosSet = new Set<string>();

  capas.forEach((capa) => {
    (capa.tableros || []).forEach((t) => piezasAsignadasSet.add(t.id.toLowerCase().trim()));
    (capa.herrajes || []).forEach((h) => herrajesAsignadosSet.add(h.id.toLowerCase().trim()));
    (capa.congelados || []).forEach((c) => herrajesAsignadosSet.add(c.id.toLowerCase().trim()));
  });

  // 👑 RESOLVER SUBENSAMBLES DE PIEZA MASTER CON OFFSET DE BANCO Y ACOPLE FINAL
  interface MasterSubensambleConfig {
    masterId: string;
    vOffset: THREE.Vector3;
    tAcople: number;
    duracionAcople: number;
    tFinAcople: number;
  }

  const mastersMap = new Map<string, MasterSubensambleConfig>();

  // 1. Recolectar todos los destinos referenciados por tableros de cualquier capa
  const destinosReferenciados = new Set<string>();
  capas.forEach((c) => {
    (c.tableros || []).forEach((t) => {
      const d = (t.destinoId || "").replace(/^RH_OUT:/i, "").trim().toLowerCase();
      if (d && d !== "base_master") {
        destinosReferenciados.add(d);
      }
    });
  });

  // Helper para resolver los tiempos de acople del subensamble activo según acopleHeredados
  const resolverTiemposAcopleSubensamble = (c: CapaMultiplePlus): { tAcople: number; durAcople: number; tFinAcople: number } => {
    const modoAcople = mpConfig.acopleHeredados?.modo;
    if (modoAcople === "recien_armado_a_heredado") {
      const tAcople = typeof mpConfig.acopleHeredados?.tiempoInicio === "number"
        ? mpConfig.acopleHeredados.tiempoInicio
        : (typeof c.tiempoAcopleSegundos === "number" && c.tiempoAcopleSegundos > 0 ? c.tiempoAcopleSegundos : Math.max(0.5, duracionPaso - 2.5));
      const durAcople = Math.max(0.2, mpConfig.acopleHeredados?.duracion ?? c.duracionAcopleSegundos ?? 2.0);
      const tFinAcople = Math.min(duracionPaso, tAcople + durAcople);
      return { tAcople, durAcople, tFinAcople };
    }
    if (modoAcople === "heredado_a_recien_armado" || modoAcople === "acoplarse_a_paso") {
      // La carcasa viaja hacia el subensamble, por lo tanto el subensamble permanece en vOff en banco
      return { tAcople: duracionPaso + 1000, durAcople: 0.001, tFinAcople: duracionPaso + 1000 };
    }
    // Modo "fijo": respeta si la capa tenía acople propio explícito o se queda en banco
    if (typeof c.tiempoAcopleSegundos === "number" && c.tiempoAcopleSegundos > 0) {
      const durAcople = Math.max(0.2, c.duracionAcopleSegundos || 2.0);
      return { tAcople: c.tiempoAcopleSegundos, durAcople, tFinAcople: Math.min(duracionPaso, c.tiempoAcopleSegundos + durAcople) };
    }
    return { tAcople: duracionPaso + 1000, durAcople: 0.001, tFinAcople: duracionPaso + 1000 };
  };

  // 2. Poblar mastersMap detectando masters explícitas (capa.piezaMaster) o implícitas (destinoId / base_master)
  capas.forEach((c) => {
    // A) Si la capa tiene piezaMaster explícita
    if (c.piezaMaster) {
      const mClean = c.piezaMaster.replace(/^RH_OUT:/i, "").trim().toLowerCase();
      let vOff = new THREE.Vector3(0, 0, 0);
      if (c.offsetBancoCm) {
        vOff.set(
          (c.offsetBancoCm.x || 0) / 100,
          (c.offsetBancoCm.y || 0) / 100,
          (c.offsetBancoCm.z || 0) / 100
        );
      }
      let tabMaster: TableroCapaPlus | undefined = undefined;
      if (vOff.lengthSq() <= 0.00001) {
        tabMaster = (c.tableros || []).find((t) =>
          sonMismoTableroOInstancia(t.id, mClean)
        );
        if (tabMaster && ((tabMaster.offsetXCm || 0) !== 0 || (tabMaster.offsetYCm || 0) !== 0 || (tabMaster.offsetZCm || 0) !== 0 || (tabMaster.elevacionZCm || 0) !== 0)) {
          vOff.set(
            (tabMaster.offsetXCm || 0) / 100,
            (tabMaster.offsetYCm || 0) / 100,
            (tabMaster.offsetZCm || 0) / 100
          ).add(calcularVectorElevacionLocal(tabMaster.elevacionZCm));
        }
      } else {
        tabMaster = (c.tableros || []).find((t) =>
          sonMismoTableroOInstancia(t.id, mClean)
        );
      }

      if (vOff.lengthSq() > 0.00001) {
        let { tAcople, durAcople, tFinAcople } = resolverTiemposAcopleSubensamble(c);
        if (tabMaster && typeof tabMaster.tiempoInicioMovimiento === "number" && tabMaster.tiempoInicioMovimiento < duracionPaso) {
          tAcople = tabMaster.tiempoInicioMovimiento;
          const distV = vOff.length();
          durAcople = Math.max(0.2, distV > 0.001 ? distV / velocidadTablerosM_s : 0.5);
          tFinAcople = Math.min(duracionPaso, tAcople + durAcople);
        }

        mastersMap.set(mClean, {
          masterId: mClean,
          vOffset: vOff,
          tAcople,
          duracionAcople: durAcople,
          tFinAcople,
        });
      }
    }

    // B) Tableros que son el destino hacia el que apuntan explícitamente otras piezas
    (c.tableros || []).forEach((t) => {
      const tIdClean = t.id.replace(/^RH_OUT:/i, "").trim().toLowerCase();
      const esDestinoDeOtras = destinosReferenciados.has(tIdClean) ||
        Array.from(destinosReferenciados).some((d) => sonMismoTableroOInstancia(tIdClean, d));

      // Solo registrar en mastersMap si otras piezas apuntan explícitamente a este tablero
      if (esDestinoDeOtras && !mastersMap.has(tIdClean)) {
        let vOff = new THREE.Vector3(0, 0, 0);
        if (c.offsetBancoCm && ((c.offsetBancoCm.x || 0) !== 0 || (c.offsetBancoCm.y || 0) !== 0 || (c.offsetBancoCm.z || 0) !== 0)) {
          vOff.set(
            (c.offsetBancoCm.x || 0) / 100,
            (c.offsetBancoCm.y || 0) / 100,
            (c.offsetBancoCm.z || 0) / 100
          );
        } else if ((t.offsetXCm || 0) !== 0 || (t.offsetYCm || 0) !== 0 || (t.offsetZCm || 0) !== 0 || (t.elevacionZCm || 0) !== 0) {
          vOff.set(
            (t.offsetXCm || 0) / 100,
            (t.offsetYCm || 0) / 100,
            (t.offsetZCm || 0) / 100
          ).add(calcularVectorElevacionLocal(t.elevacionZCm));
        }

        if (vOff.lengthSq() > 0.00001) {
          const { tAcople, durAcople, tFinAcople } = resolverTiemposAcopleSubensamble(c);

          mastersMap.set(tIdClean, {
            masterId: tIdClean,
            vOffset: vOff,
            tAcople,
            duracionAcople: durAcople,
            tFinAcople,
          });
        }
      }
    });
  });

  const resolverMasterConfigParaCapa = (capaItem: CapaMultiplePlus): MasterSubensambleConfig | null => {
    if (capaItem.piezaMaster) {
      const mClean = capaItem.piezaMaster.replace(/^RH_OUT:/i, "").trim().toLowerCase();
      if (mastersMap.has(mClean)) return mastersMap.get(mClean)!;
      for (const [key, conf] of mastersMap.entries()) {
        if (sonMismoTableroOInstancia(mClean, key)) {
          return conf;
        }
      }
    }
    return null;
  };

  const resolverMasterConfigParaTablero = (tableroItem: TableroCapaPlus, capaItem: CapaMultiplePlus): MasterSubensambleConfig | null => {
    const tIdLow = tableroItem.id.replace(/^RH_OUT:/i, "").trim().toLowerCase();
    const destLow = (tableroItem.destinoId || "").replace(/^RH_OUT:/i, "").trim().toLowerCase();

    // 1. Si el destino del tablero apunta a un tablero o bloque específico que NO sea base_master
    if (destLow && destLow !== "base_master") {
      if (mastersMap.has(destLow)) return mastersMap.get(destLow)!;
      for (const [key, conf] of mastersMap.entries()) {
        if (sonMismoTableroOInstancia(destLow, key)) {
          return conf;
        }
      }
      // 🛡️ Si destLow apunta a un tablero concreto (ej. "Peça 17 (6)") que no está en mastersMap
      // (porque está quieto en el banco sin offset), su destino ES ese tablero en su posición de ensamble.
      // Retorna null para que viaje de forma directa e independiente hacia (0,0,0).
      return null;
    }

    // 2. Si el propio tablero es una Master registrada (es el destino hacia el que viajan otras piezas)
    if (mastersMap.has(tIdLow)) return mastersMap.get(tIdLow)!;
    for (const [key, conf] of mastersMap.entries()) {
      if (sonMismoTableroOInstancia(tIdLow, key)) {
        return conf;
      }
    }

    // 3. Si el tablero dice "base_master" o no tiene destino:
    // Solo debe heredar master si la capa tiene piezaMaster explícitamente fijada por el usuario (capaItem.piezaMaster)
    if (capaItem.piezaMaster) {
      const mClean = capaItem.piezaMaster.replace(/^RH_OUT:/i, "").trim().toLowerCase();
      if (mastersMap.has(mClean)) return mastersMap.get(mClean)!;
      for (const [key, conf] of mastersMap.entries()) {
        if (sonMismoTableroOInstancia(mClean, key)) {
          return conf;
        }
      }
    }

    return null;
  };

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

      // 📐 Baricentro geométrico colectivo de las mallas del tablero en espacio local
      const boxTableroLocal = new THREE.Box3();
      matchingMeshes.forEach((tm) => {
        const pR = getSafeRestPosition(tm);
        const qR = getSafeRestQuaternion(tm);
        if (tm.geometry) {
          if (!tm.geometry.boundingBox) tm.geometry.computeBoundingBox();
          if (tm.geometry.boundingBox) {
            const bGeom = tm.geometry.boundingBox.clone();
            const matRest = new THREE.Matrix4().compose(pR, qR, new THREE.Vector3(1, 1, 1));
            bGeom.applyMatrix4(matRest);
            boxTableroLocal.union(bGeom);
          }
        }
      });
      const centroTableroLocal = new THREE.Vector3();
      if (!boxTableroLocal.isEmpty()) {
        boxTableroLocal.getCenter(centroTableroLocal);
      } else if (matchingMeshes.length > 0) {
        centroTableroLocal.copy(getSafeRestPosition(matchingMeshes[0]));
      }

      // 🔄 Matriz y Cuaternión de Giro 3D en ángulos cerrados (0°, 90°, 180°, -90°)
      const rotX = tablero.rotacionGrados?.[0] || 0;
      const rotY = tablero.rotacionGrados?.[1] || 0;
      const rotZ = tablero.rotacionGrados?.[2] || 0;
      const tieneRotacion = rotX !== 0 || rotY !== 0 || rotZ !== 0;

      const radRx = THREE.MathUtils.degToRad(rotX);
      const radRy = THREE.MathUtils.degToRad(rotY);
      const radRz = THREE.MathUtils.degToRad(rotZ);
      const eulerGiro = new THREE.Euler(radRx, radRy, radRz, "XYZ");
      const qGiro = new THREE.Quaternion().setFromEuler(eulerGiro);
      const matGiro = new THREE.Matrix4().makeRotationFromEuler(eulerGiro);

      matchingMeshes.forEach((mesh) => {
        mallasAnimadasEnCapas.add(mesh.uuid);
        const pRest = getSafeRestPosition(mesh);
        const qRest = getSafeRestQuaternion(mesh);

        // Si la capa está apagada, ocultar por completo
        if (!capaVisible) {
          agregarTrack(
            crearTrackEscalaSanitizado(`${mesh.uuid}.scale`, [0, duracionPaso], [0, 0, 0, 0, 0, 0])
          );
          return;
        }

        const masterConf = resolverMasterConfigParaTablero(tablero, capa);
        const vMaster = masterConf ? masterConf.vOffset : new THREE.Vector3(0, 0, 0);
        const tieneMasterOffset = masterConf !== null && vMaster.lengthSq() > 0.00001;

        let esLaPropiaMaster = false;
        let esHijaDelMaster = false;

        const destLowTab = (tablero.destinoId || "").replace(/^RH_OUT:/i, "").trim().toLowerCase();

        if (tieneMasterOffset && masterConf) {
          const mId = masterConf.masterId;
          if (sonMismoTableroOInstancia(tabTargetLow, mId)) {
            // Solo es la propia master si NO apunta a otra pieza externa como destino
            if (!destLowTab || destLowTab === "base_master") {
              esLaPropiaMaster = true;
            } else {
              esLaPropiaMaster = false;
            }
          } else if (sonMismoTableroOInstancia(destLowTab, mId)) {
            esHijaDelMaster = true;
          } else if (capa.piezaMaster && sonMismoTableroOInstancia(capa.piezaMaster, mId) && (!destLowTab || destLowTab === "base_master")) {
            esHijaDelMaster = true;
          } else {
            esHijaDelMaster = false;
          }
        }

        // Offsets propios del tablero
        const offX = (tablero.offsetXCm || 0) / 100;
        const offY = (tablero.offsetYCm || 0) / 100;
        const offZ = (tablero.offsetZCm || 0) / 100;
        const vElevLocal = calcularVectorElevacionLocal(tablero.elevacionZCm);
        const vPropio = new THREE.Vector3(offX, offY, offZ).add(vElevLocal);
        const tieneOffsetPropio = vPropio.lengthSq() > 0.00001;

        // Tiempos
        const tAparicion = Math.max(0, tablero.tiempoAparicion || 0);
        const tInicioMov = typeof tablero.tiempoInicioMovimiento === "number" ? tablero.tiempoInicioMovimiento : 500;

        // Pista de Escala
        if (tAparicion >= duracionPaso) {
          agregarTrack(
            crearTrackEscalaSanitizado(`${mesh.uuid}.scale`, [0, duracionPaso], [0, 0, 0, 0, 0, 0])
          );
        } else if (tAparicion > 0) {
          const tPre = Math.max(0, tAparicion - 0.02);
          const sTimes = [0, tPre, tAparicion, duracionPaso];
          const sVals = [0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1];
          agregarTrack(crearTrackEscalaSanitizado(`${mesh.uuid}.scale`, sTimes, sVals));
        } else {
          agregarTrack(
            crearTrackEscalaSanitizado(`${mesh.uuid}.scale`, [0, duracionPaso], [1, 1, 1, 1, 1, 1])
          );
        }

        // 📐 Resolver posición de llegada (destino)
        let vLlegada = new THREE.Vector3(0, 0, 0);
        if (destLowTab && destLowTab !== "base_master") {
          const tabDest = (capa.tableros || []).find((t) => sonMismoTableroOInstancia(t.id, destLowTab));
          if (tabDest) {
            const dOffX = (tabDest.offsetXCm || 0) / 100;
            const dOffY = (tabDest.offsetYCm || 0) / 100;
            const dOffZ = (tabDest.offsetZCm || 0) / 100;
            const dElev = calcularVectorElevacionLocal(tabDest.elevacionZCm);
            vLlegada.set(dOffX, dOffY, dOffZ).add(dElev);
          }
        }

        // 📐 Función Evaluadora de Desplazamiento del Tablero
        let evaluarDeltaTablero: (t: number) => THREE.Vector3;
        let pTimes: number[] = [];
        let tLlegadaFinal = duracionPaso;

        if (!tieneMasterOffset || (!esLaPropiaMaster && !esHijaDelMaster)) {
          if (tInicioMov >= duracionPaso || vPropio.distanceToSquared(vLlegada) <= 0.00001) {
            evaluarDeltaTablero = (_t: number) => (tieneOffsetPropio ? vPropio.clone() : vLlegada.clone());
            pTimes = [0, duracionPaso];
          } else {
            const distViaje = vPropio.distanceTo(vLlegada);
            const tViaje = Math.max(0.2, distViaje > 0.001 ? distViaje / velocidadTablerosM_s : 0.5);
            const tLlegada = Math.min(duracionPaso, tInicioMov + tViaje);
            tLlegadaFinal = tLlegada;
            evaluarDeltaTablero = (t: number) => {
              if (t <= tInicioMov) return vPropio.clone();
              if (t >= tLlegada) return vLlegada.clone();
              const alpha = (t - tInicioMov) / Math.max(0.001, tLlegada - tInicioMov);
              return vPropio.clone().lerp(vLlegada, alpha);
            };
            pTimes = [0, tInicioMov, tLlegada, duracionPaso];
          }
        } else if (esLaPropiaMaster) {
          const tAcople = (typeof tablero.tiempoInicioMovimiento === "number" && tablero.tiempoInicioMovimiento < duracionPaso)
            ? tablero.tiempoInicioMovimiento
            : masterConf!.tAcople;
          const distV = vMaster.length();
          const durAcople = Math.max(0.2, distV > 0.001 ? distV / velocidadTablerosM_s : masterConf!.duracionAcople);
          const tFinAcople = Math.min(duracionPaso, tAcople + durAcople);
          tLlegadaFinal = tFinAcople;
          evaluarDeltaTablero = (t: number) => {
            if (t <= tAcople) return vMaster.clone();
            if (t >= tFinAcople) return new THREE.Vector3(0, 0, 0);
            const alpha = (t - tAcople) / Math.max(0.001, tFinAcople - tAcople);
            return vMaster.clone().lerp(new THREE.Vector3(0, 0, 0), alpha);
          };
          pTimes = [0, tAcople, tFinAcople, duracionPaso];
        } else {
          // Hija del Master (vPropio ya es el vector directo al piso guardado por el posicionador)
          const vDeltaEspera = tieneOffsetPropio ? vPropio.clone() : new THREE.Vector3(0, 0, 0);
          const distViaje = vDeltaEspera.distanceTo(vMaster);
          const tViaje = Math.max(0.2, distViaje > 0.001 ? distViaje / velocidadTablerosM_s : 0.5);
          const tLlegada = Math.min(masterConf!.tAcople, tInicioMov + tViaje);
          tLlegadaFinal = tLlegada;
          const tAcople = masterConf!.tAcople;
          const tFinAcople = masterConf!.tFinAcople;

          evaluarDeltaTablero = (t: number) => {
            if (t <= tInicioMov) return vDeltaEspera.clone();
            if (t < tLlegada) {
              const alpha = (t - tInicioMov) / Math.max(0.001, tLlegada - tInicioMov);
              return vDeltaEspera.clone().lerp(vMaster, alpha);
            }
            if (t <= tAcople) return vMaster.clone();
            if (t >= tFinAcople) return new THREE.Vector3(0, 0, 0);
            const alpha = (t - tAcople) / Math.max(0.001, tFinAcople - tAcople);
            return vMaster.clone().lerp(new THREE.Vector3(0, 0, 0), alpha);
          };
          pTimes = [0, tInicioMov, tLlegada, tAcople, tFinAcople, duracionPaso];
        }

        const tRotStart = esLaPropiaMaster ? (masterConf?.tAcople ?? tInicioMov) : tInicioMov;
        const tRotEnd = tLlegadaFinal;

        // 📐 Si el tablero rota durante su desplazamiento, sub-muestrear keyframes densos
        // a lo largo del arco rotacional para eliminar el colapso lineal de cuerdas de Three.js
        if (tieneRotacion && tRotEnd > tRotStart) {
          const durRot = tRotEnd - tRotStart;
          const numPasosRot = Math.max(30, Math.ceil(durRot / 0.04));
          for (let s = 1; s < numPasosRot; s++) {
            pTimes.push(tRotStart + (s / numPasosRot) * durRot);
          }
          pTimes = Array.from(new Set(pTimes)).sort((a, b) => a - b);
        }

        const vOffsetCentro = new THREE.Vector3().subVectors(pRest, centroTableroLocal);
        const pVals: number[] = [];
        const qVals: number[] = [];

        pTimes.forEach((t) => {
          const deltaTab = evaluarDeltaTablero(t);
          const { qCurGiro, matCurGiro } = evaluarGiroTableroAtTime(
            t,
            tieneRotacion,
            qGiro,
            tRotStart,
            tRotEnd
          );

          // 📐 Posición y orientación 100% fiel y rígida alrededor del centro de masa del tablero
          const vOffsetRot = tieneRotacion ? vOffsetCentro.clone().applyMatrix4(matCurGiro) : vOffsetCentro;
          const p = centroTableroLocal.clone().add(deltaTab).add(vOffsetRot);
          pVals.push(p.x, p.y, p.z);

          if (tieneRotacion) {
            const qCur = qCurGiro.clone().multiply(qRest);
            qVals.push(qCur.x, qCur.y, qCur.z, qCur.w);
          }
        });

        agregarTrack(crearTrackVectorSanitizado(`${mesh.uuid}.position`, pTimes, pVals));
        if (tieneRotacion) {
          agregarTrack(crearTrackQuaternionSanitizado(`${mesh.uuid}.quaternion`, pTimes, qVals));
        }
      });
    });

    // ─────────────────────────────────────────────────────────────────────────
    // 🔩 2. HERRAJES DE LA CAPA (Inserción Axial o Congelados - Solidarios al Tablero)
    // ─────────────────────────────────────────────────────────────────────────
    // 🧭 Construir referencias de tableros de esta capa para vincular barrenos geométricamente
    const tablerosCapaRefs: Array<TableroCapaReferencia & { evaluarDelta: (t: number) => THREE.Vector3; pTimes: number[] }> = [];
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
      const boxTableroLocal = new THREE.Box3();

      tMeshes.forEach((tm) => {
        const pR = getSafeRestPosition(tm);
        const qR = getSafeRestQuaternion(tm);
        const pRWorld = tm.parent ? tm.parent.localToWorld(pR.clone()) : pR.clone();
        posProm.add(pRWorld);

        if (tm.geometry) {
          if (!tm.geometry.boundingBox) tm.geometry.computeBoundingBox();
          if (tm.geometry.boundingBox) {
            const bGeom = tm.geometry.boundingBox.clone();
            const matRest = new THREE.Matrix4().compose(pR, qR, new THREE.Vector3(1, 1, 1));
            bGeom.applyMatrix4(matRest);
            boxTableroLocal.union(bGeom);
          }
        }

        const curPos = tm.position.clone();
        const curScale = tm.scale.clone();
        tm.position.copy(pR);
        tm.scale.set(1, 1, 1);
        tm.updateMatrix();
        tm.updateWorldMatrix(true, true);
        const b = new THREE.Box3().setFromObject(tm);
        tm.position.copy(curPos);
        tm.scale.copy(curScale);
        tm.updateMatrix();
        tm.updateWorldMatrix(true, true);

        if (!b.isEmpty()) {
          boxTotal.union(b);
        } else {
          boxTotal.expandByPoint(pRWorld);
        }
      });
      if (tMeshes.length > 0) {
        posProm.divideScalar(tMeshes.length);
      }

      const centroTableroLocal = new THREE.Vector3();
      if (!boxTableroLocal.isEmpty()) {
        boxTableroLocal.getCenter(centroTableroLocal);
      } else if (tMeshes.length > 0) {
        centroTableroLocal.copy(getSafeRestPosition(tMeshes[0]));
      }

      const rotX = t.rotacionGrados?.[0] || 0;
      const rotY = t.rotacionGrados?.[1] || 0;
      const rotZ = t.rotacionGrados?.[2] || 0;
      const tieneRotacion = rotX !== 0 || rotY !== 0 || rotZ !== 0;

      const radRx = THREE.MathUtils.degToRad(rotX);
      const radRy = THREE.MathUtils.degToRad(rotY);
      const radRz = THREE.MathUtils.degToRad(rotZ);
      const eulerGiro = new THREE.Euler(radRx, radRy, radRz, "XYZ");
      const qGiro = new THREE.Quaternion().setFromEuler(eulerGiro);
      const matGiro = new THREE.Matrix4().makeRotationFromEuler(eulerGiro);

      // Re-resolver evaluador del tablero para sus herrajes
      const masterConf = resolverMasterConfigParaTablero(t, capa);
      const vMaster = masterConf ? masterConf.vOffset : new THREE.Vector3(0, 0, 0);
      const tieneMasterOffset = masterConf !== null && vMaster.lengthSq() > 0.00001;

      let esLaPropiaMaster = false;
      let esHijaDelMaster = false;
      const destLowTabH = (t.destinoId || "").replace(/^RH_OUT:/i, "").trim().toLowerCase();

      if (tieneMasterOffset && masterConf) {
        const mId = masterConf.masterId;
        if (sonMismoTableroOInstancia(tLow, mId)) {
          // Solo es la propia master si NO apunta a otra pieza externa como destino
          if (!destLowTabH || destLowTabH === "base_master") {
            esLaPropiaMaster = true;
          } else {
            esLaPropiaMaster = false;
          }
        } else if (sonMismoTableroOInstancia(destLowTabH, mId)) {
          esHijaDelMaster = true;
        } else if (capa.piezaMaster && sonMismoTableroOInstancia(capa.piezaMaster, mId) && (!destLowTabH || destLowTabH === "base_master")) {
          esHijaDelMaster = true;
        } else {
          esHijaDelMaster = false;
        }
      }

      const offX = (t.offsetXCm || 0) / 100;
      const offY = (t.offsetYCm || 0) / 100;
      const offZ = (t.offsetZCm || 0) / 100;
      const vElevLocal = calcularVectorElevacionLocal(t.elevacionZCm);
      const vPropio = new THREE.Vector3(offX, offY, offZ).add(vElevLocal);
      const tieneOffsetPropio = vPropio.lengthSq() > 0.00001;
      const tInicioMov = typeof t.tiempoInicioMovimiento === "number" ? t.tiempoInicioMovimiento : 500;

      // 📐 Resolver posición de llegada (destino) del tablero para sus herrajes
      let vLlegadaTab = new THREE.Vector3(0, 0, 0);
      if (destLowTabH && destLowTabH !== "base_master") {
        const tabDest = (capa.tableros || []).find((tb) => sonMismoTableroOInstancia(tb.id, destLowTabH));
        if (tabDest) {
          const dOffX = (tabDest.offsetXCm || 0) / 100;
          const dOffY = (tabDest.offsetYCm || 0) / 100;
          const dOffZ = (tabDest.offsetZCm || 0) / 100;
          const dElev = calcularVectorElevacionLocal(tabDest.elevacionZCm);
          vLlegadaTab.set(dOffX, dOffY, dOffZ).add(dElev);
        }
      }

      let evalDelta: (time: number) => THREE.Vector3;
      let timesTab: number[] = [];
      let tLlegadaTabFinal = duracionPaso;

      if (!tieneMasterOffset || (!esLaPropiaMaster && !esHijaDelMaster)) {
        if (tInicioMov >= duracionPaso || vPropio.distanceToSquared(vLlegadaTab) <= 0.00001) {
          evalDelta = (_time: number) => (tieneOffsetPropio ? vPropio.clone() : vLlegadaTab.clone());
          timesTab = [0, duracionPaso];
        } else {
          const distViaje = vPropio.distanceTo(vLlegadaTab);
          const tViaje = Math.max(0.2, distViaje > 0.001 ? distViaje / velocidadTablerosM_s : 0.5);
          const tLlegada = Math.min(duracionPaso, tInicioMov + tViaje);
          tLlegadaTabFinal = tLlegada;
          evalDelta = (time: number) => {
            if (time <= tInicioMov) return vPropio.clone();
            if (time >= tLlegada) return vLlegadaTab.clone();
            const alpha = (time - tInicioMov) / Math.max(0.001, tLlegada - tInicioMov);
            return vPropio.clone().lerp(vLlegadaTab, alpha);
          };
          timesTab = [0, tInicioMov, tLlegada, duracionPaso];
        }
      } else if (esLaPropiaMaster) {
        const tAcople = (typeof t.tiempoInicioMovimiento === "number" && t.tiempoInicioMovimiento < duracionPaso)
          ? t.tiempoInicioMovimiento
          : masterConf!.tAcople;
        const distV = vMaster.length();
        const durAcople = Math.max(0.2, distV > 0.001 ? distV / velocidadTablerosM_s : masterConf!.duracionAcople);
        const tFinAcople = Math.min(duracionPaso, tAcople + durAcople);
        tLlegadaTabFinal = tFinAcople;
        evalDelta = (time: number) => {
          if (time <= tAcople) return vMaster.clone();
          if (time >= tFinAcople) return new THREE.Vector3(0, 0, 0);
          const alpha = (time - tAcople) / Math.max(0.001, tFinAcople - tAcople);
          return vMaster.clone().lerp(new THREE.Vector3(0, 0, 0), alpha);
        };
        timesTab = [0, tAcople, tFinAcople, duracionPaso];
      } else {
        // Hija del Master (vPropio ya es el vector directo al piso guardado por el posicionador)
        const vDeltaEspera = tieneOffsetPropio ? vPropio.clone() : new THREE.Vector3(0, 0, 0);
        const distViaje = vDeltaEspera.distanceTo(vMaster);
        const tViaje = Math.max(0.2, distViaje > 0.001 ? distViaje / velocidadTablerosM_s : 0.5);
        const tLlegada = Math.min(masterConf!.tAcople, tInicioMov + tViaje);
        tLlegadaTabFinal = tLlegada;
        const tAcople = masterConf!.tAcople;
        const tFinAcople = masterConf!.tFinAcople;

        evalDelta = (time: number) => {
          if (time <= tInicioMov) return vDeltaEspera.clone();
          if (time < tLlegada) {
            const alpha = (time - tInicioMov) / Math.max(0.001, tLlegada - tInicioMov);
            return vDeltaEspera.clone().lerp(vMaster, alpha);
          }
          if (time <= tAcople) return vMaster.clone();
          if (time >= tFinAcople) return new THREE.Vector3(0, 0, 0);
          const alpha = (time - tAcople) / Math.max(0.001, tFinAcople - tAcople);
          return vMaster.clone().lerp(new THREE.Vector3(0, 0, 0), alpha);
        };
        timesTab = [0, tInicioMov, tLlegada, tAcople, tFinAcople, duracionPaso];
      }

      const tRotStart = esLaPropiaMaster ? (masterConf?.tAcople ?? tInicioMov) : tInicioMov;
      const tRotEnd = tLlegadaTabFinal;

      // 📐 Si el tablero rota, sub-muestrear los tiempos para sincronizar rígidamente sus herrajes
      if (tieneRotacion && tRotEnd > tRotStart) {
        const durRot = tRotEnd - tRotStart;
        const numPasosRot = Math.max(30, Math.ceil(durRot / 0.04));
        for (let s = 1; s < numPasosRot; s++) {
          timesTab.push(tRotStart + (s / numPasosRot) * durRot);
        }
        timesTab = Array.from(new Set(timesTab)).sort((a, b) => a - b);
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
        elevacionZCm: t.elevacionZCm,
        rotacionGrados: t.rotacionGrados,
        tiempoInicioMovimiento: t.tiempoInicioMovimiento,
        evaluarDelta: evalDelta,
        pTimes: timesTab,
        centroLocal: centroTableroLocal,
        qGiro: qGiro,
        matGiro: matGiro,
        tieneRotacion: tieneRotacion,
        tLlegada: tLlegadaTabFinal,
        tRotStart: tRotStart,
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
        mallasAnimadasEnCapas.add(hwMesh.uuid);
        const pHwRest = getSafeRestPosition(hwMesh);
        const pHwRestWorld = hwMesh.parent ? hwMesh.parent.localToWorld(pHwRest.clone()) : pHwRest.clone();

        // Si la capa está apagada, ocultar por completo
        if (!capaVisible) {
          agregarTrack(
            crearTrackEscalaSanitizado(`${hwMesh.uuid}.scale`, [0, duracionPaso], [0, 0, 0, 0, 0, 0])
          );
          return;
        }

        const tAparicion = Math.max(0, herraje.tiempoAparicion || 0);

        // 🎯 Resolver el tablero anfitrión específico para este herraje dentro de la capa
        const tabAnfitrion = resolverTableroAnfitrionHerraje(pHwRestWorld, tablerosCapaRefs);
        const evaluarDeltaHw = tabAnfitrion?.evaluarDelta ?? ((_time: number) => new THREE.Vector3(0, 0, 0));
        const pTimesTablero = tabAnfitrion?.pTimes ?? [0, duracionPaso];
        const tieneRotHw = Boolean(tabAnfitrion?.tieneRotacion);
        const centroTabHw = tabAnfitrion?.centroLocal || new THREE.Vector3();
        const qGiroHw = tabAnfitrion?.qGiro || new THREE.Quaternion();
        const tInicioMovTab = typeof tabAnfitrion?.tiempoInicioMovimiento === "number" ? tabAnfitrion.tiempoInicioMovimiento : 500;
        const tLlegadaTab = typeof tabAnfitrion?.tLlegada === "number" ? tabAnfitrion.tLlegada : duracionPaso;
        const tRotStartTab = typeof tabAnfitrion?.tRotStart === "number" ? tabAnfitrion.tRotStart : tInicioMovTab;

        const qHwRest = getSafeRestQuaternion(hwMesh);
        const vOffsetCentroHw = new THREE.Vector3().subVectors(pHwRest, centroTabHw);

        // 🎯 Posición exacta del barreno en el tablero anfitrión a tiempo t:
        const getPosBarrenoAtTime = (t: number): THREE.Vector3 => {
          const deltaTab = evaluarDeltaHw(t);
          const { matCurGiro } = evaluarGiroTableroAtTime(
            t,
            tieneRotHw,
            qGiroHw,
            tRotStartTab,
            tLlegadaTab
          );
          const vOffsetRot = tieneRotHw ? vOffsetCentroHw.clone().applyMatrix4(matCurGiro) : vOffsetCentroHw;
          return centroTabHw.clone().add(deltaTab).add(vOffsetRot);
        };

        const getQuatHwAtTime = (t: number): THREE.Quaternion => {
          if (!tieneRotHw) return qHwRest.clone();
          const { qCurGiro } = evaluarGiroTableroAtTime(
            t,
            tieneRotHw,
            qGiroHw,
            tRotStartTab,
            tLlegadaTab
          );
          return qCurGiro.clone().multiply(qHwRest);
        };

        const generarPistasEscalaHw = (tVisible: number) => {
          if (tVisible >= duracionPaso) {
            return {
              times: [0, duracionPaso],
              scales: [0, 0, 0, 0, 0, 0],
            };
          }

          const times: number[] = [0];
          const scales: number[] = [0, 0, 0];

          if (tVisible > 0.04) {
            times.push(tVisible - 0.02);
            scales.push(0, 0, 0);
          }

          times.push(tVisible);
          scales.push(1, 1, 1);

          if (times[times.length - 1] < duracionPaso) {
            times.push(duracionPaso);
            scales.push(1, 1, 1);
          }

          return { times, scales };
        };

        let tHwStartCalc = tAparicion;
        let posTimesHw: number[] = [];
        let posValsHw: number[] = [];
        let qValsHw: number[] = [];

        if (herraje.congelado) {
          // ❄️ Herraje congelado: soldado rígidamente al barreno de su tablero en todo instante (cero desfases)
          const { times: sTimes, scales: sVals } = generarPistasEscalaHw(tAparicion);
          agregarTrack(crearTrackEscalaSanitizado(`${hwMesh.uuid}.scale`, sTimes, sVals));

          // Posición: 100% fiel y rígida a la transformación del tablero
          const pTimes = pTimesTablero;
          const pVals: number[] = [];
          const qVals: number[] = [];
          pTimes.forEach((time: number) => {
            const p = getPosBarrenoAtTime(time);
            pVals.push(p.x, p.y, p.z);
            if (tieneRotHw) {
              const q = getQuatHwAtTime(time);
              qVals.push(q.x, q.y, q.z, q.w);
            }
          });

          posTimesHw = pTimes;
          posValsHw = pVals;
          qValsHw = qVals;

          agregarTrack(crearTrackVectorSanitizado(`${hwMesh.uuid}.position`, pTimes, pVals));
          if (tieneRotHw) {
            agregarTrack(crearTrackQuaternionSanitizado(`${hwMesh.uuid}.quaternion`, pTimes, qVals));
          }
        } else {
          // 🚀 Herraje nuevo: inserción colineal desde Punto A hasta Punto B (barreno)
          const eje = herraje.ejeAproximacion || "-X";
          const vDirOffsetBase = resolverVectorEje(eje, distGlobalM);

          const tViaje = distGlobalM > 0.001
            ? Math.max(0.15, distGlobalM / velocidadHerrajesM_s)
            : 0;
          const tHwStart = tAparicion;
          tHwStartCalc = tHwStart;
          const tHwLlegada = Math.min(duracionPaso, tHwStart + tViaje);

          const { times: sTimes, scales: sVals } = generarPistasEscalaHw(tHwStart);
          agregarTrack(crearTrackEscalaSanitizado(`${hwMesh.uuid}.scale`, sTimes, sVals));

          // Sub-muestreo durante la inserción si tiene distancia
          const insertionTimes: number[] = [tHwStart, tHwLlegada];
          if (tHwLlegada > tHwStart && distGlobalM > 0.005) {
            const nIns = Math.max(5, Math.ceil((tHwLlegada - tHwStart) / 0.05));
            for (let i = 1; i < nIns; i++) {
              insertionTimes.push(tHwStart + (i / nIns) * (tHwLlegada - tHwStart));
            }
          }

          const rawTimes = [0, ...insertionTimes, ...pTimesTablero];
          const posTimes = Array.from(new Set(rawTimes)).sort((a, b) => a - b);
          const posVals: number[] = [];
          const qVals: number[] = [];

          posTimes.forEach((time) => {
            const pBarreno = getPosBarrenoAtTime(time);
            const { matCurGiro } = evaluarGiroTableroAtTime(
              time,
              tieneRotHw,
              qGiroHw,
              tRotStartTab,
              tLlegadaTab
            );
            const vDirRot = tieneRotHw ? vDirOffsetBase.clone().applyMatrix4(matCurGiro) : vDirOffsetBase;

            if (time <= tHwStart) {
              const pAprox = pBarreno.clone().add(vDirRot);
              posVals.push(pAprox.x, pAprox.y, pAprox.z);
            } else if (time < tHwLlegada) {
              const alpha = (time - tHwStart) / Math.max(0.001, tHwLlegada - tHwStart);
              const pAprox = pBarreno.clone().add(vDirRot);
              const pInterp = pAprox.lerp(pBarreno, alpha);
              posVals.push(pInterp.x, pInterp.y, pInterp.z);
            } else {
              posVals.push(pBarreno.x, pBarreno.y, pBarreno.z);
            }

            if (tieneRotHw) {
              const q = getQuatHwAtTime(time);
              qVals.push(q.x, q.y, q.z, q.w);
            }
          });

          posTimesHw = posTimes;
          posValsHw = posVals;
          qValsHw = qVals;

          agregarTrack(crearTrackVectorSanitizado(`${hwMesh.uuid}.position`, posTimes, posVals));
          if (tieneRotHw) {
            agregarTrack(crearTrackQuaternionSanitizado(`${hwMesh.uuid}.quaternion`, posTimes, qVals));
          }
        }

        // 🌟 Malla de Aura Dorada (Glow Shell) para Babylon.js Sandbox, Blender y Three.js
        const tieneDestello = Boolean(herraje.destello && (herraje.destello.duracion || 0) > 0);
        const tVisibleHw = herraje.congelado ? tAparicion : tHwStartCalc;
        const tInicioDestello = tieneDestello ? (herraje.destello!.tiempoInicio ?? tVisibleHw) : tVisibleHw;
        const durDestello = tieneDestello ? (herraje.destello!.duracion || 0) : 0;
        const tFinDestello = Math.min(duracionPaso, tInicioDestello + durDestello);

        // 🛡️ REGLA SUPREMA glTF: El nombre debe ser estrictamente alfanumérico sin paréntesis, espacios ni dos puntos
        const safeHwName = (hwMesh.name || "hw").replace(/[^a-zA-Z0-9_]/g, "_");
        const safeHwUuid = hwMesh.uuid.replace(/-/g, "_");
        const auraNodeName = `Aura_${safeHwName}_${safeHwUuid}`;

        if (tieneDestello && durDestello > 0.05 && tFinDestello > tInicioDestello) {
          let auraMesh = rootScene.children.find((c) => c.name === auraNodeName) as THREE.Mesh;
          if (!auraMesh) {
            const auraMat = new THREE.MeshStandardMaterial({
              name: "Material_Aura_Destello_Oro",
              color: new THREE.Color("#FFE066"),
              emissive: new THREE.Color("#FFDE00"),
              emissiveIntensity: 2.8,
              roughness: 0.15,
              metalness: 0.85,
              side: THREE.DoubleSide,
            });
            auraMesh = new THREE.Mesh(hwMesh.geometry, auraMat);
            auraMesh.name = auraNodeName;
            auraMesh.scale.set(0, 0, 0);
            auraMesh.userData = {
              isAuraDestelloHelper: true,
              __esHelperVisual: true,
              __baseRestPosition: hwMesh.userData?.__baseRestPosition?.clone() || hwMesh.position.clone(),
              __baseRestQuaternion: hwMesh.userData?.__baseRestQuaternion?.clone() || hwMesh.quaternion.clone(),
              __baseRestScale: new THREE.Vector3(0, 0, 0),
            };
            rootScene.add(auraMesh);
          }
          mallasAnimadasEnCapas.add(auraMesh.uuid);

          // Pista de escala del Aura: 0 antes, pulso senoidal de 1.08 a 1.35 en [tInicioDestello, tFinDestello], y 0 después
          const auraTimes: number[] = [0];
          const auraScales: number[] = [0, 0, 0];

          if (tInicioDestello > 0.04) {
            auraTimes.push(tInicioDestello - 0.02);
            auraScales.push(0, 0, 0);
          }
          auraTimes.push(tInicioDestello);
          auraScales.push(0, 0, 0);

          const fpsPulse = 20;
          const nPasos = Math.max(6, Math.round(durDestello * fpsPulse));
          for (let s = 1; s <= nPasos; s++) {
            const curT = tInicioDestello + (s / nPasos) * durDestello;
            if (s === nPasos) {
              auraTimes.push(curT);
              auraScales.push(0, 0, 0);
            } else {
              const elapsed = curT - tInicioDestello;
              const factorSeno = (Math.sin(elapsed * Math.PI * 5) + 1) / 2; // 2.5 Hz
              const escalaVal = 1.08 + factorSeno * 0.28; // 1.08x a 1.36x
              auraTimes.push(curT);
              auraScales.push(escalaVal, escalaVal, escalaVal);
            }
          }

          if (tFinDestello < duracionPaso) {
            auraTimes.push(duracionPaso);
            auraScales.push(0, 0, 0);
          }

          agregarTrack(crearTrackEscalaSanitizado(`${auraNodeName}.scale`, auraTimes, auraScales));

          // Sincronización idéntica de trayectoria de posición y rotación con hwMesh
          agregarTrack(crearTrackVectorSanitizado(`${auraNodeName}.position`, posTimesHw, posValsHw));

          if (tieneRotHw && qValsHw.length > 0) {
            agregarTrack(crearTrackQuaternionSanitizado(`${auraNodeName}.quaternion`, posTimesHw, qValsHw));
          }
        } else {
          // Si el herraje no tiene destello activo pero existía una malla de aura previa en la escena viva, silenciarla
          const auraMesh = rootScene.children.find((c) => c.name === auraNodeName) as THREE.Mesh;
          if (auraMesh) {
            auraMesh.scale.set(0, 0, 0);
            mallasAnimadasEnCapas.add(auraMesh.uuid);
            agregarTrack(crearTrackEscalaSanitizado(`${auraNodeName}.scale`, [0, duracionPaso], [0, 0, 0, 0, 0, 0]));
          }
        }

        // 🛡️ Purgar cualquier residuo de aura parásita como hija de hwMesh
        const auraResidual = hwMesh.children.find((c) => c.name?.includes("AuraDestello") || (c as any).userData?.isAuraDestelloHelper);
        if (auraResidual) {
          hwMesh.remove(auraResidual);
        }
      });
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // 🧩 2. BLOQUES HEREDADOS (Consolidados a t = t_final como cuerpo rígido inmóvil)
  // ─────────────────────────────────────────────────────────────────────────
  const todosLosPasos = (toolMeshes?.todosLosPasos && toolMeshes.todosLosPasos.length > 0)
    ? toolMeshes.todosLosPasos
    : (typeof use3BFStore !== "undefined" && use3BFStore.getState?.()?.pasosManual?.length > 0)
      ? use3BFStore.getState().pasosManual
      : (typeof window !== "undefined" && (window as any).__3bfPasosManual)
        ? (window as any).__3bfPasosManual
        : [];
  const bloquesHeredadosIds: string[] = [
    ...(paso.bloquesHeredadosIds || []),
    ...capas.flatMap((c) => c.bloquesHeredadosIds || []),
  ];

  // 1. Heredar automáticamente los pasos previos cronológicamente
  const currentIndex = todosLosPasos.findIndex((p: any) => p.id === paso.id);
  const pasosPreviosIds = currentIndex > 0 ? todosLosPasos.slice(0, currentIndex).map((p: any) => p.id) : [];
  const todosHeredadosIds = Array.from(new Set([...pasosPreviosIds, ...bloquesHeredadosIds]));

  const modoHeredados = paso.multiplePlus?.modoVisualizacionHeredados || "solido";
  const estaVisibleHeredados = modoHeredados !== "oculto";

  // 🔗 Configuración y cinemática de acople de los objetos heredados
  const acopleHeredados = mpConfig.acopleHeredados;
  const modoAcopleHeredados = acopleHeredados?.modo || "recien_armado_a_heredado";
  const esAcopleHeredadosActivo = modoAcopleHeredados === "heredado_a_recien_armado" || modoAcopleHeredados === "acoplarse_a_paso";
  const tAparicionHeredados = Math.max(0, acopleHeredados?.tiempoAparicion ?? 0);
  const tInicioAcopleHeredados = Math.max(0, acopleHeredados?.tiempoInicio ?? Math.max(0.5, duracionPaso - 2.5));
  const durAcopleHeredados = Math.max(0.2, acopleHeredados?.duracion ?? 2.5);
  const tFinAcopleHeredados = Math.min(duracionPaso, tInicioAcopleHeredados + durAcopleHeredados);

  // Vector de offset del paso actual (si existe una piezaMaster o capa con offsetBancoCm)
  const vOffsetPasoActual = new THREE.Vector3(0, 0, 0);
  if (mastersMap.size > 0) {
    const primerMaster = Array.from(mastersMap.values())[0];
    if (primerMaster && primerMaster.vOffset.lengthSq() > 0.00001) {
      vOffsetPasoActual.copy(primerMaster.vOffset);
    }
  } else {
    for (const c of capas) {
      if (c.offsetBancoCm && ((c.offsetBancoCm.x || 0) !== 0 || (c.offsetBancoCm.y || 0) !== 0 || (c.offsetBancoCm.z || 0) !== 0)) {
        vOffsetPasoActual.set(
          (c.offsetBancoCm.x || 0) / 100,
          (c.offsetBancoCm.y || 0) / 100,
          (c.offsetBancoCm.z || 0) / 100
        );
        break;
      }
    }
  }

  // Vector de aproximación cuando no hay offset de banco en el subensamble actual
  const tieneOffsetSubensamble = vOffsetPasoActual.lengthSq() > 0.00001;
  const distAproxM = Math.max(0.05, (acopleHeredados?.distanciaAproximacionCm ?? 30) / 100);
  const ejeAprox = acopleHeredados?.ejeAproximacion || "+Z";
  let vAproxHeredados = new THREE.Vector3(0, 0, distAproxM);
  if (ejeAprox === "-Z") vAproxHeredados.set(0, 0, -distAproxM);
  else if (ejeAprox === "+Z") vAproxHeredados.set(0, 0, distAproxM);
  else if (ejeAprox === "+Y") vAproxHeredados.set(0, distAproxM, 0).applyMatrix4(invRotMat);
  else if (ejeAprox === "-Y") vAproxHeredados.set(0, -distAproxM, 0).applyMatrix4(invRotMat);
  else if (ejeAprox === "+X") vAproxHeredados.set(distAproxM, 0, 0);
  else if (ejeAprox === "-X") vAproxHeredados.set(-distAproxM, 0, 0);

  todosHeredadosIds.forEach((pasoHeredadoId) => {
    const pasoPrevio = todosLosPasos.find((p: any) => p.id === pasoHeredadoId);
    if (!pasoPrevio) return;

    const estaVisibleEspecifico = paso.bloquesHeredadosVisibles?.[pasoHeredadoId] !== false;
    const esVisibleFinal = estaVisibleHeredados && estaVisibleEspecifico;

    const piezasHeredadas: string[] = [];
    const herrajesHeredados: string[] = [];

    if (pasoPrevio.multiplePlus?.capas && pasoPrevio.multiplePlus.capas.length > 0) {
      pasoPrevio.multiplePlus.capas.forEach((c: any) => {
        (c.tableros || []).forEach((t: any) => piezasHeredadas.push(t.id));
        (c.herrajes || []).forEach((h: any) => herrajesHeredados.push(h.id));
        (c.congelados || []).forEach((cg: any) => herrajesHeredados.push(cg.id));
      });
    } else if (pasoPrevio.tipo === "ensamble") {
      (pasoPrevio.piezasAsignadas || []).forEach((p: any) => piezasHeredadas.push(p));
      (pasoPrevio.herrajesAsignados || []).forEach((h: any) => herrajesHeredados.push(typeof h === "string" ? h : h.id));
    }

    sceneMeshes.forEach((mesh) => {
      // 🛡️ REGLA SUPREMA: Si la malla ya fue animada en una capa activa del paso actual, NO tocarla aquí
      if (mallasAnimadasEnCapas.has(mesh.uuid)) return;

      const u = mesh.userData || {};
      const cn = (u.cleanName || mesh.name || "").replace(/^RH_OUT:/i, "").trim().toLowerCase();
      const pm = (u.piezaMadre || "").toLowerCase().trim();
      const ik = (u.instanciaKey || "").toLowerCase().trim();

      const perteneceTablero = piezasHeredadas.some((pId) =>
        coincideMallaConTablero(pId.toLowerCase().trim(), cn, pm, ik)
      );
      const perteneceHerraje = herrajesHeredados.some((hId) =>
        coincidenMismoHerraje(hId, ik) || coincidenMismoHerraje(hId, cn)
      );

      if (perteneceTablero || perteneceHerraje) {
        mallasAnimadasEnCapas.add(mesh.uuid);
        if (!esVisibleFinal) {
          agregarTrack(crearTrackEscalaSanitizado(`${mesh.uuid}.scale`, [0, duracionPaso], [0, 0, 0, 0, 0, 0]));
        } else {
          const pRest = getSafeRestPosition(mesh);

          // 📐 Track de Escala (respetando tiempo de aparición)
          if (tAparicionHeredados > 0.05) {
            agregarTrack(
              crearTrackEscalaSanitizado(
                `${mesh.uuid}.scale`,
                [0, Math.max(0.01, tAparicionHeredados - 0.02), tAparicionHeredados, duracionPaso],
                [0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1]
              )
            );
          } else {
            agregarTrack(crearTrackEscalaSanitizado(`${mesh.uuid}.scale`, [0, duracionPaso], [1, 1, 1, 1, 1, 1]));
          }

          // 📐 Track de Posición (Fijo en Banco vs Acoplarse al Paso Actual)
          if (!esAcopleHeredadosActivo) {
            agregarTrack(
              crearTrackVectorSanitizado(
                `${mesh.uuid}.position`,
                [0, duracionPaso],
                [pRest.x, pRest.y, pRest.z, pRest.x, pRest.y, pRest.z]
              )
            );
          } else {
            let pIni: THREE.Vector3;
            let pFin: THREE.Vector3;

            if (tieneOffsetSubensamble) {
              pIni = pRest.clone();
              pFin = pRest.clone().add(vOffsetPasoActual);
            } else {
              pIni = pRest.clone().add(vAproxHeredados);
              pFin = pRest.clone();
            }

            const tIni = Math.max(0, tInicioAcopleHeredados);
            const tFin = Math.max(tIni + 0.05, Math.min(duracionPaso, tFinAcopleHeredados));

            if (tIni > 0.05) {
              agregarTrack(
                crearTrackVectorSanitizado(
                  `${mesh.uuid}.position`,
                  [0, tIni, tFin, duracionPaso],
                  [
                    pIni.x, pIni.y, pIni.z,
                    pIni.x, pIni.y, pIni.z,
                    pFin.x, pFin.y, pFin.z,
                    pFin.x, pFin.y, pFin.z,
                  ]
                )
              );
            } else {
              agregarTrack(
                crearTrackVectorSanitizado(
                  `${mesh.uuid}.position`,
                  [0, tFin, duracionPaso],
                  [
                    pIni.x, pIni.y, pIni.z,
                    pFin.x, pFin.y, pFin.z,
                    pFin.x, pFin.y, pFin.z,
                  ]
                )
              );
            }
          }
        }
      }
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // 💡 3. AISLAMIENTO Y VISIBILIDAD DE PIEZAS INACTIVAS (Fuera de Capas y Heredados)
  // 🛡️ REGLA CANÓNICA: Las piezas de Bloques Funcionales (ej. Cajones) NO pertenecen a inactivos.
  // ─────────────────────────────────────────────────────────────────────────
  const bloquesFuncionalesSet = new Set<string>();
  const todosLosGrupos = [
    ...(paso?.showcase?.gruposCinematicos || []),
    ...(todosLosPasos.flatMap((p: any) => p.showcase?.gruposCinematicos || [])),
  ];
  todosLosGrupos.forEach((g: any) => {
    (g.piezas || []).forEach((piez: string) => {
      const cleanPiez = (piez || "").toLowerCase().trim();
      if (cleanPiez) bloquesFuncionalesSet.add(cleanPiez);
    });
  });

  sceneMeshes.forEach((m) => {
    // Si ya fue procesada en capas activas o en heredados, omitir
    if (mallasAnimadasEnCapas.has(m.uuid)) return;
    mallasAnimadasEnCapas.add(m.uuid);

    const u = m.userData || {};
    const cn = (u.cleanName || m.name || "").replace(/^RH_OUT:/i, "").trim().toLowerCase();
    const pm = (u.piezaMadre || "").toLowerCase().trim();
    const ik = (u.instanciaKey || "").toLowerCase().trim();
    const esHw = isHardwareMeshName(m.name) || isHardwareMeshName(cn) || (ik ? isHardwareMeshName(ik) : false);

    const esDeBloqueFuncional = Array.from(bloquesFuncionalesSet).some((bf) => {
      if (esHw) {
        return bf === ik || bf === cn || coincidenMismoHerraje(bf, ik) || coincidenMismoHerraje(bf, cn);
      }
      return bf === ik || bf === cn || bf === pm || perteneceAMismaFamiliaPieza(ik, bf) || perteneceAMismaFamiliaPieza(cn, bf);
    });

    if (esDeBloqueFuncional) {
      // 🛡️ Las piezas de Bloques Funcionales permanecen ocultas en los pasos de ensamble donde no están activas
      agregarTrack(
        crearTrackEscalaSanitizado(`${m.uuid}.scale`, [0, duracionPaso], [0, 0, 0, 0, 0, 0])
      );
      return;
    }

    const modoInactivos = paso.multiplePlus?.modoVisualizacionInactivos || "oculto";
    if (modoInactivos === "cristal" || modoInactivos === "global") {
      // 💎 MODO CRISTAL o 🌐 MODO GLOBAL: Permanecen visibles en escala 1.0 en su posición de reposo
      const pRest = getSafeRestPosition(m);
      agregarTrack(
        crearTrackEscalaSanitizado(`${m.uuid}.scale`, [0, duracionPaso], [1, 1, 1, 1, 1, 1])
      );
      agregarTrack(
        crearTrackVectorSanitizado(
          `${m.uuid}.position`,
          [0, duracionPaso],
          [pRest.x, pRest.y, pRest.z, pRest.x, pRest.y, pRest.z]
        )
      );
    } else {
      // 👁️‍🗨️ MODO OCULTO: Escala 0 continua incondicional para piezas inactivas
      agregarTrack(
        crearTrackEscalaSanitizado(`${m.uuid}.scale`, [0, duracionPaso], [0, 0, 0, 0, 0, 0])
      );
    }
  });

  // =========================================================================
  // 🌟 ANIMACIÓN DE PUESTA DE PIE AL FINAL (Poner el mueble de pie a 0°)
  // =========================================================================
  // 🌟 ANIMACIÓN CINEMÁTICA DE BANCO (Volteo 180° Intermedio y/o Puesta de Pie al Final)
  // =========================================================================
  const rotBancoActual = paso.orientacionBanco?.rotacion || mpConfig.orientacionBanco?.rotacion || [0, 0, 0];
  const rotX_banco = rotBancoActual[0] || 0;
  const rotY_banco = rotBancoActual[1] || 0;
  const rotZ_banco = rotBancoActual[2] || 0;

  const tieneRotacionBanco = rotX_banco !== 0 || rotY_banco !== 0 || rotZ_banco !== 0;
  const volteoActivo = Boolean(mpConfig.volteoIntermedio?.activo);
  const dePieActivo = Boolean(mpConfig.ponerDePieAlFinal && (tieneRotacionBanco || volteoActivo));

  if (volteoActivo || dePieActivo) {
    // 🎯 NORMA CANÓNICA: Extraer mallas correspondientes al subensamble activo (cajón o módulo)
    const asignadasPlus: string[] = [];
    (mpConfig.capas || []).forEach((c: any) => {
      (c.tableros || []).forEach((t: any) => asignadasPlus.push(t.id));
      (c.herrajes || []).forEach((h: any) => asignadasPlus.push(h.id));
      (c.congelados || []).forEach((h: any) => asignadasPlus.push(h.id));
    });
    const todasAsignadas = asignadasPlus.length > 0 ? asignadasPlus : (paso.piezasAsignadas || []);

    const mallasCandidatas = (todasAsignadas.length > 0)
      ? sceneMeshes.filter((m: any) => {
          const u = m.userData || {};
          const ik = (u.instanciaKey || "").toLowerCase();
          const cn = (u.cleanName || m.name || "").replace(/^RH_OUT:/i, "").trim().toLowerCase();
          return todasAsignadas.some((p) => {
            const pLow = p.toLowerCase();
            return (
              pLow === ik ||
              pLow === cn ||
              ik.startsWith(pLow) ||
              coincidenMismoHerraje(p, ik) ||
              coincidenMismoHerraje(p, cn)
            );
          });
        })
      : sceneMeshes;

    const mallasTableros = mallasCandidatas.filter((m: any) => {
      const n = (m.name || "").toLowerCase();
      const ik = (m.userData?.instanciaKey || "").toLowerCase();
      return !isHardwareMeshName(n) && !isHardwareMeshName(ik);
    });

    const meshesParaBox = mallasTableros.length > 0 ? mallasTableros : mallasCandidatas;

    const localBox = new THREE.Box3();
    for (const m of meshesParaBox) {
      if (!m.geometry) continue;
      if (!m.geometry.boundingBox) m.geometry.computeBoundingBox();
      if (m.geometry.boundingBox) {
        const mBox = m.geometry.boundingBox.clone();
        const restPos = getSafeRestPosition(m);
        const restQuat = getSafeRestQuaternion(m);
        mBox.applyMatrix4(new THREE.Matrix4().compose(restPos, restQuat, new THREE.Vector3(1, 1, 1)));
        localBox.union(mBox);
      }
    }

    if (!localBox.isEmpty()) {
      const unrotatedCenter = new THREE.Vector3();
      localBox.getCenter(unrotatedCenter);

      // 🌟 AJUSTE DEL EJE DE ROTACIÓN (prioriza alturaEjeZCm del volteo intermedio si está activo)
      const offsetEjeCm = (volteoActivo && typeof mpConfig.volteoIntermedio?.alturaEjeZCm === "number")
        ? mpConfig.volteoIntermedio.alturaEjeZCm
        : (mpConfig.offsetEjeRotacionCm ?? 30);
      const offsetEjeM = offsetEjeCm / 100;
      const ejePivote = unrotatedCenter.clone();
      ejePivote.y += offsetEjeM;

      const corners: THREE.Vector3[] = [
        new THREE.Vector3(localBox.min.x, localBox.min.y, localBox.min.z),
        new THREE.Vector3(localBox.min.x, localBox.min.y, localBox.max.z),
        new THREE.Vector3(localBox.min.x, localBox.max.y, localBox.min.z),
        new THREE.Vector3(localBox.min.x, localBox.max.y, localBox.max.z),
        new THREE.Vector3(localBox.max.x, localBox.min.y, localBox.min.z),
        new THREE.Vector3(localBox.max.x, localBox.min.y, localBox.max.z),
        new THREE.Vector3(localBox.max.x, localBox.max.y, localBox.min.z),
        new THREE.Vector3(localBox.max.x, localBox.max.y, localBox.max.z),
      ];

      // Origen base canónico de la instancia
      const s = use3BFStore.getState();
      const instActiva = s.objetoActivoId ? s.instancias[s.objetoActivoId] : Object.values(s.instancias)[0];
      const basePos = (instActiva?.posicion || [0, 0, 0]) as [number, number, number];

      const apoyoEnPiso = paso.orientacionBanco?.apoyoEnPiso ?? mpConfig.orientacionBanco?.apoyoEnPiso ?? true;
      const alturaZCm = mpConfig.alturaZCm ?? paso.orientacionBanco?.alturaZCm ?? 0;
      const alturaZM = alturaZCm / 100;

      // 🧭 Función de transformación 100% coherente con SingleFurnitureInstanceMesh
      const calcularTransformBanco = (rX: number, rY: number, rZ: number) => {
        const radThreeX = THREE.MathUtils.degToRad(rX);
        const radThreeY = THREE.MathUtils.degToRad(rZ);
        const radThreeZ = -THREE.MathUtils.degToRad(rY);
        const euler = new THREE.Euler(radThreeX, radThreeY, radThreeZ, "XYZ");
        const rotMat = new THREE.Matrix4().makeRotationFromEuler(euler);

        let minYRot = Infinity;
        for (const c of corners) {
          const cRot = c.clone().applyMatrix4(rotMat);
          if (cRot.y < minYRot) minYRot = cRot.y;
        }

        const rotatedPivot = ejePivote.clone().applyMatrix4(rotMat);
        const offsetX = ejePivote.x - rotatedPivot.x;
        const offsetZ = ejePivote.z - rotatedPivot.z;
        const offsetY = (apoyoEnPiso ? -minYRot : (ejePivote.y - rotatedPivot.y)) + alturaZM;

        return {
          pos: new THREE.Vector3(basePos[0] + offsetX, basePos[1] + offsetY, basePos[2] + offsetZ),
          quat: new THREE.Quaternion().setFromEuler(euler),
        };
      };

      // 🔄 Evaluador de rotación angular del banco en cualquier instante tSeg
      const evaluarRotacionBancoEnTiempo = (tSeg: number): [number, number, number] => {
        let curX = rotX_banco;
        let curY = rotY_banco;
        let curZ = rotZ_banco;

        // 1. Aplicar Volteo Intermedio 180° si está activo (sin retorno)
        if (volteoActivo && mpConfig.volteoIntermedio) {
          const tIniV = mpConfig.volteoIntermedio.tiempoInicio ?? 48;
          const durV = Math.max(0.5, mpConfig.volteoIntermedio.duracion ?? 3.0);
          const ejeV = mpConfig.volteoIntermedio.eje || "Y";
          const angV = mpConfig.volteoIntermedio.anguloGrados ?? 180;

          if (tSeg > tIniV) {
            const uV = Math.min(1, (tSeg - tIniV) / durV);
            const sV = uV * uV * (3 - 2 * uV); // Smoothstep easing
            if (ejeV === "X") curX += angV * sV;
            else if (ejeV === "Y") curY += angV * sV;
            else if (ejeV === "Z") curZ += angV * sV;
          }
        }

        // 2. Aplicar Puesta de Pie al Final si está activa (regresa erguido a 0°)
        if (mpConfig.ponerDePieAlFinal) {
          const tIniPie = mpConfig.tiempoInicioDePie ?? Math.max(0, duracionPaso - 4.0);
          const durPie = Math.max(0.5, mpConfig.duracionDePie ?? 4.0);

          if (tSeg > tIniPie) {
            const uP = Math.min(1, (tSeg - tIniPie) / durPie);
            const sP = uP * uP * (3 - 2 * uP);
            curX *= (1 - sP);
            curY *= (1 - sP);
            curZ *= (1 - sP);
          }
        }

        return [curX, curY, curZ];
      };

      // Recolectar timestamps de muestreo para pistas GLTF
      const sampleTimesSet = new Set<number>();
      sampleTimesSet.add(0);
      sampleTimesSet.add(duracionPaso);

      if (volteoActivo && mpConfig.volteoIntermedio) {
        const tIniV = mpConfig.volteoIntermedio.tiempoInicio ?? 48;
        const durV = Math.max(0.5, mpConfig.volteoIntermedio.duracion ?? 3.0);
        const tFinV = Math.min(duracionPaso, tIniV + durV);
        if (tIniV > 0 && tIniV < duracionPaso) sampleTimesSet.add(tIniV);
        const SAMPLES_V = 24;
        for (let i = 1; i < SAMPLES_V; i++) {
          const tS = tIniV + (i / SAMPLES_V) * durV;
          if (tS > 0 && tS < duracionPaso) sampleTimesSet.add(tS);
        }
        if (tFinV > 0 && tFinV < duracionPaso) sampleTimesSet.add(tFinV);
      }

      if (mpConfig.ponerDePieAlFinal) {
        const tIniP = mpConfig.tiempoInicioDePie ?? Math.max(0, duracionPaso - 4.0);
        const durP = Math.max(0.5, mpConfig.duracionDePie ?? 4.0);
        const tFinP = Math.min(duracionPaso, tIniP + durP);
        if (tIniP > 0 && tIniP < duracionPaso) sampleTimesSet.add(tIniP);
        const SAMPLES_P = 24;
        for (let i = 1; i < SAMPLES_P; i++) {
          const tS = tIniP + (i / SAMPLES_P) * durP;
          if (tS > 0 && tS < duracionPaso) sampleTimesSet.add(tS);
        }
        if (tFinP > 0 && tFinP < duracionPaso) sampleTimesSet.add(tFinP);
      }

      const sortedSampleTimes = Array.from(sampleTimesSet).sort((a, b) => a - b);

      const posTimes: number[] = [];
      const posValues: number[] = [];
      const quatTimes: number[] = [];
      const quatValues: number[] = [];

      sortedSampleTimes.forEach((tS) => {
        const [cX, cY, cZ] = evaluarRotacionBancoEnTiempo(tS);
        const trans = calcularTransformBanco(cX, cY, cZ);
        posTimes.push(tS);
        posValues.push(trans.pos.x, trans.pos.y, trans.pos.z);
        quatTimes.push(tS);
        quatValues.push(trans.quat.x, trans.quat.y, trans.quat.z, trans.quat.w);
      });

      // Guardar estado base de reposo para el reset
      const t0_trans = calcularTransformBanco(rotX_banco, rotY_banco, rotZ_banco);
      if (!rootScene.userData.__baseRestPosition) {
        rootScene.userData.__baseRestPosition = t0_trans.pos.clone();
        rootScene.userData.__baseRestQuaternion = t0_trans.quat.clone();
      }

      const rootTargetName = (rootScene.name && rootScene.name !== "Scene") ? rootScene.name : (rootScene.uuid || "Mueble");
      if (!rootScene.name || rootScene.name === "Scene") {
        rootScene.name = rootTargetName;
      }

      // Pistas para exportación GLTF
      agregarTrack(crearTrackVectorSanitizado(`${rootTargetName}.position`, posTimes, posValues));
      agregarTrack(crearTrackQuaternionSanitizado(`${rootTargetName}.quaternion`, quatTimes, quatValues));

      // Hook de sincronización en tiempo real a 60 FPS
      (rootScene as any).__evaluarDePieAlFinal = (tSeg: number) => {
        const [cX, cY, cZ] = evaluarRotacionBancoEnTiempo(tSeg);
        const curTrans = calcularTransformBanco(cX, cY, cZ);
        rootScene.position.copy(curTrans.pos);
        rootScene.quaternion.copy(curTrans.quat);
        rootScene.updateMatrix();
        rootScene.updateMatrixWorld(true);
      };
    }
  } else {
    if ((rootScene as any).__evaluarDePieAlFinal) {
      delete (rootScene as any).__evaluarDePieAlFinal;
    }
  }

  // 🚀 Insertar todas las pistas sanitizadas y unívocas en el AnimationClip
  tracks.push(...Array.from(tracksMap.values()));
}
