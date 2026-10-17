"use client";

import React, { useState } from "react";
import * as THREE from "three";
import { use3BFStore } from "@/lib/store";
import {
  exportarGlbPasoManual,
  exportarGlbMuebleCompleto,
  descargarBufferComoArchivo,
} from "@/lib/exportManualGlb";
import { saveLocalARModel } from "@/lib/arStorage";

export function useGLBExport(furnitureGroup: THREE.Group | null) {
  const {
    parametros,
    instancias,
    pestanaActiva,
    pasosManual,
    pasoActivoManualId,
    timelineCurrentTime,
    isTimelinePlaying,
  } = use3BFStore();

  const [exportandoGLB, setExportandoGLB] = useState(false);
  const [generandoAR, setGenerandoAR] = useState(false);
  const [modalARAbierto, setModalARAbierto] = useState(false);
  const [arData, setArData] = useState<{
    id: string | null;
    sizeBefore?: number;
    sizeAfter?: number;
  }>({ id: null });

  /**
   * Obtiene la escena o grupo raíz Three.js activo del visor
   */
  const getActiveScene = (): THREE.Object3D | null => {
    if (furnitureGroup) {
      return furnitureGroup;
    }
    if (typeof window !== "undefined" && (window as any).__3bfInstanceGroups) {
      const map: Map<string, THREE.Group> = (window as any).__3bfInstanceGroups;
      if (map && map.size > 0) {
        return map.values().next().value || null;
      }
    }
    if (typeof window !== "undefined" && (window as any).__threeScene3BF) {
      return (window as any).__threeScene3BF;
    }
    return null;
  };

  /**
   * 1. Generador de ArrayBuffer limpio y optimizado usando el motor canónico de exportManualGlb
   */
  const generateCleanGLB = async (
    isForAR = false,
    includeEdges = false
  ): Promise<{ arrayBuffer: ArrayBuffer; piecesCount: number } | null> => {
    const scene = getActiveScene();
    if (!scene) {
      alert("Espera a que el modelo esté cargado en pantalla para exportar.");
      return null;
    }

    const modelName = parametros.model_id || "Cubierta";
    const res = await exportarGlbMuebleCompleto(scene, {
      isForAR,
      includeEdges,
      nombre: modelName,
      comprimir: false, // Retornar buffer original para que la fase siguiente decida
    });

    return {
      arrayBuffer: res.buffer,
      piecesCount: res.piecesCount,
    };
  };

  /**
   * 2. Exportación directa a archivo GLB descargable (con compresión Draco unificada)
   */
  const exportToGLB = async (comprimido = true) => {
    setExportandoGLB(true);
    try {
      const scene = getActiveScene();
      if (!scene) {
        alert("Espera a que el modelo esté cargado en pantalla para exportar.");
        setExportandoGLB(false);
        return;
      }

      const modelName = parametros.model_id || "Cubierta";

      const res = await exportarGlbMuebleCompleto(scene, {
        isForAR: false,
        nombre: modelName,
        comprimir: comprimido,
      });

      descargarBufferComoArchivo(res.buffer, res.filename);
      console.log(
        `[3dBimFab GLB Exporter] 🚀 Descarga completada: ${res.filename} (${res.sizeMb} MB, ${res.piecesCount} piezas)`
      );
    } catch (err: any) {
      console.error("[3dBimFab GLB Exporter] Error al exportar GLB:", err);
      alert("Error en exportación: " + (err?.message || err));
    } finally {
      setExportandoGLB(false);
    }
  };

  /**
   * 3. Descargar GLB unificado según la pestaña activa (Estático en 3D / Animado en Manual 3D)
   */
  const descargarGlbSegunModo = async () => {
    if (pestanaActiva === "manual") {
      const state = use3BFStore.getState();
      const pasos = state.pasosManual;
      const activeId = state.pasoActivoManualId;
      const pasoActivo = pasos.find((p) => p.id === activeId) || pasos[0];
      if (!pasoActivo) {
        exportToGLB(true);
        return;
      }
      try {
        setExportandoGLB(true);
        const prevTime = use3BFStore.getState().timelineCurrentTime;
        const prevPlaying = use3BFStore.getState().isTimelinePlaying;
        use3BFStore.setState({ isTimelinePlaying: false, timelineCurrentTime: 0 });

        if (typeof window !== "undefined" && (window as any).__3bfManualEngine) {
          (window as any).__3bfManualEngine.detener();
        }

        await new Promise((resolve) => setTimeout(resolve, 80));

        const scene = getActiveScene() || new THREE.Scene();
        const { buffer, filename, sizeMb } = await exportarGlbPasoManual(scene, pasoActivo);

        descargarBufferComoArchivo(buffer, filename);
        console.log(`[3dBimFab Manual] 🚀 GLB animado exportado: ${filename} (${sizeMb} MB)`);

        if (typeof window !== "undefined" && (window as any).__3bfManualEngine) {
          (window as any).__3bfManualEngine.actualizarTiempo(prevTime);
        }
        use3BFStore.setState({ timelineCurrentTime: prevTime, isTimelinePlaying: prevPlaying });
      } catch (err: any) {
        console.error("[3dBimFab Manual] Error al exportar paso animado:", err);
        alert(`Error al exportar paso animado: ${err.message}`);
      } finally {
        setExportandoGLB(false);
      }
    } else {
      exportToGLB(true);
    }
  };

  /**
   * 4. Abrir Realidad Aumentada "Ver en tu espacio" (ultra-optimizado para móviles)
   */
  const abrirRealidadAumentada = async () => {
    setGenerandoAR(true);
    try {
      let glbBuffer: ArrayBuffer;
      let modelName = parametros.model_id || "Cubierta";
      const scene = getActiveScene() || new THREE.Scene();

      if (pestanaActiva === "manual") {
        const state = use3BFStore.getState();
        const pasoActivo = state.pasosManual.find((p) => p.id === state.pasoActivoManualId) || state.pasosManual[0];
        if (pasoActivo) {
          modelName = `${modelName}_${pasoActivo.id}`;
          const prevTime = state.timelineCurrentTime;
          const prevPlaying = state.isTimelinePlaying;
          use3BFStore.setState({ isTimelinePlaying: false, timelineCurrentTime: 0 });

          if (typeof window !== "undefined" && (window as any).__3bfManualEngine) {
            (window as any).__3bfManualEngine.detener();
          }

          await new Promise((resolve) => setTimeout(resolve, 80));

          const { buffer } = await exportarGlbPasoManual(scene, pasoActivo);
          glbBuffer = buffer;

          if (typeof window !== "undefined" && (window as any).__3bfManualEngine) {
            (window as any).__3bfManualEngine.actualizarTiempo(prevTime);
          }
          use3BFStore.setState({ timelineCurrentTime: prevTime, isTimelinePlaying: prevPlaying });
        } else {
          const res = await exportarGlbMuebleCompleto(scene, {
            isForAR: true,
            nombre: modelName,
            comprimir: true,
          });
          glbBuffer = res.buffer;
        }
      } else {
        const res = await exportarGlbMuebleCompleto(scene, {
          isForAR: true,
          nombre: modelName,
          comprimir: true,
        });
        glbBuffer = res.buffer;
      }

      const ua = typeof navigator !== "undefined" ? navigator.userAgent || navigator.vendor || (window as any).opera || "" : "";
      const isMobileUA = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(ua);
      const isIPad = /macintosh/i.test(ua) && typeof navigator !== "undefined" && navigator.maxTouchPoints > 1;
      const isTouch =
        typeof window !== "undefined" &&
        ("ontouchstart" in window ||
          (navigator && (navigator.maxTouchPoints > 0 || (navigator as any).msMaxTouchPoints > 0)) ||
          (window.matchMedia && window.matchMedia("(pointer: coarse)").matches));
      const esDispositivoMovil = isMobileUA || isIPad || isTouch;

      try {
        if (typeof window !== "undefined") {
          const snapshot = {
            parametros,
            instancias,
            modelName,
            timestamp: Date.now(),
          };
          sessionStorage.setItem("3bf_ar_return_session", JSON.stringify(snapshot));
        }
      } catch (e) {
        console.warn("No se pudo guardar la sesión de retorno AR:", e);
      }

      const arHost = "https://engine.mariomojica.com";
      const arUploadUrl =
        typeof window !== "undefined" &&
        (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1")
          ? "/api/compress-glb"
          : `${arHost}/api/compress-glb`;
      const arRedirectBase =
        typeof window !== "undefined" &&
        (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1")
          ? ""
          : arHost;

      if (esDispositivoMovil) {
        try {
          const glbBlob = new Blob([glbBuffer], { type: "model/gltf-binary" });
          await saveLocalARModel(glbBlob, modelName);
        } catch (storageErr) {
          console.warn("[3dBimFab AR] IndexedDB no disponible:", storageErr);
        }

        const abortCtrl = new AbortController();
        const timeoutId = setTimeout(() => abortCtrl.abort(), 10000);

        try {
          const res = await fetch(`${arUploadUrl}?mode=ar&name=${encodeURIComponent(modelName)}`, {
            method: "POST",
            headers: { "Content-Type": "application/octet-stream" },
            body: glbBuffer,
            signal: abortCtrl.signal,
          });
          clearTimeout(timeoutId);

          if (res.ok) {
            const data = await res.json();
            if (data?.id) {
              setGenerandoAR(false);
              window.location.href = `${arRedirectBase}/ar?id=${data.id}&name=${encodeURIComponent(modelName)}`;
              return;
            }
          }
        } catch (apiErr) {
          clearTimeout(timeoutId);
          console.warn("[3dBimFab AR] Subida serverless demorada o fallida:", apiErr);
        }

        setGenerandoAR(false);
        window.location.href = `/ar?source=local&name=${encodeURIComponent(modelName)}`;
        return;
      }

      const res = await fetch(`${arUploadUrl}?mode=ar&name=${encodeURIComponent(modelName)}`, {
        method: "POST",
        headers: { "Content-Type": "application/octet-stream" },
        body: glbBuffer,
      });

      if (!res.ok) {
        throw new Error("No se pudo preparar el modelo para Realidad Aumentada.");
      }

      const data = await res.json();

      setArData({
        id: data.id,
        sizeBefore: data.sizeBefore,
        sizeAfter: data.sizeAfter,
      });
      setModalARAbierto(true);
    } catch (err: any) {
      console.error("[3dBimFab AR] Error al preparar AR:", err);
      alert("Error al preparar Realidad Aumentada: " + (err?.message || err));
    } finally {
      setGenerandoAR(false);
    }
  };

  return {
    exportandoGLB,
    generandoAR,
    modalARAbierto,
    setModalARAbierto,
    arData,
    generateCleanGLB,
    exportToGLB,
    descargarGlbSegunModo,
    abrirRealidadAumentada,
  };
}
