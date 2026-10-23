import { ParametrosCompiladorModo } from "../modosTypes";
import { compilarInsercionCajonesPaso } from "../../insercionCajonesKinematics";

/**
 * 📥 Modo 4: Incorporaciones (Bloques Funcionales) — Versión 1.0 (Estable Certificada)
 * Deslizamiento, aproximación y acople en rieles de sub-módulos completos ya ensamblados
 * (cajones, gavetas, puertas corredizas) hacia el casco del mueble.
 */
export function compilarIncorporaciones_v1(params: ParametrosCompiladorModo): void {
  const { rootScene, sceneMeshes, sceneObjects, paso, duracionPaso, tracks, todosLosPasos, pasoP00 } = params;
  
  let p00Efectivo = pasoP00;
  if (!p00Efectivo && todosLosPasos) {
    p00Efectivo = todosLosPasos.find((p) => p.id === "P00" || p.tipo === "showcase") || null;
  }

  compilarInsercionCajonesPaso(
    rootScene,
    sceneMeshes,
    sceneObjects,
    paso,
    duracionPaso,
    tracks,
    p00Efectivo
  );
}
