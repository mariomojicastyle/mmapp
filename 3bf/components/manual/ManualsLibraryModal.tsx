"use client";

import React, { useEffect, useState } from "react";
import { use3BFStore, Manual3BMProyecto } from "@/lib/store";
import { X, BookOpen, Folder, Calendar, Trash2, ArrowRight, Plus, Search, CheckCircle2, Globe } from "lucide-react";

export default function ManualsLibraryModal() {
  const {
    modalBibliotecaManualesAbierto,
    setModalBibliotecaManualesAbierto,
    manualesDrive,
    cargarManualesDesdeDrive,
    cargarManualProyecto,
    eliminarManualProyecto,
    manualActivoGuardado,
    coloresApariencia,
  } = use3BFStore();

  const [busqueda, setBusqueda] = useState("");
  const [cargando, setCargando] = useState(false);

  useEffect(() => {
    if (modalBibliotecaManualesAbierto) {
      setCargando(true);
      cargarManualesDesdeDrive().finally(() => setCargando(false));
    }
  }, [modalBibliotecaManualesAbierto, cargarManualesDesdeDrive]);

  if (!modalBibliotecaManualesAbierto) return null;

  const botonActivoColor = coloresApariencia?.botonActivo || "#0891b2";

  const manualesFiltrados = manualesDrive.filter((m) => {
    const q = busqueda.toLowerCase().trim();
    if (!q) return true;
    return (
      (m.nombre || "").toLowerCase().includes(q) ||
      (m.marca || "").toLowerCase().includes(q) ||
      (m.tipologia || "").toLowerCase().includes(q) ||
      (m.id || "").toLowerCase().includes(q)
    );
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/60 backdrop-blur-sm animate-fade-in select-none">
      <div
        style={{
          backgroundColor: coloresApariencia?.fondoPaneles || "#FFFFFF",
          borderColor: coloresApariencia?.bordePaneles || "#CBD5E1",
          color: coloresApariencia?.textoPrincipal || "#0F172A",
        }}
        className="w-full max-w-2xl rounded-2xl border shadow-2xl flex flex-col overflow-hidden max-h-[85vh] animate-scale-up"
      >
        {/* Header del Modal */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div
              style={{ backgroundColor: botonActivoColor }}
              className="w-8 h-8 rounded-full flex items-center justify-center text-white shadow-sm shrink-0"
            >
              <BookOpen className="w-4 h-4" />
            </div>
            <div className="flex flex-col min-w-0">
              <h2 className="font-bold text-sm tracking-tight truncate">Biblioteca de Manuales 3D (.3bm)</h2>
              <span className="text-[11px] opacity-60 truncate">
                Proyectos guardados en Google Drive (G:\Mi unidad\Manuales)
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setModalBibliotecaManualesAbierto(false)}
            className="w-7 h-7 rounded-full flex items-center justify-center border border-slate-300 dark:border-slate-700 hover:bg-black/5 dark:hover:bg-white/5 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Barra de Búsqueda */}
        <div className="p-3 border-b border-slate-200 dark:border-slate-800 bg-slate-500/5 flex items-center gap-2 shrink-0">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 opacity-50 pointer-events-none" />
            <input
              type="text"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar manual por nombre, marca o tipología..."
              className="w-full pl-8 pr-3 py-1.5 rounded-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs outline-none focus:border-cyan-500 transition"
            />
          </div>

          <span className="text-[11px] font-mono opacity-60 shrink-0">
            {manualesFiltrados.length} {manualesFiltrados.length === 1 ? "manual" : "manuales"}
          </span>
        </div>

        {/* Lista de Manuales */}
        <div className="flex-1 p-3 overflow-y-auto flex flex-col gap-2.5 custom-scrollbar">
          {cargando ? (
            <div className="p-12 text-center text-xs opacity-60">Escaneando Google Drive...</div>
          ) : manualesFiltrados.length === 0 ? (
            <div className="p-12 text-center flex flex-col items-center gap-2 text-xs opacity-75">
              <Folder className="w-8 h-8 opacity-40" />
              <p className="font-semibold">No se encontraron proyectos de manuales (.3bm.json).</p>
              <p className="text-[11px] opacity-60 max-w-sm">
                Diseña un mueble o haz clic en "Guardar Manual" en el Manual Studio para crear el primero.
              </p>
            </div>
          ) : (
            manualesFiltrados.map((manual) => {
              const esActivo = manualActivoGuardado?.id === manual.id;
              const pasosCount = manual.pasos?.length || 0;
              const tieneEs = manual.pasos?.some((p) => p.audioUrlEs);
              const tienePt = manual.pasos?.some((p) => p.audioUrlPt);
              const tieneEn = manual.pasos?.some((p) => p.audioUrlEn);

              return (
                <div
                  key={manual.id}
                  style={esActivo ? { borderColor: botonActivoColor } : {}}
                  className={`p-3 rounded-xl border transition flex items-center justify-between gap-3 bg-black/[0.01] dark:bg-white/[0.01] hover:border-cyan-500/50 ${
                    esActivo
                      ? "border-2 shadow-sm bg-cyan-500/5"
                      : "border-slate-200 dark:border-slate-800"
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-xs shrink-0 text-cyan-600">
                      .3bm
                    </div>

                    <div className="flex flex-col min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs truncate">{manual.nombre}</span>
                        {esActivo && (
                          <span
                            style={{ backgroundColor: botonActivoColor }}
                            className="text-white text-[9px] font-bold px-2 py-0.2 rounded-full uppercase"
                          >
                            Abierto
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 text-[10px] opacity-60 pt-0.5">
                        <span className="font-semibold text-cyan-700 dark:text-cyan-300">
                          {manual.marca} / {manual.tipologia}
                        </span>
                        <span>•</span>
                        <span>{pasosCount} {pasosCount === 1 ? "paso" : "pasos"}</span>
                        <span>•</span>
                        <div className="flex items-center gap-1 font-bold text-[9px]">
                          <span className={tieneEs ? "text-emerald-500" : "opacity-40"}>ES</span>
                          <span className={tienePt ? "text-emerald-500" : "opacity-40"}>PT</span>
                          <span className={tieneEn ? "text-emerald-500" : "opacity-40"}>EN</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => eliminarManualProyecto(manual.id)}
                      title="Eliminar este proyecto de manual (.3bm.json)"
                      className="p-1.5 rounded-full text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => cargarManualProyecto(manual)}
                      style={{ backgroundColor: botonActivoColor }}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-white font-bold text-[11px] shadow-sm hover:opacity-90 active:scale-95 transition"
                    >
                      <span>Abrir</span> <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer del Modal */}
        <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-slate-500/5 flex items-center justify-between text-[11px] opacity-75 shrink-0">
          <span>Formato: <strong>.3bm.json</strong> (3dBimManual Autónomo)</span>
          <button
            type="button"
            onClick={() => setModalBibliotecaManualesAbierto(false)}
            className="px-3 py-1 rounded-full border border-slate-300 dark:border-slate-700 hover:bg-black/5 dark:hover:bg-white/5 transition font-semibold"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
