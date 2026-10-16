/**
 * ============================================================================
 * ARCHIVO: dfmaRulesDictionary.ts
 * UBICACIÓN: c:/Desarrollo/mmapp/3bf/lib/engine/dfmaRulesDictionary.ts
 * AUTOR: Mario Mojica (3dBimFab Digital Manufacturing Engine)
 * DESCRIPCIÓN:
 * Fuente de Verdad Única (Single Source of Truth) para la clasificación DfMA,
 * nomenclatura de piezas, herrajes y mecanizados del ecosistema 3dBimFab.
 *
 * Conecta el modelo CAD (Grasshopper PT-BR), el motor WebGL (Three.js),
 * el optimizador de corte (Nesting) y la vista comercial en el Data Hub.
 * ============================================================================
 */

export type CategoriaDfMA = "tablero" | "herraje" | "tapa" | "mecanizado";

export interface ReglaDfMARecord {
  id: string;
  categoria: CategoriaDfMA;
  nombreCanonica: string;
  terminosReconocidos: string[];
  descripcion: string;
  comportamientoThreeJs: string;
  comportamientoBOM: string;
  reglaGeometrica: string;
  ejemplosReales: string;
}

export const REGLAS_DFMA_CANONICAS: ReglaDfMARecord[] = [
  // ==========================================
  // 🪵 TABLEROS ESTRUCTURALES (MADERA / PBR)
  // ==========================================
  {
    id: "dfma-tab-peca",
    categoria: "tablero",
    nombreCanonica: "Peça / Tablero Estándar (Grasshopper)",
    terminosReconocidos: ["Peça \\d+", "Peca \\d+", "PK \\d+", "Peça", "Peca"],
    descripcion: "Identificador nativo universal de tableros provenientes del árbol paramétrico de Grasshopper.",
    comportamientoThreeJs: "Malla de tablero (BoardMesh). Recibe material PBR de melamina auténtica (color, relieve y brillo de capa asignada).",
    comportamientoBOM: "Genera registro individual en la tabla de Despiece con Largo, Ancho, Espesor y área en m². Entra al algoritmo de Nesting.",
    reglaGeometrica: "Sólido Brep o malla plana con Cara A (+Z/-Y/+X exterior), Cara B opuesta y hasta 4 cantos perimetrales.",
    ejemplosReales: "Peça 1, Peça 2, Peça 5, Peça 13, PK 04"
  },
  {
    id: "dfma-tab-cubierta",
    categoria: "tablero",
    nombreCanonica: "Cubierta / Tapa Superior / Techo",
    terminosReconocidos: ["cubierta", "techo", "tapa_superior", "tapa superior", "tampa superior"],
    descripcion: "Superficie de remate superior horizontal del mueble o mesa de trabajo.",
    comportamientoThreeJs: "Malla de estructura principal. Soporta mapeado de veta longitudinal o atravesada. Textura PBR completa.",
    comportamientoBOM: "Tablero estructural principal. Máxima prioridad dimensional en el despiece de corte.",
    reglaGeometrica: "Espesor mínimo en el eje Z (min_dim == sz). Cara A en +Z exterior, Cara B en -Z interior.",
    ejemplosReales: "Cubierta, RH_OUT:Cubierta, Tapa Superior"
  },
  {
    id: "dfma-tab-lateral",
    categoria: "tablero",
    nombreCanonica: "Lateral / Costado / Paral",
    terminosReconocidos: ["lateral", "costado", "paral", "lateral izquierdo", "lateral derecho", "paral central"],
    descripcion: "Paneles verticales portantes que delimitan y estructuran el cuerpo del mueble.",
    comportamientoThreeJs: "Malla vertical portante. Mapeado de veta vertical u horizontal. Aristas nítidas Three.js.",
    comportamientoBOM: "Calcula perforaciones para tarugos y pernos en cantos e interiores.",
    reglaGeometrica: "Espesor mínimo en el eje X (min_dim == sx). Cara A en +X, Cara B en -X.",
    ejemplosReales: "Peça 1 - Lateral Izq, Peça 2 - Lateral Der, Paral Central"
  },
  {
    id: "dfma-tab-frente",
    categoria: "tablero",
    nombreCanonica: "Frente de Cajón / Puerta",
    terminosReconocidos: ["frente", "puerta", "porta", "frente de cajon", "frente cajon", "frente cajón"],
    descripcion: "Elementos frontales visibles de apertura (gavetas o puertas batientes/corredizas).",
    comportamientoThreeJs: "Soporta chaflanes/uñeros a 45° integrados al material de canto. Textura de veta de alta fidelidad.",
    comportamientoBOM: "Tablero exterior de fachada. Espesor estándar 15mm (DURATEX). Agrupa cantidades según número de cajones.",
    reglaGeometrica: "Espesor mínimo en el eje Y (min_dim == sy). Chaflanes a 45° en la zona de aristas superiores o inferiores.",
    ejemplosReales: "Frente de Cajon, Peça 5 - Frente, Puerta Izquierda"
  },
  {
    id: "dfma-tab-cajon",
    categoria: "tablero",
    nombreCanonica: "Cajón (Laterales / Trasera / Posterior / Frente Interno)",
    terminosReconocidos: ["cajon", "cajón", "gaveta", "lateral cajon", "trasera cajon", "posterior de cajon", "posterior", "contrafrente"],
    descripcion: "Estructura interna de gavetas o cajones ensamblados.",
    comportamientoThreeJs: "Mallas de madera asociadas a la sub-cinemática de apertura y correderas.",
    comportamientoBOM: "Multiplica su cantidad por el número total de cajones en la cómoda o mueble.",
    reglaGeometrica: "Tableros ortogonales en espesores de 12mm o 15mm con ranura para fondo de 3mm.",
    ejemplosReales: "Peça 7 - Lateral Cajon, Peça 8 - Trasera Cajon, Posterior de Cajon"
  },
  {
    id: "dfma-tab-entrepanio",
    categoria: "tablero",
    nombreCanonica: "Entrepaño / Estante / Repisa",
    terminosReconocidos: ["entrepaño", "entrepanio", "estante", "repisa", "prateleira"],
    descripcion: "Divisiones horizontales interiores fijas o graduables sobre soportes o minifix.",
    comportamientoThreeJs: "Malla horizontal interior. Soporta mapeado paramétrico de veta.",
    comportamientoBOM: "Calcula cantos frontales vistos y cantos traseros crudos según configuración.",
    reglaGeometrica: "Espesor mínimo en el eje Z (min_dim == sz).",
    ejemplosReales: "Entrepaño Central, Prateleira Móvel"
  },
  {
    id: "dfma-tab-tapaluz",
    categoria: "tablero",
    nombreCanonica: "Tapaluz / Travesaño / Larguero",
    terminosReconocidos: ["tapaluz", "travesa", "travesaño", "larguero", "riostra", "amarre"],
    descripcion: "Travesaños estructurales horizontales de arriostramiento entre laterales o bajo cubiertas.",
    comportamientoThreeJs: "Malla de madera PBR. Desacoplada 100% de tapitas plásticas de tornillo. Descompone islas disjuntas.",
    comportamientoBOM: "Detecta piezas múltiples unidas por Mesh Join y las reporta como unidades individuales (ej: Cantidad 3).",
    reglaGeometrica: "Perfiles rectangulares de espesor delgado (12mm/15mm) y ancho reducido (60mm).",
    ejemplosReales: "Tapaluz, RH_OUT:Tapaluz, Travesaño Superior"
  },
  {
    id: "dfma-tab-zocalo",
    categoria: "tablero",
    nombreCanonica: "Zócalo / Rodapié / Base",
    terminosReconocidos: ["zocalo", "zócalo", "rodapie", "rodapié", "base inferior"],
    descripcion: "Faldón inferior que oculta las patas o apoya el mueble en el suelo evitando acumulación de polvo.",
    comportamientoThreeJs: "Malla de madera con veta longitudinal a ras del suelo.",
    comportamientoBOM: "Pieza estrecha de estructura baja con canto inferior protegido contra humedad.",
    reglaGeometrica: "Espesor mínimo en Y o X, apoyado en la cota z0 exterior.",
    ejemplosReales: "Zocalo Frontal, Peça 12 - Zócalo"
  },
  {
    id: "dfma-tab-fondo",
    categoria: "tablero",
    nombreCanonica: "Fondo / Trasera / Fundo",
    terminosReconocidos: ["fondo", "fundo", "trasera", "respaldo"],
    descripcion: "Panel delgado (3mm o 6mm) clavado o ranurado que arriostra el cuadro posterior del mueble.",
    comportamientoThreeJs: "Lámina delgada con textura de balance o madera clara.",
    comportamientoBOM: "Se clasifica en calibre delgado (3mm/6mm HDF/MDF) independiente de los tableros de 15mm.",
    reglaGeometrica: "Espesor de 3.0mm a 6.0mm alojado en el plano trasero (+Y).",
    ejemplosReales: "Fondo Ravenna, Fundo 3mm"
  },
  {
    id: "dfma-tab-division",
    categoria: "tablero",
    nombreCanonica: "División / Partición Vertical",
    terminosReconocidos: ["division", "división", "divisao", "divisória", "particion"],
    descripcion: "Tablero vertical intermedio que separa compartimientos de cajones y puertas.",
    comportamientoThreeJs: "Malla vertical interior con mecanizados en ambas caras (D/D).",
    comportamientoBOM: "Tablero estructural con doble barreno para conectores minifix o tarugos.",
    reglaGeometrica: "Espesor mínimo en el eje X (min_dim == sx) en posición interior.",
    ejemplosReales: "División Central, Peça 3"
  },

  // ==========================================
  // 🔩 HERRAJES MECÁNICOS (METAL / PLÁSTICO)
  // ==========================================
  {
    id: "dfma-her-tornillo",
    categoria: "herraje",
    nombreCanonica: "Tornillo de Ensamble / Autorroscante",
    terminosReconocidos: ["parafuso", "tornillo", "eurotornillo", "spax"],
    descripcion: "Tornillos autorroscantes de acero cincado para fijación estructural (4x50mm, 3.5x16mm).",
    comportamientoThreeJs: "Malla metálica con shader reflectivo sin textura de madera. Animación cinemática axial.",
    comportamientoBOM: "Conteo unitario en la lista de herrajes y empaque de ferretería.",
    reglaGeometrica: "Mallas cilíndricas o cabeza cónica/plana orientadas en el eje de inserción.",
    ejemplosReales: "Parafuso A (1), Tornillo 4x50mm, Tornillo Ensamble"
  },
  {
    id: "dfma-her-perno",
    categoria: "herraje",
    nombreCanonica: "Perno Minifix / Conector de Vástago",
    terminosReconocidos: ["perno", "perno minifix", "vastago", "vástago"],
    descripcion: "Vástago de acero o zamak de 34mm con rosca para atornillar en laterales o entrepaños.",
    comportamientoThreeJs: "Herraje metálico cilíndrico plateado. Se emparenta con el barreno de la madera.",
    comportamientoBOM: "Suma 1 perno por cada caja minifix en el sistema.",
    reglaGeometrica: "Diámetro nominal 5mm a 8mm, longitud 34mm.",
    ejemplosReales: "Perno Minifix 34mm, Perno (1)"
  },
  {
    id: "dfma-her-caja",
    categoria: "herraje",
    nombreCanonica: "Caja Minifix / Rastex / Tambor Leva",
    terminosReconocidos: ["caja", "minifix", "girofix", "rastex", "tambor"],
    descripcion: "Leva circular de zamak niquelado de 15mm de diámetro que aprisiona la cabeza del perno al girar.",
    comportamientoThreeJs: "Cuerpo circular metálico insertado en la cara interior (Cara B).",
    comportamientoBOM: "Conteo unitario fundamental en el kit de herrajes RTA.",
    reglaGeometrica: "Cilindro de 15mm de diámetro x 12mm de profundidad.",
    ejemplosReales: "Caja Minifix 15mm, Girofix, Tambor (4)"
  },
  {
    id: "dfma-her-tarugo",
    categoria: "herraje",
    nombreCanonica: "Tarugo / Clavija de Madera Estriada",
    terminosReconocidos: ["cavilha", "tarugo", "clavilha", "espiga"],
    descripcion: "Clavijas de madera de haya o eucalipto estriadas (8x30mm) para alineación y resistencia a cizallamiento.",
    comportamientoThreeJs: "Cilindro de madera estriada sin textura envolvente compleja. Animación colineal pura al canto.",
    comportamientoBOM: "Conteo unitario de tarugos según cantidad de ensambles.",
    reglaGeometrica: "Diámetro de 8.0mm, longitud de 30.0mm. Aproximación en plano longitudinal Y1->Y0 o Y0->Y1.",
    ejemplosReales: "Cavilha (1), Tarugo 8x30mm"
  },
  {
    id: "dfma-her-corredera",
    categoria: "herraje",
    nombreCanonica: "Corredera Telescópica / Riel de Cajón",
    terminosReconocidos: ["corrediça", "corredica", "corredera", "trilho", "riel"],
    descripcion: "Juego de guías metálicas de 3 cuerpos (fijo, intermedio, móvil y seguro/gatillo) de extracción total.",
    comportamientoThreeJs: "Cinemática de extensión telescópica sincronizada con el desplazamiento del cajón.",
    comportamientoBOM: "Contabilizado en pares de correderas según el largo del cajón (ej. 350mm, 400mm, 450mm).",
    reglaGeometrica: "Corrediça - Fixa, Corrediça - Intermediária, Corrediça - Móvel, Corrediça - Trava.",
    ejemplosReales: "Corrediça - Fixa (1), Corredera Telescópica 350mm"
  },
  {
    id: "dfma-her-cantoneira",
    categoria: "herraje",
    nombreCanonica: "Cantonera / Escuadra de Unión",
    terminosReconocidos: ["cantoneira", "escuadra", "angulo", "esquadro"],
    descripcion: "Pieza angular de acero o zamak de 2 huecos para rigidizar uniones entre zócalo y piso.",
    comportamientoThreeJs: "Malla metálica en L sin veta de madera.",
    comportamientoBOM: "Conteo unitario en herrajes menores.",
    reglaGeometrica: "Perfil angular con orificios para tornillos de 3.5x16mm.",
    ejemplosReales: "Cantoneira (1), Escuadra 2 Huecos"
  },
  {
    id: "dfma-her-bisagra",
    categoria: "herraje",
    nombreCanonica: "Bisagra Bidimensional / Cazoleta",
    terminosReconocidos: ["dobradiça", "dobradica", "bisagra", "cazoleta"],
    descripcion: "Bisagra oculta de 35mm con base de 4 huecos y cierre suave para puertas.",
    comportamientoThreeJs: "Malla articulada con rotación angular ligada al ángulo de apertura de la puerta.",
    comportamientoBOM: "Conteo en unidades (2 a 4 bisagras por puerta según altura).",
    reglaGeometrica: "Cazoleta circular de 35mm embutida en la puerta.",
    ejemplosReales: "Dobradiça 35mm, Bisagra Codo 0"
  },
  {
    id: "dfma-her-pata",
    categoria: "herraje",
    nombreCanonica: "Pata Estructural / Deslizador / Nivelador",
    terminosReconocidos: ["pes", "pés", "pata", "pie", "sapata", "deslizador", "nivelador"],
    descripcion: "Apoyos de polímero o madera cónica que elevan el mueble del piso.",
    comportamientoThreeJs: "Modelos 3D de apoyo en la base del mueble.",
    comportamientoBOM: "Conteo de patas o deslizadores en kit de base.",
    reglaGeometrica: "Ubicadas en las esquinas inferiores del mueble en cota Z mínima.",
    ejemplosReales: "Pé (1), Pata Diagonal Cedro, Sapata Plástica"
  },
  {
    id: "dfma-her-tirador",
    categoria: "herraje",
    nombreCanonica: "Tirador / Manija / Puxador",
    terminosReconocidos: ["puxador", "manija", "tirador", "jaladera", "perfil gola"],
    descripcion: "Accesorio de agarre metálico o perfil de aluminio para apertura de cajones o puertas.",
    comportamientoThreeJs: "Malla decorativa metálica o negro mate frontal.",
    comportamientoBOM: "1 unidad por cajón o puerta.",
    reglaGeometrica: "Fijación por tornillos pasantes traseros de 4x22mm.",
    ejemplosReales: "Puxador (1), Manija Bar 128mm"
  },
  {
    id: "dfma-her-clavo",
    categoria: "herraje",
    nombreCanonica: "Clavo / Puntilla / Grapa",
    terminosReconocidos: ["prego", "puntilla", "clavo", "tachuela", "grampo"],
    descripcion: "Puntillas de acero de 10x10mm o 12x12mm para fijar el fondo de 3mm al marco trasero.",
    comportamientoThreeJs: "Representación cilíndrica delgada metálica en el perímetro del fondo.",
    comportamientoBOM: "Conteo de puntillas (aprox. 30 a 50 unidades por mueble).",
    reglaGeometrica: "Distribuidas a intervalos regulares de 100mm a 150mm en el marco posterior.",
    ejemplosReales: "Prego (1), Puntilla Fondo"
  },

  // ==========================================
  // 🔘 TAPAS Y EMBELLECEDORES RTA
  // ==========================================
  {
    id: "dfma-tap-adesivo",
    categoria: "tapa",
    nombreCanonica: "Tapa Adhesiva / Tapón de Tornillo",
    terminosReconocidos: ["tampa", "tapa tornillo", "tapa adhesiva", "tapon", "tapón", "^tapa\\s*\\d*$"],
    descripcion: "Círculos adhesivos de PVC tono melamina para ocultar las cabezas de tornillos y cajas minifix.",
    comportamientoThreeJs: "Plástico mate texturizado a tono. 🛡️ Blindado estrictamente para no confundir piezas de madera como 'tapaluz' o 'cubierta'.",
    comportamientoBOM: "Insumo consumible por lámina de stickers o bolsa de tapones.",
    reglaGeometrica: "Discos planos delgados de 13mm o 18mm de diámetro sobre las caras interiores.",
    ejemplosReales: "Tampa (1), Tapa Tornillo Blanco, Tapa Adhesiva"
  },

  // ==========================================
  // ⚙️ MECANIZADOS, CANALES & BARRENOS
  // ==========================================
  {
    id: "dfma-mec-barreno",
    categoria: "mecanizado",
    nombreCanonica: "Barrenos / Perforaciones de Ensamble",
    terminosReconocidos: ["perforad", "perforacion", "perforaciones", "drill", "furo", "agujero"],
    descripcion: "Taladrados cilíndricos y fondos ciegos para alojar tarugos (d8), pernos (d5) o minifix (d15).",
    comportamientoThreeJs: "Sustrato aglomerado MDP crudo en el canal 'RH_OUT:MDP'. 🛡️ Jamás se viste con textura de madera.",
    comportamientoBOM: "Genera coordenadas de taladrado (X, Y, Z, diámetro y profundidad) para CNC.",
    reglaGeometrica: "Superficies curvas o cilíndricas (not f.IsPlanar()) o fondos planos a profundidad > tol.",
    ejemplosReales: "RH_OUT:MDP Tapaluz, Furo d8x30, Perforaciones Lateral"
  },
  {
    id: "dfma-mec-cajeado",
    categoria: "mecanizado",
    nombreCanonica: "Cajeados de Bisagra & Minifix",
    terminosReconocidos: ["cajeado", "caja_d15", "bisagra_d35", "fresado"],
    descripcion: "Vaciados ciegos circulares de gran diámetro ejecutados por fresa o broca Forstner.",
    comportamientoThreeJs: "Sustrato MDP crudo interior con paredes y fondo desprovistos de melamina.",
    comportamientoBOM: "Operación de fresado en cara interna.",
    reglaGeometrica: "Diámetros estandarizados de 15mm (minifix) o 35mm (bisagra cazoleta).",
    ejemplosReales: "Cajeado d15, Alojamiento Bisagra"
  },
  {
    id: "dfma-mec-ranura",
    categoria: "mecanizado",
    nombreCanonica: "Ranura de Fondo / Canal de Trasera",
    terminosReconocidos: ["ranura", "canal", "rasgo", "rebaixo"],
    descripcion: "Fresado longitudinal de 4mm de ancho por 6mm de profundidad para encastrar el fondo de 3mm.",
    comportamientoThreeJs: "Sustrato MDP expuesto en el interior del canal.",
    comportamientoBOM: "Metros lineales de ranurado para el costeo de producción.",
    reglaGeometrica: "Canal prismático ubicado a 15mm a 20mm del borde posterior.",
    ejemplosReales: "Ranura Trasera 4x6mm, Canal Fundo"
  },
  {
    id: "dfma-mec-canto-mdp",
    categoria: "mecanizado",
    nombreCanonica: "Canto Crudo Sin Tapacanto (MDP Expuesto)",
    terminosReconocidos: ["sin canto", "canto mdp", "canto crudo", "mdp"],
    descripcion: "Borde de tablero donde no se aplica cinta de PVC/melamina, dejando visible el aglomerado.",
    comportamientoThreeJs: "Textura fotorrealista de aglomerado de partículas de madera (MDP).",
    comportamientoBOM: "Ahorra metros lineales de tapacanto en aristas no visibles (traseras o inferiores).",
    reglaGeometrica: "Cara de canto exterior que recibe el sustrato MDP crudo cuando c1/c2/c3/c4 == 'MDP'.",
    ejemplosReales: "Canto Trasero MDP, Borde Inferior Crudo"
  }
];

