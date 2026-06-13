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
import { useProgress } from "@react-three/drei";


function LoaderProgress() {
  const { progress } = useProgress();
  const [targetProgress, setTargetProgress] = useState(0);
  const [displayProgress, setDisplayProgress] = useState(0);

  // Sincronizar targetProgress de forma estrictamente ascendente (monotónica)
  useEffect(() => {
    const rawProgress = Math.round(progress);

    // Si el progreso de Three.js baja a menos de 5, asumimos que es una nueva carga de modelo
    if (rawProgress < 5) {
      setTargetProgress(rawProgress);
      setDisplayProgress(rawProgress);
    } else if (rawProgress > targetProgress) {
      setTargetProgress(rawProgress);
    }
  }, [progress]);

  // Efecto para animar displayProgress suavemente hacia targetProgress
  useEffect(() => {
    let animationFrameId;
    let startTimestamp = null;
    const duration = 500; // Animación de llenado suave de 500ms
    
    const startValue = displayProgress;
    const endValue = targetProgress;

    if (startValue === endValue) return;

    const step = (timestamp) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const t = Math.min((timestamp - startTimestamp) / duration, 1);
      const ease = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
      const currentVal = Math.round(startValue + (endValue - startValue) * ease);
      
      setDisplayProgress(currentVal);
      
      if (t < 1) {
        animationFrameId = window.requestAnimationFrame(step);
      }
    };
    
    animationFrameId = window.requestAnimationFrame(step);
    
    return () => {
      window.cancelAnimationFrame(animationFrameId);
    };
  }, [targetProgress]);

  // Si no está cargando (progreso es 100%) no mostramos nada
  if (progress >= 100 && displayProgress >= 100) return null;

  const fillerStyles = {
    height: '100%',
    width: `${displayProgress}%`,
    backgroundColor: "var(--primary, #00f2fe)",
    transition: 'width 0.1s linear',
    borderRadius: 'inherit',
    boxShadow: '0 0 10px var(--primary-glow)',
    flexShrink: 0
  };

  const textContainerStyles = {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    pointerEvents: 'none'
  };

  const labelStyles = {
    color: '#ffff00', // Amarillo
    fontWeight: 'bold',
    fontSize: '0.85rem',
    fontFamily: 'var(--font-sans)',
    textShadow: '0 1px 2px rgba(0,0,0,0.8)'
  };

  return (
    <div className="progress-model-loader-container">
      <div className="progress-model-loader" style={{ position: 'relative' }}>
        <div style={fillerStyles} className="progressBar"></div>
        <div style={textContainerStyles}>
          <span style={labelStyles}>{`${displayProgress}%`}</span>
        </div>
      </div>
    </div>
  );
}

