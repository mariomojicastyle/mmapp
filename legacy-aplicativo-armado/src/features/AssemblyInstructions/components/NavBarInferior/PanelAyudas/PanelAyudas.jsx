import useEnviroment from "../../../hooks/useEnviroment";
import "./PanelAyudas.css";

export default function PanelAyudas() {
  const PanelAyudasState = useEnviroment((state) => state.PanelAyudas);
  const ayuda1 = useEnviroment((state) => state.ayuda1);
  const ayuda3 = useEnviroment((state) => state.ayuda3);
  const ayuda4 = useEnviroment((state) => state.ayuda4);
  const ayuda5 = useEnviroment((state) => state.ayuda5);
  const ayuda6 = useEnviroment((state) => state.ayuda6);

  const Ayudas = {
    Indicaciones: "/assets/ayudas/01_Indicaciones_Herramientas_Garantia.svg",
    Navegacion: "/assets/ayudas/03_Navegacion_Armado.svg",
    Busqueda: "/assets/ayudas/04_Busqueda.svg",
    PlayPause: "/assets/ayudas/05_Play_Pausa.svg",
    AR: "/assets/ayudas/06_Ver_en_AR.svg",
  };

  return (
    <>
      <aside className={`panel4 ${PanelAyudasState ? "is-active" : ""}`}>
        <div className="panel4-1">
          <div
            className="ayuda1 nube"
            style={{
              backgroundImage: `url(${Ayudas.Indicaciones})`,
              opacity: ayuda1 ? 1 : 0,
            }}
          ></div>

          <div
            className="ayuda3 nube"
            style={{
              backgroundImage: `url(${Ayudas.Navegacion})`,
              opacity: ayuda1 && ayuda3 ? 1 : 0,
            }}
          ></div>

          <div
            className="ayuda4 nube"
            style={{
              backgroundImage: `url(${Ayudas.Busqueda})`,
              opacity: ayuda1 && ayuda3 && ayuda4 ? 1 : 0,
            }}
          ></div>

          <div
            className="ayuda5 nube"
            style={{
              backgroundImage: `url(${Ayudas.PlayPause})`,
              opacity: ayuda1 && ayuda3 && ayuda4 && ayuda5 ? 1 : 0,
            }}
          ></div>

          <div
            className="ayuda6 nube"
            style={{
              backgroundImage: `url(${Ayudas.AR})`,
              opacity: ayuda1 && ayuda3 && ayuda4 && ayuda5 && ayuda6 ? 1 : 0,
            }}
          ></div>
        </div>
      </aside>
    </>
  );
}

