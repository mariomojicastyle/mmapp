"use client";

import React, { useRef, useEffect } from "react";
import * as THREE from "three";
import { useThree, useFrame } from "@react-three/fiber";
import { use3BFStore } from "@/lib/store";
import { extraerPiezaMadre, extraerFamiliaPieza, perteneceAMismaFamiliaPieza } from "@/lib/piezaMadreUtils";
import { getSafeRestPosition } from "@/lib/engine/cadStateUtils";

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
 * Controles:
 * - Movimiento del mouse: arrastra la pieza o grupo de piezas sobre el piso XY.
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
  } = use3BFStore();

  const floorPlane = useRef(new THREE.Plane(new THREE.Vector3(0, 1, 0), 0));
  const intersectPoint = useRef(new THREE.Vector3());
  const targetMeshesRef = useRef<TargetMeshItem[]>([]);
  const collectiveRestWorldRef = useRef<THREE.Vector3>(new THREE.Vector3());
  const latestDeltaWorldRef = useRef<THREE.Vector3>(new THREE.Vector3(0, 0, 0));
  const floorDropYRef = useRef<number>(0);

  // 1. Localizar TODAS las mallas correspondientes a la pieza activa (incluyendo instancias hermanas)
  useEffect(() => {
    if (!piezaEnPosicionamientoManual) {
      targetMeshesRef.current = [];
      floorDropYRef.current = 0;
      return;
    }

    setVistaPiezasDesplazadas(true);

    const targetKey = piezaEnPosicionamientoManual.nombrePieza.toLowerCase().trim();
    const targetMadre = extraerPiezaMadre(targetKey).toLowerCase().trim();
    const targetFamilia = extraerFamiliaPieza(targetKey).toLowerCase().trim();

    // Recuperar los herrajes cohesionados que viajan con esta pieza
    const pasoActivo = pasosManual.find((p) => p.id === piezaEnPosicionamientoManual.pasoId);
    const elemSecuencia = pasoActivo?.secuencia?.find(
      (s) => s.nombreNodo === targetKey || perteneceAMismaFamiliaPieza(s.nombreNodo, targetKey)
    );
    const herrajesCohesionadosSet = new Set(
      (elemSecuencia?.herrajesCohesionados || []).map((h) => h.toLowerCase().trim())
    );

    const isMatch = (child: THREE.Object3D): boolean => {
      const name = (child.name || "").replace(/^RH_OUT:/i, "").trim().toLowerCase();
      const cleanName = ((child.userData?.cleanName || "") as string).toLowerCase().trim();
      const piezaMadre = ((child.userData?.piezaMadre || extraerPiezaMadre(cleanName || name)) as string).toLowerCase().trim();
      const instanciaKey = ((child.userData?.instanciaKey || "") as string).toLowerCase().trim();
      const childFamilia = extraerFamiliaPieza(instanciaKey || cleanName || name).toLowerCase().trim();

      // Coincidencia con herraje cohesionado solidario
      if ((child as any).isMesh && herrajesCohesionadosSet.size > 0) {
        if (
          herrajesCohesionadosSet.has(instanciaKey) ||
          herrajesCohesionadosSet.has(cleanName) ||
          herrajesCohesionadosSet.has(name)
        ) {
          return true;
        }
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

    targetMeshesRef.current = items;

    // Calcular el centro colectivo de reposo en el mundo
    if (items.length > 0) {
      const center = new THREE.Vector3();
      for (const item of items) {
        center.add(item.restWorldPos);
      }
      center.divideScalar(items.length);
      collectiveRestWorldRef.current.copy(center);
    }

    // 🎯 CALCULAR EL DROP AL PISO (floorDropY):
    // Si la pieza está elevada en el mueble ensamblado (ej. Peça 9 a 35 cm de altura),
    // medimos su cota inferior en el mundo para bajarla automáticamente y apoyarla en Y = 0 (piso).
    let floorDropY = 0;
    if (items.length > 0) {
      const collectiveBox = new THREE.Box3();
      for (const item of items) {
        const curLocalPos = item.mesh.position.clone();
        item.mesh.position.copy(item.restLocalPos);
        item.mesh.updateWorldMatrix(true, true);
        const meshBox = new THREE.Box3().setFromObject(item.mesh);
        if (!meshBox.isEmpty()) {
          collectiveBox.union(meshBox);
        }
        item.mesh.position.copy(curLocalPos);
        item.mesh.updateWorldMatrix(true, true);
      }

      if (!collectiveBox.isEmpty()) {
        // En Three.js, Y = 0 es el piso. Si collectiveBox.min.y > 0, está flotando.
        // El ajuste exacto para que su cara o canto inferior repose sobre el piso es -collectiveBox.min.y
        floorDropY = -collectiveBox.min.y;
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
  }, [piezaEnPosicionamientoManual, furnitureGroup, gl]);

  // 2. Manejo de tecla Escape (Esc) para soltar la pieza y cancelar sin guardar
  useEffect(() => {
    if (!piezaEnPosicionamientoManual) return;

    const handleKeyDown = (e: KeyboardEvent) => {
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
        setPiezaEnPosicionamientoManual(null);
      }
    };

    window.addEventListener("keydown", handleKeyDown, { capture: true });
    return () => {
      window.removeEventListener("keydown", handleKeyDown, { capture: true });
    };
  }, [piezaEnPosicionamientoManual, setPiezaEnPosicionamientoManual]);

  // 3. useFrame: Proyección estricta sobre el piso horizontal (Y = 0) en coordenadas mundiales
  useFrame(() => {
    if (!piezaEnPosicionamientoManual || targetMeshesRef.current.length === 0) return;

    raycaster.setFromCamera(pointer, camera);
    const hit = raycaster.ray.intersectPlane(floorPlane.current, intersectPoint.current);

    if (hit) {
      // El piso en Three.js es el plano horizontal X-Z (donde Y = 0)
      // Calculamos el desplazamiento sobre el piso respecto al centro de reposo colectivo
      const deltaXWorld = hit.x - collectiveRestWorldRef.current.x;
      const deltaZWorld = hit.z - collectiveRestWorldRef.current.z;
      const deltaWorld = new THREE.Vector3(deltaXWorld, 0, deltaZWorld);

      latestDeltaWorldRef.current.copy(deltaWorld);

      // Aplicar el desplazamiento a TODAS las mallas del grupo (ej. Peça 8 (1), (2), (3) o Peça 9)
      for (const item of targetMeshesRef.current) {
        const mesh = item.mesh;
        if (!mesh.parent) continue;

        // La nueva posición deseada en el mundo apoya la base de la pieza en el piso (Y = 0)
        const targetWorldPos = new THREE.Vector3(
          item.restWorldPos.x + deltaXWorld,
          item.restWorldPos.y + floorDropYRef.current, // Apoyada automáticamente sobre el piso
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

      const pasoId = piezaEnPosicionamientoManual.pasoId;
      const nombrePieza = piezaEnPosicionamientoManual.nombrePieza;
      const paso = pasosManual.find((p) => p.id === pasoId);

      if (paso) {
        // En el plano de piso horizontal:
        // X es ancho horizontal (Three.js world X)
        // Y es profundidad horizontal del piso (Three.js world Z)
        const deltaX_cm = Math.round(latestDeltaWorldRef.current.x * 100);
        const deltaY_cm = Math.round(latestDeltaWorldRef.current.z * 100);

        const cfgActual = paso.configuracionCinematica || {
          velocidadPiezasCmS: 15,
          velocidadHerrajesCmS: 8,
          piezasEspera: [],
        };

        const listaPiezas = [...(cfgActual.piezasEspera || [])];
        const idx = listaPiezas.findIndex(
          (p) => p.nombrePieza === nombrePieza || perteneceAMismaFamiliaPieza(p.nombrePieza, nombrePieza)
        );

        if (idx >= 0) {
          listaPiezas[idx] = {
            ...listaPiezas[idx],
            nombrePieza, // Consistente con el nombre seleccionado
            offsetXCm: deltaX_cm,
            offsetYCm: deltaY_cm,
            offsetZCm: deltaY_cm,
            apoyadaEnPiso: true,
          };
        } else {
          listaPiezas.push({
            nombrePieza,
            ordenEnsamble: listaPiezas.length + 1,
            offsetXCm: deltaX_cm,
            offsetYCm: deltaY_cm,
            offsetZCm: deltaY_cm,
            apoyadaEnPiso: true,
          });
        }

        // Mantener la secuencia en sincronía para que Three.js retenga la posición de espera en piso de inmediato
        const nuevaSecuencia = [...(paso.secuencia || [])];
        const seqIdx = nuevaSecuencia.findIndex(
          (s) => s.nombreNodo === nombrePieza || perteneceAMismaFamiliaPieza(s.nombreNodo || "", nombrePieza)
        );
        const distEspera = Math.sqrt((deltaX_cm / 100) ** 2 + (deltaY_cm / 100) ** 2);
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

        actualizarPasoManual(pasoId, {
          configuracionCinematica: {
            ...cfgActual,
            piezasEspera: listaPiezas,
          },
          secuencia: nuevaSecuencia,
        });

        // 🎯 Guardar la última pieza calibrada para que la UI la resalte en gris
        setUltimaPiezaCalibrada(nombrePieza);
      }

      // Finalizar modo de posicionamiento
      setPiezaEnPosicionamientoManual(null);
    };

    dom.addEventListener("pointerdown", handlePointerDown, { capture: true, once: true });

    return () => {
      dom.removeEventListener("pointerdown", handlePointerDown, { capture: true });
    };
  }, [piezaEnPosicionamientoManual, gl, pasosManual, actualizarPasoManual, setPiezaEnPosicionamientoManual, setUltimaPiezaCalibrada]);

  return null;
}
