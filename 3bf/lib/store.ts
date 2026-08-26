import { create } from "zustand";

export const APP_VERSION = "vBeta 0.1";

export interface ObjetoInstancia3BF {
  id: string;                       // e.g. "inst_Cubierta_12345"
  nombreVisible: string;            // "Cubierta", "Cubierta_01", "Cubierta_02"
  definitionId: string;             // "Cubierta"
  archivo: string;                  // "Cubierta.ghx"
  ghxContent?: string;
  parametros: Record<string, any>;  // Parámetros específicos de esta instancia
  resultado: ComputoResultado | null; // Mallas 3D y despiece de esta instancia
  cargando: boolean;
  posicion: [number, number, number]; // [X, Y, Z] en metros
  rotacion: [number, number, number];
  posicionPrevia: [number, number, number];
}

export interface SnapshotEscenario {
  instancias: Record<string, ObjetoInstancia3BF>;
  objetoActivoId: string | null;
  posicionObjeto: [number, number, number];
  parametros: Record<string, any>;
  resultado: ComputoResultado | null;
}

export function generarNombreSecuencial(definitionId: string, instancias: Record<string, ObjetoInstancia3BF>): string {
  const baseName = definitionId.replace(/\.(gh|ghx)$/i, "").trim();
  const existentes = Object.values(instancias).map((i) => i.nombreVisible);

  if (!existentes.includes(baseName)) {
    return baseName;
  }

  // Buscar el sufijo numérico más alto (ej: Cubierta_01, Cubierta_02)
  let maxNum = 0;
  const regex = new RegExp(`^${baseName}_(\\d+)$`, "i");

  existentes.forEach((nom) => {
    const match = nom.match(regex);
    if (match) {
      const num = parseInt(match[1], 10);
      if (!isNaN(num) && num > maxNum) {
        maxNum = num;
      }
    }
  });

  const siguienteNum = String(maxNum + 1).padStart(2, "0");
  return `${baseName}_${siguienteNum}`;
}

export interface ColoresApariencia {
  // Colores de la vista (3D Viewport)
  fondo3D: string;
  rejillaPrincipal: string;
  rejillaSecundaria: string;
  ejeX: string;
  ejeY: string;
  ejeZ: string;
  iconoPlanoUniversalX: string;
  iconoPlanoUniversalY: string;
  iconoPlanoUniversalZ: string;

  // Visualización de objetos (3D BIM)
  objetosSeleccionados: string;
  objetosBloqueados: string;
  materialPorDefecto: string;
  mallasCristal: string;
  colorHerrajes: string;

  // Objetos de interfaz (UI 2D BIM)
  fondoAplicacion: string;
  fondoPaneles: string;
  bordePaneles: string;
  textoPrincipal: string;
  textoSecundario: string;
  textoLogotipo: string;
  color3BF: string;
  colorMarca: string;
  botonActivo: string;
  botonInactivo: string;
  bordeBotonInactivo: string;
  bordeControles: string;
  panelContenedor: string;
  fondoTopNav: string;
  insigniaFondo: string;
  insigniaTexto: string;
  estadoActivo: string;
  iconosFijos: string;

  // Ficha de Despiece, BOM & Base de Datos
  tablaEncabezadoFondo: string;
  tablaEncabezadoTexto: string;
  tablaFilaFondo: string;
  tablaBorde: string;
  tablaTotalFondo: string;
  tablaTotalTexto: string;
  kpiTarjetaFondo: string;
  kpiTarjetaTexto: string;

  // Colores de widget (Gizmo & Ejes)
  widgetEjeU: string;
  widgetEjeV: string;
  widgetEjeW: string;
  puntoSnap: string;
}

export const PRESET_COLORES_CLARO: ColoresApariencia = {
  fondo3D: "#F8FAFC",
  rejillaPrincipal: "#94A3B8",
  rejillaSecundaria: "#CBD5E1",
  ejeX: "#EF4444",
  ejeY: "#22C55E",
  ejeZ: "#3B82F6",
  iconoPlanoUniversalX: "#64748B",
  iconoPlanoUniversalY: "#64748B",
  iconoPlanoUniversalZ: "#64748B",

  objetosSeleccionados: "#FF9500",
  objetosBloqueados: "#94A3B8",
  materialPorDefecto: "#E2E8F0",
  mallasCristal: "#0284C7",
  colorHerrajes: "#CBD5E1",

  fondoAplicacion: "#F1F5F9",
  fondoPaneles: "#FFFFFF",
  bordePaneles: "#CBD5E1",
  textoPrincipal: "#0F172A",
  textoSecundario: "#64748B",
  textoLogotipo: "#0F172A",
  color3BF: "#FFFFFF",
  colorMarca: "#0891B2",
  botonActivo: "#0891B2",
  botonInactivo: "#E2E8F0",
  bordeBotonInactivo: "#CBD5E1",
  bordeControles: "#CBD5E1",
  panelContenedor: "#E2E8F0",
  fondoTopNav: "#FFFFFF",
  insigniaFondo: "#CFFAFE",
  insigniaTexto: "#0E7490",
  estadoActivo: "#10B981",
  iconosFijos: "#0891B2",

  tablaEncabezadoFondo: "#E2E8F0",
  tablaEncabezadoTexto: "#1E293B",
  tablaFilaFondo: "#FFFFFF",
  tablaBorde: "#CBD5E1",
  tablaTotalFondo: "#E2E8F0",
  tablaTotalTexto: "#0F172A",
  kpiTarjetaFondo: "#FFFFFF",
  kpiTarjetaTexto: "#0891B2",

  widgetEjeU: "#EF4444",
  widgetEjeV: "#22C55E",
  widgetEjeW: "#3B82F6",
  puntoSnap: "#FF9500",
};

export const PRESET_COLORES_OSCURO: ColoresApariencia = {
  fondo3D: "#0B0F17",
  rejillaPrincipal: "#334155",
  rejillaSecundaria: "#1E293B",
  ejeX: "#EF4444",
  ejeY: "#22C55E",
  ejeZ: "#3B82F6",
  iconoPlanoUniversalX: "#475569",
  iconoPlanoUniversalY: "#475569",
  iconoPlanoUniversalZ: "#475569",

  objetosSeleccionados: "#FF9500",
  objetosBloqueados: "#475569",
  materialPorDefecto: "#1E293B",
  mallasCristal: "#38BDF8",
  colorHerrajes: "#475569",

  fondoAplicacion: "#0B0F17",
  fondoPaneles: "#131B2E",
  bordePaneles: "#1E293B",
  textoPrincipal: "#F8FAFC",
  textoSecundario: "#F8FAFC",
  textoLogotipo: "#F8FAFC",
  color3BF: "#FFFFFF",
  colorMarca: "#0891B2",
  botonActivo: "#0891B2",
  botonInactivo: "#1E293B",
  bordeBotonInactivo: "#334155",
  bordeControles: "#334155",
  panelContenedor: "#131B2E",
  fondoTopNav: "#131B2E",
  insigniaFondo: "#083344",
  insigniaTexto: "#0891B2",
  estadoActivo: "#10B981",
  iconosFijos: "#0891B2",

  tablaEncabezadoFondo: "#1E293B",
  tablaEncabezadoTexto: "#F8FAFC",
  tablaFilaFondo: "#131B2E",
  tablaBorde: "#233044",
  tablaTotalFondo: "#0B0F17",
  tablaTotalTexto: "#0891B2",
  kpiTarjetaFondo: "#131B2E",
  kpiTarjetaTexto: "#0891B2",

  widgetEjeU: "#EF4444",
  widgetEjeV: "#22C55E",
  widgetEjeW: "#3B82F6",
  puntoSnap: "#FF9500",
};

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

export const MAPA_PARAMETROS: Record<string, string> = {
  "RH_IN:Ancho": "ancho",
  "RH_IN:01 Ancho": "ancho",
  "RH_IN:01.1 Ancho": "ancho",
  "RH_IN:01.0 Ancho": "ancho",
  "RH_IN:Alto": "alto",
  "RH_IN:02 Alto": "alto",
  "RH_IN:Profundidad": "profundidad",
  "RH_IN:01.2 Profundidad": "profundidad",
  "RH_IN:02 Profundidad": "profundidad",
  "RH_IN:02.0 Profundidad": "profundidad",
  "RH_IN:Cantidada de Cajones": "cant_cajones",
  "RH_IN:Cantidad de Cajones": "cant_cajones",
  "RH_IN:Profundidad cajon": "profundidad_cajon",
  "RH_IN:Altura lateral de cajon": "altura_lateral_cajon",
  "RH_IN:Distancia bajo laterales": "distancia_bajo_laterales",
  "RH_IN:Tipo Cajon": "tipo_cajon",
  "RH_IN:02.0 Union Derecha": "union_derecha",
  "RH_IN:02.1 Union izquierda": "union_izquierda",
  "RH_IN:03 Tipo de union izquierda": "union_izquierda",
  "RH_IN:04 Tipo de union Derecha": "union_derecha",
  "RH_IN:02.2 Recedido derecho": "recedido_derecho",
  "RH_IN:02.3 Recedido izquierdo": "recedido_izquierdo",
  "RH_IN:02.4 Orientacion maquinado minifix": "orientacion_maquinado_minifix",
  "RH_IN:02.5 Orientacion minifix": "orientacion_minifix",
  "RH_IN:05 Orientacion maquinado minifix": "orientacion_maquinado_minifix",
  "RH_IN:06 Orientacion minifix": "orientacion_minifix",
  "RH_IN:Posicion Tarugo": "posicion_tarugo",
  "RH_IN:02.4 Posicion Tarugo": "posicion_tarugo",
  "RH_IN:02.7 Posicion Tarugo": "posicion_tarugo",
  "RH_IN:Posicion Tornillo": "posicion_tornillo",
  "RH_IN:02.5Posicion Tornillo": "posicion_tornillo",
  "RH_IN:02.8 Posicion Tornillo": "posicion_tornillo",
  "RH_IN:02.3Posicion Minifix": "posicion_minifix",
  "RH_IN:02.6 Posicion Minifix": "posicion_minifix",
  "RH_IN:Borde izquierdo": "borde_izquierdo",
  "RH_IN:03.4 Borde izquierdo": "borde_izquierdo",
  "RH_IN:Borde derecho": "borde_derecho",
  "RH_IN:03.3 Borde derecho": "borde_derecho",
  "RH_IN:Lado balance cubierta": "lado_balance_cubierta",
  "RH_IN:03.1 Lado balance": "lado_balance_cubierta",
  "RH_IN:Tipo de mapeado cubierta": "tipo_mapeado_cubierta",
  "RH_IN:03.0 Mapeado": "tipo_mapeado_cubierta",
  "RH_IN:03.2 Tipo de mapeado": "tipo_mapeado_cubierta",
  "RH_IN:Lado balance": "lado_balance_cubierta",
  "RH_IN:Tipo de mapeado": "tipo_mapeado_cubierta",
  "RH_IN:Lado balance entrepaño": "lado_balance_entrepanio",
  "RH_IN:Tipo de mapeado entrepaño": "tipo_mapeado_entrepanio",
};

export interface CarpetaMuebleNode {
  id: string; // ej: "rta-design" o "rta-design/escritorios"
  nombre: string; // ej: "RTA Design", "Escritorios"
  tipo: "marca" | "tipologia";
  padreId: string | null;
  ruta: string;
  subcarpetas?: CarpetaMuebleNode[];
}

export interface MuebleGuardadoItem {
  id: string;
  nombre: string;
  marca: string;
  tipologia: string;
  rutaCarpeta: string;
  fechaGuardado: string;
  thumbnail?: string;
  descripcionComercial?: string;
  instancias: Record<string, ObjetoInstancia3BF>;
  fichaConfig?: FichaCostosConfig;
  dimensionesEnvolventes?: { ancho: number; alto: number; profundidad: number };
  totalPiezas?: number;
  costoEstimadoCop?: number;
  costoEstimadoUsd?: number;
}

export interface PiezaDespiece {
  nombre: string;
  descripcion?: string;
  ancho: number;
  largo: number;
  espesor: number;
  cantidad: number;
  tipo?: string;
  pos?: [number, number, number];
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
  perforaciones_nurbs?: Array<{
    name: string;
    size_mm: [number, number, number];
    center_local_m: [number, number, number];
    diametro_mm: number;
    profundidad_mm: number;
    eje_principal: "X" | "Y" | "Z";
    tipo: "guia_d5" | "tarugo_d8" | "caja_d15" | "bisagra_d35" | "otro";
  }>;
  declared_outputs?: string[];
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

export interface PerforacionCruzadaItem {
  origen_instancia_id: string;
  origen_instancia_nombre: string;
  nombre_perforacion: string;
  tablero_destino: string;
  tipo: string;
  diametro_mm: number;
  profundidad_mm: number;
  cara: "cara_superior" | "canto_izq" | "canto_der" | "canto_sup" | "canto_inf";
  capa_dxf: string;
  u_mm: number;
  v_mm: number;
  pos_mundial_m: [number, number, number];
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
  intensidadLuzEntorno: number;  // 0.0 a 3.0 (Luz de Entorno HDRI / IBL)
  intensidadLuzRelleno: number;  // 0.0 a 2.0 (Luz de Relleno / Fill Light)
  mostrarAristas: boolean;       // true/false
  mostrarPanelCalibracion: boolean; // Toggle flotante
  // Configuración de la Malla del Escenario (Grid / Ground Plane)
  mostrarGrilla: boolean;           // Activar / Desactivar malla
  mostrarEjesCoordenadas: boolean;  // Activar / Desactivar ejes X / Y
  mostrarEjeX: boolean;             // Activar / Desactivar Eje X
  mostrarEjeY: boolean;             // Activar / Desactivar Eje Y
  distanciaCuadricula: number;      // cellSize (en metros, e.g. 0.01 = 10mm)
  grosorGrillaDelgada: number;      // cellThickness (e.g. 1.0)
  colorGrillaDelgada: string;       // cellColor (e.g. "#E5E7EB")
  distanciaSeccion: number;         // sectionSize (en metros, e.g. 0.1 = 100mm)
  grosorGrillaGruesa: number;       // sectionThickness (e.g. 1.5)
  colorGrillaGruesa: string;        // sectionColor (e.g. "#0088aa")
  colorEjeX: string;                // Hex (#ef4444)
  colorEjeY: string;                // Hex (#22c55e)

  // Propiedades de Rejilla (Estándar Rhinoceros 8)
  numeroLineasRejilla: number;          // e.g. 500
  espaciadoRejillaSecundariaMm: number; // e.g. 10 (milímetros)
  lineasPrincipalesCada: number;        // e.g. 10 (líneas de rejilla secundarias)
  mostrarIconoPlanoUniversal: boolean;  // Mostrar icono de ejes del plano universal

