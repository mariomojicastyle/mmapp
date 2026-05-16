import { useRef } from "react";
import { useEffect } from "react";
import useEnviroment from "../../../hooks/useEnviroment";
import "./PanelAyudas.css";

export default function PanelAyudas() {
  const PanelAyudas = useEnviroment((state) => state.PanelAyudas);
  const ayuda1 = useEnviroment((state) => state.ayuda1);
  // quitar el tooltip de los colores
  // const ayuda2 = useEnviroment((state) => state.ayuda2);
  const ayuda3 = useEnviroment((state) => state.ayuda3);
  const ayuda4 = useEnviroment((state) => state.ayuda4);
  const ayuda5 = useEnviroment((state) => state.ayuda5);
  const ayuda6 = useEnviroment((state) => state.ayuda6);

  const refAyuda1 = useRef();

  const Ayudas = {
    Indicaciones:
      "https://3dymedios.com/Prueba/AP/Recursos/Ayudas/01_Indicaciones_Herramientas_Garantia.svg",
    // Colores:
    //   "https://3dymedios.com/AA/Recursos/Ayudas/02_Colores_Visualizacion.svg",
    Navegacion:
      "https://3dymedios.com/Prueba/AP/Recursos/Ayudas/03_Navegacion_Armado.svg",
    Busqueda: "https://3dymedios.com/Prueba/AP/Recursos/Ayudas/04_Busqueda.svg",
    PlayPause:
      "https://3dymedios.com/Prueba/AP/Recursos/Ayudas/05_Play_Pausa.svg",
    AR: "https://3dymedios.com/Prueba/AP/Recursos/Ayudas/06_Ver_en_AR.svg",
  };


  //Dependiento del global state de cada ayuda, se va activando su opacidad
  useEffect(() => {
    const ayudas = document.getElementsByClassName("nube");

    if (ayuda1 == true) {
      ayudas[0].style.opacity = 1;
      // if (ayuda2 == true) {
      //   ayudas[1].style.opacity = 1;
        if (ayuda3 == true) {
          ayudas[1].style.opacity = 1;
          if (ayuda4 == true) {
            ayudas[2].style.opacity = 1;
            if (ayuda5 == true) {
              ayudas[3].style.opacity = 1;
              if (ayuda6 == true) {
                ayudas[4].style.opacity = 1;
              }
            }
          }
        }
      }     
  }, [ayuda1,  ayuda3, ayuda4, ayuda5, ayuda6]);

  return (
    <>
      <aside className={`panel4 ${PanelAyudas ? "is-active" : ""}`}>
        <div className="panel4-1">
          <div
            className="ayuda1 nube"
            ref={refAyuda1}
            style={{ backgroundImage: `url(${Ayudas.Indicaciones})` }}
          ></div>

          {/* <div
            className="ayuda2 nube"
            style={{ backgroundImage: `url(${Ayudas.Colores})` }}
          ></div> */}

          <div
            className="ayuda3 nube"
            style={{ backgroundImage: `url(${Ayudas.Navegacion})` }}
          ></div>

          <div
            className="ayuda4 nube"
            style={{ backgroundImage: `url(${Ayudas.Busqueda})` }}
          ></div>

          <div
            className="ayuda5 nube"
            style={{ backgroundImage: `url(${Ayudas.PlayPause})` }}
          ></div>

          <div
            className="ayuda6 nube"
            style={{ backgroundImage: `url(${Ayudas.AR})` }}
          ></div>
        </div>
      </aside>
    </>
  );
}
