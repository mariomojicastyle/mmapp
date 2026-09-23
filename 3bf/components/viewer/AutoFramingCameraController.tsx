"use client";

import React, { useEffect, useRef } from "react";
import * as THREE from "three";
import { useThree, useFrame } from "@react-three/fiber";
import { use3BFStore } from "@/lib/store";
import { extraerPiezaMadre, perteneceAMismaFamiliaPieza } from "@/lib/piezaMadreUtils";
import { coincidenMismoHerraje } from "@/lib/engine/cadStateUtils";

interface AutoFramingCameraControllerProps {
  controlsRef: React.MutableRefObject<any>;
}

/**
 * 🎥 AutoFramingCameraController
 *
 * Sistema cinematográfico inteligente de encuadre automático (Bounding Box Framing).
 * - Identifica en cada segundo del timeline las piezas y herrajes que están apareciendo.
 * - Calcula la caja envolvente tridimensional (THREE.Box3) que contiene el 100% de la geometría activa.
 * - Mueve suavemente (lerp) el objetivo (controls.target) y la posición de la cámara (camera.position)
 *   calculando la distancia óptica exacta según el FOV para evitar recortes.
 * - Cede inmediatamente el control si el usuario arrastra manualmente con el mouse (órbita, pan o zoom).
 */