  // 📷 Calibración de Cámara y Zoom
  zoomMinimoMetros: number;             // Distancia mínima de acercamiento (e.g. 0.02 = 2cm)
  zoomMaximoMetros: number;             // Distancia máxima de alejamiento (e.g. 30m)
  campoDeVisionFov: number;             // Lente / FOV en grados (e.g. 45°)
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
  trmNovopan: number;               // 3000 COP
  gastosNacionalizacionPct: number; // 8.70%
  financiacionPct: number;          // 1.10%
  fleteInternacionalM3Usd: number;  // 18.57 USD/m3
}

export const NEGOCIACION_NOVOPAN_DEFECTO: NegociacionNovopan = {
  apoyoVolumenPct: 20.00,
  apoyoTasaPct: 15.10,
  prontoPagoPct: 3.50,
  trmNovopan: 3000,
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
  { id: "h1", codigo: "70419208", nombreGhx: "Perno", descripcion: "Perno Minifix 34mm Acero/Plástico", categoria: "Minifix", mallasPorUnidad: 2, costoCop: 117, costoUsd: 0.039, unidad: "UND", pesoKg: 0.005, proveedor: "Hafele" },
  { id: "h2", codigo: "70419115", nombreGhx: "Caja", descripcion: "Caja Minifix 15mm Zamak Niquelada", categoria: "Minifix", mallasPorUnidad: 1, costoCop: 138, costoUsd: 0.046, unidad: "UND", pesoKg: 0.008, proveedor: "Hafele" },
  { id: "h3", codigo: "006419", nombreGhx: "Tarugo", descripcion: "Tarugo de Madera Estriado 8x30mm", categoria: "Tarugos", mallasPorUnidad: 1, costoCop: 23, costoUsd: 0.008, unidad: "UND", pesoKg: 0.001, proveedor: "Nacional" },
  { id: "h4", codigo: "0000854", nombreGhx: "Tornillo", descripcion: "Tornillo Ensamble 4x50mm Cincado", categoria: "Tornillos", mallasPorUnidad: 1, costoCop: 37, costoUsd: 0.012, unidad: "UND", pesoKg: 0.003, proveedor: "Spax" },
  { id: "h5", codigo: "021948", nombreGhx: "Soporte", descripcion: "Soporte de Entrepaño con Perno Ø5mm", categoria: "Soportes", mallasPorUnidad: 1, costoCop: 204, costoUsd: 0.068, unidad: "UND", pesoKg: 0.004, proveedor: "Ducasse" },
  { id: "h6", codigo: "80350194", nombreGhx: "Corredera Estandar", descripcion: "Par Correderas Telescópicas 450mm Cierre Suave", categoria: "Correderas", mallasPorUnidad: 2, costoCop: 24650, costoUsd: 8.22, unidad: "PAR", pesoKg: 0.450, proveedor: "Ducasse" },
  { id: "h7", codigo: "000892", nombreGhx: "Bisagra Codo 0", descripcion: "Bisagra Recta 35mm Cierre Suave con Base 4 Huecos", categoria: "Bisagras", mallasPorUnidad: 2, costoCop: 10650, costoUsd: 3.55, unidad: "UND", pesoKg: 0.085, proveedor: "Blum" },
  { id: "h8", codigo: "000735", nombreGhx: "Manija Bar", descripcion: "Tirador Metálico 128mm Negro Mate", categoria: "Accesorios", mallasPorUnidad: 1, costoCop: 12790, costoUsd: 4.26, unidad: "UND", pesoKg: 0.120, proveedor: "Ducasse" },
];

// Cálculo inicial de Duratex con la matriz de negociación
const cal15 = calcularCostoLaminaNovopan(58.468, 2440, 2150, 15, 5.0, NEGOCIACION_NOVOPAN_DEFECTO, "DURATEX Trama Marfil 15mm 215x244");
const cal25 = calcularCostoLaminaNovopan(95.170, 2440, 2150, 25, 0.0, NEGOCIACION_NOVOPAN_DEFECTO, "DURATEX Trama Marfil 25mm 215x244");

export const TABLEROS_INICIALES_DEFECTO: TableroRecord[] = [
  { id: "t1", codigo: "DX-158402", sustrato: "MDP", nombreComercial: "DURATEX Trama Marfil 15mm 215x244", calibreMm: 15, largoLaminaMm: 2440, anchoLaminaMm: 2150, costoListaUsd: 58.468, descuentoCaraPct: 5.0, costoLaminaUsd: cal15.costoLaminaUsd, costoLaminaCop: cal15.costoLaminaCop, costoM2Usd: cal15.costoM2Usd, costoM2Cop: cal15.costoM2Cop, proveedor: "Duratex" },
  { id: "t2", codigo: "DX-259104", sustrato: "MDP", nombreComercial: "DURATEX Trama Marfil 25mm 215x244", calibreMm: 25, largoLaminaMm: 2440, anchoLaminaMm: 2150, costoListaUsd: 95.170, descuentoCaraPct: 0.0, costoLaminaUsd: cal25.costoLaminaUsd, costoLaminaCop: cal25.costoLaminaCop, costoM2Usd: cal25.costoM2Usd, costoM2Cop: cal25.costoM2Cop, proveedor: "Duratex" },
  { id: "t3", codigo: "DX-157219", sustrato: "MDP", nombreComercial: "DURATEX Carboncillo Matt 15mm 183x244", calibreMm: 15, largoLaminaMm: 2440, anchoLaminaMm: 1830, costoListaUsd: 37.700, descuentoCaraPct: 0.0, costoLaminaUsd: 37.70, costoLaminaCop: 113100, costoM2Usd: 8.44, costoM2Cop: 25320, proveedor: "Duratex" },
  { id: "t4", codigo: "DX-031840", sustrato: "HDF", nombreComercial: "FONDO Blanco Puro 2.7mm 210x280", calibreMm: 2.7, largoLaminaMm: 2800, anchoLaminaMm: 2100, costoListaUsd: 14.200, descuentoCaraPct: 0.0, costoLaminaUsd: 14.20, costoLaminaCop: 42600, costoM2Usd: 2.41, costoM2Cop: 7230, proveedor: "Duratex" },
  { id: "t5", codigo: "DX-184920", sustrato: "MDF RH", nombreComercial: "DURATEX Ultra RH Hidrófugo 18mm 183x244", calibreMm: 18, largoLaminaMm: 2440, anchoLaminaMm: 1830, costoListaUsd: 61.520, descuentoCaraPct: 0.0, costoLaminaUsd: 61.52, costoLaminaCop: 184560, costoM2Usd: 13.78, costoM2Cop: 41340, proveedor: "Duratex" },
];

export const CANTOS_INICIALES_DEFECTO: CantoRecord[] = [
  { id: "c_948201", codigo: "948201", descripcion: "CANTO PVC MARFIL 19MM", espesorMm: 0.5, anchoMm: 19, tipo: "Flexible", costoMlCop: 262.25, costoMlUsd: 0.065, proveedor: "Duratex" },
  { id: "c_948222", codigo: "948222", descripcion: "CANTO PVC TERRA 19MM", espesorMm: 0.5, anchoMm: 19, tipo: "Flexible", costoMlCop: 265.16, costoMlUsd: 0.066, proveedor: "Duratex" },
  { id: "c1", codigo: "839105", descripcion: "Canto PVC Marfil 19mm x 0.5mm", espesorMm: 0.5, anchoMm: 19, tipo: "Flexible", costoMlCop: 510, costoMlUsd: 0.128, proveedor: "Duratex" },
  { id: "c2", codigo: "720194", descripcion: "Canto PVC Rígido Marfil 22mm x 2.0mm", espesorMm: 2.0, anchoMm: 22, tipo: "Rígido 2mm", costoMlCop: 2535, costoMlUsd: 0.634, proveedor: "Duratex" },
  { id: "c3", codigo: "720195", descripcion: "Canto PVC Rígido Marfil 33mm x 2.0mm", espesorMm: 2.0, anchoMm: 33, tipo: "Rígido 2mm", costoMlCop: 3320, costoMlUsd: 0.830, proveedor: "Duratex" },
  { id: "c4", codigo: "519402", descripcion: "Canto PVC Blanco 19mm x 0.5mm", espesorMm: 0.5, anchoMm: 19, tipo: "Flexible", costoMlCop: 445, costoMlUsd: 0.111, proveedor: "Proadec" },
  { id: "c5", codigo: "630281", descripcion: "Canto PVC Rígido Carboncillo 22mm x 2.0mm", espesorMm: 2.0, anchoMm: 22, tipo: "Rígido 2mm", costoMlCop: 3228, costoMlUsd: 0.807, proveedor: "Duratex" },
  { id: "c6", codigo: "419208", descripcion: "Canto PVC Terra 19mm x 0.5mm", espesorMm: 0.5, anchoMm: 19, tipo: "Flexible", costoMlCop: 513, costoMlUsd: 0.128, proveedor: "Duratex" },
  { id: "c7", codigo: "419222", descripcion: "Canto PVC Rígido Terra 22mm x 2.0mm", espesorMm: 2.0, anchoMm: 22, tipo: "Rígido 2mm", costoMlCop: 2516, costoMlUsd: 0.629, proveedor: "Duratex" },
  { id: "c8", codigo: "419233", descripcion: "Canto PVC Rígido Terra 33mm x 2.0mm", espesorMm: 2.0, anchoMm: 33, tipo: "Rígido 2mm", costoMlCop: 3380, costoMlUsd: 0.845, proveedor: "Duratex" },
  { id: "c9", codigo: "318492", descripcion: "Canto PVC Everest 33mm x 2.0mm", espesorMm: 2.0, anchoMm: 33, tipo: "Rígido 2mm", costoMlCop: 3240, costoMlUsd: 0.810, proveedor: "Rehau" },
];

// ==============================================================================
// 🤖 3BF AI RENDER STUDIO: BIBLIOTECA DE PROMPTS Y GENERACIÓN FOTORREALISTA (GEMINI / IMAGEN 3)
// ==============================================================================

export interface PromptTemplateItem {
  id: string;
  titulo: string;
  categoria: "Oficina" | "Hogar / Sala" | "Dormitorio" | "Comercial / Tienda" | "Estudio Fotográfico" | "Exterior / Terraza" | "Personalizado";
  prompt: string;
  descripcion?: string;
  esFavorito?: boolean;
  esPresetSistema?: boolean;
  aspectRatio?: "1:1" | "16:9" | "4:3" | "9:16";
  creadoEn?: string;
}

export interface RenderIAResultado {
  id: string;
  muebleNombre: string;
  promptUsado: string;
  imageUrl: string;
  imageBase64Original?: string;
  motorUsado: "fal_nano_banana_pro" | "fal_nano_banana" | "fal_phota_enhance" | "fal_bria_product_shot" | "fal_flux_dev" | "fal_flux_schnell" | "google_gemini_imagen3" | "flux_schnell_free" | "pollinations";
  fecha: string;
  aspectRatio: string;
}

export const PROMPTS_INICIALES_DEFECTO: PromptTemplateItem[] = [
  {
    id: "preset_oficina_nordica_editorial",
    titulo: "Oficina Editorial (Laptop & Ventanal)",
    categoria: "Oficina",
    prompt: "Fotografía editorial de arquitectura de alta gama del mueble adjunto en una oficina. Mantén el 100% de la geometría, diseño de cajones y tono de madera del producto. Decora el entorno con elementos sutiles (laptop delgada de última generación, lámpara de sobremesa, libros de arte), suelo de madera clara, gran ventanal con luz diurna suave y sombras de contacto reales de estudio.",
    descripcion: "Ambiente de oficina corporativa con laptop, lámpara y luz de ventana.",
    esFavorito: true,
    esPresetSistema: true,
    aspectRatio: "1:1"
  },
  {
    id: "preset_estudio_fondo_blanco",
    titulo: "Calibración: Fondo Blanco Puro de Estudio",
    categoria: "Estudio Fotográfico",
    prompt: "Fotografía comercial de catálogo del mueble de madera adjunto, centrado sobre un ciclorama blanco puro de estudio sin juntas. Preserva estrictamente el 100% del diseño original, proporciones y tono de madera. Iluminación profesional softbox de tres puntos con sombras de contacto suaves y naturales en el piso. Acabado de catálogo de alta fidelidad 8k.",
    descripcion: "Calibración de producto sobre ciclorama blanco puro con sombra de contacto en el piso.",
    esFavorito: true,
    esPresetSistema: true,
    aspectRatio: "1:1"
  },
  {
    id: "preset_oficina_moderna",
    titulo: "Oficina Ejecutiva Diurna",
    categoria: "Oficina",
    prompt: "Fotografía arquitectónica del mueble adjunto ubicado en una oficina ejecutiva luminosa. Preserva fielmente el diseño y proporciones del producto. Ventanales de piso a techo con luz natural matutina, suelo de madera pulida, plantas de interior e iluminación cinemática.",
    descripcion: "Ambiente corporativo con ventanales e iluminación diurna natural.",
    esFavorito: true,
    esPresetSistema: true,
    aspectRatio: "16:9"
  },
  {
    id: "preset_sala_japandi",
    titulo: "Sala de Estar",
    categoria: "Hogar / Sala",
    prompt: "Fotografía de diseño interior del mueble de madera adjunto en una sala de estar. Suelo de roble claro, alfombra de lana beige, iluminación ambiental suave y difusa, paredes de yeso texturizado y sombras físicas realistas.",
    descripcion: "Ambiente de sala con madera clara y textiles suaves.",
    esFavorito: true,
    esPresetSistema: true,
    aspectRatio: "1:1"
  },
  {
    id: "preset_dormitorio_contemporaneo",
    titulo: "Dormitorio",
    categoria: "Dormitorio",
    prompt: "Fotografía de diseño interior del mueble adjunto ubicado en un dormitorio. Cortinas de lino suave, iluminación cálida de acento, tonos tierra neutros y acabado hiperrealista de los materiales de madera.",
    descripcion: "Dormitorio con iluminación cálida de acento y tonos neutros.",
    esFavorito: false,
    esPresetSistema: true,
    aspectRatio: "16:9"
  },
  {
    id: "preset_estudio_fotografico",
    titulo: "Estudio Comercial / Catálogo Fondo Neutro",
    categoria: "Estudio Fotográfico",
    prompt: "Fotografía de estudio de producto comercial sobre fondo ciclorama neutro beige claro. Iluminación de estudio de tres puntos, sombras suaves de contacto, textura de veta de madera ultra detallada y enfoque nítido de catálogo comercial.",
    descripcion: "Fondo ciclorama neutro de estudio para catálogo comercial y e-commerce.",
    esFavorito: true,
    esPresetSistema: true,
    aspectRatio: "1:1"
  },
  {
    id: "preset_cocina_comedor",
    titulo: "Cocina / Comedor",
    categoria: "Hogar / Sala",
    prompt: "Fotografía editorial de diseño interior del mueble adjunto integrado en una cocina y comedor. Toques de mármol de fondo, iluminación LED ambiental cálida, luz natural realista y acabados prémium.",
    descripcion: "Ambiente integrado con acabados de alta gama y mármol respetando el mueble.",
    esFavorito: false,
    esPresetSistema: true,
    aspectRatio: "16:9"
  },
  {
    id: "preset_showroom_boutique",
    titulo: "Showroom Comercial / Tienda Boutique",
    categoria: "Comercial / Tienda",
    prompt: "Fotografía arquitectónica de interior del mueble exhibido en un showroom o tienda boutique. Iluminación arquitectónica focalizada, suelo de terrazo pulido y decoración sobria.",
    descripcion: "Exhibición en tienda boutique con focos de acento respetando el diseño del mueble.",
    esFavorito: false,
    esPresetSistema: true,
    aspectRatio: "16:9"
  }
];

// ==============================================================================
// 🎨 SISTEMA NATIVO DE CAPAS, MATERIALES PBR Y DESGLOSE DE PARTES 3DBIMFAB (3BF)
// ==============================================================================

export interface MaterialPBRDef {
  id: string;             // ej: "mat_acero", "mat_duna", "mat_marfil"
  nombre: string;         // ej: "Acero", "Duna", "M_Marfil", "MDF", "MDP", "Cromo", "P_Negro"
  tipo: "PBR" | "Melamina" | "Madera" | "Metal" | "Plastico" | "Pintura" | "Textil" | "Vidrio";
  colorBase: string;      // Hex "#C5B39A", "#8A9EA7"
  texturaUrl?: string;    // Albedo / Diffuse Map ("/textures/Marfil_diffuse.jpg" o DataURL)
  normalMapUrl?: string;  // Normal Map Tangente RGB (DataURL o ruta)
  roughnessMapUrl?: string; // Roughness Map B&N (DataURL o ruta)
  metallicMapUrl?: string;  // Metallic Map B&N (DataURL o ruta)
  aoMapUrl?: string;        // Ambient Occlusion Map B&N (DataURL o ruta)
  
