"use client";

import React from "react";
import { Snowflake, X } from "lucide-react";
import { HerrajeCapaPlus } from "@/lib/storeTypes";

interface CapsulaHerrajePlusProps {
  herraje: HerrajeCapaPlus;
  capaId: string;
  pasoId: string;
  esCongelado?: boolean;
  onHover: (mallas: string[] | null) => void;
  onActualizar: (herrajeId: string, partial: Partial<HerrajeCapaPlus>) => void;
  onRemover: (herrajeId: string) => void;
  onToggleCongelar: (herrajeId: string) => void;
}

export function CapsulaHerrajePlus({
  herraje,
  capaId,
  pasoId,
  esCongelado = false,
  onHover,
  onActualizar,
  onRemover,
  onToggleCongelar,
}: CapsulaHerrajePlusProps) {
  return (
    <div
      onMouseEnter={() => onHover([herraje.id])}
      onMouseLeave={() => onHover(null)}
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[9px] font-medium select-none transition-all shadow-2xs ${
        esCongelado
          ? "border-sky-300 dark:border-sky-700 bg-sky-50/90 dark:bg-sky-950/70 text-sky-800 dark:text-sky-200 hover:border-sky-400"
          : "border-slate-300 dark:border-slate-700 bg-slate-100/90 dark:bg-slate-800/90 text-slate-700 dark:text-slate-200 hover:border-cyan-400 hover:bg-cyan-50/50 dark:hover:bg-cyan-950/40 hover:ring-1 hover:ring-cyan-400/40"
      }`}
    >
      {/* ❄️ Botón Congelar / Descongelar */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onToggleCongelar(herraje.id);
        }}
        title={
          esCongelado
            ? "Herraje Congelado (ya pre-instalado). Clic para descongelar y animar inserción"
            : "Congelar: herraje pre-instalado en paso anterior (viaja fijo sin animación de aproximación)"
        }
        className={`w-3.5 h-3.5 rounded-full flex items-center justify-center transition cursor-pointer shrink-0 ${
          esCongelado
            ? "bg-sky-500 text-white shadow-2xs hover:bg-sky-600"
            : "text-slate-400 hover:text-sky-600 hover:bg-sky-100 dark:hover:bg-sky-950/50"
        }`}
      >
        <Snowflake className="w-2 h-2" />
      </button>

      {/* 🔩 Nombre nativo Grasshopper */}
      <span className="font-semibold text-[9px] truncate max-w-[95px]" title={herraje.id}>
        {herraje.id}
      </span>

      {/* 🧭 Selector de Eje de Inserción (por defecto en -X) */}
      {!esCongelado && (
        <div onClick={(e) => e.stopPropagation()} className="inline-flex items-center">
          <select
            value={herraje.ejeAproximacion || "-X"}
            onChange={(e) => onActualizar(herraje.id, { ejeAproximacion: e.target.value as any })}
            title="Eje del vector de aproximación e inserción (+X, -X, +Y, -Y, +Z, -Z)"
            className="text-[7.5px] font-mono font-bold bg-white/90 dark:bg-slate-900 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-600 rounded-full px-1 py-0 cursor-pointer outline-none hover:border-cyan-500 transition shadow-2xs"
          >
            <option value="-X">-X</option>
            <option value="+X">+X</option>
            <option value="-Y">-Y</option>
            <option value="+Y">+Y</option>
            <option value="-Z">-Z</option>
            <option value="+Z">+Z</option>
          </select>
        </div>
      )}

      {/* ⏱️ Tiempo de aparición en escena (defecto 0s) */}
      <div
        onClick={(e) => e.stopPropagation()}
        title="Segundo exacto en que este herraje aparece en escena a escala real (por defecto 0s)"
        className="inline-flex items-center gap-0.5 bg-white/90 dark:bg-slate-900 px-1 py-0 rounded-full border border-slate-200 dark:border-slate-700 text-[8px] shadow-2xs shrink-0"
      >
        <input
          type="number"
          min={0}
          step={0.5}
          value={herraje.tiempoAparicion ?? 0}
          onFocus={(e) => {
            const t = e.currentTarget;
            setTimeout(() => t.select(), 0);
          }}
          onChange={(e) => onActualizar(herraje.id, { tiempoAparicion: Math.max(0, parseFloat(e.target.value) || 0) })}
          className="w-[22px] min-w-[22px] bg-transparent text-right font-mono font-bold text-slate-700 dark:text-slate-200 outline-none text-[8px] p-0 border-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none cursor-text"
        />
        <span className="text-[7px] font-bold text-slate-400">s</span>
      </div>

      {/* ❌ Botón Eliminar / Remover */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onRemover(herraje.id);
        }}
        title={`Eliminar ${herraje.id} de esta capa`}
        className="w-3.5 h-3.5 rounded-full flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-100 dark:hover:bg-rose-950/60 transition cursor-pointer shrink-0"
      >
        <X className="w-2 h-2" />
      </button>
    </div>
  );
}
