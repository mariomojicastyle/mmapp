"use client";

import { use3BFStore } from "@/lib/store";

import React from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { CapaMultiplePlus, CinematicaFamiliaHerraje, EstiloCinematicaHerraje } from "@/lib/storeTypes";

interface CinematicasHerrajesGlobalProps {
  capa: CapaMultiplePlus;
  pasoId: string;
  onActualizarCinematicaFamilia?: (
    pasoId: string,
    capaId: string,
    familia: string,
    partial: Partial<CinematicaFamiliaHerraje>
  ) => void;
}

export function extraerFamiliaHerraje(id: string): string {
  return id.replace(/^RH_OUT:/i, "").replace(/\s*\(\d+\)$/, "").trim();
}

export function CinematicasHerrajesGlobal({
  capa,
  pasoId,
  onActualizarCinematicaFamilia,
}: CinematicasHerrajesGlobalProps) {
  // 1. Obtener todas las familias presentes en esta capa (excluyendo correderas telescópicas)
  const familiasMap = React.useMemo(() => {
    const map = new Map<string, { total: number; ids: string[] }>();
    const todos = [...(capa.herrajes || []), ...(capa.congelados || [])];

    todos.forEach((h) => {
      const fam = extraerFamiliaHerraje(h.id);
      if (!fam) return;
      // Excluir correderas de muebles según mandato canónico
      const famLow = fam.toLowerCase();
      if (famLow.includes("corrediça") || famLow.includes("trilho") || famLow.includes("corredera")) {
        return;
      }

      const prev = map.get(fam) || { total: 0, ids: [] };
      prev.total += 1;
      prev.ids.push(h.id);
      map.set(fam, prev);
    });

    return map;
  }, [capa.herrajes, capa.congelados]);

  const familiasLista = React.useMemo(() => Array.from(familiasMap.keys()), [familiasMap]);

  // Si no hay herrajes cinemáticos (solo correderas o ninguno), no renderizar la sección
  if (familiasLista.length === 0) return null;

  return (
    <div className="bg-slate-50/70 dark:bg-[#0B0F17]/70 border border-cyan-500/30 rounded-2xl p-3 space-y-2.5 mb-2.5">
      {/* Cabecera de la sección sin emojis decorativos */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200/60 dark:border-slate-800/80 pb-2">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-800 dark:text-slate-100">
            Cinemáticas herrajes
          </span>
          <span className="px-2 py-0.5 rounded-full text-[9.5px] font-semibold bg-cyan-100/70 dark:bg-cyan-950 text-cyan-800 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800">
            Global
          </span>
        </div>
        <span className="text-[9.5px] text-slate-500 dark:text-slate-400">
          Aplica automáticamente a toda la familia
        </span>
      </div>

      {/* Lista de Cápsulas Globales de Familia */}
      <div className="space-y-2">
        {familiasLista.map((fam) => {
          const info = familiasMap.get(fam)!;
          const conf = capa.cinematicasHerrajes?.[fam];

          // Valores por defecto inteligentes según el tipo de herraje
          const famLow = fam.toLowerCase();
          const esTornillo = famLow.includes("parafuso") || famLow.includes("tornillo");
          const esMinifix = famLow.includes("porca") || famLow.includes("tambor") || famLow.includes("minifix");

          const estilo: EstiloCinematicaHerraje = conf?.estilo || (esMinifix ? "suave" : esTornillo ? "pop" : "firme");
          const escalaPct = conf?.escalaInicialPct ?? (esTornillo ? 180 : esMinifix ? 140 : 150);
          const distMm = conf?.distanciaGiroMm ?? (esTornillo ? 35 : 0);
          const gradosGiro = conf?.gradosGiroTotal ?? (esTornillo ? 820 : esMinifix ? 180 : 0);
          const estaColapsada = Boolean(conf?.colapsada);

          const nombreEstiloTexto =
            estilo === "pop"
              ? "Pop"
              : estilo === "firme"
              ? "Firme"
              : estilo === "suave"
              ? "Suave"
              : "Lineal";

          return (
            <div
              key={fam}
              className="border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-[#131B2E] p-2.5 space-y-2.5 shadow-2xs transition-all"
            >
              {/* Fila Principal de la Cápsula Global */}
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  {/* Botón Minimizar / Expandir */}
                  <button
                    type="button"
                    onClick={() => {
                      (onActualizarCinematicaFamilia || (use3BFStore.getState() as any).actualizarCinematicaFamiliaPlus)(pasoId, capa.id, fam, {
                        colapsada: !estaColapsada,
                      });
                    }}
                    className="w-5 h-5 rounded-full border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-500 hover:text-cyan-600 hover:border-cyan-400 transition cursor-pointer"
                    title={estaColapsada ? "Expandir cinemáticas" : "Minimizar"}
                  >
                    {estaColapsada ? (
                      <ChevronRight className="w-3 h-3" />
                    ) : (
                      <ChevronDown className="w-3 h-3" />
                    )}
                  </button>

                  <span className="font-extrabold text-xs text-slate-900 dark:text-white tracking-tight">
                    {fam}
                  </span>
                  <span className="px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                    {info.total}
                  </span>
                </div>

                {/* Badge Resumen */}
                <div className="flex items-center gap-1.5">
                  <span className="px-2.5 py-0.5 rounded-full text-[9px] font-mono font-bold bg-cyan-50 dark:bg-[#1368AA]/30 text-cyan-800 dark:text-cyan-200 border border-cyan-200 dark:border-cyan-700/60 shadow-2xs">
                    {nombreEstiloTexto} ({escalaPct}%) • {gradosGiro}° a {distMm}mm
                  </span>
                </div>
              </div>

              {/* Controles Expandidos */}
              {!estaColapsada && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 pt-1 border-t border-slate-100 dark:border-slate-800/80 text-[10px]">
                  {/* 1. Estilo de Curva */}
                  <div className="space-y-1">
                    <label className="block font-bold uppercase text-slate-400 text-[8.5px]">
                      Estilo de Curva
                    </label>
                    <select
                      value={estilo}
                      onChange={(e) => {
                        (onActualizarCinematicaFamilia || (use3BFStore.getState() as any).actualizarCinematicaFamiliaPlus)(pasoId, capa.id, fam, {
                          estilo: e.target.value as EstiloCinematicaHerraje,
                        });
                      }}
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-full px-2.5 py-1 text-[10px] font-bold text-slate-800 dark:text-slate-200 outline-none cursor-pointer focus:border-cyan-500"
                    >
                      <option value="pop">Pop Elástico (Rebote)</option>
                      <option value="firme">Impacto Firme (Snap)</option>
                      <option value="suave">Suave Técnico (Ease-Out)</option>
                      <option value="lineal">Lineal Continuo</option>
                    </select>
                  </div>

                  {/* 2. Escala Inicial (%) Editable */}
                  <div className="space-y-1">
                    <div className="flex justify-between items-center">
                      <label className="block font-bold uppercase text-slate-400 text-[8.5px]">
                        Escala Inicial
                      </label>
                      <span className="text-[8px] text-amber-600 dark:text-amber-400 font-mono font-bold">
                        100% = normal
                      </span>
                    </div>
                    <div className="flex items-center bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-full px-2.5 py-1 font-mono focus-within:border-cyan-500">
                      <input
                        type="number"
                        min={50}
                        max={500}
                        step={10}
                        value={escalaPct}
                        onFocus={(e) => e.currentTarget.select()}
                        onClick={(e) => e.currentTarget.select()}
                        onChange={(e) => {
                          const val = parseInt(e.target.value, 10);
                          (onActualizarCinematicaFamilia || (use3BFStore.getState() as any).actualizarCinematicaFamiliaPlus)(pasoId, capa.id, fam, {
                            escalaInicialPct: isNaN(val) ? 100 : val,
                          });
                        }}
                        className="w-full bg-transparent font-bold text-center outline-none text-[10px] text-slate-800 dark:text-slate-100"
                      />
                      <span className="text-[9px] text-slate-400 font-bold ml-0.5">%</span>
                    </div>
                  </div>

                  {/* 3. Iniciar Giro a (mm) */}
                  <div className="space-y-1">
                    <div className="flex justify-between items-center">
                      <label className="block font-bold uppercase text-slate-400 text-[8.5px]">
                        Iniciar giro a
                      </label>
                      <span className="text-[8px] text-cyan-600 dark:text-cyan-400 font-mono font-bold">
                        distancia
                      </span>
                    </div>
                    <div className="flex items-center bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-full px-2.5 py-1 font-mono focus-within:border-cyan-500">
                      <input
                        type="number"
                        min={0}
                        max={200}
                        value={distMm}
                        onFocus={(e) => e.currentTarget.select()}
                        onClick={(e) => e.currentTarget.select()}
                        onChange={(e) => {
                          const val = parseInt(e.target.value, 10);
                          (onActualizarCinematicaFamilia || (use3BFStore.getState() as any).actualizarCinematicaFamiliaPlus)(pasoId, capa.id, fam, {
                            distanciaGiroMm: isNaN(val) ? 0 : val,
                          });
                        }}
                        className="w-full bg-transparent font-bold text-center outline-none text-[10px] text-slate-800 dark:text-slate-100"
                      />
                      <span className="text-[9px] text-slate-400 font-bold ml-0.5">mm</span>
                    </div>
                  </div>

                  {/* 4. Grados de Giro Total (°) */}
                  <div className="space-y-1">
                    <div className="flex justify-between items-center">
                      <label className="block font-bold uppercase text-slate-400 text-[8.5px]">
                        Grados de Giro
                      </label>
                      <span className="text-[8px] text-slate-400 font-mono">
                        ~{(gradosGiro / 360).toFixed(1)} vtas
                      </span>
                    </div>
                    <div className="flex items-center bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-full px-2.5 py-1 font-mono focus-within:border-cyan-500">
                      <input
                        type="number"
                        step={45}
                        value={gradosGiro}
                        onFocus={(e) => e.currentTarget.select()}
                        onClick={(e) => e.currentTarget.select()}
                        onChange={(e) => {
                          const val = parseInt(e.target.value, 10);
                          (onActualizarCinematicaFamilia || (use3BFStore.getState() as any).actualizarCinematicaFamiliaPlus)(pasoId, capa.id, fam, {
                            gradosGiroTotal: isNaN(val) ? 0 : val,
                          });
                        }}
                        className="w-full bg-transparent font-bold text-center outline-none text-[10px] text-slate-800 dark:text-slate-100"
                      />
                      <span className="text-[9px] text-slate-400 font-bold ml-0.5">°</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
