/**
 * Motor de Puntuación Inteligente y Detección de Preguntas en Tiempo Real
 * Diseñado para transcribir y puntuar preguntas de forma natural en Español (¿ ... ?),
 * Português (Brasil) (... ?) e Inglés (... ?).
 */

// Partículas interrogativas en español que requieren tilde cuando abren pregunta
const INTERROGATIVAS_ES_MAP: Record<string, string> = {
  "que": "qué",
  "como": "cómo",
  "cuando": "cuándo",
  "donde": "dónde",
  "quien": "quién",
  "quienes": "quiénes",
  "cual": "cuál",
  "cuales": "cuáles",
  "cuanto": "cuánto",
  "cuanta": "cuánta",
  "cuantos": "cuántos",
  "cuantas": "cuántas",
  "por que": "por qué",
  "para que": "para qué",
  "a que": "a qué",
  "de que": "de qué",
  "en donde": "en dónde",
  "a donde": "a dónde",
  "con quien": "con quién",
  "con quienes": "con quiénes",
};

// Conectores orales conversacionales que anteceden una pregunta
const CONECTORES_ORALES_ES = [
  "bueno", "entonces", "mira", "mire", "oye", "oiga", "por cierto", "a ver", "dime", "cuéntame"
];

// Expresiones de inicio de pregunta en Español (partículas + verbos de indagación y cortesía)
const DISPARADORES_PREGUNTA_ES = [
  // Interrogativos directos (con o sin tilde)
  "qué", "que", "cómo", "como", "cuándo", "cuando", "dónde", "donde",
  "quién", "quien", "quiénes", "quienes", "cuál", "cual", "cuáles", "cuales",
  "cuánto", "cuanto", "cuánta", "cuanta", "cuántos", "cuantos", "cuántas", "cuantas",
  "por qué", "por que", "para qué", "para que", "a qué", "a que", "de qué", "de que",
  "en dónde", "en donde", "a dónde", "a donde", "con quién", "con quien",
  "y qué", "y cómo", "y cuándo", "y dónde", "y quién", "y cuál", "y cuánto", "y por qué",

  // Verbos de indagación, memoria y duda
  "recuerdas", "recuerda", "te acuerdas", "se acuerda", "sabes si", "sabes",
  "sabías que", "sabías", "sabe si", "conoces", "crees que", "cree que",
  "piensas que", "te parece si", "te parece", "le parece", "te gustaría",
  "le gustaría", "es posible", "sería posible", "me puedes decir", "me puede decir",
  "me puedes confirmar", "me puede confirmar", "me ayudas", "me podrías ayudar",
  "puedes", "puede", "podrías", "podría", "cómo ves", "como ves", "qué opinas",
  "que opinas", "qué piensas", "que piensas", "no crees que", "no crees",
  "de casualidad", "acaso", "será que", "habrá que", "podemos", "se puede",

  // Disponibilidad, acuerdo y confirmación en reuniones
  "tienes tiempo", "tienen tiempo", "tienes disponibilidad", "tienen disponibilidad",
  "tienes", "tienen", "tiene",
  "estás de acuerdo", "está de acuerdo", "están de acuerdo",
  "te quedó claro", "quedó claro", "está claro",
  "me confirmas", "me confirma", "nos confirma",
  "viste", "viste que", "vio",
  "te llegó", "le llegó", "recibiste", "recibió",
  "hay alguna", "hay algún", "hay forma", "existe alguna"
];

// Coletillas interrogativas de confirmación al final en Español
const COLETILLAS_ES = [
  "verdad", "cierto", "correcto", "no", "o no", "o qué", "sí", "o qué opinas"
];

// Expresiones de inicio de pregunta en Portugués (Brasil)
const DISPARADORES_PREGUNTA_PT = [
  "o que", "que", "qual", "quais", "quem", "como", "quando", "onde",
  "aonde", "por que", "porque", "para que", "quanto", "quanta", "quantos", "quantas",
  "será que", "é possível", "seria possível", "você sabe", "você lembra",
  "lembra que", "você viu", "o que você acha", "o que acha", "como você vê",
  "você pode", "poderia", "consegue", "dá para", "tem como",
  "você tem tempo", "tem tempo", "está de acordo", "concorda"
];

const COLETILLAS_PT = ["né", "certo", "não é", "verdade", "tá bom"];

