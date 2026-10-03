/**
 * =========================================================================================
 * ✂️ 3dBimFab Opti_Nesting — Extractor Paramétrico In-Memory
 * Lee las piezas del modelo activo (instancias o resultado base de Grasshopper)
 * sin requerir importar archivos CSV ni DXF.
 * =========================================================================================
 */

import type { State3BF } from "@/lib/storeTypes";
import { extraerPiezaMadre, obtenerDescripcionCanonicaPieza } from "@/lib/piezaMadreUtils";
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

  // 1. Obtener todas las posibles claves del modelo activo para buscar configuraciones de taller
  const instActiva = state.objetoActivoId ? state.instancias[state.objetoActivoId] : null;
  const posiblesClaves: string[] = [];
  if (state.muebleActivoGuardado?.nombre) posiblesClaves.push(state.muebleActivoGuardado.nombre);
  if (instActiva?.definitionId) posiblesClaves.push(instActiva.definitionId);
  if (instActiva?.nombreVisible) posiblesClaves.push(instActiva.nombreVisible);
  if (state.parametros?.custom_filename) posiblesClaves.push(state.parametros.custom_filename);
  if (state.parametros?.model_id) posiblesClaves.push(state.parametros.model_id);
  posiblesClaves.push("Comoda Ravenna Original", "Comoda Ravenna", "Cómoda Ravenna", "Cubierta");

  // Consolidar descripciones personalizadas y giros de veta desde Zustand y localStorage
  let descripcionesPersonalizadas: Record<string, string> = {};
  let giroPorPieza: Record<string, boolean> = {};

  for (const k of posiblesClaves) {
    const clean = k.replace(/\.[^/.]+$/, "").trim();
    const cfg = state.getFichaConfig ? state.getFichaConfig(clean) : null;
    if (cfg && (cfg as any).descripcionesPersonalizadas && Object.keys((cfg as any).descripcionesPersonalizadas).length > 0) {
      descripcionesPersonalizadas = { ...descripcionesPersonalizadas, ...(cfg as any).descripcionesPersonalizadas };
    }
    if (cfg?.giroPorPieza && Object.keys(cfg.giroPorPieza).length > 0) {
      giroPorPieza = { ...giroPorPieza, ...cfg.giroPorPieza };
    }
  }

  // Buscar también en localStorage cualquier ficha de configuración guardada
  if (typeof window !== "undefined") {
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const lk = localStorage.key(i);
        if (lk && lk.startsWith("3bf_ficha_config_")) {
          const raw = localStorage.getItem(lk);
          if (raw) {
            const parsed = JSON.parse(raw);
            if (parsed.descripcionesPersonalizadas) {
              descripcionesPersonalizadas = { ...parsed.descripcionesPersonalizadas, ...descripcionesPersonalizadas };
            }
            if (parsed.giroPorPieza) {
              giroPorPieza = { ...parsed.giroPorPieza, ...giroPorPieza };
            }
          }
        }
      }
    } catch {}
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
    let rotacionPermitida: boolean;
    if (giroPorPieza[idx] !== undefined) {
      rotacionPermitida = Boolean(giroPorPieza[idx]);
    } else if ((giroPorPieza as any)[nombreCanónico] !== undefined) {
      rotacionPermitida = Boolean((giroPorPieza as any)[nombreCanónico]);
    } else {
      rotacionPermitida = true;
    }

    // Descripción humana en español de taller (Prioridad: Despiece > Grasshopper > nada inventado)
    const descPers = 
      descripcionesPersonalizadas[idx] || 
      descripcionesPersonalizadas[nombreCanónico] || 
      (p.nombre ? descripcionesPersonalizadas[p.nombre] : undefined) ||
      (p.descripcion && p.descripcion !== p.nombre && !/comoda ravenna/i.test(p.descripcion) ? p.descripcion : undefined);

    const descOficial = obtenerDescripcionCanonicaPieza(
      nombreCanónico,
      descPers,
      p.descripcion,
      "Cómoda Ravenna"
    );

    // Asociar con el material y formato oficial del inventario según su calibre
    const tableroDb = state.dbTableros?.find(
      (t) => Math.abs((t.calibreMm ?? 0) - espesor) <= 1.5
    );
    const materialDefault = espesor <= 3 ? "FONDO Blanco Puro 2.7mm" : espesor <= 12 ? "DURATEX Trama Marfil 12mm" : "DURATEX Trama Marfil 15mm";
    const materialOficial = tableroDb?.nombreComercial || p.material || materialDefault;
    const colorHex = PALETA_COLORES_PIEZAS[idx % PALETA_COLORES_PIEZAS.length];

    piezas.push({
      id: `pieza_${idx}_${nombreCanónico.replace(/[\s\(\)]/g, "_")}`,
      nombre: nombreCanónico,
      descripcion: descOficial || undefined,
      largo,
      ancho,
      espesor,
      cantidad,
      rotacionPermitida,
      material: materialOficial,
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
