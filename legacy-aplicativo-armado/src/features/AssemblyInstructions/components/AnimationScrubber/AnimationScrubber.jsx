import React, { useRef, useState, useEffect, useCallback } from "react";
import useEnviroment from "../../hooks/useEnviroment.js";

/**
 * AnimationScrubber: Control deslizante vertical tipo video scrubber de alta precisión
 * Permite adelantar, atrasar e interactuar cuadro a cuadro con la animación 3D y audio.
 * Ergonomía: Altura expandida de pantalla con track vertical largo para máxima sensibilidad.
 * Estilo de Marca: Vidrio translúcido dinámico según personalización de UI (--surface / --nubes-bg-opacity).
 * Formas: Cápsula pura (rounded-full) con pulgar táctil de precisión circular.
 */
export default function AnimationScrubber() {
  const duration = useEnviroment((state) => state.animationDuration);
  const currentTime = useEnviroment((state) => state.animationCurrentTime);
  const pasoActual = useEnviroment((state) => state.pasoActual);
  const SetIsScrubbing = useEnviroment((state) => state.SetIsScrubbing);
  const SetAnimationCurrentTime = useEnviroment((state) => state.SetAnimationCurrentTime);

  const trackRef = useRef(null);
  const fillRef = useRef(null);
  const thumbRef = useRef(null);
  const isDraggingRef = useRef(false);
  const wasPlayingRef = useRef(false);
  const durationRef = useRef(duration);
  durationRef.current = duration;

  const [isDragging, setIsDragging] = useState(false);
  isDraggingRef.current = isDragging;
  const [dragProgress, setDragProgress] = useState(0);
  const [showTooltip, setShowTooltip] = useState(false);

  // Sincronización continua directa en DOM a 60 FPS durante la reproducción de Three.js / Audio
  useEffect(() => {
    window.__updateScrubberUI = (time) => {
      if (isDraggingRef.current) return;
      const dur = durationRef.current;
      if (!dur || dur <= 0) return;
      const progress = Math.min(1, Math.max(0, time / dur));
      const pct = progress * 100;
      if (fillRef.current) {
        fillRef.current.style.height = `${pct}%`;
      }
      if (thumbRef.current) {
        thumbRef.current.style.bottom = `calc(${pct}% - 12px)`;
      }
    };
    return () => {
      delete window.__updateScrubberUI;
    };
  }, []);

  // Progreso actual normalizado [0, 1]
  const currentProgress = duration > 0 ? Math.min(1, Math.max(0, currentTime / duration)) : 0;
  const displayProgress = isDragging ? dragProgress : currentProgress;

  // Manejar el cálculo de posición a lo largo del track vertical (Abajo: 0%, Arriba: 100%)
  const calculateProgressFromPointer = useCallback((clientY) => {
    if (!trackRef.current) return 0;
    const rect = trackRef.current.getBoundingClientRect();
    const clampedY = Math.min(rect.bottom, Math.max(rect.top, clientY));
    // Invertir Y para que abajo sea 0 y arriba sea 1 (recorrido ascendente)
    const progress = (rect.bottom - clampedY) / rect.height;
    return Math.min(1, Math.max(0, progress));
  }, []);

  const handlePointerDown = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.target.setPointerCapture) {
      try {
        e.target.setPointerCapture(e.pointerId);
      } catch (err) {
        // Fallback
      }
    }

    const state = useEnviroment.getState();
    wasPlayingRef.current = (state.phaseAudio === "playing");

    // Pausar audio y animación de inmediato para control cuadro a cuadro estable
    state.PausedAudio();
    state.ActionFalse();
    state.AudioEndedFalse();
    state.AnimationEndedFalse();

    setIsDragging(true);
    setShowTooltip(true);
    SetIsScrubbing(true);

    const progress = calculateProgressFromPointer(e.clientY);
    setDragProgress(progress);
    
    const targetTime = progress * duration;
    SetAnimationCurrentTime(targetTime);

    if (window.__seekAudio) {
      window.__seekAudio(targetTime);
    }
    if (window.__seekAnimation) {
      window.__seekAnimation(targetTime);
    }
  };

  const handlePointerMove = (e) => {
    if (!isDragging) return;
    e.preventDefault();
    e.stopPropagation();

    const progress = calculateProgressFromPointer(e.clientY);
    setDragProgress(progress);

    const targetTime = progress * duration;
    SetAnimationCurrentTime(targetTime);

    // Mantener asegurado que el botón de reinicio no se muestre al deslizar
    useEnviroment.getState().ActionFalse();
    useEnviroment.getState().AudioEndedFalse();

    if (window.__seekAudio) {
      window.__seekAudio(targetTime);
    }
    if (window.__seekAnimation) {
      window.__seekAnimation(targetTime);
    }
  };

  const handlePointerUp = (e) => {
    if (!isDragging) return;
    e.preventDefault();
    e.stopPropagation();

    if (e.target.releasePointerCapture) {
      try {
        e.target.releasePointerCapture(e.pointerId);
      } catch (err) {
        // Fallback
      }
    }

    const progress = calculateProgressFromPointer(e.clientY);
    const targetTime = progress * duration;

    setIsDragging(false);
    SetIsScrubbing(false);

    if (window.__seekAudio) {
      window.__seekAudio(targetTime);
    }
    if (window.__seekAnimation) {
      window.__seekAnimation(targetTime);
    }

    const state = useEnviroment.getState();

    // Si el usuario posicionó antes del final del paso (< duración - 0.2s)
    if (targetTime < duration - 0.2) {
      state.ActionFalse();
      state.AudioEndedFalse();
      state.AnimationEndedFalse();

      // Si estaba reproduciendo antes del toque, reanudar la reproducción fluida
      if (wasPlayingRef.current) {
        state.PlayingAudio();
        if (typeof window.__directAudioPlay === "function") {
          window.__directAudioPlay();
        }
        if (typeof window.__resumeAnimation === "function") {
          window.__resumeAnimation();
        }
      } else {
        // Si estaba pausado, conservar en estado de pausa (mostrando icono de play en la barra)
        state.PausedAudio();
      }
    } else {
      // Si llegó al final exacto de la barra, marcar como concluido
      state.AudioEndedTrue();
      state.AnimationEndedTrue();
      state.ResetAudio();
      state.ActionTrue();
    }

    // Ocultar el tooltip flotante tras medio segundo
    setTimeout(() => {
      setShowTooltip(false);
    }, 600);
  };

  // Formato MM:SS o Ssegundos
  const formatTime = (secs) => {
    const s = Math.round(secs || 0);
    return `${s}s`;
  };

  // Si no hay duración registrada en este paso, ocultar de forma limpia
  if (!duration || duration <= 0) {
    return null;
  }

  // Porcentaje para posicionar el pulgar desde el fondo (0% = bottom: 0, 100% = bottom: 100%)
  const percentage = displayProgress * 100;

  return (
    <div 
      className="fixed left-3 sm:left-5 top-1/2 -translate-y-1/2 z-30 flex items-center select-none touch-none pointer-events-auto"
      style={{ WebkitTapHighlightColor: "transparent" }}
      aria-label="Controlador de tiempo de animación"
    >
      {/* Contenedor Cápsula Vertical Oficial con Estética de Vidrio Dinámico */}
      <div 
        className="relative w-10 sm:w-11 h-[54vh] min-h-[290px] max-h-[500px] py-3.5 rounded-full flex flex-col items-center justify-between transition-all duration-200"
        style={{
          background: "color-mix(in srgb, var(--primary, #0088AA) var(--nubes-bg-opacity, 20%), transparent)",
          backdropFilter: "var(--glass-blur, blur(12px))",
          WebkitBackdropFilter: "var(--glass-blur, blur(12px))",
          border: "1px solid color-mix(in srgb, var(--primary, #0088AA) 40%, transparent)",
          boxShadow: "0 10px 30px rgba(0, 0, 0, 0.45), 0 0 15px var(--primary-glow, rgba(0, 136, 170, 0.2))"
        }}
      >
        {/* Indicador superior (Duración Total) */}
        <span 
          className="text-[10px] font-mono font-bold select-none"
          style={{ color: "var(--secondary, #ffffff)" }}
        >
          {formatTime(duration)}
        </span>

        {/* Track central vertical interactivo de alta resolución táctil */}
        <div 
          ref={trackRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          className="relative w-2.5 h-[calc(100%-54px)] my-auto rounded-full cursor-pointer touch-none flex justify-center"
          style={{
            backgroundColor: "rgba(255, 255, 255, 0.15)"
          }}
        >
          {/* Barra de progreso rellena desde el fondo con color de estilo primario */}
          <div 
            ref={fillRef}
            className="absolute bottom-0 w-full rounded-full transition-none pointer-events-none"
            style={{ 
              height: `${percentage}%`,
              backgroundColor: "var(--primary, #0088AA)",
              boxShadow: "0 0 8px var(--primary-glow, rgba(0, 136, 170, 0.4))"
            }}
          />

          {/* Pulgar Táctil Circular Puro (Thumb) */}
          <div 
            ref={thumbRef}
            className={`absolute w-6 h-6 -ml-1.5 rounded-full border-2 border-white shadow-lg flex items-center justify-center cursor-grab active:cursor-grabbing transition-transform ${isDragging ? "scale-125" : "hover:scale-110"}`}
            style={{ 
              bottom: `calc(${percentage}% - 12px)`,
              backgroundColor: "var(--primary, #0088AA)",
              boxShadow: "0 2px 8px rgba(0,0,0,0.6)"
            }}
          >
            {/* Punto focal central blanco */}
            <div className="w-1.5 h-1.5 rounded-full bg-white shadow-sm" />
          </div>
        </div>

        {/* Indicador inferior (Inicio 0s) */}
        <span 
          className="text-[10px] font-mono font-bold select-none"
          style={{ color: "var(--secondary, #ffffff)" }}
        >
          0s
        </span>
      </div>

      {/* Tooltip Flotante Dinámico en Cápsula (Aparece a la derecha del slider) */}
      {(showTooltip || isDragging) && (
        <div 
          className="absolute left-14 px-3 py-1.5 rounded-full text-white text-[11px] font-mono font-bold shadow-xl flex items-center gap-1.5 pointer-events-none animate-in fade-in zoom-in-95 duration-150"
          style={{
            background: "color-mix(in srgb, var(--primary, #0088AA) var(--nubes-bg-opacity, 30%), #0B0F17)",
            backdropFilter: "var(--glass-blur, blur(12px))",
            WebkitBackdropFilter: "var(--glass-blur, blur(12px))",
            border: "1px solid var(--primary, #0088AA)",
            boxShadow: "0 8px 24px rgba(0, 0, 0, 0.5), 0 0 12px var(--primary-glow, rgba(0, 136, 170, 0.3))",
            bottom: `calc(${percentage * 0.78 + 10}%)`
          }}
        >
          <span 
            className="w-2 h-2 rounded-full animate-pulse"
            style={{ backgroundColor: "var(--primary, #0088AA)" }}
          />
          <span style={{ color: "var(--secondary, #ffffff)" }}>
            {formatTime(displayProgress * duration)}
          </span>
          <span className="text-gray-400">/</span>
          <span className="text-gray-400">{formatTime(duration)}</span>
        </div>
      )}
    </div>
  );
}