  // Parámetros Físicos Principled BSDF
  metalico: number;       // 0.00 a 1.00
  rugosidad: number;      // 0.00 a 1.00
  especularidad: number;  // F0 0.00 a 1.00
  normalScale?: number;   // Intensidad de relieve (0.0 a 3.0, def: 1.0)
  aoIntensity?: number;   // Intensidad de oclusión de cavidades (0.0 a 2.0, def: 1.0)
  clearcoat?: number;     // Capa de resina protectora / barniz (0.0 a 1.0, def: 0.0)
  clearcoatRoughness?: number; // Rugosidad de resina (0.0 a 1.0, def: 0.1)
  opacidad: number;       // 0.00 a 1.00 (Alfa / Transmisión)
  ior: number;            // Índice de refracción (1.00 a 2.50)
  
  // Ajustes de Textura en Calibrador
  ajustesTextura?: {
    brillo?: number;
    contraste?: number;
    saturacion?: number;
    normalInvertY?: boolean;
    roughnessInvert?: boolean;
  };

  marcaProveedor?: string; // "Pelíkano", "Arauco", "Finsa", "Novopan", etc.
  notas?: string;         // Especificaciones de taller o proveedor
}

export interface CapaDef {
  id: string;             // ej: "capa_acero", "capa_tono", "capa_mdp"
  nombre: string;         // ej: "Acero", "Aluminio", "Tono", "Back", "Cromo", "MDP", "MDF", "Herrajes", "Perforados"
  activa: boolean;        // Capa seleccionada actualmente
  visible: boolean;       // Visibilidad en viewport (💡)
  bloqueada: boolean;     // Bloqueo de interacción (🔒)
  color: string;          // Color representativo de la capa (Hex)
  materialId: string;     // ID del MaterialPBRDef asignado por defecto a la capa
  tipoLinea?: string;     // "Continua"
}

export interface AsignacionParteDef {
  parteKey: string;       // Nombre de malla o RH_OUT (ej. "RH_OUT:Maquinados", "RH_OUT:MDP", "RH_OUT:Perno")
  nombreVisible: string;  // "Maquinados", "Tablero MDP", "Perno Minifix", etc.
  capaId: string;         // "por_defecto" | id de CapaDef (ej: "capa_herrajes")
  materialId: string;     // "por_capa" | id de MaterialPBRDef (ej: "mat_acero")
  visible: boolean;       // Visibilidad específica por parte
}

export const PRESET_MATERIALES_PBR: MaterialPBRDef[] = [
  { id: "mat_acero", nombre: "Acero", tipo: "Metal", colorBase: "#8A9EA7", metalico: 0.90, rugosidad: 0.20, especularidad: 0.90, opacidad: 1.0, ior: 1.50, notas: "Acero pulido para herrajes y pernos" },
  { id: "mat_aluminio", nombre: "Aluminio", tipo: "Metal", colorBase: "#CBD5E1", metalico: 0.85, rugosidad: 0.30, especularidad: 0.80, opacidad: 1.0, ior: 1.50, notas: "Aluminio anodizado natural" },
  { id: "mat_marfil", nombre: "M_Marfil", tipo: "Melamina", colorBase: "#C5B39A", texturaUrl: "/textures/Marfil_diffuse.jpg", metalico: 0.05, rugosidad: 0.65, especularidad: 0.50, opacidad: 1.0, ior: 1.50, notas: "Melamina Novopan MDPKOR Marfil" },
  { id: "mat_duna", nombre: "Duna", tipo: "Melamina", colorBase: "#D2B48C", texturaUrl: "/textures/wood_melamine.jpg", metalico: 0.05, rugosidad: 0.60, especularidad: 0.50, opacidad: 1.0, ior: 1.50, notas: "Melamina Duna tono madera cálida" },
  { id: "mat_fresno", nombre: "M_Fresno", tipo: "Madera", colorBase: "#C2A67E", metalico: 0.02, rugosidad: 0.55, especularidad: 0.50, opacidad: 1.0, ior: 1.50, notas: "Madera Fresno poro abierto" },
  { id: "mat_cromo", nombre: "Cromo", tipo: "Metal", colorBase: "#E2E8F0", metalico: 1.00, rugosidad: 0.05, especularidad: 1.00, opacidad: 1.0, ior: 1.50, notas: "Cromado brillante tipo espejo" },
  { id: "mat_blanco", nombre: "M_Blanco", tipo: "Melamina", colorBase: "#FFFFFF", metalico: 0.05, rugosidad: 0.70, especularidad: 0.50, opacidad: 1.0, ior: 1.50, notas: "Melamina Blanco Glacial mate" },
  { id: "mat_mdf", nombre: "MDF", tipo: "Madera", colorBase: "#BDB088", metalico: 0.00, rugosidad: 0.85, especularidad: 0.30, opacidad: 1.0, ior: 1.50, notas: "Sustrato MDF crudo fibroso" },
  { id: "mat_mdp", nombre: "MDP", tipo: "Madera", colorBase: "#D5B88A", metalico: 0.00, rugosidad: 0.80, especularidad: 0.30, opacidad: 1.0, ior: 1.50, notas: "Sustrato MDP aglomerado canto expuesto" },
  { id: "mat_nurbs", nombre: "Nurbs", tipo: "PBR", colorBase: "#E036C0", metalico: 0.10, rugosidad: 0.30, especularidad: 0.60, opacidad: 0.85, ior: 1.50, notas: "Geometría analítica CAD" },
  { id: "mat_pnegro", nombre: "P_Negro", tipo: "Plastico", colorBase: "#1A1A1A", metalico: 0.10, rugosidad: 0.40, especularidad: 0.50, opacidad: 1.0, ior: 1.50, notas: "Plástico inyectado negro" },
  { id: "mat_pblanco", nombre: "P_Blanco", tipo: "Plastico", colorBase: "#F1F5F9", metalico: 0.10, rugosidad: 0.40, especularidad: 0.50, opacidad: 1.0, ior: 1.50, notas: "Plástico inyectado blanco" },
  { id: "mat_pintura_neg", nombre: "Pintura_Negra", tipo: "Pintura", colorBase: "#0F172A", metalico: 0.30, rugosidad: 0.35, especularidad: 0.60, opacidad: 1.0, ior: 1.50, notas: "Pintura electrostática negra mate" },
  { id: "mat_pintura_bla", nombre: "Pintura_Blanca", tipo: "Pintura", colorBase: "#F8FAFC", metalico: 0.30, rugosidad: 0.35, especularidad: 0.60, opacidad: 1.0, ior: 1.50, notas: "Pintura electrostática blanca satinada" },
  { id: "mat_zinc", nombre: "Zinc", tipo: "Metal", colorBase: "#94A3B8", metalico: 0.80, rugosidad: 0.35, especularidad: 0.70, opacidad: 1.0, ior: 1.50, notas: "Zincado plateado anticorrosivo" },
  { id: "mat_perforados", nombre: "Perforados", tipo: "PBR", colorBase: "#EF4444", metalico: 0.00, rugosidad: 0.50, especularidad: 0.50, opacidad: 1.0, ior: 1.50, notas: "Guías de maquinado CNC y perforaciones" },
  { id: "mat_bim", nombre: "BIM", tipo: "PBR", colorBase: "#06B6D4", metalico: 0.20, rugosidad: 0.30, especularidad: 0.70, opacidad: 0.75, ior: 1.50, notas: "Ejes y metadatos constructivos BIM" },
  { id: "mat_zincado", nombre: "Zincado", tipo: "Metal", colorBase: "#A1A1AA", metalico: 0.85, rugosidad: 0.25, especularidad: 0.75, opacidad: 1.0, ior: 1.50, notas: "Herrajes zincados brillantes" },
];

export const PRESET_CAPAS: CapaDef[] = [
  { id: "capa_acero", nombre: "Acero", activa: false, visible: true, bloqueada: false, color: "#8A9EA7", materialId: "mat_acero" },
  { id: "capa_aluminio", nombre: "Aluminio", activa: true, visible: true, bloqueada: false, color: "#CBD5E1", materialId: "mat_aluminio" },
  { id: "capa_tono", nombre: "Tono", activa: false, visible: true, bloqueada: false, color: "#EAB308", materialId: "mat_marfil" },
  { id: "capa_back", nombre: "Back", activa: false, visible: true, bloqueada: false, color: "#D97706", materialId: "mat_fresno" },
  { id: "capa_cromo", nombre: "Cromo", activa: false, visible: true, bloqueada: false, color: "#93C5FD", materialId: "mat_cromo" },
  { id: "capa_espaldar", nombre: "Espaldar", activa: false, visible: true, bloqueada: false, color: "#64748B", materialId: "mat_blanco" },
  { id: "capa_mdf", nombre: "MDF", activa: false, visible: true, bloqueada: false, color: "#0D9488", materialId: "mat_mdf" },
  { id: "capa_mdp", nombre: "MDP", activa: false, visible: true, bloqueada: false, color: "#B45309", materialId: "mat_mdp" },
  { id: "capa_nurbs", nombre: "Nurbs", activa: false, visible: true, bloqueada: false, color: "#A855F7", materialId: "mat_nurbs" },
  { id: "capa_plastico_1", nombre: "Plastico_1", activa: false, visible: true, bloqueada: false, color: "#18181B", materialId: "mat_pnegro" },
  { id: "capa_plastico_2", nombre: "Plastico_2", activa: false, visible: true, bloqueada: false, color: "#FFFFFF", materialId: "mat_pblanco" },
  { id: "capa_madera", nombre: "Madera", activa: false, visible: true, bloqueada: false, color: "#854D0E", materialId: "mat_fresno" },
  { id: "capa_pintura_met_n", nombre: "Pintura_Met_N", activa: false, visible: true, bloqueada: false, color: "#09090B", materialId: "mat_pintura_neg" },
  { id: "capa_pintura_met_b", nombre: "Pintura_Met_B", activa: false, visible: true, bloqueada: false, color: "#F4F4F5", materialId: "mat_pintura_bla" },
  { id: "capa_zinc", nombre: "Zinc", activa: false, visible: true, bloqueada: false, color: "#10B981", materialId: "mat_zinc" },
  { id: "capa_perforados", nombre: "Perforados", activa: false, visible: true, bloqueada: false, color: "#EF4444", materialId: "mat_perforados" },
  { id: "capa_bim", nombre: "BIM", activa: false, visible: true, bloqueada: false, color: "#06B6D4", materialId: "mat_bim" },
  { id: "capa_herrajes", nombre: "Herrajes", activa: false, visible: true, bloqueada: false, color: "#27272A", materialId: "mat_acero" },
  { id: "capa_zincado", nombre: "Zincado", activa: false, visible: true, bloqueada: false, color: "#E4E4E7", materialId: "mat_zincado" },
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

  // Blender N-Panel (Sidebar Multifuncional con tecla N)
  mostrarNPanel: boolean;
  setMostrarNPanel: (mostrar: boolean | ((prev: boolean) => boolean)) => void;
  pestanaNPanel: "componentes" | "muebles" | "capas" | "partes" | "materiales" | "calibrar" | "apariencia";
  setPestanaNPanel: (pestana: "componentes" | "muebles" | "capas" | "partes" | "materiales" | "calibrar" | "apariencia") => void;
  anchoNPanel: number;
  setAnchoNPanel: (ancho: number) => void;
  anchoPanelDerecho: number;
  setAnchoPanelDerecho: (ancho: number) => void;

  // 🎨 Sistema de Capas, Materiales PBR y Partes GHX
  capas: CapaDef[];
  materialesPBR: MaterialPBRDef[];
  materialSeleccionadoId: string;
  asignacionesPartes: Record<string, AsignacionParteDef>;
  crearCapa: (capa?: Partial<CapaDef>) => string;
  actualizarCapa: (id: string, cambios: Partial<CapaDef>) => void;
  eliminarCapa: (id: string) => void;
  toggleVisibilidadCapa: (id: string) => void;
  toggleBloqueoCapa: (id: string) => void;
  crearMaterialPBR: (material?: Partial<MaterialPBRDef>) => string;
  actualizarMaterialPBR: (id: string, cambios: Partial<MaterialPBRDef>) => void;
  eliminarMaterialPBR: (id: string) => void;
  setMaterialSeleccionadoId: (id: string) => void;
  asignarParteACapa: (parteKey: string, capaId: string, nombreVisible?: string) => void;
  asignarParteAMaterial: (parteKey: string, materialId: string) => void;
  toggleVisibilidadParte: (parteKey: string) => void;
  resetCapasYMateriales: () => void;

  // 🎨 Apariencia & Personalización de Colores y Tipografía
  esquemaColor: "claro" | "oscuro";
  coloresApariencia: ColoresApariencia;
  fuenteInterfaz: string;
  setEsquemaColor: (esquema: "claro" | "oscuro") => void;
  setColorApariencia: (clave: keyof ColoresApariencia, valor: string) => void;
  setFuenteInterfaz: (fuente: string) => void;
  restaurarColoresApariencia: () => void;
  guardarComoPredefinido: () => void;
  cargarColoresPredefinidos: () => void;

  // Catálogo de Muebles (Asset Browser Blender Style / Google Drive)
  arbolCarpetasMuebles: CarpetaMuebleNode[];
  mueblesGuardados: MuebleGuardadoItem[];
  muebleActivoGuardado: MuebleGuardadoItem | null;
  carpetaSeleccionadaId: string;
  modalGuardarComoAbierto: boolean;
  guardandoMueble: boolean;
  urlGoogleDrive: string;

  setCarpetaSeleccionadaId: (id: string) => void;
  setModalGuardarComoAbierto: (abierto: boolean) => void;
  setUrlGoogleDrive: (url: string) => void;
  cargarArbolMuebles: () => Promise<void>;
  crearCarpetaMueble: (nombre: string, tipo?: "marca" | "tipologia", padreId?: string | null) => Promise<boolean>;
  guardarMuebleComo: (datos: { nombre: string; marca: string; tipologia: string; descripcion?: string }) => Promise<boolean>;
  guardarCambiosMueble: () => Promise<boolean>;
  renombrarMuebleGuardado: (id: string, nuevoNombre: string) => Promise<boolean>;
  actualizarThumbnailMueble: (id: string, thumbnail: string) => Promise<boolean>;
  eliminarMuebleGuardado: (id: string) => Promise<boolean>;
  abrirMueble: (mueble: MuebleGuardadoItem) => Promise<void>;

  // Multi-Instancia GHX en Escenario 3D
  instancias: Record<string, ObjetoInstancia3BF>;
  objetoActivoId: string | null;
  agregarInstanciaGHX: (item: { id: string; archivo?: string; rutaRelativa?: string; nombre?: string; ghx_content?: string }, posicionInicial?: [number, number, number]) => Promise<string>;
  eliminarInstancia: (id: string) => void;
  duplicarInstancia: (id: string) => Promise<string>;
  renombrarInstancia: (id: string, nuevoNombre: string) => void;
  seleccionarInstancia: (id: string | null) => void;
  setParametroInstancia: (id: string, key: string, value: any, debounceMs?: number) => void;
  setPosicionInstancia: (id: string, pos: [number, number, number]) => void;
  recomputarInstancia: (id: string) => Promise<void>;
  recargarDefinicionInstancia: (id: string) => Promise<boolean>;
  recomputarTodas: () => Promise<void>;
  
  // Despiece & Herrajes Globales Multiobjeto (BOM Escenario Completo)
  getDespieceGlobal: () => Array<PiezaDespiece & { instanciaNombre: string; instanciaId: string; descripcion: string }>;
  getHerrajesGlobal: () => Array<HerrajeItem & { instanciaNombre: string; instanciaId: string }>;

  // ⚡ Mecanizados y Perforaciones Inter-Componentes DfMA
  mecanizadosCruzados: Record<string, PerforacionCruzadaItem[]>;
  mecanizadoEnProgreso: boolean;
  ultimoResumenMecanizado: string[];
  perforarMueble: () => Promise<{ status: string; total_perforaciones: number; resumen: string[] }>;
  limpiarPerforaciones: () => void;

  // Selección & Transformación Espacial Estilo Blender (G: Grab / B: Base Point Snap)
  objetoSeleccionado: boolean;
  posicionObjeto: [number, number, number]; // [X, Y, Z] en metros
  posicionPrevia: [number, number, number];
  rotacionObjeto: [number, number, number];
  modoTransformacion: "none" | "grab";
  ejeBloqueado: "none" | "X" | "Y" | "Z";
  snapActivo: boolean;
  snapPicking: boolean;
  snapBasePoint: [number, number, number] | null;
  snapTargetPoint: [number, number, number] | null;
  snapTargetType: "corner" | "midpoint" | null;

  setObjetoSeleccionado: (sel: boolean) => void;
  setPosicionObjeto: (pos: [number, number, number]) => void;
  iniciarGrab: () => void;
  confirmarGrab: () => void;
  cancelarGrab: () => void;
  setEjeBloqueado: (eje: "none" | "X" | "Y" | "Z") => void;
  toggleSnapMode: () => void;
  setSnapPicking: (picking: boolean) => void;
  setSnapBasePoint: (pt: [number, number, number] | null) => void;
  setSnapTargetPoint: (pt: [number, number, number] | null, tipo?: "corner" | "midpoint" | null) => void;
  setSnapTargetType: (tipo: "corner" | "midpoint" | null) => void;

  // ⏪ Sistema de Deshacer / Rehacer (Undo / Redo - 100 Estados en memoria)
  pilaHistorial: SnapshotEscenario[];
  indiceHistorial: number;
  puedeDeshacer: boolean;
  puedeRehacer: boolean;
  guardarEstadoHistorial: () => void;
  deshacer: () => void;
  rehacer: () => void;

  // 📷 Control de Cámara
  centrarCamaraTrigger: number;
  centrarCamara: () => void;

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
  // 🤖 3BF AI Render Studio: Biblioteca de Prompts y Motor Fotorrealista
  modalRenderIAAbierto: boolean;
  setModalRenderIAAbierto: (abierto: boolean) => void;
  geminiApiKey: string;
  setGeminiApiKey: (key: string) => void;
  falApiKey: string;
  setFalApiKey: (key: string) => void;
  bibliotecaPrompts: PromptTemplateItem[];
  promptActivoRender: string;
  setPromptActivoRender: (prompt: string) => void;
  motorSeleccionadoRender: "fal_nano_banana_pro" | "fal_nano_banana" | "fal_bria_product_shot" | "fal_flux_dev" | "fal_flux_schnell" | "google_gemini_imagen3" | "flux_schnell_free" | "pollinations";
  setMotorSeleccionadoRender: (motor: "fal_nano_banana_pro" | "fal_nano_banana" | "fal_bria_product_shot" | "fal_flux_dev" | "fal_flux_schnell" | "google_gemini_imagen3" | "flux_schnell_free" | "pollinations") => void;
  aspectRatioRender: "1:1" | "16:9" | "4:3" | "9:16";
  setAspectRatioRender: (ratio: "1:1" | "16:9" | "4:3" | "9:16") => void;
  guardarNuevoPrompt: (item: Omit<PromptTemplateItem, "id">) => string;
  actualizarPrompt: (id: string, cambios: Partial<PromptTemplateItem>) => void;
  eliminarPrompt: (id: string) => void;
  toggleFavoritoPrompt: (id: string) => void;
  restaurarPromptsDefecto: () => void;
  historialRendersIA: RenderIAResultado[];
  agregarRenderHistorial: (resultado: RenderIAResultado) => void;
  eliminarRenderHistorial: (id: string) => void;
  limpiarHistorialRenders: () => void;

  // 🧪 3BF PBR Material Studio & Shader Ball Lab
  modalPBRStudioAbierto: boolean;
  setModalPBRStudioAbierto: (abierto: boolean) => void;
  materialEnCalibracion: MaterialPBRDef | null;
  setMaterialEnCalibracion: (mat: MaterialPBRDef | null) => void;
  abrirPBRStudioParaMaterial: (materialId?: string) => void;
  aplicarMaterialAMuebleActivo: (materialId: string) => void;

  hidratarDesdeLocalStorage: () => void;
  cargarDefinicion: (item: { id: string; archivo?: string; nombre?: string }) => Promise<void>;
}

export interface FichaCostosConfig {
  desperdicioGlobalPct: number;
  despunteCantoGlobalMm?: number;
  desperdicioPorPieza: Record<number, number>;
  descripcionesPersonalizadas?: Record<number, string>;
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
  despunteCantoGlobalMm: 100,
  desperdicioPorPieza: {},
  descripcionesPersonalizadas: {},
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
  thresholdAristas: 40,
  intensidadLuzDirecta: 1.5,
  intensidadLuzAmbiental: 0.8,
  intensidadLuzEntorno: 1.0,
  intensidadLuzRelleno: 0.4,
  mostrarAristas: true,
  mostrarPanelCalibracion: false,
  // Configuración de Malla del Escenario
  mostrarGrilla: true,
  mostrarEjesCoordenadas: true,
  mostrarEjeX: true,
  mostrarEjeY: true,
  distanciaCuadricula: 0.01,
  grosorGrillaDelgada: 1.0,
  colorGrillaDelgada: "#E5E7EB",
  distanciaSeccion: 0.1,
  grosorGrillaGruesa: 1.5,
  colorGrillaGruesa: "#CBD5E1",
  colorEjeX: "#ef4444",
  colorEjeY: "#22c55e",

