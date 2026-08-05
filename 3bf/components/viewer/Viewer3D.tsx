"use client";

import React, { useRef } from "react";
import { Canvas } from "@react-three/fiber";
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
    roughness = isTransparent ? 0.15 : calibracion.rugosidadMadera;
    metalness = isTransparent ? 0.1 : calibracion.metalicidadMadera;
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

  const activeMap = (isWoodBoard && (calibracion.customTextureUrl || isRenderedMode)) ? loadedTexture : null;
  const hasMap = activeMap !== null;

  // Si hay mapa de textura activo (imagen subida o modo renderizado), ignorar el color gris base y forzar blanco puro #ffffff
  const finalMeshColor = hasMap ? "#ffffff" : (modoVisual === "solido" ? calibracion.colorSolido : meshColor);

  if (customGeometry) {
    return (
      <group>
        <mesh geometry={customGeometry}>
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
              polygonOffset={true}
              polygonOffsetFactor={1}
              polygonOffsetUnits={1}
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
            polygonOffset={true}
            polygonOffsetFactor={1}
            polygonOffsetUnits={1}
          />
        </lineSegments>
      )}
    </group>
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
    return (
      <group ref={meshRef} position={[0, 0, 0]}>
        {resultado.real_meshes.map((m, idx) => (
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

  return null;
}

export default function Viewer3D() {
  const { tema, resultado, calibracion, escenarioLimpio, parametros } = use3BFStore();
  const [furnitureGroup, setFurnitureGroup] = React.useState<THREE.Group | null>(null);

  const exportToGLB = () => {
    if (!furnitureGroup) {
      alert("Espera a que el modelo esté cargado en pantalla para exportar.");
      return;
    }
    
    // Importación dinámica para evitar issues de compilación y optimizar bundle size
    import("three/examples/jsm/exporters/GLTFExporter.js").then(({ GLTFExporter }) => {
      const exporter = new GLTFExporter();
      exporter.parse(
        furnitureGroup,
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
    <div className="w-full h-full relative rounded-xl overflow-hidden shadow-inner border border-gray-200 dark:border-cyan-900/50 glass-panel">
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

        {/* Modelo Mueble en Coordenadas Reales de Grasshopper (se oculta si escenarioLimpio es true) */}
        {!escenarioLimpio && <ParametricFurnitureMesh setFurnitureGroup={setFurnitureGroup} />}

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
