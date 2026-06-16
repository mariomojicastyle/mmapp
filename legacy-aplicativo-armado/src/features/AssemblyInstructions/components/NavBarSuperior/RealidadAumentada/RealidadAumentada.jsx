import { useEffect, useRef, useState } from "react";
import useEnviroment from "../../../hooks/useEnviroment";
import QRCode from "react-qr-code";
import { getAssetPath } from "../../../../../lib/assets.js";
import "./RealidadAumentada.css";

export default function RealiadaAumentada({ id }) {
  const pasoActual = useEnviroment((state) => state.pasoActual);
  const Cliente = useEnviroment((state) => state.Cliente);
  const refAr = useRef(null);
  
  const PanelAyudas = useEnviroment((state) => state.PanelAyudas);
  const PanelShow = useEnviroment((state) => state.PanelShow);
  const PanelCantidadesState = useEnviroment((state) => state.PanelCantidades);
  const ayuda6 = useEnviroment((state) => state.ayuda6);
  const panelTips = useEnviroment((state) => state.panelTips);
  const idioma = useEnviroment((state) => state.idioma);

  const texts = {
    es: {
      arPcTitle: "Ver en tu espacio (Realidad Aumentada)",
      closeTitle: "Cerrar",
      qrTitle: "Ver en tu espacio",
      qrText: "Escanea este código QR con la cámara de tu móvil para proyectar este mueble en escala real.",
      ayuda6Title: "Realidad Aumentada",
      ayuda6Text: "¡Escanea el espacio y proyecta el mueble 3D interactivo en escala real dentro de tu habitación!"
    },
    en: {
      arPcTitle: "View in your space (Augmented Reality)",
      closeTitle: "Close",
      qrTitle: "View in your space",
      qrText: "Scan this QR code with your mobile camera to project this furniture in real scale.",
      ayuda6Title: "Augmented Reality",
      ayuda6Text: "Scan your space and project the interactive 3D model in real scale inside your room!"
    }
  };
  const t = idioma === "en" ? texts.en : texts.es;

  // Estado para controlar la visualización de la burbuja del código QR en PC
  const [showQR, setShowQR] = useState(false);
  
  // Apenas inicia el aplicativo, se agrega la ruta del paso 00.
  useEffect(() => {
    if (refAr.current) {
      refAr.current.src = getAssetPath(`/${id}/models/P00.glb`);
    }
  }, [id]);

  useEffect(() => {
    if (refAr.current) {
      refAr.current.src = getAssetPath(`/${id}/models/P${pasoActual}.glb`);
    }
  }, [pasoActual, Cliente, id]);

  const isPanelOpen = PanelShow || PanelCantidadesState || PanelAyudas || panelTips;

  return (
    <>
      <div className={`AR ${isPanelOpen ? "panel-herrajes-open" : ""}`}>
        {/* 
          Etiqueta de model viewer. En dispositivos móviles que soportan AR, model-viewer
          renderiza el botón con slot="ar-button". En PC este botón no se renderiza.
        */}
        <model-viewer 
          ar 
          ar-modes="scene-viewer webxr quick-look" 
          camera-controls
          bounds="tight" 
          alt="Maderkit" 
          autoplay 
          ref={refAr}
        >
          {/* Botón de AR nativo para móviles */}
          <button 
            slot="ar-button"
            style={{
              backgroundColor: "transparent",
              width: "100%",
              height: "100%",
              borderRadius: "50%",
              border: "none",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              color: "inherit"
            }}
          >
            <span className="material-symbols-outlined" style={{ color: "var(--primary, #00f2fe)" }}>
              view_in_ar_new
            </span>
          </button>
        </model-viewer>

        {/* Botón personalizado de AR exclusivo para PC (pantallas grandes) */}
        <button 
          className={`ar-btn-pc ${showQR ? "active" : ""}`}
          onClick={() => setShowQR(!showQR)}
          title={t.arPcTitle}
        >
          <span className="material-symbols-outlined">view_in_ar_new</span>
        </button>

        {/* Popover del Código QR para escritorio (PC) - Obsidian Teal Premium */}
        <div className={`qr-bubble ${showQR ? "is-active" : ""}`}>
          <div className="qr-bubble-arrow"></div>
          <button 
            className="qr-bubble-close" 
            onClick={() => setShowQR(false)} 
            title={t.closeTitle}
          >
            <span className="material-symbols-outlined">close</span>
          </button>
          
          <div className="qr-bubble-title">
            <span className="material-symbols-outlined">smartphone</span>
            {t.qrTitle}
          </div>
          
          <div className="qr-bubble-text">
            {t.qrText}
          </div>
          
          <div className="qr-code-container">
            <QRCode 
              value={window.location.href}
              size={180}
              fgColor="#0b1418"
              bgColor="#ffffff"
              level="M"
              style={{ height: "auto", maxWidth: "100%", width: "100%" }}
            />
          </div>
        </div>

        {/* Burbuja de ayuda 6: Realidad Aumentada (Tutorial interactivo por voz en off) */}
        <div className={`ayuda-bubble ayuda6 ${PanelAyudas && ayuda6 ? "is-active" : ""}`}>
          <div className="ayuda-bubble-arrow arrow-right"></div>
          <div className="ayuda-bubble-title">{t.ayuda6Title}</div>
          <div className="ayuda-bubble-text">
            {t.ayuda6Text}
          </div>
        </div>
      </div>
    </>
  );
}