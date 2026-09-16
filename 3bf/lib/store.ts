import { createEngineSlice } from "./slices/createEngineSlice";
import { createManualSlice } from "./slices/createManualSlice";
import { createCatalogSlice } from "./slices/createCatalogSlice";
import { createSceneInstanceSlice } from "./slices/createSceneInstanceSlice";
import { createHistorySlice } from "./slices/createHistorySlice";
import { createTransformSlice } from "./slices/createTransformSlice";
import { createCostosSlice } from "./slices/createCostosSlice";
import { createRenderIASlice } from "./slices/createRenderIASlice";
/**
 * =========================================================================================
 * 🚀 3dBimFab Core Store — VERSIÓN 1.0.1 (Estable Oficial)
 * Hito 114: Cierre del Círculo de Vinculación Total GHX ⇄ Mueble (.3bf) ⇄ Manual (.3bm)
 * Persistencia en espejo y actualización automática tras recargar definición de Grasshopper.
 * Fecha de Certificación: 12 de Septiembre, 2026
 * =========================================================================================
 */

import { create } from "zustand";
import { extraerPiezaMadre, perteneceAPiezaMadre, agruparMallasEnPiezasMadre, esHerrajeNombre, anotarInstanciasFisicas } from "./piezaMadreUtils";

// 🏷️ Versión canónica del sistema y store
export const APP_VERSION = "v1.0.1";

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
  ejeX: "#0891B2",
  ejeY: "#B91C1C",
  ejeZ: "#334155",
  iconoPlanoUniversalX: "#0891B2",
  iconoPlanoUniversalY: "#B91C1C",
  iconoPlanoUniversalZ: "#334155",

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

  widgetEjeU: "#0891B2",
  widgetEjeV: "#B91C1C",
  widgetEjeW: "#334155",
  puntoSnap: "#FF9500",
};

export const PRESET_COLORES_OSCURO: ColoresApariencia = {
  fondo3D: "#0B0F17",
  rejillaPrincipal: "#334155",
  rejillaSecundaria: "#1E293B",
  ejeX: "#06B6D4",
  ejeY: "#F87171",
  ejeZ: "#94A3B8",
  iconoPlanoUniversalX: "#06B6D4",
  iconoPlanoUniversalY: "#F87171",
  iconoPlanoUniversalZ: "#94A3B8",

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
  colorMarca: "#1368AA",
  botonActivo: "#1368AA",
  botonInactivo: "#1E293B",
  bordeBotonInactivo: "#334155",
  bordeControles: "#334155",
  panelContenedor: "#131B2E",
  fondoTopNav: "#131B2E",
  insigniaFondo: "#083344",
  insigniaTexto: "#1368AA",
  estadoActivo: "#10B981",
  iconosFijos: "#1368AA",

  tablaEncabezadoFondo: "#1E293B",
  tablaEncabezadoTexto: "#F8FAFC",
  tablaFilaFondo: "#131B2E",
  tablaBorde: "#233044",
  tablaTotalFondo: "#0B0F17",
  tablaTotalTexto: "#1368AA",
  kpiTarjetaFondo: "#131B2E",
  kpiTarjetaTexto: "#1368AA",

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
  fichaProducto?: FichaProductoDef;
  dimensionesEnvolventes?: { ancho: number; alto: number; profundidad: number };
  totalPiezas?: number;
  costoEstimadoCop?: number;
  costoEstimadoUsd?: number;
  pasosManual?: PasoManualStudio[]; // Persistencia de pasos del manual 3D
  manualVinculadoId?: string; // 🔗 Vinculación inteligente con el manual .3bm
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
    es_duplicado_ghx?: boolean;
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
  mallas_duplicadas_detectadas?: Record<string, number>;
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
  calibreAristas: number;        // 50 a 200 (%) calibre/grosor visual de aristas
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

  // 💡 Iluminación de Estudio Interactiva (Estilo Unreal Engine)
  mostrarGizmosLuces: boolean;          // Ver iconos 3D de las lámparas en el visor
  luzSeleccionadaId: string | null;      // ID de la lámpara seleccionada en 3D
  presetIluminacion: string;            // Key del preset activo (estudio_suave, sol_natural, etc.)
  lucesEstudio: Record<string, StudioLightConfig>; // Configuración individual de cada luz
}

export interface StudioLightConfig {
  id: string;
  nombre: string;
  tipo: "directional" | "point" | "ambient";
  activa: boolean;
  intensidad: number;
  color: string;
  temperaturaKelvin: number; // 2500K a 8000K
  azimut: number;            // 0° a 360° en torno al mueble
  elevacion: number;         // 5° a 85° de altura
  distancia: number;         // Distancia radial en metros
  proyectarSombras: boolean;
  tamanoIcono?: number;

  // 🎯 Punto Objetivo (Target) y Visualizadores Volumétricos Alámbricos (Estilo Unreal)
  target: [number, number, number];        // Coordenadas [X, Y, Z] hacia donde apunta la luz
  anguloCono: number;                      // Ángulo de apertura del cono en grados (15° a 80°)
  radioAlcance: number;                    // Radio de influencia en metros para luz esférica (bombillo 360°)
  modoGizmo: "luz" | "target" | "ninguno"; // Control de anclaje de flechas de transformación 3D

  // 🖼️ Configuración HDRI (Cielo / IBL)
  hdriUrl?: string;                        // URL o Blob URL del archivo HDRI activo
  hdriNombre?: string;                     // Nombre del archivo (ej: "modern_bathroom_1k.hdr")
  hdriThumbnailUrl?: string;               // URL de la miniatura para la interfaz
  esHdriPorDefecto?: boolean;              // True si es el HDRI oficial de fábrica
}

export const DEFAULT_HDRI_CONFIG = {
  url: "/textures/hdri/modern_bathroom_1k.hdr",
  nombre: "modern_bathroom_1k.hdr",
  titulo: "Baño Moderno 1K (Poly Haven)",
  thumbnailUrl: "/textures/hdri/modern_bathroom_1k_preview.jpg",
  esPorDefecto: true,
};

