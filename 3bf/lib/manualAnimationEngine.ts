/**
 * manualAnimationEngine.ts
 *
 * Fachada pública del motor cinemático modular de 3dBimFab.
 * Orquesta la compilación de AnimationClips nativos de glTF para pasos de manual:
 * - Showcase Funcional (P00): Apertura fisiomecánica de cajones y puertas
 * - Pasos de Ensamble (P01+): Piezas maestras, subbloques, correderas, herrajes y herramientas
 *
 * =========================================================================================
 * 📜 MANIFIESTO: LA ANIMACIÓN 3D PARAMÉTRICA BASADA EN JSON (Visión de Vanguardia)
 * =========================================================================================
 * "La animación 3D pesada de los años 90 y 2000 (keyframes densos, curvas de bezier monolíticas,
 * armatures complejas y archivos binarios pesados de Blender/Maya/3ds Max) pertenecía a la era
 * del renderizador fuera de línea (offline rendering).
 *
 * La animación 3D de la próxima década es semántica, paramétrica, ligera y basada en datos
 * serializables estructurados en JSON.
 *
 * En esta arquitectura:
 * 1. JSON es el lenguaje universal y nativo para la Inteligencia Artificial: los LLMs razonan,
 *    calculan distancias baricéntricas y generan libretos cinematográficos matemáticos en milisegundos.
 * 2. Asistente Text-to-Movement: Las instrucciones humanas en lenguaje natural ("Paso 2: fijar
 *    correderas al lateral izquierdo") se convierten directamente en esquemas cinemáticos declarativos
 *    sin requerir manipulación manual de curvas.
 * 3. Divide y Vencerás: Descomponiendo secuencias complejas en subbloques atómicos (madera madre,
 *    herrajes colineales, rotación de banco de trabajo y micro-actos), logramos coherencia física
 *    milimétrica ejecutable en cualquier navegador web, dispositivo móvil o motor 3D."
 * =========================================================================================
 *
 * Modularizado en lib/engine/:
 * - types.ts: Contratos e interfaces del motor
 * - cadStateUtils.ts: Preservación de matrices originales CAD y normalización de nombres
 * - workbenchTransform.ts: Nivelación y matrices relativas de banco de trabajo
 * - showcaseKinematics.ts: Cinemática de bahía fisiomecánica y showcase interactivo
 * - assemblyCoreographer.ts: Coreografías de ensamble, telescopía de correderas y atornillado
 */

import * as THREE from "three";
import { PasoManualStudio } from "./store";
import { KinematicEngineResult, AnimationEngineToolMeshes } from "./engine/types";
import {
  asegurarCadOriginal,
  restaurarACadOriginal,
  getSafeRestPosition,
  getSafeRestQuaternion,
  normalizarNombreNodo
} from "./engine/cadStateUtils";
import { aplicarTransformacionesBancoSubbloques } from "./engine/workbenchTransform";
import { compilarShowcaseP00 } from "./engine/showcaseKinematics";
import { compilarEnsamblePaso } from "./engine/assemblyCoreographer";

// Re-exportar tipos y utilidades públicas para retrocompatibilidad total
export * from "./engine/types";
export * from "./engine/cadStateUtils";
export * from "./engine/workbenchTransform";
export { compilarShowcaseP00 } from "./engine/showcaseKinematics";
export { compilarEnsamblePaso } from "./engine/assemblyCoreographer";

/**
 * Construye y hornea un AnimationClip glTF nativo para el paso especificado,
 * garantizando coherencia física, trayectorias colineales y herramientas acopladas.
 */
