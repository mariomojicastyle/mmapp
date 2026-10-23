"use client";

import React, { useState } from "react";
import { use3BFStore } from "@/lib/store";
import { Plus, GripVertical, Boxes } from "lucide-react";
import ModalCrearPaso from "./ModalCrearPaso";

export default function ManualStepSelector() {
  const {
    pasosManual,
    pasoActivoManualId,
    seleccionarPasoManualActivo,
    reordenarPasosManual,
    coloresApariencia,
  } = use3BFStore();

  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [modalCrearAbierto, setModalCrearAbierto] = useState(false);

  const botonActivoColor = coloresApariencia?.botonActivo || "#0891b2";

  return (
    <div className="flex flex-col gap-1.5 px-3 py-2 border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm shrink-0 select-none relative">
      {/* 🏷️ Modal Flotante Unificado con React Portal (z-[9999]) */}
      <ModalCrearPaso
        abierto={modalCrearAbierto}
        onCerrar={() => setModalCrearAbierto(false)}
        tipoInicialSugerido="armado_capas"
      />

      <div className="flex items-center justify-between">
        <span className="font-bold tracking-wide uppercase opacity-70 text-[10px]">
          Línea de Pasos del Manual
        </span>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setModalCrearAbierto(true)}
            style={{ backgroundColor: botonActivoColor, borderColor: botonActivoColor }}
            className="flex items-center gap-1.5 px-3 py-1 rounded-full border text-white hover:opacity-90 shadow-xs transition font-bold text-[11px] cursor-pointer active:scale-95 select-none"
            title="Crear un nuevo paso en el manual"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Nuevo Paso</span>
          </button>
        </div>
      </div>

      <div className="flex items-center gap-1.5 overflow-x-auto py-1 custom-scrollbar">
        {(!pasosManual || pasosManual.length === 0) ? (
          <span className="text-[11px] text-slate-400 italic py-0.5 px-1">
            Sin pasos creados en este manual
          </span>
        ) : (
          pasosManual.map((paso, index) => {
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
                title={esP00 ? `${paso.titulo || "Paso 00 Showcase"} (Fijo)` : `Arrastra para reordenar paso ${paso.id}`}
                className={`px-3 py-1 rounded-full border text-[11px] font-bold shrink-0 transition flex items-center gap-1.5 select-none cursor-pointer ${
                  esP00
                    ? "cursor-default"
                    : "hover:bg-slate-100 dark:hover:bg-slate-800"
                } ${
                  esDragOver
                    ? "border-cyan-500 scale-105 shadow-md bg-cyan-500/10"
                    : "border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 shadow-2xs"
                }`}
              >
                {!esP00 && <GripVertical className="w-2.5 h-2.5 opacity-40 hover:opacity-100 shrink-0" />}
                <span className="truncate">{paso.id}</span>
                {paso.piezasAsignadas && paso.piezasAsignadas.length > 0 && (
                  <span className="flex items-center gap-0.5 text-[9px] opacity-80 font-normal">
                    <Boxes className="w-2.5 h-2.5" />
                    {paso.piezasAsignadas.length}
                  </span>
                )}
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
