import { ParametrosCompiladorModo } from "../modosTypes";
import { compilarMultiplePlusPaso } from "../../multiplePlusKinematics";

/**
 * 🔩 Modo 3: Bloque Estándar (Herrajes Especiales) — Versión 1.0 (Estable Certificada)
 * Sub-ensambles modulares y herrajes especiales (.3bb.json) como correderas telescópicas,
 * brazos elevables o sistemas de cierre suave aislados del casco del mueble.
 */
export function compilarBloqueEstandar_v1(params: ParametrosCompiladorModo): void {
  const { rootScene, paso, sceneMeshes, sceneObjects, tracks, duracionPaso } = params;
  compilarMultiplePlusPaso(rootScene, paso, sceneMeshes, sceneObjects, tracks, duracionPaso);
}
