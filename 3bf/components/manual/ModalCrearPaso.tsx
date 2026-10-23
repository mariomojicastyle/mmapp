"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { use3BFStore, encontrarSiguienteIdPasoDisponible } from "@/lib/store";
import { Plus, X, Eye, Layers, Component, ArrowDownToLine, Check } from "lucide-react";
import {
  ModoPasoOficial,
  MODOS_PASO_DEFINITIVOS,
  mapearModoATipoHistorico,
} from "@/lib/engine/modos/modosTypes";

interface ModalCrearPasoProps {
  abierto: boolean;
  onCerrar: () => void;
  tipoInicialSugerido?: ModoPasoOficial;
}

export default function ModalCrearPaso({
  abierto,
  onCerrar,
  tipoInicialSugerido = "armado_capas",
}: ModalCrearPasoProps) {
  const { pasosManual, crearPasoManual, coloresApariencia } = use3BFStore();
  const [modoSeleccionado, setModoSeleccionado] = useState<ModoPasoOficial>(tipoInicialSugerido);
  const [titulo, setTitulo] = useState("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (abierto) {
      setModoSeleccionado(tipoInicialSugerido);
      setTitulo("");
    }
  }, [abierto, tipoInicialSugerido]);

  if (!abierto || !mounted) return null;

  const botonActivoColor = coloresApariencia?.botonActivo || "#0891b2";
  const tipoHistorico = mapearModoATipoHistorico(modoSeleccionado);
  const proximoPasoInfo = encontrarSiguienteIdPasoDisponible(pasosManual || [], tipoHistorico);

  const tituloPorDefecto =
    modoSeleccionado === "presentacion"
      ? `${proximoPasoInfo.id}: Presentación Funcional`
      : modoSeleccionado === "incorporaciones"
      ? `${proximoPasoInfo.id}: Incorporaciones`
      : modoSeleccionado === "bloque_estandar"
      ? `${proximoPasoInfo.id}: Bloque Estándar`
      : `Paso ${proximoPasoInfo.id}: Armado por Capas`;

  const handleCrear = () => {
    crearPasoManual(tipoHistorico, {
      tituloPersonalizado: titulo.trim() || tituloPorDefecto,
      idSugerido: proximoPasoInfo.id,
      numero: proximoPasoInfo.numero,
    });
    onCerrar();
  };

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

  const listaModos: ModoPasoOficial[] = [
    "presentacion",
    "armado_capas",
    "bloque_estandar",
    "incorporaciones",
  ];

  const modalContent = (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150 select-none">
      <div 
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: coloresApariencia?.fondoPaneles || "#FFFFFF",
          borderColor: coloresApariencia?.bordePaneles || "#E2E8F0",
        }}
        className="w-full max-w-md rounded-3xl border p-5 shadow-2xl flex flex-col gap-4 text-xs dark:bg-slate-900"
      >
        {/* Cabecera */}
        <div className="flex items-center justify-between border-b pb-3 border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <span
              style={{ backgroundColor: botonActivoColor }}
              className="px-2.5 py-0.5 rounded-full text-white text-[11px] font-black tracking-wider shadow-xs"
            >
              {proximoPasoInfo.id}
            </span>
            <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm">
              Crear Paso en Manual 3D
            </h3>
          </div>
          <button
            type="button"
            onClick={onCerrar}
            className="w-7 h-7 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 1. Selector de los 4 Modos Oficiales de Armado */}
        <div className="flex flex-col gap-2">
          <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Seleccionar Modo de Armado:
          </label>
          <div className="grid grid-cols-2 gap-2">
            {listaModos.map((modoKey) => {
              const meta = MODOS_PASO_DEFINITIVOS[modoKey];
              const esSeleccionado = modoSeleccionado === modoKey;

              return (
                <button
                  key={modoKey}
                  type="button"
                  onClick={() => setModoSeleccionado(modoKey)}
                  style={
                    esSeleccionado
                      ? {
                          backgroundColor: botonActivoColor,
                          borderColor: botonActivoColor,
                          color: "#FFFFFF",
                        }
                      : {
                          backgroundColor: coloresApariencia?.botonInactivo || "#F1F5F9",
                          borderColor: coloresApariencia?.bordeBotonInactivo || "#CBD5E1",
                          color: coloresApariencia?.textoPrincipal || "#0F172A",
                        }
                  }
                  className={`flex items-center gap-2 px-3 py-2 rounded-full text-left text-[11px] font-semibold transition-all cursor-pointer border shadow-2xs select-none active:scale-98 ${
                    esSeleccionado
                      ? "shadow-sm text-white"
                      : "hover:opacity-90 dark:bg-slate-800 dark:border-slate-700"
                  }`}
                >
                  {renderIcono(modoKey, `w-3.5 h-3.5 shrink-0 ${esSeleccionado ? "text-white" : "opacity-70"}`)}

                  <div className="flex-1 min-w-0 leading-tight">
                    <p className="truncate font-bold">{meta.nombreVisible}</p>
                    <p
                      style={{ color: esSeleccionado ? "#E0F2FE" : coloresApariencia?.textoSecundario || "#64748B" }}
                      className="text-[9px] truncate opacity-90"
                    >
                      ({meta.subtitulo})
                    </p>
                  </div>

                  {esSeleccionado && <Check className="w-3.5 h-3.5 shrink-0 text-white ml-auto" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* 2. Campo para Bautizar el Paso */}
        <div className="flex flex-col gap-1.5 pt-1">
          <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Bautizar el Paso (Opcional):
          </label>
          <input
            type="text"
            autoFocus
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleCrear();
              if (e.key === "Escape") onCerrar();
            }}
            placeholder={tituloPorDefecto}
            className="w-full px-4 py-2 rounded-full border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-xs outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 shadow-2xs transition"
          />
          <p className="text-[10px] text-slate-400 dark:text-slate-500 italic px-1">
            Si lo dejas en blanco, se llamará: <strong>{tituloPorDefecto}</strong>
          </p>
        </div>

        {/* Botonera de Acción */}
        <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={onCerrar}
            className="px-4 py-1.5 rounded-full text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 font-bold text-xs transition cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleCrear}
            style={{ backgroundColor: botonActivoColor }}
            className="flex items-center gap-1.5 px-5 py-1.5 rounded-full text-white font-bold text-xs shadow-md hover:opacity-90 active:scale-95 transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Crear Paso</span>
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
