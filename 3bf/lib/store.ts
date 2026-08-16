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
  ghx_content?: string;
  custom_filename?: string;
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
    uvs?: number[];
  }>;
  slider_limits?: Record<string, {
    min?: number;
    max?: number;
    default?: number | string;
    type?: string;
    options?: string[];
  }>;
  groups?: Record<string, string[]>;
  parameter_groups?: Array<{ title: string; parameters: string[] }>;
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

export interface HerrajeRecord {
  id: string;
  codigo: string;
  nombreGhx: string;
  descripcion: string;
  categoria: "Minifix" | "Tornillos" | "Tarugos" | "Correderas" | "Bisagras" | "Soportes" | "Accesorios";
  mallasPorUnidad: number;
  costoCop: number;
  costoUsd: number;
  unidad: "UND" | "PAR" | "JGO" | "KIT";
  pesoKg: number;
  proveedor: string;
}

export interface NegociacionNovopan {
  apoyoVolumenPct: number;          // 20.00%
  apoyoTasaPct: number;             // 15.10%
  prontoPagoPct: number;            // 3.50%
  trmNovopan: number;               // 4000 COP
  gastosNacionalizacionPct: number; // 8.70%
  financiacionPct: number;          // 1.10%
  fleteInternacionalM3Usd: number;  // 18.57 USD/m3
}

export const NEGOCIACION_NOVOPAN_DEFECTO: NegociacionNovopan = {
  apoyoVolumenPct: 20.00,
  apoyoTasaPct: 15.10,
  prontoPagoPct: 3.50,
  trmNovopan: 4000,
  gastosNacionalizacionPct: 8.70,
  financiacionPct: 1.10,
  fleteInternacionalM3Usd: 18.57,
};

export function detectarDescuentoCara(nombreComercial: string): number {
  const n = (nombreComercial || "").toUpperCase();
  if (n.includes("D/B") || n.includes("BALANCE") || n.includes("1 CARA") || n.includes("CARA B")) {
    return 5.0; // 5% de descuento por acabado con balance blanco (D/B)
  }
  return 0.0; // 0% de descuento para D/D (2 caras diseño), D/KN, D/MAD, etc.
}

export function calcularCostoLaminaNovopan(
  precioListaUsd: number,
  largoMm: number,
  anchoMm: number,
  calibreMm: number,
  descuentoCaraPct?: number,
  negociacion: NegociacionNovopan = NEGOCIACION_NOVOPAN_DEFECTO,
  nombreComercial: string = ""
) {
  const areaM2 = (largoMm * anchoMm) / 1_000_000.0;
  const volumenM3 = areaM2 * (calibreMm / 1000.0);
  
  const descPct = descuentoCaraPct !== undefined ? descuentoCaraPct : detectarDescuentoCara(nombreComercial);
  const descCara = descPct / 100.0;
  const eNeto = precioListaUsd * (1.0 - descCara);
  
  const flete = negociacion.fleteInternacionalM3Usd * volumenM3;
  
  const prontoPago = (eNeto + flete) * (negociacion.prontoPagoPct / 100.0);
  const apoyoVolumen = eNeto * (negociacion.apoyoVolumenPct / 100.0);
  const apoyoTasa = eNeto * (negociacion.apoyoTasaPct / 100.0);
  
  const totalDescuentos = prontoPago + apoyoVolumen + apoyoTasa;
  const gastosNacionalizacion = eNeto * (negociacion.gastosNacionalizacionPct / 100.0);
  
  const costoUsdAjustado = eNeto - totalDescuentos + gastosNacionalizacion;
  const costoUsdFinal = costoUsdAjustado * (1.0 + negociacion.financiacionPct / 100.0);
  
  const costoLaminaCop = Math.round(costoUsdFinal * negociacion.trmNovopan);
  const costoLaminaUsd = Number(costoUsdFinal.toFixed(4));
  const costoM2Cop = Math.round(costoLaminaCop / areaM2);
  const costoM2Usd = Number((costoUsdFinal / areaM2).toFixed(4));

  return {
    areaM2: Number(areaM2.toFixed(3)),
    volumenM3: Number(volumenM3.toFixed(4)),
    precioListaUsd,
    descuentoCaraPct: descPct,
    costoLaminaUsd,
    costoLaminaCop,
    costoM2Usd,
    costoM2Cop,
    desglose: {
      eNeto: Number(eNeto.toFixed(4)),
      flete: Number(flete.toFixed(4)),
      prontoPago: Number(prontoPago.toFixed(4)),
      apoyoVolumen: Number(apoyoVolumen.toFixed(4)),
      apoyoTasa: Number(apoyoTasa.toFixed(4)),
      gastosNacionalizacion: Number(gastosNacionalizacion.toFixed(4)),
      costoUsdAjustado: Number(costoUsdAjustado.toFixed(4)),
      costoUsdFinal: Number(costoUsdFinal.toFixed(4))
    }
  };
}

