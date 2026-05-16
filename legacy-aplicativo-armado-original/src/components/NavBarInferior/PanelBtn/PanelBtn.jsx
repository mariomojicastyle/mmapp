import { useRef, useEffect } from "react";
import useEnviroment from "../../../hooks/useEnviroment";
import "./PanelBtn.css";

export default function PanelBtn() {

  const PositivePanel = useEnviroment((state) => state.PositivePanel);
  const PanelTrue = useEnviroment((state) => state.PanelTrue);
  const btnCerrarTrue = useEnviroment((state) => state.btnCerrarTrue);
  const AudioEnded = useEnviroment((state) => state.AudioEnded);
  const pasoActual = useEnviroment((state) => state.pasoActual);
  const pasos = useEnviroment((state) => state.pasos);

  const EncuestaMitad = useEnviroment((state) => state.EncuestaMitad);
  const EncuestaMitadTrue = useEnviroment((state) => state.EncuestaMitadTrue);

  const EncuestaFinal = useEnviroment((state) => state.EncuestaFinal);
  const EncuestaFinalTrue = useEnviroment((state) => state.EncuestaFinalTrue);
  const EncuestaCompletada = useEnviroment((state) => state.EncuestaCompletada);

  const useTooltipHand = useRef(null)
  var contador = 0;
  //Cada vez que un audio explicativo de un paso finaliza, se activa la burbuja de "Herrajes necesarios"
  useEffect(() => {
    if (audio.ended) {
      useTooltipHand.current.style.display = "flex";

      setTimeout(() => {
        useTooltipHand.current.style.opacity = 1;
        //Se realiza la condición correspondiente para aparecer la encuesta, en caso de que el paso actual sea la mitad de todos los pasos. 
        if (pasoActual == Math.floor(pasos.length / 2) && EncuestaMitad == false && EncuestaCompletada==false) {
          useTooltipHand.current.style.opacity = 0;
          EncuestaMitadTrue();

        } else if (pasoActual == (pasos.length-1) && EncuestaFinal == false && EncuestaCompletada==false) {
          useTooltipHand.current.style.opacity = 0;
          EncuestaFinalTrue();
        }
      }, 1000);

      setTimeout(() => {
        useTooltipHand.current.style.opacity = 0; 
      }, 3000);

      setTimeout(() => {
        useTooltipHand.current.style.display = "none";
      }, 4000);
    }
  }, [AudioEnded]);

  //Al dar click se activa el panel de herrajes
  const ClickPanelBtn = () => {
    PositivePanel();
    btnCerrarTrue();
  };

  return (
    <>
      <button
        className="panel-btn button"
        type="button"
        onClick={ClickPanelBtn}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          fill="currentColor"
          className="bi bi-search"
          viewBox="0 0 16 16"
        >
          <path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001c.03.04.062.078.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1.007 1.007 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0z" />
        </svg>
        {/* <!-- La siguiente imagen es la burbuja de ayuda con el texto "Herrajes Necesarios", su display esta desactivado por defecto, y se activa cada vez que el audio correspondiente al paso termina --> */}
        <img ref={useTooltipHand}
          src={"https://3dymedios.com/Prueba/AP/Recursos/Ayudas/04_Busqueda_Posterior.svg"}
          alt=""
        />
      </button>
    </>
  );
}
