import React, { useEffect } from "react";
import "./PanelTips.css";
import useEnviroment from "../../hooks/useEnviroment.js";

export default function PanelTips({ id, data }) {
  
  const panelTips = useEnviroment((state) => {return state.panelTips;});
  const PanelFalse = useEnviroment((state) => {return state.PanelFalse;});
  const icono = useEnviroment((state) => state.icono);

  //Se activan los tips correspondientes al mueble
  useEffect(() => {
    const tips = document.getElementsByClassName("option2");
    var logo2 = document.querySelector("#logo");

    //Arreglo donde se recorre los diferentes tips y dependiendo si es false o true, se activa o desactiva el tip
    Array.from(tips).forEach((tip) => {
      for (const property in data.tips) {
        if (tip.textContent == property) {
          if (data.tips[property] == true) {
            tip.style.display = "flex";
          } else {
            tip.style.display = "none";
          }
        } else if (property == "Logo") {
          if (data.tips[property] == true) {
            logo2.style.display = "flex";
          } else {
            logo2.style.display = "none";
          }
        }
      }
    });
  }, [id]);

  //Arreglo con los diferentes tips disponibles.
  const Tips = {
    DosHerramientasNecesarias:'/Recursos/Tips/Martillo_Destornillador.svg',
    TresHerramientasNecesarias: '/Recursos/Tips/Martillo_Destornillador_Allen.svg',
    SistemaDeAnclaje: '/Recursos/Tips/Sistema_Anclaje.svg',
    PulsadorParaAbrir: '/Recursos/Tips/Pulsador_Para_Abrir.svg',
    EnsambleMinifix: '/Recursos/Tips/Ensamble_Minifix.svg',
    EnsambleTuercaPlástica:'/Recursos/Tips/Ensamble_Tuerca_Plastica.svg',
    AjusteDeBisagras: '/Recursos/Tips/Ajuste_Bisagras.svg',
    OcultaTornillos: '/Recursos/Tips/Oculta_Tornillos.svg',
    GarantiaDelProducto: "#",
  };

  return (
    <>
      <aside
        className={`panel2 menu2 is-${panelTips ? "active" : ""}`}
        onClick={PanelFalse}
      >
        <div className="option2 1" id="logo">
          <div className="imagen" style={{ backgroundImage: `${icono}` }}></div>
        </div>
        <div className="option2 2">
          2 Herramientas Necesarias
          <div
            className="imagen"
            style={{ backgroundImage: `url(${Tips.DosHerramientasNecesarias})` }}
          ></div>
        </div>

        <div className="option2 3">
          3 Herramientas Necesarias
          <div
            className="imagen"
            style={{ backgroundImage: `url(${Tips.TresHerramientasNecesarias})` }}
          ></div>
        </div>

        <div className="option2 4">
          Sistema de Anclaje
          <div
            className="imagen"
            style={{ backgroundImage: `url(${Tips.SistemaDeAnclaje})` }}
          ></div>
        </div>

        <div className="option2 5">
          Pulsador para Abrir
          <div
            className="imagen"
            style={{ backgroundImage: `url(${Tips.PulsadorParaAbrir})` }}
          ></div>
        </div>

        <div className="option2 6">
          Ensamble Minifix
          <div
            className="imagen"
            style={{ backgroundImage: `url(${Tips.EnsambleMinifix})` }}
          ></div>
        </div>

        <div className="option2 7">
          Ensamble Tuerca Plástica
          <div
            className="imagen"
            style={{ backgroundImage: `url(${Tips.EnsambleTuercaPlástica})` }}
          ></div>
        </div>

        <div className="option2 8">
          Ajuste de Bisagras
          <div
            className="imagen"
            style={{ backgroundImage: `url(${Tips.AjusteDeBisagras})` }}
          ></div>
        </div>

        <div className="option2 9">
          Oculta Tornillos
          <div
            className="imagen"
            style={{ backgroundImage: `url(${Tips.OcultaTornillos})` }}
          ></div>
        </div>

        <div className="option2 10">
          <a
            href="#"
            target={"_blank"}
          >
            Garantia del Producto
          </a>
        </div>
      </aside>
    </>
  );
}
