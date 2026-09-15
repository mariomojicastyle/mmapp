"use client";

import React, { useEffect, useRef, useState } from "react";
import { use3BFStore } from "@/lib/store";
import { Play, Pause, RotateCcw, Volume2, VolumeX, SkipBack, SkipForward, ChevronDown, ChevronUp, Sliders, Layers, Sparkles } from "lucide-react";
import { obtenerColorSubbloque } from "./StepManagerPanel";

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
    subbloqueSoloId,
    setSubbloqueSolo,
    actualizarTrackSubBloque,
    setCoreografiaSubbloques,
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

  // 🧩 Lógica de Sub-Bloques y Mezclador Multipista
  const subbloques = (pasoActivo?.subbloques || []).filter(Boolean);
  const tieneSubbloques = subbloques.length > 0;
  const [mezcladorAbierto, setMezcladorAbierto] = useState(false);

  const escalonarCascadaSubbloques = () => {
    if (!pasoActivo || subbloques.length === 0) return;
    const durPorSub = Number((duracionTotal / subbloques.length).toFixed(1));
    subbloques.forEach((sub, idx) => {
      const inicio = Number((idx * durPorSub).toFixed(1));
      actualizarTrackSubBloque(pasoActivo.id, sub.id, {
        tiempoInicio: inicio,
        duracion: durPorSub,
      });
    });
  };

  const reproducirSoloSubbloque = (subId: string) => {
    const sub = subbloques.find((s) => s.id === subId);
    if (!sub) return;
    const inicio = sub.trackAnimacion?.tiempoInicio ?? 0;
    setTimelineCurrentTime(inicio);
    if (audioRef.current) {
      audioRef.current.currentTime = inicio;
    }
    if (subbloqueSoloId === subId) {
      setSubbloqueSolo(null);
    } else {
      setSubbloqueSolo(subId);
      setIsTimelinePlaying(true);
    }
  };

  return (
    <div className="absolute bottom-3 left-3 right-3 z-20 flex flex-col gap-1.5 pointer-events-none select-none">
      {/* Elemento de Audio Oculto para Sincronización (no detiene la animación 3D al terminar el audio) */}
      {currentAudioUrl && (
        <audio
          ref={audioRef}
          src={currentAudioUrl}
        />
      )}

      {/* 🎛️ MEZCLADOR MULTIPISTA DE SUB-BLOQUES (SUB-TRACK MIXER) */}
      {tieneSubbloques && mezcladorAbierto && (
        <div
          style={{
            backgroundColor: coloresApariencia?.fondoPaneles || "rgba(255, 255, 255, 0.94)",
            borderColor: coloresApariencia?.bordePaneles || "rgba(203, 213, 225, 0.8)",
            color: coloresApariencia?.textoPrincipal || "#0F172A",
          }}
          className="pointer-events-auto backdrop-blur-md rounded-3xl p-3 border shadow-2xl flex flex-col gap-2 max-w-4xl mx-auto w-full transition-all animate-in fade-in slide-in-from-bottom-2 duration-200"
        >
          {/* Header del Mezclador */}
          <div className="flex items-center justify-between border-b border-slate-200/70 dark:border-slate-800/70 pb-1.5">
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-[11px] uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
                Mezclador Multipista de Sub-Bloques ({subbloques.length})
              </span>
              {subbloqueSoloId && (
                <span className="px-2 py-0.5 rounded-full bg-amber-500 text-white font-bold text-[9px] animate-pulse">
                  Modo Solo Activo
                </span>
              )}
            </div>

            <div className="flex items-center gap-1.5">
              {/* Selector de Coreografía (1 vs 2) */}
              <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 py-0.5 px-2 rounded-full border border-slate-200 dark:border-slate-700">
                <span className="text-[9px] font-bold text-slate-500">Coreografía:</span>
                <button
                  type="button"
                  onClick={() => {
                    const nueva = (pasoActivo.coreografiaSubbloques || 1) === 1 ? 2 : 1;
                    setCoreografiaSubbloques(pasoActivo.id, nueva);
                  }}
                  title={
                    (pasoActivo.coreografiaSubbloques || 1) === 1
                      ? "Coreografía 1 activa: Secuencial (corredera por corredera y tornillos). Clic para cambiar a Coreografía 2"
                      : "Coreografía 2 activa: Simultánea en bloque (todas las correderas juntas, luego tornillos). Clic para cambiar a Coreografía 1"
                  }
                  className="w-5 h-5 rounded-full bg-[#1368AA] hover:bg-[#0f548a] text-white font-black text-[10px] flex items-center justify-center shadow-xs transition cursor-pointer select-none"
                >
                  {pasoActivo.coreografiaSubbloques || 1}
                </button>
              </div>

              {/* Escalonar en Cascada */}
              <button
                type="button"
                onClick={escalonarCascadaSubbloques}
                title="Distribuir tiempos de armado equitativamente en cascada continua"
                className="px-2.5 py-1 rounded-full text-[9px] font-bold bg-[#1368AA]/10 text-[#1368AA] dark:text-blue-300 border border-[#1368AA]/30 hover:bg-[#1368AA]/20 transition flex items-center gap-1 cursor-pointer"
              >
                <Sparkles className="w-3 h-3" />
                <span>Escalonar Cascada</span>
              </button>

              {/* Botón Cerrar / Plegar */}
              <button
                type="button"
                onClick={() => setMezcladorAbierto(false)}
                title="Plegar pistas de sub-bloques"
                className="w-6 h-6 rounded-full flex items-center justify-center border border-slate-200 dark:border-slate-700 hover:bg-black/5 dark:hover:bg-white/5 transition text-slate-500 cursor-pointer"
              >
                <ChevronDown className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Listado de Pistas Horizontales por Sub-Bloque */}
          <div className="flex flex-col gap-1.5 max-h-48 overflow-y-auto pr-1">
            {subbloques.map((sub, sIdx) => {
              const colorSub = obtenerColorSubbloque(sIdx);
              const codigoSub = sub.codigo || `${pasoActivo.id}${sub.letra || String.fromCharCode(65 + sIdx)}`;
              const nombreSub = sub.nombre || `Sub-Bloque ${pasoActivo.id}-${sub.letra || String.fromCharCode(65 + sIdx)}`;
              const esSolo = subbloqueSoloId === sub.id;

              const tInicio = sub.trackAnimacion?.tiempoInicio ?? 0;
              const tDur = sub.trackAnimacion?.duracion ?? Math.max(1, Number((duracionTotal / subbloques.length).toFixed(1)));
              const tFin = Math.min(duracionTotal, tInicio + tDur);

              const leftPct = Math.max(0, Math.min(100, (tInicio / duracionTotal) * 100));
              const widthPct = Math.max(2, Math.min(100 - leftPct, (tDur / duracionTotal) * 100));
              const playheadPct = Math.max(0, Math.min(100, (timelineCurrentTime / duracionTotal) * 100));

              return (
                <div
                  key={sub.id}
                  className={`flex items-center gap-2 px-2.5 py-1.5 rounded-full border transition ${
                    esSolo
                      ? "bg-amber-500/10 border-amber-500/50 ring-2 ring-amber-400/40 shadow-xs"
                      : "bg-slate-50/80 dark:bg-slate-900/60 border-slate-200/70 dark:border-slate-800/70"
                  }`}
                >
                  {/* Badge Identificador y Nombre */}
                  <div className="flex items-center gap-1.5 w-32 shrink-0">
                    <span
                      className="px-2 py-0.5 rounded-full text-white font-black text-[9.5px] shrink-0"
                      style={{ backgroundColor: colorSub.bg }}
                    >
                      {codigoSub}
                    </span>
                    <span className="text-[10px] font-semibold text-slate-700 dark:text-slate-300 truncate" title={nombreSub}>
                      {nombreSub}
                    </span>
                  </div>

                  {/* Botón Cápsula [▶ Solo] */}
                  <button
                    type="button"
                    onClick={() => reproducirSoloSubbloque(sub.id)}
                    title={esSolo ? "Desactivar modo Solo" : `Previsualizar exclusivamente armado de ${codigoSub}`}
                    className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold border transition flex items-center gap-1 cursor-pointer shrink-0 select-none ${
                      esSolo
                        ? "bg-amber-500 text-white border-amber-400 shadow-xs animate-pulse"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-300 dark:border-slate-700 hover:bg-slate-200"
                    }`}
                  >
                    <Play className="w-2.5 h-2.5 fill-current" />
                    <span>Solo</span>
                  </button>

                  {/* Barra Visual de Pista con Rango de Tiempo y Aguja de Playhead */}
                  <div className="relative flex-1 h-5 bg-slate-200/80 dark:bg-slate-800/80 rounded-full overflow-hidden flex items-center">
                    {/* Segmento Activo del Sub-Bloque */}
                    <div
                      className="absolute top-0.5 bottom-0.5 rounded-full opacity-90 shadow-xs flex items-center justify-between px-2 text-white font-bold text-[8.5px]"
                      style={{
                        left: `${leftPct}%`,
                        width: `${widthPct}%`,
                        backgroundColor: colorSub.bg,
                      }}
                    >
                      <span className="truncate">{tInicio.toFixed(1)}s</span>
                      <span className="truncate">{tFin.toFixed(1)}s</span>
                    </div>

                    {/* Aguja Playhead Vertical Global */}
                    <div
                      className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-10 shadow-xs pointer-events-none"
                      style={{ left: `${playheadPct}%` }}
                    />
                  </div>

                  {/* Controles de Tiempo Fino (Inicio y Duración) */}
                  <div className="flex items-center gap-1 shrink-0 text-[9px]">
                    <div className="flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                      <span className="text-slate-400 font-medium">Ini:</span>
                      <button
                        type="button"
                        onClick={() => {
                          const n = Math.max(0, Number((tInicio - 0.5).toFixed(1)));
                          actualizarTrackSubBloque(pasoActivo.id, sub.id, { tiempoInicio: n });
                        }}
                        className="font-bold px-1 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700"
                      >
                        -
                      </button>
                      <span className="font-mono font-bold min-w-[22px] text-center">{tInicio.toFixed(1)}s</span>
                      <button
                        type="button"
                        onClick={() => {
                          const n = Math.min(duracionTotal - 0.5, Number((tInicio + 0.5).toFixed(1)));
                          actualizarTrackSubBloque(pasoActivo.id, sub.id, { tiempoInicio: n });
                        }}
                        className="font-bold px-1 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700"
                      >
                        +
                      </button>
                    </div>

                    <div className="flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                      <span className="text-slate-400 font-medium">Dur:</span>
                      <button
                        type="button"
                        onClick={() => {
                          const n = Math.max(0.5, Number((tDur - 0.5).toFixed(1)));
                          actualizarTrackSubBloque(pasoActivo.id, sub.id, { duracion: n });
                        }}
                        className="font-bold px-1 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700"
                      >
                        -
                      </button>
                      <span className="font-mono font-bold min-w-[22px] text-center">{tDur.toFixed(1)}s</span>
                      <button
                        type="button"
                        onClick={() => {
                          const n = Math.min(duracionTotal, Number((tDur + 0.5).toFixed(1)));
                          actualizarTrackSubBloque(pasoActivo.id, sub.id, { duracion: n });
                        }}
                        className="font-bold px-1 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
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

        {/* Botón Pistas / Mezclador de Sub-Bloques en Cápsula */}
        {tieneSubbloques && (
          <button
            type="button"
            onClick={() => setMezcladorAbierto(!mezcladorAbierto)}
            title={mezcladorAbierto ? "Plegar pistas de sub-bloques" : "Abrir mezclador multipista de sub-bloques"}
            className={`px-2.5 py-1 rounded-full text-[10px] font-bold border transition flex items-center gap-1.5 cursor-pointer shrink-0 select-none ${
              mezcladorAbierto || subbloqueSoloId
                ? "bg-cyan-600 text-white border-cyan-500 shadow-xs"
                : "bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
            }`}
          >
            <Layers className="w-3 h-3" />
            <span>Pistas ({subbloques.length})</span>
            {mezcladorAbierto ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />}
          </button>
        )}

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
