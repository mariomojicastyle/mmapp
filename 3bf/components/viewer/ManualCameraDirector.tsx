"use client";

import React, { useEffect, useRef } from "react";
import * as THREE from "three";
import { useThree, useFrame } from "@react-three/fiber";
import { use3BFStore } from "@/lib/store";

interface ManualCameraDirectorProps {
  controlsRef: React.MutableRefObject<any>;
}

/**
 * 🎥 ManualCameraDirector
 * 
 * Controlador de Dirección Cinematográfica de Cámara en 3dBimFab.
 * - Lee los keyframes de cámara (tiempo, posición, target) guardados para el paso activo.
 * - En modo reproducción o arrastre del timeline, interpola con suavidad continua (smoothstep)
 *   tanto la posición de la cámara (camera.position) como el centro focal (controls.target).
 * - Cede el control de forma transparente al instante si el usuario interactúa manualmente con el mouse/órbita.
 * - Si no hay keyframes o si camaraCinematicaActiva === false, deja la cámara en modo libre.
 */
export function ManualCameraDirector({ controlsRef }: ManualCameraDirectorProps) {
  const { camera } = useThree();
  const pestanaActiva = use3BFStore((s) => s.pestanaActiva);
  const pasoActivoManualId = use3BFStore((s) => s.pasoActivoManualId);
  const pasosManual = use3BFStore((s) => s.pasosManual);
  const timelineCurrentTime = use3BFStore((s) => s.timelineCurrentTime);
  const isTimelinePlaying = use3BFStore((s) => s.isTimelinePlaying);

  const pasoActivo = pasosManual.find((p) => p.id === pasoActivoManualId);
  const keyframes = pasoActivo?.keyframesCamara || [];
  const camaraActiva = pasoActivo?.camaraCinematicaActiva ?? true;

  // Detección de interacción manual del usuario en el viewport
  const usuarioInteractuandoRef = useRef<boolean>(false);
  const timeoutInteraccionRef = useRef<NodeJS.Timeout | null>(null);

  // Vectores temporales para evitar garbage collection en el render loop
  const tempPos = useRef(new THREE.Vector3());
  const tempTarget = useRef(new THREE.Vector3());

  // 1. Escuchar eventos de OrbitControls para conceder prioridad absoluta a la mano humana
  useEffect(() => {
    const controls = controlsRef.current;
    if (!controls) return;

    const onStart = () => {
      usuarioInteractuandoRef.current = true;
      if (timeoutInteraccionRef.current) {
        clearTimeout(timeoutInteraccionRef.current);
      }
    };

    const onEnd = () => {
      if (timeoutInteraccionRef.current) {
        clearTimeout(timeoutInteraccionRef.current);
      }
      // Reanudar la interpolación suave 1.2 segundos después de soltar el mouse
      timeoutInteraccionRef.current = setTimeout(() => {
        usuarioInteractuandoRef.current = false;
      }, 1200);
    };

    controls.addEventListener("start", onStart);
    controls.addEventListener("end", onEnd);

    // Exponer función de captura instantánea en window para el botón del Scrubber
    (window as any).__obtenerPoseCamara3BF = () => {
      const pos: [number, number, number] = [
        Number(camera.position.x.toFixed(4)),
        Number(camera.position.y.toFixed(4)),
        Number(camera.position.z.toFixed(4)),
      ];
      const targetVec = controls.target || new THREE.Vector3(0, 0, 0);
      const target: [number, number, number] = [
        Number(targetVec.x.toFixed(4)),
        Number(targetVec.y.toFixed(4)),
        Number(targetVec.z.toFixed(4)),
      ];
      const fov = (camera as THREE.PerspectiveCamera).fov || 45;
      return { pos, target, fov };
    };

    return () => {
      controls.removeEventListener("start", onStart);
      controls.removeEventListener("end", onEnd);
      delete (window as any).__obtenerPoseCamara3BF;
      if (timeoutInteraccionRef.current) {
        clearTimeout(timeoutInteraccionRef.current);
      }
    };
  }, [camera, controlsRef]);

  // Si el usuario da "Play", reanudamos inmediatamente el modo director
  useEffect(() => {
    if (isTimelinePlaying) {
      usuarioInteractuandoRef.current = false;
      if (timeoutInteraccionRef.current) {
        clearTimeout(timeoutInteraccionRef.current);
      }
    }
  }, [isTimelinePlaying]);

  // 2. Loop de animación cinemática en cada frame
  useFrame((_, delta) => {
    if (pestanaActiva !== "manual" || !pasoActivo) return;
    if (!camaraActiva || keyframes.length === 0) return;
    if (usuarioInteractuandoRef.current) return;

    const controls = controlsRef.current;
    if (!controls) return;

    const t = Math.max(0, timelineCurrentTime);

    // Caso A: Solo 1 keyframe definido -> la cámara se alinea suavemente con ese único ángulo
    if (keyframes.length === 1) {
      const kf = keyframes[0];
      tempPos.current.set(kf.posicion[0], kf.posicion[1], kf.posicion[2]);
      tempTarget.current.set(kf.target[0], kf.target[1], kf.target[2]);

      const factorLerp = Math.min(1.0, delta * 4.0);
      camera.position.lerp(tempPos.current, factorLerp);
      controls.target.lerp(tempTarget.current, factorLerp);
      controls.update();
      return;
    }

    // Caso B: Múltiples keyframes ordenados cronológicamente
    // Si estamos antes o en el primer keyframe
    if (t <= keyframes[0].tiempo) {
      const kf = keyframes[0];
      tempPos.current.set(kf.posicion[0], kf.posicion[1], kf.posicion[2]);
      tempTarget.current.set(kf.target[0], kf.target[1], kf.target[2]);

      const factorLerp = Math.min(1.0, delta * 5.0);
      camera.position.lerp(tempPos.current, factorLerp);
      controls.target.lerp(tempTarget.current, factorLerp);
      controls.update();
      return;
    }

    // Si estamos después o en el último keyframe
    const ultimoKf = keyframes[keyframes.length - 1];
    if (t >= ultimoKf.tiempo) {
      tempPos.current.set(ultimoKf.posicion[0], ultimoKf.posicion[1], ultimoKf.posicion[2]);
      tempTarget.current.set(ultimoKf.target[0], ultimoKf.target[1], ultimoKf.target[2]);

      const factorLerp = Math.min(1.0, delta * 5.0);
      camera.position.lerp(tempPos.current, factorLerp);
      controls.target.lerp(tempTarget.current, factorLerp);
      controls.update();
      return;
    }

    // Encontrar el segmento [kfA, kfB] tal que kfA.tiempo <= t < kfB.tiempo
    let kfA = keyframes[0];
    let kfB = keyframes[1];

    for (let i = 0; i < keyframes.length - 1; i++) {
      if (t >= keyframes[i].tiempo && t < keyframes[i + 1].tiempo) {
        kfA = keyframes[i];
        kfB = keyframes[i + 1];
        break;
      }
    }

    const duracionSegmento = Math.max(0.001, kfB.tiempo - kfA.tiempo);
    const alphaLineal = Math.max(0, Math.min(1, (t - kfA.tiempo) / duracionSegmento));

    // Función Smoothstep (Hermite cúbico) para aceleración y desaceleración suave cinemática
    const alphaSuave = alphaLineal * alphaLineal * (3 - 2 * alphaLineal);

    // Vector origen y vector destino
    const vPosA = new THREE.Vector3(kfA.posicion[0], kfA.posicion[1], kfA.posicion[2]);
    const vPosB = new THREE.Vector3(kfB.posicion[0], kfB.posicion[1], kfB.posicion[2]);
    const vTargetA = new THREE.Vector3(kfA.target[0], kfA.target[1], kfA.target[2]);
    const vTargetB = new THREE.Vector3(kfB.target[0], kfB.target[1], kfB.target[2]);

    // Interpolación de posición y punto focal
    tempPos.current.lerpVectors(vPosA, vPosB, alphaSuave);
    tempTarget.current.lerpVectors(vTargetA, vTargetB, alphaSuave);

    // Suavizado dinámico por delta para asegurar 60 FPS sin saltos
    const factorLerp = Math.min(1.0, delta * 12.0);
    camera.position.lerp(tempPos.current, factorLerp);
    controls.target.lerp(tempTarget.current, factorLerp);
    controls.update();
  });

  return null;
}
