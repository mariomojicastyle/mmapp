"use client";

import React from "react";
import { Link2, Unlink2, Snowflake, X } from "lucide-react";
import { HerrajeContactoItem } from "@/lib/engine/cadStateUtils";
import { TiempoHerrajeInput } from "./TiempoCinematicoInput";

interface HerrajePillItemProps {
  herraje: HerrajeContactoItem;
  nombrePieza: string;
  estaPrendido: boolean;
  esCongelado?: boolean;
  instKey: string;
  descEs: string;
  otraPieza?: string | null;
  direccion: string;
  tiempoAparicion: number;
  activoEnTiempo: boolean;
  onToggle?: () => void;
  onHover: (mallas: string[] | null) => void;
  onCambiarDireccion: (dir: string) => void;
  onCambiarTiempo: (segundos: number) => void;
  onDescongelar?: () => void;
  onRetirar?: () => void;
  onDragStart?: (e: React.DragEvent) => void;
  onDragEnd?: () => void;
}

export function HerrajePillItem({
  herraje,
  nombrePieza,
  estaPrendido,
  esCongelado = false,
  instKey,
  descEs,
  otraPieza,
  direccion,
  tiempoAparicion,
  activoEnTiempo,
  onToggle,
  onHover,
  onCambiarDireccion,
  onCambiarTiempo,
  onDescongelar,
  onRetirar,
  onDragStart,
  onDragEnd,
}: HerrajePillItemProps) {
  if (esCongelado) {
    return (
      <div
        className="inline-flex items-center group cursor-default"
        onMouseEnter={() => {
          if (activoEnTiempo) {
            onHover(herraje.nombresMallas);
          }
        }}
        onMouseLeave={() => onHover(null)}
      >
        <span
          title={`${herraje.label} (${descEs}): Herraje pre-instalado (fijo). Ya viene montado en ${nombrePieza} al inicio del paso y se traslada solidario.`}
          className="flex items-center gap-1 px-2.5 py-0.5 rounded-full font-bold border transition select-none bg-sky-50 dark:bg-sky-950/70 text-sky-700 dark:text-sky-300 border-sky-300 dark:border-sky-700 shadow-2xs text-[9.5px]"
        >
          <Snowflake className="w-2.5 h-2.5 text-sky-500 shrink-0" />
          <span>{herraje.label}</span>

          {/* ⏱️ Tiempo individual de herraje congelado */}
          <div
            onClick={(e) => e.stopPropagation()}
            title="Segundo en que este herraje congelado aparece en escena (0s = hereda tiempo de la pieza madre)"
            className="inline-flex items-center gap-0.5 bg-white/90 dark:bg-slate-900/90 border border-slate-300/80 dark:border-slate-600/80 rounded-full px-1.5 py-0 shadow-2xs ml-0.5 hover:border-cyan-500 transition cursor-text"
          >
            <TiempoHerrajeInput
              valorInicial={tiempoAparicion}
              onGuardar={onCambiarTiempo}
            />
            <span className="text-[7.5px] font-mono font-bold text-slate-400 select-none">s</span>
          </div>

          {onDescongelar && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onDescongelar();
              }}
              title="Descongelar: devolver a herrajes activos normales"
              className="w-3.5 h-3.5 rounded-full flex items-center justify-center hover:bg-sky-200 dark:hover:bg-sky-800 text-sky-600 dark:text-sky-300 transition cursor-pointer ml-0.5"
            >
              <X className="w-2.5 h-2.5" />
            </button>
          )}
        </span>
      </div>
    );
  }

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      className="inline-flex items-center group cursor-grab active:cursor-grabbing"
    >
      <button
        type="button"
        onClick={onToggle}
        onMouseEnter={() => {
          if (activoEnTiempo) {
            onHover(herraje.nombresMallas);
          }
        }}
        onMouseLeave={() => onHover(null)}
        title={
          otraPieza
            ? estaPrendido
              ? `${herraje.label} (${descEs}): Prendido en ${nombrePieza} (viaja con esta capa). Clic para apagar y transferir a ${otraPieza}. Arrastra al congelador para fijar.`
              : `${herraje.label} (${descEs}): Apagado en ${nombrePieza} (emparentado con ${otraPieza}). Clic para transferir a ${nombrePieza}.`
            : estaPrendido
              ? `${herraje.label} (${descEs}): Prendido y cohesionado con ${nombrePieza}. Clic para apagar. Arrastra al congelador para fijar.`
              : `${herraje.label} (${descEs}): Apagado, permanece en el mueble. Clic para prender.`
        }
        className={`flex items-center gap-1 px-2.5 py-0.5 rounded-full font-bold border transition cursor-pointer select-none ${
          estaPrendido
            ? "bg-cyan-50 dark:bg-cyan-950/60 text-cyan-700 dark:text-cyan-300 border-cyan-300 dark:border-cyan-700 hover:border-amber-400 hover:ring-1 hover:ring-amber-400/50 hover:bg-amber-50/50 dark:hover:bg-amber-950/30 shadow-2xs"
            : "bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 border-slate-200 dark:border-slate-700 line-through opacity-60 hover:opacity-100 hover:border-amber-400"
        }`}
      >
        {estaPrendido ? (
          <Link2 className="w-2.5 h-2.5 text-cyan-600 dark:text-cyan-400 shrink-0" />
        ) : (
          <Unlink2 className="w-2.5 h-2.5 text-slate-400 shrink-0" />
        )}
        <span>{herraje.label}</span>

        {/* 🧭 Selector de dirección vectorial del herraje (+X, -X, +Y, -Y, +Z, -Z) */}
        <select
          value={direccion}
          onChange={(e) => {
            e.stopPropagation();
            onCambiarDireccion(e.target.value);
          }}
          onClick={(e) => e.stopPropagation()}
          title="Dirección del vector de aproximación (+X, -X, +Y, -Y, +Z, -Z)"
          className="text-[8px] font-mono font-bold bg-white/90 dark:bg-slate-900/90 text-slate-700 dark:text-slate-200 border border-slate-300/80 dark:border-slate-600/80 rounded-full px-1.5 py-0 cursor-pointer outline-none hover:border-cyan-500 transition shadow-2xs ml-0.5"
        >
          <option value="+Y">+Y</option>
          <option value="-Y">-Y</option>
          <option value="+X">+X</option>
          <option value="-X">-X</option>
          <option value="+Z">+Z</option>
          <option value="-Z">-Z</option>
        </select>

        {/* ⏱️ Segundo en que el herraje aparece a escala real (por defecto 0s) */}
        <div
          onClick={(e) => e.stopPropagation()}
          title="Segundo en que este herraje aparece a escala real (0s = desde el inicio del paso)"
          className="inline-flex items-center gap-0.5 bg-white/90 dark:bg-slate-900/90 border border-slate-300/80 dark:border-slate-600/80 rounded-full px-1.5 py-0 shadow-2xs ml-0.5 hover:border-cyan-500 transition cursor-text"
        >
          <TiempoHerrajeInput
            valorInicial={tiempoAparicion}
            onGuardar={onCambiarTiempo}
          />
          <span className="text-[7.5px] font-mono font-bold text-slate-400 select-none">s</span>
        </div>

        {/* ❌ Botón X para retirar / eliminar este herraje del paso si fue añadido por error */}
        {onRetirar && (
          <span
            onClick={(e) => {
              e.stopPropagation();
              onRetirar();
            }}
            title={`Retirar ${herraje.label} de este paso (eliminar selección accidental)`}
            className="w-3.5 h-3.5 rounded-full flex items-center justify-center hover:bg-red-200 dark:hover:bg-red-900/60 text-slate-400 hover:text-red-600 transition ml-0.5 cursor-pointer"
          >
            <X className="w-2.5 h-2.5" />
          </span>
        )}
      </button>
    </div>
  );
}