export interface TableroRecord {
  id: string;
  codigo: string;
  sustrato: "MDP" | "MDF" | "MDF RH" | "HDF" | "Triplex";
  nombreComercial: string;
  calibreMm: number;
  largoLaminaMm: number;
  anchoLaminaMm: number;
  costoListaUsd: number;  // Precio de lista oficial del proveedor (ej: $43.568 Novopan)
  descuentoCaraPct?: number; // Descuento por cara/acabado (5% D/B Balance o 0% D/D)
  costoLaminaUsd: number; // Costo neto en fábrica tras descuentos y fletes
  costoLaminaCop: number; // Costo fábrica en COP (ej: $117.126)
  costoM2Usd: number;     // Costo m² en fábrica
  costoM2Cop: number;     // Costo m² en COP
  proveedor: string;
}

export interface CantoRecord {
  id: string;
  codigo: string;
  descripcion: string;
  espesorMm: number;
  anchoMm: number;
  tipo: "Flexible" | "Rígido 2mm" | "Melamínico";
  costoMlCop: number;
  costoMlUsd: number;
  proveedor: string;
}

export const HERRAJES_INICIALES_DEFECTO: HerrajeRecord[] = [
  { id: "h1", codigo: "20070022", nombreGhx: "Perno", descripcion: "Perno Minifix 34mm Acero/Plástico", categoria: "Minifix", mallasPorUnidad: 2, costoCop: 87, costoUsd: 0.022, unidad: "UND", pesoKg: 0.005, proveedor: "Hafele" },
  { id: "h2", codigo: "20070009", nombreGhx: "Caja", descripcion: "Caja Minifix 15mm Zamak Niquelada", categoria: "Minifix", mallasPorUnidad: 1, costoCop: 100, costoUsd: 0.025, unidad: "UND", pesoKg: 0.008, proveedor: "Hafele" },
  { id: "h3", codigo: "005895", nombreGhx: "Tarugo", descripcion: "Tarugo de Madera Estriado 8x30mm", categoria: "Tarugos", mallasPorUnidad: 1, costoCop: 17, costoUsd: 0.004, unidad: "UND", pesoKg: 0.001, proveedor: "Nacional" },
  { id: "h4", codigo: "0000149", nombreGhx: "Tornillo", descripcion: "Tornillo Ensamble 4x50mm Cincado", categoria: "Tornillos", mallasPorUnidad: 1, costoCop: 27, costoUsd: 0.007, unidad: "UND", pesoKg: 0.003, proveedor: "Spax" },
  { id: "h5", codigo: "010679", nombreGhx: "Soporte", descripcion: "Soporte de Entrepaño con Perno Ø5mm", categoria: "Soportes", mallasPorUnidad: 1, costoCop: 150, costoUsd: 0.038, unidad: "UND", pesoKg: 0.004, proveedor: "Ducasse" },
  { id: "h6", codigo: "20060067", nombreGhx: "Corredera Estandar", descripcion: "Par Correderas Telescópicas 450mm Cierre Suave", categoria: "Correderas", mallasPorUnidad: 2, costoCop: 18500, costoUsd: 4.50, unidad: "PAR", pesoKg: 0.450, proveedor: "Ducasse" },
  { id: "h7", codigo: "000478", nombreGhx: "Bisagra Codo 0", descripcion: "Bisagra Recta 35mm Cierre Suave con Base 4 Huecos", categoria: "Bisagras", mallasPorUnidad: 2, costoCop: 7800, costoUsd: 1.90, unidad: "UND", pesoKg: 0.085, proveedor: "Blum" },
  { id: "h8", codigo: "000468", nombreGhx: "Manija Bar", descripcion: "Tirador Metálico 128mm Negro Mate", categoria: "Accesorios", mallasPorUnidad: 1, costoCop: 9200, costoUsd: 2.25, unidad: "UND", pesoKg: 0.120, proveedor: "Ducasse" },
];

