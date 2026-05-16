import "./NavBarSuperior.css";
import React from "react";
import { useRef, useState } from "react";
import useEnviroment from "../../hooks/useEnviroment.js";
import { useEffect } from "react";
import RealiadaAumentada from "./RealidadAumentada/RealidadAumentada.jsx";
// import from "@google/model-viewer"; 

export default function NavBarSuperior({ id, data }) {
  const color1 = useEnviroment((state) => state.color1);
  const color2 = useEnviroment((state) => state.color2);

  const PanelTipsTrue = useEnviroment((state) => state.PanelTipsTrue);
  const btnCerrarTrue = useEnviroment((state) => state.btnCerrarTrue);

  const PanelAyudasTrue = useEnviroment((state) => state.PanelAyudasTrue);


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
  

  return (
    <>
      <div className="contenedor1">
        <div className="contenedor1-1">
          {/* <!-- Boton de ayuda --> */}
          <div className="button" id="help" onClick={showPanelAyudas}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              fill="currentColor"
              className="bi bi-question-circle"
              viewBox="0 0 16 16"
            >
              <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z" />
              <path d="M5.255 5.786a.237.237 0 0 0 .241.247h.825c.138 0 .248-.113.266-.25.09-.656.54-1.134 1.342-1.134.686 0 1.314.343 1.314 1.168 0 .635-.374.927-.965 1.371-.673.489-1.206 1.06-1.168 1.987l.003.217a.25.25 0 0 0 .25.246h.811a.25.25 0 0 0 .25-.25v-.105c0-.718.273-.927 1.01-1.486.609-.463 1.244-.977 1.244-2.056 0-1.511-1.276-2.241-2.673-2.241-1.267 0-2.655.59-2.75 2.286zm1.557 5.763c0 .533.425.927 1.01.927.609 0 1.028-.394 1.028-.927 0-.552-.42-.94-1.029-.94-.584 0-1.009.388-1.009.94z" />
            </svg>
          </div>

          {/* <!-- Boton de información --> */}

          <div id="info" className="button" onClick={showPanelTips}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              fill="currentColor"
              className="bi bi-info-circle"
              viewBox="0 0 16 16"
            >
              <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z" />
              <path d="m8.93 6.588-2.29.287-.082.38.45.083c.294.07.352.176.288.469l-.738 3.468c-.194.897.105 1.319.808 1.319.545 0 1.178-.252 1.465-.598l.088-.416c-.2.176-.492.246-.686.246-.275 0-.375-.193-.304-.533L8.93 6.588zM9 4.5a1 1 0 1 1-2 0 1 1 0 0 1 2 0z" />
            </svg>
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
