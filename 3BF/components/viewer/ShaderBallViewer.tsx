"use client";

import React, { useRef, useState, useEffect, useMemo } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { OrbitControls, ContactShadows } from "@react-three/drei";
import * as THREE from "three";
import { RGBELoader } from "three/examples/jsm/loaders/RGBELoader.js";
import { MaterialPBRDef, use3BFStore, ObjetoInstancia3BF } from "@/lib/store";

export interface HDRIConfig {
  tipo: "estudio_suave" | "alps_field_sol" | "modern_bathroom" | "apartamento_calido" | "showroom_moderno" | "personalizado";
  customHdrUrl?: string | null;
  intensidad: number;
  rotacion: number;
  mostrarFondo: boolean;
  blurFondo: number;
  sombraOpacidad?: number;
  sombraDifuminado?: number;
}

interface ShaderBallViewerProps {
  materialDef: MaterialPBRDef;
  forma?: "esfera" | "tablero" | "cubo" | "mueble";
  hdriConfig?: HDRIConfig;
  mostrarSuelo?: boolean;
}

/**
 * Generador de Entorno Equirectangular Local Balanceado (5500K Neutro Fotográfico).
 * Evita cualquier tinte morado o disparejo en la cubierta superior.
 */
export function generarEntornoEquirectangularLocal(tipo: string, rotacion = 0): THREE.CanvasTexture {
  const width = 1024;
  const height = 512;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d")!;

  if (tipo === "alps_field_sol") {
    const skyGrad = ctx.createLinearGradient(0, 0, 0, height);
    skyGrad.addColorStop(0, "#F0F9FF");
    skyGrad.addColorStop(0.48, "#FFFFFF");
    skyGrad.addColorStop(0.52, "#F1F5F9");
    skyGrad.addColorStop(1, "#E2E8F0");
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, width, height);

    const sunX = ((rotacion % 360) / 360) * width;
    const sunY = height * 0.30;
    const sunGrad = ctx.createRadialGradient(sunX, sunY, 5, sunX, sunY, 160);
    sunGrad.addColorStop(0, "rgba(255, 255, 255, 1.0)");
    sunGrad.addColorStop(0.3, "rgba(254, 249, 195, 0.5)");
    sunGrad.addColorStop(0.7, "rgba(254, 240, 138, 0.1)");
    sunGrad.addColorStop(1, "rgba(254, 240, 138, 0)");
    ctx.fillStyle = sunGrad;
    ctx.fillRect(0, 0, width, height);
  } else if (tipo === "apartamento_calido") {
    const grad = ctx.createLinearGradient(0, 0, 0, height);
    grad.addColorStop(0, "#FAF8F5");
    grad.addColorStop(0.5, "#F1ECE5");
    grad.addColorStop(0.52, "#E5DDD0");
    grad.addColorStop(1, "#D6C7B2");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);

    const winX = ((rotacion % 360) / 360) * width;
    ctx.fillStyle = "rgba(255, 253, 248, 0.85)";
    ctx.fillRect(winX - 100, height * 0.15, 200, height * 0.35);
  } else if (tipo === "showroom_moderno") {
    const grad = ctx.createLinearGradient(0, 0, 0, height);
    grad.addColorStop(0, "#334155");
    grad.addColorStop(0.5, "#475569");
    grad.addColorStop(0.52, "#1E293B");
    grad.addColorStop(1, "#0F172A");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);

    for (let i = 0; i < 4; i++) {
      const spotX = ((i * 256 + rotacion * 2) % width);
      const spotGrad = ctx.createRadialGradient(spotX, 80, 5, spotX, 80, 90);
      spotGrad.addColorStop(0, "rgba(255, 255, 255, 0.95)");
      spotGrad.addColorStop(0.5, "rgba(241, 245, 249, 0.35)");
      spotGrad.addColorStop(1, "rgba(241, 245, 249, 0)");
      ctx.fillStyle = spotGrad;
      ctx.fillRect(0, 0, width, height);
    }
  } else {
    // Estudio fotográfico neutral
    const grad = ctx.createLinearGradient(0, 0, 0, height);
    grad.addColorStop(0, "#FFFFFF");
    grad.addColorStop(0.5, "#F8FAFC");
    grad.addColorStop(0.52, "#F1F5F9");
    grad.addColorStop(1, "#E2E8F0");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);

    const sb1X = ((rotacion % 360) / 360) * width;
    const sb1Grad = ctx.createRadialGradient(sb1X, height * 0.3, 10, sb1X, height * 0.3, 160);
    sb1Grad.addColorStop(0, "rgba(255, 255, 255, 1.0)");
    sb1Grad.addColorStop(0.5, "rgba(248, 250, 252, 0.5)");
    sb1Grad.addColorStop(1, "rgba(248, 250, 252, 0)");
    ctx.fillStyle = sb1Grad;
    ctx.fillRect(0, 0, width, height);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.mapping = THREE.EquirectangularReflectionMapping;
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;
  return texture;
}