  // Propiedades de Rejilla (Estándar Rhinoceros 8)
  numeroLineasRejilla: 500,
  espaciadoRejillaSecundariaMm: 10,
  lineasPrincipalesCada: 10,
  mostrarIconoPlanoUniversal: true,

  // 📷 Calibración de Cámara y Zoom
  zoomMinimoMetros: 0.02,
  zoomMaximoMetros: 30,
  campoDeVisionFov: 45,
};

export const use3BFStore = create<State3BF>((set, get) => ({
  centrarCamaraTrigger: 0,
  centrarCamara: () => set((s) => ({ centrarCamaraTrigger: (s.centrarCamaraTrigger || 0) + 1 })),

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
  setTema: (tema) => get().setEsquemaColor(tema === "tech" ? "claro" : "oscuro"),
  
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

  // Blender N-Panel (Sidebar)
  mostrarNPanel: false,
  setMostrarNPanel: (mostrar) =>
    set((state) => ({
      mostrarNPanel: typeof mostrar === "function" ? mostrar(state.mostrarNPanel) : mostrar,
    })),
  pestanaNPanel: "componentes",
  setPestanaNPanel: (pestanaNPanel) => set({ pestanaNPanel: pestanaNPanel as any }),
  anchoNPanel: typeof window !== "undefined" && window.localStorage && localStorage.getItem("3bf_ancho_npanel")
    ? Math.max(140, Math.min(800, Number(localStorage.getItem("3bf_ancho_npanel"))))
    : 380,
  setAnchoNPanel: (ancho) => {
    const normalizado = Math.max(140, Math.min(800, ancho));
    if (typeof window !== "undefined" && window.localStorage) {
      localStorage.setItem("3bf_ancho_npanel", String(normalizado));
    }
    set({ anchoNPanel: normalizado });
  },
  anchoPanelDerecho: typeof window !== "undefined" && window.localStorage && localStorage.getItem("3bf_ancho_panel_derecho")
    ? Math.max(280, Math.min(800, Number(localStorage.getItem("3bf_ancho_panel_derecho"))))
    : 380,
  setAnchoPanelDerecho: (ancho) => {
    const normalizado = Math.max(280, Math.min(800, ancho));
    if (typeof window !== "undefined" && window.localStorage) {
      localStorage.setItem("3bf_ancho_panel_derecho", String(normalizado));
    }
    set({ anchoPanelDerecho: normalizado });
  },

  // 🎨 Estado e Implementación de Capas, Materiales PBR y Partes GHX (Siempre 100% visibles por defecto)
  capas: (typeof window !== "undefined" && window.localStorage && localStorage.getItem("3bf_capas_v1")
    ? (JSON.parse(localStorage.getItem("3bf_capas_v1")!) as CapaDef[])
    : PRESET_CAPAS).map((c) => ({ ...c, visible: true })),
  materialesPBR: typeof window !== "undefined" && window.localStorage && localStorage.getItem("3bf_materiales_pbr_v1")
    ? JSON.parse(localStorage.getItem("3bf_materiales_pbr_v1")!)
    : PRESET_MATERIALES_PBR,
  materialSeleccionadoId: "mat_acero",
  asignacionesPartes: typeof window !== "undefined" && window.localStorage && localStorage.getItem("3bf_asignaciones_partes_v1")
    ? Object.fromEntries(
        Object.entries(JSON.parse(localStorage.getItem("3bf_asignaciones_partes_v1")!) as Record<string, AsignacionParteDef>).map(([k, v]) => {
          const kLow = k.toLowerCase();
          const isBoard = kLow.includes("lateral") || kLow.includes("cubierta") || kLow.includes("frente") || kLow.includes("tapa") || kLow.includes("cajon") || kLow.includes("cajón") || kLow.includes("entrepaño");
          const safeCapaId = (isBoard && v.capaId === "capa_acero") ? "capa_tono" : v.capaId;
          return [k, { ...v, capaId: safeCapaId, visible: true }];
        })
      )
    : {},

  crearCapa: (nueva) => {
    const id = nueva?.id || `capa_${Date.now()}`;
    const capaCompleta: CapaDef = {
      id,
      nombre: nueva?.nombre || `Capa_${get().capas.length + 1}`,
      activa: false,
      visible: nueva?.visible ?? true,
      bloqueada: nueva?.bloqueada ?? false,
      color: nueva?.color || "#8A9EA7",
      materialId: nueva?.materialId || get().materialesPBR[0]?.id || "mat_acero",
      tipoLinea: "Continua",
      ...nueva,
    };
    const listaActualizada = [...get().capas, capaCompleta];
    if (typeof window !== "undefined" && window.localStorage) {
      localStorage.setItem("3bf_capas_v1", JSON.stringify(listaActualizada));
    }
    set({ capas: listaActualizada });
    return id;
  },

  actualizarCapa: (id, cambios) => {
    const listaActualizada = get().capas.map((c) => (c.id === id ? { ...c, ...cambios } : c));
    if (cambios.activa) {
      listaActualizada.forEach((c) => {
        if (c.id !== id) c.activa = false;
      });
    }
    if (typeof window !== "undefined" && window.localStorage) {
      localStorage.setItem("3bf_capas_v1", JSON.stringify(listaActualizada));
    }
    set({ capas: listaActualizada });
  },

  eliminarCapa: (id) => {
    if (get().capas.length <= 1) return;
    const listaActualizada = get().capas.filter((c) => c.id !== id);
    if (typeof window !== "undefined" && window.localStorage) {
      localStorage.setItem("3bf_capas_v1", JSON.stringify(listaActualizada));
    }
    set({ capas: listaActualizada });
  },

  toggleVisibilidadCapa: (id) => {
    const listaActualizada = get().capas.map((c) => (c.id === id ? { ...c, visible: !c.visible } : c));
    if (typeof window !== "undefined" && window.localStorage) {
      localStorage.setItem("3bf_capas_v1", JSON.stringify(listaActualizada));
    }
    set({ capas: listaActualizada });
  },

  toggleBloqueoCapa: (id) => {
    const listaActualizada = get().capas.map((c) => (c.id === id ? { ...c, bloqueada: !c.bloqueada } : c));
    if (typeof window !== "undefined" && window.localStorage) {
      localStorage.setItem("3bf_capas_v1", JSON.stringify(listaActualizada));
    }
    set({ capas: listaActualizada });
  },

  crearMaterialPBR: (nuevo) => {
    const id = nuevo?.id || `mat_${Date.now()}`;
    const materialCompleto: MaterialPBRDef = {
      id,
      nombre: nuevo?.nombre || `Material_${get().materialesPBR.length + 1}`,
      tipo: nuevo?.tipo || "PBR",
      colorBase: nuevo?.colorBase || "#C5B39A",
      metalico: nuevo?.metalico ?? 0.05,
      rugosidad: nuevo?.rugosidad ?? 0.50,
      especularidad: nuevo?.especularidad ?? 0.50,
      opacidad: nuevo?.opacidad ?? 1.0,
      ior: nuevo?.ior ?? 1.50,
      texturaUrl: nuevo?.texturaUrl,
      notas: nuevo?.notas || "",
      ...nuevo,
    };
    const listaActualizada = [...get().materialesPBR, materialCompleto];
    if (typeof window !== "undefined" && window.localStorage) {
      try {
        localStorage.setItem("3bf_materiales_pbr_v1", JSON.stringify(listaActualizada));
      } catch (e) {
        try {
          // Fallback: Si supera cuota, omitir dataURIs pesados de mapas generados en localStorage
          const listaLigera = listaActualizada.map((m) => ({
            ...m,
            normalMapUrl: m.normalMapUrl?.startsWith("data:") ? null : m.normalMapUrl,
            roughnessMapUrl: m.roughnessMapUrl?.startsWith("data:") ? null : m.roughnessMapUrl,
            aoMapUrl: m.aoMapUrl?.startsWith("data:") ? null : m.aoMapUrl,
          }));
          localStorage.setItem("3bf_materiales_pbr_v1", JSON.stringify(listaLigera));
        } catch {
          console.warn("Storage cuota excedida: Materiales conservados en memoria Zustand.");
        }
      }
    }
    set({ materialesPBR: listaActualizada, materialSeleccionadoId: id });
    return id;
  },

  actualizarMaterialPBR: (id, cambios) => {
    const listaActualizada = get().materialesPBR.map((m) => (m.id === id ? { ...m, ...cambios } : m));
    if (typeof window !== "undefined" && window.localStorage) {
      try {
        localStorage.setItem("3bf_materiales_pbr_v1", JSON.stringify(listaActualizada));
      } catch (e) {
        try {
          // Fallback seguro contra cuota de 5MB
          const listaLigera = listaActualizada.map((m) => ({
            ...m,
            normalMapUrl: m.normalMapUrl?.startsWith("data:") ? null : m.normalMapUrl,
            roughnessMapUrl: m.roughnessMapUrl?.startsWith("data:") ? null : m.roughnessMapUrl,
            aoMapUrl: m.aoMapUrl?.startsWith("data:") ? null : m.aoMapUrl,
          }));
          localStorage.setItem("3bf_materiales_pbr_v1", JSON.stringify(listaLigera));
        } catch {
          console.warn("Storage cuota excedida: Materiales actualizados en memoria Zustand.");
        }
      }
    }
    set({ materialesPBR: listaActualizada });
  },

  eliminarMaterialPBR: (id) => {
    if (get().materialesPBR.length <= 1) return;
    const listaActualizada = get().materialesPBR.filter((m) => m.id !== id);
    const nuevoSel = listaActualizada[0]?.id || "";
    if (typeof window !== "undefined" && window.localStorage) {
      try {
        localStorage.setItem("3bf_materiales_pbr_v1", JSON.stringify(listaActualizada));
      } catch {
        console.warn("Storage cuota excedida al eliminar material.");
      }
    }
    set({ materialesPBR: listaActualizada, materialSeleccionadoId: nuevoSel });
  },

  setMaterialSeleccionadoId: (materialSeleccionadoId) => set({ materialSeleccionadoId }),

  asignarParteACapa: (parteKey, capaId, nombreVisible) => {
    const prev = get().asignacionesPartes;
    const actual = prev[parteKey] || {
      parteKey,
      nombreVisible: nombreVisible || parteKey.replace(/^RH_OUT:/, ""),
      capaId: "por_defecto",
      materialId: "por_capa",
      visible: true,
    };
    const nuevoMap = {
      ...prev,
      [parteKey]: {
        ...actual,
        capaId,
        materialId: "por_capa", // 💡 Heredar inmediatamente el material de la nueva capa asignada
        nombreVisible: nombreVisible || actual.nombreVisible,
      },
    };
    if (typeof window !== "undefined" && window.localStorage) {
      localStorage.setItem("3bf_asignaciones_partes_v1", JSON.stringify(nuevoMap));
    }
    set({ asignacionesPartes: nuevoMap });
  },

  asignarParteAMaterial: (parteKey, materialId) => {
    const prev = get().asignacionesPartes;
    const actual = prev[parteKey] || {
      parteKey,
      nombreVisible: parteKey.replace(/^RH_OUT:/, ""),
      capaId: "por_defecto",
      materialId: "por_capa",
      visible: true,
    };
    const nuevoMap = {
      ...prev,
      [parteKey]: {
        ...actual,
        materialId,
      },
    };
    if (typeof window !== "undefined" && window.localStorage) {
      localStorage.setItem("3bf_asignaciones_partes_v1", JSON.stringify(nuevoMap));
    }
    set({ asignacionesPartes: nuevoMap });
  },

  toggleVisibilidadParte: (parteKey) => {
    const prev = get().asignacionesPartes;
    const actual = prev[parteKey] || {
      parteKey,
      nombreVisible: parteKey.replace(/^RH_OUT:/, ""),
      capaId: "por_defecto",
      materialId: "por_capa",
      visible: true,
    };
    const nuevoMap = {
      ...prev,
      [parteKey]: {
        ...actual,
        visible: !actual.visible,
      },
    };
    if (typeof window !== "undefined" && window.localStorage) {
      localStorage.setItem("3bf_asignaciones_partes_v1", JSON.stringify(nuevoMap));
    }
    set({ asignacionesPartes: nuevoMap });
  },

  resetCapasYMateriales: () => {
    if (typeof window !== "undefined" && window.localStorage) {
      localStorage.removeItem("3bf_capas_v1");
      localStorage.removeItem("3bf_materiales_pbr_v1");
      localStorage.removeItem("3bf_asignaciones_partes_v1");
    }
    set({
      capas: PRESET_CAPAS,
      materialesPBR: PRESET_MATERIALES_PBR,
      asignacionesPartes: {},
      materialSeleccionadoId: "mat_acero",
    });
  },

  // 🎨 Apariencia & Personalización de Colores (Perfiles Claro y Oscuro)
  esquemaColor: "claro",
  coloresApariencia: PRESET_COLORES_CLARO,
  fuenteInterfaz: "sistema",
  setFuenteInterfaz: (fuente) => {
    if (typeof window !== "undefined" && window.localStorage) {
      localStorage.setItem("3bf_fuente_interfaz", fuente);
    }
    set({ fuenteInterfaz: fuente });
  },
  setEsquemaColor: (esquema) => {
    if (typeof window !== "undefined" && window.localStorage) {
      localStorage.setItem("3bf_perfil_activo", esquema);
    }
    
    if (esquema === "claro") {
      let coloresClaro = PRESET_COLORES_CLARO;
      if (typeof window !== "undefined" && window.localStorage) {
        const guardado = localStorage.getItem("3bf_preset_claro");
        if (guardado) {
          try {
            coloresClaro = { ...PRESET_COLORES_CLARO, ...JSON.parse(guardado) };
          } catch (e) {
            console.warn("Error leyendo preset claro:", e);
          }
        }
      }
      set({ esquemaColor: "claro", coloresApariencia: coloresClaro, tema: "tech" });
      if (typeof document !== "undefined") {
        document.documentElement.setAttribute("data-theme", "tech");
        document.documentElement.classList.remove("dark");
      }
    } else {
      let coloresOscuro = PRESET_COLORES_OSCURO;
      if (typeof window !== "undefined" && window.localStorage) {
        const guardado = localStorage.getItem("3bf_preset_oscuro");
        if (guardado) {
          try {
            coloresOscuro = { ...PRESET_COLORES_OSCURO, ...JSON.parse(guardado) };
          } catch (e) {
            console.warn("Error leyendo preset oscuro:", e);
          }
        }
      }
      set({ esquemaColor: "oscuro", coloresApariencia: coloresOscuro, tema: "obsidian" });
      if (typeof document !== "undefined") {
        document.documentElement.setAttribute("data-theme", "obsidian");
        document.documentElement.classList.add("dark");
      }
    }
  },
  setColorApariencia: (clave, valor) =>
    set((state) => ({
      coloresApariencia: {
        ...state.coloresApariencia,
        [clave]: valor,
        ...(clave === "fondoPaneles" ? { fondoTopNav: valor } : {}),
        ...(clave === "bordePaneles" ? { colorMarca: valor } : {}),
        ...(clave === "botonActivo" ? { iconosFijos: valor } : {}),
      },
    })),
  restaurarColoresApariencia: () => {
    const state = get();
    if (state.esquemaColor === "claro") {
      if (typeof window !== "undefined" && window.localStorage) {
        localStorage.removeItem("3bf_preset_claro");
      }
      set({ coloresApariencia: PRESET_COLORES_CLARO });
    } else {
      if (typeof window !== "undefined" && window.localStorage) {
        localStorage.removeItem("3bf_preset_oscuro");
      }
      set({ coloresApariencia: PRESET_COLORES_OSCURO });
    }
  },
  guardarComoPredefinido: () => {
    const state = get();
    if (typeof window !== "undefined" && window.localStorage) {
      if (state.esquemaColor === "claro") {
        localStorage.setItem("3bf_preset_claro", JSON.stringify(state.coloresApariencia));
        localStorage.setItem("3bf_perfil_activo", "claro");
      } else {
        localStorage.setItem("3bf_preset_oscuro", JSON.stringify(state.coloresApariencia));
        localStorage.setItem("3bf_perfil_activo", "oscuro");
      }
      localStorage.setItem("3bf_fuente_interfaz", state.fuenteInterfaz);
    }
  },
  cargarColoresPredefinidos: () => {
    if (typeof window !== "undefined" && window.localStorage) {
      const fuenteGuardada = localStorage.getItem("3bf_fuente_interfaz") || "sistema";
      const perfilActivo = (localStorage.getItem("3bf_perfil_activo") as "claro" | "oscuro") || "claro";
      if (perfilActivo === "oscuro") {
        let coloresOscuro = PRESET_COLORES_OSCURO;
        const guardado = localStorage.getItem("3bf_preset_oscuro");
        if (guardado) {
          try {
            coloresOscuro = { ...PRESET_COLORES_OSCURO, ...JSON.parse(guardado) };
          } catch {}
        }
        set({
          esquemaColor: "oscuro",
          coloresApariencia: coloresOscuro,
          tema: "obsidian",
          fuenteInterfaz: fuenteGuardada,
        });
        if (typeof document !== "undefined") {
          document.documentElement.setAttribute("data-theme", "obsidian");
          document.documentElement.classList.add("dark");
        }
      } else {
        let coloresClaro = PRESET_COLORES_CLARO;
        const guardado = localStorage.getItem("3bf_preset_claro");
        if (guardado) {
          try {
            coloresClaro = { ...PRESET_COLORES_CLARO, ...JSON.parse(guardado) };
          } catch {}
        }
        set({
          esquemaColor: "claro",
          coloresApariencia: coloresClaro,
          tema: "tech",
          fuenteInterfaz: fuenteGuardada,
        });
        if (typeof document !== "undefined") {
          document.documentElement.setAttribute("data-theme", "tech");
          document.documentElement.classList.remove("dark");
        }
      }
    }
  },

  // =========================================================================
  // 🪑 CATÁLOGO DE MUEBLES (ASSET BROWSER BLENDER STYLE & GOOGLE DRIVE)
  // =========================================================================
  arbolCarpetasMuebles: [],
  mueblesGuardados: [],
  muebleActivoGuardado: null,
  carpetaSeleccionadaId: "all",
  modalGuardarComoAbierto: false,
  guardandoMueble: false,
  urlGoogleDrive: "https://drive.google.com/drive/u/0/folders/1zzeGpgyLbCUKrUUhT7Lk-_7xRW_kZf9t",

  setCarpetaSeleccionadaId: (carpetaSeleccionadaId) => set({ carpetaSeleccionadaId }),
  setModalGuardarComoAbierto: (modalGuardarComoAbierto) => set({ modalGuardarComoAbierto }),
  setUrlGoogleDrive: (urlGoogleDrive) => set({ urlGoogleDrive }),

  cargarArbolMuebles: async () => {
    try {
      const res = await fetch("/api/drive/muebles?action=list_tree");
      if (res.ok) {
        const data = await res.json();
        if (data.tree) {
          set({ arbolCarpetasMuebles: data.tree });
        }
        if (data.muebles) {
          set({ mueblesGuardados: data.muebles });
        }
        if (data.driveUrl) {
          set({ urlGoogleDrive: data.driveUrl });
        }
      }
    } catch (e) {
      console.warn("Usando catálogo local de muebles:", e);
    }
  },

  crearCarpetaMueble: async (nombre: string, tipo: "marca" | "tipologia" = "tipologia", padreId: string | null = null) => {
    const cleanName = nombre.trim();
    if (!cleanName) return false;

    const slug = cleanName.toLowerCase().replace(/\s+/g, "-");
    const id = padreId ? `${padreId}/${slug}` : slug;
    const ruta = padreId ? `${padreId}/${cleanName}` : cleanName;

    const nuevaCarpeta: CarpetaMuebleNode = {
      id,
      nombre: cleanName,
      tipo,
      padreId: padreId || null,
      ruta,
      subcarpetas: []
    };

    set((state) => {
      if (!padreId) {
        return { arbolCarpetasMuebles: [...state.arbolCarpetasMuebles, nuevaCarpeta] };
      }
      const updatedTree = state.arbolCarpetasMuebles.map((m) => {
        if (m.id === padreId) {
          return { ...m, subcarpetas: [...(m.subcarpetas || []), nuevaCarpeta] };
        }
        return m;
      });
      return { arbolCarpetasMuebles: updatedTree };
    });

    try {
      await fetch("/api/drive/muebles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "create_folder", folder: nuevaCarpeta }),
      });
    } catch (e) {
      console.warn("Carpeta persistida localmente:", e);
    }
    return true;
  },

  guardarMuebleComo: async (datos: { nombre: string; marca: string; tipologia: string; descripcion?: string }) => {
    set({ guardandoMueble: true });
    const state = get();
    try {
      const id = `mueble_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      const rutaCarpeta = `${datos.marca}/${datos.tipologia}`;
      const modelKey = state.parametros.model_id || "Cubierta";
      const fichaConfig = state.getFichaConfig(modelKey);
      const despieceGlobal = state.getDespieceGlobal();

      // Capturar miniatura 3D real desde el Canvas WebGL
      let thumbnail: string | undefined = undefined;
      if (typeof window !== "undefined" && (window as any).__capturarThumbnail3BF) {
        thumbnail = (window as any).__capturarThumbnail3BF() || undefined;
      }

      const nuevoMueble: MuebleGuardadoItem = {
        id,
        nombre: datos.nombre,
        marca: datos.marca,
        tipologia: datos.tipologia,
        rutaCarpeta,
        fechaGuardado: new Date().toISOString(),
        thumbnail,
        descripcionComercial: datos.descripcion || `Mueble diseñado en 3BF (${datos.marca})`,
        instancias: JSON.parse(JSON.stringify(state.instancias)),
        fichaConfig,
        totalPiezas: despieceGlobal.reduce((acc, p) => acc + (p.cantidad || 1), 0),
      };

      // Guardar en Store y localStorage
      set((s) => ({
        mueblesGuardados: [nuevoMueble, ...s.mueblesGuardados.filter((m) => m.id !== id)],
        muebleActivoGuardado: nuevoMueble,
        modalGuardarComoAbierto: false,
      }));

      try {
        await fetch("/api/drive/muebles", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "save_furniture", furniture: nuevoMueble }),
        });
      } catch (err) {
        console.warn("Mueble guardado en local:", err);
      }

      set({ guardandoMueble: false });
      return true;
    } catch (err) {
      console.error("Error al guardar mueble:", err);
      set({ guardandoMueble: false });
      return false;
    }
  },

  guardarCambiosMueble: async () => {
    const state = get();
    if (!state.muebleActivoGuardado) {
      set({ modalGuardarComoAbierto: true });
      return false;
    }

    set({ guardandoMueble: true });
    try {
      const id = state.muebleActivoGuardado.id;
      const modelKey = state.parametros.model_id || "Cubierta";
      const fichaConfig = state.getFichaConfig(modelKey);
      const despieceGlobal = state.getDespieceGlobal();

      let thumbnail = state.muebleActivoGuardado.thumbnail;
      if (typeof window !== "undefined" && (window as any).__capturarThumbnail3BF) {
        const nuevoThumb = (window as any).__capturarThumbnail3BF();
        if (nuevoThumb) thumbnail = nuevoThumb;
      }

      // Sanitizar instancias
      const rawInst = state.instancias || {};
      const sanitizedInst: Record<string, ObjetoInstancia3BF> = {};
      for (const [k, v] of Object.entries(rawInst)) {
        sanitizedInst[k] = {
          ...v,
          posicion: Array.isArray(v.posicion) ? [...v.posicion] : [0, 0, 0],
          rotacion: Array.isArray(v.rotacion) ? [...v.rotacion] : [0, 0, 0],
          parametros: { ...(v.parametros || {}) },
        };
      }

      const muebleActualizado: MuebleGuardadoItem = {
        ...state.muebleActivoGuardado,
        fechaGuardado: new Date().toISOString(),
        thumbnail,
        instancias: sanitizedInst,
        fichaConfig,
        totalPiezas: despieceGlobal.reduce((acc, p) => acc + (p.cantidad || 1), 0),
      };

      set((s) => ({
        mueblesGuardados: s.mueblesGuardados.map((m) => (m.id === id ? muebleActualizado : m)),
        muebleActivoGuardado: muebleActualizado,
        guardandoMueble: false,
      }));

      try {
        await fetch("/api/drive/muebles", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "save_furniture", furniture: muebleActualizado }),
        });
      } catch (err) {
        console.warn("Mueble actualizado en local:", err);
      }

      return true;
    } catch (err) {
      console.error("Error al actualizar cambios de mueble:", err);
      set({ guardandoMueble: false });
      return false;
    }
  },

  renombrarMuebleGuardado: async (id: string, nuevoNombre: string) => {
    const clean = nuevoNombre.trim();
    if (!clean) return false;

    set((state) => ({
      mueblesGuardados: state.mueblesGuardados.map((m) =>
        m.id === id ? { ...m, nombre: clean } : m
      ),
      muebleActivoGuardado:
        state.muebleActivoGuardado?.id === id
          ? { ...state.muebleActivoGuardado, nombre: clean }
          : state.muebleActivoGuardado,
    }));

    try {
      await fetch("/api/drive/muebles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "rename_furniture", id, nuevoNombre: clean }),
      });
    } catch (e) {
      console.warn("Renombrado persistido localmente:", e);
    }
    return true;
  },

  actualizarThumbnailMueble: async (id: string, thumbnail: string) => {
    set((state) => ({
      mueblesGuardados: state.mueblesGuardados.map((m) =>
        m.id === id ? { ...m, thumbnail } : m
      ),
      muebleActivoGuardado:
        state.muebleActivoGuardado?.id === id
          ? { ...state.muebleActivoGuardado, thumbnail }
          : state.muebleActivoGuardado,
    }));

    try {
      await fetch("/api/drive/muebles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "update_thumbnail", id, thumbnail }),
      });
    } catch (e) {
      console.warn("Actualización de thumbnail persistida localmente:", e);
    }
    return true;
  },

  eliminarMuebleGuardado: async (id: string) => {
    set((state) => ({
      mueblesGuardados: state.mueblesGuardados.filter((m) => m.id !== id),
      muebleActivoGuardado:
        state.muebleActivoGuardado?.id === id ? null : state.muebleActivoGuardado,
    }));

    try {
      await fetch("/api/drive/muebles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "delete_furniture", id }),
      });
    } catch (e) {
      console.warn("Eliminación persistida localmente:", e);
    }
    return true;
  },

  abrirMueble: async (mueble: MuebleGuardadoItem) => {
    if (!mueble || !mueble.instancias) return;

    // 1. Restaurar y sanitizar instancias en el Store
    const rawInst = mueble.instancias || {};
    const restoredInstancias: Record<string, ObjetoInstancia3BF> = {};
    for (const [k, v] of Object.entries(rawInst)) {
      restoredInstancias[k] = {
        ...v,
        posicion: Array.isArray(v.posicion) ? [...v.posicion] : [0, 0, 0],
        rotacion: Array.isArray(v.rotacion) ? [...v.rotacion] : [0, 0, 0],
        parametros: { ...(v.parametros || {}) },
      };
    }
    const firstKey = Object.keys(restoredInstancias)[0] || null;

    // 2. Restaurar ficha técnica si existe
    if (mueble.fichaConfig) {
      const modelKey = get().parametros.model_id || "Cubierta";
      get().setFichaConfig(modelKey, mueble.fichaConfig);
    }

    set({
      instancias: restoredInstancias,
      objetoActivoId: firstKey,
      objetoSeleccionado: !!firstKey,
      muebleActivoGuardado: mueble,
      escenarioLimpio: false,
      pestanaActiva: "3d",
    });

    // 3. Recomputar todas las instancias con Grasshopper
    await get().recomputarTodas();
    get().guardarEstadoHistorial();
  },

  // =========================================================================
  // 🏢 MULTI-INSTANCIA GHX EN ESCENARIO 3D (Árbol de Objetos Independientes)
  // =========================================================================
  instancias: {},
  objetoActivoId: null,

  agregarInstanciaGHX: async (item: { id: string; archivo?: string; rutaRelativa?: string; nombre?: string; ghx_content?: string }, posicionInicial?: [number, number, number]) => {
    const definitionId = item.id;
    const filename = item.rutaRelativa || item.archivo || `${item.id}.ghx`;
    const state = get();
    
    const id = `inst_${definitionId}_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const nombreVisible = generarNombreSecuencial(definitionId, state.instancias);

    // Calcular posición desplazada si no se especifica
    let pos: [number, number, number] = posicionInicial || [0, 0, 0];
    if (!posicionInicial) {
      const cantExistentes = Object.keys(state.instancias).length;
      if (cantExistentes > 0) {
        // Desplazar 0.7m en X por cada instancia para no superponerlas en el origen
        pos = [cantExistentes * 0.65, 0, 0];
      }
    }

    // 1. Obtener metadata de sliders por defecto para esta definición
    let defaultParams: Record<string, any> = {
      model_id: definitionId,
      custom_filename: filename,
      ancho: 1200,
      alto: 800,
      profundidad: 400,
      espesor_madera: 15,
      material: "MDP_15mm",
      color_acabado: "#0088aa",
      incluir_puertas: true,
      tipo_herraje: "Minifix",
    };

    let parameterGroups: any[] = [];
    let sliderLimits: any = {};

    try {
      const metaRes = await fetch("/api/metadata", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model_id: definitionId, custom_filename: filename, ghx_content: item.ghx_content }),
      });
      if (metaRes.ok) {
        const meta = await metaRes.json();
        if (meta.status === "success" && meta.default_values) {
          parameterGroups = meta.parameter_groups || [];
          sliderLimits = meta.slider_limits || {};
          Object.entries(meta.default_values).forEach(([k, v]) => {
            defaultParams[k] = v;
            const cleanKey = k.replace("RH_IN:", "").toLowerCase().replace(/\s+/g, "_");
            defaultParams[cleanKey] = v;
            const legacyKey = (MAPA_PARAMETROS as any)[k];
            if (legacyKey) defaultParams[legacyKey] = v;
          });
        }
      }
    } catch (e) {
      console.warn("No se pudo obtener metadata previa:", e);
    }

    const nuevaInstancia: ObjetoInstancia3BF = {
      id,
      nombreVisible,
      definitionId,
      archivo: filename,
      ghxContent: item.ghx_content,
      parametros: defaultParams,
      resultado: {
        parameter_groups: parameterGroups,
        slider_limits: sliderLimits,
      } as any,
      cargando: true,
      posicion: pos,
      rotacion: [0, 0, 0],
      posicionPrevia: pos,
    };

    set((s) => ({
      instancias: { ...s.instancias, [id]: nuevaInstancia },
      objetoActivoId: id,
      objetoSeleccionado: true,
      posicionObjeto: pos,
      posicionPrevia: pos,
      parametros: defaultParams as any,
      escenarioLimpio: false,
    }));

    // 2. Ejecutar cómputo de la nueva instancia
    await get().recomputarInstancia(id);
    get().guardarEstadoHistorial();
    return id;
  },

