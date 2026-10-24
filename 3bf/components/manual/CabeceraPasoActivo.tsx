"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Eye, Layers, Component, ArrowDownToLine, Cpu, Trash2, X, AlertTriangle } from "lucide-react";
import {
  ModoPasoOficial,
  MODOS_PASO_DEFINITIVOS,
  normalizarTipoModo,
} from "@/lib/engine/modos/modosTypes";
import { PasoManualStudio } from "@/lib/storeTypes";

interface CabeceraPasoActivoProps {
  pasoActivo: PasoManualStudio;
  cantidadPasos: number;
  botonActivoColor?: string;
  coloresApariencia?: {
    fondoPaneles?: string;
    bordePaneles?: string;
    textoPrincipal?: string;
    textoSecundario?: string;
    botonActivo?: string;
    botonInactivo?: string;
    bordeBotonInactivo?: string;
  };
  onActualizarTitulo: (nuevoTitulo: string) => void;
  onEliminarPaso: () => void;
}

export default function CabeceraPasoActivo({
  pasoActivo,
  cantidadPasos,
  botonActivoColor = "#0891B2",
  coloresApariencia,
  onActualizarTitulo,
  onEliminarPaso,
}: CabeceraPasoActivoProps) {
  const [modalEliminarAbierto, setModalEliminarAbierto] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const modoKey: ModoPasoOficial = normalizarTipoModo(pasoActivo.tipo);
  const meta = MODOS_PASO_DEFINITIVOS[modoKey];

  const renderIcono = (id: ModoPasoOficial, className: string) => {
    switch (id) {
      case "presentacion":
        return <Eye className={className} />;
      case "armado_capas":
        return <Layers className={className} />;
      case "bloque_estandar":
        return <Component className={className} />;
      case "incorporaciones":
        return <ArrowDownToLine className={className} />;
      default:
        return <Layers className={className} />;
    }
  };

  return (
    <>
      <div
        style={{
          backgroundColor: coloresApariencia?.fondoPaneles || "#FFFFFF",
          borderColor: coloresApariencia?.bordePaneles || "#E2E8F0",
        }}
        className="p-2.5 rounded-2xl border shadow-xs flex flex-wrap items-center justify-between gap-2.5 select-none"
      >
        {/* Izquierda: Badge de ID + Input de Título Editable */}
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <span
            style={{ backgroundColor: botonActivoColor }}
            className="px-2.5 py-0.5 rounded-full text-white text-[11px] font-black shrink-0 shadow-2xs select-none"
          >
            {pasoActivo.id}
          </span>
          <input
            type="text"
            value={pasoActivo.titulo || ""}
            onChange={(e) => onActualizarTitulo(e.target.value)}
            placeholder={`Paso ${pasoActivo.id}`}
            className="font-bold text-xs bg-transparent border-b border-transparent hover:border-slate-300 dark:hover:border-slate-700 focus:border-cyan-500 outline-none truncate transition py-0.5 text-slate-800 dark:text-slate-100 flex-1 min-w-[120px]"
            title="Haz clic para editar el nombre del paso"
          />
        </div>

        {/* Centro: Badge Informativo Fijo del Modo (Solo Lectura, Sin Botonera Confusa) */}
        <div className="flex items-center gap-1.5 shrink-0">
          <div
            title={`Modo actual: ${meta.nombreVisible} (${meta.subtitulo})`}
            className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[10px] font-bold text-slate-700 dark:text-slate-300"
          >
            {renderIcono(modoKey, "w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400 shrink-0")}
            <span>{meta.nombreVisible}</span>
          </div>

          <div
            title="Versión del motor cinemático que ejecuta este paso"
            style={{
              backgroundColor: `${botonActivoColor}15`,
              borderColor: `${botonActivoColor}35`,
              color: botonActivoColor,
            }}
            className="flex items-center gap-1 px-2.5 py-1 rounded-full border text-[10px] font-semibold tracking-tight"
          >
            <Cpu className="w-3 h-3 shrink-0" />
            <span>Motor {pasoActivo.versionMotor || meta.versionActual || "v1.0"}</span>
          </div>
        </div>

        {/* Derecha: Botón Eliminar Paso Siempre Visible */}
        <div className="shrink-0">
          <button
            type="button"
            onClick={() => setModalEliminarAbierto(true)}
            title="Eliminar este paso del manual de armado"
            className="flex items-center gap-1.5 px-3 py-1 rounded-full border border-rose-300 dark:border-rose-900/60 text-rose-600 dark:text-rose-400 hover:bg-rose-500 hover:text-white hover:border-rose-500 transition-all font-bold text-[11px] cursor-pointer shadow-2xs active:scale-95"
          >
            <Trash2 className="w-3.5 h-3.5 shrink-0" />
            <span>Eliminar Paso</span>
          </button>
        </div>
      </div>

      {/* 🛡️ Modal de Confirmación Flotante con React Portal (z-[9999]) */}
      {modalEliminarAbierto && mounted && createPortal(
        <div
          className="fixed inset-0 z-[9999] bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
          onClick={() => setModalEliminarAbierto(false)}
        >
          <div
            className="bg-white dark:bg-[#131B2E] border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-5 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Cabecera y Alerta */}
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-sm font-black text-slate-900 dark:text-white">
                  ¿Eliminar el Paso {pasoActivo.id}?
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                  Esta acción eliminará el paso{" "}
                  <strong className="text-slate-700 dark:text-slate-200">
                    &quot;{pasoActivo.titulo || pasoActivo.id}&quot;
                  </strong>{" "}
                  y todas sus configuraciones cinemáticas asociadas. Esta acción no se puede deshacer.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setModalEliminarAbierto(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Cuadro Informativo de Seguridad */}
            <div className="bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/50 rounded-xl p-3 text-[11px] text-rose-700 dark:text-rose-300 space-y-1">
              <div className="flex items-center gap-1.5 font-bold">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                <span>Aviso de Seguridad</span>
              </div>
              <p>Las piezas y herrajes asignados a este paso volverán a estar disponibles para otros pasos del manual.</p>
            </div>

            {/* Botones de Acción en Cápsulas Puras (rounded-full) */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setModalEliminarAbierto(false)}
                className="px-4 py-1.5 rounded-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition font-bold text-xs cursor-pointer select-none"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  setModalEliminarAbierto(false);
                  onEliminarPaso();
                }}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-rose-600 hover:bg-rose-700 text-white transition font-bold text-xs cursor-pointer shadow-sm active:scale-95 select-none"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Sí, Eliminar Paso</span>
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
