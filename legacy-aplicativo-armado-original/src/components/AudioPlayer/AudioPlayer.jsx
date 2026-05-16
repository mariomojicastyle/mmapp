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
  const ActivarAyuda4 = useEnviroment((state) => state.ActivarAyuda4);
  const ActivarAyuda5 = useEnviroment((state) => state.ActivarAyuda5);
  const ActivarAyuda6 = useEnviroment((state) => state.ActivarAyuda6);
  const ActivarParpadeo = useEnviroment((state) => state.ActivarParpadeo);

  const Cliente = useEnviroment((state) => state.Cliente);
  const audioRef = useRef(null);

  //Si se activa el panel de ayudas, se cambia el audio especial, y las ayudas se van activando a medida que el audio suena.
  useEffect(() => {
    if(PanelAyudas){
      audioRef.current.load();
      audioRef.current.src = `/Recursos/Sonidos/01_Ayuda.mp3`;
      setTimeout(() => {
        audio.play();
      }, 500);

      audioRef.current.ontimeupdate = () => {
        let ct = audioRef.current.currentTime;
        // console.log(ct);
        if (Math.round(ct) == 2) {
          ActivarAyuda1();
        } 
        // quitar Tooltip de los colores
        // else if (Math.round(ct) == 10) {
        //   ActivarAyuda2();          
        // } 
        
        else if (Math.round(ct) == 10) {
          ActivarAyuda3();
        } else if (Math.round(ct) == 22) {
          ActivarAyuda4();
        } else if (Math.round(ct) == 35) {
          ActivarAyuda5();
        } else if (Math.round(ct) == 38) {
          ActivarAyuda6();
        } else if(audioRef.current.ended) {
          PanelAyudasFalse();
          ActivarParpadeo();
        }
      };

    }else{
       //local
       audioRef.current.src=`/${id}/sounds/${pasoActual}.mp3`;
      //producion
      // audioRef.current.src=`https://3dymedios.com/Prueba/AP/${Cliente}/${id}/sounds/${pasoActual}.mp3`;
      audioRef.current.load();
      // AudioEndedTrue();
    }
  }, [PanelAyudas,pasoActual]);


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
    audioRef.current.ontimeupdate = () => {
      // let ct = audioRef.current.currentTime;
      // console.log(ct);
      if (audioRef.current.ended) {
        AudioEndedTrue();
      }
    };

    audioRef.current.onended = () => {
      ResetAudio();
      ActionTrue();
    };

  }, [phaseAudio]);

  return (
    <>
      <audio
        id="audio"
        ref={audioRef}
       // src={`./${id}/sounds/${pasoActual}.mp3`}
         src={`/${id}/sounds/${pasoActual}.mp3`}
      ></audio>
    </>
  );
}
