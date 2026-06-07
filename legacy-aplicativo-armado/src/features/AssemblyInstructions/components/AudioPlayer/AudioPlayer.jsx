import { useRef, useState, useEffect } from "react";
import useEnviroment from "../../hooks/useEnviroment.js";

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
  const ActivarAyuda3 = useEnviroment((state) => state.ActivarAyuda3);
  const ActivarAyuda4 = useEnviroment((state) => state.ActivarAyuda4);
  const ActivarAyuda5 = useEnviroment((state) => state.ActivarAyuda5);
  const ActivarAyuda6 = useEnviroment((state) => state.ActivarAyuda6);
  const ActivarParpadeo = useEnviroment((state) => state.ActivarParpadeo);

  const audioRef = useRef(null);

  // 1. Efecto para cargar el recurso de audio correspondiente (Paso o Ayuda)
  useEffect(() => {
    if (PanelAyudas) {
      audioRef.current.load();
      audioRef.current.src = getAyudaSrc(id, idioma);
      setTimeout(() => {
        if (audioRef.current && (useEnviroment.getState().StartApp === true || PanelAyudas)) {
          audioRef.current.play().catch(e => console.log("Ayuda play error:", e));
        }
      }, 500);

      audioRef.current.ontimeupdate = () => {
        let ct = audioRef.current.currentTime;
        if (Math.round(ct) == 2) {
          ActivarAyuda1();
        } else if (Math.round(ct) == 10) {
          ActivarAyuda3();
        } else if (Math.round(ct) == 22) {
          ActivarAyuda4();
        } else if (Math.round(ct) == 35) {
          ActivarAyuda5();
        } else if (Math.round(ct) == 38) {
          ActivarAyuda6();
        } else if (audioRef.current.ended) {
          PanelAyudasFalse();
          ActivarParpadeo();
        }
      };
    } else {
      audioRef.current.src = getAudioSrc(id, pasoActual, idioma);
      audioRef.current.load();
    }
  }, [PanelAyudas, pasoActual, id, idioma]);

  // 2. Se activa el audio inmediatamente al dar click en el botón INICIAR
  useEffect(() => {
    if (StartApp === true) {
      if (audioRef.current) {
        audioRef.current.play().catch(e => console.log("Iniciar app play error:", e));
      }
    }
  }, [StartApp]);

  // 3. Control del audio dependiendo de la fase (start, playing, paused) y callbacks de finalización
  useEffect(() => {
    if (StartApp === true) {
      if (phaseAudio === "start") {
        if (audioRef.current) {
          if (ReadyToPlay === true) {
            audioRef.current.load();
            audioRef.current.play().catch(e => console.log("Start phase play error:", e));
          }
        }
      } else if (phaseAudio === "playing") {
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

  // 4. Sincronizar velocidad de reproducción (playbackRate)
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
        src={getAudioSrc(id, pasoActual, idioma)}
      ></audio>
    </>
  );
}
