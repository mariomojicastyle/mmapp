"use client";

import React, { useEffect } from "react";
import Viewer3D from "@/components/viewer/Viewer3D";
import ControlPanel from "@/components/ui/ControlPanel";
import DespieceView from "@/components/views/DespieceView";
import DatabaseView from "@/components/views/DatabaseView";
import { use3BFStore } from "@/lib/store";
import { Box, Layers, Cpu, CheckCircle2, AlertCircle, Database } from "lucide-react";

export default function Home3BF() {
  const { pestanaActiva, setPestanaActiva, workerStatus, setWorkerStatus } = use3BFStore();

  const verificarWorker = async () => {
    try {
      const res = await fetch("/api/compute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model_id: "Cubierta", ancho: 1200, alto: 800, profundidad: 400 }),
      });
      const data = await res.json();
      if (data.status === "success" || data.real_meshes || res.ok) {
        setWorkerStatus("online");
      } else {
        setWorkerStatus("offline");
      }
    } catch {
      setWorkerStatus("offline");
    }
  };

  useEffect(() => {
    verificarWorker();
  }, []);

  return (
    <main className="w-screen h-screen flex flex-col overflow-hidden bg-[var(--bg-main)] text-[var(--text-main)]">
      {/* TopNav Barra Superior */}
      <header className="h-14 px-4 flex items-center justify-between border-b border-gray-200 dark:border-gray-800 glass-panel z-10 relative">
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

        {/* Pestañas de Vista (Centradas con Fondo Cánhamo/Cian Traslúcido de Sección) */}
        <div className="absolute left-1/2 -translate-x-1/2 flex bg-cyan-950/20 dark:bg-[#131B2E]/60 p-1 rounded-full border border-cyan-200/80 dark:border-cyan-900/50 text-xs shadow-md backdrop-blur-md gap-1">
          <button
            onClick={() => setPestanaActiva("3d")}
            className={`px-4 py-1.5 rounded-full transition flex items-center gap-1.5 font-bold cursor-pointer ${
              pestanaActiva === "3d"
                ? "bg-cyan-600 text-white shadow-md border border-cyan-400/40"
                : "bg-[#E2E8F0]/50 text-[#0F172A] hover:bg-[#E2E8F0]/80 border border-slate-300/60 backdrop-blur-sm"
            }`}
          >
            <Box className="w-3.5 h-3.5" /> Visor 3D
          </button>
          <button
            onClick={() => setPestanaActiva("despiece")}
            className={`px-4 py-1.5 rounded-full transition flex items-center gap-1.5 font-bold cursor-pointer ${
              pestanaActiva === "despiece"
                ? "bg-cyan-600 text-white shadow-md border border-cyan-400/40"
                : "bg-[#E2E8F0]/50 text-[#0F172A] hover:bg-[#E2E8F0]/80 border border-slate-300/60 backdrop-blur-sm"
            }`}
          >
            <Layers className="w-3.5 h-3.5" /> Despiece & Costos
          </button>
          <button
            onClick={() => setPestanaActiva("basedatos")}
            className={`px-4 py-1.5 rounded-full transition flex items-center gap-1.5 font-bold cursor-pointer ${
              pestanaActiva === "basedatos"
                ? "bg-cyan-600 text-white shadow-md border border-cyan-400/40"
                : "bg-[#E2E8F0]/50 text-[#0F172A] hover:bg-[#E2E8F0]/80 border border-slate-300/60 backdrop-blur-sm"
            }`}
          >
            <Database className="w-3.5 h-3.5" /> Base de Datos
          </button>
        </div>

        {/* Estado del Worker Python (Esquina superior derecha en Gris Traslúcido al 50%) */}
        <button
          onClick={verificarWorker}
          title="Haz clic para comprobar la conexión con el Worker Python"
          className="flex items-center gap-1.5 text-xs px-3.5 py-1.5 rounded-full bg-[#E2E8F0]/50 border border-slate-300/60 backdrop-blur-sm hover:border-cyan-500 hover:bg-[#E2E8F0]/80 transition cursor-pointer shadow-md text-[#0F172A] font-bold"
        >
          <Cpu className="w-3.5 h-3.5 text-cyan-700" />
          <span className="font-bold text-[#0F172A]">Worker:</span>
          {workerStatus === "online" ? (
            <span className="text-emerald-700 font-bold flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Online (Py)
            </span>
          ) : (
            <span className="text-amber-700 font-bold flex items-center gap-1">
              <AlertCircle className="w-3 h-3 text-amber-600" /> API Fallback
            </span>
          )}
        </button>
      </header>

      {/* Cuerpo Principal dividido en 2 columnas */}
      <div className="flex-1 flex overflow-hidden p-3 gap-3">
        {/* Columna Izquierda: Visor 3D o Tablas de Datos */}
        <div className="flex-1 h-full flex flex-col relative">
          {pestanaActiva === "3d" ? (
            <Viewer3D />
          ) : pestanaActiva === "despiece" ? (
            <DespieceView />
          ) : (
            <DatabaseView />
          )}
        </div>

        {/* Columna Derecha: Panel de Control de Parámetros */}
        <div className="w-80 h-full glass-panel rounded-xl border border-gray-200 dark:border-cyan-900/50 flex flex-col">
          <ControlPanel />
        </div>
      </div>
    </main>
  );
}
