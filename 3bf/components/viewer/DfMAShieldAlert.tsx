"use client";

import React from "react";
import { AlertTriangle, Eye, EyeOff, X } from "lucide-react";
import { use3BFStore } from "@/lib/store";

export interface DfMAShieldAlertProps {
  alertaDuplicadosDescartada: boolean;
  setAlertaDuplicadosDescartada: (v: boolean) => void;
  mostrarDuplicadosRojos: boolean;
  setMostrarDuplicadosRojos: (v: boolean) => void;
}

export function DfMAShieldAlert({
  alertaDuplicadosDescartada,
  setAlertaDuplicadosDescartada,
  mostrarDuplicadosRojos,
  setMostrarDuplicadosRojos,
}: DfMAShieldAlertProps) {
  const { objetoActivoId, instancias, resultado, purgarMallasDuplicadas, tema } = use3BFStore();

  const resultadoEfectivo = (objetoActivoId && instancias[objetoActivoId]?.resultado) || resultado;
  const mallasDuplicadasWorker = resultadoEfectivo?.mallas_duplicadas_detectadas;
  const tieneDuplicadosWorker = Boolean(
    mallasDuplicadasWorker && Object.keys(mallasDuplicadasWorker).length > 0
  );

  if (alertaDuplicadosDescartada || !tieneDuplicadosWorker || !mallasDuplicadasWorker) {
    return null;
  }

  const isDark = tema === "obsidian";

  return (
    <div className="absolute top-3.5 left-1/2 -translate-x-1/2 z-30 pointer-events-auto max-w-[94vw] sm:max-w-2xl animate-in fade-in slide-in-from-top-3 duration-300">
      <div 
        style={{
          backgroundColor: isDark ? "#131B2E" : "#FFFFFF",
          borderColor: isDark ? "rgba(239, 68, 68, 0.55)" : "rgba(239, 68, 68, 0.45)",
          boxShadow: isDark 
            ? "0 10px 25px -5px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(239, 68, 68, 0.25)"
            : "0 10px 25px -5px rgba(0, 0, 0, 0.08), 0 0 0 1px rgba(239, 68, 68, 0.2)",
        }}
        className="flex items-center gap-2 sm:gap-3 px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-full border select-none"
      >
        <div className="flex items-center justify-center w-6 h-6 rounded-full bg-red-500/20 text-red-500 shrink-0">
          <AlertTriangle className="w-3.5 h-3.5 animate-pulse" />
        </div>

        <div className="text-[11px] leading-tight flex-1 min-w-0">
          <span 
            style={{ color: isDark ? "#F87171" : "#DC2626" }}
            className="font-bold mr-1.5 whitespace-nowrap"
          >
            [DfMA Shield] Duplicados detectados:
          </span>
          <span 
            style={{ color: isDark ? "#F8FAFC" : "#0F172A" }}
            className="font-mono font-bold tracking-tight"
          >
            {Object.entries(mallasDuplicadasWorker)
              .map(([nombre, cant]) => `${nombre} (×${cant})`)
              .join(", ")}
          </span>
          <span 
            style={{ color: isDark ? "#94A3B8" : "#64748B" }}
            className="hidden md:inline ml-2 text-[10px]"
          >
            — {mostrarDuplicadosRojos ? "Resaltados en rojo en el visor 3D." : "Ocultados del visor 3D."}
          </span>
        </div>

        {/* Botón Píldora: Alternar visualización roja */}
        <button
          type="button"
          onClick={() => setMostrarDuplicadosRojos(!mostrarDuplicadosRojos)}
          style={{
            backgroundColor: mostrarDuplicadosRojos 
              ? (isDark ? "rgba(239, 68, 68, 0.25)" : "#FEE2E2")
              : (isDark ? "rgba(255, 255, 255, 0.08)" : "#F1F5F9"),
            color: mostrarDuplicadosRojos
              ? (isDark ? "#FCA5A5" : "#B91C1C")
              : (isDark ? "#94A3B8" : "#64748B"),
            borderColor: mostrarDuplicadosRojos
              ? (isDark ? "rgba(239, 68, 68, 0.5)" : "rgba(239, 68, 68, 0.35)")
              : (isDark ? "rgba(255, 255, 255, 0.15)" : "rgba(0, 0, 0, 0.1)"),
          }}
          className="px-2.5 py-1 rounded-full text-[10px] font-bold border flex items-center gap-1.5 transition-all hover:scale-105 cursor-pointer shrink-0"
          title={mostrarDuplicadosRojos ? "Ocultar mallas duplicadas en el visor 3D" : "Mostrar mallas duplicadas en rojo para inspección"}
        >
          {mostrarDuplicadosRojos ? (
            <>
              <EyeOff className="w-3 h-3 text-red-500" />
              <span>Ocultar</span>
            </>
          ) : (
            <>
              <Eye className="w-3 h-3" />
              <span>Ver en Rojo</span>
            </>
          )}
        </button>

        {/* Botón Píldora: Purgar y cerrar */}
        <button
          type="button"
          onClick={() => {
            purgarMallasDuplicadas();
            setMostrarDuplicadosRojos(false);
            setAlertaDuplicadosDescartada(true);
          }}
          style={{
            backgroundColor: isDark ? "rgba(19, 104, 170, 0.25)" : "#E0F2FE",
            color: isDark ? "#93C5FD" : "#0369A1",
            borderColor: isDark ? "rgba(19, 104, 170, 0.45)" : "rgba(19, 104, 170, 0.3)",
          }}
          className="px-2.5 py-1 rounded-full text-[10px] font-bold border flex items-center gap-1 transition-all hover:scale-105 cursor-pointer shrink-0"
          title="Purgar duplicados del visor y cerrar advertencia"
        >
          <span>Purgar</span>
        </button>

        <button
          type="button"
          onClick={() => setAlertaDuplicadosDescartada(true)}
          style={{
            color: isDark ? "#94A3B8" : "#64748B",
          }}
          className="w-6 h-6 rounded-full flex items-center justify-center hover:bg-black/10 dark:hover:bg-white/10 transition-colors shrink-0 cursor-pointer"
          title="Cerrar aviso"
          aria-label="Cerrar aviso"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

export default DfMAShieldAlert;
