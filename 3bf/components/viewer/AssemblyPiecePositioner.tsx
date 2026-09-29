"use client";

import React, { useRef, useEffect, useState } from "react";
import * as THREE from "three";
import { useThree, useFrame } from "@react-three/fiber";
import { Line, Html } from "@react-three/drei";
import { use3BFStore } from "@/lib/store";
import { extraerPiezaMadre, extraerFamiliaPieza, perteneceAMismaFamiliaPieza } from "@/lib/piezaMadreUtils";
import { getSafeRestPosition, coincidenMismoHerraje, isHardwareMeshName } from "@/lib/engine/cadStateUtils";

interface TargetMeshItem {
  mesh: THREE.Mesh;
  initialLocalPos: THREE.Vector3;
  restLocalPos: THREE.Vector3;
  restWorldPos: THREE.Vector3;
}

/**
 * 🎯 AssemblyPiecePositioner
 * Permite que al activar "Posicionar en el escenario" una pieza específica del paso de ensamble,
 * dicha pieza (y todas sus instancias hermanas si tiene varias, ej. Peça 8 (1), (2), (3))
 * se adhieran en tiempo real al puntero del mouse proyectadas estrictamente sobre el plano
 * del piso horizontal (Y = 0 en el mundo), moviéndose sin oscilaciones ni vuelos verticales.
 *
 * Controles tipo Blender:
 * - Movimiento del mouse: arrastra la pieza sobre el piso.
 * - Tecla X: restringe el movimiento estrictamente al eje X (transversal).
 * - Tecla Y: restringe el movimiento estrictamente al eje Y del taller (longitudinal).
 * - Tecla C / G: vuelve al modo libre (ambos ejes).
 * - Clic izquierdo: fija la coordenada exacta (X, Y en cm) en el paso activo.
 * - Tecla Escape (Esc): cancela y devuelve las piezas a su posición original.
 */