export function kelvinToHex(kelvin: number): string {
  const temp = Math.max(1000, Math.min(40000, kelvin)) / 100;
  let r: number, g: number, b: number;

  if (temp <= 66) {
    r = 255;
  } else {
    r = temp - 60;
    r = 329.698727446 * Math.pow(r, -0.1332047592);
    r = Math.max(0, Math.min(255, r));
  }

  if (temp <= 66) {
    g = temp;
    g = 99.4708025861 * Math.log(g) - 161.1195681661;
    g = Math.max(0, Math.min(255, g));
  } else {
    g = temp - 60;
    g = 288.1221695283 * Math.pow(g, -0.0755148492);
    g = Math.max(0, Math.min(255, g));
  }

  if (temp >= 66) {
    b = 255;
  } else if (temp <= 19) {
    b = 0;
  } else {
    b = temp - 10;
    b = 138.5177312231 * Math.log(b) - 305.0447927307;
    b = Math.max(0, Math.min(255, b));
  }

  const toHex = (n: number) => Math.round(n).toString(16).padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

export const PRESETS_ILUMINACION: Record<string, { nombre: string; descripcion: string; luces: Record<string, Partial<StudioLightConfig>> }> = {
  estudio_suave: {
    nombre: "Estudio Suave (Recomendado)",
    descripcion: "Equilibrio suave anti-quemado, destaca vetas de madera sin sobreexposición",
    luces: {
      key_sun: { activa: true, intensidad: 0.9, temperaturaKelvin: 5400, color: "#fff9f2", azimut: 45, elevacion: 50, distancia: 4.5, proyectarSombras: true },
      fill_light: { activa: true, intensidad: 0.35, temperaturaKelvin: 6000, color: "#f2f6ff", azimut: 225, elevacion: 40, distancia: 4.0, proyectarSombras: false },
      rim_light: { activa: true, intensidad: 0.35, temperaturaKelvin: 5500, color: "#ffffff", azimut: 315, elevacion: 55, distancia: 4.2, proyectarSombras: false },
      ambient_light: { activa: true, intensidad: 0.45, temperaturaKelvin: 5500, color: "#ffffff", azimut: 0, elevacion: 90, distancia: 0, proyectarSombras: false },
      env_hdri: { activa: true, intensidad: 0.55, temperaturaKelvin: 6500, color: "#ffffff", azimut: 45 }
    }
  },
  sol_natural: {
    nombre: "Luz Solar Natural",
    descripcion: "Sol cálido directo con relleno de cielo suave",
    luces: {
      key_sun: { activa: true, intensidad: 1.15, temperaturaKelvin: 4600, color: "#ffe6cc", azimut: 55, elevacion: 55, distancia: 4.5, proyectarSombras: true },
      fill_light: { activa: true, intensidad: 0.25, temperaturaKelvin: 6800, color: "#e3edff", azimut: 235, elevacion: 35, distancia: 4.0, proyectarSombras: false },
      rim_light: { activa: true, intensidad: 0.3, temperaturaKelvin: 5000, color: "#fff5eb", azimut: 300, elevacion: 50, distancia: 4.0, proyectarSombras: false },
      ambient_light: { activa: true, intensidad: 0.4, temperaturaKelvin: 5500, color: "#ffffff", azimut: 0, elevacion: 90, distancia: 0, proyectarSombras: false },
      env_hdri: { activa: true, intensidad: 0.75, temperaturaKelvin: 6000, color: "#ffffff", azimut: 55 }
    }
  },
  showroom: {
    nombre: "Showroom Comercial",
    descripcion: "Iluminación de catálogo 360° homogénea y cristalina",
    luces: {
      key_sun: { activa: true, intensidad: 0.95, temperaturaKelvin: 5500, color: "#ffffff", azimut: 40, elevacion: 60, distancia: 4.5, proyectarSombras: true },
      fill_light: { activa: true, intensidad: 0.35, temperaturaKelvin: 5500, color: "#ffffff", azimut: 220, elevacion: 45, distancia: 4.0, proyectarSombras: false },
      rim_light: { activa: true, intensidad: 0.5, temperaturaKelvin: 6000, color: "#f2f6ff", azimut: 320, elevacion: 65, distancia: 4.2, proyectarSombras: false },
      ambient_light: { activa: true, intensidad: 0.55, temperaturaKelvin: 5500, color: "#ffffff", azimut: 0, elevacion: 90, distancia: 0, proyectarSombras: false },
      env_hdri: { activa: true, intensidad: 0.65, temperaturaKelvin: 6500, color: "#ffffff", azimut: 90 }
    }
  },
  alto_contraste: {
    nombre: "Contraste Escultórico",
    descripcion: "Sombras profundas y relieve arquitectónico marcado",
    luces: {
      key_sun: { activa: true, intensidad: 1.35, temperaturaKelvin: 5200, color: "#fff4e6", azimut: 35, elevacion: 42, distancia: 4.5, proyectarSombras: true },
      fill_light: { activa: true, intensidad: 0.15, temperaturaKelvin: 6200, color: "#edf2fa", azimut: 215, elevacion: 28, distancia: 4.0, proyectarSombras: false },
      rim_light: { activa: true, intensidad: 0.45, temperaturaKelvin: 5000, color: "#ffffff", azimut: 310, elevacion: 60, distancia: 4.0, proyectarSombras: false },
      ambient_light: { activa: true, intensidad: 0.25, temperaturaKelvin: 5500, color: "#ffffff", azimut: 0, elevacion: 90, distancia: 0, proyectarSombras: false },
      env_hdri: { activa: true, intensidad: 0.15, temperaturaKelvin: 7000, color: "#ffffff", azimut: 35 }
    }
  }
};

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

// ==========================================
// 🛠️ TIPOS PARA MODO MANUAL / MANUAL STUDIO
// ==========================================

export type IdiomaManual = "es" | "pt" | "en";

export type CoreografiaShowcase = "secuencial" | "cascada" | "simultaneo";
export type EjeAperturaShowcase = "+Z" | "-Z" | "+Y" | "-Y" | "+X" | "-X";

export interface GrupoCinematicoShowcase {
  id: string; // e.g. "cajon_1", "puerta_1"
  nombre: string; // e.g. "Cajón 1 (Superior)", "Puerta Izquierda"
  tipo: "cajon" | "puerta";
  piezas: string[]; // e.g. ["Peça 6", "Peça 8", "Peça 9", "Peça 10", "Peça 11"]
  ejeApertura: EjeAperturaShowcase;
  distanciaMm: number; // e.g. 300
  anguloRotacionDeg?: number; // Para puertas e.g. 90
  ladoBisagra?: "izquierda" | "derecha"; // Para puertas: lado de giro del pivote
  pivoteOffsetMm?: number; // Ajuste fino del pivote en milímetros
  oculto?: boolean; // 💡 Apagar bloque como capa para ver herrajes y piezas interiores
}

export interface ModoPickingManualState {
  activo: boolean;
  modo?: "agregar" | "retirar";
  grupoId: string | null;
  pasoId: string | null;
  piezasTemporalmenteSeleccionadas: string[];
}

export interface ElementoSecuenciaCinematica {
  id: string;
  nombreNodo: string; // e.g. "Lateral_Izquierda", "Cavilha.001", "Parafuso estrutural.001"
  tipo: "pieza" | "herraje" | "subensamble";
  tiempoInicio: number; // en segundos (e.g. 1.0)
  duracionMovimiento: number; // segundos (e.g. 2.5)
  popIn: boolean; // escala inicial 2.0 -> 1.0 para llamar la atención visual
  distanciaAproximacion: number; // metros (offset colineal e.g. 0.15m)
  rotacionGrados?: number; // e.g. 720 para tornillos (2 vueltas), 180 para tambor minifix
  herramienta?: "ninguna" | "martillo" | "llave_allen" | "destornillador";
  impactosHerramienta?: number; // e.g. 3 golpes para martillo con 0mm de separación tangencial
}

export interface ParteGlbBloque {
  id: string;
  nombre: string;
  archivo: string;
  rol?: string;
}

export interface BloqueEstandarDef {
  id: string; // e.g. "desacople_corredera_telescopica"
  nombre: string;
  categoriaMarca: string; // e.g. "Universales", "Móveis Henn", "Politorno", "RTA Design"
  subcategoria?: string; // e.g. "Correderas", "Minifix", "Bisagras"
  descripcion: string;
  archivo: string; // e.g. "desacople_corredera_telescopica.3bb.json"
  thumbnail?: string;
  duracion: number; // segundos (e.g. 8.0)
  guionEs: string;
  guionPt: string;
  guionEn: string;
  carpetaModelos?: string;
  partesGlb?: ParteGlbBloque[];
  mallas?: string[];
  animacionTracks?: any[];
  rutaFisica?: string;
  fechaCreacion?: string;
}

export interface BloqueEstandarRef {
  id: string;
  nombre: string;
  categoriaMarca: string;
  subcategoria?: string;
  descripcion?: string;
  archivo?: string;
  thumbnail?: string;
  duracion: number;
  guionEs?: string;
  guionPt?: string;
  guionEn?: string;
  carpetaModelos?: string;
  partesGlb?: ParteGlbBloque[];
  animacionTracks?: any[];
}

export interface SubBloqueTransformBanco {
  acostado: boolean;          // Lay Flat activo contra plano horizontal
  direccionAcostar?: "izquierda" | "derecha"; // Dirección hacia la cual acostar la pieza (default "izquierda")
  rotacionYDeg: number;       // 0, 90, 180, 270 grados
  rotacion: [number, number, number]; // [rotX, rotY, rotZ] en grados
  rotacionPlano?: number;     // 0, 90, 180, 270 grados en el plano acostado
  flipCara: boolean;          // Inversión 180° de cara
  offsetX: number;            // Desplazamiento X en metros
  offsetZ: number;            // Desplazamiento Z en metros
  apoyoEnPiso: boolean;       // Apoyar cara inferior de la pieza máster en ras de piso
}

export interface SubBloqueAnimacionTrack {
  tiempoInicio: number;       // Segundo de inicio en el timeline global
  duracion: number;           // Duración en segundos de este subbloque
}

export interface SubBloqueArmado {
  id: string; // ej. "sub_P02_A_1234"
  codigo?: string; // ej. "P02A", "P02B"
  letra: string; // "A", "B", "C", "D"...
  nombre: string; // "Sub-Bloque P02-A", "Sub-Bloque P02-B"...
  piezaMaster?: string; // 🎯 Pieza máster independiente de este subbloque
  piezas: string[]; // tableros asignados a este subbloque
  herrajes: string[]; // herrajes asignados a este subbloque
  oculto?: boolean; // visibilidad apagada/prendida en 3D
  orientacionBanco?: {
    rotacion: [number, number, number];
    apoyoEnPiso: boolean;
  };
  transformBanco?: SubBloqueTransformBanco;
  trackAnimacion?: SubBloqueAnimacionTrack;
}

export interface PasoManualStudio {
  id: string; // "P00", "P01", "P02"...
  numero: number;
  tipo: "showcase" | "ensamble" | "bloque_estandar";
  titulo: string;
  descripcion: string;
  duracionTotal: number; // segundos
  
  // Configuración Showcase (Paso 00)
  showcase?: {
    abrirCajones: boolean;
    distanciaAperturaMm: number;
    abrirPuertas: boolean;
    anguloPuertasDeg: number;
    giroPresentacion360: boolean;
    coreografia: CoreografiaShowcase;
    ejeGlobal: EjeAperturaShowcase;
    gruposCinematicos: GrupoCinematicoShowcase[];
    sincronizarCarreraCajones?: boolean; // Unificar carrera de apertura idéntica en todos los cajones
  };
  
  // Configuración Ensamble (P01+)
  piezaMaster?: string; // Nombre del nodo base que apoya en banco
  orientacionBanco?: {
    rotacion: [number, number, number]; // Radianes Euler
    apoyoEnPiso: boolean;
  };
  piezasAsignadas: string[];
  herrajesAsignados: string[];
  subbloques?: SubBloqueArmado[]; // 🧩 Sub-etapas de armado (Subbloque A, B, C...)
  coreografiaSubbloques?: 1 | 2; // 🎭 1 = Secuencial por corredera, 2 = Simultánea en bloque
  piezasOcultas?: boolean; // 💡 Apagar / Prender piezas de este paso en el 3D
  ocultarNoAsignadas?: boolean; // 💡 Apagar piezas y herrajes que no pertenecen a este paso (Aislar Paso)
  secuencia: ElementoSecuenciaCinematica[];

  // 📦 Configuración Bloque Estándar Reutilizable (.3bb.json)
  bloqueEstandar?: BloqueEstandarRef;
  
  // Locución TTS Multilingüe (Español, Português, Inglés)
  guionEs: string;
  guionPt: string;
  guionEn: string;
  vozEs: string;
  vozPt: string;
  vozEn: string;
  audioUrlEs?: string;
  audioUrlPt?: string;
  audioUrlEn?: string;
  duracionAudioSegundos: number;
}

export interface Manual3BMProyecto {
  id: string; // e.g. "manual_comoda_ravenna"
  muebleOrigenId?: string;
  nombre: string;
  marca: string;
  tipologia: string;
  fechaModificacion: string;
  parametrosMueble?: Record<string, any>;
  pasos: PasoManualStudio[];
  thumbnail?: string;
}

export const BLOQUES_ESTANDAR_DEFAULT: BloqueEstandarDef[] = [
  {
    id: "corredera_telescopica_350",
    nombre: "Corredera Telescópica 350",
    categoriaMarca: "Universales",
    subcategoria: "Herrajes",
    descripcion: "Corredera telescópica universal de extensión total de 350 mm.",
    archivo: "corredera_telescopica_350.3bb.json",
    thumbnail: "/thumbnails/bloque_corredera_desacople.svg",
    duracion: 8.0,
    guionEs: "Paso: Corredera Telescópica 350.",
    guionPt: "Passo: Corrediça Telescópica 350.",
    guionEn: "Step: Telescopic Slide 350.",
    carpetaModelos: "/library/bloques/modelos/corredera_telescopica_350",
    partesGlb: [
      { id: "fija", nombre: "Fija", archivo: "/library/bloques/modelos/corredera_telescopica_350/Fija.glb" },
      { id: "intermedia", nombre: "Intermedia", archivo: "/library/bloques/modelos/corredera_telescopica_350/Intermedia.glb" },
      { id: "movil", nombre: "Movil", archivo: "/library/bloques/modelos/corredera_telescopica_350/Movil.glb" },
      { id: "seguro", nombre: "Seguro", archivo: "/library/bloques/modelos/corredera_telescopica_350/Seguro.glb" },
    ],
    fechaCreacion: "2026-09-14T15:27:50.200Z",
  },
  {
    id: "desacople_corredera_telescopica",
    nombre: "Desacople de Corredera Telescópica (Full Extension)",
    categoriaMarca: "Universales",
    subcategoria: "Correderas",
    descripcion: "Procedimiento universal para separar la guía interior (lado cajón) de la guía exterior (lado mueble) presionando la palanca o gatillo de nylon negro hacia abajo.",
    archivo: "desacople_corredera_telescopica.3bb.json",
    thumbnail: "/thumbnails/bloque_corredera_desacople.svg",
    duracion: 8.0,
    guionEs: "Antes de armar, extiende la corredera telescópica. Presiona la palanca plástica negra hacia abajo y desliza la guía interna hacia afuera para separarla del riel.",
    guionPt: "Antes de montar, estenda a corrediça telescópica. Pressione a trava plástica preta para baixo e puxe o trilho interno para desacoplar a peça.",
    guionEn: "Before assembly, extend the telescopic slide. Push down the black plastic release lever and pull the inner runner out to separate it.",
    carpetaModelos: "/library/bloques/modelos/corredera_telescopica_350",
    partesGlb: [
      { id: "fija", nombre: "Guía Fija (Lateral Mueble)", archivo: "/library/bloques/modelos/corredera_telescopica_350/Fija.glb", rol: "fija_mueble" },
      { id: "intermedia", nombre: "Guía Intermedia", archivo: "/library/bloques/modelos/corredera_telescopica_350/Intermedia.glb", rol: "guia_intermedia" },
      { id: "movil", nombre: "Guía Móvil (Lateral Cajón)", archivo: "/library/bloques/modelos/corredera_telescopica_350/Movil.glb", rol: "movil_cajon" },
      { id: "seguro", nombre: "Gatillo / Seguro de Nylon", archivo: "/library/bloques/modelos/corredera_telescopica_350/Seguro.glb", rol: "palanca_seguro" },
    ],
    fechaCreacion: "2026-09-14T10:00:00.000Z",
  },
  {
    id: "ensamble_minifix_perno_tambor",
    nombre: "Ensamble Perno y Tambor Minifix",
    categoriaMarca: "Universales",
    subcategoria: "Minifix",
    descripcion: "Alineación e inserción del tambor de leva excéntrica sobre el perno de unión, realizando giro de 180° con destornillador Phillips.",
    archivo: "ensamble_minifix_perno_tambor.3bb.json",
    thumbnail: "/thumbnails/bloque_minifix.svg",
    duracion: 7.0,
    guionEs: "Inserta el perno minifix en el lateral. Coloca el tambor con la flecha apuntando hacia el perno y gira media vuelta hasta trabar firmemente.",
    guionPt: "Insira o pino minifix na lateral. Posicione o tambor com a seta apontando para o pino e gire meia volta até travar com firmeza.",
    guionEn: "Insert the minifix bolt into the panel. Place the cam lock with arrow facing the bolt and rotate 180 degrees until firmly locked.",
    fechaCreacion: "2026-09-14T10:00:00.000Z",
  },
  {
    id: "regulacion_bisagra_cazoleta",
    nombre: "Regulación 3D de Bisagra Cazoleta",
    categoriaMarca: "Universales",
    subcategoria: "Bisagras",
    descripcion: "Ajuste de los tres tornillos de regulación (profundidad, altura vertical y alineación lateral) para cuadrar la luz perimetral de puertas.",
    archivo: "regulacion_bisagra_cazoleta.3bb.json",
    thumbnail: "/thumbnails/bloque_bisagra.svg",
    duracion: 9.0,
    guionEs: "Para calibrar la puerta, ajusta el tornillo frontal para corregir la separación lateral, y el tornillo trasero para nivelar la profundidad.",
    guionPt: "Para alinhar a porta, regule o parafuso frontal para ajustar o espaço lateral e o parafuso traseiro para profundidade.",
    guionEn: "To calibrate the door, adjust the front screw to correct lateral gap and the rear screw to level door depth.",
    fechaCreacion: "2026-09-14T10:00:00.000Z",
  },
  {
    id: "desacople_corredera_oculta_clip",
    nombre: "Desacople de Corredera Oculta con Gatillo Clip",
    categoriaMarca: "Universales",
    subcategoria: "Correderas Ocultas",
    descripcion: "Liberación rápida de cajón montado sobre correderas ocultas (Under-mount) presionando los gatillos frontales ergonómicos bajo el fondo.",
    archivo: "desacople_corredera_oculta_clip.3bb.json",
    thumbnail: "/thumbnails/bloque_corredera_oculta.svg",
    duracion: 8.0,
    guionEs: "Presiona los gatillos plásticos situados bajo el fondo del cajón al mismo tiempo y levanta ligeramente para desenganchar las correderas ocultas.",
    guionPt: "Pressione as travas plásticas sob o fundo da gaveta simultaneamente e levante suavemente para desencaixar das corrediças ocultas.",
    guionEn: "Squeeze the plastic release clips under the drawer bottom simultaneously and lift gently to disengage from hidden runners.",
    fechaCreacion: "2026-09-14T10:00:00.000Z",
  },
  {
    id: "fijacion_corredera_lateral_henn",
    nombre: "Fijación de Correderas en Lateral (Patrón Henn)",
    categoriaMarca: "Móveis Henn",
    subcategoria: "Correderas",
    descripcion: "Atornillado de la corredera exterior respetando los agujeros guía del lateral y el retroceso de 2 mm desde el borde frontal.",
    archivo: "fijacion_corredera_lateral_henn.3bb.json",
    thumbnail: "/thumbnails/bloque_corredera_desacople.svg",
    duracion: 8.5,
    guionEs: "Ubica la guía exterior sobre las marcas del lateral dejando dos milímetros de retroceso desde el frente y fija con tornillos cabeza plana.",
    guionPt: "Posicione o trilho externo nas marcações da lateral com dois milímetros de recuo frontal e fixe com os parafusos.",
    guionEn: "Place the outer runner on the side panel markings with 2 mm setback from front edge and secure with flat head screws.",
    fechaCreacion: "2026-09-14T10:00:00.000Z",
  },
];

export function generarPasosManualesPorDefecto(): PasoManualStudio[] {
  return [
    {
      id: "P00",
      numero: 0,
      tipo: "showcase",
      titulo: "Paso 00: Showcase Funcional",
      descripcion: "Demostración del mueble completo en operación interactiva.",
      duracionTotal: 8.0,
      showcase: {
        abrirCajones: true,
        distanciaAperturaMm: 300,
        abrirPuertas: true,
        anguloPuertasDeg: 90,
        giroPresentacion360: true,
        coreografia: "secuencial",
        ejeGlobal: "+Z",
        gruposCinematicos: [],
      },
      piezasAsignadas: [],
      herrajesAsignados: [],
      secuencia: [],
      guionEs: "Antes de comenzar el ensamble, observa cómo luce tu mueble completamente armado y en funcionamiento.",
      guionPt: "Antes de começar a montagem, veja como seu móvel fica totalmente montado e funcionando.",
      guionEn: "Before starting assembly, take a look at your furniture fully assembled and functioning.",
      vozEs: "es-MX-DaliaNeural",
      vozPt: "pt-BR-FranciscaNeural",
      vozEn: "en-US-JennyNeural",
      duracionAudioSegundos: 8.0,
    },
  ];
}

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
  { id: "h9", codigo: "80350195", nombreGhx: "Corrediça", descripcion: "Par Correderas Telescópicas Full Extension 350mm Cincadas", categoria: "Correderas", mallasPorUnidad: 7, costoCop: 24650, costoUsd: 8.22, unidad: "PAR", pesoKg: 0.450, proveedor: "Ducasse" },
  { id: "h10", codigo: "501920", nombreGhx: "Cantoneira", descripcion: "Cantonera de Unión Metálica Zamak / Acero 2 Huecos", categoria: "Accesorios", mallasPorUnidad: 1, costoCop: 450, costoUsd: 0.150, unidad: "UND", pesoKg: 0.015, proveedor: "Nacional" },
  { id: "h11", codigo: "006420", nombreGhx: "Cavilha", descripcion: "Tarugo Estriado de Madera 8x30mm", categoria: "Tarugos", mallasPorUnidad: 1, costoCop: 23, costoUsd: 0.008, unidad: "UND", pesoKg: 0.001, proveedor: "Nacional" },
  { id: "h12", codigo: "0000855", nombreGhx: "Parafuso E", descripcion: "Tornillo de Ensamble Autorroscante Cincado", categoria: "Tornillos", mallasPorUnidad: 1, costoCop: 37, costoUsd: 0.012, unidad: "UND", pesoKg: 0.003, proveedor: "Spax" },
  { id: "h13", codigo: "901230", nombreGhx: "Pes", descripcion: "Pata Plástica Estructural Cómoda Ravenna", categoria: "Accesorios", mallasPorUnidad: 1, costoCop: 2500, costoUsd: 0.850, unidad: "UND", pesoKg: 0.040, proveedor: "Nacional" },
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
  motorUsado: "fal_nano_banana_2" | "fal_nano_banana_pro" | "fal_nano_banana" | "fal_phota_enhance" | "fal_bria_product_shot" | "fal_flux_dev" | "fal_flux_schnell" | "google_gemini_imagen3" | "flux_schnell_free" | "pollinations";
  fecha: string;
  aspectRatio: string;
}

