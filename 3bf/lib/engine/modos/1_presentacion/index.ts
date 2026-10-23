import { CompiladorModoFn } from "../modosTypes";
import { compilarPresentacion_v1 } from "./presentacion_v1";

export const VERSIONES_PRESENTACION: Record<string, CompiladorModoFn> = {
  "v1.0": compilarPresentacion_v1,
};

export const VERSION_PREDETERMINADA_PRESENTACION = "v1.0";

export function resolverCompiladorPresentacion(versionDeseada?: string): { compilador: CompiladorModoFn; versionEfectiva: string } {
  const v = versionDeseada && VERSIONES_PRESENTACION[versionDeseada] ? versionDeseada : VERSION_PREDETERMINADA_PRESENTACION;
  return {
    compilador: VERSIONES_PRESENTACION[v],
    versionEfectiva: v,
  };
}
