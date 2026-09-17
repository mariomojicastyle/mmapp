import * as THREE from "three";

export interface KinematicEngineResult {
  clip: THREE.AnimationClip;
  mixer: THREE.AnimationMixer;
  actualizarTiempo: (segundos: number) => void;
  detener: () => void;
}

export interface AnimationEngineToolMeshes {
  martillo?: THREE.Object3D | null;
  llaveAllen?: THREE.Object3D | null;
  destornillador?: THREE.Object3D | null;
  omitirTransformBanco?: boolean;
}
