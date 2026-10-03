"use client";

import React from "react";
import type { PiezaCorte } from "@/lib/optimizador/tiposOptimizador";
import { use3BFStore } from "@/lib/store";
import { useOptimizadorStore } from "@/lib/optimizador/useOptimizadorStore";
import { Compass, RotateCw } from "lucide-react";

interface Props {
  piezas: PiezaCorte[];
}

export default function ListaPiezasOptimizadas({ piezas }: Props) {
  const { coloresApariencia, esquemaColor } = use3BFStore();
  const { configuracion } = useOptimizadorStore();
  const tamanoLote = configuracion.tamanoLote || 1;

  const esOscuro = esquemaColor === "oscuro";
  const colorBorde = coloresApariencia?.bordePaneles || (esOscuro ? "#334155" : "#E2E8F0");
  const colorTexto = coloresApariencia?.textoPrincipal || (esOscuro ? "#F8FAFC" : "#0F172A");

  if (!piezas || piezas.length === 0) {
    return (
      <div className="p-4 text-center text-xs text-slate-400">
        No se detectaron piezas en el modelo activo.
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-hidden text-xs">
      <div className="p-2.5 font-bold uppercase tracking-wider text-[11px] text-slate-500 border-b flex items-center justify-between">
        <span>Listado de Piezas ({piezas.reduce((a, b) => a + b.cantidad, 0)} uds)</span>
        {tamanoLote > 1 && (
          <span className="px-2 py-0.5 rounded-full bg-cyan-100 dark:bg-cyan-950/60 text-cyan-700 dark:text-cyan-300 font-bold text-[10px]">
            Lote ×{tamanoLote}
          </span>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-1.5 space-y-1">
        {piezas.map((p) => (
          <div
            key={p.id}
            style={{ borderColor: colorBorde }}
            className="flex items-center justify-between p-2 rounded-lg border bg-white/40 dark:bg-slate-900/40 hover:bg-white dark:hover:bg-slate-900 transition-all text-left"
          >
            <div className="flex items-center gap-2 min-w-0">
              <span
                style={{ backgroundColor: p.colorHex || "#38BDF8" }}
                className="w-3 h-3 rounded-full shrink-0 shadow-sm"
              />
              <div className="truncate">
                <div className="font-bold truncate text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                  <span>{p.nombre}</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold">
                    ×{p.cantidad}
                  </span>
                </div>
                {p.descripcion && p.descripcion !== p.nombre && (
                  <div className="text-[10px] text-slate-400 truncate">{p.descripcion}</div>
                )}
              </div>
            </div>

            <div className="text-right shrink-0 ml-2">
              <div className="font-mono font-semibold text-slate-700 dark:text-slate-200">
                {p.largo} × {p.ancho}
              </div>
              <div className="text-[10px] text-slate-400 flex items-center justify-end gap-1">
                <span>{p.espesor} mm</span>
                <span>•</span>
                {p.rotacionPermitida ? (
                  <span className="text-amber-500" title="Rotación libre (sin veta visible)">Libre</span>
                ) : (
                  <span className="text-cyan-600 dark:text-cyan-400 font-medium" title="Sentido de veta estricto">Veta</span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
