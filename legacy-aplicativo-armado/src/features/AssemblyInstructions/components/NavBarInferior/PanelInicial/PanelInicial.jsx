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

  const [displayProgress, setDisplayProgress] = useState(0);
  const [isArMode] = useState(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      return params.get("ar") === "true";
    }
    return false;
  });

  useEffect(() => {
    let animationFrameId;
    let startTimestamp = null;
    const duration = 1000; 
    
    const startValue = displayProgress;
    const endValue = Math.round(progress);

    if (startValue === endValue) return;

    const step = (timestamp) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const t = Math.min((timestamp - startTimestamp) / duration, 1);
      const ease = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
      const currentVal = Math.round(startValue + (endValue - startValue) * ease);
      
      setDisplayProgress(currentVal);
      
      if (t < 1) {
        animationFrameId = window.requestAnimationFrame(step);
      }
    };
    
    animationFrameId = window.requestAnimationFrame(step);
    
    return () => {
      window.cancelAnimationFrame(animationFrameId);
    };
  }, [progress]);


  const fillerStyles = {
    height: '100%',
    width: `${displayProgress}%`,
    backgroundColor: "color-mix(in srgb, var(--primary) var(--nubes-bg-opacity, 20%), transparent)",
    borderRadius: 'inherit',
    textAlign: 'right',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end'
  }

  const labelStyles = {
    padding: 5,
    color: 'var(--secondary, #ffffff)',
    fontWeight: 'bold'
  }

  // Aparece el boton de iniciar, cuando el progreso de carga ha llegado al 100%
  useEffect(() => {
    if (displayProgress === 100) {
      window.setTimeout(() => {
        const inicioBtn = document.getElementById("inicio");
        if (inicioBtn) {
          inicioBtn.style.display = "flex";
        }
      }, 500);

      // Oculta la barra de progreso 2 segundos después
      window.setTimeout(() => {
        const progContainer = document.querySelector(".progress");
        if (progContainer) {
          progContainer.style.opacity = "0";
          window.setTimeout(() => {
            if (progContainer) progContainer.style.display = "none";
          }, 500);
        }
      }, 2000);
    }
  }, [displayProgress]);

  // Mecanismo de respaldo (Bypass por Timeout): Si tras 5 segundos no ha cargado, forzar inicio
  useEffect(() => {
    const backupTimeout = window.setTimeout(() => {
      if (displayProgress < 100) {
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
    }, 6000);

    return () => window.clearTimeout(backupTimeout);
  }, [displayProgress]);
  
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
  }

  const texts = {
    es: {
      arButton: "Ver en tu espacio",
      arExplain: "Proyecta este mueble en escala real en tu habitación para guiarte en el proceso de armado.",
      arVolume: "🔊 ¡Hola, soy Gama! Sube el volumen de tu móvil",
    },
    en: {
      arButton: "View in your space",
      arExplain: "Project this furniture in real scale in your room to guide you in the assembly process.",
      arVolume: "🔊 Hi, I'm Gama! Turn up your device's volume",
    }
  };
  const t = idioma === "en" ? texts.en : texts.es;

  return <>
    <aside 
      className="PanelInicial" 
      ref={useCharger} 
      style={isArMode ? { background: "radial-gradient(circle, #ffffff 0%, #f3f4f6 100%)", backgroundColor: "#ffffff", padding: "30px 20px" } : {}}
    >
      {/* Background Spline Scene / AR Minimal Backdrop */}
      {!isArMode ? (
        <>
          <div className="spline-wrapper">
            <iframe 
              src="https://my.spline.design/r4xbot-pS1luNxTefqsyDlc4ZbCw1Fj/?v=8" 
              frameBorder="0" 
              width="100%" 
              height="100%" 
              className="spline-bg"
              title="Spline 3D Scene"
            ></iframe>
          </div>

          {/* Top Content (Progress Bar & Button - Solo visible en modo no-AR) */}
          <div className="content-top">
            <div className="progress">
              {/* Barra de progreso */}
              <div style={fillerStyles} className="progressBar" ref={progressBar}>
                <span style={labelStyles}>{`${displayProgress}%`}</span>
              </div>
            </div>
            <div className="optionI" id="inicio" onClick={Start}>
              <div className="imagen">
                {idioma === "en" ? "Start" : "Iniciar"}
              </div>
            </div>
          </div>
        </>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "space-between", height: "100%", width: "100%", zIndex: 10 }}>
          {/* ARRIBA: Logo MM */}
          <div style={{ width: "100%", display: "flex", justifyContent: "center", marginTop: "15px" }}>
            <img 
              src={getAssetPath("/assets/Logo_MM_en.svg")} 
              alt="Mario Mojica Logo" 
              style={{ width: "230px", height: "auto", filter: "drop-shadow(0 4px 10px rgba(0,0,0,0.06))" }} 
            />
          </div>

          {/* CENTRO: Barra de Carga Inline Localizada */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "10px", width: "100%" }}>
            {displayProgress < 100 ? (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "12px" }}>
                <div style={{ width: "240px", height: "18px", border: "2px solid var(--primary, #0d9488)", borderRadius: "100px", overflow: "hidden", position: "relative", background: "rgba(13, 148, 136, 0.05)" }}>
                  <div style={{ ...fillerStyles, width: `${displayProgress}%`, boxShadow: "0 0 8px rgba(13, 148, 136, 0.4)" }}>
                    <span style={{ padding: "0 8px", color: "var(--primary, #0d9488)", fontWeight: "bold", fontSize: "10px" }}>{`${displayProgress}%`}</span>
                  </div>
                </div>
                <span style={{ fontSize: "12px", color: "#6b7280", fontWeight: "600", letterSpacing: "0.05em", textTransform: "uppercase" }}>
                  {idioma === "en" ? "Loading experience..." : "Cargando experiencia..."}
                </span>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "8px", color: "var(--primary, #0d9488)", opacity: 0.85 }}>
                <span className="material-symbols-outlined" style={{ fontSize: "42px", filter: "drop-shadow(0 0 10px rgba(13, 148, 136, 0.3))" }}>view_in_ar_new</span>
              </div>
            )}
          </div>

          {/* ABAJO: Explicación, Aviso de Volumen y Botón de Acción */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "22px", width: "100%", maxWidth: "340px", marginBottom: "15px" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px", textAlign: "center", padding: "0 10px" }}>
              <p style={{ fontSize: "14.5px", color: "#374151", margin: "0", lineHeight: "1.5", fontWeight: "600" }}>
                {t.arExplain}
              </p>
              <p style={{ fontSize: "13.5px", color: "#0d9488", margin: "6px 0 0 0", fontWeight: "700", display: "flex", alignItems: "center", justifyContent: "center", gap: "4px" }}>
                {t.arVolume}
              </p>
            </div>
            
            {displayProgress === 100 && (
              <button 
                onClick={Start}
                style={{
                  cursor: "pointer",
                  borderRadius: "100px",
                  background: "var(--primary, #0d9488)",
                  border: "none",
                  color: "#ffffff",
                  padding: "14px 44px",
                  fontSize: "1.15rem",
                  fontWeight: "700",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  boxShadow: "0 8px 20px rgba(13, 148, 136, 0.3)",
                  transition: "all 0.3s ease",
                  outline: "none"
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.transform = "scale(1.04)";
                  e.currentTarget.style.boxShadow = "0 10px 25px rgba(13, 148, 136, 0.4)";
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = "scale(1)";
                  e.currentTarget.style.boxShadow = "0 8px 20px rgba(13, 148, 136, 0.3)";
                }}
              >
                {t.arButton}
              </button>
            )}
          </div>
        </div>
      )}
    </aside>
  </>
}