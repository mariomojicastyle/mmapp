"use client";

/**
 * ============================================================================
 * ARCHIVO: Viewer3D.tsx
 * VERSIÓN: v2.5.1 (Hito 120 - Suite 3dBimFab)
 * AUTOR: Mario Mojica (3dBimFab Engine)
 * ============================================================================
 * DESCRIPCIÓN & FUNCIONALIDAD:
 * 
 * Viewport 3D maestro y motor de renderizado interactivo para la suite 3dBimFab,
 * desarrollado sobre React Three Fiber (R3F), Drei y Three.js.
 * 
 * RESPONSABILIDADES CLAVE:
 * 1. RENDERIZADO PARAMÉTRICO B2B:
 *    - Renderiza geometrías de manufactura generadas en Grasshopper / RhinoCompute.
 *    - Soporta tanto mallas individuales (`SingleFurnitureInstanceMesh`) como
 *      ensambles multi-instancia optimizados (`InstancedFurnitureMesh`).
 * 
 * 2. SHADING & MATERIALES PBR:
 *    - Soporte multi-modo: Sólido (Clay/CAD), Ghosted (Rayos X con transparencia
 *      e interior visible) y Renderizado PBR completo (Albedo, Normal, Roughness, AO).
 *    - Entornos HDRI dinámicos, iluminación de estudio con gizmos de manipulación
 *      y sombras de contacto suaves (`ContactShadows` / `AccumulativeShadows`).
 * 
 * 3. MOTOR DE CINEMÁTICA Y MANUAL DE ARMADO 3D:
 *    - Integración en tiempo real con `manualAnimationEngine` para reproducir
 *      la animación cinemática de ensamblaje en cada paso (P00, P01, P02...).
 *    - Aislamiento visual por paso (`Invert Hide`): Oculta selectivamente piezas
 *      que no pertenecen al paso activo para foco absoluto del armador.
 *    - Transformación de Orientación en Banco de Trabajo (`orientacionBanco`):
 *      Aplica matrices de rotación en 3 ejes (X, Y, Z) con auto-centrado y
 *      alineación de apoyo a nivel de piso (min.y = 0) para emular la mesa física de taller.
 * 
 * 4. ALGORITMO DE DETECCIÓN Y REPRESENTACIÓN DE ARISTAS (CAD WIREFRAME - OPCIÓN 2):
 *    - Para tableros de madera (`isWoodBoard`), genera el wireframe perimetral puro (12 aristas exteriores)
 *      a partir de las dimensiones del prisma CAD (`boxMeshGeometry`), suprimiendo por completo
 *      costuras internas de partición de superficies, líneas de empalme y cortes de triangulación.
 *    - Suprime aristas duplicadas en capas superpuestas (Balance / MDP) evitando líneas engrosadas.
 *    - Para herrajes y mecanizados (`isHardware` / `isMachining`), preserva la silueta 3D técnica original
 *      con filtrado diédrico angular ajustable mediante `thresholdAristas`.
 * 
 * 5. HERRAMIENTAS DE EXPORTACIÓN & INTERACCIÓN:
 *    - Generación automática de miniaturas (thumbnails) de cámara para los pasos del manual.
 *    - Exportación directa a modelos GLB y Realidad Aumentada (WebXR / QuickLook).
 *    - Sistema de selección, snapping e inspección dimensional con feedback visual instantáneo.
 * ============================================================================
 */

import React, { useRef, useEffect } from "react";
import { Canvas, useThree, useFrame } from "@react-three/fiber";
import { OrbitControls, Grid, Stage, Edges, Line, Html } from "@react-three/drei";
import { use3BFStore, ObjetoInstancia3BF, MaterialPBRDef, DEFAULT_HDRI_CONFIG } from "@/lib/store";
import * as THREE from "three";
import * as BufferGeometryUtils from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { Download, Save, Zap, Trash2, CheckCircle2, AlertCircle, AlertTriangle, X, Loader2, Sun, Lamp, Sparkles, Smartphone, Square, Eye, EyeOff, Pipette, Check, Boxes, RefreshCw, Camera, RotateCw } from "lucide-react";
import NPanel from "./NPanel";
import { GHXAutoWatcher } from "./GHXAutoWatcher";
import SceneEnvironment from "./SceneEnvironment";
import StudioLightGizmos from "./StudioLightGizmos";
import LightInspectorModal from "./LightInspectorModal";
import ARViewerModal from "./ARViewerModal";
import ViewInArIcon from "@/components/icons/ViewInArIcon";
import { useGLBExport } from "./useGLBExport";
import TimelineScrubber from "@/components/manual/TimelineScrubber";
import BlenderTimeline from "@/components/manual/BlenderTimeline";
import { AssemblyPiecePositioner } from "./AssemblyPiecePositioner";
import { compilarAnimacionPaso, KinematicEngineResult } from "@/lib/manualAnimationEngine";
import { aplicarTransformacionesBancoSubbloques } from "@/lib/engine/workbenchTransform";
import { getSafeRestPosition, getSafeRestQuaternion } from "@/lib/engine/cadStateUtils";
import { extraerPiezaMadre, anotarInstanciasFisicas } from "@/lib/piezaMadreUtils";
import BloqueEstandar3DScene from "./BloqueEstandar3DScene";
import SubbloquesTooltipsBillboard from "./SubbloquesTooltipsBillboard";
import BoardMesh, { useMaterialPBRMaps } from "./BoardMesh";
import SingleFurnitureInstanceMesh from "./SingleFurnitureInstanceMesh";
import { SnapPointMarkers, GuidelineAxes, TransformSnappingController, getFurnitureGroupBoardBox } from "./SnapSystemOverlay";
import { BlenderNavigationController, CameraRefBridge, ThumbnailCapturer, CameraViewController, CameraPersistenceController } from "./CameraControllers";
import { AutoFramingCameraController } from "./AutoFramingCameraController";
import { ManualCameraDirector } from "./ManualCameraDirector";
import DfMAShieldAlert from "./DfMAShieldAlert";

function obtenerNombreUnificadoPieza(obj: THREE.Object3D): string {
  const rawMeshName = (obj as any).userData?.cleanName || (obj as any).userData?.rawName || obj.name || "";
  const meshName = rawMeshName.replace(/^RH_OUT:/i, "").trim();
  const parentName = obj.parent ? obj.parent.name : "";
  const meshNameLower = meshName.toLowerCase();
  const parentNameLower = parentName.toLowerCase();

  // 0. Si es un herraje (o hijo del grupo Herrajes), conservar íntegramente el nombre original de Grasshopper
  const isHardware = 
    Boolean((obj as any).userData?.isHardware) ||
    parentNameLower === "herrajes" ||
    parentNameLower.includes("herraje") ||
    ((
      meshNameLower.includes("perno") ||
      meshNameLower.includes("caja") ||
      meshNameLower.includes("tarugo") ||
      meshNameLower.includes("cavilha") ||
      meshNameLower.includes("clavilha") ||
      meshNameLower.includes("tornillo") ||
      meshNameLower.includes("parafuso") ||
      meshNameLower.includes("prego") ||
      meshNameLower.includes("puntilla") ||
      meshNameLower.includes("clavo") ||
      meshNameLower.includes("soporte") ||
      meshNameLower.includes("suporte") ||
      meshNameLower.includes("corredera") ||
      meshNameLower.includes("corredi") ||
      meshNameLower.includes("cantoneira") ||
      meshNameLower.includes("angulo") ||
      meshNameLower.includes("esquinero") ||
      meshNameLower.includes("bisagra") ||
      meshNameLower.includes("dobradiça") ||
      meshNameLower.includes("dobradi") ||
      meshNameLower.includes("puxador") ||
      meshNameLower.includes("manija") ||
      meshNameLower.includes("pes") ||
      meshNameLower.includes("pés") ||
      meshNameLower.includes("pata") ||
      meshNameLower.includes("pie") ||
      meshNameLower.includes("porca") ||
      meshNameLower.includes("tuerca") ||
      meshNameLower.includes("tampa") ||
      meshNameLower.includes("tapa") ||
      meshNameLower.includes("adesivo")
    ) && !meshNameLower.includes("cajon") && !meshNameLower.includes("cajón"));

  if (isHardware && meshName) {
    // 🔩 Retornar exactamente el nombre que viene de Grasshopper (ej. "Parafuso A", "Parafuso B", "Corrediça")
    return meshName;
  }

  // 1. Detección de Peça X o PK X (ej. Peça 6, Peça 6 B, MDP Peça 10, Color Peça 10 -> "Peça 10" o "PK10")
  const matchPK = meshName.match(/pk\s*(\d+)/i);
  if (matchPK) {
    return `PK${matchPK[1]}`;
  }

  const matchPeca = meshName.match(/pe[cç]a\s*(\d+)/i);
  if (matchPeca) {
    return `Peça ${matchPeca[1]}`;
  }

  // 2. Si es un tablero / cubierta
  if (parentNameLower === "cubierta" || meshNameLower.includes("cubierta")) {
    return "Cubierta";
  }
  if (meshNameLower.includes("entrepaño") || meshNameLower.includes("entrepanio")) {
    return "Entrepaño";
  }
  if (meshNameLower.includes("lateral")) {
    return "Lateral";
  }
  if (meshNameLower.startsWith("mdp")) {
    return "MDP";
  }
  if (meshNameLower.startsWith("mdf")) {
    return "MDF";
  }

  if (meshNameLower.includes("maquinado")) {
    return "Maquinado CNC";
  }

  // Limpiar sufijos B o índices secundarios solo para tableros
  return meshName.replace(/\s*[_\-]?\s*[bB]$/, "").replace(/\.\d+$/, "").trim();
}