  eliminarInstancia: (id: string) => {
    const state = get();
    if (state.pilaHistorial.length === 0) {
      state.guardarEstadoHistorial();
    }
    const { [id]: _, ...resto } = state.instancias;
    const idsRestantes = Object.keys(resto);
    const nuevoActivoId = idsRestantes.length > 0 ? idsRestantes[0] : null;
    const nuevoActivo = nuevoActivoId ? resto[nuevoActivoId] : null;

    set({
      instancias: resto,
      objetoActivoId: nuevoActivoId,
      objetoSeleccionado: nuevoActivoId !== null,
      posicionObjeto: nuevoActivo ? nuevoActivo.posicion : [0, 0, 0],
      posicionPrevia: nuevoActivo ? nuevoActivo.posicion : [0, 0, 0],
      parametros: nuevoActivo ? (nuevoActivo.parametros as any) : state.parametros,
      resultado: nuevoActivo ? nuevoActivo.resultado : null,
    });
    get().guardarEstadoHistorial();
  },

  duplicarInstancia: async (id: string) => {
    const state = get();
    if (state.pilaHistorial.length === 0) {
      state.guardarEstadoHistorial();
    }
    const original = state.instancias[id];
    if (!original) return "";

    const nuevoId = `inst_${original.definitionId}_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const nombreVisible = generarNombreSecuencial(original.definitionId, state.instancias);
    const nuevaPos: [number, number, number] = [
      original.posicion[0] + 0.3,
      original.posicion[1],
      original.posicion[2] + 0.3,
    ];

    const duplicada: ObjetoInstancia3BF = {
      ...original,
      id: nuevoId,
      nombreVisible,
      parametros: { ...original.parametros },
      posicion: nuevaPos,
      posicionPrevia: nuevaPos,
      cargando: true,
    };

    set((s) => ({
      instancias: { ...s.instancias, [nuevoId]: duplicada },
      objetoActivoId: nuevoId,
      objetoSeleccionado: true,
      posicionObjeto: nuevaPos,
      posicionPrevia: nuevaPos,
      parametros: duplicada.parametros as any,
    }));

    await get().recomputarInstancia(nuevoId);
    get().guardarEstadoHistorial();
    return nuevoId;
  },

  renombrarInstancia: (id: string, nuevoNombre: string) => {
    const cleanName = nuevoNombre.trim();
    if (!cleanName) return;

    set((s) => {
      if (id === "base_model") {
        return {
          parametros: {
            ...s.parametros,
            model_id: cleanName,
          },
        };
      }
      const inst = s.instancias[id];
      if (!inst) return s;
      return {
        instancias: {
          ...s.instancias,
          [id]: { ...inst, nombreVisible: cleanName },
        },
      };
    });
    get().guardarEstadoHistorial();
  },

  seleccionarInstancia: (id: string | null) => {
    if (!id) {
      set({ objetoActivoId: null, objetoSeleccionado: false });
      return;
    }
    const inst = get().instancias[id];
    if (inst) {
      set({
        objetoActivoId: id,
        objetoSeleccionado: true,
        posicionObjeto: inst.posicion,
        posicionPrevia: inst.posicion,
        parametros: inst.parametros as any,
        resultado: inst.resultado,
      });
    }
  },

  setParametroInstancia: (id: string, key: string, value: any, debounceMs: number = 180) => {
    const state = get();
    const inst = state.instancias[id];
    if (!inst) return;

    const nextParams = { ...inst.parametros, [key]: value };
    const cleanKey = key.replace("RH_IN:", "").toLowerCase().replace(/\s+/g, "_");
    nextParams[cleanKey] = value;
    
    const pureKey = key.replace(/^RH_IN:\s*/i, "").replace(/^[\d.]+[_\s]*/, "").toLowerCase().replace(/\s+/g, "_");
    if (pureKey) {
      nextParams[pureKey] = value;
    }

    const legacyKey = (MAPA_PARAMETROS as any)[key];
    if (legacyKey) nextParams[legacyKey] = value;

    // Actualización inmediata del estado local (UI a 60 FPS ultra fluida)
    set((s) => ({
      instancias: {
        ...s.instancias,
        [id]: { ...s.instancias[id], parametros: nextParams },
      },
      parametros: s.objetoActivoId === id ? (nextParams as any) : s.parametros,
    }));

    // Debounce inteligente para cálculos pesados en RhinoCompute
    if ((globalThis as any).__3bf_debounce_timers?.[id]) {
      clearTimeout((globalThis as any).__3bf_debounce_timers[id]);
      delete (globalThis as any).__3bf_debounce_timers[id];
    }

    if (!(globalThis as any).__3bf_debounce_timers) {
      (globalThis as any).__3bf_debounce_timers = {};
    }

    if (debounceMs <= 0) {
      get().recomputarInstancia(id);
    } else {
      (globalThis as any).__3bf_debounce_timers[id] = setTimeout(() => {
        delete (globalThis as any).__3bf_debounce_timers[id];
        get().recomputarInstancia(id);
      }, debounceMs);
    }
  },

  setPosicionInstancia: (id: string, pos: [number, number, number]) => {
    const state = get();
    if (state.pilaHistorial.length === 0) {
      state.guardarEstadoHistorial();
    }
    set((s) => {
      const inst = s.instancias[id];
      if (!inst) return s;
      return {
        instancias: {
          ...s.instancias,
          [id]: { ...inst, posicion: pos },
        },
        posicionObjeto: s.objetoActivoId === id ? pos : s.posicionObjeto,
      };
    });
    get().guardarEstadoHistorial();
  },

  recomputarInstancia: async (id: string) => {
    const inst = get().instancias[id];
    if (!inst) return;

    // Cancelar cualquier petición anterior en vuelo para evitar saltos o respuestas desordenadas
    if (!(globalThis as any).__3bf_abort_controllers) {
      (globalThis as any).__3bf_abort_controllers = {};
    }
    if ((globalThis as any).__3bf_abort_controllers[id]) {
      try {
        (globalThis as any).__3bf_abort_controllers[id].abort();
      } catch (_) {}
      delete (globalThis as any).__3bf_abort_controllers[id];
    }

    const controller = new AbortController();
    (globalThis as any).__3bf_abort_controllers[id] = controller;

    set((s) => ({
      instancias: {
        ...s.instancias,
        [id]: { ...s.instancias[id], cargando: true },
      },
    }));

    try {
      const computeRes = await fetch("/api/compute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          ...inst.parametros,
          model_id: inst.definitionId,
          custom_filename: inst.archivo,
          ghx_content: inst.ghxContent,
        }),
      });

      const data = await computeRes.json();
      if (computeRes.ok && data.status === "success" && data.real_meshes && data.real_meshes.length > 0) {
        set((s) => {
          const currentInst = s.instancias[id];
          if (!currentInst) return s;
          const updatedInst = {
            ...currentInst,
            resultado: data,
            cargando: false,
          };
          return {
            instancias: { ...s.instancias, [id]: updatedInst },
            resultado: s.objetoActivoId === id ? data : s.resultado,
            workerStatus: "online",
          };
        });
      } else {
        set((s) => ({
          workerStatus: "offline",
          instancias: {
            ...s.instancias,
            [id]: { ...s.instancias[id], cargando: false },
          },
        }));
      }
    } catch (err: any) {
      if (err?.name === "AbortError") {
        // Petición cancelada limpiamente por un valor de slider más reciente
        return;
      }
      console.error("Error en cómputo de instancia:", id, err);
      set((s) => ({
        workerStatus: "offline",
        instancias: {
          ...s.instancias,
          [id]: { ...s.instancias[id], cargando: false },
        },
      }));
    } finally {
      if ((globalThis as any).__3bf_abort_controllers?.[id] === controller) {
        delete (globalThis as any).__3bf_abort_controllers[id];
      }
    }
  },

  recargarDefinicionInstancia: async (id: string) => {
    const inst = get().instancias[id];
    if (!inst) return false;

    // 1. Activar estado de carga en la instancia
    set((s) => ({
      instancias: {
        ...s.instancias,
        [id]: { ...s.instancias[id], cargando: true },
      },
    }));

    try {
      // 2. Re-leer metadata fresca desde el archivo GHX en disco
      const metaRes = await fetch("/api/metadata", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model_id: inst.definitionId,
          custom_filename: inst.archivo,
          ghx_content: inst.ghxContent,
        }),
      });

      let updatedParams = { ...inst.parametros };
      let parameterGroups = inst.resultado?.parameter_groups || [];
      let sliderLimits = inst.resultado?.slider_limits || {};

      if (metaRes.ok) {
        const meta = await metaRes.json();
        if (meta.status === "success" && meta.default_values) {
          parameterGroups = meta.parameter_groups || [];
          sliderLimits = meta.slider_limits || {};

          // Conservar valores que el usuario ya modificó, y agregar los nuevos parámetros
          Object.entries(meta.default_values).forEach(([k, v]) => {
            if (!(k in updatedParams)) {
              updatedParams[k] = v;
            }
            const cleanKey = k.replace("RH_IN:", "").toLowerCase().replace(/\s+/g, "_");
            if (!(cleanKey in updatedParams)) {
              updatedParams[cleanKey] = v;
            }
            const legacyKey = (MAPA_PARAMETROS as any)[k];
            if (legacyKey && !(legacyKey in updatedParams)) {
              updatedParams[legacyKey] = v;
            }
          });
        }
      }

      // Actualizar instancia con nueva metadata antes de computar
      set((s) => ({
        instancias: {
          ...s.instancias,
          [id]: {
            ...s.instancias[id],
            parametros: updatedParams,
            resultado: {
              ...(s.instancias[id].resultado || {}),
              parameter_groups: parameterGroups,
              slider_limits: sliderLimits,
            } as any,
          },
        },
        parametros: s.objetoActivoId === id ? (updatedParams as any) : s.parametros,
      }));

      // 3. Recomputar geometría 3D con Grasshopper / RhinoCompute
      await get().recomputarInstancia(id);
      get().guardarEstadoHistorial();
      return true;
    } catch (err) {
      console.error("Error al recargar definición GHX de instancia:", id, err);
      set((s) => ({
        instancias: {
          ...s.instancias,
          [id]: { ...s.instancias[id], cargando: false },
        },
      }));
      return false;
    }
  },

  recomputarTodas: async () => {
    const ids = Object.keys(get().instancias);
    await Promise.all(ids.map((id) => get().recomputarInstancia(id)));
  },

  getDespieceGlobal: () => {
    const state = get();
    const list: Array<PiezaDespiece & { instanciaNombre: string; instanciaId: string; descripcion: string }> = [];
    Object.values(state.instancias).forEach((inst) => {
      if (inst.resultado?.despiece) {
        inst.resultado.despiece.forEach((p) => {
          list.push({
            ...p,
            descripcion: p.descripcion || inst.nombreVisible || p.nombre,
            instanciaNombre: inst.nombreVisible,
            instanciaId: inst.id,
          });
        });
      }
    });
    return list;
  },

  getHerrajesGlobal: () => {
    const state = get();
    const list: Array<HerrajeItem & { instanciaNombre: string; instanciaId: string }> = [];
    Object.values(state.instancias).forEach((inst) => {
      if (inst.resultado?.herrajes) {
        inst.resultado.herrajes.forEach((h) => {
          list.push({
            ...h,
            instanciaNombre: inst.nombreVisible,
            instanciaId: inst.id,
          });
        });
      }
    });
    return list;
  },

  // ⚡ Mecanizados y Perforaciones Inter-Componentes DfMA
  mecanizadosCruzados: {},
  mecanizadoEnProgreso: false,
  ultimoResumenMecanizado: [],

  perforarMueble: async () => {
    const state = get();
    set({ mecanizadoEnProgreso: true });
    try {
      const instanciasList = Object.values(state.instancias).map((inst) => ({
        id: inst.id,
        nombreVisible: inst.nombreVisible,
        posicion: inst.posicion,
        resultado: inst.resultado,
      }));

      // Si no hay multi-instancias pero hay un modelo base activo
      if (instanciasList.length === 0 && state.resultado) {
        instanciasList.push({
          id: "base_model",
          nombreVisible: state.parametros.model_id || "Cubierta",
          posicion: [0, 0, 0],
          resultado: state.resultado,
        });
      }

      const res = await fetch("/api/compute/mecanizar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ instancias: instanciasList }),
      });

      const data = await res.json();
      if (data.status === "success" || data.status === "warning") {
        set({
          mecanizadosCruzados: data.mecanizados_cruzados || {},
          ultimoResumenMecanizado: data.resumen || [],
          mecanizadoEnProgreso: false,
        });
        return {
          status: data.status,
          total_perforaciones: data.total_perforaciones || 0,
          resumen: data.resumen || [],
        };
      }
      set({ mecanizadoEnProgreso: false });
      return { status: "error", total_perforaciones: 0, resumen: ["Error al procesar mecanizado."] };
    } catch (e: any) {
      set({ mecanizadoEnProgreso: false });
      return { status: "error", total_perforaciones: 0, resumen: [e?.message || "Error de red"] };
    }
  },

  limpiarPerforaciones: () => {
    set({
      mecanizadosCruzados: {},
      ultimoResumenMecanizado: ["✓ Perforaciones inter-componentes eliminadas."],
    });
  },

  // =========================================================================
  // ⏪ SISTEMA DE DESHACER / REHACER (UNDO / REDO - 100 ESTADOS)
  // =========================================================================
  pilaHistorial: [],
  indiceHistorial: -1,
  puedeDeshacer: false,
  puedeRehacer: false,

  guardarEstadoHistorial: () => {
    const s = get();
    const snapshot: SnapshotEscenario = {
      instancias: Object.fromEntries(
        Object.entries(s.instancias || {}).map(([k, v]) => [
          k,
          {
            ...v,
            posicion: Array.isArray(v.posicion) ? [...v.posicion] : [0, 0, 0],
            rotacion: Array.isArray(v.rotacion) ? [...v.rotacion] : [0, 0, 0],
            parametros: { ...(v.parametros || {}) },
          },
        ])
      ),
      objetoActivoId: s.objetoActivoId,
      posicionObjeto: Array.isArray(s.posicionObjeto) ? [...s.posicionObjeto] : [0, 0, 0],
      parametros: { ...(s.parametros || {}) },
      resultado: s.resultado,
    };

    const historialValido = s.pilaHistorial.slice(0, s.indiceHistorial + 1);
    const nuevoHistorial = [...historialValido, snapshot];

    // Limitar estrictamente a 100 estados de historial
    if (nuevoHistorial.length > 100) {
      nuevoHistorial.shift();
    }

    set({
      pilaHistorial: nuevoHistorial,
      indiceHistorial: nuevoHistorial.length - 1,
      puedeDeshacer: nuevoHistorial.length > 1,
      puedeRehacer: false,
    });
  },

  deshacer: () => {
    const s = get();
    if (s.indiceHistorial > 0) {
      const nuevoIndice = s.indiceHistorial - 1;
      const estado = s.pilaHistorial[nuevoIndice];
      if (estado) {
        set({
          instancias: Object.fromEntries(
            Object.entries(estado.instancias || {}).map(([k, v]) => [
              k,
              {
                ...v,
                posicion: Array.isArray(v.posicion) ? [...v.posicion] : [0, 0, 0],
                rotacion: Array.isArray(v.rotacion) ? [...v.rotacion] : [0, 0, 0],
                parametros: { ...(v.parametros || {}) },
              },
            ])
          ),
          objetoActivoId: estado.objetoActivoId,
          objetoSeleccionado: estado.objetoActivoId !== null,
          posicionObjeto: Array.isArray(estado.posicionObjeto) ? [...estado.posicionObjeto] : [0, 0, 0],
          posicionPrevia: Array.isArray(estado.posicionObjeto) ? [...estado.posicionObjeto] : [0, 0, 0],
          parametros: { ...estado.parametros } as any,
          resultado: estado.resultado,
          indiceHistorial: nuevoIndice,
          puedeDeshacer: nuevoIndice > 0,
          puedeRehacer: true,
          modoTransformacion: "none",
        });
      }
    }
  },

  rehacer: () => {
    const s = get();
    if (s.indiceHistorial < s.pilaHistorial.length - 1) {
      const nuevoIndice = s.indiceHistorial + 1;
      const estado = s.pilaHistorial[nuevoIndice];
      if (estado) {
        set({
          instancias: Object.fromEntries(
            Object.entries(estado.instancias || {}).map(([k, v]) => [
              k,
              {
                ...v,
                posicion: Array.isArray(v.posicion) ? [...v.posicion] : [0, 0, 0],
                rotacion: Array.isArray(v.rotacion) ? [...v.rotacion] : [0, 0, 0],
                parametros: { ...(v.parametros || {}) },
              },
            ])
          ),
          objetoActivoId: estado.objetoActivoId,
          objetoSeleccionado: estado.objetoActivoId !== null,
          posicionObjeto: Array.isArray(estado.posicionObjeto) ? [...estado.posicionObjeto] : [0, 0, 0],
          posicionPrevia: Array.isArray(estado.posicionObjeto) ? [...estado.posicionObjeto] : [0, 0, 0],
          parametros: { ...estado.parametros } as any,
          resultado: estado.resultado,
          indiceHistorial: nuevoIndice,
          puedeDeshacer: true,
          puedeRehacer: nuevoIndice < s.pilaHistorial.length - 1,
          modoTransformacion: "none",
        });
      }
    }
  },

  // =========================================================================
  // 🎮 SELECCIÓN & TRANSFORMACIÓN ESPACIAL ESTILO BLENDER (G: Grab / B: Snap)
  // =========================================================================
  objetoSeleccionado: false,
  posicionObjeto: [0, 0, 0],
  posicionPrevia: [0, 0, 0],
  rotacionObjeto: [0, 0, 0],
  modoTransformacion: "none",
  ejeBloqueado: "none",
  snapActivo: false,
  snapPicking: false,
  snapBasePoint: null,
  snapTargetPoint: null,
  snapTargetType: null,

  setObjetoSeleccionado: (objetoSeleccionado) => {
    set((s) => {
      if (!objetoSeleccionado) {
        return { objetoSeleccionado: false, objetoActivoId: null };
      }
      return { objetoSeleccionado: true };
    });
  },
  setPosicionObjeto: (posicionObjeto) => {
    set((s) => {
      const activeId = s.objetoActivoId;
      if (activeId && s.instancias[activeId]) {
        return {
          posicionObjeto,
          instancias: {
            ...s.instancias,
            [activeId]: { ...s.instancias[activeId], posicion: posicionObjeto },
          },
        };
      }
      return { posicionObjeto };
    });
  },

  iniciarGrab: () => {
    const state = get();
    // Si la pila está vacía, aseguramos el estado inicial antes de mover
    if (state.pilaHistorial.length === 0) {
      state.guardarEstadoHistorial();
    }
    const activeId = state.objetoActivoId;
    const inst = activeId ? state.instancias[activeId] : null;
    const pos = inst ? inst.posicion : state.posicionObjeto;

    set(() => ({
      modoTransformacion: "grab",
      posicionPrevia: [...pos],
      posicionObjeto: [...pos],
      ejeBloqueado: "none",
      snapActivo: false,
      snapPicking: false,
      snapBasePoint: null,
      snapTargetPoint: null,
      snapTargetType: null,
    }));
  },

  confirmarGrab: () => {
    const state = get();
    const activeId = state.objetoActivoId;
    const currentPos = state.posicionObjeto;

    if (activeId && state.instancias[activeId]) {
      set((s) => ({
        modoTransformacion: "none",
        instancias: {
          ...s.instancias,
          [activeId]: {
            ...s.instancias[activeId],
            posicion: [...currentPos],
            posicionPrevia: [...currentPos],
          },
        },
        posicionPrevia: [...currentPos],
        ejeBloqueado: "none",
        snapActivo: false,
        snapPicking: false,
        snapBasePoint: null,
        snapTargetPoint: null,
        snapTargetType: null,
      }));
      get().guardarEstadoHistorial();
    } else {
      set({ modoTransformacion: "none" });
    }
  },

  cancelarGrab: () => {
    const state = get();
    const activeId = state.objetoActivoId;
    const prevPos = state.posicionPrevia;

    if (activeId && state.instancias[activeId]) {
      set((s) => ({
        modoTransformacion: "none",
        posicionObjeto: [...prevPos],
        instancias: {
          ...s.instancias,
          [activeId]: {
            ...s.instancias[activeId],
            posicion: [...prevPos],
          },
        },
        ejeBloqueado: "none",
        snapActivo: false,
        snapPicking: false,
        snapBasePoint: null,
        snapTargetPoint: null,
        snapTargetType: null,
      }));
    } else {
      set({ modoTransformacion: "none" });
    }
  },

  setEjeBloqueado: (eje) =>
    set((state) => ({
      ejeBloqueado: state.ejeBloqueado === eje ? "none" : eje,
    })),

  toggleSnapMode: () =>
    set((state) => ({
      snapPicking: !state.snapPicking,
      snapActivo: true,
      snapTargetPoint: null,
      snapTargetType: null,
    })),

  setSnapPicking: (snapPicking) => set({ snapPicking }),
  setSnapBasePoint: (snapBasePoint) => set({ snapBasePoint, snapPicking: false, snapActivo: true }),
  setSnapTargetPoint: (snapTargetPoint, tipo = null) => set({ snapTargetPoint, snapTargetType: tipo || null }),
  setSnapTargetType: (snapTargetType) => set({ snapTargetType }),

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
        if (t.proveedor === "Novopan" || t.proveedor === "Duratex") {
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
        if (t.proveedor === "Novopan" || t.proveedor === "Duratex") {
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
        if (mod.proveedor === "Novopan" || mod.proveedor === "Duratex") {
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
      if (hSaved) {
        const parsed: HerrajeRecord[] = JSON.parse(hSaved);
        const hasLegacy = parsed.some((h) => ["20070022", "20070009", "005895", "0000149", "010679", "20060067", "000478", "000468", "4829104", "4829015"].includes(h.codigo) || (h.id === "h1" && h.costoCop < 100));
        if (hasLegacy) {
          set({ dbHerrajes: HERRAJES_INICIALES_DEFECTO });
          localStorage.setItem("3bf_db_herrajes", JSON.stringify(HERRAJES_INICIALES_DEFECTO));
        } else {
          set({ dbHerrajes: parsed });
        }
      } else {
        set({ dbHerrajes: HERRAJES_INICIALES_DEFECTO });
      }

      const nSaved = localStorage.getItem("3bf_negociacion_novopan");
      let currentNeg: NegociacionNovopan = nSaved ? JSON.parse(nSaved) : NEGOCIACION_NOVOPAN_DEFECTO;
      if (currentNeg.trmNovopan === 4000 || !currentNeg.trmNovopan) {
        currentNeg = { ...currentNeg, trmNovopan: 3000 };
        localStorage.setItem("3bf_negociacion_novopan", JSON.stringify(currentNeg));
      }
      set({ negociacionNovopan: currentNeg });

      const tSaved = localStorage.getItem("3bf_db_tableros");
      if (tSaved) {
        const parsed: TableroRecord[] = JSON.parse(tSaved);
        const hasLegacyTableros = parsed.some((t) => ["NH0030615", "NP2020625", "CB2251415"].includes(t.codigo) || (t.nombreComercial && t.nombreComercial.includes("Ceniza")) || (t.nombreComercial && t.nombreComercial.includes("Poro")) || t.proveedor === "Novopan" || (t.id === "t1" && (t.costoListaUsd || 0) < 50));
        if (hasLegacyTableros) {
          set({ dbTableros: TABLEROS_INICIALES_DEFECTO });
          localStorage.setItem("3bf_db_tableros", JSON.stringify(TABLEROS_INICIALES_DEFECTO));
        } else {
          const sanitized = parsed.map((t: TableroRecord) => {
            const lista = t.costoListaUsd ?? t.costoLaminaUsd ?? 58.468;
            if (t.proveedor === "Novopan" || t.proveedor === "Duratex") {
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
              costoLaminaCop: Math.round(laminaUsd * 3000),
              costoM2Usd: m2Usd,
              costoM2Cop: Math.round(m2Usd * 3000),
            };
          });
          set({ dbTableros: sanitized });
        }
      } else {
        set({ dbTableros: TABLEROS_INICIALES_DEFECTO });
      }

      const cSaved = localStorage.getItem("3bf_db_cantos");
      if (cSaved) {
        const parsed: CantoRecord[] = JSON.parse(cSaved);
        const hasLegacyCantos = parsed.some(
          (c) =>
            c.descripcion.toUpperCase().includes("CENIZA") ||
            c.descripcion.toUpperCase().includes("CENDRA") ||
            c.descripcion.toUpperCase().includes("NEVADO") ||
            c.descripcion.toUpperCase().includes("GLACIAL") ||
            c.descripcion.endsWith(" N") ||
            ["0002788", "017288", "0004623", "000360", "000361", "0000253", "0000313"].includes(c.codigo) ||
            (c.id === "c_948201" && c.costoMlCop < 250)
        );
        if (hasLegacyCantos || parsed.length !== CANTOS_INICIALES_DEFECTO.length) {
          set({ dbCantos: CANTOS_INICIALES_DEFECTO });
          localStorage.setItem("3bf_db_cantos", JSON.stringify(CANTOS_INICIALES_DEFECTO));
        } else {
          set({ dbCantos: parsed });
        }
      } else {
        set({ dbCantos: CANTOS_INICIALES_DEFECTO });
      }

      const mSaved = localStorage.getItem("3bf_moneda");
      if (mSaved === "USD" || mSaved === "COP") set({ moneda: mSaved });

      const convSaved = localStorage.getItem("3bf_costos_conversion");
      if (convSaved) set({ costosConversion: JSON.parse(convSaved) });

      const fSaved = localStorage.getItem("3bf_fichas_config");
      if (fSaved) set({ fichasConfig: JSON.parse(fSaved) });

      // Hidratar AI Render Studio
      const pSaved = localStorage.getItem("3bf_biblioteca_prompts");
      if (pSaved) {
        try {
          const parsedPrompts: PromptTemplateItem[] = JSON.parse(pSaved);
          const customUserPrompts = parsedPrompts.filter(p => !p.esPresetSistema);
          set({ bibliotecaPrompts: [...customUserPrompts, ...PROMPTS_INICIALES_DEFECTO] });
        } catch {
          set({ bibliotecaPrompts: PROMPTS_INICIALES_DEFECTO });
        }
      }

      const keySaved = localStorage.getItem("3bf_gemini_api_key");
      if (keySaved) {
        set({ geminiApiKey: keySaved });
      } else {
        set({ geminiApiKey: "" });
      }

      const falKeySaved = localStorage.getItem("3bf_fal_api_key");
      if (falKeySaved) set({ falApiKey: falKeySaved });

      const hRendersSaved = localStorage.getItem("3bf_historial_renders");
      if (hRendersSaved) {
        try { set({ historialRendersIA: JSON.parse(hRendersSaved) }); } catch {}
      }
    } catch (e) {
      console.error("Error hidratando base de datos desde localStorage:", e);
    }
  },

  // 🤖 3BF AI Render Studio: Implementación de Estado y Métodos
  modalRenderIAAbierto: false,
  setModalRenderIAAbierto: (modalRenderIAAbierto) => set({ modalRenderIAAbierto }),
  geminiApiKey: typeof window !== "undefined" && window.localStorage ? (localStorage.getItem("3bf_gemini_api_key") || "") : "",
  setGeminiApiKey: (geminiApiKey) => {
    if (typeof window !== "undefined" && window.localStorage) {
      localStorage.setItem("3bf_gemini_api_key", geminiApiKey);
    }
    set({ geminiApiKey });
  },
  falApiKey: typeof window !== "undefined" && window.localStorage ? localStorage.getItem("3bf_fal_api_key") || "" : "",
  setFalApiKey: (falApiKey) => {
    if (typeof window !== "undefined" && window.localStorage) {
      localStorage.setItem("3bf_fal_api_key", falApiKey);
    }
    set({ falApiKey });
  },
  bibliotecaPrompts: PROMPTS_INICIALES_DEFECTO,
  promptActivoRender: PROMPTS_INICIALES_DEFECTO[0].prompt,
  setPromptActivoRender: (promptActivoRender) => set({ promptActivoRender }),
  motorSeleccionadoRender: "google_gemini_imagen3",
  setMotorSeleccionadoRender: (motorSeleccionadoRender) => set({ motorSeleccionadoRender }),
  aspectRatioRender: "1:1",
  setAspectRatioRender: (aspectRatioRender) => set({ aspectRatioRender }),

  guardarNuevoPrompt: (item) => {
    const id = `prompt_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const nuevo: PromptTemplateItem = {
      ...item,
      id,
      esPresetSistema: false,
      creadoEn: new Date().toISOString()
    };
    set((state) => {
      const updated = [nuevo, ...state.bibliotecaPrompts];
      if (typeof window !== "undefined" && window.localStorage) {
        localStorage.setItem("3bf_biblioteca_prompts", JSON.stringify(updated));
      }
      return { bibliotecaPrompts: updated, promptActivoRender: nuevo.prompt };
    });
    return id;
  },

