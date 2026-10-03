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
  espesorFiltro: number | null = null,
  tablerosDb: any[] = []
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
  let semillaPrincipal: number | undefined;
  let iteracionesTotales = 0;

  for (const esp of espesoresAProcesar) {
    const piezasDelEspesor = grupos[esp] || [];
    if (piezasDelEspesor.length === 0) continue;

    const conteo = piezasDelEspesor.reduce((acc, p) => acc + p.cantidad, 0);
    totalPiezasProgramadas += conteo;

    // Buscar en la base de datos de tableros si existe un formato configurado para este calibre
    const tableroDb = tablerosDb.find(
      (t) => Math.abs((t.calibreMm ?? 0) - esp) <= 1.5
    );

    // Si estamos optimizando "Todos" los espesores a la vez, cada calibre toma sus dimensiones reales de BD
    // (ej. 15mm y 12mm a 2440x2150 mm, fondos 2.7/3mm a 2800x2100 mm).
    // Si el usuario filtró por un calibre específico y editó la barra, respetamos la config explícita.
    const largoBrutoEsp = (espesorFiltro === null && tableroDb?.largoLaminaMm)
      ? tableroDb.largoLaminaMm
      : config.largoBruto;
    const anchoBrutoEsp = (espesorFiltro === null && tableroDb?.anchoLaminaMm)
      ? tableroDb.anchoLaminaMm
      : config.anchoBruto;

    const configEspesor: ConfiguracionLaminas = {
      ...config,
      largoBruto: largoBrutoEsp,
      anchoBruto: anchoBrutoEsp,
      espesorBruto: esp,
    };

    let laminasEspesor: LaminaResultado[] = [];

    switch (modo) {
      case "seccionadora": {
        const resG = optimizarGuillotina2D(piezasDelEspesor, configEspesor, esp);
        laminasEspesor = resG.laminas;
        if (!semillaPrincipal && resG.semillaGanadora) semillaPrincipal = resG.semillaGanadora;
        iteracionesTotales += resG.totalIteraciones;
        break;
      }
      case "nesting_cnc":
        laminasEspesor = optimizarNestingCNC(piezasDelEspesor, configEspesor, esp);
        iteracionesTotales += 1;
        break;
      case "madera_maciza":
        laminasEspesor = optimizarMaderaMaciza(piezasDelEspesor, configEspesor, esp);
        iteracionesTotales += 1;
        break;
      default: {
        const resG = optimizarGuillotina2D(piezasDelEspesor, configEspesor, esp);
        laminasEspesor = resG.laminas;
        if (!semillaPrincipal && resG.semillaGanadora) semillaPrincipal = resG.semillaGanadora;
        iteracionesTotales += resG.totalIteraciones;
      }
    }

    laminasEspesor.forEach((lam) => {
      totalPiezasUbicadas += lam.piezas.length;
      if (tableroDb?.nombreComercial) {
        lam.material = tableroDb.nombreComercial;
      }
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
    semillaOptimizacion: semillaPrincipal || 127578,
    iteracionesEjecutadas: iteracionesTotales,
    piezasNoColocadas: [],
    totalPiezasProgramadas,
    totalPiezasUbicadas,
  };
}
