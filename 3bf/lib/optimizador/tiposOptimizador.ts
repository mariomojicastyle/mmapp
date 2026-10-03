/**
 * =========================================================================================
 * ✂️ 3dBimFab Opti_Nesting — Contratos de Datos y Tipos TypeScript
 * Ecosistema de Optimización de Corte Industrial
 * Modos: Seccionadora (Guillotina), Celda Nesting CNC Morbidelli, Madera Maciza
 * =========================================================================================
 */

export type ModoOptimizacion = "seccionadora" | "nesting_cnc" | "madera_maciza";
export type EstrategiaMadera = "rip_first" | "crosscut_first";

export interface PiezaCorte {
  id: string;
  nombre: string;             // Nombre canónico Grasshopper: "Peça 1", "Peça 2"...
  descripcion?: string;       // En español: "Lateral izquierdo", "Frente cajón"...
  largo: number;              // Milímetros
  ancho: number;              // Milímetros
  espesor: number;            // Milímetros (15, 12, 3...)
  cantidad: number;           // Unidades a fabricar
  rotacionPermitida: boolean; // false si respeta veta estricta, true si es libre
  material: string;           // "MDP Nogal", "MDF Blanco", etc.
  colorHex?: string;          // Color visual para el Canvas
  instanciaNombre?: string;   // Si proviene de ensamble multi-instancia
}

export interface ConfiguracionLaminas {
  // Tamaño de lote (multiplicador de unidades de mueble / despiece a producir)
  tamanoLote?: number;        // Default: 1 (ej. 1, 5, 10, 50, 100 muebles)

  // Dimensiones del material bruto (tablero comercial estándar)
  largoBruto: number;         // ej. 2440 mm
  anchoBruto: number;         // ej. 1830 mm
  espesorBruto: number;       // ej. 15 mm
  
  // Parámetros de máquina
  kerfSierra: number;         // Modo 1: Espesor de disco (3.2 a 4.4 mm)
  diametroFresa: number;      // Modo 2: Diámetro fresa de compresión (10 o 12 mm)
  refiladoMargen: number;     // Margen perimetral de saneamiento (10 a 15 mm)
  
  // Nivel de Búsqueda Metaheurística / Algoritmo Multi-Iterativo
  nivelOptimizacion?: "rapido" | "estandar" | "intensivo"; // Default: "intensivo"
  
  // Parámetros de Madera Maciza (Modo 3)
  estrategiaMadera: EstrategiaMadera;
  largoTablonMm: number;      // ej. 3048 mm (10 pies)
  anchoTablonMm: number;      // ej. 203.2 mm (8 pulgadas)
  espesorTablonMm: number;    // ej. 25.4 mm (1 pulgada)
  costoPorPieTablar?: number; // Moneda local o USD
}

export interface PiezaColocada {
  piezaId: string;
  nombre: string;
  descripcion?: string;
  x: number;                  // Coordenada X dentro de la lámina (mm)
  y: number;                  // Coordenada Y dentro de la lámina (mm)
  ancho: number;              // Ancho posicionado (mm)
  largo: number;              // Largo posicionado (mm)
  rotada: boolean;            // Si se giró 90 grados respecto a su dimensión original
  colorHex: string;
  requiereOnionSkin?: boolean;// Para celda CNC si es pieza pequeña (< 0.08 m2)
}

export interface LineaCorteVisual {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  tipo: "guillotina_fase1" | "guillotina_fase2" | "guillotina_fase3" | "fresado_cnc";
}

export interface LaminaResultado {
  indice: number;
  espesor: number;
  material: string;
  anchoTotal: number;
  largoTotal: number;
  piezas: PiezaColocada[];
  lineasCorte?: LineaCorteVisual[];
  areaTotalMm2: number;
  areaUtilizadaMm2: number;
  porcentajeAprovechamiento: number;
  porcentajeDesperdicio: number;
  metrosLinealesCorte: number;
  
  // Métrica exclusiva Madera Maciza
  piesTablaresBrutos?: number;
  piesTablaresNetos?: number;
}

export interface ResultadoOptimizacionGlobal {
  modo: ModoOptimizacion;
  laminas: LaminaResultado[];
  totalLaminas: number;
  aprovechamientoPromedio: number;
  tiempoCalculoMs: number;
  semillaOptimizacion?: number;
  iteracionesEjecutadas?: number;
  piezasNoColocadas: PiezaCorte[];
  totalPiezasProgramadas: number;
  totalPiezasUbicadas: number;
}
