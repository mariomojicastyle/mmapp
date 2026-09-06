"use client";

import React, { useRef, useState, useMemo } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Billboard, Html, TransformControls } from "@react-three/drei";
import * as THREE from "three";
import { use3BFStore, StudioLightConfig } from "@/lib/store";
import { Sun, Lamp, Sparkles, Target, Move } from "lucide-react";

// Convierte azimut, elevación y distancia a coordenadas cartesianas 3D [X, Y, Z]
export function calcularPosicionCartesiana(azimut: number, elevacion: number, distancia: number): [number, number, number] {
  const radAzimut = (azimut * Math.PI) / 180;
  const radElevacion = (elevacion * Math.PI) / 180;

  const x = distancia * Math.cos(radElevacion) * Math.sin(radAzimut);
  const y = Math.max(0.2, distancia * Math.sin(radElevacion));
  const z = distancia * Math.cos(radElevacion) * Math.cos(radAzimut);

  return [x, y, z];
}

/**
 * 🎯 CONO DE LUZ ALÁMBRICO DIRECCIONAL (ESTILO UNREAL ENGINE)
 * Muestra el haz cónico de alambre tridimensional con radios y anillos concéntricos
 * orientados desde la lámpara hacia el punto objetivo (target).
 * Con contraste adaptativo perfecto para fondos claros (Tech Ethos) y oscuros (Obsidian Teal).
 */
function WireframeLightCone({
  posicion,
  target,
  anguloGrad,
  colorHex,
  isDark,
}: {
  posicion: [number, number, number];
  target: [number, number, number];
  anguloGrad: number;
  colorHex: string;
  isDark: boolean;
}) {
  const lineObj = useMemo(() => {
    const p1 = new THREE.Vector3(...posicion);
    const p2 = new THREE.Vector3(...target);
    const dir = new THREE.Vector3().subVectors(p2, p1);
    const length = dir.length();
    if (length < 0.05) return null;

    const rad = ((anguloGrad || 45) * Math.PI) / 360; // semi-ángulo
    const rBase = Math.max(0.1, length * Math.tan(rad));
    const rMid = rBase * 0.5;

    const points: THREE.Vector3[] = [];
    const segments = 24;

    const basePoints: THREE.Vector3[] = [];
    const midPoints: THREE.Vector3[] = [];

    for (let i = 0; i <= segments; i++) {
      const theta = (i / segments) * Math.PI * 2;
      const bx = Math.cos(theta) * rBase;
      const by = Math.sin(theta) * rBase;
      basePoints.push(new THREE.Vector3(bx, by, length));

      const mx = Math.cos(theta) * rMid;
      const my = Math.sin(theta) * rMid;
      midPoints.push(new THREE.Vector3(mx, my, length * 0.5));
    }

    // Anillo base exterior
    for (let i = 0; i < segments; i++) {
      points.push(basePoints[i], basePoints[i + 1]);
    }

    // Anillo concéntrico intermedio (estilo Unreal)
    for (let i = 0; i < segments; i++) {
      points.push(midPoints[i], midPoints[i + 1]);
    }

    // Rayos longitudinales que van desde el vértice emisor hasta la base
    const numRays = 12;
    for (let i = 0; i < numRays; i++) {
      const idx = Math.floor((i / numRays) * segments);
      points.push(new THREE.Vector3(0, 0, 0), basePoints[idx]);
    }

    // Eje central que marca el vector de incidencia
    points.push(new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0, length));

    const geom = new THREE.BufferGeometry().setFromPoints(points);
    
    // Contraste de visibilidad según tema
    const strokeColor = isDark ? (colorHex || "#38BDF8") : "#0891B2";
    const strokeOpacity = isDark ? 0.65 : 0.85;

    const mat = new THREE.LineBasicMaterial({
      color: new THREE.Color(strokeColor),
      transparent: true,
      opacity: strokeOpacity,
      depthTest: false,
    });

    const line = new THREE.LineSegments(geom, mat);
    line.position.copy(p1);
    line.lookAt(p2);
    return line;
  }, [posicion, target, anguloGrad, colorHex, isDark]);

  if (!lineObj) return null;
  return <primitive object={lineObj} />;
}

/**
 * 💡 ESFERA DE ALAMBRE 360° (BOMBILLO / POINT LIGHT - ESTILO UNREAL ENGINE)
 * Dibuja los 3 aros ortogonales perpendiculares (XY, XZ, YZ) y la esfera alámbrica.
 */
