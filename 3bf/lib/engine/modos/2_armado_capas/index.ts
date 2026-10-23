import { CompiladorModoFn } from "../modosTypes";
import { compilarArmadoCapas_v1 } from "./armado_capas_v1";

export const VERSIONES_ARMADO_CAPAS: Record<string, CompiladorModoFn> = {
  "v1.0": compilarArmadoCapas_v1,
};

export const VERSION_PREDETERMINADA_ARMADO_CAPAS = "v1.0";

export function resolverCompiladorArmadoCapas(versionDeseada?: string): { compilador: CompiladorModoFn; versionEfectiva: string } {
  const v = versionDeseada && VERSIONES_ARMADO_CAPAS[versionDeseada] ? versionDeseada : VERSION_PREDETERMINADA_ARMADO_CAPAS;
  return {
    compilador: VERSIONES_ARMADO_CAPAS[v],
    versionEfectiva: v,
  };
}
