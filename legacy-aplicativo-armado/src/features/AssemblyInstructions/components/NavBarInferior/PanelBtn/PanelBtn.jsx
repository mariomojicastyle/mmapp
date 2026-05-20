import { useRef, useEffect } from "react";
import useEnviroment from "../../../hooks/useEnviroment";
import { IconSearch } from "../../Icons.jsx";
import "./PanelBtn.css";

export default function PanelBtn() {

  const PositivePanel = useEnviroment((state) => state.PositivePanel);
  const PanelTrue = useEnviroment((state) => state.PanelTrue);
  const btnCerrarTrue = useEnviroment((state) => state.btnCerrarTrue);
  const AudioEnded = useEnviroment((state) => state.AudioEnded);
  const pasoActual = useEnviroment((state) => state.pasoActual);
  const pasos = useEnviroment((state) => state.pasos);

  // const EncuestaMitad = useEnviroment((state) => state.EncuestaMitad);
  // const EncuestaMitadTrue = useEnviroment((state) => state.EncuestaMitadTrue);

  // const EncuestaFinal = useEnviroment((state) => state.EncuestaFinal);
  // const EncuestaFinalTrue = useEnviroment((state) => state.EncuestaFinalTrue);
  // const EncuestaCompletada = useEnviroment((state) => state.EncuestaCompletada);

  const useTooltipHand = useRef(null)
  var contador = 0;
  //Cada vez que un audio explicativo de un paso finaliza, se activa la burbuja de "Herrajes necesarios"
  useEffect(() => {
    if (AudioEnded) {
      useTooltipHand.current.style.display = "flex";

      setTimeout(() => {
        useTooltipHand.current.style.opacity = 1;
        //Se realiza la condición correspondiente para aparecer la encuesta, en caso de que el paso actual sea la mitad de todos los pasos. 
        // if (pasoActual == Math.floor(pasos.length / 2) && EncuestaMitad == false && EncuestaCompletada==false) {
        //   useTooltipHand.current.style.opacity = 0;
        //   EncuestaMitadTrue();

        // } else if (pasoActual == (pasos.length-1) && EncuestaFinal == false && EncuestaCompletada==false) {
        //   useTooltipHand.current.style.opacity = 0;
        //   EncuestaFinalTrue();
        // }
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
        <IconSearch style={{ width: "16px", height: "16px" }} />
        {/* <!-- La siguiente imagen es la burbuja de ayuda con el texto "Herrajes Necesarios", su display esta desactivado por defecto, y se activa cada vez que el audio correspondiente al paso termina --> */}
        <img ref={useTooltipHand}
          src={"/assets/ayudas/04_Busqueda_Posterior.svg"}
          alt=""
        />
      </button>
    </>
  );
}
