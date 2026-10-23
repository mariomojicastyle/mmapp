import { CompiladorModoFn } from "../modosTypes";
import { compilarBloqueEstandar_v1 } from "./bloque_estandar_v1";

export const VERSIONES_BLOQUE_ESTANDAR: Record<string, CompiladorModoFn> = {
  "v1.0": compilarBloqueEstandar_v1,
};

export const VERSION_PREDETERMINADA_BLOQUE_ESTANDAR = "v1.0";

export function resolverCompiladorBloqueEstandar(versionDeseada?: string): { compilador: CompiladorModoFn; versionEfectiva: string } {
  const v = versionDeseada && VERSIONES_BLOQUE_ESTANDAR[versionDeseada] ? versionDeseada : VERSION_PREDETERMINADA_BLOQUE_ESTANDAR;
  return {
    compilador: VERSIONES_BLOQUE_ESTANDAR[v],
    versionEfectiva: v,
  };
}