function HoverRaycastTracker({ furnitureGroup }: { furnitureGroup: THREE.Group | null }) {
  const { camera, scene, gl } = useThree();
  const { setHoveredPiece, modoTransformacion } = use3BFStore();

  React.useEffect(() => {
    const dom = gl.domElement;
    const raycaster = new THREE.Raycaster();
    const pointerNDC = new THREE.Vector2();

    const handlePointerMove = (e: PointerEvent) => {
      // Si está en modo grab o transformación, no activar tooltips
      if (modoTransformacion !== "none") {
        setHoveredPiece(null);
        return;
      }

      const rect = dom.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;

      pointerNDC.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      pointerNDC.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(pointerNDC, camera);

      // Recolectar todos los grupos o mallas de piezas 3BF en el escenario
      const targets: THREE.Object3D[] = [];
      if (furnitureGroup) {
        targets.push(furnitureGroup);
      }
      if (typeof window !== "undefined" && (window as any).__3bfInstanceGroups) {
        const groupsMap: Map<string, THREE.Group> = (window as any).__3bfInstanceGroups;
        groupsMap.forEach((grp) => {
          if (grp) targets.push(grp);
        });
      }

      if (targets.length === 0) {
        setHoveredPiece(null);
        return;
      }

      const hits = raycaster.intersectObjects(targets, true);
      const validHit = hits.find((h) => {
        const obj = h.object;
        const n = (obj.name || "").toLowerCase();
        return (
          obj.type === "Mesh" &&
          obj.visible &&
          obj.name.length > 0 &&
          !n.includes("floor") &&
          !n.includes("grid") &&
          !n.includes("plane") &&
          !n.includes("axis") &&
          !n.includes("silhouette") &&
          !n.includes("helper")
        );
      });

      if (validHit) {
        const pieceName = obtenerNombreUnificadoPieza(validHit.object);
        setHoveredPiece(pieceName);
        
        let foundInstId: string | null = (validHit.object as any).userData?.instanciaId || null;
        let curr = validHit.object.parent;
        while (curr && !foundInstId) {
          if ((curr as any).userData?.instanciaId) {
            foundInstId = (curr as any).userData.instanciaId;
          }
          curr = curr.parent;
        }
        if (typeof window !== "undefined") {
          (window as any).__hoveredInstanceId = foundInstId;
        }
      } else {
        setHoveredPiece(null);
        if (typeof window !== "undefined") {
          (window as any).__hoveredInstanceId = null;
        }
      }
    };

    const handlePointerLeave = () => {
      setHoveredPiece(null);
      if (typeof window !== "undefined") {
        (window as any).__hoveredInstanceId = null;
      }
    };

    dom.addEventListener("pointermove", handlePointerMove, { passive: true });
    dom.addEventListener("pointerleave", handlePointerLeave);

    return () => {
      dom.removeEventListener("pointermove", handlePointerMove);
      dom.removeEventListener("pointerleave", handlePointerLeave);
    };
  }, [camera, scene, gl, furnitureGroup, modoTransformacion, setHoveredPiece]);

  return null;
}

function RhinoAxisTracker({ onUpdate }: { onUpdate: (axes: { x: { x: number; y: number }, y: { x: number; y: number }, z: { x: number; y: number } }) => void }) {
  const { camera } = useThree();

  useFrame(() => {
    const qInv = camera.quaternion.clone().invert();
    const vX = new THREE.Vector3(1, 0, 0).applyQuaternion(qInv);
    const vY = new THREE.Vector3(0, 0, -1).applyQuaternion(qInv);
    const vZ = new THREE.Vector3(0, 1, 0).applyQuaternion(qInv);

    const len = 25;

    onUpdate({
      x: { x: vX.x * len, y: -vX.y * len },
      y: { x: vY.x * len, y: -vY.y * len },
      z: { x: vZ.x * len, y: -vZ.y * len },
    });
  });

  return null;
}

function GroundInfiniteAxes() {
  const { calibracion, coloresApariencia } = use3BFStore();

  if (!calibracion.mostrarGrilla || !calibracion.mostrarEjesCoordenadas) return null;

  const count = Math.max(1, calibracion.numeroLineasRejilla || 500);
  const cellSpacing = Math.max(0.001, calibracion.distanciaCuadricula || 0.01);
  const halfExtent = count * cellSpacing;
  const axisWidth = calibracion.grosorGrillaGruesa || 2.0;

  return (
    <group position={[0, -0.00095, 0]} renderOrder={100}>
      {calibracion.mostrarEjeX && (
        <Line
          points={[
            [0, 0, 0],
            [halfExtent, 0, 0],
          ]}
          color={coloresApariencia.ejeX || calibracion.colorEjeX || "#0891B2"}
          lineWidth={axisWidth}
          toneMapped={false}
          renderOrder={100}
          depthTest={true}
          polygonOffset={true}
          polygonOffsetFactor={-10}
        />
      )}
      {calibracion.mostrarEjeY && (
        <Line
          points={[
            [0, 0, 0],
            [0, 0, -halfExtent],
          ]}
          color={coloresApariencia.ejeY || calibracion.colorEjeY || "#B91C1C"}
          lineWidth={axisWidth}
          toneMapped={false}
          renderOrder={100}
          depthTest={true}
          polygonOffset={true}
          polygonOffsetFactor={-10}
        />
      )}
    </group>
  );
}


function extractStaticGeometry(furnitureGroup: THREE.Group) {
  const worldBox = getFurnitureGroupBoardBox(furnitureGroup);
  if (worldBox.isEmpty()) return null;

  const groupWorldPos = new THREE.Vector3();
  furnitureGroup.getWorldPosition(groupWorldPos);

  // Micro-expansión geométrica (0.6mm) para eliminar completamente el Z-fighting con las caras de la malla
  const eps = 0.0006;
  const minX = worldBox.min.x - groupWorldPos.x - eps;
  const maxX = worldBox.max.x - groupWorldPos.x + eps;
  const minY = worldBox.min.y - groupWorldPos.y - eps;
  const maxY = worldBox.max.y - groupWorldPos.y + eps;
  const minZ = worldBox.min.z - groupWorldPos.z - eps;
  const maxZ = worldBox.max.z - groupWorldPos.z + eps;

  const midX = (minX + maxX) / 2;
  const midY = (minY + maxY) / 2;
  const midZ = (minZ + maxZ) / 2;

  const faces = [
    { normal: new THREE.Vector3(0, 0, 1), center: new THREE.Vector3(midX, midY, maxZ) },  // 0: Front (+Z)
    { normal: new THREE.Vector3(0, 0, -1), center: new THREE.Vector3(midX, midY, minZ) }, // 1: Back (-Z)
    { normal: new THREE.Vector3(0, 1, 0), center: new THREE.Vector3(midX, maxY, midZ) },  // 2: Top (+Y)
    { normal: new THREE.Vector3(0, -1, 0), center: new THREE.Vector3(midX, minY, midZ) }, // 3: Bottom (-Y)
    { normal: new THREE.Vector3(1, 0, 0), center: new THREE.Vector3(maxX, midY, midZ) },  // 4: Right (+X)
    { normal: new THREE.Vector3(-1, 0, 0), center: new THREE.Vector3(minX, midY, midZ) }, // 5: Left (-X)
  ];

  const edges: Array<{ fA: number; fB: number; p1: [number, number, number]; p2: [number, number, number] }> = [
    // Top edges
    { fA: 2, fB: 0, p1: [minX, maxY, maxZ], p2: [maxX, maxY, maxZ] },
    { fA: 2, fB: 1, p1: [minX, maxY, minZ], p2: [maxX, maxY, minZ] },
    { fA: 2, fB: 4, p1: [maxX, maxY, minZ], p2: [maxX, maxY, maxZ] },
    { fA: 2, fB: 5, p1: [minX, maxY, minZ], p2: [minX, maxY, maxZ] },
    // Bottom edges
    { fA: 3, fB: 0, p1: [minX, minY, maxZ], p2: [maxX, minY, maxZ] },
    { fA: 3, fB: 1, p1: [minX, minY, minZ], p2: [maxX, minY, minZ] },
    { fA: 3, fB: 4, p1: [maxX, minY, minZ], p2: [maxX, minY, maxZ] },
    { fA: 3, fB: 5, p1: [minX, minY, minZ], p2: [minX, minY, maxZ] },
    // Vertical edges
    { fA: 0, fB: 5, p1: [minX, minY, maxZ], p2: [minX, maxY, maxZ] },
    { fA: 0, fB: 4, p1: [maxX, minY, maxZ], p2: [maxX, maxY, maxZ] },
    { fA: 1, fB: 5, p1: [minX, minY, minZ], p2: [minX, maxY, minZ] },
    { fA: 1, fB: 4, p1: [maxX, minY, minZ], p2: [maxX, maxY, minZ] },
  ];

  return { faces, edges };
}

function BoardSilhouetteOutline({ furnitureGroup }: { furnitureGroup: THREE.Group | null }) {
  const { objetoSeleccionado, modoTransformacion, objetoActivoId, coloresApariencia } = use3BFStore();
  const { camera } = useThree();
  const [silhouettePoints, setSilhouettePoints] = React.useState<[number, number, number][][]>([]);
  const outlineGroupRef = useRef<THREE.Group>(null);
  const lastBboxKeyRef = useRef<string>("");
  const geoDataRef = useRef<any>(null);

  // 2. Loop ultra rápido de 60 FPS: sincroniza posición y evalúa cambios geométricos en tiempo real
  useFrame(() => {
    if (!objetoSeleccionado || !furnitureGroup) {
      if (silhouettePoints.length > 0) setSilhouettePoints([]);
      return;
    }

    // Sincronización instantánea de posición a 60 FPS
    if (outlineGroupRef.current) {
      outlineGroupRef.current.position.copy(furnitureGroup.position);
    }

    // 🎯 DETECCIÓN DINÁMICA DE CAMBIO DE GEOMETRÍA O PARÁMETROS (X, Y, Z completos)
    const worldBox = getFurnitureGroupBoardBox(furnitureGroup);
    const groupWorldPos = new THREE.Vector3();
    furnitureGroup.getWorldPosition(groupWorldPos);

    // BBox en espacio local para detectar cambios de forma/dimensiones en todos los ejes
    const locMinX = (worldBox.min.x - groupWorldPos.x).toFixed(3);
    const locMaxX = (worldBox.max.x - groupWorldPos.x).toFixed(3);
    const locMinY = (worldBox.min.y - groupWorldPos.y).toFixed(3);
    const locMaxY = (worldBox.max.y - groupWorldPos.y).toFixed(3);
    const locMinZ = (worldBox.min.z - groupWorldPos.z).toFixed(3);
    const locMaxZ = (worldBox.max.z - groupWorldPos.z).toFixed(3);
    const bboxKey = `${locMinX}_${locMaxX}_${locMinY}_${locMaxY}_${locMinZ}_${locMaxZ}_${objetoActivoId}`;

    if (!geoDataRef.current || lastBboxKeyRef.current !== bboxKey) {
      lastBboxKeyRef.current = bboxKey;
      geoDataRef.current = extractStaticGeometry(furnitureGroup);
    }

    const staticGeometry = geoDataRef.current;
    if (!staticGeometry) {
      if (silhouettePoints.length > 0) setSilhouettePoints([]);
      return;
    }

    const { faces, edges } = staticGeometry;
    const camPos = camera.position;

    const isVisible = faces.map((f: any) => {
      const worldFaceCenter = f.center.clone().add(groupWorldPos);
      const dir = camPos.clone().sub(worldFaceCenter);
      return f.normal.dot(dir) > 0;
    });

    const activeSilhouettes: [number, number, number][][] = [];
    for (const e of edges) {
      if (isVisible[e.fA] !== isVisible[e.fB]) {
        activeSilhouettes.push([e.p1, e.p2]);
      }
    }

    setSilhouettePoints(activeSilhouettes);
  });

  if (!objetoSeleccionado || !furnitureGroup || silhouettePoints.length === 0) return null;

  return (
    <group ref={outlineGroupRef} position={furnitureGroup.position} renderOrder={999}>
      {silhouettePoints.map((pts, idx) => (
        <Line
          key={`sil-${idx}`}
          points={pts}
          color={
            modoTransformacion === "grab"
              ? (coloresApariencia.objetosBloqueados || "#111827")
              : (coloresApariencia.objetosSeleccionados || "#FF9500")
          }
          lineWidth={3.0}
          toneMapped={false}
          renderOrder={999}
          depthTest={false}
          depthWrite={false}
          transparent={true}
        />
      ))}
    </group>
  );
}

