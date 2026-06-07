/* eslint-disable */
import "./NavBarSuperior.css";
import React from "react";
import { useRef, useState } from "react";
import useEnviroment from "../../hooks/useEnviroment.js";
import { useEffect } from "react";
import RealiadaAumentada from "./RealidadAumentada/RealidadAumentada.jsx";
import { IconHelp, IconInfo, IconShadows } from "../Icons.jsx";
// import from "@google/model-viewer"; 

export default function NavBarSuperior({ id, data }) {
  const color1 = useEnviroment((state) => state.color1);
  const color2 = useEnviroment((state) => state.color2);

  const PanelTipsTrue = useEnviroment((state) => state.PanelTipsTrue);
  const btnCerrarTrue = useEnviroment((state) => state.btnCerrarTrue);

  const PanelAyudasTrue = useEnviroment((state) => state.PanelAyudasTrue);
  const PanelAyudas = useEnviroment((state) => state.PanelAyudas);
  const ayuda1 = useEnviroment((state) => state.ayuda1);
  const sombras = useEnviroment((state) => state.sombras);
  const toggleSombras = useEnviroment((state) => state.toggleSombras);
  const idioma = useEnviroment((state) => state.idioma);
  const cambiarIdioma = useEnviroment((state) => state.cambiarIdioma);
  const playbackRate = useEnviroment((state) => state.playbackRate);
  const setPlaybackRate = useEnviroment((state) => state.setPlaybackRate);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);


  const idiomaOptions = [
    { value: "es", label: "ES", sublabel: "Lat" },
    { value: "es-ES", label: "ES", sublabel: "EU" },
    { value: "en", label: "EN", sublabel: "" },
  ];

  const refOp1 = useRef(null);
  const refOp2 = useRef(null);


  //Efecto generado cuando se selecciona el primer boton de cambio de color 
  const changeOpcion1 = () => {
    refOp2.current.classList.remove("seleccionado");
    refOp1.current.classList.add("seleccionado");
    color1();
  };

  //Efecto generado cuando se selecciona el segundo boton de cambio de color 
  const changeOpcion2 = () => {
    refOp1.current.classList.remove("seleccionado");
    refOp2.current.classList.add("seleccionado");
    color2();
  };

  //Boton de activar panel de tips
  const showPanelTips = () => {
    PanelTipsTrue();
    btnCerrarTrue();
  }
  //Boton de activar paneles de ayudas
  const showPanelAyudas = () => {
    PanelAyudasTrue();
    btnCerrarTrue();
  }

  // Cerrar el popover al hacer clic fuera del botón
  useEffect(() => {
    if (!showSpeedMenu) return;
    const handleOutsideClick = () => {
      setShowSpeedMenu(false);
    };
    document.addEventListener("click", handleOutsideClick);
    return () => {
      document.removeEventListener("click", handleOutsideClick);
    };
  }, [showSpeedMenu]);
  

  return (
    <>
      <div className="contenedor1">
        <div className="contenedor1-1">
          {/* Selector de Idioma (ES-Lat / ES-EU / EN) */}
          <div className="lang-selector-group" title="Seleccionar idioma">
            {idiomaOptions.map((opt) => (
              <button
                key={opt.value}
                className={`lang-btn${idioma === opt.value ? " lang-btn--active" : ""}`}
                onClick={() => cambiarIdioma(opt.value)}
                aria-label={`Cambiar idioma a ${opt.label} ${opt.sublabel}`}
                type="button"
              >
                <span className="lang-btn-label">{opt.label}</span>
                {opt.sublabel && <span className="lang-btn-sub">{opt.sublabel}</span>}
              </button>
            ))}
          </div>

          {/* <!-- Boton de ayuda --> */}
          <div className="button" id="help" title="Tutorial de Interfaz" onClick={showPanelAyudas}>
            <IconHelp />
          </div>

          {/* <!-- Boton de información --> */}
          <div id="info" title="Informacion General" className="button" onClick={showPanelTips}>
            <IconInfo />
            
            {/* Burbuja de ayuda 1: Guía y Herramientas */}
            <div className={`ayuda-bubble ayuda1 ${PanelAyudas && ayuda1 ? "is-active" : ""}`} onClick={(e) => e.stopPropagation()}>
              <div className="ayuda-bubble-arrow arrow-up"></div>
              <div className="ayuda-bubble-title">Guía y Herramientas</div>
              <ul className="ayuda-bubble-list">
                <li className="ayuda-bubble-item">Marca del producto</li>
                <li className="ayuda-bubble-item">Herramientas requeridas</li>
                <li className="ayuda-bubble-item">Indicaciones especiales</li>
                <li className="ayuda-bubble-item">Garantía del mueble</li>
              </ul>
            </div>
          </div>

          {/* <!-- Boton de Sombras --> */}
          <div 
            className="button"
            id="shadows" 
            onClick={toggleSombras} 
            title={sombras ? "Calidad Visual: Alta (Sombras)" : "Calidad Visual: Rendimiento"}
          >
            <IconShadows sombras={sombras} />
          </div>

          {/* <!-- Opciones de cambio de color de vizualización del mueble--> */}
          <form>
            <div className="Escenarios">
              {/* <!-- Opcion cambio de visualización Azúl --> */}
              {/* <div
                type="checkbox"
                id="color1"
                className="button seleccionado"
                ref={refOp1}
                onClick={changeOpcion1}
                name="group1[]"
              ></div> */}

              {/* <!-- Opcion cambio de visualización Amarillo --> */}
              {/* <div
                type="checkbox"
                id="color2"
                className="button"
                ref={refOp2}
                onClick={changeOpcion2}
                name="group1[]"
              ></div> */}
            </div>
          </form>

          {/* Botón de control de velocidad (tipo popover flotante) */}
          <div className="speed-controller-container" style={{ position: "relative" }}>
            <button
              className="button"
              id="btnSpeed"
              title="Velocidad de reproducción de audio"
              onClick={(e) => {
                e.stopPropagation(); // Evitar que el clic en el botón cierre el menú inmediatamente
                setShowSpeedMenu(!showSpeedMenu);
              }}
              type="button"
            >
              <span className="speed-btn-text" style={{ fontSize: "0.85rem", fontWeight: "700", fontFamily: "var(--font-sans)" }}>
                {playbackRate}x
              </span>
            </button>

            {showSpeedMenu && (
              <div className="speed-menu" onClick={(e) => e.stopPropagation()}>
                {[0.5, 0.75, 1.0, 1.25, 1.5, 2.0].map((rate) => (
                  <button
                    key={rate}
                    className={`speed-menu-item ${playbackRate === rate ? "speed-menu-item--active" : ""}`}
                    onClick={() => {
                      setPlaybackRate(rate);
                      setShowSpeedMenu(false);
                    }}
                    type="button"
                  >
                    {rate === 1.0 ? "1.0x (Normal)" : `${rate}x`}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* <!-- Link de la libreria, que permite el uso del icono en SVG perteneciente al boton de realidad aumentada  --> */}
          <link
            rel="stylesheet"
            href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200"
          />
          <RealiadaAumentada id={id}/>
        </div>
      </div>
    </>
  );
}
