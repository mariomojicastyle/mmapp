/**
 * =========================================================================================
 * ✂️ 3dBimFab Opti_Nesting — Motor 1: Seccionadora Industrial (Guillotina 2D)
 * Algoritmo Metaheurístico Multi-Iterativo de Alta Intensidad (Multi-Pass & Strip Packing)
 * con respeto estricto de sentido de veta, kerf de sierra, refilado perimetral y fusión de retales.
 * =========================================================================================
 */

import type { 
  PiezaCorte, 
  ConfiguracionLaminas, 
  LaminaResultado, 
  PiezaColocada, 
  LineaCorteVisual 
} from "./tiposOptimizador";

interface RectLibre {
  x: number;
  y: number;
  ancho: number;
  largo: number;
}

interface PiezaInstancia {
  id: string;
  piezaOriginalId: string;
  nombre: string;
  descripcion?: string;
  largo: number;
  ancho: number;
  rotacionPermitida: boolean;
  colorHex: string;
}

type CriterioSeleccionRect = "BSSF" | "BLSF" | "BAF" | "BOTTOM_LEFT";
type CriterioParticion = "SLAS" | "LLAS" | "HORIZONTAL_FIRST" | "VERTICAL_FIRST" | "MAX_AREA";

/**
 * Generador Pseudoaleatorio Determinista con Semilla (Linear Congruential Generator)
 */
class PseudoAleatorio {
  private seed: number;
  constructor(semillaInicial: number) {
    this.seed = semillaInicial % 2147483647;
    if (this.seed <= 0) this.seed += 2147483646;
  }
  public siguiente(): number {
    this.seed = (this.seed * 16807) % 2147483647;
    return (this.seed - 1) / 2147483646;
  }
}

/**
 * Fusiona rectángulos libres adyacentes que compartan una arista completa
 */
function fusionarRectangulosLibres(rects: RectLibre[]): void {
  let fusionado = true;
  while (fusionado) {
    fusionado = false;
    for (let i = 0; i < rects.length; i++) {
      for (let j = i + 1; j < rects.length; j++) {
        const r1 = rects[i];
        const r2 = rects[j];

        // Fusión horizontal (mismo Y y ancho, contiguos en X)
        if (r1.y === r2.y && r1.ancho === r2.ancho) {
          if (r1.x + r1.largo === r2.x) {
            r1.largo += r2.largo;
            rects.splice(j, 1);
            fusionado = true;
            break;
          }
          if (r2.x + r2.largo === r1.x) {
            r2.largo += r1.largo;
            rects.splice(i, 1);
            fusionado = true;
            break;
          }
        }

        // Fusión vertical (mismo X y largo, contiguos en Y)
        if (r1.x === r2.x && r1.largo === r2.largo) {
          if (r1.y + r1.ancho === r2.y) {
            r1.ancho += r2.ancho;
            rects.splice(j, 1);
            fusionado = true;
            break;
          }
          if (r2.y + r2.ancho === r1.y) {
            r2.ancho += r1.ancho;
            rects.splice(i, 1);
            fusionado = true;
            break;
          }
        }
      }
      if (fusionado) break;
    }
  }
}

/**
 * Ejecuta una pasada de empaquetado de guillotina determinista con una regla específica
 */