// Cálculo inicial de Novopan con la matriz de negociación
const cal15 = calcularCostoLaminaNovopan(43.568, 2440, 2150, 15, 5.0, NEGOCIACION_NOVOPAN_DEFECTO, "MDPKOR Ceniza 15mm 215x244 D/B Poro");
const cal25 = calcularCostoLaminaNovopan(69.570, 2440, 2150, 25, 0.0, NEGOCIACION_NOVOPAN_DEFECTO, "MDPKOR Ceniza 25mm 215x244 D/D Poro");

export const TABLEROS_INICIALES_DEFECTO: TableroRecord[] = [
  { id: "t1", codigo: "NH0030615", sustrato: "MDP", nombreComercial: "MDPKOR Ceniza 15mm 215x244 D/B Poro", calibreMm: 15, largoLaminaMm: 2440, anchoLaminaMm: 2150, costoListaUsd: 43.568, descuentoCaraPct: 5.0, costoLaminaUsd: cal15.costoLaminaUsd, costoLaminaCop: cal15.costoLaminaCop, costoM2Usd: cal15.costoM2Usd, costoM2Cop: cal15.costoM2Cop, proveedor: "Novopan" },
  { id: "t2", codigo: "NP2020625", sustrato: "MDP", nombreComercial: "MDPKOR Ceniza 25mm 215x244 D/D Poro", calibreMm: 25, largoLaminaMm: 2440, anchoLaminaMm: 2150, costoListaUsd: 69.570, descuentoCaraPct: 0.0, costoLaminaUsd: cal25.costoLaminaUsd, costoLaminaCop: cal25.costoLaminaCop, costoM2Usd: cal25.costoM2Usd, costoM2Cop: cal25.costoM2Cop, proveedor: "Novopan" },
  { id: "t3", codigo: "CB2251415", sustrato: "MDP", nombreComercial: "SUPERCOR Wengue 15mm 183x244", calibreMm: 15, largoLaminaMm: 2440, anchoLaminaMm: 1830, costoListaUsd: 27.820, descuentoCaraPct: 0.0, costoLaminaUsd: 27.82, costoLaminaCop: 114060, costoM2Usd: 6.23, costoM2Cop: 25540, proveedor: "Masisa" },
  { id: "t4", codigo: "FD0012827", sustrato: "HDF", nombreComercial: "FONDO Blanco 2.7mm 210x280", calibreMm: 2.7, largoLaminaMm: 2800, anchoLaminaMm: 2100, costoListaUsd: 10.230, descuentoCaraPct: 0.0, costoLaminaUsd: 10.23, costoLaminaCop: 41940, costoM2Usd: 1.74, costoM2Cop: 7130, proveedor: "Duratex" },
  { id: "t5", codigo: "MR0015018", sustrato: "MDF RH", nombreComercial: "MDF RH Hidrófugo 18mm 183x244", calibreMm: 18, largoLaminaMm: 2440, anchoLaminaMm: 1830, costoListaUsd: 46.080, descuentoCaraPct: 0.0, costoLaminaUsd: 46.08, costoLaminaCop: 188930, costoM2Usd: 10.32, costoM2Cop: 42310, proveedor: "Arauco" },
];

