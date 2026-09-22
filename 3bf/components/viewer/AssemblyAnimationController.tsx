"use client";

import React, { useRef, useEffect } from "react";
import * as THREE from "three";
import { use3BFStore } from "@/lib/store";
import { KinematicEngineResult, compilarAnimacionPaso } from "@/lib/manualAnimationEngine";
import { getSafeRestPosition, getSafeRestQuaternion } from "@/lib/engine/cadStateUtils";

interface AssemblyAnimationControllerProps {
  furnitureGroup: THREE.Group | null;
}

/**
 * 🎬 AssemblyAnimationController
 * Controlador desacoplado de React Three Fiber que gestiona el ciclo de vida del
 * motor de cinemática (AnimationMixer, clips nativos, subbloques y transformaciones de banco).
 * 
 * - Compila únicamente cuando cambia de paso o la estructura geométrica del mismo.
 * - Sincroniza la línea de tiempo a 60 FPS mediante suscripción reactiva selectiva (sin re-renders de React).
 */
export function AssemblyAnimationController({ furnitureGroup }: AssemblyAnimationControllerProps) {
  const pestanaActiva = use3BFStore((s) => s.pestanaActiva);
  const pasosManual = use3BFStore((s) => s.pasosManual);
  const pasoActivoManualId = use3BFStore((s) => s.pasoActivoManualId);
  const objetoActivoId = use3BFStore((s) => s.objetoActivoId);
  const instancias = use3BFStore((s) => s.instancias);
  const vistaPiezasDesplazadas = use3BFStore((s) => s.vistaPiezasDesplazadas);

  const activeStep = pasosManual.find((p) => p.id === pasoActivoManualId) || pasosManual[0];
  const versionAnimacionManual = use3BFStore((s) => s.versionAnimacionManual);
  const engineRef = useRef<KinematicEngineResult | null>(null);
  const lastTimeRef = useRef<number>(-1);

  // Obtener el grupo de muebles efectivo (prop directa o fallback dinámico a mapa de instancias o escena)
  const effectiveGroup = React.useMemo(() => {
    if (furnitureGroup) return furnitureGroup;
    if (typeof window !== "undefined") {
      const groupsMap = (window as any).__3bfInstanceGroups as Map<string, THREE.Group> | undefined;
      if (groupsMap && groupsMap.size > 0) {
        if (objetoActivoId && groupsMap.has(objetoActivoId)) {
          return groupsMap.get(objetoActivoId)!;
        }
        return groupsMap.values().next().value || null;
      }
      if ((window as any).__threeScene3BF) {
        return (window as any).__threeScene3BF;
      }
    }
    return null;
  }, [furnitureGroup, objetoActivoId, instancias]);

  // Clave estable de configuración para compilar cuando cambie el paso, su estructura o tiempos de pistas
  const compilationKey = React.useMemo(() => {
    if (!activeStep) return "";
    const tracksSubbloquesStr = (activeStep.subbloques || [])
      .map((s) => `${s.id}:${s.trackAnimacion?.tiempoInicio ?? 0}:${s.trackAnimacion?.duracion ?? 0}`)
      .join("|");

    return [
      activeStep.id,
      activeStep.duracionTotal,
      activeStep.tipo,
      activeStep.subbloques?.length || 0,
      tracksSubbloquesStr,
      activeStep.secuencia?.length || 0,
      activeStep.coreografiaSubbloques || 1,
      activeStep.showcase?.coreografia || "",
      activeStep.configuracionCinematica?.piezasEspera?.length || 0,
      vistaPiezasDesplazadas ? "desplazada" : "original",
      versionAnimacionManual || 0,
    ].join("_");
  }, [activeStep, vistaPiezasDesplazadas, versionAnimacionManual]);

  // 1. Efecto de Compilación: Se ejecuta ÚNICAMENTE cuando cambia el paso, su estructura o se solicita despertar
  useEffect(() => {
    if (pestanaActiva !== "manual" || !effectiveGroup || !activeStep) {
      if (engineRef.current) {
        engineRef.current.detener();
        engineRef.current = null;
      }
      return;
    }

    if (typeof window !== "undefined") {
      (window as any).__threeScene3BF = effectiveGroup;
    }

    const esPasoSubbloques = Boolean(activeStep.subbloques && activeStep.subbloques.length > 0 && activeStep.tipo !== "showcase");

    // Si el usuario elige ver la pieza en posición CAD ensamblada y no tiene subbloques:
    if (!vistaPiezasDesplazadas && !esPasoSubbloques) {
      if (engineRef.current) {
        engineRef.current.detener();
        engineRef.current = null;
      }
      effectiveGroup.traverse((child: any) => {
        if (child.isMesh) {
          const rest = getSafeRestPosition(child);
          child.position.copy(rest);
          const restQ = getSafeRestQuaternion(child);
          child.quaternion.copy(restQ);
          child.updateMatrix();
          child.updateMatrixWorld(true);
        }
      });
      return;
    }

    try {
      const res = compilarAnimacionPaso(effectiveGroup, activeStep);
      engineRef.current = res;
      lastTimeRef.current = -1; // ⚡ Resetear memoria de tiempo para garantizar evaluación reactiva
      if (typeof window !== "undefined") {
        (window as any).__3bfManualEngine = res;
        (window as any).__3bfDespertarAnimacion = () => {
          if (engineRef.current) {
            if (engineRef.current.despertar) {
              engineRef.current.despertar();
            }
            const t = use3BFStore.getState().timelineCurrentTime || 0;
            engineRef.current.actualizarTiempo(t);
          }
        };
      }
      const tActual = use3BFStore.getState().timelineCurrentTime || 0;
      res.actualizarTiempo(tActual);
    } catch (e) {
      console.warn("[AssemblyAnimationController] Error al compilar animación:", e);
    }

    return () => {
      if (typeof window !== "undefined" && (window as any).__3bfManualEngine === engineRef.current) {
        (window as any).__3bfManualEngine = null;
        (window as any).__3bfDespertarAnimacion = null;
      }
      if (engineRef.current) {
        engineRef.current.detener();
        engineRef.current = null;
      }
    };
  }, [pestanaActiva, effectiveGroup, compilationKey]);

  // 2. Suscripción Reactiva a 60 FPS: Actualiza Three.js directamente SIN re-renderizar React
  useEffect(() => {
    const unsub = use3BFStore.subscribe((state) => {
      if (engineRef.current && state.pestanaActiva === "manual") {
        if (state.timelineCurrentTime !== lastTimeRef.current) {
          lastTimeRef.current = state.timelineCurrentTime;
          engineRef.current.actualizarTiempo(state.timelineCurrentTime);
        }
      }
    });
    return () => unsub();
  }, []);

  return null;
}

export default AssemblyAnimationController;
