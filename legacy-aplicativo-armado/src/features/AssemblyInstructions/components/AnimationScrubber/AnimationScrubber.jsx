import React, { useRef, useState, useEffect, useCallback } from "react";
import useEnviroment from "../../hooks/useEnviroment.js";

/**
 * AnimationScrubber: Control deslizante vertical ultraligero y minimalista
 * Muestra únicamente la línea de avance y los indicadores numéricos sin cápsula envolvente pesada.
 * Pulgar táctil matemáticamente centrado (left: 50%, translate(-50%, 50%)) sobre la línea de avance.
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
        thumbRef.current.style.bottom = `${pct}%`;
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
      {/* Contenedor Esbelto y Minimalista (Sin cápsula exterior pesada) */}
      <div 
        className="relative w-8 sm:w-9 h-[54vh] min-h-[170px] max-h-[480px] py-1 flex flex-col items-center justify-between select-none"
      >
        {/* Indicador superior (Duración Total) */}
        <span 
          className="text-[10px] font-mono font-bold select-none drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)]"
          style={{ color: "var(--secondary, #ffffff)" }}
        >
          {formatTime(duration)}
        </span>

        {/* Track central vertical interactivo con área táctil invisible amplia */}
        <div 
          ref={trackRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          className="relative w-1.5 h-[calc(100%-44px)] my-auto rounded-full cursor-pointer touch-none flex justify-center items-end"
          style={{
            backgroundColor: "rgba(255, 255, 255, 0.25)",
            boxShadow: "0 0 4px rgba(0, 0, 0, 0.4)"
          }}
        >
          {/* Zona táctil expandida invisible para facilitar toque suave en móviles */}
          <div className="absolute inset-y-0 -inset-x-3 cursor-pointer touch-none" />

          {/* Barra de progreso rellena desde el fondo con color de estilo primario */}
          <div 
            ref={fillRef}
            className="absolute bottom-0 w-full rounded-full transition-none pointer-events-none"
            style={{ 
              height: `${percentage}%`,
              backgroundColor: "var(--primary, #0088AA)",
              boxShadow: "0 0 6px var(--primary-glow, rgba(0, 136, 170, 0.5))"
            }}
          />

          {/* Pulgar Táctil Circular Puro (Thumb) Matemáticamente Centrado sobre la línea */}
          <div 
            ref={thumbRef}
            className={`absolute w-5 h-5 rounded-full border-2 border-white shadow-md flex items-center justify-center cursor-grab active:cursor-grabbing pointer-events-none transition-transform ${isDragging ? "scale-125" : "hover:scale-110"}`}
            style={{ 
              bottom: `${percentage}%`,
              left: "50%",
              transform: "translate(-50%, 50%)",
              backgroundColor: "var(--primary, #0088AA)",
              boxShadow: "0 2px 8px rgba(0,0,0,0.7), 0 0 6px var(--primary-glow, rgba(0, 136, 170, 0.4))"
            }}
          >
            {/* Punto focal central blanco */}
            <div className="w-1.5 h-1.5 rounded-full bg-white shadow-sm" />
          </div>
        </div>

        {/* Indicador inferior (Inicio 0s) */}
        <span 
          className="text-[10px] font-mono font-bold select-none drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)]"
          style={{ color: "var(--secondary, #ffffff)" }}
        >
          0s
        </span>
      </div>
    </div>
  );
}
