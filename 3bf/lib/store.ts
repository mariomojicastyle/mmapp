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
  profundidad_cajon?: number; // 200 - 600mm
  altura_lateral_cajon?: number; // 50 - 250mm
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
  }>;
  execution_time_ms: number;
  worker_info?: {
    engine: string;
    gh_file?: string;
    ezdxf?: boolean;
  };
}

interface State3BF {
  // Parámetros
  parametros: ParametrosMueble;
  setParametro: <K extends keyof ParametrosMueble>(key: K, value: ParametrosMueble[K]) => void;
  
  // Estado de Computación
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
  
  // Modo de Visualización 3D
  modoVisual: "solido" | "semitransparente" | "lineas";
  setModoVisual: (modo: "solido" | "semitransparente" | "lineas") => void;
}

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
}));
