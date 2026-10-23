import { ParametrosCompiladorModo } from "../modosTypes";
import { compilarMultiplePlusPaso } from "../../multiplePlusKinematics";

/**
 * 🛠️ Modo 2: Armado por Capas (Multifuncional) — Versión 1.0 (Estable Certificada)
 * El estándar de taller DfMA: Ensamble por capas independientes sobre banco de trabajo,
 * cinemática solidaria automática de herrajes a barrenos, rotaciones discretas en mesa (0°, 90°, 180°, 270°)
 * y levantamiento upright final con apoyo de patas en suelo (Y = 0).
 */
export function compilarArmadoCapas_v1(params: ParametrosCompiladorModo): void {
  const { rootScene, paso, sceneMeshes, sceneObjects, tracks, duracionPaso } = params;
  compilarMultiplePlusPaso(rootScene, paso, sceneMeshes, sceneObjects, tracks, duracionPaso);
}