  actualizarPrompt: (id, cambios) => {
    set((state) => {
      const updated = state.bibliotecaPrompts.map((p) => (p.id === id ? { ...p, ...cambios } : p));
      if (typeof window !== "undefined" && window.localStorage) {
        localStorage.setItem("3bf_biblioteca_prompts", JSON.stringify(updated));
      }
      return { bibliotecaPrompts: updated };
    });
  },

  eliminarPrompt: (id) => {
    set((state) => {
      const target = state.bibliotecaPrompts.find((p) => p.id === id);
      if (target?.esPresetSistema) return state; // Presets del sistema protegidos
      const updated = state.bibliotecaPrompts.filter((p) => p.id !== id);
      if (typeof window !== "undefined" && window.localStorage) {
        localStorage.setItem("3bf_biblioteca_prompts", JSON.stringify(updated));
      }
      return { bibliotecaPrompts: updated };
    });
  },

  toggleFavoritoPrompt: (id) => {
    set((state) => {
      const updated = state.bibliotecaPrompts.map((p) => (p.id === id ? { ...p, esFavorito: !p.esFavorito } : p));
      if (typeof window !== "undefined" && window.localStorage) {
        localStorage.setItem("3bf_biblioteca_prompts", JSON.stringify(updated));
      }
      return { bibliotecaPrompts: updated };
    });
  },

