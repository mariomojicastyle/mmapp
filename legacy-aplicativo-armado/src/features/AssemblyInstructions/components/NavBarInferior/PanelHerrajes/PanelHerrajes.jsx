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

  // Resuelve la imagen del herraje a través del proxy de Vite.
  // Cadena de resolución: {manualId}/herrajes/ → _herrajes_compartidos/ → /assets/herrajes/
  const getHerrajeImageUrl = (keyName) => {
    if (data?.isDynamicCMS && Array.isArray(data?.fotosHerrajesList)) {
      const keyLower = keyName.toLowerCase();
      const matchedFile = data.fotosHerrajesList.find(file => {
        const cleanFile = file.startsWith('_shared:') ? file.replace('_shared:', '') : file;
        const baseName = cleanFile.substring(0, cleanFile.lastIndexOf('.')) || cleanFile;
        return baseName.toLowerCase() === keyLower;
      });

      if (matchedFile) {
        if (matchedFile.startsWith('_shared:')) {
          const realName = matchedFile.replace('_shared:', '');
          return `/assets/herrajes_compartidos/${realName}`;
        }
        return `/${id}/herrajes/${matchedFile}`;
      }
    }
    return null;
  };

  // Replica exacta de la función del modal para limpiar nombres de mallas 3D.
  // Garantiza que el nombre mostrado sea IDÉNTICO al del despiece en la plataforma.
  const limpiarNombreMalla = (rawName) => {
    if (!rawName) return "";
    
    // 1. Obtener la primera sección (antes de cualquier "-") y limpiar
    let name = rawName.split("-")[0].trim();
    name = name.split(".")[0];
    
    // 2. Regla inteligente del guion bajo
    const parts2 = name.split("_");
    const resultParts = [];
    let codeCount = 0;
    
    for (let i = 0; i < parts2.length; i++) {
      const part = parts2[i];
      const isPureText = !/\d/.test(part);
      
      if (isPureText) {
        resultParts.push(part);
      } else {
        if (codeCount === 0) {
          if (/^\d+$/.test(part)) {
            const num = parseInt(part, 10);
            const isInstance = num < 100 || (part.length === 4 && part.substring(1, 3) === "00");
            if (isInstance) {
              continue;
            }
          }
          resultParts.push(part);
          codeCount++;
        } else {
          break;
        }
      }
    }
    name = resultParts.join("_");

    // 3. Curación de sufijos de Blender (ej. "Bisagra_20040001" → "Bisagra_20040")
    name = name.replace(/[._]?0\d\d$/i, "");
    name = name.replace(/_$/, "");
    
    // 4. Limpieza de sufijos de materiales
    const sufijosMat = ["_BALANCE", "_TAPA", "_CANTO", "_LAMINADO", " BALANCE", " TAPA", " CANTO", " LAMINADO"];
    let upperName = name.toUpperCase();
    for (const suf of sufijosMat) {
      if (upperName.endsWith(suf)) {
        name = name.substring(0, name.length - suf.length);
        upperName = name.toUpperCase();
      }
    }
    
    // 5. Regla específica para PERNO_ con espacio
    if (name.toUpperCase().startsWith("PERNO_") && name.includes(" ")) {
      name = name.split(" ")[0];
    }
    
    return name;
  };

  // Detecta si un nombre limpio corresponde a un herraje usando palabras clave
  const esHerrajeConocido = (nombreLimpio) => {
    if (!nombreLimpio) return false;
    const lower = nombreLimpio.toLowerCase();
    // Exclusiones: nunca son herrajes
    if (lower.startsWith("tapaluz") || lower.includes("fondo") || lower.includes("posterior")) return false;
    // Inclusiones especiales
    if (lower.startsWith("caja") || lower.startsWith("puntilla")) return true;
    if (/^\d+$/.test(nombreLimpio)) return true;
    // Palabras clave genéricas
    return /tornillo|perno|tarugo|bisagra|deslizador|corredera|soporte|clavo|tapa|minifix|cama|perfil|regula|patin|pivote|tuerca|arandela|jaladera|tirador|pija|angulo|union|mensula|mariposa/i.test(nombreLimpio);
  };

  // Se realiza un recorrido por el modelo para extraer SOLO herrajes (NO piezas de madera).
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

      // Exclusiones de elementos comunes 3D
      if (
        name.includes("Scene") ||
        name.includes("Capa") ||
        name.includes("Camera") ||
        name.includes("Collection") ||
        name.includes("Plane") ||
        name.includes("Texto") ||
        name.includes("Text") ||
        name.includes("Pieza")
      ) {
        return;
      }

      let cantidad = "";
      if (name.includes("-")) {
        const characters = name.split("-");
        cantidad = characters[2] || "";
      }

      // Aplicar la misma limpieza que el modal para obtener el nombre canónico
      const cleanName = limpiarNombreMalla(name);
      if (!cleanName || !esHerrajeConocido(cleanName)) return;

      if (PasoActual === "00") {
        if (!nombresUnicos.has(cleanName)) {
          nombresUnicos.add(cleanName);
          tempHerrajes.push({
            displayName: cleanName,
            value: name,
            cantidad: cantidad,
            imageUrl: getHerrajeImageUrl(cleanName)
          });
        }
      } else {
        // En pasos de armado: mostrar herrajes activos (con marcador # o sin guión)
        if (name.includes("-")) {
          const characters = name.split("-");
          if (characters[1] && characters[1].includes("#")) {
            if (!nombresUnicos.has(cleanName)) {
              nombresUnicos.add(cleanName);
              tempHerrajes.push({
                displayName: cleanName,
                value: name,
                imageUrl: getHerrajeImageUrl(cleanName)
              });
            }
          }
        } else {
          if (!nombresUnicos.has(cleanName)) {
            nombresUnicos.add(cleanName);
            tempHerrajes.push({
              displayName: cleanName,
              value: name,
              imageUrl: getHerrajeImageUrl(cleanName)
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
              {herraje.imageUrl && (
                <div
                  className="imagen"
                  style={{
                    backgroundImage: `url(${herraje.imageUrl})`
                  }}
                ></div>
              )}
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

