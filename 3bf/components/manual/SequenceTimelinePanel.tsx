"use client";

import React from "react";
import { use3BFStore, ElementoSecuenciaCinematica } from "@/lib/store";
import { Sparkles, ArrowUp, ArrowDown, Trash2, Clock, Wrench, RotateCw } from "lucide-react";

export default function SequenceTimelinePanel() {
  const {
    pasosManual,
    pasoActivoManualId,
    reordenarSecuenciaPaso,
    actualizarPasoManual,
    autoGenerarSecuenciaPaso,
    coloresApariencia,
  } = use3BFStore();

  const pasoActivo = pasosManual.find((p) => p.id === pasoActivoManualId) || pasosManual[0];
  const botonActivoColor = coloresApariencia?.botonActivo || "#0891b2";

  if (pasoActivo.tipo === "showcase") {
    return (
      <div className="p-4 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 text-center flex flex-col items-center gap-2 text-xs opacity-75">
        <Sparkles className="w-5 h-5 text-cyan-500" />
        <p className="font-semibold">El Paso 00 es un Showcase Funcional Automatizado.</p>
        <p className="text-[11px] opacity-70">
          La secuencia cinemática de apertura de cajones y puertas se genera de forma procedural según los parámetros del mueble.
        </p>
      </div>
    );
  }

  const moverElemento = (idx: number, direccion: -1 | 1) => {
    const targetIdx = idx + direccion;
    if (targetIdx < 0 || targetIdx >= pasoActivo.secuencia.length) return;

    const copia = [...pasoActivo.secuencia];
    const temp = copia[idx];
    copia[idx] = copia[targetIdx];
    copia[targetIdx] = temp;

    // Recalcular tiempos secuenciales continuos
    let t = 0.5;
    copia.forEach((el) => {
      el.tiempoInicio = Number(t.toFixed(1));
      t += el.duracionMovimiento - 0.3;
    });

    reordenarSecuenciaPaso(pasoActivo.id, copia);
  };

  const actualizarElemento = (elemId: string, data: Partial<ElementoSecuenciaCinematica>) => {
    const actualizada = pasoActivo.secuencia.map((item) =>
      item.id === elemId ? { ...item, ...data } : item
    );
    reordenarSecuenciaPaso(pasoActivo.id, actualizada);
  };

  const eliminarElemento = (elemId: string) => {
    const filtrada = pasoActivo.secuencia.filter((item) => item.id !== elemId);
    reordenarSecuenciaPaso(pasoActivo.id, filtrada);
  };

  return (
    <div className="flex flex-col gap-3 text-xs">
      {/* Barra de Acciones */}
      <div className="flex items-center justify-between gap-2">
        <span className="font-bold tracking-wide uppercase opacity-70 text-[10px]">
          Secuencia Cinemática ({pasoActivo.secuencia.length} acciones)
        </span>
        <button
          type="button"
          onClick={() => autoGenerarSecuenciaPaso(pasoActivo.id)}
          style={{ backgroundColor: botonActivoColor }}
          className="flex items-center gap-1.5 px-3 py-1 rounded-full text-white text-[10px] font-bold shadow-sm hover:opacity-90 transition"
        >
          <Sparkles className="w-3 h-3" /> Auto-ordenar Físico
        </button>
      </div>

      {pasoActivo.secuencia.length === 0 ? (
        <div className="p-4 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 text-center flex flex-col items-center gap-2 text-xs opacity-75">
          <p className="font-semibold">No hay elementos en la secuencia aún.</p>
          <p className="text-[11px] opacity-70">
            Asigna piezas y herrajes en la pestaña "Pasos" o haz clic en "Auto-ordenar Físico".
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-2 max-h-[420px] overflow-y-auto pr-1 custom-scrollbar">
          {pasoActivo.secuencia.map((elem, idx) => (
            <div
              key={elem.id}
              className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-black/[0.02] dark:bg-white/[0.02] flex flex-col gap-2 hover:border-cyan-500/40 transition"
            >
              {/* Fila Superior: Orden, Nombre y Botones de Movimiento */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center font-mono font-bold text-[10px] shrink-0">
                    {idx + 1}
                  </span>
                  <span className="font-bold truncate text-xs" title={elem.nombreNodo}>
                    {elem.nombreNodo}
                  </span>
                  <span
                    className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase shrink-0 ${
                      elem.tipo === "herraje"
                        ? "bg-purple-500/10 text-purple-600 dark:text-purple-300 border border-purple-500/20"
                        : "bg-amber-500/10 text-amber-600 dark:text-amber-300 border border-amber-500/20"
                    }`}
                  >
                    {elem.tipo}
                  </span>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    disabled={idx === 0}
                    onClick={() => moverElemento(idx, -1)}
                    className="p-1 rounded-full hover:bg-black/5 dark:hover:bg-white/5 disabled:opacity-30 transition"
                  >
                    <ArrowUp className="w-3 h-3" />
                  </button>
                  <button
                    type="button"
                    disabled={idx === pasoActivo.secuencia.length - 1}
                    onClick={() => moverElemento(idx, 1)}
                    className="p-1 rounded-full hover:bg-black/5 dark:hover:bg-white/5 disabled:opacity-30 transition"
                  >
                    <ArrowDown className="w-3 h-3" />
                  </button>
                  <button
                    type="button"
                    onClick={() => eliminarElemento(elem.id)}
                    className="p-1 rounded-full text-rose-500 hover:bg-rose-500/10 transition"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {/* Fila Inferior: Pop-In, Herramienta y Tiempos */}
              <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-100 dark:border-slate-800/60 text-[11px]">
                {/* Herramienta */}
                <div className="flex items-center gap-1.5">
                  <Wrench className="w-3 h-3 opacity-60 shrink-0" />
                  <select
                    value={elem.herramienta || "ninguna"}
                    onChange={(e) =>
                      actualizarElemento(elem.id, {
                        herramienta: e.target.value as any,
                        rotacionGrados: e.target.value === "llave_allen" ? 720 : e.target.value === "destornillador" ? 180 : 0,
                      })
                    }
                    className="px-2 py-0.5 rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-[10px] font-semibold outline-none w-full"
                  >
                    <option value="ninguna">Sin Herramienta</option>
                    <option value="martillo">Martillo de Goma (0mm gap)</option>
                    <option value="llave_allen">Llave Allen (720°)</option>
                    <option value="destornillador">Destornillador (180°)</option>
                  </select>
                </div>

                {/* Pop-In Switch */}
                <label className="flex items-center justify-end gap-1.5 cursor-pointer font-semibold select-none">
                  <span>Pop-In 200%</span>
                  <input
                    type="checkbox"
                    checked={elem.popIn}
                    onChange={(e) => actualizarElemento(elem.id, { popIn: e.target.checked })}
                    className="rounded accent-cyan-600"
                  />
                </label>

                {/* Tiempos de Animación */}
                <div className="flex items-center gap-1 col-span-2 pt-0.5 opacity-80 text-[10px]">
                  <Clock className="w-3 h-3 opacity-60" />
                  <span>Inicio:</span>
                  <input
                    type="number"
                    min={0}
                    max={60}
                    step={0.1}
                    value={elem.tiempoInicio}
                    onChange={(e) => actualizarElemento(elem.id, { tiempoInicio: parseFloat(e.target.value) || 0 })}
                    className="w-12 px-1 py-0.5 rounded-full border text-center font-mono font-bold bg-transparent"
                  />
                  <span>s | Duración:</span>
                  <input
                    type="number"
                    min={0.5}
                    max={10}
                    step={0.1}
                    value={elem.duracionMovimiento}
                    onChange={(e) => actualizarElemento(elem.id, { duracionMovimiento: parseFloat(e.target.value) || 1 })}
                    className="w-12 px-1 py-0.5 rounded-full border text-center font-mono font-bold bg-transparent"
                  />
                  <span>s</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
