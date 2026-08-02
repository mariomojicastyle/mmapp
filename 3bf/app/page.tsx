"use client";

import React from "react";
import Viewer3D from "@/components/viewer/Viewer3D";
import ControlPanel from "@/components/ui/ControlPanel";
import DespieceView from "@/components/views/DespieceView";
import { use3BFStore } from "@/lib/store";
import { Box, Layers, Cpu, Sparkles } from "lucide-react";

export default function Home3BF() {
  const { pestanaActiva, setPestanaActiva, tema } = use3BFStore();

  return (
    <main className="w-screen h-screen flex flex-col overflow-hidden bg-[var(--bg-main)] text-[var(--text-main)]">
      {/* TopNav Barra Superior */}
      <header className="h-14 px-4 flex items-center justify-between border-b border-gray-200 dark:border-gray-800 glass-panel z-10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-600 to-teal-400 flex items-center justify-center text-white font-bold text-sm shadow-md">
            3BF
          </div>
          <div>
            <h1 className="font-bold text-sm leading-none flex items-center gap-1.5">
              3DBimFab Engine <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-100 dark:bg-cyan-950 text-cyan-700 dark:text-cyan-300 font-mono">v1.0</span>
            </h1>
            <p className="text-[10px] text-gray-500">Motor de Manufactura Digital Paramétrica & DfMA</p>
          </div>
        </div>

        {/* Pestañas de Vista */}
        <div className="flex bg-gray-100 dark:bg-gray-800/60 p-1 rounded-lg border border-gray-200 dark:border-gray-700 text-xs">
          <button
            onClick={() => setPestanaActiva("3d")}
            className={`px-3 py-1 rounded-md transition flex items-center gap-1.5 ${pestanaActiva === "3d" ? "bg-white dark:bg-gray-700 font-semibold shadow-sm text-cyan-600 dark:text-cyan-300" : "text-gray-500"}`}
          >
            <Box className="w-3.5 h-3.5" /> Visor 3D
          </button>
          <button
            onClick={() => setPestanaActiva("despiece")}
            className={`px-3 py-1 rounded-md transition flex items-center gap-1.5 ${pestanaActiva === "despiece" ? "bg-white dark:bg-gray-700 font-semibold shadow-sm text-cyan-600 dark:text-cyan-300" : "text-gray-500"}`}
          >
            <Layers className="w-3.5 h-3.5" /> Despiece & Costos
          </button>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-gray-500">
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          <span>VIKTOR.ai Architecture Pattern</span>
        </div>
      </header>

      {/* Cuerpo Principal dividido en 2 columnas */}
      <div className="flex-1 flex overflow-hidden p-3 gap-3">
        {/* Columna Izquierda: Visor 3D o Tablas de Datos */}
        <div className="flex-1 h-full flex flex-col relative">
          {pestanaActiva === "3d" ? <Viewer3D /> : <DespieceView />}
        </div>

        {/* Columna Derecha: Panel de Control de Parámetros */}
        <div className="w-80 h-full glass-panel rounded-xl border border-gray-200 dark:border-gray-800 flex flex-col">
          <ControlPanel />
        </div>
      </div>
    </main>
  );
}
