import { useEffect, useRef, useState } from "react";
import useEnviroment from "../../../hooks/useEnviroment";
import "./RealidadAumentada.css";

export default function RealiadaAumentada({ id }) {
  const pasoActual = useEnviroment((state) => state.pasoActual);
  const Cliente = useEnviroment((state) => state.Cliente);
  const refAr = useRef(null);
  
  const PanelAyudas = useEnviroment((state) => state.PanelAyudas);
  const PanelShow = useEnviroment((state) => state.PanelShow);
  const PanelCantidadesState = useEnviroment((state) => state.PanelCantidades);
  const ayuda6 = useEnviroment((state) => state.ayuda6);

  // Estado para controlar la visualización de la burbuja del código QR en PC
  const [showQR, setShowQR] = useState(false);
  
  // Apenas inicia el aplicativo, se agrega la ruta del paso 00.
  useEffect(() => {
    if (refAr.current) {
      refAr.current.src = `/${id}/models/P00.glb`;
    }
  }, [id]);

  useEffect(() => {
    if (refAr.current) {
      refAr.current.src = `/${id}/models/P${pasoActual}.glb`;
    }
  }, [pasoActual, Cliente, id]);

  const isPanelOpen = PanelShow || PanelCantidadesState || PanelAyudas;

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
              backgroundColor: "white",
              width: "100%",
              height: "100%",
              borderRadius: "50%",
              border: "none",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer"
            }}
          >
            <span className="material-symbols-outlined" style={{ color: "#f28f1d" }}>
              view_in_ar_new
            </span>
          </button>
        </model-viewer>

        {/* Botón personalizado de AR exclusivo para PC (pantallas grandes) */}
        <button 
          className={`ar-btn-pc ${showQR ? "active" : ""}`}
          onClick={() => setShowQR(!showQR)}
          title="Ver en tu espacio (Realidad Aumentada)"
        >
          <span className="material-symbols-outlined">view_in_ar_new</span>
        </button>

        {/* Popover del Código QR para escritorio (PC) - Obsidian Teal Premium */}
        <div className={`qr-bubble ${showQR ? "is-active" : ""}`}>
          <div className="qr-bubble-arrow"></div>
          <button 
            className="qr-bubble-close" 
            onClick={() => setShowQR(false)} 
            title="Cerrar"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
          
          <div className="qr-bubble-title">
            <span className="material-symbols-outlined">smartphone</span>
            Ver en tu espacio
          </div>
          
          <div className="qr-bubble-text">
            Escanea este código QR con la cámara de tu móvil para proyectar este mueble en escala real.
          </div>
          
          <div className="qr-code-container">
            <img 
              src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&color=0b1418&bgcolor=ffffff&data=${encodeURIComponent(window.location.href)}`} 
              alt="Código QR de Realidad Aumentada" 
              className="qr-code-img"
            />
          </div>
        </div>

        {/* Burbuja de ayuda 6: Realidad Aumentada (Tutorial interactivo por voz en off) */}
        <div className={`ayuda-bubble ayuda6 ${PanelAyudas && ayuda6 ? "is-active" : ""}`}>
          <div className="ayuda-bubble-arrow arrow-right"></div>
          <div className="ayuda-bubble-title">Realidad Aumentada</div>
          <div className="ayuda-bubble-text">
            ¡Escanea el espacio y proyecta el mueble 3D interactivo en escala real dentro de tu habitación!
          </div>
        </div>
      </div>
    </>
  );
}