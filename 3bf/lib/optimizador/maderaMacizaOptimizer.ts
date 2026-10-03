/**
 * =========================================================================================
 * ✂️ 3dBimFab Opti_Nesting — Motor 3: Madera Maciza & Ebanistería (CILA Jamar)
 * Simulación de aserrado de tablones naturales en listonería y piezas estructurales.
 * Estrategias: Rip-First vs Crosscut-First y cubicación en Pies Tablares (PT).
 * =========================================================================================
 */

import type { 
  PiezaCorte, 
  ConfiguracionLaminas, 
  LaminaResultado, 
  PiezaColocada 
} from "./tiposOptimizador";

/**
 * Fórmula oficial de Pies Tablares (PT) a partir de dimensiones milimétricas:
 * PT = (Espesor_pulg * Ancho_pulg * Largo_pies) / 12
 * Equivalente exacto en mm: (E * A * L) / 2_359_737.2
 */
export function calcularPiesTablares(largoMm: number, anchoMm: number, espesorMm: number): number {
  const volumenMm3 = largoMm * anchoMm * espesorMm;
  return Number((volumenMm3 / 2_359_737.2).toFixed(2));
}

/**
 * Optimiza el despiece de madera maciza sobre tablones comerciales estándar
 */
export function optimizarMaderaMaciza(
  piezas: PiezaCorte[],
  config: ConfiguracionLaminas,
  espesorTarget: number
): LaminaResultado[] {
  const largoTablon = config.largoTablonMm || 3048;   // 10 pies (3048 mm)
  const anchoTablon = config.anchoTablonMm || 203.2;  // 8 pulgadas (203.2 mm)
  const espesorTablon = config.espesorTablonMm || espesorTarget;
  const kerf = config.kerfSierra || 3.5;
  const estrategia = config.estrategiaMadera || "rip_first";

  const ptPorTablonBruto = calcularPiesTablares(largoTablon, anchoTablon, espesorTablon);

  // 1. Expandir piezas
  const piezasExpandidas: Array<{
    id: string;
    nombre: string;
    descripcion?: string;
    largo: number;
    ancho: number;
    rotacionPermitida: boolean;
    colorHex: string;
    ptNeto: number;
  }> = [];

  piezas.forEach((p) => {
    for (let c = 0; c < p.cantidad; c++) {
      piezasExpandidas.push({
        id: `${p.id}_maciza_${c}`,
        nombre: p.nombre,
        descripcion: p.descripcion,
        largo: p.largo,
        ancho: p.ancho,
        rotacionPermitida: p.rotacionPermitida,
        colorHex: p.colorHex || "#F59E0B",
        ptNeto: calcularPiesTablares(p.largo, p.ancho, espesorTarget),
      });
    }
  });

  // Ordenar según la estrategia seleccionada:
  if (estrategia === "rip_first") {
    // Rip-first: Mayor ancho primero para organizar listones longitudinales continuos
    piezasExpandidas.sort((a, b) => b.ancho - a.ancho || b.largo - a.largo);
  } else {
    // Crosscut-first: Mayor largo primero para despuntar y trocear a largo nominal
    piezasExpandidas.sort((a, b) => b.largo - a.largo || b.ancho - a.ancho);
  }

  interface TablonEstado {
    piezasColocadas: PiezaColocada[];
    espacioRestanteLargo: number;
    espacioRestanteAncho: number;
    cursorX: number;
    cursorY: number;
    alturaFilaActual: number;
  }

  const crearNuevoTablon = (): TablonEstado => ({
    piezasColocadas: [],
    espacioRestanteLargo: largoTablon,
    espacioRestanteAncho: anchoTablon,
    cursorX: 0,
    cursorY: 0,
    alturaFilaActual: 0,
  });

  const tablones: TablonEstado[] = [crearNuevoTablon()];

  for (const pieza of piezasExpandidas) {
    let colocada = false;

    for (const tablon of tablones) {
      // Verificar si cabe en la fila actual a lo largo del tablón
      if (tablon.cursorX + pieza.largo <= largoTablon && tablon.cursorY + pieza.ancho <= anchoTablon) {
        tablon.piezasColocadas.push({
          piezaId: pieza.id,
          nombre: pieza.nombre,
          descripcion: pieza.descripcion,
          x: tablon.cursorX,
          y: tablon.cursorY,
          largo: pieza.largo,
          ancho: pieza.ancho,
          rotada: false,
          colorHex: pieza.colorHex,
        });

        tablon.cursorX += pieza.largo + kerf;
        tablon.alturaFilaActual = Math.max(tablon.alturaFilaActual, pieza.ancho);
        colocada = true;
        break;
      }

      // Si no cabe a lo largo, intentar abrir nueva tira/fila en el ancho del tablón
      const nuevoY = tablon.cursorY + tablon.alturaFilaActual + kerf;
      if (pieza.largo <= largoTablon && nuevoY + pieza.ancho <= anchoTablon) {
        tablon.cursorX = 0;
        tablon.cursorY = nuevoY;
        tablon.alturaFilaActual = pieza.ancho;

        tablon.piezasColocadas.push({
          piezaId: pieza.id,
          nombre: pieza.nombre,
          descripcion: pieza.descripcion,
          x: tablon.cursorX,
          y: tablon.cursorY,
          largo: pieza.largo,
          ancho: pieza.ancho,
          rotada: false,
          colorHex: pieza.colorHex,
        });

        tablon.cursorX += pieza.largo + kerf;
        colocada = true;
        break;
      }
    }

    // Si no cupo en ningún tablón existente, abrir un tablón nuevo
    if (!colocada) {
      const nuevoTab = crearNuevoTablon();
      nuevoTab.piezasColocadas.push({
        piezaId: pieza.id,
        nombre: pieza.nombre,
        descripcion: pieza.descripcion,
        x: 0,
        y: 0,
        largo: pieza.largo,
        ancho: pieza.ancho,
        rotada: false,
        colorHex: pieza.colorHex,
      });
      nuevoTab.cursorX = pieza.largo + kerf;
      nuevoTab.alturaFilaActual = pieza.ancho;
      tablones.push(nuevoTab);
    }
  }

  // 4. Consolidar métricas en Pies Tablares
  const areaBrutaTablonMm2 = largoTablon * anchoTablon;
  const resultados: LaminaResultado[] = [];

  tablones.forEach((tab, idx) => {
    if (tab.piezasColocadas.length === 0) return;

    let areaUtilizadaMm2 = 0;
    let ptNetoAcumulado = 0;
    let metrosCorte = (largoTablon * 2 + anchoTablon * 2) / 1000;

    tab.piezasColocadas.forEach((p) => {
      areaUtilizadaMm2 += p.largo * p.ancho;
      ptNetoAcumulado += calcularPiesTablares(p.largo, p.ancho, espesorTarget);
      metrosCorte += (p.largo + p.ancho) / 1000;
    });

    const porcentajeAprovechamiento = Number(((areaUtilizadaMm2 / areaBrutaTablonMm2) * 100).toFixed(1));
    const porcentajeDesperdicio = Number((100 - porcentajeAprovechamiento).toFixed(1));

    resultados.push({
      indice: idx + 1,
      espesor: espesorTarget,
      material: piezas[0]?.material || `Tablón Roble ${espesorTablon}mm`,
      anchoTotal: anchoTablon,
      largoTotal: largoTablon,
      piezas: tab.piezasColocadas,
      areaTotalMm2: areaBrutaTablonMm2,
      areaUtilizadaMm2,
      porcentajeAprovechamiento,
      porcentajeDesperdicio,
      metrosLinealesCorte: Number(metrosCorte.toFixed(1)),
      piesTablaresBrutos: ptPorTablonBruto,
      piesTablaresNetos: Number(ptNetoAcumulado.toFixed(2)),
    });
  });

  return resultados;
}