export const CANTOS_INICIALES_DEFECTO: CantoRecord[] = [
  { id: "c_0002788", codigo: "0002788", descripcion: "CANTO PVC CENIZA 19MM N", espesorMm: 0.5, anchoMm: 19, tipo: "Flexible", costoMlCop: 194.26, costoMlUsd: 0.05, proveedor: "Novopan" },
  { id: "c_017288", codigo: "017288", descripcion: "CANTO PVC CENDRA ESCANDINAVO 22MM", espesorMm: 0.5, anchoMm: 22, tipo: "Flexible", costoMlCop: 381.28, costoMlUsd: 0.10, proveedor: "Novopan" },
  { id: "c1", codigo: "0004623", descripcion: "Canto PVC Ceniza 19mm x 0.5mm", espesorMm: 0.5, anchoMm: 19, tipo: "Flexible", costoMlCop: 380, costoMlUsd: 0.09, proveedor: "Rehau" },
  { id: "c2", codigo: "000360", descripcion: "Canto PVC Rígido Ceniza 22mm x 2.0mm", espesorMm: 2.0, anchoMm: 22, tipo: "Rígido 2mm", costoMlCop: 1850, costoMlUsd: 0.45, proveedor: "Rehau" },
  { id: "c3", codigo: "000361", descripcion: "Canto PVC Rígido Ceniza 33mm x 2.0mm", espesorMm: 2.0, anchoMm: 33, tipo: "Rígido 2mm", costoMlCop: 2450, costoMlUsd: 0.60, proveedor: "Rehau" },
  { id: "c4", codigo: "0000253", descripcion: "Canto PVC Blanco Nevado 19mm x 0.5mm", espesorMm: 0.5, anchoMm: 19, tipo: "Flexible", costoMlCop: 320, costoMlUsd: 0.08, proveedor: "Proadec" },
  { id: "c5", codigo: "0000313", descripcion: "Canto PVC Glacial 33mm x 2.0mm", espesorMm: 2.0, anchoMm: 33, tipo: "Rígido 2mm", costoMlCop: 2400, costoMlUsd: 0.58, proveedor: "Rehau" },
];

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
  pestanaActiva: "3d" | "despiece" | "basedatos" | "costos" | "dxf";
  setPestanaActiva: (pestana: "3d" | "despiece" | "basedatos" | "costos" | "dxf") => void;
  
  // Worker Python Status
  workerStatus: "checking" | "online" | "offline";
  setWorkerStatus: (status: "checking" | "online" | "offline") => void;
  
  // Modo de Visualización 3D (Rhino Style: Cristal, Sólido, Líneas, Renderizado)
  modoVisual: "solido" | "semitransparente" | "lineas" | "renderizado";
  setModoVisual: (modo: "solido" | "semitransparente" | "lineas" | "renderizado") => void;

  // Escenario Limpio / Vacío
  escenarioLimpio: boolean;
  setEscenarioLimpio: (limpio: boolean) => void;
 
  // Calibración de Visualización 3D en tiempo real (Studio Tuner)
  calibracion: CalibracionVisual;
  setCalibracion: <K extends keyof CalibracionVisual>(key: K, value: CalibracionVisual[K]) => void;
  resetCalibracion: () => void;

  // Interacción de piezas
  hoveredPiece: string | null;
  setHoveredPiece: (name: string | null) => void;

  dbHerrajes: HerrajeRecord[];
  dbTableros: TableroRecord[];
  dbCantos: CantoRecord[];
  costosConversion: CostosConversionConfig;
  fichasConfig: Record<string, FichaCostosConfig>;
  moneda: "USD" | "COP";
  negociacionNovopan: NegociacionNovopan;
  setDbHerrajes: (herrajes: HerrajeRecord[]) => void;
  setDbTableros: (tableros: TableroRecord[]) => void;
  setDbCantos: (cantos: CantoRecord[]) => void;
  setCostosConversion: (costos: CostosConversionConfig) => void;
  updateCostoConversion: <K extends keyof CostosConversionConfig>(field: K, value: CostosConversionConfig[K]) => void;
  setFichaConfig: (modelKey: string, config: Partial<FichaCostosConfig>) => void;
  getFichaConfig: (modelKey: string) => FichaCostosConfig;
  setMoneda: (moneda: "USD" | "COP") => void;
  setNegociacionNovopan: (neg: NegociacionNovopan) => void;
  updateNegociacionNovopan: (field: keyof NegociacionNovopan, value: number) => void;
  updateDbHerraje: (id: string, field: keyof HerrajeRecord, value: any) => void;
  updateDbTablero: (id: string, field: keyof TableroRecord, value: any) => void;
  hidratarDesdeLocalStorage: () => void;
}

