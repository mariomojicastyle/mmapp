/**
 * =========================================================================================
 * ✂️ 3dBimFab Opti_Nesting — Motor 1: Seccionadora Industrial (Guillotina 2D)
 * Algoritmo determinista de corte de extremo a extremo (Guillotine Strip Packing)
 * con respeto estricto de sentido de veta, kerf de sierra y refilado perimetral.
 * =========================================================================================
 */

import type { 
  PiezaCorte, 
  ConfiguracionLaminas, 
  LaminaResultado, 
  PiezaColocada, 
  LineaCorteVisual,
  ResultadoOptimizacionGlobal 
} from "./tiposOptimizador";

interface RectLibre {
  x: number;
  y: number;
  ancho: number;
  largo: number;
}

/**
 * Optimiza el corte ortogonal tipo guillotina para un grupo de piezas del mismo espesor
 */
export function optimizarGuillotina2D(
  piezas: PiezaCorte[],
  config: ConfiguracionLaminas,
  espesorTarget: number
): LaminaResultado[] {
  const kerf = config.kerfSierra;
  const refilado = config.refiladoMargen;
  const largoBruto = config.largoBruto;
  const anchoBruto = config.anchoBruto;

  const largoUtil = largoBruto - refilado * 2;
  const anchoUtil = anchoBruto - refilado * 2;

  if (largoUtil <= 0 || anchoUtil <= 0) {
    return [];
  }

  // 1. Expandir piezas según su cantidad
  const piezasExpandidas: Array<{
    id: string;
    piezaOriginalId: string;
    nombre: string;
    descripcion?: string;
    largo: number;
    ancho: number;
    rotacionPermitida: boolean;
    colorHex: string;
  }> = [];

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

  // 2. Ordenar heurísticamente: Mayor lado largo y mayor área primero (Best Short Side Fit)
  piezasExpandidas.sort((a, b) => {
    const areaA = a.largo * a.ancho;
    const areaB = b.largo * b.ancho;
    if (Math.abs(areaB - areaA) > 100) return areaB - areaA;
    return Math.max(b.largo, b.ancho) - Math.max(a.largo, a.ancho);
  });

  const laminas: LaminaResultado[] = [];

  interface EstadoLamina {
    piezasColocadas: PiezaColocada[];
    rectsLibres: RectLibre[];
    lineasCorte: LineaCorteVisual[];
  }

  const crearNuevaLamina = (): EstadoLamina => ({
    piezasColocadas: [],
    rectsLibres: [{ x: refilado, y: refilado, largo: largoUtil, ancho: anchoUtil }],
    lineasCorte: [
      // Refilado perimetral visual
      { x1: refilado, y1: refilado, x2: largoBruto - refilado, y2: refilado, tipo: "guillotina_fase1" },
      { x1: largoBruto - refilado, y1: refilado, x2: largoBruto - refilado, y2: anchoBruto - refilado, tipo: "guillotina_fase1" },
      { x1: largoBruto - refilado, y1: anchoBruto - refilado, x2: refilado, y2: anchoBruto - refilado, tipo: "guillotina_fase1" },
      { x1: refilado, y1: anchoBruto - refilado, x2: refilado, y2: refilado, tipo: "guillotina_fase1" },
    ],
  });

  const estadosLaminas: EstadoLamina[] = [crearNuevaLamina()];

  // 3. Ubicar cada pieza
  for (const pieza of piezasExpandidas) {
    let colocada = false;

    for (let lIdx = 0; lIdx < estadosLaminas.length; lIdx++) {
      const lam = estadosLaminas[lIdx];
      let mejorRectIdx = -1;
      let mejorSobrante = Infinity;
      let rotarMejor = false;

      for (let rIdx = 0; rIdx < lam.rectsLibres.length; rIdx++) {
        const rect = lam.rectsLibres[rIdx];

        // Opción 1: Sin rotar (respeta veta original: largo en X, ancho en Y)
        if (pieza.largo <= rect.largo && pieza.ancho <= rect.ancho) {
          const sobrante = rect.largo * rect.ancho - pieza.largo * pieza.ancho;
          if (sobrante < mejorSobrante) {
            mejorSobrante = sobrante;
            mejorRectIdx = rIdx;
            rotarMejor = false;
          }
        }

        // Opción 2: Rotada a 90 grados (sólo si rotación permitida)
        if (pieza.rotacionPermitida && pieza.ancho <= rect.largo && pieza.largo <= rect.ancho) {
          const sobrante = rect.largo * rect.ancho - pieza.ancho * pieza.largo;
          if (sobrante < mejorSobrante) {
            mejorSobrante = sobrante;
            mejorRectIdx = rIdx;
            rotarMejor = true;
          }
        }
      }

      if (mejorRectIdx !== -1) {
        // Encontramos espacio en esta lámina
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

        // Partición Guillotina en 2 rectángulos libres (Shorter Axis Split)
        const remLargo = rectElegido.largo - piezaLargo - kerf;
        const remAncho = rectElegido.ancho - piezaAncho - kerf;

        // Corte longitudinal o transversal según mejor aprovechamiento
        if (remLargo > 0 && remAncho > 0) {
          if (remLargo >= remAncho) {
            // Corte vertical primero
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
          } else {
            // Corte horizontal primero
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

        if (remLargo > 0) {
          nuevaLam.rectsLibres.push({
            x: rectElegido.x + piezaLargo + kerf,
            y: rectElegido.y,
            largo: remLargo,
            ancho: rectElegido.ancho,
          });
        }
        if (remAncho > 0) {
          nuevaLam.rectsLibres.push({
            x: rectElegido.x,
            y: rectElegido.y + piezaAncho + kerf,
            largo: piezaLargo,
            ancho: remAncho,
          });
        }

        estadosLaminas.push(nuevaLam);
      }
    }
  }

  // 4. Consolidar resultados métricos de cada lámina
  const areaBrutaMm2 = largoBruto * anchoBruto;

  estadosLaminas.forEach((lam, idx) => {
    if (lam.piezasColocadas.length === 0) return;

    let areaUtilizadaMm2 = 0;
    let metrosLineales = (largoBruto * 2 + anchoBruto * 2) / 1000; // Refilado base

    lam.piezasColocadas.forEach((p) => {
      areaUtilizadaMm2 += p.largo * p.ancho;
      metrosLineales += (p.largo + p.ancho) / 1000;
    });

    const porcentajeAprovechamiento = Number(((areaUtilizadaMm2 / areaBrutaMm2) * 100).toFixed(1));
    const porcentajeDesperdicio = Number((100 - porcentajeAprovechamiento).toFixed(1));

    laminas.push({
      indice: idx + 1,
      espesor: espesorTarget,
      material: piezas[0]?.material || `Tablero ${espesorTarget}mm`,
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
