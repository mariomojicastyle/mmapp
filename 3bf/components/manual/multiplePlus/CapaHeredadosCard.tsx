"use client";

import React, { useState, useMemo } from "react";
import {
  Boxes,
  Eye,
  EyeOff,
  Sparkles,
  ChevronDown,
  ChevronRight,
  Search,
  Layers,
  History,
  CheckCircle2,
} from "lucide-react";
import { PasoManualStudio } from "@/lib/storeTypes";
import { use3BFStore } from "@/lib/store";
import { calcularHeredadosPaso, PiezaInactivaItem } from "@/lib/engine/inactivosVirtualesUtils";

interface CapaHeredadosCardProps {
  paso: PasoManualStudio;
  pasosManual: PasoManualStudio[];
  botonActivoColor?: string;
}

export function CapaHeredadosCard({
  paso,
  pasosManual,
  botonActivoColor = "#0088AA",
}: CapaHeredadosCardProps) {
  const {
    resultado,
    setModoVisualizacionHeredadosPlus,
  } = use3BFStore() as any;

  const [colapsada, setColapsada] = useState(true);
  const [busqueda, setBusqueda] = useState("");

  // Modo de visualización actual de los heredados ("solido" | "cristal" | "oculto")
  const modoActual = paso.multiplePlus?.modoVisualizacionHeredados || "solido";

  // Cálculo en memoria de piezas heredadas de pasos previos cronológicamente
  const heredados = useMemo(() => {
    return calcularHeredadosPaso(paso, resultado, pasosManual);
  }, [paso, resultado, pasosManual]);

  // Si no hay pasos previos o no hay piezas heredadas, no mostramos ruido visual
  if (heredados.totalGeneral === 0) {
    return null;
  }

  // Filtrado por buscador
  const tablerosFiltrados = !busqueda.trim()
    ? heredados.tableros
    : heredados.tableros.filter((t) => t.nombre.toLowerCase().includes(busqueda.toLowerCase().trim()));

  const herrajesFiltrados = !busqueda.trim()
    ? heredados.herrajes
    : heredados.herrajes.filter((h) => h.nombre.toLowerCase().includes(busqueda.toLowerCase().trim()));

  return (
    <div className="relative rounded-2xl border border-slate-300 dark:border-slate-800 bg-amber-50/40 dark:bg-slate-900/60 backdrop-blur-sm transition-all shadow-xs overflow-hidden">
      {/* ── CABECERA DE LA CAPA HEREDADA ── */}
      <div className="p-3.5 flex flex-wrap items-center justify-between gap-3 bg-white/80 dark:bg-slate-800/80 border-b border-amber-200/60 dark:border-slate-700/60">
        {/* Título e Identificación */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setColapsada(!colapsada)}
            className="w-7 h-7 rounded-full flex items-center justify-center bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-300 transition cursor-pointer"
            title={colapsada ? "Expandir objetos heredados" : "Colapsar objetos heredados"}
          >
            {colapsada ? <ChevronRight className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full flex items-center justify-center bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300">
              <History className="w-3.5 h-3.5" />
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                Capa de Objetos Heredados
                <span className="text-[10px] font-normal text-amber-700 dark:text-amber-400 bg-amber-100 dark:bg-amber-950/70 px-2 py-0.2 rounded-full">
                  Pasos anteriores
                </span>
              </span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400">
                Piezas ya ensambladas que permanecen firmes en reposo
              </span>
            </div>
          </div>

          {/* Badge Contador en Cápsula */}
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-100/90 dark:bg-amber-900/40 text-amber-800 dark:text-amber-200 border border-amber-200/80 dark:border-amber-800/60 shadow-2xs">
            {heredados.totalTableros} tableros · {heredados.totalHerrajes} herrajes
          </span>
        </div>

        {/* ── SELECTOR DE MODO DE VISUALIZACIÓN EN CÁPSULA TRIPLE ── */}
        <div className="flex items-center gap-1 p-1 rounded-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-inner">
          {/* Opción 1: Sólido / Render (Por defecto) */}
          <button
            type="button"
            onClick={() => setModoVisualizacionHeredadosPlus(paso.id, "solido")}
            title="Mostrar piezas heredadas con su textura PBR sólida normal ya ensamblada"
            className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold transition-all cursor-pointer ${
              modoActual === "solido"
                ? "bg-[#0088AA] dark:bg-[#1368AA] text-white shadow-sm"
                : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <Boxes className="w-3 h-3" />
            <span>Sólido</span>
          </button>

          {/* Opción 2: Modo Cristal */}
          <button
            type="button"
            onClick={() => setModoVisualizacionHeredadosPlus(paso.id, "cristal")}
            title="Mostrar piezas heredadas en modo cristal vítreo traslúcido"
            className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold transition-all cursor-pointer ${
              modoActual === "cristal"
                ? "bg-[#0088AA] dark:bg-[#1368AA] text-white shadow-sm"
                : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <Sparkles className="w-3 h-3" />
            <span>Modo Cristal</span>
          </button>

          {/* Opción 3: Ocultar */}
          <button
            type="button"
            onClick={() => setModoVisualizacionHeredadosPlus(paso.id, "oculto")}
            title="Ocultar las piezas ya ensambladas para enfocar la cámara solo en las piezas nuevas"
            className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold transition-all cursor-pointer ${
              modoActual === "oculto"
                ? "bg-slate-700 text-white shadow-sm"
                : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <EyeOff className="w-3 h-3" />
            <span>Ocultos</span>
          </button>
        </div>
      </div>

      {/* ── CONTENIDO DESPLEGABLE (LISTADO DE HEREDADOS) ── */}
      {!colapsada && (
        <div className="p-3.5 flex flex-col gap-3">
          {/* Barra de Filtro / Búsqueda */}
          {heredados.totalGeneral > 4 && (
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Buscar pieza o herraje heredado..."
                className="w-full pl-8 pr-3 py-1.5 rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-[11px] outline-none focus:border-cyan-500 shadow-2xs"
              />
            </div>
          )}

          {/* Tableros Heredados */}
          {tablerosFiltrados.length > 0 && (
            <div className="flex flex-col gap-1.5">
              <span className="text-[10.5px] font-bold text-amber-800 dark:text-amber-300 flex items-center gap-1">
                <span>Tableros Heredados:</span>
                <span className="font-mono opacity-60">({tablerosFiltrados.length})</span>
              </span>
              <div className="flex flex-wrap gap-1.5">
                {tablerosFiltrados.map((item) => (
                  <div
                    key={item.key}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white dark:bg-slate-800 border border-amber-200/90 dark:border-amber-900/60 text-slate-700 dark:text-slate-200 text-[11px] shadow-2xs"
                  >
                    <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0" />
                    <span className="font-medium">{item.nombre}</span>
                    {item.cantidad > 1 && (
                      <span className="px-1.5 py-0.2 rounded-full bg-amber-100 dark:bg-amber-950 text-[9px] font-bold text-amber-700">
                        x{item.cantidad}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Herrajes Heredados */}
          {herrajesFiltrados.length > 0 && (
            <div className="flex flex-col gap-1.5 mt-1">
              <span className="text-[10.5px] font-bold text-cyan-800 dark:text-cyan-300 flex items-center gap-1">
                <span>Herrajes Heredados:</span>
                <span className="font-mono opacity-60">({herrajesFiltrados.length})</span>
              </span>
              <div className="flex flex-wrap gap-1.5">
                {herrajesFiltrados.map((item) => (
                  <div
                    key={item.key}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white dark:bg-slate-800 border border-cyan-200/90 dark:border-cyan-900/60 text-slate-700 dark:text-slate-200 text-[11px] shadow-2xs"
                  >
                    <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0" />
                    <span className="font-medium">{item.nombre}</span>
                    {item.cantidad > 1 && (
                      <span className="px-1.5 py-0.2 rounded-full bg-cyan-100 dark:bg-cyan-950 text-[9px] font-bold text-cyan-700">
                        x{item.cantidad}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