export const PROMPTS_INICIALES_DEFECTO: PromptTemplateItem[] = [
  {
    id: "preset_architectural_digest_editorial",
    titulo: "Editorial Arquitectura (Architectural Digest)",
    categoria: "Hogar / Sala",
    prompt: `Editorial-style interior architecture photograph (Architectural Digest style) featuring the exact piece of furniture shown in the reference image.

STRICT PRODUCT LOCK (CRITICAL): Maintain 100% of the design, geometry, components, colors, and finishes of the furniture piece from the image without any alteration. Do not change, add, or invent details on the chest of drawers.

@Description

SET DESIGN AND ENVIRONMENT:
- Bright, high-design room, captured in daylight.
- Background wall finished in light ivory/off-white plaster with fine neoclassical moldings (boiserie).
- Soft grey polished micro-cement flooring with elegant, diffused reflections. In the foreground, the edge of a textured ivory/ecru bouclé wool rug.
- Lighting: Clear, enveloping natural light generously illuminating the space and the furniture without harsh, blocked-up shadows; complemented by a soft geometric shadow from a French window frame cast across the wall and floor.
- Styling on the furniture: A sculptural smoked-glass lamp emitting a soft warm glow, a minimalist art book, and a small organic ceramic vase. To the side, a contemporary sculptural chair in dark leather.

CAMERA: Professional product photography; 50mm lens positioned at the mid-height of the furniture; straight-on perspective; sharp focus; free of aberrations.`,
    descripcion: "Estilo editorial Architectural Digest con boiserie, microcemento, luz de ventanal francés y etiqueta @Description.",
    esFavorito: true,
    esPresetSistema: true,
    aspectRatio: "1:1"
  },
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
  thumbnailReal?: string; // Fotografía real capturada desde el visor 3D de ShaderBall
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
    repeat?: number;
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
  { id: "mat_acero", nombre: "Acero", tipo: "Metal", colorBase: "#CBD5E1", metalico: 0.92, rugosidad: 0.32, especularidad: 0.90, opacidad: 1.0, ior: 1.50, notas: "Acero pulido para herrajes y pernos" },
  { id: "mat_aluminio", nombre: "Aluminio", tipo: "Metal", colorBase: "#E2E8F0", metalico: 0.88, rugosidad: 0.42, especularidad: 0.85, opacidad: 1.0, ior: 1.50, notas: "Aluminio anodizado natural" },
  { id: "mat_marfil", nombre: "M_Marfil", tipo: "Melamina", colorBase: "#C5B39A", texturaUrl: "/textures/Marfil_diffuse.jpg", metalico: 0.05, rugosidad: 0.65, especularidad: 0.50, opacidad: 1.0, ior: 1.50, notas: "Melamina Novopan MDPKOR Marfil" },
  { id: "mat_duna", nombre: "Duna", tipo: "Melamina", colorBase: "#D2B48C", texturaUrl: "/textures/wood_melamine.jpg", metalico: 0.05, rugosidad: 0.60, especularidad: 0.50, opacidad: 1.0, ior: 1.50, notas: "Melamina Duna tono madera cálida" },
  { id: "mat_fresno", nombre: "M_Fresno", tipo: "Madera", colorBase: "#C2A67E", metalico: 0.02, rugosidad: 0.55, especularidad: 0.50, opacidad: 1.0, ior: 1.50, notas: "Madera Fresno poro abierto" },
  { id: "mat_cromo", nombre: "Cromo", tipo: "Metal", colorBase: "#FAFAFA", metalico: 1.00, rugosidad: 0.04, especularidad: 1.00, opacidad: 1.0, ior: 1.50, notas: "Cromado brillante tipo espejo" },
  { id: "mat_blanco", nombre: "M_Blanco", tipo: "Melamina", colorBase: "#FFFFFF", metalico: 0.05, rugosidad: 0.70, especularidad: 0.50, opacidad: 1.0, ior: 1.50, notas: "Melamina Blanco Glacial mate" },
  { id: "mat_mdf", nombre: "MDF", tipo: "Madera", colorBase: "#BDB088", metalico: 0.00, rugosidad: 0.85, especularidad: 0.30, opacidad: 1.0, ior: 1.50, notas: "Sustrato MDF crudo fibroso" },
  { id: "mat_mdp", nombre: "MDP", tipo: "Madera", colorBase: "#D5B88A", metalico: 0.00, rugosidad: 0.80, especularidad: 0.30, opacidad: 1.0, ior: 1.50, notas: "Sustrato MDP aglomerado canto expuesto" },
  { id: "mat_nurbs", nombre: "Nurbs", tipo: "PBR", colorBase: "#E036C0", metalico: 0.10, rugosidad: 0.30, especularidad: 0.60, opacidad: 0.85, ior: 1.50, notas: "Geometría analítica CAD" },
  { id: "mat_pnegro", nombre: "P_Negro", tipo: "Plastico", colorBase: "#1A1A1A", metalico: 0.10, rugosidad: 0.40, especularidad: 0.50, opacidad: 1.0, ior: 1.50, notas: "Plástico inyectado negro" },
  { id: "mat_pblanco", nombre: "P_Blanco", tipo: "Plastico", colorBase: "#F1F5F9", metalico: 0.10, rugosidad: 0.40, especularidad: 0.50, opacidad: 1.0, ior: 1.50, notas: "Plástico inyectado blanco" },
  { id: "mat_pintura_neg", nombre: "Pintura_Negra", tipo: "Pintura", colorBase: "#0F172A", metalico: 0.30, rugosidad: 0.35, especularidad: 0.60, opacidad: 1.0, ior: 1.50, notas: "Pintura electrostática negra mate" },
  { id: "mat_pintura_bla", nombre: "Pintura_Blanca", tipo: "Pintura", colorBase: "#F8FAFC", metalico: 0.30, rugosidad: 0.35, especularidad: 0.60, opacidad: 1.0, ior: 1.50, notas: "Pintura electrostática blanca satinada" },
  { id: "mat_zinc", nombre: "Zinc", tipo: "Metal", colorBase: "#D1D5DB", metalico: 0.95, rugosidad: 0.26, especularidad: 0.90, opacidad: 1.0, ior: 1.50, notas: "Zincado plateado satinado anticorrosivo" },
  { id: "mat_cinamomo", nombre: "Cinamomo", tipo: "Melamina", colorBase: "#B87B4C", texturaUrl: "/textures/cinamomo_diffuse.jpg", metalico: 0.04, rugosidad: 0.60, especularidad: 0.50, opacidad: 1.0, ior: 1.50, notas: "Melamina Cinamomo Henn calibrada cálida" },
  { id: "mat_offwhite", nombre: "Off White", tipo: "Melamina", colorBase: "#F5F2EB", metalico: 0.05, rugosidad: 0.65, especularidad: 0.50, opacidad: 1.0, ior: 1.50, notas: "Melamina Off White Henn satinada" },
  { id: "mat_perforados", nombre: "Perforados", tipo: "PBR", colorBase: "#EF4444", metalico: 0.00, rugosidad: 0.50, especularidad: 0.50, opacidad: 1.0, ior: 1.50, notas: "Guías de maquinado CNC y perforaciones" },
  { id: "mat_bim", nombre: "BIM", tipo: "PBR", colorBase: "#06B6D4", metalico: 0.20, rugosidad: 0.30, especularidad: 0.70, opacidad: 0.75, ior: 1.50, notas: "Ejes y metadatos constructivos BIM" },
  { id: "mat_zincado", nombre: "Zincado", tipo: "Metal", colorBase: "#E2E8F0", metalico: 0.95, rugosidad: 0.22, especularidad: 0.95, opacidad: 1.0, ior: 1.50, notas: "Herrajes zincados brillantes" },
  { id: "mat_laton", nombre: "Latón", tipo: "Metal", colorBase: "#F5D061", metalico: 0.95, rugosidad: 0.20, especularidad: 0.95, opacidad: 1.0, ior: 1.50, notas: "Latón / Dorado pulido decorativo" },
];

