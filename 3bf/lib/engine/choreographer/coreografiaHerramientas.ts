import * as THREE from "three";
import { ElementoSecuenciaCinematica } from "../../store";
import { AnimationEngineToolMeshes } from "../types";

/**
 * Genera pistas de animación para herramientas activas (martillo y llave allen)
 * coordinadas con el elemento cinemático.
 */
export function compilarCoreografiaHerramientas(
  elem: ElementoSecuenciaCinematica,
  toolMeshes: AnimationEngineToolMeshes | undefined,
  pRest: THREE.Vector3,
  qRest: THREE.Quaternion,
  tStart: number,
  tEndAction: number,
  duracionPaso: number,
  tracks: THREE.KeyframeTrack[]
): void {
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
}
