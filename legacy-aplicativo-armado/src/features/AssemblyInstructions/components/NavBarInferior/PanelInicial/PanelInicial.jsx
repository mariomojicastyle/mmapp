/* eslint-disable */
import './PanelInicial.css';
import { Html, useProgress, useGLTF } from '@react-three/drei'
import { useRef, useState, useEffect } from 'react';
import useEnviroment from '../../../hooks/useEnviroment';


export default function PanelInicial() {
  //Hook progress, utilizado para conocer el progreso de carga del aplicativo
  const { active, item, loaded, total, progress } = useProgress();
  const useCharger = useRef(null);
  const progressBar = useRef(null);
  
  const StartAppTrue = useEnviroment((state) => state.StartAppTrue);
  const icono = useEnviroment((state) => state.icono);
  const idioma = useEnviroment((state) => state.idioma);

  const [displayProgress, setDisplayProgress] = useState(0);
  const [isArMode, setIsArMode] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setIsArMode(params.get("ar") === "true");
  }, []);

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


  return <>
    <aside className="PanelInicial" ref={useCharger}>
      {/* Background Spline Scene */}
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

      {/* Top Content (Progress Bar & Button) */}
      <div className="content-top">
        <div className="progress">
          {/* Barra de progreso */}
          <div style={fillerStyles} className="progressBar" ref={progressBar}>
            <span style={labelStyles}>{`${displayProgress}%`}</span>
          </div>
        </div>
        <div className="optionI" id="inicio" onClick={Start}>
          <div className="imagen">
            {isArMode 
              ? (idioma === "en" ? "Project in AR" : "Proyectar en AR")
              : (idioma === "en" ? "Start" : "Iniciar")
            }
          </div>
        </div>
      </div>
    </aside>

  </>
}