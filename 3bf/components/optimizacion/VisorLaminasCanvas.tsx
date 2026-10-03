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
        ctx.fillStyle = "rgba(255, 255, 255, 0.35)";
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

      // Rótulo tipográfico centrado (Nombre y Medidas)
      if (pw > 35 && ph > 20) {
        ctx.fillStyle = "#0F172A";
        ctx.font = `bold ${Math.max(10, Math.min(13, ph / 3.5))}px sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";

        const textoNombre = p.nombre;
        const textoMedidas = `${Math.round(p.largo)} × ${Math.round(p.ancho)}`;

        if (ph > 36) {
          ctx.fillText(textoNombre, px + pw / 2, py + ph / 2 - 7);
          ctx.font = `${Math.max(9, Math.min(11, ph / 4.2))}px sans-serif`;
          ctx.fillStyle = "#334155";
          ctx.fillText(textoMedidas, px + pw / 2, py + ph / 2 + 8);
        } else {
          ctx.fillText(`${textoNombre} (${textoMedidas})`, px + pw / 2, py + ph / 2);
        }
      }
    });

    ctx.restore();

    // 6. Rótulos perimetrales de cotas del tablero (dimensiones en mm en las esquinas)
    ctx.fillStyle = esOscuro ? "#94A3B8" : "#64748B";
    ctx.font = "bold 11px monospace";
    ctx.textAlign = "center";
    ctx.fillText(`${lamina.largoTotal} mm`, width / 2, offsetY - 12);
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
    <div ref={containerRef} className="w-full h-full relative overflow-hidden flex flex-col bg-slate-100 dark:bg-slate-950">
      {/* Canvas Principal */}
      <canvas
        ref={canvasRef}
        className="w-full h-full block cursor-crosshair"
      />

      {/* Barra Flotante Superior: Navegación de Láminas en Cápsula rounded-full */}
      {lamina && totalLaminas > 0 && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5 p-1 rounded-full bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border border-slate-200 dark:border-slate-800 shadow-lg">
          <button
            type="button"
            onClick={() => setLaminaActivaIndex(Math.max(0, laminaActivaIndex - 1))}
            disabled={laminaActivaIndex === 0}
            className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-slate-200 dark:hover:bg-slate-800 disabled:opacity-30 transition cursor-pointer text-slate-700 dark:text-slate-200"
            title="Lámina anterior"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <div className="px-3 py-0.5 text-xs font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <span>
              Lámina {lamina.indice} de {totalLaminas}
            </span>
            <span className="w-1 h-1 rounded-full bg-slate-400" />
            <span className="text-cyan-600 dark:text-cyan-400 font-semibold">
              {lamina.espesor} mm
            </span>
            <span className="w-1 h-1 rounded-full bg-slate-400" />
            <span className="text-emerald-600 dark:text-emerald-400">
              {lamina.porcentajeAprovechamiento}% útil
            </span>
          </div>

          <button
            type="button"
            onClick={() => setLaminaActivaIndex(Math.min(totalLaminas - 1, laminaActivaIndex + 1))}
            disabled={laminaActivaIndex >= totalLaminas - 1}
            className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-slate-200 dark:hover:bg-slate-800 disabled:opacity-30 transition cursor-pointer text-slate-700 dark:text-slate-200"
            title="Lámina siguiente"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Botonera Flotante Inferior Derecha: Controles de Zoom en Cápsula rounded-full */}
      <div className="absolute bottom-3 right-3 z-20 flex items-center gap-1 p-1 rounded-full bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border border-slate-200 dark:border-slate-800 shadow-md">
        <button
          type="button"
          onClick={() => setZoomCanvas((z) => Math.min(2.5, z + 0.15))}
          className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-slate-200 dark:hover:bg-slate-800 transition cursor-pointer text-slate-700 dark:text-slate-200"
          title="Acercar (+)"
        >
          <ZoomIn className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={() => setZoomCanvas((z) => Math.max(0.5, z - 0.15))}
          className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-slate-200 dark:hover:bg-slate-800 transition cursor-pointer text-slate-700 dark:text-slate-200"
          title="Alejar (-)"
        >
          <ZoomOut className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={resetearZoom}
          className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-slate-200 dark:hover:bg-slate-800 transition cursor-pointer text-slate-700 dark:text-slate-200"
          title="Restablecer encuadre"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
