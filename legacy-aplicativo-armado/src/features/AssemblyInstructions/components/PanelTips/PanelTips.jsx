import React, { useEffect } from "react";
import "./PanelTips.css";
import useEnviroment from "../../hooks/useEnviroment.js";
import { getAssetPath } from "../../../../lib/assets.js";

export default function PanelTips({ id, data }) {
  
  const panelTips = useEnviroment((state) => {return state.panelTips;});
  const PanelTipsFalse = useEnviroment((state) => {return state.PanelTipsFalse;});
  const icono = useEnviroment((state) => state.icono);
  const idioma = useEnviroment((state) => state.idioma);

  const texts = {
    es: {
      twoTools: "2 Herramientas Necesarias",
      threeTools: "3 Herramientas Necesarias",
      anchorageSystem: "Sistema de Anclaje",
      pusherToOpen: "Pulsador para Abrir",
      minifixAssembly: "Ensamble Minifix",
      plasticNutAssembly: "Ensamble Tuerca Plástica",
      hingeAdjustment: "Ajuste de Bisagras",
      screwCover: "Oculta Tornillos",
      warrantyText: "Garantía del Producto"
    },
    en: {
      twoTools: "2 Required Tools",
      threeTools: "3 Required Tools",
      anchorageSystem: "Anchoring System",
      pusherToOpen: "Push to Open",
      minifixAssembly: "Minifix Assembly",
      plasticNutAssembly: "Plastic Nut Assembly",
      hingeAdjustment: "Hinge Adjustment",
      screwCover: "Screw Cover",
      warrantyText: "Product Warranty"
    }
  };
  const t = idioma === "en" ? texts.en : texts.es;

  //Se activan los tips correspondientes al mueble
  useEffect(() => {
    if (!data || !data.tips) return;

    const tips = document.getElementsByClassName("option2");
    var logo2 = document.querySelector("#logo");

    //Arreglo donde se recorre los diferentes tips y dependiendo si es false o true, se activa o desactiva el tip
    Array.from(tips).forEach((tip) => {
      const tipText = tip.getAttribute("data-tip-key") || tip.textContent || "";
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
    return found ? getAssetPath(`/${id}/ensambles/${found}`) : null;
  };

  //Arreglo con los diferentes tips disponibles.
  const Tips = {
    DosHerramientasNecesarias: data.isDynamicCMS && data.imagenHerramientas 
      ? getAssetPath(`/${id}/${data.imagenHerramientas}`) 
      : getAssetPath('/assets/tips/Martillo_Destornillador.svg'),
    
    TresHerramientasNecesarias: getAssetPath('/assets/tips/Martillo_Destornillador_Allen.svg'),
    
    SistemaDeAnclaje: findEnsamble("anclaje") || getAssetPath('/assets/tips/Sistema_Anclaje.svg'),
    PulsadorParaAbrir: findEnsamble("pulsador") || getAssetPath('/assets/tips/Pulsador_Para_Abrir.svg'),
    EnsambleMinifix: findEnsamble("minifix") || getAssetPath('/assets/tips/Ensamble_Minifix.svg'),
    EnsambleTuercaPlástica: findEnsamble("tuerca") || getAssetPath('/assets/tips/Ensamble_Tuerca_Plastica.svg'),
    AjusteDeBisagras: findEnsamble("bisagra") || getAssetPath('/assets/tips/Ajuste_Bisagras.svg'),
    OcultaTornillos: findEnsamble("oculta") || getAssetPath('/assets/tips/Oculta_Tornillos.svg'),
    
    GarantiaDelProducto: data.isDynamicCMS && data.garantiaDoc 
      ? getAssetPath(`/${id}/${data.garantiaDoc}`) 
      : getAssetPath("/assets/tips/Certificado_de_Garantia_v12.pdf"),
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
        <div className="option2 2" data-tip-key="2 Herramientas Necesarias" onClick={(e) => e.stopPropagation()}>
          {t.twoTools}
          <div
            className="imagen"
            style={{ backgroundImage: `url(${Tips.DosHerramientasNecesarias})` }}
          ></div>
        </div>

        <div className="option2 3" data-tip-key="3 Herramientas Necesarias" onClick={(e) => e.stopPropagation()}>
          {t.threeTools}
          <div
            className="imagen"
            style={{ backgroundImage: `url(${Tips.TresHerramientasNecesarias})` }}
          ></div>
        </div>

        <div className="option2 4" data-tip-key="Sistema de Anclaje" onClick={(e) => e.stopPropagation()}>
          {t.anchorageSystem}
          <div
            className="imagen"
            style={{ backgroundImage: `url(${Tips.SistemaDeAnclaje})` }}
          ></div>
        </div>

        <div className="option2 5" data-tip-key="Pulsador para Abrir" onClick={(e) => e.stopPropagation()}>
          {t.pusherToOpen}
          <div
            className="imagen"
            style={{ backgroundImage: `url(${Tips.PulsadorParaAbrir})` }}
          ></div>
        </div>

        <div className="option2 6" data-tip-key="Ensamble Minifix" onClick={(e) => e.stopPropagation()}>
          {t.minifixAssembly}
          <div
            className="imagen"
            style={{ backgroundImage: `url(${Tips.EnsambleMinifix})` }}
          ></div>
        </div>

        <div className="option2 7" data-tip-key="Ensamble Tuerca Plástica" onClick={(e) => e.stopPropagation()}>
          {t.plasticNutAssembly}
          <div
            className="imagen"
            style={{ backgroundImage: `url(${Tips.EnsambleTuercaPlástica})` }}
          ></div>
        </div>

        <div className="option2 8" data-tip-key="Ajuste de Bisagras" onClick={(e) => e.stopPropagation()}>
          {t.hingeAdjustment}
          <div
            className="imagen"
            style={{ backgroundImage: `url(${Tips.AjusteDeBisagras})` }}
          ></div>
        </div>

        <div className="option2 9" data-tip-key="Oculta Tornillos" onClick={(e) => e.stopPropagation()}>
          {t.screwCover}
          <div
            className="imagen"
            style={{ backgroundImage: `url(${Tips.OcultaTornillos})` }}
          ></div>
        </div>

        <div className="option2 garantia-container" data-tip-key="Garantía del Producto" onClick={(e) => e.stopPropagation()}>
          <a
            href={Tips.GarantiaDelProducto}
            target={"_blank"}
            className="garantia-btn"
            rel="noopener noreferrer"
          >
            <span className="material-symbols-outlined garantia-icon">verified_user</span>
            <span className="garantia-text">{t.warrantyText}</span>
          </a>
        </div>
      </aside>
    </>
  );
}
