/**
 * =========================================================================================
 * ✂️ 3dBimFab Opti_Nesting — Exportador Directo a Deepnest (DXF / SVG 2D)
 * Genera archivos vectoriales 2D (DXF R2000 y SVG Nativo con polígonos cerrados en mm)
 * para importación directa en Deepnest (libnest2d / CNC 2D Nesting).
 * =========================================================================================
 */

import type { PiezaCorte, ConfiguracionLaminas } from "./tiposOptimizador";

export interface ExportarDeepnestOptions {
  nombreProyecto?: string;
  piezas: PiezaCorte[];
  configuracion: ConfiguracionLaminas;
  incluirLoteCompleto?: boolean; // true = multiplica piezas por cantidad; false = piezas maestras
}

/**
 * Genera un archivo SVG Nativo Puro (con polígonos cerrados y cotas en mm)
 * IMPORTANTE: Deepnest lee SVG de forma nativa sin requerir servidor externo de conversión,
 * evitando el error "There was an Error while converting".
 */
export function generarDeepnestSvgContent(
  piezas: PiezaCorte[],
  config: ConfiguracionLaminas,
  incluirLoteCompleto: boolean = true
): string {
  const largoLamina = config.largoBruto || 2440;
  const anchoLamina = config.anchoBruto || 1830;
  const separacion = 40; // mm entre piezas

  let cursorX = largoLamina + 150;
  let cursorY = 0;
  let filaMaxAlto = 0;
  const anchoMaxArea = 8000;
  let maxExtentX = cursorX;
  let maxExtentY = anchoLamina;

  const poligonosPiezas: string[] = [];

  for (const pieza of piezas) {
    const repeticiones = incluirLoteCompleto ? Math.max(1, Math.round(pieza.cantidad || 1)) : 1;
    const pLargo = Math.max(pieza.largo, pieza.ancho);
    const pAncho = Math.min(pieza.largo, pieza.ancho);
    const nombreLimpio = (pieza.nombre || "Pieza").replace(/[^a-zA-Z0-9_\-]/g, "_");

    for (let r = 0; r < repeticiones; r++) {
      if (cursorX + pLargo > anchoMaxArea) {
        cursorX = largoLamina + 150;
        cursorY += filaMaxAlto + separacion;
        filaMaxAlto = 0;
      }

      const x0 = cursorX;
      const y0 = cursorY;
      const x1 = cursorX + pLargo;
      const y1 = cursorY + pAncho;

      poligonosPiezas.push(
        `    <polygon id="${nombreLimpio}_${r + 1}" points="${x0},${y0} ${x1},${y0} ${x1},${y1} ${x0},${y1}" fill="#F0FDFA" stroke="#0088AA" stroke-width="1.5" />`
      );

      cursorX += pLargo + separacion;
      if (cursorX > maxExtentX) maxExtentX = cursorX;
      if (pAncho > filaMaxAlto) filaMaxAlto = pAncho;
    }
  }

  maxExtentY = Math.max(maxExtentY, cursorY + filaMaxAlto + 200);
  maxExtentX += 200;

  return `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<svg xmlns="http://www.w3.org/2000/svg" version="1.1" width="${maxExtentX}mm" height="${maxExtentY}mm" viewBox="0 0 ${maxExtentX} ${maxExtentY}">
  <title>3dBimFab - Despiece para Deepnest</title>
  <!-- Lámina Contenedora (Marcar como Sheet en Deepnest) -->
  <g id="SHEET_LAYER">
    <polygon id="LAMINA_CONTENEDORA" points="0,0 ${largoLamina},0 ${largoLamina},${anchoLamina} 0,${anchoLamina}" fill="none" stroke="#DC2626" stroke-width="3" />
  </g>
  <!-- Piezas a Anidar -->
  <g id="PARTS_LAYER">
${poligonosPiezas.join("\n")}
  </g>
</svg>`;
}

/**
 * Genera un archivo DXF ASCII (AutoCAD 2000 / AC1015) con:
 * 1. Contorno cerrado de la Lámina Bruta (Capa: SHEET_LAMINA)
 * 2. Contornos cerrados de todas las piezas (Capa: PARTS_PIEZAS) organizadas en retícula
 */