export interface RecetaColorSwatch {
  tipo: "solido" | "bicolor";
  colorPrimario: string;    // Hex para el swatch visual (ej: "#B87B4C" Cinamomo)
  colorSecundario?: string;  // Hex secundario para división diagonal (ej: "#F5F2EB" Off White)
}

export interface RecetaColorMueble {
  id: string;               // ej: "receta_cinamomo_offwhite"
  nombre: string;           // "Cinamomo / Off White"
  referenciaSku: string;    // "Ref. D737-221"
  swatch: RecetaColorSwatch;
  asignacionesCapaMaterial: Record<string, string>; // Mapeo de TODAS las capas -> materialId
  asignacionesPartes?: Record<string, { capaId: string; materialId: string }>; // Mapeo de piezas/mallas individuales
  parametros?: Record<string, any>; // 🛡️ Estado paramétrico de piezas, lados de balance (Cara A/B) y sustratos (D/B, D/D)
}

export interface FichaProductoDef {
  muebleId: string;                 // "Comoda Ravenna"
  titulo: string;                   // "Cômoda Ravenna 06 Gavetas"
  descripcionCorta: string;         // Frase aspiracional
  descripcionLarga: string;         // Párrafo de estilo IKEA
  recetaColorActivaId: string;      // ID de la receta actualmente aplicada
  recetasColor: RecetaColorMueble[];// Colección de recetas disponibles
  destacadosClave: string[];        // ["Cajones con correderas telescópicas", "Patas en ABS"]
  materialesCuidados: string;       // Texto de limpieza y especificaciones
  montajeNotas: string;             // Información de ensamblaje
  dimensionesManuales?: {
    alto?: number;
    ancho?: number;
    profundidad?: number;
  };
}

