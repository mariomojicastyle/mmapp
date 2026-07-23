import { useEffect, useRef, useState } from "react";
import useEnviroment from "../../../hooks/useEnviroment";
import QRCode from "react-qr-code";
import { getAssetPath } from "../../../../../lib/assets.js";
import { getDecryptGlbUrl } from "../../../../../lib/arToken.js";
import "./RealidadAumentada.css";

export default function RealiadaAumentada({ id, data }) {
  const pasoActual = useEnviroment((state) => state.pasoActual);
  const Cliente = useEnviroment((state) => state.Cliente);
  const CambiarModelo = useEnviroment((state) => state.CambiarModelo);
  const StartAppTrue = useEnviroment((state) => state.StartAppTrue);
  const refAr = useRef(null);
  const arActiveRef = useRef(false); // Rastrea si la sesión de AR estaba activa para reanudar el audio al salir
  
  const PanelAyudas = useEnviroment((state) => state.PanelAyudas);
  const PanelShow = useEnviroment((state) => state.PanelShow);
  const PanelCantidadesState = useEnviroment((state) => state.PanelCantidades);
  const ayuda6 = useEnviroment((state) => state.ayuda6);
  const panelTips = useEnviroment((state) => state.panelTips);
  const idioma = useEnviroment((state) => state.idioma);
  const homeButtonActivo = useEnviroment((state) => state.homeButtonActivo);
  const homeUrl = useEnviroment((state) => state.homeUrl);

  const texts = {
    es: {
      arPcTitle: "Ver en tu espacio (Realidad Aumentada)",
      homeTitle: "Ir a la página principal",
      closeTitle: "Cerrar",
      qrTitle: "Ver en tu espacio",
      qrText: "Escanea este código QR con la cámara de tu móvil para proyectar este mueble en escala real.",
      ayuda6Title: "Realidad Aumentada",
      ayuda6Text: "¡Escanea el espacio y proyecta el mueble 3D interactivo en escala real dentro de tu habitación!",
      notSupported: "Tu dispositivo no es compatible con Realidad Aumentada nativa."
    },
    en: {
      arPcTitle: "View in your space (Augmented Reality)",
      homeTitle: "Go to Homepage",
      closeTitle: "Close",
      qrTitle: "View in your space",
      qrText: "Scan this QR code with your mobile camera to project this furniture in real scale.",
      ayuda6Title: "Augmented Reality",
      ayuda6Text: "Scan your space and project the interactive 3D model in real scale inside your room!",
      notSupported: "Augmented Reality is not supported on your device."
    },
    pt: {
      arPcTitle: "Ver no seu espaço (Realidade Aumentada)",
      homeTitle: "Ir para a página inicial",
      closeTitle: "Fechar",
      qrTitle: "Ver no seu espaço",
      qrText: "Escaneie este código QR com a câmera do seu celular para projetar este móvel em tamanho real.",
      ayuda6Title: "Realidade Aumentada",
      ayuda6Text: "Escaneie o espaço e projete o móvel 3D interativo em tamanho real dentro do seu ambiente!",
      notSupported: "O seu dispositivo não é compatível com Realidade Aumentada nativa."
    }
  };
  const t = idioma === "en" ? texts.en : (idioma === "pt" ? texts.pt : texts.es);

  const ayudasTexto = data?.ayudasTexto || {};
  const currentLang = idioma === "en" ? "en" : (idioma === "pt" ? "pt" : "es");

  const dAyuda6Title = ayudasTexto.ayuda6?.[`title_${currentLang}`] || t.ayuda6Title;
  const dAyuda6Text = ayudasTexto.ayuda6?.[`content_${currentLang}`] || t.ayuda6Text;

  // Estado para controlar la visualización de la burbuja del código QR en PC
  const [showQR, setShowQR] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Escuchar eventos de fullscreen local y mensajes del padre para sincronizar el estado
  useEffect(() => {
    const handleFs = () => {
      const isFull = !!document.fullscreenElement;
      setIsFullscreen(isFull);
      if (!isFull) {
        // Pausar el audio al salir de fullscreen localmente solo si NO estamos embebidos en un iframe
        // (si estamos embebidos, la pausa se sincroniza mediante el mensaje FULLSCREEN_CHANGE del padre)
        if (typeof window !== "undefined" && window.self === window.top) {
          if (!window.__startingApp) {
            useEnviroment.getState().PausedAudio();
          }
        }
      }
    };
    const handleMessage = (event) => {
      if (event.data && event.data.type === "FULLSCREEN_CHANGE") {
        setIsFullscreen(event.data.isFullscreen);
      }
    };
    document.addEventListener("fullscreenchange", handleFs);
    window.addEventListener("message", handleMessage);
    return () => {
      document.removeEventListener("fullscreenchange", handleFs);
      window.removeEventListener("message", handleMessage);
    };
  }, []);

  const exitFullscreen = () => {
    // Pausar el audio inmediatamente al salir voluntariamente
    useEnviroment.getState().PausedAudio();

    if (typeof window !== "undefined" && window.self !== window.top) {
      window.parent.postMessage({ type: "MM_MANUAL_MINIMIZAR" }, "*");
      if (document.fullscreenElement) {
        document.exitFullscreen().catch((err) => {
          console.warn("Error al salir de fullscreen local:", err);
        });
      }
    } else {
      if (document.fullscreenElement) {
        document.exitFullscreen().catch((err) => {
          console.warn("Error al salir de fullscreen:", err);
        });
      }
    }
  };

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
    if (refAr.current && id) {
      getDecryptGlbUrl(id, "P00").then((url) => {
        if (refAr.current) refAr.current.src = url;
      });
    }
  }, [id]);

  useEffect(() => {
    if (refAr.current && id) {
      const stepStr = `P${pasoActual}`;
      getDecryptGlbUrl(id, stepStr).then((url) => {
        if (refAr.current) refAr.current.src = url;
      });
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
        arActiveRef.current = true;
        useEnviroment.getState().PausedAudio();
      }
      
      // Al salir de AR, asegurarse de marcar la app como iniciada para no mostrar la pantalla de bienvenida y recargar la página limpia
      if (status === "not-presenting") {
        if (arActiveRef.current) {
          arActiveRef.current = false;
          
          // Construir la nueva URL sin el parámetro 'ar=true' pero conservando el paso actual
          const url = new URL(window.location.href);
          url.searchParams.delete("ar");
          url.searchParams.set("step", pasoActual);
          
          // Forzar la recarga automática a la nueva URL limpia del manual 3D para reactivar animaciones y audio de fondo
          window.location.href = url.toString();
          return;
        }
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
          alt="Modelo 3D" 
          autoplay 
          ref={refAr}
          style={{ display: "none" }}
        >
          {/* Botón slot ar-button requerido por model-viewer pero no usado visualmente */}
          <button slot="ar-button" style={{ display: "none" }}></button>
        </model-viewer>

        {/* Botón opcional Home "Casita" Obsidian Teal */}
        {homeButtonActivo && (
          <button 
            className="home-btn-pc"
            onClick={() => {
              // 1. Pausar el audio del manual inmediatamente
              useEnviroment.getState().PausedAudio();

              const targetUrl = homeUrl || "https://mariomojica.com";
              if (typeof window !== "undefined") {
                if (window.self !== window.top) {
                  // Notificar al contenedor padre para cerrar/minimizar el overlay
                  window.parent.postMessage({ type: "MM_MANUAL_MINIMIZAR" }, "*");
                  try {
                    window.top.location.href = targetUrl;
                  } catch (e) {
                    window.location.href = targetUrl;
                  }
                } else {
                  window.location.href = targetUrl;
                }
              }
            }}
            title={t.homeTitle}
          >
            <span className="material-symbols-outlined">home</span>
          </button>
        )}

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
          <div className="ayuda-bubble-title">{dAyuda6Title}</div>
          <div className="ayuda-bubble-text">
            {dAyuda6Text}
          </div>
        </div>
      </div>

      {/* Botón de cerrar "X" en móviles, visible solo en pantalla completa, simétrico al botón de AR */}
      {isFullscreen && (
        <button 
          className="close-fullscreen-btn"
          onClick={exitFullscreen}
          title={idioma === "en" ? "Close" : (idioma === "pt" ? "Fechar" : "Cerrar")}
        >
          <span className="material-symbols-outlined">close</span>
        </button>
      )}
    </>
  );
}