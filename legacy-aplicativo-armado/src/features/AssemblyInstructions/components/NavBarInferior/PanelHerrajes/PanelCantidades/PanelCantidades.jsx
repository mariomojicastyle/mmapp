import useEnviroment from "../../../../hooks/useEnviroment";
import { useEffect, useState } from "react";
import "./PanelCantidades.css";

export default function PanelCantidades({ id, data }) {
  const pasoInicial = useEnviroment((state) => state.pasoInicial);
  const PanelCantidadesState = useEnviroment((state) => state.PanelCantidades);

  const [cantidades, setCantidades] = useState([]);

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

  // Recolectar la información del panel de cantidades del glb P00 de manera declarativa
  useEffect(() => {
    try {
      if (!pasoInicial || Object.keys(pasoInicial).length === 0 || !pasoInicial.traverse) {
        setCantidades([]);
        return;
      }

      const counts = {}; // Cuenta de ocurrencias físicas
      const explicitQuantities = {}; // Cantidades explícitas (ej: Cantidad(4))
      const nombresUnicos = new Set();
      const tempCantidades = [];

      pasoInicial.traverse((child) => {
        try {
          if (!child.name) return;
          const name = child.name;

          // Exclusiones estándar de mallas y elementos comunes del viewport 3D
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

          // Resolver keyName (nombre base del herraje)
          let keyName = name;
          if (name.includes("-")) {
            const characters = name.split("-");
            keyName = characters[0];
          }

          // Ignorar si el keyName es vacío, genérico o pertenece a una pieza del mueble
          if (!keyName || keyName.trim() === "" || keyName.includes("Puerta") || keyName.includes("Cajon")) return;

          // Incrementar ocurrencias físicas
          counts[keyName] = (counts[keyName] || 0) + 1;

          // Buscar si el nombre del nodo contiene explícitamente el patrón Cantidad(X)
          const matchCantidad = name.match(/Cantidad\((\d+)\)/i);
          if (matchCantidad) {
            explicitQuantities[keyName] = matchCantidad[1];
          }

          nombresUnicos.add(keyName);
        } catch (childErr) {
          console.error("Error procesando nodo de herraje:", childErr);
        }
      });

      // Construir la lista de cantidades consolidadas de forma reactiva
      nombresUnicos.forEach((keyName) => {
        const cantidadFinal = explicitQuantities[keyName] !== undefined 
          ? explicitQuantities[keyName] 
          : String(counts[keyName]);

        tempCantidades.push({
          displayName: keyName,
          value: keyName,
          cantidad: cantidadFinal,
          imageUrl: getHerrajeImageUrl(keyName)
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
        {/* Título en texto real con el mismo estilo */}
        <h2 className="menu-title">Cantidades Totales de Herrajes</h2>

        {/* Listado declarativo de indicaciones de herrajes con imagen, nombre y cantidad total */}
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

