"use client";

import React from "react";
import { use3BFStore } from "@/lib/store";
import { Plus, GripVertical, Boxes } from "lucide-react";

export default function ManualStepSelector() {
  const {
    pasosManual,
    pasoActivoManualId,
    seleccionarPasoManualActivo,
    crearPasoManual,
    reordenarPasosManual,
    coloresApariencia,
  } = use3BFStore();

  const [draggedIndex, setDraggedIndex] = React.useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = React.useState<number | null>(null);

  const botonActivoColor = coloresApariencia?.botonActivo || "#0891b2";

  return (
    <div className="flex flex-col gap-1.5 px-3 py-2 border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm shrink-0 select-none">
      <div className="flex items-center justify-between">
        <span className="font-bold tracking-wide uppercase opacity-70 text-[10px]">
          Línea de Pasos del Manual
        </span>
        <button
          type="button"
          onClick={() => crearPasoManual("ensamble")}
          style={{ borderColor: botonActivoColor, color: botonActivoColor }}
          className="flex items-center gap-1 px-2.5 py-0.5 rounded-full border hover:bg-cyan-500/10 transition font-bold text-[10px] cursor-pointer"
        >
          <Plus className="w-3 h-3" /> + Nuevo Paso
        </button>
      </div>

      <div className="flex items-center gap-1.5 overflow-x-auto py-1 custom-scrollbar">
        {pasosManual.map((paso, index) => {
          const esActivo = paso.id === pasoActivoManualId;
          const esP00 = paso.id === "P00" || paso.tipo === "showcase";
          const esDragOver = dragOverIndex === index;

          return (
            <button
              key={`${paso.id}_${index}`}
              type="button"
              draggable={!esP00}
              onDragStart={(e) => {
                if (esP00) return;
                setDraggedIndex(index);
                e.dataTransfer.setData("text/plain", index.toString());
                e.dataTransfer.effectAllowed = "move";
              }}
              onDragOver={(e) => {
                if (esP00) return;
                e.preventDefault();
                e.dataTransfer.dropEffect = "move";
                if (dragOverIndex !== index) {
                  setDragOverIndex(index);
                }
              }}
              onDragLeave={() => {
                if (dragOverIndex === index) {
                  setDragOverIndex(null);
                }
              }}
              onDrop={(e) => {
                if (esP00) return;
                e.preventDefault();
                setDragOverIndex(null);
                setDraggedIndex(null);
                const origenIdxStr = e.dataTransfer.getData("text/plain");
                const origenIdx = parseInt(origenIdxStr, 10);
                if (!isNaN(origenIdx) && origenIdx !== index && origenIdx > 0 && index > 0) {
                  reordenarPasosManual(origenIdx, index);
                }
              }}
              onDragEnd={() => {
                setDraggedIndex(null);
                setDragOverIndex(null);
              }}
              onClick={() => seleccionarPasoManualActivo(paso.id)}
              style={
                esActivo
                  ? { backgroundColor: botonActivoColor, color: "#ffffff", borderColor: botonActivoColor }
                  : {}
              }
              title={esP00 ? "Paso 00 Showcase (Fijo)" : `Arrastra para reordenar paso ${paso.id}`}
              className={`px-3 py-1 rounded-full border text-[11px] font-bold shrink-0 transition flex items-center gap-1.5 select-none cursor-pointer ${
                esP00
                  ? "cursor-default"
                  : "cursor-grab active:cursor-grabbing hover:border-cyan-400"
              } ${
                esDragOver ? "ring-2 ring-cyan-500 scale-105" : ""
              } ${
                esActivo
                  ? "shadow-sm"
                  : "border-slate-300 dark:border-slate-700 hover:bg-black/5 dark:hover:bg-white/5"
              }`}
            >
              {!esP00 && <GripVertical className="w-2.5 h-2.5 opacity-40 hover:opacity-100 shrink-0" />}
              <span>{paso.id}</span>
              {paso.tipo === "showcase" ? null : paso.tipo === "bloque_estandar" ? (
                <Boxes className="w-3 h-3 text-cyan-400 shrink-0" />
              ) : (
                <span className="opacity-70 font-normal text-[10px]">
                  ({(paso.piezasAsignadas || []).length + (paso.herrajesAsignados || []).length})
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
