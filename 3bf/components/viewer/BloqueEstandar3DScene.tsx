"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";
import { PasoManualStudio } from "@/lib/store";

interface BloqueEstandar3DSceneProps {
  paso: PasoManualStudio;
  timelineTime: number;
}

// Singleton para reutilizar Web Workers de Draco y evitar reinicios pesados
let sharedDracoLoader: DRACOLoader | null = null;
let sharedGLTFLoader: GLTFLoader | null = null;

function getGLTFLoader(): GLTFLoader {
  if (!sharedGLTFLoader && typeof window !== "undefined") {
    sharedDracoLoader = new DRACOLoader();
    sharedDracoLoader.setDecoderPath("/draco/gltf/");
    sharedGLTFLoader = new GLTFLoader();
    sharedGLTFLoader.setDRACOLoader(sharedDracoLoader);
  }
  return sharedGLTFLoader!;
}

// Suavizado cúbico para animación realista
function easeInOutCubic(x: number): number {
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
}

function easeOutQuad(x: number): number {
  return 1 - (1 - x) * (1 - x);
}

export default function BloqueEstandar3DScene({ paso, timelineTime }: BloqueEstandar3DSceneProps) {
  const [modelosCargados, setModelosCargados] = useState<{
    fija?: THREE.Group;
    intermedia?: THREE.Group;
    movil?: THREE.Group;
    seguro?: THREE.Group;
  }>({});

  const groupRef = useRef<THREE.Group>(null);
  const fijaRef = useRef<THREE.Group>(null);
  const intermediaRef = useRef<THREE.Group>(null);
  const movilRef = useRef<THREE.Group>(null);
  const seguroRef = useRef<THREE.Group>(null);

  // Materiales físicos realistas calibrados para escena Three.js (sin HDR)
  const materialAceroGalvanizado = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: new THREE.Color("#cbd5e1"), // Acero galvanizado brillante
      metalness: 0.45,
      roughness: 0.28,
    });
  }, []);

  const materialAceroIntermedio = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: new THREE.Color("#94a3b8"), // Riel intermedio ligeramente satinado
      metalness: 0.40,
      roughness: 0.32,
    });
  }, []);

  const materialNylonNegro = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: new THREE.Color("#0f172a"), // Palanca de nylon negro mate
      metalness: 0.05,
      roughness: 0.65,
    });
  }, []);

  // Cargar los 4 GLB con DRACOLoader singleton optimizado
  useEffect(() => {
    let isMounted = true;
    const loader = getGLTFLoader();

    // Resolver rutas dinámicas desde el paso activo
    const partes = paso.bloqueEstandar?.partesGlb || [];
    const carpeta = paso.bloqueEstandar?.carpetaModelos || "/library/bloques/modelos/corredera_telescopica_350";

    const getRuta = (keyword: string, fallbackFileName: string) => {
      const encontrada = partes.find((p) =>
        (p.id || "").toLowerCase().includes(keyword) || (p.nombre || "").toLowerCase().includes(keyword)
      );
      if (encontrada?.archivo) return encontrada.archivo;
      return `${carpeta}/${fallbackFileName}`;
    };

    const rutaFija = getRuta("fija", "Fija.glb");
    const rutaIntermedia = getRuta("intermedia", "Intermedia.glb");
    const rutaMovil = getRuta("movil", "Movil.glb");
    const rutaSeguro = getRuta("seguro", "Seguro.glb");

    const cargarGlb = (url: string, rol: "fija" | "intermedia" | "movil" | "seguro"): Promise<THREE.Group | null> => {
      return new Promise((resolve) => {
        loader.load(
          url,
          (gltf) => {
            const escena = gltf.scene;
            escena.traverse((child) => {
              if ((child as THREE.Mesh).isMesh) {
                const mesh = child as THREE.Mesh;
                mesh.castShadow = true;
                mesh.receiveShadow = true;
                if (rol === "seguro") {
                  mesh.material = materialNylonNegro;
                } else if (rol === "intermedia") {
                  mesh.material = materialAceroIntermedio;
                } else {
                  mesh.material = materialAceroGalvanizado;
                }
              }
            });
            resolve(escena);
          },
          undefined,
          (err) => {
            console.warn(`[BloqueEstandar3D] Error cargando ${url}:`, err);
            resolve(null);
          }
        );
      });
    };

    Promise.all([
      cargarGlb(rutaFija, "fija"),
      cargarGlb(rutaIntermedia, "intermedia"),
      cargarGlb(rutaMovil, "movil"),
      cargarGlb(rutaSeguro, "seguro"),
    ]).then(([fija, intermedia, movil, seguro]) => {
      if (!isMounted) return;
      setModelosCargados({
        fija: fija || undefined,
        intermedia: intermedia || undefined,
        movil: movil || undefined,
        seguro: seguro || undefined,
      });
    });

    return () => {
      isMounted = false;
    };
  }, [
    paso.bloqueEstandar?.id,
    paso.bloqueEstandar?.carpetaModelos,
    JSON.stringify(paso.bloqueEstandar?.partesGlb),
    materialAceroGalvanizado,
    materialAceroIntermedio,
    materialNylonNegro,
  ]);

  const seguroPivotRef = useRef<THREE.Group>(null);

  // 🎬 Animación Cinemática de Desacople según el Timeline adaptativa a la duración total del paso
  useEffect(() => {
    const duracion = Math.max(paso.duracionTotal || 8.0, 1.0);
    const t = Math.max(0, Math.min(duracion, timelineTime));

    // Centrado de la corredera: la corredera mide 350mm en Z (-0.35 a 0.0).
    // La desplazamos +0.175 en Z para que su punto medio quede exactamente en el origen (0, 0, 0).
    const centroZOffset = 0.175;

    // Fases temporales proporcionales a la duración del paso:
    const durExt = duracion * 0.35;        // 35% del tiempo en extensión suave
    const startGiro = duracion * 0.35;     // Inicia giro de la palanca al terminar la extensión
    const durGiro = duracion * 0.15;       // 15% del tiempo para rotar la palanca a 10°
    const startSep = duracion * 0.50;      // Inicia desacople al llegar al 50% de la duración
    const durSep = duracion * 0.30;        // 30% del tiempo para separar la corredera móvil
    const startRetorno = duracion * 0.78;  // Retorno elástico del seguro hacia el 78%
    const durRetorno = duracion * 0.11;    // 11% para volver a 0° (del 78% al 89%)
    // El restante 11% (89% a 100%) permanece en reposo pedagógico final para apreciación visual

    // ── FASE 1: EXTENSIÓN TOTAL (0% -> 35%) ──────────────────────────────────
    // Las 3 partes metálicas se extienden suavemente.
    // El seguro viaja 100% SOLIDARIO con la pieza móvil (0° de rotación).
    const tExt = Math.min(durExt, t);
    const pExt = easeInOutCubic(durExt > 0 ? tExt / durExt : 1);
    const despIntermedia = pExt * 0.145; // 145mm hacia adelante (+Z)
    const despMovilFase1 = pExt * 0.275; // 275mm hacia adelante (+Z, máxima extensión)

    // ── FASE 2 & 4: ROTACIÓN Y RETORNO ELÁSTICO DEL SEGURO ────────────────────
    // De 35% a 50%: Gira 10 grados en su centro de giro (red dot).
    // De 50% a 78%: Se mantiene en 10° mientras se desplaza y se separa en Z.
    // De 78% a 89%: Regresa elásticamente a su sitio (de 10° a 0°).
    let rotSeguroY = 0;
    if (t > startGiro && t <= startRetorno) {
      const tGiro = Math.min(durGiro, t - startGiro);
      const pGiro = easeInOutCubic(durGiro > 0 ? tGiro / durGiro : 1);
      // 10 grados en radianes (sentido hacia el riel)
      rotSeguroY = -pGiro * ((10.0 * Math.PI) / 180);
    } else if (t > startRetorno) {
      const tRetorno = Math.min(durRetorno, t - startRetorno);
      const pRetorno = easeInOutCubic(durRetorno > 0 ? tRetorno / durRetorno : 1);
      // Regresa elásticamente a 0° (a su posición de reposo inicial)
      rotSeguroY = -(1 - pRetorno) * ((10.0 * Math.PI) / 180);
    }

    // ── FASE 3: DESACOPLE Y SEPARACIÓN RECTA (50% -> 80%) ─────────────────────
    // La PIEZA MÓVIL y el SEGURO (juntos solidarios) se separan completamente
    // avanzando en línea recta a lo largo de la corredera, SIN levantamiento para no colisionar.
    let despSeparacionZ = 0;
    if (t > startSep) {
      const tSep = Math.min(durSep, t - startSep);
      const pSep = easeInOutCubic(durSep > 0 ? tSep / durSep : 1);
      // 320mm hacia adelante: despeja completamente la guía intermedia (100mm de luz libre)
      despSeparacionZ = pSep * 0.32;
    }

    const posTotalMovilZ = centroZOffset + despMovilFase1 + despSeparacionZ;

    // 1. Guía Fija: Anclada fija en la base (se queda en el mueble)
    if (fijaRef.current) {
      fijaRef.current.position.set(0, 0, centroZOffset);
    }

    // 2. Guía Intermedia: Permanece extendida en su sitio (se queda en el mueble)
    if (intermediaRef.current) {
      intermediaRef.current.position.set(0, 0, centroZOffset + despIntermedia);
    }

    // 3. Guía Móvil: Se extiende y se separa 100% en línea recta (parte del cajón)
    if (movilRef.current) {
      movilRef.current.position.set(0, 0, posTotalMovilZ);
    }

    // 4. Seguro de Nylon: Viaja SOLIDARIO AL 100% con la Guía Móvil en todo momento
    if (seguroRef.current) {
      seguroRef.current.position.set(0, 0, posTotalMovilZ);
    }
    if (seguroPivotRef.current) {
      seguroPivotRef.current.rotation.set(0, rotSeguroY, 0);
    }
  }, [timelineTime, paso.duracionTotal]);

  // Exponer el grupo en window para que el exportador GLB pueda capturarlo directamente
  useEffect(() => {
    if (typeof window !== "undefined" && groupRef.current) {
      (window as any).__bloqueEstandarGroup = groupRef.current;
    }
  });

  // Coordenadas del centro de giro (red dot en el ojal del seguro)
  const PIVOTE_SEGURO: [number, number, number] = [0.001, 0.0016, -0.159];
  const CENTRO_Z_OFFSET = 0.175;

  return (
    <group ref={groupRef} position={[0, 0.08, 0]}>
      {/* 1. Guía Fija (inicializada en CENTRO_Z_OFFSET desde el primer fotograma) */}
      {modelosCargados.fija && (
        <group ref={fijaRef} name="Guia_Fija" position={[0, 0, CENTRO_Z_OFFSET]}>
          <primitive object={modelosCargados.fija} />
        </group>
      )}

      {/* 2. Guía Intermedia */}
      {modelosCargados.intermedia && (
        <group ref={intermediaRef} name="Guia_Intermedia" position={[0, 0, CENTRO_Z_OFFSET]}>
          <primitive object={modelosCargados.intermedia} />
        </group>
      )}

      {/* 3. Guía Móvil */}
      {modelosCargados.movil && (
        <group ref={movilRef} name="Guia_Movil" position={[0, 0, CENTRO_Z_OFFSET]}>
          <primitive object={modelosCargados.movil} />
        </group>
      )}

      {/* 4. Seguro / Palanca de Nylon con Pivote Real de Giro */}
      {modelosCargados.seguro && (
        <group ref={seguroRef} name="Seguro_Group" position={[0, 0, CENTRO_Z_OFFSET]}>
          {/* Subgrupo centrado en el pivote del seguro */}
          <group position={PIVOTE_SEGURO}>
            <group ref={seguroPivotRef} name="Seguro_Pivot">
              <group position={[-PIVOTE_SEGURO[0], -PIVOTE_SEGURO[1], -PIVOTE_SEGURO[2]]}>
                <primitive object={modelosCargados.seguro} />
              </group>
            </group>
          </group>
        </group>
      )}
    </group>
  );
}
