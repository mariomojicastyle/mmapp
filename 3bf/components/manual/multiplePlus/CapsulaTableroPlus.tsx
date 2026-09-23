"use client";

import React from "react";
import { Crosshair, X, Eye, ArrowRight, RotateCcw } from "lucide-react";
import { TableroCapaPlus } from "@/lib/storeTypes";

interface CapsulaTableroPlusProps {
  tablero: TableroCapaPlus;
  capaId: string;
  pasoId: string;
  opcionesDestino: Array<{ id: string; label: string; esHeredado?: boolean }>;
  estaPosicionando: boolean;
  onHover: (mallas: string[] | null) => void;
  onActualizar: (tableroId: string, partial: Partial<TableroCapaPlus>) => void;
  onRemover: (tableroId: string) => void;
  onTogglePosicionar: (tableroId: string) => void;
}

export function CapsulaTableroPlus({
  tablero,
  capaId,
  pasoId,
  opcionesDestino,
  estaPosicionando,
  onHover,
  onActualizar,
  onRemover,
  onTogglePosicionar,
}: CapsulaTableroPlusProps) {
  const tieneDesplazamiento = Boolean(
    (tablero.offsetXCm || 0) !== 0 ||
    (tablero.offsetYCm || 0) !== 0 ||
    (tablero.offsetZCm || 0) !== 0
  );

  return (
    <div
      onMouseEnter={() => onHover([tablero.id])}
      onMouseLeave={() => onHover(null)}
      className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full border border-amber-300 dark:border-amber-700 bg-amber-50/90 dark:bg-amber-950/70 text-amber-900 dark:text-amber-100 shadow-2xs text-[9.5px] select-none transition-all hover:border-amber-400 hover:ring-1 hover:ring-amber-400/40"
    >
      {/* 🪵 Nombre nativo Grasshopper */}
      <span className="font-bold text-[9.5px] truncate max-w-[100px]" title={tablero.id}>
        {tablero.id}
      </span>

      {/* 🎯 Dropdown Hacia: */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="flex items-center gap-0.5 bg-white dark:bg-slate-900 px-1.5 py-0 rounded-full border border-slate-200 dark:border-slate-700 text-[8.5px] shadow-2xs"
        title="Pieza de destino hacia la que se ensamblará durante el paso"
      >
        <span className="font-bold text-slate-400 dark:text-slate-500 text-[7.5px]">Hacia:</span>
        <select
          value={tablero.destinoId || "base_master"}
          onChange={(e) => onActualizar(tablero.id, { destinoId: e.target.value })}
          className="bg-transparent font-bold text-slate-700 dark:text-slate-200 outline-none cursor-pointer max-w-[85px] truncate text-[8.5px]"
        >
          <option value="base_master">👑 Base Master</option>
          {opcionesDestino
            .filter((op) => op.id !== tablero.id)
            .map((op) => (
              <option key={op.id} value={op.id}>
                {op.esHeredado ? `🧩 ${op.label}` : op.label}
              </option>
            ))}
        </select>
      </div>

      {/* 👁️ Tiempo de aparición en espera (defecto 0s) */}
      <div
        onClick={(e) => e.stopPropagation()}
        title="Segundo exacto en que este tablero aparece en escena en su posición de espera (por defecto 0s)"
        className="inline-flex items-center gap-0.5 bg-white dark:bg-slate-900 px-1 py-0 rounded-full border border-slate-200 dark:border-slate-700 text-[8.5px] shadow-2xs"
      >
        <Eye className="w-2 h-2 text-slate-400 shrink-0" />
        <input
          type="number"
          min={0}
          step={0.5}
          value={tablero.tiempoAparicion ?? 0}
          onFocus={(e) => {
            const t = e.currentTarget;
            setTimeout(() => t.select(), 0);
          }}
          onChange={(e) => onActualizar(tablero.id, { tiempoAparicion: Math.max(0, parseFloat(e.target.value) || 0) })}
          className="w-[22px] min-w-[22px] bg-transparent text-right font-mono font-bold text-[8.5px] text-slate-700 dark:text-slate-200 outline-none p-0 border-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none cursor-text"
        />
        <span className="text-[7.5px] font-bold text-slate-400">s</span>
      </div>

      {/* ➔ Tiempo de inicio de movimiento hacia destino (defecto 500s para que no se mueva) */}
      <div
        onClick={(e) => e.stopPropagation()}
        title="Segundo exacto en que inicia su trayectoria hacia la pieza de destino (por defecto 500s para permanecer en espera)"
        className="inline-flex items-center gap-0.5 bg-white dark:bg-slate-900 px-1.5 py-0 rounded-full border border-slate-200 dark:border-slate-700 text-[8.5px] shadow-2xs"
      >
        <ArrowRight className="w-2 h-2 text-cyan-600 shrink-0" />
        <input
          type="number"
          min={0}
          step={0.5}
          value={tablero.tiempoInicioMovimiento ?? 500}
          onFocus={(e) => {
            const t = e.currentTarget;
            setTimeout(() => t.select(), 0);
          }}
          onChange={(e) => onActualizar(tablero.id, { tiempoInicioMovimiento: Math.max(0, parseFloat(e.target.value) || 0) })}
          className="w-[32px] min-w-[32px] bg-transparent text-right font-mono font-bold text-[8.5px] text-cyan-700 dark:text-cyan-300 outline-none p-0 border-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none cursor-text"
        />
        <span className="text-[7.5px] font-bold text-slate-400">s</span>
      </div>

      {/* 📍 Testigo de Coordenadas de Piso si tiene desplazamiento */}
      {tieneDesplazamiento && (
        <span
          title={`Desplazamiento de piso: X=${tablero.offsetXCm || 0}cm, Y=${tablero.offsetYCm || 0}cm, Z=${tablero.offsetZCm || 0}cm`}
          className="text-[8px] font-mono font-bold px-1.5 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 shrink-0 select-none"
        >
          {tablero.offsetXCm || 0},{tablero.offsetYCm || 0},{tablero.offsetZCm || 0}cm
        </span>
      )}

      {/* 🔄 Botón Resetear Posición de Espera a Origen [0, 0, 0] */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onActualizar(tablero.id, { offsetXCm: 0, offsetYCm: 0, offsetZCm: 0 });
        }}
        title="Resetear posición de espera a origen de diseño [0, 0, 0]"
        className={`w-4 h-4 rounded-full flex items-center justify-center transition cursor-pointer shrink-0 ${
          tieneDesplazamiento
            ? "text-amber-600 bg-amber-100 hover:bg-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:hover:bg-amber-900/80 shadow-2xs"
            : "text-slate-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/40"
        }`}
      >
        <RotateCcw className="w-2.5 h-2.5" />
      </button>

      {/* 🎯 Botón Mira (Crosshair) de Posicionamiento */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onTogglePosicionar(tablero.id);
        }}
        title="Arrastrar y posicionar esta pieza interactivamente en el piso 3D"
        className={`w-4 h-4 rounded-full flex items-center justify-center transition cursor-pointer shrink-0 ${
          estaPosicionando
            ? "bg-cyan-500 text-white shadow-2xs animate-pulse ring-1 ring-cyan-400/50"
            : "text-slate-400 hover:text-cyan-600 hover:bg-cyan-50 dark:hover:bg-cyan-950/40"
        }`}
      >
        <Crosshair className="w-2.5 h-2.5" />
      </button>

      {/* ❌ Botón Eliminar / Remover */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onRemover(tablero.id);
        }}
        title={`Eliminar ${tablero.id} de esta capa`}
        className="w-3.5 h-3.5 rounded-full flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-100 dark:hover:bg-rose-950/60 transition cursor-pointer shrink-0"
      >
        <X className="w-2.5 h-2.5" />
      </button>
    </div>
  );
}