function createConfiguredTexture(imgSrc: string, isColor = false, repeat = 1.5): Promise<THREE.Texture> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const tex = new THREE.Texture(img);
      tex.wrapS = THREE.RepeatWrapping;
      tex.wrapT = THREE.RepeatWrapping;
      tex.repeat.set(repeat, repeat);
      if (isColor) tex.colorSpace = THREE.SRGBColorSpace;
      tex.needsUpdate = true;
      resolve(tex);
    };
    img.onerror = () => {
      const loader = new THREE.TextureLoader();
      loader.setCrossOrigin("anonymous");
      loader.load(
        imgSrc,
        (t) => {
          t.wrapS = THREE.RepeatWrapping;
          t.wrapT = THREE.RepeatWrapping;
          t.repeat.set(repeat, repeat);
          if (isColor) t.colorSpace = THREE.SRGBColorSpace;
          t.needsUpdate = true;
          resolve(t);
        },
        undefined,
        () => resolve(new THREE.Texture())
      );
    };
    img.src = imgSrc;
  });
}

/**
 * Malla individual de pieza con soporte de m.position y geometría Grasshopper
 */
function SinglePieceBoardRenderer({
  meshData,
  sharedMaterial,
  hardwareMaterial,
}: {
  meshData: any;
  sharedMaterial: React.ReactNode;
  hardwareMaterial: React.ReactNode;
}) {
  const geometry = useMemo(() => {
    if (meshData.vertices && meshData.indices && meshData.vertices.length > 0 && meshData.indices.length > 0) {
      const geo = new THREE.BufferGeometry();
      geo.setAttribute("position", new THREE.Float32BufferAttribute(meshData.vertices, 3));
      geo.setIndex(meshData.indices);
      geo.computeVertexNormals();

      if (meshData.uvs && meshData.uvs.length > 0) {
        geo.setAttribute("uv", new THREE.Float32BufferAttribute(meshData.uvs, 2));
      } else {
        const nonIndexed = geo.toNonIndexed();
        const pos = nonIndexed.attributes.position;
        const uvs = new Float32Array(pos.count * 2);
        for (let i = 0; i < pos.count; i += 3) {
          const pA = new THREE.Vector3(pos.getX(i), pos.getY(i), pos.getZ(i));
          const pB = new THREE.Vector3(pos.getX(i + 1), pos.getY(i + 1), pos.getZ(i + 1));
          const pC = new THREE.Vector3(pos.getX(i + 2), pos.getY(i + 2), pos.getZ(i + 2));
          const normal = new THREE.Vector3().subVectors(pC, pB).cross(new THREE.Vector3().subVectors(pA, pB)).normalize();
          const absX = Math.abs(normal.x);
          const absY = Math.abs(normal.y);
          const absZ = Math.abs(normal.z);

          for (let j = 0; j < 3; j++) {
            const idx = i + j;
            const x = pos.getX(idx);
            const y = pos.getY(idx);
            const z = pos.getZ(idx);
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
        nonIndexed.setAttribute("uv", new THREE.BufferAttribute(uvs, 2));
        nonIndexed.computeVertexNormals();
        return nonIndexed;
      }
      return geo;
    }

    if (meshData.size && meshData.size.length === 3) {
      return new THREE.BoxGeometry(meshData.size[0], meshData.size[1], meshData.size[2]);
    }

    return null;
  }, [meshData]);

  const { calibracion } = use3BFStore();

  const edgesGeometry = useMemo(() => {
    if (!geometry) return null;
    try {
      return new THREE.EdgesGeometry(geometry, calibracion.thresholdAristas || 25);
    } catch {
      return null;
    }
  }, [geometry, calibracion.thresholdAristas]);

  if (!geometry) return null;

  const n = (meshData.name || "").toLowerCase();
  const isHardware =
    (n.includes("perno") || n.includes("caja") || n.includes("tarugo") || n.includes("tornillo") || n.includes("pata") || n.includes("soporte")) &&
    !n.includes("cajon") &&
    !n.includes("cajón");

  const pos: [number, number, number] = meshData.position && meshData.position.length === 3
    ? [meshData.position[0], meshData.position[1], meshData.position[2]]
    : [0, 0, 0];

  const mostrarAristas = calibracion.mostrarAristas !== false;
  const colorAristas = calibracion.colorAristas || "#111827";
  const opacidadAristas = calibracion.opacidadAristas ?? 0.75;

  return (
    <group position={pos}>
      <mesh geometry={geometry} castShadow receiveShadow>
        {isHardware ? hardwareMaterial : sharedMaterial}
      </mesh>
      {mostrarAristas && edgesGeometry && !isHardware && (
        <lineSegments geometry={edgesGeometry}>
          <lineBasicMaterial
            color={colorAristas}
            transparent={opacidadAristas < 1.0}
            opacity={opacidadAristas}
            depthTest={true}
          />
        </lineSegments>
      )}
    </group>
  );
}

/**
 * Renderiza todas las instancias y piezas del Mueble Paramétrico Real del escenario
 */
function RealFurnitureSceneRenderer({
  sharedMaterial,
  hardwareMaterial,
}: {
  sharedMaterial: React.ReactNode;
  hardwareMaterial: React.ReactNode;
}) {
  const { instancias, resultado, parametros } = use3BFStore();

  const listaInstancias: ObjetoInstancia3BF[] = useMemo(() => {
    const list = Object.values(instancias);
    if (list.length > 0) return list;

    if (resultado && resultado.real_meshes && resultado.real_meshes.length > 0) {
      return [
        {
          id: "default_active_inst",
          nombreVisible: parametros.model_id || "Mueble 3BF",
          definitionId: parametros.model_id || "mueble",
          archivo: parametros.custom_filename || "mueble.ghx",
          parametros: parametros as any,
          resultado: resultado,
          cargando: false,
          posicion: [0, 0, 0],
          rotacion: [0, 0, 0],
          posicionPrevia: [0, 0, 0],
        },
      ];
    }
    return [];
  }, [instancias, resultado, parametros]);

  if (listaInstancias.length === 0) {
    // Fallback elegante si no hay mallas calculadas aún
    return (
      <group position={[0, -0.4, 0]}>
        <mesh position={[-0.9, 0.45, 0]} castShadow receiveShadow>
          <boxGeometry args={[0.04, 0.9, 0.4]} />
          {sharedMaterial}
        </mesh>
        <mesh position={[0.9, 0.45, 0]} castShadow receiveShadow>
          <boxGeometry args={[0.04, 0.9, 0.4]} />
          {sharedMaterial}
        </mesh>
        <mesh position={[0, 0.02, 0]} castShadow receiveShadow>
          <boxGeometry args={[1.76, 0.04, 0.4]} />
          {sharedMaterial}
        </mesh>
        <mesh position={[0, 0.9, 0]} castShadow receiveShadow>
          <boxGeometry args={[1.84, 0.04, 0.42]} />
          {sharedMaterial}
        </mesh>
        <mesh position={[-0.3, 0.45, 0]} castShadow receiveShadow>
          <boxGeometry args={[0.036, 0.84, 0.38]} />
          {sharedMaterial}
        </mesh>
        <mesh position={[0.3, 0.45, 0]} castShadow receiveShadow>
          <boxGeometry args={[0.036, 0.84, 0.38]} />
          {sharedMaterial}
        </mesh>
        <mesh position={[0, 0.45, 0]} castShadow receiveShadow>
          <boxGeometry args={[1.76, 0.036, 0.38]} />
          {sharedMaterial}
        </mesh>
      </group>
    );
  }

  return (
    <group position={[0, 0, 0]}>
      {listaInstancias.map((inst) => {
        const rawMeshes = inst.resultado?.real_meshes || [];
        const namesWith2 = new Set(rawMeshes.filter((m: any) => m.name?.endsWith("2")).map((m: any) => m.name.slice(0, -1)));
        const cleanMeshes = rawMeshes.filter((m: any) => {
          if (!m.name?.endsWith("2") && namesWith2.has(m.name)) return false;
          return true;
        });

        const instPos = inst.posicion || [0, 0, 0];

        return (
          <group key={inst.id} position={instPos}>
            {cleanMeshes.map((m: any, idx: number) => (
              <SinglePieceBoardRenderer
                key={`${inst.id}-piece-${idx}`}
                meshData={m}
                sharedMaterial={sharedMaterial}
                hardwareMaterial={hardwareMaterial}
              />
            ))}
          </group>
        );
      })}
    </group>
  );
}

function MaterialMeshInstance({
  materialDef,
  forma = "esfera",
  envMap,
}: {
  materialDef: MaterialPBRDef;
  forma: "esfera" | "tablero" | "cubo" | "mueble";
  envMap: THREE.Texture | null;
}) {
  const [textures, setTextures] = useState<{
    diffuse: THREE.Texture | null;
    normal: THREE.Texture | null;
    roughness: THREE.Texture | null;
    metallic: THREE.Texture | null;
    ao: THREE.Texture | null;
  }>({ diffuse: null, normal: null, roughness: null, metallic: null, ao: null });

  useEffect(() => {
    let activo = true;

    async function cargarTodas() {
      const promises: Promise<any>[] = [];

      if (materialDef.texturaUrl) {
        promises.push(
          createConfiguredTexture(materialDef.texturaUrl, true, 1.8).then((t) => ({ key: "diffuse", tex: t }))
        );
      } else {
        promises.push(Promise.resolve({ key: "diffuse", tex: null }));
      }

      if (materialDef.normalMapUrl) {
        promises.push(
          createConfiguredTexture(materialDef.normalMapUrl, false, 1.8).then((t) => ({ key: "normal", tex: t }))
        );
      } else {
        promises.push(Promise.resolve({ key: "normal", tex: null }));
      }

      if (materialDef.roughnessMapUrl) {
        promises.push(
          createConfiguredTexture(materialDef.roughnessMapUrl, false, 1.8).then((t) => ({ key: "roughness", tex: t }))
        );
      } else {
        promises.push(Promise.resolve({ key: "roughness", tex: null }));
      }

      if (materialDef.aoMapUrl) {
        promises.push(
          createConfiguredTexture(materialDef.aoMapUrl, false, 1.8).then((t) => ({ key: "ao", tex: t }))
        );
      } else {
        promises.push(Promise.resolve({ key: "ao", tex: null }));
      }

      const results = await Promise.all(promises);
      if (!activo) return;

      const newMap: any = { diffuse: null, normal: null, roughness: null, metallic: null, ao: null };
      results.forEach((r) => {
        if (r && r.key) newMap[r.key] = r.tex;
      });
      setTextures(newMap);
    }

    cargarTodas();

    return () => {
      activo = false;
    };
  }, [
    materialDef.texturaUrl,
    materialDef.normalMapUrl,
    materialDef.roughnessMapUrl,
    materialDef.metallicMapUrl,
    materialDef.aoMapUrl,
  ]);

  const normalScaleVal = materialDef.normalScale ?? 1.2;
  const isWoodOrMelamine = materialDef.tipo === "Melamina" || materialDef.tipo === "Madera";
  const baseColorFinal = materialDef.texturaUrl
    ? "#FFFFFF"
    : (materialDef.colorBase || (isWoodOrMelamine ? "#D2B48C" : "#8A9EA7"));

  const roughnessVal = materialDef.rugosidad ?? (isWoodOrMelamine ? 0.55 : 0.25);
  const metalnessVal = materialDef.metalico ?? (isWoodOrMelamine ? 0.05 : 0.85);

  const sharedMaterial = useMemo(() => {
    return (
      <meshPhysicalMaterial
        key={`${materialDef.id}-${materialDef.texturaUrl || "no-tex"}-${materialDef.normalMapUrl || "no-norm"}-${roughnessVal}-${metalnessVal}-${forma}`}
        color={baseColorFinal}
        map={textures.diffuse}
        normalMap={textures.normal}
        normalScale={textures.normal ? new THREE.Vector2(normalScaleVal, normalScaleVal) : undefined}
        roughnessMap={textures.roughness}
        roughness={roughnessVal}
        metalness={metalnessVal}
        aoMap={textures.ao}
        aoMapIntensity={materialDef.aoIntensity ?? 1.0}
        envMap={envMap}
        envMapIntensity={0.8}
        clearcoat={materialDef.clearcoat ?? 0.0}
        clearcoatRoughness={materialDef.clearcoatRoughness ?? 0.35}
        ior={materialDef.ior ?? 1.5}
        transparent={materialDef.opacidad < 1.0}
        opacity={materialDef.opacidad ?? 1.0}
        reflectivity={materialDef.especularidad ?? 0.5}
      />
    );
  }, [
    materialDef.id,
    materialDef.texturaUrl,
    materialDef.normalMapUrl,
    materialDef.clearcoat,
    materialDef.clearcoatRoughness,
    materialDef.ior,
    materialDef.opacidad,
    materialDef.especularidad,
    baseColorFinal,
    textures,
    normalScaleVal,
    roughnessVal,
    metalnessVal,
    envMap,
    forma,
  ]);

  const hardwareMaterial = useMemo(() => {
    return (
      <meshStandardMaterial
        color="#8A9EA7"
        metalness={0.9}
        roughness={0.25}
        envMap={envMap}
      />
    );
  }, [envMap]);

  if (forma === "mueble") {
    return <RealFurnitureSceneRenderer sharedMaterial={sharedMaterial} hardwareMaterial={hardwareMaterial} />;
  }

  if (forma === "tablero") {
    return (
      <mesh position={[0, 0, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.35, 1.35, 0.08, 16, 16, 4]} />
        {sharedMaterial}
      </mesh>
    );
  }

  if (forma === "cubo") {
    return (
      <mesh position={[0, 0, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.15, 1.15, 1.15, 16, 16, 16]} />
        {sharedMaterial}
      </mesh>
    );
  }

  return (
    <mesh position={[0, 0, 0]} castShadow receiveShadow>
      <sphereGeometry args={[0.85, 64, 64]} />
      {sharedMaterial}
    </mesh>
  );
}

// Controlador de Navegación idéntico a Blender (MMB Orbit, Shift+MMB Pan, Ctrl+MMB Zoom)
function BlenderNavigationController({ controlsRef }: { controlsRef: React.RefObject<any> }) {
  const { camera, gl } = useThree();

  React.useEffect(() => {
    const domElement = gl.domElement;
    let isMiddleDragging = false;
    let isCtrlZooming = false;
    let isShiftPanning = false;
    let prevY = 0;
    let prevX = 0;

    const handlePointerDown = (e: PointerEvent) => {
      if (e.button === 1) { // Rueda / MMB
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
          if (controlsRef.current) controlsRef.current.enabled = true;
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
        const target = controls.target || new THREE.Vector3(0, 0, 0);
        const offset = camera.position.clone().sub(target);
        const currentDist = offset.length();
        const zoomSpeed = 0.007;
        const scaleFactor = Math.max(0.1, 1.0 + (deltaY * zoomSpeed));
        const newDist = Math.max(0.2, Math.min(25.0, currentDist * scaleFactor));
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
        if (controlsRef.current) controlsRef.current.enabled = true;
      }
    };

    domElement.addEventListener("pointerdown", handlePointerDown);
    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);

    return () => {
      domElement.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };
  }, [gl, camera, controlsRef]);

  return null;
}

// Entorno de Luces Físicas Balanceadas
function StudioLighting({
  rotacionLuz = 45,
  intensidad = 1.0,
  sombraOpacidad = 0.22,
  sombraDifuminado = 2.4,
}: {
  rotacionLuz?: number;
  intensidad?: number;
  sombraOpacidad?: number;
  sombraDifuminado?: number;
}) {
  const rad = (rotacionLuz * Math.PI) / 180;
  const lightDist = 4.0;
  const lx = Math.cos(rad) * lightDist;
  const lz = Math.sin(rad) * lightDist;

  return (
    <>
      <ambientLight intensity={0.95 * intensidad} color="#FFFFFF" />
      <directionalLight
        position={[lx, 4.0, lz]}
        intensity={0.6 * intensidad}
        color="#FFFDF8"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0001}
        shadow-radius={Math.max(1, sombraDifuminado * 1.5)}
      />
      <hemisphereLight
        args={["#FFFFFF", "#E2E8F0", 0.75 * intensidad]}
      />
    </>
  );
}

