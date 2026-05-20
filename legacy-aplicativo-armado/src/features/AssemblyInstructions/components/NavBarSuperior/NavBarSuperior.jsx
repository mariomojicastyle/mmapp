import "./NavBarSuperior.css";
import React from "react";
import { useRef, useState } from "react";
import useEnviroment from "../../hooks/useEnviroment.js";
import { useEffect } from "react";
import RealiadaAumentada from "./RealidadAumentada/RealidadAumentada.jsx";
import { IconHelp, IconInfo } from "../Icons.jsx";
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
            <IconHelp />
          </div>

          {/* <!-- Boton de información --> */}

          <div id="info" className="button" onClick={showPanelTips}>
            <IconInfo />
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
