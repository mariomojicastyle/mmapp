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

  const [displayProgress, setDisplayProgress] = useState(0);

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
    width: `${progress}%`,
    backgroundColor: "var(--primary)",
    transition: 'width 1s ease-in-out',
    borderRadius: 'inherit',
    textAlign: 'right'
  }

  const labelStyles = {
    padding: 5,
    color: 'white',
    fontWeight: 'bold'
  }

  //Aparece el boton de iniciar, cuando el progreso de carga a llegado al 100%
  useEffect(() => {
    if (progressBar.current && progressBar.current.style.width == "100%") {
      window.setTimeout(() => {
        const inicioBtn = document.getElementById("inicio");
        if (inicioBtn) {
          inicioBtn.style.display = "flex";
        }
      }, 500);
    }
  }, [progress]);
  
  //Se desactiva el panel inicial, y se inicializa el global state de iniciar el aplicativo.
  const Start = () => {
    useCharger.current.style.display = "none";
    StartAppTrue();
  }


  return <>
    <aside className="PanelInicial" ref={useCharger}>
      <div className="optionI" >
        <div className="imagen" style={{backgroundImage:`${icono}`}}></div>
      </div>
      <div className="optionI">
        Sube el volumen para escuchar las instrucciones
      </div>
      <div className="optionI">
        <p>
          Algunos dispositivos no cumplen con los requerimientos mínimos de esta tecnología. Si experimenta algún
          problema luego de iniciar, la solución es intentar con otro móvil o desde un PC.
        </p>
      </div>
      <div className="optionI" id="inicio" onClick={Start}>
        <div className="imagen">Iniciar</div>
      </div>
      <div className="progress">
        {/* Barra de progreso */}
      <div style={fillerStyles} className="progressBar" ref={progressBar}>
        <span style={labelStyles}>{`${displayProgress}%`}</span>
      </div>
    </div>
    </aside>

  </>
}