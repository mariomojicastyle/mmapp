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

      const tempCantidades = [];
      const nombresUnicos = new Set();

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
            name.includes("Collection")
          ) {
            return;
          }

          if (name.includes("-")) {
            const characters = name.split("-");
            const keyName = characters[0];
            
            // Buscar la palabra "Cantidad" usando una expresión de coincidencia flexible en el nombre completo
            const matchCantidad = name.match(/Cantidad\((\d+)\)/i);
            const cantidad = matchCantidad ? matchCantidad[0] : "";

            // Solo se muestran elementos que tienen una cantidad especificada
            if (cantidad !== "") {
              if (!nombresUnicos.has(keyName)) {
                nombresUnicos.add(keyName);
                tempCantidades.push({
                  displayName: keyName,
                  value: name,
                  cantidad: cantidad,
                  imageUrl: getHerrajeImageUrl(keyName)
                });
              }
            }
          }
        } catch (childErr) {
          console.error("Error procesando nodo de herraje:", childErr);
        }
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

