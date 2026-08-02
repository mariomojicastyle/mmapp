"use client";

import React, { useRef } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Grid, Stage, Edges } from "@react-three/drei";
import { use3BFStore } from "@/lib/store";
import * as THREE from "three";

function BoardMesh({ position, size, name, mainColor, modoVisual }: { position: [number, number, number]; size: [number, number, number]; name: string; mainColor: string; modoVisual: string }) {
  const isWireframe = modoVisual === "lineas";
  const isTransparent = modoVisual === "semitransparente";

  // Estilo Rhino 8: Conserva el Tono/Color de Acabado con Cristal Tintado Semitransparente (30% Transparente / 70% Opaco)
  const boardColor = name.includes("Tapa") ? "#1F2937" : mainColor;

  return (
    <mesh position={position}>
      <boxGeometry args={size} />
      <meshStandardMaterial
        color={boardColor}
        transparent={isTransparent}
        opacity={isTransparent ? 0.70 : 1.0}
        roughness={isTransparent ? 0.15 : 0.4}
        metalness={isTransparent ? 0.1 : 0.1}
        wireframe={isWireframe}
        depthWrite={!isTransparent}
      />
      <Edges color="#000000" threshold={15} />
    </mesh>
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
    return (
      <group ref={meshRef}>
        {resultado.real_meshes.map((m, idx) => (
          <BoardMesh
            key={idx}
            position={m.position}
            size={m.size}
            name={m.name}
            mainColor={mainColor}
            modoVisual={modoVisual}
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
        {/* Estructura Externa: Lateral Izquierdo, Derecho, Techo, Piso, Fondo */}
        <mesh position={[-width / 2 + thickness / 2, 0, 0]}>
          <boxGeometry args={[thickness, height, depth]} />
          <meshStandardMaterial color={mainColor} roughness={0.4} />
        </mesh>
        <mesh position={[width / 2 - thickness / 2, 0, 0]}>
          <boxGeometry args={[thickness, height, depth]} />
          <meshStandardMaterial color={mainColor} roughness={0.4} />
        </mesh>
        <mesh position={[0, height / 2 - thickness / 2, 0]}>
          <boxGeometry args={[width, thickness, depth]} />
          <meshStandardMaterial color={mainColor} roughness={0.4} />
        </mesh>

        {/* RH_OUT: Tapa Luz (Regleta / Moldura Frontal Superior) */}
        <mesh position={[0, height / 2 - thickness - 0.03, depth / 2 - thickness / 2]}>
          <boxGeometry args={[width - thickness * 2, 0.06, thickness]} />
          <meshStandardMaterial color="#111827" roughness={0.3} metalness={0.2} />
        </mesh>

        <mesh position={[0, -height / 2 + thickness / 2, 0]}>
          <boxGeometry args={[width, thickness, depth]} />
          <meshStandardMaterial color={mainColor} roughness={0.4} />
        </mesh>
        <mesh position={[0, 0, -depth / 2 + 0.003]}>
          <boxGeometry args={[width - 0.004, height - 0.004, 0.003]} />
          <meshStandardMaterial color="#D1D5DB" roughness={0.8} />
        </mesh>

        {/* Cajones Animados */}
        {Array.from({ length: cantCajones }).map((_, idx) => {
          const yPos = height / 2 - thickness - drawerHeight * idx - drawerHeight / 2;

          return (
            <group key={idx} position={[0, yPos, aperturaZ]}>
              {/* Frente de Cajón */}
              <mesh position={[0, 0, depth / 2 - thickness / 2]}>
                <boxGeometry args={[width - thickness * 2 - 0.004, drawerHeight - 0.006, thickness]} />
                <meshStandardMaterial color={mainColor} roughness={0.3} metalness={0.1} />
              </mesh>
              {/* Tirador metálico */}
              <mesh position={[0, 0, depth / 2 + 0.015]}>
                <boxGeometry args={[0.12, 0.015, 0.02]} />
                <meshStandardMaterial color="#9CA3AF" metalness={0.8} roughness={0.2} />
              </mesh>
              {/* Caja Interna de Madera */}
              <mesh position={[-width / 2 + thickness + 0.02, -0.02, 0]}>
                <boxGeometry args={[thickness, drawerHeight - 0.05, depth - 0.08]} />
                <meshStandardMaterial color="#F3F4F6" roughness={0.6} />
              </mesh>
              <mesh position={[width / 2 - thickness - 0.02, -0.02, 0]}>
                <boxGeometry args={[thickness, drawerHeight - 0.05, depth - 0.08]} />
                <meshStandardMaterial color="#F3F4F6" roughness={0.6} />
              </mesh>
            </group>
          );
        })}
      </group>
    );
  }

  return (
    <group ref={meshRef} position={[0, height / 2, 0]}>
      {/* Lateral Izquierdo */}
      <mesh position={[-width / 2 + thickness / 2, 0, 0]}>
        <boxGeometry args={[thickness, height, depth]} />
        <meshStandardMaterial color={mainColor} roughness={0.4} metalness={0.1} />
      </mesh>

      {/* Lateral Derecho */}
      <mesh position={[width / 2 - thickness / 2, 0, 0]}>
        <boxGeometry args={[thickness, height, depth]} />
        <meshStandardMaterial color={mainColor} roughness={0.4} metalness={0.1} />
      </mesh>

      {/* Techo Superior */}
      <mesh position={[0, height / 2 - thickness / 2, 0]}>
        <boxGeometry args={[width - thickness * 2, thickness, depth]} />
        <meshStandardMaterial color={mainColor} roughness={0.4} metalness={0.1} />
      </mesh>

      {/* Piso Inferior */}
      <mesh position={[0, -height / 2 + thickness / 2, 0]}>
        <boxGeometry args={[width - thickness * 2, thickness, depth]} />
        <meshStandardMaterial color={mainColor} roughness={0.4} metalness={0.1} />
      </mesh>

      {/* Estante Central */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[width - thickness * 2, thickness, depth - 0.02]} />
        <meshStandardMaterial color="#333333" roughness={0.5} />
      </mesh>

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
