import './PanelInicial.css';
import { Html, useProgress, useGLTF } from '@react-three/drei'
import { useRef } from 'react';
import { useEffect } from 'react';
import useEnviroment from '../../../hooks/useEnviroment';


export default function PanelInicial() {
  //Hook progress, utilizado para conocer el progreso de carga del aplicativo
  const { active, item, loaded, total, progress } = useProgress();
  const useCharger = useRef(null);
  const progressBar = useRef(null);
  
  const StartAppTrue = useEnviroment((state) => state.StartAppTrue);
  const icono = useEnviroment((state) => state.icono);


  const fillerStyles = {
    height: '100%',
    width: `${progress}%`,
    backgroundColor:"#f28f1d",
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
    if (progressBar.current.style.width == "100%") {
      window.setTimeout(() => {
        document.getElementById("inicio").style.display = "flex";
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
        <span style={labelStyles}>{`${progress}%`}</span>
      </div>
    </div>
    </aside>

  </>
}