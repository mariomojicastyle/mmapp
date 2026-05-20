import { useEffect, useRef } from "react";
import useEnviroment from "../../../hooks/useEnviroment";
import "./RealidadAumentada.css"
export default function RealiadaAumentada({ id }) {

  const pasoActual = useEnviroment((state) => state.pasoActual);
  const Cliente = useEnviroment((state) => state.Cliente);
  const refAr = useRef(null);
  
  //Apenas inicia el aplicativo, se agrega la ruta del paso 00.
  useEffect(()=>{
    refAr.current.src=`/${id}/models/P00.glb`;
  },[])

  useEffect(() => {
    // refAr.current.src= `./${id}/models/P${pasoActual}.glb`
    refAr.current.src = `/${id}/models/P${pasoActual}.glb`;

  }, [pasoActual,Cliente])

  return <>
    {/* <!-- Boton de realidad aumentada, aunque en los dispositivos aparece muy en la parte de abajo, se agregó al contenedor correspondiente a la parte de arriba --> */}

    <div className="AR">
      {/* <!-- Etiqueta de model viewer, con ayuda de esta etiqueta se puede usar el ambiente de realidad aumentada, se configura el modo de visualización, el modelo incial que utilizara, activar los controles, etc. --> */}
      <model-viewer ar ar-modes="scene-viewer webxr quick-look" camera-controls
        bounds="tight" alt="Maderkit" autoplay ref={refAr}>

        {/* <!-- Esta sesion corresponde al boton de realidad aumentada, dicho boton esta ubicado por encima del visualizador de model viewer, si comenta este boton, podra darse cuenta que detras de el, hay una pequeña escena de model viewer, todo el diseño del boto esta incrustrado en html, debido que es la unica forma en que model viewer tome los cambios--> */}
        <button slot="ar-button"
          style={{
            backgroundColor: "white",
            width: "100%",
            height: "100%",
            borderRadius: "50%",
            border: "none",
          }}>
          <span className="material-symbols-outlined" style={{ color: "#f28f1d" }}>
            view_in_ar_new
          </span>
        </button>

      </model-viewer>
    </div>
  </>
}