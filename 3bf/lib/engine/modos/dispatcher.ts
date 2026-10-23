import {
  ModoPasoOficial,
  ParametrosCompiladorModo,
  normalizarTipoModo,
} from "./modosTypes";
import { resolverCompiladorPresentacion } from "./1_presentacion";
import { resolverCompiladorArmadoCapas } from "./2_armado_capas";
import { resolverCompiladorBloqueEstandar } from "./3_bloque_estandar";
import { resolverCompiladorIncorporaciones } from "./4_incorporaciones";

/**
 * 🎛️ Despachador Universal de Modos y Versiones Cinemáticas
 * Garantiza que cada paso del manual ejecute ESTRICTAMENTE su versión registrada,
 * blindando retrocompatibilidad total e inmunidad ante cambios futuros.
 */
export function compilarPasoVersionado(params: ParametrosCompiladorModo): {
  modoEjecutado: ModoPasoOficial;
  versionEjecutada: string;
} {
  const { paso } = params;
  const modo = normalizarTipoModo(paso.tipo);
  const versionDeseada = paso.versionMotor;

  let versionEjecutada = "v1.0";

  switch (modo) {
    case "presentacion": {
      const { compilador, versionEfectiva } = resolverCompiladorPresentacion(versionDeseada);
      compilador(params);
      versionEjecutada = versionEfectiva;
      break;
    }
    case "armado_capas": {
      const { compilador, versionEfectiva } = resolverCompiladorArmadoCapas(versionDeseada);
      compilador(params);
      versionEjecutada = versionEfectiva;
      break;
    }
    case "bloque_estandar": {
      const { compilador, versionEfectiva } = resolverCompiladorBloqueEstandar(versionDeseada);
      compilador(params);
      versionEjecutada = versionEfectiva;
      break;
    }
    case "incorporaciones": {
      const { compilador, versionEfectiva } = resolverCompiladorIncorporaciones(versionDeseada);
      compilador(params);
      versionEjecutada = versionEfectiva;
      break;
    }
    default: {
      const { compilador, versionEfectiva } = resolverCompiladorArmadoCapas(versionDeseada);
      compilador(params);
      versionEjecutada = versionEfectiva;
      break;
    }
  }

  // Sellar versión en el objeto paso si no estaba definida
  if (!paso.versionMotor) {
    paso.versionMotor = versionEjecutada;
  }

  return {
    modoEjecutado: modo,
    versionEjecutada,
  };
}