/**
 * Generador de Ficha Estándar en Blanco para Componentes Inteligentes.
 * Por arquitectura y regla de negocio: Los componentes inteligentes de biblioteca
 * NUNCA traen múltiples colores comerciales precargados; inician SIEMPRE con una ficha
 * estándar básica y únicamente el acabado por defecto activo.
 * Las variantes comerciales y recetas de color se crean cuando el diseñador modifica y
 * archiva el mueble en una carpeta de catálogo.
 */
export function crearFichaEstandarLimpia(muebleId: string, titulo?: string): FichaProductoDef {
  const nombreLimpio = (titulo || muebleId).replace(/\.(gh|ghx)$/i, "").trim();
  return {
    muebleId: nombreLimpio,
    titulo: nombreLimpio || "Componente Estándar",
    descripcionCorta: "Componente inteligente paramétrico listo para configuración y ensamble.",
    descripcionLarga: "Estructura estándar personalizable. Configure las dimensiones, agregue los acabados y defina las variantes de color para este proyecto al guardarlo en su carpeta de catálogo.",
    recetaColorActivaId: "receta_default",
    recetasColor: [
      {
        id: "receta_default",
        nombre: "Color por defecto",
        referenciaSku: "Ref. Estándar",
        swatch: { tipo: "solido", colorPrimario: "#CBD5E1" },
        asignacionesCapaMaterial: {
          capa_tono: "mat_marfil",
          capa_tono_fondo: "mat_marfil",
          capa_madera: "mat_fresno",
        }
      }
    ],
    destacadosClave: [
      "Estructura paramétrica modular DfMA",
      "Herrajes estándar RTA configurables",
      "Optimizado para manufactura y ensamble rápido"
    ],
    materialesCuidados: "Limpiar con un paño suave ligeramente humedecido con agua y jabón neutro. Evitar solventes, abrasivos o exceso de humedad.",
    montajeNotas: "Manual de ensamble interactivo 3D disponible al definir y guardar el mueble."
  };
}

export const FICHA_DEFAULT_COMODA_RAVENNA: FichaProductoDef = crearFichaEstandarLimpia("Comoda Ravenna", "Cômoda Ravenna");

