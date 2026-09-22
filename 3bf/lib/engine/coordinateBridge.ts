/**
 * ============================================================================
 * ARCHIVO: coordinateBridge.ts
 * UBICACIÓN: 3bf/lib/engine/coordinateBridge.ts
 * AUTOR: Mario Mojica (3dBimFab Digital Manufacturing Engine)
 * ============================================================================
 * DESCRIPCIÓN & RESPONSABILIDAD:
 * Módulo puente matemático canónico entre el marco de coordenadas de Taller /
 * CNC / Rhino (Z-Up) y el motor WebGL Three.js (Y-Up).
 * Proporciona funciones deterministas para:
 * 1. Mapeo de vectores de aproximación colineales a cantos (borde superior / inferior).
 * 2. Evaluación de emparentamiento de cuerpo rígido W_hijo = W_padre * T_rel.
 * 3. Generación de trayectorias de arco circular para rotaciones sin hundimiento.
 * ============================================================================
 */

import * as THREE from "three";

/**
 * Distancia estándar de aproximación para herrajes y tarugos en metros (20 cm)
 */
export const DISTANCIA_APROXIMACION_ESTANDAR_M = 0.20;

/**
 * Calcula el vector de aproximación colineal para herrajes/tarugos en cantos de tableros acostados.
 * En la mesa de trabajo:
 * - El borde superior (fondo, z < zCentro) se aproxima en dirección Y1 -> Y0 (desde el fondo hacia +Z).
 * - El borde inferior (frente, z >= zCentro) se aproxima en dirección Y0 -> Y1 (desde el frente hacia -Z).
 * Cero variación en X, cero variación en altura vertical Y.
 */
export function calcularPuntoAparicionCanto(
  pFinal: THREE.Vector3,
  zCentroMadera: number,
  distanciaM: number = DISTANCIA_APROXIMACION_ESTANDAR_M
): THREE.Vector3 {
  const dirOffsetZ = pFinal.z < zCentroMadera ? -distanciaM : distanciaM;
  return new THREE.Vector3(
    pFinal.x,
    pFinal.y,
    pFinal.z + dirOffsetZ
  );
}

/**
 * Evalúa la posición, rotación y escala de un elemento rígidamente emparentado a una pieza madre
 * usando la matriz relativa T_rel = W0_madera_inv * W0_hijo.
 */
export function evaluarHijoConMadera(
  WMatrizMadera: THREE.Matrix4,
  TRelativaHijo: THREE.Matrix4
): { position: THREE.Vector3; quaternion: THREE.Quaternion; scale: THREE.Vector3 } {
  const WMatrizHijo = WMatrizMadera.clone().multiply(TRelativaHijo);
  const position = new THREE.Vector3();
  const quaternion = new THREE.Quaternion();
  const scale = new THREE.Vector3();
  WMatrizHijo.decompose(position, quaternion, scale);
  return { position, quaternion, scale };
}

/**
 * Genera muestras trigonométricas de un arco circular para evitar el clavado/hundimiento
 * producido por la interpolación cartesiana lineal (LERP) durante giros de piezas.
 */
export function generarMuestrasArcoCircular(
  pCentroElevada: THREE.Vector3,
  qBaseMadera: THREE.Quaternion,
  ejeRotacion: THREE.Vector3,
  anguloTotalRad: number,
  TRelativaHijo: THREE.Matrix4,
  tInicio: number,
  tFin: number,
  numPasos: number = 24
): {
  timesPos: number[];
  valsPos: number[];
  timesRot: number[];
  valsRot: number[];
} {
  const timesPos: number[] = [];
  const valsPos: number[] = [];
  const timesRot: number[] = [];
  const valsRot: number[] = [];
  const durGiro = tFin - tInicio;

  for (let i = 0; i <= numPasos; i++) {
    const u = i / numPasos;
    const t = Number((tInicio + u * durGiro).toFixed(4));
    const angulo = u * anguloTotalRad;
    const qStep = new THREE.Quaternion().setFromAxisAngle(ejeRotacion, angulo);
    const qMaderaTheta = qStep.clone().multiply(qBaseMadera);

    const WMaderaTheta = new THREE.Matrix4().compose(
      pCentroElevada,
      qMaderaTheta,
      new THREE.Vector3(1, 1, 1)
    );
    const { position, quaternion } = evaluarHijoConMadera(WMaderaTheta, TRelativaHijo);

    timesPos.push(t);
    valsPos.push(position.x, position.y, position.z);

    timesRot.push(t);
    valsRot.push(quaternion.x, quaternion.y, quaternion.z, quaternion.w);
  }

  return { timesPos, valsPos, timesRot, valsRot };
}
