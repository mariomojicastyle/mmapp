"use client";

import React, { useState } from "react";
import { use3BFStore } from "@/lib/store";
import { Layers, Film, Mic, Download, BookOpen, Save, FolderOpen, Loader2 } from "lucide-react";
import StepManagerPanel from "./StepManagerPanel";
import SequenceTimelinePanel from "./SequenceTimelinePanel";
import VoiceStudioPanel from "./VoiceStudioPanel";
import ExportManualPanel from "./ExportManualPanel";
import ManualsLibraryModal from "./ManualsLibraryModal";

type PestanaManualStudio = "pasos" | "secuencia" | "voz" | "exportar";

export default function ManualControlPanel() {
  const {
    coloresApariencia,
    pasosManual,
    pasoActivoManualId,
    guardarManualProyecto,
    guardandoManual,
    manualActivoGuardado,
    setModalBibliotecaManualesAbierto,
  } = use3BFStore();
  const [subPestana, setSubPestana] = useState<PestanaManualStudio>("pasos");

  const pasoActivo = pasosManual.find((p) => p.id === pasoActivoManualId) || pasosManual[0];
  const botonActivoColor = coloresApariencia?.botonActivo || "#0891b2";

  return (
    <div className="h-full flex flex-col overflow-hidden relative">
      {/* Modal de Biblioteca de Manuales .3bm */}
      <ManualsLibraryModal />

      {/* Encabezado del Panel de Control de Manual Studio */}
      <div className="p-2.5 sm:p-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-1.5 shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <div
            style={{ backgroundColor: botonActivoColor }}
            className="w-7 h-7 rounded-full flex items-center justify-center text-white shadow-sm shrink-0"
          >
            <BookOpen className="w-4 h-4" />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="font-bold text-xs truncate">
              {manualActivoGuardado ? manualActivoGuardado.nombre : "Manual 3D"}
            </span>
            <span className="text-[10px] opacity-60 truncate">
              {pasoActivo ? `${pasoActivo.id} • ${pasoActivo.titulo}` : "Configuración de ensamble"}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {/* Botón Abrir Biblioteca de Manuales */}
          <button
            type="button"
            onClick={() => setModalBibliotecaManualesAbierto(true)}
            title="Abrir Biblioteca de Manuales .3bm guardados en Google Drive"
            className="px-2.5 py-1 rounded-full border border-slate-300 dark:border-slate-700 hover:bg-black/5 dark:hover:bg-white/5 transition flex items-center gap-1 font-bold text-[10px]"
          >
            <FolderOpen className="w-3 h-3 text-cyan-600" />
            <span className="hidden sm:inline">Biblioteca</span>
          </button>

          {/* Botón Guardar Proyecto .3bm */}
          <button
            type="button"
            disabled={guardandoManual}
            onClick={() => guardarManualProyecto()}
            style={{ backgroundColor: botonActivoColor }}
            title="Guardar proyecto de manual en Google Drive (.3bm.json)"
            className="px-2.5 py-1 rounded-full text-white font-bold text-[10px] shadow-sm hover:opacity-90 active:scale-95 disabled:opacity-50 transition flex items-center gap-1"
          >
            {guardandoManual ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <Save className="w-3 h-3" />
            )}
            <span className="hidden sm:inline">Guardar .3bm</span>
          </button>
        </div>
      </div>

      {/* Botonera de Sub-pestañas en Cápsulas Puras (rounded-full) */}
      <div className="p-2 border-b border-slate-200 dark:border-slate-800 flex items-center justify-center shrink-0">
        <div className="flex items-center p-0.5 bg-slate-100 dark:bg-slate-800/80 rounded-full border border-slate-200 dark:border-slate-700/80 gap-0.5 w-full">
          <button
            type="button"
            onClick={() => setSubPestana("pasos")}
            style={
              subPestana === "pasos"
                ? { backgroundColor: botonActivoColor, color: "#ffffff", borderColor: botonActivoColor }
                : {}
            }
            className={`flex-1 py-1.5 px-1 sm:px-2 rounded-full text-[10.5px] font-bold transition flex items-center justify-center gap-1 cursor-pointer select-none ${
              subPestana === "pasos" ? "shadow-sm border text-white" : "opacity-75 hover:opacity-100 border border-transparent"
            }`}
          >
            <Layers className="w-3.5 h-3.5 shrink-0" /> <span className="whitespace-nowrap">Pasos</span>
          </button>

          <button
            type="button"
            onClick={() => setSubPestana("secuencia")}
            style={
              subPestana === "secuencia"
                ? { backgroundColor: botonActivoColor, color: "#ffffff", borderColor: botonActivoColor }
                : {}
            }
            className={`flex-1 py-1.5 px-1 sm:px-2 rounded-full text-[10.5px] font-bold transition flex items-center justify-center gap-1 cursor-pointer select-none ${
              subPestana === "secuencia" ? "shadow-sm border text-white" : "opacity-75 hover:opacity-100 border border-transparent"
            }`}
          >
            <Film className="w-3.5 h-3.5 shrink-0" /> <span className="whitespace-nowrap">Secuencia</span>
          </button>

          <button
            type="button"
            onClick={() => setSubPestana("voz")}
            style={
              subPestana === "voz"
                ? { backgroundColor: botonActivoColor, color: "#ffffff", borderColor: botonActivoColor }
                : {}
            }
            className={`flex-1 py-1.5 px-1 sm:px-2 rounded-full text-[10.5px] font-bold transition flex items-center justify-center gap-1 cursor-pointer select-none ${
              subPestana === "voz" ? "shadow-sm border text-white" : "opacity-75 hover:opacity-100 border border-transparent"
            }`}
          >
            <Mic className="w-3.5 h-3.5 shrink-0" /> <span className="whitespace-nowrap">Voz TTS</span>
          </button>

          <button
            type="button"
            onClick={() => setSubPestana("exportar")}
            style={
              subPestana === "exportar"
                ? { backgroundColor: botonActivoColor, color: "#ffffff", borderColor: botonActivoColor }
                : {}
            }
            className={`flex-1 py-1.5 px-1 sm:px-2 rounded-full text-[10.5px] font-bold transition flex items-center justify-center gap-1 cursor-pointer select-none ${
              subPestana === "exportar" ? "shadow-sm border text-white" : "opacity-75 hover:opacity-100 border border-transparent"
            }`}
          >
            <Download className="w-3.5 h-3.5 shrink-0" /> <span className="whitespace-nowrap">Exportar</span>
          </button>
        </div>
      </div>

      {/* Contenido Desplazable del Panel */}
      <div className="flex-1 p-3 overflow-y-auto custom-scrollbar">
        {subPestana === "pasos" && <StepManagerPanel />}
        {subPestana === "secuencia" && <SequenceTimelinePanel />}
        {subPestana === "voz" && <VoiceStudioPanel />}
        {subPestana === "exportar" && <ExportManualPanel />}
      </div>
    </div>
  );
}
