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
  Plus,
  ArrowRight,
  Layers,
  Globe,
} from "lucide-react";
import { PasoManualStudio } from "@/lib/storeTypes";
import { use3BFStore } from "@/lib/store";
import { calcularInactivosPaso, PiezaInactivaItem } from "@/lib/engine/inactivosVirtualesUtils";

interface CapaInactivosCardProps {
  paso: PasoManualStudio;
  pasosManual: PasoManualStudio[];
  botonActivoColor?: string;
}

export function CapaInactivosCard({
  paso,
  pasosManual,
  botonActivoColor = "#0088AA",
}: CapaInactivosCardProps) {
  const {
    resultado,
    setModoVisualizacionInactivosPlus,
    asignarInactivoACapaPlus,
    crearCapaPlus,
  } = use3BFStore() as any;

  const [colapsada, setColapsada] = useState(false);
  const [busqueda, setBusqueda] = useState("");
  const [menuAsignarItem, setMenuAsignarItem] = useState<PiezaInactivaItem | null>(null);

  // Modo de visualización actual de los inactivos ("oculto" | "cristal")
  const modoActual = paso.multiplePlus?.modoVisualizacionInactivos || "oculto";
  const esModoCristal = modoActual === "cristal";

  // Cálculo en memoria de piezas inactivas (Diferencia de conjuntos virtual)
  const inactivos = useMemo(() => {
    return calcularInactivosPaso(paso, resultado, pasosManual);
  }, [paso, resultado, pasosManual]);

  // Capas activas disponibles del paso para mover piezas
  const capasActivas = useMemo(() => {
    return paso.multiplePlus?.capas || [];
  }, [paso.multiplePlus?.capas]);

  // Filtrado por buscador
  const tablerosFiltrados = useMemo(() => {
    if (!busqueda.trim()) return inactivos.tableros;
    const bLow = busqueda.toLowerCase().trim();
    return inactivos.tableros.filter((t) => t.nombre.toLowerCase().includes(bLow));
  }, [inactivos.tableros, busqueda]);

  const herrajesFiltrados = useMemo(() => {
    if (!busqueda.trim()) return inactivos.herrajes;
    const bLow = busqueda.toLowerCase().trim();
    return inactivos.herrajes.filter((h) => h.nombre.toLowerCase().includes(bLow));
  }, [inactivos.herrajes, busqueda]);

  const handleMoverACapa = (item: PiezaInactivaItem, capaId: string) => {
    asignarInactivoACapaPlus(paso.id, capaId, item.key, item.tipo);
    setMenuAsignarItem(null);
  };

  const handleMoverANuevaCapa = (item: PiezaInactivaItem) => {
    crearCapaPlus(paso.id);
    // Asignar en la última capa creada
    setTimeout(() => {
      const state = use3BFStore.getState();
      const pasoActual = state.pasosManual.find((p) => p.id === paso.id);
      const capasActuales = pasoActual?.multiplePlus?.capas || [];
      if (capasActuales.length > 0) {
        const ultimaCapa = capasActuales[capasActuales.length - 1];
        state.asignarInactivoACapaPlus(paso.id, ultimaCapa.id, item.key, item.tipo);
      }
    }, 50);
    setMenuAsignarItem(null);
  };

  return (
    <div className="relative rounded-2xl border border-slate-300 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/60 backdrop-blur-sm transition-all shadow-xs overflow-hidden">
      {/* ── CABECERA DE LA CAPA VIRTUAL ── */}
      <div className="p-3.5 flex flex-wrap items-center justify-between gap-3 bg-white/70 dark:bg-slate-800/70 border-b border-slate-200/80 dark:border-slate-700/60">
        {/* Título e Identificación */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setColapsada(!colapsada)}
            className="w-7 h-7 rounded-full flex items-center justify-center bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-300 transition cursor-pointer"
            title={colapsada ? "Expandir inactivos" : "Colapsar inactivos"}
          >
            {colapsada ? <ChevronRight className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full flex items-center justify-center bg-sky-100 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300">
              <Boxes className="w-3.5 h-3.5" />
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-100">
                Capa Virtual de Inactivos
              </span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400">
                Piezas fuera de este paso calculadas en memoria
              </span>
            </div>
          </div>

          {/* Badge Contador en Cápsula */}
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-slate-200/80 dark:bg-slate-700 text-slate-700 dark:text-slate-200 shadow-2xs">
            {inactivos.totalGeneral === 0 ? "0 restantes (100% asignado)" : `${inactivos.totalTableros} tableros · ${inactivos.totalHerrajes} herrajes`}
          </span>
        </div>

        {/* ── SELECTOR DE MODO DE VISUALIZACIÓN EN CÁPSULA TRIPLE ── */}
        <div className="flex items-center gap-1 p-1 rounded-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-inner">
          {/* Opción 1: Ocultos */}
          <button
            type="button"
            onClick={() => setModoVisualizacionInactivosPlus(paso.id, "oculto")}
            title="Ocultar por completo las piezas inactivas en este paso"
            className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold transition-all cursor-pointer ${
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
            className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold transition-all cursor-pointer ${
              modoActual === "cristal"
                ? "bg-[#0088AA] dark:bg-[#1368AA] text-white shadow-sm"
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
            className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold transition-all cursor-pointer ${
              modoActual === "global"
                ? "bg-[#0088AA] dark:bg-[#1368AA] text-white shadow-sm"
                : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <Globe className="w-3 h-3" />
            <span>Modo Global</span>
          </button>
        </div>
      </div>

      {/* ── CONTENIDO DESPLEGABLE (LISTADO DE INACTIVOS) ── */}
      {!colapsada && (
        <div className="p-3.5 flex flex-col gap-3">
          {/* Barra de Filtro / Búsqueda */}
          {inactivos.totalGeneral > 4 && (
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Filtrar piezas o herrajes inactivos..."
                className="w-full pl-8 pr-3 py-1 rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-[11px] text-slate-800 dark:text-slate-100 placeholder:text-slate-400 outline-none focus:border-cyan-500 shadow-2xs"
              />
            </div>
          )}

          {inactivos.totalGeneral === 0 ? (
            <div className="py-4 text-center text-xs text-slate-400 font-medium">
              ✨ Todas las piezas y herrajes de este mueble están asignados a capas activas o bloques heredados.
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {/* Sección 1: Tableros Inactivos */}
              {tablerosFiltrados.length > 0 && (
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-600 dark:text-slate-300">
                    <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                    <span>Tableros ({tablerosFiltrados.length}):</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {tablerosFiltrados.map((item) => (
                      <div
                        key={item.key}
                        className="group relative flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-[10.5px] font-mono shadow-2xs hover:border-amber-400 transition"
                      >
                        <span className="font-bold">{item.nombre}</span>
                        {item.cantidad > 1 && (
                          <span className="px-1.5 py-0.2 rounded-full text-[9px] bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 font-bold">
                            ×{item.cantidad}
                          </span>
                        )}

                        {/* Botón para mover a capa */}
                        <button
                          type="button"
                          onClick={() => setMenuAsignarItem(menuAsignarItem?.key === item.key ? null : item)}
                          className="w-4 h-4 rounded-full flex items-center justify-center bg-slate-100 hover:bg-amber-500 hover:text-white dark:bg-slate-700 dark:hover:bg-amber-500 text-slate-500 transition cursor-pointer"
                          title="Mover a una capa activa"
                        >
                          <Plus className="w-2.5 h-2.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Sección 2: Herrajes Inactivos */}
              {herrajesFiltrados.length > 0 && (
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-600 dark:text-slate-300">
                    <span className="w-2 h-2 rounded-full bg-cyan-500"></span>
                    <span>Herrajes ({herrajesFiltrados.length}):</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {herrajesFiltrados.map((item) => (
                      <div
                        key={item.key}
                        className="group relative flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-[10.5px] font-mono shadow-2xs hover:border-cyan-400 transition"
                      >
                        <span className="font-bold">{item.nombre}</span>
                        {item.cantidad > 1 && (
                          <span className="px-1.5 py-0.2 rounded-full text-[9px] bg-cyan-100 dark:bg-cyan-950 text-cyan-800 dark:text-cyan-300 font-bold">
                            ×{item.cantidad}
                          </span>
                        )}

                        {/* Botón para mover a capa */}
                        <button
                          type="button"
                          onClick={() => setMenuAsignarItem(menuAsignarItem?.key === item.key ? null : item)}
                          className="w-4 h-4 rounded-full flex items-center justify-center bg-slate-100 hover:bg-cyan-500 hover:text-white dark:bg-slate-700 dark:hover:bg-cyan-500 text-slate-500 transition cursor-pointer"
                          title="Mover a una capa activa"
                        >
                          <Plus className="w-2.5 h-2.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── MODAL / MENÚ DESPLEGABLE DE DESTINO DE CAPA ── */}
          {menuAsignarItem && (
            <div className="p-3 rounded-2xl border border-cyan-300 dark:border-cyan-800 bg-cyan-50/80 dark:bg-cyan-950/40 flex flex-col gap-2 mt-1">
              <div className="flex items-center justify-between text-xs font-bold text-slate-800 dark:text-slate-100">
                <span>Mover <strong>{menuAsignarItem.nombre}</strong> a:</span>
                <button
                  type="button"
                  onClick={() => setMenuAsignarItem(null)}
                  className="text-slate-400 hover:text-slate-600 text-xs px-2 py-0.5 rounded-full cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <div className="flex flex-wrap gap-1.5">
                {capasActivas.map((c: any, idx: number) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => handleMoverACapa(menuAsignarItem, c.id)}
                    className="flex items-center gap-1 px-3 py-1 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-cyan-500 text-slate-700 dark:text-slate-200 text-[10.5px] font-bold transition cursor-pointer shadow-2xs"
                  >
                    <Layers className="w-3 h-3 text-cyan-600" />
                    <span>{c.nombre || `Capa ${idx + 1}`}</span>
                  </button>
                ))}

                <button
                  type="button"
                  onClick={() => handleMoverANuevaCapa(menuAsignarItem)}
                  style={{ backgroundColor: botonActivoColor }}
                  className="flex items-center gap-1 px-3 py-1 rounded-full text-white text-[10.5px] font-bold shadow-xs hover:opacity-90 transition cursor-pointer"
                >
                  <Plus className="w-3 h-3" />
                  <span>+ Nueva Capa</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
