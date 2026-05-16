import { useEffect, useRef, useState } from "react";
import useEnviroment from "../../../../hooks/useEnviroment";
import "./FormularioEncuesta.css";

export default function FormularioEncuesta() {
  const ActivarEncuesta = useEnviroment((state) => state.ActivarEncuesta);
  const ToogleEncuesta = useEnviroment((state) => state.ToogleEncuesta);
  const EncuestaCompletadaTrue = useEnviroment(
    (state) => state.EncuestaCompletadaTrue
  );

  const form = useRef();

  const Pantalla1 = document.querySelector(".Pantalla1");
  const Pantalla2 = document.querySelector(".Pantalla2");
  const Pantalla3 = document.querySelector(".Pantalla3");
  const Pantalla4 = document.querySelector(".Pantalla4");
  const Pantalla5 = document.querySelector(".Pantalla5");


  const inputs = document.querySelectorAll(".Pantalla1 .encuesta  input");
  const scriptURL =
     "https://script.google.com/macros/s/AKfycbxeTJB9DsluXMtHRvyCO-gfiR8pCtKD48UX_EjHEgK1EOFHEF8yv-cfJNHPjC7iompxtA/exec"
    //"https://script.google.com/macros/s/AKfycbwQj3w7B_Bgcroqce31V2Upwe3oCsZ-VC0zVCWNVVQG2hFJ3enN-p-EvrVvE1ko7NQEkw/exec";

  const [isChecked, setIsChecked] = useState(false);

  const handleCheckboxChange = (event) => {
    setIsChecked(event.target.checked);
  };

  const textarea = document.querySelector('textarea[name="Pregunta3"]');

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log(e);
    fetch(scriptURL, { method: "POST", body: new FormData(e.target) })
      .then(() => {
        Pantalla4.style.display = "none";

        ToogleEncuesta(false);
      })

      .catch((error) => console.error("Error!", error.message));
  };

  //Función encargada de cambiar la Pantalla1 a la 2 
  const IniciarEncuesta = () => {

    // Se valida que todos los campos sean rellenados
    let allInputsFilled = true;
    inputs.forEach((input) => {
      // Check if the input value is empty
      if (input.value === "") {
        allInputsFilled = false;
      }
    });

    // Check if all input values are filled
    if (allInputsFilled) {
      if (isChecked) {
        Pantalla1.style.display = "none";
        Pantalla2.style.display = "flex";
      } else {
        alert("Por favor acepta los términos y condiciones.");
      }
    } else {
      alert("Llenar todos los espacios, por favor.");
    }
  };

  //Función encargada de cambiar la Pantalla2 a la 3 
  const continuar = () => {
    const selectedOption = document.querySelector(
      'input[name="Pregunta1"]:checked'
    );
    if (selectedOption != null) {
      Pantalla2.style.display = "none";
      Pantalla3.style.display = "flex";
      window.scroll(0, 0);
    } else {
      alert("Seleccione una respuesta, por favor");
    }
  };

  //Función encargada de cambiar la Pantalla3 a la 4 

  const continuar2 = () => {
    const selectedOption = document.querySelector(
      'input[name="Pregunta2"]:checked'
    );
    if (selectedOption != null) {
      Pantalla3.style.display = "none";
      Pantalla4.style.display = "flex";
      window.scroll(0, 0);
    } else {
      alert("Seleccione una respuesta, por favor");
    }
  };

  //Función encargada de cambiar la Pantalla4 a la 5 
  const terminar = () => {
    if (textarea.value != "") {
      Pantalla4.style.display = "none";
      Pantalla5.style.display = "flex";
      EncuestaCompletadaTrue();
    }
  };

  return (
    <>
    {/* El Panel 6, contiene todo el formulario de la encuesta  */}
      <aside className={`Panel6 ${ActivarEncuesta ? "is-active" : ""}`}>
        <div className="rating">
          {/* El formulario es dividido en 5 pantallas, para mostrar las diferentes preguntas */}
          <form
            className="formulario"
            name="google-sheet"
            ref={form}
            onSubmit={handleSubmit}
          >
            <div className="Pantalla1">
              <div className="titulo">
                <div className="conTitulo">
                  <div className="titles">
                    <h1>¿Cómo va tu armado?</h1>
                    <h1>¡Responde y gana!</h1>
                  </div>
                  <div className="LogoM2">
                    <img
                      src="https://3dymedios.com/Prueba/AP/Recursos/Iconos/Logo_Maderkit_blanco.svg"
                      alt=""
                    />
                  </div>
                </div>
              </div>
              <div className="encuesta">
                <div className="conEncuesta">
                  <p>
                    Deseamos saber tu opinión y te invitamos a completar una
                    encuesta, que te tomara 2 minutos y podrás ganar uno de
                    nuestros muebles.
                  </p>
                  <p>¿Vamos?</p>
                  <input
                    type="text"
                    className="inputI"
                    name="Nombre"
                    required
                    placeholder="Nombre Completo"
                  />
                  <input
                    className="inputI"
                    name="Telefono"
                    type="number"
                    required
                    placeholder="# de contacto"
                  />
                  <input
                    className="inputI"
                    name="Correo"
                    type="email"
                    required
                    placeholder="Email"
                  />
                  <div className="Terminos">
                    <input
                      type="checkbox"
                      name="Terminos"
                      value="aceptados"
                      required
                      checked={isChecked}
                      onChange={handleCheckboxChange}
                    />
                    He leído y acepto las politicas de privacidad
                  </div>
                  <div className="iniciar" onClick={IniciarEncuesta}>
                    ¡Iniciar Encuesta!
                  </div>
                </div>

              </div>
              <div className="titulo">
                <p>
                  En cumplimiento de la Ley Estatutaria 1581 de 2012, ‘por la cual
                  se dictan disposiciones generales para la protección de datos
                  personales' y sus Decretos reglamentarios 1377 de 2103, ‘por el
                  cual se reglamenta parcialmente la Ley 1581 de 2012, y el
                  decreto 1074 de 2015’ por medio del cual se expide el Decreto
                  Único Reglamentario del Sector Comercio, Industria y Turismo, y
                  demás normas concordantes, se informa al titular de datos que
                  por medio de su aprobación explícita en el presente formato,
                  está autorizando el tratamiento de sus datos personales
                  consignados en el presente formulario de manera voluntaria, los
                  cuales será incorporados en una base de datos responsabilidad de
                  MADERKIT S.A. El Titular de datos declara haber leído la
                  cláusula anterior y estar conforme con la misma.
                </p>
              </div>
            </div>
            <div className="Pantalla2">
              <div className="titulo">
                <div className="conTitulo">
                  <h1>¿Qué ha sido lo más útil para armar el mueble? </h1>
                </div>
              </div>
              <div className="encuesta">
                <div className="conEncuesta">
                  <div className="opcion">
                    <input
                      type="radio"
                      name="Pregunta1"
                      value="La voz guía."
                      id="rate-5"
                    />
                    <label htmlFor="rate-5">La voz guía.</label>
                  </div>
                  <div className="opcion">
                    <input
                      type="radio"
                      name="Pregunta1"
                      value="La visualización de las partes y accesorios del mueble."
                      id="rate-4"
                    />
                    <label htmlFor="rate-4">
                      La visualización de las partes y accesorios del mueble.
                    </label>
                  </div>

                  <div className="opcion">
                    <input
                      type="radio"
                      name="Pregunta1"
                      value="La descripción de cada boton."
                      id="rate-3"
                    />
                    <label htmlFor="rate-3">La descripción de cada botón.</label>
                  </div>

                  <div className="opcion">
                    <input
                      type="radio"
                      name="Pregunta1"
                      value="Poder repetir facilmente cada paso."
                      id="rate-2"
                    />
                    <label htmlFor="rate-2">
                      Poder repetir fácilmente cada paso.
                    </label>
                  </div>

                  <div className="opcion">
                    <input
                      type="radio"
                      name="Pregunta1"
                      value="Los colores de la representación."
                      id="rate-1"
                    />
                    <label htmlFor="rate-1">
                      Los colores de la representación.
                    </label>
                  </div>

                  <div className="opcion">
                    <input
                      type="radio"
                      name="Pregunta1"
                      value="Todas las anteriores."
                      id="rate-0"
                    />
                    <label htmlFor="rate-0">Todas las anteriores.</label>
                  </div>

                  <div className="continuar" onClick={continuar}>
                    Ir a la segunda de tres preguntas
                  </div>
                </div>
              </div>
              <div className="footer">
                <div className="conFooter">
                  <div className="LogoM2">
                    <img
                      src="https://3dymedios.com/Prueba/AP/Recursos/Iconos/Logo_Maderkit_blanco.svg"
                      alt=""
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="Pantalla3">
              <div className="titulo">
                <div className="conTitulo">
                  <h1>
                    ¿Considera positivo que el uso de este manual digital
                    reemplace el manual físico y así aportar a la sostenibilidad
                    del medio ambiente?
                  </h1>
                </div>
              </div>
              <div className="encuesta">
                <div className="conEncuesta">
                  <div className="opcion">
                    <input type="radio" name="Pregunta2" value="Sí" id="Sí" />
                    <label htmlFor="Sí">Sí</label>
                  </div>
                  <div className="opcion">
                    <input type="radio" name="Pregunta2" value="No" id="No" />
                    <label htmlFor="No">No</label>
                  </div>

                  <div className="continuar" onClick={continuar2}>
                    Ir a la última pregunta
                  </div>
                </div>
              </div>
              <div className="footer">
                <div className="conFooter">
                  <div className="LogoM2">
                    <img
                      src="https://3dymedios.com/Prueba/AP/Recursos/Iconos/Logo_Maderkit_blanco.svg"
                      alt=""
                    />
                  </div>
                </div>
              </div>
            </div>
            <div className="Pantalla4">
              <div className="titulo">
                <div className="conTitulo">
                  <h1>
                    Por último, deseamos saber qué opinas de este método para
                    armar tu mueble, ¿nos cuentas?
                  </h1>

                </div>
              </div>
              <div className="encuesta">
                <div className="conEncuesta">
                  <div className="textarea">
                    <textarea
                      name="Pregunta3"
                      cols="45"
                      rows="12"
                      placeholder="Tu opinión..."
                      required
                    ></textarea>
                  </div>

                  <button type="submit" className="Terminar" onClick={terminar}>
                    Terminar
                  </button>
                </div>
              </div>
              <div className="footer">
                <div className="conFooter">
                  <div className="LogoM2">
                    <img
                      src="https://3dymedios.com/Prueba/AP/Recursos/Iconos/Logo_Maderkit_blanco.svg"
                      alt=""
                    />
                  </div>
                </div>
              </div>
            </div>
            <div className="Pantalla5">
              <div className="titulo">
                <div className="conTitulo"></div>
              </div>
              <div className="encuesta">
                <div className="conEncuesta">
                  <h1>¡Gracias por tus comentarios, continúa armando!</h1>
                </div>
              </div>
              <div className="footer">
                <div className="conFooter">
                <div className="LogoM2">
                    <img
                      src="https://3dymedios.com/Prueba/AP/Recursos/Iconos/Logo_Maderkit_blanco.svg"
                      alt=""
                    />
                  </div>
                </div>
              </div>
            </div>
          </form>
        </div>
      </aside>
    </>
  );
}
