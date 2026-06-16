import { useEffect, useRef, useState } from "react";
import useEnviroment from "../../../hooks/useEnviroment";
import QRCode from "react-qr-code";
import { getAssetPath } from "../../../../../lib/assets.js";
import "./RealidadAumentada.css";

export default function RealiadaAumentada({ id }) {
  const pasoActual = useEnviroment((state) => state.pasoActual);
  const Cliente = useEnviroment((state) => state.Cliente);
  const CambiarModelo = useEnviroment((state) => state.CambiarModelo);
  const StartAppTrue = useEnviroment((state) => state.StartAppTrue);
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
      ayuda6Text: "¡Escanea el espacio y proyecta el mueble 3D interactivo en escala real dentro de tu habitación!",
      notSupported: "Tu dispositivo no es compatible con Realidad Aumentada nativa."
    },
    en: {
      arPcTitle: "View in your space (Augmented Reality)",
      closeTitle: "Close",
      qrTitle: "View in your space",
      qrText: "Scan this QR code with your mobile camera to project this furniture in real scale.",
      ayuda6Title: "Augmented Reality",
      ayuda6Text: "Scan your space and project the interactive 3D model in real scale inside your room!",
      notSupported: "Augmented Reality is not supported on your device."
    }
  };
  const t = idioma === "en" ? texts.en : texts.es;

  // Estado para controlar la visualización de la burbuja del código QR en PC
  const [showQR, setShowQR] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Detectar si el dispositivo es móvil o pantalla pequeña
  useEffect(() => {
    const checkDevice = () => {
      const mobileUA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      const smallScreen = window.innerWidth <= 787;
      setIsMobile(mobileUA || smallScreen);
    };
    checkDevice();
    window.addEventListener("resize", checkDevice);
    return () => window.removeEventListener("resize", checkDevice);
  }, []);

  // Sincronizar el paso si viene por parámetro de URL (?ar=true&step=02)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const arParam = params.get("ar");
    const stepParam = params.get("step");
    if (arParam === "true" && stepParam) {
      CambiarModelo(stepParam);
    }
  }, [CambiarModelo]);

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

  // Manejar eventos de cambio de estado de AR en model-viewer
  useEffect(() => {
    const viewer = refAr.current;
    if (!viewer) return;

    const handleArStatus = (event) => {
      const status = event.detail.status;
      console.log("AR Status:", status);
      
      // Pausar audio cuando inicie la proyección en el espacio
      if (status === "session-started") {
        useEnviroment.getState().PausedAudio();
      }
      
      // Al salir de AR, asegurarse de marcar la app como iniciada para no mostrar la pantalla de bienvenida
      if (status === "not-presenting") {
        StartAppTrue();
      }
    };

    viewer.addEventListener("ar-status", handleArStatus);
    return () => {
      viewer.removeEventListener("ar-status", handleArStatus);
    };
  }, [StartAppTrue]);

  // Iniciar AR programáticamente
  const iniciarAR = () => {
    // Pausar audio de fondo inmediatamente
    useEnviroment.getState().PausedAudio();

    if (refAr.current) {
      if (refAr.current.canActivateAR) {
        refAr.current.activateAR();
      } else {
        alert(t.notSupported);
      }
    }
  };

  // Definir la función global para el auto-lanzamiento desde PanelInicial
  useEffect(() => {
    window.__activateAR = iniciarAR;
    return () => {
      delete window.__activateAR;
    };
  }, [pasoActual, id]);

  const getQRUrl = () => {
    const url = new URL(window.location.href);
    url.searchParams.set("ar", "true");
    url.searchParams.set("step", pasoActual);
    return url.toString();
  };

  const isPanelOpen = PanelShow || PanelCantidadesState || PanelAyudas || panelTips;

  return (
    <>
      <div className={`AR ${isPanelOpen ? "panel-herrajes-open" : ""}`}>
        {/* 
          Etiqueta de model viewer.
          Se deja en el DOM de forma oculta en móvil y PC para poder invocar activateAR() por JS.
        */}
        <model-viewer 
          ar 
          ar-modes="scene-viewer webxr quick-look" 
          camera-controls
          bounds="tight" 
          alt="Maderkit" 
          autoplay 
          ref={refAr}
          style={{ display: "none" }}
        >
          {/* Botón slot ar-button requerido por model-viewer pero no usado visualmente */}
          <button slot="ar-button" style={{ display: "none" }}></button>
        </model-viewer>

        {/* Botón premium de AR Obsidian Teal (Unificado para PC y Móvil) */}
        <button 
          className={`ar-btn-pc ${showQR ? "active" : ""}`}
          onClick={() => {
            if (isMobile) {
              iniciarAR();
            } else {
              setShowQR(!showQR);
            }
          }}
          title={t.arPcTitle}
        >
          <span className="material-symbols-outlined">view_in_ar_new</span>
        </button>

        {/* Popover del Código QR para escritorio (PC) - Obsidian Teal Premium */}
        {!isMobile && (
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
                value={getQRUrl()}
                size={180}
                fgColor="#0b1418"
                bgColor="#ffffff"
                level="M"
                style={{ height: "auto", maxWidth: "100%", width: "100%" }}
              />
            </div>
          </div>
        )}

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