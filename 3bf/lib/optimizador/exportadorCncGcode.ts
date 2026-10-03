/**
 * =========================================================================================
 * ✂️ 3dBimFab Opti_Nesting — Generador y Exportador de Código G-Code Industrial (Fase 3)
 * Genera archivos .nc para routers y centros de mecanizado CNC
 * con velocidades de avance F6000, husillo 18000 RPM, retracciones seguras y soporte Onion Skin.
 * =========================================================================================
 */

import type { LaminaResultado } from "./tiposOptimizador";
import JSZip from "jszip";

interface OpcionesGcode {
  nombreProyecto: string;
  lamina: LaminaResultado;
  diametroFresaMm?: number;
  velocidadHusilloRpm?: number;
  avanceCorteMmMini?: number;
}

interface OpcionesGcodeGlobal {
  nombreProyecto: string;
  laminas: LaminaResultado[];
  diametroFresaMm?: number;
  velocidadHusilloRpm?: number;
  avanceCorteMmMini?: number;
}

export function generarTextoGcode({
  nombreProyecto,
  lamina,
  diametroFresaMm = 10.0,
  velocidadHusilloRpm = 18000,
  avanceCorteMmMini = 6000,
}: OpcionesGcode): string {
  const radioFresa = diametroFresaMm / 2;
  const zSeguro = 25.0;
  const zPenetracion = -(lamina.espesor + 0.5); // 0.5mm dentro del tablero de sacrificio
  const fecha = new Date().toISOString().split("T")[0];

  const lineas: string[] = [
    `%`,
    `(====================================================)`,
    `( 3dBimFab SUITE - PROGRAMA G-CODE DE CORTE CNC      )`,
    `( PROYECTO: ${nombreProyecto.toUpperCase()}          )`,
    `( LAMINA: ${lamina.indice} | ESPESOR: ${lamina.espesor} mm   )`,
    `( MATERIAL: ${lamina.material}                      )`,
    `( HERRAMIENTA: FRESA COMPRESION D=${diametroFresaMm}mm )`,
    `( FECHA: ${fecha}                                    )`,
    `(====================================================)`,
    `G21 (Unidades metricas mm)`,
    `G90 (Modo coordenadas absolutas)`,
    `G17 (Plano de trabajo XY)`,
    `G94 (Avance en mm por minuto)`,
    `G00 Z${zSeguro.toFixed(1)} (Subir a cota de seguridad)`,
    `M03 S${velocidadHusilloRpm} (Encender husillo en sentido horario)`,
    `G04 P2.0 (Pausa de 2 segundos para estabilizacion de RPM)`,
    ``,
  ];

  lamina.piezas.forEach((p, idx) => {
    // Coordenadas del contorno con compensación externa de fresa
    const x0 = p.x - radioFresa;
    const y0 = p.y - radioFresa;
    const x1 = p.x + p.largo + radioFresa;
    const y1 = p.y + p.ancho + radioFresa;

    const zFinal = p.requiereOnionSkin ? -(lamina.espesor - 0.8) : zPenetracion;

    lineas.push(
      `( --- PIEZA ${idx + 1}: ${p.nombre} [${Math.round(p.largo)}x${Math.round(p.ancho)}mm] --- )`,
      `G00 X${x0.toFixed(2)} Y${y0.toFixed(2)} (Aproximacion rapida)`,
      `G00 Z3.0 (Aproximacion superficial)`,
      `G01 Z${zFinal.toFixed(2)} F1500 (Penetracion vertical en material)`,
      `G01 X${x1.toFixed(2)} Y${y0.toFixed(2)} F${avanceCorteMmMini} (Corte lado 1)`,
      `G01 X${x1.toFixed(2)} Y${y1.toFixed(2)} (Corte lado 2)`,
      `G01 X${x0.toFixed(2)} Y${y1.toFixed(2)} (Corte lado 3)`,
      `G01 X${x0.toFixed(2)} Y${y0.toFixed(2)} (Cierre perimetral)`,
      `G00 Z${zSeguro.toFixed(1)} (Retraccion segura)`,
      ``
    );
  });

  lineas.push(
    `(====================================================)`,
    `( FIN DEL PROGRAMA DE MECANIZADO                     )`,
    `(====================================================)`,
    `M05 (Apagar husillo)`,
    `G00 X0.00 Y0.00 Z${zSeguro.toFixed(1)} (Retorno a origen de maquina)`,
    `M30 (Fin de ejecucion)`,
    `%`
  );

  return lineas.join("\r\n");
}

export function generarYDescargarGcode(opciones: OpcionesGcode): void {
  const textoGcode = generarTextoGcode(opciones);
  const blob = new Blob([textoGcode], { type: "text/plain;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  const nombreLimpio = opciones.nombreProyecto.replace(/[^a-zA-Z0-9_-]/g, "_");
  link.setAttribute("href", url);
  link.setAttribute("download", `${nombreLimpio}_Lamina_${opciones.lamina.indice}_${opciones.lamina.espesor}mm.nc`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export async function generarYDescargarTodosGcodeZip({
  nombreProyecto,
  laminas,
  diametroFresaMm = 10.0,
  velocidadHusilloRpm = 18000,
  avanceCorteMmMini = 6000,
}: OpcionesGcodeGlobal): Promise<void> {
  const nombreLimpio = nombreProyecto.replace(/[^a-zA-Z0-9_-]/g, "_");

  if (laminas.length === 1) {
    generarYDescargarGcode({
      nombreProyecto,
      lamina: laminas[0],
      diametroFresaMm,
      velocidadHusilloRpm,
      avanceCorteMmMini,
    });
    return;
  }

  const zip = new JSZip();
  laminas.forEach((lam) => {
    const texto = generarTextoGcode({
      nombreProyecto,
      lamina: lam,
      diametroFresaMm,
      velocidadHusilloRpm,
      avanceCorteMmMini,
    });
    zip.file(`${nombreLimpio}_Lamina_${lam.indice}_${lam.espesor}mm.nc`, texto);
  });

  const content = await zip.generateAsync({ type: "blob" });
  const url = URL.createObjectURL(content);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `${nombreLimpio}_GCode_CNC_Completo.zip`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
