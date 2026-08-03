"use client";

import React, { useRef } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Grid, Stage, Edges } from "@react-three/drei";
import { use3BFStore } from "@/lib/store";
import * as THREE from "three";

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

      // 2. Malla No-Indexada para Normales de Cara 100% Perpendiculares (Sin Gradientes de Sombra ni Costuras)
      const geo = indexedGeo.toNonIndexed();
      geo.computeBoundingBox();

      const box = geo.boundingBox || new THREE.Box3();
      const boxCenter = new THREE.Vector3();
      box.getCenter(boxCenter);

      const posAttr = geo.attributes.position;

      // Garantizar que las normales de todas las 6 caras apunten 100% HACIA AFUERA (Outward-Facing Normals)
      for (let i = 0; i < posAttr.count; i += 3) {
        const pA = new THREE.Vector3(posAttr.getX(i), posAttr.getY(i), posAttr.getZ(i));
        const pB = new THREE.Vector3(posAttr.getX(i + 1), posAttr.getY(i + 1), posAttr.getZ(i + 1));
        const pC = new THREE.Vector3(posAttr.getX(i + 2), posAttr.getY(i + 2), posAttr.getZ(i + 2));

        const triCenter = new THREE.Vector3().add(pA).add(pB).add(pC).divideScalar(3);
        const outVector = new THREE.Vector3().subVectors(triCenter, boxCenter);

        const edge1 = new THREE.Vector3().subVectors(pB, pA);
        const edge2 = new THREE.Vector3().subVectors(pC, pA);
        const normal = new THREE.Vector3().crossVectors(edge1, edge2);

        // Si la normal apunta hacia el centro interno de la caja, invertir el orden de los vértices (Flipping Inverted Normal)
        if (normal.dot(outVector) < 0) {
          posAttr.setXYZ(i + 1, pC.x, pC.y, pC.z);
          posAttr.setXYZ(i + 2, pB.x, pB.y, pB.z);
        }
      }

      posAttr.needsUpdate = true;
      geo.computeVertexNormals();

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
  }, [vertices, indices, calibracion.thresholdAristas]);

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

  // En modo Sólido o Renderizado, ocultar sólamente los volúmenes rojos de Maquinado CNC (que no son herrajes físicos)
  if (isSolidOrRendered && isMachining) {
    return null;
  }

  if (isWoodBoard) {
    roughness = calibracion.rugosidadMadera;
    metalness = calibracion.metalicidadMadera;
    if (modoVisual === "solido") {
      meshColor = calibracion.colorSolido; // Color calibrable (default #9CA3AF)
      opacity = calibracion.opacidadMadera;
      transparent = opacity < 1.0;
    } else if (modoVisual === "renderizado") {
      opacity = calibracion.opacidadMadera;
      transparent = opacity < 1.0;
    }
  }

  const activeMap = (isWoodBoard && (calibracion.customTextureUrl || isRenderedMode)) ? loadedTexture : null;
  const hasMap = activeMap !== null;

  // Si hay mapa de textura activo (imagen subida o modo renderizado), ignorar el color gris base y forzar blanco puro #ffffff
  const finalMeshColor = hasMap ? "#ffffff" : (modoVisual === "solido" ? calibracion.colorSolido : meshColor);

  if (customGeometry) {
    return (
      <group>
        <mesh geometry={customGeometry}>
          <meshStandardMaterial
            key={activeMap ? activeMap.uuid : "no-map"}
            color={finalMeshColor}
            map={activeMap}
            transparent={transparent}
            opacity={opacity}
            roughness={roughness}
            metalness={metalness}
            wireframe={isWireframe}
            depthWrite={!transparent}
          />
        </mesh>
        {edgesGeometry && calibracion.mostrarAristas && (
          <lineSegments geometry={edgesGeometry}>
            <lineBasicMaterial
              color={calibracion.colorAristas}
              linewidth={1}
              depthTest={true}
              depthWrite={true}
              transparent={false}
              opacity={1.0}
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
          key={activeMap ? activeMap.uuid : "no-map"}
          color={finalMeshColor}
          map={activeMap}
          transparent={transparent}
          opacity={opacity}
          roughness={roughness}
          metalness={metalness}
          wireframe={isWireframe}
          depthWrite={!transparent}
        />
      </mesh>
      {boxEdgesGeometry && calibracion.mostrarAristas && (
        <lineSegments geometry={boxEdgesGeometry}>
          <lineBasicMaterial
            color={calibracion.colorAristas}
            linewidth={1}
            depthTest={true}
            depthWrite={true}
            transparent={false}
            opacity={1.0}
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
      <group ref={meshRef} position={[-width / 2, 0, -depth / 2]}>
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
  const { tema, resultado, calibracion } = use3BFStore();

  return (
    <div className="w-full h-full relative rounded-xl overflow-hidden shadow-inner border border-gray-200 dark:border-gray-800">
      {/* Panel Flotante de Calibración Temporal en Esquina Superior Izquierda */}
      <CalibrationPanel />

      <Canvas
        camera={{ position: [2, 1.5, 2.5], fov: 45 }}
        shadows
        gl={{ preserveDrawingBuffer: true, antialias: true }}
      >
        <color attach="background" args={[tema === "obsidian" ? "#0D1117" : "#F3F4F6"]} />

        {/* Iluminación de Estudio Calibrable en Tiempo Real */}
        <ambientLight intensity={calibracion.intensidadLuzAmbiental} />
        <directionalLight position={[5, 8, 5]} intensity={calibracion.intensidadLuzDirecta} castShadow />
        <directionalLight position={[-5, 5, -5]} intensity={calibracion.intensidadLuzAmbiental * 0.5} />

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