// Expresiones de inicio de pregunta en Inglés
const DISPARADORES_PREGUNTA_EN = [
  "what", "which", "who", "whom", "whose", "where", "when", "why", "how",
  "is", "are", "was", "were", "do", "does", "did", "can", "could", "would",
  "should", "will", "won't", "have", "has", "had", "may", "might",
  "do you think", "do you know", "do you remember", "is it possible", "could you",
  "are you available", "do you agree"
];

const COLETILLAS_EN = ["right", "isn't it", "aren't you", "don't you", "no"];

/**
 * Capitaliza la primera letra de un string preservando signos de apertura
 */
export function capitalizarInicio(texto: string): string {
  if (!texto) return "";
  if (texto.startsWith("¿") || texto.startsWith("¡")) {
    if (texto.length > 1) {
      return texto[0] + texto[1].toUpperCase() + texto.slice(2);
    }
    return texto;
  }
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

/**
 * Formatea el texto interior de una pregunta en español tras el signo ¿
 * Si va tras una coma, la primera letra es minúscula (excepto nombres propios o siglas)
 */
function formatearInicioPregunta(texto: string, trasComa: boolean = false): string {
  if (!texto) return "";
  const trimmed = texto.trim();
  if (!trimmed) return "";

  if (trasComa) {
    const primeraPalabra = trimmed.split(" ")[0];
    const esSigla = primeraPalabra === primeraPalabra.toUpperCase() && primeraPalabra.length > 1;
    if (!esSigla) {
      return trimmed.charAt(0).toLowerCase() + trimmed.slice(1);
    }
    return trimmed;
  }

  return capitalizarInicio(trimmed);
}

/**
 * Función auxiliar para verificar si un fragmento en español coincide con algún disparador interrogativo
 */
function esPreguntaEspanol(texto: string): boolean {
  const tLower = texto.trim().toLowerCase();
  for (const disp of DISPARADORES_PREGUNTA_ES) {
    if (new RegExp(`^${disp}\\b`, "i").test(tLower)) {
      return true;
    }
  }
  return false;
}

/**
 * Detecta y formatea signos de interrogación para una cláusula en Español
 */
function procesarClausulaEspanol(clausula: string, trasComa: boolean = false): string {
  let c = clausula.trim();
  if (!c) return "";

  // Si ya tiene signos completos, solo asegurar mayúscula o formato adecuado
  if (c.startsWith("¿") && c.endsWith("?")) {
    return trasComa ? c : capitalizarInicio(c);
  }

  // Quitar punto final provisional si lo traía
  if (c.endsWith(".")) {
    c = c.slice(0, -1).trim();
  }

  const cLower = c.toLowerCase();

  // 1. Revisar si termina con coletilla de confirmación (ej. "..., verdad?", "..., ¿no?")
  for (const coletilla of COLETILLAS_ES) {
    const regexColetilla = new RegExp(`[,]?\\s*\\b(${coletilla})\\s*[?]?$`, "i");
    if (regexColetilla.test(c)) {
      const matches = c.match(new RegExp(`^(.*?)[,]?\\s*\\b(${coletilla})\\s*[?]?$`, "i"));
      if (matches) {
        const cuerpo = matches[1].trim();
        const palabraCol = matches[2].trim();
        if (cuerpo) {
          const cuerpoFmt = trasComa ? cuerpo : capitalizarInicio(cuerpo);
          return `${cuerpoFmt}, ¿${palabraCol}?`;
        }
        return `¿${capitalizarInicio(palabraCol)}?`;
      }
    }
  }

  // 2. Revisar si inicia con un conector conversacional tipo "bueno", "entonces", "mira", "oye"
  for (const conector of CONECTORES_ORALES_ES) {
    const regexConector = new RegExp(`^${conector}\\b[,]?\\s+(.+)$`, "i");
    const conectorMatch = c.match(regexConector);
    if (conectorMatch) {
      const resto = conectorMatch[1].trim();
      const restoEsPregunta = esPreguntaEspanol(resto);
      if (restoEsPregunta) {
        const conectorFmt = trasComa ? conector.toLowerCase() : capitalizarInicio(conector);
        const preguntaFmt = procesarClausulaEspanol(resto, true);
        return `${conectorFmt}, ${preguntaFmt}`;
      }
    }
  }

  // 3. Verificar si inicia con algún disparador interrogativo directo
  for (const disp of DISPARADORES_PREGUNTA_ES) {
    const regexInicio = new RegExp(`^${disp}\\b`, "i");
    if (regexInicio.test(cLower)) {
      // Aplicar tilde en la partícula si no la tiene
      let textoConTildes = c;
      const dispLower = disp.toLowerCase();
      if (INTERROGATIVAS_ES_MAP[dispLower]) {
        const corregida = INTERROGATIVAS_ES_MAP[dispLower];
        textoConTildes = corregida + c.slice(disp.length);
      }

      // Quitar signos previos si los hubiera desbalanceados
      textoConTildes = textoConTildes.replace(/^[¿?]+|[¿?]+$/g, "").trim();

      // Formar pregunta completa ¿ ... ?
      const textoInicio = formatearInicioPregunta(textoConTildes, trasComa);
      return `¿${textoInicio}?`;
    }
  }

  // 4. Si termina explícitamente en signo de pregunta pero le faltaba el de apertura
  if (c.endsWith("?") && !c.startsWith("¿")) {
    const sinInterrogacion = c.slice(0, -1).trim();
    const textoInicio = formatearInicioPregunta(sinInterrogacion, trasComa);
    return `¿${textoInicio}?`;
  }

  return trasComa ? c : capitalizarInicio(c);
}

/**
 * Detecta y formatea preguntas en Portugués (Brasil) (... ?)
 */
function procesarClausulaPortugues(clausula: string): string {
  let c = clausula.trim();
  if (!c) return "";
  if (c.endsWith("?")) return capitalizarInicio(c);
  if (c.endsWith(".")) c = c.slice(0, -1).trim();

  const cLower = c.toLowerCase();

  // Coletillas
  for (const col of COLETILLAS_PT) {
    const regex = new RegExp(`[,]?\\s*\\b(${col})\\s*[?]?$`, "i");
    if (regex.test(cLower)) {
      return `${capitalizarInicio(c.replace(regex, "").trim())}, ${col}?`;
    }
  }

  // Disparadores
  for (const disp of DISPARADORES_PREGUNTA_PT) {
    if (cLower.startsWith(disp + " ") || cLower === disp) {
      return `${capitalizarInicio(c)}?`;
    }
  }

  return capitalizarInicio(c);
}

/**
 * Detecta y formatea preguntas en Inglés (... ?)
 */
function procesarClausulaIngles(clausula: string): string {
  let c = clausula.trim();
  if (!c) return "";
  if (c.endsWith("?")) return capitalizarInicio(c);
  if (c.endsWith(".")) c = c.slice(0, -1).trim();

  const cLower = c.toLowerCase();

  // Coletillas
  for (const col of COLETILLAS_EN) {
    const regex = new RegExp(`[,]?\\s*\\b(${col})\\s*[?]?$`, "i");
    if (regex.test(cLower)) {
      return `${capitalizarInicio(c.replace(regex, "").trim())}, ${col}?`;
    }
  }

  // Disparadores
  for (const disp of DISPARADORES_PREGUNTA_EN) {
    if (cLower.startsWith(disp + " ") || cLower === disp) {
      return `${capitalizarInicio(c)}?`;
    }
  }

  return capitalizarInicio(c);
}

/**
 * Función Principal de Puntuación Inteligente
 * @param texto Texto sin procesar de la API de reconocimiento de voz
 * @param idioma Idioma fuente (ej. "es-CO", "pt-BR", "en-US")
 */
export function enriquecerPuntuacionYPreguntas(texto: string, idioma: string = "es-CO"): string {
  if (!texto) return "";
  const clean = texto.trim();
  if (!clean) return "";

  const langCode = idioma.toLowerCase();

  // Caso 1: Idioma Español
  if (langCode.startsWith("es")) {
    // Si la frase contiene vocativo inicial tipo "Hola Juan,", "Buenos días,", "Marcelo,"
    // buscamos si la parte posterior a la coma es una pregunta
    const vocativoMatch = clean.match(/^((?:hola|buenos días|buenas tardes|buenas noches|[A-ZÁÉÍÓÚ][a-záéíóú]+)\s*,\s*)(.+)$/i);
    if (vocativoMatch) {
      const prefijo = vocativoMatch[1];
      const resto = vocativoMatch[2];
      const restoProcesado = procesarClausulaEspanol(resto, true);
      return capitalizarInicio(prefijo) + restoProcesado;
    }

    return procesarClausulaEspanol(clean, false);
  }

  // Caso 2: Idioma Portugués
  if (langCode.startsWith("pt")) {
    return procesarClausulaPortugues(clean);
  }

  // Caso 3: Idioma Inglés
  if (langCode.startsWith("en")) {
    return procesarClausulaIngles(clean);
  }

  // Fallback estándar
  return capitalizarInicio(clean);
}
