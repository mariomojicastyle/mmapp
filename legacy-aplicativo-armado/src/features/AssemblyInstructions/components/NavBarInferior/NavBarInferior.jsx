import "./NavBarInferior.css";
import { useRef, useState, useEffect, Suspense } from "react";
import useEnviroment from "../../hooks/useEnviroment.js";
import AudioPlayer from "../AudioPlayer/AudioPlayer.jsx";
import PanelBtn from "./PanelBtn/PanelBtn.jsx";
import PanelHerrajes from "./PanelHerrajes/PanelHerrajes.jsx";
import BotonCerrar from "../BotonCerrar/BotonCerrar.jsx";
import PanelTips from "../PanelTips/PanelTips.jsx";
import PanelCantidades from "./PanelHerrajes/PanelCantidades/PanelCantidades";
import PanelInicial from "./PanelInicial/PanelInicial";
import PanelAyudas from "./PanelAyudas/PanelAyudas";
import { IconLeft, IconRight, IconReset, IconPlay, IconPause } from "../Icons.jsx";


export default function NavBarInferior({ id, data }) {
  const refText = useRef(null);
  const refLeft = useRef(null);
  const refRight = useRef(null);

  const pasos = useEnviroment((state) => state.pasos);
  const PasoActual = useEnviroment((state) => state.pasoActual);
  const phaseAudio = useEnviroment((state) => state.phaseAudio);
  const toogle = useEnviroment((state) => state.show);
  const PiezaHerraje = useEnviroment((state) => state.PiezaHerraje);

  const CambiarModelo = useEnviroment((state) => state.CambiarModelo);
  const PositiveShow = useEnviroment((state) => state.PositiveShow);
  const NegativeShow = useEnviroment((state) => state.NegativeShow);


  const PlayingAudio = useEnviroment((state) => state.PlayingAudio);
  const PausedAudio = useEnviroment((state) => state.PausedAudio);

  const ResetBoolTrue = useEnviroment((state) => state.ResetBoolTrue);

  const resetAction = useEnviroment((state) => state.resetAction);
  const Parpadeo = useEnviroment((state) => state.Parpadeo);

  var pasostotal = pasos.length;

  // Actualizar círculo de progreso cuando cambia el paso
  useEffect(() => {
    if (pasostotal > 0) {
      const idx = pasos.indexOf(PasoActual);
      const porcentaje = document.querySelector(":root");
      // Calculamos el porcentaje basado en el índice actual
      // (idx) sobre el total de pasos posibles (pasostotal - 1)
      const maxIdx = pasostotal > 1 ? pasostotal - 1 : 1;
      const nuevovalor = (idx * 100) / maxIdx;
      if (porcentaje) {
        porcentaje.style.setProperty("--porcent", nuevovalor);
      }
    }
  }, [PasoActual, pasos, pasostotal]);

  //Funcion de retroceder un paso en el aplicativo
  const leftButtton = () => {
    if (pasos.length === 0) return;
    var idx = pasos.indexOf(PasoActual);
    var newPaso = idx === 0 ? pasos[pasos.length - 1] : pasos[idx - 1];
    
    CambiarModelo(newPaso);
    NegativeShow();

    setTimeout(() => {
      PositiveShow();
    }, 200);
    PlayingAudio();
  };

  //Función de avanzar un paso
  const RightButtton = () => {
    if (pasos.length === 0) return;
    var idx = pasos.indexOf(PasoActual);
    var newPaso = idx === pasos.length - 1 ? pasos[0] : pasos[idx + 1];

    CambiarModelo(newPaso);
    NegativeShow();

    setTimeout(() => {
      PositiveShow();
    }, 200);
    PlayingAudio();
  };

  //Funcion parpadeo de flecha
  useEffect(()=>{
    if(Parpadeo && refRight.current){
      setTimeout(() => {
        refRight.current.style.background = "#fff";
        refRight.current.style.color = "#f28f1d";
      }, 0);
      setTimeout(() => {
        refRight.current.style.background = "#f28f1d";
        refRight.current.style.color = "#fff";
      }, 500);
      setTimeout(() => {
        refRight.current.style.background = "#fff";
        refRight.current.style.color = "#f28f1d";
      }, 1000);
      setTimeout(() => {
        refRight.current.style.background = "#f28f1d";
        refRight.current.style.color = "#fff";
      }, 1500);
      setTimeout(() => {
        refRight.current.style.background = "#fff";
        refRight.current.style.color = "#f28f1d";
      }, 2000);
      setTimeout(() => {
        refRight.current.style.background = "#f28f1d";
        refRight.current.style.color = "#fff";
      }, 2500);
      setTimeout(() => {
        refRight.current.style.background = "#fff";
        refRight.current.style.color = "#f28f1d";
      }, 3000);
    }
  },[Parpadeo])

  const PlayButton = () => {
    //Se verifica los estados de la animación para cambiar el icono del boton
    if (phaseAudio === "playing") {
      PausedAudio();
    } else if (phaseAudio === "paused") {
      PlayingAudio();
    } else if (phaseAudio === "reset" && resetAction === true) {
      ResetBoolTrue();
      PlayingAudio();
    } else {
      PausedAudio();
    }
  };

  const renderPausePlayIcon = () => {
    if (phaseAudio === "reset") {
      return <IconReset />;
    } else if (phaseAudio === "playing") {
      return <IconPause />;
    } else {
      return <IconPlay />;
    }
  };

  return (
    <>
      <div className="contenedor">
        <div className="SesionArriba">
          <PanelBtn />

          <button ref={refLeft} id="left" onClick={leftButtton}>
            <IconLeft style={{ width: "60%" }} />
          </button>

          {/* <!-- Indicador para conocer en cual paso se encuentra el usuario--> */}
          <div className="slider">
            {/* <!-- contenedor del indicador circular --> */}
            <div className="card2">
              <div className="percent">
                {/* <!-- borde indicativo en computadores --> */}
                <svg className="circule">
                  <circle id="borde" cx="32" cy="32" r="32"></circle>
                  <circle id="borde2" cx="32" cy="32" r="32"></circle>
                </svg>

                {/* <!-- borde indicativo en dispositivos moviles --> */}
                <svg className="circule2">
                  <circle id="borde_787" cx="20" cy="20" r="20"></circle>
                  <circle id="borde787" cx="20" cy="20" r="20"></circle>
                </svg>

                {/* <!-- Contenedor del numero indicativo de paso --> */}
                <div className="number">
                  <h2 id="numpaso">
                    {parseInt(PasoActual, 10)}<span></span>
                  </h2>
                </div>
              </div>
            </div>
          </div>

          <button ref={refRight} id="right" onClick={RightButtton}>
            <IconRight style={{ width: "60%" }} />
          </button>

          <div id="btnPause" className="button" onClick={PlayButton}>
            {renderPausePlayIcon()}
          </div>
        </div>

        <div className="SesionAbajo">
          <div className="FondoPieza">

            <Suspense>
              {toogle ? <AudioPlayer /> : null}
            </Suspense>
            {/* <!-- Etiqueta de texto donde se muestra los diferentes nombres de las piezas y herrajes --> */}
            <h1 ref={refText} id="TextOption">{PiezaHerraje}</h1>
          </div>
        </div>

        {/* TODOS LOS PANELES SE UBICAN EN ESTA SESION, PARA NO POSEER PROBLEMAS CON EL Z-INDEX */}

        {/* <!-- Panel principal de herrajes, este panel es de las principales funcionalidades, se llena por medio de javascript con aquellos herrajes, los cuales seran utilizados en su correspondiente paso de animación, ademas de contener una opcion por defecto, la cual activa el panel de los herrajes con cantidades totales, por medio de las opciones de este panel se puede seleccionar por ejemplos todos los tornillos que se encuentra en dicho paso.  --> */}
        {toogle ? <PanelHerrajes /> : null}
        <BotonCerrar />
        <PanelTips id={id} data={data} />
        <PanelCantidades />
        <PanelAyudas/>


      </div>
    </>
  );
}
