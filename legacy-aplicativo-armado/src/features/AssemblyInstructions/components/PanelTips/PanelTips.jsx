import React, { useEffect } from "react";
import "./PanelTips.css";
import useEnviroment from "../../hooks/useEnviroment.js";

export default function PanelTips({ id, data }) {
  
  const panelTips = useEnviroment((state) => {return state.panelTips;});
  const PanelTipsFalse = useEnviroment((state) => {return state.PanelTipsFalse;});
  const icono = useEnviroment((state) => state.icono);

  //Se activan los tips correspondientes al mueble
  useEffect(() => {
    if (!data || !data.tips) return;

    const tips = document.getElementsByClassName("option2");
    var logo2 = document.querySelector("#logo");

    //Arreglo donde se recorre los diferentes tips y dependiendo si es false o true, se activa o desactiva el tip
    Array.from(tips).forEach((tip) => {
      const tipText = tip.textContent || "";
      for (const property in data.tips) {
        if (tipText.includes(property)) {
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
  }, [id, data]);

  // Buscador inteligente de ensambles cargados dinámicamente
  const findEnsamble = (keyword) => {
    if (!data.isDynamicCMS || !data.ensamblesList) return null;
    const found = data.ensamblesList.find(name => 
      name.toLowerCase().includes(keyword.toLowerCase())
    );
    return found ? `/${id}/ensambles/${found}` : null;
  };

  //Arreglo con los diferentes tips disponibles.
  const Tips = {
    DosHerramientasNecesarias: data.isDynamicCMS && data.imagenHerramientas 
      ? `/${id}/${data.imagenHerramientas}` 
      : '/assets/tips/Martillo_Destornillador.svg',
    
    TresHerramientasNecesarias: '/assets/tips/Martillo_Destornillador_Allen.svg',
    
    SistemaDeAnclaje: findEnsamble("anclaje") || '/assets/tips/Sistema_Anclaje.svg',
    PulsadorParaAbrir: findEnsamble("pulsador") || '/assets/tips/Pulsador_Para_Abrir.svg',
    EnsambleMinifix: findEnsamble("minifix") || '/assets/tips/Ensamble_Minifix.svg',
    EnsambleTuercaPlástica: findEnsamble("tuerca") || '/assets/tips/Ensamble_Tuerca_Plastica.svg',
    AjusteDeBisagras: findEnsamble("bisagra") || '/assets/tips/Ajuste_Bisagras.svg',
    OcultaTornillos: findEnsamble("oculta") || '/assets/tips/Oculta_Tornillos.svg',
    
    GarantiaDelProducto: data.isDynamicCMS && data.garantiaDoc 
      ? `/${id}/${data.garantiaDoc}` 
      : "/assets/tips/Certificado_de_Garantia_v12.pdf",
  };

  if (!data || !data.tips) return null;

  return (
    <>
      <aside
        className={`panel2 menu2 is-${panelTips ? "active" : ""}`}
        onClick={PanelTipsFalse}
      >
        <div className="option2 1" id="logo" onClick={(e) => e.stopPropagation()}>
          <div className="imagen" style={{ backgroundImage: `${icono}` }}></div>
        </div>
        <div className="option2 2" onClick={(e) => e.stopPropagation()}>
          2 Herramientas Necesarias
          <div
            className="imagen"
            style={{ backgroundImage: `url(${Tips.DosHerramientasNecesarias})` }}
          ></div>
        </div>

        <div className="option2 3" onClick={(e) => e.stopPropagation()}>
          3 Herramientas Necesarias
          <div
            className="imagen"
            style={{ backgroundImage: `url(${Tips.TresHerramientasNecesarias})` }}
          ></div>
        </div>

        <div className="option2 4" onClick={(e) => e.stopPropagation()}>
          Sistema de Anclaje
          <div
            className="imagen"
            style={{ backgroundImage: `url(${Tips.SistemaDeAnclaje})` }}
          ></div>
        </div>

        <div className="option2 5" onClick={(e) => e.stopPropagation()}>
          Pulsador para Abrir
          <div
            className="imagen"
            style={{ backgroundImage: `url(${Tips.PulsadorParaAbrir})` }}
          ></div>
        </div>

        <div className="option2 6" onClick={(e) => e.stopPropagation()}>
          Ensamble Minifix
          <div
            className="imagen"
            style={{ backgroundImage: `url(${Tips.EnsambleMinifix})` }}
          ></div>
        </div>

        <div className="option2 7" onClick={(e) => e.stopPropagation()}>
          Ensamble Tuerca Plástica
          <div
            className="imagen"
            style={{ backgroundImage: `url(${Tips.EnsambleTuercaPlástica})` }}
          ></div>
        </div>

        <div className="option2 8" onClick={(e) => e.stopPropagation()}>
          Ajuste de Bisagras
          <div
            className="imagen"
            style={{ backgroundImage: `url(${Tips.AjusteDeBisagras})` }}
          ></div>
        </div>

        <div className="option2 9" onClick={(e) => e.stopPropagation()}>
          Oculta Tornillos
          <div
            className="imagen"
            style={{ backgroundImage: `url(${Tips.OcultaTornillos})` }}
          ></div>
        </div>

        <div className="option2 garantia-container" onClick={(e) => e.stopPropagation()}>
          <a
            href={Tips.GarantiaDelProducto}
            target={"_blank"}
            className="garantia-btn"
            rel="noopener noreferrer"
          >
            <span className="material-symbols-outlined garantia-icon">verified_user</span>
            <span className="garantia-text">Garantía del Producto</span>
          </a>
        </div>
      </aside>
    </>
  );
}
