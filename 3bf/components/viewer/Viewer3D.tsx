"use client";

import React, { useRef } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Grid, Stage, Edges } from "@react-three/drei";
import { use3BFStore } from "@/lib/store";
import * as THREE from "three";

function useMarfilTexture(tipoMapeado?: string) {
  const [texture, setTexture] = React.useState<THREE.CanvasTexture | THREE.Texture | null>(null);
  const isTraversada = tipoMapeado === "Cubierta Atravesada" || tipoMapeado === "Entrepaño Atravesado";

  React.useEffect(() => {
    if (typeof window === "undefined") return;

    const img = new Image();
    img.src = "/textures/Marfil_diffuse.jpg";
    img.onload = () => {
      const tex = new THREE.CanvasTexture(img);
      tex.wrapS = THREE.MirroredRepeatWrapping;
      tex.wrapT = THREE.MirroredRepeatWrapping;
      tex.repeat.set(1.0, 1.0);
      tex.center.set(0.5, 0.5);
      tex.rotation = isTraversada ? Math.PI / 2 : 0;
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.needsUpdate = true;
      setTexture(tex);
    };
  }, [isTraversada]);

  return texture;
}

function BoardMesh({
  position,
  size,
  name,
  mainColor,
  modoVisual,
  vertices,
  indices,
  tipoMapeado,
}: {
  position: [number, number, number];
  size: [number, number, number];
  name: string;
  mainColor: string;
  modoVisual: string;
  vertices?: number[];
  indices?: number[];
  tipoMapeado?: string;
}) {
  const isWireframe = modoVisual === "lineas";
  const isTransparent = modoVisual === "semitransparente";

  // Identificar tipo de objeto para asignar color y material de manufactura DfMA
  const isHardwarePerno = name.includes("Perno") || name.includes("Tornillo");
  const isHardwareCaja = name.includes("Caja");
  const isHardwareTarugo = name.includes("Tarugo") || name.includes("Soporte");
  const isMachining = name.includes("Maquinados");
  const isTapaLuz = name.includes("Tapa Luz") || name.includes("Regleta");

  let meshColor = mainColor;
  let metalness = 0.1;
  let roughness = 0.4;
  let opacity = isTransparent ? 0.70 : 1.0;
  let transparent = isTransparent;

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

  // En modo Sólido o Renderizado, ocultar sólamente los volúmenes rojos de Maquinado CNC (que no son herrajes físicos)
  if (isSolidOrRendered && isMachining) {
    return null;
  }

  // Cargar Textura PBR Marfil Melamínica según orientación de Grasshopper
  const loadedTexture = useMarfilTexture(tipoMapeado);

  if (isWoodBoard) {
    if (modoVisual === "solido") {
      meshColor = "#9CA3AF"; // Gris Técnico Rhino 8 Sólido
      opacity = 1.0;
      transparent = false;
      roughness = 0.5;
      metalness = 0.1;
    } else if (modoVisual === "renderizado") {
      opacity = 1.0;
      transparent = false;
      roughness = 0.4;
      metalness = 0.05;
    }
  }

  // Si disponemos de la malla poligonal 3D real de Grasshopper (vértices e índices exactos)
  const customGeometry = React.useMemo(() => {
    if (vertices && indices && vertices.length > 0 && indices.length > 0) {
      const geo = new THREE.BufferGeometry();
      geo.setAttribute("position", new THREE.Float32BufferAttribute(vertices, 3));
      geo.setIndex(indices);
      geo.computeVertexNormals();

      // Generar UVs simples en los 8 vértices indexados
      const uvs: number[] = [];
      for (let i = 0; i < vertices.length; i += 3) {
        uvs.push(vertices[i] * 1.5, vertices[i + 1] * 1.5);
      }
      geo.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));

      return geo;
    }
    return null;
  }, [vertices, indices]);

  // Aristas negras estilo Rhino 8 en coordenadas de mundo nativas de Three.js
  const edgesGeometry = React.useMemo(() => {
    if (customGeometry) {
      try {
        return new THREE.EdgesGeometry(customGeometry, 15);
      } catch {
        return null;
      }
    }
    return null;
  }, [customGeometry]);

  const boxEdgesGeometry = React.useMemo(() => {
    if (!customGeometry && size && size.length === 3) {
      try {
        const boxGeo = new THREE.BoxGeometry(size[0], size[1], size[2]);
        return new THREE.EdgesGeometry(boxGeo, 15);
      } catch {
        return null;
      }
    }
    return null;
  }, [customGeometry, size]);

  const activeMap = (isRenderedMode && isWoodBoard) ? loadedTexture : null;

  if (customGeometry) {
    return (
      <group>
        <mesh geometry={customGeometry}>
          <meshStandardMaterial
            color={(isRenderedMode && isWoodBoard) ? "#ffffff" : meshColor}
            map={activeMap}
            transparent={transparent}
            opacity={opacity}
            roughness={roughness}
            metalness={metalness}
            wireframe={isWireframe}
            depthWrite={!transparent}
            polygonOffset
            polygonOffsetFactor={1}
            polygonOffsetUnits={1}
          />
        </mesh>
        {edgesGeometry && (
          <lineSegments geometry={edgesGeometry}>
            <lineBasicMaterial
              color="#000000"
              linewidth={1}
              depthTest={true}
              depthWrite={!transparent}
              transparent={transparent}
              opacity={transparent ? opacity : 1.0}
            />
          </lineSegments>
        )}
      </group>
    );
  }

  return (
    <group position={position}>
      <mesh>
        <boxGeometry args={size} />
        <meshStandardMaterial
          color={(isRenderedMode && isWoodBoard) ? "#ffffff" : meshColor}
          map={activeMap}
          transparent={transparent}
          opacity={opacity}
          roughness={roughness}
          metalness={metalness}
          wireframe={isWireframe}
          depthWrite={!transparent}
          polygonOffset
          polygonOffsetFactor={1}
          polygonOffsetUnits={1}
        />
      </mesh>
      {boxEdgesGeometry && (
        <lineSegments geometry={boxEdgesGeometry}>
          <lineBasicMaterial
            color="#000000"
            linewidth={1}
            depthTest={true}
            depthWrite={!transparent}
            transparent={transparent}
            opacity={transparent ? opacity : 1.0}
          />
        </lineSegments>
      )}
    </group>
  );
}

