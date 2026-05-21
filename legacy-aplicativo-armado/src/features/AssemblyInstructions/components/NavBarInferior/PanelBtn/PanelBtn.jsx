import { useState, useEffect } from "react";
import useEnviroment from "../../../hooks/useEnviroment";
import { IconSearch } from "../../Icons.jsx";
import "./PanelBtn.css";

export default function PanelBtn() {

  const PositivePanel = useEnviroment((state) => state.PositivePanel);
  const btnCerrarTrue = useEnviroment((state) => state.btnCerrarTrue);
  const AudioEnded = useEnviroment((state) => state.AudioEnded);
  const pasoActual = useEnviroment((state) => state.pasoActual);

  const [showTooltip, setShowTooltip] = useState(false);

  // Al cambiar de paso, apagamos el tooltip inmediatamente para evitar cualquier residuo visual
  useEffect(() => {
    setShowTooltip(false);
  }, [pasoActual]);

  // Cada vez que finaliza la locución de un paso (cambio de AudioEnded de false a true), activamos el tooltip
  useEffect(() => {
    const pasoInt = parseInt(pasoActual, 10);
    if (AudioEnded && pasoInt > 0) {
      setShowTooltip(true);

      const hideTimeout = setTimeout(() => {
        setShowTooltip(false);
      }, 3000); // Se muestra por 3 segundos

      return () => {
        clearTimeout(hideTimeout);
      };
    } else {
      setShowTooltip(false);
    }
  }, [AudioEnded]);

  // Al dar click se activa el panel de herrajes
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
        <IconSearch />
        
        {/* Burbuja de ayuda premium nativa Glassmorphic Obsidian Teal */}
        <div className={`ayuda-herrajes-tooltip ${showTooltip ? "is-active" : ""}`}>
          <div className="ayuda-herrajes-arrow"></div>
          <span className="ayuda-herrajes-text">Herrajes Necesarios</span>
        </div>
      </button>
    </>
  );
}
