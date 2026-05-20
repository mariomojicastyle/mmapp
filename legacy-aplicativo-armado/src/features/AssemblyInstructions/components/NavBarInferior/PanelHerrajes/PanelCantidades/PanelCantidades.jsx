import useEnviroment from "../../../../hooks/useEnviroment";
import { useEffect, useState } from "react";
import "./PanelCantidades.css";

export default function PanelCantidades() {
  const pasoInicial = useEnviroment((state) => state.pasoInicial);
  const PanelCantidadesState = useEnviroment((state) => state.PanelCantidades);

  const [cantidades, setCantidades] = useState([]);

  // Recolectar la información del panel de cantidades del glb P00 de manera declarativa
  useEffect(() => {
    if (!pasoInicial || Object.keys(pasoInicial).length === 0 || !pasoInicial.traverse) {
      setCantidades([]);
      return;
    }

    const tempCantidades = [];
    const nombresUnicos = new Set();

    pasoInicial.traverse((child) => {
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
        const cantidad = characters[2] || "";

        // Solo se muestran elementos que tienen una cantidad especificada
        if (cantidad !== "") {
          if (!nombresUnicos.has(keyName)) {
            nombresUnicos.add(keyName);
            tempCantidades.push({
              displayName: keyName,
              value: name,
              cantidad: cantidad,
              imageUrl: `/assets/herrajes/${keyName}.jpg`
            });
          }
        }
      }
    });

    setCantidades(tempCantidades);
  }, [pasoInicial]);

  return (
    <>
      <aside className={`panel3 ${PanelCantidadesState ? "is-active" : ""}`}>
        {/* Opción que funciona como título */}
        <div className="option4">
          <div
            className="imagen"
            style={{
              backgroundImage: "url(/assets/tips/Cantidades_Totales_de_Herrajes.svg)"
            }}
          ></div>
        </div>

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
              <p className="cantidad">{item.cantidad}</p>
            </div>
          ))}
        </nav>
      </aside>
    </>
  );
}

