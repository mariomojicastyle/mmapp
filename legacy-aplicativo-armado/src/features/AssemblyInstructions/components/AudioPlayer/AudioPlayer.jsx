import { useRef, useState, useEffect } from "react";
import useEnviroment from "../../hooks/useEnviroment.js";
import { getAssetPath } from "../../../../lib/assets.js";

function getAudioSrc(id, paso, idioma) {
  const ts = Date.now();
  switch (idioma) {
    case "en":
      return getAssetPath(`/${id}/sounds/en/${paso}_en.mp3?t=${ts}`);
    case "pt":
      return getAssetPath(`/${id}/sounds/pt/${paso}_pt.mp3?t=${ts}`);
    case "es-ES":
      return getAssetPath(`/${id}/sounds/es-ES/${paso}_es-ES.mp3?t=${ts}`);
    case "es":
    default:
      return getAssetPath(`/${id}/sounds/${paso}.mp3?t=${ts}`);
  }
}

function getAyudaSrc(id, idioma) {
  if (!id || id === "manual-vacio") {
    return getAssetPath(`/assets/sounds/01_Ayuda.mp3`);
  }
  const ts = Date.now();
  switch (idioma) {
    case "en":
      return getAssetPath(`/${id}/sounds/en/01_Ayuda_en.mp3?t=${ts}`);
    case "pt":
      return getAssetPath(`/${id}/sounds/pt/01_Ayuda_pt.mp3?t=${ts}`);
    case "es-ES":
      return getAssetPath(`/${id}/sounds/es-ES/01_Ayuda_es-ES.mp3?t=${ts}`);
    case "es":
    default:
      return getAssetPath(`/${id}/sounds/01_Ayuda.mp3?t=${ts}`);
  }
}

