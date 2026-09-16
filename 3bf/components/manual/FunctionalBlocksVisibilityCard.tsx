"use client";

import React from "react";
import { use3BFStore } from "@/lib/store";
import { Eye, EyeOff } from "lucide-react";

export default function FunctionalBlocksVisibilityCard() {
  const {
    pasosManual,
    conmutarVisibilidadTodosGruposCinematicos,
    conmutarVisibilidadGrupoCinematico,
  } = use3BFStore();

  const pasoP00 = pasosManual.find((p) => p.id === "P00" || p.tipo === "showcase");
  const bloques = pasoP00?.showcase?.gruposCinematicos || [];
  if (bloques.length === 0) return null;

  const algunOculto = bloques.some((g) => g.oculto);

  return (
    <div className="flex flex-col gap-2 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-sm">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="text-xs">🗄️</span>
          <span className="font-bold text-xs text-slate-800 dark:text-slate-100 truncate">
            Bloques Funcionales ({bloques.length})
          </span>
          <span className="text-[9px] font-semibold px-2 py-0.2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700 shrink-0">
            P00
          </span>
        </div>

        {/* Botón Maestro: Ocultar / Mostrar Todos */}
        <button
          type="button"
          onClick={() => pasoP00 && conmutarVisibilidadTodosGruposCinematicos(pasoP00.id, !algunOculto)}
          className={`px-2.5 py-1 rounded-full text-[9.5px] font-bold border transition flex items-center gap-1 cursor-pointer shrink-0 ${
            algunOculto
              ? "bg-[#1368AA] text-white border-[#1368AA] shadow-xs"
              : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-200"
          }`}
          title={algunOculto ? "Mostrar todos los bloques funcionales en 3D" : "Ocultar todos los bloques funcionales en 3D para despejar el ensamble"}
        >
          {algunOculto ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
          <span>{algunOculto ? "Mostrar Todos" : "Ocultar Todos"}</span>
        </button>
      </div>

      {/* Lista de Bloques Funcionales con su Ojito individual */}
      <div className="flex flex-col gap-1.5 pt-1 border-t border-slate-200/50 dark:border-slate-800/50 max-h-48 overflow-y-auto pr-0.5">
        {bloques.map((grupo) => {
          const esPuerta = grupo.tipo === "puerta";
          const estaOculto = Boolean(grupo.oculto);

          return (
            <div
              key={grupo.id}
              className={`flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-full border transition ${
                estaOculto
                  ? "bg-amber-500/5 border-amber-500/30 opacity-70"
                  : "bg-slate-50 dark:bg-slate-800/50 border-slate-200/80 dark:border-slate-800"
              }`}
            >
              <div className="flex items-center gap-1.5 min-w-0 flex-1">
                <span className="text-xs shrink-0 select-none">
                  {esPuerta ? "🚪" : "🗄️"}
                </span>
                <span className="font-semibold text-[10.5px] text-slate-800 dark:text-slate-100 truncate">
                  {grupo.nombre}
                </span>
                <span className="text-[9px] opacity-60 shrink-0 font-mono">
                  ({grupo.piezas.length} pzas)
                </span>
              </div>

              {/* Botón Bombillito / Ojito por bloque */}
              <button
                type="button"
                onClick={() => pasoP00 && conmutarVisibilidadGrupoCinematico(pasoP00.id, grupo.id)}
                title={estaOculto ? "Mostrar este bloque en 3D" : "Ocultar este bloque en 3D"}
                className={`p-1 rounded-full transition shrink-0 cursor-pointer border ${
                  estaOculto
                    ? "bg-[#1368AA] text-white border-[#1368AA] shadow-xs"
                    : "bg-white dark:bg-slate-900 text-slate-400 hover:text-cyan-500 border-slate-200 dark:border-slate-700"
                }`}
              >
                {estaOculto ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
