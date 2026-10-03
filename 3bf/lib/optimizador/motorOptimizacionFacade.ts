/**
 * =========================================================================================
 * ✂️ 3dBimFab Opti_Nesting — Fachada Unificadora de Motores de Optimización
 * Despacha el cálculo hacia el motor correspondiente según el Modo de Corte seleccionado
 * (Seccionadora Guillotina, Celda Nesting CNC Morbidelli o Madera Maciza).
 * =========================================================================================
 */

import type { 
  ModoOptimizacion, 
  PiezaCorte, 
  ConfiguracionLaminas, 
  LaminaResultado, 
  ResultadoOptimizacionGlobal 
} from "./tiposOptimizador";
import { agruparPiezasPorEspesor } from "./extractorPiezasModelo";
import { optimizarGuillotina2D } from "./guillotineOptimizer";
import { optimizarNestingCNC } from "./nestingCncOptimizer";
import { optimizarMaderaMaciza } from "./maderaMacizaOptimizer";

/**
 * Ejecuta el cálculo completo de optimización de materiales
 */
export function ejecutarOptimizacionGlobal(
  modo: ModoOptimizacion,
  todasLasPiezas: PiezaCorte[],
  config: ConfiguracionLaminas,
  espesorFiltro: number | null = null
): ResultadoOptimizacionGlobal {
  const inicioMs = performance.now();

  if (!todasLasPiezas || todasLasPiezas.length === 0) {
    return {
      modo,
      laminas: [],
      totalLaminas: 0,
      aprovechamientoPromedio: 0,
      tiempoCalculoMs: 0,
      piezasNoColocadas: [],
      totalPiezasProgramadas: 0,
      totalPiezasUbicadas: 0,
    };
  }

  // Filtrar o agrupar por espesor
  const grupos = agruparPiezasPorEspesor(todasLasPiezas);
  const espesoresAProcesar = espesorFiltro 
    ? [espesorFiltro] 
    : Object.keys(grupos).map(Number).sort((a, b) => b - a); // Espesores gruesos primero (ej. 15mm, 12mm...)

  const todasLasLaminas: LaminaResultado[] = [];
  let totalPiezasProgramadas = 0;
  let totalPiezasUbicadas = 0;

  for (const esp of espesoresAProcesar) {
    const piezasDelEspesor = grupos[esp] || [];
    if (piezasDelEspesor.length === 0) continue;

    const conteo = piezasDelEspesor.reduce((acc, p) => acc + p.cantidad, 0);
    totalPiezasProgramadas += conteo;

    let laminasEspesor: LaminaResultado[] = [];

    switch (modo) {
      case "seccionadora":
        laminasEspesor = optimizarGuillotina2D(piezasDelEspesor, config, esp);
        break;
      case "nesting_cnc":
        laminasEspesor = optimizarNestingCNC(piezasDelEspesor, config, esp);
        break;
      case "madera_maciza":
        laminasEspesor = optimizarMaderaMaciza(piezasDelEspesor, config, esp);
        break;
      default:
        laminasEspesor = optimizarGuillotina2D(piezasDelEspesor, config, esp);
    }

    laminasEspesor.forEach((lam) => {
      totalPiezasUbicadas += lam.piezas.length;
    });

    todasLasLaminas.push(...laminasEspesor);
  }

  // Renumerar los índices de láminas correlativamente
  todasLasLaminas.forEach((lam, idx) => {
    lam.indice = idx + 1;
  });

  const aprovechamientoPromedio = todasLasLaminas.length > 0
    ? Number(
        (
          todasLasLaminas.reduce((acc, l) => acc + l.porcentajeAprovechamiento, 0) /
          todasLasLaminas.length
        ).toFixed(1)
      )
    : 0;

  const finMs = performance.now();
  const tiempoCalculoMs = Number((finMs - inicioMs).toFixed(1));

  return {
    modo,
    laminas: todasLasLaminas,
    totalLaminas: todasLasLaminas.length,
    aprovechamientoPromedio,
    tiempoCalculoMs,
    piezasNoColocadas: [],
    totalPiezasProgramadas,
    totalPiezasUbicadas,
  };
}