export default function AudioPlayer({ id: propId }) {
  const stateId = useEnviroment((state) => state.id);
  const id = propId || stateId;
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
  const ActivarAyudaLuz = useEnviroment((state) => state.ActivarAyudaLuz);
  const ActivarAyudaVelocidad = useEnviroment((state) => state.ActivarAyudaVelocidad);
  const ActivarAyudaIdioma = useEnviroment((state) => state.ActivarAyudaIdioma);
  const ActivarAyuda3 = useEnviroment((state) => state.ActivarAyuda3);
  const ActivarAyuda3Right = useEnviroment((state) => state.ActivarAyuda3Right);
  const ActivarAyuda3Left = useEnviroment((state) => state.ActivarAyuda3Left);
  const ActivarAyuda4 = useEnviroment((state) => state.ActivarAyuda4);
  const ActivarAyuda5 = useEnviroment((state) => state.ActivarAyuda5);
  const ActivarAyuda6 = useEnviroment((state) => state.ActivarAyuda6);
  const ActivarParpadeo = useEnviroment((state) => state.ActivarParpadeo);

  const [audioUrl, setAudioUrl] = useState(null);
  const audioRef = useRef(null);

  // ─── Puente directo para play desde gesto de usuario (mobile iframe) ───
  // Registra una función global que PanelInicial.jsx puede llamar sincrónicamente
  // dentro del click handler de INICIAR, preservando la activación de usuario
  // que los navegadores móviles exigen para audio.play().
  useEffect(() => {
    window.__directAudioPlay = () => {
      if (audioRef.current) {
        audioRef.current.play().catch(e => console.warn("Direct audio play:", e.message));
      }
    };
    window.__seekAudio = (targetTime) => {
      if (audioRef.current && Number.isFinite(targetTime)) {
        try {
          audioRef.current.currentTime = Math.max(0, targetTime);
        } catch (e) {
          // ignore seek bounds error
        }
      }
    };
    return () => {
      delete window.__directAudioPlay;
      delete window.__seekAudio;
    };
  }, []);

  const safePlay = (audioEl, source = "audio") => {
    if (!audioEl) return;
    try {
      const p = audioEl.play();
      if (p !== undefined) {
        p.catch(err => {
          if (err.name === 'AbortError') return; // Cancelación esperada por navegación rápida o carga
          if (err.name === 'NotAllowedError') {
            console.warn(`[AudioPlayer] Autoplay retenido en ${source}:`, err.message);
            return;
          }
          console.warn(`[AudioPlayer] Error en ${source}:`, err.message);
        });
      }
    } catch (e) {
      // Ignorar errores síncronos
    }
  };

  // ─── Efecto 0: canplay y canplaythrough ───
  // Cuando el audio tiene los primeros bytes listos o termina de descargarse,
  // si la app está en marcha y phaseAudio no es "paused", arrancamos inmediatamente.
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleCanPlay = () => {
      const state = useEnviroment.getState();
      if (state.StartApp === true && state.phaseAudio === "playing") {
        safePlay(audio, "canplay/canplaythrough");
      }
    };

    const handleLoadedMetadata = () => {
      if (audio.duration && Number.isFinite(audio.duration) && audio.duration > 0) {
        useEnviroment.getState().SetAudioDuration(audio.duration);
      }
    };

    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    audio.addEventListener("durationchange", handleLoadedMetadata);
    audio.addEventListener("canplay", handleLoadedMetadata);
    audio.addEventListener("canplay", handleCanPlay);
    audio.addEventListener("canplaythrough", handleCanPlay);
    return () => {
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audio.removeEventListener("durationchange", handleLoadedMetadata);
      audio.removeEventListener("canplay", handleLoadedMetadata);
      audio.removeEventListener("canplay", handleCanPlay);
      audio.removeEventListener("canplaythrough", handleCanPlay);
    };
  }, []);

  // ─── Efecto 1: Cargar src de audio (Paso o Ayuda) ───
  useEffect(() => {
    let url = "";
    if (PanelAyudas) {
      url = getAyudaSrc(id, idioma);
      setAudioUrl(url);
      if (audioRef.current) {
        audioRef.current.src = url;
        audioRef.current.load();
      }
      setTimeout(() => {
        if (audioRef.current && (useEnviroment.getState().StartApp === true || PanelAyudas)) {
          safePlay(audioRef.current, "ayuda");
        }
      }, 500);

      audioRef.current.ontimeupdate = () => {
        let ct = audioRef.current.currentTime;
        if (Math.round(ct) == 3) {
          ActivarAyuda1();
        } else if (Math.round(ct) == 12) {
          ActivarAyudaLuz();
        } else if (Math.round(ct) == 31) {
          ActivarAyudaVelocidad();
        } else if (Math.round(ct) == 34) {
          ActivarAyudaIdioma();
        } else if (Math.round(ct) == 41) {
          ActivarAyuda3();
        } else if (Math.round(ct) == 48) {
          ActivarAyuda3Right();
        } else if (Math.round(ct) == 50) {
          ActivarAyuda3Left();
        } else if (Math.round(ct) == 54) {
          ActivarAyuda4();
        } else if (Math.round(ct) == 68) {
          ActivarAyuda5();
        } else if (Math.round(ct) == 74) {
          ActivarAyuda6();
        } else if (audioRef.current.ended) {
          PanelAyudasFalse();
          ActivarParpadeo();
        }
      };
    } else {
      url = getAudioSrc(id, pasoActual, idioma);
      setAudioUrl(url);
      if (audioRef.current) {
        audioRef.current.src = url;
        audioRef.current.load();
        const state = useEnviroment.getState();
        if (state.StartApp === true && state.phaseAudio === "playing") {
          safePlay(audioRef.current, "pasoAudio");
        }
      }
    }
  }, [PanelAyudas, pasoActual, id, idioma]);

  // ─── Efecto 2: Arranque inicial (botón INICIAR) ───
  useEffect(() => {
    if (StartApp === true) {
      if (audioRef.current && audioRef.current.paused) {
        safePlay(audioRef.current, "startApp");
      }
    }
  }, [StartApp]);

  // ─── Efecto 3: Control de fases (start / playing / paused) ───
  useEffect(() => {
    if (StartApp === true) {
      if (phaseAudio === "start") {
        if (ReadyToPlay === true && audioRef.current && audioRef.current.paused) {
          audioRef.current.load();
          safePlay(audioRef.current, "startPhase");
        }
      } else if (phaseAudio === "playing") {
        AudioEndedFalse();
        if (audioRef.current && audioRef.current.paused) {
          safePlay(audioRef.current, "playingPhase");
        }
      } else if (phaseAudio === "paused") {
        if (audioRef.current) {
          audioRef.current.pause();
        }
      }
    }

    if (audioRef.current) {
      audioRef.current.ontimeupdate = () => {
        if (!audioRef.current) return;
        if (audioRef.current.ended) {
          AudioEndedTrue();
        }

        const isScrubbing = useEnviroment.getState().isScrubbing;
        if (!isScrubbing) {
          const ct = audioRef.current.currentTime;
          useEnviroment.getState().SetAnimationCurrentTime(ct);
          if (typeof window.__updateScrubberUI === "function") {
            window.__updateScrubberUI(ct);
          }
          if (typeof window.__syncAnimationToTime === "function") {
            window.__syncAnimationToTime(ct);
          }
        }
      };

      audioRef.current.onended = () => {
        ResetAudio();
        ActionTrue();
      };
    }
  }, [phaseAudio, StartApp, ReadyToPlay]);

  // ─── Efecto 4: Sincronizar velocidad de reproducción ───
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
        src={audioUrl || null}
      ></audio>
    </>
  );
}

