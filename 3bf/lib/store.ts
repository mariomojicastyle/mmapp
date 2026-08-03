import { create } from "zustand";

export interface ParametrosMueble {
  model_id: string;       // M00001, M00002 / Cajon_Experimento_Viktor
  ancho: number;          // mm
  alto: number;           // mm
  profundidad: number;    // mm
  espesor_madera: number; // mm
  material: string;       // MDP_15mm, MDF_18mm, etc.
  color_acabado: string;  // #0088aa, #111827, etc.
  incluir_puertas: boolean;
  tipo_herraje: string;   // Minifix, Perno
  cant_cajones?: number;  // Para Cajonera GH
  apertura_cajones?: number; // 0 - 300mm animación de apertura
  profundidad_cajon?: number; // 351, 400mm
  altura_lateral_cajon?: number; // 102, 138, 147, 200mm
  distancia_bajo_laterales?: number; // 25, 30mm
  tipo_cajon?: string; // Corredera Estandar, Corredera Tipo X
  // Parámetros Cubierta.ghx (VisualARQ DfMA)
  recedido_izquierdo?: number;
  recedido_derecho?: number;
  union_izquierda?: string;
  union_derecha?: string;
  orientacion_maquinado_minifix?: string;
  orientacion_minifix?: string;
  posicion_tarugo?: string;
  posicion_tornillo?: string;
  borde_izquierdo?: string;
  borde_derecho?: string;
  lado_balance_cubierta?: string;
  tipo_mapeado_cubierta?: string;
  lado_balance_entrepanio?: string;
  tipo_mapeado_entrepanio?: string;
}

export interface PiezaDespiece {
  nombre: string;
  ancho: number;
  largo: number;
  espesor: number;
  cantidad: number;
  tipo: string;
}

export interface HerrajeItem {
  nombre: string;
  cantidad: number;
  unidad: string;
}

export interface ComputoResultado {
  summary: {
    dimensiones: string;
    area_madera_m2: number;
    costo_estimado_usd: number;
    piezas_totales: number;
  };
  despiece: PiezaDespiece[];
  herrajes: HerrajeItem[];
  real_meshes?: Array<{
    name: string;
    size: [number, number, number];
    position: [number, number, number];
    vertices?: number[];
    indices?: number[];
  }>;
  execution_time_ms: number;
  worker_info?: {
    engine: string;
    gh_file?: string;
    ezdxf?: boolean;
  };
}

export interface CalibracionVisual {
  opacidadMadera: number;        // 0.0 a 1.0
  rugosidadMadera: number;       // 0.0 a 1.0
  metalicidadMadera: number;     // 0.0 a 1.0
  colorSolido: string;           // Hex (#9CA3AF)
  customTextureUrl: string | null; // DataURL de imagen bitmap subida por el usuario
  opacidadAristas: number;       // 0.0 a 1.0
  colorAristas: string;          // Hex (#111827)
  thresholdAristas: number;      // 1 a 89 grados
  intensidadLuzDirecta: number;  // 0.0 a 3.0
  intensidadLuzAmbiental: number;// 0.0 a 2.0
  mostrarAristas: boolean;       // true/false
  mostrarPanelCalibracion: boolean; // Toggle flotante
}

export interface State3BF {
  parametros: ParametrosMueble;
  setParametro: <K extends keyof ParametrosMueble>(key: K, value: ParametrosMueble[K]) => void;
  
  resultado: ComputoResultado | null;
  cargando: boolean;
  error: string | null;
  setResultado: (resultado: ComputoResultado | null) => void;
  
  // Tema UI
  tema: "tech" | "obsidian";
  setTema: (tema: "tech" | "obsidian") => void;
  
  // Pestaña Activa
  pestanaActiva: "3d" | "despiece" | "costos" | "dxf";
  setPestanaActiva: (pestana: "3d" | "despiece" | "costos" | "dxf") => void;
  
  // Worker Python Status
  workerStatus: "checking" | "online" | "offline";
  setWorkerStatus: (status: "checking" | "online" | "offline") => void;
  
  // Modo de Visualización 3D (Rhino Style: Cristal, Sólido, Líneas, Renderizado)
  modoVisual: "solido" | "semitransparente" | "lineas" | "renderizado";
  setModoVisual: (modo: "solido" | "semitransparente" | "lineas" | "renderizado") => void;

  // Calibración de Visualización 3D en tiempo real (Studio Tuner)
  calibracion: CalibracionVisual;
  setCalibracion: <K extends keyof CalibracionVisual>(key: K, value: CalibracionVisual[K]) => void;
  resetCalibracion: () => void;
}

export const defaultCalibracion: CalibracionVisual = {
  opacidadMadera: 1.0,
  rugosidadMadera: 0.4,
  metalicidadMadera: 0.05,
  colorSolido: "#9CA3AF",
  customTextureUrl: null,
  opacidadAristas: 0.75,
  colorAristas: "#111827",
  thresholdAristas: 15,
  intensidadLuzDirecta: 1.5,
  intensidadLuzAmbiental: 0.8,
  mostrarAristas: true,
  mostrarPanelCalibracion: false,
};

export const use3BFStore = create<State3BF>((set) => ({
  parametros: {
    model_id: "M00001",
    ancho: 1200,
    alto: 800,
    profundidad: 400,
    espesor_madera: 15,
    material: "MDP_15mm",
    color_acabado: "#0088aa",
    incluir_puertas: true,
    tipo_herraje: "Minifix",
    cant_cajones: 3,
    apertura_cajones: 0,
    profundidad_cajon: 351,
    altura_lateral_cajon: 102,
    distancia_bajo_laterales: 30,
    tipo_cajon: "Corredera Estandar",
    // Defaults Cubierta.ghx
    recedido_izquierdo: 0,
    recedido_derecho: 0,
    union_izquierda: "Minifix",
    union_derecha: "Tornillo tarugo",
    orientacion_maquinado_minifix: "abajo",
    orientacion_minifix: "abajo",
    posicion_tarugo: "1",
    posicion_tornillo: "1",
    borde_izquierdo: "MDP",
    borde_derecho: "MDP",
    lado_balance_cubierta: "Cara B",
    tipo_mapeado_cubierta: "Cubierta",
    lado_balance_entrepanio: "Cara B",
    tipo_mapeado_entrepanio: "Cubierta",
  },

  setParametro: (key, value) =>
    set((state) => ({
      parametros: { ...state.parametros, [key]: value },
    })),
    
  resultado: null,
  cargando: false,
  error: null,
  setResultado: (resultado) => set({ resultado }),
  
  tema: "tech",
  setTema: (tema) => set({ tema }),
  
  pestanaActiva: "3d",
  setPestanaActiva: (pestanaActiva) => set({ pestanaActiva }),
  
  workerStatus: "checking",
  setWorkerStatus: (workerStatus) => set({ workerStatus }),

  modoVisual: "semitransparente",
  setModoVisual: (modoVisual) => set({ modoVisual }),

  calibracion: defaultCalibracion,
  setCalibracion: (key, value) =>
    set((state) => ({
      calibracion: { ...state.calibracion, [key]: value },
    })),
  resetCalibracion: () => set({ calibracion: defaultCalibracion }),
}));
