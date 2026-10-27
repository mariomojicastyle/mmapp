"use client";

import React, { useRef, useState, useMemo, useEffect, useCallback } from "react";
import * as THREE from "three";
import { useThree, ThreeEvent } from "@react-three/fiber";
import { use3BFStore } from "@/lib/store";
import { TableroCapaPlus } from "@/lib/storeTypes";

interface TableroGizmo3DProps {
  furnitureGroup: THREE.Group | null;
}

export default function TableroGizmo3D({ furnitureGroup }: TableroGizmo3DProps) {
  const { controls } = useThree();
  const {
    pasosManual,
    pasoActivoManualId,
    actualizarTableroPlus,
  } = use3BFStore();

  const pasoActivo = useMemo(() => {
    return (pasosManual || []).find((p) => p.id === pasoActivoManualId);
  }, [pasosManual, pasoActivoManualId]);

  // Buscar todos los tableros que tengan la casilla `mostrarGizmo` activa
  const tablerosConGizmo = useMemo(() => {
    if (!pasoActivo?.multiplePlus?.capas) return [];
    const lista: Array<{ capaId: string; tablero: TableroCapaPlus }> = [];
    pasoActivo.multiplePlus.capas.forEach((c) => {
      (c.tableros || []).forEach((t) => {
        if (t.gizmoPivote?.mostrarGizmo) {
          lista.push({ capaId: c.id, tablero: t });
        }
      });
    });
    return lista;
  }, [pasoActivo]);

  if (tablerosConGizmo.length === 0 || !furnitureGroup) {
    return null;
  }

  return (
    <group name="tablero_gizmos_3d_layer" renderOrder={9999}>
      {tablerosConGizmo.map(({ capaId, tablero }) => (
        <RhinoGumballGizmo
          key={`${capaId}_${tablero.id}`}
          tablero={tablero}
          furnitureGroup={furnitureGroup}
          controls={controls}
          onActualizar={(partial) =>
            actualizarTableroPlus(pasoActivo!.id, capaId, tablero.id, partial)
          }
        />
      ))}
    </group>
  );
}

interface RhinoGumballGizmoProps {
  tablero: TableroCapaPlus;
  furnitureGroup: THREE.Group;
  controls: any;
  onActualizar: (partial: Partial<TableroCapaPlus>) => void;
}

/**
 * 🎯 Manipulador 3D estilo Rhino Gumball puro, 100% nativo y blindado:
 * - Escala optimizada al 50% para máxima precisión de taller.
 * - Flechas estrictamente positivas (X rojo a +X, Y verde a +Y, Z azul a +Z) con puntas siempre hacia el infinito.
 * - Cero inversión de ejes y cero volteo de conos.
 * - Desplaza ÚNICAMENTE el pivote (la pieza de madera jamás se mueve ni salta).
 * - Arrastre capturado en ventana global (`window` pointermove): nunca desaparece al mover el ratón.
 * - Deshabilita OrbitControls limpiamente durante el arrastre para evitar que la cámara se mueva.
 */