export const PRESET_CAPAS: CapaDef[] = [
  { id: "capa_acero", nombre: "Acero", activa: false, visible: true, bloqueada: false, color: "#8A9EA7", materialId: "mat_acero" },
  { id: "capa_aluminio", nombre: "Aluminio", activa: true, visible: true, bloqueada: false, color: "#CBD5E1", materialId: "mat_aluminio" },
  { id: "capa_back", nombre: "Back", activa: false, visible: true, bloqueada: false, color: "#D97706", materialId: "mat_fresno" },
  { id: "capa_bim", nombre: "BIM", activa: false, visible: true, bloqueada: false, color: "#06B6D4", materialId: "mat_bim" },
  { id: "capa_cromo", nombre: "Cromo", activa: false, visible: true, bloqueada: false, color: "#93C5FD", materialId: "mat_cromo" },
  { id: "capa_espaldar", nombre: "Espaldar", activa: false, visible: true, bloqueada: false, color: "#64748B", materialId: "mat_blanco" },
  { id: "capa_herrajes", nombre: "Herrajes", activa: false, visible: true, bloqueada: false, color: "#27272A", materialId: "mat_acero" },
  { id: "capa_madera", nombre: "Madera", activa: false, visible: true, bloqueada: false, color: "#854D0E", materialId: "mat_fresno" },
  { id: "capa_mdf", nombre: "MDF", activa: false, visible: true, bloqueada: false, color: "#0D9488", materialId: "mat_mdf" },
  { id: "capa_mdp", nombre: "MDP", activa: false, visible: true, bloqueada: false, color: "#B45309", materialId: "mat_mdp" },
  { id: "capa_nurbs", nombre: "Nurbs", activa: false, visible: true, bloqueada: false, color: "#A855F7", materialId: "mat_nurbs" },
  { id: "capa_perforados", nombre: "Perforados", activa: false, visible: true, bloqueada: false, color: "#EF4444", materialId: "mat_perforados" },
  { id: "capa_pintura_met_b", nombre: "Pintura_Met_B", activa: false, visible: true, bloqueada: false, color: "#F4F4F5", materialId: "mat_pintura_bla" },
  { id: "capa_pintura_met_n", nombre: "Pintura_Met_N", activa: false, visible: true, bloqueada: false, color: "#09090B", materialId: "mat_pintura_neg" },
  { id: "capa_plastico_1", nombre: "Plastico_1", activa: false, visible: true, bloqueada: false, color: "#18181B", materialId: "mat_pnegro" },
  { id: "capa_plastico_2", nombre: "Plastico_2", activa: false, visible: true, bloqueada: false, color: "#FFFFFF", materialId: "mat_pblanco" },
  { id: "capa_tono", nombre: "Tono", activa: false, visible: true, bloqueada: false, color: "#EAB308", materialId: "mat_marfil" },
  { id: "capa_tono_fondo", nombre: "Tono Fondo", activa: false, visible: true, bloqueada: false, color: "#F59E0B", materialId: "mat_blanco" },
  { id: "capa_zinc", nombre: "Zinc", activa: false, visible: true, bloqueada: false, color: "#10B981", materialId: "mat_zinc" },
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
  pestanaActiva: "3d" | "despiece" | "basedatos" | "costos" | "dxf" | "manual";
  setPestanaActiva: (pestana: "3d" | "despiece" | "basedatos" | "costos" | "dxf" | "manual") => void;

  // 🎬 Manual Studio State & Acciones
  pasosManual: PasoManualStudio[];
  pasoActivoManualId: string;
  isTimelinePlaying: boolean;
  timelineCurrentTime: number;
  timelineVelocidad: number;
  idiomaVozManual: IdiomaManual;
  audioMutedManual: boolean;

  setPasosManual: (pasos: PasoManualStudio[]) => void;
  seleccionarPasoManualActivo: (pasoId: string) => void;
  crearPasoManual: (tipo?: "showcase" | "ensamble") => void;
  eliminarPasoManual: (pasoId: string) => void;
  actualizarPasoManual: (pasoId: string, data: Partial<PasoManualStudio>) => void;
  reordenarSecuenciaPaso: (pasoId: string, nuevaSecuencia: ElementoSecuenciaCinematica[]) => void;
  asignarPiezaAPasoManual: (pasoId: string, nombrePieza: string) => void;
  desasignarPiezaDePasoManual: (pasoId: string, nombrePieza: string) => void;
  asignarHerrajeAPasoManual: (pasoId: string, nombreHerraje: string) => void;
  desasignarHerrajeDePasoManual: (pasoId: string, nombreHerraje: string) => void;
  autoGenerarSecuenciaPaso: (pasoId: string) => void;
  autoDetectarGruposCinematicos: (pasoId: string) => void;
  agregarGrupoCinematico: (pasoId: string, grupo: GrupoCinematicoShowcase) => void;
  actualizarGrupoCinematico: (pasoId: string, grupoId: string, data: Partial<GrupoCinematicoShowcase>) => void;
  eliminarGrupoCinematico: (pasoId: string, grupoId: string) => void;
  asignarPiezaAGrupoCinematico: (pasoId: string, grupoId: string, nombrePieza: string) => void;
  desasignarPiezaDeGrupoCinematico: (pasoId: string, grupoId: string, nombrePieza: string) => void;
  conmutarVisibilidadGrupoCinematico: (pasoId: string, grupoId: string) => void;
  conmutarVisibilidadTodosGruposCinematicos: (pasoId?: string, forzarOcultar?: boolean) => void;
  conmutarVisibilidadPiezasPaso: (pasoId: string) => void;
  conmutarOcultarNoAsignadasPaso: (pasoId: string) => void;
  
  // 🧩 Subbloques de Armado en Pasos de Ensamble
  agregarSubBloqueArmado: (pasoId: string, nombre?: string) => void;
  actualizarSubBloqueArmado: (pasoId: string, subbloqueId: string, data: Partial<SubBloqueArmado>) => void;
  eliminarSubBloqueArmado: (pasoId: string, subbloqueId: string) => void;
  asignarPiezaASubBloque: (pasoId: string, subbloqueId: string, nombrePieza: string) => void;
  desasignarPiezaDeSubBloque: (pasoId: string, subbloqueId: string, nombrePieza: string) => void;
  conmutarVisibilidadSubBloqueArmado: (pasoId: string, subbloqueId: string) => void;
  subbloqueSoloId: string | null;
  setSubbloqueSolo: (subbloqueId: string | null) => void;
  actualizarTransformBancoSubBloque: (pasoId: string, subbloqueId: string, transform: Partial<SubBloqueTransformBanco>) => void;
  resetTransformBancoSubBloque: (pasoId: string, subbloqueId: string) => void;
  actualizarTrackSubBloque: (pasoId: string, subbloqueId: string, track: Partial<SubBloqueAnimacionTrack>) => void;
  setCoreografiaSubbloques: (pasoId: string, coreografia: 1 | 2) => void;
  
  // 🎯 Modo Picking 3D / Cuentagotas para Asignación de Piezas
  modoPickingManual: ModoPickingManualState;
  iniciarPickingManual: (pasoId: string, grupoId?: string | null, modo?: "agregar" | "retirar") => void;
  togglePiezaEnPickingManual: (piezaMadre: string) => void;
  retirarComponenteManual3D: (meshTargetKey: string, pasoId?: string) => void;
  limpiarPickingManual: () => void;
  confirmarPickingManual: () => void;
  setIsTimelinePlaying: (playing: boolean) => void;
  setTimelineCurrentTime: (time: number) => void;
  setTimelineVelocidad: (velocidad: number) => void;
  setIdiomaVozManual: (idioma: IdiomaManual) => void;
  setAudioMutedManual: (muted: boolean) => void;

  // 📦 Persistencia de Manuales en Google Drive (.3bm.json)
  manualActivoGuardado: Manual3BMProyecto | null;
  manualesDrive: Manual3BMProyecto[];
  modalBibliotecaManualesAbierto: boolean;
  guardandoManual: boolean;

  cargarManualesDesdeDrive: () => Promise<void>;
  cargarManualProyecto: (manual: Manual3BMProyecto) => void;
  guardarManualProyecto: (nombre?: string, marca?: string, tipologia?: string) => Promise<boolean>;
  eliminarManualProyecto: (manualId: string) => Promise<void>;
  setModalBibliotecaManualesAbierto: (abierto: boolean) => void;
  
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

  // 💡 Iluminación de Estudio Interactiva
  setLuzPropiedad: (luzId: string, prop: keyof StudioLightConfig, valor: any) => void;
  setLuzTarget: (luzId: string, target: [number, number, number]) => void;
  setLuzPosicionCartesiana: (luzId: string, pos: [number, number, number]) => void;
  enfocarLuzACentro: (luzId: string) => void;
  seleccionarLuzEstudio: (luzId: string | null) => void;
  toggleGizmosLuces: (mostrar?: boolean) => void;
  mostrarMarcoEncuadre: boolean;
  setMostrarMarcoEncuadre: (mostrar: boolean) => void;
  toggleMarcoEncuadre: () => void;
  aplicarPresetIluminacion: (presetKey: string) => void;
  guardarIluminacionPredeterminada: () => void;
  restaurarIluminacionPredeterminada: () => void;
  tieneIluminacionPredeterminada: boolean;
  setHdriPersonalizado: (file: File) => void;
  restablecerHdriPorDefecto: () => void;

  // 📦 Bloques Estándar de Armado (.3bb.json)
  bloquesEstandar: BloqueEstandarDef[];
  carpetaBloquesSeleccionada: string;
  setCarpetaBloquesSeleccionada: (carpeta: string) => void;
  cargarBloquesEstandar: () => Promise<void>;
  insertarBloqueEstandarComoPaso: (bloque: BloqueEstandarDef, indiceInsercion?: number) => void;
  bloqueEstandarEnEdicion: BloqueEstandarDef | null;
  manualPadrePrevioEdicionBloque: { manual: Manual3BMProyecto | null; pasos: PasoManualStudio[]; pasoActivoId: string } | null;
  setBloqueEstandarEnEdicion: (bloque: BloqueEstandarDef | null) => void;
  cargarBloqueEstandarParaEdicion: (bloque: BloqueEstandarDef) => void;
  reordenarPasosManual: (origenIndex: number, destinoIndex: number) => void;
  guardarNuevoBloqueEstandar: (bloque: BloqueEstandarDef) => Promise<boolean>;
  eliminarBloqueEstandar: (id: string, categoriaMarca?: string, archivo?: string) => Promise<boolean>;

  // Interacción de piezas
  hoveredPiece: string | null;
  setHoveredPiece: (name: string | null) => void;

  // Blender N-Panel (Sidebar Multifuncional con tecla N)
  mostrarNPanel: boolean;
  setMostrarNPanel: (mostrar: boolean | ((prev: boolean) => boolean)) => void;
  pestanaNPanel: "componentes" | "muebles" | "capas" | "partes" | "materiales" | "calibrar" | "apariencia" | "ficha" | "bloques_estandar";
  setPestanaNPanel: (pestana: "componentes" | "muebles" | "capas" | "partes" | "materiales" | "calibrar" | "apariencia" | "ficha" | "bloques_estandar") => void;
  anchoNPanel: number;
  setAnchoNPanel: (ancho: number) => void;
  anchoPanelDerecho: number;
  setAnchoPanelDerecho: (ancho: number) => void;

  // 🏷️ Ficha de Producto Comercial & Color Recipe Engine (Henn + IKEA)
  fichasProducto: Record<string, FichaProductoDef>;
  recetaEnEdicion: { muebleId: string; recetaId: string } | null;
  getFichaProductoActivo: () => FichaProductoDef;
  actualizarFichaProducto: (muebleId: string, cambios: Partial<FichaProductoDef>) => void;
  aplicarRecetaColor: (muebleId: string, recetaId: string) => void;
  guardarNuevaRecetaColor: (muebleId: string, receta: RecetaColorMueble) => void;
  eliminarRecetaColor: (muebleId: string, recetaId: string) => void;
  iniciarEdicionReceta: (muebleId: string, recetaId: string) => void;
  cancelarEdicionReceta: () => void;
  guardarEstadoActualEnReceta: () => void;

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
  duplicarMuebleGuardado: (id: string) => Promise<string | null>;
  abrirMueble: (mueble: MuebleGuardadoItem) => Promise<void>;
  purgarMallasDuplicadas: () => void;

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
  recomputarInstancia: (id: string, forceReload?: boolean) => Promise<void>;
  recargarDefinicionInstancia: (id: string, force?: boolean) => Promise<boolean>;
  forzarRecargaDesdeGHX: (id?: string) => Promise<boolean>;
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
  motorSeleccionadoRender: "fal_nano_banana_2" | "fal_nano_banana_pro" | "fal_nano_banana" | "fal_bria_product_shot" | "fal_flux_dev" | "fal_flux_schnell" | "google_gemini_imagen3" | "flux_schnell_free" | "pollinations";
  setMotorSeleccionadoRender: (motor: "fal_nano_banana_2" | "fal_nano_banana_pro" | "fal_nano_banana" | "fal_bria_product_shot" | "fal_flux_dev" | "fal_flux_schnell" | "google_gemini_imagen3" | "flux_schnell_free" | "pollinations") => void;
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

export const defaultLucesEstudio: Record<string, StudioLightConfig> = {
  key_sun: {
    id: "key_sun",
    nombre: "Sol Directo Principal (Key)",
    tipo: "directional",
    activa: true,
    intensidad: 0.9,
    color: "#fff9f2",
    temperaturaKelvin: 5400,
    azimut: 45,
    elevacion: 50,
    distancia: 4.5,
    proyectarSombras: true,
    target: [0, 0.45, 0],
    anguloCono: 42,
    radioAlcance: 4.5,
    modoGizmo: "luz",
  },
  fill_light: {
    id: "fill_light",
    nombre: "Luz de Relleno (Fill Light)",
    tipo: "directional",
    activa: true,
    intensidad: 0.35,
    color: "#f2f6ff",
    temperaturaKelvin: 6000,
    azimut: 225,
    elevacion: 40,
    distancia: 4.0,
    proyectarSombras: false,
    target: [0, 0.45, 0],
    anguloCono: 50,
    radioAlcance: 4.0,
    modoGizmo: "luz",
  },
  rim_light: {
    id: "rim_light",
    nombre: "Luz de Realce (Rim Light)",
    tipo: "directional",
    activa: true,
    intensidad: 0.35,
    color: "#ffffff",
    temperaturaKelvin: 5500,
    azimut: 315,
    elevacion: 55,
    distancia: 4.2,
    proyectarSombras: false,
    target: [0, 0.45, 0],
    anguloCono: 45,
    radioAlcance: 4.2,
    modoGizmo: "luz",
  },
  ambient_light: {
    id: "ambient_light",
    nombre: "Luz Ambiental Global",
    tipo: "ambient",
    activa: true,
    intensidad: 0.45,
    color: "#ffffff",
    temperaturaKelvin: 5500,
    azimut: 0,
    elevacion: 90,
    distancia: 0,
    proyectarSombras: false,
    target: [0, 0.45, 0],
    anguloCono: 90,
    radioAlcance: 5.0,
    modoGizmo: "ninguno",
  },
  env_hdri: {
    id: "env_hdri",
    nombre: "Luz de Entorno HDRI (Cielo / IBL)",
    tipo: "ambient",
    activa: true,
    intensidad: 0.55,
    color: "#ffffff",
    temperaturaKelvin: 6500,
    azimut: 45,
    elevacion: 45,
    distancia: 0,
    proyectarSombras: false,
    target: [0, 0.45, 0],
    anguloCono: 90,
    radioAlcance: 10.0,
    modoGizmo: "ninguno",
    hdriUrl: DEFAULT_HDRI_CONFIG.url,
    hdriNombre: DEFAULT_HDRI_CONFIG.nombre,
    hdriThumbnailUrl: DEFAULT_HDRI_CONFIG.thumbnailUrl,
    esHdriPorDefecto: true,
  },
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
  calibreAristas: 100,
  intensidadLuzDirecta: 0.9,
  intensidadLuzAmbiental: 0.45,
  intensidadLuzEntorno: 0.55,
  intensidadLuzRelleno: 0.6,
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
  colorEjeX: "#0891B2",
  colorEjeY: "#B91C1C",

  // Propiedades de Rejilla (Estándar Rhinoceros 8)
  numeroLineasRejilla: 500,
  espaciadoRejillaSecundariaMm: 10,
  lineasPrincipalesCada: 10,
  mostrarIconoPlanoUniversal: true,

  // 📷 Calibración de Cámara y Zoom
  zoomMinimoMetros: 0.02,
  zoomMaximoMetros: 30,
  campoDeVisionFov: 45,

  // 💡 Iluminación de Estudio Interactiva
  mostrarGizmosLuces: false,
  luzSeleccionadaId: null,
  presetIluminacion: "estudio_suave",
  lucesEstudio: defaultLucesEstudio,
};

export const STORAGE_KEY_ILUMINACION = "3bf_iluminacion_estudio_v1";

export function obtenerCalibracionInicial(): CalibracionVisual {
  if (typeof window !== "undefined" && window.localStorage) {
    try {
      const guardado = localStorage.getItem(STORAGE_KEY_ILUMINACION);
      if (guardado) {
        const parsed = JSON.parse(guardado);
        const parsedLuces = parsed.lucesEstudio || {};
        return {
          ...defaultCalibracion,
          ...parsed,
          lucesEstudio: {
            ...defaultLucesEstudio,
            ...parsedLuces,
            env_hdri: parsedLuces["env_hdri"]
              ? { ...defaultLucesEstudio.env_hdri, ...parsedLuces["env_hdri"] }
              : defaultLucesEstudio.env_hdri,
          },
        };
      }
    } catch (e) {
      console.warn("Error al cargar iluminación predeterminada desde localStorage:", e);
    }
  }
  return defaultCalibracion;
}

/**
 * 🛡️ DfMA Shield: Purga matemática definitiva de mallas duplicadas en el resultado 3D.
 * Elimina duplicados geométricos por coincidencia espacial (<0.5mm) y mallas marcadas como es_duplicado_ghx.
 */
export function purgarResultadoGeometria(res: any) {
  if (!res || !res.real_meshes || !Array.isArray(res.real_meshes)) return res;
  const raw = res.real_meshes;
  const unicas: any[] = [];

  for (const m of raw) {
    if (m.es_duplicado_ghx) continue;
    const mName = (m.name || "").replace(/^RH_OUT:/i, "").trim().toLowerCase();
    const mPos = m.position || [0, 0, 0];
    const mSize = m.size || [0, 0, 0];

    const isDup = unicas.some((u) => {
      const uName = (u.name || "").replace(/^RH_OUT:/i, "").trim().toLowerCase();
      if (mName !== uName) return false;
      const uPos = u.position || [0, 0, 0];
      const uSize = u.size || [0, 0, 0];

      const dPos = Math.hypot(mPos[0] - uPos[0], mPos[1] - uPos[1], mPos[2] - uPos[2]);
      const dSize = Math.hypot(mSize[0] - uSize[0], mSize[1] - uSize[1], mSize[2] - uSize[2]);
      return dPos < 0.0005 && dSize < 0.0005;
    });

    if (!isDup) {
      unicas.push(m);
    }
  }

  return {
    ...res,
    real_meshes: unicas,
    mallas_duplicadas_detectadas: {},
    mallas_duplicadas_info: [],
  };
}

export const STORAGE_KEY_MANUAL_ACTIVO = "3bf_manual_activo_cache";
export const STORAGE_KEY_PASOS_MANUAL = "3bf_pasos_manual_cache";
export const STORAGE_KEY_LAST_MANUAL_ID = "3bf_last_manual_id";

/**
 * 🔢 Encuentra el número entero positivo más bajo disponible (>= 1) para un paso de ensamble.
 * Garantiza que nunca se generen IDs duplicados y llena los huecos dejados por pasos eliminados.
 * Ej: Si existen P00 y P02, devolverá P01. Si existen P00, P01, P02, devolverá P03.
 */
export function encontrarSiguienteIdPasoDisponible(pasos: PasoManualStudio[]): { id: string; numero: number } {
  const idsOcupados = new Set(pasos.map((p) => p.id));
  const numerosOcupados = new Set<number>();

  for (const paso of pasos) {
    const match = paso.id.match(/^P(\d+)$/i);
    if (match) {
      numerosOcupados.add(parseInt(match[1], 10));
    } else if (typeof paso.numero === "number" && paso.numero >= 0) {
      numerosOcupados.add(paso.numero);
    }
  }

  let menorDisponible = 1;
  while (numerosOcupados.has(menorDisponible) || idsOcupados.has(`P${String(menorDisponible).padStart(2, "0")}`)) {
    menorDisponible++;
  }

  return {
    id: `P${String(menorDisponible).padStart(2, "0")}`,
    numero: menorDisponible,
  };
}

/**
 * 🛡️ Sanea la lista de pasos para garantizar unicidad absoluta de IDs, presencia de P00 y orden consistente.
 * Cura duplicados existentes en caché local (ej: dos P02) reasignándolos al menor ID faltante.
 */
export function sanitizarPasosManuales(pasos: PasoManualStudio[]): PasoManualStudio[] {
  if (!pasos || pasos.length === 0) return generarPasosManualesPorDefecto();

  // 🛡️ REGLA SUPREMA: P00 (Showcase Funcional) es estrictamente OBLIGATORIO e INVIOLABLE en el índice 0
  const defaultP00 = generarPasosManualesPorDefecto()[0];

  // 1. Localizar si existe algún paso P00 o de tipo showcase
  const p00Index = pasos.findIndex((p) => p.id === "P00" || p.tipo === "showcase");
  let paso00: PasoManualStudio;

  if (p00Index >= 0) {
    paso00 = {
      ...pasos[p00Index],
      id: "P00",
      numero: 0,
      tipo: "showcase",
      titulo: pasos[p00Index].titulo || "Paso 00: Showcase Funcional",
    };
  } else {
    // Si no venía P00, inyectar el P00 oficial canónico
    paso00 = { ...defaultP00 };
  }

  const resultado: PasoManualStudio[] = [paso00];
  const idsVistos = new Set<string>(["P00"]);

  // 2. Procesar el resto de pasos (excluyendo el que se tomó como P00)
  const otrosPasos = pasos.filter((_, idx) => idx !== p00Index);

  otrosPasos.forEach((pOriginal, idx) => {
    const p = { ...pOriginal };
    const numConsecutivo = idx + 1;
    const consecutivoId = `P${String(numConsecutivo).padStart(2, "0")}`;

    p.numero = numConsecutivo;
    p.id = consecutivoId;

    if (p.tipo === "ensamble" && (p.titulo.startsWith("Paso ") || /^P\d+:?/i.test(p.titulo))) {
      p.titulo = `Paso ${String(p.numero).padStart(2, "0")}: Ensamble`;
    }

    idsVistos.add(p.id);
    resultado.push(p);
  });

  return resultado;
}

export function getCachedManualData(): { manual: Manual3BMProyecto | null; pasos: PasoManualStudio[] } {
  if (typeof window !== "undefined" && window.localStorage) {
    try {
      localStorage.removeItem(STORAGE_KEY_PASOS_MANUAL);
      localStorage.removeItem(STORAGE_KEY_MANUAL_ACTIVO);
      localStorage.removeItem("3bf_ultimo_mueble_id");
    } catch (err) {
      console.warn("[3dBimFab] Error limpiando caché local:", err);
    }
  }
  // 🛡️ REGLA SUPREMA: En recarga (F5) el sistema siempre arranca 100% limpio (como recién abrir un programa CAD)
  return { manual: null, pasos: generarPasosManualesPorDefecto() };
}

export function guardarPasosEnCacheLocal(nuevosPasos: PasoManualStudio[], manualActual?: Manual3BMProyecto | null) {
  if (typeof window === "undefined" || !window.localStorage) return;
  try {
    localStorage.setItem(STORAGE_KEY_PASOS_MANUAL, JSON.stringify(nuevosPasos));

    let manualBase = manualActual;
    if (!manualBase) {
      const prev = localStorage.getItem(STORAGE_KEY_MANUAL_ACTIVO);
      if (prev) {
        try {
          manualBase = JSON.parse(prev);
        } catch {}
      }
    }

    const manualActualizado: Manual3BMProyecto = {
      id: manualBase?.id || (nuevosPasos[0]?.tipo === "bloque_estandar" ? `bloque_${nuevosPasos[0].id}` : "manual_estudio"),
      muebleOrigenId: manualBase?.muebleOrigenId || "",
      nombre: manualBase?.nombre || (nuevosPasos[0]?.tipo === "bloque_estandar" ? `Bloque: ${nuevosPasos[0].titulo}` : "Manual de Estudio"),
      marca: manualBase?.marca || "Universales",
      tipologia: manualBase?.tipologia || "Manuales 3D",
      fechaModificacion: new Date().toISOString(),
      parametrosMueble: manualBase?.parametrosMueble || {},
      pasos: nuevosPasos,
    };

    localStorage.setItem(STORAGE_KEY_MANUAL_ACTIVO, JSON.stringify(manualActualizado));
    localStorage.setItem(STORAGE_KEY_LAST_MANUAL_ID, manualActualizado.id);
  } catch (err) {
    console.warn("[3dBimFab] Error guardando pasos en caché local:", err);
  }
}

export const initialCachedManual = getCachedManualData();

export const use3BFStore = create<State3BF>((set, get) => ({
  ...createEngineSlice(set, get),
  ...createManualSlice(set, get),
  ...createCatalogSlice(set, get),
  ...createSceneInstanceSlice(set, get),
  ...createHistorySlice(set, get),
  ...createTransformSlice(set, get),
  ...createCostosSlice(set, get),
  ...createRenderIASlice(set, get),
}));
