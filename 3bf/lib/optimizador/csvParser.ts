/**
 * =========================================================================================
 * ✂️ 3dBimFab Opti_Nesting — Importador y Parser CSV Universal (Fase 2)
 * Permite cargar listas de corte externas desde Excel, Cutlist Plus, MaxCut o Maestro Lab.
 * Soporta delimitadores automáticos (, ; \t) y encabezados en Español, Portugués e Inglés.
 * =========================================================================================
 */

import type { PiezaCorte } from "./tiposOptimizador";

// Mapeos de sinónimos de columnas para parsing tolerante
const ALIAS_COLUMNAS = {
  nombre: ["nombre", "pieza", "peca", "peça", "name", "part", "item", "etiqueta", "label"],
  descripcion: ["descripcion", "descripción", "descricao", "descrição", "description", "detalle"],
  largo: ["largo", "longitud", "comprimento", "length", "l", "c", "x", "alto"],
  ancho: ["ancho", "anchura", "largura", "width", "w", "y", "profundidad"],
  espesor: ["espesor", "calibre", "espessura", "thickness", "t", "th", "z", "e"],
  cantidad: ["cantidad", "cant", "qtd", "quantidade", "qty", "quantity", "count", "unidades"],
  veta: ["veta", "sentido_veta", "grao", "grão", "grain", "rotacion", "rotacao", "girar"],
  material: ["material", "mat", "tablero", "chapa", "color", "acabado"],
};

/**
 * Detecta el delimitador más probable (coma, punto y coma o tabulador)
 */
function detectarDelimitador(lineas: string[]): string {
  let comas = 0;
  let puntosYComas = 0;
  let tabs = 0;

  for (let i = 0; i < Math.min(5, lineas.length); i++) {
    const l = lineas[i];
    comas += (l.match(/,/g) || []).length;
    puntosYComas += (l.match(/;/g) || []).length;
    tabs += (l.match(/\t/g) || []).length;
  }

  if (puntosYComas >= comas && puntosYComas >= tabs && puntosYComas > 0) return ";";
  if (tabs >= comas && tabs >= puntosYComas && tabs > 0) return "\t";
  return ",";
}

/**
 * Normaliza un string para comparación de encabezados
 */
function normalizarKey(str: string): string {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "");
}

/**
 * Parsea el contenido de un archivo CSV y devuelve la lista de PiezaCorte
 */