function RhinoGumballGizmo({
  tablero,
  furnitureGroup,
  controls,
  onActualizar,
}: RhinoGumballGizmoProps) {
  const { camera, gl } = useThree();
  const [meshEncontrada, setMeshEncontrada] = useState<THREE.Mesh | null>(null);

  // Eje actualmente arrastrado ('x' | 'y' | 'z' | null)
  const dragAxisRef = useRef<"x" | "y" | "z" | null>(null);
  const dragPlaneRef = useRef<THREE.Plane>(new THREE.Plane());
  const dragStartPointRef = useRef<THREE.Vector3>(new THREE.Vector3());
  const initialOffsetCmRef = useRef<[number, number, number]>([0, 0, 0]);

  // Estado hover para feedback visual estilo Rhino Gumball
  const [hoveredAxis, setHoveredAxis] = useState<"x" | "y" | "z" | null>(null);

  // Localizar la malla del tablero en el escenario 3D
  useEffect(() => {
    if (!furnitureGroup) return;
    const tLow = tablero.id.toLowerCase().trim();

    let match: THREE.Mesh | null = null;
    furnitureGroup.traverse((obj) => {
      if ((obj as THREE.Mesh).isMesh) {
        const m = obj as THREE.Mesh;
        const cn = ((m.userData?.cleanName || m.name || "") as string).toLowerCase().trim();
        const pm = ((m.userData?.piezaMadre || "") as string).toLowerCase().trim();
        const ik = ((m.userData?.instanciaKey || "") as string).toLowerCase().trim();

        if (cn === tLow || pm === tLow || ik === tLow || cn.includes(tLow) || tLow.includes(cn)) {
          match = m;
        }
      }
    });

    setMeshEncontrada(match);
  }, [furnitureGroup, tablero.id]);

  // Centro geométrico de la pieza en el mundo
  const centerWorld = useMemo(() => {
    if (!meshEncontrada) return new THREE.Vector3(0, 0, 0);
    const box = new THREE.Box3().setFromObject(meshEncontrada);
    const c = new THREE.Vector3();
    box.getCenter(c);
    return c;
  }, [meshEncontrada, tablero.gizmoPivote?.offsetCm]);

  // Offset configurado del pivote (en cm -> metros)
  const offsetCm = tablero.gizmoPivote?.offsetCm || [0, 0, 0];
  const pivotPos = useMemo(() => {
    return new THREE.Vector3(
      centerWorld.x + (offsetCm[0] || 0) / 100,
      centerWorld.y + (offsetCm[1] || 0) / 100,
      centerWorld.z + (offsetCm[2] || 0) / 100
    );
  }, [centerWorld, offsetCm]);

  // ── INICIO DE ARRASTRE DE FLECHA ──────────────────────────────────────────
  const startDrag = useCallback(
    (axis: "x" | "y" | "z", e: ThreeEvent<PointerEvent>) => {
      e.stopPropagation();

      // Blindaje contra deselección accidental
      if (typeof window !== "undefined") {
        (window as any).__3bfIsDraggingGizmo = true;
        (window as any).__3bfHoveringGizmo = true;
        (window as any).__3bfLastGizmoDragTime = Date.now();
      }

      dragAxisRef.current = axis;
      initialOffsetCmRef.current = [offsetCm[0] || 0, offsetCm[1] || 0, offsetCm[2] || 0];

      // Bloquear OrbitControls para que la cámara no se mueva en absoluto
      if (controls) controls.enabled = false;

      // Crear un plano de arrastre que pasa por el pivote y mira perpendicular hacia la cámara
      const camDir = new THREE.Vector3();
      camera.getWorldDirection(camDir);
      dragPlaneRef.current.setFromNormalAndCoplanarPoint(camDir.negate(), pivotPos);

      // Calcular punto de intersección inicial en el plano de cámara
      const rect = gl.domElement.getBoundingClientRect();
      const ndc = new THREE.Vector2(
        ((e.clientX - rect.left) / rect.width) * 2 - 1,
        -((e.clientY - rect.top) / rect.height) * 2 + 1
      );
      const ray = new THREE.Raycaster();
      ray.setFromCamera(ndc, camera);

      const intersectPoint = new THREE.Vector3();
      if (ray.ray.intersectPlane(dragPlaneRef.current, intersectPoint)) {
        dragStartPointRef.current.copy(intersectPoint);
      } else {
        dragStartPointRef.current.copy(pivotPos);
      }

      // ── LISTENERS GLOBALES EN WINDOW PARA EVITAR PERDER EL ARRASTRE ─────────
      const handleWindowPointerMove = (ev: PointerEvent) => {
        if (!dragAxisRef.current) return;
        ev.preventDefault();
        ev.stopPropagation();

        if (typeof window !== "undefined") {
          (window as any).__3bfIsDraggingGizmo = true;
          (window as any).__3bfLastGizmoDragTime = Date.now();
        }

        const canvasRect = gl.domElement.getBoundingClientRect();
        const curNdc = new THREE.Vector2(
          ((ev.clientX - canvasRect.left) / canvasRect.width) * 2 - 1,
          -((ev.clientY - canvasRect.top) / canvasRect.height) * 2 + 1
        );
        const curRay = new THREE.Raycaster();
        curRay.setFromCamera(curNdc, camera);

        const curIntersect = new THREE.Vector3();
        if (!curRay.ray.intersectPlane(dragPlaneRef.current, curIntersect)) return;

        const delta = curIntersect.clone().sub(dragStartPointRef.current);
        if (!isFinite(delta.x) || !isFinite(delta.y) || !isFinite(delta.z)) return;

        const init = initialOffsetCmRef.current;
        let newOffset: [number, number, number] = [...init];

        if (dragAxisRef.current === "x") {
          const deltaCm = delta.x * 100;
          newOffset[0] = Math.round((init[0] + deltaCm) * 10) / 10;
        } else if (dragAxisRef.current === "y") {
          const deltaCm = delta.y * 100;
          newOffset[1] = Math.round((init[1] + deltaCm) * 10) / 10;
        } else if (dragAxisRef.current === "z") {
          const deltaCm = delta.z * 100;
          newOffset[2] = Math.round((init[2] + deltaCm) * 10) / 10;
        }

        onActualizar({
          gizmoPivote: {
            ...tablero.gizmoPivote,
            modo: "personalizado",
            offsetCm: newOffset,
          },
        });
      };

      const handleWindowPointerUp = (ev: PointerEvent) => {
        ev.preventDefault();
        ev.stopPropagation();

        dragAxisRef.current = null;
        if (controls) controls.enabled = true;

        if (typeof window !== "undefined") {
          (window as any).__3bfIsDraggingGizmo = false;
          (window as any).__3bfHoveringGizmo = false;
          (window as any).__3bfLastGizmoDragTime = Date.now();
        }

        window.removeEventListener("pointermove", handleWindowPointerMove);
        window.removeEventListener("pointerup", handleWindowPointerUp);
        window.removeEventListener("pointercancel", handleWindowPointerUp);
      };

      window.addEventListener("pointermove", handleWindowPointerMove, { passive: false });
      window.addEventListener("pointerup", handleWindowPointerUp, { passive: false });
      window.addEventListener("pointercancel", handleWindowPointerUp, { passive: false });
    },
    [controls, camera, gl, pivotPos, offsetCm, onActualizar, tablero.gizmoPivote]
  );

  // 📐 Dimensiones del Gumball Rhino reducidas al 50%
  const arrowLength = 0.16; // 16 cm (línea)
  const coneHeight = 0.045; // 4.5 cm (cono)
  const coneRadius = 0.010; // 1 cm (base del cono)
  const conePos = arrowLength + coneHeight / 2; // posición de la punta
  const sphereRadius = 0.009; // 9 mm (esfera de pivote)

  return (
    <group position={pivotPos} name="3bf_gumball_gizmo" userData={{ isGizmo: true }}>
      {/* 🎯 Esfera Central del Pivote (Cyan Tech Ethos) */}
      <mesh
        renderOrder={9999}
        name="3bf_gumball_pivot_sphere"
        userData={{ isGizmo: true }}
        onPointerOver={(e) => {
          e.stopPropagation();
          if (typeof window !== "undefined") (window as any).__3bfHoveringGizmo = true;
        }}
        onPointerOut={(e) => {
          e.stopPropagation();
          if (typeof window !== "undefined") (window as any).__3bfHoveringGizmo = false;
        }}
      >
        <sphereGeometry args={[sphereRadius, 16, 16]} />
        <meshBasicMaterial color="#0088AA" depthTest={false} transparent opacity={0.95} />
      </mesh>

      {/* 🔴 EJE X: Flecha Roja (Transversal Izquierda ↔ Derecha) - Apunta estrictamente a +X */}
      <group
        name="3bf_gumball_axis_x"
        userData={{ isGizmo: true }}
        onPointerDown={(e) => startDrag("x", e)}
        onPointerOver={(e) => {
          e.stopPropagation();
          if (typeof window !== "undefined") (window as any).__3bfHoveringGizmo = true;
          setHoveredAxis("x");
        }}
        onPointerOut={(e) => {
          e.stopPropagation();
          if (typeof window !== "undefined") (window as any).__3bfHoveringGizmo = false;
          setHoveredAxis(null);
        }}
        renderOrder={9999}
      >
        {/* Línea del eje X */}
        <mesh position={[arrowLength / 2, 0, 0]} rotation={[0, 0, -Math.PI / 2]} name="3bf_gumball_line_x" userData={{ isGizmo: true }}>
          <cylinderGeometry args={[0.002, 0.002, arrowLength, 8]} />
          <meshBasicMaterial
            color={hoveredAxis === "x" ? "#FBBF24" : "#EF4444"}
            depthTest={false}
            transparent
            opacity={0.95}
          />
        </mesh>
        {/* Cono en la punta +X apuntando hacia el infinito */}
        <mesh position={[conePos, 0, 0]} rotation={[0, 0, -Math.PI / 2]} name="3bf_gumball_cone_x" userData={{ isGizmo: true }}>
          <coneGeometry args={[coneRadius, coneHeight, 16]} />
          <meshBasicMaterial
            color={hoveredAxis === "x" ? "#FBBF24" : "#EF4444"}
            depthTest={false}
            transparent
            opacity={0.95}
          />
        </mesh>
        {/* Cilindro invisible más grueso para facilitar el clic del usuario */}
        <mesh position={[arrowLength / 2, 0, 0]} rotation={[0, 0, -Math.PI / 2]} name="3bf_gumball_hit_x" userData={{ isGizmo: true }}>
          <cylinderGeometry args={[0.022, 0.022, arrowLength + coneHeight, 8]} />
          <meshBasicMaterial transparent opacity={0} depthTest={false} />
        </mesh>
      </group>

      {/* 🟢 EJE Y: Flecha Verde (Vertical Suelo ↔ Altura) - Apunta estrictamente a +Y */}
      <group
        name="3bf_gumball_axis_y"
        userData={{ isGizmo: true }}
        onPointerDown={(e) => startDrag("y", e)}
        onPointerOver={(e) => {
          e.stopPropagation();
          if (typeof window !== "undefined") (window as any).__3bfHoveringGizmo = true;
          setHoveredAxis("y");
        }}
        onPointerOut={(e) => {
          e.stopPropagation();
          if (typeof window !== "undefined") (window as any).__3bfHoveringGizmo = false;
          setHoveredAxis(null);
        }}
        renderOrder={9999}
      >
        {/* Línea del eje Y */}
        <mesh position={[0, arrowLength / 2, 0]} name="3bf_gumball_line_y" userData={{ isGizmo: true }}>
          <cylinderGeometry args={[0.002, 0.002, arrowLength, 8]} />
          <meshBasicMaterial
            color={hoveredAxis === "y" ? "#FBBF24" : "#10B981"}
            depthTest={false}
            transparent
            opacity={0.95}
          />
        </mesh>
        {/* Cono en la punta +Y apuntando hacia arriba */}
        <mesh position={[0, conePos, 0]} name="3bf_gumball_cone_y" userData={{ isGizmo: true }}>
          <coneGeometry args={[coneRadius, coneHeight, 16]} />
          <meshBasicMaterial
            color={hoveredAxis === "y" ? "#FBBF24" : "#10B981"}
            depthTest={false}
            transparent
            opacity={0.95}
          />
        </mesh>
        {/* Cilindro invisible más grueso para facilitar el clic */}
        <mesh position={[0, arrowLength / 2, 0]} name="3bf_gumball_hit_y" userData={{ isGizmo: true }}>
          <cylinderGeometry args={[0.022, 0.022, arrowLength + coneHeight, 8]} />
          <meshBasicMaterial transparent opacity={0} depthTest={false} />
        </mesh>
      </group>

      {/* 🔵 EJE Z: Flecha Azul (Longitudinal Frente ↔ Fondo Mesa) - Apunta estrictamente a +Z */}
      <group
        name="3bf_gumball_axis_z"
        userData={{ isGizmo: true }}
        onPointerDown={(e) => startDrag("z", e)}
        onPointerOver={(e) => {
          e.stopPropagation();
          if (typeof window !== "undefined") (window as any).__3bfHoveringGizmo = true;
          setHoveredAxis("z");
        }}
        onPointerOut={(e) => {
          e.stopPropagation();
          if (typeof window !== "undefined") (window as any).__3bfHoveringGizmo = false;
          setHoveredAxis(null);
        }}
        renderOrder={9999}
      >
        {/* Línea del eje Z */}
        <mesh position={[0, 0, arrowLength / 2]} rotation={[Math.PI / 2, 0, 0]} name="3bf_gumball_line_z" userData={{ isGizmo: true }}>
          <cylinderGeometry args={[0.002, 0.002, arrowLength, 8]} />
          <meshBasicMaterial
            color={hoveredAxis === "z" ? "#FBBF24" : "#3B82F6"}
            depthTest={false}
            transparent
            opacity={0.95}
          />
        </mesh>
        {/* Cono en la punta +Z apuntando hacia el infinito */}
        <mesh position={[0, 0, conePos]} rotation={[Math.PI / 2, 0, 0]} name="3bf_gumball_cone_z" userData={{ isGizmo: true }}>
          <coneGeometry args={[coneRadius, coneHeight, 16]} />
          <meshBasicMaterial
            color={hoveredAxis === "z" ? "#FBBF24" : "#3B82F6"}
            depthTest={false}
            transparent
            opacity={0.95}
          />
        </mesh>
        {/* Cilindro invisible más grueso para facilitar el clic */}
        <mesh position={[0, 0, arrowLength / 2]} rotation={[Math.PI / 2, 0, 0]} name="3bf_gumball_hit_z" userData={{ isGizmo: true }}>
          <cylinderGeometry args={[0.022, 0.022, arrowLength + coneHeight, 8]} />
          <meshBasicMaterial transparent opacity={0} depthTest={false} />
        </mesh>
      </group>
    </group>
  );
}