function empaquetarGuillotinaUnaPasada(
  piezas: PiezaInstancia[],
  largoBruto: number,
  anchoBruto: number,
  kerf: number,
  refilado: number,
  criterioRect: CriterioSeleccionRect,
  criterioParticion: CriterioParticion
): LaminaResultado[] {
  const largoUtil = largoBruto - refilado * 2;
  const anchoUtil = anchoBruto - refilado * 2;
  const areaBrutaMm2 = largoBruto * anchoBruto;

  if (largoUtil <= 0 || anchoUtil <= 0) return [];

  interface EstadoLamina {
    piezasColocadas: PiezaColocada[];
    rectsLibres: RectLibre[];
    lineasCorte: LineaCorteVisual[];
  }

  const crearNuevaLamina = (): EstadoLamina => ({
    piezasColocadas: [],
    rectsLibres: [{ x: refilado, y: refilado, largo: largoUtil, ancho: anchoUtil }],
    lineasCorte: [
      { x1: refilado, y1: refilado, x2: largoBruto - refilado, y2: refilado, tipo: "guillotina_fase1" },
      { x1: largoBruto - refilado, y1: refilado, x2: largoBruto - refilado, y2: anchoBruto - refilado, tipo: "guillotina_fase1" },
      { x1: largoBruto - refilado, y1: anchoBruto - refilado, x2: refilado, y2: anchoBruto - refilado, tipo: "guillotina_fase1" },
      { x1: refilado, y1: anchoBruto - refilado, x2: refilado, y2: refilado, tipo: "guillotina_fase1" },
    ],
  });

  const estadosLaminas: EstadoLamina[] = [crearNuevaLamina()];

  for (const pieza of piezas) {
    let colocada = false;

    // Intentar ubicar en alguna lámina ya abierta
    for (let lIdx = 0; lIdx < estadosLaminas.length; lIdx++) {
      const lam = estadosLaminas[lIdx];
      let mejorRectIdx = -1;
      let mejorScore = Infinity;
      let rotarMejor = false;

      for (let rIdx = 0; rIdx < lam.rectsLibres.length; rIdx++) {
        const rect = lam.rectsLibres[rIdx];

        // Opción 1: Sin rotar (respeta veta original: largo en X, ancho en Y)
        if (pieza.largo <= rect.largo && pieza.ancho <= rect.ancho) {
          const remL = rect.largo - pieza.largo;
          const remA = rect.ancho - pieza.ancho;
          let score = 0;

          switch (criterioRect) {
            case "BSSF": // Best Short Side Fit
              score = Math.min(remL, remA);
              break;
            case "BLSF": // Best Long Side Fit
              score = Math.max(remL, remA);
              break;
            case "BAF": // Best Area Fit
              score = rect.largo * rect.ancho - pieza.largo * pieza.ancho;
              break;
            case "BOTTOM_LEFT":
              score = rect.x * 10000 + rect.y;
              break;
          }

          if (score < mejorScore) {
            mejorScore = score;
            mejorRectIdx = rIdx;
            rotarMejor = false;
          }
        }

        // Opción 2: Rotada a 90 grados (sólo si rotación permitida)
        if (pieza.rotacionPermitida && pieza.ancho <= rect.largo && pieza.largo <= rect.ancho) {
          const remL = rect.largo - pieza.ancho;
          const remA = rect.ancho - pieza.largo;
          let score = 0;

          switch (criterioRect) {
            case "BSSF":
              score = Math.min(remL, remA);
              break;
            case "BLSF":
              score = Math.max(remL, remA);
              break;
            case "BAF":
              score = rect.largo * rect.ancho - pieza.ancho * pieza.largo;
              break;
            case "BOTTOM_LEFT":
              score = rect.x * 10000 + rect.y;
              break;
          }

          if (score < mejorScore) {
            mejorScore = score;
            mejorRectIdx = rIdx;
            rotarMejor = true;
          }
        }
      }

      if (mejorRectIdx !== -1) {
        // Encontramos el espacio óptimo en esta lámina
        const rectElegido = lam.rectsLibres.splice(mejorRectIdx, 1)[0];
        const piezaLargo = rotarMejor ? pieza.ancho : pieza.largo;
        const piezaAncho = rotarMejor ? pieza.largo : pieza.ancho;

        lam.piezasColocadas.push({
          piezaId: pieza.id,
          nombre: pieza.nombre,
          descripcion: pieza.descripcion,
          x: rectElegido.x,
          y: rectElegido.y,
          largo: piezaLargo,
          ancho: piezaAncho,
          rotada: rotarMejor,
          colorHex: pieza.colorHex,
        });

        const remLargo = rectElegido.largo - piezaLargo - kerf;
        const remAncho = rectElegido.ancho - piezaAncho - kerf;

        // Partición Guillotina según la regla seleccionada
        if (remLargo > 0 && remAncho > 0) {
          let corteHorizontal = false;

          switch (criterioParticion) {
            case "SLAS": // Shorter Leftover Axis Split
              corteHorizontal = remAncho <= remLargo;
              break;
            case "LLAS": // Longer Leftover Axis Split
              corteHorizontal = remAncho > remLargo;
              break;
            case "HORIZONTAL_FIRST":
              corteHorizontal = true;
              break;
            case "VERTICAL_FIRST":
              corteHorizontal = false;
              break;
            case "MAX_AREA":
              const areaH = rectElegido.largo * remAncho;
              const areaV = remLargo * rectElegido.ancho;
              corteHorizontal = areaH >= areaV;
              break;
          }

          if (corteHorizontal) {
            // Corte horizontal primero de extremo a extremo
            lam.rectsLibres.push({
              x: rectElegido.x,
              y: rectElegido.y + piezaAncho + kerf,
              largo: rectElegido.largo,
              ancho: remAncho,
            });
            lam.rectsLibres.push({
              x: rectElegido.x + piezaLargo + kerf,
              y: rectElegido.y,
              largo: remLargo,
              ancho: piezaAncho,
            });
            lam.lineasCorte.push({
              x1: rectElegido.x,
              y1: rectElegido.y + piezaAncho,
              x2: rectElegido.x + rectElegido.largo,
              y2: rectElegido.y + piezaAncho,
              tipo: "guillotina_fase2",
            });
          } else {
            // Corte vertical primero de extremo a extremo
            lam.rectsLibres.push({
              x: rectElegido.x + piezaLargo + kerf,
              y: rectElegido.y,
              largo: remLargo,
              ancho: rectElegido.ancho,
            });
            lam.rectsLibres.push({
              x: rectElegido.x,
              y: rectElegido.y + piezaAncho + kerf,
              largo: piezaLargo,
              ancho: remAncho,
            });
            lam.lineasCorte.push({
              x1: rectElegido.x + piezaLargo,
              y1: rectElegido.y,
              x2: rectElegido.x + piezaLargo,
              y2: rectElegido.y + rectElegido.ancho,
              tipo: "guillotina_fase2",
            });
          }
        } else if (remLargo > 0) {
          lam.rectsLibres.push({
            x: rectElegido.x + piezaLargo + kerf,
            y: rectElegido.y,
            largo: remLargo,
            ancho: rectElegido.ancho,
          });
        } else if (remAncho > 0) {
          lam.rectsLibres.push({
            x: rectElegido.x,
            y: rectElegido.y + piezaAncho + kerf,
            largo: rectElegido.largo,
            ancho: remAncho,
          });
        }

        // Fusionar retales adyacentes para evitar fragmentación
        fusionarRectangulosLibres(lam.rectsLibres);

        colocada = true;
        break;
      }
    }

    // Si no cupo en ninguna lámina abierta, abrir una nueva lámina
    if (!colocada) {
      const nuevaLam = crearNuevaLamina();
      const rectElegido = nuevaLam.rectsLibres.splice(0, 1)[0];

      const rotar = pieza.rotacionPermitida && pieza.ancho <= rectElegido.largo && pieza.largo <= rectElegido.ancho && pieza.largo > rectElegido.largo;
      const piezaLargo = rotar ? pieza.ancho : pieza.largo;
      const piezaAncho = rotar ? pieza.largo : pieza.ancho;

      if (piezaLargo <= rectElegido.largo && piezaAncho <= rectElegido.ancho) {
        nuevaLam.piezasColocadas.push({
          piezaId: pieza.id,
          nombre: pieza.nombre,
          descripcion: pieza.descripcion,
          x: rectElegido.x,
          y: rectElegido.y,
          largo: piezaLargo,
          ancho: piezaAncho,
          rotada: rotar,
          colorHex: pieza.colorHex,
        });

        const remLargo = rectElegido.largo - piezaLargo - kerf;
        const remAncho = rectElegido.ancho - piezaAncho - kerf;

        if (remLargo > 0 && remAncho > 0) {
          nuevaLam.rectsLibres.push({
            x: rectElegido.x + piezaLargo + kerf,
            y: rectElegido.y,
            largo: remLargo,
            ancho: rectElegido.ancho,
          });
          nuevaLam.rectsLibres.push({
            x: rectElegido.x,
            y: rectElegido.y + piezaAncho + kerf,
            largo: piezaLargo,
            ancho: remAncho,
          });
        } else if (remLargo > 0) {
          nuevaLam.rectsLibres.push({
            x: rectElegido.x + piezaLargo + kerf,
            y: rectElegido.y,
            largo: remLargo,
            ancho: rectElegido.ancho,
          });
        } else if (remAncho > 0) {
          nuevaLam.rectsLibres.push({
            x: rectElegido.x,
            y: rectElegido.y + piezaAncho + kerf,
            largo: rectElegido.largo,
            ancho: remAncho,
          });
        }

        fusionarRectangulosLibres(nuevaLam.rectsLibres);
        estadosLaminas.push(nuevaLam);
      }
    }
  }

  // Consolidar resultados métricos de las láminas
  const laminas: LaminaResultado[] = [];

  estadosLaminas.forEach((lam, idx) => {
    if (lam.piezasColocadas.length === 0) return;

    let areaUtilizadaMm2 = 0;
    let metrosLineales = (largoBruto * 2 + anchoBruto * 2) / 1000;

    lam.piezasColocadas.forEach((p) => {
      areaUtilizadaMm2 += p.largo * p.ancho;
      metrosLineales += (p.largo + p.ancho) / 1000;
    });

    const porcentajeAprovechamiento = Number(((areaUtilizadaMm2 / areaBrutaMm2) * 100).toFixed(1));
    const porcentajeDesperdicio = Number((100 - porcentajeAprovechamiento).toFixed(1));

    laminas.push({
      indice: idx + 1,
      espesor: 0,
      material: "",
      anchoTotal: anchoBruto,
      largoTotal: largoBruto,
      piezas: lam.piezasColocadas,
      lineasCorte: lam.lineasCorte,
      areaTotalMm2: areaBrutaMm2,
      areaUtilizadaMm2,
      porcentajeAprovechamiento,
      porcentajeDesperdicio,
      metrosLinealesCorte: Number(metrosLineales.toFixed(1)),
    });
  });

  return laminas;
}