function ParametricFurnitureMesh() {
  const { parametros, resultado, modoVisual } = use3BFStore();
  const meshRef = useRef<THREE.Group>(null);

  // Convertir milímetros a unidades de Three.js (metros: 1000mm = 1m)
  const width = parametros.ancho / 1000;
  const height = parametros.alto / 1000;
  const depth = parametros.profundidad / 1000;
  const thickness = (parametros.espesor_madera || 15) / 1000;
  
  const mainColor = parametros.color_acabado || "#0088aa";

  // RENDERIZADO 100% REAL DE GRASSHOPPER (Rhino 8 RhinoCompute Engine)
  if (resultado?.real_meshes && resultado.real_meshes.length > 0) {
    const isSolidOrRendered = modoVisual === "solido" || modoVisual === "renderizado";
    const isDrawerClosed = (parametros.apertura_cajones || 0) === 0;

    const visibleRealMeshes = resultado.real_meshes.filter((m) => {
      const isInternalDrawerBox = m.name.includes("Lateral Izq Cajon") || m.name.includes("Lateral Der Cajon") || m.name.includes("Posterior de Cajon");
      if (isSolidOrRendered && isDrawerClosed && isInternalDrawerBox) {
        return false;
      }
      return true;
    });

    return (
      <group ref={meshRef}>
        {visibleRealMeshes.map((m, idx) => (
          <BoardMesh
            key={idx}
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
    );
  }

  // Renderizado especial para el Cajón Experimento Viktor (Parseado de Grasshopper .ghx)
  if (parametros.model_id === "Cajon_Experimento_Viktor") {
    const cantCajones = parametros.cant_cajones || 3;
    const aperturaZ = (parametros.apertura_cajones || 0) / 1000;
    const drawerHeight = (height - thickness * 2) / cantCajones;

    return (
      <group ref={meshRef} position={[0, height / 2, 0]}>
        {/* Estructura Externa: Lateral Izquierdo, Derecho, Techo, Piso */}
        <BoardMesh position={[-width / 2 + thickness / 2, 0, 0]} size={[thickness, height, depth]} name="Lateral Izquierdo" mainColor={mainColor} modoVisual={modoVisual} />
        <BoardMesh position={[width / 2 - thickness / 2, 0, 0]} size={[thickness, height, depth]} name="Lateral Derecho" mainColor={mainColor} modoVisual={modoVisual} />
        <BoardMesh position={[0, height / 2 - thickness / 2, 0]} size={[width, thickness, depth]} name="Techo Superior" mainColor={mainColor} modoVisual={modoVisual} />
        <BoardMesh position={[0, -height / 2 + thickness / 2, 0]} size={[width, thickness, depth]} name="Piso Inferior" mainColor={mainColor} modoVisual={modoVisual} />

        {/* RH_OUT: Tapa Luz (Regleta / Moldura Frontal Superior) */}
        <mesh position={[0, height / 2 - thickness - 0.03, depth / 2 - thickness / 2]}>
          <boxGeometry args={[width - thickness * 2, 0.06, thickness]} />
          <meshStandardMaterial color="#111827" roughness={0.3} metalness={0.2} />
        </mesh>

        {/* Fondo Trasero 3mm */}
        <mesh position={[0, 0, -depth / 2 + 0.003]}>
          <boxGeometry args={[width - 0.004, height - 0.004, 0.003]} />
          <meshStandardMaterial color="#D1D5DB" roughness={0.8} />
        </mesh>

        {/* Cajones Animados */}
        {Array.from({ length: cantCajones }).map((_, idx) => {
          const yPos = height / 2 - thickness - drawerHeight * idx - drawerHeight / 2;
          const showInternalBox = aperturaZ > 0 || modoVisual === "semitransparente";

          return (
            <group key={idx} position={[0, yPos, aperturaZ]}>
              {/* Frente de Cajón */}
              <BoardMesh position={[0, 0, depth / 2 - thickness / 2]} size={[width - thickness * 2 - 0.004, drawerHeight - 0.006, thickness]} name={`Frente Cajon ${idx+1}`} mainColor={mainColor} modoVisual={modoVisual} />
              {/* Tirador metálico */}
              <mesh position={[0, 0, depth / 2 + 0.015]}>
                <boxGeometry args={[0.12, 0.015, 0.02]} />
                <meshStandardMaterial color="#9CA3AF" metalness={0.8} roughness={0.2} />
              </mesh>
              {/* Caja Interna de Madera (Solo visible al abrir cajones o en modo Cristal) */}
              {showInternalBox && (
                <>
                  <BoardMesh position={[-width / 2 + thickness + 0.02, -0.02, 0]} size={[thickness, drawerHeight - 0.05, depth - 0.08]} name="Lateral Cajon Izq" mainColor="#F3F4F6" modoVisual={modoVisual} />
                  <BoardMesh position={[width / 2 - thickness - 0.02, -0.02, 0]} size={[thickness, drawerHeight - 0.05, depth - 0.08]} name="Lateral Cajon Der" mainColor="#F3F4F6" modoVisual={modoVisual} />
                </>
              )}
            </group>
          );
        })}
      </group>
    );
  }

  return (
    <group ref={meshRef} position={[0, height / 2, 0]}>
      <BoardMesh position={[-width / 2 + thickness / 2, 0, 0]} size={[thickness, height, depth]} name="Lateral Izquierdo" mainColor={mainColor} modoVisual={modoVisual} />
      <BoardMesh position={[width / 2 - thickness / 2, 0, 0]} size={[thickness, height, depth]} name="Lateral Derecho" mainColor={mainColor} modoVisual={modoVisual} />
      <BoardMesh position={[0, height / 2 - thickness / 2, 0]} size={[width - thickness * 2, thickness, depth]} name="Techo Superior" mainColor={mainColor} modoVisual={modoVisual} />
      <BoardMesh position={[0, -height / 2 + thickness / 2, 0]} size={[width - thickness * 2, thickness, depth]} name="Piso Inferior" mainColor={mainColor} modoVisual={modoVisual} />
      <BoardMesh position={[0, 0, 0]} size={[width - thickness * 2, thickness, depth - 0.02]} name="Estante Central" mainColor={mainColor} modoVisual={modoVisual} />

      {/* Fondo Trasero 3mm */}
      <mesh position={[0, 0, -depth / 2 + 0.003]}>
        <boxGeometry args={[width - 0.004, height - 0.004, 0.003]} />
        <meshStandardMaterial color="#E5E7EB" roughness={0.8} />
      </mesh>

      {/* Puertas opcionales (transparentes para ver interior) */}
      {parametros.incluir_puertas && (
        <>
          <mesh position={[-width / 4, 0, depth / 2 + thickness / 2]}>
            <boxGeometry args={[width / 2 - 0.004, height - 0.008, thickness]} />
            <meshStandardMaterial color={mainColor} roughness={0.2} opacity={0.9} transparent />
          </mesh>
          <mesh position={[width / 4, 0, depth / 2 + thickness / 2]}>
            <boxGeometry args={[width / 2 - 0.004, height - 0.008, thickness]} />
            <meshStandardMaterial color={mainColor} roughness={0.2} opacity={0.9} transparent />
          </mesh>
        </>
      )}
    </group>
  );
}

export default function Viewer3D() {
  const { tema, resultado } = use3BFStore();

  return (
    <div className="w-full h-full relative rounded-xl overflow-hidden shadow-inner border border-gray-200 dark:border-gray-800">
      <Canvas
        camera={{ position: [2, 1.5, 2.5], fov: 45 }}
        shadows
        gl={{ preserveDrawingBuffer: true, antialias: true }}
      >
        <color attach="background" args={[tema === "obsidian" ? "#0D1117" : "#F3F4F6"]} />
        <ambientLight intensity={0.7} />
        <directionalLight position={[5, 8, 5]} intensity={1.2} castShadow />

        {/* Iluminación de Estudio de Alta Definición */}
        <ambientLight intensity={0.8} />
        <directionalLight position={[5, 8, 5]} intensity={1.5} castShadow />
        <directionalLight position={[-5, 5, -5]} intensity={0.5} />

        {/* Modelo Mueble en Coordenadas Reales de Grasshopper */}
        <ParametricFurnitureMesh />

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

        <OrbitControls makeDefault minDistance={0.8} maxDistance={6} enableDamping />
      </Canvas>

      {/* Marca de Agua 3BF Engine */}
      <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-md text-white text-xs px-3 py-1.5 rounded-full border border-white/10 flex items-center gap-2 pointer-events-none shadow-lg">
        {resultado?.real_meshes && resultado.real_meshes.length > 0 ? (
          <>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-semibold text-emerald-300">Geometría Real de Grasshopper (Rhino 8 Engine)</span>
          </>
        ) : (
          <>
            <span className="w-2 h-2 rounded-full bg-cyan-400" />
            <span>3BF WebGL Viewer (R3F Engine)</span>
          </>
        )}
      </div>
    </div>
  );
}
