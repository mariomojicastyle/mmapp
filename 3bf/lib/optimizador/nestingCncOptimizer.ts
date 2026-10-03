/**
 * =========================================================================================
 * ✂️ 3dBimFab Opti_Nesting — Motor 2: Celda Nesting CNC (SCM Morbidelli X200 / Mesa de Vacío)
 * Algoritmo de anidado 2D continuo sin restricción de guillotina.
 * Ciclo en 1 amarre: Taladrado previo + Ranuras + Fresado perimetral con fresa de compresión.
 * Detección de piezas pequeñas para puente de sujeción (Onion Skin / Tabs).
 * =========================================================================================
 */

import type { 
  PiezaCorte, 
  ConfiguracionLaminas, 
  LaminaResultado, 
  PiezaColocada,
  LineaCorteVisual
} from "./tiposOptimizador";

/**
 * Optimiza la distribución continua de piezas en mesa de sacrificio para fresado CNC
 */
export function optimizarNestingCNC(
  piezas: PiezaCorte[],
  config: ConfiguracionLaminas,
  espesorTarget: number
): LaminaResultado[] {
  const diametroFresa = config.diametroFresa; // ej. 10 o 12 mm
  const refilado = config.refiladoMargen;     // Margen perimetral de succión
  const largoBruto = config.largoBruto;
  const anchoBruto = config.anchoBruto;

  const margenInterPiezas = diametroFresa + 2; // Espacio de seguridad entre piezas
  const largoUtil = largoBruto - refilado * 2;
  const anchoUtil = anchoBruto - refilado * 2;

  if (largoUtil <= 0 || anchoUtil <= 0) {
    return [];
  }

  // 1. Expandir piezas
  const piezasExpandidas: Array<{
    id: string;
    nombre: string;
    descripcion?: string;
    largo: number;
    ancho: number;
    rotacionPermitida: boolean;
    colorHex: string;
    areaMm2: number;
  }> = [];

  piezas.forEach((p) => {
    for (let c = 0; c < p.cantidad; c++) {
      piezasExpandidas.push({
        id: `${p.id}_cnc_${c}`,
        nombre: p.nombre,
        descripcion: p.descripcion,
        largo: p.largo,
        ancho: p.ancho,
        rotacionPermitida: p.rotacionPermitida,
        colorHex: p.colorHex || "#38BDF8",
        areaMm2: p.largo * p.ancho,
      });
    }
  });

  // 2. Ordenar por área descendente
  piezasExpandidas.sort((a, b) => b.areaMm2 - a.areaMm2);

  interface LaminaCNC {
    piezasColocadas: PiezaColocada[];
  }

  const laminasCNC: LaminaCNC[] = [{ piezasColocadas: [] }];

  // Función de colisión de rectángulos con margen de fresa
  const hayColision = (
    x: number,
    y: number,
    w: number,
    h: number,
    colocadas: PiezaColocada[]
  ): boolean => {
    // Verificar límites útiles del tablero
    if (x + w > largoBruto - refilado || y + h > anchoBruto - refilado) {
      return true;
    }

    // Verificar colisión con piezas ya ubicadas considerando el diámetro de fresa
    for (const p of colocadas) {
      const colisionX = x < p.x + p.largo + margenInterPiezas && x + w + margenInterPiezas > p.x;
      const colisionY = y < p.y + p.ancho + margenInterPiezas && y + h + margenInterPiezas > p.y;
      if (colisionX && colisionY) {
        return true;
      }
    }
    return false;
  };

  // 3. Algoritmo de anidado 2D Bottom-Left con escaneo de esquinas
  for (const pieza of piezasExpandidas) {
    let colocada = false;

    for (const lam of laminasCNC) {
      // Generar puntos de anclaje (coordenadas candidatas de esquinas libres)
      const puntosCandidatos: Array<{ x: number; y: number }> = [
        { x: refilado, y: refilado }
      ];

      for (const p of lam.piezasColocadas) {
        puntosCandidatos.push(
          { x: p.x + p.largo + margenInterPiezas, y: p.y },
          { x: p.x, y: p.y + p.ancho + margenInterPiezas },
          { x: p.x + p.largo + margenInterPiezas, y: p.y + p.ancho + margenInterPiezas },
          { x: refilado, y: p.y + p.ancho + margenInterPiezas },
          { x: p.x + p.largo + margenInterPiezas, y: refilado }
        );
      }

      // Ordenar puntos candidatos: Priorizar primero X menor, luego Y menor (Bottom-Left)
      puntosCandidatos.sort((a, b) => a.x - b.x || a.y - b.y);

      for (const pt of puntosCandidatos) {
        // Opción 1: Sin rotar
        if (!hayColision(pt.x, pt.y, pieza.largo, pieza.ancho, lam.piezasColocadas)) {
          const areaM2 = (pieza.largo * pieza.ancho) / 1_000_000;
          lam.piezasColocadas.push({
            piezaId: pieza.id,
            nombre: pieza.nombre,
            descripcion: pieza.descripcion,
            x: pt.x,
            y: pt.y,
            largo: pieza.largo,
            ancho: pieza.ancho,
            rotada: false,
            colorHex: pieza.colorHex,
            requiereOnionSkin: areaM2 < 0.08, // Si mide menos de 0.08 m2 requiere puente de succión
          });
          colocada = true;
          break;
        }

        // Opción 2: Rotada 90° (si está permitida la rotación)
        if (pieza.rotacionPermitida && !hayColision(pt.x, pt.y, pieza.ancho, pieza.largo, lam.piezasColocadas)) {
          const areaM2 = (pieza.largo * pieza.ancho) / 1_000_000;
          lam.piezasColocadas.push({
            piezaId: pieza.id,
            nombre: pieza.nombre,
            descripcion: pieza.descripcion,
            x: pt.x,
            y: pt.y,
            largo: pieza.ancho,
            ancho: pieza.largo,
            rotada: true,
            colorHex: pieza.colorHex,
            requiereOnionSkin: areaM2 < 0.08,
          });
          colocada = true;
          break;
        }
      }

      if (colocada) break;
    }

    // Si no cupo en ninguna lámina existente, añadir una lámina nueva
    if (!colocada) {
      const nuevaLam: LaminaCNC = { piezasColocadas: [] };
      const areaM2 = (pieza.largo * pieza.ancho) / 1_000_000;
      nuevaLam.piezasColocadas.push({
        piezaId: pieza.id,
        nombre: pieza.nombre,
        descripcion: pieza.descripcion,
        x: refilado,
        y: refilado,
        largo: pieza.largo,
        ancho: pieza.ancho,
        rotada: false,
        colorHex: pieza.colorHex,
        requiereOnionSkin: areaM2 < 0.08,
      });
      laminasCNC.push(nuevaLam);
    }
  }

  // 4. Consolidar métricas de cada lámina
  const areaBrutaMm2 = largoBruto * anchoBruto;
  const laminas: LaminaResultado[] = [];

  laminasCNC.forEach((lam, idx) => {
    if (lam.piezasColocadas.length === 0) return;

    let areaUtilizadaMm2 = 0;
    let metrosLinealesFresa = (largoBruto * 2 + anchoBruto * 2) / 1000;

    lam.piezasColocadas.forEach((p) => {
      areaUtilizadaMm2 += p.largo * p.ancho;
      // Perímetro completo de corte de fresa por cada pieza
      metrosLinealesFresa += (p.largo * 2 + p.ancho * 2) / 1000;
    });

    const porcentajeAprovechamiento = Number(((areaUtilizadaMm2 / areaBrutaMm2) * 100).toFixed(1));
    const porcentajeDesperdicio = Number((100 - porcentajeAprovechamiento).toFixed(1));

    laminas.push({
      indice: idx + 1,
      espesor: espesorTarget,
      material: piezas[0]?.material || `Tablero CNC ${espesorTarget}mm`,
      anchoTotal: anchoBruto,
      largoTotal: largoBruto,
      piezas: lam.piezasColocadas,
      areaTotalMm2: areaBrutaMm2,
      areaUtilizadaMm2,
      porcentajeAprovechamiento,
      porcentajeDesperdicio,
      metrosLinealesCorte: Number(metrosLinealesFresa.toFixed(1)),
    });
  });

  return laminas;
}
