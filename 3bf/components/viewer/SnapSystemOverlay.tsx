"use client";

import React, { useRef, useEffect, useState } from "react";
import * as THREE from "three";
import { useThree, useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import { use3BFStore } from "@/lib/store";

export function getFurnitureGroupBoardBox(furnitureGroup: THREE.Group): THREE.Box3 {
  furnitureGroup.updateWorldMatrix(true, true);
  const box = new THREE.Box3();
  
  furnitureGroup.traverse((child) => {
    if ((child as THREE.Mesh).isMesh) {
      const m = child as THREE.Mesh;
      const n = (m.name || "").toLowerCase();
      // Tableros de madera principales (excluyendo herrajes/maquinados)
      const isBoard = (
        n.includes("cubierta") ||
        n.includes("frente") ||
        n.includes("lateral") ||
        n.includes("tapa") ||
        n.includes("posterior") ||
        n.includes("cajon") ||
        n.includes("cajón") ||
        n.includes("mdp") ||
        n.includes("tablero") ||
        n.includes("madera") ||
        n.includes("entrepaño") ||
        n.includes("balance") ||
        n.includes("board") ||
        n.includes("panel")
      ) && !n.includes("perno") && !n.includes("tornillo") && !n.includes("tarugo") && !n.includes("maquinados");

      if (isBoard) {
        if (m.geometry) {
          m.geometry.computeBoundingBox();
          if (m.geometry.boundingBox) {
            const childBox = m.geometry.boundingBox.clone().applyMatrix4(m.matrixWorld);
            box.union(childBox);
          }
        }
      }
    }
  });

  if (box.isEmpty()) {
    furnitureGroup.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const m = child as THREE.Mesh;
        if (m.geometry) {
          m.geometry.computeBoundingBox();
          if (m.geometry.boundingBox) {
            const childBox = m.geometry.boundingBox.clone().applyMatrix4(m.matrixWorld);
            box.union(childBox);
          }
        }
      }
    });
  }

  if (box.isEmpty()) {
    box.setFromObject(furnitureGroup);
  }
  if (typeof window !== "undefined" && !box.isEmpty()) {
    const s = new THREE.Vector3();
    box.getSize(s);
    (window as any).__3bfRealBBox = {
      anchoMm: Math.round(s.x * 1000),
      altoMm: Math.round(s.y * 1000),
      profMm: Math.round(s.z * 1000),
    };
  }
  return box;
}

export function extractCandidatePoints(furnitureGroup: THREE.Group) {
  const worldBox = getFurnitureGroupBoardBox(furnitureGroup);
  if (worldBox.isEmpty()) return [];

  const groupWorldPos = new THREE.Vector3();
  furnitureGroup.getWorldPosition(groupWorldPos);

  const minX = worldBox.min.x - groupWorldPos.x;
  const maxX = worldBox.max.x - groupWorldPos.x;
  const minY = worldBox.min.y - groupWorldPos.y;
  const maxY = worldBox.max.y - groupWorldPos.y;
  const minZ = worldBox.min.z - groupWorldPos.z;
  const maxZ = worldBox.max.z - groupWorldPos.z;

  const midX = (minX + maxX) / 2;
  const midY = (minY + maxY) / 2;
  const midZ = (minZ + maxZ) / 2;

  const corners: Array<[number, number, number]> = [
    [minX, minY, minZ],
    [maxX, minY, minZ],
    [minX, maxY, minZ],
    [maxX, maxY, minZ],
    [minX, minY, maxZ],
    [maxX, minY, maxZ],
    [minX, maxY, maxZ],
    [maxX, maxY, maxZ],
  ];

  const midpoints: Array<[number, number, number]> = [
    [midX, minY, minZ],
    [midX, maxY, minZ],
    [midX, minY, maxZ],
    [midX, maxY, maxZ],
    [minX, midY, minZ],
    [maxX, midY, minZ],
    [minX, midY, maxZ],
    [maxX, midY, maxZ],
    [minX, minY, midZ],
    [maxX, minY, midZ],
    [minX, maxY, midZ],
    [maxX, maxY, midZ],
  ];

  return [
    ...corners.map((p) => ({ pos: p, tipo: "corner" as const })),
    ...midpoints.map((p) => ({ pos: p, tipo: "midpoint" as const })),
  ];
}

