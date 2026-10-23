"use client";

import React from "react";
import { use3BFStore } from "@/lib/store";
import { Eye, Layers, Component, ArrowDownToLine, Cpu, Check } from "lucide-react";
import {
  ModoPasoOficial,
  MODOS_PASO_DEFINITIVOS,
  normalizarTipoModo,
} from "@/lib/engine/modos/modosTypes";

interface ModoPasoSelectorProps {
  pasoId: string;
  tipoActual?: string;
  versionMotor?: string;
}

export default function ModoPasoSelector({
  pasoId,
  tipoActual,
  versionMotor = "v1.0",
}: ModoPasoSelectorProps) {
  const { coloresApariencia, cambiarModoPasoManual } = use3BFStore();

  const modoActivo: ModoPasoOficial = normalizarTipoModo(tipoActual);
  const colorBotonActivo = coloresApariencia?.botonActivo || "#0891B2";

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

  return (
    <div
      style={{
        backgroundColor: coloresApariencia?.fondoPaneles || "#FFFFFF",
        borderColor: coloresApariencia?.bordePaneles || "#E2E8F0",
      }}
      className="p-2.5 rounded-2xl border shadow-xs flex flex-col gap-2"
    >
      {/* Cabecera con Badge de Versión de Motor */}
      <div className="flex items-center justify-between px-1">
        <span
          style={{ color: coloresApariencia?.textoSecundario || "#64748B" }}
          className="text-[10px] font-bold uppercase tracking-wider"
        >
          Modo de Armado
        </span>

        {/* Badge Cápsula Versión Motor */}
        <div
          title="Versión del motor cinemático que ejecuta este paso"
          style={{
            backgroundColor: `${colorBotonActivo}15`,
            borderColor: `${colorBotonActivo}40`,
            color: colorBotonActivo,
          }}
          className="flex items-center gap-1 px-2.5 py-0.5 rounded-full border text-[10px] font-semibold tracking-tight select-none"
        >
          <Cpu className="w-3 h-3 shrink-0" />
          <span>Motor {versionMotor}</span>
        </div>
      </div>

      {/* Grid de los 4 Modos en Cápsulas Puras (rounded-full) */}
      <div className="grid grid-cols-2 gap-1.5">
        {listaModos.map((modoKey) => {
          const meta = MODOS_PASO_DEFINITIVOS[modoKey];
          const esSeleccionado = modoActivo === modoKey;

          return (
            <button
              key={modoKey}
              type="button"
              onClick={() => cambiarModoPasoManual(pasoId, modoKey, meta.versionActual)}
              style={
                esSeleccionado
                  ? {
                      backgroundColor: colorBotonActivo,
                      borderColor: colorBotonActivo,
                      color: "#FFFFFF",
                    }
                  : {
                      backgroundColor: coloresApariencia?.botonInactivo || "#F1F5F9",
                      borderColor: coloresApariencia?.bordeBotonInactivo || "#CBD5E1",
                      color: coloresApariencia?.textoPrincipal || "#0F172A",
                    }
              }
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-left text-[11px] font-semibold transition-all cursor-pointer border shadow-2xs select-none active:scale-98 ${
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
  );
}
