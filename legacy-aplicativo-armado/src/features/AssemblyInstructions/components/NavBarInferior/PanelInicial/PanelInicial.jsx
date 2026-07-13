/* eslint-disable */
import './PanelInicial.css';
import { Html, useProgress, useGLTF } from '@react-three/drei'
import { useRef, useState, useEffect } from 'react';
import useEnviroment from '../../../hooks/useEnviroment';
import { getAssetPath } from "../../../../../lib/assets.js";


export default function PanelInicial() {
  //Hook progress, utilizado para conocer el progreso de carga del aplicativo
  const { active, item, loaded, total, progress } = useProgress();
  const useCharger = useRef(null);
  const progressBar = useRef(null);
  
  const StartAppTrue = useEnviroment((state) => state.StartAppTrue);
  const icono = useEnviroment((state) => state.icono);
  const idioma = useEnviroment((state) => state.idioma);
  const brandingShieldActivo = useEnviroment((state) => state.brandingShieldActivo);
  const modoArranqueMovil = useEnviroment((state) => state.modoArranqueMovil);

  const [displayProgress, setDisplayProgress] = useState(0);
  const [isArMode] = useState(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      return params.get("ar") === "true";
    }
    return false;
  });

  const [isMobile] = useState(() => {
    if (typeof window !== "undefined") {
      return /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent) || 
             (window.matchMedia && window.matchMedia("(pointer: coarse)").matches);
    }
    return false;
  });

  const showCleanBackdrop = isArMode || (isMobile && modoArranqueMovil === "simple");
  const isDemoMode = showCleanBackdrop && !isArMode;

  const [isEmbedded, setIsEmbedded] = useState(false);
  useEffect(() => {
    if (typeof window !== "undefined") {
      setIsEmbedded(window.self !== window.top);
    }
  }, []);

  useEffect(() => {
    let intervalId;
    
    // Si la app está cargando y el progress real sigue en 0 o muy bajo (común sin Content-Length)
    // Simulamos un progreso progresivo para que no se quede estática.
    if (active && progress < 100) {
      intervalId = setInterval(() => {
        setDisplayProgress(prev => {
          // Si el progreso real da un salto, lo tomamos. Si no, simulamos hasta el 90%.
          const actualProgress = Math.max(prev, Math.round(progress));
          if (actualProgress < 90) {
            // Crece rápido al inicio, lento al final
            const step = actualProgress < 40 ? 5 : actualProgress < 75 ? 2 : 1;
            return actualProgress + step;
          }
          return actualProgress; // Se queda en 90% máximo hasta que el real reporte 100%
        });
      }, 200); // 5 actualizaciones por segundo
    } else if (progress >= 100) {
      setDisplayProgress(100);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [active, progress]);

  const fillerStyles = {
    height: '100%',
    width: `${displayProgress}%`,
    backgroundColor: "color-mix(in srgb, var(--primary) var(--nubes-bg-opacity, 20%), transparent)",
    borderRadius: 'inherit',
    textAlign: 'right',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
    transition: 'width 0.3s ease-out' // Transición CSS suave
  }

  const labelStyles = {
    padding: 5,
    color: 'var(--secondary, #ffffff)',
    fontWeight: 'bold'
  }

  // Aparece el boton de iniciar, cuando el progreso ha llegado al 100%
  useEffect(() => {
    if (progress >= 100) {
      const inicioBtn = document.getElementById("inicio");
      if (inicioBtn) {
        inicioBtn.style.display = "flex";
      }

      // Oculta la barra de progreso 1 segundo después (más rápido que antes)
      window.setTimeout(() => {
        const progContainer = document.querySelector(".progress");
        if (progContainer) {
          progContainer.style.opacity = "0";
          window.setTimeout(() => {
            if (progContainer) progContainer.style.display = "none";
          }, 500);
        }
      }, 1000);
    }
  }, [progress]);

  // Mecanismo de respaldo (Bypass por Timeout): Si tras 8 segundos no ha cargado, forzar inicio
  useEffect(() => {
    const backupTimeout = window.setTimeout(() => {
      if (progress < 100) {
        console.warn("Carga lenta o bloqueada. Activando bypass de inicio seguro...");
        setDisplayProgress(100);
        const inicioBtn = document.getElementById("inicio");
        if (inicioBtn) {
          inicioBtn.style.display = "flex";
        }
        const progContainer = document.querySelector(".progress");
        if (progContainer) {
          progContainer.style.opacity = "0";
          window.setTimeout(() => {
            if (progContainer) progContainer.style.display = "none";
          }, 500);
        }
      }
    }, 8000); // Aumentado a 8 segundos porque los GLB pesados en móvil pueden tardar

    return () => window.clearTimeout(backupTimeout);
  }, [progress]);
  
  //Se desactiva el panel inicial, y se inicializa el global state de iniciar el aplicativo.
  const Start = () => {
    useCharger.current.style.display = "none";
    StartAppTrue();
    
    // Si estamos en modo AR, lanzar la experiencia inmediatamente tras habilitar la app
    if (isArMode && typeof window.__activateAR === "function") {
      setTimeout(() => {
        window.__activateAR();
      }, 150);
    }

    // Auto-maximizar al iniciar en móviles
    if (isMobile) {
      if (typeof window !== "undefined" && window.self !== window.top) {
        // Embebido en iframe: Notificar al padre
        window.parent.postMessage({ type: "MM_MANUAL_INICIAR" }, "*");
      } else {
        // Directo en navegador: Fullscreen nativo
        if (!document.fullscreenElement) {
          document.documentElement.requestFullscreen().catch((err) => {
            console.warn("Fullscreen automático bloqueado:", err);
          });
        }
      }
    }
  }

  const texts = {
    es: {
      arButton: "Ver en tu espacio",
      arExplain: "Sube el volumen para escuchar las instrucciones y proyecta el mueble en tu espacio.",
      productos: "Productos",
      potenciados: "Potenciados por",
    },
    en: {
      arButton: "View in your space",
      arExplain: "Turn up the volume to hear the instructions and project the furniture in your space.",
      productos: "Products",
      potenciados: "Powered by",
    },
    pt: {
      arButton: "Ver no seu espaço",
      arExplain: "Aumente o volume para ouvir as instruções e projete o móvel no seu espaço.",
      productos: "Produtos",
      potenciados: "Potencializado por",
    }
  };
  const t = idioma === "en" ? texts.en : (idioma === "pt" ? texts.pt : texts.es);

  return <>
    <aside 
      className="PanelInicial" 
      ref={useCharger} 
      style={showCleanBackdrop ? { background: "radial-gradient(circle, #ffffff 0%, #f3f4f6 100%)", backgroundColor: "#ffffff", padding: "0", display: "flex", flexDirection: "column", height: "100vh", position: "relative" } : {}}
    >
      {/* Background Spline Scene / AR Minimal Backdrop */}
      {!showCleanBackdrop ? (
        <>
          <div className="spline-wrapper">
            <iframe 
              src="https://my.spline.design/r4xbot-pS1luNxTefqsyDlc4ZbCw1Fj/?v=mario2" 
              frameBorder="0" 
              width="100%" 
              height="100%" 
              className="spline-bg"
              title="Animación de bienvenida"
            ></iframe>
          </div>

          {/* El Escudo de Cristal (Client Branding Overlay) */}
          {brandingShieldActivo && icono && !icono.includes("Logo_mm.svg") && !icono.includes("Logo_MM_en.svg") && (
            <div className="client-branding-shield">
              <span className="branding-text-top">{t.productos}</span>
              <div 
                className="client-logo-overlay" 
                style={{ backgroundImage: icono }}
              ></div>
              <span className="branding-text-bottom">{t.potenciados}</span>
            </div>
          )}

          {/* Top Content (Progress Bar & Button - Solo visible en modo no-AR) */}
          <div className="content-top">
            <div className="progress">
              {/* Barra de progreso */}
              <div style={fillerStyles} className="progressBar" ref={progressBar}>
                <span style={labelStyles}>{`${displayProgress}%`}</span>
              </div>
            </div>
            <div className="optionI" id="inicio" onClick={Start} style={isEmbedded ? { marginTop: '10px' } : {}}>
              <div className="imagen">
                {idioma === "en" ? "Start" : "Iniciar"}
              </div>
            </div>
          </div>
        </>
      ) : isArMode ? (
        // Pantalla original de Realidad Aumentada (QR)
        <div style={{ display: "flex", flexDirection: "column", height: "100%", width: "100%", position: "relative" }}>
          {/* ARRIBA (50% de la pantalla): Centrado del Logo MM (20% más grande, 245px -> 294px) */}
          <div style={{ height: "50%", width: "100%", display: "flex", alignItems: "center", justifyContent: "center", boxSizing: "border-box", padding: "20px" }}>
            <img 
              src={getAssetPath("/assets/Logo_MM_en.svg")} 
              alt="Mario Mojica Logo" 
              style={{ width: "294px", height: "auto", filter: "drop-shadow(0 4px 10px rgba(0,0,0,0.06))" }} 
            />
          </div>

          {/* CENTRO: Barra de progreso original (hereda del manual, sin estilos inline fijos que impidan desvanecerse) */}
          <div className="progress">
            <div style={fillerStyles} className="progressBar" ref={progressBar}>
              <span style={labelStyles}>{`${displayProgress}%`}</span>
            </div>
          </div>
          
          {/* Gráfica del cubo centrada sobre la barra, se mantiene fija tras completar la carga (SVG nativo para carga instantánea sin texto plano) */}
          <div style={{ 
            position: "fixed", 
            top: "calc(55% - 60px)", 
            left: "50%", 
            transform: "translate(-50%, -50%)", 
            zIndex: 30, 
            color: "var(--primary, #0d9488)", 
            display: "flex", 
            justifyContent: "center", 
            alignItems: "center", 
            pointerEvents: "none" 
          }}>
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              viewBox="0 0 24 24" 
              width="52px" 
              height="52px" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              style={{ filter: "drop-shadow(0 0 10px rgba(13, 148, 136, 0.4))" }}
            >
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
              <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
              <line x1="12" y1="22.08" x2="12" y2="12" />
            </svg>
          </div>

          {/* ABAJO (50% de la pantalla): Texto explicativo centrado en el color principal y Botón con estilo original */}
          <div style={{ height: "50%", width: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", boxSizing: "border-box", padding: "20px", gap: "24px" }}>
            <div style={{ width: "100%", maxWidth: "340px", textAlign: "center" }}>
              <p style={{ fontSize: "14.5px", color: "var(--primary, #0d9488)", margin: "0", lineHeight: "1.6", fontWeight: "600" }}>
                {t.arExplain}
              </p>
            </div>
            
            <div 
              className="optionI" 
              id="inicio" 
              onClick={Start} 
              style={{ 
                marginTop: "0", 
                display: (displayProgress === 100 || progress >= 100) ? "flex" : "none", 
                zIndex: 40,
                pointerEvents: "auto"
              }}
            >
              <div className="imagen">
                {t.arButton}
              </div>
            </div>
          </div>
        </div>
      ) : (
        // Pantalla nueva optimizada para el Modo Demo Móvil
        <div className="demo-welcome-container">
          <div className="demo-welcome-logo-section">
            <img 
              src={getAssetPath("/assets/Logo_MM_en.svg")} 
              alt="Mario Mojica Logo" 
              className="demo-welcome-logo"
            />
          </div>

          <div className="demo-welcome-loader-section">
            <div className="demo-progress-container">
              <div className="progress">
                <div style={fillerStyles} className="progressBar" ref={progressBar}>
                  <span style={labelStyles}>{`${displayProgress}%`}</span>
                </div>
              </div>
              
              <div className="demo-cube-icon">
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  viewBox="0 0 24 24" 
                  width="44px" 
                  height="44px" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                >
                  <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                  <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                  <line x1="12" y1="22.08" x2="12" y2="12" />
                </svg>
              </div>
            </div>

            <div className="demo-welcome-controls">
              <p className="demo-welcome-explain">
                {t.arExplain}
              </p>
              
              <div 
                className="optionI" 
                id="inicio" 
                onClick={Start} 
                style={{ 
                  marginTop: "0", 
                  display: (displayProgress === 100 || progress >= 100) ? "flex" : "none", 
                  zIndex: 40,
                  pointerEvents: "auto"
                }}
              >
                <div className="imagen">
                  {idioma === "en" ? "Start" : "Iniciar"}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </aside>
  </>;
}