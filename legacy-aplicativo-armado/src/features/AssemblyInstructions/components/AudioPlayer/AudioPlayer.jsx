import { useRef, useState, useEffect } from "react";
import useEnviroment from "../../hooks/useEnviroment.js";

function getAudioSrc(id, paso, idioma) {
  const ts = Date.now();
  switch (idioma) {
    case "en":
      return `/${id}/sounds/en/${paso}_en.mp3?t=${ts}`;
    case "es-ES":
      return `/${id}/sounds/es-ES/${paso}_es-ES.mp3?t=${ts}`;
    case "es":
    default:
      return `/${id}/sounds/${paso}.mp3?t=${ts}`;
  }
}

function getAyudaSrc(id, idioma) {
  if (!id || id === "manual-vacio" || id === "M01536") {
    return `/assets/sounds/01_Ayuda.mp3`;
  }
  const ts = Date.now();
  switch (idioma) {
    case "en":
      return `/${id}/sounds/en/01_Ayuda_en.mp3?t=${ts}`;
    case "es-ES":
      return `/${id}/sounds/es-ES/01_Ayuda_es-ES.mp3?t=${ts}`;
    case "es":
    default:
      return `/${id}/sounds/01_Ayuda.mp3?t=${ts}`;
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

  // ─── Efecto 0: canplaythrough ───
  // Cuando el audio termina de descargarse (ej: desde Supabase vía proxy),
  // si phaseAudio ya es "playing", arrancamos inmediatamente.
  // Esto soluciona el caso donde play() se llama antes de que el audio esté listo.
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleCanPlay = () => {
      const state = useEnviroment.getState();
      if (state.StartApp === true && state.phaseAudio === "playing") {
        audio.play().catch(e => console.log("canplaythrough auto-play:", e.message));
      }
    };

    audio.addEventListener("canplaythrough", handleCanPlay);
    return () => audio.removeEventListener("canplaythrough", handleCanPlay);
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
          audioRef.current.play().catch(e => console.log("Ayuda play error:", e));
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
      }
    }
  }, [PanelAyudas, pasoActual, id, idioma]);

  // ─── Efecto 2: Arranque inicial (botón INICIAR) ───
  useEffect(() => {
    if (StartApp === true) {
      if (audioRef.current) {
        audioRef.current.play().catch(e => console.log("Iniciar app play error:", e));
      }
    }
  }, [StartApp]);

  // ─── Efecto 3: Control de fases (start / playing / paused) ───
  // CRÍTICO: La fase "playing" NO verifica ReadyToPlay.
  // ReadyToPlay solo se usa en "start" (carga inicial del primer modelo).
  // El audio del manual ORIGINAL nunca esperaba al modelo 3D para sonar.
  useEffect(() => {
    if (StartApp === true) {
      if (phaseAudio === "start") {
        // Solo la fase "start" espera al modelo 3D (primera carga)
        if (ReadyToPlay === true && audioRef.current) {
          audioRef.current.load();
          audioRef.current.play().catch(e => console.log("Start phase play error:", e));
        }
      } else if (phaseAudio === "playing") {
        // ← SIN verificar ReadyToPlay — idéntico al original que funcionaba
        AudioEndedFalse();
        if (audioRef.current) {
          audioRef.current.play().catch(e => console.log("Playing phase play error:", e));
        }
      } else if (phaseAudio === "paused") {
        if (audioRef.current) {
          audioRef.current.pause();
        }
      }
    }

    if (audioRef.current) {
      audioRef.current.ontimeupdate = () => {
        if (audioRef.current && audioRef.current.ended) {
          AudioEndedTrue();
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

