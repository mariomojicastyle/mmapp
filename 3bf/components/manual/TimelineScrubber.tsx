"use client";

import React, { useEffect, useRef } from "react";
import { use3BFStore } from "@/lib/store";
import { Play, Pause, RotateCcw, Volume2, VolumeX, SkipBack, SkipForward, ChevronDown } from "lucide-react";

export default function TimelineScrubber() {
  const {
    pasosManual,
    pasoActivoManualId,
    seleccionarPasoManualActivo,
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
    coloresApariencia,
  } = use3BFStore();

  const pasoActivo = pasosManual.find((p) => p.id === pasoActivoManualId) || pasosManual[0];
  const duracionTotal = pasoActivo?.duracionTotal || 10.0;
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

  // Tick de animación para avanzar el tiempo
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
    // Si ya terminó o está al borde del final (dentro de 50ms), reiniciar desde 0 y reproducir
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

  const handleReset = () => {
    setTimelineCurrentTime(0);
    setIsTimelinePlaying(false);
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.pause();
    }
  };

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setTimelineCurrentTime(val);
    if (audioRef.current) {
      audioRef.current.currentTime = val;
    }
  };

  const irPasoAnterior = () => {
    const idx = pasosManual.findIndex((p) => p.id === pasoActivoManualId);
    if (idx > 0) {
      seleccionarPasoManualActivo(pasosManual[idx - 1].id);
    }
  };

  const irPasoSiguiente = () => {
    const idx = pasosManual.findIndex((p) => p.id === pasoActivoManualId);
    if (idx < pasosManual.length - 1) {
      seleccionarPasoManualActivo(pasosManual[idx + 1].id);
    }
  };

  const formatoTiempo = (seg: number) => {
    const s = Math.floor(seg);
    const ms = Math.floor((seg % 1) * 10);
    return `${String(s).padStart(2, "0")}.${ms}s`;
  };

  const botonActivoColor = coloresApariencia?.botonActivo || "#0891b2";

  return (
    <div className="absolute bottom-3 left-3 right-3 z-20 flex flex-col gap-1.5 pointer-events-none select-none">
      {/* Elemento de Audio Oculto para Sincronización (no detiene la animación 3D al terminar el audio) */}
      {currentAudioUrl && (
        <audio
          ref={audioRef}
          src={currentAudioUrl}
        />
      )}

      {/* Barra de Control Principal (Cápsula Flotante Glass) */}
      <div
        style={{
          backgroundColor: coloresApariencia?.fondoPaneles || "rgba(255, 255, 255, 0.92)",
          borderColor: coloresApariencia?.bordePaneles || "rgba(203, 213, 225, 0.8)",
          color: coloresApariencia?.textoPrincipal || "#0F172A",
        }}
        className="pointer-events-auto backdrop-blur-md rounded-full px-3 py-1.5 border shadow-xl flex items-center gap-2 max-w-4xl mx-auto w-full"
      >
        {/* Badge del Paso Activo */}
        <div className="flex items-center gap-1 shrink-0">
          <span
            style={{ backgroundColor: botonActivoColor }}
            className="text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full shadow-sm"
          >
            {pasoActivo?.id}
          </span>
        </div>

        {/* Botón Paso Anterior */}
        <button
          type="button"
          onClick={irPasoAnterior}
          title="Paso Anterior"
          className="w-7 h-7 rounded-full flex items-center justify-center border border-slate-300 dark:border-slate-700 hover:bg-black/5 dark:hover:bg-white/5 transition"
        >
          <SkipBack className="w-3.5 h-3.5" />
        </button>

        {/* Botón Play / Pause en Cápsula Circular */}
        <button
          type="button"
          onClick={togglePlay}
          style={{ backgroundColor: botonActivoColor }}
          title={isTimelinePlaying ? "Pausar animación" : "Reproducir paso"}
          className="w-8 h-8 rounded-full flex items-center justify-center text-white shadow-md hover:opacity-90 active:scale-95 transition"
        >
          {isTimelinePlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
        </button>

        {/* Botón Reiniciar (Rewind) */}
        <button
          type="button"
          onClick={handleReset}
          title="Reiniciar a 0.0s"
          className="w-7 h-7 rounded-full flex items-center justify-center border border-slate-300 dark:border-slate-700 hover:bg-black/5 dark:hover:bg-white/5 transition"
        >
          <RotateCcw className="w-3 h-3" />
        </button>

        {/* Botón Paso Siguiente */}
        <button
          type="button"
          onClick={irPasoSiguiente}
          title="Paso Siguiente"
          className="w-7 h-7 rounded-full flex items-center justify-center border border-slate-300 dark:border-slate-700 hover:bg-black/5 dark:hover:bg-white/5 transition"
        >
          <SkipForward className="w-3.5 h-3.5" />
        </button>

        {/* Indicador de Tiempo Actual / Selector de Duración Total */}
        <div className="flex items-center gap-1 font-mono text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/70 shrink-0">
          <span style={{ color: botonActivoColor }} className="min-w-[40px] text-right">
            {formatoTiempo(timelineCurrentTime)}
          </span>
          <span className="opacity-30 select-none">/</span>
          <div className="relative inline-flex items-center" title="Duración total del paso / animación (Haz clic para cambiar)">
            <select
              value={duracionTotal}
              onChange={(e) => {
                const nuevo = parseFloat(e.target.value);
                if (pasoActivo) {
                  actualizarPasoManual(pasoActivo.id, { duracionTotal: nuevo });
                  if (timelineCurrentTime > nuevo) {
                    setTimelineCurrentTime(0);
                    setIsTimelinePlaying(false);
                  }
                }
              }}
              className="appearance-none bg-transparent pr-4 pl-0.5 font-mono text-xs font-bold text-slate-700 dark:text-slate-200 cursor-pointer outline-none hover:text-cyan-600 dark:hover:text-cyan-400 transition"
            >
              {[3, 5, 8, 10, 12, 15, 20, 25, 30].map((sec) => (
                <option key={sec} value={sec} className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100">
                  {String(sec).padStart(2, "0")}.0s
                </option>
              ))}
            </select>
            <ChevronDown className="w-2.5 h-2.5 absolute right-0 pointer-events-none opacity-50" />
          </div>
        </div>

        {/* Slider / Scrubber de Línea de Tiempo */}
        <div className="flex-1 flex items-center px-1">
          <input
            type="range"
            min={0}
            max={duracionTotal}
            step={0.05}
            value={timelineCurrentTime}
            onChange={handleSliderChange}
            className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full appearance-none cursor-pointer accent-cyan-600 dark:accent-cyan-400"
          />
        </div>

        {/* Selector de Idioma de Audio (ES / PT / EN) */}
        <div className="flex items-center p-0.5 bg-slate-100 dark:bg-slate-800 rounded-full border border-slate-200 dark:border-slate-700 shrink-0">
          {(["es", "pt", "en"] as const).map((lang) => (
            <button
              key={lang}
              type="button"
              onClick={() => setIdiomaVozManual(lang)}
              style={
                idiomaVozManual === lang
                  ? { backgroundColor: botonActivoColor, color: "#ffffff" }
                  : {}
              }
              className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase transition ${
                idiomaVozManual === lang
                  ? "shadow-sm"
                  : "opacity-60 hover:opacity-100"
              }`}
            >
              {lang}
            </button>
          ))}
        </div>

        {/* Toggle Silenciar Audio */}
        <button
          type="button"
          onClick={() => setAudioMutedManual(!audioMutedManual)}
          title={audioMutedManual ? "Activar audio narrado" : "Silenciar locución"}
          className={`w-7 h-7 rounded-full flex items-center justify-center border transition ${
            audioMutedManual
              ? "border-amber-500/50 text-amber-500"
              : "border-slate-300 dark:border-slate-700 opacity-80 hover:opacity-100"
          }`}
        >
          {audioMutedManual ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
        </button>

        {/* Selector de Velocidad (0.5x, 1x, 1.5x, 2x) */}
        <button
          type="button"
          onClick={() => {
            const nextSpeed =
              timelineVelocidad === 1.0
                ? 1.5
                : timelineVelocidad === 1.5
                ? 2.0
                : timelineVelocidad === 2.0
                ? 0.5
                : 1.0;
            setTimelineVelocidad(nextSpeed);
          }}
          title="Cambiar velocidad de reproducción"
          className="px-2 py-0.5 rounded-full text-[10px] font-bold border border-slate-300 dark:border-slate-700 hover:bg-black/5 dark:hover:bg-white/5 transition"
        >
          {timelineVelocidad}x
        </button>
      </div>
    </div>
  );
}
