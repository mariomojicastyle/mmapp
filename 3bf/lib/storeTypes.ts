// 🏷️ 3dBimFab Core Store — Pure Type Definitions
// No runtime JS code - 100% safe from circular dependencies


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


export interface CostosConversionConfig {
  pctManoObraPres: number;       // 12.42% por defecto
  pctCIF: number;                // 9.80% por defecto
  pctAdicionales: number;        // 0.40% por defecto
  costoTercerizacionesCop: number; // 0 COP
  costoEmpaqueCop: number;       // 0 COP
}
