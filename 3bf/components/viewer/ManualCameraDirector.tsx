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
 * Arquitectura de Cámara Desacoplada sin Libre Albedrío:
 * 
 * 1. MODO PELÍCULA (Bloqueado / Determinista):
 *    - Cuando el paso tiene keyframes y la cámara cinematográfica está activa.
 *    - La posición, target y FOV se evalúan como una función matemática pura F(t)
 *      utilizando interpolación Hermite cúbica suave (C1-continua).
 *    - Se aplican de forma instantánea y pura (copy), eliminando cualquier retardo
 *      temporal (lerp secundario) y fricción inercial de OrbitControls.
 *    - Cero variaciones o derivas tanto en reproducción como en pausa.
 * 
 * 2. MODO ENCUADRE / CALIBRACIÓN (Cámara de Trabajo):
 *    - Se activa deliberadamente cuando el usuario selecciona un keyframe para editarlo (rombo verde).
 *    - Libera el control de la cámara para permitir orbitar, panear y componer la toma.
 *    - Al hacer segundo clic (rombo amarillo), se guarda la pose y se vuelve a bloquear inmediatamente.
 */
export function ManualCameraDirector({ controlsRef }: ManualCameraDirectorProps) {
  const { camera } = useThree();
  const pestanaActiva = use3BFStore((s) => s.pestanaActiva);
  const pasoActivoManualId = use3BFStore((s) => s.pasoActivoManualId);
  const pasosManual = use3BFStore((s) => s.pasosManual);
  const timelineCurrentTime = use3BFStore((s) => s.timelineCurrentTime);
  const isTimelinePlaying = use3BFStore((s) => s.isTimelinePlaying);
  const autoEnfoqueCamaraManual = use3BFStore((s) => s.autoEnfoqueCamaraManual);
  const modoEncuadreCamaraManual = use3BFStore((s) => s.modoEncuadreCamaraManual);

  const pasoActivo = pasosManual.find((p) => p.id === pasoActivoManualId);
  const keyframes = pasoActivo?.keyframesCamara || [];
  const camaraActiva = Boolean(pasoActivo?.camaraCinematicaActiva === true);

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

  // Vectores temporales para cálculo determinista de alto rendimiento
  const tempPos = useRef(new THREE.Vector3());
  const tempTarget = useRef(new THREE.Vector3());
  const tempFov = useRef<number>(45);

  useEffect(() => {
    const controls = controlsRef.current;
    if (!controls) return;

    // Exponer función de captura instantánea en window para el botón del Scrubber / Calibrador
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
      transicionSaltoRef.current.tiempoRestante = 0.5; // 500ms de transición fluida
      transicionSaltoRef.current.activa = true;
    };

    // Exponer función para forzar encuadre cinematográfico inmediato al tiempo actual
    (window as any).__restaurarCamaraCinematica3BF = () => {
      transicionSaltoRef.current.activa = false;
    };

    return () => {
      delete (window as any).__obtenerPoseCamara3BF;
      delete (window as any).__saltarAKeyframeCamara3BF;
      delete (window as any).__restaurarCamaraCinematica3BF;
    };
  }, [camera, controlsRef]);

  // Si el usuario da "Play", cancelamos transiciones de salto para seguir la curva
  useEffect(() => {
    if (isTimelinePlaying) {
      transicionSaltoRef.current.activa = false;
    }
  }, [isTimelinePlaying]);

  // 2. Loop de animación cinemática en cada frame
  useFrame((_, delta) => {
    if (pestanaActiva !== "manual" || !pasoActivo) return;
    if (!camaraActiva || keyframes.length === 0 || autoEnfoqueCamaraManual) return;

    const controls = controlsRef.current;
    if (!controls) return;

    // 🟢 Si el usuario tiene un keyframe en MODO ENCUADRE (Verde), la cámara permanece 100% libre para componer
    const isEditingKeyframe = modoEncuadreCamaraManual || (window as any).__isEditingKeyframeCamera3BF === true;
    if (isEditingKeyframe) return;

    // A. Manejo de transición suave hacia un keyframe seleccionado (cuando el usuario hace clic en el rombo)
    if (transicionSaltoRef.current.activa) {
      transicionSaltoRef.current.tiempoRestante -= delta;
      const factorLerp = Math.min(1.0, delta * 10.0);
      camera.position.lerp(transicionSaltoRef.current.posDestino, factorLerp);
      controls.target.lerp(transicionSaltoRef.current.targetDestino, factorLerp);
      camera.lookAt(controls.target);
      controls.update();

      if (transicionSaltoRef.current.tiempoRestante <= 0) {
        camera.position.copy(transicionSaltoRef.current.posDestino);
        controls.target.copy(transicionSaltoRef.current.targetDestino);
        camera.lookAt(controls.target);
        controls.update();
        transicionSaltoRef.current.activa = false;
      }
      return;
    }

    // B. MODO CÁMARA CINEMATOGRÁFICA (EVALUACIÓN MATEMÁTICA EXACTA F(t))
    const t = Math.max(0, timelineCurrentTime);

    // Caso 1: Solo 1 keyframe definido -> Bloqueo exacto a ese ángulo
    if (keyframes.length === 1) {
      const kf = keyframes[0];
      tempPos.current.set(kf.posicion[0], kf.posicion[1], kf.posicion[2]);
      tempTarget.current.set(kf.target[0], kf.target[1], kf.target[2]);
      tempFov.current = kf.fov || 45;
    }
    // Caso 2: Antes del primer keyframe
    else if (t <= keyframes[0].tiempo) {
      const kf = keyframes[0];
      tempPos.current.set(kf.posicion[0], kf.posicion[1], kf.posicion[2]);
      tempTarget.current.set(kf.target[0], kf.target[1], kf.target[2]);
      tempFov.current = kf.fov || 45;
    }
    // Caso 3: Después del último keyframe
    else if (t >= keyframes[keyframes.length - 1].tiempo) {
      const ultimoKf = keyframes[keyframes.length - 1];
      tempPos.current.set(ultimoKf.posicion[0], ultimoKf.posicion[1], ultimoKf.posicion[2]);
      tempTarget.current.set(ultimoKf.target[0], ultimoKf.target[1], ultimoKf.target[2]);
      tempFov.current = ultimoKf.fov || 45;
    }
    // Caso 4: Interpolación Hermite cúbica suave entre el par de keyframes activo [kfA, kfB]
    else {
      let kfA = keyframes[0];
      let kfB = keyframes[1];

      for (let i = 0; i < keyframes.length - 1; i++) {
        if (t >= keyframes[i].tiempo && t < keyframes[i + 1].tiempo) {
          kfA = keyframes[i];
          kfB = keyframes[i + 1];
          break;
        }
      }

      const duracionSegmento = Math.max(0.0001, kfB.tiempo - kfA.tiempo);
      const alphaLineal = Math.max(0, Math.min(1, (t - kfA.tiempo) / duracionSegmento));

      // Función Smoothstep Hermite cúbica: 3α² - 2α³ (aceleración y desaceleración fluida sin picos)
      const alphaSuave = alphaLineal * alphaLineal * (3 - 2 * alphaLineal);

      const vPosA = new THREE.Vector3(kfA.posicion[0], kfA.posicion[1], kfA.posicion[2]);
      const vPosB = new THREE.Vector3(kfB.posicion[0], kfB.posicion[1], kfB.posicion[2]);
      const vTargetA = new THREE.Vector3(kfA.target[0], kfA.target[1], kfA.target[2]);
      const vTargetB = new THREE.Vector3(kfB.target[0], kfB.target[1], kfB.target[2]);

      tempPos.current.lerpVectors(vPosA, vPosB, alphaSuave);
      tempTarget.current.lerpVectors(vTargetA, vTargetB, alphaSuave);

      const fovA = kfA.fov || 45;
      const fovB = kfB.fov || 45;
      tempFov.current = fovA + (fovB - fovA) * alphaSuave;
    }

    // 🎯 APLICACIÓN DIRECTA Y DETERMINISTA (Cero lag, cero arrastre inercial, cero libre albedrío)
    camera.position.copy(tempPos.current);
    controls.target.copy(tempTarget.current);

    if (tempFov.current && "fov" in camera && (camera as THREE.PerspectiveCamera).fov !== tempFov.current) {
      (camera as THREE.PerspectiveCamera).fov = tempFov.current;
      (camera as THREE.PerspectiveCamera).updateProjectionMatrix();
    }

    camera.lookAt(controls.target);
    controls.update();
  });

  return null;
}
