import { useEffect, useState } from "react";
import useEnviroment from "../../../hooks/useEnviroment";
import "./PanelHerrajes.css";

export default function PanelHerrajes({ id, data }) {
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

  // Resuelve dinámicamente la imagen de un herraje del CMS si existe en Supabase, o cae al fallback local
  const getHerrajeImageUrl = (keyName) => {
    if (data?.isDynamicCMS && Array.isArray(data?.fotosHerrajesList)) {
      const keyLower = keyName.toLowerCase();
      const matchedFile = data.fotosHerrajesList.find(file => {
        const baseName = file.substring(0, file.lastIndexOf('.')) || file;
        return baseName.toLowerCase() === keyLower;
      });

      if (matchedFile) {
        return `/${id}/herrajes/${matchedFile}`;
      }
    }
    return `/assets/herrajes/${keyName}.jpg`;
  };

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
            imageUrl: getHerrajeImageUrl(keyName)
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
                imageUrl: getHerrajeImageUrl(keyName)
              });
            }
          }
        } else {
          if (!nombresUnicos.has(name)) {
            nombresUnicos.add(name);
            tempHerrajes.push({
              displayName: name,
              value: name,
              imageUrl: getHerrajeImageUrl(name)
            });
          }
        }
      }
    });

    setHerrajes(tempHerrajes);
  }, [model, PasoActual, data, id]);

  // Evitamos mostrar la ayuda en el paso inicial 00 (paso de bienvenida)
  useEffect(() => {
    const pasoInt = parseInt(PasoActual, 10);
    if (PanelShow && CloudOneTime && pasoInt > 0) {
      CloudOneTimeFalse();

      // Si el paso no tiene herrajes particulares y no se ha mostrado la guía de cantidades, registramos el flag
      if (herrajes.length === 0 && !HandExiste) {
        HandExisteTrue();
      }
    }
  }, [PanelShow, CloudOneTime, PasoActual, herrajes.length, HandExiste, CloudOneTimeFalse, HandExisteTrue]);

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
          <h2 className="menu-title">Toca algún herraje para localizarlo en el 3D</h2>
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


            </div>
          ))}
        </nav>

        {/* Botón flotante premium para ver cantidades totales de herrajes */}
        <div className="option-cantidades-container">
          <button className="option-cantidades-btn" onClick={ShowPanelCantidades}>
            <span className="material-symbols-outlined option-cantidades-icon">inventory</span>
            <span className="option-cantidades-text">Cantidades Totales de Herrajes</span>
            

          </button>
        </div>
      </aside>
    </>
  );
}

