"use client";

import React, { useState } from "react";
import { use3BFStore } from "@/lib/store";
import { Layers, Mic, Download } from "lucide-react";
import StepManagerPanel from "./StepManagerPanel";
import LienzoPasoVirgen from "./LienzoPasoVirgen";
import VoiceStudioPanel from "./VoiceStudioPanel";
import ExportManualPanel from "./ExportManualPanel";
import ManualStepSelector from "./ManualStepSelector";

type PestanaManualStudio = "pasos" | "voz" | "exportar";

export default function ManualControlPanel() {
  const { coloresApariencia, pasosManual } = use3BFStore();
  const [subPestana, setSubPestana] = useState<PestanaManualStudio>("pasos");

  const botonActivoColor = coloresApariencia?.botonActivo || "#0891b2";
  const tienePasos = Boolean(pasosManual && pasosManual.length > 0);

  return (
    <div className="h-full flex flex-col overflow-hidden relative">
      {/* 🏷️ TÍTULO PRINCIPAL DEL PANEL (Idéntica Identidad Gráfica a Modificador de Componentes) */}
      <div 
        className="p-2 lg:p-4 pb-1 lg:pb-2 border-b flex items-center justify-between shrink-0" 
        style={{ borderColor: coloresApariencia?.bordePaneles }}
      >
        <h3 className="font-bold text-[11px] lg:text-sm" style={{ color: coloresApariencia?.textoPrincipal }}>
          Configurador Manual
        </h3>
      </div>

      {/* Botonera de Sub-pestañas en Cápsulas Puras (rounded-full) */}
      <div className="p-2 border-b border-slate-200 dark:border-slate-800 flex items-center justify-center shrink-0">
        <div className="flex items-center p-0.5 bg-slate-100 dark:bg-slate-800/80 rounded-full border border-slate-200 dark:border-slate-700/80 gap-0.5 w-full">
          <button
            type="button"
            onClick={() => setSubPestana("pasos")}
            style={
              subPestana === "pasos"
                ? {
                    backgroundColor: botonActivoColor,
                    borderColor: botonActivoColor,
                    color: "#FFFFFF",
                  }
                : {
                    color: coloresApariencia?.textoSecundario || "#64748B",
                  }
            }
            className={`flex-1 flex items-center justify-center gap-1.5 py-1 px-3 rounded-full text-xs font-bold transition-all cursor-pointer select-none ${
              subPestana === "pasos"
                ? "shadow-sm text-white"
                : "hover:text-slate-900 dark:hover:text-slate-100"
            }`}
          >
            <Layers className="w-3.5 h-3.5 shrink-0" />
            <span>Pasos</span>
          </button>

          <button
            type="button"
            onClick={() => setSubPestana("voz")}
            style={
              subPestana === "voz"
                ? {
                    backgroundColor: botonActivoColor,
                    borderColor: botonActivoColor,
                    color: "#FFFFFF",
                  }
                : {
                    color: coloresApariencia?.textoSecundario || "#64748B",
                  }
            }
            className={`flex-1 flex items-center justify-center gap-1.5 py-1 px-3 rounded-full text-xs font-bold transition-all cursor-pointer select-none ${
              subPestana === "voz"
                ? "shadow-sm text-white"
                : "hover:text-slate-900 dark:hover:text-slate-100"
            }`}
          >
            <Mic className="w-3.5 h-3.5 shrink-0" />
            <span>Voz TTS</span>
          </button>

          <button
            type="button"
            onClick={() => setSubPestana("exportar")}
            style={
              subPestana === "exportar"
                ? {
                    backgroundColor: botonActivoColor,
                    borderColor: botonActivoColor,
                    color: "#FFFFFF",
                  }
                : {
                    color: coloresApariencia?.textoSecundario || "#64748B",
                  }
            }
            className={`flex-1 flex items-center justify-center gap-1.5 py-1 px-3 rounded-full text-xs font-bold transition-all cursor-pointer select-none ${
              subPestana === "exportar"
                ? "shadow-sm text-white"
                : "hover:text-slate-900 dark:hover:text-slate-100"
            }`}
          >
            <Download className="w-3.5 h-3.5 shrink-0" />
            <span>Exportar</span>
          </button>
        </div>
      </div>

      {/* 🚀 BARRA DE PASOS EN CÁPSULAS PURAS (Visible únicamente en la sub-pestaña Pasos) */}
      {subPestana === "pasos" && (
        <div className="shrink-0 border-b border-slate-200/80 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/30">
          <ManualStepSelector />
        </div>
      )}

      {/* Contenido Dinámico de Sub-pestañas con Scroll Independiente */}
      <div className="flex-1 overflow-y-auto p-2 lg:p-4 custom-scrollbar">
        {subPestana === "pasos" && (
          tienePasos ? (
            <StepManagerPanel key="panel-configurador-activo" />
          ) : (
            <LienzoPasoVirgen key="panel-lienzo-virgen" />
          )
        )}
        {subPestana === "voz" && <VoiceStudioPanel />}
        {subPestana === "exportar" && <ExportManualPanel />}
      </div>
    </div>
  );
}
