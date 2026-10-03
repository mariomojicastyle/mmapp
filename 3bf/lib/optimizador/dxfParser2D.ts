/**
 * =========================================================================================
 * ✂️ 3dBimFab Opti_Nesting — Importador y Parser DXF 2D (Fase 2)
 * Lee archivos ASCII DXF para extraer siluetas curvas y piezas geométricas 2D
 * calculando sus cajas envolventes y vértices perimetrales para Nesting CNC y Madera Maciza.
 * =========================================================================================
 */

import type { PiezaCorte } from "./tiposOptimizador";

interface Polilinea2D {
  nombre: string;
  capa: string;
  vertices: Array<{ x: number; y: number }>;
  cerrada: boolean;
}

/**
 * Parsea un archivo DXF ASCII plano y extrae polilíneas 2D
 */
export function parsearArchivoDXF(contenidoDxf: string): { piezas: PiezaCorte[]; errores: string[] } {
  const lineas = contenidoDxf.split(/\r?\n/).map((l) => l.trim());
  const errores: string[] = [];

  if (lineas.length < 10) {
    return { piezas: [], errores: ["El archivo DXF está vacío o incompleto."] };
  }

  const polilineas: Polilinea2D[] = [];
  let enSeccionEntities = false;

  let i = 0;
  while (i < lineas.length - 1) {
    const code = lineas[i];
    const val = lineas[i + 1];

    if (code === "0" && val === "SECTION") {
      if (lineas[i + 2] === "2" && lineas[i + 3] === "ENTITIES") {
        enSeccionEntities = true;
        i += 4;
        continue;
      }
    }

    if (code === "0" && val === "ENDSEC") {
      enSeccionEntities = false;
      i += 2;
      continue;
    }

    if (enSeccionEntities && code === "0" && (val === "LWPOLYLINE" || val === "POLYLINE")) {
      // Iniciar lectura de polilínea
      const vertices: Array<{ x: number; y: number }> = [];
      let capa = "0";
      let cerrada = false;

      i += 2;
      let currX = 0;
      let tieneX = false;

      while (i < lineas.length - 1 && !(lineas[i] === "0")) {
        const cCode = lineas[i];
        const cVal = lineas[i + 1];

        if (cCode === "8") {
          capa = cVal;
        } else if (cCode === "70") {
          // Flag 1 = Polilínea cerrada
          const flag = parseInt(cVal, 10);
          cerrada = (flag & 1) === 1;
        } else if (cCode === "10") {
          currX = parseFloat(cVal);
          tieneX = true;
        } else if (cCode === "20") {
          if (tieneX) {
            vertices.push({ x: currX, y: parseFloat(cVal) });
            tieneX = false;
          }
        }
        i += 2;
      }

      if (vertices.length >= 2) {
        polilineas.push({
          nombre: `DXF_${capa}_${polilineas.length + 1}`,
          capa,
          vertices,
          cerrada,
        });
      }
      continue;
    }

    i += 2;
  }

  // Si no encontró LWPOLYLINE, buscar líneas agrupadas por capa o devolver error descriptivo
  if (polilineas.length === 0) {
    return {
      piezas: [],
      errores: [
        "No se encontraron polilíneas (LWPOLYLINE) cerradas en la sección ENTITIES del DXF.",
        "Asegúrate de exportar en AutoCAD o Rhino como 'Polilíneas 2D cerradas'.",
      ],
    };
  }

  // Convertir polilíneas en piezas de corte calculando Bounding Box
  const piezas: PiezaCorte[] = [];

  polilineas.forEach((poly, idx) => {
    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;

    poly.vertices.forEach((v) => {
      minX = Math.min(minX, v.x);
      maxX = Math.max(maxX, v.x);
      minY = Math.min(minY, v.y);
      maxY = Math.max(maxY, v.y);
    });

    const largo = Math.max(10, Math.round(maxX - minX));
    const ancho = Math.max(10, Math.round(maxY - minY));

    const PALETA = ["#38BDF8", "#F472B6", "#FBBF24", "#34D399", "#A78BFA", "#FB923C"];
    const colorHex = PALETA[idx % PALETA.length];

    piezas.push({
      id: `dxf_poly_${idx + 1}`,
      nombre: poly.nombre,
      descripcion: `Polilínea DXF en capa [${poly.capa}] (${poly.vertices.length} vértices)`,
      largo: Math.max(largo, ancho),
      ancho: Math.min(largo, ancho),
      espesor: 15, // Por defecto 15mm o configurable
      cantidad: 1,
      rotacionPermitida: true,
      material: "MDF 15mm (DXF)",
      colorHex,
    });
  });

  return { piezas, errores: [] };
}
