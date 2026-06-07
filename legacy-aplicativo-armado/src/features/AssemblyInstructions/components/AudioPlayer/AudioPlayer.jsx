import { useRef, useState, useEffect } from "react";
import useEnviroment from "../../hooks/useEnviroment.js";

/**
 * Genera la ruta de audio según el idioma seleccionado.
 * - 'es'    → /{id}/sounds/{paso}.mp3
 * - 'es-ES' → /{id}/sounds/es-ES/{paso}_es-ES.mp3
 * - 'en'    → /{id}/sounds/en/{paso}_en.mp3
 */
function getAudioSrc(id, paso, idioma) {
  switch (idioma) {
    case "en":
      return `/${id}/sounds/en/${paso}_en.mp3`;
    case "es-ES":
      return `/${id}/sounds/es-ES/${paso}_es-ES.mp3`;
    case "es":
    default:
      return `/${id}/sounds/${paso}.mp3`;
  }
}

function getAyudaSrc(id, idioma) {
  if (!id || id === "manual-vacio" || id === "M01536") {
    return `/assets/sounds/01_Ayuda.mp3`;
  }
  switch (idioma) {
    case "en":
      return `/${id}/sounds/en/01_Ayuda_en.mp3`;
    case "es-ES":
      return `/${id}/sounds/es-ES/01_Ayuda_es-ES.mp3`;
    case "es":
    default:
      return `/${id}/sounds/01_Ayuda.mp3`;
  }
}

