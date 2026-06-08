import useEnviroment from "../../../../hooks/useEnviroment";
import { useEffect, useState } from "react";
import "./PanelCantidades.css";

export default function PanelCantidades({ id, data }) {
  const pasoInicial = useEnviroment((state) => state.pasoInicial);
  const PanelCantidadesState = useEnviroment((state) => state.PanelCantidades);

  const [cantidades, setCantidades] = useState([]);

  // Resuelve la imagen del herraje a través del proxy de Vite.
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
    if (lower.startsWith("tapaluz") || lower.includes("fondo") || lower.includes("posterior")) return false;
    if (lower.startsWith("caja") || lower.startsWith("puntilla")) return true;
    if (/^\d+$/.test(nombreLimpio)) return true;
    return /tornillo|perno|tarugo|bisagra|deslizador|corredera|soporte|clavo|tapa|minifix|cama|perfil|regula|patin|pivote|tuerca|arandela|jaladera|tirador|pija|angulo|union|mensula|mariposa/i.test(nombreLimpio);
  };

  // Recolectar la información del panel de cantidades del glb P00 o directamente del despiece del modal
  useEffect(() => {
    try {
      // Fuente primaria: Despiece configurado en el modal (nombres EXACTOS del modal)
      if (data?.despiece && Array.isArray(data.despiece) && data.despiece.some(d => d.esHerraje)) {
        const tempCantidades = [];
        const nombresVistos = new Set();
        
        data.despiece
          .filter(d => d.esHerraje && d.nombre)
          .forEach(d => {
            const cleanName = d.nombre.split("-")[0].trim();
            if (!nombresVistos.has(cleanName)) {
              nombresVistos.add(cleanName);
              tempCantidades.push({
                displayName: cleanName,
                value: cleanName,
                cantidad: String(d.cantidad || 0),
                imageUrl: getHerrajeImageUrl(cleanName)
              });
            }
          });
          
        setCantidades(tempCantidades);
        return;
      }

      // Fallback: Recorrido del GLB inicial (P00.glb) con limpiarNombreMalla
      if (!pasoInicial || Object.keys(pasoInicial).length === 0 || !pasoInicial.traverse) {
        setCantidades([]);
        return;
      }

      const counts = {};
      const explicitQuantities = {};
      const nombresUnicos = new Set();
      const tempCantidades = [];

      pasoInicial.traverse((child) => {
        try {
          if (!child.name) return;
          const name = child.name;

          if (
            name.includes("Scene") ||
            name.includes("Capa") ||
            name.includes("Camera") ||
            name.includes("Texto") ||
            name.includes("Pieza") ||
            name.includes("Collection") ||
            name.includes("Plane") ||
            name.includes("Text")
          ) {
            return;
          }

          // Aplicar la misma limpieza que el modal
          const cleanName = limpiarNombreMalla(name);
          if (!cleanName || !esHerrajeConocido(cleanName)) return;

          counts[cleanName] = (counts[cleanName] || 0) + 1;

          const matchCantidad = name.match(/Cantidad\((\d+)\)/i);
          if (matchCantidad) {
            explicitQuantities[cleanName] = matchCantidad[1];
          }

          nombresUnicos.add(cleanName);
        } catch (childErr) {
          console.error("Error procesando nodo de herraje:", childErr);
        }
      });

      nombresUnicos.forEach((cleanName) => {
        const cantidadFinal = explicitQuantities[cleanName] !== undefined 
          ? explicitQuantities[cleanName] 
          : String(counts[cleanName]);

        tempCantidades.push({
          displayName: cleanName,
          value: cleanName,
          cantidad: cantidadFinal,
          imageUrl: getHerrajeImageUrl(cleanName)
        });
      });

      setCantidades(tempCantidades);
    } catch (err) {
      console.error("Error crítico recopilando cantidades:", err);
    }
  }, [pasoInicial, data, id]);

  return (
    <>
      <aside className={`panel3 ${PanelCantidadesState ? "is-active" : ""}`}>
        <h2 className="menu-title">Cantidades Totales de Herrajes</h2>

        <nav className="menu3">
          {cantidades.map((item) => (
            <div key={item.value} className="option3">
              <div>
                <p className="cantidad">{item.displayName}</p>
                <div
                  className="imagen"
                  style={{
                    backgroundImage: `url(${item.imageUrl})`
                  }}
                ></div>
              </div>
              <p className="cantidad">{item.cantidad ? item.cantidad.replace(/Cantidad\((\d+)\)/i, "$1").replace(/[()]/g, "").trim() : ""}</p>
            </div>
          ))}
        </nav>
      </aside>
    </>
  );
}