// ==========================================
// 🛡️ FUNCIONES DE CLASIFICACIÓN CANÓNICAS
// ==========================================

export function esNombreTablero(nameStr: string): boolean {
  const nl = (nameStr || "").toLowerCase().trim();
  // Proteger contra hardware explícito
  if (esNombreHerraje(nl) || esNombreTapa(nl) || nl.includes("maquinado") || nl.includes("perforad")) {
    return false;
  }
  // Expresiones de tablero
  if (/pe[çc]a\s*\d+|pk\s*\d+/i.test(nl)) return true;
  for (const regla of REGLAS_DFMA_CANONICAS) {
    if (regla.categoria === "tablero") {
      for (const termino of regla.terminosReconocidos) {
        if (termino.includes("\\d+")) {
          if (new RegExp(termino, "i").test(nl)) return true;
        } else if (nl.includes(termino.toLowerCase())) {
          return true;
        }
      }
    }
  }
  return false;
}

export function esNombreHerraje(nameStr: string): boolean {
  const nl = (nameStr || "").toLowerCase().trim();
  // Excluir tableros compuestos que contienen palabras de herrajes
  if (nl.includes("tapaluz") || nl.includes("cubierta") || nl.includes("cajon") || nl.includes("cajón")) {
    return false;
  }
  for (const regla of REGLAS_DFMA_CANONICAS) {
    if (regla.categoria === "herraje") {
      for (const termino of regla.terminosReconocidos) {
        if (nl.includes(termino.toLowerCase())) return true;
      }
    }
  }
  return false;
}

export function esNombreTapa(nameStr: string): boolean {
  const nl = (nameStr || "").toLowerCase().trim();
  // 🛡️ Regla de oro: Jamás confundir tableros compuestos como tapaluz o cubierta
  if (nl.includes("tapaluz") || nl.includes("cubierta") || nl.includes("cajon") || nl.includes("cajón")) {
    return false;
  }
  if (nl.includes("tampa") || nl.includes("tapa tornillo") || nl.includes("tapa adhesiva") || nl.includes("tapon") || nl.includes("tapón")) {
    return true;
  }
  return /^tapa\s*\d*$/i.test(nl);
}

export function esNombreMecanizado(nameStr: string): boolean {
  const nl = (nameStr || "").toLowerCase().trim();
  return nl.includes("maquinado") || nl.includes("perforad") || nl.includes("drill") || nl.includes("furo");
}
