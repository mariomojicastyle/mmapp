"use client";

import React, { useRef, useEffect } from "react";
import { Canvas, useThree, useFrame } from "@react-three/fiber";
import { OrbitControls, Grid, Stage, Edges, Line, Html } from "@react-three/drei";
import { use3BFStore, ObjetoInstancia3BF } from "@/lib/store";
import * as THREE from "three";
import { Download } from "lucide-react";
import NPanel from "./NPanel";

function useMarfilTexture(customUrl?: string | null, tipoMapeado?: string) {
  const [texture, setTexture] = React.useState<THREE.Texture | null>(null);
  const isTraversada = tipoMapeado === "Cubierta Atravesada" || tipoMapeado === "Entrepaño Atravesado";

  const textureSrc = customUrl || "/textures/Marfil_diffuse.jpg";

  React.useEffect(() => {
    if (typeof window === "undefined") return;

    const loader = new THREE.TextureLoader();
    loader.setCrossOrigin("anonymous");
    loader.load(
      textureSrc,
      (tex) => {
        tex.wrapS = THREE.MirroredRepeatWrapping;
        tex.wrapT = THREE.MirroredRepeatWrapping;
        tex.repeat.set(4.0, 4.0);
        tex.center.set(0.5, 0.5);
        tex.rotation = isTraversada ? Math.PI / 2 : 0;
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.needsUpdate = true;
        setTexture(tex);
      },
      undefined,
      (err) => {
        console.error("TextureLoader error:", err);
      }
    );
  }, [textureSrc, isTraversada]);

  return texture;
}

function obtenerNombreUnificadoPieza(obj: THREE.Object3D): string {
  const meshName = (obj.name || "").replace("RH_OUT:", "").trim();
  const parentName = obj.parent ? obj.parent.name : "";
  const meshNameLower = meshName.toLowerCase();
  const parentNameLower = parentName.toLowerCase();

  // 1. Si es un tablero / cubierta
  if (parentNameLower === "cubierta" || meshNameLower.includes("cubierta")) {
    return "Cubierta";
  }
  if (meshNameLower.includes("entrepaño") || meshNameLower.includes("entrepanio")) {
    return "Entrepaño";
  }
  if (meshNameLower.includes("lateral")) {
    return "Lateral";
  }

  // 2. Herrajes
  if (meshNameLower.includes("caja")) {
    return "Caja Minifix";
  }
  if (meshNameLower.includes("perno")) {
    return "Perno Minifix";
  }
  if (meshNameLower.includes("tarugo")) {
    return "Tarugo";
  }
  if (meshNameLower.includes("tornillo")) {
    return "Tornillo";
  }
  if (meshNameLower.includes("maquinado")) {
    return "Maquinado CNC";
  }

  return meshName.replace(/\.\d+$/, "").replace(/\d+$/, "").trim();
}