function SelectionController() {
  const { gl } = useThree();
  const { setObjetoSeleccionado, seleccionarInstancia, modoTransformacion, snapPicking, cancelarGrab, confirmarGrab } = use3BFStore();

  React.useEffect(() => {
    const domElement = gl.domElement;

    const handlePointerDown = (e: PointerEvent) => {
      const state = use3BFStore.getState();
      // 🛡️ BLINDAJE ESTRICTO: En modo Manual 3D o con Picking activo, PROHIBIDO deseleccionar o alterar instancias
      if (state.pestanaActiva === "manual" || state.modoPickingManual.activo) {
        return;
      }

      // 🎯 CLIC DERECHO INSTANTÁNEO (0ms de latencia en la primera pulsación)
      if (e.button === 2) {
        if (modoTransformacion === "grab") {
          cancelarGrab();
          return;
        }

        const hoveredInstId = typeof window !== "undefined" ? (window as any).__hoveredInstanceId : null;
        if (hoveredInstId && state.instancias[hoveredInstId]) {
          seleccionarInstancia(hoveredInstId);
        } else {
          const currentHover = state.hoveredPiece;
          if (currentHover !== null) {
            setObjetoSeleccionado(true);
          } else {
            if (Object.keys(state.instancias || {}).length <= 1) {
              // Mantener la instancia activa seleccionada
            } else {
              seleccionarInstancia(null);
            }
          }
        }
      } else if (e.button === 0) {
        // 🎯 CLIC IZQUIERDO
        if (modoTransformacion === "none") {
          const hoveredInstId = typeof window !== "undefined" ? (window as any).__hoveredInstanceId : null;
          if (hoveredInstId && state.instancias[hoveredInstId]) {
            seleccionarInstancia(hoveredInstId);
          } else {
            const currentHover = state.hoveredPiece;
            if (currentHover !== null) {
              setObjetoSeleccionado(true);
            } else {
              if (Object.keys(state.instancias || {}).length <= 1) {
                // Mantener la instancia activa seleccionada
              } else {
                seleccionarInstancia(null);
              }
            }
          }
        } else if (modoTransformacion === "grab") {
          // ⚠️ Si está eligiendo punto de snap (B), NO confirmar ni deseleccionar
          if (state.snapPicking) return;
          if (typeof window !== "undefined" && (window as any).__lastSnapSelectTime) {
            if (Date.now() - (window as any).__lastSnapSelectTime < 400) return;
          }
          confirmarGrab();
        }
      }
    };

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault(); // Prevenir menú nativo del navegador

      const state = use3BFStore.getState();
      if (state.pestanaActiva === "manual" || state.modoPickingManual.activo) {
        return;
      }

      if (modoTransformacion === "grab") {
        if (state.snapPicking) return;
        cancelarGrab();
        return;
      }

      const hoveredInstId = typeof window !== "undefined" ? (window as any).__hoveredInstanceId : null;
      if (hoveredInstId && state.instancias[hoveredInstId]) {
        seleccionarInstancia(hoveredInstId);
      } else {
        const currentHover = state.hoveredPiece;
        if (currentHover !== null) {
          setObjetoSeleccionado(true);
        } else {
          if (Object.keys(state.instancias || {}).length <= 1) {
            // Mantener la instancia activa seleccionada
          } else {
            seleccionarInstancia(null);
          }
        }
      }
    };

    // Usar capture: true para máxima sensibilidad inmediata
    domElement.addEventListener("pointerdown", handlePointerDown as any, { capture: true });
    domElement.addEventListener("contextmenu", handleContextMenu);

    return () => {
      domElement.removeEventListener("pointerdown", handlePointerDown as any, { capture: true });
      domElement.removeEventListener("contextmenu", handleContextMenu);
    };
  }, [gl, modoTransformacion, cancelarGrab, confirmarGrab, setObjetoSeleccionado]);

  return null;
}

function ParametricFurnitureMesh({ 
  setFurnitureGroup,
  mostrarDuplicadosRojos = true,
}: { 
  setFurnitureGroup: (g: THREE.Group | null) => void;
  mostrarDuplicadosRojos?: boolean;
}) {
  const { instancias, objetoActivoId, parametros, resultado } = use3BFStore();

  const listaInstancias = Object.values(instancias);

  if (listaInstancias.length > 0) {
    const targetInstId = (objetoActivoId && instancias[objetoActivoId])
      ? objetoActivoId
      : listaInstancias[0].id;

    return (
      <>
        {listaInstancias.map((inst) => (
          <SingleFurnitureInstanceMesh
            key={inst.id}
            inst={inst}
            isSelected={inst.id === targetInstId}
            setFurnitureGroup={inst.id === targetInstId ? setFurnitureGroup : undefined}
            mostrarDuplicadosRojos={mostrarDuplicadosRojos}
          />
        ))}
      </>
    );
  }

  if (!parametros.model_id || !resultado) {
    return null;
  }

  const legacyInst: ObjetoInstancia3BF = {
    id: "legacy_single",
    nombreVisible: parametros.model_id,
    definitionId: parametros.model_id,
    archivo: parametros.custom_filename || `${parametros.model_id}.ghx`,
    parametros: parametros as any,
    resultado: resultado,
    cargando: false,
    posicion: [0, 0, 0],
    rotacion: [0, 0, 0],
    posicionPrevia: [0, 0, 0],
  };

  return (
    <SingleFurnitureInstanceMesh
      inst={legacyInst}
      isSelected={true}
      setFurnitureGroup={setFurnitureGroup}
      mostrarDuplicadosRojos={mostrarDuplicadosRojos}
    />
  );
}

function AssemblyAnimationController({ furnitureGroup }: { furnitureGroup: THREE.Group | null }) {
  const {
    pestanaActiva,
    pasosManual,
    pasoActivoManualId,
    timelineCurrentTime,
    objetoActivoId,
    instancias,
    vistaPiezasDesplazadas,
  } = use3BFStore();

  const activeStep = pasosManual.find((p) => p.id === pasoActivoManualId) || pasosManual[0];
  const engineRef = useRef<KinematicEngineResult | null>(null);

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

    // 🔄 Si el switch está en "Posición Original" (vistaPiezasDesplazadas === false),
    // restaurar inmediatamente todas las mallas a su posición de reposo ensamblada original (pRest).
    if (!vistaPiezasDesplazadas) {
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

      // 🪚 Si el paso activo contiene subbloques, aplicar directamente sus transformaciones de banco de trabajo
      if (activeStep.subbloques && activeStep.subbloques.length > 0 && activeStep.tipo !== "showcase") {
        const sceneMeshes: THREE.Mesh[] = [];
        effectiveGroup.traverse((child: any) => {
          if (child.isMesh) sceneMeshes.push(child);
        });
        aplicarTransformacionesBancoSubbloques(sceneMeshes, activeStep.subbloques);
      }

      return;
    }

    try {
      const res = compilarAnimacionPaso(effectiveGroup, activeStep);
      engineRef.current = res;
      if (typeof window !== "undefined") {
        (window as any).__3bfManualEngine = res;
      }
      res.actualizarTiempo(timelineCurrentTime);
    } catch (e) {
      console.warn("[AssemblyAnimationController] Error al compilar animación:", e);
    }

    return () => {
      if (typeof window !== "undefined" && (window as any).__3bfManualEngine === engineRef.current) {
        (window as any).__3bfManualEngine = null;
      }
      if (engineRef.current) {
        engineRef.current.detener();
        engineRef.current = null;
      }
    };
  }, [
    pestanaActiva,
    effectiveGroup,
    vistaPiezasDesplazadas,
    activeStep?.id,
    activeStep?.duracionTotal,
    JSON.stringify(activeStep?.secuencia),
    JSON.stringify(activeStep?.configuracionCinematica),
    activeStep?.showcase?.coreografia,
    activeStep?.showcase?.distanciaAperturaMm,
    activeStep?.showcase?.ejeGlobal,
    activeStep?.showcase?.abrirCajones,
    activeStep?.showcase?.abrirPuertas,
    JSON.stringify(activeStep?.showcase?.gruposCinematicos),
    JSON.stringify(activeStep?.orientacionBanco),
    JSON.stringify(activeStep?.subbloques),
    activeStep?.coreografiaSubbloques,
  ]);

  useEffect(() => {
    if (engineRef.current && pestanaActiva === "manual") {
      engineRef.current.actualizarTiempo(timelineCurrentTime);
    }
  }, [timelineCurrentTime, pestanaActiva]);

  return null;
}

// =========================================================================
// VISOR 3D PRINCIPAL (VIEWPORT)
// =========================================================================

