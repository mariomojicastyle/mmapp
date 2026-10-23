import * as THREE from "three";
import type { PasoManualStudio } from "../../storeTypes";

/**
 * 🏷️ Los 4 Modos Definitivos del Manual 3D en 3dBimFab
 */
export type ModoPasoOficial =
  | "presentacion"       // 1. Presentación Funcional (Showcase)
  | "armado_capas"       // 2. Armado por Capas (Multifuncional)
  | "bloque_estandar"    // 3. Bloque Estándar (Herrajes Especiales)
  | "incorporaciones";   // 4. Incorporaciones (Bloques Funcionales)

export interface ModoPasoMetadata {
  id: ModoPasoOficial;
  nombreVisible: string;
  subtitulo: string;
  descripcion: string;
  versionActual: string;
  versionesDisponibles: string[];
  icono: string;
}

export const MODOS_PASO_DEFINITIVOS: Record<ModoPasoOficial, ModoPasoMetadata> = {
  presentacion: {
    id: "presentacion",
    nombreVisible: "Presentación Funcional",
    subtitulo: "Showcase",
    descripcion: "Demostración del mueble completo en operación interactiva (apertura de cajones, puertas y giro 360°).",
    versionActual: "v1.0",
    versionesDisponibles: ["v1.0"],
    icono: "Eye",
  },
  armado_capas: {
    id: "armado_capas",
    nombreVisible: "Armado por Capas",
    subtitulo: "Multifuncional",
    descripcion: "Núcleo DfMA de ensamble por capas sobre banco de trabajo, herrajes solidarios con barrenos, giros 3D y levantamiento de pie.",
    versionActual: "v1.0",
    versionesDisponibles: ["v1.0"],
    icono: "Layers",
  },
  bloque_estandar: {
    id: "bloque_estandar",
    nombreVisible: "Bloque Estándar",
    subtitulo: "Herrajes Especiales",
    descripcion: "Sub-ensamble reutilizable modular (.3bb.json) para herrajes de alta complejidad como correderas telescópicas y bisagras.",
    versionActual: "v1.0",
    versionesDisponibles: ["v1.0"],
    icono: "Component",
  },
  incorporaciones: {
    id: "incorporaciones",
    nombreVisible: "Incorporaciones",
    subtitulo: "Bloques Funcionales",
    descripcion: "Deslizamiento y acople de sub-módulos completos ya ensamblados (gavetas en rieles, puertas corredizas) hacia el casco final.",
    versionActual: "v1.0",
    versionesDisponibles: ["v1.0"],
    icono: "ArrowDownToLine",
  },
};

/**
 * 🔄 Normalizador universal de tipo histórico a ModoPasoOficial
 */
export function normalizarTipoModo(tipoHistorico?: string | null): ModoPasoOficial {
  if (!tipoHistorico) return "armado_capas";
  const t = tipoHistorico.toLowerCase().trim();
  if (t === "showcase" || t === "presentacion" || t === "presentacion_funcional") {
    return "presentacion";
  }
  if (t === "bloque_estandar" || t === "herrajes_especiales" || t === "bloque") {
    return "bloque_estandar";
  }
  if (t === "insercion_cajones" || t === "incorporaciones" || t === "bloques_funcionales") {
    return "incorporaciones";
  }
  // multiple_plus, armado_capas, o cualquier otro fallback
  return "armado_capas";
}

/**
 * 🔄 Mapeo inverso de ModoPasoOficial al tipo histórico para no romper serializaciones previas en disco
 */
export function mapearModoATipoHistorico(modo: ModoPasoOficial): PasoManualStudio["tipo"] {
  switch (modo) {
    case "presentacion":
      return "showcase";
    case "armado_capas":
      return "multiple_plus";
    case "bloque_estandar":
      return "bloque_estandar";
    case "incorporaciones":
      return "insercion_cajones";
    default:
      return "multiple_plus";
  }
}

/**
 * 📦 Parámetros estándar que todo compilador cinemático versionado recibe
 */
export interface ParametrosCompiladorModo {
  rootScene: THREE.Object3D;
  sceneMeshes: THREE.Mesh[];
  sceneObjects: Map<string, THREE.Object3D>;
  paso: PasoManualStudio;
  duracionPaso: number;
  tracks: THREE.KeyframeTrack[];
  todosLosPasos?: PasoManualStudio[];
  pasoP00?: PasoManualStudio | null;
}

export type CompiladorModoFn = (params: ParametrosCompiladorModo) => void;