export interface FichaCostosConfig {
  desperdicioGlobalPct: number;
  desperdicioPorPieza: Record<number, number>;
  materialesPorPieza: Record<number, string>;
  cantosPorPieza: Record<number, {
    cantosAncho: number;
    cantosLargo: number;
    cantoCodigo?: string;
  }>;
  piezasNombres?: Record<number, string>;
  versionActual?: string;
  costoEmpaqueManualCop?: number;
  costoEmpaqueManualUsd?: number;
}

export const FICHA_DEFECTO: FichaCostosConfig = {
  desperdicioGlobalPct: 10.0,
  desperdicioPorPieza: {},
  materialesPorPieza: {},
  cantosPorPieza: {},
  piezasNombres: {},
  versionActual: "BD 1.0",
  costoEmpaqueManualCop: 0,
  costoEmpaqueManualUsd: 0,
};

export interface CostosConversionConfig {
  pctManoObraPres: number;       // 12.42% por defecto
  pctCIF: number;                // 9.80% por defecto
  pctAdicionales: number;        // 0.40% por defecto
  costoTercerizacionesCop: number; // 0 COP
  costoEmpaqueCop: number;       // 0 COP
}

export const COSTOS_CONVERSION_DEFECTO: CostosConversionConfig = {
  pctManoObraPres: 12.42,
  pctCIF: 9.80,
  pctAdicionales: 0.40,
  costoTercerizacionesCop: 0.0,
  costoEmpaqueCop: 0.0,
};

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

