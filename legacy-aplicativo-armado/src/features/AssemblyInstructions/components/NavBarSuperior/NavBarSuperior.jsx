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
  const ayudaLuz = useEnviroment((state) => state.ayudaLuz);
  const ayudaVelocidad = useEnviroment((state) => state.ayudaVelocidad);
  const ayudaIdioma = useEnviroment((state) => state.ayudaIdioma);
  const sombras = useEnviroment((state) => state.sombras);
  const toggleSombras = useEnviroment((state) => state.toggleSombras);
  const idioma = useEnviroment((state) => state.idioma);
  const cambiarIdioma = useEnviroment((state) => state.cambiarIdioma);
  const playbackRate = useEnviroment((state) => state.playbackRate);
  const setPlaybackRate = useEnviroment((state) => state.setPlaybackRate);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [showLangMenu, setShowLangMenu] = useState(false);

  const texts = {
    es: {
      tutorialTitle: "Tutorial de Interfaz",
      infoTitle: "Informacion General",
      shadowsHigh: "Calidad Visual: Alta (Sombras)",
      shadowsLow: "Calidad Visual: Rendimiento",
      speedTitle: "Velocidad de reproducción de audio",
      langTitle: "Cambiar idioma del manual",
      ayuda1Title: "Guía y Herramientas",
      ayuda1Items: [
        "Marca del producto",
        "Herramientas requeridas",
        "Indicaciones especiales",
        "Garantía del mueble"
      ],
      ayudaLuzTitle: "Iluminación 3D",
      ayudaLuzText: "Activa o desactiva las sombras detalladas para mejorar la calidad visual o aumentar el rendimiento.",
      ayudaVelocidadTitle: "Velocidad de Audio",
      ayudaVelocidadText: "Modifica el ritmo y velocidad del audio guía que te asiste en el armado.",
      ayudaIdiomaTitle: "Idioma del Manual",
      ayudaIdiomaText: "Cambia el idioma de los textos y audios informativos a Español o Inglés."
    },
    en: {
      tutorialTitle: "Interface Tutorial",
      infoTitle: "General Information",
      shadowsHigh: "Visual Quality: High (Shadows)",
      shadowsLow: "Visual Quality: Performance",
      speedTitle: "Audio playback speed",
      langTitle: "Change manual language",
      ayuda1Title: "Guide & Tools",
      ayuda1Items: [
        "Product brand",
        "Required tools",
        "Special instructions",
        "Furniture warranty"
      ],
      ayudaLuzTitle: "3D Lighting",
      ayudaLuzText: "Enable or disable detailed shadows to improve visual quality or boost performance.",
      ayudaVelocidadTitle: "Audio Speed",
      ayudaVelocidadText: "Modify the speed of the audio narration guiding you through the assembly.",
      ayudaIdiomaTitle: "Manual Language",
      ayudaIdiomaText: "Switch the language of texts and audio guides between Spanish and English."
    }
  };
  const t = idioma === "en" ? texts.en : texts.es;


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

  // Cerrar los popovers al hacer clic fuera del botón
  useEffect(() => {
    if (!showSpeedMenu && !showLangMenu) return;
    const handleOutsideClick = () => {
      setShowSpeedMenu(false);
      setShowLangMenu(false);
    };
    document.addEventListener("click", handleOutsideClick);
    return () => {
      document.removeEventListener("click", handleOutsideClick);
    };
  }, [showSpeedMenu, showLangMenu]);
  

  return (
    <>
      <div className="contenedor1">
        <div className="contenedor1-1">
          {/* Selector de Idioma (ES-Lat / ES-EU / EN) - Desactivado temporalmente para pruebas de audio latino */}
          {/* <div className="lang-selector-group" title="Seleccionar idioma">
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
          </div> */}

          {/* <!-- Boton de ayuda --> */}
          <div className="button" id="help" title={t.tutorialTitle} onClick={showPanelAyudas}>
            <IconHelp />
          </div>

          {/* <!-- Boton de información --> */}
          <div id="info" title={t.infoTitle} className="button" onClick={showPanelTips}>
            <IconInfo />
            
            {/* Burbuja de ayuda 1: Guía y Herramientas */}
            <div className={`ayuda-bubble ayuda1 ${PanelAyudas && ayuda1 ? "is-active" : ""}`} onClick={(e) => e.stopPropagation()}>
              <div className="ayuda-bubble-arrow arrow-up"></div>
              <div className="ayuda-bubble-title">{t.ayuda1Title}</div>
              <ul className="ayuda-bubble-list">
                {t.ayuda1Items.map((item, idx) => (
                  <li key={idx} className="ayuda-bubble-item">{item}</li>
                ))}
              </ul>
            </div>
          </div>

          {/* <!-- Boton de Sombras --> */}
          <div 
            className="button"
            id="shadows" 
            onClick={toggleSombras} 
            title={sombras ? t.shadowsHigh : t.shadowsLow}
          >
            <IconShadows sombras={sombras} />

            {/* Burbuja de ayuda Luz: Lámpara */}
            <div className={`ayuda-bubble ayudaLuz ${PanelAyudas && ayudaLuz ? "is-active" : ""}`} onClick={(e) => e.stopPropagation()}>
              <div className="ayuda-bubble-arrow arrow-up"></div>
              <div className="ayuda-bubble-title">{t.ayudaLuzTitle}</div>
              <div className="ayuda-bubble-text">{t.ayudaLuzText}</div>
            </div>
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
              title={t.speedTitle}
              onClick={(e) => {
                e.stopPropagation(); // Evitar que el clic en el botón cierre el menú inmediatamente
                setShowSpeedMenu(!showSpeedMenu);
                setShowLangMenu(false); // Cerrar el menú de idioma
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
                    {rate === 1.0 ? (idioma === "en" ? "1.0x (Normal)" : "1.0x (Normal)") : `${rate}x`}
                  </button>
                ))}
              </div>
            )}

            {/* Burbuja de ayuda Velocidad: Tiempo */}
            <div className={`ayuda-bubble ayudaVelocidad ${PanelAyudas && ayudaVelocidad ? "is-active" : ""}`} onClick={(e) => e.stopPropagation()}>
              <div className="ayuda-bubble-arrow arrow-up"></div>
              <div className="ayuda-bubble-title">{t.ayudaVelocidadTitle}</div>
              <div className="ayuda-bubble-text">{t.ayudaVelocidadText}</div>
            </div>
          </div>

          {/* Botón de control de idioma (tipo popover flotante) */}
          <div className="lang-controller-container" style={{ position: "relative" }}>
            <button
              className="button"
              id="btnLang"
              title={t.langTitle}
              onClick={(e) => {
                e.stopPropagation(); // Evitar que el clic cierre el menú
                setShowLangMenu(!showLangMenu);
                setShowSpeedMenu(false); // Cerrar el menú de velocidad
              }}
              type="button"
            >
              <span className="lang-btn-text" style={{ fontSize: "0.85rem", fontWeight: "700", fontFamily: "var(--font-sans)" }}>
                {idioma === "en" ? "EN" : idioma === "es-ES" ? "EU" : "ES"}
              </span>
            </button>

            {showLangMenu && (
              <div className="lang-menu" onClick={(e) => e.stopPropagation()}>
                {[
                  { value: "en", label: "English", sub: "US / UK" },
                  { value: "es", label: "Español", sub: "Latinoamérica" },
                  { value: "es-ES", label: "Español", sub: "España" },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    className={`lang-menu-item ${idioma === opt.value ? "lang-menu-item--active" : ""}`}
                    onClick={() => {
                      cambiarIdioma(opt.value);
                      setShowLangMenu(false);
                    }}
                    type="button"
                  >
                    <span className="lang-menu-label">{opt.label}</span>
                    <span className="lang-menu-sub">{opt.sub}</span>
                  </button>
                ))}
              </div>
            )}

            {/* Burbuja de ayuda Idioma: Idioma */}
            <div className={`ayuda-bubble ayudaIdioma ${PanelAyudas && ayudaIdioma ? "is-active" : ""}`} onClick={(e) => e.stopPropagation()}>
              <div className="ayuda-bubble-arrow arrow-up"></div>
              <div className="ayuda-bubble-title">{t.ayudaIdiomaTitle}</div>
              <div className="ayuda-bubble-text">{t.ayudaIdiomaText}</div>
            </div>
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