export default function Viewer3D() {
  const controlsRef = useRef<any>(null);
  const cameraRef = useRef<THREE.Camera | null>(null);
  const {
    tema,
    esquemaColor,
    pestanaActiva,
    resultado,
    modoVisual,
    calibracion,
    coloresApariencia,
    escenarioLimpio,
    parametros,
    hoveredPiece,
    setMostrarNPanel,
    pestanaNPanel,
    setPestanaNPanel,
    setModalGuardarComoAbierto,
    muebleActivoGuardado,
    camaraEscena,
    instancias,
    objetoActivoId,
    seleccionarInstancia,
    objetoSeleccionado,
    setObjetoSeleccionado,
    modoTransformacion,
    posicionObjeto,
    iniciarGrab,
    confirmarGrab,
    cancelarGrab,
    ejeBloqueado,
    setEjeBloqueado,
    piezaEnPosicionamientoManual,
    snapActivo,
    snapPicking,
    snapBasePoint,
    toggleSnapMode,
    deshacer,
    rehacer,
    mecanizadosCruzados,
    mecanizadoEnProgreso,
    perforarMueble,
    limpiarPerforaciones,
    renombrarInstancia,
    eliminarInstancia,
    guardarCambiosMueble,
    guardandoMueble,
    recargarDefinicionInstancia,
    workerStatus,
    cargando,
    toggleGizmosLuces,
    mostrarMarcoEncuadre,
    toggleMarcoEncuadre,
    simuladorMovilActivo,
    toggleSimuladorMovil,
    simuladorMovilOrientacion,
    toggleSimuladorMovilOrientacion,
    modoPickingManual,
    limpiarPickingManual,
    confirmarPickingManual,
    pasosManual,
    pasoActivoManualId,
    conmutarOcultarNoAsignadasPaso,
    purgarMallasDuplicadas,
    guardarManualProyecto,
    guardandoManual,
    manualActivoGuardado,
    timelineCurrentTime,
    forzarRecargaDesdeGHX,
  } = use3BFStore();

  const pasoActivoManual = React.useMemo(() => {
    return pasosManual.find((p) => p.id === pasoActivoManualId);
  }, [pasosManual, pasoActivoManualId]);

  const [guardadoManualReciente, setGuardadoManualReciente] = React.useState(false);
  const [guardadoMuebleReciente, setGuardadoMuebleReciente] = React.useState(false);
  const [recargandoGHX, setRecargandoGHX] = React.useState(false);

  const prevGuardandoMueble = React.useRef(guardandoMueble);
  React.useEffect(() => {
    if (prevGuardandoMueble.current && !guardandoMueble) {
      setGuardadoMuebleReciente(true);
      const timer = setTimeout(() => setGuardadoMuebleReciente(false), 2400);
      return () => clearTimeout(timer);
    }
    prevGuardandoMueble.current = guardandoMueble;
  }, [guardandoMueble]);

  const prevGuardandoManual = React.useRef(guardandoManual);
  React.useEffect(() => {
    if (prevGuardandoManual.current && !guardandoManual) {
      setGuardadoManualReciente(true);
      const timer = setTimeout(() => setGuardadoManualReciente(false), 2400);
      return () => clearTimeout(timer);
    }
    prevGuardandoManual.current = guardandoManual;
  }, [guardandoManual]);

  const estaGuardando = Boolean(guardandoMueble || guardandoManual);
  const estaSincronizando = Boolean(cargando || (objetoActivoId && instancias[objetoActivoId]?.cargando) || recargandoGHX || estaGuardando);
  const parametrosActivos = (objetoActivoId && instancias[objetoActivoId]?.parametros) || parametros;
  const paramSignature = React.useMemo(() => {
    if (!parametrosActivos) return "";
    return `${parametrosActivos.ancho ?? ""}_${parametrosActivos.alto ?? ""}_${parametrosActivos.profundidad ?? ""}_${parametrosActivos.model_id ?? ""}_${JSON.stringify(parametrosActivos)}_${estaGuardando ? "guardando" : "idle"}`;
  }, [parametrosActivos, estaGuardando]);

  // ⚡ Progreso proporcional dinámico para la barra de carga (Tema Light: #0088AA / Tema Dark: #1368AA)
  const [progresoSincronizacion, setProgresoSincronizacion] = React.useState(0);
  const [mostrarBarraProgreso, setMostrarBarraProgreso] = React.useState(false);
  const startTimeRef = React.useRef<number>(Date.now());
  const prevSignatureRef = React.useRef<string>(paramSignature);

  React.useEffect(() => {
    let intervalId: any = null;
    let timeoutId: any = null;

    const parametrosCambiaron = paramSignature !== prevSignatureRef.current;
    prevSignatureRef.current = paramSignature;

    if (estaSincronizando) {
      setMostrarBarraProgreso(true);

      // Si se modificó otra dimensión durante el cómputo (o arranca una nueva sincronización), resetear barra a 8% y reiniciar cronómetro
      if (parametrosCambiaron || progresoSincronizacion === 0 || progresoSincronizacion === 100) {
        setProgresoSincronizacion(estaGuardando ? 15 : 8);
        startTimeRef.current = Date.now();
      }

      // Curva asintótica que modela el cómputo o guardado hacia un 94% máximo
      intervalId = setInterval(() => {
        const elapsed = (Date.now() - startTimeRef.current) / 1000;
        const rate = estaGuardando ? 1.8 : 8.0;
        setProgresoSincronizacion((prev) => {
          if (prev >= 94) return 94;
          const target = Math.min(94, (estaGuardando ? 15 : 8) + (estaGuardando ? 79 : 86) * (1 - Math.exp(-elapsed / rate)));
          return Math.max(prev, Math.round(target));
        });
      }, 80);
    } else {
      if (mostrarBarraProgreso) {
        // Al terminar el cómputo o guardado, saltar a 100% y dar feedback de éxito antes de desvanecer
        setProgresoSincronizacion(100);
        timeoutId = setTimeout(() => {
          setMostrarBarraProgreso(false);
          setProgresoSincronizacion(0);
        }, 550);
      }
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [estaSincronizando, paramSignature]);

  const [furnitureGroup, setFurnitureGroup] = React.useState<THREE.Group | null>(null);
  const {
    exportandoGLB,
    generandoAR,
    modalARAbierto,
    setModalARAbierto,
    arData,
    exportToGLB,
    descargarGlbSegunModo,
    abrirRealidadAumentada,
  } = useGLBExport(furnitureGroup);
  const [editingInstId, setEditingInstId] = React.useState<string | null>(null);
  const [editTempName, setEditTempName] = React.useState<string>("");
  const [mousePos, setMousePos] = React.useState({ x: 0, y: 0 });
  const [rhinoAxes, setRhinoAxes] = React.useState({
    x: { x: 22, y: 0 },
    y: { x: -8, y: -12 },
    z: { x: 0, y: -22 },
  });
  const containerRef = useRef<HTMLDivElement>(null);
  const [isMobile, setIsMobile] = React.useState(false);
  const [alertaDuplicadosDescartada, setAlertaDuplicadosDescartada] = React.useState(false);
  const [mostrarDuplicadosRojos, setMostrarDuplicadosRojos] = React.useState(true);
  const [capturandoFotoBloque, setCapturandoFotoBloque] = React.useState(false);
  const [fotoBloqueExito, setFotoBloqueExito] = React.useState(false);

  const resultadoEfectivo = (objetoActivoId && instancias[objetoActivoId]?.resultado) || resultado;

  // Reiniciar estado de alerta y visualización roja cuando llegue un nuevo cómputo con duplicados
  React.useEffect(() => {
    if (resultadoEfectivo?.mallas_duplicadas_detectadas && Object.keys(resultadoEfectivo.mallas_duplicadas_detectadas).length > 0) {
      setAlertaDuplicadosDescartada(false);
      setMostrarDuplicadosRojos(true);
    }
  }, [resultadoEfectivo]);

  const mallasDuplicadasWorker = resultadoEfectivo?.mallas_duplicadas_detectadas;
  const tieneDuplicadosWorker = Boolean(
    mallasDuplicadasWorker && Object.keys(mallasDuplicadasWorker).length > 0
  );

  React.useEffect(() => {
    const checkMobile = () => {
      if (typeof window === "undefined") return;
      const ua = navigator.userAgent || navigator.vendor || (window as any).opera || "";
      const isMobileUA = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(ua);
      const isTouch =
        "ontouchstart" in window ||
        (navigator && (navigator.maxTouchPoints > 0 || (navigator as any).msMaxTouchPoints > 0)) ||
        (window.matchMedia && window.matchMedia("(pointer: coarse)").matches);
      // Es móvil/táctil si tiene pantalla táctil o UserAgent móvil, inmune a si Chrome tiene activado "Sitio para computadoras"
      setIsMobile(isMobileUA || isTouch);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // 🔄 Restaurar automáticamente sesión de diseño tras regresar de Realidad Aumentada
  useEffect(() => {
    try {
      if (typeof window === "undefined") return;
      const savedSession = sessionStorage.getItem("3bf_ar_return_session");
      if (savedSession) {
        const data = JSON.parse(savedSession);
        // Si la sesión guardada es reciente (< 2 horas)
        if (data && data.timestamp && Date.now() - data.timestamp < 7200000) {
          if (data.parametros && Object.keys(data.parametros).length > 0) {
            use3BFStore.setState((state) => ({
              parametros: { ...state.parametros, ...data.parametros },
              instancias: data.instancias && Object.keys(data.instancias).length > 0 ? data.instancias : state.instancias,
            }));
            console.log("[3dBimFab AR] Sesión de mueble restaurada automáticamente tras regresar de Realidad Aumentada.");
          }
        }
        sessionStorage.removeItem("3bf_ar_return_session");
      }
    } catch (err) {
      console.warn("No se pudo restaurar la sesión AR:", err);
    }
  }, []);

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT" ||
          target.isContentEditable)
      ) {
        return;
      }

      // ⏪ Atajo Ctrl+Z / Cmd+Z: Deshacer (Undo) / Ctrl+Shift+Z / Ctrl+Y: Rehacer (Redo)
      if ((e.ctrlKey || e.metaKey) && (e.key === "z" || e.key === "Z")) {
        e.preventDefault();
        if (e.shiftKey) {
          rehacer();
        } else {
          deshacer();
        }
        return;
      }

      if ((e.ctrlKey || e.metaKey) && (e.key === "y" || e.key === "Y")) {
        e.preventDefault();
        rehacer();
        return;
      }

      // 🔄 Atajo Shift+R: Actualizar Algoritmo / Hot-Reload GHX (Solo en modo 3D paramétrico)
      if (e.shiftKey && (e.key === "r" || e.key === "R") && !e.ctrlKey && !e.altKey && !e.metaKey) {
        e.preventDefault();
        const state = use3BFStore.getState();
        if (state.pestanaActiva !== "3d" || state.modoPickingManual.activo) {
          console.warn("[3BF Shield] Atajo Shift+R bloqueado: Modo Manual 3D activo.");
          return;
        }
        if (objetoActivoId) {
          recargarDefinicionInstancia(objetoActivoId);
        }
        return;
      }

      // 🗑️ Atajo Delete / Supr / Backspace / X: Eliminar componente seleccionado
      if (
        (e.key === "Delete" || e.key === "Del" || e.key === "Backspace" || ((e.key === "x" || e.key === "X") && modoTransformacion !== "grab")) &&
        !e.ctrlKey &&
        !e.altKey &&
        !e.metaKey
      ) {
        if (objetoActivoId && modoTransformacion !== "grab") {
          e.preventDefault();
          eliminarInstancia(objetoActivoId);
          return;
        }
      }

      // Atajo G: Iniciar / Confirmar Modo Mover (Grab)
      if ((e.key === "g" || e.key === "G") && !e.ctrlKey && !e.altKey && !e.metaKey) {
        e.preventDefault();
        if (objetoSeleccionado) {
          if (modoTransformacion === "grab") {
            confirmarGrab();
          } else {
            iniciarGrab();
          }
        }
        return;
      }

      // Atajos activos durante modo Grab
      if (modoTransformacion === "grab") {
        if (e.key === "b" || e.key === "B") {
          e.preventDefault();
          toggleSnapMode();
        } else if (e.key === "x" || e.key === "X") {
          e.preventDefault();
          setEjeBloqueado("X");
        } else if (e.key === "y" || e.key === "Y") {
          e.preventDefault();
          setEjeBloqueado("Y");
        } else if (e.key === "z" || e.key === "Z") {
          e.preventDefault();
          setEjeBloqueado("Z");
        } else if (e.key === "Escape") {
          e.preventDefault();
          cancelarGrab();
        } else if (e.key === "Enter") {
          e.preventDefault();
          confirmarGrab();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    setMostrarNPanel,
    objetoSeleccionado,
    modoTransformacion,
    iniciarGrab,
    confirmarGrab,
    cancelarGrab,
    toggleSnapMode,
    setEjeBloqueado,
    deshacer,
    rehacer,
  ]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    setMousePos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  const [isDraggingOver, setIsDraggingOver] = React.useState(false);

  const handleDropOnCanvas = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(false);

    let itemToLoad: any = null;

    try {
      const dataStr = e.dataTransfer.getData("application/json") || e.dataTransfer.getData("text/plain");
      if (dataStr) {
        itemToLoad = JSON.parse(dataStr);
      }
    } catch (err) {
      console.warn("Error en parse de Drag dataTransfer:", err);
    }

    if (!itemToLoad && typeof window !== "undefined" && (window as any).__dragged3BFItem) {
      itemToLoad = (window as any).__dragged3BFItem;
    }

    // 1. Raycast desde el puntero del mouse hacia el plano horizontal del escenario (Y = 0)
    let dropPosition: [number, number, number] = [0, 0, 0];
    if (cameraRef.current && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const mouseX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const mouseY = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(new THREE.Vector2(mouseX, mouseY), cameraRef.current);

      const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
      const intersection = new THREE.Vector3();
      if (raycaster.ray.intersectPlane(groundPlane, intersection)) {
        // Cuadricular la posición al cuadrante más cercano de la grilla (ej. distanciaCuadricula = 0.1m / 100mm o 0.05m)
        const gridStep = use3BFStore.getState().calibracion.distanciaCuadricula || 0.1;
        const snappedX = Math.round(intersection.x / gridStep) * gridStep;
        const snappedZ = Math.round(intersection.z / gridStep) * gridStep;
        dropPosition = [Number(snappedX.toFixed(3)), 0, Number(snappedZ.toFixed(3))];
      }
    } else {
      const cantExistentes = Object.keys(use3BFStore.getState().instancias).length;
      dropPosition = [cantExistentes * 0.65, 0, 0];
    }

    if (itemToLoad && itemToLoad.id) {
      await use3BFStore.getState().agregarInstanciaGHX(itemToLoad, dropPosition);
    }

    if (typeof window !== "undefined") {
      (window as any).__dragged3BFItem = null;
    }
  };

  const camaraInicial = muebleActivoGuardado?.camara || camaraEscena;

  return (
    <div 
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => use3BFStore.getState().setHoveredPiece(null)}
      onDragEnter={(e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDraggingOver(true);
      }}
      onDragOver={(e) => {
        e.preventDefault();
        e.stopPropagation();
        e.dataTransfer.dropEffect = "copy";
        if (!isDraggingOver) setIsDraggingOver(true);
      }}
      onDragLeave={(e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.currentTarget.contains(e.relatedTarget as Node)) return;
        setIsDraggingOver(false);
      }}
      onDrop={handleDropOnCanvas}
      onContextMenu={(e) => {
        e.preventDefault();
        if (modoTransformacion === "grab") {
          cancelarGrab();
        }
      }}
      onClick={() => {
        if (modoTransformacion === "grab") {
          if (use3BFStore.getState().snapPicking) return;
          if (typeof window !== "undefined" && (window as any).__lastSnapSelectTime) {
            if (Date.now() - (window as any).__lastSnapSelectTime < 400) return;
          }
          confirmarGrab();
        }
      }}
      className="w-full h-full relative rounded-xl overflow-hidden shadow-inner border border-gray-200 dark:border-cyan-900/50 glass-panel"
    >
      {(pestanaActiva === "3d" || pestanaActiva === "manual") && <NPanel />}

      {/* ⚡ Barra de Carga Superior Horizontal durante Cómputo/Sincronización (Tema Light: #0088AA / Tema Dark: #1368AA) */}
      {mostrarBarraProgreso && (() => {
        const esDark = esquemaColor === "oscuro" || tema === "obsidian";
        const colorBarraProgreso = esDark
          ? (coloresApariencia?.botonActivo || "#1368AA")
          : (coloresApariencia?.botonActivo || "#0088AA");

        return (
          <div className="absolute top-0 left-0 right-0 h-1 z-30 overflow-hidden bg-slate-200/80 dark:bg-slate-800/80 pointer-events-none">
            <div 
              className={`h-full transition-all duration-150 ease-out rounded-r-full ${
                esDark 
                  ? "shadow-sm shadow-[#1368AA]/40" 
                  : "shadow-[0_0_8px_rgba(0,136,170,0.45)]"
              }`}
              style={{ 
                backgroundColor: colorBarraProgreso,
                width: `${Math.min(100, Math.max(3, progresoSincronizacion))}%` 
              }}
            />
          </div>
        );
      })()}

      {/* Indicador visual de Zona de Suelta (Drop Zone) */}
      {isDraggingOver && (
        <div className="absolute inset-2 z-40 rounded-xl border-2 border-dashed border-cyan-400 bg-cyan-500/10 backdrop-blur-xs flex items-center justify-center pointer-events-none transition-all">
          <div className="bg-slate-950/80 text-cyan-300 font-bold text-xs px-4 py-2 rounded-full border border-cyan-500/50 shadow-xl flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
            <span>Soltar para abrir modelo en el escenario 3D</span>
          </div>
        </div>
      )}



      {hoveredPiece && (
        <div 
          style={{
            left: `${mousePos.x + 15}px`,
            top: `${mousePos.y + 15}px`,
            borderColor: parametros.color_acabado || "#0088aa"
          }}
          className="absolute border-2 bg-slate-900/90 dark:bg-[#131B2E]/95 backdrop-blur-md text-white text-xs px-3.5 py-1 rounded-full font-sans font-bold shadow-lg z-20 pointer-events-none transition-all duration-75 text-center min-w-[70px] select-none"
        >
          {hoveredPiece}
        </div>
      )}

      {/* 🔲 OVERLAY CAMERA FRAME 1:1 (ESTILO BLENDER CAMERA TO VIEW / PASSEPARTOUT) */}
      {mostrarMarcoEncuadre && (
        <div className="absolute inset-0 z-10 pointer-events-none flex items-center justify-center overflow-hidden">
          {/* El marco 1:1 cuadrado centrado con sombreado exterior estilo Blender */}
          <div 
            className="relative aspect-square max-w-[85vh] max-h-[85vh] w-[80vmin] h-[80vmin] border-2 shadow-[0_0_0_9999px_rgba(11,15,23,0.55)] flex items-center justify-center transition-all"
            style={{
              borderColor: coloresApariencia?.botonActivo || "#0891b2",
            }}
          >
            {/* Esquinas estilizadas estilo Blender Camera */}
            <div className="absolute -top-0.5 -left-0.5 w-3.5 h-3.5 border-t-2 border-l-2 border-amber-400" />
            <div className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 border-t-2 border-r-2 border-amber-400" />
            <div className="absolute -bottom-0.5 -left-0.5 w-3.5 h-3.5 border-b-2 border-l-2 border-amber-400" />
            <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 border-b-2 border-r-2 border-amber-400" />

            {/* Badge indicador discreto */}
            <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-slate-950/80 text-amber-400 border border-amber-500/30 text-[9px] font-mono tracking-wider font-bold uppercase backdrop-blur-xs shadow-xs">
              1:1 Camera Frame
            </div>
          </div>
        </div>
      )}

      {/* 📱 OVERLAY SIMULADOR DE CELULAR (SAFE FRAME VERTICAL 9:16 / HORIZONTAL 16:9) */}
      {simuladorMovilActivo && (() => {
        const esHorizontal = simuladorMovilOrientacion === "horizontal";
        return (
          <div className="absolute inset-0 z-10 pointer-events-none flex items-center justify-center overflow-hidden pb-[180px]">
            {/* Marco del celular con sombreado Passepartout exterior y esquinas seguras */}
            <div 
              className={`relative border-2 rounded-3xl shadow-[0_0_0_9999px_rgba(11,15,23,0.65)] flex items-center justify-center transition-all duration-300 ease-out ${
                esHorizontal
                  ? "aspect-[16/9] max-w-[78vw] w-[74vw] max-h-[58vh] h-auto"
                  : "aspect-[9/16] max-h-[64vh] h-[60vh] w-auto"
              }`}
              style={{
                borderColor: coloresApariencia?.botonActivo || "#1368AA",
              }}
            >
              {/* Altavoz superior/lateral de smartphone simulado */}
              {esHorizontal ? (
                <div className="absolute left-2 top-1/2 -translate-y-1/2 w-1 h-12 bg-slate-400/40 rounded-full" />
              ) : (
                <div className="absolute top-2 left-1/2 -translate-x-1/2 w-12 h-1 bg-slate-400/40 rounded-full" />
              )}

              {/* Esquinas de encuadre seguras (Safe Frame Guides) */}
              <div className="absolute top-4 left-4 w-4 h-4 border-t-2 border-l-2 border-cyan-400/80 rounded-tl-sm" />
              <div className="absolute top-4 right-4 w-4 h-4 border-t-2 border-r-2 border-cyan-400/80 rounded-tr-sm" />
              <div className="absolute bottom-4 left-4 w-4 h-4 border-b-2 border-l-2 border-cyan-400/80 rounded-bl-sm" />
              <div className="absolute bottom-4 right-4 w-4 h-4 border-b-2 border-r-2 border-cyan-400/80 rounded-br-sm" />

              {/* Badge indicador interactivo y botón para girar la orientación */}
              <div className="absolute top-4 left-1/2 -translate-x-1/2 flex items-center gap-1.5 pointer-events-auto">
                <button
                  type="button"
                  onClick={() => toggleSimuladorMovilOrientacion()}
                  title={esHorizontal ? "Cambiar a orientación vertical (9:16)" : "Cambiar a orientación horizontal (16:9)"}
                  className="px-3 py-1 rounded-full bg-slate-950/85 hover:bg-slate-900 text-cyan-400 hover:text-cyan-300 border border-cyan-500/40 text-[9px] font-mono tracking-wider font-bold uppercase backdrop-blur-xs shadow-md flex items-center gap-2 cursor-pointer transition-all active:scale-95"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                  <span>{esHorizontal ? "16:9 Mobile Safe View" : "9:16 Mobile Safe View"}</span>
                  <RotateCw className="w-3 h-3 text-cyan-400 ml-0.5 hover:rotate-90 transition-transform duration-200" />
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* 📦 OVERLAY MACRO DE BLOQUE ESTÁNDAR (Modo Manual 3D) */}
      {pestanaActiva === "manual" && pasoActivoManual?.tipo === "bloque_estandar" && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 pointer-events-none flex flex-col items-center max-w-lg w-[90vw] select-none">
          <div className="w-full bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-2xl border border-cyan-500/30 shadow-xl p-3 flex flex-col gap-1.5 pointer-events-auto">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <div className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 border border-cyan-500/30 text-[10px] font-bold">
                  <Boxes className="w-3 h-3 text-cyan-500 shrink-0" />
                  <span>{pasoActivoManual.bloqueEstandar?.categoriaMarca || "Universales"} • {pasoActivoManual.id}</span>
                </div>
                <h3 className="font-bold text-xs text-slate-800 dark:text-slate-100 truncate">
                  {pasoActivoManual.titulo}
                </h3>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  title="Tomar captura de miniatura 3D para este bloque estándar"
                  disabled={capturandoFotoBloque}
                  onClick={async () => {
                    if (!pasoActivoManual?.bloqueEstandar) return;
                    setCapturandoFotoBloque(true);
                    try {
                      const capturarFn = (window as any).__capturarThumbnail3BF;
                      const dataUrl = capturarFn ? capturarFn() : null;
                      if (!dataUrl) {
                        alert("No se pudo capturar la vista 3D. Inténtalo de nuevo.");
                        return;
                      }

                      // Actualizar en el bloque estándar del paso activo y persistir
                      const bloqueActualizado = {
                        ...pasoActivoManual.bloqueEstandar,
                        thumbnail: dataUrl,
                        nombre: pasoActivoManual.titulo,
                        duracion: pasoActivoManual.duracionTotal,
                        descripcion: pasoActivoManual.descripcion,
                        guionEs: pasoActivoManual.guionEs,
                      };

                      // 1. Guardar en disco vía API
                      await fetch("/api/bloques", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify(bloqueActualizado),
                      });

                      // 2. Actualizar estado en store y recargar biblioteca
                      use3BFStore.getState().actualizarPasoManual(pasoActivoManual.id, {
                        bloqueEstandar: bloqueActualizado,
                      });
                      use3BFStore.getState().cargarBloquesEstandar();

                      setFotoBloqueExito(true);
                      setTimeout(() => setFotoBloqueExito(false), 2500);
                    } catch (err) {
                      console.error("Error guardando thumbnail de bloque:", err);
                    } finally {
                      setCapturandoFotoBloque(false);
                    }
                  }}
                  style={{
                    backgroundColor: fotoBloqueExito ? "#10b981" : (coloresApariencia?.botonActivo || "#0891b2"),
                  }}
                  className="w-7 h-7 rounded-full text-white flex items-center justify-center shadow-md hover:scale-105 active:scale-95 transition disabled:opacity-50 cursor-pointer"
                >
                  {capturandoFotoBloque ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : fotoBloqueExito ? (
                    <Check className="w-3.5 h-3.5" />
                  ) : (
                    <Camera className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            </div>

            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">
              {pasoActivoManual.descripcion || pasoActivoManual.bloqueEstandar?.descripcion}
            </p>

            {/* Guion de Locución Actual */}
            {pasoActivoManual.guionEs && (
              <div className="w-full px-2.5 py-1 rounded-xl bg-cyan-50/80 dark:bg-cyan-950/40 border border-cyan-500/20 text-[10.5px] text-cyan-900 dark:text-cyan-200 italic">
                “{pasoActivoManual.guionEs}”
              </div>
            )}
          </div>
        </div>
      )}

      {/* 🧭 HUD SUPERIOR IZQUIERDO: JERARQUÍA BOTONES + (N) COMPONENTES + LISTA DE PIEZAS (Visor 3D y Manual 3D) */}
      {(pestanaActiva === "3d" || pestanaActiva === "manual") && (
        <div className="absolute top-3.5 left-4 z-20 flex flex-col items-start gap-1 select-none pointer-events-auto">
          {/* Nivel 1: Barra de Acciones Superior (Guardar + Perforar + Actualizar GHX + Luces + Marco 1:1 + Simulador Móvil) */}
          <div className="flex items-center gap-1.5 flex-nowrap">
          {/* Botón Guardar (Guardar nuevo o Guardar Cambios en caliente / Guardar .3bm en modo manual sin preguntas) */}
          <button
            onClick={async () => {
              if (pestanaActiva === "manual") {
                // 💾 Modo Manual: Guardar .3bm directamente sin preguntas en cualquier momento
                await guardarManualProyecto();
                if (muebleActivoGuardado) {
                  await guardarCambiosMueble();
                }
                setGuardadoManualReciente(true);
                setTimeout(() => setGuardadoManualReciente(false), 2500);
              } else {
                if (muebleActivoGuardado) {
                  await guardarCambiosMueble();
                } else {
                  setMostrarNPanel(true);
                  setPestanaNPanel("muebles");
                  setModalGuardarComoAbierto(true);
                }
              }
            }}
            disabled={pestanaActiva === "manual" ? guardandoManual : guardandoMueble}
            title={
              pestanaActiva === "manual"
                ? "Guardar proyecto de manual 3D (.3bm) en cualquier momento sin preguntas"
                : muebleActivoGuardado
                ? `Guardar cambios en "${muebleActivoGuardado.nombre}"`
                : "Guardar nuevo mueble en el catálogo"
            }
            style={{
              backgroundColor: coloresApariencia?.botonActivo || "#0891b2",
              borderColor: coloresApariencia?.colorMarca || "#0891b2",
            }}
            className="px-3.5 lg:px-3 h-8 lg:h-7 rounded-full text-white shadow-md border flex items-center gap-1.5 text-xs lg:text-xs font-bold leading-none hover:opacity-90 active:scale-95 transition-all cursor-pointer disabled:opacity-50 box-border"
          >
            {pestanaActiva === "manual" ? (
              guardandoManual ? (
                <>
                  <Loader2 className="w-3.5 lg:w-3.5 h-3.5 lg:h-3.5 text-white animate-spin" />
                  <span>Guardando...</span>
                </>
              ) : guardadoManualReciente ? (
                <>
                  <Check className="w-3.5 lg:w-3.5 h-3.5 lg:h-3.5 text-white" />
                  <span>¡Guardado!</span>
                </>
              ) : (
                <>
                  <Save className="w-3.5 lg:w-3.5 h-3.5 lg:h-3.5 text-white" />
                  <span>Guardar Manual</span>
                </>
              )
            ) : guardandoMueble ? (
              <>
                <Loader2 className="w-3.5 lg:w-3.5 h-3.5 lg:h-3.5 text-white animate-spin" />
                <span>Guardando...</span>
              </>
            ) : guardadoMuebleReciente ? (
              <>
                <Check className="w-3.5 lg:w-3.5 h-3.5 lg:h-3.5 text-white" />
                <span>¡Guardado!</span>
              </>
            ) : (
              <>
                <Save className="w-3.5 lg:w-3.5 h-3.5 lg:h-3.5 text-white" />
                <span>Guardar</span>
              </>
            )}
          </button>

          {/* En Modo 3D: Botón Perforar Mueble */}
          {pestanaActiva !== "manual" && (
            <button
              onClick={async () => {
                await perforarMueble();
              }}
              disabled={mecanizadoEnProgreso}
              title="Detectar contacto entre piezas y transferir perforaciones al DXF"
              style={{
                backgroundColor: coloresApariencia?.botonActivo || "#0891b2",
                borderColor: coloresApariencia?.colorMarca || "#0891b2",
              }}
              className="px-3.5 lg:px-3 h-8 lg:h-7 rounded-full text-white shadow-md border flex items-center gap-1.5 text-xs lg:text-xs font-bold leading-none hover:opacity-90 active:scale-95 transition-all cursor-pointer disabled:opacity-50 box-border"
            >
              <span>
                {mecanizadoEnProgreso 
                  ? "Perforando..." 
                  : (Object.keys(mecanizadosCruzados || {}).length > 0 
                      ? `Perforado (${Object.values(mecanizadosCruzados).flat().length})` 
                      : "Perforar")}
              </span>
            </button>
          )}

          {/* 🔄 Botón Circular Actualizar GHX (Visible SIEMPRE en Visor 3D y en Manual 3D) */}
          <button
            onClick={async () => {
              setRecargandoGHX(true);
              try {
                await forzarRecargaDesdeGHX();
              } catch (e) {
                console.error("Error al actualizar GHX:", e);
              } finally {
                setRecargandoGHX(false);
              }
            }}
            disabled={recargandoGHX}
            title="Actualizar y recalcular geometría fresca desde el archivo Grasshopper (.ghx) en disco"
            style={{
              backgroundColor: coloresApariencia?.botonActivo || "#0891b2",
              borderColor: coloresApariencia?.colorMarca || "#0891b2",
            }}
            className="w-8 lg:w-7 h-8 lg:h-7 rounded-full text-white shadow-md border flex items-center justify-center hover:opacity-90 active:scale-95 transition-all cursor-pointer disabled:opacity-50 box-border shrink-0"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${recargandoGHX ? "animate-spin" : ""}`} />
          </button>

          {/* Botón Limpiar Perforaciones */}
          {Object.keys(mecanizadosCruzados || {}).length > 0 && (
            <button
              onClick={limpiarPerforaciones}
              title="Eliminar perforaciones transferidas"
              style={{
                backgroundColor: coloresApariencia?.fondoPaneles || "#FFFFFF",
                borderColor: coloresApariencia?.bordePaneles || "#CBD5E1",
              }}
              className="w-8 lg:w-7 h-8 lg:h-7 rounded-full shadow-md border flex items-center justify-center text-red-500 hover:bg-red-50 hover:border-red-400 active:scale-95 transition-all cursor-pointer box-border shrink-0"
            >
              <Trash2 className="w-3.5 lg:w-3.5 h-3.5 lg:h-3.5" />
            </button>
          )}



          {/* 💡 Botón Toggle de Luces de Estudio 3D (Circular, fondo cian, ícono blanco) */}
          <button
            onClick={() => toggleGizmosLuces()}
            title={calibracion.mostrarGizmosLuces ? "Ocultar gizmos 3D de luces" : "Ver lámparas y luces en el escenario 3D (Estilo Unreal)"}
            style={{
              backgroundColor: coloresApariencia?.botonActivo || "#0891b2",
              borderColor: coloresApariencia?.colorMarca || "#0891b2",
            }}
            className="w-8 lg:w-7 h-8 lg:h-7 rounded-full text-white shadow-md border flex items-center justify-center hover:opacity-90 active:scale-95 transition-all cursor-pointer box-border shrink-0"
          >
            <Sun 
              strokeWidth={2}
              className={`w-4 lg:w-4 h-4 lg:h-4 text-white shrink-0 ${calibracion.mostrarGizmosLuces ? "opacity-100" : "opacity-90"}`} 
            />
          </button>

          {/* 🔲 Botón Toggle de Marco de Encuadre 1:1 (Camera to View - Estilo Blender) */}
          <button
            onClick={() => toggleMarcoEncuadre()}
            title={mostrarMarcoEncuadre ? "Ocultar marco de encuadre 1:1" : "Activar marco de encuadre 1:1 para render (Estilo Blender Camera to View)"}
            style={{
              backgroundColor: coloresApariencia?.botonActivo || "#0891b2",
              borderColor: coloresApariencia?.colorMarca || "#0891b2",
            }}
            className="w-8 lg:w-7 h-8 lg:h-7 rounded-full text-white shadow-md border flex items-center justify-center hover:opacity-90 active:scale-95 transition-all cursor-pointer box-border shrink-0"
          >
            <Square 
              strokeWidth={1.65}
              className={`w-3.5 lg:w-3.5 h-3.5 lg:h-3.5 text-white shrink-0 ${mostrarMarcoEncuadre ? "opacity-100 fill-white/20" : "opacity-90"}`} 
            />
          </button>

          {/* 📱 Botón Toggle de Simulador Móvil (Safe Frame Celular) */}
          <button
            onClick={() => toggleSimuladorMovil()}
            title={simuladorMovilActivo ? "Ocultar simulador de celular" : "Activar simulador de celular (Safe Frame móvil)"}
            style={{
              backgroundColor: coloresApariencia?.botonActivo || "#1368AA",
              borderColor: coloresApariencia?.colorMarca || "#1368AA",
            }}
            className="w-8 lg:w-7 h-8 lg:h-7 rounded-full text-white shadow-md border flex items-center justify-center hover:opacity-90 active:scale-95 transition-all cursor-pointer box-border shrink-0"
          >
            <Smartphone 
              strokeWidth={1.75}
              className={`w-3.5 lg:w-3.5 h-3.5 lg:h-3.5 text-white shrink-0 transition-transform duration-300 ${simuladorMovilOrientacion === "horizontal" ? "-rotate-90" : "rotate-0"} ${simuladorMovilActivo ? "opacity-100 fill-white/25" : "opacity-90"}`} 
            />
          </button>

          {/* 🔄 Botón Girar Orientación del Celular (Vertical 9:16 / Horizontal 16:9) */}
          {simuladorMovilActivo && (
            <button
              onClick={() => toggleSimuladorMovilOrientacion()}
              title={simuladorMovilOrientacion === "vertical" ? "Girar a pantalla horizontal (16:9)" : "Girar a pantalla vertical (9:16)"}
              style={{
                backgroundColor: coloresApariencia?.botonActivo || "#1368AA",
                borderColor: coloresApariencia?.colorMarca || "#1368AA",
              }}
              className="w-8 lg:w-7 h-8 lg:h-7 rounded-full text-white shadow-md border flex items-center justify-center hover:opacity-90 active:scale-95 transition-all cursor-pointer box-border shrink-0"
            >
              <RotateCw 
                strokeWidth={1.85}
                className="w-3.5 lg:w-3.5 h-3.5 lg:h-3.5 text-white shrink-0 hover:rotate-90 transition-transform duration-200" 
              />
            </button>
          )}
        </div>

        {/* Nivel 2: Contador de Componentes (N) y Listado Jerárquico */}
        <div className="flex flex-col items-start gap-0.5">
          {(() => {
            const lista = Object.values(instancias || {});
            
            // Determinar si hay componentes reales en el escenario
            let itemsAMostrar: { id: string; nombre: string; isActivo: boolean; isLegacy?: boolean }[] = [];

            if (lista.length > 0) {
              itemsAMostrar = lista.map((inst, idx) => ({
                id: inst.id,
                nombre: inst.nombreVisible || inst.definitionId || `Componente ${idx + 1}`,
                isActivo: objetoActivoId === inst.id,
              }));
            } else if (!escenarioLimpio && ((resultado?.real_meshes && resultado.real_meshes.length > 0) || (resultado?.despiece && resultado.despiece.length > 0))) {
              const nombreBase = parametros.model_id || (parametros as any).custom_filename?.replace(/\.ghx$/i, "") || "Cubierta";
              itemsAMostrar = [{
                id: "base_model",
                nombre: nombreBase,
                isActivo: true,
                isLegacy: true,
              }];
            }

            const total = itemsAMostrar.length;

            return (
              <>
                <span 
                  style={{ 
                    color: coloresApariencia?.textoSecundario || (tema === "obsidian" ? "#94A3B8" : "#64748B"),
                  }}
                  className="text-[11px] font-mono font-semibold opacity-85"
                >
                  ({total}) {total === 1 ? "Componente" : "Componentes"}:
                </span>

                {/* Lista de Nombres de Componentes */}
                <div className="flex flex-col items-start gap-0.5 pl-1 max-h-[35vh] overflow-y-auto custom-scrollbar">
                  {total > 0 ? (
                    itemsAMostrar.map((comp) => {
                      const isEditing = editingInstId === comp.id;

                      if (isEditing) {
                        return (
                          <div key={comp.id} className="flex items-center gap-1 text-[11px] font-mono pl-0.5 my-0.5">
                            <span className="opacity-60 text-[9px]">•</span>
                            <input
                              autoFocus
                              type="text"
                              value={editTempName}
                              onChange={(e) => setEditTempName(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  if (editTempName.trim()) {
                                    renombrarInstancia(comp.id, editTempName.trim());
                                  }
                                  setEditingInstId(null);
                                } else if (e.key === "Escape") {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  setEditingInstId(null);
                                }
                              }}
                              onBlur={() => {
                                if (editTempName.trim()) {
                                  renombrarInstancia(comp.id, editTempName.trim());
                                }
                                setEditingInstId(null);
                              }}
                              style={{
                                backgroundColor: coloresApariencia?.fondoAplicacion || "#FFFFFF",
                                borderColor: coloresApariencia?.botonActivo || "#0891b2",
                                color: coloresApariencia?.textoPrincipal || "#0F172A",
                              }}
                              className="px-1.5 py-0.5 text-[11px] font-mono border rounded outline-none w-32 shadow-xs"
                            />
                          </div>
                        );
                      }

                      return (
                        <div key={comp.id} className="flex items-center gap-1.5 group/item w-full">
                          <button
                            onClick={() => {
                              if (!comp.isLegacy) {
                                seleccionarInstancia(comp.id);
                              }
                            }}
                            onDoubleClick={(e) => {
                              e.stopPropagation();
                              setEditingInstId(comp.id);
                              setEditTempName(comp.nombre);
                            }}
                            title={comp.isLegacy ? `${comp.nombre} (Doble clic para renombrar)` : `Doble clic para renombrar: ${comp.nombre}`}
                            style={{
                              color: coloresApariencia?.textoSecundario || (tema === "obsidian" ? "#94A3B8" : "#64748B")
                            }}
                            className={`flex items-center gap-1 text-[11px] font-mono transition-colors hover:text-cyan-500 cursor-pointer text-left select-none truncate ${
                              comp.isActivo ? "font-bold opacity-90" : "font-medium opacity-75 hover:opacity-100"
                            }`}
                          >
                            <span className="opacity-60 text-[9px]">•</span>
                            <span className="truncate max-w-[170px]">{comp.nombre}</span>
                          </button>

                          {!comp.isLegacy && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                eliminarInstancia(comp.id);
                              }}
                              title={`Eliminar ${comp.nombre} (Supr / Delete)`}
                              className="opacity-0 group-hover/item:opacity-100 p-0.5 hover:text-red-500 transition-opacity cursor-pointer shrink-0 text-slate-400"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      );
                    })
                  ) : (
                    <span 
                      style={{
                        color: coloresApariencia?.textoSecundario || (tema === "obsidian" ? "#64748B" : "#94A3B8")
                      }}
                      className="text-[10px] italic opacity-60 pl-1"
                    >
                      (Escenario vacío)
                    </span>
                  )}
                </div>
              </>
            );
          })()}
          </div>
        </div>
      )}

      {/* 🛡️ Alerta DfMA Shield: Detección, Resaltado en Rojo y Purga de Mallas Duplicadas en GHX */}
      <DfMAShieldAlert
        alertaDuplicadosDescartada={alertaDuplicadosDescartada}
        setAlertaDuplicadosDescartada={setAlertaDuplicadosDescartada}
        mostrarDuplicadosRojos={mostrarDuplicadosRojos}
        setMostrarDuplicadosRojos={setMostrarDuplicadosRojos}
      />

      <Canvas
        camera={{
          position: (camaraInicial && Array.isArray(camaraInicial.position)) ? camaraInicial.position : [0.9, 1.1, 1.4],
          fov: camaraInicial?.fov || 45,
          near: 0.005,
          far: 100,
        }}
        shadows
        gl={{ preserveDrawingBuffer: true, antialias: true }}
        onPointerMissed={() => {
          use3BFStore.getState().setHoveredPiece(null);
          if (typeof window !== "undefined") {
            (window as any).__hoveredInstanceId = null;
          }
        }}
      >
        <color attach="background" args={[coloresApariencia.fondo3D || (tema === "obsidian" ? "#0D1117" : "#F3F4F6")]} />
        <CameraRefBridge cameraRef={cameraRef} />
        <ThumbnailCapturer />
        <SceneEnvironment modoVisual={modoVisual} />
        <HoverRaycastTracker furnitureGroup={furnitureGroup} />
        {/* 💡 Sistema Dinámico de Iluminación y Gizmos 3D Interactivos (Estilo Unreal) */}
        <StudioLightGizmos />
        
        {!escenarioLimpio && (
          <>
            {pestanaActiva === "manual" && pasoActivoManual?.tipo === "bloque_estandar" ? (
              <BloqueEstandar3DScene
                paso={pasoActivoManual}
                timelineTime={timelineCurrentTime}
              />
            ) : (Object.keys(instancias || {}).length > 0 || resultado || muebleActivoGuardado) ? (
              <>
                <ParametricFurnitureMesh 
                  setFurnitureGroup={setFurnitureGroup} 
                  mostrarDuplicadosRojos={mostrarDuplicadosRojos} 
                />
                <SnapPointMarkers furnitureGroup={furnitureGroup} />
                <GuidelineAxes />
                <TransformSnappingController />
                <SelectionController />
                <BoardSilhouetteOutline furnitureGroup={furnitureGroup} />
                <AssemblyAnimationController furnitureGroup={furnitureGroup} />
                <AssemblyPiecePositioner furnitureGroup={furnitureGroup} />
                <SubbloquesTooltipsBillboard furnitureGroup={furnitureGroup} />
              </>
            ) : null}
          </>
        )}

        {calibracion.mostrarGrilla && (
          <Grid
            renderOrder={-10}
            position={[0, -0.001, 0]}
            args={[
              Math.max(0.1, (calibracion.numeroLineasRejilla || 500) * (calibracion.distanciaCuadricula || 0.01) * 2),
              Math.max(0.1, (calibracion.numeroLineasRejilla || 500) * (calibracion.distanciaCuadricula || 0.01) * 2),
            ]}
            cellSize={calibracion.distanciaCuadricula || 0.01}
            cellThickness={calibracion.grosorGrillaDelgada || 1.0}
            cellColor={coloresApariencia.rejillaSecundaria || calibracion.colorGrillaDelgada || "#CBD5E1"}
            sectionSize={calibracion.distanciaSeccion || 0.1}
            sectionThickness={calibracion.grosorGrillaGruesa || 1.5}
            sectionColor={coloresApariencia.rejillaPrincipal || calibracion.colorGrillaGruesa || "#94A3B8"}
            fadeDistance={Math.max(35, (calibracion.numeroLineasRejilla || 500) * (calibracion.distanciaCuadricula || 0.01) * 2)}
            fadeStrength={1.5}
          />
        )}
        <GroundInfiniteAxes />
        <CameraViewController furnitureGroup={furnitureGroup} controlsRef={controlsRef} />
        <CameraPersistenceController controlsRef={controlsRef} />
        <AutoFramingCameraController controlsRef={controlsRef} />
        <ManualCameraDirector controlsRef={controlsRef} />
        <BlenderNavigationController controlsRef={controlsRef} />
        <OrbitControls 
          ref={controlsRef}
          makeDefault 
          enabled={modoTransformacion !== "grab" && !piezaEnPosicionamientoManual} 
          target={
            pasoActivoManual?.tipo === "bloque_estandar" 
              ? [0, 0.1, 0] 
              : (camaraInicial && Array.isArray(camaraInicial.target)) 
                ? camaraInicial.target 
                : [0, 0.4, 0]
          } 
          minDistance={calibracion.zoomMinimoMetros ?? 0.02} 
          maxDistance={calibracion.zoomMaximoMetros ?? 30} 
          enableDamping
          dampingFactor={0.05}
          screenSpacePanning={true}
          mouseButtons={{
            LEFT: undefined,
            MIDDLE: THREE.MOUSE.ROTATE,
            RIGHT: undefined,
          }}
        />
        <RhinoAxisTracker onUpdate={setRhinoAxes} />
      </Canvas>

      {/* 🧭 Esquina Inferior Izquierda: Alineado verticalmente a la izquierda con el botón Guardar (left-4) */}
      <div className="absolute bottom-3 left-4 z-10 select-none flex flex-col items-start gap-1 pointer-events-none">
        {calibracion.mostrarIconoPlanoUniversal !== false && (
          <div className="flex items-center justify-center p-0.5">
            <svg width="68" height="68" viewBox="0 0 68 68" className="overflow-visible">
              <line
                x1="34"
                y1="34"
                x2={34 + rhinoAxes.x.x}
                y2={34 + rhinoAxes.x.y}
                stroke={coloresApariencia.iconoPlanoUniversalX || coloresApariencia.ejeX || (tema === "obsidian" ? "#06B6D4" : "#0891B2")}
                strokeWidth="1.6"
                strokeLinecap="round"
              />
              <text
                x={34 + rhinoAxes.x.x * 1.3}
                y={34 + rhinoAxes.x.y * 1.3 + 4}
                fill={coloresApariencia.iconoPlanoUniversalX || coloresApariencia.ejeX || (tema === "obsidian" ? "#06B6D4" : "#0891B2")}
                fontSize="11"
                fontFamily="Inter, -apple-system, sans-serif"
                fontWeight="700"
                textAnchor="middle"
              >
                x
              </text>
              <line
                x1="34"
                y1="34"
                x2={34 + rhinoAxes.y.x}
                y2={34 + rhinoAxes.y.y}
                stroke={coloresApariencia.iconoPlanoUniversalY || coloresApariencia.ejeY || (tema === "obsidian" ? "#F87171" : "#B91C1C")}
                strokeWidth="1.6"
                strokeLinecap="round"
              />
              <text
                x={34 + rhinoAxes.y.x * 1.3}
                y={34 + rhinoAxes.y.y * 1.3 + 4}
                fill={coloresApariencia.iconoPlanoUniversalY || coloresApariencia.ejeY || (tema === "obsidian" ? "#F87171" : "#B91C1C")}
                fontSize="11"
                fontFamily="Inter, -apple-system, sans-serif"
                fontWeight="700"
                textAnchor="middle"
              >
                y
              </text>
              <line
                x1="34"
                y1="34"
                x2={34 + rhinoAxes.z.x}
                y2={34 + rhinoAxes.z.y}
                stroke={coloresApariencia.iconoPlanoUniversalZ || coloresApariencia.ejeZ || (tema === "obsidian" ? "#94A3B8" : "#334155")}
                strokeWidth="1.6"
                strokeLinecap="round"
              />
              <text
                x={34 + rhinoAxes.z.x * 1.3}
                y={34 + rhinoAxes.z.y * 1.3 + 4}
                fill={coloresApariencia.iconoPlanoUniversalZ || coloresApariencia.ejeZ || (tema === "obsidian" ? "#94A3B8" : "#334155")}
                fontSize="11"
                fontFamily="Inter, -apple-system, sans-serif"
                fontWeight="700"
                textAnchor="middle"
              >
                z
              </text>
            </svg>
          </div>
        )}

        {/* ⚡ Barra de Carga & Testigo de Sincronización Proporcional (Tema Light: #0088AA / Tema Dark: #1368AA) */}
        {mostrarBarraProgreso && (() => {
          const esDark = esquemaColor === "oscuro" || tema === "obsidian";
          const colorPrimario = esDark
            ? (coloresApariencia?.botonActivo || "#1368AA")
            : (coloresApariencia?.botonActivo || "#0088AA");

          return (
            <div 
              style={{
                borderColor: esDark ? "rgba(19, 104, 170, 0.4)" : "rgba(0, 136, 170, 0.35)",
              }}
              className="flex flex-col gap-1 pointer-events-auto mb-1 bg-white/95 dark:bg-[#131B2E]/95 backdrop-blur-md p-1.5 px-3.5 rounded-full border shadow-md min-w-[200px] max-w-[240px] transition-all"
            >
              <div className="flex items-center justify-between gap-1.5 text-[9.5px] md:text-[10px] font-bold tracking-wide">
                <div className="flex items-center gap-1.5 text-slate-800 dark:text-slate-200">
                  {progresoSincronizacion === 100 ? (
                    <Check style={{ color: colorPrimario }} className="w-3.5 h-3.5 shrink-0" />
                  ) : (
                    <Loader2 style={{ color: colorPrimario }} className="w-3 h-3 animate-spin shrink-0" />
                  )}
                  <span className="truncate">
                    {estaGuardando
                      ? progresoSincronizacion === 100
                        ? "¡Archivo guardado!"
                        : "Guardando en Drive..."
                      : progresoSincronizacion === 100
                      ? "¡Completado!"
                      : progresoSincronizacion < 25
                      ? "Enviando datos..."
                      : progresoSincronizacion < 80
                      ? "Diseñando..."
                      : "Procesando mallas..."}
                  </span>
                </div>
                <span style={{ color: colorPrimario }} className="text-[10px] font-mono font-bold shrink-0">
                  {Math.round(progresoSincronizacion)}%
                </span>
              </div>
              {/* Pista gris con barra proporcional en cápsula rounded-full */}
              <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-700/80 rounded-full overflow-hidden relative">
                <div 
                  className="h-full rounded-full transition-all duration-150 ease-out"
                  style={{ 
                    backgroundColor: colorPrimario,
                    width: `${Math.min(100, Math.max(4, progresoSincronizacion))}%` 
                  }}
                />
              </div>
            </div>
          );
        })()}

        {/* Texto limpio del testigo alineado a la izquierda con el botón Guardar */}
        <div className="flex items-center gap-1 md:gap-1.5 text-[9px] md:text-[11px] font-semibold tracking-wide pointer-events-auto">
          <span style={{ color: coloresApariencia?.textoSecundario || (tema === "obsidian" ? "#94a3b8" : "#64748b") }}>
            vBeta 0.1
          </span>
          {workerStatus === "online" ? (
            <span style={{ color: coloresApariencia?.estadoActivo || "#10B981" }} className="flex items-center gap-1 font-bold">
              <CheckCircle2 className="w-2.5 md:w-3 h-2.5 md:h-3 text-emerald-500" /> Online
            </span>
          ) : (
            <span className="text-amber-600 dark:text-amber-400 flex items-center gap-1 font-bold">
              <AlertCircle className="w-2.5 md:w-3 h-2.5 md:h-3 text-amber-500" /> API Fallback
            </span>
          )}
        </div>
      </div>

      {/* 📱 Esquina Inferior Derecha: Botones de Acción (AR en móviles, AR + Descargar GLB en desktop) (Visor 3D y Manual 3D) */}
      {(pestanaActiva === "3d" || pestanaActiva === "manual") && (
        <div className="absolute bottom-3 right-3 z-20 flex flex-col items-end gap-2 md:gap-2.5 pointer-events-auto">
          {/* 📱 Botón Circular de Realidad Aumentada (Homologado con altura de Chevron / 28px en PC, 32px en Móvil) */}
          <button
            onClick={abrirRealidadAumentada}
            disabled={generandoAR || exportandoGLB}
            style={{
              backgroundColor: coloresApariencia?.botonActivo || "#0891b2",
              borderColor: coloresApariencia?.colorMarca || "#0891b2",
            }}
            className="w-8 lg:w-7 h-8 lg:h-7 rounded-full text-white shadow-md border flex items-center justify-center hover:opacity-90 active:scale-95 transition-all cursor-pointer disabled:opacity-50 box-border shrink-0"
            title="Experiencia AR (Realidad Aumentada 1:1)"
            aria-label="Experiencia AR"
          >
            {generandoAR ? (
              <Loader2 className="w-3.5 lg:w-3.5 h-3.5 lg:h-3.5 text-white animate-spin" />
            ) : (
              <ViewInArIcon className="w-4 lg:w-4 h-4 lg:h-4 text-white" />
            )}
          </button>

          {/* 📥 Botón Descargar GLB (ESTRICTAMENTE OCULTO EN MÓVILES, solo visible en computadoras de escritorio) */}
          {!isMobile && (
            <button
              onClick={descargarGlbSegunModo}
              disabled={exportandoGLB || generandoAR}
              style={{
                backgroundColor: coloresApariencia?.botonActivo || "#0891b2",
                borderColor: coloresApariencia?.colorMarca || "#0891b2",
              }}
              className="hidden lg:flex px-3 h-7 rounded-full text-white shadow-md border items-center gap-1.5 text-xs font-bold leading-none hover:opacity-90 active:scale-95 transition-all cursor-pointer disabled:opacity-50 box-border"
              title={
                pestanaActiva === "manual"
                  ? "Descargar paso animado del manual en GLB con compresión Draco (< 1 MB)"
                  : "Descargar archivo 3D GLB con compresión Draco (~2.1 MB)"
              }
            >
              {exportandoGLB ? (
                <>
                  <Loader2 className="w-3 h-3 text-white animate-spin" /> Descargando...
                </>
              ) : (
                <>
                  <Download className="w-3 h-3 text-white" /> Descargar GLB
                </>
              )}
            </button>
          )}
        </div>
      )}

      {/* 📱 Modal de Realidad Aumentada con Código QR */}
      <ARViewerModal
        isOpen={modalARAbierto}
        onClose={() => setModalARAbierto(false)}
        arId={arData.id}
        modelName={parametros.model_id || "Cómoda Ravenna"}
        sizeBefore={arData.sizeBefore}
        sizeAfter={arData.sizeAfter}
        onDownloadCompressed={() => exportToGLB(true)}
      />

      {/* 💡 Inspector Flotante de Lámparas 3D (Estilo Unreal Engine) */}
      <LightInspectorModal />

      {/* ⚡ Observador Automático de Archivos GHX en Caliente (Auto Hot-Reload) */}
      <GHXAutoWatcher />

      {/* 🎬 Barra Flotante de Reproducción para Modo Manual (Normal) */}
      {pestanaActiva === "manual" && !simuladorMovilActivo && <TimelineScrubber />}

      {/* 🎞️ Consola Timeline y Dope Sheet Profesional estilo Blender para Modo Simulador Móvil / Director */}
      {pestanaActiva === "manual" && simuladorMovilActivo && <BlenderTimeline />}




      {/* 📱 Overlay de Preparación para Realidad Aumentada */}
      {generandoAR && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-950/75 backdrop-blur-sm text-white select-none animate-in fade-in duration-200">
          <div className="w-12 h-12 border-3 border-[#1368AA] border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-sm font-bold tracking-wide text-white">Preparando Realidad Aumentada...</p>
          <p className="text-xs text-slate-300 mt-1">Optimizando geometría para tu dispositivo móvil</p>
        </div>
      )}
    </div>
  );
}
