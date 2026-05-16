import { useRef } from "react";
import { useEffect } from "react";
import useEnviroment from "../../../hooks/useEnviroment";
import FormularioEncuesta from "./FormularioEncuesta/FormularioEncuesta.jsx";
import "./PanelEncuesta.css";
export default function PanelEncuesta() {
  const EncuestaMitad = useEnviroment((state) => state.EncuestaMitad);
  const EncuestaFinal = useEnviroment((state) => state.EncuestaFinal);
  const ToogleEncuesta = useEnviroment((state) => state.ToogleEncuesta);

  const refEncuesta = useRef();

  const closeBtn = () => {
    refEncuesta.current.style.display = "none";
    refEncuesta.current.style.opacity = 0;
    return false;
  };
  //Si el usuario decide calificar la experiencia, se modifica el estado, para activar el panel de la encuesta.
  const btnEnviar = () => {
    ToogleEncuesta(true);
    refEncuesta.current.style.display = "none";
    return false;
  };

  //Se activa el panel encuesta en la pantalla, si el aplicativo se encuentra por primera vez, en la mitad del armado o en el paso final.
  useEffect(() => {
    if (EncuestaMitad) {
      refEncuesta.current.style.display = "flex";
      setTimeout(() => {
        refEncuesta.current.style.opacity = 1;
      }, 1000);
    }
    if (EncuestaFinal) {
      refEncuesta.current.style.display = "flex";
      setTimeout(() => {
        refEncuesta.current.style.opacity = 1;
      }, 1000);
    }
  }, [EncuestaMitad, EncuestaFinal]);

  return (
    <>
      {/* Pantalla que muestra un iframe de la encuesta */}
      <aside className="panel5" ref={refEncuesta}>
        <div className="screen1">
          <div className="title">
            <div className="titles" > 
                <h1>¿Cómo va tu armado?</h1>
                <h1>¡Responde y gana!</h1>
            </div>
            <div className="LogoM">
              <img src="https://3dymedios.com/Prueba/AP/Recursos/Iconos/Logo_Maderkit_blanco.svg" alt="" />
            </div>
            <div className="close" onClick={closeBtn}>
              <span className="material-symbols-outlined">close</span>

            </div>
          </div>
          <div className="survey" onClick={btnEnviar}>
            <p>
              Deseamos conocer tu opinión. Te invitamos a completar la siguiente
              encuesta, te tomará 2 minutos y podrás ganar uno de nuestros
              muebles.
            </p>
            <p>¿Vamos?</p>
            <input
              type="text"
              className="input"
              name="Nombre"
              required
              placeholder="Nombre Completo"
              disabled
            />
            <input
              className="input"
              name="Telefono"
              type="number"
              required
              placeholder="# de contacto"
              disabled
            />
            <input
              className="input"
              name="Correo"
              type="email"
              required
              placeholder="Email"
              disabled
            />
            <div className="Terms">
              <input
                type="checkbox"
                name="Terminos"
                value="aceptados"
                required
                disabled
              />
              He leído y acepto las politicas de privacidad
            </div>
            <div className="start">¡Iniciar Encuesta!</div>
          </div>
          <div className="down" onClick={btnEnviar}>
            En cumplimiento de la Ley Estatutaria 1581 de 2012, ‘por la cual se
            dictan disposiciones generales para la protección de datos
            personales' y sus Decretos reglamentarios 1377 de 2103, ‘por el cual
            se reglamenta parcialmente la Ley 1581 de 2012, y el decreto 1074 de
            2015’ por medio del cual se expide el Decreto Único Reglamentario
            del Sector Comercio, Industria y Turismo, y demás normas
            concordantes, se informa al titular de datos que por medio de su
            aprobación explícita en el presente formato, está autorizando el
            tratamiento de sus datos personales consignados en el presente
            formulario de manera voluntaria, los cuales será incorporados en una
            base de datos responsabilidad de MADERKIT S.A. El Titular de datos
            declara haber leído la cláusula anterior y estar conforme con la
            misma.
          </div>
        </div>

      </aside>
    </>
  );
}
