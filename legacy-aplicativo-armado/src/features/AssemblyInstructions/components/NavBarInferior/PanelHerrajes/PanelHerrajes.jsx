import { useEffect, useState } from "react";
import useEnviroment from "../../../hooks/useEnviroment";
import "./PanelHerrajes.css";

export default function PanelHerrajes() {
  const model = useEnviroment((state) => state.model);
  const PanelShow = useEnviroment((state) => state.PanelShow);
  const NegativePanel = useEnviroment((state) => state.NegativePanel);
  const btnCerrarFalse = useEnviroment((state) => state.btnCerrarFalse);
  const PasoActual = useEnviroment((state) => state.pasoActual);
  const PanelCantidadesTrue = useEnviroment((state) => state.PanelCantidadesTrue);
  const NameTooltip = useEnviroment((state) => state.NameTooltip);

  const HandExiste = useEnviroment((state) => state.HandToolExist);
  const HandExisteTrue = useEnviroment((state) => state.HandExistTrue);
  const CloudOneTime = useEnviroment((state) => state.CloudOneTime);
  const CloudOneTimeFalse = useEnviroment((state) => state.CloudOneTimeFalse);
  const StartApp = useEnviroment((state) => state.StartApp);

  const [herrajes, setHerrajes] = useState([]);
  const [tutorialOpacity, setTutorialOpacity] = useState(0);

  // Se realiza un recorrido por el modelo para extraer los nombres de las piezas y herrajes de manera declarativa.
  useEffect(() => {
    if (!model || Object.keys(model).length === 0 || !model.traverse) {
      setHerrajes([]);
      return;
    }

    const tempHerrajes = [];
    const nombresUnicos = new Set();

    model.traverse((child) => {
      if (!child.name) return;
      const name = child.name;

      // Exclusiones de elementos comunes 3D que no son herrajes o piezas utilizables
      if (
        name.includes("Scene") ||
        name.includes("Capa") ||
        name.includes("Camera") ||
        name.includes("Collection") ||
        name.includes("Plane") ||
        name.includes("Texto") ||
        name.includes("Text")
      ) {
        return;
      }

      if (PasoActual === "00") {
        // En el paso 00 se extraen las cantidades y se excluyen nombres genéricos de Piezas
        if (name.includes("Pieza")) return;

        let keyName = name;
        let cantidad = "";

        if (name.includes("-")) {
          const characters = name.split("-");
          keyName = characters[0];
          cantidad = characters[2] || "";
        }

        if (!nombresUnicos.has(keyName)) {
          nombresUnicos.add(keyName);
          tempHerrajes.push({
            displayName: keyName,
            value: name,
            cantidad: cantidad,
            imageUrl: `/assets/herrajes/${keyName}.jpg`
          });
        }
      } else {
        // En pasos de armado se extraen los herrajes necesarios activos
        if (
          name.includes("Puerta") ||
          name.includes("Cajon") ||
          name.includes("Pieza")
        ) {
          return;
        }

        if (name.includes("-")) {
          const characters = name.split("-");
          // Filtramos únicamente aquellos marcados con numeral en el paso actual
          if (characters[1] && characters[1].includes("#")) {
            const keyName = characters[0];
            if (!nombresUnicos.has(keyName)) {
              nombresUnicos.add(keyName);
              tempHerrajes.push({
                displayName: keyName,
                value: name,
                imageUrl: `/assets/herrajes/${keyName}.jpg`
              });
            }
          }
        } else {
          if (!nombresUnicos.has(name)) {
            nombresUnicos.add(name);
            tempHerrajes.push({
              displayName: name,
              value: name,
              imageUrl: `/assets/herrajes/${name}.jpg`
            });
          }
        }
      }
    });

    setHerrajes(tempHerrajes);
  }, [model, PasoActual]);

  // Manejador del ciclo de vida del tutorial visual (nubes y manos guía)
  useEffect(() => {
    if (PanelShow && CloudOneTime) {
      setTutorialOpacity(1);

      const timer = setTimeout(() => {
        setTutorialOpacity(0);
      }, 5000);

      CloudOneTimeFalse();

      // Si el paso no tiene herrajes particulares y no se ha mostrado la guía de cantidades, registramos el flag
      if (herrajes.length === 0 && !HandExiste) {
        HandExisteTrue();
      }

      return () => clearTimeout(timer);
    }
  }, [PanelShow, CloudOneTime, herrajes, HandExiste, CloudOneTimeFalse, HandExisteTrue]);

  const ShowPanelCantidades = () => {
    PanelCantidadesTrue();
  };

  const Tooltip = (val) => {
    NegativePanel();
    btnCerrarFalse();
    // Guardamos en el store global para resaltar el elemento correspondiente en la escena 3D
    NameTooltip(val);
  };

  return (
    <>
      <aside className={`panel ${PanelShow ? "is-active" : ""}`}>
        <nav className="menu">
          {herrajes.map((herraje, index) => (
            <div
              key={herraje.value}
              className="option"
              onClick={() => Tooltip(herraje.value)}
            >
              {herraje.displayName}
              <div
                className="imagen"
                style={{
                  backgroundImage: `url(${herraje.imageUrl})`
                }}
              ></div>
              {herraje.cantidad && <p className="cantidad">{herraje.cantidad}</p>}

              {/* Imagen autolocalizada en el primer item de ayuda si corresponde */}
              {index === 0 && StartApp && (
                <img
                  src="/assets/ayudas/07_Localizar_Herrajes.svg"
                  alt=""
                  style={{
                    opacity: tutorialOpacity,
                    pointerEvents: "none"
                  }}
                />
              )}
            </div>
          ))}
        </nav>

        {/* Botón flotante para ver cantidades totales de herrajes */}
        <div id="cantidades" className="option4">
          <div
            className="imagen"
            style={{
              backgroundImage: "url(/assets/tips/Cantidades_Totales_de_Herrajes.svg)"
            }}
            onClick={ShowPanelCantidades}
          >
            {/* Mano animada autolocalizada si no hay herrajes específicos en el paso */}
            {herrajes.length === 0 && StartApp && (
              <img
                src="/assets/ayudas/hand_tool.svg"
                alt=""
                style={{
                  opacity: tutorialOpacity,
                  pointerEvents: "none"
                }}
              />
            )}
          </div>
        </div>
      </aside>
    </>
  );
}