function WireframeLightSphere({
  posicion,
  radio,
  colorHex,
  isDark,
}: {
  posicion: [number, number, number];
  radio: number;
  colorHex: string;
  isDark: boolean;
}) {
  const r = Math.max(0.5, radio || 3.5);
  const strokeColor = isDark ? (colorHex || "#38BDF8") : "#0891B2";
  const strokeOpacity = isDark ? 0.6 : 0.8;

  return (
    <group position={posicion}>
      {/* Esfera alámbrica semitransparente */}
      <mesh>
        <sphereGeometry args={[r, 16, 12]} />
        <meshBasicMaterial
          wireframe
          color={strokeColor}
          transparent
          opacity={isDark ? 0.25 : 0.35}
          depthTest={false}
        />
      </mesh>

      {/* Aro Ecuatorial Horizontal (Plano XZ) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[r * 0.985, r * 1.015, 48]} />
        <meshBasicMaterial
          color={strokeColor}
          transparent
          opacity={strokeOpacity}
          side={THREE.DoubleSide}
          depthTest={false}
        />
      </mesh>

      {/* Aro Meridiano Vertical 1 (Plano XY) */}
      <mesh>
        <ringGeometry args={[r * 0.985, r * 1.015, 48]} />
        <meshBasicMaterial
          color={strokeColor}
          transparent
          opacity={strokeOpacity}
          side={THREE.DoubleSide}
          depthTest={false}
        />
      </mesh>

      {/* Aro Meridiano Vertical 2 (Plano YZ) */}
      <mesh rotation={[0, Math.PI / 2, 0]}>
        <ringGeometry args={[r * 0.985, r * 1.015, 48]} />
        <meshBasicMaterial
          color={strokeColor}
          transparent
          opacity={strokeOpacity}
          side={THREE.DoubleSide}
          depthTest={false}
        />
      </mesh>
    </group>
  );
}

/**
 * 🎯 DIANA RETICULAR DEL PUNTO OBJETIVO (TARGET MARKER)
 * Marcador visual en el mueble que señala hacia dónde apunta el haz de luz.
 */
