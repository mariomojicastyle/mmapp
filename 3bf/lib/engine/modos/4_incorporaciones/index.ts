import { CompiladorModoFn } from "../modosTypes";
import { compilarIncorporaciones_v1 } from "./incorporaciones_v1";

export const VERSIONES_INCORPORACIONES: Record<string, CompiladorModoFn> = {
  "v1.0": compilarIncorporaciones_v1,
};

export const VERSION_PREDETERMINADA_INCORPORACIONES = "v1.0";

export function resolverCompiladorIncorporaciones(versionDeseada?: string): { compilador: CompiladorModoFn; versionEfectiva: string } {
  const v = versionDeseada && VERSIONES_INCORPORACIONES[versionDeseada] ? versionDeseada : VERSION_PREDETERMINADA_INCORPORACIONES;
  return {
    compilador: VERSIONES_INCORPORACIONES[v],
    versionEfectiva: v,
  };
}
