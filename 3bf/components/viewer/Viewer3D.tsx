"use client";

import React, { useRef } from "react";
import { Canvas, useThree, useFrame } from "@react-three/fiber";
import { OrbitControls, Grid, Stage, Edges } from "@react-three/drei";
import { use3BFStore } from "@/lib/store";
import * as THREE from "three";
import { Download } from "lucide-react";

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

import CalibrationPanel from "./CalibrationPanel";

function obtenerNombreUnificadoPieza(obj: THREE.Object3D): string {
  const meshName = (obj.name || "").replace("RH_OUT:", "").trim();
  const parentName = obj.parent ? obj.parent.name : "";
  const meshNameLower = meshName.toLowerCase();
  const parentNameLower = parentName.toLowerCase();

  // 1. Si es un tablero / cubierta (grupo padre "Cubierta" o nombre que incluye "cubierta", "mdp", "balance", "color")
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

  // Fallback limpio sin números sufijos tipo .001 o 2 al final
  return meshName.replace(/\.\d+$/, "").replace(/\d+$/, "").trim();
}

function RaycastHandler() {
  const { raycaster, scene } = useThree();
  const { setHoveredPiece } = use3BFStore();

  useFrame(() => {
    // Evaluar raycast centralizado contra todos los objetos de la escena frame a frame
    const intersects = raycaster.intersectObjects(scene.children, true);
    
    // Buscar la primera malla física visible con un nombre válido de Grasshopper
    const validHit = intersects.find((hit) => {
      const obj = hit.object;
      const name = obj.name || "";
      return (
        obj.type === "Mesh" && 
        obj.visible && 
        name.length > 0 &&
        !name.toLowerCase().includes("floor") &&
        !name.toLowerCase().includes("grid") &&
        !name.toLowerCase().includes("plane")
      );
    });

    if (validHit) {
      const nombreUnificado = obtenerNombreUnificadoPieza(validHit.object);
      setHoveredPiece(nombreUnificado);
    } else {
      setHoveredPiece(null);
    }
  });

  return null;
}

