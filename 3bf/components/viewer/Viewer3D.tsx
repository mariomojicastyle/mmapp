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
import { Download, Save, Zap, Trash2, CheckCircle2, AlertCircle, AlertTriangle, X, Loader2, Sun, Lamp, Sparkles, Smartphone, Square, Eye, EyeOff, Pipette, Check, Boxes, RefreshCw, Camera } from "lucide-react";
import NPanel from "./NPanel";
import { GHXAutoWatcher } from "./GHXAutoWatcher";
import SceneEnvironment from "./SceneEnvironment";
import StudioLightGizmos from "./StudioLightGizmos";
import LightInspectorModal from "./LightInspectorModal";
import ARViewerModal from "./ARViewerModal";
import ViewInArIcon from "@/components/icons/ViewInArIcon";
import { saveLocalARModel } from "@/lib/arStorage";
import TimelineScrubber from "@/components/manual/TimelineScrubber";
import { AssemblyPiecePositioner } from "./AssemblyPiecePositioner";
import { compilarAnimacionPaso, KinematicEngineResult } from "@/lib/manualAnimationEngine";
import { getSafeRestPosition, getSafeRestQuaternion } from "@/lib/engine/cadStateUtils";
import { extraerPiezaMadre, anotarInstanciasFisicas } from "@/lib/piezaMadreUtils";
import { exportarGlbPasoManual, descargarBufferComoArchivo } from "@/lib/exportManualGlb";
import BloqueEstandar3DScene from "./BloqueEstandar3DScene";
import SubbloquesTooltipsBillboard from "./SubbloquesTooltipsBillboard";
import BoardMesh, { useMaterialPBRMaps } from "./BoardMesh";
import SingleFurnitureInstanceMesh from "./SingleFurnitureInstanceMesh";
import { SnapPointMarkers, GuidelineAxes, TransformSnappingController, getFurnitureGroupBoardBox } from "./SnapSystemOverlay";
import { BlenderNavigationController, CameraRefBridge, ThumbnailCapturer, CameraViewController } from "./CameraControllers";
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
            seleccionarInstancia(null);
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
              seleccionarInstancia(null);
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
          seleccionarInstancia(null);
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
  const [recargandoGHX, setRecargandoGHX] = React.useState(false);

  const estaSincronizando = Boolean(cargando || (objetoActivoId && instancias[objetoActivoId]?.cargando));

  const [furnitureGroup, setFurnitureGroup] = React.useState<THREE.Group | null>(null);
  const [exportandoGLB, setExportandoGLB] = React.useState(false);
  const [generandoAR, setGenerandoAR] = React.useState(false);
  const [modalARAbierto, setModalARAbierto] = React.useState(false);
  const [arData, setArData] = React.useState<{
    id: string | null;
    sizeBefore?: number;
    sizeAfter?: number;
  }>({ id: null });
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

  // 1. Generador central de escena limpia y GLB optimizado (con perfil ultra-liviano para AR)
  // Por defecto, includeEdges = false para descargas limpias sin mallas de aristas duplicadas.
  // Se conserva toda la definición matemática de aristas para AR o cuando se active explícitamente.
  const generateCleanGLB = async (
    isForAR = false,
    includeEdges = false
  ): Promise<{ arrayBuffer: ArrayBuffer; piecesCount: number } | null> => {
    const instanceMap: Map<string, THREE.Group> | undefined = typeof window !== "undefined" ? (window as any).__3bfInstanceGroups : undefined;
    const targetGroups: THREE.Group[] = [];
    if (furnitureGroup) {
      targetGroups.push(furnitureGroup);
    } else if (instanceMap && instanceMap.size > 0) {
      instanceMap.forEach((grp) => targetGroups.push(grp));
    }

    if (targetGroups.length === 0) {
      alert("Espera a que el modelo esté cargado en pantalla para exportar.");
      return null;
    }

    const { GLTFExporter } = await import("three/examples/jsm/exporters/GLTFExporter.js");
    const exporter = new GLTFExporter();

    // Caché para optimizar exactamente 1 solo bitmap (256 para AR o 512 para desktop) por textura única
    const textureOptimizedCache = new Map<string, THREE.Texture>();

    const getOptimized512Texture = (srcTexture: THREE.Texture): THREE.Texture => {
      const cacheKey = (srcTexture.image as any)?.src || srcTexture.uuid || srcTexture.name || "tex";
      if (textureOptimizedCache.has(cacheKey)) {
        return textureOptimizedCache.get(cacheKey)!;
      }

      try {
        const targetSize = isForAR ? 256 : 512;
        const canvas = document.createElement("canvas");
        canvas.width = targetSize;
        canvas.height = targetSize;
        const ctx = canvas.getContext("2d");

        if (ctx && srcTexture.image) {
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = "high";
          ctx.drawImage(srcTexture.image, 0, 0, targetSize, targetSize);

          const optTexture = new THREE.CanvasTexture(canvas);
          optTexture.name = (srcTexture.name || "Texture") + "_" + targetSize;
          optTexture.wrapS = srcTexture.wrapS;
          optTexture.wrapT = srcTexture.wrapT;
          optTexture.repeat.copy(srcTexture.repeat);
          optTexture.offset.copy(srcTexture.offset);
          optTexture.rotation = srcTexture.rotation;
          optTexture.center.copy(srcTexture.center);
          optTexture.flipY = srcTexture.flipY;
          // image/jpeg es el estándar glTF 2.0 nativo de ultra compresión universal
          optTexture.userData = { mimeType: "image/jpeg" };
          optTexture.needsUpdate = true;

          textureOptimizedCache.set(cacheKey, optTexture);
          return optTexture;
        }
      } catch (err) {
        console.warn("[3dBimFab GLB] Fallback a textura directa por:", err);
      }

      return srcTexture;
    };

    // Caché de materiales compartidos para reutilizar 1 solo material por acabado
    const materialOptimizedCache = new Map<string, THREE.MeshStandardMaterial>();

    // 1. Recolectar mallas visibles elegibles de todos los grupos
    const candidateMeshes: Array<{ mesh: THREE.Mesh; groupWorldPos: THREE.Vector3 }> = [];

    targetGroups.forEach((targetGroup) => {
      targetGroup.updateWorldMatrix(true, true);
      const groupWorldPos = new THREE.Vector3();
      targetGroup.getWorldPosition(groupWorldPos);

      targetGroup.traverse((child) => {
        const mesh = child as THREE.Mesh;
        if (!mesh || !mesh.isMesh) return;
        if (!mesh.visible) return;
        const meshName = (mesh.name || "").trim();
        if (!meshName) return;

        const nLow = meshName.toLowerCase();
        if (
          nLow.includes("perforado") || 
          nLow.includes("maquinado") || 
          nLow.includes("helper") || 
          nLow.includes("plane") || 
          nLow.includes("nurbs") ||
          nLow.includes("edges") ||
          nLow.includes("outline") ||
          nLow.includes("silhouette") ||
          nLow.includes("shadow") ||
          nLow.includes("axis")
        ) {
          return;
        }

        // 🚀 En perfil AR: omitir herrajes internos ocultos (pernos, minifix, tarugos, tornillos)
        // ya que están embutidos dentro de los tableros y consumen el 70% del peso geométrico
        if (isForAR) {
          if (
            nLow.includes("perno") || 
            nLow.includes("caja") || 
            nLow.includes("minifix") || 
            nLow.includes("tarugo") || 
            nLow.includes("tornillo") ||
            nLow.includes("porca") ||
            nLow.includes("herraje")
          ) {
            return;
          }
        }

        // 🛡️ Omitir mallas duplicadas de Grasshopper marcadas para inspección visual
        if (mesh.userData?.esDuplicado) {
          return;
        }

        if (!mesh.geometry || !mesh.geometry.attributes.position || mesh.geometry.attributes.position.count === 0) {
          return;
        }

        candidateMeshes.push({ mesh, groupWorldPos });
      });
    });

    if (candidateMeshes.length === 0) {
      alert("No se encontraron mallas visibles para exportar.");
      return null;
    }

    const { mergeGeometries, mergeVertices } = await import("three/examples/jsm/utils/BufferGeometryUtils.js");

    // 2. Crear escena de exportación plana sin emparentamientos hacia (0,0,0)
    const exportScene = new THREE.Scene();
    exportScene.name = "Scene";

    const isExportSolid = modoVisual === "solido";

    // 🏷️ Funciones de clasificación y nombres
    const isHardwareMesh = (name: string, isHwData?: boolean): boolean => {
      if (isHwData) return true;
      const n = name.toLowerCase();
      return (
        n.includes("perno") ||
        n.includes("caja") ||
        n.includes("minifix") ||
        n.includes("tarugo") ||
        n.includes("cavilha") ||
        n.includes("clavilha") ||
        n.includes("tornillo") ||
        n.includes("parafuso") ||
        n.includes("porca") ||
        n.includes("tuerca") ||
        n.includes("corredera") ||
        n.includes("corredi") ||
        n.includes("cantoneira") ||
        n.includes("soporte") ||
        n.includes("pata") ||
        n.includes("pes") ||
        n.includes("pés") ||
        n.includes("bisagra") ||
        n.includes("dobradiça") ||
        n.includes("puxador") ||
        n.includes("manija")
      ) && !n.includes("cajon") && !n.includes("cajón");
    };

    const getCleanPieceBaseName = (rawName: string): string => {
      let clean = rawName
        .replace(/^RH_OUT:/i, "")
        .trim();

      // Si es un herraje (tornillo, parafuso, cavilha, etc.), conservar su nombre íntegro original de Grasshopper
      if (isHardwareMesh(clean)) {
        return clean;
      }

      // 1. Quitar prefijos de material, sustrato o capas
      clean = clean
        .replace(/^(MDP|MDF|HDF|Compensado|Aglomerado|Melamina|Tablero|Madera|Fondo|Fundo|Canto|Borde)\s+/i, "")
        .replace(/^(Color|Balance|Back|Cara|Reverso|Nucleo|Sustrato)\s+/i, "")
        .trim();

      // 2. Quitar sufijos técnicos de capas y duplicaciones de piezas
      clean = clean
        .replace(/(_Color|_MDP|_MDF|_Balance|_Back|_Cara|_Nucleo|_B|-Color|-MDP|-MDF|-Balance|-Back|-B)$/i, "")
        .replace(/(\s+Color|\s+MDP|\s+MDF|\s+Balance|\s+Back|\s+B)$/i, "")
        .trim();

      // 3. Normalizar números de 1 dígito a 2 dígitos para consistencia (ej. "Peça 1" -> "Peça 01", "PK1" -> "PK01")
      clean = clean.replace(/^(Pe[cç]a\s*)(\d)$/i, (_, prefix, num) => `${prefix}0${num}`);
      clean = clean.replace(/^(PK\s*)(\d)$/i, (_, prefix, num) => `PK${String(num).padStart(2, "0")}`);
      clean = clean.replace(/^(P\s*)(\d)$/i, (_, prefix, num) => `P${String(num).padStart(2, "0")}`);

      // 4. Fallback de seguridad si el nombre quedó vacío (ej. era solo "RH_OUT:MDP")
      if (!clean) {
        clean = parametros.model_id ? `PK01_${parametros.model_id}` : "PK01";
      }

      return clean;
    };

    // Separador de islas disjuntas en geometrías no continuas (para Linear Arrays / Mirrors de Grasshopper)
    const splitDisconnectedIslands = (geo: THREE.BufferGeometry): THREE.BufferGeometry[] => {
      const nonIdx = geo.index ? geo.toNonIndexed() : geo.clone();
      const pos = nonIdx.attributes.position;
      const norm = nonIdx.attributes.normal;
      const uv = nonIdx.attributes.uv;
      if (!pos || pos.count === 0) return [geo];

      const triCount = Math.floor(pos.count / 3);
      if (triCount <= 1) return [nonIdx];

      // 1. Mapear cada vértice a una clave espacial (cuantizada a 1.0 mm para tolerar imprecisiones flotantes)
      const vertToTris = new Map<string, number[]>();
      const getVertKey = (idx: number) => {
        const x = Math.round(pos.getX(idx) * 1000);
        const y = Math.round(pos.getY(idx) * 1000);
        const z = Math.round(pos.getZ(idx) * 1000);
        return `${x}_${y}_${z}`;
      };

      for (let t = 0; t < triCount; t++) {
        for (let v = 0; v < 3; v++) {
          const k = getVertKey(t * 3 + v);
          if (!vertToTris.has(k)) vertToTris.set(k, []);
          vertToTris.get(k)!.push(t);
        }
      }

      // 2. Grafo de adyacencia de triángulos por inundación (BFS)
      const triVisited = new Uint8Array(triCount);
      const islands: number[][] = [];

      for (let t = 0; t < triCount; t++) {
        if (triVisited[t]) continue;
        const currentIsland: number[] = [];
        const queue: number[] = [t];
        triVisited[t] = 1;

        while (queue.length > 0) {
          const cur = queue.pop()!;
          currentIsland.push(cur);

          for (let v = 0; v < 3; v++) {
            const k = getVertKey(cur * 3 + v);
            const neighbors = vertToTris.get(k);
            if (neighbors) {
              for (let i = 0; i < neighbors.length; i++) {
                const n = neighbors[i];
                if (!triVisited[n]) {
                  triVisited[n] = 1;
                  queue.push(n);
                }
              }
            }
          }
        }

        islands.push(currentIsland);
      }

      if (islands.length <= 1) {
        return [nonIdx];
      }

      // 3. Crear una BufferGeometry independiente para cada isla detectada
      const resultGeos: THREE.BufferGeometry[] = [];
      for (const island of islands) {
        const islandTriCount = island.length;
        const newPos = new Float32Array(islandTriCount * 9);
        const newNorm = norm ? new Float32Array(islandTriCount * 9) : null;
        const newUv = uv ? new Float32Array(islandTriCount * 6) : null;

        let dstVert = 0;
        for (const triIdx of island) {
          const srcVert = triIdx * 3;
          for (let v = 0; v < 3; v++) {
            const src = srcVert + v;
            newPos[dstVert * 3] = pos.getX(src);
            newPos[dstVert * 3 + 1] = pos.getY(src);
            newPos[dstVert * 3 + 2] = pos.getZ(src);

            if (newNorm && norm) {
              newNorm[dstVert * 3] = norm.getX(src);
              newNorm[dstVert * 3 + 1] = norm.getY(src);
              newNorm[dstVert * 3 + 2] = norm.getZ(src);
            }

            if (newUv && uv) {
              newUv[dstVert * 2] = uv.getX(src);
              newUv[dstVert * 2 + 1] = uv.getY(src);
            }

            dstVert++;
          }
        }

        const islandGeo = new THREE.BufferGeometry();
        islandGeo.setAttribute("position", new THREE.BufferAttribute(newPos, 3));
        if (newNorm) islandGeo.setAttribute("normal", new THREE.BufferAttribute(newNorm, 3));
        if (newUv) islandGeo.setAttribute("uv", new THREE.BufferAttribute(newUv, 2));
        islandGeo.computeBoundingBox();
        resultGeos.push(islandGeo);
      }

      return resultGeos;
    };

    // 3. Agrupar las mallas candidatas por entidad lógica (Pieza de Madera o Herraje Individual)
    interface PreparedSubMesh {
      geo: THREE.BufferGeometry;
      mat: THREE.MeshStandardMaterial;
      box: THREE.Box3;
      center: THREE.Vector3;
    }

    const rawBoardSubMeshes = new Map<string, PreparedSubMesh[]>();
    const hardwareItems: Array<{ baseName: string; sub: PreparedSubMesh }> = [];

    for (const { mesh, groupWorldPos } of candidateMeshes) {
      const meshName = (mesh.name || "").trim();
      const nLow = meshName.toLowerCase();

      // Limpiar geometría con atributos estándar (position, normal, uv)
      const cleanGeo = mesh.geometry.clone();
      Object.keys(cleanGeo.attributes).forEach((attrKey) => {
        if (!["position", "normal", "uv"].includes(attrKey)) {
          cleanGeo.deleteAttribute(attrKey);
        }
      });

      if (!cleanGeo.attributes.uv) {
        const pos = cleanGeo.attributes.position;
        const uvs = new Float32Array(pos.count * 2);
        for (let i = 0; i < pos.count; i++) {
          uvs[i * 2] = pos.getX(i);
          uvs[i * 2 + 1] = pos.getZ(i);
        }
        cleanGeo.setAttribute("uv", new THREE.BufferAttribute(uvs, 2));
      }

      // Preservar geometrías indexadas (3x más livianas)
      let finalGeo = cleanGeo;

      // Calcular normales geométricas naturales si la malla no las incluye
      if (!finalGeo.attributes.normal) {
        finalGeo.computeVertexNormals();
      }

      finalGeo.clearGroups();

      // Transformar los vértices al espacio local del mueble (aplicando groupWorldPos)
      const meshWorldPos = new THREE.Vector3();
      const meshWorldQuat = new THREE.Quaternion();
      const meshWorldScale = new THREE.Vector3();
      mesh.getWorldPosition(meshWorldPos);
      mesh.getWorldQuaternion(meshWorldQuat);
      mesh.getWorldScale(meshWorldScale);

      const localOffset = new THREE.Vector3().subVectors(meshWorldPos, groupWorldPos);
      const transformMatrix = new THREE.Matrix4().compose(localOffset, meshWorldQuat, meshWorldScale);
      finalGeo.applyMatrix4(transformMatrix);

      // Resolución de material
      let cleanMat: THREE.MeshStandardMaterial;
      if (isExportSolid && !isForAR) {
        const solidKey = "mat_solido_global";
        if (!materialOptimizedCache.has(solidKey)) {
          materialOptimizedCache.set(
            solidKey,
            new THREE.MeshStandardMaterial({
              name: "Material_Solido_3BF",
              color: new THREE.Color(coloresApariencia.materialPorDefecto || calibracion.colorSolido || "#CBD5E1"),
              roughness: 0.5,
              metalness: 0.05,
              map: null,
              transparent: false,
              opacity: 1.0,
              side: THREE.DoubleSide,
            })
          );
        }
        cleanMat = materialOptimizedCache.get(solidKey)!;
      } else {
        const srcMat = Array.isArray(mesh.material) ? mesh.material[0] : mesh.material;
        const srcTexture: THREE.Texture | null = (mesh.userData?.pbrDiffuse) || ((srcMat as any)?.map) || null;

        let optTexture: THREE.Texture | null = null;
        if (srcTexture) {
          optTexture = getOptimized512Texture(srcTexture);
        }

        const isHw = isHardwareMesh(meshName, mesh.userData?.isHardware);
        let baseMatName = mesh.userData?.nombreMaterialEfectivo || srcMat?.name;
        if (!baseMatName || baseMatName === "PBR_Material") {
          const isBalanceMesh = mesh.userData?.isBalance || nLow.includes("balance") || nLow.endsWith(" b") || nLow.endsWith("_b") || /pe[cç]a\s*\d+\s*b$/i.test(nLow);
          if (nLow.includes("mdf")) {
            baseMatName = "MDF";
          } else if (nLow.includes("mdp")) {
            baseMatName = "MDP";
          } else if (isBalanceMesh) {
            baseMatName = "Balance";
          } else if (isHw) {
            baseMatName = "Herraje_Mat";
          } else {
            baseMatName = "M_Acabado";
          }
        }

        const colHex = optTexture ? "FFFFFF" : ((mesh.userData?.materialPBR?.colorBase) ? mesh.userData.materialPBR.colorBase.replace("#", "") : ((srcMat as any)?.color ? (srcMat as any).color.getHexString() : "CBD5E1"));
        const roughVal = isHw ? "0.25" : ((mesh.userData?.materialPBR?.rugosidad ?? 0.45)).toFixed(2);
        const metalVal = isHw ? "0.85" : ((mesh.userData?.materialPBR?.metalico ?? 0.05)).toFixed(2);
        const texKey = srcTexture ? ((srcTexture.image as any)?.src || srcTexture.uuid || "tex") : "no_tex";
        const matCacheKey = `${baseMatName}_${colHex}_${roughVal}_${metalVal}_${texKey}_${isForAR ? "ar" : "std"}`;

        if (!materialOptimizedCache.has(matCacheKey)) {
          materialOptimizedCache.set(
            matCacheKey,
            new THREE.MeshStandardMaterial({
              name: baseMatName,
              color: optTexture 
                ? new THREE.Color("#FFFFFF") 
                : (mesh.userData?.materialPBR?.colorBase ? new THREE.Color(mesh.userData.materialPBR.colorBase) : ((srcMat as any)?.color || new THREE.Color("#CBD5E1"))),
              roughness: isHw ? 0.25 : (mesh.userData?.materialPBR?.rugosidad ?? 0.45),
              metalness: isHw ? 0.85 : (mesh.userData?.materialPBR?.metalico ?? 0.05),
              map: optTexture,
              transparent: false,
              opacity: 1.0,
              side: THREE.DoubleSide,
            })
          );
        }
        cleanMat = materialOptimizedCache.get(matCacheKey)!;
      }

      const isHw = isHardwareMesh(meshName, mesh.userData?.isHardware);
      const cleanPieceKey = getCleanPieceBaseName(meshName);

      // 🔍 Separar mallas compuestas en islas físicas independientes (arrays, mirrors)
      const discreteIslands = splitDisconnectedIslands(finalGeo);

      for (const islandGeo of discreteIslands) {
        const box = new THREE.Box3().setFromBufferAttribute(islandGeo.attributes.position as THREE.BufferAttribute);
        const center = new THREE.Vector3();
        box.getCenter(center);

        const subItem: PreparedSubMesh = { geo: islandGeo, mat: cleanMat, box, center };

        if (isHw) {
          // 🛡️ Deduplicador espacial de herrajes: Evita clones superpuestos al 100% de Grasshopper
          const curSize = new THREE.Vector3();
          box.getSize(curSize);

          const isDuplicateHw = hardwareItems.some((existing) => {
            if (existing.baseName !== cleanPieceKey) return false;
            if (existing.sub.center.distanceTo(center) > 0.0005) return false;
            const exSize = new THREE.Vector3();
            existing.sub.box.getSize(exSize);
            return (
              Math.abs(exSize.x - curSize.x) < 0.0005 &&
              Math.abs(exSize.y - curSize.y) < 0.0005 &&
              Math.abs(exSize.z - curSize.z) < 0.0005
            );
          });

          if (isDuplicateHw) {
            console.warn(
              `[3dBimFab Deduplicador] 🛡️ Herraje duplicado descartado para GLB: '${cleanPieceKey}' en (${center.x.toFixed(4)}, ${center.y.toFixed(4)}, ${center.z.toFixed(4)})`
            );
            continue;
          }

          hardwareItems.push({
            baseName: cleanPieceKey,
            sub: subItem
          });
        } else {
          if (!rawBoardSubMeshes.has(cleanPieceKey)) {
            rawBoardSubMeshes.set(cleanPieceKey, []);
          }
          const existingList = rawBoardSubMeshes.get(cleanPieceKey)!;

          // 🛡️ Deduplicador de sub-mallas de tablero superpuestas idénticas
          const curSize = new THREE.Vector3();
          box.getSize(curSize);
          const isDuplicateBoard = existingList.some((existing) => {
            if (existing.center.distanceTo(center) > 0.0005) return false;
            const exSize = new THREE.Vector3();
            existing.box.getSize(exSize);
            const sameBox = (
              Math.abs(exSize.x - curSize.x) < 0.0005 &&
              Math.abs(exSize.y - curSize.y) < 0.0005 &&
              Math.abs(exSize.z - curSize.z) < 0.0005
            );
            return sameBox && existing.mat === cleanMat;
          });

          if (isDuplicateBoard) {
            console.warn(
              `[3dBimFab Deduplicador] 🛡️ Capa de tablero duplicada descartada para GLB: '${cleanPieceKey}'`
            );
            continue;
          }

          existingList.push(subItem);
        }
      }
    }

    // 4. Agrupación Espacial Inteligente por Pieza Física (Cohesión de MDP + Color + Balance por instancia)
    interface PhysicalPieceUnit {
      subMeshes: PreparedSubMesh[];
      box: THREE.Box3;
      center: THREE.Vector3;
    }

    rawBoardSubMeshes.forEach((subMeshesList, pieceBaseName) => {
      const pieceUnits: PhysicalPieceUnit[] = [];

      // Conectividad espacial BFS por Bounding Box Overlap con tolerancia estricta de 0.5 mm (0.0005 m)
      // Esta tolerancia de 0.5 mm conecta con 100% de precisión todas las partes en contacto directo de la misma pieza
      // (MDP, caras de melamina, contrabalances, cantos y listones de engruese),
      // mientras que piezas separadas (como los frentes de cajón con holguras de 2mm a 4mm) permanecen perfectamente aisladas.
      const pendientes = [...subMeshesList];
      while (pendientes.length > 0) {
        const actual = pendientes.pop()!;
        const cluster: PreparedSubMesh[] = [actual];
        const frontier: PreparedSubMesh[] = [actual];

        while (frontier.length > 0) {
          const ref = frontier.pop()!;
          const refBoxExpanded = ref.box.clone().expandByScalar(0.0005); // Tolerancia exacta de 0.5 mm

          for (let i = pendientes.length - 1; i >= 0; i--) {
            const candidate = pendientes[i];
            if (refBoxExpanded.intersectsBox(candidate.box)) {
              cluster.push(candidate);
              frontier.push(candidate);
              pendientes.splice(i, 1);
            }
          }
        }

        const unitBox = new THREE.Box3();
        cluster.forEach((s) => unitBox.union(s.box));
        const unitCenter = new THREE.Vector3();
        unitBox.getCenter(unitCenter);

        pieceUnits.push({
          subMeshes: cluster,
          box: unitBox,
          center: unitCenter
        });
      }

      // Ordenar unidades físicamente (de arriba hacia abajo o de izquierda a derecha)
      pieceUnits.sort((a, b) => {
        if (Math.abs(a.center.y - b.center.y) > 0.01) {
          return b.center.y - a.center.y; // Z/Y descendente (top-down)
        }
        if (Math.abs(a.center.x - b.center.x) > 0.01) {
          return a.center.x - b.center.x; // X ascendente (left-to-right)
        }
        return a.center.z - b.center.z;
      });

      // Construir cada pieza física independiente con su Pivote en el Centro de Masa
      pieceUnits.forEach((unit, unitIdx) => {
        // Formato Canónico Blender: 1ra pieza -> 'Peça 19', 2da pieza -> 'Peça 19.001', 3ra pieza -> 'Peça 19.002'
        // El objeto padre (Node) y la malla hija (Mesh Data) tienen exactamente el mismo nombre canónico
        const instanceParentName = unitIdx === 0 ? pieceBaseName : `${pieceBaseName}.${String(unitIdx).padStart(3, "0")}`;
        const instanceMeshName = instanceParentName;

        let finalPieceGeo: THREE.BufferGeometry;
        let finalPieceMat: THREE.Material | THREE.Material[];

        if (unit.subMeshes.length === 1) {
          finalPieceGeo = unit.subMeshes[0].geo.clone();
          finalPieceMat = unit.subMeshes[0].mat;
        } else {
          // Fusionar las capas de la pieza en una sola geometría multi-material
          const nonIndexedGeos: THREE.BufferGeometry[] = [];
          const matsToMerge: THREE.MeshStandardMaterial[] = [];

          unit.subMeshes.forEach((s) => {
            const nonIdx = s.geo.index ? s.geo.toNonIndexed() : s.geo.clone();
            nonIndexedGeos.push(nonIdx);
            matsToMerge.push(s.mat);
          });

          const merged = mergeGeometries(nonIndexedGeos, true);
          if (merged) {
            finalPieceGeo = merged;
            finalPieceMat = matsToMerge;
          } else {
            finalPieceGeo = unit.subMeshes[0].geo.clone();
            finalPieceMat = unit.subMeshes[0].mat;
          }
        }

        // 🎯 PIVOTE EN EL CENTRO DE MASA:
        // Calculamos el centroide de la geometría, trasladamos los vértices a (0,0,0) local
        // y colocamos el grupo contenedor en la posición del centro de masa en el mundo.
        finalPieceGeo.computeBoundingBox();
        const centerOfMass = new THREE.Vector3();
        if (finalPieceGeo.boundingBox) {
          finalPieceGeo.boundingBox.getCenter(centerOfMass);
        }
        finalPieceGeo.translate(-centerOfMass.x, -centerOfMass.y, -centerOfMass.z);
        finalPieceGeo.computeVertexNormals();

        const pieceMesh = new THREE.Mesh(finalPieceGeo, finalPieceMat);
        pieceMesh.name = instanceParentName;
        pieceMesh.geometry.name = instanceMeshName;
        pieceMesh.position.copy(centerOfMass);

        exportScene.add(pieceMesh);

        // 📐 Aristas CAD suavizadas y anti-aliasing geométrico (EdgesGeometry):
        // Se generan ÚNICAMENTE si includeEdges === true (ej. previsualización técnica o cuando se active explícitamente).
        // En descargas GLB estándar se omiten por completo para entregar el mueble limpio y sin duplicar peso.
        if (includeEdges) {
          try {
            const weldedForEdges = mergeVertices(finalPieceGeo.clone(), 0.001);
            const edgeThreshold = isForAR ? 32 : (calibracion?.thresholdAristas || 25);
            const edgesGeo = new THREE.EdgesGeometry(weldedForEdges, edgeThreshold);
            if (edgesGeo.attributes.position && edgesGeo.attributes.position.count > 0) {
              // Desplazar los vértices de la arista 0.2 mm hacia afuera del centro de masa
              // para evitar que queden coplanares con la superficie del tablero (elimina Z-fighting y líneas cortadas)
              const linePos = edgesGeo.attributes.position;
              for (let i = 0; i < linePos.count; i++) {
                const vx = linePos.getX(i);
                const vy = linePos.getY(i);
                const vz = linePos.getZ(i);
                const len = Math.sqrt(vx * vx + vy * vy + vz * vz);
                if (len > 0.001) {
                  linePos.setXYZ(i, vx + (vx / len) * 0.0002, vy + (vy / len) * 0.0002, vz + (vz / len) * 0.0002);
                }
              }
              linePos.needsUpdate = true;

              // En AR: Cálculo adaptativo del tono de la arista según el color del material de la pieza:
              // - Para materiales claros/blancos (luminancia > 0.65): Gris suave (#94A3B8) que luce como sombra tenue.
              // - Para materiales de madera/oscuros (luminancia <= 0.65): Tono sombra oscurecido del propio color (multiplicador 0.42)
              //   que simula el bisel/quiebre de luz físico real del borde del tablero (#4D3320 en Cinamomo) sin verse blancuzco ni tiza.
              let edgeColorHex: string;
              if (isForAR) {
                let refColor: THREE.Color | null = null;
                if (Array.isArray(finalPieceMat)) {
                  refColor = (finalPieceMat[0] as THREE.MeshStandardMaterial)?.color || null;
                } else if (finalPieceMat) {
                  refColor = (finalPieceMat as THREE.MeshStandardMaterial)?.color || null;
                }

                if (refColor) {
                  const lum = 0.299 * refColor.r + 0.587 * refColor.g + 0.114 * refColor.b;
                  if (lum > 0.65) {
                    edgeColorHex = "#94A3B8";
                  } else {
                    // Sombra del propio color de la madera / melamina (quiebre de bisel físico realista)
                    const darkened = refColor.clone().multiplyScalar(0.42);
                    edgeColorHex = `#${darkened.getHexString()}`;
                  }
                } else {
                  edgeColorHex = "#94A3B8";
                }
              } else {
                edgeColorHex = calibracion?.colorAristas || "#334155";
              }

              const edgeMat = new THREE.LineBasicMaterial({
                color: new THREE.Color(edgeColorHex),
                linewidth: 1,
              });
              const lineMesh = new THREE.LineSegments(edgesGeo, edgeMat);
              lineMesh.name = `${instanceParentName}_Edges`;
              lineMesh.position.copy(centerOfMass);
              exportScene.add(lineMesh);
            }
          } catch (edgeErr) {
            console.warn("[3dBimFab GLB] Error generando aristas para pieza:", edgeErr);
          }
        }
      });
    });

    // 5. Construcción de Herrajes Discretos Jerárquicos con Pivote en Centro de Masa (Sin emparentamientos a 0,0,0)
    const hardwareSequenceCounters = new Map<string, number>();

    // Ordenar herrajes por posición espacial para numeración estable
    hardwareItems.sort((a, b) => {
      if (Math.abs(a.sub.center.y - b.sub.center.y) > 0.01) {
        return b.sub.center.y - a.sub.center.y;
      }
      return a.sub.center.x - b.sub.center.x;
    });

    hardwareItems.forEach(({ baseName, sub }) => {
      const count = (hardwareSequenceCounters.get(baseName) || 0) + 1;
      hardwareSequenceCounters.set(baseName, count);

      // Formato Padre e Hijo: 1ro -> Cavilha, 2do -> Cavilha.001, 3ro -> Cavilha.002
      // El objeto padre (Node) y la malla interna (Mesh) llevan exactamente el mismo nombre
      const hwName = count === 1 ? baseName : `${baseName}.${String(count - 1).padStart(3, "0")}`;
      const hwMeshName = hwName;

      const hwGeo = sub.geo.clone();
      hwGeo.computeBoundingBox();
      const hwCenter = new THREE.Vector3();
      if (hwGeo.boundingBox) {
        hwGeo.boundingBox.getCenter(hwCenter);
      }
      // 🎯 Pivote en centro de masa del herraje
      hwGeo.translate(-hwCenter.x, -hwCenter.y, -hwCenter.z);
      hwGeo.computeVertexNormals();

      const hwMesh = new THREE.Mesh(hwGeo, sub.mat);
      hwMesh.name = hwName;
      hwMesh.geometry.name = hwMeshName;
      hwMesh.position.copy(hwCenter);

      exportScene.add(hwMesh);
    });

    // 6. Centrar el mueble en X y Z (origen de rotación/colocación) y asentar su base exactamente en Y = 0 (el suelo físico)
    exportScene.updateMatrixWorld(true);
    const totalBox = new THREE.Box3().setFromObject(exportScene);
    if (!totalBox.isEmpty()) {
      const center = new THREE.Vector3();
      totalBox.getCenter(center);
      const minY = totalBox.min.y;

      // Desplazar cada pieza/herraje para que el centro horizontal esté en (0, 0) y el piso físico en Y = 0
      exportScene.children.forEach((child) => {
        child.position.x -= center.x;
        child.position.z -= center.z;
        child.position.y -= minY;
      });
      exportScene.updateMatrixWorld(true);
      console.log(
        `[3dBimFab GLB Cohesion] Mueble cohesionado con éxito: ${rawBoardSubMeshes.size} familias de piezas de madera y ${hardwareItems.length} herrajes.`
      );
    }

    return new Promise((resolve, reject) => {
      exporter.parse(
        exportScene,
        (gltf) => {
          resolve({ arrayBuffer: gltf as ArrayBuffer, piecesCount: exportScene.children.length });
        },
        (error) => {
          reject(error);
        },
        { binary: true, maxTextureSize: 512 }
      );
    });
  };

  // 📥 Exportar GLB (con compresión Draco automática a ~2.1 MB)
  const exportToGLB = async (comprimido = true) => {
    setExportandoGLB(true);
    try {
      const glbData = await generateCleanGLB();
      if (!glbData) {
        setExportandoGLB(false);
        return;
      }

      const modelName = parametros.model_id || "Cubierta";
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(11, 19);

      let finalBlob: Blob;
      let finalFileName: string;

      if (comprimido) {
        try {
          const res = await fetch(`/api/compress-glb?mode=download&name=${encodeURIComponent(modelName)}`, {
            method: "POST",
            headers: { "Content-Type": "application/octet-stream" },
            body: glbData.arrayBuffer,
          });

          if (res.ok) {
            finalBlob = await res.blob();
            finalFileName = `${modelName}_${timestamp}_comprimido.glb`;
          } else {
            throw new Error("API de compresión devolvió status " + res.status);
          }
        } catch (compErr) {
          console.warn("Fallo compresión en servidor, descargando versión estándar:", compErr);
          finalBlob = new Blob([glbData.arrayBuffer], { type: "application/octet-stream" });
          finalFileName = `${modelName}_${timestamp}.glb`;
        }
      } else {
        finalBlob = new Blob([glbData.arrayBuffer], { type: "application/octet-stream" });
        finalFileName = `${modelName}_${timestamp}.glb`;
      }

      const link = document.createElement("a");
      link.href = URL.createObjectURL(finalBlob);
      link.download = finalFileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(link.href), 1000);
      console.log(
        `[3dBimFab GLB Exporter] Descarga completada: ${finalFileName} (${(finalBlob.size / (1024 * 1024)).toFixed(2)} MB)`
      );
    } catch (err: any) {
      console.error("Error al exportar GLB:", err);
      alert("Error en exportación: " + (err?.message || err));
    } finally {
      setExportandoGLB(false);
    }
  };

  // 🚀 Descargar GLB unificado según la pestaña activa (Estático en 3D / Animado en Manual 3D)
  const descargarGlbSegunModo = async () => {
    if (pestanaActiva === "manual") {
      const state = use3BFStore.getState();
      const pasos = state.pasosManual;
      const activeId = state.pasoActivoManualId;
      const pasoActivo = pasos.find((p) => p.id === activeId) || pasos[0];
      if (!pasoActivo) {
        exportToGLB(true);
        return;
      }
      try {
        setExportandoGLB(true);
        // 1. Pausar y llevar el timeline estrictamente a t = 0 para garantizar mallas 100% cerradas
        const prevTime = use3BFStore.getState().timelineCurrentTime;
        const prevPlaying = use3BFStore.getState().isTimelinePlaying;
        use3BFStore.setState({ isTimelinePlaying: false, timelineCurrentTime: 0 });

        if (typeof window !== "undefined" && (window as any).__3bfManualEngine) {
          (window as any).__3bfManualEngine.detener();
        }

        await new Promise((resolve) => setTimeout(resolve, 80));

        const scene = (window as any).__threeScene3BF || furnitureGroup || new THREE.Scene();
        const { buffer, filename, sizeMb } = await exportarGlbPasoManual(scene, pasoActivo);

        descargarBufferComoArchivo(buffer, filename);
        console.log(`[3dBimFab Manual] 🚀 GLB animado exportado: ${filename} (${sizeMb} MB)`);

        if (typeof window !== "undefined" && (window as any).__3bfManualEngine) {
          (window as any).__3bfManualEngine.actualizarTiempo(prevTime);
        }
        use3BFStore.setState({ timelineCurrentTime: prevTime, isTimelinePlaying: prevPlaying });
      } catch (err: any) {
        console.error("[3dBimFab Manual] Error al exportar paso animado:", err);
        alert(`Error al exportar paso animado: ${err.message}`);
      } finally {
        setExportandoGLB(false);
      }
    } else {
      exportToGLB(true);
    }
  };

  // ✨ Abrir Realidad Aumentada "Ver en tu espacio"
  const abrirRealidadAumentada = async () => {
    setGenerandoAR(true);
    try {
      let glbBuffer: ArrayBuffer;
      let rawSize = 0;
      let modelName = parametros.model_id || "Cubierta";

      if (pestanaActiva === "manual") {
        const state = use3BFStore.getState();
        const pasoActivo = state.pasosManual.find((p) => p.id === state.pasoActivoManualId) || state.pasosManual[0];
        if (pasoActivo) {
          modelName = `${modelName}_${pasoActivo.id}`;
          // 1. Pausar y resetear timeline a 0 para que la animación empiece limpia desde reposo absoluto
          const prevTime = state.timelineCurrentTime;
          const prevPlaying = state.isTimelinePlaying;
          use3BFStore.setState({ isTimelinePlaying: false, timelineCurrentTime: 0 });

          if (typeof window !== "undefined" && (window as any).__3bfManualEngine) {
            (window as any).__3bfManualEngine.detener();
          }

          await new Promise((resolve) => setTimeout(resolve, 80));

          const scene = (window as any).__threeScene3BF || furnitureGroup || new THREE.Scene();
          const { buffer, sizeMb } = await exportarGlbPasoManual(scene, pasoActivo);
          glbBuffer = buffer;
          rawSize = buffer.byteLength;
          console.log(`[3dBimFab AR] 🎬 Paso animado preparado para AR: ${modelName} (${sizeMb} MB)`);

          if (typeof window !== "undefined" && (window as any).__3bfManualEngine) {
            (window as any).__3bfManualEngine.actualizarTiempo(prevTime);
          }
          use3BFStore.setState({ timelineCurrentTime: prevTime, isTimelinePlaying: prevPlaying });
        } else {
          const glbData = await generateCleanGLB(true);
          if (!glbData) {
            setGenerandoAR(false);
            return;
          }
          glbBuffer = glbData.arrayBuffer;
          rawSize = glbData.arrayBuffer.byteLength;
        }
      } else {
        // 🚀 Generar GLB con perfil ultra liviano exclusivo para AR (< 900 KB)
        const glbData = await generateCleanGLB(true);
        if (!glbData) {
          setGenerandoAR(false);
          return;
        }
        glbBuffer = glbData.arrayBuffer;
        rawSize = glbData.arrayBuffer.byteLength;
      }

      // 📱 Detección universal de dispositivo móvil o tablet (inmune a "Sitio para computadoras"):
      const ua = typeof navigator !== "undefined" ? navigator.userAgent || navigator.vendor || (window as any).opera || "" : "";
      const isMobileUA = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(ua);
      const isIPad = /macintosh/i.test(ua) && typeof navigator !== "undefined" && navigator.maxTouchPoints > 1;
      const isTouch =
        typeof window !== "undefined" &&
        ("ontouchstart" in window ||
          (navigator && (navigator.maxTouchPoints > 0 || (navigator as any).msMaxTouchPoints > 0)) ||
          (window.matchMedia && window.matchMedia("(pointer: coarse)").matches));
      const esDispositivoMovil = isMobileUA || isIPad || isTouch;

      // 💾 Guardar snapshot de sesión activa para que al volver de AR no se pierda ninguna personalización
      try {
        if (typeof window !== "undefined") {
          const snapshot = {
            parametros,
            instancias,
            modelName,
            timestamp: Date.now(),
          };
          sessionStorage.setItem("3bf_ar_return_session", JSON.stringify(snapshot));
        }
      } catch (e) {
        console.warn("No se pudo guardar la sesión de retorno AR:", e);
      }

      // Endpoint permanente para AR (elude la memoria efímera y timeouts de Lambdas de Netlify)
      const arHost = "https://engine.mariomojica.com";
      const arUploadUrl =
        typeof window !== "undefined" &&
        (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1")
          ? "/api/compress-glb"
          : `${arHost}/api/compress-glb`;
      const arRedirectBase =
        typeof window !== "undefined" &&
        (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1")
          ? ""
          : arHost;

      if (esDispositivoMovil) {
        // En móvil: Guardar en IndexedDB para disponibilidad inmediata
        try {
          const glbBlob = new Blob([glbBuffer], { type: "model/gltf-binary" });
          await saveLocalARModel(glbBlob, modelName);
        } catch (storageErr) {
          console.warn("[3dBimFab AR] IndexedDB no disponible:", storageErr);
        }

        // Subir al backend persistente con timeout de 10s para registrar el ID de Scene Viewer
        const abortCtrl = new AbortController();
        const timeoutId = setTimeout(() => abortCtrl.abort(), 10000);

        try {
          const res = await fetch(`${arUploadUrl}?mode=ar&name=${encodeURIComponent(modelName)}`, {
            method: "POST",
            headers: { "Content-Type": "application/octet-stream" },
            body: glbBuffer,
            signal: abortCtrl.signal,
          });
          clearTimeout(timeoutId);

          if (res.ok) {
            const data = await res.json();
            if (data?.id) {
              setGenerandoAR(false);
              // Navegar exactamente a la misma URL pública que descarga Google Scene Viewer en el QR de PC
              window.location.href = `${arRedirectBase}/ar?id=${data.id}&name=${encodeURIComponent(modelName)}`;
              return;
            }
          }
        } catch (apiErr) {
          clearTimeout(timeoutId);
          console.warn("[3dBimFab AR] Subida serverless demorada o fallida:", apiErr);
        }

        // Fallback si la API tardó más de 10s o falló: abrir localmente
        setGenerandoAR(false);
        window.location.href = `/ar?source=local&name=${encodeURIComponent(modelName)}`;
        return;
      }

      // En PC: Preparar modelo en API para generar el ID del QR
      const res = await fetch(`${arUploadUrl}?mode=ar&name=${encodeURIComponent(modelName)}`, {
        method: "POST",
        headers: { "Content-Type": "application/octet-stream" },
        body: glbBuffer,
      });

      if (!res.ok) {
        throw new Error("No se pudo preparar el modelo para Realidad Aumentada.");
      }

      const data = await res.json();

      setArData({
        id: data.id,
        sizeBefore: data.sizeBefore,
        sizeAfter: data.sizeAfter,
      });
      setModalARAbierto(true);
    } catch (err: any) {
      console.error("Error al preparar AR:", err);
      alert("Error al preparar Realidad Aumentada: " + (err?.message || err));
    } finally {
      setGenerandoAR(false);
    }
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

      {/* 📱 OVERLAY SIMULADOR DE CELULAR (SAFE FRAME VERTICAL 9:16) */}
      {simuladorMovilActivo && (
        <div className="absolute inset-0 z-10 pointer-events-none flex items-center justify-center overflow-hidden">
          {/* Marco Vertical 9:16 con sombreado Passepartout exterior y esquinas seguras */}
          <div 
            className="relative aspect-[9/16] max-h-[90vh] h-[86vh] w-auto border-2 rounded-3xl shadow-[0_0_0_9999px_rgba(11,15,23,0.65)] flex items-center justify-center transition-all"
            style={{
              borderColor: coloresApariencia?.botonActivo || "#1368AA",
            }}
          >
            {/* Altavoz superior de smartphone simulado */}
            <div className="absolute top-2 w-12 h-1 bg-slate-400/40 rounded-full" />

            {/* Esquinas de encuadre seguras (Safe Frame Guides) */}
            <div className="absolute top-4 left-4 w-4 h-4 border-t-2 border-l-2 border-cyan-400/80 rounded-tl-sm" />
            <div className="absolute top-4 right-4 w-4 h-4 border-t-2 border-r-2 border-cyan-400/80 rounded-tr-sm" />
            <div className="absolute bottom-4 left-4 w-4 h-4 border-b-2 border-l-2 border-cyan-400/80 rounded-bl-sm" />
            <div className="absolute bottom-4 right-4 w-4 h-4 border-b-2 border-r-2 border-cyan-400/80 rounded-br-sm" />

            {/* Badge indicador discreto */}
            <div className="absolute top-5 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full bg-slate-950/85 text-cyan-400 border border-cyan-500/40 text-[9px] font-mono tracking-wider font-bold uppercase backdrop-blur-xs shadow-xs flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
              <span>9:16 Mobile Safe View</span>
            </div>
          </div>
        </div>
      )}

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
        <div className="absolute top-3.5 left-4 z-20 flex flex-col items-start gap-1 select-none pointer-events-auto max-w-[calc(100vw-32px)] lg:max-w-[260px]">
          {/* Nivel 1: Barra de Acciones Superior (Guardar + Perforar + Luz + Marco 1:1) */}
          <div className="flex items-center gap-1.5 flex-wrap">
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
            ) : (
              <>
                <Save className={`w-3.5 lg:w-3.5 h-3.5 lg:h-3.5 text-white ${guardandoMueble ? "animate-spin" : ""}`} />
                <span>{guardandoMueble ? "Guardando..." : "Guardar"}</span>
              </>
            )}
          </button>

          {/* En Modo Manual: Botón Circular Actualizar GHX (flechas circulares) */}
          {/* En Modo 3D: Botón Perforar Mueble */}
          {pestanaActiva === "manual" ? (
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
              title="Actualizar / recalcular geometría fresca desde Grasshopper (.ghx)"
              style={{
                backgroundColor: coloresApariencia?.botonActivo || "#0891b2",
                borderColor: coloresApariencia?.colorMarca || "#0891b2",
              }}
              className="w-8 lg:w-7 h-8 lg:h-7 rounded-full text-white shadow-md border flex items-center justify-center hover:opacity-90 active:scale-95 transition-all cursor-pointer disabled:opacity-50 box-border shrink-0"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${recargandoGHX ? "animate-spin" : ""}`} />
            </button>
          ) : (
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

          {/* 📱 Botón Toggle de Simulador Móvil 9:16 (Safe Frame Celular) */}
          <button
            onClick={() => toggleSimuladorMovil()}
            title={simuladorMovilActivo ? "Ocultar simulador de celular 9:16" : "Activar simulador de celular 9:16 (Safe Frame vertical para pantalla móvil)"}
            style={{
              backgroundColor: coloresApariencia?.botonActivo || "#1368AA",
              borderColor: coloresApariencia?.colorMarca || "#1368AA",
            }}
            className="w-8 lg:w-7 h-8 lg:h-7 rounded-full text-white shadow-md border flex items-center justify-center hover:opacity-90 active:scale-95 transition-all cursor-pointer box-border shrink-0"
          >
            <Smartphone 
              strokeWidth={1.75}
              className={`w-3.5 lg:w-3.5 h-3.5 lg:h-3.5 text-white shrink-0 ${simuladorMovilActivo ? "opacity-100 fill-white/25" : "opacity-90"}`} 
            />
          </button>
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
        camera={{ position: [0.6, 0.9, 1.1], fov: 45, near: 0.005, far: 100 }}
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
            fadeDistance={Math.max(100, (calibracion.numeroLineasRejilla || 500) * (calibracion.distanciaCuadricula || 0.01) * 4)}
          />
        )}
        <GroundInfiniteAxes />
        <CameraViewController furnitureGroup={furnitureGroup} controlsRef={controlsRef} />
        <AutoFramingCameraController controlsRef={controlsRef} />
        <ManualCameraDirector controlsRef={controlsRef} />
        <BlenderNavigationController controlsRef={controlsRef} />
        <OrbitControls 
          ref={controlsRef}
          makeDefault 
          enabled={modoTransformacion !== "grab" && !piezaEnPosicionamientoManual} 
          target={pasoActivoManual?.tipo === "bloque_estandar" ? [0, 0.1, 0] : [0.25, 0, -0.24]} 
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

        {/* ⚡ Testigo de Sincronización con intensidad de iluminación parpadeante (justo encima de Online) */}
        {estaSincronizando && (
          <div className="flex items-center gap-1.5 text-[9px] md:text-[10.5px] font-bold text-cyan-500 dark:text-cyan-400 animate-pulse pointer-events-auto tracking-wide">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 dark:bg-cyan-400 shadow-[0_0_6px_rgba(6,182,212,0.8)] shrink-0" />
            <span>Sincronizando...</span>
          </div>
        )}

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

      {/* 🎬 Barra Flotante de Reproducción y Scrubber para Modo Manual */}
      {pestanaActiva === "manual" && <TimelineScrubber />}




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