  restaurarPromptsDefecto: () => {
    set((state) => {
      const userPrompts = state.bibliotecaPrompts.filter((p) => !p.esPresetSistema);
      const restored = [...userPrompts, ...PROMPTS_INICIALES_DEFECTO];
      if (typeof window !== "undefined" && window.localStorage) {
        localStorage.setItem("3bf_biblioteca_prompts", JSON.stringify(restored));
      }
      return { bibliotecaPrompts: restored };
    });
  },

  historialRendersIA: [],
  agregarRenderHistorial: (resultado) => {
    set((state) => {
      const updated = [resultado, ...state.historialRendersIA.slice(0, 24)]; // Máximo 25 renders en memoria
      if (typeof window !== "undefined" && window.localStorage) {
        try { localStorage.setItem("3bf_historial_renders", JSON.stringify(updated)); } catch {}
      }
      return { historialRendersIA: updated };
    });
  },

  eliminarRenderHistorial: (id) => {
    set((state) => {
      const updated = state.historialRendersIA.filter((r) => r.id !== id);
      if (typeof window !== "undefined" && window.localStorage) {
        try { localStorage.setItem("3bf_historial_renders", JSON.stringify(updated)); } catch {}
      }
      return { historialRendersIA: updated };
    });
  },

  limpiarHistorialRenders: () => {
    if (typeof window !== "undefined" && window.localStorage) {
      localStorage.removeItem("3bf_historial_renders");
    }
    set({ historialRendersIA: [] });
  },

