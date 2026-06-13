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
  const idioma = useEnviroment((state) => state.idioma);

  const texts = {
    es: {
      title: "Toca algún herraje para localizarlo en el 3D",
      totalHardware: "Cantidades Totales de Herrajes",
    },
    en: {
      title: "Tap a hardware piece to locate it in 3D",
      totalHardware: "Total Hardware Quantities",
    }
  };
  const t = idioma === "en" ? texts.en : texts.es;

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

    // 3. Limpieza de sufijos comunes de materiales (ej. Cubierta_balance -> Cubierta)
    // Se ejecuta ANTES que la curación de Blender para que no tape los dígitos finales
    const sufijosMat = ["_BALANCE", "_TAPA", "_CANTO", "_LAMINADO", " BALANCE", " TAPA", " CANTO", " LAMINADO"];
    let upperName = name.toUpperCase();
    for (const suf of sufijosMat) {
      if (upperName.endsWith(suf)) {
        name = name.substring(0, name.length - suf.length);
        upperName = name.toUpperCase();
      }
    }

    // 4. Curación definitiva de sufijos de Blender (ej. "Bisagra_20040001" → "Bisagra_20040")
    name = name.replace(/[._]?0\d\d$/i, "");
    name = name.replace(/_$/, "");
    
    // Regla de blindaje adicional contra códigos de inventario concatenados con números de copia
    // Caso 1: Código de 5 dígitos de herraje (ej. 20020) + 3 dígitos de copia (ej. 006) = 8 dígitos (ej. 20020006)
    name = name.replace(/_(200\d{2})\d{3}$/i, "_$1");
    // Caso 2: Código de 7 dígitos (ej. 0002715) + 3 dígitos de copia (ej. 003) = 10 dígitos (ej. 0002715003)
    name = name.replace(/_(000\d{4})\d{3}$/i, "_$1");
    
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
      if (child.type !== 'Mesh' && !child.isMesh) return;
      
      const rawName = child.name || "";

      // Exclusiones de elementos comunes 3D
      if (
        rawName.includes("Scene") ||
        rawName.includes("Capa") ||
        rawName.includes("Camera") ||
        rawName.includes("Collection") ||
        rawName.includes("Plane") ||
        rawName.includes("Texto") ||
        rawName.includes("Text") ||
        rawName.includes("Pieza")
      ) {
        return;
      }

      let cantidad = "";
      if (rawName.includes("-")) {
        const characters = rawName.split("-");
        cantidad = characters[2] || "";
      }

      // Resolvamos el nombre del herraje priorizando el parent y geometry, igual que en el modal
      let parentName = "";
      if (child.parent && child.parent.type !== 'Scene' && child.parent.name) {
        parentName = child.parent.name;
      }

      let nameToClean = rawName;
      if (parentName && !parentName.toUpperCase().startsWith("PIEZA") && parentName.toLowerCase() !== "scene") {
        nameToClean = parentName;
      } else if (child.geometry && child.geometry.name) {
        nameToClean = child.geometry.name;
      } else if (rawName.includes("_")) {
        const parts = rawName.split("_");
        if (parts[0].toLowerCase().startsWith("pieza")) {
          nameToClean = parts.slice(1).join("_");
        }
      }

      // Ajustar nombres de herrajes en inglés en el listado si corresponde
      // Por ejemplo, para herrajes comunes como Tornillo, Perno, etc., podríamos traducirlos al inglés si idioma === 'en'
      // Pero para mantener la consistencia con el manual físico y las bolsas impresas que suelen tener nombres locales,
      // habitualmente se conserva el displayName tal cual o con traducción opcional. Para este alcance, mantenemos los displayNames.

      // Aplicar la limpieza del nombre
      let cleanName = limpiarNombreMalla(nameToClean);
      if (!cleanName || !esHerrajeConocido(cleanName)) return;

      // BLINDAJE DINÁMICO CONTRA DUPLICADOS USANDO EL DESPIECE OFICIAL (data.despiece)
      if (cleanName && data?.despiece) {
        const herrajesOficiales = data.despiece
          .filter(item => item.esHerraje)
          .map(item => item.nombre);
        
        if (herrajesOficiales.length > 0 && !herrajesOficiales.includes(cleanName)) {
          const coincidencia = herrajesOficiales.find(oficial => {
            if (cleanName.startsWith(oficial)) {
              const resto = cleanName.substring(oficial.length);
              return /^[._]?\d+$/.test(resto);
            }
            return false;
          });
          if (coincidencia) {
            cleanName = coincidencia;
          }
        }
      }

      if (PasoActual === "00") {
        if (!nombresUnicos.has(cleanName)) {
          nombresUnicos.add(cleanName);
          
          let cantidadFinal = "";
          if (data?.despiece && Array.isArray(data.despiece)) {
            const oficial = data.despiece.find(d => d.esHerraje && d.nombre === cleanName);
            if (oficial) {
              cantidadFinal = String(oficial.cantidad);
            }
          }
          
          // Fallback al nombre del nodo si no se encuentra en el despiece
          if (!cantidadFinal) {
            cantidadFinal = cantidad;
          }

          tempHerrajes.push({
            displayName: cleanName,
            value: rawName,
            cantidad: cantidadFinal,
            imageUrl: getHerrajeImageUrl(cleanName)
          });
        }
      } else {
        // En pasos de armado: mostrar herrajes activos (con marcador # o sin guión)
        if (rawName.includes("-")) {
          const characters = rawName.split("-");
          if (characters[1] && characters[1].includes("#")) {
            if (!nombresUnicos.has(cleanName)) {
              nombresUnicos.add(cleanName);
              tempHerrajes.push({
                displayName: cleanName,
                value: rawName,
                imageUrl: getHerrajeImageUrl(cleanName)
              });
            }
          }
        } else {
          if (!nombresUnicos.has(cleanName)) {
            nombresUnicos.add(cleanName);
            tempHerrajes.push({
              displayName: cleanName,
              value: rawName,
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
          <h2 className="menu-title">{t.title}</h2>
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

          {/* Botón flotante premium para ver cantidades totales de herrajes */}
          <div className="option-cantidades-container">
            <button className="option-cantidades-btn" onClick={ShowPanelCantidades}>
              <span className="material-symbols-outlined option-cantidades-icon">inventory</span>
              <span className="option-cantidades-text">{t.totalHardware}</span>
            </button>
          </div>
        </nav>
      </aside>
    </>
  );
}

