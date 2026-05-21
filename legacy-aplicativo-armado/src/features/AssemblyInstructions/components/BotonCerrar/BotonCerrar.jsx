import React from "react";
import "./BotonCerrar.css";
import { useState, useRef, useEffect } from "react";
import useEnviroment from "../../hooks/useEnviroment.js";


export default function Cerrar(props) {    

  const btnCerrar = useEnviroment((state)=>{return state.btnCerrar})
  const PanelShow = useEnviroment((state)=>{return state.PanelShow})
  const PanelTipsFalse = useEnviroment((state)=>{return state.PanelTipsFalse})
  const btnCerrarFalse = useEnviroment((state)=>{return state.btnCerrarFalse})
  const NegativePanel = useEnviroment((state)=>{return state.NegativePanel})
  const PanelCantidadesFalse = useEnviroment((state)=>{return state.PanelCantidadesFalse})
  const PanelAyudasFalse = useEnviroment((state) => state.PanelAyudasFalse);
  const PanelAyudas = useEnviroment((state) => state.PanelAyudas);
  const AyudasActivadas = useEnviroment((state) => state.AyudasActivadas);
  const PanelCantidadesState = useEnviroment((state) => state.PanelCantidades);


  //Si es clickeado el boton, cierra todo panel que este activo.
  const cerrarPaneles = () =>{
    PanelTipsFalse();
    btnCerrarFalse();
    NegativePanel();
    PanelCantidadesFalse(); 
    if(PanelAyudas==true){
      AyudasActivadas();
      PanelAyudasFalse(); 
    }
  }

  return (
    <>
      <div className={`cerrar button ${btnCerrar ? 'active':''} ${(PanelShow || PanelCantidadesState || PanelAyudas) ? 'panel-herrajes-open' : ''}`} onClick={cerrarPaneles}>
        <span className="material-symbols-outlined">close</span> 
      </div>
    </>
  );
}