export function SnapPointMarkers({ furnitureGroup }: { furnitureGroup: THREE.Group | null }) {
  const { snapPicking, snapBasePoint, snapTargetPoint, setSnapBasePoint, modoTransformacion, posicionObjeto, objetoActivoId, coloresApariencia } = use3BFStore();
  const { camera, raycaster, gl } = useThree();
  const [hoveredPoint, setHoveredPoint] = useState<{ pos: [number, number, number]; tipo: "corner" | "midpoint" } | null>(null);
  const snapGroupRef = useRef<THREE.Group>(null);
  const lastSnapBboxKeyRef = useRef<string>("");
  const candidatePointsRef = useRef<Array<{ pos: [number, number, number]; tipo: "corner" | "midpoint" }>>([]);

  // Detectar punto más cercano al rayo del mouse solo cuando snapPicking (B) está activo
  useFrame(() => {
    if (!furnitureGroup) return;

    // Sincronización instantánea de posición a 60 FPS
    if (snapGroupRef.current) {
      snapGroupRef.current.position.copy(furnitureGroup.position);
    }

    if (!snapPicking || modoTransformacion !== "grab") {
      if (hoveredPoint !== null) setHoveredPoint(null);
      return;
    }

    // 🎯 DETECCIÓN DINÁMICA DE DIMENSIONES PARA SNAPS
    const worldBox = getFurnitureGroupBoardBox(furnitureGroup);
    const groupWorldPos = new THREE.Vector3();
    furnitureGroup.getWorldPosition(groupWorldPos);

    const locMinX = (worldBox.min.x - groupWorldPos.x).toFixed(3);
    const locMaxX = (worldBox.max.x - groupWorldPos.x).toFixed(3);
    const locMinZ = (worldBox.min.z - groupWorldPos.z).toFixed(3);
    const locMaxZ = (worldBox.max.z - groupWorldPos.z).toFixed(3);
    const bboxKey = `${locMinX}_${locMaxX}_${locMinZ}_${locMaxZ}_${objetoActivoId}`;

    if (candidatePointsRef.current.length === 0 || lastSnapBboxKeyRef.current !== bboxKey) {
      lastSnapBboxKeyRef.current = bboxKey;
      candidatePointsRef.current = extractCandidatePoints(furnitureGroup);
    }

    const candidatePoints = candidatePointsRef.current;
    if (candidatePoints.length === 0) return;

    let closestPoint: { pos: [number, number, number]; tipo: "corner" | "midpoint" } | null = null;
    let minDistance = 0.08; // Umbral de atracción de 80mm en espacio de mundo

    for (const pt of candidatePoints) {
      const worldPt = new THREE.Vector3(pt.pos[0], pt.pos[1], pt.pos[2]).add(groupWorldPos);
      const dist = raycaster.ray.distanceToPoint(worldPt);

      if (dist < minDistance) {
        minDistance = dist;
        closestPoint = pt;
      }
    }

    if (
      closestPoint?.pos[0] !== hoveredPoint?.pos[0] ||
      closestPoint?.pos[1] !== hoveredPoint?.pos[1] ||
      closestPoint?.pos[2] !== hoveredPoint?.pos[2] ||
      closestPoint?.tipo !== hoveredPoint?.tipo
    ) {
      setHoveredPoint(closestPoint);
    }
  });

  // Listener para capturar el clic izquierdo sobre el punto detectado (Endpoint □ o Midpoint △)
  useEffect(() => {
    if (!snapPicking || modoTransformacion !== "grab") return;

    const handlePointerDown = (e: PointerEvent) => {
      if (e.button === 0 && hoveredPoint) {
        e.stopPropagation();
        e.preventDefault();
        if (typeof window !== "undefined") {
          (window as any).__lastSnapSelectTime = Date.now();
        }
        setSnapBasePoint(hoveredPoint.pos);
      }
    };

    const handleContextMenu = (e: MouseEvent) => {
      if (hoveredPoint) {
        e.preventDefault();
        e.stopPropagation();
      }
    };

    const dom = gl.domElement;
    dom.addEventListener("pointerdown", handlePointerDown, { capture: true });
    dom.addEventListener("contextmenu", handleContextMenu, { capture: true });
    return () => {
      dom.removeEventListener("pointerdown", handlePointerDown, { capture: true });
      dom.removeEventListener("contextmenu", handleContextMenu, { capture: true });
    };
  }, [snapPicking, modoTransformacion, hoveredPoint, setSnapBasePoint, gl]);

  const { snapTargetType } = use3BFStore();
  const snapColor = coloresApariencia.puntoSnap || coloresApariencia.objetosSeleccionados || "#FF9500";

  if (!furnitureGroup) return null;

  return (
    <>
      {/* 1. Icono de selección de Punto Base (Origen) durante modo [B] en la PRIMERA CAPA (HTML/SVG Overlay) */}
      {snapPicking && modoTransformacion === "grab" && hoveredPoint && (
        <group ref={snapGroupRef} position={furnitureGroup.position}>
          <Html position={hoveredPoint.pos} center zIndexRange={[9999, 9999]} style={{ pointerEvents: "none" }}>
            <div style={{ transform: "translate3d(0, 0, 0)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="24" height="24" viewBox="-12 -12 24 24" style={{ overflow: "visible" }}>
                {hoveredPoint.tipo === "corner" ? (
                  <rect
                    x="-5"
                    y="-5"
                    width="10"
                    height="10"
                    fill={snapColor}
                    stroke="#ffffff"
                    strokeWidth="1.5"
                    style={{ filter: "drop-shadow(0 0 2px rgba(0,0,0,0.6))" }}
                  />
                ) : (
                  <polygon
                    points="0,-6 6,5 -6,5"
                    fill={snapColor}
                    stroke="#ffffff"
                    strokeWidth="1.5"
                    style={{ filter: "drop-shadow(0 0 2px rgba(0,0,0,0.6))" }}
                  />
                )}
              </svg>
            </div>
          </Html>
        </group>
      )}

      {/* 2. Icono de Punto Destino (Target Snap) en la PRIMERA CAPA (HTML/SVG Overlay) */}
      {!snapPicking && modoTransformacion === "grab" && snapTargetPoint && (
        <Html position={snapTargetPoint} center zIndexRange={[9999, 9999]} style={{ pointerEvents: "none" }}>
          <div style={{ transform: "translate3d(0, 0, 0)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="24" height="24" viewBox="-12 -12 24 24" style={{ overflow: "visible" }}>
              {snapTargetType === "midpoint" ? (
                <polygon
                  points="0,-6 6,5 -6,5"
                  fill={snapColor}
                  stroke="#ffffff"
                  strokeWidth="1.5"
                  style={{ filter: "drop-shadow(0 0 2px rgba(0,0,0,0.6))" }}
                />
              ) : (
                <rect
                  x="-5"
                  y="-5"
                  width="10"
                  height="10"
                  fill={snapColor}
                  stroke="#ffffff"
                  strokeWidth="1.5"
                  style={{ filter: "drop-shadow(0 0 2px rgba(0,0,0,0.6))" }}
                />
              )}
            </svg>
          </div>
        </Html>
      )}

      {/* 3. Indicador de Punto Base de Origen Anclado en la Pieza en Movimiento */}
      {!snapPicking && modoTransformacion === "grab" && snapBasePoint && (
        <group ref={snapGroupRef} position={furnitureGroup.position}>
          <Html position={snapBasePoint} center zIndexRange={[9998, 9998]} style={{ pointerEvents: "none" }}>
            <div style={{ transform: "translate3d(0, 0, 0)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="20" height="20" viewBox="-10 -10 20 20" style={{ overflow: "visible" }}>
                <circle
                  cx="0"
                  cy="0"
                  r="3.5"
                  fill={snapColor}
                  stroke="#ffffff"
                  strokeWidth="1.5"
                  style={{ filter: "drop-shadow(0 0 2px rgba(0,0,0,0.6))" }}
                />
              </svg>
            </div>
          </Html>
        </group>
      )}
    </>
  );
}

export function GuidelineAxes() {
  const { modoTransformacion, ejeBloqueado, posicionPrevia } = use3BFStore();
  if (modoTransformacion !== "grab") return null;

  return (
    <group>
      {/* Eje X (Rojo - Horizontal en plano del suelo) */}
      {(ejeBloqueado === "none" || ejeBloqueado === "X") && (
        <line>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              args={[
                new Float32Array([
                  -50, posicionPrevia[1], posicionPrevia[2],
                  50, posicionPrevia[1], posicionPrevia[2],
                ]),
                3,
              ]}
            />
          </bufferGeometry>
          <lineBasicMaterial
            color="#ef4444"
            opacity={ejeBloqueado === "X" ? 1.0 : 0.4}
            transparent
            linewidth={2}
          />
        </line>
      )}

      {/* Eje Y (Verde - Profundidad en plano del suelo a lo largo del eje verde) */}
      {(ejeBloqueado === "none" || ejeBloqueado === "Y") && (
        <line>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              args={[
                new Float32Array([
                  posicionPrevia[0], posicionPrevia[1], -50,
                  posicionPrevia[0], posicionPrevia[1], 50,
                ]),
                3,
              ]}
            />
          </bufferGeometry>
          <lineBasicMaterial
            color="#22c55e"
            opacity={ejeBloqueado === "Y" ? 1.0 : 0.4}
            transparent
            linewidth={2}
          />
        </line>
      )}

      {/* Eje Z (Azul - Altura vertical en el aire) */}
      {(ejeBloqueado === "none" || ejeBloqueado === "Z") && (
        <line>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              args={[
                new Float32Array([
                  posicionPrevia[0], -50, posicionPrevia[2],
                  posicionPrevia[0], 50, posicionPrevia[2],
                ]),
                3,
              ]}
            />
          </bufferGeometry>
          <lineBasicMaterial
            color="#3b82f6"
            opacity={ejeBloqueado === "Z" ? 1.0 : 0.4}
            transparent
            linewidth={2}
          />
        </line>
      )}
    </group>
  );
}

export function TransformSnappingController() {
  const {
    modoTransformacion,
    posicionPrevia,
    setPosicionObjeto,
    ejeBloqueado,
    snapActivo,
    snapPicking,
    snapBasePoint,
    setSnapTargetPoint,
    objetoActivoId,
  } = use3BFStore();

  const { camera, raycaster, pointer } = useThree();
  const planeRef = useRef(new THREE.Plane(new THREE.Vector3(0, 1, 0), 0));
  const intersectionPoint = useRef(new THREE.Vector3());
  const initialOffset = useRef(new THREE.Vector3());
  const hasInitialized = useRef(false);

  useFrame(() => {
    if (modoTransformacion !== "grab") {
      hasInitialized.current = false;
      return;
    }

    // SI ESTÁ ELIGIENDO PUNTO BASE (B), LA PIEZA PERMANECE ESTÁTICA / INMÓVIL
    if (snapPicking) {
      hasInitialized.current = false;
      return;
    }

    if (ejeBloqueado === "Z") {
      // Movimiento vertical en Eje Z (Altura): plano vertical perpendicular a la vista
      const camDir = new THREE.Vector3();
      camera.getWorldDirection(camDir);
      camDir.y = 0;
      camDir.normalize();
      planeRef.current.setFromNormalAndCoplanarPoint(camDir, new THREE.Vector3(...posicionPrevia));
    } else {
      // Movimiento horizontal en el plano del suelo X / Y (plano Y = 0)
      planeRef.current.set(new THREE.Vector3(0, 1, 0), -posicionPrevia[1]);
    }

    raycaster.setFromCamera(pointer, camera);
    const hit = raycaster.ray.intersectPlane(planeRef.current, intersectionPoint.current);

    if (hit) {
      if (!hasInitialized.current) {
        initialOffset.current.copy(hit).sub(new THREE.Vector3(...posicionPrevia));
        hasInitialized.current = true;
      }

      const targetPos = hit.clone().sub(initialOffset.current);

      let finalX = snapBasePoint ? hit.x - snapBasePoint[0] : targetPos.x;
      let finalHeightY = ejeBloqueado === "Z" 
        ? (snapBasePoint ? hit.y - snapBasePoint[1] : targetPos.y) 
        : posicionPrevia[1];
      let finalDepthZ = snapBasePoint ? hit.z - snapBasePoint[2] : targetPos.z;

      if (ejeBloqueado === "X") {
        // Bloqueo en Eje X: solo se traslada en X
        finalHeightY = posicionPrevia[1];
        finalDepthZ = posicionPrevia[2];
      } else if (ejeBloqueado === "Y") {
        // Bloqueo en Eje Y (Verde / Profundidad en suelo): solo se traslada en Z de Three.js
        finalX = posicionPrevia[0];
        finalHeightY = posicionPrevia[1];
      } else if (ejeBloqueado === "Z") {
        // Bloqueo en Eje Z (Azul / Altura vertical): solo se traslada en Y de Three.js
        finalX = posicionPrevia[0];
        finalDepthZ = posicionPrevia[2];
      }

      const anchorOffset = snapBasePoint ? new THREE.Vector3(...snapBasePoint) : new THREE.Vector3(0, 0, 0);
      const currentAnchorWorld = new THREE.Vector3(finalX, finalHeightY, finalDepthZ).add(anchorOffset);

      // 🎯 SNAPPING INTER-GEOMETRÍAS (Destino hacia otras geometrías en el escenario)
      const otherTargets: Array<{ pos: [number, number, number]; tipo: "corner" | "midpoint" }> = [];

      if (typeof window !== "undefined" && (window as any).__3bfInstanceGroups) {
        const groupsMap: Map<string, THREE.Group> = (window as any).__3bfInstanceGroups;
        groupsMap.forEach((grp, id) => {
          if (id === objetoActivoId || !grp) return;
          const pts = extractCandidatePoints(grp);
          const grpWorldPos = new THREE.Vector3();
          grp.getWorldPosition(grpWorldPos);
          for (const p of pts) {
            otherTargets.push({
              pos: [p.pos[0] + grpWorldPos.x, p.pos[1] + grpWorldPos.y, p.pos[2] + grpWorldPos.z],
              tipo: p.tipo,
            });
          }
        });
      }

      let bestTarget: { pos: [number, number, number]; tipo: "corner" | "midpoint" } | null = null;
      let minDistance = 0.10; // 100mm de radio magnético de atracción hacia otra geometría

      for (const target of otherTargets) {
        const tWorld = new THREE.Vector3(...target.pos);
        const rayDist = raycaster.ray.distanceToPoint(tWorld);
        const anchorDist = currentAnchorWorld.distanceTo(tWorld);
        const effectiveDist = Math.min(rayDist, anchorDist);

        if (effectiveDist < minDistance) {
          minDistance = effectiveDist;
          bestTarget = target;
        }
      }

      if (bestTarget) {
        // 🎯 SNAP MAGNÉTICO AL DESTINO CON RESPETO AL EJE BLOQUEADO
        if (ejeBloqueado === "none") {
          finalX = bestTarget.pos[0] - anchorOffset.x;
          finalHeightY = bestTarget.pos[1] - anchorOffset.y;
          finalDepthZ = bestTarget.pos[2] - anchorOffset.z;
        } else if (ejeBloqueado === "X") {
          finalX = bestTarget.pos[0] - anchorOffset.x;
        } else if (ejeBloqueado === "Y") {
          finalDepthZ = bestTarget.pos[2] - anchorOffset.z;
        } else if (ejeBloqueado === "Z") {
          finalHeightY = bestTarget.pos[1] - anchorOffset.y;
        }
        setSnapTargetPoint(bestTarget.pos, bestTarget.tipo);
      } else if (snapActivo) {
        // Fallback a snapping de cuadrícula cada 100mm
        const snapStep = 0.1;
        const snappedAnchorX = Math.round(currentAnchorWorld.x / snapStep) * snapStep;
        const snappedAnchorY = Math.round(currentAnchorWorld.y / snapStep) * snapStep;
        const snappedAnchorZ = Math.round(currentAnchorWorld.z / snapStep) * snapStep;
        const snapThreshold = 0.05; // 50mm

        let targetSnap: [number, number, number] | null = null;

        if (ejeBloqueado === "X" && Math.abs(currentAnchorWorld.x - snappedAnchorX) < snapThreshold) {
          finalX = snappedAnchorX - anchorOffset.x;
          targetSnap = [snappedAnchorX, currentAnchorWorld.y, currentAnchorWorld.z];
        } else if (ejeBloqueado === "Y" && Math.abs(currentAnchorWorld.z - snappedAnchorZ) < snapThreshold) {
          finalDepthZ = snappedAnchorZ - anchorOffset.z;
          targetSnap = [currentAnchorWorld.x, currentAnchorWorld.y, snappedAnchorZ];
        } else if (ejeBloqueado === "Z" && Math.abs(currentAnchorWorld.y - snappedAnchorY) < snapThreshold) {
          finalHeightY = snappedAnchorY - anchorOffset.y;
          targetSnap = [currentAnchorWorld.x, snappedAnchorY, currentAnchorWorld.z];
        } else if (ejeBloqueado === "none") {
          if (Math.abs(currentAnchorWorld.x - snappedAnchorX) < snapThreshold) {
            finalX = snappedAnchorX - anchorOffset.x;
            targetSnap = [snappedAnchorX, currentAnchorWorld.y, currentAnchorWorld.z];
          }
          if (Math.abs(currentAnchorWorld.z - snappedAnchorZ) < snapThreshold) {
            finalDepthZ = snappedAnchorZ - anchorOffset.z;
            targetSnap = [finalX + anchorOffset.x, currentAnchorWorld.y, snappedAnchorZ];
          }
        }

        setSnapTargetPoint(targetSnap, "corner");
      } else {
        setSnapTargetPoint(null, null);
      }

      setPosicionObjeto([Number(finalX.toFixed(4)), Number(finalHeightY.toFixed(4)), Number(finalDepthZ.toFixed(4))]);
    }
  });

  return null;
}