export function AssemblyPiecePositioner({
  furnitureGroup,
}: {
  furnitureGroup: THREE.Group | null;
}) {
  const { camera, raycaster, pointer, gl } = useThree();
  const {
    piezaEnPosicionamientoManual,
    setPiezaEnPosicionamientoManual,
    setUltimaPiezaCalibrada,
    pasosManual,
    actualizarPasoManual,
    setVistaPiezasDesplazadas,
    despertarAnimacionManual,
  } = use3BFStore();

  const floorPlane = useRef(new THREE.Plane(new THREE.Vector3(0, 1, 0), 0));
  const intersectPoint = useRef(new THREE.Vector3());
  const targetMeshesRef = useRef<TargetMeshItem[]>([]);
  const collectiveRestWorldRef = useRef<THREE.Vector3>(new THREE.Vector3());
  const latestDeltaWorldRef = useRef<THREE.Vector3>(new THREE.Vector3(0, 0, 0));
  const latestDeltaLocalRef = useRef<THREE.Vector3>(new THREE.Vector3(0, 0, 0));
  const floorDropYRef = useRef<number>(0);

  // 🪶 Control de Antigravedad (Neutralizar caída al suelo para conservar cota de altura)
  const [antigravedad, setAntigravedad] = useState<boolean>(false);
  const antigravedadRef = useRef<boolean>(false);

  // 🎯 Restricción de ejes al estilo Blender (X: Transversal, Y: Longitudinal taller)
  const [ejeRestringido, setEjeRestringido] = useState<"X" | "Y" | null>(null);
  const ejeRestringidoRef = useRef<"X" | "Y" | null>(null);

  // 1. Localizar TODAS las mallas correspondientes a la pieza activa (incluyendo instancias hermanas)
  useEffect(() => {
    if (!piezaEnPosicionamientoManual) {
      targetMeshesRef.current = [];
      floorDropYRef.current = 0;
      setEjeRestringido(null);
      ejeRestringidoRef.current = null;
      return;
    }

    setEjeRestringido(null);
    ejeRestringidoRef.current = null;

    setVistaPiezasDesplazadas(true);

    const rawNombre = typeof piezaEnPosicionamientoManual === "string"
      ? piezaEnPosicionamientoManual
      : piezaEnPosicionamientoManual.nombrePieza;

    if (!rawNombre || typeof rawNombre !== "string") {
      targetMeshesRef.current = [];
      floorDropYRef.current = 0;
      return;
    }

    const targetKey = rawNombre.toLowerCase().trim();
    const targetMadre = extraerPiezaMadre(targetKey).toLowerCase().trim();
    const targetFamilia = extraerFamiliaPieza(targetKey).toLowerCase().trim();
    const tieneInstanciaTarget = /\(\d+\)/.test(targetKey);
    const matchInstanciaTarget = targetKey.match(/\((\d+)\)/);

    // Recuperar los herrajes cohesionados que viajan con esta pieza (secuencia clásica o Múltiple Plus)
    const pasoId = typeof piezaEnPosicionamientoManual === "string"
      ? (pasosManual[0]?.id || "")
      : piezaEnPosicionamientoManual.pasoId;
    const pasoActivo = pasosManual.find((p) => p.id === pasoId);

    // Inicializar antigravedad desde la configuración de Múltiple Plus del paso
    const agInit = Boolean(pasoActivo?.multiplePlus?.antigravedad);
    setAntigravedad(agInit);
    antigravedadRef.current = agInit;
    const elemSecuencia = pasoActivo?.secuencia?.find((s) => {
      const sNombre = (s.nombreNodo || "").toLowerCase().trim();
      if (sNombre === targetKey) return true;
      if (tieneInstanciaTarget || /\(\d+\)/.test(sNombre)) return false;
      return perteneceAMismaFamiliaPieza(sNombre, targetKey);
    });
    const herrajesCohesionadosSet = new Set(
      (elemSecuencia?.herrajesCohesionados || []).map((h) => h.toLowerCase().trim())
    );

    // Herrajes de la capa en Múltiple Plus (o asignados a este tablero)
    if (pasoActivo?.multiplePlus?.capas) {
      for (const capa of pasoActivo.multiplePlus.capas) {
        const tieneTablero = (capa.tableros || []).some((t) => {
          const tId = t.id.toLowerCase().trim();
          if (tId === targetKey) return true;
          if (tieneInstanciaTarget || /\(\d+\)/.test(tId)) return false;
          return perteneceAMismaFamiliaPieza(tId, targetKey);
        });
        if (tieneTablero) {
          (capa.herrajes || []).forEach((h) => herrajesCohesionadosSet.add(h.id.toLowerCase().trim()));
          (capa.congelados || []).forEach((c) => herrajesCohesionadosSet.add(c.id.toLowerCase().trim()));
        }
      }
    }

    const isMatch = (child: THREE.Object3D): boolean => {
      const name = (child.name || "").replace(/^RH_OUT:/i, "").trim().toLowerCase();
      const cleanName = ((child.userData?.cleanName || "") as string).toLowerCase().trim();
      const piezaMadre = ((child.userData?.piezaMadre || extraerPiezaMadre(cleanName || name)) as string).toLowerCase().trim();
      const instanciaKey = ((child.userData?.instanciaKey || "") as string).toLowerCase().trim();
      const childFamilia = extraerFamiliaPieza(instanciaKey || cleanName || name).toLowerCase().trim();

      // Coincidencia con herraje cohesionado solidario
      if ((child as any).isMesh && herrajesCohesionadosSet.size > 0) {
        for (const hTarget of herrajesCohesionadosSet) {
          const hwTargetLow = hTarget.replace(/^RH_OUT:/i, "").split("::").pop()!.trim().toLowerCase();
          if (
            coincidenMismoHerraje(hTarget, instanciaKey) ||
            coincidenMismoHerraje(hwTargetLow, instanciaKey) ||
            coincidenMismoHerraje(hTarget, cleanName) ||
            coincidenMismoHerraje(hwTargetLow, cleanName) ||
            coincidenMismoHerraje(hTarget, name) ||
            coincidenMismoHerraje(hwTargetLow, name) ||
            herrajesCohesionadosSet.has(instanciaKey) ||
            herrajesCohesionadosSet.has(cleanName) ||
            herrajesCohesionadosSet.has(name)
          ) {
            return true;
          }
        }
      }

      // 🛡️ REGLA CANÓNICA: Si el objetivo tiene número de instancia explícito (ej. "Peça 14 (1)"),
      // solo puede coincidir con esa instancia física unívoca. Queda estrictamente PROHIBIDO
      // agrupar o mover instancias hermanas discretas (ej. "Peça 14 (2)").
      if (tieneInstanciaTarget && matchInstanciaTarget) {
        if (instanciaKey === targetKey || cleanName === targetKey || name === targetKey) {
          return true;
        }
        const meshInstMatch = instanciaKey.match(/\((\d+)\)/) || cleanName.match(/\((\d+)\)/) || name.match(/\((\d+)\)/);
        if (meshInstMatch) {
          return meshInstMatch[1] === matchInstanciaTarget[1] && childFamilia === targetFamilia;
        }
        return false;
      }

      return (
        name === targetKey ||
        cleanName === targetKey ||
        piezaMadre === targetKey ||
        instanciaKey === targetKey ||
        (Boolean(targetFamilia) && (
          childFamilia === targetFamilia ||
          extraerFamiliaPieza(piezaMadre) === targetFamilia ||
          extraerFamiliaPieza(name) === targetFamilia
        )) ||
        (Boolean(targetMadre) && (
          piezaMadre === targetMadre ||
          extraerPiezaMadre(name).toLowerCase().trim() === targetMadre ||
          extraerPiezaMadre(cleanName).toLowerCase().trim() === targetMadre
        ))
      );
    };

    const items: TargetMeshItem[] = [];
    const searchRoot = furnitureGroup || (typeof window !== "undefined" ? (window as any).__threeScene3BF : null);

    if (searchRoot) {
      searchRoot.traverse((child: any) => {
        if (child.isMesh && isMatch(child)) {
          const restLocal = getSafeRestPosition(child);
          const restWorld = child.parent ? child.parent.localToWorld(restLocal.clone()) : restLocal.clone();
          items.push({
            mesh: child,
            initialLocalPos: child.position.clone(),
            restLocalPos: restLocal,
            restWorldPos: restWorld,
          });
        }
      });
    }

    const boardItems = items.filter(
      (it) => !isHardwareMeshName(it.mesh.name) && !isHardwareMeshName(it.mesh.userData?.cleanName)
    );
    const hwItems = items.filter(
      (it) => isHardwareMeshName(it.mesh.name) || isHardwareMeshName(it.mesh.userData?.cleanName)
    );
    const sortedItems = [...boardItems, ...hwItems];
    targetMeshesRef.current = sortedItems;

    // Calcular el centro colectivo de reposo en el mundo usando exclusivamente el tablero maestro
    const referenceItems = boardItems.length > 0 ? boardItems : sortedItems;
    if (referenceItems.length > 0) {
      const center = new THREE.Vector3();
      for (const item of referenceItems) {
        center.add(item.restWorldPos);
      }
      center.divideScalar(referenceItems.length);
      collectiveRestWorldRef.current.copy(center);
    }

    // 🎯 CALCULAR EL DROP AL PISO (floorDropY) basado estrictamente en el tablero de madera:
    // Si la pieza está elevada en el mueble ensamblado (ej. Peça 9 a 35 cm de altura),
    // medimos su cota inferior en el mundo para bajarla automáticamente y apoyarla en Y = 0 (piso).
    let floorDropY = 0;
    if (referenceItems.length > 0) {
      const boardBox = new THREE.Box3();
      for (const item of referenceItems) {
        const curLocalPos = item.mesh.position.clone();
        item.mesh.position.copy(item.restLocalPos);
        item.mesh.updateWorldMatrix(true, true);
        const meshBox = new THREE.Box3().setFromObject(item.mesh);
        if (!meshBox.isEmpty()) {
          boardBox.union(meshBox);
        }
        item.mesh.position.copy(curLocalPos);
        item.mesh.updateWorldMatrix(true, true);
      }

      if (!boardBox.isEmpty()) {
        // En Three.js, Y = 0 es el piso. Si boardBox.min.y > 0, está flotando.
        // El ajuste exacto para que su cara o canto inferior repose sobre el piso es -boardBox.min.y
        floorDropY = -boardBox.min.y;
      }
    }
    floorDropYRef.current = floorDropY;

    // Feedback de cursor en el canvas
    if (gl.domElement) {
      gl.domElement.style.cursor = "crosshair";
    }

    return () => {
      if (gl.domElement) {
        gl.domElement.style.cursor = "default";
      }
    };
  }, [piezaEnPosicionamientoManual, furnitureGroup, gl, pasosManual]);

  // 2. Manejo de teclado tipo Blender:
  // - Tecla X: bloquea en eje X (transversal)
  // - Tecla Y: bloquea en eje Y del taller (longitudinal / Z de Three.js)
  // - Tecla C / G: libera restricciones y vuelve a modo libre
  // - Tecla Escape (Esc): cancela y devuelve las piezas a su posición original
  useEffect(() => {
    if (!piezaEnPosicionamientoManual) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignorar si el usuario está interactuando con inputs de texto
      const activeEl = document.activeElement as HTMLElement | null;
      if (activeEl && (activeEl.tagName === "INPUT" || activeEl.tagName === "TEXTAREA" || activeEl.isContentEditable)) {
        return;
      }

      if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();

        // Restaurar todas las piezas a su posición local original
        if (targetMeshesRef.current) {
          for (const item of targetMeshesRef.current) {
            item.mesh.position.copy(item.initialLocalPos);
            item.mesh.updateMatrixWorld(true);
          }
        }
        setEjeRestringido(null);
        ejeRestringidoRef.current = null;
        setPiezaEnPosicionamientoManual(null);
        return;
      }

      const k = e.key.toLowerCase();
      if (k === "x") {
        e.preventDefault();
        e.stopPropagation();
        setEjeRestringido((prev) => {
          const nextVal = prev === "X" ? null : "X";
          ejeRestringidoRef.current = nextVal;
          return nextVal;
        });
      } else if (k === "y") {
        e.preventDefault();
        e.stopPropagation();
        setEjeRestringido((prev) => {
          const nextVal = prev === "Y" ? null : "Y";
          ejeRestringidoRef.current = nextVal;
          return nextVal;
        });
      } else if (k === "c") {
        e.preventDefault();
        e.stopPropagation();
        setEjeRestringido(null);
        ejeRestringidoRef.current = null;
      } else if (k === "g" || k === "f") {
        e.preventDefault();
        e.stopPropagation();
        setAntigravedad((prev) => {
          const nextVal = !prev;
          antigravedadRef.current = nextVal;
          return nextVal;
        });
      }
    };

    window.addEventListener("keydown", handleKeyDown, { capture: true });
    return () => {
      window.removeEventListener("keydown", handleKeyDown, { capture: true });
    };
  }, [piezaEnPosicionamientoManual, setPiezaEnPosicionamientoManual]);

  // 3. useFrame: Proyección estricta sobre el plano horizontal (Y = 0 o cota de antigravedad)
  useFrame(() => {
    if (!piezaEnPosicionamientoManual || targetMeshesRef.current.length === 0) return;

    raycaster.setFromCamera(pointer, camera);
    const hit = raycaster.ray.intersectPlane(floorPlane.current, intersectPoint.current);

    if (hit) {
      // El plano base en Three.js es el plano horizontal X-Z (donde Y = 0)
      // Calculamos el desplazamiento respecto al centro de reposo colectivo
      let deltaXWorld = hit.x - collectiveRestWorldRef.current.x;
      let deltaZWorld = hit.z - collectiveRestWorldRef.current.z;

      // 🎯 Restricción de ejes al estilo Blender:
      // - Eje X (Taller / Three.js): Solo movimiento transversal (deltaZWorld = 0)
      // - Eje Y (Taller / Z Three.js): Solo movimiento longitudinal (deltaXWorld = 0)
      const eje = ejeRestringidoRef.current;
      if (eje === "X") {
        deltaZWorld = 0;
      } else if (eje === "Y") {
        deltaXWorld = 0;
      }

      const deltaWorld = new THREE.Vector3(deltaXWorld, 0, deltaZWorld);
      latestDeltaWorldRef.current.copy(deltaWorld);

      // 🪶 Drop Y efectivo: 0 si antigravedad está activa (flota a su cota); floorDropY si cae al suelo
      const esAntigravedad = antigravedadRef.current;
      const dropY = esAntigravedad ? 0 : floorDropYRef.current;

      // 🎯 Calcular y registrar el delta local para la pieza primaria (consistente con rotación de orientacionBanco)
      const primaryItem = targetMeshesRef.current[0];
      if (primaryItem && primaryItem.mesh.parent) {
        const targetWorldPos = new THREE.Vector3(
          primaryItem.restWorldPos.x + deltaXWorld,
          primaryItem.restWorldPos.y + dropY,
          primaryItem.restWorldPos.z + deltaZWorld
        );
        primaryItem.mesh.parent.updateWorldMatrix(true, false);
        const targetLocalPos = primaryItem.mesh.parent.worldToLocal(targetWorldPos.clone());
        const deltaLocal = targetLocalPos.clone().sub(primaryItem.restLocalPos);
        latestDeltaLocalRef.current.copy(deltaLocal);
      }

      // Aplicar el desplazamiento a TODAS las mallas del grupo (ej. Peça 8 (1), (2), (3) o Peça 9 y sus herrajes)
      for (const item of targetMeshesRef.current) {
        const mesh = item.mesh;
        if (!mesh.parent) continue;

        // La nueva posición deseada en el mundo apoya la base de la pieza en el piso o flota a su cota
        const targetWorldPos = new THREE.Vector3(
          item.restWorldPos.x + deltaXWorld,
          item.restWorldPos.y + dropY,
          item.restWorldPos.z + deltaZWorld
        );

        // Convertir la coordenada mundial deseada al espacio local del contenedor padre
        mesh.parent.updateWorldMatrix(true, false);
        const newLocalPos = mesh.parent.worldToLocal(targetWorldPos);
        mesh.position.copy(newLocalPos);
        mesh.updateMatrixWorld(true);
      }
    }
  });

  // 4. Clic izquierdo para confirmar y guardar la coordenada en el paso activo
  useEffect(() => {
    if (!piezaEnPosicionamientoManual) return;

    const dom = gl.domElement;

    const handlePointerDown = (e: PointerEvent) => {
      if (e.button !== 0) return; // Solo clic izquierdo
      e.stopPropagation();
      e.preventDefault();

      if (targetMeshesRef.current.length === 0) {
        setPiezaEnPosicionamientoManual(null);
        return;
      }

      const pasoId = typeof piezaEnPosicionamientoManual === "string"
        ? (pasosManual[0]?.id || "")
        : piezaEnPosicionamientoManual.pasoId;
      const nombrePieza = typeof piezaEnPosicionamientoManual === "string"
        ? piezaEnPosicionamientoManual
        : piezaEnPosicionamientoManual.nombrePieza;

      if (!pasoId || !nombrePieza) {
        setPiezaEnPosicionamientoManual(null);
        return;
      }

      const paso = pasosManual.find((p) => p.id === pasoId);

      if (paso) {
        const esAntigravedad = antigravedadRef.current;
        // En el sistema de coordenadas local del contenedor (consistente con cinemática y rotación de banco):
        const deltaLocal = latestDeltaLocalRef.current;
        const deltaX_cm = Math.round(deltaLocal.x * 1000) / 10;
        const deltaY_cm = esAntigravedad ? 0 : Math.round(deltaLocal.y * 1000) / 10; // 🎯 Cota Y neutralizada a 0 si hay antigravedad (precisión 1 mm)
        const deltaZ_cm = Math.round(deltaLocal.z * 1000) / 10;

        const cfgActual = paso.configuracionCinematica || {
          velocidadPiezasCmS: 15,
          velocidadHerrajesCmS: 8,
          piezasEspera: [],
        };

        const listaPiezas = [...(cfgActual.piezasEspera || [])];
        const tieneInstanciaTargetCommit = /\(\d+\)/.test(nombrePieza);
        const matchInstanciaTargetCommit = nombrePieza.match(/\((\d+)\)/);

        const idx = listaPiezas.findIndex((p) => {
          if (p.nombrePieza === nombrePieza) return true;
          if (tieneInstanciaTargetCommit || /\(\d+\)/.test(p.nombrePieza)) {
            const pMatch = p.nombrePieza.match(/\((\d+)\)/);
            return Boolean(
              matchInstanciaTargetCommit &&
              pMatch &&
              pMatch[1] === matchInstanciaTargetCommit[1] &&
              extraerFamiliaPieza(p.nombrePieza) === extraerFamiliaPieza(nombrePieza)
            );
          }
          return perteneceAMismaFamiliaPieza(p.nombrePieza, nombrePieza);
        });

        if (idx >= 0) {
          listaPiezas[idx] = {
            ...listaPiezas[idx],
            nombrePieza, // Consistente con el nombre seleccionado
            offsetXCm: deltaX_cm,
            offsetYCm: deltaY_cm, // 🎯 Apoyada en suelo o flotando en cota
            offsetZCm: deltaZ_cm,
            apoyadaEnPiso: !esAntigravedad,
          };
        } else {
          listaPiezas.push({
            nombrePieza,
            ordenEnsamble: listaPiezas.length + 1,
            offsetXCm: deltaX_cm,
            offsetYCm: deltaY_cm, // 🎯 Apoyada en suelo o flotando en cota
            offsetZCm: deltaZ_cm,
            apoyadaEnPiso: !esAntigravedad,
          });
        }

        // Mantener la secuencia en sincronía para que Three.js retenga la posición de espera en piso de inmediato
        const nuevaSecuencia = [...(paso.secuencia || [])];
        const seqIdx = nuevaSecuencia.findIndex((s) => {
          if (s.nombreNodo === nombrePieza) return true;
          if (tieneInstanciaTargetCommit || /\(\d+\)/.test(s.nombreNodo || "")) {
            const sMatch = (s.nombreNodo || "").match(/\((\d+)\)/);
            return Boolean(
              matchInstanciaTargetCommit &&
              sMatch &&
              sMatch[1] === matchInstanciaTargetCommit[1] &&
              extraerFamiliaPieza(s.nombreNodo || "") === extraerFamiliaPieza(nombrePieza)
            );
          }
          return perteneceAMismaFamiliaPieza(s.nombreNodo || "", nombrePieza);
        });
        const distEspera = Math.sqrt((deltaX_cm / 100) ** 2 + (deltaY_cm / 100) ** 2 + (deltaZ_cm / 100) ** 2);
        const vPiezaM_s = (cfgActual.velocidadPiezasCmS || 15) / 100;
        const durTraslacion = Math.max(1.5, Math.round((distEspera / vPiezaM_s) * 10) / 10);

        const elemSeq = {
          id: `seq_${nombrePieza}`,
          nombreNodo: nombrePieza,
          tipo: "pieza" as const,
          tiempoInicio: seqIdx >= 0 ? nuevaSecuencia[seqIdx].tiempoInicio : 0.5,
          duracionMovimiento: durTraslacion,
          popIn: false,
          distanciaAproximacion: distEspera,
        };

        if (seqIdx >= 0) {
          nuevaSecuencia[seqIdx] = { ...nuevaSecuencia[seqIdx], ...elemSeq };
        } else {
          nuevaSecuencia.push(elemSeq);
        }

        // Sincronizar también con Múltiple Plus si el paso contiene capas
        let multiplePlusActualizado = paso.multiplePlus;
        if (multiplePlusActualizado && multiplePlusActualizado.capas) {
          const nuevasCapas = multiplePlusActualizado.capas.map((capa) => ({
            ...capa,
            tableros: (capa.tableros || []).map((t) => {
              const coincideTablero = t.id === nombrePieza || (
                !tieneInstanciaTargetCommit &&
                !/\(\d+\)/.test(t.id) &&
                perteneceAMismaFamiliaPieza(t.id, nombrePieza)
              );
              if (coincideTablero) {
                return {
                  ...t,
                  offsetXCm: deltaX_cm,
                  offsetYCm: deltaY_cm, // 🎯 Suelo
                  offsetZCm: deltaZ_cm,
                };
              }
              return t;
            }),
          }));
          multiplePlusActualizado = {
            ...multiplePlusActualizado,
            antigravedad: esAntigravedad,
            capas: nuevasCapas,
          };
        }

        actualizarPasoManual(pasoId, {
          tipo: multiplePlusActualizado ? "multiple_plus" : paso.tipo,
          configuracionCinematica: {
            ...cfgActual,
            piezasEspera: listaPiezas,
          },
          secuencia: nuevaSecuencia,
          ...(multiplePlusActualizado ? { multiplePlus: multiplePlusActualizado } : {}),
        });

        // 🎯 Guardar la última pieza calibrada para que la UI la resalte en gris
        setUltimaPiezaCalibrada(nombrePieza);

        // 🎬 Despertar y forzar horneado reactivo de la animación cinemática
        despertarAnimacionManual();
        if (typeof window !== "undefined" && (window as any).__3bfDespertarAnimacion) {
          (window as any).__3bfDespertarAnimacion();
        }
      }

      // Finalizar modo de posicionamiento y limpiar restricciones de eje
      setEjeRestringido(null);
      ejeRestringidoRef.current = null;
      setPiezaEnPosicionamientoManual(null);
    };

    dom.addEventListener("pointerdown", handlePointerDown, { capture: true, once: true });

    return () => {
      dom.removeEventListener("pointerdown", handlePointerDown, { capture: true });
    };
  }, [piezaEnPosicionamientoManual, gl, pasosManual, actualizarPasoManual, setPiezaEnPosicionamientoManual, setUltimaPiezaCalibrada, despertarAnimacionManual]);

  if (!piezaEnPosicionamientoManual) return null;

  const rawNombre = typeof piezaEnPosicionamientoManual === "string"
    ? piezaEnPosicionamientoManual
    : piezaEnPosicionamientoManual.nombrePieza;

  const restCenter = collectiveRestWorldRef.current;

  return (
    <>
      {/* 🔴 Línea de guía Eje X (Rojo Blender / Transversal) */}
      {ejeRestringido === "X" && (
        <Line
          points={[
            [-100, 0.003, restCenter.z],
            [100, 0.003, restCenter.z],
          ]}
          color="#EF4444"
          lineWidth={2.5}
          dashed={false}
          renderOrder={999}
        />
      )}

      {/* 🟢 Línea de guía Eje Y (Verde Blender / Longitudinal taller) */}
      {ejeRestringido === "Y" && (
        <Line
          points={[
            [restCenter.x, 0.003, -100],
            [restCenter.x, 0.003, 100],
          ]}
          color="#10B981"
          lineWidth={2.5}
          dashed={false}
          renderOrder={999}
        />
      )}

      {/* 🧭 HUD Flotante tipo Blender con terminaciones circulares puras */}
      <Html position={[0, 0, 0]} fullscreen style={{ pointerEvents: "none" }}>
        <div className="absolute top-16 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-slate-900/90 dark:bg-slate-950/95 text-white px-4 py-1.5 rounded-full shadow-2xl border border-slate-700/60 backdrop-blur-md text-[11px] select-none z-50">
          <span className="font-bold text-amber-400 truncate max-w-[120px]">
            {rawNombre}
          </span>
          <span className="text-slate-500">|</span>
          <span
            className={`px-2 py-0.5 rounded-full font-bold text-[10px] tracking-wider uppercase transition-all shadow-xs ${
              ejeRestringido === "X"
                ? "bg-red-500 text-white shadow-red-500/40"
                : ejeRestringido === "Y"
                ? "bg-emerald-500 text-white shadow-emerald-500/40"
                : "bg-cyan-600 text-white shadow-cyan-600/30"
            }`}
          >
            {ejeRestringido === "X"
              ? "🔒 EJE X (Transversal)"
              : ejeRestringido === "Y"
              ? "🔒 EJE Y (Longitudinal)"
              : "🌐 MOVIMIENTO LIBRE"}
          </span>
          <span className="text-slate-500">|</span>
          {/* Botón interactivo Cápsula Antigravedad */}
          <button
            type="button"
            style={{ pointerEvents: "auto" }}
            onClick={(e) => {
              e.stopPropagation();
              setAntigravedad((prev) => {
                const nextVal = !prev;
                antigravedadRef.current = nextVal;
                return nextVal;
              });
            }}
            title="Presiona G o haz clic para alternar entre Antigravedad (flotación a su cota) y Caída al Suelo"
            className={`px-2.5 py-0.5 rounded-full font-bold text-[9.5px] tracking-wider uppercase transition-all shadow-xs cursor-pointer flex items-center gap-1 ${
              antigravedad
                ? "bg-[#0088AA] dark:bg-[#1368AA] text-white shadow-cyan-500/40 ring-1 ring-cyan-300"
                : "bg-slate-800 text-slate-300 border border-slate-600 hover:text-white"
            }`}
          >
            <span>{antigravedad ? "🪶 ANTIGRAVEDAD (Flotar)" : "🧲 CAÍDA A SUELO"}</span>
          </button>
          <span className="text-slate-500">|</span>
          <div className="flex items-center gap-1.5 text-[9.5px] text-slate-300">
            <span className="bg-slate-800 border border-slate-600 px-1.5 py-0.5 rounded-full font-mono font-bold">X</span>
            <span className="text-slate-400">Eje X</span>
            <span className="bg-slate-800 border border-slate-600 px-1.5 py-0.5 rounded-full font-mono font-bold">Y</span>
            <span className="text-slate-400">Eje Y</span>
            <span className="bg-slate-800 border border-slate-600 px-1.5 py-0.5 rounded-full font-mono font-bold">G</span>
            <span className="text-slate-400">Gravedad</span>
            <span className="bg-slate-800 border border-slate-600 px-1.5 py-0.5 rounded-full font-mono font-bold">C</span>
            <span className="text-slate-400">Libre</span>
            <span className="bg-slate-800 border border-slate-600 px-1.5 py-0.5 rounded-full font-mono font-bold">Clic</span>
            <span className="text-slate-400">Fijar</span>
            <span className="bg-slate-800 border border-slate-600 px-1.5 py-0.5 rounded-full font-mono font-bold">Esc</span>
            <span className="text-slate-400">Salir</span>
          </div>
        </div>
      </Html>
    </>
  );
}