export function AutoFramingCameraController({ controlsRef }: AutoFramingCameraControllerProps) {
  const { camera, scene } = useThree();
  const pestanaActiva = use3BFStore((s) => s.pestanaActiva);
  const pasoActivoManualId = use3BFStore((s) => s.pasoActivoManualId);
  const pasosManual = use3BFStore((s) => s.pasosManual);
  const timelineCurrentTime = use3BFStore((s) => s.timelineCurrentTime);
  const isTimelinePlaying = use3BFStore((s) => s.isTimelinePlaying);
  const autoEnfoqueCamaraManual = use3BFStore((s) => s.autoEnfoqueCamaraManual);

  const pasoActivo = pasosManual.find((p) => p.id === pasoActivoManualId);

  // Objetivos interpolados
  const targetObjetivoRef = useRef<THREE.Vector3>(new THREE.Vector3(0, 0.3, 0));
  const posObjetivoRef = useRef<THREE.Vector3>(new THREE.Vector3(0.8, 0.7, 1.1));
  const usuarioInteractuandoRef = useRef<boolean>(false);
  const ultimoTimeoutInteraccionRef = useRef<NodeJS.Timeout | null>(null);
  const ultimoGrupoEnfocadoKeyRef = useRef<string>("");

  // 1. Escuchar eventos de interacción manual en OrbitControls para no pelear con la mano del usuario
  useEffect(() => {
    const controls = controlsRef.current;
    if (!controls) return;

    const onStart = () => {
      usuarioInteractuandoRef.current = true;
      if (ultimoTimeoutInteraccionRef.current) {
        clearTimeout(ultimoTimeoutInteraccionRef.current);
      }
    };

    const onEnd = () => {
      // Reanudar auto-enfoque 1.5s después de que el usuario suelte el mouse
      if (ultimoTimeoutInteraccionRef.current) {
        clearTimeout(ultimoTimeoutInteraccionRef.current);
      }
      ultimoTimeoutInteraccionRef.current = setTimeout(() => {
        usuarioInteractuandoRef.current = false;
      }, 1500);
    };

    controls.addEventListener("start", onStart);
    controls.addEventListener("end", onEnd);

    return () => {
      controls.removeEventListener("start", onStart);
      controls.removeEventListener("end", onEnd);
      if (ultimoTimeoutInteraccionRef.current) {
        clearTimeout(ultimoTimeoutInteraccionRef.current);
      }
    };
  }, [controlsRef]);

  // 2. Evaluar qué piezas y herrajes están activos en el tiempo actual del timeline
  useEffect(() => {
    const tieneKeyframesCinematicos =
      (pasoActivo?.keyframesCamara?.length || 0) > 0 &&
      pasoActivo?.camaraCinematicaActiva !== false;

    if (pestanaActiva !== "manual" || !pasoActivo || !autoEnfoqueCamaraManual) return;
    if (!controlsRef.current || !camera) return;

    const piezasEspera = pasoActivo.configuracionCinematica?.piezasEspera || [];
    const secuencia = pasoActivo.secuencia || [];

    // Encontrar qué piezas están en su ventana de aparición activa
    const t = timelineCurrentTime;
    const piezasActivasNombres: string[] = [];

    piezasEspera.forEach((p) => {
      let tAparicion = p.tiempoAparicionPieza || 0;
      const elemSeq = secuencia.find((s) => s.nombreNodo === p.nombrePieza || perteneceAMismaFamiliaPieza(s.nombreNodo, p.nombrePieza));
      
      const tFinHw = p.tiempoFinHerrajes || elemSeq?.tiempoFinHerrajes || 0;
      if (tFinHw > 0 && tAparicion > tFinHw) {
        tAparicion = tFinHw;
      } else if (tAparicion >= 100) {
        tAparicion = 0;
      }

      const tIni = elemSeq ? elemSeq.tiempoInicio : tAparicion;
      const dur = elemSeq ? (elemSeq.duracionMovimiento || 1.5) + (elemSeq.duracionInsercionHerrajes || 0) : 3.0;
      
      const ventanaStart = Math.min(tAparicion, tIni);
      const ventanaEnd = Math.max(
        tAparicion + 2.5,
        tFinHw > 0 ? tFinHw + (elemSeq?.duracionMovimiento || 1.5) + 0.8 : tIni + dur + 0.5
      );

      if (t >= ventanaStart && t <= ventanaEnd) {
        piezasActivasNombres.push(p.nombrePieza);
      }
    });

    // Si ninguna pieza individual está en su ventana activa, pero estamos al inicio o fin del paso:
    let focoGrupoKey = piezasActivasNombres.sort().join("+");
    if (piezasActivasNombres.length === 0) {
      if (t <= 0.1 && piezasEspera.length > 0) {
        // Al inicio, enfocar la primera pieza que aparece
        const primerOrden = [...piezasEspera].sort((a, b) => (a.tiempoAparicionPieza || 0) - (b.tiempoAparicionPieza || 0));
        if (primerOrden[0]) {
          piezasActivasNombres.push(primerOrden[0].nombrePieza);
          focoGrupoKey = primerOrden[0].nombrePieza;
        }
      } else {
        // Si no hay piezas en transición, enfocar el ensamble completo
        focoGrupoKey = "__TODO_EL_ENSAMBLE__";
      }
    }

    // Recopilar mallas correspondientes en la escena
    const mallasAEnfocar: THREE.Object3D[] = [];

    scene.traverse((child) => {
      if (!(child as THREE.Mesh).isMesh) return;
      const n = child.name || "";
      const u = child.userData || {};
      const cleanName = (u.cleanName as string) || n;
      const instKey = (u.instanciaKey as string) || cleanName;
      const piezaMadre = (u.piezaMadre as string) || extraerPiezaMadre(cleanName);

      if (focoGrupoKey === "__TODO_EL_ENSAMBLE__") {
        // Ignorar helpers, grids o pisos planos
        if (!n.toLowerCase().includes("grid") && !n.toLowerCase().includes("helper")) {
          mallasAEnfocar.push(child);
        }
        return;
      }

      // Verificar si pertenece a alguna de las piezas activas
      const coincidePieza = piezasActivasNombres.some((pNombre) => {
        return (
          pNombre === cleanName ||
          pNombre === n ||
          pNombre === instKey ||
          perteneceAMismaFamiliaPieza(pNombre, cleanName) ||
          perteneceAMismaFamiliaPieza(pNombre, piezaMadre)
        );
      });

      if (coincidePieza) {
        mallasAEnfocar.push(child);
        return;
      }

      // Verificar si es un herraje asociado a las piezas activas
      const esHerrajeDePiezaActiva = piezasActivasNombres.some((pNombre) => {
        const pConf = piezasEspera.find((p) => p.nombrePieza === pNombre);
        if (!pConf) return false;
        const herrajesHabilitados = pConf.herrajesCohesionados || [];
        return herrajesHabilitados.some((hId) => coincidenMismoHerraje(hId, instKey) || coincidenMismoHerraje(hId, cleanName));
      });

      if (esHerrajeDePiezaActiva) {
        mallasAEnfocar.push(child);
      }
    });

    if (mallasAEnfocar.length === 0) return;

    // Calcular Bounding Box
    const box = new THREE.Box3();
    mallasAEnfocar.forEach((mesh) => {
      mesh.updateWorldMatrix(true, false);
      box.expandByObject(mesh);
    });

    if (box.isEmpty()) return;

    const center = new THREE.Vector3();
    const size = new THREE.Vector3();
    box.getCenter(center);
    box.getSize(size);

    // Si la caja engloba todo o está muy cerca del piso, levantar ligeramente el target para mejor perspectiva
    const targetCenter = center.clone();
    if (targetCenter.y < 0.1) {
      targetCenter.y = Math.max(targetCenter.y, 0.12);
    }

    // Cálculo óptico basado en FOV para que quepa 100% con un margen del 30%
    const maxDim = Math.max(size.x, size.y, size.z, 0.35);
    const fovDeg = (camera as THREE.PerspectiveCamera).fov || 45;
    const fovRad = (fovDeg * Math.PI) / 180;
    const distanciaOptima = Math.max(0.65, ((maxDim / 2) / Math.tan(fovRad / 2)) * 1.30);

    // Vector director ergonómico: ángulo 3/4 con elevación elegante
    const dirCam = new THREE.Vector3(0.7, 0.55, 0.85).normalize();
    const targetCamPos = targetCenter.clone().add(dirCam.multiplyScalar(distanciaOptima));

    targetObjetivoRef.current.copy(targetCenter);
    posObjetivoRef.current.copy(targetCamPos);
    ultimoGrupoEnfocadoKeyRef.current = focoGrupoKey;
  }, [
    pestanaActiva,
    pasoActivo,
    timelineCurrentTime,
    autoEnfoqueCamaraManual,
    camera,
    scene,
    controlsRef,
  ]);

  // 3. Paneo e interpolación suave en cada fotograma (lerp a 60fps)
  useFrame((_, delta) => {
    const tieneKeyframesCinematicos =
      (pasoActivo?.keyframesCamara?.length || 0) > 0 &&
      pasoActivo?.camaraCinematicaActiva !== false;

    if (pestanaActiva !== "manual" || !autoEnfoqueCamaraManual) return;
    if (usuarioInteractuandoRef.current) return;
    const controls = controlsRef.current;
    if (!controls || !camera) return;

    // Velocidad de seguimiento suave: rápida si el timeline se reproduce, orgánica si está pausado
    const lerpSpeed = isTimelinePlaying ? 4.5 : 3.0;
    const factor = Math.min(1.0, delta * lerpSpeed);

    controls.target.lerp(targetObjetivoRef.current, factor);
    camera.position.lerp(posObjetivoRef.current, factor);
    controls.update();
  });

  return null;
}
