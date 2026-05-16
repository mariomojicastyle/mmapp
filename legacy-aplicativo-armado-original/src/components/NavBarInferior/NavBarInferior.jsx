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
import PanelEncuesta from "./PanelEncuesta/PanelEncuesta";
import FormularioEncuesta from "./PanelEncuesta/FormularioEncuesta/FormularioEncuesta";


export default function NavBarInferior({ id, data }) {
  const refText = useRef(null);
  const refLeft = useRef(null);
  const refRight = useRef(null);
  const refNumber = useRef(null);
  const refNumPaso = useRef(null);

  const btnPause = useRef(null);
  const btnPauseSvg = useRef(null);


  var porcentaje = document.querySelector(":root");
  const pasos = useEnviroment((state) => state.pasos);
  const phaseAudio = useEnviroment((state) => state.phaseAudio);
  const toogle = useEnviroment((state) => state.show);
  const PanelShow = useEnviroment((state) => state.PanelShow);

  const CambiarModelo = useEnviroment((state) => state.CambiarModelo);
  const PositiveShow = useEnviroment((state) => state.PositiveShow);
  const NegativeShow = useEnviroment((state) => state.NegativeShow);


  const PlayingAudio = useEnviroment((state) => state.PlayingAudio);
  const PausedAudio = useEnviroment((state) => state.PausedAudio);

  const ResetBoolTrue = useEnviroment((state) => state.ResetBoolTrue);

  const resetAction = useEnviroment((state) => state.resetAction);
  const Parpadeo = useEnviroment((state) => state.Parpadeo);

  var pasostotal = pasos.length;


  //Funcion que retroalimenta al usuario, con el nombre del herraje o pieza seleccionada. 
  useEffect(() => {
    const susbcribeText = useEnviroment.subscribe(
      (state) => state.PiezaHerraje,
      (value) => {
        if (refText.current !== null) {
          refText.current.innerHTML = value;
        }
      }
    );
    refNumber.current.textContent = pasos[0];
  }, []);

  //Funcion de retroceder un paso en el aplicativo
  const leftButtton = () => {
    refNumber.current.textContent = prev(refNumber.current.textContent, pasos);
    CambiarModelo(refNumber.current.textContent);
    NegativeShow();

    setTimeout(() => {
      PositiveShow();
    }, 200);
    PlayingAudio();
    CambioPause();
  };

  //Función de avanzar un paso
  const RightButtton = () => {
    refNumber.current.textContent = next(refNumber.current.textContent, pasos);
    CambiarModelo(refNumber.current.textContent);
    NegativeShow();

    setTimeout(() => {
      PositiveShow();
    }, 200);
    PlayingAudio();
    CambioPause();

  };


  //Cambio de icono a svg de reset.
  useEffect(() => {

    if (phaseAudio == "reset") {

      btnPause.current.removeChild(btnPauseSvg.current);
      btnPauseSvg.current.innerHTML =
        "<svg xmlns='http://www.w3.org/2000/svg' width='16' height='16' fill='currentColor'" +
        "class='bi bi-arrow-counterclockwise' viewBox='0 0 16 16'>" +
        "<path fill-rule='evenodd' d='M8 3a5 5 0 1 1-4.546 2.914.5.5 0 0 0-.908-.417A6 6 0 1 0 8 2v1z' />" +
        "<path d='M8 4.466V.534a.25.25 0 0 0-.41-.192L5.23 2.308a.25.25 0 0 0 0 .384l2.36 1.966A.25.25 0 0 0 8 4.466z' />" +
        "</svg>;";
      ;
      btnPause.current.appendChild(btnPauseSvg.current);

    }
  }, [phaseAudio]);


  //Funcion parpadeo de flecha
  useEffect(()=>{
    if(Parpadeo){
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

    btnPause.current.removeChild(btnPauseSvg.current);

    //Se verifica los estados de la animación para cambiar el icono del boton
    //Esta validación es en el caso donde la animación NO se encuentra pausada, ni finalizada
    if (phaseAudio == "playing") {

      btnPauseSvg.current.innerHTML =
        "<svg xmlns='http://www.w3.org/2000/svg' width='16' height='16' fill='currentColor' class='bi bi-play-fill' viewBox='0 0 16 16'>" +
        "<path d='m11.596 8.697-6.363 3.692c-.54.313-1.233-.066-1.233-.697V4.308c0-.63.692-1.01 1.233-.696l6.363 3.692a.802.802 0 0 1 0 1.393z'/>" +
        "</svg>";
      btnPause.current.appendChild(btnPauseSvg.current);
      PausedAudio();

      //Esta validación es en el caso donde la animación se encuentra pausada, pero no finalizada
    } else if (phaseAudio == "paused") {
      btnPauseSvg.current.innerHTML =
        "<svg xmlns='http://www.w3.org/2000/svg' width='16' height='16' fill='currentColor' class='bi bi-play-fill' viewBox='0 0 16 16'>" +
        "<path d='M5.5 3.5A1.5 1.5 0 0 1 7 5v6a1.5 1.5 0 0 1-3 0V5a1.5 1.5 0 0 1 1.5-1.5zm5 0A1.5 1.5 0 0 1 12 5v6a1.5 1.5 0 0 1-3 0V5a1.5 1.5 0 0 1 1.5-1.5z'/>" +
        "</svg>";
      btnPause.current.appendChild(btnPauseSvg.current);
      PlayingAudio();


      //Esta validación es en el caso donde la animación se encuentra pausada, y finalizada
    }

    else if (phaseAudio == "reset" && resetAction == true) {

      ResetBoolTrue();
      btnPauseSvg.current.innerHTML =
        "<svg xmlns='http://www.w3.org/2000/svg' width='16' height='16' fill='currentColor' class='bi bi-play-fill' viewBox='0 0 16 16'>" +
        "<path d='M5.5 3.5A1.5 1.5 0 0 1 7 5v6a1.5 1.5 0 0 1-3 0V5a1.5 1.5 0 0 1 1.5-1.5zm5 0A1.5 1.5 0 0 1 12 5v6a1.5 1.5 0 0 1-3 0V5a1.5 1.5 0 0 1 1.5-1.5z'/>" +
        "</svg>";
      btnPause.current.appendChild(btnPauseSvg.current);

      PlayingAudio();


      //   //El ultimo caso es en el caso donde la animación NO se encuentra pausada, y finalizada
    } else {
      PausedAudio();
      btnPauseSvg.current.innerHTML =
        "<svg xmlns='http://www.w3.org/2000/svg' width='16' height='16' fill='currentColor' class='bi bi-play-fill' viewBox='0 0 16 16'>" +
        "<path d='m11.596 8.697-6.363 3.692c-.54.313-1.233-.066-1.233-.697V4.308c0-.63.692-1.01 1.233-.696l6.363 3.692a.802.802 0 0 1 0 1.393z'/>" +
        "</svg>";
      btnPause.current.appendChild(btnPauseSvg.current);
    }

  };

  function CambioPause() {
    btnPause.current.removeChild(btnPauseSvg.current);

    btnPauseSvg.current.innerHTML =
      "<svg xmlns='http://www.w3.org/2000/svg' width='16' height='16' fill='currentColor' class='bi bi-play-fill' viewBox='0 0 16 16'>" +
      "<path d='M5.5 3.5A1.5 1.5 0 0 1 7 5v6a1.5 1.5 0 0 1-3 0V5a1.5 1.5 0 0 1 1.5-1.5zm5 0A1.5 1.5 0 0 1 12 5v6a1.5 1.5 0 0 1-3 0V5a1.5 1.5 0 0 1 1.5-1.5z'/>" +
      "</svg>";
    btnPause.current.appendChild(btnPauseSvg.current);
  }

  function prev(current, messages) {
    //Se obtiene el numero correspondiente a la ubicacion del paso actual en el arreglo de pasos totales, y se le suma 1, para obtener el nuevo paso actual
    var idx = messages.indexOf(current);
    refNumPaso.current.innerHTML = idx - 1;

    //Se realiza la operación matematica para obtener el porcentaje de avance del aplicativo, y este valor aplicarselo al circulo de progreso de color naranja
    var nuevovalor = (refNumPaso.current.innerHTML * 100) / pasostotal;
    porcentaje.style.setProperty("--porcent", nuevovalor);

    //Se el aplicativo llega al ultimo paso del arreglo de pasos totales, se le asigna el valor del primer paso del arreglo de pasos totales, para que el aplicativo vuelva a empezar, este valor es el 0.
    if (idx === 0) {
      refNumPaso.current.innerHTML = messages.length - 1;
      return messages[messages.length - 1];
    }

    //Se retorna el nuevo paso actual
    return messages[idx - 1];
  }

  //Funcion para cambiar el paso actual, se envia el paso actual y el total de pasos, esta funcion retornara el nuevo paso actual
  function next(current, messages) {
    //Se obtiene el numero correspondiente a la ubicacion del paso actual en el arreglo de pasos totales, y se le suma 1, para obtener el nuevo paso actual
    var idx = messages.indexOf(current);
    refNumPaso.current.innerHTML = idx + 1;

    //Se realiza la operación matematica para obtener el porcentaje de avance del aplicativo, y este valor aplicarselo al circulo de progreso de color naranja
    var nuevovalor = (refNumPaso.current.innerHTML * 100) / pasostotal;
    porcentaje.style.setProperty("--porcent", nuevovalor);

    //Se el aplicativo llega al ultimo paso del arreglo de pasos totales, se le asigna el valor del primer paso del arreglo de pasos totales, para que el aplicativo vuelva a empezar, este valor es el 0.
    if (idx === messages.length - 1) {
      refNumPaso.current.innerHTML = 0;
      return messages[0];
    }
    //Se retorna el nuevo paso actual
    return messages[idx + 1];
  }

  return (
    <>
      {/* <!-- El div contenedor, tiene dentro de el toda la sesión de botones de la parte de abajo, este mismo contenedor tambien se divide en dos partes, la de arriba, la cual continene los botones de navegación, buscar herrajes y play (pausa/reset). la sesión de abajo contiene la barra de indicación de la pieza o herraje seleccionado--> */}
      <div className="contenedor">
        {/* <!-- La sesión de arriba, la cual continene los botones de navegación, buscar herrajes y play (pausa/reset). --> */}
        <div className="SesionArriba">
          {/* <!-- Boton busqueda de herrajes, activa el panel donde se puede seleccionar los herrajes correspondientes a cada paso --> */}
          <PanelBtn />
          {/* <PanelHerrajes/> */}

          {/* <!-- Boton flecha izquierda, permite retroceder en los pasos. El icono svg esta subido a un repositorio, para mas comodidad se puede cambiar.--> */}
          <button ref={refLeft} id="left" onClick={leftButtton}>
            <img
              src="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZlcnNpb249IjEuMSIgeG1sbnM6eGxpbms9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkveGxpbmsiIHhtbG5zOnN2Z2pzPSJodHRwOi8vc3ZnanMuY29tL3N2Z2pzIiB3aWR0aD0iNTEyIiBoZWlnaHQ9IjUxMiIgeD0iMCIgeT0iMCIgdmlld0JveD0iMCAwIDMwNiAzMDYiIHN0eWxlPSJlbmFibGUtYmFja2dyb3VuZDpuZXcgMCAwIDUxMiA1MTIiIHhtbDpzcGFjZT0icHJlc2VydmUiIGNsYXNzPSIiPjxnPgo8ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgoJPGcgaWQ9ImNoZXZyb24tbGVmdCI+CgkJPHBvbHlnb24gcG9pbnRzPSIyNDcuMzUsMzUuNyAyMTEuNjUsMCA1OC42NSwxNTMgMjExLjY1LDMwNiAyNDcuMzUsMjcwLjMgMTMwLjA1LDE1MyAgICIgZmlsbD0iI2YyOGYxZCIgZGF0YS1vcmlnaW5hbD0iIzAwMDAwMCIgc3R5bGU9IiIgY2xhc3M9IiI+PC9wb2x5Z29uPgoJPC9nPgo8L2c+CjxnIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjwvZz4KPGcgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPC9nPgo8ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgo8L2c+CjxnIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjwvZz4KPGcgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPC9nPgo8ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgo8L2c+CjxnIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjwvZz4KPGcgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPC9nPgo8ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgo8L2c+CjxnIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjwvZz4KPGcgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPC9nPgo8ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgo8L2c+CjxnIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjwvZz4KPGcgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPC9nPgo8ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgo8L2c+CjwvZz48L3N2Zz4="
              width="60%"
            />
          </button>

          {/* <!-- Indicador para conocer en cual paso se encuentra el usuario--> */}
          <div className="slider">
            {/* <!-- contenedor del indicador circular --> */}
            <div className="card2">
              {/* <!-- El siguiente es el indicador de porcentaje de cuantos pasos faltan. Este posee dos circulos en su interior una mas grande y otro mas pequeño, esto es debido que uno de ellos se usa en computadores y el otro se utiliza en dispositivos moviles, no se modifican por medio de media queries, debido a complicaciones a la hora de tomar los valores de los circulos, los cuales no cambian --> */}
              <div className="percent">
                {/* <!-- borde indicativo en computadores --> */}
                <svg className="circule">
                  {/* <!-- borde gris al rededor del indicador --> */}
                  <circle id="borde" cx="32" cy="32" r="32"></circle>
                  {/* <!-- borde naranja, modificado por medio javascript a medida que se avanza o retrocede en los pasos --> */}
                  <circle id="borde2" cx="32" cy="32" r="32"></circle>
                </svg>

                {/* <!-- borde indicativo en dispositivos moviles --> */}
                <svg className="circule2">
                  {/* <!-- borde gris al rededor del indicador --> */}
                  <circle id="borde_787" cx="20" cy="20" r="20"></circle>
                  {/* <!-- borde naranja, modificado por medio javascript a medida que se avanza o retrocede en los pasos --> */}
                  <circle id="borde787" cx="20" cy="20" r="20"></circle>
                </svg>

                {/* <!-- Contenedor del numero indicativo de paso --> */}
                <div className="number">
                  {/* <!-- Texto que se modifica por medio de javascript, para mostrar el paso en que se encuentra el aplicativo --> */}
                  <h2 ref={refNumPaso} id="numpaso">
                    0<span></span>
                  </h2>
                </div>
              </div>

              {/* <!-- la siguiente etiqueta se usa para el funcinamiento del indicador, permite seleccionar texto proveniente del arreglo de pasos en el json y convertirlo a un numero entero, ejemplo de esto 07 ==> 7 --> */}
              <h6 ref={refNumber} id="text"></h6>
            </div>
          </div>

          {/* <!-- Boton flecha derecha, permite adelantar en los pasos. El icono svg esta subido a un repositorio, para mas comodidad se puede cambiar.--> */}
          <button ref={refRight} id="right" onClick={RightButtton}>
            <img
              src="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZlcnNpb249IjEuMSIgeG1sbnM6eGxpbms9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkveGxpbmsiIHhtbG5zOnN2Z2pzPSJodHRwOi8vc3ZnanMuY29tL3N2Z2pzIiB3aWR0aD0iNTEyIiBoZWlnaHQ9IjUxMiIgeD0iMCIgeT0iMCIgdmlld0JveD0iMCAwIDI1NiAyNTYiIHN0eWxlPSJlbmFibGUtYmFja2dyb3VuZDpuZXcgMCAwIDUxMiA1MTIiIHhtbDpzcGFjZT0icHJlc2VydmUiIGNsYXNzPSIiPjxnPgo8ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgoJPGc+CgkJPHBvbHlnb24gcG9pbnRzPSI3OS4wOTMsMCA0OC45MDcsMzAuMTg3IDE0Ni43MiwxMjggNDguOTA3LDIyNS44MTMgNzkuMDkzLDI1NiAyMDcuMDkzLDEyOCAgICIgZmlsbD0iI2YyOGYxZCIgZGF0YS1vcmlnaW5hbD0iIzAwMDAwMCIgc3R5bGU9IiIgY2xhc3M9IiI+PC9wb2x5Z29uPgoJPC9nPgo8L2c+CjxnIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjwvZz4KPGcgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPC9nPgo8ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgo8L2c+CjxnIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjwvZz4KPGcgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPC9nPgo8ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgo8L2c+CjxnIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjwvZz4KPGcgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPC9nPgo8ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgo8L2c+CjxnIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjwvZz4KPGcgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPC9nPgo8ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgo8L2c+CjxnIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjwvZz4KPGcgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPC9nPgo8ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgo8L2c+CjwvZz48L3N2Zz4="
              width="60%"
            />
          </button>

          {/* <!-- Boton de pause y play, funciona de la siguiente manera, permite pausar la animación y audio del paso a la vez, cuanto la animación termina, el boton cambia de funcionalidad a ser un boton de reiniciar.--> */}
          <div id="btnPause" ref={btnPause} className="button" onClick={PlayButton}>
            <svg ref={btnPauseSvg}
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              fill="currentColor"
              className="bi bi-play-fill"
              viewBox="0 0 16 16"
            >
              <path d="M5.5 3.5A1.5 1.5 0 0 1 7 5v6a1.5 1.5 0 0 1-3 0V5a1.5 1.5 0 0 1 1.5-1.5zm5 0A1.5 1.5 0 0 1 12 5v6a1.5 1.5 0 0 1-3 0V5a1.5 1.5 0 0 1 1.5-1.5z" />
            </svg>
          </div>
        </div>

        {/* <!--La siguiente sesión contiene la segunda parte del contenedor. Este contiene dos elementos, uno de ellos es la barra que se encarga de retroalimentar cual de los herrajes o piezas han sido seleccionadas, y el otro es la etiqueta de audio, la cual permite insertar los diferentes audio explicativos y que puedan ser controlados --> */}
        <div className="SesionAbajo">
          <div className="FondoPieza">

            <Suspense>
              {toogle ? <AudioPlayer /> : null}
            </Suspense>
            {/* <!-- Etiqueta de texto donde se muestra los diferentes nombres de las piezas y herrajes --> */}
            <h1 ref={refText} id="TextOption"></h1>
          </div>
        </div>

        {/* TODOS LOS PANELES SE UBICAN EN ESTA SESION, PARA NO POSEER PROBLEMAS CON EL Z-INDEX */}

        {/* <!-- Panel principal de herrajes, este panel es de las principales funcionalidades, se llena por medio de javascript con aquellos herrajes, los cuales seran utilizados en su correspondiente paso de animación, ademas de contener una opcion por defecto, la cual activa el panel de los herrajes con cantidades totales, por medio de las opciones de este panel se puede seleccionar por ejemplos todos los tornillos que se encuentra en dicho paso.  --> */}
        {toogle ? <PanelHerrajes /> : null}
        <BotonCerrar />
        <PanelTips id={id} data={data} />
        <PanelCantidades />
        <PanelAyudas/>
        <PanelEncuesta/>
        <FormularioEncuesta/>


      </div>
    </>
  );
}
