/**
 * =========================================================================================
 * ✂️ 3dBimFab Opti_Nesting — Store Zustand de Optimización
 * Manejo de estado reactivo, parámetros de máquina y resultados de corte
 * =========================================================================================
 */

import { create } from "zustand";
import type { 
  ModoOptimizacion, 
  ConfiguracionLaminas, 
  ResultadoOptimizacionGlobal,
  PiezaCorte 
} from "./tiposOptimizador";

interface OptimizadorState {
  // Modo de corte seleccionado (Tríada)
  modoActivo: ModoOptimizacion;
  setModoActivo: (modo: ModoOptimizacion) => void;

  // Configuración global de láminas y máquinas
  configuracion: ConfiguracionLaminas;
  actualizarConfiguracion: (cambios: Partial<ConfiguracionLaminas>) => void;

  // Filtro de espesor de trabajo (15mm, 12mm, etc. o null para el primer espesor)
  espesorActivo: number | null;
  setEspesorActivo: (espesor: number | null) => void;

  // Navegación de láminas generadas en el Canvas
  laminaActivaIndex: number;
  setLaminaActivaIndex: (indice: number) => void;

  // Resultados del cálculo
  resultadoOptimizacion: ResultadoOptimizacionGlobal | null;
  setResultadoOptimizacion: (res: ResultadoOptimizacionGlobal | null) => void;

  // Estado de procesamiento
  calculando: boolean;
  setCalculando: (val: boolean) => void;

  // Origen de Datos (Fase 2: Interoperabilidad Externa)
  origenDatos: "modelo_3bf" | "archivo_externo";
  setOrigenDatos: (origen: "modelo_3bf" | "archivo_externo") => void;
  piezasExternas: PiezaCorte[];
  setPiezasExternas: (piezas: PiezaCorte[]) => void;
  nombreArchivoExterno: string | null;
  setNombreArchivoExterno: (nombre: string | null) => void;

  // Zoom y visualización en el Canvas 2D
  zoomCanvas: number;
  setZoomCanvas: (zoom: number | ((prev: number) => number)) => void;
  resetearZoom: () => void;
}

export const useOptimizadorStore = create<OptimizadorState>((set) => ({
  modoActivo: "seccionadora",
  setModoActivo: (modo) => set({ modoActivo: modo }),

  configuracion: {
    tamanoLote: 1,          // 1 unidad de mueble por defecto (escalable a 5, 10, 50, 100, etc.)
    largoBruto: 2440,
    anchoBruto: 2150,       // Formato estándar Duratex / Novopan (2440 x 2150 mm)
    espesorBruto: 15,
    kerfSierra: 3.5,        // Disco sierra seccionadora (3.5 mm)
    diametroFresa: 10.0,    // Fresa de compresión nesting CNC (10 mm)
    refiladoMargen: 10.0,   // Refilado perimetral (10 mm en cada borde)
    nivelOptimizacion: "intensivo", // Motor Metaheurístico Multi-Iterativo (Máximo aprovechamiento)
    estrategiaMadera: "rip_first",
    largoTablonMm: 3048,    // 10 pies
    anchoTablonMm: 203.2,   // 8 pulgadas
    espesorTablonMm: 25.4,  // 1 pulgada (1")
    costoPorPieTablar: 4.5, // USD o unidad monetaria
  },

  actualizarConfiguracion: (cambios) =>
    set((state) => ({
      configuracion: { ...state.configuracion, ...cambios },
    })),

  espesorActivo: null,
  setEspesorActivo: (espesor) => set({ espesorActivo: espesor, laminaActivaIndex: 0 }),

  laminaActivaIndex: 0,
  setLaminaActivaIndex: (indice) => set({ laminaActivaIndex: Math.max(0, indice) }),

  resultadoOptimizacion: null,
  setResultadoOptimizacion: (res) => set({ resultadoOptimizacion: res, laminaActivaIndex: 0 }),

  calculando: false,
  setCalculando: (val) => set({ calculando: val }),

  origenDatos: "modelo_3bf",
  setOrigenDatos: (origen) => set({ origenDatos: origen, laminaActivaIndex: 0 }),
  piezasExternas: [],
  setPiezasExternas: (piezas) => set({ piezasExternas: piezas, laminaActivaIndex: 0 }),
  nombreArchivoExterno: null,
  setNombreArchivoExterno: (nombre) => set({ nombreArchivoExterno: nombre }),

  zoomCanvas: 1.0,
  setZoomCanvas: (zoom) =>
    set((state) => ({
      zoomCanvas: typeof zoom === "function" ? zoom(state.zoomCanvas) : zoom,
    })),
  resetearZoom: () => set({ zoomCanvas: 1.0 }),
}));