export function parsearArchivoCSV(contenido: string): { piezas: PiezaCorte[]; errores: string[] } {
  const lineas = contenido
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  if (lineas.length < 2) {
    return { piezas: [], errores: ["El archivo CSV no contiene suficientes filas de datos."] };
  }

  const delimitador = detectarDelimitador(lineas);
  const encabezadosRaw = lineas[0].split(delimitador).map((h) => h.replace(/^["']|["']$/g, "").trim());

  // Mapear qué índice de columna corresponde a qué propiedad
  const indicesColumnas: { [key: string]: number } = {};

  encabezadosRaw.forEach((h, idx) => {
    const norm = normalizarKey(h);
    for (const [prop, listaAlias] of Object.entries(ALIAS_COLUMNAS)) {
      if (indicesColumnas[prop] !== undefined) continue;

      const coincide = listaAlias.some((alias) => {
        const normAlias = normalizarKey(alias);
        // Si el alias es corto (<= 2 caracteres como "l", "w", "x", "y"), exigir coincidencia exacta
        if (normAlias.length <= 2) {
          return norm === normAlias;
        }
        return norm === normAlias || norm.startsWith(normAlias) || norm.includes(normAlias);
      });

      if (coincide) {
        indicesColumnas[prop] = idx;
      }
    }
  });

  // Validar columnas obligatorias mínimas (Largo y Ancho)
  const errores: string[] = [];
  if (indicesColumnas.largo === undefined) {
    errores.push("No se encontró la columna de 'Largo' / 'Comprimento' / 'Length'.");
  }
  if (indicesColumnas.ancho === undefined) {
    errores.push("No se encontró la columna de 'Ancho' / 'Largura' / 'Width'.");
  }

  if (errores.length > 0) {
    return { piezas: [], errores };
  }

  const piezas: PiezaCorte[] = [];

  for (let i = 1; i < lineas.length; i++) {
    const fila = lineas[i].split(delimitador).map((c) => c.replace(/^["']|["']$/g, "").trim());
    if (fila.length <= 1) continue;

    const parseNum = (idx: number | undefined, def: number): number => {
      if (idx === undefined || fila[idx] === undefined) return def;
      const clean = fila[idx].replace(/\./g, "").replace(",", ".");
      const n = parseFloat(clean);
      return isNaN(n) ? def : n;
    };

    const largo = Math.round(parseNum(indicesColumnas.largo, 0));
    const ancho = Math.round(parseNum(indicesColumnas.ancho, 0));
    const espesor = Math.round(parseNum(indicesColumnas.espesor, 15));
    const cantidad = Math.max(1, Math.round(parseNum(indicesColumnas.cantidad, 1)));

    if (largo <= 0 || ancho <= 0) continue;

    const nombre = indicesColumnas.nombre !== undefined && fila[indicesColumnas.nombre]
      ? fila[indicesColumnas.nombre]
      : `Pieza_${i}`;

    const descripcion = indicesColumnas.descripcion !== undefined && fila[indicesColumnas.descripcion]
      ? fila[indicesColumnas.descripcion]
      : nombre;

    const material = indicesColumnas.material !== undefined && fila[indicesColumnas.material]
      ? fila[indicesColumnas.material]
      : `Tablero ${espesor}mm`;

    // Evaluar si respeta veta o permite rotación libre
    let rotacionPermitida = false;
    if (indicesColumnas.veta !== undefined && fila[indicesColumnas.veta]) {
      const v = fila[indicesColumnas.veta].toLowerCase();
      // Si dice "libre", "rotar", "si", "true", "1" => permite rotar
      rotacionPermitida = /libre|si|sim|yes|true|1|rotar|gira/i.test(v);
    }

    const PALETA = ["#38BDF8", "#818CF8", "#F472B6", "#FB923C", "#FBBF24", "#34D399", "#A78BFA", "#2DD4BF"];
    const colorHex = PALETA[(i - 1) % PALETA.length];

    piezas.push({
      id: `csv_pieza_${i}`,
      nombre,
      descripcion,
      largo,
      ancho,
      espesor,
      cantidad,
      rotacionPermitida,
      material,
      colorHex,
    });
  }

  if (piezas.length === 0) {
    errores.push("El archivo no contenía piezas válidas con medidas mayores a 0.");
  }

  return { piezas, errores };
}

/**
 * Genera el texto CSV para descargar una plantilla lista para Excel
 */
export function generarPlantillaCSV(): string {
  const encabezados = "Nombre;Descripcion;Largo_mm;Ancho_mm;Espesor_mm;Cantidad;Veta;Material";
  const filasEjemplo = [
    "Lateral Izquierdo;Costado Mueble;850;450;15;1;Veta;MDP Nogal",
    "Lateral Derecho;Costado Mueble;850;450;15;1;Veta;MDP Nogal",
    "Base Inferior;Piso Mueble;1160;450;15;1;Veta;MDP Nogal",
    "Techo Superior;Tapa Mueble;1200;480;15;1;Veta;MDP Nogal",
    "Fondo Gaveta;Trasera 3mm;550;380;3;4;Libre;MDF Blanco",
    "Frente Cajón;Frente Gaveta;580;180;15;2;Veta;MDP Nogal",
    "Gualdera Lateral;Lateral Gaveta;400;120;12;8;Libre;MDP Blanco",
  ];
  return [encabezados, ...filasEjemplo].join("\r\n");
}