export const use3BFStore = create<State3BF>((set, get) => ({
  parametros: {
    model_id: "",
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
 
  escenarioLimpio: false,
  setEscenarioLimpio: (escenarioLimpio) => set({ escenarioLimpio }),
 
  calibracion: defaultCalibracion,
  setCalibracion: (key, value) =>
    set((state) => ({
      calibracion: { ...state.calibracion, [key]: value },
    })),
  resetCalibracion: () => set({ calibracion: defaultCalibracion }),

  hoveredPiece: null,
  setHoveredPiece: (hoveredPiece) => set({ hoveredPiece }),

  // =========================================================================
  // 🗄️ BASE DE DATOS DE MATERIAS PRIMAS & COSTOS VIVOS EN TIEMPO REAL
  // =========================================================================
  dbHerrajes: HERRAJES_INICIALES_DEFECTO,
  dbTableros: TABLEROS_INICIALES_DEFECTO,
  dbCantos: CANTOS_INICIALES_DEFECTO,
  costosConversion: COSTOS_CONVERSION_DEFECTO,
  fichasConfig: {},
  moneda: "COP",
  negociacionNovopan: NEGOCIACION_NOVOPAN_DEFECTO,

  setDbHerrajes: (dbHerrajes) => {
    try { localStorage.setItem("3bf_db_herrajes", JSON.stringify(dbHerrajes)); } catch {}
    set({ dbHerrajes });
  },
  setDbTableros: (dbTableros) => {
    try { localStorage.setItem("3bf_db_tableros", JSON.stringify(dbTableros)); } catch {}
    set({ dbTableros });
  },
  setDbCantos: (dbCantos) => {
    try { localStorage.setItem("3bf_db_cantos", JSON.stringify(dbCantos)); } catch {}
    set({ dbCantos });
  },
  setCostosConversion: (costosConversion) => {
    try { localStorage.setItem("3bf_costos_conversion", JSON.stringify(costosConversion)); } catch {}
    set({ costosConversion });
  },
  updateCostoConversion: (field, value) =>
    set((state) => {
      const updated = { ...state.costosConversion, [field]: value };
      try { localStorage.setItem("3bf_costos_conversion", JSON.stringify(updated)); } catch {}
      return { costosConversion: updated };
    }),
  setFichaConfig: (modelKey, config) =>
    set((state) => {
      const current = state.fichasConfig[modelKey] || FICHA_DEFECTO;
      const updatedModelConfig = { ...current, ...config };
      const updated = {
        ...state.fichasConfig,
        [modelKey]: updatedModelConfig
      };
      try {
        localStorage.setItem(`3bf_ficha_config_${modelKey}`, JSON.stringify(updatedModelConfig));
        localStorage.setItem("3bf_fichas_config", JSON.stringify(updated));
      } catch {}
      return { fichasConfig: updated };
    }),
  getFichaConfig: (modelKey) => {
    const state = get();
    if (state.fichasConfig[modelKey]) {
      return state.fichasConfig[modelKey];
    }
    try {
      const saved = localStorage.getItem(`3bf_ficha_config_${modelKey}`);
      if (saved) return JSON.parse(saved);
    } catch {}
    return FICHA_DEFECTO;
  },
  setMoneda: (moneda) => set({ moneda }),

  setNegociacionNovopan: (negociacionNovopan) =>
    set((state) => {
      const recalculated = state.dbTableros.map((t) => {
        if (t.proveedor === "Novopan") {
          const cal = calcularCostoLaminaNovopan(t.costoListaUsd, t.largoLaminaMm, t.anchoLaminaMm, t.calibreMm, undefined, negociacionNovopan, t.nombreComercial);
          return {
            ...t,
            costoLaminaUsd: cal.costoLaminaUsd,
            costoLaminaCop: cal.costoLaminaCop,
            costoM2Usd: cal.costoM2Usd,
            costoM2Cop: cal.costoM2Cop
          };
        }
        return t;
      });
      try {
        localStorage.setItem("3bf_negociacion_novopan", JSON.stringify(negociacionNovopan));
        localStorage.setItem("3bf_db_tableros", JSON.stringify(recalculated));
      } catch {}
      return { negociacionNovopan, dbTableros: recalculated };
    }),

  updateNegociacionNovopan: (field, value) =>
    set((state) => {
      const updatedNeg = { ...state.negociacionNovopan, [field]: value };
      const recalculated = state.dbTableros.map((t) => {
        if (t.proveedor === "Novopan") {
          const cal = calcularCostoLaminaNovopan(t.costoListaUsd, t.largoLaminaMm, t.anchoLaminaMm, t.calibreMm, undefined, updatedNeg, t.nombreComercial);
          return {
            ...t,
            costoLaminaUsd: cal.costoLaminaUsd,
            costoLaminaCop: cal.costoLaminaCop,
            costoM2Usd: cal.costoM2Usd,
            costoM2Cop: cal.costoM2Cop
          };
        }
        return t;
      });
      try {
        localStorage.setItem("3bf_negociacion_novopan", JSON.stringify(updatedNeg));
        localStorage.setItem("3bf_db_tableros", JSON.stringify(recalculated));
      } catch {}
      return { negociacionNovopan: updatedNeg, dbTableros: recalculated };
    }),

  updateDbHerraje: (id, field, value) =>
    set((state) => {
      const updated = state.dbHerrajes.map((h) => (h.id === id ? { ...h, [field]: value } : h));
      try { localStorage.setItem("3bf_db_herrajes", JSON.stringify(updated)); } catch {}
      return { dbHerrajes: updated };
    }),

  updateDbTablero: (id, field, value) =>
    set((state) => {
      const updated = state.dbTableros.map((t) => {
        if (t.id !== id) return t;
        const mod = { ...t, [field]: value };
        if (mod.proveedor === "Novopan") {
          const cal = calcularCostoLaminaNovopan(mod.costoListaUsd, mod.largoLaminaMm, mod.anchoLaminaMm, mod.calibreMm, mod.descuentoCaraPct, state.negociacionNovopan, mod.nombreComercial);
          mod.costoLaminaUsd = cal.costoLaminaUsd;
          mod.costoLaminaCop = cal.costoLaminaCop;
          mod.costoM2Usd = cal.costoM2Usd;
          mod.costoM2Cop = cal.costoM2Cop;
          mod.descuentoCaraPct = cal.descuentoCaraPct;
        } else {
          const areaM2 = (mod.largoLaminaMm * mod.anchoLaminaMm) / 1_000_000.0;
          mod.costoM2Usd = Number((mod.costoLaminaUsd / areaM2).toFixed(2));
          mod.costoLaminaCop = Math.round(mod.costoLaminaUsd * 4000);
          mod.costoM2Cop = Math.round(mod.costoM2Usd * 4000);
        }
        return mod;
      });
      try { localStorage.setItem("3bf_db_tableros", JSON.stringify(updated)); } catch {}
      return { dbTableros: updated };
    }),

  hidratarDesdeLocalStorage: () => {
    if (typeof window === "undefined") return;
    try {
      const hSaved = localStorage.getItem("3bf_db_herrajes");
      if (hSaved) set({ dbHerrajes: JSON.parse(hSaved) });

      const nSaved = localStorage.getItem("3bf_negociacion_novopan");
      const currentNeg: NegociacionNovopan = nSaved ? JSON.parse(nSaved) : NEGOCIACION_NOVOPAN_DEFECTO;
      if (nSaved) set({ negociacionNovopan: currentNeg });

      const tSaved = localStorage.getItem("3bf_db_tableros");
      if (tSaved) {
        const parsed: TableroRecord[] = JSON.parse(tSaved);
        const sanitized = parsed.map((t: TableroRecord) => {
          const lista = t.costoListaUsd ?? t.costoLaminaUsd ?? 43.568;
          if (t.proveedor === "Novopan") {
            const cal = calcularCostoLaminaNovopan(lista, t.largoLaminaMm || 2440, t.anchoLaminaMm || 2150, t.calibreMm || 15, undefined, currentNeg, t.nombreComercial);
            return {
              ...t,
              costoListaUsd: lista,
              costoLaminaUsd: cal.costoLaminaUsd,
              costoLaminaCop: cal.costoLaminaCop,
              costoM2Usd: cal.costoM2Usd,
              costoM2Cop: cal.costoM2Cop,
            };
          }
          const areaM2 = ((t.largoLaminaMm || 2440) * (t.anchoLaminaMm || 2150)) / 1_000_000.0;
          const laminaUsd = t.costoLaminaUsd ?? lista;
          const m2Usd = Number((laminaUsd / areaM2).toFixed(2));
          return {
            ...t,
            costoListaUsd: lista,
            costoLaminaUsd: laminaUsd,
            costoLaminaCop: t.costoLaminaCop ?? Math.round(laminaUsd * 4000),
            costoM2Usd: t.costoM2Usd ?? m2Usd,
            costoM2Cop: t.costoM2Cop ?? Math.round(m2Usd * 4000),
          };
        });
        set({ dbTableros: sanitized });
      }

      const cSaved = localStorage.getItem("3bf_db_cantos");
      if (cSaved) {
        const parsed: CantoRecord[] = JSON.parse(cSaved);
        const map = new Map<string, CantoRecord>();
        CANTOS_INICIALES_DEFECTO.forEach((c: CantoRecord) => map.set(c.codigo, c));
        parsed.forEach((c: CantoRecord) => map.set(c.codigo, c));
        const merged = Array.from(map.values());
        set({ dbCantos: merged });
      }

      const mSaved = localStorage.getItem("3bf_moneda");
      if (mSaved === "USD" || mSaved === "COP") set({ moneda: mSaved });

      const convSaved = localStorage.getItem("3bf_costos_conversion");
      if (convSaved) set({ costosConversion: JSON.parse(convSaved) });

      const fSaved = localStorage.getItem("3bf_fichas_config");
      if (fSaved) set({ fichasConfig: JSON.parse(fSaved) });
    } catch (e) {
      console.error("Error hidratando base de datos desde localStorage:", e);
    }
  },
}));
