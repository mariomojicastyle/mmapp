// 🏷️ 3dBimFab Core Store — Defaults, Presets & Utility Functions
// Standalone leaf module - 0 imports from store.ts or slices

import { extraerPiezaMadre, perteneceAPiezaMadre, agruparMallasEnPiezasMadre, esHerrajeNombre, anotarInstanciasFisicas } from "./piezaMadreUtils";
import type {
  ObjetoInstancia3BF,
  SnapshotEscenario,
  ColoresApariencia,
  ParametrosMueble,
  CarpetaMuebleNode,
  MuebleGuardadoItem,
  PiezaDespiece,
  HerrajeItem,
  ComputoResultado,
  PerforacionCruzadaItem,
  CalibracionVisual,
  StudioLightConfig,
  HerrajeRecord,
  NegociacionNovopan,
  IdiomaManual,
  CoreografiaShowcase,
  EjeAperturaShowcase,
  GrupoCinematicoShowcase,
  ModoPickingManualState,
  ElementoSecuenciaCinematica,
  ParteGlbBloque,
  BloqueEstandarDef,
  BloqueEstandarRef,
  SubBloqueTransformBanco,
  SubBloqueAnimacionTrack,
  SubBloqueArmado,
  PasoManualStudio,
  Manual3BMProyecto,
  TableroRecord,
  CantoRecord,
  PromptTemplateItem,
  RenderIAResultado,
  MaterialPBRDef,
  CapaDef,
  AsignacionParteDef,
  RecetaColorSwatch,
  RecetaColorMueble,
  FichaProductoDef,
  State3BF,
  FichaCostosConfig,
  CostosConversionConfig,
} from "./storeTypes";


// 🏷️ Versión canónica del sistema y store
export const APP_VERSION = "v1.0.1";


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


export const NEGOCIACION_NOVOPAN_DEFECTO: NegociacionNovopan = {
  apoyoVolumenPct: 20.00,
  apoyoTasaPct: 15.10,
  prontoPagoPct: 3.50,
  trmNovopan: 3000,
  gastosNacionalizacionPct: 8.70,
  financiacionPct: 1.10,
  fleteInternacionalM3Usd: 18.57,
};


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

    // 🧹 Limpieza automática de guiones genéricos por defecto para no obligar al usuario a borrarlos
    if (p.guionEs && /Paso \d+: Ensambla los componentes correspondientes a esta etapa\./i.test(p.guionEs)) {
      p.guionEs = "";
    }
    if (p.guionPt && /Passo \d+: Monte os componentes correspondentes a esta etapa\./i.test(p.guionPt)) {
      p.guionPt = "";
    }
    if (p.guionEn && /Step \d+: Assemble the corresponding components for this stage\./i.test(p.guionEn)) {
      p.guionEn = "";
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
