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
  const autoEnfoqueCamaraManual = use3BFStore((s) => s.autoEnfoqueCamaraManual);

  const pasoActivo = pasosManual.find((p) => p.id === pasoActivoManualId);
  const keyframes = pasoActivo?.keyframesCamara || [];
  const camaraActiva = pasoActivo?.camaraCinematicaActiva ?? true;

  // Detección de interacción manual del usuario en el viewport
  const usuarioInteractuandoRef = useRef<boolean>(false);
  const timeoutInteraccionRef = useRef<NodeJS.Timeout | null>(null);

  // Control de animación transitoria cuando se hace clic en un keyframe para saltar a él
  const transicionSaltoRef = useRef<{
    activa: boolean;
    posDestino: THREE.Vector3;
    targetDestino: THREE.Vector3;
    tiempoRestante: number;
  }>({
    activa: false,
    posDestino: new THREE.Vector3(),
    targetDestino: new THREE.Vector3(),
    tiempoRestante: 0,
  });

  // Vectores temporales para evitar garbage collection en el render loop
  const tempPos = useRef(new THREE.Vector3());
  const tempTarget = useRef(new THREE.Vector3());

  // 1. Escuchar eventos de OrbitControls para conceder prioridad absoluta a la mano humana
  useEffect(() => {
    const controls = controlsRef.current;
    if (!controls) return;

    const onStart = () => {
      usuarioInteractuandoRef.current = true;
      transicionSaltoRef.current.activa = false;
      if (timeoutInteraccionRef.current) {
        clearTimeout(timeoutInteraccionRef.current);
      }
    };

    const onEnd = () => {
      if (timeoutInteraccionRef.current) {
        clearTimeout(timeoutInteraccionRef.current);
      }
      // Cuando el usuario suelta el mouse, no bloqueamos la cámara: permanece libre
      timeoutInteraccionRef.current = setTimeout(() => {
        usuarioInteractuandoRef.current = false;
      }, 300);
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

    // Exponer función para saltar con animación suave hacia un keyframe
    (window as any).__saltarAKeyframeCamara3BF = (
      pos: [number, number, number],
      target: [number, number, number]
    ) => {
      transicionSaltoRef.current.posDestino.set(pos[0], pos[1], pos[2]);
      transicionSaltoRef.current.targetDestino.set(target[0], target[1], target[2]);
      transicionSaltoRef.current.tiempoRestante = 0.6; // 600ms de transición fluida
      transicionSaltoRef.current.activa = true;
      usuarioInteractuandoRef.current = false;
    };

    return () => {
      controls.removeEventListener("start", onStart);
      controls.removeEventListener("end", onEnd);
      delete (window as any).__obtenerPoseCamara3BF;
      delete (window as any).__saltarAKeyframeCamara3BF;
      if (timeoutInteraccionRef.current) {
        clearTimeout(timeoutInteraccionRef.current);
      }
    };
  }, [camera, controlsRef]);

  // Seguimiento de último tiempo y paso evaluado para responder a clics y cambios de fotograma
  const ultimoTiempoRef = useRef<number>(-1);
  const ultimoPasoIdRef = useRef<string>("");

  // Si cambia de paso, forzamos re-evaluación inmediata para encuadrar la cámara
  useEffect(() => {
    if (pasoActivoManualId !== ultimoPasoIdRef.current) {
      ultimoPasoIdRef.current = pasoActivoManualId;
      ultimoTiempoRef.current = -1;
      usuarioInteractuandoRef.current = false;
    }
  }, [pasoActivoManualId]);

  // Si el usuario da "Play", reanudamos inmediatamente el modo director
  useEffect(() => {
    if (isTimelinePlaying) {
      usuarioInteractuandoRef.current = false;
      transicionSaltoRef.current.activa = false;
      if (timeoutInteraccionRef.current) {
        clearTimeout(timeoutInteraccionRef.current);
      }
    }
  }, [isTimelinePlaying]);

  // 2. Loop de animación cinemática en cada frame
  useFrame((_, delta) => {
    if (pestanaActiva !== "manual" || !pasoActivo) return;
    if (!camaraActiva || keyframes.length === 0 || autoEnfoqueCamaraManual) return;

    const controls = controlsRef.current;
    if (!controls) return;

    // A. Manejo de transición suave hacia un keyframe seleccionado (cuando el usuario hace clic en el rombo)
    if (transicionSaltoRef.current.activa) {
      if (usuarioInteractuandoRef.current) {
        transicionSaltoRef.current.activa = false;
        return;
      }

      transicionSaltoRef.current.tiempoRestante -= delta;
      const factorLerp = Math.min(1.0, delta * 8.0);
      camera.position.lerp(transicionSaltoRef.current.posDestino, factorLerp);
      controls.target.lerp(transicionSaltoRef.current.targetDestino, factorLerp);
      controls.update();

      if (transicionSaltoRef.current.tiempoRestante <= 0) {
        transicionSaltoRef.current.activa = false;
      }
      return;
    }

    // B. MODO LIBRE vs SEGUIMIENTO INTELIGENTE:
    // Si el usuario está orbitando manualmente con el mouse, respetamos su mano al 100%
    if (usuarioInteractuandoRef.current) return;

    // 🟢 Si el usuario tiene un keyframe en MODO ENCUADRE (Verde), la cámara permanece 100% libre para reposicionar
    const isEditingKeyframe = (window as any).__isEditingKeyframeCamera3BF === true;
    if (isEditingKeyframe) return;

    const isScrubbing = (window as any).__isTimelineScrubbing === true;
    const tiempoCambio = Math.abs(timelineCurrentTime - ultimoTiempoRef.current) > 0.01;

    // Si está pausado, no está haciendo scrubbing y la cámara ya se asentó en este tiempo, queda libre
    if (!isTimelinePlaying && !isScrubbing && !tiempoCambio) {
      return;
    }

    const t = Math.max(0, timelineCurrentTime);

    // Caso 1: Solo 1 keyframe definido -> la cámara se alinea suavemente con ese único ángulo
    if (keyframes.length === 1) {
      const kf = keyframes[0];
      tempPos.current.set(kf.posicion[0], kf.posicion[1], kf.posicion[2]);
      tempTarget.current.set(kf.target[0], kf.target[1], kf.target[2]);

      const factorLerp = Math.min(1.0, delta * 5.0);
      camera.position.lerp(tempPos.current, factorLerp);
      controls.target.lerp(tempTarget.current, factorLerp);
      controls.update();

      if (!isTimelinePlaying && camera.position.distanceTo(tempPos.current) < 0.005) {
        ultimoTiempoRef.current = timelineCurrentTime;
      }
      return;
    }

    // Caso 2: Múltiples keyframes ordenados cronológicamente
    if (t <= keyframes[0].tiempo) {
      const kf = keyframes[0];
      tempPos.current.set(kf.posicion[0], kf.posicion[1], kf.posicion[2]);
      tempTarget.current.set(kf.target[0], kf.target[1], kf.target[2]);

      const factorLerp = Math.min(1.0, delta * 6.0);
      camera.position.lerp(tempPos.current, factorLerp);
      controls.target.lerp(tempTarget.current, factorLerp);
      controls.update();

      if (!isTimelinePlaying && camera.position.distanceTo(tempPos.current) < 0.005) {
        ultimoTiempoRef.current = timelineCurrentTime;
      }
      return;
    }

    const ultimoKf = keyframes[keyframes.length - 1];
    if (t >= ultimoKf.tiempo) {
      tempPos.current.set(ultimoKf.posicion[0], ultimoKf.posicion[1], ultimoKf.posicion[2]);
      tempTarget.current.set(ultimoKf.target[0], ultimoKf.target[1], ultimoKf.target[2]);

      const factorLerp = Math.min(1.0, delta * 6.0);
      camera.position.lerp(tempPos.current, factorLerp);
      controls.target.lerp(tempTarget.current, factorLerp);
      controls.update();

      if (!isTimelinePlaying && camera.position.distanceTo(tempPos.current) < 0.005) {
        ultimoTiempoRef.current = timelineCurrentTime;
      }
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

    if (!isTimelinePlaying && camera.position.distanceTo(tempPos.current) < 0.005) {
      ultimoTiempoRef.current = timelineCurrentTime;
    }
  });

  return null;
}
