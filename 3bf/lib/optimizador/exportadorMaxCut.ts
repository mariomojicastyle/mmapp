/**
 * =========================================================================================
 * ✂️ 3dBimFab Opti_Nesting — Exportador Directo a MaxCut (CSV Universal)
 * Genera y descarga un archivo CSV optimizado para la importación directa en MaxCut
 * (Edición Comunitaria y Pro), con codificación UTF-8 con BOM para evitar errores de tildes.
 * =========================================================================================
 */

export interface PiezaMaxCutItem {
  nombre?: string;
  descripcion?: string;
  largo: number | string;
  ancho: number | string;
  espesor?: number | string;
  cantidad: number | string;
  material?: string;
  rotacionPermitida?: boolean;
}

export interface ExportarMaxCutOptions {
  nombreProyecto?: string;
  piezas: PiezaMaxCutItem[];
  formato?: "espanol" | "ingles";
}

/**
 * Genera el texto CSV formateado para MaxCut
 */
export function generarMaxCutCsvContent(
  piezas: PiezaMaxCutItem[],
  formato: "espanol" | "ingles" = "espanol"
): string {
  const encabezado =
    formato === "ingles"
      ? "Name,Length,Width,Thickness,Quantity,Material,CanRotate,Notes"
      : "Nombre,Longitud,Ancho,Espesor,Cantidad,Material,Girar,Notas";

  const lineas: string[] = [encabezado];

  for (const p of piezas) {
    const nombre = (p.nombre || "Pieza").replace(/,/g, " ").trim();
    const largo = Math.round(Number(p.largo) * 10) / 10;
    const ancho = Math.round(Number(p.ancho) * 10) / 10;
    const espesor = Math.round(Number(p.espesor || 15) * 10) / 10;
    const cantidad = Math.max(1, Math.round(Number(p.cantidad) || 1));
    
    // Normalizar material limpio
    let mat = (p.material || "").replace(/,/g, " ").trim();
    if (!mat) {
      mat = espesor <= 3 ? "MDF 3mm" : espesor <= 12 ? "MDP 12mm" : "MDP 15mm";
    }

    const girar = formato === "ingles" ? (p.rotacionPermitida ? "True" : "False") : (p.rotacionPermitida ? "Si" : "No");
    const notas = (p.descripcion || "").replace(/,/g, " ").trim();

    lineas.push(`${nombre},${largo},${ancho},${espesor},${cantidad},${mat},${girar},${notas}`);
  }

  return lineas.join("\r\n");
}

/**
 * Dispara la descarga del archivo CSV para MaxCut en el navegador
 */
export function descargarMaxCutCsv(opciones: ExportarMaxCutOptions) {
  if (!opciones.piezas || opciones.piezas.length === 0) {
    console.warn("No hay piezas disponibles para exportar a MaxCut.");
    return;
  }

  const formato = opciones.formato || "espanol";
  const contenido = generarMaxCutCsvContent(opciones.piezas, formato);

  // Inyectar byte-order-mark (\uFEFF) para que Excel y MaxCut en Windows lean caracteres latinos
  const blob = new Blob(["\uFEFF" + contenido], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  const nombreLimpio = (opciones.nombreProyecto || "3dBimFab_Corte").replace(/[^a-zA-Z0-9_\-]/g, "_");
  a.href = url;
  a.download = `${nombreLimpio}_MaxCut.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