function RaycastHandler() {
  const { raycaster, scene } = useThree();
  const { setHoveredPiece } = use3BFStore();
  const currentHoverRef = useRef<string | null>(null);
  const frameCount = useRef(0);

  useFrame(() => {
    const intersects = raycaster.intersectObjects(scene.children, true);
    const validHit = intersects.find((hit) => {
      const obj = hit.object;
      const name = obj.name || "";
      return (
        obj.type === "Mesh" && 
        obj.visible && 
        name.length > 0 &&
        !name.toLowerCase().includes("floor") &&
        !name.toLowerCase().includes("grid") &&
        !name.toLowerCase().includes("plane") &&
        !name.toLowerCase().includes("axis")
      );
    });

    const nextHover = validHit ? obtenerNombreUnificadoPieza(validHit.object) : null;
    if (nextHover !== currentHoverRef.current) {
      currentHoverRef.current = nextHover;
      setHoveredPiece(nextHover);
    }
  });

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
  const { calibracion } = use3BFStore();

  if (!calibracion.mostrarGrilla || !calibracion.mostrarEjesCoordenadas) return null;

  const axisWidth = calibracion.grosorGrillaGruesa || 1.5;

  return (
    <group position={[0, -0.00095, 0]} renderOrder={100}>
      {calibracion.mostrarEjeX && (
        <Line
          points={[
            [-100, 0, 0],
            [100, 0, 0],
          ]}
          color={calibracion.colorEjeX || "#ef4444"}
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
            [0, 0, -100],
            [0, 0, 100],
          ]}
          color={calibracion.colorEjeY || "#22c55e"}
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

function BoardMesh({
  position,
  size,
  name,
  mainColor,
  modoVisual,
  vertices,
  indices,
  uvs: grasshopperUvs,
  tipoMapeado,
  instanciaId,
}: {
  position: [number, number, number];
  size: [number, number, number];
  name: string;
  mainColor: string;
  modoVisual: string;
  vertices?: number[];
  indices?: number[];
  uvs?: number[];
  tipoMapeado?: string;
  instanciaId?: string;
}) {
  const { calibracion, objetoSeleccionado, setHoveredPiece } = use3BFStore();
  const loadedTexture = useMarfilTexture(calibracion.customTextureUrl, tipoMapeado);

  const { customGeometry, edgesGeometry } = React.useMemo(() => {
    if (vertices && indices && vertices.length > 0 && indices.length > 0) {
      const indexedGeo = new THREE.BufferGeometry();
      indexedGeo.setAttribute("position", new THREE.Float32BufferAttribute(vertices, 3));
      indexedGeo.setIndex(indices);
      indexedGeo.computeVertexNormals();

      let edges: THREE.EdgesGeometry | null = null;
      try {
        edges = new THREE.EdgesGeometry(indexedGeo, calibracion.thresholdAristas);
      } catch {
        edges = null;
      }

      if (grasshopperUvs && grasshopperUvs.length > 0) {
        indexedGeo.setAttribute("uv", new THREE.Float32BufferAttribute(grasshopperUvs, 2));
        const geo = indexedGeo.toNonIndexed();
        geo.computeVertexNormals();
        geo.computeBoundingBox();
        geo.computeBoundingSphere();
        return { customGeometry: geo, edgesGeometry: edges };
      }

      const geo = indexedGeo.toNonIndexed();
      geo.computeVertexNormals();
      geo.computeBoundingBox();
      geo.computeBoundingSphere();

      const posAttr = geo.attributes.position;
      const uvs = new Float32Array(posAttr.count * 2);

      for (let i = 0; i < posAttr.count; i += 3) {
        const pA = new THREE.Vector3(posAttr.getX(i), posAttr.getY(i), posAttr.getZ(i));
        const pB = new THREE.Vector3(posAttr.getX(i + 1), posAttr.getY(i + 1), posAttr.getZ(i + 1));
        const pC = new THREE.Vector3(posAttr.getX(i + 2), posAttr.getY(i + 2), posAttr.getZ(i + 2));

        const cb = new THREE.Vector3().subVectors(pC, pB);
        const ab = new THREE.Vector3().subVectors(pA, pB);
        const normal = cb.cross(ab).normalize();

        const absX = Math.abs(normal.x);
        const absY = Math.abs(normal.y);
        const absZ = Math.abs(normal.z);

        for (let j = 0; j < 3; j++) {
          const idx = i + j;
          const x = posAttr.getX(idx);
          const y = posAttr.getY(idx);
          const z = posAttr.getZ(idx);

          if (absY >= absX && absY >= absZ) {
            uvs[idx * 2] = x * 1.5;
            uvs[idx * 2 + 1] = z * 1.5;
          } else if (absX >= absY && absX >= absZ) {
            uvs[idx * 2] = z * 1.5;
            uvs[idx * 2 + 1] = y * 1.5;
          } else {
            uvs[idx * 2] = x * 1.5;
            uvs[idx * 2 + 1] = y * 1.5;
          }
        }
      }

      geo.setAttribute("uv", new THREE.BufferAttribute(uvs, 2));
      return { customGeometry: geo, edgesGeometry: edges };
    }
    return { customGeometry: null, edgesGeometry: null };
  }, [vertices, indices, grasshopperUvs, calibracion.thresholdAristas]);

  const boxEdgesGeometry = React.useMemo(() => {
    if (!customGeometry && size && size.length === 3) {
      try {
        const boxGeo = new THREE.BoxGeometry(size[0], size[1], size[2]);
        return new THREE.EdgesGeometry(boxGeo, calibracion.thresholdAristas);
      } catch {
        return null;
      }
    }
    return null;
  }, [customGeometry, size, calibracion.thresholdAristas]);

  const cleanName = name.replace("RH_OUT:", "");
  const isWireframe = modoVisual === "lineas";
  const isTransparent = modoVisual === "semitransparente";
  const isHardwarePerno = name.includes("Perno") || name.includes("Tornillo");
  const isHardwareCaja = (name.includes("Caja") && !name.includes("Cajon") && !name.includes("Cajón")) || name === "RH_OUT:Caja";
  const isHardwareTarugo = name.includes("Tarugo") || name.includes("Soporte");
  const isMachining = name.includes("Maquinados");
  const isTapaLuz = name.includes("Tapa Luz") || name.includes("Regleta");

  let meshColor = mainColor;
  let metalness = 0.1;
  let roughness = 0.4;
  let opacity = isTransparent ? 0.70 : calibracion.opacidadMadera;
  let transparent = isTransparent || opacity < 1.0;

  if (isHardwarePerno) {
    meshColor = "#9CA3AF";
    metalness = 0.85;
    roughness = 0.25;
    opacity = 1.0;
    transparent = false;
  } else if (isHardwareCaja) {
    meshColor = "#D97706";
    metalness = 0.75;
    roughness = 0.3;
    opacity = 1.0;
    transparent = false;
  } else if (isHardwareTarugo) {
    meshColor = "#B45309";
    metalness = 0.0;
    roughness = 0.8;
    opacity = 1.0;
    transparent = false;
  } else if (isMachining) {
    meshColor = "#EF4444";
    metalness = 0.2;
    roughness = 0.5;
    opacity = 0.6;
    transparent = true;
  } else if (isTapaLuz) {
    meshColor = "#1F2937";
    metalness = 0.2;
    roughness = 0.4;
    opacity = 1.0;
    transparent = false;
  }

  const isSolidOrRendered = modoVisual === "solido" || modoVisual === "renderizado";
  const isRenderedMode = modoVisual === "renderizado";
  const isWoodBoard = !isHardwarePerno && !isHardwareCaja && !isHardwareTarugo && !isMachining && !isTapaLuz;

  const isMdpExpuesto = name.includes("MDP");
  const isBalance = name.includes("Balance");
  const isMelaminaCara = name.includes("Color") || (!isMdpExpuesto && !isBalance);

  if (isSolidOrRendered && isMachining) {
    return null;
  }

  if (isWoodBoard) {
    roughness = isTransparent ? 0.15 : (isMdpExpuesto ? 0.85 : (isBalance ? 0.5 : calibracion.rugosidadMadera));
    metalness = isTransparent ? 0.1 : (isMdpExpuesto ? 0.0 : (isBalance ? 0.0 : calibracion.metalicidadMadera));
    if (modoVisual === "semitransparente") {
      opacity = 0.52;
      transparent = true;
    } else if (modoVisual === "solido") {
      meshColor = calibracion.colorSolido;
      opacity = calibracion.opacidadMadera;
      transparent = opacity < 1.0;
    } else if (modoVisual === "renderizado") {
      opacity = calibracion.opacidadMadera;
      transparent = opacity < 1.0;
    }
  }

  const activeMap = (isWoodBoard && isMelaminaCara && (calibracion.customTextureUrl || isRenderedMode)) ? loadedTexture : null;
  const hasMap = activeMap !== null;
  let finalMeshColor = hasMap ? "#ffffff" : (modoVisual === "solido" ? calibracion.colorSolido : meshColor);

  if (modoVisual === "renderizado" && isWoodBoard) {
    if (isMdpExpuesto) {
      finalMeshColor = "#D5B88A";
    } else if (isBalance) {
      finalMeshColor = "#F9FAFB";
    }
  }

  const isMainSolidBoard = isWoodBoard && (isMdpExpuesto || (!name.includes("Color") && !name.includes("Balance")));
  const debeMostrarAristas = !objetoSeleccionado && calibracion.mostrarAristas && isWoodBoard;

  const handlePointerOver = (e: any) => {
    e.stopPropagation();
    setHoveredPiece(cleanName);
    if (instanciaId && typeof window !== "undefined") {
      (window as any).__hoveredInstanceId = instanciaId;
    }
  };

  const handlePointerOut = (e: any) => {
    e.stopPropagation();
    setHoveredPiece(null);
    if (typeof window !== "undefined" && (window as any).__hoveredInstanceId === instanciaId) {
      (window as any).__hoveredInstanceId = null;
    }
  };

  if (customGeometry) {
    return (
      <mesh 
        position={position}
        name={cleanName}
        geometry={customGeometry}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
      >
        <meshStandardMaterial
          key={`${activeMap ? activeMap.uuid : "no-map"}-${modoVisual}`}
          color={finalMeshColor}
          map={activeMap}
          transparent={transparent}
          opacity={opacity}
          roughness={roughness}
          metalness={metalness}
          wireframe={isWireframe}
          depthWrite={true}
          side={THREE.DoubleSide}
        />
        {debeMostrarAristas && (
          <Edges
            threshold={calibracion.thresholdAristas || 40}
            color={calibracion.colorAristas}
            lineWidth={1}
            renderOrder={10}
          />
        )}
      </mesh>
    );
  }

  return (
    <mesh
      position={position}
      name={cleanName}
      onPointerOver={handlePointerOver}
      onPointerOut={handlePointerOut}
    >
      <boxGeometry args={size} />
      <meshStandardMaterial
        key={`${activeMap ? activeMap.uuid : "no-map"}-${modoVisual}`}
        color={finalMeshColor}
        map={activeMap}
        transparent={transparent}
        opacity={opacity}
        roughness={roughness}
        metalness={metalness}
        wireframe={isWireframe}
        depthWrite={true}
      />
      {debeMostrarAristas && (
        <Edges
          threshold={calibracion.thresholdAristas || 40}
          color={calibracion.colorAristas}
          lineWidth={1}
          renderOrder={10}
        />
      )}
    </mesh>
  );
}

function extractStaticGeometry(furnitureGroup: THREE.Group) {
  let boardMesh: THREE.Object3D | null = null;
  furnitureGroup.traverse((child) => {
    if (!boardMesh && (child as THREE.Mesh).isMesh && (child.name.includes("MDP") || child.name.includes("Cubierta"))) {
      boardMesh = child;
    }
  });

  const targetObj = boardMesh || furnitureGroup;
  targetObj.updateWorldMatrix(true, true);
  furnitureGroup.updateWorldMatrix(true, true);

  const worldBox = new THREE.Box3().setFromObject(targetObj);
  if (worldBox.isEmpty()) return null;

  const groupWorldPos = new THREE.Vector3();
  furnitureGroup.getWorldPosition(groupWorldPos);

  // Coordenadas locales puras respecto al origen del grupo
  const minX = worldBox.min.x - groupWorldPos.x;
  const maxX = worldBox.max.x - groupWorldPos.x;
  const minY = worldBox.min.y - groupWorldPos.y;
  const maxY = worldBox.max.y - groupWorldPos.y;
  const minZ = worldBox.min.z - groupWorldPos.z;
  const maxZ = worldBox.max.z - groupWorldPos.z;

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

  interface PernoSaliente {
    side: "left" | "right" | "front" | "back";
    center: THREE.Vector3;
    tip: number;
    radius: number;
  }
  const protrudingPernos: PernoSaliente[] = [];

  furnitureGroup.traverse((child) => {
    if ((child as THREE.Mesh).isMesh && (child.name.includes("Perno") || child.name.includes("Tornillo"))) {
      const mesh = child as THREE.Mesh;
      const pWorldBBox = new THREE.Box3().setFromObject(mesh);
      const pLocalMinX = pWorldBBox.min.x - groupWorldPos.x;
      const pLocalMaxX = pWorldBBox.max.x - groupWorldPos.x;
      const pLocalMinZ = pWorldBBox.min.z - groupWorldPos.z;
      const pLocalMaxZ = pWorldBBox.max.z - groupWorldPos.z;
      const pLocalCenter = pWorldBBox.getCenter(new THREE.Vector3()).sub(groupWorldPos);
      const radius = Math.max(0.003, (pWorldBBox.max.y - pWorldBBox.min.y) / 2);

      if (pLocalMinX < minX - 0.001) {
        protrudingPernos.push({ side: "left", center: pLocalCenter, tip: pLocalMinX, radius });
      } else if (pLocalMaxX > maxX + 0.001) {
        protrudingPernos.push({ side: "right", center: pLocalCenter, tip: pLocalMaxX, radius });
      } else if (pLocalMinZ < minZ - 0.001) {
        protrudingPernos.push({ side: "back", center: pLocalCenter, tip: pLocalMinZ, radius });
      } else if (pLocalMaxZ > maxZ + 0.001) {
        protrudingPernos.push({ side: "front", center: pLocalCenter, tip: pLocalMaxZ, radius });
      }
    }
  });

  const pernoRings: [number, number, number][][] = [];
  for (const p of protrudingPernos) {
    const segs = 16;
    const pts: [number, number, number][] = [];
    if (p.side === "left" || p.side === "right") {
      for (let s = 0; s <= segs; s++) {
        const ang = (s / segs) * Math.PI * 2;
        pts.push([
          p.tip,
          p.center.y + Math.cos(ang) * p.radius,
          p.center.z + Math.sin(ang) * p.radius
        ]);
      }
    } else {
      for (let s = 0; s <= segs; s++) {
        const ang = (s / segs) * Math.PI * 2;
        pts.push([
          p.center.x + Math.cos(ang) * p.radius,
          p.center.y + Math.sin(ang) * p.radius,
          p.tip
        ]);
      }
    }
    pernoRings.push(pts);
  }

  return { faces, edges, pernoRings };
}

function BoardSilhouetteOutline({ furnitureGroup }: { furnitureGroup: THREE.Group | null }) {
  const { objetoSeleccionado, posicionObjeto, modoTransformacion, resultado, objetoActivoId } = use3BFStore();
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

    // 🎯 DETECCIÓN DINÁMICA DE CAMBIO DE GEOMETRÍA O PARÁMETROS
    let boardMesh: THREE.Object3D | null = null;
    furnitureGroup.traverse((child) => {
      if (!boardMesh && (child as THREE.Mesh).isMesh && (child.name.includes("MDP") || child.name.includes("Cubierta"))) {
        boardMesh = child;
      }
    });

    const targetObj = boardMesh || furnitureGroup;
    targetObj.updateWorldMatrix(true, true);
    furnitureGroup.updateWorldMatrix(true, true);

    const worldBox = new THREE.Box3().setFromObject(targetObj);
    const groupWorldPos = new THREE.Vector3();
    furnitureGroup.getWorldPosition(groupWorldPos);

    // BBox en espacio local para detectar cambios de forma/dimensiones
    const locMinX = (worldBox.min.x - groupWorldPos.x).toFixed(3);
    const locMaxX = (worldBox.max.x - groupWorldPos.x).toFixed(3);
    const locMinZ = (worldBox.min.z - groupWorldPos.z).toFixed(3);
    const locMaxZ = (worldBox.max.z - groupWorldPos.z).toFixed(3);
    const bboxKey = `${locMinX}_${locMaxX}_${locMinZ}_${locMaxZ}_${objetoActivoId}`;

    if (!geoDataRef.current || lastBboxKeyRef.current !== bboxKey) {
      lastBboxKeyRef.current = bboxKey;
      geoDataRef.current = extractStaticGeometry(furnitureGroup);
    }

    const staticGeometry = geoDataRef.current;
    if (!staticGeometry) {
      if (silhouettePoints.length > 0) setSilhouettePoints([]);
      return;
    }

    const { faces, edges, pernoRings } = staticGeometry;
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

    for (const ring of pernoRings) {
      activeSilhouettes.push(ring);
    }

    setSilhouettePoints(activeSilhouettes);
  });

  if (!objetoSeleccionado || !furnitureGroup || silhouettePoints.length === 0) return null;

  return (
    <group ref={outlineGroupRef} position={furnitureGroup.position} renderOrder={200}>
      {silhouettePoints.map((pts, idx) => (
        <Line
          key={`sil-${idx}`}
          points={pts}
          color={modoTransformacion === "grab" ? "#111827" : "#ff9500"}
          lineWidth={4.0}
          toneMapped={false}
          renderOrder={200}
          depthTest={false}
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
      // 🎯 CLIC DERECHO INSTANTÁNEO (0ms de latencia en la primera pulsación)
      if (e.button === 2) {
        if (modoTransformacion === "grab") {
          cancelarGrab();
          return;
        }

        const hoveredInstId = typeof window !== "undefined" ? (window as any).__hoveredInstanceId : null;
        if (hoveredInstId && use3BFStore.getState().instancias[hoveredInstId]) {
          seleccionarInstancia(hoveredInstId);
        } else {
          const currentHover = use3BFStore.getState().hoveredPiece;
          if (currentHover !== null) {
            setObjetoSeleccionado(true);
          } else {
            seleccionarInstancia(null);
          }
        }
      } else if (e.button === 0) {
        // 🎯 CLIC IZQUIERDO
        if (modoTransformacion === "none") {
          const currentHover = use3BFStore.getState().hoveredPiece;
          if (currentHover === null) {
            seleccionarInstancia(null);
          }
        } else if (modoTransformacion === "grab") {
          // ⚠️ Si está eligiendo punto de snap (B), NO confirmar ni deseleccionar
          if (use3BFStore.getState().snapPicking) return;
          if (typeof window !== "undefined" && (window as any).__lastSnapSelectTime) {
            if (Date.now() - (window as any).__lastSnapSelectTime < 400) return;
          }
          confirmarGrab();
        }
      }
    };

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault(); // Prevenir menú nativo del navegador

      if (modoTransformacion === "grab") {
        if (use3BFStore.getState().snapPicking) return;
        cancelarGrab();
        return;
      }

      const hoveredInstId = typeof window !== "undefined" ? (window as any).__hoveredInstanceId : null;
      if (hoveredInstId && use3BFStore.getState().instancias[hoveredInstId]) {
        seleccionarInstancia(hoveredInstId);
      } else {
        const currentHover = use3BFStore.getState().hoveredPiece;
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

function extractCandidatePoints(furnitureGroup: THREE.Group) {
  let boardMesh: THREE.Object3D | null = null;
  furnitureGroup.traverse((child) => {
    if (!boardMesh && (child as THREE.Mesh).isMesh && (child.name.includes("MDP") || child.name.includes("Cubierta"))) {
      boardMesh = child;
    }
  });

  const targetObj = boardMesh || furnitureGroup;
  targetObj.updateWorldMatrix(true, true);
  furnitureGroup.updateWorldMatrix(true, true);

  const worldBox = new THREE.Box3().setFromObject(targetObj);
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

function SnapPointMarkers({ furnitureGroup }: { furnitureGroup: THREE.Group | null }) {
  const { snapPicking, snapBasePoint, snapTargetPoint, setSnapBasePoint, modoTransformacion, posicionObjeto, objetoActivoId } = use3BFStore();
  const { camera, raycaster, gl } = useThree();
  const [hoveredPoint, setHoveredPoint] = React.useState<{ pos: [number, number, number]; tipo: "corner" | "midpoint" } | null>(null);
  const snapGroupRef = useRef<THREE.Group>(null);
  const lastSnapBboxKeyRef = useRef<string>("");
  const candidatePointsRef = useRef<Array<{ pos: [number, number, number]; tipo: "corner" | "midpoint" }>>([]);

  // 2. Detectar punto más cercano al rayo del mouse solo cuando snapPicking (B) está activo
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
    let boardMesh: THREE.Object3D | null = null;
    furnitureGroup.traverse((child) => {
      if (!boardMesh && (child as THREE.Mesh).isMesh && (child.name.includes("MDP") || child.name.includes("Cubierta"))) {
        boardMesh = child;
      }
    });

    const targetObj = boardMesh || furnitureGroup;
    targetObj.updateWorldMatrix(true, true);
    furnitureGroup.updateWorldMatrix(true, true);

    const worldBox = new THREE.Box3().setFromObject(targetObj);
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
    if (candidatePoints.length === 0) {
      if (hoveredPoint !== null) setHoveredPoint(null);
      return;
    }

    let closestPoint: { pos: [number, number, number]; tipo: "corner" | "midpoint" } | null = null;
    let minDistance = 0.055; // Umbral de 55mm de proximidad del cursor

    for (const pt of candidatePoints) {
      const worldPos = new THREE.Vector3(...pt.pos).add(groupWorldPos);
      const dist = raycaster.ray.distanceToPoint(worldPos);
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

  // 3. Listener para capturar el clic izquierdo sobre el punto detectado (Endpoint □ o Midpoint △)
  React.useEffect(() => {
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
                    fill="#ff9500"
                    stroke="#ffffff"
                    strokeWidth="1.5"
                    style={{ filter: "drop-shadow(0 0 2px rgba(0,0,0,0.6))" }}
                  />
                ) : (
                  <polygon
                    points="0,-6 6,5 -6,5"
                    fill="#ff9500"
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
                  fill="#ff9500"
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
                  fill="#ff9500"
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
                  fill="#ff9500"
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

function GuidelineAxes() {
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

function TransformSnappingController() {
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

      // =========================================================================
      // 🎯 SNAPPING INTER-GEOMETRÍAS (Destino hacia otras geometrías en el escenario)
      // =========================================================================
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

function SingleFurnitureInstanceMesh({ 
  inst, 
  isSelected, 
  setFurnitureGroup 
}: { 
  inst: ObjetoInstancia3BF; 
  isSelected: boolean; 
  setFurnitureGroup?: (g: THREE.Group | null) => void;
}) {
  const { modoVisual, posicionObjeto, modoTransformacion } = use3BFStore();
  const meshRef = useRef<THREE.Group>(null);

  React.useEffect(() => {
    if (isSelected && meshRef.current && setFurnitureGroup) {
      setFurnitureGroup(meshRef.current);
    }
  }, [isSelected, inst.resultado, setFurnitureGroup]);

  // Registro de grupo de instancia para detección de snapping inter-geometrías
  React.useEffect(() => {
    if (meshRef.current && typeof window !== "undefined") {
      if (!(window as any).__3bfInstanceGroups) {
        (window as any).__3bfInstanceGroups = new Map<string, THREE.Group>();
      }
      (window as any).__3bfInstanceGroups.set(inst.id, meshRef.current);
    }
    return () => {
      if (typeof window !== "undefined" && (window as any).__3bfInstanceGroups) {
        (window as any).__3bfInstanceGroups.delete(inst.id);
      }
    };
  }, [inst.id, inst.resultado]);

  if (!inst.resultado?.real_meshes || inst.resultado.real_meshes.length === 0) {
    return null;
  }

  const isModelCubierta = inst.definitionId.toLowerCase().includes("cubierta");
  const parentBoardGroupName = isModelCubierta ? "Cubierta" : "Tableros";
  const mainColor = inst.parametros.color_acabado || "#0088aa";

  const namesWith2 = new Set(inst.resultado.real_meshes.filter((m: any) => m.name.endsWith("2")).map((m: any) => m.name.slice(0, -1)));
  const cleanRealMeshes = inst.resultado.real_meshes.filter((m: any) => {
    if (!m.name.endsWith("2") && namesWith2.has(m.name)) {
      return false;
    }
    return true;
  });

  const hasTexturedMeshes = cleanRealMeshes.some((m: any) => {
    const n = m.name.toLowerCase();
    return n.includes("color") || n.includes("balance") || (n.includes("mdp") && !n.includes("nurbs"));
  });

  const boardMeshes = cleanRealMeshes.filter((m: any) => {
    const n = m.name.toLowerCase();
    if (hasTexturedMeshes && (n.includes("nurbs") || m.is_nurbs_solid)) {
      return false;
    }
    return n.includes("cubierta") || n.includes("mdp") || n.includes("balance") || n.includes("entrepaño") || n.includes("madera") || n.includes("board");
  });

  const hardwareMeshes = cleanRealMeshes.filter((m: any) => {
    const n = m.name.toLowerCase();
    return (n.includes("perno") || n.includes("caja") || n.includes("tarugo") || n.includes("tornillo") || n.includes("soporte")) && !n.includes("cajon") && !n.includes("cajón");
  });

  const machiningMeshes = cleanRealMeshes.filter((m: any) => 
    m.name.toLowerCase().includes("maquinados") || m.name.toLowerCase().includes("machining")
  );

  const otherMeshes = cleanRealMeshes.filter((m: any) => 
    !boardMeshes.includes(m) && !hardwareMeshes.includes(m) && !machiningMeshes.includes(m)
  );

  const currentPos = isSelected && modoTransformacion === "grab" ? posicionObjeto : inst.posicion;

  return (
    <group 
      ref={meshRef} 
      position={currentPos} 
      name={inst.nombreVisible}
    >
      {boardMeshes.length > 0 && (
        <group name={parentBoardGroupName}>
          {boardMeshes.map((m: any, idx: number) => (
            <BoardMesh
              key={`board-${idx}`}
              instanciaId={inst.id}
              position={m.position}
              size={m.size}
              name={m.name}
              mainColor={mainColor}
              modoVisual={modoVisual}
              vertices={m.vertices}
              indices={m.indices}
              uvs={m.uvs}
              tipoMapeado={m.name.includes("Cubierta") ? inst.parametros.tipo_mapeado_cubierta : inst.parametros.tipo_mapeado_entrepanio}
            />
          ))}
        </group>
      )}

      {hardwareMeshes.length > 0 && (
        <group name="Herrajes">
          {hardwareMeshes.map((m: any, idx: number) => (
            <BoardMesh
              key={`hardware-${idx}`}
              instanciaId={inst.id}
              position={m.position}
              size={m.size}
              name={m.name}
              mainColor={mainColor}
              modoVisual={modoVisual}
              vertices={m.vertices}
              indices={m.indices}
              uvs={m.uvs}
              tipoMapeado={m.name.includes("Cubierta") ? inst.parametros.tipo_mapeado_cubierta : inst.parametros.tipo_mapeado_entrepanio}
            />
          ))}
        </group>
      )}

      {machiningMeshes.length > 0 && (
        <group name="Maquinados">
          {machiningMeshes.map((m: any, idx: number) => (
            <BoardMesh
              key={`machining-${idx}`}
              instanciaId={inst.id}
              position={m.position}
              size={m.size}
              name={m.name}
              mainColor={mainColor}
              modoVisual={modoVisual}
              vertices={m.vertices}
              indices={m.indices}
              uvs={m.uvs}
              tipoMapeado={m.name.includes("Cubierta") ? inst.parametros.tipo_mapeado_cubierta : inst.parametros.tipo_mapeado_entrepanio}
            />
          ))}
        </group>
      )}

      {otherMeshes.length > 0 && (
        <group name="Otros">
          {otherMeshes.map((m: any, idx: number) => (
            <BoardMesh
              key={`other-${idx}`}
              instanciaId={inst.id}
              position={m.position}
              size={m.size}
              name={m.name}
              mainColor={mainColor}
              modoVisual={modoVisual}
              vertices={m.vertices}
              indices={m.indices}
              tipoMapeado={m.name.includes("Cubierta") ? inst.parametros.tipo_mapeado_cubierta : inst.parametros.tipo_mapeado_entrepanio}
            />
          ))}
        </group>
      )}
    </group>
  );
}

function ParametricFurnitureMesh({ setFurnitureGroup }: { setFurnitureGroup: (g: THREE.Group | null) => void }) {
  const { instancias, objetoActivoId, parametros, resultado } = use3BFStore();

  const listaInstancias = Object.values(instancias);

  if (listaInstancias.length > 0) {
    return (
      <>
        {listaInstancias.map((inst) => (
          <SingleFurnitureInstanceMesh
            key={inst.id}
            inst={inst}
            isSelected={inst.id === objetoActivoId}
            setFurnitureGroup={inst.id === objetoActivoId ? setFurnitureGroup : undefined}
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
    />
  );
}

function BlenderNavigationController({ controlsRef }: { controlsRef: React.RefObject<any> }) {
  const { camera, gl } = useThree();
  const { modoTransformacion } = use3BFStore();

  React.useEffect(() => {
    const domElement = gl.domElement;
    let isMiddleDragging = false;
    let isCtrlZooming = false;
    let isShiftPanning = false;
    let prevY = 0;
    let prevX = 0;

    const handlePointerDown = (e: PointerEvent) => {
      if (e.button === 1) {
        isMiddleDragging = true;
        prevX = e.clientX;
        prevY = e.clientY;

        if (e.ctrlKey || e.metaKey) {
          isCtrlZooming = true;
          isShiftPanning = false;
          if (controlsRef.current) controlsRef.current.enabled = false;
        } else if (e.shiftKey) {
          isShiftPanning = true;
          isCtrlZooming = false;
          if (controlsRef.current) controlsRef.current.enabled = false;
        } else {
          isCtrlZooming = false;
          isShiftPanning = false;
          if (controlsRef.current && modoTransformacion !== "grab") {
            controlsRef.current.enabled = true;
          }
        }
      }
    };

    const handlePointerMove = (e: PointerEvent) => {
      if (!isMiddleDragging) return;

      const deltaX = e.clientX - prevX;
      const deltaY = e.clientY - prevY;
      prevX = e.clientX;
      prevY = e.clientY;

      const controls = controlsRef.current;
      if (!controls) return;

      if (isCtrlZooming) {
        // Zoom in si deltaY < 0 (hacia arriba acerca), Zoom out si deltaY > 0 (hacia abajo aleja)
        const target = controls.target || new THREE.Vector3(0, 0, 0);
        const offset = camera.position.clone().sub(target);
        const currentDist = offset.length();

        const zoomSpeed = 0.007;
        const scaleFactor = Math.max(0.1, 1.0 + (deltaY * zoomSpeed));
        
        const minD = controls.minDistance || 0.2;
        const maxD = controls.maxDistance || 20.0;
        const newDist = Math.max(minD, Math.min(maxD, currentDist * scaleFactor));
        
        offset.setLength(newDist);
        camera.position.copy(target).add(offset);
        camera.updateProjectionMatrix();
        controls.update();
      } else if (isShiftPanning) {
        const target = controls.target || new THREE.Vector3(0, 0, 0);
        const offset = camera.position.clone().sub(target);
        const panSpeed = Math.max(0.0005, offset.length() * 0.0012);

        const vRight = new THREE.Vector3(1, 0, 0).applyQuaternion(camera.quaternion).multiplyScalar(-deltaX * panSpeed);
        const vUp = new THREE.Vector3(0, 1, 0).applyQuaternion(camera.quaternion).multiplyScalar(deltaY * panSpeed);

        camera.position.add(vRight).add(vUp);
        target.add(vRight).add(vUp);
        camera.updateProjectionMatrix();
        controls.update();
      }
    };

    const handlePointerUp = (e: PointerEvent) => {
      if (e.button === 1) {
        isMiddleDragging = false;
        isCtrlZooming = false;
        isShiftPanning = false;
        if (controlsRef.current && modoTransformacion !== "grab") {
          controlsRef.current.enabled = true;
        }
      }
    };

    domElement.addEventListener("pointerdown", handlePointerDown, { capture: true });
    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);

    return () => {
      domElement.removeEventListener("pointerdown", handlePointerDown, { capture: true });
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };
  }, [camera, gl, controlsRef, modoTransformacion]);

  return null;
}

function CameraRefBridge({ cameraRef }: { cameraRef: React.MutableRefObject<THREE.Camera | null> }) {
  const { camera } = useThree();
  React.useEffect(() => {
    cameraRef.current = camera;
  }, [camera, cameraRef]);
  return null;
}

export default function Viewer3D() {
  const controlsRef = useRef<any>(null);
  const cameraRef = useRef<THREE.Camera | null>(null);
  const {
    tema,
    resultado,
    calibracion,
    escenarioLimpio,
    parametros,
    hoveredPiece,
    setMostrarNPanel,
    objetoSeleccionado,
    setObjetoSeleccionado,
    modoTransformacion,
    posicionObjeto,
    iniciarGrab,
    confirmarGrab,
    cancelarGrab,
    ejeBloqueado,
    setEjeBloqueado,
    snapActivo,
    snapPicking,
    snapBasePoint,
    toggleSnapMode,
  } = use3BFStore();

  const [furnitureGroup, setFurnitureGroup] = React.useState<THREE.Group | null>(null);
  const [mousePos, setMousePos] = React.useState({ x: 0, y: 0 });
  const [rhinoAxes, setRhinoAxes] = React.useState({
    x: { x: 22, y: 0 },
    y: { x: -8, y: -12 },
    z: { x: 0, y: -22 },
  });
  const containerRef = useRef<HTMLDivElement>(null);

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

      // Atajo N: Toggle N-Panel
      if ((e.key === "n" || e.key === "N") && !e.ctrlKey && !e.altKey && !e.metaKey && modoTransformacion !== "grab") {
        e.preventDefault();
        setMostrarNPanel((prev) => !prev);
        return;
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
  ]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    setMousePos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  const exportToGLB = () => {
    if (!furnitureGroup) {
      alert("Espera a que el modelo esté cargado en pantalla para exportar.");
      return;
    }
    
    import("three/examples/jsm/exporters/GLTFExporter.js").then(({ GLTFExporter }) => {
      const exporter = new GLTFExporter();
      const clone = furnitureGroup.clone();
      
      const linesToRemove: THREE.Object3D[] = [];
      clone.traverse((child) => {
        const c = child as any;
        if (c.isLine || c.isLineSegments) {
          linesToRemove.push(child);
        }
      });
      linesToRemove.forEach((line) => {
        if (line.parent) {
          line.parent.remove(line);
        }
      });

      exporter.parse(
        clone,
        (gltf) => {
          const blob = new Blob([gltf as ArrayBuffer], { type: "application/octet-stream" });
          const link = document.createElement("a");
          link.href = URL.createObjectURL(blob);
          link.download = `${parametros.model_id || "mueble"}.glb`;
          link.click();
        },
        (error) => {
          console.error("Error al exportar GLB:", error);
        },
        { binary: true }
      );
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
      <NPanel />

      {/* Indicador visual de Zona de Suelta (Drop Zone) */}
      {isDraggingOver && (
        <div className="absolute inset-2 z-40 rounded-xl border-2 border-dashed border-cyan-400 bg-cyan-500/10 backdrop-blur-xs flex items-center justify-center pointer-events-none transition-all">
          <div className="bg-slate-950/80 text-cyan-300 font-bold text-xs px-4 py-2 rounded-full border border-cyan-500/50 shadow-xl flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
            <span>Soltar para abrir modelo en el escenario 3D</span>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 🎮 HUD MODAL DE TRANSFORMACIÓN ESTILO BLENDER (G / B / X / Y / Z)           */}
      {/* ========================================================================= */}
      {modoTransformacion === "grab" && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 bg-slate-950/90 dark:bg-[#0B0F17]/95 backdrop-blur-md text-white px-5 py-2.5 rounded-2xl border border-amber-500/80 shadow-2xl flex items-center gap-4 text-xs font-sans animate-in fade-in zoom-in-95 pointer-events-auto">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />
            <span className="font-bold text-amber-300 uppercase tracking-wider">Modo Mover (G)</span>
          </div>

          <div className="h-4 w-px bg-white/20" />

          {/* Selector de Eje */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400">Eje:</span>
            <span className={`px-2 py-0.5 rounded font-mono font-bold ${
              ejeBloqueado === "X" ? "bg-red-500 text-white" :
              ejeBloqueado === "Y" ? "bg-green-500 text-white" :
              ejeBloqueado === "Z" ? "bg-blue-500 text-white" :
              "bg-white/10 text-slate-300"
            }`}>
              {ejeBloqueado === "none" ? "Libre (X/Y/Z)" : `Eje ${ejeBloqueado}`}
            </span>
          </div>

          <div className="h-4 w-px bg-white/20" />

          {/* Estado de Snap */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400">Snap [B]:</span>
            <span className={`px-2 py-0.5 rounded font-bold transition-all ${
              snapPicking 
                ? "bg-amber-500 text-slate-950 animate-pulse shadow-sm" 
                : snapBasePoint 
                ? "bg-emerald-500 text-white shadow-sm" 
                : "bg-white/10 text-slate-400"
            }`}>
              {snapPicking ? "Elige vértice (□) o mitad (△)" : snapBasePoint ? "Punto Base Fijado" : "Inactivo"}
            </span>
          </div>

          <div className="h-4 w-px bg-white/20" />

          {/* Coordenadas Vivas */}
          <div className="text-[11px] font-mono text-slate-300">
            <span>X: {posicionObjeto[0]}m</span> | <span>Y: {posicionObjeto[1]}m</span> | <span>Z: {posicionObjeto[2]}m</span>
          </div>

          <div className="h-4 w-px bg-white/20" />

          {/* Acciones */}
          <div className="flex items-center gap-2 text-[11px]">
            <button
              onClick={(e) => { e.stopPropagation(); confirmarGrab(); }}
              className="bg-emerald-600 hover:bg-emerald-500 text-white px-2 py-0.5 rounded border border-emerald-400/40 cursor-pointer"
            >
              Clic Izq / Enter: Fijar
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); cancelarGrab(); }}
              className="bg-rose-600 hover:bg-rose-500 text-white px-2 py-0.5 rounded border border-rose-400/40 cursor-pointer"
            >
              Esc / Clic Der: Cancelar
            </button>
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
          className="absolute border-2 bg-slate-900/80 dark:bg-[#0D1117]/80 backdrop-blur-md text-white text-xs px-4 py-1.5 rounded-xl font-sans font-bold shadow-lg z-20 pointer-events-none transition-all duration-75 text-center min-w-[80px]"
        >
          {hoveredPiece}
        </div>
      )}

      <Canvas
        camera={{ position: [0.6, 0.9, 1.1], fov: 45 }}
        shadows
        gl={{ preserveDrawingBuffer: true, antialias: true }}
      >
        <color attach="background" args={[tema === "obsidian" ? "#0D1117" : "#F3F4F6"]} />
        <CameraRefBridge cameraRef={cameraRef} />
        <RaycastHandler />
        <ambientLight intensity={calibracion.intensidadLuzAmbiental} />
        <directionalLight 
          position={[5, 8, 5]} 
          intensity={calibracion.intensidadLuzDirecta} 
          castShadow 
          shadow-mapSize={[1024, 1024]} 
        />
        <directionalLight position={[-5, 5, -5]} intensity={0.3} />
        
        {!escenarioLimpio && (
          <>
            <ParametricFurnitureMesh setFurnitureGroup={setFurnitureGroup} />
            <SnapPointMarkers furnitureGroup={furnitureGroup} />
            <GuidelineAxes />
            <TransformSnappingController />
            <SelectionController />
            <BoardSilhouetteOutline furnitureGroup={furnitureGroup} />
          </>
        )}

        {calibracion.mostrarGrilla && (
          <Grid
            renderOrder={-10}
            position={[0, -0.001, 0]}
            args={[10, 10]}
            cellSize={calibracion.distanciaCuadricula}
            cellThickness={calibracion.grosorGrillaDelgada}
            cellColor={calibracion.colorGrillaDelgada}
            sectionSize={calibracion.distanciaSeccion}
            sectionThickness={calibracion.grosorGrillaGruesa}
            sectionColor={calibracion.colorGrillaGruesa}
            fadeDistance={8}
            infiniteGrid
          />
        )}
        <GroundInfiniteAxes />
        <BlenderNavigationController controlsRef={controlsRef} />
        <OrbitControls 
          ref={controlsRef}
          makeDefault 
          enabled={modoTransformacion !== "grab"} 
          target={[0.25, 0, -0.24]} 
          minDistance={0.5} 
          maxDistance={6} 
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

      <div className="absolute bottom-3 left-3 pointer-events-none z-10 select-none flex items-center justify-center p-1">
        <svg width="68" height="68" viewBox="0 0 68 68" className="overflow-visible">
          <line
            x1="34"
            y1="34"
            x2={34 + rhinoAxes.x.x}
            y2={34 + rhinoAxes.x.y}
            stroke={calibracion.colorEjeX || (tema === "obsidian" ? "#94a3b8" : "#475569")}
            strokeWidth="1.6"
            strokeLinecap="round"
          />
          <text
            x={34 + rhinoAxes.x.x * 1.3}
            y={34 + rhinoAxes.x.y * 1.3 + 4}
            fill={tema === "obsidian" ? "#cbd5e1" : "#334155"}
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
            stroke={calibracion.colorEjeY || (tema === "obsidian" ? "#94a3b8" : "#475569")}
            strokeWidth="1.6"
            strokeLinecap="round"
          />
          <text
            x={34 + rhinoAxes.y.x * 1.3}
            y={34 + rhinoAxes.y.y * 1.3 + 4}
            fill={tema === "obsidian" ? "#cbd5e1" : "#334155"}
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
            stroke={tema === "obsidian" ? "#94a3b8" : "#475569"}
            strokeWidth="1.6"
            strokeLinecap="round"
          />
          <text
            x={34 + rhinoAxes.z.x * 1.3}
            y={34 + rhinoAxes.z.y * 1.3 + 4}
            fill={tema === "obsidian" ? "#cbd5e1" : "#334155"}
            fontSize="11"
            fontFamily="Inter, -apple-system, sans-serif"
            fontWeight="700"
            textAnchor="middle"
          >
            z
          </text>
        </svg>
      </div>

      <div className="absolute bottom-3 left-24 bg-black/60 backdrop-blur-md text-white text-xs px-3 py-1.5 rounded-full border border-white/10 flex items-center gap-2 pointer-events-none shadow-lg">
        {resultado?.real_meshes && resultado.real_meshes.length > 0 ? (
          <>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-semibold text-emerald-300">Geometría Real de Grasshopper (Rhino 8 Engine)</span>
          </>
        ) : (
          <>
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
            <span>3BF WebGL Viewer (R3F Engine)</span>
          </>
        )}
      </div>

      {/* Botón Descargar GLB */}
      {resultado?.real_meshes && resultado.real_meshes.length > 0 && (
        <button
          onClick={exportToGLB}
          className="absolute bottom-3 right-3 bg-cyan-600 hover:bg-cyan-500 text-white text-xs px-4 py-2 rounded-full font-bold shadow-lg border border-cyan-400 transition-all flex items-center gap-2 cursor-pointer hover:scale-105 z-10"
        >
          <Download className="w-3.5 h-3.5" /> Descargar GLB
        </button>
      )}
    </div>
  );
}
