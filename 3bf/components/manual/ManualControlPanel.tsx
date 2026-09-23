"use client";

import React, { useState } from "react";
import { use3BFStore } from "@/lib/store";
import { Layers, Mic, Download, Save, Loader2, Check } from "lucide-react";
import StepManagerPanel from "./StepManagerPanel";
import VoiceStudioPanel from "./VoiceStudioPanel";
import ExportManualPanel from "./ExportManualPanel";
import ManualsLibraryModal from "./ManualsLibraryModal";
import ManualStepSelector from "./ManualStepSelector";

type PestanaManualStudio = "pasos" | "voz" | "exportar";

export default function ManualControlPanel() {
  const {
    coloresApariencia,
    cargarManualesDesdeDrive,
    guardarManualProyecto,
    guardandoManual,
  } = use3BFStore();
  const [subPestana, setSubPestana] = useState<PestanaManualStudio>("pasos");
  const [guardadoReciente, setGuardadoReciente] = useState(false);

  React.useEffect(() => {
    cargarManualesDesdeDrive();
  }, [cargarManualesDesdeDrive]);

  const botonActivoColor = coloresApariencia?.botonActivo || "#0891b2";

  return (
    <div className="h-full flex flex-col overflow-hidden relative">
      {/* Modal de Biblioteca de Manuales .3bm */}
      <ManualsLibraryModal />

      {/* 🏷️ TÍTULO PRINCIPAL DEL PANEL (Idéntica Identidad Gráfica a Modificador de Componentes) */}
      <div 
        className="p-2 lg:p-4 pb-1 lg:pb-2 border-b flex items-center justify-between shrink-0" 
        style={{ borderColor: coloresApariencia?.bordePaneles }}
      >
        <h3 className="font-bold text-[11px] lg:text-sm" style={{ color: coloresApariencia?.textoPrincipal }}>
          Configurador Manual
        </h3>

        {/* 💾 Botón Guardar Manual Directo en Cápsula Pura (rounded-full) */}
        <button
          type="button"
          onClick={async () => {
            const exito = await guardarManualProyecto();
            if (exito !== false) {
              setGuardadoReciente(true);
              setTimeout(() => setGuardadoReciente(false), 2500);
            }
          }}
          disabled={guardandoManual}
          title="Guardar cambios del manual 3D (.3bm) en cualquier momento sin salir del panel"
          style={{
            backgroundColor: guardadoReciente ? "#10b981" : botonActivoColor,
            borderColor: guardadoReciente ? "#059669" : coloresApariencia?.colorMarca || botonActivoColor,
          }}
          className="px-3 py-1 rounded-full text-white shadow-sm border flex items-center gap-1.5 text-[11px] font-bold leading-none hover:opacity-90 active:scale-95 transition-all cursor-pointer disabled:opacity-50 select-none shrink-0"
        >
          {guardandoManual ? (
            <>
              <Loader2 className="w-3 h-3 text-white animate-spin shrink-0" />
              <span>Guardando...</span>
            </>
          ) : guardadoReciente ? (
            <>
              <Check className="w-3 h-3 text-white shrink-0" />
              <span>¡Guardado!</span>
            </>
          ) : (
            <>
              <Save className="w-3 h-3 text-white shrink-0" />
              <span>Guardar Manual</span>
            </>
          )}
        </button>
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

      {/* 📌 LÍNEA DE PASOS FIJA (Inmóvil, siempre visible al hacer scroll) */}
      <ManualStepSelector />

      {/* Contenido Desplazable del Panel */}
      <div className="flex-1 p-3 overflow-y-auto custom-scrollbar">
        {subPestana === "pasos" && <StepManagerPanel />}
        {subPestana === "voz" && <VoiceStudioPanel />}
        {subPestana === "exportar" && <ExportManualPanel />}
      </div>
    </div>
  );
}
