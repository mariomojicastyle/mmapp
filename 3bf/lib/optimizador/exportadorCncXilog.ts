/**
 * =========================================================================================
 * ✂️ 3dBimFab Opti_Nesting — Generador y Exportador SCM Morbidelli X200 / Maestro Lab (Fase 3)
 * Genera archivos .xcs compatibles con el entorno Xilog Plus y Maestro Lab
 * para celdas de nesting con mesa de vacío (Serial de referencia: AA10007313).
 * =========================================================================================
 */

import type { LaminaResultado } from "./tiposOptimizador";
import JSZip from "jszip";

interface OpcionesXilog {
  nombreProyecto: string;
  lamina: LaminaResultado;
  diametroFresaMm?: number;
}

interface OpcionesXilogGlobal {
  nombreProyecto: string;
  laminas: LaminaResultado[];
  diametroFresaMm?: number;
}

export function generarTextoXilog({
  nombreProyecto,
  lamina,
  diametroFresaMm = 10.0,
}: OpcionesXilog): string {
  const dx = lamina.largoTotal;
  const dy = lamina.anchoTotal;
  const dz = lamina.espesor;

  const lineas: string[] = [
    `;========================================================`,
    `; 3dBimFab - ARCHIVO XILOG / MAESTRO LAB PARA SCM MORBIDELLI`,
    `; PROYECTO: ${nombreProyecto}`,
    `; FECHA: ${new Date().toISOString()}`,
    `;========================================================`,
    `H DX=${dx} DY=${dy} DZ=${dz} -AB C=0 T=0 R=1 *MM /"DEF"`,
    ``,
  ];

  lamina.piezas.forEach((p, idx) => {
    lineas.push(
      `; --- PIEZA ${idx + 1}: ${p.nombre} (${Math.round(p.largo)}x${Math.round(p.ancho)}mm) ---`,
      `XG0 X=${p.x.toFixed(2)} Y=${p.y.toFixed(2)} Z=25.00 T=101`,
      `XL2P X=${(p.x + p.largo).toFixed(2)} Y=${p.y.toFixed(2)} Z=-${dz.toFixed(2)} V=6000`,
      `XL2P X=${(p.x + p.largo).toFixed(2)} Y=${(p.y + p.ancho).toFixed(2)}`,
      `XL2P X=${p.x.toFixed(2)} Y=${(p.y + p.ancho).toFixed(2)}`,
      `XL2P X=${p.x.toFixed(2)} Y=${p.y.toFixed(2)}`,
      `XG0 Z=25.00`,
      ``
    );
  });

  lineas.push(
    `N X=0 Y=0`,
    `; FIN PROGRAMA MORBIDELLI`
  );

  return lineas.join("\r\n");
}

export function generarYDescargarXilog(opciones: OpcionesXilog): void {
  const textoXcs = generarTextoXilog(opciones);
  const blob = new Blob([textoXcs], { type: "text/plain;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  const nombreLimpio = opciones.nombreProyecto.replace(/[^a-zA-Z0-9_-]/g, "_");
  link.setAttribute("href", url);
  link.setAttribute("download", `${nombreLimpio}_Morbidelli_L${opciones.lamina.indice}_${opciones.lamina.espesor}mm.xcs`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export async function generarYDescargarTodosXilogZip({
  nombreProyecto,
  laminas,
  diametroFresaMm = 10.0,
}: OpcionesXilogGlobal): Promise<void> {
  const nombreLimpio = nombreProyecto.replace(/[^a-zA-Z0-9_-]/g, "_");

  if (laminas.length === 1) {
    generarYDescargarXilog({
      nombreProyecto,
      lamina: laminas[0],
      diametroFresaMm,
    });
    return;
  }

  const zip = new JSZip();
  laminas.forEach((lam) => {
    const texto = generarTextoXilog({
      nombreProyecto,
      lamina: lam,
      diametroFresaMm,
    });
    zip.file(`${nombreLimpio}_Morbidelli_L${lam.indice}_${lam.espesor}mm.xcs`, texto);
  });

  const content = await zip.generateAsync({ type: "blob" });
  const url = URL.createObjectURL(content);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `${nombreLimpio}_Morbidelli_Xilog_Completo.zip`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