export function generarDeepnestDxfContent(
  piezas: PiezaCorte[],
  config: ConfiguracionLaminas,
  incluirLoteCompleto: boolean = true
): string {
  const lineas: string[] = [];

  // 1. Encabezado DXF con unidades en Milímetros ($INSUNITS = 4)
  lineas.push("0", "SECTION", "2", "HEADER");
  lineas.push("9", "$ACADVER", "1", "AC1015");
  lineas.push("9", "$INSUNITS", "70", "4"); // 4 = Milímetros
  lineas.push("0", "ENDSEC");

  // 2. Sección TABLES (Capas)
  lineas.push("0", "SECTION", "2", "TABLES");
  lineas.push("0", "TABLE", "2", "LAYER", "70", "2");
  
  // Capa SHEET (Lámina / Contenedor)
  lineas.push("0", "LAYER", "2", "SHEET_LAMINA", "70", "0", "62", "1", "6", "CONTINUOUS"); // 62 = 1 (Rojo)
  // Capa PARTS (Piezas a cortar)
  lineas.push("0", "LAYER", "2", "PARTS_PIEZAS", "70", "0", "62", "4", "6", "CONTINUOUS"); // 62 = 4 (Cyan)
  
  lineas.push("0", "ENDTAB");
  lineas.push("0", "ENDSEC");

  // 3. Sección BLOCKS (Vacía pero requerida por R2000)
  lineas.push("0", "SECTION", "2", "BLOCKS");
  lineas.push("0", "ENDSEC");

  // 4. Sección ENTITIES
  lineas.push("0", "SECTION", "2", "ENTITIES");

  let handleCounter = 100;
  const nextHandle = () => (handleCounter++).toString(16).toUpperCase();

  // Helper para escribir una LWPOLYLINE rectangular cerrada
  const escribirRectanguloDxf = (
    capa: string,
    x: number,
    y: number,
    ancho: number,
    alto: number
  ) => {
    lineas.push("0", "LWPOLYLINE");
    lineas.push("5", nextHandle());
    lineas.push("8", capa);
    lineas.push("90", "4"); // 4 vértices
    lineas.push("70", "1"); // 1 = cerrada (CLOSED)
    lineas.push("43", "0.0"); // Grosor constante 0

    // Vértice 1: (x, y)
    lineas.push("10", x.toFixed(2), "20", y.toFixed(2));
    // Vértice 2: (x + ancho, y)
    lineas.push("10", (x + ancho).toFixed(2), "20", y.toFixed(2));
    // Vértice 3: (x + ancho, y + alto)
    lineas.push("10", (x + ancho).toFixed(2), "20", (y + alto).toFixed(2));
    // Vértice 4: (x, y + alto)
    lineas.push("10", x.toFixed(2), "20", (y + alto).toFixed(2));
  };

  // A. Escribir Lámina Contenedora (Origen 0,0)
  const largoLamina = config.largoBruto || 2440;
  const anchoLamina = config.anchoBruto || 1830;
  escribirRectanguloDxf("SHEET_LAMINA", 0, 0, largoLamina, anchoLamina);

  // B. Escribir Piezas organizadas a la derecha de la lámina
  const separacion = 50; // mm entre piezas en el archivo DXF antes de anidar
  let cursorX = largoLamina + 200; // Comenzar a la derecha del tablero
  let cursorY = 0;
  let filaMaxAlto = 0;
  const anchoMaxColumna = largoLamina; // Empezar nueva fila al pasar este ancho

  for (const pieza of piezas) {
    const repeticiones = incluirLoteCompleto ? Math.max(1, Math.round(pieza.cantidad || 1)) : 1;
    const pLargo = Math.max(pieza.largo, pieza.ancho);
    const pAncho = Math.min(pieza.largo, pieza.ancho);

    for (let r = 0; r < repeticiones; r++) {
      if (cursorX + pLargo > largoLamina + 200 + anchoMaxColumna) {
        cursorX = largoLamina + 200;
        cursorY += filaMaxAlto + separacion;
        filaMaxAlto = 0;
      }

      escribirRectanguloDxf("PARTS_PIEZAS", cursorX, cursorY, pLargo, pAncho);

      cursorX += pLargo + separacion;
      if (pAncho > filaMaxAlto) {
        filaMaxAlto = pAncho;
      }
    }
  }

  // Cierre de ENTITIES y Fin de Archivo
  lineas.push("0", "ENDSEC");
  lineas.push("0", "EOF");

  return lineas.join("\r\n");
}

/**
 * Dispara la descarga del archivo DXF formateado para Deepnest
 */
export function descargarDeepnestDxf(opciones: ExportarDeepnestOptions) {
  if (!opciones.piezas || opciones.piezas.length === 0) {
    console.warn("No hay piezas disponibles para exportar a Deepnest.");
    return;
  }

  const contenido = generarDeepnestDxfContent(
    opciones.piezas,
    opciones.configuracion,
    opciones.incluirLoteCompleto ?? true
  );

  const blob = new Blob([contenido], { type: "application/dxf;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  const nombreLimpio = (opciones.nombreProyecto || "3dBimFab_Nesting").replace(/[^a-zA-Z0-9_\-]/g, "_");
  
  a.href = url;
  a.download = `${nombreLimpio}_Deepnest.dxf`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Dispara la descarga del archivo SVG nativo formateado para Deepnest (100% compatible sin servidor de conversión)
 */
export function descargarDeepnestSvg(opciones: ExportarDeepnestOptions) {
  if (!opciones.piezas || opciones.piezas.length === 0) {
    console.warn("No hay piezas disponibles para exportar a Deepnest.");
    return;
  }

  const contenido = generarDeepnestSvgContent(
    opciones.piezas,
    opciones.configuracion,
    opciones.incluirLoteCompleto ?? true
  );

  const blob = new Blob([contenido], { type: "image/svg+xml;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  const nombreLimpio = (opciones.nombreProyecto || "3dBimFab_Nesting").replace(/[^a-zA-Z0-9_\-]/g, "_");
  
  a.href = url;
  a.download = `${nombreLimpio}_Deepnest.svg`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