/**
 * Evalúa la calidad de un plan de corte. Menor valor indica mejor optimización.
 * Prioridad 1: Menor cantidad de tableros.
 * Prioridad 2: Menor área de desperdicio.
 * Prioridad 3: Menor longitud de cortes.
 */
function evaluarPuntajePlan(laminas: LaminaResultado[]): number {
  if (laminas.length === 0) return Infinity;
  const totalLaminas = laminas.length;
  const desperdicioTotalMm2 = laminas.reduce((acc, l) => acc + (l.areaTotalMm2 - l.areaUtilizadaMm2), 0);
  const metrosCorte = laminas.reduce((acc, l) => acc + l.metrosLinealesCorte, 0);

  // Cada lámina ahorrada vale 10,000,000 puntos
  return totalLaminas * 10_000_000 + (desperdicioTotalMm2 / 1000) + metrosCorte;
}

/**
 * Optimiza el corte ortogonal tipo guillotina ejecutando un motor multi-iterativo metaheurístico
 */
export function optimizarGuillotina2D(
  piezas: PiezaCorte[],
  config: ConfiguracionLaminas,
  espesorTarget: number,
  onProgreso?: (iteracion: number, total: number, mejorTableros: number) => void
): { laminas: LaminaResultado[]; semillaGanadora: number; totalIteraciones: number } {
  const kerf = config.kerfSierra;
  const refilado = config.refiladoMargen;
  const largoBruto = config.largoBruto;
  const anchoBruto = config.anchoBruto;
  const nivel = config.nivelOptimizacion || "intensivo";

  // 1. Expandir piezas según su cantidad
  const piezasExpandidas: PiezaInstancia[] = [];
  piezas.forEach((p) => {
    for (let c = 0; c < p.cantidad; c++) {
      piezasExpandidas.push({
        id: `${p.id}_inst_${c}`,
        piezaOriginalId: p.id,
        nombre: p.nombre,
        descripcion: p.descripcion,
        largo: p.largo,
        ancho: p.ancho,
        rotacionPermitida: p.rotacionPermitida,
        colorHex: p.colorHex || "#38BDF8",
      });
    }
  });

  if (piezasExpandidas.length === 0) {
    return { laminas: [], semillaGanadora: 0, totalIteraciones: 0 };
  }

  // 2. Generar diferentes ordenamientos candidatos (Sorting Strategies)
  const candidatosOrden: Array<{ nombre: string; piezas: PiezaInstancia[]; semilla?: number }> = [];

  // Estrategia A: Pattern / Strip Packing (Agrupación de piezas idénticas consecutivas)
  // ¡El secreto de MaxCut para crear cuadrículas perfectas de fondos y frentes!
  const ordenStripClustering = [...piezasExpandidas].sort((a, b) => {
    const claveA = `${a.largo}x${a.ancho}`;
    const claveB = `${b.largo}x${b.ancho}`;
    if (claveA === claveB) return 0;
    const areaA = a.largo * a.ancho;
    const areaB = b.largo * b.ancho;
    if (Math.abs(areaB - areaA) > 100) return areaB - areaA;
    return Math.max(b.largo, b.ancho) - Math.max(a.largo, a.ancho);
  });
  candidatosOrden.push({ nombre: "STRIP_CLUSTERING", piezas: ordenStripClustering });

  // Estrategia B: BAF (Área descendente)
  const ordenAreaDesc = [...piezasExpandidas].sort((a, b) => {
    const diffArea = b.largo * b.ancho - a.largo * a.ancho;
    if (diffArea !== 0) return diffArea;
    return Math.max(b.largo, b.ancho) - Math.max(a.largo, a.ancho);
  });
  candidatosOrden.push({ nombre: "AREA_DESCENDING", piezas: ordenAreaDesc });

  // Estrategia C: BLSF (Lado mayor descendente)
  const ordenLadoMayor = [...piezasExpandidas].sort((a, b) => {
    const maxB = Math.max(b.largo, b.ancho);
    const maxA = Math.max(a.largo, a.ancho);
    if (maxB !== maxA) return maxB - maxA;
    return b.largo * b.ancho - a.largo * a.ancho;
  });
  candidatosOrden.push({ nombre: "MAX_SIDE_DESCENDING", piezas: ordenLadoMayor });

  // Estrategia D: BSSF (Lado menor descendente)
  const ordenLadoMenor = [...piezasExpandidas].sort((a, b) => {
    const minB = Math.min(b.largo, b.ancho);
    const minA = Math.min(a.largo, a.ancho);
    if (minB !== minA) return minB - minA;
    return b.largo * b.ancho - a.largo * a.ancho;
  });
  candidatosOrden.push({ nombre: "MIN_SIDE_DESCENDING", piezas: ordenLadoMenor });

  // Estrategia E: Aspect Ratio Slender (Piezas alargadas primero)
  const ordenAspectRatio = [...piezasExpandidas].sort((a, b) => {
    const ratioA = Math.max(a.largo, a.ancho) / Math.max(1, Math.min(a.largo, a.ancho));
    const ratioB = Math.max(b.largo, b.ancho) / Math.max(1, Math.min(b.largo, b.ancho));
    return ratioB - ratioA;
  });
  candidatosOrden.push({ nombre: "ASPECT_RATIO", piezas: ordenAspectRatio });

  // Si el nivel es estándar o intensivo, añadir permutaciones estocásticas con semillas PRNG
  const numeroIteracionesEstocasticas = nivel === "rapido" ? 0 : nivel === "estandar" ? 25 : 120;

  for (let s = 1; s <= numeroIteracionesEstocasticas; s++) {
    const semilla = 100000 + s * 1337;
    const rng = new PseudoAleatorio(semilla);

    // Tomar base Strip Clustering o Area Descending y aplicar perturbación controlada
    const base = s % 2 === 0 ? ordenStripClustering : ordenAreaDesc;
    const permutado = [...base];

    // Intercambios locales estocásticos (swap controlado entre piezas de tamaño comparable)
    const swaps = Math.max(5, Math.floor(permutado.length * 0.15));
    for (let sw = 0; sw < swaps; sw++) {
      const idx1 = Math.floor(rng.siguiente() * permutado.length);
      const rango = Math.floor(rng.siguiente() * 12) - 6;
      const idx2 = Math.max(0, Math.min(permutado.length - 1, idx1 + rango));

      const temp = permutado[idx1];
      permutado[idx1] = permutado[idx2];
      permutado[idx2] = temp;
    }

    candidatosOrden.push({
      nombre: `STOCHASTIC_SEED_${semilla}`,
      piezas: permutado,
      semilla,
    });
  }

  // 3. Reglas de colocación y partición para cruzar
  const reglasParticion: CriterioParticion[] = ["HORIZONTAL_FIRST", "VERTICAL_FIRST", "SLAS", "MAX_AREA"];
  const reglasRect: CriterioSeleccionRect[] = ["BSSF", "BAF", "BLSF"];

  let mejorPlan: LaminaResultado[] = [];
  let mejorPuntaje = Infinity;
  let mejorSemilla = 127578; // Semilla simbólica industrial
  let totalIteraciones = 0;

  // 4. Bucle Metaheurístico Multi-Iterativo
  for (let cIdx = 0; cIdx < candidatosOrden.length; cIdx++) {
    const candidato = candidatosOrden[cIdx];

    // En iteraciones estocásticas, probamos 1 o 2 reglas de partición para máxima velocidad
    const particionesParaProbar = candidato.semilla 
      ? [reglasParticion[cIdx % reglasParticion.length]]
      : reglasParticion;

    for (const particion of particionesParaProbar) {
      for (const criterioR of (candidato.semilla ? ["BSSF" as CriterioSeleccionRect] : reglasRect)) {
        totalIteraciones++;

        const resultado = empaquetarGuillotinaUnaPasada(
          candidato.piezas,
          largoBruto,
          anchoBruto,
          kerf,
          refilado,
          criterioR,
          particion
        );

        const puntaje = evaluarPuntajePlan(resultado);

        if (puntaje < mejorPuntaje) {
          mejorPuntaje = puntaje;
          mejorPlan = resultado;
          mejorSemilla = candidato.semilla || (100000 + totalIteraciones * 17);

          if (onProgreso) {
            onProgreso(totalIteraciones, candidatosOrden.length, mejorPlan.length);
          }
        }

        // Si estamos en modo rápido, 1 iteración basta
        if (nivel === "rapido") break;
      }
      if (nivel === "rapido") break;
    }
    if (nivel === "rapido") break;
  }

  // 5. Asignar material y espesor al plan ganador
  mejorPlan.forEach((lam, idx) => {
    lam.indice = idx + 1;
    lam.espesor = espesorTarget;
    lam.material = piezas[0]?.material || `Tablero ${espesorTarget}mm`;
  });

  return {
    laminas: mejorPlan,
    semillaGanadora: mejorSemilla,
    totalIteraciones,
  };
}