export default function NavBarInferior({ id, data }) {
  const refLeft = useRef(null);
  const refRight = useRef(null);

  const pasos = useEnviroment((state) => state.pasos);
  const PasoActual = useEnviroment((state) => state.pasoActual);
  const phaseAudio = useEnviroment((state) => state.phaseAudio);
  const toogle = useEnviroment((state) => state.show);
  const idioma = useEnviroment((state) => state.idioma);

  const texts = {
    es: {
      leftTitle: "Retroceder un paso",
      rightTitle: "Ir al siguiente paso",
      pauseTitle: "Pausar, Activar o Reiniciar",
      ayuda3Title: "Navegación de Armado",
      ayuda3Text: "Avanza o retrocede entre los pasos del manual interactivo para ver el proceso en orden.",
      ayuda4Title: "Buscador de Piezas",
      ayuda4Text: "Consulta la lista detallada de piezas y herrajes requeridos para el paso de ensamble actual.",
      ayuda5Title: "Reproducir / Pausar",
      ayuda5Text: "Controla la locución por voz y la reproducción del audio explicativo paso a paso."
    },
    en: {
      leftTitle: "Go back one step",
      rightTitle: "Go to the next step",
      pauseTitle: "Play, Pause or Restart",
      ayuda3Title: "Assembly Navigation",
      ayuda3Text: "Go forward or backward through the interactive steps to view the process in order.",
      ayuda4Title: "Parts Search",
      ayuda4Text: "Check the detailed list of parts and hardware required for the current assembly step.",
      ayuda5Title: "Play / Pause",
      ayuda5Text: "Control the voiceover and playback of the step-by-step explanatory audio."
    }
  };
  const t = idioma === "en" ? texts.en : texts.es;

  const CambiarModelo = useEnviroment((state) => state.CambiarModelo);
  const PositiveShow = useEnviroment((state) => state.PositiveShow);
  const NegativeShow = useEnviroment((state) => state.NegativeShow);


  const PlayingAudio = useEnviroment((state) => state.PlayingAudio);
  const PausedAudio = useEnviroment((state) => state.PausedAudio);

  const ResetBoolTrue = useEnviroment((state) => state.ResetBoolTrue);

  const resetAction = useEnviroment((state) => state.resetAction);
  const Parpadeo = useEnviroment((state) => state.Parpadeo);

  const isPanelAyudasActive = useEnviroment((state) => state.PanelAyudas);
  const ayuda3 = useEnviroment((state) => state.ayuda3);
  const ayuda3ArrowLeft = useEnviroment((state) => state.ayuda3ArrowLeft);
  const ayuda3ArrowCenter = useEnviroment((state) => state.ayuda3ArrowCenter);
  const ayuda3ArrowRight = useEnviroment((state) => state.ayuda3ArrowRight);
  const ayuda4 = useEnviroment((state) => state.ayuda4);
  const ayuda5 = useEnviroment((state) => state.ayuda5);

  const DesactivarParpadeo = useEnviroment((state) => state.DesactivarParpadeo);

  const [rippleActive, setRippleActive] = useState(false);

  var pasostotal = pasos.length;

  // Lógica para activar el efecto de ondas implosivas convergentes al finalizar el tutorial de ayudas
  useEffect(() => {
    if (Parpadeo) {
      setRippleActive(true);
      const rippleTimer = setTimeout(() => {
        setRippleActive(false);
        DesactivarParpadeo(); // Desactivar después de que el efecto termine
      }, 3500); // 3.5 segundos cubre el viaje de 3s (10 ondas con delays hasta 1.8s + 1.2s de viaje) más el desvanecimiento final
      return () => {
        clearTimeout(rippleTimer);
      };
    }
  }, [Parpadeo, DesactivarParpadeo]);

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
    
    DesactivarParpadeo(); // Apagar parpadeo y ondas al cambiar de paso manualmente
    PausedAudio(); // Forzamos estado a pausa para reiniciar el ciclo de audio
    CambiarModelo(newPaso);
    NegativeShow();

    setTimeout(() => {
      PositiveShow();
      PlayingAudio(); // Reproducimos despues del delay (asegura el trigger en el useEffect)
    }, 200);
  };

  //Función de avanzar un paso
  const RightButtton = () => {
    if (pasos.length === 0) return;
    var idx = pasos.indexOf(PasoActual);
    var newPaso = idx === pasos.length - 1 ? pasos[0] : pasos[idx + 1];

    DesactivarParpadeo(); // Apagar parpadeo y ondas al cambiar de paso manualmente
    PausedAudio(); // Forzamos estado a pausa para reiniciar el ciclo de audio
    CambiarModelo(newPaso);
    NegativeShow();

    setTimeout(() => {
      PositiveShow();
      PlayingAudio(); // Reproducimos despues del delay (asegura el trigger en el useEffect)
    }, 200);
  };

  //Funcion parpadeo de flecha (Animación Premium Obsidian Teal al finalizar el tutorial)
  useEffect(() => {
    if (Parpadeo && refRight.current) {
      const el = refRight.current;
      el.classList.add("is-blinking");
      
      const timer = setTimeout(() => {
        el.classList.remove("is-blinking");
      }, 6000); // Titila durante 6 segundos y luego vuelve a su estado normal
      
      return () => {
        clearTimeout(timer);
        el.classList.remove("is-blinking");
      };
    }
  }, [Parpadeo]);

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
          <LoaderProgress />
          <PanelBtn />

          <button ref={refLeft} id="left" title={t.leftTitle} onClick={leftButtton}>
            <IconLeft style={{ width: "60%" }} />
          </button>

          {/* <!-- Indicador para conocer en cual paso se encuentra el usuario--> */}
          <div className="slider">
            {/* <!-- contenedor del indicador circular --> */}
            <div className="card2">
              {/* <!-- borde indicativo en computadores --> */}
              <svg className="circule" viewBox="0 0 72 72">
                <circle id="borde" cx="36" cy="36" r="32"></circle>
                <circle id="borde2" cx="36" cy="36" r="32"></circle>
              </svg>

              {/* <!-- borde indicativo en dispositivos moviles --> */}
              <svg className="circule2" viewBox="0 0 46 46">
                <circle id="borde_787" cx="23" cy="23" r="20"></circle>
                <circle id="borde787" cx="23" cy="23" r="20"></circle>
              </svg>

              <div className="percent">
                {/* <!-- Contenedor del numero indicativo de paso --> */}
                <div className="number">
                  <h2 id="numpaso">
                    {parseInt(PasoActual, 10)}<span></span>
                  </h2>
                </div>
              </div>
            </div>
          </div>

          <button 
            ref={refRight} 
            id="right" 
            title={t.rightTitle}
            onClick={RightButtton}
            className={rippleActive ? "ripple-impact-active" : ""}
          >
            <IconRight style={{ width: "60%" }} />
            {rippleActive && (
              <>
                <span className="ripple-wave wave-1"></span>
                <span className="ripple-wave wave-2"></span>
                <span className="ripple-wave wave-3"></span>
                <span className="ripple-wave wave-4"></span>
                <span className="ripple-wave wave-5"></span>
                <span className="ripple-wave wave-6"></span>
                <span className="ripple-wave wave-7"></span>
                <span className="ripple-wave wave-8"></span>
                <span className="ripple-wave wave-9"></span>
                <span className="ripple-wave wave-10"></span>
              </>
            )}
          </button>

          <div id="btnPause" title={t.pauseTitle} className="button" onClick={PlayButton}>
            {renderPausePlayIcon()}
          </div>

          {/* Burbuja de ayuda 3: Navegación de Armado */}
          <div className={`ayuda-bubble ayuda3 ${isPanelAyudasActive && ayuda3 ? "is-active" : ""}`}>
            <div className={`ayuda3-arrow arrow-left ${ayuda3ArrowLeft ? 'is-active' : ''}`}></div>
            <div className={`ayuda3-arrow arrow-center ${ayuda3ArrowCenter ? 'is-active' : ''}`}></div>
            <div className={`ayuda3-arrow arrow-right ${ayuda3ArrowRight ? 'is-active' : ''}`}></div>
            <div className="ayuda-bubble-title">{t.ayuda3Title}</div>
            <div className="ayuda-bubble-text">
              {t.ayuda3Text}
            </div>
          </div>

          {/* Burbuja de ayuda 4: Buscador de Piezas */}
          <div className={`ayuda-bubble ayuda4 ${isPanelAyudasActive && ayuda4 ? "is-active" : ""}`}>
            <div className="ayuda-bubble-arrow arrow-down"></div>
            <div className="ayuda-bubble-title">{t.ayuda4Title}</div>
            <div className="ayuda-bubble-text">
              {t.ayuda4Text}
            </div>
          </div>

          {/* Burbuja de ayuda 5: Reproducir / Pausar */}
          <div className={`ayuda-bubble ayuda5 ${isPanelAyudasActive && ayuda5 ? "is-active" : ""}`}>
            <div className="ayuda-bubble-arrow arrow-down"></div>
            <div className="ayuda-bubble-title">{t.ayuda5Title}</div>
            <div className="ayuda-bubble-text">
              {t.ayuda5Text}
            </div>
          </div>
        </div>

        {/* El AudioPlayer invisible se mantiene funcional renderizado aquí de forma segura */}
        <Suspense>
          {toogle ? <AudioPlayer /> : null}
        </Suspense>

        {/* TODOS LOS PANELES SE UBICAN EN ESTA SESION, PARA NO POSEER PROBLEMAS CON EL Z-INDEX */}

        {/* <!-- Panel principal de herrajes, este panel es de las principales funcionalidades, se llena por medio de javascript con aquellos herrajes, los cuales seran utilizados en su correspondiente paso de animación, ademas de contener una opcion por defecto, la cual activa el panel de los herrajes con cantidades totales, por medio de las opciones de este panel se puede seleccionar por ejemplos todos los tornillos que se encuentra en dicho paso.  --> */}
        {toogle ? <PanelHerrajes id={id} data={data} /> : null}
        <BotonCerrar />
        <PanelTips id={id} data={data} />
        <PanelCantidades id={id} data={data} />
        <PanelAyudas/>


      </div>
    </>
  );
}
