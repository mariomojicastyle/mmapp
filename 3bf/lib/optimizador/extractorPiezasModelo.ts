/**
 * =========================================================================================
 * ✂️ 3dBimFab Opti_Nesting — Extractor Paramétrico In-Memory
 * Lee las piezas del modelo activo (instancias o resultado base de Grasshopper)
 * sin requerir importar archivos CSV ni DXF.
 * =========================================================================================
 */

import type { State3BF } from "@/lib/storeTypes";
import { extraerPiezaMadre } from "@/lib/piezaMadreUtils";
import type { PiezaCorte } from "./tiposOptimizador";

// Paleta cromática Tech Ethos / Diseñador para identificar piezas en el Canvas 2D
const PALETA_COLORES_PIEZAS = [
  "#38BDF8", // Celeste claro
  "#818CF8", // Índigo suave
  "#F472B6", // Rosa suave
  "#FB923C", // Naranja cálido
  "#FBBF24", // Ámbar dorado
  "#34D399", // Esmeralda suave
  "#A78BFA", // Violeta suave
  "#2DD4BF", // Turquesa
  "#93C5FD", // Azul cielo
  "#FCA5A5", // Coral
  "#C084FC", // Púrpura pastel
  "#4ADE80", // Verde claro
  "#67E8F9", // Cian brillante
  "#FDE047", // Amarillo claro
];

/**
 * Extrae y normaliza todas las piezas activas del modelo 3dBimFab
 */
export function extraerPiezasParaOptimizacion(state: State3BF): PiezaCorte[] {
  const globalList = state.getDespieceGlobal ? state.getDespieceGlobal() : [];
  const rawList = globalList.length > 0 ? globalList : (state.resultado?.despiece || []);

  if (!rawList || rawList.length === 0) {
    return [];
  }

  const piezas: PiezaCorte[] = [];

  rawList.forEach((p: any, idx: number) => {
    const nombreCanónico = extraerPiezaMadre(p.nombre) || p.nombre || `Peça ${idx + 1}`;
    
    // Normalizar dimensiones (garantizar milímetros)
    const largo = Math.max(1, Math.round(Number(p.largo) || 0));
    const ancho = Math.max(1, Math.round(Number(p.ancho) || 0));
    const espesor = Math.max(1, Math.round(Number(p.espesor) || 15));
    const cantidad = Math.max(1, Math.round(Number(p.cantidad) || 1));

    // Determinar si la pieza debe respetar veta:
    // Los fondos de cajón, traseras o piezas cuadradas pueden rotar libremente.
    // Los laterales, frentes y tapas de mueble suelen tener veta a lo largo.
    const esFondoOTrasera = /fundo|costa|trasera|fondo/i.test(nombreCanónico) || espesor <= 6;
    const esCuadrada = Math.abs(largo - ancho) < 2;
    const rotacionPermitida = esFondoOTrasera || esCuadrada;

    const materialDefault = espesor <= 3 ? "MDF 3mm (Fondo)" : espesor <= 12 ? "MDP 12mm (Gaveta)" : "MDP 15mm (Estructura)";
    const colorHex = PALETA_COLORES_PIEZAS[idx % PALETA_COLORES_PIEZAS.length];

    piezas.push({
      id: `pieza_${idx}_${nombreCanónico.replace(/[\s\(\)]/g, "_")}`,
      nombre: nombreCanónico,
      descripcion: p.descripcion && p.descripcion !== p.nombre ? p.descripcion : p.instanciaNombre || nombreCanónico,
      largo,
      ancho,
      espesor,
      cantidad,
      rotacionPermitida,
      material: p.material || materialDefault,
      colorHex,
      instanciaNombre: p.instanciaNombre,
    });
  });

  return piezas;
}

/**
 * Agrupa una lista de piezas por su espesor (ej. 15mm, 12mm, 3mm)
 */
export function agruparPiezasPorEspesor(piezas: PiezaCorte[]): Record<number, PiezaCorte[]> {
  const grupos: Record<number, PiezaCorte[]> = {};
  
  for (const pieza of piezas) {
    const esp = pieza.espesor;
    if (!grupos[esp]) {
      grupos[esp] = [];
    }
    grupos[esp].push(pieza);
  }

  return grupos;
}