  // 🧪 3BF PBR Material Studio & Shader Ball Lab
  modalPBRStudioAbierto: false,
  setModalPBRStudioAbierto: (abierto) => set({ modalPBRStudioAbierto: abierto }),
  materialEnCalibracion: null,
  setMaterialEnCalibracion: (mat) => set({ materialEnCalibracion: mat }),
  abrirPBRStudioParaMaterial: (materialId) => {
    const state = get();
    const targetId = materialId || state.materialSeleccionadoId || "mat_duna";
    const mat = state.materialesPBR.find((m) => m.id === targetId) || state.materialesPBR[0];
    if (mat) {
      set({
        materialEnCalibracion: JSON.parse(JSON.stringify(mat)),
        materialSeleccionadoId: mat.id,
        modalPBRStudioAbierto: true,
      });
    }
  },
  aplicarMaterialAMuebleActivo: (materialId) => {
    const state = get();
    const mat = state.materialesPBR.find((m) => m.id === materialId);
    if (!mat) return;

    // 1. Asignar el material a la capa Tono y Capa Madera para que todas las piezas por defecto lo adopten
    const capasActualizadas = state.capas.map((c) => {
      if (c.id === "capa_tono" || c.nombre.toLowerCase().includes("tono") || c.id === "capa_madera") {
        return { ...c, materialId: mat.id };
      }
      return c;
    });

    // 2. Extraer todas las partes conocidas del modelo activo
    const res = state.resultado;
    const salidas = res?.declared_outputs || [];
    const mallas = (res?.real_meshes || []).map((m: any) => m.name);
    const todasLasPartes = Array.from(new Set([...Object.keys(state.asignacionesPartes), ...salidas, ...mallas])).filter(Boolean);

    const nuevasAsignaciones = { ...state.asignacionesPartes };
    todasLasPartes.forEach((parteKey) => {
      const kLow = parteKey.toLowerCase();
      const isHardware = kLow.includes("perno") || kLow.includes("caja") || kLow.includes("tarugo") || kLow.includes("tornillo") || kLow.includes("maquinado");
      if (!isHardware) {
        nuevasAsignaciones[parteKey] = {
          ...(nuevasAsignaciones[parteKey] || {
            parteKey,
            nombreVisible: parteKey.replace(/^RH_OUT:/, ""),
            visible: true,
          }),
          capaId: "capa_tono",
          materialId: "por_capa",
        };
      }
    });

    if (typeof window !== "undefined" && window.localStorage) {
      localStorage.setItem("3bf_asignaciones_partes_v1", JSON.stringify(nuevasAsignaciones));
      localStorage.setItem("3bf_capas_v1", JSON.stringify(capasActualizadas));
    }
    set({ asignacionesPartes: nuevasAsignaciones, capas: capasActualizadas, materialSeleccionadoId: mat.id });
  },

  cargarDefinicion: async (item: { id: string; archivo?: string; nombre?: string }) => {
    await get().agregarInstanciaGHX(item);
  },
}));