function TargetMarker({
  target,
  colorHex,
  seleccionada,
  onSelect,
  isDark,
}: {
  target: [number, number, number];
  colorHex: string;
  seleccionada: boolean;
  onSelect: () => void;
  isDark: boolean;
}) {
  const markerColor = isDark ? (colorHex || "#38BDF8") : "#0891B2";

  return (
    <group position={target}>
      <mesh
        onClick={(e) => {
          e.stopPropagation();
          onSelect();
        }}
      >
        <sphereGeometry args={[0.12, 12, 12]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>

      <Billboard follow>
        {/* Anillo exterior */}
        <mesh>
          <ringGeometry args={[0.07, 0.085, 32]} />
          <meshBasicMaterial color={markerColor} side={THREE.DoubleSide} depthTest={false} />
        </mesh>
        {/* Anillo interior */}
        <mesh>
          <ringGeometry args={[0.025, 0.035, 32]} />
          <meshBasicMaterial color={markerColor} side={THREE.DoubleSide} depthTest={false} />
        </mesh>
        {/* Punto central */}
        <mesh>
          <circleGeometry args={[0.015, 16]} />
          <meshBasicMaterial color="#0891B2" side={THREE.DoubleSide} depthTest={false} />
        </mesh>

        <Html position={[0, 0.14, 0]} center distanceFactor={6} style={{ pointerEvents: "none" }}>
          <div 
            className="px-1.5 py-0.5 rounded text-[9px] font-bold shadow-xs whitespace-nowrap flex items-center gap-1 border select-none"
            style={{
              backgroundColor: isDark ? "#131B2E" : "#0891B2",
              borderColor: isDark ? "#06B6D4" : "#22D3EE",
              color: "#FFFFFF",
            }}
          >
            <Target className="w-2.5 h-2.5 text-cyan-200" />
            <span>Target ({target[0].toFixed(2)}, {target[1].toFixed(2)}, {target[2].toFixed(2)})</span>
          </div>
        </Html>
      </Billboard>
    </group>
  );
}

interface SingleLightGizmoProps {
  luz: StudioLightConfig;
  posicion: [number, number, number];
  seleccionada: boolean;
  onSelect: () => void;
  isDark: boolean;
  coloresApariencia: any;
}

function SingleLightGizmo({ luz, posicion, seleccionada, onSelect, isDark, coloresApariencia }: SingleLightGizmoProps) {
  const [hovered, setHovered] = useState(false);
  const ringRef = useRef<THREE.Mesh>(null);

  // Animación de rotación suave en el anillo de selección
  useFrame((_, delta) => {
    if (ringRef.current && seleccionada) {
      ringRef.current.rotation.z += delta * 1.5;
    }
  });

  const colorHex = luz.color || "#ffffff";
  const fondoBadge = coloresApariencia?.fondoPaneles || (isDark ? "#131B2E" : "#FFFFFF");
  const bordeBadge = coloresApariencia?.bordePaneles || (isDark ? "#1E293B" : "#CBD5E1");
  const textoBadge = coloresApariencia?.textoPrincipal || (isDark ? "#F8FAFC" : "#0F172A");

  return (
    <group position={posicion}>
      {/* 🎯 Esfera Sensible al Clic del Raycasting */}
      <mesh
        onClick={(e) => {
          e.stopPropagation();
          onSelect();
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered(true);
          document.body.style.cursor = "pointer";
        }}
        onPointerOut={() => {
          setHovered(false);
          document.body.style.cursor = "auto";
        }}
      >
        <sphereGeometry args={[0.22, 16, 16]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>

      {/* 🎯 Billboard Visual del Icono de Luz */}
      <Billboard follow lockX={false} lockY={false} lockZ={false}>
        {/* Halo luminoso */}
        <mesh>
          <ringGeometry args={[0.07, 0.13, 32]} />
          <meshBasicMaterial
            color={colorHex}
            transparent
            opacity={luz.activa ? (hovered || seleccionada ? 0.9 : 0.6) : 0.2}
            side={THREE.DoubleSide}
          />
        </mesh>

        {/* Punto emisor interior */}
        <mesh>
          <circleGeometry args={[0.06, 32]} />
          <meshBasicMaterial
            color={luz.activa ? colorHex : "#6B7280"}
            side={THREE.DoubleSide}
          />
        </mesh>

        {/* Anillo de Selección Orbital (Cyan #0891b2) */}
        {seleccionada && (
          <mesh ref={ringRef}>
            <ringGeometry args={[0.15, 0.17, 32]} />
            <meshBasicMaterial color="#0891B2" side={THREE.DoubleSide} />
          </mesh>
        )}

        {/* Etiqueta HTML Flotante / Badge de la Lámpara con coherencia de tema */}
        <Html
          position={[0, 0.22, 0]}
          center
          distanceFactor={6}
          style={{ pointerEvents: "none" }}
        >
          <div
            className={`px-2 py-0.5 rounded-md text-[10px] font-bold tracking-tight shadow-md flex items-center gap-1 whitespace-nowrap transition-all border select-none ${
              seleccionada ? "scale-105 shadow-cyan-500/20" : hovered ? "scale-100 shadow-lg" : "scale-90 opacity-90"
            }`}
            style={{
              backgroundColor: seleccionada ? "#0891B2" : fondoBadge,
              borderColor: seleccionada ? "#22D3EE" : hovered ? "#0891B2" : bordeBadge,
              color: seleccionada ? "#FFFFFF" : textoBadge,
            }}
          >
            {luz.id === "key_sun" ? (
              <Sun className="w-3 h-3 text-amber-500" />
            ) : luz.tipo === "point" ? (
              <Lamp className="w-3 h-3 text-amber-400" />
            ) : (
              <Sparkles className="w-3 h-3 text-cyan-400" />
            )}
            <span>{luz.nombre}</span>
            <span className="font-mono text-[9px] opacity-80">
              {luz.activa ? `${luz.intensidad.toFixed(1)}x` : "OFF"}
            </span>
          </div>
        </Html>
      </Billboard>
    </group>
  );
}

/**
 * Sistema Completo de Iluminación, Conos Alámbricos, Esferas 360 y Gizmos 3D (Unreal Style)
 */
export default function StudioLightGizmos() {
  const { 
    calibracion, 
    seleccionarLuzEstudio, 
    setLuzPosicionCartesiana, 
    setLuzTarget,
    setLuzPropiedad,
    tema,
    coloresApariencia
  } = use3BFStore();
  const { mostrarGizmosLuces, luzSeleccionadaId, lucesEstudio } = calibracion;
  const { controls } = useThree() as any;

  const isDark = tema === "obsidian";

  if (!lucesEstudio) return null;

  const listaLuces = Object.values(lucesEstudio);
  const luzSeleccionada = luzSeleccionadaId ? lucesEstudio[luzSeleccionadaId] : null;

  return (
    <>
      {/* 💡 1. FUENTES DE LUZ THREE.JS */}
      {listaLuces.map((luz) => {
        if (!luz.activa) return null;

        if (luz.tipo === "ambient") {
          return (
            <ambientLight
              key={luz.id}
              color={luz.color || "#ffffff"}
              intensity={luz.intensidad ?? 0.45}
            />
          );
        }

        const pos = calcularPosicionCartesiana(luz.azimut, luz.elevacion, luz.distancia);
        const targetPos = luz.target || [0, 0.45, 0];

        if (luz.tipo === "directional") {
          const targetObj = new THREE.Object3D();
          targetObj.position.set(...targetPos);

          return (
            <group key={luz.id}>
              <primitive object={targetObj} />
              <directionalLight
                position={pos}
                target={targetObj}
                color={luz.color || "#ffffff"}
                intensity={luz.intensidad ?? 1.0}
                castShadow={luz.proyectarSombras}
                shadow-mapSize={[1024, 1024]}
                shadow-bias={-0.0001}
              />
            </group>
          );
        }

        if (luz.tipo === "point") {
          return (
            <pointLight
              key={luz.id}
              position={pos}
              color={luz.color || "#ffffff"}
              intensity={luz.intensidad ?? 1.0}
              distance={(luz.radioAlcance || 4.0) * 1.5}
              decay={2}
            />
          );
        }

        return null;
      })}

      {/* 🎯 2. GIZMOS 3D INTERACTIVOS (CUANDO ESTÁ ACTIVO 'MOSTRAR GIZMOS') */}
      {mostrarGizmosLuces && (
        <group name="studio_light_gizmos">
          {listaLuces
            .filter((l) => l.tipo !== "ambient")
            .map((luz) => {
              const pos = calcularPosicionCartesiana(luz.azimut, luz.elevacion, luz.distancia);
              const targetPos = luz.target || [0, 0.45, 0];
              const isSelected = luzSeleccionadaId === luz.id;

              return (
                <React.Fragment key={luz.id}>
                  {/* Icono / Billboard de la lámpara */}
                  <SingleLightGizmo
                    luz={luz}
                    posicion={pos}
                    seleccionada={isSelected}
                    onSelect={() => seleccionarLuzEstudio(luz.id)}
                    isDark={isDark}
                    coloresApariencia={coloresApariencia}
                  />

                  {/* Visualizadores Volumétricos cuando la lámpara está seleccionada */}
                  {isSelected && (
                    <>
                      {/* TIPO 1: Luz Direccional -> Cono de Luz hacia el Target */}
                      {luz.tipo === "directional" && (
                        <>
                          <WireframeLightCone
                            posicion={pos}
                            target={targetPos}
                            anguloGrad={luz.anguloCono || 45}
                            colorHex={luz.color || "#ffffff"}
                            isDark={isDark}
                          />
                          <TargetMarker
                            target={targetPos}
                            colorHex={luz.color || "#ffffff"}
                            seleccionada={isSelected}
                            onSelect={() => setLuzPropiedad(luz.id, "modoGizmo", "target")}
                            isDark={isDark}
                          />
                        </>
                      )}

                      {/* TIPO 2: Luz Esférica (PointLight) -> Esfera 360° */}
                      {luz.tipo === "point" && (
                        <WireframeLightSphere
                          posicion={pos}
                          radio={luz.radioAlcance || 4.0}
                          colorHex={luz.color || "#ffffff"}
                          isDark={isDark}
                        />
                      )}
                    </>
                  )}
                </React.Fragment>
              );
            })}

          {/* 🎯 3. GIZMO DE TRANSFORMACIÓN (FLECHAS 3D RGB - ESTILO UNREAL ENGINE) */}
          {luzSeleccionada && luzSeleccionada.modoGizmo !== "ninguno" && (
            <>
              {luzSeleccionada.modoGizmo === "luz" ? (
                <TransformControls
                  mode="translate"
                  size={0.65}
                  position={calcularPosicionCartesiana(
                    luzSeleccionada.azimut,
                    luzSeleccionada.elevacion,
                    luzSeleccionada.distancia
                  )}
                  onMouseDown={() => {
                    if (controls) controls.enabled = false;
                  }}
                  onMouseUp={() => {
                    if (controls) controls.enabled = true;
                  }}
                  onObjectChange={(e: any) => {
                    const obj = e?.target?.object;
                    if (obj) {
                      setLuzPosicionCartesiana(luzSeleccionada.id, [obj.position.x, obj.position.y, obj.position.z]);
                    }
                  }}
                />
              ) : luzSeleccionada.modoGizmo === "target" ? (
                <TransformControls
                  mode="translate"
                  size={0.65}
                  position={luzSeleccionada.target || [0, 0.45, 0]}
                  onMouseDown={() => {
                    if (controls) controls.enabled = false;
                  }}
                  onMouseUp={() => {
                    if (controls) controls.enabled = true;
                  }}
                  onObjectChange={(e: any) => {
                    const obj = e?.target?.object;
                    if (obj) {
                      setLuzTarget(luzSeleccionada.id, [obj.position.x, obj.position.y, obj.position.z]);
                    }
                  }}
                />
              ) : null}
            </>
          )}
        </group>
      )}
    </>
  );
}
