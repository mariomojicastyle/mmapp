"use client";

import React from "react";
import { useOptimizadorStore } from "@/lib/optimizador/useOptimizadorStore";
import { use3BFStore } from "@/lib/store";
import { Sliders, Maximize2, Settings2, Ruler, Boxes } from "lucide-react";

export default function OptimizadorParametrosBar() {
  const { modoActivo, configuracion, actualizarConfiguracion } = useOptimizadorStore();
  const { coloresApariencia, esquemaColor } = use3BFStore();

  const esOscuro = esquemaColor === "oscuro";
  const colorFondo = coloresApariencia?.fondoPaneles || (esOscuro ? "#0B0F17" : "#FFFFFF");
  const colorBorde = coloresApariencia?.bordePaneles || (esOscuro ? "#334155" : "#E2E8F0");
  const colorTexto = coloresApariencia?.textoPrincipal || (esOscuro ? "#F8FAFC" : "#0F172A");
  const colorBotonActivo = esOscuro ? "#1368AA" : (coloresApariencia?.botonActivo || "#0088AA");

  const tamanoLoteActual = configuracion.tamanoLote || 1;

  return (
    <div 
      style={{ backgroundColor: colorFondo, borderColor: colorBorde }}
      className="p-2 lg:p-2.5 border-b flex items-center justify-between gap-3 flex-wrap text-xs"
    >
      <div className="flex items-center gap-2 flex-wrap">
        <span className="flex items-center gap-1 font-bold text-[11px] uppercase tracking-wider text-cyan-600 dark:text-cyan-400">
          <Settings2 className="w-3.5 h-3.5" /> Parámetros:
        </span>

        {/* Multiplicador de Tamaño de Lote (Cantidad de Muebles) */}
        <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-900 px-3 py-1 rounded-full border border-slate-200 dark:border-slate-800 shadow-inner">
          <Boxes className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400 shrink-0" />
          <span className="text-slate-500 font-bold text-[11px] uppercase tracking-wider">Lote:</span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => actualizarConfiguracion({ tamanoLote: Math.max(1, tamanoLoteActual - 1) })}
              className="w-4 h-4 rounded-full flex items-center justify-center bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs cursor-pointer transition active:scale-90"
              title="Reducir 1 unidad al lote"
            >
              -
            </button>
            <input
              type="number"
              min="1"
              max="500"
              value={tamanoLoteActual}
              onChange={(e) => {
                const val = parseInt(e.target.value, 10);
                actualizarConfiguracion({ tamanoLote: isNaN(val) || val < 1 ? 1 : val });
              }}
              className="w-8 text-center font-bold bg-transparent outline-none text-slate-800 dark:text-slate-100 text-xs"
            />
            <button
              type="button"
              onClick={() => actualizarConfiguracion({ tamanoLote: tamanoLoteActual + 1 })}
              className="w-4 h-4 rounded-full flex items-center justify-center bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs cursor-pointer transition active:scale-90"
              title="Añadir 1 unidad al lote"
            >
              +
            </button>
          </div>
          <span className="text-[10px] text-slate-400 font-medium">mueble{tamanoLoteActual > 1 ? "s" : ""}</span>

          {/* Presets de Lote Industrial */}
          <div className="flex items-center gap-0.5 ml-1 pl-1 border-l border-slate-300 dark:border-slate-700">
            {[1, 5, 10, 20, 50].map((preset) => {
              const activo = tamanoLoteActual === preset;
              return (
                <button
                  key={preset}
                  type="button"
                  onClick={() => actualizarConfiguracion({ tamanoLote: preset })}
                  style={activo ? { backgroundColor: colorBotonActivo, color: "#FFFFFF" } : {}}
                  className={`px-1.5 py-0.2 rounded-full text-[10px] font-semibold transition cursor-pointer ${
                    activo 
                      ? "shadow-sm" 
                      : "text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800"
                  }`}
                >
                  {preset}
                </button>
              );
            })}
          </div>
        </div>

        {/* Parámetros para Tableros (Seccionadora y Celda CNC) */}
        {modoActivo !== "madera_maciza" && (
          <>
            {/* Formato de Lámina */}
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-900 px-2.5 py-1 rounded-full border border-slate-200 dark:border-slate-800">
              <span className="text-slate-500 font-medium">Lámina:</span>
              <input
                type="number"
                value={configuracion.largoBruto}
                onChange={(e) => actualizarConfiguracion({ largoBruto: Number(e.target.value) || 2440 })}
                className="w-12 text-center font-bold bg-transparent outline-none text-slate-800 dark:text-slate-100"
              />
              <span className="text-slate-400">×</span>
              <input
                type="number"
                value={configuracion.anchoBruto}
                onChange={(e) => actualizarConfiguracion({ anchoBruto: Number(e.target.value) || 1830 })}
                className="w-12 text-center font-bold bg-transparent outline-none text-slate-800 dark:text-slate-100"
              />
              <span className="text-[10px] text-slate-400">mm</span>
            </div>

            {/* Si es Seccionadora: Kerf */}
            {modoActivo === "seccionadora" && (
              <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-900 px-2.5 py-1 rounded-full border border-slate-200 dark:border-slate-800">
                <span className="text-slate-500 font-medium">Disco (Kerf):</span>
                <input
                  type="number"
                  step="0.1"
                  value={configuracion.kerfSierra}
                  onChange={(e) => actualizarConfiguracion({ kerfSierra: Number(e.target.value) || 3.5 })}
                  className="w-10 text-center font-bold bg-transparent outline-none text-slate-800 dark:text-slate-100"
                />
                <span className="text-[10px] text-slate-400">mm</span>
              </div>
            )}

            {/* Si es Celda CNC: Fresa */}
            {modoActivo === "nesting_cnc" && (
              <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-900 px-2.5 py-1 rounded-full border border-slate-200 dark:border-slate-800">
                <span className="text-slate-500 font-medium">Fresa:</span>
                <input
                  type="number"
                  step="0.5"
                  value={configuracion.diametroFresa}
                  onChange={(e) => actualizarConfiguracion({ diametroFresa: Number(e.target.value) || 10 })}
                  className="w-10 text-center font-bold bg-transparent outline-none text-slate-800 dark:text-slate-100"
                />
                <span className="text-[10px] text-slate-400">mm</span>
              </div>
            )}

            {/* Refilado Perimetral */}
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-900 px-2.5 py-1 rounded-full border border-slate-200 dark:border-slate-800">
              <span className="text-slate-500 font-medium">Refilado:</span>
              <input
                type="number"
                value={configuracion.refiladoMargen}
                onChange={(e) => actualizarConfiguracion({ refiladoMargen: Number(e.target.value) || 10 })}
                className="w-10 text-center font-bold bg-transparent outline-none text-slate-800 dark:text-slate-100"
              />
              <span className="text-[10px] text-slate-400">mm</span>
            </div>
          </>
        )}

        {/* Parámetros para Madera Maciza */}
        {modoActivo === "madera_maciza" && (
          <>
            {/* Estrategia Rip vs Crosscut */}
            <div className="flex items-center p-0.5 rounded-full border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900">
              <button
                type="button"
                onClick={() => actualizarConfiguracion({ estrategiaMadera: "rip_first" })}
                style={
                  configuracion.estrategiaMadera === "rip_first"
                    ? { backgroundColor: colorBotonActivo, color: "#FFFFFF" }
                    : { color: colorTexto }
                }
                className="px-2.5 py-0.5 rounded-full text-[11px] font-bold transition cursor-pointer"
              >
                Rip-First (Longitudinal)
              </button>
              <button
                type="button"
                onClick={() => actualizarConfiguracion({ estrategiaMadera: "crosscut_first" })}
                style={
                  configuracion.estrategiaMadera === "crosscut_first"
                    ? { backgroundColor: colorBotonActivo, color: "#FFFFFF" }
                    : { color: colorTexto }
                }
                className="px-2.5 py-0.5 rounded-full text-[11px] font-bold transition cursor-pointer"
              >
                Crosscut-First (Troceado)
              </button>
            </div>

            {/* Medidas de Tablón */}
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-900 px-2.5 py-1 rounded-full border border-slate-200 dark:border-slate-800">
              <span className="text-slate-500 font-medium">Tablón:</span>
              <span className="font-bold text-slate-800 dark:text-slate-100">8" × 10 ft</span>
              <span className="text-[10px] text-slate-400">({configuracion.largoTablonMm}×{Math.round(configuracion.anchoTablonMm)}mm)</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
