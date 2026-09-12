"use client";

import React from "react";
import { RecetaColorMueble } from "@/lib/store";

interface ColorSwatchItemProps {
  receta: RecetaColorMueble;
  activa: boolean;
  onSelect: () => void;
  esOscuro: boolean;
  colorActivo: string;
}

export default function ColorSwatchItem({
  receta,
  activa,
  onSelect,
  esOscuro,
  colorActivo
}: ColorSwatchItemProps) {
  const { swatch, nombre, referenciaSku } = receta;
  const esBicolor = swatch.tipo === "bicolor" && swatch.colorSecundario;

  // Fondo del swatch: color plano o gradiente diagonal 45° (135deg)
  const backgroundStyle = esBicolor
    ? {
        background: `linear-gradient(135deg, ${swatch.colorPrimario} 50%, ${swatch.colorSecundario} 50%)`
      }
    : {
        backgroundColor: swatch.colorPrimario
      };

  const bordePerimetro = esOscuro ? "rgba(255, 255, 255, 0.15)" : "rgba(0, 0, 0, 0.15)";

  return (
    <button
      onClick={onSelect}
      type="button"
      title={`${nombre} (${referenciaSku})`}
      className="group flex flex-col items-center gap-1.5 cursor-pointer focus:outline-none select-none transition-transform active:scale-95"
    >
      {/* Círculo Swatch Puro (rounded-full estricto) */}
      <div className="relative p-0.5">
        <div
          style={{
            ...backgroundStyle,
            borderColor: bordePerimetro,
            boxShadow: activa
              ? `0 0 0 2px ${colorActivo}, 0 2px 6px rgba(0,0,0,0.2)`
              : "0 1px 3px rgba(0,0,0,0.12)"
          }}
          className={`w-8 h-8 lg:w-9 lg:h-9 rounded-full border transition-all duration-200 ${
            activa ? "scale-105" : "hover:scale-105 opacity-90 hover:opacity-100"
          }`}
        />
      </div>

      {/* Etiqueta de Nombre debajo del Swatch */}
      <div className="flex flex-col items-center text-center max-w-[76px]">
        <span
          className={`text-[10px] lg:text-[11px] leading-tight truncate w-full transition-colors ${
            activa
              ? "font-bold text-slate-900 dark:text-white"
              : "font-medium text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-slate-200"
          }`}
        >
          {nombre}
        </span>
      </div>
    </button>
  );
}
