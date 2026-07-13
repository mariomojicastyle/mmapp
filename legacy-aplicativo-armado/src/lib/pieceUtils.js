// ── pieceUtils.js ──
// Módulo centralizado para la detección, extracción y traducción de nombres de pieza
// en cualquier idioma soportado por el visor 3D de armado.

// Sinónimos de "Pieza" en todos los idiomas soportados
const PIECE_SYNONYMS = ["PIEZA", "PEÇA", "PECA", "PART", "PIECE", "STÜCK", "PEZZO", "PEA", "PE\ufffdA", "PE_A", "PE?A"];

// Regex que detecta cualquier sinónimo seguido de separador y número(s)
// Captura: grupo 1 = palabra, grupo 2 = número
// Ejemplo: "Peça 01" → ["Peça", "01"]
//          "Pieza_03" → ["Pieza", "03"]
//          "Part 12"  → ["Part", "12"]
const PIECE_REGEX = new RegExp(
  `^(${PIECE_SYNONYMS.join("|")})[_\\s]*(\\d+)`, "i"
);

/**
 * Determina si un nombre de malla comienza con algún sinónimo de "Pieza".
 * @param {string} name - Nombre de la malla del GLB
 * @returns {boolean}
 */
export function isPieceName(name) {
  if (!name) return false;
  const upper = name.trim().toUpperCase();
  
  // Regla especial a prueba de balas para "Peça" corrompido (Ej: "Pea", "Pea", "Pe_a")
  if (/^PE.A/i.test(upper) || /^PEA/i.test(upper)) {
    return true;
  }
  
  return PIECE_SYNONYMS.some(syn => upper.startsWith(syn));
}

/**
 * Extrae el número de pieza de un nombre como "Peça 01" o "Pieza_03".
 * @param {string} name - Nombre de la malla
 * @returns {{ number: number, raw: string } | null}
 */
export function extractPieceNumber(name) {
  if (!name) return null;
  const cleaned = name.replace(/[._]?0\d\d$/i, function(match) {
    // Solo recortar si el sufijo empieza con punto o guion bajo (sufijo de Blender .001)
    // NO recortar si forma parte del nombre legítimo
    return (match.startsWith('.') || match.startsWith('_')) ? '' : match;
  }).trim();
  const match = cleaned.match(PIECE_REGEX);
  if (match) {
    let numStr = match[2];
    // Si el número es largo y termina en 0xx (sufijo de Blender sin punto/guion bajo, ej: 11003 -> 11)
    if (numStr.length >= 4 && /0\d\d$/.test(numStr)) {
      numStr = numStr.substring(0, numStr.length - 3);
    }
    return { number: parseInt(numStr, 10), raw: numStr };
  }
  return null;
}

/**
 * Traduce "Pieza XX" al idioma indicado.
 * @param {number} num - Número de la pieza
 * @param {string} idioma - Código de idioma ("es"|"en"|"pt"|"es-ES")
 * @returns {string} Ej: "Peça 01", "Part 01", "Pieza 01"
 */
export function translatePieceLabel(num, idioma) {
  const padded = String(num).padStart(2, "0");
  if (idioma && idioma.startsWith("pt")) return `Peça ${padded}`;
  if (idioma && idioma.startsWith("en")) return `Part ${padded}`;
  return `Pieza ${padded}`; // es, es-ES y cualquier otro
}