function RhinoAxisTracker({ onUpdate }: { onUpdate: (axes: { x: { x: number; y: number }, y: { x: number; y: number }, z: { x: number; y: number } }) => void }) {
  const { camera } = useThree();

  useFrame(() => {
    // Rhino X: (+1, 0, 0)
    // Rhino Y: (0, 0, -1) (Profundidad horizontal hacia el fondo)
    // Rhino Z: (0, +1, 0) (Altura vertical)
    const qInv = camera.quaternion.clone().invert();
    const vX = new THREE.Vector3(1, 0, 0).applyQuaternion(qInv);
    const vY = new THREE.Vector3(0, 0, -1).applyQuaternion(qInv);
    const vZ = new THREE.Vector3(0, 1, 0).applyQuaternion(qInv);

    const len = 25; // Longitud del brazo en píxeles

    onUpdate({
      x: { x: vX.x * len, y: -vX.y * len },
      y: { x: vY.x * len, y: -vY.y * len },
      z: { x: vZ.x * len, y: -vZ.y * len },
    });
  });

  return null;
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
}) {
  const { calibracion } = use3BFStore();

  // 1. Cargar Textura PBR Marfil / Bitmap Personalizado (HOOK - SIEMPRE PRIMERO)
  const loadedTexture = useMarfilTexture(calibracion.customTextureUrl, tipoMapeado);

  // 2. Malla Poligonal 3D Real & Aristas (HOOKS - SIEMPRE ANTES DE RETURNS CONDICIONALES)
  const { customGeometry, edgesGeometry } = React.useMemo(() => {
    if (vertices && indices && vertices.length > 0 && indices.length > 0) {
      // 1. Malla Indexada para la generación limpia de Aristas Negras sin duplicados
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

      // Si la malla ya trae coordenadas UV nativas asignadas por Grasshopper (BoxMapping)
      if (grasshopperUvs && grasshopperUvs.length > 0) {
        indexedGeo.setAttribute("uv", new THREE.Float32BufferAttribute(grasshopperUvs, 2));
        const geo = indexedGeo.toNonIndexed();
        geo.computeVertexNormals();
        geo.computeBoundingBox();
        geo.computeBoundingSphere();
        return { customGeometry: geo, edgesGeometry: edges };
      }

      // 2. Malla No-Indexada para Normales de Cara 100% Perpendiculares (Sin Gradientes de Sombra ni Costuras)
      const geo = indexedGeo.toNonIndexed();
      geo.computeVertexNormals();
      geo.computeBoundingBox();
      geo.computeBoundingSphere();

      const posAttr = geo.attributes.position;

      const uvs = new Float32Array(posAttr.count * 2);

      let minX = Infinity, minY = Infinity, minZ = Infinity;
      for (let i = 0; i < posAttr.count; i++) {
        const x = posAttr.getX(i);
        const y = posAttr.getY(i);
        const z = posAttr.getZ(i);
        if (x < minX) minX = x;
        if (y < minY) minY = y;
        if (z < minZ) minZ = z;
      }

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

        // Proyección Triplanar UV estable (Veta longitudinal de melamina Marfil)
        for (let j = 0; j < 3; j++) {
          const idx = i + j;
          const x = posAttr.getX(idx);
          const y = posAttr.getY(idx);
          const z = posAttr.getZ(idx);

          if (absY >= absX && absY >= absZ) {
            // Cara Superior e Inferior del Tablero (Plano XZ continuo para la veta de madera)
            uvs[idx * 2] = x * 1.5;
            uvs[idx * 2 + 1] = z * 1.5;
          } else if (absX >= absY && absX >= absZ) {
            // Cara Lateral Izquierda / Derecha (Plano ZY continuo)
            uvs[idx * 2] = z * 1.5;
            uvs[idx * 2 + 1] = y * 1.5;
          } else {
            // Cara Frontal / Trasera (Plano XY continuo)
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

  // Identificar tipo de objeto para asignar color y material de manufactura DfMA
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
    meshColor = "#9CA3AF"; // Plateado metálico
    metalness = 0.85;
    roughness = 0.25;
    opacity = 1.0;
    transparent = false;
  } else if (isHardwareCaja) {
    meshColor = "#D97706"; // Zinc / Dorado Minifix
    metalness = 0.75;
    roughness = 0.3;
    opacity = 1.0;
    transparent = false;
  } else if (isHardwareTarugo) {
    meshColor = "#B45309"; // Madera Haya Tarugo
    metalness = 0.0;
    roughness = 0.8;
    opacity = 1.0;
    transparent = false;
  } else if (isMachining) {
    meshColor = "#EF4444"; // Rojo CNC Maquinados
    metalness = 0.2;
    roughness = 0.5;
    opacity = 0.6;
    transparent = true;
  } else if (isTapaLuz) {
    meshColor = "#1F2937"; // Regleta oscura de sombra / moldura frontal
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

  // En modo Sólido o Renderizado, ocultar sólamente los volúmenes rojos de Maquinado CNC (que no son herrajes físicos)
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
      meshColor = calibracion.colorSolido; // Color calibrable (default #9CA3AF)
      opacity = calibracion.opacidadMadera;
      transparent = opacity < 1.0;
    } else if (modoVisual === "renderizado") {
      opacity = calibracion.opacidadMadera;
      transparent = opacity < 1.0;
    }
  }

  const activeMap = (isWoodBoard && isMelaminaCara && (calibracion.customTextureUrl || isRenderedMode)) ? loadedTexture : null;
  const hasMap = activeMap !== null;

  // Si hay mapa de textura activo (imagen subida o modo renderizado), ignorar el color gris base y forzar blanco puro #ffffff
  let finalMeshColor = hasMap ? "#ffffff" : (modoVisual === "solido" ? calibracion.colorSolido : meshColor);

  if (modoVisual === "renderizado" && isWoodBoard) {
    if (isMdpExpuesto) {
      finalMeshColor = "#D5B88A"; // Color madera aglomerada/viruta prensada
    } else if (isBalance) {
      finalMeshColor = "#F9FAFB"; // Blanco/gris de balance limpio
    }
  }

  if (customGeometry) {
    return (
      <mesh 
        position={position}
        name={cleanName}
        geometry={customGeometry}
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
        {edgesGeometry && calibracion.mostrarAristas && (
          <lineSegments geometry={edgesGeometry}>
            <lineBasicMaterial
              color={calibracion.colorAristas}
              linewidth={1}
              depthTest={true}
              depthWrite={true}
              transparent={false}
              opacity={1.0}
              polygonOffset={true}
              polygonOffsetFactor={1}
              polygonOffsetUnits={1}
            />
          </lineSegments>
        )}
      </mesh>
    );
  }

  return (
    <mesh
      position={position}
      name={cleanName}
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
      {boxEdgesGeometry && calibracion.mostrarAristas && (
        <lineSegments geometry={boxEdgesGeometry}>
          <lineBasicMaterial
            color={calibracion.colorAristas}
            linewidth={1}
            depthTest={true}
            depthWrite={true}
            transparent={false}
            opacity={1.0}
            polygonOffset={true}
            polygonOffsetFactor={1}
            polygonOffsetUnits={1}
          />
        </lineSegments>
      )}
    </mesh>
  );
}

function ParametricFurnitureMesh({ setFurnitureGroup }: { setFurnitureGroup: (g: THREE.Group | null) => void }) {
  const { parametros, resultado, modoVisual } = use3BFStore();
  const meshRef = useRef<THREE.Group>(null);

  React.useEffect(() => {
    if (meshRef.current) {
      setFurnitureGroup(meshRef.current);
    }
    return () => setFurnitureGroup(null);
  }, [resultado, setFurnitureGroup]);

  // Si no hay modelo seleccionado (estado inicial / vacío), no renderizar ningún mueble en el escenario
  if (!parametros.model_id) {
    return null;
  }

  // Convertir milímetros a unidades de Three.js (metros: 1000mm = 1m)
  const width = parametros.ancho / 1000;
  const height = parametros.alto / 1000;
  const depth = parametros.profundidad / 1000;
  const thickness = (parametros.espesor_madera || 15) / 1000;
  
  const mainColor = parametros.color_acabado || "#0088aa";

  // RENDERIZADO 100% REAL DE GRASSHOPPER (Rhino 8 RhinoCompute Engine)
  if (resultado?.real_meshes && resultado.real_meshes.length > 0) {
    const isModelCubierta = parametros.model_id.toLowerCase().includes("cubierta");
    const parentBoardGroupName = isModelCubierta ? "Cubierta" : "Tableros";

    // 1. Deduplicar globalmente la lista total de mallas reales: si existe una versión "X2", eliminar la versión obsoleta "X"
    const namesWith2 = new Set(resultado.real_meshes.filter((m: any) => m.name.endsWith("2")).map((m: any) => m.name.slice(0, -1)));
    const cleanRealMeshes = resultado.real_meshes.filter((m: any) => {
      if (!m.name.endsWith("2") && namesWith2.has(m.name)) {
        return false; // Descartar la versión obsoleta duplicada de toda la escena
      }
      return true;
    });

    // 2. Separar mallas limpias en grupos estructurados
    // Si la escena ya contiene mallas texturizadas (Color, Balance, MDP), reservamos los sólidos NURBS para CAM/DXF y BOM para evitar duplicados visuales
    const hasTexturedMeshes = cleanRealMeshes.some((m: any) => {
      const n = m.name.toLowerCase();
      return n.includes("color") || n.includes("balance") || (n.includes("mdp") && !n.includes("nurbs"));
    });

    const boardMeshes = cleanRealMeshes.filter((m: any) => {
      const n = m.name.toLowerCase();
      if (hasTexturedMeshes && (n.includes("nurbs") || m.is_nurbs_solid)) {
        return false; // Evita superposición visual del sólido NURBS con la malla texturizada
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

    // Mallas sobrantes legítimas (fallbacks verdaderos)
    const otherMeshes = cleanRealMeshes.filter((m: any) => 
      !boardMeshes.includes(m) && !hardwareMeshes.includes(m) && !machiningMeshes.includes(m)
    );

    return (
      <group ref={meshRef} position={[0, 0, 0]} name="Mueble Parametrico">
        {/* Grupo Padre: Tableros / Cubierta */}
        {boardMeshes.length > 0 && (
          <group name={parentBoardGroupName}>
            {boardMeshes.map((m: any, idx: number) => {
              const isDecorative = m.name.toLowerCase().includes("color") || m.name.toLowerCase().includes("balance");
              return (
                <BoardMesh
                  key={`board-${idx}`}
                  position={m.position}
                  size={m.size}
                  name={m.name}
                  mainColor={mainColor}
                  modoVisual={modoVisual}
                  vertices={m.vertices}
                  indices={m.indices}
                  uvs={m.uvs}
                  tipoMapeado={m.name.includes("Cubierta") ? parametros.tipo_mapeado_cubierta : parametros.tipo_mapeado_entrepanio}
                />
              );
            })}
          </group>
        )}

        {/* Grupo Padre: Herrajes */}
        {hardwareMeshes.length > 0 && (
          <group name="Herrajes">
            {hardwareMeshes.map((m: any, idx: number) => (
              <BoardMesh
                key={`hardware-${idx}`}
                position={m.position}
                size={m.size}
                name={m.name}
                mainColor={mainColor}
                modoVisual={modoVisual}
                vertices={m.vertices}
                indices={m.indices}
                uvs={m.uvs}
                tipoMapeado={m.name.includes("Cubierta") ? parametros.tipo_mapeado_cubierta : parametros.tipo_mapeado_entrepanio}
              />
            ))}
          </group>
        )}

        {/* Grupo Padre: Maquinados */}
        {machiningMeshes.length > 0 && (
          <group name="Maquinados">
            {machiningMeshes.map((m: any, idx: number) => (
              <BoardMesh
                key={`machining-${idx}`}
                position={m.position}
                size={m.size}
                name={m.name}
                mainColor={mainColor}
                modoVisual={modoVisual}
                vertices={m.vertices}
                indices={m.indices}
                uvs={m.uvs}
                tipoMapeado={m.name.includes("Cubierta") ? parametros.tipo_mapeado_cubierta : parametros.tipo_mapeado_entrepanio}
              />
            ))}
          </group>
        )}

        {/* Grupo Padre: Otros */}
        {otherMeshes.length > 0 && (
          <group name="Otros">
            {otherMeshes.map((m: any, idx: number) => (
              <BoardMesh
                key={`other-${idx}`}
                position={m.position}
                size={m.size}
                name={m.name}
                mainColor={mainColor}
                modoVisual={modoVisual}
                vertices={m.vertices}
                indices={m.indices}
                tipoMapeado={m.name.includes("Cubierta") ? parametros.tipo_mapeado_cubierta : parametros.tipo_mapeado_entrepanio}
              />
            ))}
          </group>
        )}
      </group>
    );
  }

  return null;
}

export default function Viewer3D() {
  const { tema, resultado, calibracion, escenarioLimpio, parametros, hoveredPiece } = use3BFStore();
  const [furnitureGroup, setFurnitureGroup] = React.useState<THREE.Group | null>(null);
  const [mousePos, setMousePos] = React.useState({ x: 0, y: 0 });
  const [rhinoAxes, setRhinoAxes] = React.useState({
    x: { x: 22, y: 0 },
    y: { x: -8, y: -12 },
    z: { x: 0, y: -22 },
  });
  const containerRef = useRef<HTMLDivElement>(null);

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
    
    // Importación dinámica para evitar issues de compilación y optimizar bundle size
    import("three/examples/jsm/exporters/GLTFExporter.js").then(({ GLTFExporter }) => {
      const exporter = new GLTFExporter();
      
      // Clonar el grupo en memoria para limpiarlo antes de exportar
      const clone = furnitureGroup.clone();
      
      // Filtrar y remover todas las líneas (aristas de visualización de Three.js) para que no ensucien el archivo en Blender
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
        clone, // exportar el clon limpio sin aristas de visualización
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

  return (
    <div 
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => use3BFStore.getState().setHoveredPiece(null)}
      className="w-full h-full relative rounded-xl overflow-hidden shadow-inner border border-gray-200 dark:border-cyan-900/50 glass-panel"
    >
      {/* Panel Flotante de Calibración Temporal en Esquina Superior Izquierda */}
      <CalibrationPanel />

      {/* Tooltip flotante al lado del mouse (Estética simplificada del manual de armado) */}
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

        {/* Iluminación de Estudio Calibrable en Tiempo Real */}
        <ambientLight intensity={calibracion.intensidadLuzAmbiental} />
        <directionalLight position={[3, 6, 3]} intensity={calibracion.intensidadLuzDirecta} castShadow />
        <directionalLight position={[-3, 4, -4]} intensity={calibracion.intensidadLuzAmbiental * 0.5} />

        {/* Modelo Mueble en Coordenadas Reales de Grasshopper y Handler de Raycast Centralizado */}
        {!escenarioLimpio && (
          <>
            <ParametricFurnitureMesh setFurnitureGroup={setFurnitureGroup} />
            <RaycastHandler />
          </>
        )}

        {/* Grilla del Piso Ubicada en la Base Real (Y = 0) */}
        <Grid
          position={[0, -0.001, 0]}
          args={[10, 10]}
          cellSize={0.1}
          cellThickness={1}
          cellColor={tema === "obsidian" ? "#30363D" : "#E5E7EB"}
          sectionSize={0.5}
          sectionThickness={1.5}
          sectionColor={tema === "obsidian" ? "#00C9A7" : "#0088aa"}
          fadeDistance={8}
          infiniteGrid
        />

        <OrbitControls makeDefault target={[0.25, 0, -0.24]} minDistance={0.5} maxDistance={6} enableDamping />

        {/* Tracker de Orientación de Cámara (Estilo Rhino 8) */}
        <RhinoAxisTracker onUpdate={setRhinoAxes} />
      </Canvas>

      {/* Widget de Ejes X, Y, Z Idéntico a Rhino 8 (Vectorial SVG en Esquina Inferior Izquierda) */}
      <div className="absolute bottom-3 left-3 pointer-events-none z-10 select-none flex items-center justify-center p-1">
        <svg width="68" height="68" viewBox="0 0 68 68" className="overflow-visible">
          {/* Origen central en (34, 34) */}
          {/* Eje X (Ancho) */}
          <line
            x1="34"
            y1="34"
            x2={34 + rhinoAxes.x.x}
            y2={34 + rhinoAxes.x.y}
            stroke={tema === "obsidian" ? "#94a3b8" : "#475569"}
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

          {/* Eje Y (Profundidad) */}
          <line
            x1="34"
            y1="34"
            x2={34 + rhinoAxes.y.x}
            y2={34 + rhinoAxes.y.y}
            stroke={tema === "obsidian" ? "#94a3b8" : "#475569"}
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

          {/* Eje Z (Altura) */}
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

      {/* Marca de Agua 3BF Engine (Ubicada a la derecha de los Ejes Rhino) */}
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
          className="absolute bottom-3 right-3 bg-cyan-600 hover:bg-cyan-500 text-white text-xs px-4 py-2 rounded-full font-bold shadow-lg border border-cyan-400 transition-all flex items-center gap-2 z-10 cursor-pointer"
        >
          <Download className="w-3.5 h-3.5" /> Descargar GLB
        </button>
      )}
    </div>
  );
}
