import React, { useRef, useState, useEffect, useCallback } from "react";
import useEnviroment from "../../hooks/useEnviroment.js";

/**
 * AnimationScrubber: Control deslizante vertical tipo video scrubber
 * Permite adelantar, atrasar e interactuar cuadro a cuadro con la animación 3D y audio.
 * Diseño canónico en cápsula pura circular (rounded-full) con soporte táctil de alta precisión.
 */
export default function AnimationScrubber() {
  const duration = useEnviroment((state) => state.animationDuration);
  const currentTime = useEnviroment((state) => state.animationCurrentTime);
  const pasoActual = useEnviroment((state) => state.pasoActual);
  const SetIsScrubbing = useEnviroment((state) => state.SetIsScrubbing);
  const SetAnimationCurrentTime = useEnviroment((state) => state.SetAnimationCurrentTime);

  const trackRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragProgress, setDragProgress] = useState(0);
  const [showTooltip, setShowTooltip] = useState(false);

  // Calcular el progreso actual normalizado [0, 1]
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
        // Fallback para navegadores antiguos
      }
    }

    setIsDragging(true);
    setShowTooltip(true);
    SetIsScrubbing(true);

    const progress = calculateProgressFromPointer(e.clientY);
    setDragProgress(progress);
    
    const targetTime = progress * duration;
    SetAnimationCurrentTime(targetTime);

    if (window.__seekAnimation) {
      window.__seekAnimation(targetTime);
    }
    if (window.__seekAudio) {
      window.__seekAudio(targetTime);
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

    if (window.__seekAnimation) {
      window.__seekAnimation(targetTime);
    }
    if (window.__seekAudio) {
      window.__seekAudio(targetTime);
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

    if (window.__seekAnimation) {
      window.__seekAnimation(targetTime);
    }
    if (window.__seekAudio) {
      window.__seekAudio(targetTime);
    }

    // Si retrocede antes del final, restablecer el estado de animación no terminada
    if (targetTime < duration - 0.1) {
      useEnviroment.getState().AnimationEndedFalse();
    }

    // Reanudar suavemente la animación si la experiencia está activa en reproducción
    const currentPhase = useEnviroment.getState().phaseAudio;
    if (currentPhase === "playing" && window.__resumeAnimation) {
      window.__resumeAnimation();
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

  // Si no hay duración registrada en este paso, ocultar de forma elegante
  if (!duration || duration <= 0) {
    return null;
  }

  // Porcentaje para posicionar el pulgar desde el fondo (0% = bottom: 0, 100% = bottom: 100%)
  const percentage = displayProgress * 100;

  return (
    <div 
      className="fixed left-4 bottom-24 sm:bottom-28 z-30 flex items-center select-none touch-none pointer-events-auto"
      style={{ WebkitTapHighlightColor: "transparent" }}
      aria-label="Controlador de tiempo de animación"
    >
      {/* Contenedor Cápsula Vertical Oficial */}
      <div 
        className="relative w-9 h-44 py-3 rounded-full bg-[#131B2E]/90 backdrop-blur-md border border-white/15 shadow-xl flex flex-col items-center justify-between transition-all duration-200 hover:border-cyan-400/40"
      >
        {/* Indicador superior (Fin) */}
        <span className="text-[9px] font-mono font-bold text-gray-400 select-none">
          {formatTime(duration)}
        </span>

        {/* Track central interactivo */}
        <div 
          ref={trackRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          className="relative w-2 h-28 my-auto rounded-full bg-white/15 cursor-pointer touch-none flex justify-center"
        >
          {/* Barra de progreso rellena desde el fondo */}
          <div 
            className="absolute bottom-0 w-full rounded-full transition-none pointer-events-none"
            style={{ 
              height: `${percentage}%`,
              backgroundColor: "var(--primary, #0088AA)" 
            }}
          />

          {/* Pulgar Circular Puro (Thumb) */}
          <div 
            className={`absolute w-5 h-5 -ml-1.5 rounded-full border-2 border-white shadow-md flex items-center justify-center cursor-grab active:cursor-grabbing transition-transform ${isDragging ? "scale-125" : "hover:scale-110"}`}
            style={{ 
              bottom: `calc(${percentage}% - 10px)`,
              backgroundColor: "var(--primary, #0088AA)"
            }}
          >
            {/* Punto central del pulgar */}
            <div className="w-1.5 h-1.5 rounded-full bg-white" />
          </div>
        </div>

        {/* Indicador inferior (Inicio) */}
        <span className="text-[9px] font-mono font-bold text-gray-400 select-none">
          0s
        </span>
      </div>

      {/* Tooltip Flotante Dinámico en Cápsula (aparece a la derecha del slider) */}
      {(showTooltip || isDragging) && (
        <div 
          className="absolute left-12 px-2.5 py-1 rounded-full bg-[#131B2E] text-white text-[11px] font-mono font-bold shadow-lg border border-cyan-400/30 flex items-center gap-1.5 pointer-events-none animate-in fade-in zoom-in-95 duration-150"
          style={{
            bottom: `calc(${percentage * 0.65 + 18}% )`
          }}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
          <span>{formatTime(displayProgress * duration)}</span>
          <span className="text-gray-400">/</span>
          <span className="text-gray-400">{formatTime(duration)}</span>
        </div>
      )}
    </div>
  );
}
