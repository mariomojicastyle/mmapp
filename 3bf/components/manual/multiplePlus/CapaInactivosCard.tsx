"use client";

import React from "react";
import {
  Boxes,
  EyeOff,
  Sparkles,
  Globe,
} from "lucide-react";
import { PasoManualStudio } from "@/lib/storeTypes";
import { use3BFStore } from "@/lib/store";

interface CapaInactivosCardProps {
  paso: PasoManualStudio;
  pasosManual?: PasoManualStudio[];
  botonActivoColor?: string;
}

export function CapaInactivosCard({
  paso,
  botonActivoColor = "#0088AA",
}: CapaInactivosCardProps) {
  const { setModoVisualizacionInactivosPlus } = use3BFStore() as any;

  // Modo de visualización actual de los inactivos ("oculto" | "cristal" | "global")
  const modoActual = paso.multiplePlus?.modoVisualizacionInactivos || "cristal";

  return (
    <div className="relative rounded-2xl border border-slate-300 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm transition-all shadow-xs p-3 flex flex-wrap items-center justify-between gap-3">
      {/* ── IDENTIFICACIÓN Y TÍTULO ── */}
      <div className="flex items-center gap-2.5">
        <div className="w-7 h-7 rounded-full flex items-center justify-center bg-sky-100 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 shrink-0">
          <Boxes className="w-3.5 h-3.5" />
        </div>
        <div className="flex flex-col">
          <span className="text-xs font-bold text-slate-800 dark:text-slate-100">
            Capa Virtual de Inactivos
          </span>
          <span className="text-[10px] text-slate-500 dark:text-slate-400">
            Piezas de fondo fuera de este paso
          </span>
        </div>
      </div>

      {/* ── SELECTOR DE MODO DE VISUALIZACIÓN EN CÁPSULA TRIPLE ── */}
      <div className="flex items-center gap-1 p-1 rounded-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-inner">
        {/* Opción 1: Ocultos */}
        <button
          type="button"
          onClick={() => setModoVisualizacionInactivosPlus(paso.id, "oculto")}
          title="Ocultar por completo las piezas inactivas en este paso"
          className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold transition-all cursor-pointer ${
            modoActual === "oculto"
              ? "bg-slate-700 text-white shadow-sm"
              : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
          }`}
        >
          <EyeOff className="w-3 h-3" />
          <span>Ocultos</span>
        </button>

        {/* Opción 2: Modo Cristal Oficial */}
        <button
          type="button"
          onClick={() => setModoVisualizacionInactivosPlus(paso.id, "cristal")}
          title="Mostrar piezas inactivas con el material de cristal vítreo oficial de la plataforma"
          style={modoActual === "cristal" ? { backgroundColor: botonActivoColor } : undefined}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold transition-all cursor-pointer ${
            modoActual === "cristal"
              ? "text-white shadow-sm"
              : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
          }`}
        >
          <Sparkles className="w-3 h-3" />
          <span>Modo Cristal</span>
        </button>

        {/* Opción 3: Modo Global */}
        <button
          type="button"
          onClick={() => setModoVisualizacionInactivosPlus(paso.id, "global")}
          title="Mostrar piezas inactivas con el mismo modo de visualización global (Líneas, Cristal, Sólido o Render) activo arriba"
          style={modoActual === "global" ? { backgroundColor: botonActivoColor } : undefined}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold transition-all cursor-pointer ${
            modoActual === "global"
              ? "text-white shadow-sm"
              : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
          }`}
        >
          <Globe className="w-3 h-3" />
          <span>Modo Global</span>
        </button>
      </div>
    </div>
  );
}
