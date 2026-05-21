import { useRef, useState, useEffect } from "react";
import useEnviroment from "../../hooks/useEnviroment.js";

export default function AudioPlayer() {
  const id = useEnviroment((state) => state.id);
  const pasoActual = useEnviroment((state) => state.pasoActual);

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
    if (!audioRef.current) return;

    if(PanelAyudas){
      ResetAyudas();
      audioRef.current.load();
      audioRef.current.src = `/assets/sounds/01_Ayuda.mp3`;
      setTimeout(() => {
        if (audioRef.current) audioRef.current.play().catch(e => console.log("Audio play failed", e));
      }, 500);

      const handleTimeUpdateAyudas = () => {
        if (!audioRef.current) return;
        let ct = audioRef.current.currentTime;
        const state = useEnviroment.getState();

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

        if (audioRef.current.ended) {
          state.PanelAyudasFalse();
          state.btnCerrarFalse();
          state.ActivarParpadeo();
          state.ResetAyudas();
        }
      };

      const handleEndedAyudas = () => {
        const state = useEnviroment.getState();
        state.PanelAyudasFalse();
        state.btnCerrarFalse();
        state.ActivarParpadeo();
        state.ResetAyudas();
      };

      audioRef.current.addEventListener("timeupdate", handleTimeUpdateAyudas);
      audioRef.current.addEventListener("ended", handleEndedAyudas);

      return () => {
        if (audioRef.current) {
          audioRef.current.removeEventListener("timeupdate", handleTimeUpdateAyudas);
          audioRef.current.removeEventListener("ended", handleEndedAyudas);
        }
      };

    }else{
      // Carga local de audio por paso
      if (id) {
        audioRef.current.src = `/${id}/sounds/${pasoActual}.mp3`;
        audioRef.current.load();
        AudioEndedTrue();
      }
    }
  }, [PanelAyudas, pasoActual, id]);


  //Se activa el audio, al dar clip en el boton iniciar
  useEffect(() => {
    if (StartApp == true) {
      if (audioRef.current.play() !== undefined) {
        audioRef.current.play();
      }
    }
  }, [StartApp]);


  //Control del audio dependiendo de la fse en que se encuentre.
  useEffect(() => {
    if (!audioRef.current) return;
    
    // audioRef.current.volumen = 0.3;
    if (StartApp == true) {
      if (phaseAudio == "start") {
        if (audioRef.current.play() !== undefined) {
          if (ReadyToPlay == true) {
            audioRef.current.load();
            audioRef.current
              .play()
              .then((_) => {})
              .catch((error) => {
                console.log(error);
              });
          }
        }
      } else if (phaseAudio == "playing") {
        AudioEndedFalse();
        if (audioRef.current.play() !== undefined) {

          audioRef.current
            .play()
            .then((_) => {
              // Automatic playback started!
              // Show playing UI.
            })
            .catch((error) => {
              console.log(error);
              // Auto-play was prevented
              // Show paused UI.
            });
        }
      } else if (phaseAudio == "paused") {
        audioRef.current.pause();
      }
    }

    //Funcion que permite conocer la duración del audio
    const handleTimeUpdateGeneral = () => {
      if (!audioRef.current) return;
      // let ct = audioRef.current.currentTime;
      // console.log(ct);
      if (audioRef.current.ended) {
        AudioEndedTrue();
      }
    };

    const handleEndedGeneral = () => {
      ResetAudio();
      ActionTrue();
    };

    audioRef.current.addEventListener("timeupdate", handleTimeUpdateGeneral);
    audioRef.current.addEventListener("ended", handleEndedGeneral);

    return () => {
      if (audioRef.current) {
        audioRef.current.removeEventListener("timeupdate", handleTimeUpdateGeneral);
        audioRef.current.removeEventListener("ended", handleEndedGeneral);
      }
    };

  }, [phaseAudio, StartApp, ReadyToPlay]);

  return (
    <>
      <audio
        id="audio"
        ref={audioRef}
        src={`/${id}/sounds/${pasoActual}.mp3`}
      ></audio>
    </>
  );
}
