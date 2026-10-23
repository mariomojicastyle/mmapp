import { ParametrosCompiladorModo } from "../modosTypes";
import { compilarShowcaseP00 } from "../../showcaseKinematics";

/**
 * 🎬 Modo 1: Presentación Funcional (Showcase) — Versión 1.0 (Estable Certificada)
 * Demostración interactiva de apertura sincronizada de cajones, puertas y giro 360° del producto armado.
 */
export function compilarPresentacion_v1(params: ParametrosCompiladorModo): void {
  const { rootScene, sceneMeshes, sceneObjects, paso, duracionPaso, tracks } = params;
  compilarShowcaseP00(rootScene, sceneMeshes, sceneObjects, paso, duracionPaso, tracks);
}
