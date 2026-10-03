"use client";

import React, { useRef, useEffect, useState, useCallback } from "react";
import { useOptimizadorStore } from "@/lib/optimizador/useOptimizadorStore";
import { use3BFStore } from "@/lib/store";
import type { LaminaResultado, PiezaColocada } from "@/lib/optimizador/tiposOptimizador";
import { ZoomIn, ZoomOut, RotateCcw, ChevronLeft, ChevronRight, Layers } from "lucide-react";

interface Props {
  lamina: LaminaResultado | null;
  totalLaminas: number;
}

export default function VisorLaminasCanvas({ lamina, totalLaminas }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const { laminaActivaIndex, setLaminaActivaIndex, modoActivo, zoomCanvas, setZoomCanvas, resetearZoom } = useOptimizadorStore();
  const { coloresApariencia, esquemaColor } = use3BFStore();

  const esOscuro = esquemaColor === "oscuro";
  const [hoveredPieza, setHoveredPieza] = useState<PiezaColocada | null>(null);

  // Renderizado en Canvas 2D
  const dibujarCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !lamina) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // 1. Limpiar fondo del lienzo
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = esOscuro ? "#0B0F17" : "#F8FAFC";
    ctx.fillRect(0, 0, width, height);

    // 2. Calcular escala de ajuste para centrar la lámina
    const padding = 40;
    const escalaX = (width - padding * 2) / lamina.largoTotal;
    const escalaY = (height - padding * 2) / lamina.anchoTotal;
    const escalaBase = Math.min(escalaX, escalaY) * zoomCanvas;

    const canvasLargo = lamina.largoTotal * escalaBase;
    const canvasAncho = lamina.anchoTotal * escalaBase;

    const offsetX = (width - canvasLargo) / 2;
    const offsetY = (height - canvasAncho) / 2;

    // 3. Dibujar tablero bruto (Lámina Base)
    ctx.save();
    ctx.translate(offsetX, offsetY);

    // Fondo del tablero (madera/aglomerado sintético)
    ctx.fillStyle = esOscuro ? "#1E293B" : "#F1F5F9";
    ctx.fillRect(0, 0, canvasLargo, canvasAncho);

    // Borde exterior del tablero
    ctx.strokeStyle = esOscuro ? "#475569" : "#94A3B8";
    ctx.lineWidth = 2;
    ctx.strokeRect(0, 0, canvasLargo, canvasAncho);

    // 4. Dibujar líneas de corte guillotina si existen
    if (modoActivo === "seccionadora" && lamina.lineasCorte) {
      ctx.strokeStyle = "#EF444488"; // Rojo semitransparente
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 4]);

      lamina.lineasCorte.forEach((l) => {
        ctx.beginPath();
        ctx.moveTo(l.x1 * escalaBase, l.y1 * escalaBase);
        ctx.lineTo(l.x2 * escalaBase, l.y2 * escalaBase);
        ctx.stroke();
      });
      ctx.setLineDash([]);
    }

    // 4.1. Marca de agua / Rótulo de Material en la esquina de la lámina bruta
    ctx.save();
    ctx.fillStyle = esOscuro ? "rgba(148, 163, 184, 0.4)" : "rgba(100, 116, 139, 0.4)";
    ctx.font = "bold 13px sans-serif";
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.fillText(`${lamina.material}  [${lamina.largoTotal} × ${lamina.anchoTotal} × ${lamina.espesor} mm]`, 14, 12);
    ctx.restore();

    // 5. Dibujar cada pieza colocada
    lamina.piezas.forEach((p) => {
      const px = p.x * escalaBase;
      const py = p.y * escalaBase;
      const pw = p.largo * escalaBase;
      const ph = p.ancho * escalaBase;

      const isHovered = hoveredPieza?.piezaId === p.piezaId;

      // Relleno de la pieza con su color
      ctx.fillStyle = p.colorHex;
      ctx.fillRect(px, py, pw, ph);

      // Sombreado sutil o resaltado en hover
      if (isHovered) {
        ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
        ctx.fillRect(px, py, pw, ph);
      }

      // Veta simulada (líneas finas longitudinales)
      ctx.save();
      ctx.strokeStyle = "rgba(0, 0, 0, 0.08)";
      ctx.lineWidth = 1;
      const lineasVeta = Math.floor(ph / 12);
      for (let v = 1; v < lineasVeta; v++) {
        const vy = py + v * 12;
        ctx.beginPath();
        ctx.moveTo(px, vy);
        ctx.lineTo(px + pw, vy);
        ctx.stroke();
      }
      ctx.restore();

      // Borde de la pieza
      ctx.strokeStyle = isHovered ? "#0284C7" : (esOscuro ? "#334155" : "#64748B");
      ctx.lineWidth = isHovered ? 2.5 : 1.2;
      ctx.strokeRect(px, py, pw, ph);

      // Si es celda CNC y requiere Onion Skin, dibujar un indicador visual
      if (p.requiereOnionSkin && modoActivo === "nesting_cnc") {
        ctx.fillStyle = "#E11D48";
        ctx.beginPath();
        ctx.arc(px + 8, py + 8, 4, 0, Math.PI * 2);
        ctx.fill();
      }

// Trunca el texto con puntos suspensivos (...) de forma exacta según el ancho disponible en píxeles del Canvas
function truncarConPuntos(ctx: CanvasRenderingContext2D, texto: string, maxAncho: number): string {
  if (!texto || maxAncho <= 0) return "";
  if (ctx.measureText(texto).width <= maxAncho) {
    return texto;
  }
  let recortado = texto;
  while (recortado.length > 0 && ctx.measureText(recortado + "...").width > maxAncho) {
    recortado = recortado.slice(0, -1);
  }
  return recortado.length > 0 ? recortado + "..." : "";
}

      // Rótulo tipográfico centrado con autoescalado dinámico y truncamiento limpio con tres puntos (...)
      if (pw > 18 && ph > 12) {
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";

        const textoNombre = p.nombre;
        const textoDesc = p.descripcion && p.descripcion !== p.nombre ? p.descripcion : "";
        const textoMedidas = `${Math.round(p.largo)} × ${Math.round(p.ancho)}`;
        const anchoMaximoTexto = Math.max(10, pw - 6);

        if (ph >= 46 && pw >= 50) {
          // Espacio amplio: 3 líneas o 2 líneas
          const fontTam1 = Math.max(9, Math.min(13, ph / 4.2));
          const fontTam2 = Math.max(8, Math.min(11, ph / 4.8));
          const fontTam3 = Math.max(8, Math.min(10, ph / 5));

          if (textoDesc) {
            ctx.fillStyle = "#0F172A";
            ctx.font = `bold ${fontTam1}px sans-serif`;
            const nombreMostrado = truncarConPuntos(ctx, textoNombre, anchoMaximoTexto);
            ctx.fillText(nombreMostrado, px + pw / 2, py + ph / 2 - 13);

            ctx.fillStyle = "#0369A1"; // Azul Tech Ethos para la descripción
            ctx.font = `bold ${fontTam2}px sans-serif`;
            const descMostrada = truncarConPuntos(ctx, textoDesc, anchoMaximoTexto);
            ctx.fillText(descMostrada, px + pw / 2, py + ph / 2);

            ctx.fillStyle = "#475569";
            ctx.font = `${fontTam3}px monospace`;
            ctx.fillText(textoMedidas, px + pw / 2, py + ph / 2 + 13);
          } else {
            // Solo nombre y medidas en 2 líneas
            ctx.fillStyle = "#0F172A";
            ctx.font = `bold ${fontTam1 + 1}px sans-serif`;
            const nombreMostrado = truncarConPuntos(ctx, textoNombre, anchoMaximoTexto);
            ctx.fillText(nombreMostrado, px + pw / 2, py + ph / 2 - 8);

            ctx.fillStyle = "#475569";
            ctx.font = `${fontTam3}px monospace`;
            ctx.fillText(textoMedidas, px + pw / 2, py + ph / 2 + 10);
          }
        } else if (ph >= 22 && pw >= 30) {
          // Espacio medio (ej. Peça 2 de 73mm): 2 líneas bien distribuidas con autoescalado
          const fontTam1 = Math.max(7.5, Math.min(10.5, ph / 2.8));
          const fontTam2 = Math.max(7, Math.min(9.5, ph / 3.4));

          ctx.fillStyle = "#0F172A";
          ctx.font = `bold ${fontTam1}px sans-serif`;
          const textoLinea1 = textoDesc ? `${textoNombre}: ${textoDesc}` : textoNombre;
          const linea1Final = truncarConPuntos(ctx, textoLinea1, anchoMaximoTexto);
          ctx.fillText(linea1Final, px + pw / 2, py + ph / 2 - (ph / 4.5));

          ctx.fillStyle = "#475569";
          ctx.font = `${fontTam2}px monospace`;
          ctx.fillText(textoMedidas, px + pw / 2, py + ph / 2 + (ph / 4.5));
        } else {
          // Espacio compacto: 1 línea auto-escalada
          const fontTam = Math.max(7, Math.min(9.5, ph / 2.2));
          ctx.fillStyle = "#0F172A";
          ctx.font = `bold ${fontTam}px sans-serif`;
          const etiqueta = textoDesc ? `${textoNombre}: ${textoDesc}` : `${textoNombre} [${textoMedidas}]`;
          const etiquetaFinal = truncarConPuntos(ctx, etiqueta, anchoMaximoTexto);
          ctx.fillText(etiquetaFinal, px + pw / 2, py + ph / 2);
        }
      }
    });

    ctx.restore();

    // 6. Rótulos perimetrales de cotas del tablero (dimensiones en mm en las esquinas)
    ctx.fillStyle = esOscuro ? "#94A3B8" : "#64748B";
    ctx.font = "bold 11px monospace";
    ctx.textAlign = "center";
    ctx.fillText(`${lamina.largoTotal} mm`, width / 2, offsetY - 14);
    ctx.save();
    ctx.translate(offsetX - 14, height / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText(`${lamina.anchoTotal} mm`, 0, 0);
    ctx.restore();
  }, [lamina, zoomCanvas, hoveredPieza, esOscuro, modoActivo]);

  // Redimensionar el Canvas según su contenedor
  useEffect(() => {
    const handleResize = () => {
      const container = containerRef.current;
      const canvas = canvasRef.current;
      if (!container || !canvas) return;

      const rect = container.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
      dibujarCanvas();
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [dibujarCanvas]);

  useEffect(() => {
    dibujarCanvas();
  }, [dibujarCanvas]);

  return (
    <div className="w-full h-full relative overflow-hidden flex flex-col bg-slate-100 dark:bg-slate-950">
      {/* 1. Sub-header Dedicado Superior: Navegación de Láminas y Controles de Zoom (Sin invadir el Canvas) */}
      {lamina && totalLaminas > 0 && (
        <div className="h-11 px-3 border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md flex items-center justify-between shrink-0 z-10 shadow-xs">
          {/* Navegación entre Láminas */}
          <div className="flex items-center gap-1.5 min-w-0">
            <button
              type="button"
              onClick={() => setLaminaActivaIndex(Math.max(0, laminaActivaIndex - 1))}
              disabled={laminaActivaIndex === 0}
              className="w-7 h-7 rounded-full flex items-center justify-center border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-30 transition cursor-pointer text-slate-700 dark:text-slate-200 shrink-0 shadow-xs active:scale-95"
              title="Lámina anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-100 truncate">
              <span className="shrink-0">
                Lámina {lamina.indice} de {totalLaminas}
              </span>
              <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-700 shrink-0" />
              <span className="px-2.5 py-0.5 rounded-full bg-cyan-100 dark:bg-cyan-900/60 text-cyan-800 dark:text-cyan-200 font-bold text-[11px] truncate shrink-0">
                {lamina.material || `Tablero ${lamina.espesor}mm`}
              </span>
              <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-700 shrink-0" />
              <span className="text-slate-500 dark:text-slate-400 font-mono text-[11px] shrink-0">
                {lamina.largoTotal} × {lamina.anchoTotal} mm
              </span>
              <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-700 shrink-0" />
              <span className="px-2.5 py-0.5 rounded-full bg-rose-100 dark:bg-rose-900/50 text-rose-700 dark:text-rose-300 font-bold text-[11px] shrink-0">
                {lamina.porcentajeDesperdicio}% Merma
              </span>
            </div>

            <button
              type="button"
              onClick={() => setLaminaActivaIndex(Math.min(totalLaminas - 1, laminaActivaIndex + 1))}
              disabled={laminaActivaIndex >= totalLaminas - 1}
              className="w-7 h-7 rounded-full flex items-center justify-center border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-30 transition cursor-pointer text-slate-700 dark:text-slate-200 shrink-0 shadow-xs active:scale-95"
              title="Lámina siguiente"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Controles de Zoom en Cápsulas rounded-full */}
          <div className="flex items-center gap-1 shrink-0 ml-2">
            <button
              type="button"
              onClick={() => setZoomCanvas((z) => Math.min(2.5, z + 0.15))}
              className="w-7 h-7 rounded-full flex items-center justify-center border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 transition cursor-pointer text-slate-700 dark:text-slate-200 shadow-xs active:scale-95"
              title="Acercar (+)"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setZoomCanvas((z) => Math.max(0.5, z - 0.15))}
              className="w-7 h-7 rounded-full flex items-center justify-center border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 transition cursor-pointer text-slate-700 dark:text-slate-200 shadow-xs active:scale-95"
              title="Alejar (-)"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={resetearZoom}
              className="w-7 h-7 rounded-full flex items-center justify-center border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 transition cursor-pointer text-slate-700 dark:text-slate-200 shadow-xs active:scale-95"
              title="Restablecer encuadre"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* 2. Área Libre del Canvas (Sin superposiciones que tapen las cotas) */}
      <div ref={containerRef} className="flex-1 w-full h-full relative overflow-hidden">
        <canvas
          ref={canvasRef}
          className="w-full h-full block cursor-crosshair"
        />
      </div>
    </div>
  );
}