export default function AudioPlayer() {
  const id = useEnviroment((state) => state.id);
  const pasoActual = useEnviroment((state) => state.pasoActual);
  const idioma = useEnviroment((state) => state.idioma);
  const playbackRate = useEnviroment((state) => state.playbackRate);

  const ResetAudio = useEnviroment((state) => state.ResetAudio);
  const phaseAudio = useEnviroment((state) => state.phaseAudio);
  const ActionTrue = useEnviroment((state) => state.ActionTrue);
  const ReadyToPlay = useEnviroment((state) => state.ReadyToPlay);

  const StartApp = useEnviroment((state) => state.StartApp);

  const AudioEndedTrue = useEnviroment((state) => state.AudioEndedTrue);
  const AudioEndedFalse = useEnviroment((state) => state.AudioEndedFalse);

  const PanelAyudas = useEnviroment((state) => state.PanelAyudas);
  const PanelAyudasFalse = useEnviroment((state) => state.PanelAyudasFalse);
  const ActivarAyuda1 = useEnviroment((state) => state.ActivarAyuda1);
  //  quitar tooltip de colores de visualización 
  // const ActivarAyuda2 = useEnviroment((state) => state.ActivarAyuda2);
  const ActivarAyuda3 = useEnviroment((state) => state.ActivarAyuda3);
  const SetAyuda3ArrowLeft = useEnviroment((state) => state.SetAyuda3ArrowLeft);
  const SetAyuda3ArrowCenter = useEnviroment((state) => state.SetAyuda3ArrowCenter);
  const SetAyuda3ArrowRight = useEnviroment((state) => state.SetAyuda3ArrowRight);
  const ActivarAyuda4 = useEnviroment((state) => state.ActivarAyuda4);
  const ActivarAyuda5 = useEnviroment((state) => state.ActivarAyuda5);
  const ActivarAyuda6 = useEnviroment((state) => state.ActivarAyuda6);
  const ResetAyudas = useEnviroment((state) => state.ResetAyudas);
  const ActivarParpadeo = useEnviroment((state) => state.ActivarParpadeo);

  const Cliente = useEnviroment((state) => state.Cliente);
  const PanelShow = useEnviroment((state) => state.PanelShow);
  const PanelCantidades = useEnviroment((state) => state.PanelCantidades);
  const panelTips = useEnviroment((state) => state.panelTips);
  const PausedAudio = useEnviroment((state) => state.PausedAudio);
  const audioRef = useRef(null);

  // Pausar automáticamente el audio de fondo cuando se abre cualquier cortina
  useEffect(() => {
    if (PanelShow || PanelCantidades || panelTips) {
      PausedAudio();
    }
  }, [PanelShow, PanelCantidades, panelTips, PausedAudio]);

  //Si se activa el panel de ayudas, se cambia el audio especial, y las ayudas se van activando a medida que el audio suena.
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdateAyudas = () => {
      const state = useEnviroment.getState();
      if (!state.PanelAyudas) {
        if (audio.ended) {
          state.AudioEndedTrue();
        }
        return;
      }

      let ct = audio.currentTime;
      if (ct >= 2 && ct < 10) {
        if (!state.ayuda1) {
          state.ResetAyudas();
          state.ActivarAyuda1();
        }
      } else if (ct >= 10 && ct < 24) {
        if (!state.ayuda3) {
          state.ResetAyudas();
          state.ActivarAyuda3();
        }
        // Control secuencial e intuitivo de las flechas de ayuda3 (Centro -> Derecha -> Izquierda)
        if (ct >= 10 && ct < 15) {
          if (!state.ayuda3ArrowCenter || state.ayuda3ArrowRight || state.ayuda3ArrowLeft) {
            state.SetAyuda3ArrowCenter(true);
            state.SetAyuda3ArrowRight(false);
            state.SetAyuda3ArrowLeft(false);
          }
        } else if (ct >= 15 && ct < 20) {
          if (state.ayuda3ArrowCenter || !state.ayuda3ArrowRight || state.ayuda3ArrowLeft) {
            state.SetAyuda3ArrowCenter(false);
            state.SetAyuda3ArrowRight(true);
            state.SetAyuda3ArrowLeft(false);
          }
        } else if (ct >= 20 && ct < 24) {
          if (state.ayuda3ArrowCenter || state.ayuda3ArrowRight || !state.ayuda3ArrowLeft) {
            state.SetAyuda3ArrowCenter(false);
            state.SetAyuda3ArrowRight(false);
            state.SetAyuda3ArrowLeft(true);
          }
        }
      } else if (ct >= 24 && ct < 33) {
        if (!state.ayuda4) {
          state.ResetAyudas();
          state.ActivarAyuda4();
        }
      } else if (ct >= 33 && ct < 35) {
        if (!state.ayuda5) {
          state.ResetAyudas();
          state.ActivarAyuda5();
        }
      } else if (ct >= 38) {
        if (!state.ayuda6) {
          state.ResetAyudas();
          state.ActivarAyuda6();
        }
      }

      if (audio.ended) {
        state.PanelAyudasFalse();
        state.btnCerrarFalse();
        state.ActivarParpadeo();
        state.ResetAyudas();
      }
    };

    const handleEndedAyudas = () => {
      const state = useEnviroment.getState();
      if (state.PanelAyudas) {
        state.PanelAyudasFalse();
        state.btnCerrarFalse();
        state.ActivarParpadeo();
        state.ResetAyudas();
      } else {
        state.ResetAudio();
        state.ActionTrue();
      }
    };

    audio.addEventListener("timeupdate", handleTimeUpdateAyudas);
    audio.addEventListener("ended", handleEndedAyudas);

    return () => {
      audio.removeEventListener("timeupdate", handleTimeUpdateAyudas);
      audio.removeEventListener("ended", handleEndedAyudas);
    };
  }, []);

  // Efecto principal unificado de control de audio (Carga y Reproducción)
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    // 1. Silencio absoluto si la app no ha iniciado o no está lista
    if (StartApp !== true || ReadyToPlay !== true) {
      audio.pause();
      audio.currentTime = 0;
      if (audio.src !== "") {
        audio.src = "";
      }
      return;
    }

    // 2. Determinar la ruta correcta del audio
    let targetSrc = "";
    if (PanelAyudas) {
      targetSrc = getAyudaSrc(id, idioma);
    } else if (id) {
      targetSrc = getAudioSrc(id, pasoActual, idioma);
    }

    const absoluteTargetSrc = targetSrc ? new URL(targetSrc, window.location.origin).href : "";

    // 3. Carga imperativa si cambia de ruta
    if (audio.src !== absoluteTargetSrc) {
      audio.pause();
      audio.currentTime = 0;
      audio.src = absoluteTargetSrc;
      audio.load();
      AudioEndedTrue();
    }

    // 4. Lógica de reproducción
    const shouldPlay = phaseAudio === "playing" || PanelAyudas === true;

    if (shouldPlay) {
      AudioEndedFalse();
      const timer = setTimeout(() => {
        const state = useEnviroment.getState();
        const currentShouldPlay = state.phaseAudio === "playing" || state.PanelAyudas === true;
        if (audioRef.current && currentShouldPlay && state.StartApp === true && state.ReadyToPlay === true) {
          audioRef.current.play().catch(e => {
            console.log("Audio play safely caught:", e.message);
          });
        }
      }, 50);

      return () => clearTimeout(timer);
    } else if (phaseAudio === "paused") {
      audio.pause();
    }
  }, [id, pasoActual, idioma, PanelAyudas, StartApp, ReadyToPlay, phaseAudio, AudioEndedTrue, AudioEndedFalse]);

  // Sincronizar velocidad de reproducción (playbackRate) en caliente y tras cargas
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = playbackRate;
    }
  }, [playbackRate, pasoActual, PanelAyudas, idioma]);

  return (
    <>
      <audio
        id="audio"
        ref={audioRef}
      ></audio>
    </>
  );
}