function ShaderBallSnapshotExposer() {
  const { gl } = useThree();
  useEffect(() => {
    (window as any).__capturarShaderBallSnapshot = () => {
      try {
        return gl.domElement.toDataURL("image/png");
      } catch (e) {
        console.warn("Error capturando snapshot de ShaderBall:", e);
        return "";
      }
    };
    return () => {
      delete (window as any).__capturarShaderBallSnapshot;
    };
  }, [gl]);
  return null;
}

export default function ShaderBallViewer({
  materialDef,
  forma = "esfera",
  hdriConfig = {
    tipo: "alps_field_sol",
    intensidad: 1.0,
    rotacion: 45,
    mostrarFondo: true,
    blurFondo: 0.5,
    sombraOpacidad: 0.22,
    sombraDifuminado: 2.4,
  },
  mostrarSuelo = true,
}: ShaderBallViewerProps) {
  const controlsRef = useRef<any>(null);
  const [customHdrTexture, setCustomHdrTexture] = useState<THREE.DataTexture | null>(null);

  const sombraOpacidad = hdriConfig.sombraOpacidad ?? 0.22;
  const sombraDifuminado = hdriConfig.sombraDifuminado ?? 2.4;

  useEffect(() => {
    if (hdriConfig.tipo === "modern_bathroom") {
      try {
        const loader = new RGBELoader();
        loader.load(
          "/textures/hdri/modern_bathroom_1k.hdr",
          (tex) => {
            tex.mapping = THREE.EquirectangularReflectionMapping;
            setCustomHdrTexture(tex);
          },
          undefined,
          (err) => console.warn("Error cargando HDR modern_bathroom:", err)
        );
      } catch (e) {
        console.warn("Excepción RGBELoader:", e);
      }
    } else if (hdriConfig.tipo === "personalizado" && hdriConfig.customHdrUrl) {
      try {
        const loader = new RGBELoader();
        loader.load(
          hdriConfig.customHdrUrl,
          (tex) => {
            tex.mapping = THREE.EquirectangularReflectionMapping;
            setCustomHdrTexture(tex);
          },
          undefined,
          (err) => console.warn("Error cargando HDR custom:", err)
        );
      } catch (e) {
        console.warn("Excepción RGBELoader:", e);
      }
    } else {
      setCustomHdrTexture(null);
    }
  }, [hdriConfig.tipo, hdriConfig.customHdrUrl]);

  const envMap = useMemo(() => {
    if ((hdriConfig.tipo === "personalizado" || hdriConfig.tipo === "modern_bathroom") && customHdrTexture) {
      return customHdrTexture;
    }
    return generarEntornoEquirectangularLocal(hdriConfig.tipo, hdriConfig.rotacion);
  }, [hdriConfig.tipo, hdriConfig.rotacion, customHdrTexture]);

  const cameraPos: [number, number, number] = forma === "mueble" ? [1.8, 1.3, 2.2] : [0, 0, 2.5];
  const targetPos: [number, number, number] = forma === "mueble" ? [0, 0.4, 0] : [0, 0, 0];
  const sueloY = forma === "mueble" ? -0.01 : -0.92;

  return (
    <div className="w-full h-full relative rounded-lg overflow-hidden bg-gradient-to-b from-slate-50 via-slate-100 to-slate-200 dark:from-slate-900 dark:via-slate-900 dark:to-slate-950 shadow-inner">
      <Canvas
        camera={{ position: cameraPos, fov: 45 }}
        shadows
        gl={{ antialias: true, alpha: true, preserveDrawingBuffer: true, toneMapping: THREE.ACESFilmicToneMapping }}
      >
        <ShaderBallSnapshotExposer />
        <StudioLighting
          rotacionLuz={hdriConfig.rotacion}
          intensidad={hdriConfig.intensidad}
          sombraOpacidad={sombraOpacidad}
          sombraDifuminado={sombraDifuminado}
        />

        <MaterialMeshInstance materialDef={materialDef} forma={forma} envMap={envMap} />

        {/* Suelo Ciclorama Blanco con Sombras Físicas de Contacto Calibradas */}
        {mostrarSuelo && (
          <>
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, sueloY, 0]} receiveShadow>
              <planeGeometry args={[25, 25]} />
              <shadowMaterial opacity={sombraOpacidad * 0.5} />
            </mesh>
            <ContactShadows
              position={[0, sueloY + 0.005, 0]}
              opacity={sombraOpacidad}
              scale={forma === "mueble" ? 6.5 : 3.5}
              blur={sombraDifuminado}
              far={3.0}
            />
          </>
        )}

        <OrbitControls
          ref={controlsRef}
          makeDefault
          enabled={true}
          target={targetPos}
          minDistance={0.02}
          maxDistance={30.0}
          enableDamping={true}
          dampingFactor={0.05}
          screenSpacePanning={true}
          mouseButtons={{
            LEFT: THREE.MOUSE.ROTATE,
            MIDDLE: THREE.MOUSE.ROTATE,
            RIGHT: THREE.MOUSE.PAN,
          }}
        />

        <BlenderNavigationController controlsRef={controlsRef} />
      </Canvas>

      {/* Badge del Material Activo */}
      <div className="absolute top-2.5 left-2.5 px-2.5 py-1 rounded-md bg-slate-950/80 text-white backdrop-blur-xs font-mono text-[11px] flex items-center gap-2 border border-white/10 shadow-sm pointer-events-none">
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        <span className="font-bold">{materialDef.nombre || "Material PBR"}</span>
        <span className="opacity-60 text-[10px]">({forma.toUpperCase()})</span>
      </div>
    </div>
  );
}
