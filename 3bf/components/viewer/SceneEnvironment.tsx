"use client";

import React, { useEffect } from "react";
import * as THREE from "three";
import { useThree } from "@react-three/fiber";
import { RGBELoader } from "three/examples/jsm/loaders/RGBELoader.js";
import { use3BFStore, DEFAULT_HDRI_CONFIG } from "@/lib/store";
import { generarEntornoEquirectangularLocal } from "./ShaderBallViewer";

export function generarThumbnailDesdeDataTexture(tex: THREE.DataTexture): string | null {
  try {
    if (!tex.image || !tex.image.data || !tex.image.width || !tex.image.height) return null;
    const { width, height, data } = tex.image;
    const canvas = document.createElement("canvas");
    canvas.width = Math.min(width, 256);
    canvas.height = Math.min(height, 128);
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    const imgData = ctx.createImageData(canvas.width, canvas.height);
    const stepX = width / canvas.width;
    const stepY = height / canvas.height;

    for (let y = 0; y < canvas.height; y++) {
      for (let x = 0; x < canvas.width; x++) {
        const srcX = Math.floor(x * stepX);
        const srcY = Math.floor(y * stepY);
        const srcIdx = (srcY * width + srcX) * 4;
        const dstIdx = (y * canvas.width + x) * 4;

        // Tono mapping simple Reinhard y conversión sRGB aproximada
        const r = data[srcIdx];
        const g = data[srcIdx + 1];
        const b = data[srcIdx + 2];

        // Mapeo HDR a LDR básico
        const mapColor = (val: number) => {
          const v = Math.max(0, val);
          const mapped = v / (1.0 + v);
          return Math.min(255, Math.floor(Math.pow(mapped, 1.0 / 2.2) * 255));
        };

        imgData.data[dstIdx] = mapColor(r);
        imgData.data[dstIdx + 1] = mapColor(g);
        imgData.data[dstIdx + 2] = mapColor(b);
        imgData.data[dstIdx + 3] = 255;
      }
    }

    ctx.putImageData(imgData, 0, 0);
    return canvas.toDataURL("image/jpeg", 0.85);
  } catch {
    return null;
  }
}

export function SceneEnvironment({ modoVisual }: { modoVisual: string }) {
  const { scene } = useThree();
  const calibracion = use3BFStore((s) => s.calibracion);
  const setLuzPropiedad = use3BFStore((s) => s.setLuzPropiedad);
  const luzEntorno = calibracion.lucesEstudio?.["env_hdri"];
  const activa = luzEntorno ? luzEntorno.activa : true;
  const intensidad = activa ? (luzEntorno?.intensidad ?? calibracion.intensidadLuzEntorno ?? 0.55) : 0.0;
  const azimut = luzEntorno?.azimut ?? 45;
  const hdriUrl = luzEntorno?.hdriUrl || DEFAULT_HDRI_CONFIG.url;

  useEffect(() => {
    if (modoVisual !== "renderizado" || !activa || intensidad <= 0.001) {
      scene.environment = null;
      if ("environmentIntensity" in scene) {
        (scene as any).environmentIntensity = 0;
      }
      return;
    }

    if ("environmentIntensity" in scene) {
      (scene as any).environmentIntensity = intensidad;
    }
    if ("environmentRotation" in scene && (scene as any).environmentRotation) {
      (scene as any).environmentRotation.set(0, THREE.MathUtils.degToRad(azimut), 0);
    }

    let active = true;
    const lowerUrl = hdriUrl.toLowerCase();
    const isImage = lowerUrl.endsWith(".jpg") || lowerUrl.endsWith(".jpeg") || lowerUrl.endsWith(".png") || lowerUrl.endsWith(".webp") || lowerUrl.startsWith("data:image/");

    if (isImage) {
      const loader = new THREE.TextureLoader();
      loader.load(
        hdriUrl,
        (tex) => {
          if (!active) return;
          tex.mapping = THREE.EquirectangularReflectionMapping;
          tex.colorSpace = THREE.SRGBColorSpace;
          tex.needsUpdate = true;
          scene.environment = tex;
          if ("environmentIntensity" in scene) {
            (scene as any).environmentIntensity = intensidad;
          }
        },
        undefined,
        (err) => {
          console.warn("Error cargando imagen panorámica de entorno:", err);
          if (!active) return;
          const fallbackEnv = generarEntornoEquirectangularLocal("alps_field_sol", azimut);
          scene.environment = fallbackEnv;
          if ("environmentIntensity" in scene) {
            (scene as any).environmentIntensity = intensidad;
          }
        }
      );
    } else {
      try {
        const loader = new RGBELoader();
        loader.load(
          hdriUrl,
          (tex) => {
            if (!active) return;
            tex.mapping = THREE.EquirectangularReflectionMapping;
            scene.environment = tex;
            if ("environmentIntensity" in scene) {
              (scene as any).environmentIntensity = intensidad;
            }

            // Si es un archivo personalizado y aún no tiene miniatura, la generamos
            if (!luzEntorno?.hdriThumbnailUrl && tex.image?.data) {
              const thumbDataUrl = generarThumbnailDesdeDataTexture(tex);
              if (thumbDataUrl) {
                setLuzPropiedad("env_hdri", "hdriThumbnailUrl", thumbDataUrl);
              }
            }
          },
          undefined,
          () => {
            if (!active) return;
            const fallbackEnv = generarEntornoEquirectangularLocal("alps_field_sol", azimut);
            scene.environment = fallbackEnv;
            if ("environmentIntensity" in scene) {
              (scene as any).environmentIntensity = intensidad;
            }
          }
        );
      } catch {
        if (active) {
          const fallbackEnv = generarEntornoEquirectangularLocal("alps_field_sol", azimut);
          scene.environment = fallbackEnv;
          if ("environmentIntensity" in scene) {
            (scene as any).environmentIntensity = intensidad;
          }
        }
      }
    }

    return () => {
      active = false;
    };
  }, [scene, modoVisual, activa, hdriUrl]);

  // Actualización inmediata de intensidad y rotación a 60 FPS sin recargar textura HDRI
  useEffect(() => {
    if (scene.environment) {
      if ("environmentIntensity" in scene) {
        (scene as any).environmentIntensity = (modoVisual === "renderizado" && activa) ? intensidad : 0;
      }
      if ("environmentRotation" in scene && (scene as any).environmentRotation) {
        (scene as any).environmentRotation.set(0, THREE.MathUtils.degToRad(azimut), 0);
      }
    }
  }, [scene, modoVisual, activa, intensidad, azimut]);

  return null;
}

export default SceneEnvironment;
