"use client";

import React, { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { use3BFStore } from "@/lib/store";
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  ChevronLeft,
  ChevronRight,
  Camera,
  Check,
  RotateCw,
  X,
  Volume2,
  VolumeX,
  Trash2,
  Clapperboard,
  Maximize2,
  ZoomIn,
  ZoomOut,
  Crosshair,
  Copy,
  ClipboardPaste,
  CopyPlus,
} from "lucide-react";

/**
 * 🎬 BlenderTimeline
 * 
 * Consola Timeline y Dope Sheet profesional de animación para el modo Simulador Móvil en 3dBimFab.
 * Inspirado en la interfaz y ergonomía de Blender (regla numérica, zoom/pan temporal con rueda,
 * aguja playhead azul, pistas de keyframes con rombos dorados interactivos y controles de transporte clásicos).
 */
export default function BlenderTimeline() {
  const {
    pasosManual,
    pasoActivoManualId,
    actualizarPasoManual,
    isTimelinePlaying,
    setIsTimelinePlaying,
    timelineCurrentTime,
    setTimelineCurrentTime,
    timelineVelocidad,
    setTimelineVelocidad,
    idiomaVozManual,
    setIdiomaVozManual,
    audioMutedManual,
    setAudioMutedManual,
    capturarKeyframeCamaraPaso,
    eliminarKeyframeCamaraPaso,
    moverKeyframeCamaraPaso,
    sobrescribirKeyframeCamaraPaso,
    toggleCamaraCinematicaPaso,
    simuladorMovilOrientacion,
    toggleSimuladorMovilOrientacion,
    toggleSimuladorMovil,
  } = use3BFStore();

  const pasoActivo = pasosManual.find((p) => p.id === pasoActivoManualId) || pasosManual[0];
  const esMultiSub3 = Boolean(pasoActivo?.subbloques && pasoActivo.subbloques.length >= 3);

  // ⏱️ Duración física calculada a partir de la cinemática
  const duracionAnimCalculada = useMemo(() => {
    let maxTime = 0;
    if (pasoActivo?.secuencia && pasoActivo.secuencia.length > 0) {
      pasoActivo.secuencia.forEach((s) => {
        const fin = (s.tiempoInicio || 0) + (s.duracionMovimiento || 1.5);
        if (fin > maxTime) maxTime = fin;
      });
    }
    if (pasoActivo?.configuracionCinematica?.piezasEspera) {
      pasoActivo.configuracionCinematica.piezasEspera.forEach((p) => {
        const tAp = p.tiempoAparicionPieza || 0;
        const tFin = p.tiempoFinHerrajes || 0;
        const tMaxP = Math.max(tAp, tFin);
        if (tMaxP > maxTime && tMaxP < 1000) {
          maxTime = tMaxP + 3.0;
        }
      });
    }
    if (maxTime > 0) {
      return Math.max(6, Math.round((maxTime + 0.5) * 10) / 10);
    }
    if (pasoActivo?.duracionTotal && pasoActivo.duracionTotal > 0) {
      return Math.round(pasoActivo.duracionTotal * 10) / 10;
    }
    return 10.0;
  }, [pasoActivo?.secuencia, pasoActivo?.configuracionCinematica?.piezasEspera, pasoActivo?.duracionTotal]);

  const duracionTotal = Math.max(
    pasoActivo?.duracionTotal !== undefined && pasoActivo.duracionTotal > 0
      ? pasoActivo.duracionTotal
      : duracionAnimCalculada,
    esMultiSub3 ? 11.4 : 1.0
  );

  // Keyframes ordenados cronológicamente
  const keyframesCamara = useMemo(() => {
    return (pasoActivo?.keyframesCamara || []).slice().sort((a, b) => a.tiempo - b.tiempo);
  }, [pasoActivo?.keyframesCamara]);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Determinar URL de audio según el idioma seleccionado
  const currentAudioUrl =
    idiomaVozManual === "pt"
      ? pasoActivo?.audioUrlPt
      : idiomaVozManual === "en"
      ? pasoActivo?.audioUrlEn
      : pasoActivo?.audioUrlEs;

  // Sincronizar audio HTML5 con el timeline
  useEffect(() => {
    if (!audioRef.current || !currentAudioUrl) return;

    if (isTimelinePlaying) {
      audioRef.current.currentTime = timelineCurrentTime;
      audioRef.current.playbackRate = timelineVelocidad;
      audioRef.current.muted = audioMutedManual;
      audioRef.current.play().catch(() => {});
    } else {
      audioRef.current.pause();
    }
  }, [isTimelinePlaying, currentAudioUrl, timelineVelocidad, audioMutedManual]);

  // Tick de animación para avanzar el tiempo cinemático a 30/60 fps
  useEffect(() => {
    if (!isTimelinePlaying) return;

    const intervalMs = 33; // ~30 fps
    let lastTime = performance.now();
    const timer = setInterval(() => {
      const now = performance.now();
      const deltaSec = (now - lastTime) / 1000;
      lastTime = now;

      use3BFStore.setState((state) => {
        const nextTime = state.timelineCurrentTime + deltaSec * state.timelineVelocidad;
        if (nextTime >= duracionTotal) {
          return { timelineCurrentTime: duracionTotal, isTimelinePlaying: false };
        }
        return { timelineCurrentTime: nextTime };
      });
    }, intervalMs);

    return () => clearInterval(timer);
  }, [isTimelinePlaying, duracionTotal]);

  const togglePlay = () => {
    if (timelineCurrentTime >= duracionTotal - 0.05) {
      setTimelineCurrentTime(0);
      setIsTimelinePlaying(true);
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.play().catch(() => {});
      }
    } else {
      setIsTimelinePlaying(!isTimelinePlaying);
    }
  };

  // 🔍 Parámetros de Zoom y Pan (Navegación espacial de Blender)
  const [zoomPxPerSec, setZoomPxPerSec] = useState<number>(65); // 65 px por segundo inicial
  const [panOffsetX, setPanOffsetX] = useState<number>(70); // Margen inicial a la izquierda
  const [selectedKfId, setSelectedKfId] = useState<string | null>(null);
  const [feedbackFijar, setFeedbackFijar] = useState(false);
  const [clipboardKf, setClipboardKf] = useState<{
    posicion: [number, number, number];
    target: [number, number, number];
    fov?: number;
    tiempoOriginal?: number;
  } | null>(() => (typeof window !== "undefined" ? (window as any).__clipboardKeyframe3BF || null : null));
  const [mensajeToast, setMensajeToast] = useState<string | null>(null);

  const mostrarToast = useCallback((msj: string) => {
    setMensajeToast(msj);
    setTimeout(() => setMensajeToast(null), 1800);
  }, []);

  // Estados de arrastre
  const containerRef = useRef<HTMLDivElement>(null);
  const isDraggingPlayheadRef = useRef(false);
  const isPanningRef = useRef(false);
  const panStartRef = useRef({ x: 0, initialOffset: 0 });
  const isDraggingKfRef = useRef<string | null>(null);

  // Conversión de tiempo a posición X (en px)
  const tiempoAPx = useCallback((seg: number) => {
    return panOffsetX + seg * zoomPxPerSec;
  }, [panOffsetX, zoomPxPerSec]);

  // Conversión de posición X (en px) a tiempo (en segundos)
  const pxATiempo = useCallback((px: number) => {
    return (px - panOffsetX) / zoomPxPerSec;
  }, [panOffsetX, zoomPxPerSec]);

  // 🔍 Manejo de Zoom con la Rueda del Ratón (Wheel)
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    if (!containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const cursorX = e.clientX - rect.left;
    const tiempoBajoCursor = pxATiempo(cursorX);

    // Zoom in (deltaY < 0) o Zoom out (deltaY > 0)
    const factor = e.deltaY < 0 ? 1.15 : 0.87;
    const nuevoZoom = Math.max(22, Math.min(240, zoomPxPerSec * factor));

    // Mantener el tiempo bajo el cursor en la misma posición X
    const nuevoPan = cursorX - tiempoBajoCursor * nuevoZoom;

    setZoomPxPerSec(nuevoZoom);
    setPanOffsetX(nuevoPan);
  };

  // 🔍🖐️ Navegación de Blender: Zoom Interactivo (Ctrl + Rueda presionada) y Pan (Rueda presionada o Shift + Rueda)
  const handleMouseDownNavigation = (e: React.MouseEvent) => {
    const esBotonCentral = e.button === 1;
    const esBotonIzquierdoMod = e.button === 0 && (e.altKey || e.ctrlKey);

    if (!esBotonCentral && !esBotonIzquierdoMod) return;

    e.preventDefault();
    e.stopPropagation();

    const isCtrlZoom = e.ctrlKey || e.metaKey;
    const startX = e.clientX;
    const startY = e.clientY;
    const initialZoom = zoomPxPerSec;
    const initialPan = panOffsetX;

    const containerRect = containerRef.current?.getBoundingClientRect();
    const cursorX = containerRect ? startX - containerRect.left : 200;
    const tiempoPivote = (cursorX - initialPan) / initialZoom;

    if (isCtrlZoom) {
      // 🔍 MODO ZOOM INTERACTIVO (Ctrl + Presionar rueda del mouse / botón central)
      // Mover hacia arriba o hacia la derecha = Zoom In. Hacia abajo o izquierda = Zoom Out.
      const onMouseMove = (moveEvent: MouseEvent) => {
        const deltaY = moveEvent.clientY - startY;
        const deltaX = moveEvent.clientX - startX;
        const delta = -deltaY + deltaX * 0.4;
        const factor = Math.exp(delta * 0.009);
        const nuevoZoom = Math.max(18, Math.min(320, initialZoom * factor));

        const nuevoPan = cursorX - tiempoPivote * nuevoZoom;
        setZoomPxPerSec(nuevoZoom);
        setPanOffsetX(nuevoPan);
      };

      const onMouseUp = () => {
        window.removeEventListener("mousemove", onMouseMove);
        window.removeEventListener("mouseup", onMouseUp);
      };

      window.addEventListener("mousemove", onMouseMove);
      window.addEventListener("mouseup", onMouseUp);
    } else {
      // 🖐️ MODO PAN HORIZONTAL (Presionar rueda del mouse / Shift + Rueda / Alt + Clic)
      const onMouseMove = (moveEvent: MouseEvent) => {
        const dx = moveEvent.clientX - startX;
        setPanOffsetX(initialPan + dx);
      };

      const onMouseUp = () => {
        window.removeEventListener("mousemove", onMouseMove);
        window.removeEventListener("mouseup", onMouseUp);
      };

      window.addEventListener("mousemove", onMouseMove);
      window.addEventListener("mouseup", onMouseUp);
    }
  };

  // 📍 Clic o Arrastre sobre la Regla de Tiempo (Playhead Scrubber)
  const handleRulerMouseDown = (e: React.MouseEvent) => {
    // Si presiona la rueda del mouse (botón 1) o tiene Ctrl/Alt, delega a navegación de zoom/pan
    if (e.button === 1 || e.altKey || e.ctrlKey) {
      handleMouseDownNavigation(e);
      return;
    }

    if (e.button !== 0) return;
    if (!containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const t = Math.max(0, Math.min(duracionTotal, Math.round(pxATiempo(clickX) * 20) / 20));

    setTimelineCurrentTime(t);
    if (audioRef.current) audioRef.current.currentTime = t;
    isDraggingPlayheadRef.current = true;
    (window as any).__isTimelineScrubbing = true;

    const onMouseMove = (moveEvent: MouseEvent) => {
      if (!isDraggingPlayheadRef.current || !containerRef.current) return;
      const currentRect = containerRef.current.getBoundingClientRect();
      const currentX = moveEvent.clientX - currentRect.left;
      const nuevoT = Math.max(0, Math.min(duracionTotal, Math.round(pxATiempo(currentX) * 20) / 20));
      setTimelineCurrentTime(nuevoT);
      if (audioRef.current) audioRef.current.currentTime = nuevoT;
    };

    const onMouseUp = () => {
      isDraggingPlayheadRef.current = false;
      (window as any).__isTimelineScrubbing = false;
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
  };

  // 💎 Arrastre Horizontal de Keyframes (Rombos Dorados)
  const handleKeyframeMouseDown = (e: React.MouseEvent, kfId: string, tiempoActual: number) => {
    e.stopPropagation();
    if (e.button !== 0) return;
    if (!pasoActivo) return;

    setSelectedKfId(kfId);
    isDraggingKfRef.current = kfId;
    (window as any).__isTimelineScrubbing = true;

    const kf = keyframesCamara.find((k) => k.id === kfId);
    if (kf) {
      setTimelineCurrentTime(kf.tiempo);
      (window as any).__saltarAKeyframeCamara3BF?.(kf.posicion, kf.target);
    }

    const onMouseMove = (moveEvent: MouseEvent) => {
      if (!isDraggingKfRef.current || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const x = moveEvent.clientX - rect.left;
      const nuevoTiempo = Math.max(0, Math.min(duracionTotal, Math.round(pxATiempo(x) * 20) / 20));

      moverKeyframeCamaraPaso(pasoActivo.id, kfId, nuevoTiempo);
      setTimelineCurrentTime(nuevoTiempo);
    };

    const onMouseUp = () => {
      isDraggingKfRef.current = null;
      (window as any).__isTimelineScrubbing = false;
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
  };

  // 🔍 Evitar que Ctrl+Wheel haga zoom al navegador y en su lugar haga zoom suave al Timeline
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const onNativeWheel = (e: WheelEvent) => {
      e.preventDefault();
      const rect = el.getBoundingClientRect();
      const cursorX = e.clientX - rect.left;
      const tiempoBajoCursor = pxATiempo(cursorX);

      const factor = e.deltaY < 0 ? 1.15 : 0.87;
      setZoomPxPerSec((prev) => {
        const nuevoZoom = Math.max(18, Math.min(320, prev * factor));
        setPanOffsetX(cursorX - tiempoBajoCursor * nuevoZoom);
        return nuevoZoom;
      });
    };

    el.addEventListener("wheel", onNativeWheel, { passive: false });
    return () => el.removeEventListener("wheel", onNativeWheel);
  }, [pxATiempo]);

  // 📋 Copiar Keyframe seleccionado (Ctrl + C)
  const handleCopiarKeyframe = useCallback(() => {
    if (!selectedKfId || !pasoActivo) {
      mostrarToast("Selecciona primero un keyframe para copiar");
      return;
    }
    const kf = keyframesCamara.find((k) => k.id === selectedKfId);
    if (!kf) return;

    const data = {
      posicion: [...kf.posicion] as [number, number, number],
      target: [...kf.target] as [number, number, number],
      fov: kf.fov,
      tiempoOriginal: kf.tiempo,
    };

    setClipboardKf(data);
    if (typeof window !== "undefined") {
      (window as any).__clipboardKeyframe3BF = data;
    }
    mostrarToast(`¡Keyframe ${kf.tiempo.toFixed(1)}s copiado! (Ctrl+V para pegar)`);
  }, [selectedKfId, pasoActivo, keyframesCamara, mostrarToast]);

  // 📋 Pegar Keyframe en la posición del Playhead (Ctrl + V)
  const handlePegarKeyframe = useCallback(() => {
    const clip = clipboardKf || (typeof window !== "undefined" ? (window as any).__clipboardKeyframe3BF : null);
    if (!clip || !pasoActivo) {
      mostrarToast("Portapapeles vacío. Copia un keyframe primero con Ctrl+C");
      return;
    }

    const tDestino = timelineCurrentTime;
    const kfExistente = keyframesCamara.find(
      (k) => Math.abs(k.tiempo - tDestino) < 0.08
    );

    if (kfExistente) {
      sobrescribirKeyframeCamaraPaso(
        pasoActivo.id,
        kfExistente.id,
        clip.posicion,
        clip.target,
        clip.fov
      );
      setSelectedKfId(kfExistente.id);
      mostrarToast(`¡Keyframe sobrescrito en ${tDestino.toFixed(1)}s!`);
    } else {
      capturarKeyframeCamaraPaso(
        pasoActivo.id,
        tDestino,
        clip.posicion,
        clip.target,
        clip.fov
      );
      mostrarToast(`¡Keyframe pegado en ${tDestino.toFixed(1)}s!`);
    }
  }, [clipboardKf, pasoActivo, timelineCurrentTime, keyframesCamara, sobrescribirKeyframeCamaraPaso, capturarKeyframeCamaraPaso, mostrarToast]);

  // 👯 Duplicar Keyframe (Shift + D estilo Blender)
  const handleDuplicarKeyframe = useCallback(() => {
    if (!selectedKfId || !pasoActivo) return;
    const kf = keyframesCamara.find((k) => k.id === selectedKfId);
    if (!kf) return;

    const data = {
      posicion: [...kf.posicion] as [number, number, number],
      target: [...kf.target] as [number, number, number],
      fov: kf.fov,
      tiempoOriginal: kf.tiempo,
    };
    setClipboardKf(data);
    if (typeof window !== "undefined") {
      (window as any).__clipboardKeyframe3BF = data;
    }

    let tDestino = timelineCurrentTime;
    if (Math.abs(tDestino - kf.tiempo) < 0.1) {
      tDestino = Math.min(duracionTotal, Math.round((kf.tiempo + 0.5) * 20) / 20);
      setTimelineCurrentTime(tDestino);
      if (audioRef.current) audioRef.current.currentTime = tDestino;
    }

    capturarKeyframeCamaraPaso(
      pasoActivo.id,
      tDestino,
      data.posicion,
      data.target,
      data.fov
    );
    mostrarToast(`¡Keyframe duplicado en ${tDestino.toFixed(1)}s (Shift+D)!`);
  }, [selectedKfId, pasoActivo, keyframesCamara, timelineCurrentTime, duracionTotal, capturarKeyframeCamaraPaso, setTimelineCurrentTime, mostrarToast]);

  // ⌨️ Atajos de teclado: Supr (Delete), Ctrl+C (Copy), Ctrl+V (Paste), Shift+D (Duplicate)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable)) {
        return;
      }

      // Supr / Backspace
      if (e.key === "Delete" || e.key === "Backspace") {
        if (!selectedKfId || !pasoActivo) return;
        e.preventDefault();
        eliminarKeyframeCamaraPaso(pasoActivo.id, selectedKfId);
        setSelectedKfId(null);
        mostrarToast("Keyframe eliminado");
        return;
      }

      // Ctrl + C (Copiar)
      if ((e.ctrlKey || e.metaKey) && (e.key === "c" || e.key === "C")) {
        if (selectedKfId) {
          e.preventDefault();
          handleCopiarKeyframe();
        }
        return;
      }

      // Ctrl + V (Pegar)
      if ((e.ctrlKey || e.metaKey) && (e.key === "v" || e.key === "V")) {
        e.preventDefault();
        handlePegarKeyframe();
        return;
      }

      // Shift + D (Duplicar estilo Blender)
      if (e.shiftKey && (e.key === "d" || e.key === "D")) {
        if (selectedKfId) {
          e.preventDefault();
          handleDuplicarKeyframe();
        }
        return;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedKfId, pasoActivo, eliminarKeyframeCamaraPaso, handleCopiarKeyframe, handlePegarKeyframe, handleDuplicarKeyframe, mostrarToast]);

  // 📸 Captura instantánea o sobrescritura inteligente
  const handleFijarCamara = () => {
    if (!pasoActivo) return;
    const pose = (window as any).__obtenerPoseCamara3BF?.();
    if (!pose) {
      alert("No se pudo leer la orientación de la cámara 3D.");
      return;
    }

    const kfExistente = keyframesCamara.find(
      (k) => Math.abs(k.tiempo - timelineCurrentTime) < 0.1
    );

    if (kfExistente) {
      sobrescribirKeyframeCamaraPaso(
        pasoActivo.id,
        kfExistente.id,
        pose.pos,
        pose.target,
        pose.fov
      );
      setSelectedKfId(kfExistente.id);
    } else {
      capturarKeyframeCamaraPaso(
        pasoActivo.id,
        timelineCurrentTime,
        pose.pos,
        pose.target,
        pose.fov
      );
    }

    setFeedbackFijar(true);
    setTimeout(() => setFeedbackFijar(false), 1200);
  };

  // 🎮 Controles de Transporte de Blender
  const irAlInicio = () => {
    setTimelineCurrentTime(0);
    if (audioRef.current) audioRef.current.currentTime = 0;
  };

  const irAlFinal = () => {
    setTimelineCurrentTime(duracionTotal);
    if (audioRef.current) audioRef.current.currentTime = duracionTotal;
  };
  
  const keyframeAnterior = () => {
    const anteriores = keyframesCamara.filter((k) => k.tiempo < timelineCurrentTime - 0.05);
    if (anteriores.length > 0) {
      const prev = anteriores[anteriores.length - 1];
      setTimelineCurrentTime(prev.tiempo);
      if (audioRef.current) audioRef.current.currentTime = prev.tiempo;
      setSelectedKfId(prev.id);
      (window as any).__saltarAKeyframeCamara3BF?.(prev.posicion, prev.target);
    } else {
      irAlInicio();
    }
  };

  const keyframeSiguiente = () => {
    const siguientes = keyframesCamara.filter((k) => k.tiempo > timelineCurrentTime + 0.05);
    if (siguientes.length > 0) {
      const next = siguientes[0];
      setTimelineCurrentTime(next.tiempo);
      if (audioRef.current) audioRef.current.currentTime = next.tiempo;
      setSelectedKfId(next.id);
      (window as any).__saltarAKeyframeCamara3BF?.(next.posicion, next.target);
    } else {
      irAlFinal();
    }
  };

  // Auto-ajustar vista panorámica completa
  const fitTimeline = () => {
    if (!containerRef.current) return;
    const width = containerRef.current.clientWidth - 120;
    if (width > 0 && duracionTotal > 0) {
      const nuevoZoom = Math.max(25, Math.min(200, width / duracionTotal));
      setZoomPxPerSec(nuevoZoom);
      setPanOffsetX(60);
    }
  };

  // Rango visible de segundos para dibujar marcas en la regla
  const { minSegVisible, maxSegVisible } = useMemo(() => {
    const containerW = containerRef.current?.clientWidth || 1200;
    const minS = Math.floor(pxATiempo(0)) - 2;
    const maxS = Math.ceil(pxATiempo(containerW)) + 2;
    return { minSegVisible: minS, maxSegVisible: maxS };
  }, [pxATiempo, panOffsetX, zoomPxPerSec]);

  // Generar lista de marcas de segundo
  const segundosRegla = useMemo(() => {
    const arr: number[] = [];
    for (let s = minSegVisible; s <= maxSegVisible; s++) {
      arr.push(s);
    }
    return arr;
  }, [minSegVisible, maxSegVisible]);

  return (
    <div
      id="blender_timeline_container"
      className="absolute bottom-0 left-0 right-0 z-30 flex flex-col bg-[#1E1E1E] text-slate-200 border-t border-[#333333] shadow-2xl select-none animate-in slide-in-from-bottom duration-200"
    >
      {/* Elemento de Audio Oculto para Sincronización */}
      {currentAudioUrl && (
        <audio
          ref={audioRef}
          src={currentAudioUrl}
        />
      )}
      {/* 1. 🎛️ HEADER DE TRANSPORTE Y HERRAMIENTAS ESTILO BLENDER */}
      <div className="h-9 px-3 bg-[#262626] border-b border-[#383838] flex items-center justify-between gap-2">
        {/* Izquierda: Identidad de Paso y Selectores */}
        <div className="flex items-center gap-2">
          {/* Badge Paso Activo */}
          <span className="px-2.5 py-0.5 rounded-full bg-[#1368AA] text-white font-mono font-bold text-[10px] shadow-sm tracking-wide">
            {pasoActivo?.id || "P00"}
          </span>

          {/* Selector de Idioma (ES / PT / EN) */}
          <div className="flex items-center p-0.5 bg-[#181818] rounded-full border border-[#404040]">
            {(["es", "pt", "en"] as const).map((lang) => (
              <button
                key={lang}
                type="button"
                onClick={() => setIdiomaVozManual(lang)}
                className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase transition ${
                  idiomaVozManual === lang
                    ? "bg-[#1368AA] text-white shadow-xs"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                {lang}
              </button>
            ))}
          </div>

          {/* Selector de Velocidad */}
          <button
            type="button"
            onClick={() => {
              const velocidades = [0.5, 1, 1.5, 2];
              const next = velocidades[(velocidades.indexOf(timelineVelocidad) + 1) % velocidades.length];
              setTimelineVelocidad(next);
            }}
            title="Velocidad de reproducción cinemática"
            className="px-2 py-0.5 rounded-full bg-[#181818] hover:bg-[#2A2A2A] border border-[#404040] text-[9.5px] font-mono font-bold text-slate-300"
          >
            {timelineVelocidad}x
          </button>
        </div>

        {/* Centro: Controles de Transporte de Animación (Blender Style) */}
        <div className="flex items-center gap-1 bg-[#1A1A1A] px-2 py-0.5 rounded-full border border-[#3A3A3A] shadow-inner">
          {/* Saltar al inicio */}
          <button
            type="button"
            onClick={irAlInicio}
            title="Saltar al inicio (0.0s)"
            className="w-6 h-6 rounded-full flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition"
          >
            <SkipBack className="w-3.5 h-3.5" />
          </button>

          {/* Keyframe anterior */}
          <button
            type="button"
            onClick={keyframeAnterior}
            title="Ir al keyframe anterior"
            className="w-6 h-6 rounded-full flex items-center justify-center text-amber-400 hover:text-amber-300 hover:bg-white/10 transition"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {/* Play / Pause Principal */}
          <button
            type="button"
            onClick={togglePlay}
            title={isTimelinePlaying ? "Pausar animación" : "Reproducir paso"}
            className="w-7 h-7 rounded-full bg-[#1368AA] hover:bg-[#10568c] text-white flex items-center justify-center shadow-md transition active:scale-95 mx-0.5"
          >
            {isTimelinePlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 ml-0.5" />}
          </button>

          {/* Keyframe siguiente */}
          <button
            type="button"
            onClick={keyframeSiguiente}
            title="Ir al keyframe siguiente"
            className="w-6 h-6 rounded-full flex items-center justify-center text-amber-400 hover:text-amber-300 hover:bg-white/10 transition"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          {/* Saltar al final */}
          <button
            type="button"
            onClick={irAlFinal}
            title="Saltar al final del paso"
            className="w-6 h-6 rounded-full flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition"
          >
            <SkipForward className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Derecha: Fijar Cámara, Portapapeles (Copiar/Pegar/Duplicar), Cinemática, Campo End, Zoom Fit, Giro Orientación y Cerrar */}
        <div className="flex items-center gap-1.5">
          {/* Botón FIJAR CÁMARA */}
          <button
            type="button"
            onClick={handleFijarCamara}
            title={`Fijar encuadre y target de cámara en el segundo actual (${timelineCurrentTime.toFixed(1)}s)`}
            className={`flex items-center gap-1 text-[10px] font-bold px-3 py-1 rounded-full shadow-md transition active:scale-95 cursor-pointer ${
              feedbackFijar
                ? "bg-emerald-600 text-white ring-2 ring-emerald-400"
                : "bg-[#1368AA] hover:bg-[#10568c] text-white"
            }`}
          >
            {feedbackFijar ? <Check className="w-3 h-3" /> : <Camera className="w-3 h-3 text-amber-300" />}
            <span>{feedbackFijar ? "¡Fijado!" : `Fijar (${timelineCurrentTime.toFixed(1)}s)`}</span>
          </button>

          {/* Grupo Portapapeles (Copiar, Pegar, Duplicar estilo Blender) */}
          <div className="flex items-center bg-[#181818] p-0.5 rounded-full border border-[#404040]">
            {/* Copiar Keyframe (Ctrl+C) */}
            <button
              type="button"
              onClick={handleCopiarKeyframe}
              disabled={!selectedKfId}
              title={
                selectedKfId
                  ? "Copiar encuadre seleccionado (Ctrl+C)"
                  : "Selecciona un rombo para copiar su encuadre"
              }
              className={`w-6 h-6 rounded-full flex items-center justify-center transition ${
                selectedKfId
                  ? "text-cyan-400 hover:text-white hover:bg-cyan-600/30 cursor-pointer"
                  : "text-slate-600 cursor-not-allowed opacity-40"
              }`}
            >
              <Copy className="w-3 h-3" />
            </button>

            {/* Pegar Keyframe (Ctrl+V) */}
            <button
              type="button"
              onClick={handlePegarKeyframe}
              disabled={!clipboardKf}
              title={
                clipboardKf
                  ? `Pegar encuadre en aguja (${timelineCurrentTime.toFixed(1)}s) (Ctrl+V)`
                  : "Portapapeles vacío. Copia un rombo primero con Ctrl+C"
              }
              className={`w-6 h-6 rounded-full flex items-center justify-center transition ${
                clipboardKf
                  ? "text-emerald-400 hover:text-white hover:bg-emerald-600/30 cursor-pointer"
                  : "text-slate-600 cursor-not-allowed opacity-40"
              }`}
            >
              <ClipboardPaste className="w-3 h-3" />
            </button>

            {/* Duplicar Keyframe (Shift+D) */}
            <button
              type="button"
              onClick={handleDuplicarKeyframe}
              disabled={!selectedKfId}
              title={
                selectedKfId
                  ? "Duplicar encuadre seleccionado (Shift+D)"
                  : "Selecciona un rombo para duplicar"
              }
              className={`w-6 h-6 rounded-full flex items-center justify-center transition ${
                selectedKfId
                  ? "text-amber-400 hover:text-white hover:bg-amber-600/30 cursor-pointer"
                  : "text-slate-600 cursor-not-allowed opacity-40"
              }`}
            >
              <CopyPlus className="w-3 h-3" />
            </button>
          </div>

          {/* Estado Cinemática */}
          <button
            type="button"
            onClick={() => pasoActivo && toggleCamaraCinematicaPaso(pasoActivo.id)}
            title={
              pasoActivo?.camaraCinematicaActiva !== false
                ? "Cinemática de cámara activada. Clic para modo libre"
                : "Cinemática en pausa. Clic para activar seguimiento de keyframes"
            }
            className={`px-2 py-0.5 rounded-full text-[9px] font-bold border transition ${
              pasoActivo?.camaraCinematicaActiva !== false
                ? "bg-cyan-900/60 text-cyan-300 border-cyan-500/40"
                : "bg-slate-800 text-slate-400 border-slate-700"
            }`}
          >
            <Clapperboard className="w-2.5 h-2.5 inline mr-1" />
            {pasoActivo?.camaraCinematicaActiva !== false ? "Cam: Auto" : "Cam: Libre"}
          </button>

          {/* Campo End (Duración total en segundos estilo Blender) */}
          <div
            className="flex items-center gap-1 bg-[#181818] px-2 py-0.5 rounded-full border border-[#404040] font-mono text-[10px]"
            title="Duración total del paso"
          >
            <span className="text-slate-500 font-bold">End:</span>
            <span className="text-amber-400 font-bold">{duracionTotal.toFixed(1)}s</span>
          </div>

          {/* Botón Auto-Fit Zoom */}
          <button
            type="button"
            onClick={fitTimeline}
            title="Enfocar todo el timeline en la pantalla"
            className="w-6 h-6 rounded-full flex items-center justify-center bg-[#181818] hover:bg-[#282828] text-slate-300 border border-[#404040] transition"
          >
            <Maximize2 className="w-3 h-3" />
          </button>

          {/* Botón Girar Orientación Móvil (16:9 ↔ 9:16) */}
          <button
            type="button"
            onClick={() => toggleSimuladorMovilOrientacion()}
            title={
              simuladorMovilOrientacion === "horizontal"
                ? "Cambiar marco a vertical 9:16"
                : "Cambiar marco a horizontal 16:9"
            }
            className="px-2.5 py-0.5 rounded-full bg-[#181818] hover:bg-[#282828] border border-[#404040] text-[9px] font-mono text-cyan-400 flex items-center gap-1 transition"
          >
            <span>{simuladorMovilOrientacion === "horizontal" ? "16:9" : "9:16"}</span>
            <RotateCw className="w-2.5 h-2.5" />
          </button>

          {/* Botón Cerrar Modo Director */}
          <button
            type="button"
            onClick={() => toggleSimuladorMovil()}
            title="Salir del modo director / simulador de celular"
            className="w-6 h-6 rounded-full flex items-center justify-center bg-red-950/40 hover:bg-red-900/80 text-red-300 border border-red-800/50 transition"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 2. 📏 ZONA INTERACTIVA: REGLA DE TIEMPO + PISTAS DE KEYFRAMES */}
      <div
        ref={containerRef}
        onWheel={handleWheel}
        onMouseDown={handleMouseDownNavigation}
        className="relative w-full h-36 bg-[#161616] overflow-hidden cursor-default"
      >
        {/* Zona inactiva previa a 0.0s (Sombra más oscura de Blender) */}
        <div
          style={{ width: `${Math.max(0, panOffsetX)}px` }}
          className="absolute top-0 bottom-0 left-0 bg-[#0E0E0E]/90 border-r border-[#2C2C2C] z-5 pointer-events-none"
        />

        {/* Zona inactiva posterior a duracionTotal */}
        <div
          style={{ left: `${tiempoAPx(duracionTotal)}px` }}
          className="absolute top-0 bottom-0 right-0 bg-[#0E0E0E]/60 border-l border-[#2C2C2C] z-5 pointer-events-none"
        />

        {/* --- A. REGLA NUMÉRICA GRADUADA (RULER) --- */}
        <div
          onMouseDown={handleRulerMouseDown}
          className="h-6 w-full bg-[#202020] border-b border-[#303030] relative cursor-pointer z-20"
        >
          {segundosRegla.map((seg) => {
            const posX = tiempoAPx(seg);
            const esSegundoEntero = seg >= 0 && seg <= Math.ceil(duracionTotal);

            return (
              <React.Fragment key={seg}>
                {/* Línea de graduación mayor */}
                <div
                  style={{ left: `${posX}px` }}
                  className="absolute bottom-0 w-px h-3 bg-[#4D4D4D] pointer-events-none"
                />

                {/* Submarcas cada 0.5s si hay buen zoom */}
                {zoomPxPerSec > 45 && (
                  <div
                    style={{ left: `${tiempoAPx(seg + 0.5)}px` }}
                    className="absolute bottom-0 w-px h-1.5 bg-[#383838] pointer-events-none"
                  />
                )}

                {/* Número de segundo */}
                <span
                  style={{ left: `${posX}px` }}
                  className={`absolute top-0.5 -translate-x-1/2 font-mono text-[9.5px] pointer-events-none ${
                    esSegundoEntero ? "text-slate-300 font-semibold" : "text-slate-600"
                  }`}
                >
                  {seg}
                </span>
              </React.Fragment>
            );
          })}
        </div>

        {/* --- B. ZONA DE PISTAS (DOPE SHEET TRACKS) --- */}
        <div className="relative h-30 w-full">
          {/* Líneas verticales de cuadrícula que cruzan todo el track */}
          {segundosRegla.map((seg) => {
            const posX = tiempoAPx(seg);
            const esCero = seg === 0;
            const esFin = Math.abs(seg - Math.round(duracionTotal)) < 0.01;

            return (
              <div
                key={`grid_${seg}`}
                style={{ left: `${posX}px` }}
                className={`absolute top-0 bottom-0 w-px pointer-events-none ${
                  esCero
                    ? "bg-cyan-500/50 z-6"
                    : esFin
                    ? "bg-amber-500/40 z-6"
                    : "bg-[#252525]"
                }`}
              />
            );
          })}

          {/* Pista 1: Cámara Cinemática (Keyframes de Encuadre) */}
          <div className="relative h-12 mt-4 flex items-center border-y border-[#292929] bg-[#1A1A1A]/80">
            {/* Header / Etiqueta lateral de la pista */}
            <div className="sticky left-0 z-15 flex items-center gap-1.5 px-3 py-1 bg-[#232323] border-r border-[#383838] text-[10px] font-bold text-amber-300 shadow-md">
              <Camera className="w-3 h-3 text-amber-400" />
              <span>Cámara 3D</span>
              <span className="text-[9px] font-mono text-slate-400">({keyframesCamara.length})</span>
            </div>

            {/* Línea central guía de keyframes */}
            <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 border-b border-dashed border-[#333333] pointer-events-none" />

            {/* 💎 ROMBOS DORADOS DE KEYFRAME (BLENDER STYLE) */}
            {keyframesCamara.map((kf, kIdx) => {
              const kfX = tiempoAPx(kf.tiempo);
              const esSeleccionado = selectedKfId === kf.id;
              const esTiempoActual = Math.abs(timelineCurrentTime - kf.tiempo) < 0.08;

              return (
                <div
                  key={kf.id}
                  style={{ left: `${kfX}px` }}
                  onMouseDown={(e) => handleKeyframeMouseDown(e, kf.id, kf.tiempo)}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedKfId(kf.id);
                    setTimelineCurrentTime(kf.tiempo);
                    (window as any).__saltarAKeyframeCamara3BF?.(kf.posicion, kf.target);
                  }}
                  title={`Encuadre #${kIdx + 1}: ${kf.tiempo.toFixed(1)}s (Arrastra para mover en el tiempo, Supr para eliminar)`}
                  className={`absolute top-1/2 -translate-y-1/2 -translate-x-1/2 z-25 w-3.5 h-3.5 rotate-45 cursor-grab active:cursor-grabbing transition-transform ${
                    esSeleccionado
                      ? "bg-cyan-400 border-2 border-white ring-4 ring-cyan-500/50 scale-125 z-30 shadow-lg"
                      : esTiempoActual
                      ? "bg-[#FFCC00] border border-white scale-125 shadow-md shadow-amber-500/50"
                      : "bg-[#F5A623] hover:bg-[#FFD15C] border border-[#FFE082] shadow-xs"
                  }`}
                >
                  {/* Tooltip con tiempo, copiar, duplicar y eliminar al seleccionar */}
                  {esSeleccionado && (
                    <div
                      onClick={(e) => e.stopPropagation()}
                      className="absolute -top-7 left-1/2 -translate-x-1/2 -rotate-45 px-2 py-0.5 rounded-full bg-slate-950 text-[9px] font-mono text-white flex items-center gap-1.5 border border-cyan-400 shadow-xl cursor-default"
                    >
                      <span className="font-bold text-cyan-300">{kf.tiempo.toFixed(1)}s</span>

                      {/* Copiar */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCopiarKeyframe();
                        }}
                        title="Copiar este encuadre (Ctrl+C)"
                        className="p-0.5 rounded-full hover:bg-white/20 text-slate-300 hover:text-white transition cursor-pointer"
                      >
                        <Copy className="w-2.5 h-2.5" />
                      </button>

                      {/* Duplicar */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDuplicarKeyframe();
                        }}
                        title="Duplicar encuadre (Shift+D)"
                        className="p-0.5 rounded-full hover:bg-white/20 text-amber-300 hover:text-amber-200 transition cursor-pointer"
                      >
                        <CopyPlus className="w-2.5 h-2.5" />
                      </button>

                      {/* Eliminar */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          pasoActivo && eliminarKeyframeCamaraPaso(pasoActivo.id, kf.id);
                          setSelectedKfId(null);
                          mostrarToast("Keyframe eliminado");
                        }}
                        title="Eliminar este encuadre (Supr)"
                        className="p-0.5 rounded-full hover:bg-red-600 text-red-400 hover:text-white transition cursor-pointer"
                      >
                        <Trash2 className="w-2.5 h-2.5" />
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* --- C. PLAYHEAD AZUL VERTICAL CON CABEZAL NUMÉRICO (BLENDER PLAYHEAD) --- */}
        <div
          style={{ left: `${tiempoAPx(timelineCurrentTime)}px` }}
          className="absolute top-0 bottom-0 z-30 pointer-events-none -translate-x-1/2"
        >
          {/* Cabezal azul superior de la regla (con el tiempo actual redondeado o con décimas) */}
          <div className="px-1.5 py-0.5 rounded-b-md bg-[#3A80C2] text-white font-mono font-bold text-[9px] shadow-md flex items-center justify-center">
            {timelineCurrentTime.toFixed(1)}
          </div>

          {/* Línea vertical azul que recorre todos los tracks */}
          <div className="w-0.5 h-full bg-[#3A80C2] mx-auto shadow-sm shadow-[#3A80C2]/50" />
        </div>

        {/* 💬 TOAST FLOTANTE DE ACCIONES (Copiar / Pegar / Duplicar / Eliminar) */}
        {mensajeToast && (
          <div className="absolute top-8 left-1/2 -translate-x-1/2 z-50 px-3 py-1 bg-[#131B2E]/95 border border-cyan-500/50 rounded-full text-white text-[10px] font-mono shadow-2xl backdrop-blur-md pointer-events-none flex items-center gap-1.5 animate-in fade-in zoom-in-95">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
            <span>{mensajeToast}</span>
          </div>
        )}
      </div>
    </div>
  );
}