export function compilarAnimacionPaso(
  rootScene: THREE.Object3D,
  paso: PasoManualStudio,
  toolMeshes?: AnimationEngineToolMeshes
): KinematicEngineResult {
  const tracks: THREE.KeyframeTrack[] = [];
  const esMultiSub3 = Boolean(paso.subbloques && paso.subbloques.length >= 3);
  const duracionPaso = Math.max(paso.duracionTotal || 10.0, esMultiSub3 ? 11.40 : 1.0);
  const omitirBanco = Boolean(toolMeshes?.omitirTransformBanco);

  // Lista de todas las mallas y mapa por nombre normalizado
  const sceneMeshes: THREE.Mesh[] = [];
  const sceneObjects = new Map<string, THREE.Object3D>();
  rootScene.traverse((child) => {
    if ((child as THREE.Mesh).isMesh || (child as THREE.Group).isGroup) {
      // 🛡️ Si el nodo es el grupo raíz de la escena o mueble, no sobreescribir su posición/rotación
      if (child === rootScene) {
        return;
      }
      if (!omitirBanco) {
        asegurarCadOriginal(child);
        restaurarACadOriginal(child);
        child.userData.__baseRestPosition = child.position.clone();
        child.userData.__baseRestQuaternion = child.quaternion.clone();
        child.userData.__baseRestScale = child.scale.clone();
      } else {
        child.userData.__baseRestPosition = child.position.clone();
        child.userData.__baseRestQuaternion = child.quaternion.clone();
        child.userData.__baseRestScale = child.scale.clone();
      }
    }
    if ((child as THREE.Mesh).isMesh) {
      sceneMeshes.push(child as THREE.Mesh);
    }
    if (child.name) {
      const norm = normalizarNombreNodo(child.name);
      sceneObjects.set(norm, child);
      sceneObjects.set(child.name, child);
    }
  });

  // 🛡️ Asegurar que cada malla arranque físicamente en su posición de reposo limpia (t = 0)
  if (!omitirBanco) {
    sceneMeshes.forEach((mesh) => {
      const rest = getSafeRestPosition(mesh);
      mesh.position.copy(rest);
      const restQ = getSafeRestQuaternion(mesh);
      mesh.quaternion.copy(restQ);
      mesh.updateMatrix();
      mesh.updateMatrixWorld(true);
    });

    // 🔨 Aplicar transformaciones de Banco de Trabajo si el paso contiene subbloques
    if (paso.subbloques && paso.subbloques.length > 0 && paso.tipo !== "showcase") {
      aplicarTransformacionesBancoSubbloques(sceneMeshes, paso.subbloques);
    }
  }

  // =========================================================================
  // 1. PASO 00: SHOWCASE FUNCIONAL (Apertura y Cierre de Cajones / Puertas)
  // =========================================================================
  if (paso.tipo === "showcase") {
    compilarShowcaseP00(rootScene, sceneMeshes, sceneObjects, paso, duracionPaso, tracks);
  }

  // =========================================================================
  // 2. PASOS DE ENSAMBLE (P01+): PIEZA MASTER, HERRAJES Y SUBBLOQUES
  // =========================================================================
  if (paso.tipo === "ensamble") {
    compilarEnsamblePaso(
      rootScene,
      paso,
      sceneMeshes,
      sceneObjects,
      tracks,
      duracionPaso,
      toolMeshes
    );
  }

  const clip = new THREE.AnimationClip("default", duracionPaso, tracks);
  const mixer = new THREE.AnimationMixer(rootScene);
  const action = mixer.clipAction(clip);
  action.loop = THREE.LoopOnce;
  action.clampWhenFinished = true;
  action.play();

  return {
    clip,
    mixer,
    actualizarTiempo: (segundos: number) => {
      const tClamped = Math.max(0, Math.min(segundos, duracionPaso));
      if (!action.isRunning() || tClamped <= 0.05) {
        action.reset();
        action.play();
      }
      mixer.setTime(tClamped);
    },
    detener: () => {
      mixer.stopAllAction();
      sceneMeshes.forEach((mesh) => {
        if (mesh.userData.__baseRestPosition) {
          mesh.position.copy(mesh.userData.__baseRestPosition);
        }
        if (mesh.userData.__baseRestQuaternion) {
          mesh.quaternion.copy(mesh.userData.__baseRestQuaternion);
        }
        if (mesh.userData.__baseRestScale) {
          mesh.scale.copy(mesh.userData.__baseRestScale);
        }
      });
    },
  };
}
